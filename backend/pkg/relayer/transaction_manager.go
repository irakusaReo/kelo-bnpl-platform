package relayer

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"sync"
	"time"

	"kelo-backend/pkg/blockchain"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/rs/zerolog/log"
)

// TransactionManager handles secure transaction submission to liquidity chains
type TransactionManager struct {
	blockchain      *blockchain.Clients
	privateKey      *ecdsa.PrivateKey
	publicAddress   common.Address
	
	// Transaction nonce management
	nonces          map[string]uint64
	nonceMutex      sync.RWMutex
	
	// Gas price oracle
	gasPriceOracle  *GasPriceOracle
	
	// Transaction monitoring
	pendingTxs      map[string]*PendingTransaction
	txMutex         sync.RWMutex
	
	// Security
	maxGasPrice     *big.Int
	maxGasLimit     uint64
	
	// Context
	ctx            context.Context
}

// PendingTransaction represents a transaction that is waiting for confirmation
type PendingTransaction struct {
	ChainID       string          `json:"chain_id"`
	TxHash        common.Hash     `json:"tx_hash"`
	Message       *Message        `json:"message"`
	SubmittedAt   time.Time       `json:"submitted_at"`
	Confirmations uint64          `json:"confirmations"`
	RequiredConfs uint64          `json:"required_confirmations"`
	Status        TxStatus        `json:"status"`
	RetryCount    int             `json:"retry_count"`
}

// TxStatus represents the status of a transaction
type TxStatus int

const (
	TxStatusPending TxStatus = iota
	TxStatusConfirmed
	TxStatusFailed
	TxStatusReplaced
)

// GasPriceOracle provides gas price estimates for different chains
type GasPriceOracle struct {
	blockchain *blockchain.Clients
	cache      map[string]*GasPriceCache
	cacheMutex sync.RWMutex
}

// GasPriceCache stores cached gas prices
type GasPriceCache struct {
	GasPrice    *big.Int
	LastUpdated time.Time
	TTL         time.Duration
}

// NewTransactionManager creates a new transaction manager
func NewTransactionManager(bc *blockchain.Clients, privateKey *ecdsa.PrivateKey, ctx context.Context) *TransactionManager {
	publicAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
	
	return &TransactionManager{
		blockchain:     bc,
		privateKey:     privateKey,
		publicAddress:  publicAddress,
		nonces:         make(map[string]uint64),
		pendingTxs:     make(map[string]*PendingTransaction),
		gasPriceOracle: NewGasPriceOracle(bc),
		maxGasPrice:    big.NewInt(500000000000), // 500 Gwei
		maxGasLimit:    2000000, // 2M gas
		ctx:           ctx,
	}
}

// NewGasPriceOracle creates a new gas price oracle
func NewGasPriceOracle(bc *blockchain.Clients) *GasPriceOracle {
	return &GasPriceOracle{
		blockchain: bc,
		cache:      make(map[string]*GasPriceCache),
	}
}

