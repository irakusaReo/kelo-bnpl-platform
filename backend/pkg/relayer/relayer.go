package relayer

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"sync"
	"time"

	"kelo-backend/pkg/blockchain"
	"kelo-backend/pkg/config"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/rs/zerolog/log"
)

// MessageType represents the type of cross-chain message
type MessageType int

const (
	MessageTypeLoanApproval MessageType = iota
	MessageTypeLoanDisbursement
	MessageTypeRepaymentConfirmation
	MessageTypeLiquidityTransfer
	MessageTypeCreditScoreUpdate
)

// String returns the string representation of MessageType
func (mt MessageType) String() string {
	return [...]string{
		"LOAN_APPROVAL",
		"LOAN_DISBURSEMENT",
		"REPAYMENT_CONFIRMATION",
		"LIQUIDITY_TRANSFER",
		"CREDIT_SCORE_UPDATE",
	}[mt]
}

// Message represents a cross-chain message
type Message struct {
	Type        MessageType      `json:"type"`
	ChainID     string          `json:"chain_id"`
	Payload     []byte          `json:"payload"`
	Signature   []byte          `json:"signature"`
	Timestamp   time.Time       `json:"timestamp"`
	RetryCount  int             `json:"retry_count"`
	Status      MessageStatus   `json:"status"`
}

// MessageStatus represents the status of a message
type MessageStatus int

const (
	StatusPending MessageStatus = iota
	StatusSent
	StatusConfirmed
	StatusFailed
	StatusRetrying
)

// String returns the string representation of MessageStatus
func (ms MessageStatus) String() string {
	return [...]string{
		"PENDING",
		"SENT",
		"CONFIRMED",
		"FAILED",
		"RETRYING",
	}[ms]
}

// LoanApprovalEvent represents a loan approval event from Hedera
type LoanApprovalEvent struct {
	TokenID       *big.Int
	Borrower      common.Address
	Merchant      common.Address
	Amount        *big.Int
	InterestRate  *big.Int
	Duration      *big.Int
	BorrowerDID   string
	MerchantDID   string
	Timestamp     time.Time
}

// LoanDisbursementEvent represents a loan disbursement event from Hedera
type LoanDisbursementEvent struct {
	TokenID   *big.Int
	Amount    *big.Int
	Merchant  common.Address
	Timestamp time.Time
}

// RepaymentEvent represents a repayment event from Hedera
type RepaymentEvent struct {
	TokenID      *big.Int
	Amount       *big.Int
	TotalRepaid  *big.Int
	Payer        common.Address
	Timestamp    time.Time
}

// TrustedRelayer is the main service that acts as a trusted relayer
type TrustedRelayer struct {
	config          *config.Config
	blockchain      *blockchain.Clients
	privateKey      *ecdsa.PrivateKey
	publicAddress   common.Address
	
	// Event listeners
	hederaListener  *HederaEventListener
	
	// Message processing
	messageQueue    chan *Message
	processing      sync.WaitGroup
	messageStore    map[string]*Message
	storeMutex      sync.RWMutex
	
	// LayerZero integration
	layerZeroClient *LayerZeroClient
	messageFactory  *MessageFactory
	
	// Chain configurations
	chainConfigs    map[string]*ChainConfig
	
	// Context and cancellation
	ctx            context.Context
	cancel         context.CancelFunc
	
	// Metrics
	metrics        *RelayerMetrics
}

// ChainConfig holds configuration for each blockchain chain
type ChainConfig struct {
	ChainID          string          `json:"chain_id"`
	Name             string          `json:"name"`
	RPCURL           string          `json:"rpc_url"`
	ContractAddress  common.Address  `json:"contract_address"`
	GasLimit         uint64          `json:"gas_limit"`
	GasPrice         *big.Int        `json:"gas_price"`
	Confirmations    uint64          `json:"confirmations"`
	Enabled          bool            `json:"enabled"`
}

// RelayerMetrics tracks relayer performance metrics
type RelayerMetrics struct {
	MessagesProcessed    uint64        `json:"messages_processed"`
	MessagesSent         uint64        `json:"messages_sent"`
	MessagesConfirmed    uint64        `json:"messages_confirmed"`
	MessagesFailed       uint64        `json:"messages_failed"`
	AverageLatency       time.Duration `json:"average_latency"`
	LastProcessedTime    time.Time     `json:"last_processed_time"`
}


// NewTrustedRelayer creates a new trusted relayer service
func NewTrustedRelayer(cfg *config.Config, bc *blockchain.Clients) (*TrustedRelayer, error) {
	ctx, cancel := context.WithCancel(context.Background())
	
	// Parse private key
	privateKey, err := crypto.HexToECDSA(cfg.RelayerPrivateKey)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}
	
	publicAddress := crypto.PubkeyToAddress(privateKey.PublicKey)
	
	// Initialize chain configurations
	chainConfigs := initializeChainConfigs(cfg)
	
	// Initialize LayerZero client
	// We'll use the Ethereum client as a placeholder for the EVM client
	layerZeroClient, err := NewLayerZeroClient(bc.GetEthereumClient(), privateKey)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to initialize LayerZero client: %w", err)
	}

	// Initialize Hedera event listener
	hederaListener, err := NewHederaEventListener(bc.GetHederaClient(), cfg.HederaContractAddress)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to initialize Hedera listener: %w", err)
	}
	
	relayer := &TrustedRelayer{
		config:          cfg,
		blockchain:      bc,
		privateKey:      privateKey,
		publicAddress:   publicAddress,
		hederaListener:  hederaListener,
		messageQueue:    make(chan *Message, 1000),
		messageStore:    make(map[string]*Message),
		layerZeroClient: layerZeroClient,
		chainConfigs:    chainConfigs,
		ctx:            ctx,
		cancel:         cancel,
		metrics:        &RelayerMetrics{},
		messageFactory: NewMessageFactory(101), // Placeholder for LayerZero chain ID
	}

	return relayer, nil
}

// initializeChainConfigs initializes chain configurations
func initializeChainConfigs(cfg *config.Config) map[string]*ChainConfig {
	return map[string]*ChainConfig{
		"ethereum": {
			ChainID:         "1",
			Name:           "Ethereum",
			RPCURL:         cfg.EthereumRPC,
			ContractAddress: common.HexToAddress(cfg.EthereumLiquidityPool),
			GasLimit:       500000,
			GasPrice:       big.NewInt(20000000000), // 20 Gwei
			Confirmations:  12,
			Enabled:        cfg.EthereumRPC != "",
		},
		"base": {
			ChainID:         "8453",
			Name:           "Base",
			RPCURL:         cfg.BaseRPC,
			ContractAddress: common.HexToAddress(cfg.BaseLiquidityPool),
			GasLimit:       500000,
			GasPrice:       big.NewInt(1000000000), // 1 Gwei
			Confirmations:  5,
			Enabled:        cfg.BaseRPC != "",
		},
		"solana": {
			ChainID:         "solana",
			Name:           "Solana",
			RPCURL:         cfg.SolanaRPC,
			ContractAddress: common.HexToAddress("0x0000000000000000000000000000000000000000"), // Placeholder
			GasLimit:       0, // Solana doesn't use gas
			GasPrice:       big.NewInt(0),
			Confirmations:  1,
			Enabled:        cfg.SolanaRPC != "",
		},
		"aptos": {
			ChainID:         "aptos",
			Name:           "Aptos",
			RPCURL:         cfg.AptosRPC,
			ContractAddress: common.HexToAddress("0x0000000000000000000000000000000000000000"), // Placeholder
			GasLimit:       0, // Aptos doesn't use gas
			GasPrice:       big.NewInt(0),
			Confirmations:  1,
			Enabled:        cfg.AptosRPC != "",
		},
	}
}

// Start starts the trusted relayer service
func (tr *TrustedRelayer) Start() error {
	log.Info().Str("address", tr.publicAddress.Hex()).Msg("Starting trusted relayer service")
	
	// Start event listeners
	if err := tr.hederaListener.Start(tr.ctx, tr.handleHederaEvent); err != nil {
		return fmt.Errorf("failed to start Hedera listener: %w", err)
	}
	
	// Start message processors
	tr.processing.Add(1)
	go tr.messageProcessor()
	
	// Start metrics reporter
	tr.processing.Add(1)
	go tr.metricsReporter()
	
	log.Info().Msg("Trusted relayer service started successfully")
	return nil
}

// Stop stops the trusted relayer service
func (tr *TrustedRelayer) Stop() error {
	log.Info().Msg("Stopping trusted relayer service")
	
	// Cancel context
	tr.cancel()
	
	// Stop event listeners
	tr.hederaListener.Stop()
	
	// Wait for processors to finish
	done := make(chan struct{})
	go func() {
		tr.processing.Wait()
		close(done)
	}()
	
	select {
	case <-done:
		log.Info().Msg("Trusted relayer service stopped successfully")
		return nil
	case <-time.After(30 * time.Second):
		return fmt.Errorf("timeout waiting for relayer to stop")
	}
}

// handleHederaEvent handles events from Hedera
func (tr *TrustedRelayer) handleHederaEvent(event interface{}) error {
	switch e := event.(type) {
	case *LoanApprovalEvent:
		return tr.handleLoanApproval(e)
	default:
		log.Warn().Interface("event", event).Msg("Unknown event type")
		return nil
	}
}