// SubmitTransaction submits a transaction to the specified chain
func (tm *TransactionManager) SubmitTransaction(ctx context.Context, chainID string, message *Message) (*types.Transaction, error) {
	log.Info().
		Str("chain_id", chainID).
		Str("message_type", message.Type.String()).
		Msg("Submitting transaction")
	
	// Get chain client
	client, err := tm.getChainClient(chainID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chain client: %w", err)
	}
	
	// Get current nonce
	nonce, err := tm.getCurrentNonce(ctx, chainID)
	if err != nil {
		return nil, fmt.Errorf("failed to get current nonce: %w", err)
	}
	
	// Get gas price
	gasPrice, err := tm.gasPriceOracle.GetGasPrice(ctx, chainID)
	if err != nil {
		return nil, fmt.Errorf("failed to get gas price: %w", err)
	}
	
	// Check gas price against maximum
	if gasPrice.Cmp(tm.maxGasPrice) > 0 {
		return nil, fmt.Errorf("gas price %s exceeds maximum %s", gasPrice.String(), tm.maxGasPrice.String())
	}
	
	// Estimate gas limit
	gasLimit, err := tm.estimateGasLimit(ctx, chainID, message)
	if err != nil {
		return nil, fmt.Errorf("failed to estimate gas limit: %w", err)
	}
	
	// Check gas limit against maximum
	if gasLimit > tm.maxGasLimit {
		return nil, fmt.Errorf("gas limit %d exceeds maximum %d", gasLimit, tm.maxGasLimit)
	}
	
	// Create transaction
	tx, err := tm.createTransaction(ctx, chainID, message, nonce, gasPrice, gasLimit)
	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}
	
	// Sign transaction
	signedTx, err := tm.signTransaction(tx)
	if err != nil {
		return nil, fmt.Errorf("failed to sign transaction: %w", err)
	}
	
	// Submit transaction
	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		return nil, fmt.Errorf("failed to submit transaction: %w", err)
	}
	
	// Update nonce
	tm.incrementNonce(chainID)
	
	// Monitor transaction
	go tm.monitorTransaction(chainID, signedTx.Hash(), message)
	
	log.Info().
		Str("chain_id", chainID).
		Str("tx_hash", signedTx.Hash().Hex()).
		Str("nonce", fmt.Sprintf("%d", nonce)).
		Str("gas_price", gasPrice.String()).
		Str("gas_limit", fmt.Sprintf("%d", gasLimit)).
		Msg("Transaction submitted successfully")
	
	return signedTx, nil
}

// getChainClient gets the client for the specified chain
func (tm *TransactionManager) getChainClient(chainID string) (*ethclient.Client, error) {
	switch chainID {
	case "ethereum":
		return tm.blockchain.GetEthereumClient(), nil
	case "base":
		return tm.blockchain.GetBaseClient(), nil
	default:
		return nil, fmt.Errorf("unsupported chain ID: %s", chainID)
	}
}

// getCurrentNonce gets the current nonce for the specified chain
func (tm *TransactionManager) getCurrentNonce(ctx context.Context, chainID string) (uint64, error) {
	tm.nonceMutex.RLock()
	nonce, exists := tm.nonces[chainID]
	tm.nonceMutex.RUnlock()
	
	if exists {
		return nonce, nil
	}
	
	// Get nonce from blockchain
	client, err := tm.getChainClient(chainID)
	if err != nil {
		return 0, err
	}
	
	nonce, err = client.PendingNonceAt(ctx, tm.publicAddress)
	if err != nil {
		return 0, err
	}
	
	// Cache nonce
	tm.nonceMutex.Lock()
	tm.nonces[chainID] = nonce
	tm.nonceMutex.Unlock()
	
	return nonce, nil
}

// incrementNonce increments the nonce for the specified chain
func (tm *TransactionManager) incrementNonce(chainID string) {
	tm.nonceMutex.Lock()
	defer tm.nonceMutex.Unlock()
	
	tm.nonces[chainID]++
}

// estimateGasLimit estimates the gas limit for a transaction
func (tm *TransactionManager) estimateGasLimit(ctx context.Context, chainID string, message *Message) (uint64, error) {
	// This is a placeholder implementation
	// In a real implementation, you would estimate gas based on the message type and chain
	
	switch message.Type {
	case MessageTypeLoanApproval:
		return 200000, nil
	case MessageTypeLoanDisbursement:
		return 150000, nil
	case MessageTypeRepaymentConfirmation:
		return 100000, nil
	case MessageTypeLiquidityTransfer:
		return 180000, nil
	case MessageTypeCreditScoreUpdate:
		return 120000, nil
	default:
		return 200000, nil // Default gas limit
	}
}

// createTransaction creates a transaction for the specified message
func (tm *TransactionManager) createTransaction(ctx context.Context, chainID string, message *Message, nonce uint64, gasPrice *big.Int, gasLimit uint64) (*types.Transaction, error) {
	// Get contract address for the chain
	contractAddr, err := tm.getContractAddress(chainID)
	if err != nil {
		return nil, err
	}
	
	// Create transaction data
	data, err := tm.createTransactionData(message)
	if err != nil {
		return nil, err
	}
	
	// Create transaction
	tx := &types.DynamicFeeTx{
		ChainID:   tm.getChainID(chainID),
		Nonce:     nonce,
		GasTipCap: gasPrice,
		GasFeeCap: new(big.Int).Mul(gasPrice, big.NewInt(2)), // 2x gas price for fee cap
		Gas:       gasLimit,
		To:        &contractAddr,
		Value:     big.NewInt(0), // No ETH value
		Data:      data,
	}
	
	return types.NewTx(tx), nil
}

// getChainID returns the chain ID for the specified chain
func (tm *TransactionManager) getChainID(chainID string) *big.Int {
	switch chainID {
	case "ethereum":
		return big.NewInt(1)
	case "base":
		return big.NewInt(8453)
	default:
		return big.NewInt(1) // Default to Ethereum
	}
}

// getContractAddress returns the contract address for the specified chain
func (tm *TransactionManager) getContractAddress(chainID string) (common.Address, error) {
	// This would be configured based on your deployment
	// For now, return a placeholder address
	switch chainID {
	case "ethereum":
		return common.HexToAddress("0x1234567890123456789012345678901234567890"), nil
	case "base":
		return common.HexToAddress("0x0987654321098765432109876543210987654321"), nil
	default:
		return common.Address{}, fmt.Errorf("unsupported chain ID: %s", chainID)
	}
}

// createTransactionData creates the transaction data for the specified message
func (tm *TransactionManager) createTransactionData(message *Message) ([]byte, error) {
	// This is a placeholder implementation
	// In a real implementation, you would encode the transaction data using the contract ABI
	
	// For now, return the message payload as transaction data
	return message.Payload, nil
}

// signTransaction signs a transaction
func (tm *TransactionManager) signTransaction(tx *types.Transaction) (*types.Transaction, error) {
	// Sign the transaction
	signer := types.NewLondonSigner(tx.ChainId())
	signedTx, err := types.SignTx(tx, signer, tm.privateKey)
	if err != nil {
		return nil, err
	}
	
	return signedTx, nil
}

// monitorTransaction monitors a transaction for confirmation
func (tm *TransactionManager) monitorTransaction(chainID string, txHash common.Hash, message *Message) {
	// Create pending transaction
	pendingTx := &PendingTransaction{
		ChainID:       chainID,
		TxHash:        txHash,
		Message:       message,
		SubmittedAt:   time.Now(),
		Confirmations: 0,
		RequiredConfs: tm.getRequiredConfirmations(chainID),
		Status:        TxStatusPending,
		RetryCount:    0,
	}
	
	// Store pending transaction
	tm.txMutex.Lock()
	tm.pendingTxs[txHash.Hex()] = pendingTx
	tm.txMutex.Unlock()
	
	// Start monitoring
	go tm.waitForConfirmation(chainID, txHash, pendingTx)
}

// getRequiredConfirmations returns the required confirmations for the specified chain
func (tm *TransactionManager) getRequiredConfirmations(chainID string) uint64 {
	switch chainID {
	case "ethereum":
		return 12
	case "base":
		return 5
	default:
		return 1
	}
}