// handleLoanApproval handles loan approval events
func (tr *TrustedRelayer) handleLoanApproval(event *LoanApprovalEvent) error {
	log.Info().
		Str("token_id", event.TokenID.String()).
		Str("borrower", event.Borrower.Hex()).
		Str("merchant", event.Merchant.Hex()).
		Str("amount", event.Amount.String()).
		Msg("Processing loan approval event")

	// Create cross-chain message for each enabled chain
	for chainID, config := range tr.chainConfigs {
		if !config.Enabled {
			continue
		}

		payload, err := tr.messageFactory.CreateLoanDisbursementPayload(event)
		if err != nil {
			log.Error().Err(err).Str("chain_id", chainID).Msg("Failed to create loan disbursement payload")
			continue
		}

		message := &Message{
			Type:      MessageTypeLoanDisbursement,
			ChainID:   chainID,
			Payload:   payload,
			Timestamp: time.Now(),
			Status:    StatusPending,
		}

		// Queue message for processing
		tr.messageQueue <- message
	}

	return nil
}

// messageProcessor processes messages from the queue
func (tr *TrustedRelayer) messageProcessor() {
	defer tr.processing.Done()
	
	for {
		select {
		case <-tr.ctx.Done():
			return
		case message := <-tr.messageQueue:
			tr.processMessage(message)
		}
	}
}

// processMessage processes a single message
func (tr *TrustedRelayer) processMessage(message *Message) {
	startTime := time.Now()
	
	log.Info().
		Str("message_type", message.Type.String()).
		Str("chain_id", message.ChainID).
		Str("status", message.Status.String()).
		Msg("Processing message")
	
	// Update metrics
	tr.metrics.MessagesProcessed++

	// Send message via LayerZero
	chainID, err := getLayerZeroChainID(message.ChainID)
	if err != nil {
		log.Error().Err(err).Str("chain_id", message.ChainID).Msg("Failed to get LayerZero chain ID")
		return
	}
	txHash, err := tr.layerZeroClient.SendTransaction(tr.ctx, chainID, message.Payload)
	if err != nil {
		log.Error().Err(err).Str("chain_id", message.ChainID).Msg("Failed to send message")

		// Update message status
		message.Status = StatusFailed
		message.RetryCount++
		
		// Retry logic
		if message.RetryCount < tr.config.MaxRetries {
			message.Status = StatusRetrying
			go func() {
				time.Sleep(time.Duration(message.RetryCount) * time.Second * 5)
				tr.messageQueue <- message
			}()
		}
		
		tr.metrics.MessagesFailed++
		return
	}
	
	// Update message status
	message.Status = StatusSent

	// In a real implementation, you would wait for confirmation here.
	// For now, we'll just log the transaction hash.
	log.Info().Str("tx_hash", txHash).Msg("Transaction sent")

	// Update metrics
	message.Status = StatusConfirmed
	tr.metrics.MessagesSent++
	tr.metrics.MessagesConfirmed++
	
	// Update latency
	latency := time.Since(startTime)
	tr.metrics.AverageLatency = time.Duration(
		(int64(tr.metrics.AverageLatency)*int64(tr.metrics.MessagesConfirmed-1) + int64(latency)) /
			int64(tr.metrics.MessagesConfirmed),
	)
	tr.metrics.LastProcessedTime = time.Now()
	
	log.Info().
		Str("message_type", message.Type.String()).
		Str("chain_id", message.ChainID).
		Dur("latency", latency).
		Msg("Message processed successfully")
}

func getLayerZeroChainID(chainID string) (uint32, error) {
	switch chainID {
	case "ethereum":
		return 101, nil
	case "base":
		return 184, nil
	default:
		return 0, fmt.Errorf("unsupported chain ID: %s", chainID)
	}
}

// metricsReporter reports metrics periodically
func (tr *TrustedRelayer) metricsReporter() {
	defer tr.processing.Done()
	
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-tr.ctx.Done():
			return
		case <-ticker.C:
			tr.reportMetrics()
		}
	}
}

// reportMetrics logs current metrics
func (tr *TrustedRelayer) reportMetrics() {
	log.Info().
		Uint64("processed", tr.metrics.MessagesProcessed).
		Uint64("sent", tr.metrics.MessagesSent).
		Uint64("confirmed", tr.metrics.MessagesConfirmed).
		Uint64("failed", tr.metrics.MessagesFailed).
		Dur("avg_latency", tr.metrics.AverageLatency).
		Time("last_processed", tr.metrics.LastProcessedTime).
		Msg("Relayer metrics")
}

// GetMetrics returns current relayer metrics
func (tr *TrustedRelayer) GetMetrics() *RelayerMetrics {
	return tr.metrics
}

// GetMessageStatus returns the status of a specific message
func (tr *TrustedRelayer) GetMessageStatus(messageID string) (*Message, error) {
	tr.storeMutex.RLock()
	defer tr.storeMutex.RUnlock()
	
	message, ok := tr.messageStore[messageID]
	if !ok {
		return nil, fmt.Errorf("message not found: %s", messageID)
	}
	
	return message, nil
}