// waitForConfirmation waits for a transaction to be confirmed
func (tm *TransactionManager) waitForConfirmation(chainID string, txHash common.Hash, pendingTx *PendingTransaction) {
	client, err := tm.getChainClient(chainID)
	if err != nil {
		log.Error().Err(err).Str("chain_id", chainID).Msg("Failed to get chain client for confirmation")
		return
	}
	
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-tm.ctx.Done():
			return
		case <-ticker.C:
			// Get transaction receipt
			receipt, err := client.TransactionReceipt(tm.ctx, txHash)
			if err != nil {
				if err == ethereum.NotFound {
					// Transaction not yet mined
					continue
				}
				log.Error().Err(err).Str("tx_hash", txHash.Hex()).Msg("Failed to get transaction receipt")
				continue
			}
			
			// Update transaction status
			tm.txMutex.Lock()
			pendingTx.Confirmations++
			
			if receipt.Status == 1 {
				pendingTx.Status = TxStatusConfirmed
				log.Info().
					Str("chain_id", chainID).
					Str("tx_hash", txHash.Hex()).
					Uint64("confirmations", pendingTx.Confirmations).
					Msg("Transaction confirmed")
			} else {
				pendingTx.Status = TxStatusFailed
				log.Error().
					Str("chain_id", chainID).
					Str("tx_hash", txHash.Hex()).
					Msg("Transaction failed")
			}
			
			// Remove from pending transactions if confirmed or failed
			if pendingTx.Status == TxStatusConfirmed || pendingTx.Status == TxStatusFailed {
				delete(tm.pendingTxs, txHash.Hex())
			}
			tm.txMutex.Unlock()
			
			return
		}
	}
}

// GetGasPrice gets the current gas price for the specified chain
func (gpo *GasPriceOracle) GetGasPrice(ctx context.Context, chainID string) (*big.Int, error) {
	gpo.cacheMutex.RLock()
	cache, exists := gpo.cache[chainID]
	gpo.cacheMutex.RUnlock()
	
	// Check if cached gas price is still valid
	if exists && time.Since(cache.LastUpdated) < cache.TTL {
		return cache.GasPrice, nil
	}
	
	// Get fresh gas price
	gasPrice, err := gpo.fetchGasPrice(ctx, chainID)
	if err != nil {
		if exists {
			// Return cached gas price if fetch fails
			return cache.GasPrice, nil
		}
		return nil, err
	}
	
	// Cache the gas price
	gpo.cacheMutex.Lock()
	gpo.cache[chainID] = &GasPriceCache{
		GasPrice:    gasPrice,
		LastUpdated: time.Now(),
		TTL:         5 * time.Minute, // Cache for 5 minutes
	}
	gpo.cacheMutex.Unlock()
	
	return gasPrice, nil
}

// fetchGasPrice fetches the current gas price from the blockchain
func (gpo *GasPriceOracle) fetchGasPrice(ctx context.Context, chainID string) (*big.Int, error) {
	var client *ethclient.Client
	
	switch chainID {
	case "ethereum":
		client = gpo.blockchain.GetEthereumClient()
	case "base":
		client = gpo.blockchain.GetBaseClient()
	default:
		return nil, fmt.Errorf("unsupported chain ID: %s", chainID)
	}
	
	if client == nil {
		return nil, fmt.Errorf("client not available for chain ID: %s", chainID)
	}
	
	return client.SuggestGasPrice(ctx)
}

// GetPendingTransactions returns all pending transactions
func (tm *TransactionManager) GetPendingTransactions() map[string]*PendingTransaction {
	tm.txMutex.RLock()
	defer tm.txMutex.RUnlock()
	
	// Return a copy of the pending transactions
	pendingTxs := make(map[string]*PendingTransaction)
	for k, v := range tm.pendingTxs {
		pendingTxs[k] = v
	}
	
	return pendingTxs
}

// GetTransactionStatus returns the status of a specific transaction
func (tm *TransactionManager) GetTransactionStatus(txHash string) (*PendingTransaction, error) {
	tm.txMutex.RLock()
	defer tm.txMutex.RUnlock()
	
	pendingTx, exists := tm.pendingTxs[txHash]
	if !exists {
		return nil, fmt.Errorf("transaction not found: %s", txHash)
	}
	
	return pendingTx, nil
}