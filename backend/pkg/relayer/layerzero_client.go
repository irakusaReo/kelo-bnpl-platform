package relayer

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"time"

	"kelo-backend/pkg/blockchain"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/rs/zerolog/log"
)

// LayerZeroClient handles LayerZero message sending
type LayerZeroClient struct {
	endpoint      string
	apiKey        string
	clients       map[string]*ethclient.Client
	auth          *bind.TransactOpts
	privateKey    *ecdsa.PrivateKey
}

// LayerZeroMessage represents a LayerZero message structure
type LayerZeroMessage struct {
	SourceChainID  uint16         `json:"source_chain_id"`
	DestChainID    uint16         `json:"dest_chain_id"`
	SourceAddress  common.Address `json:"source_address"`
	DestAddress    common.Address `json:"dest_address"`
	Payload        []byte         `json:"payload"`
	AdapterParams  []byte         `json:"adapter_params"`
	Fee            *big.Int       `json:"fee"`
	RefundAddress  common.Address `json:"refund_address"`
	ZroPaymentAddress common.Address `json:"zro_payment_address"`
}

// LayerZeroResponse represents the response from LayerZero API
type LayerZeroResponse struct {
	Success   bool   `json:"success"`
	MessageID string `json:"message_id"`
	TxHash    string `json:"tx_hash"`
	Error     string `json:"error,omitempty"`
}

// NewLayerZeroClient creates a new LayerZero client
func NewLayerZeroClient(endpoint, apiKey string, bc *blockchain.Clients) (*LayerZeroClient, error) {
	if endpoint == "" {
		return nil, fmt.Errorf("LayerZero endpoint is required")
	}
	
	// Initialize clients for each chain
	clients := make(map[string]*ethclient.Client)
	
	if bc.GetEthereumClient() != nil {
		clients["ethereum"] = bc.GetEthereumClient()
	}
	
	if bc.GetBaseClient() != nil {
		clients["base"] = bc.GetBaseClient()
	}
	
	return &LayerZeroClient{
		endpoint: endpoint,
		apiKey:   apiKey,
		clients:  clients,
	}, nil
}

// SetPrivateKey sets the private key for signing transactions
func (lzc *LayerZeroClient) SetPrivateKey(privateKey *ecdsa.PrivateKey) {
	lzc.privateKey = privateKey
	
	// Create transactor
	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(1)) // Default to Ethereum mainnet
	if err != nil {
		log.Error().Err(err).Msg("Failed to create transactor")
		return
	}
	
	lzc.auth = auth
}

// SendMessage sends a message via LayerZero
func (lzc *LayerZeroClient) SendMessage(ctx context.Context, message *Message) error {
	if lzc.privateKey == nil {
		return fmt.Errorf("private key not set")
	}
	
	log.Info().
		Str("message_type", message.Type.String()).
		Str("chain_id", message.ChainID).
		Msg("Sending LayerZero message")
	
	// Get chain IDs
	sourceChainID, destChainID, err := lzc.getChainIDs(message.ChainID)
	if err != nil {
		return fmt.Errorf("failed to get chain IDs: %w", err)
	}
	
	// Get contract addresses
	sourceAddr, destAddr, err := lzc.getContractAddresses(message.ChainID)
	if err != nil {
		return fmt.Errorf("failed to get contract addresses: %w", err)
	}
	
	// Create LayerZero message
	lzMessage := &LayerZeroMessage{
		SourceChainID:  sourceChainID,
		DestChainID:    destChainID,
		SourceAddress:  sourceAddr,
		DestAddress:    destAddr,
		Payload:        message.Payload,
		AdapterParams:  lzc.getAdapterParams(message),
		Fee:            big.NewInt(0), // Will be calculated by LayerZero
		RefundAddress:  crypto.PubkeyToAddress(lzc.privateKey.PublicKey),
		ZroPaymentAddress: common.Address{},
	}
	
	// Send message via LayerZero
	response, err := lzc.sendLayerZeroMessage(ctx, lzMessage)
	if err != nil {
		return fmt.Errorf("failed to send LayerZero message: %w", err)
	}
	
	if !response.Success {
		return fmt.Errorf("LayerZero message failed: %s", response.Error)
	}
	
	log.Info().
		Str("message_id", response.MessageID).
		Str("tx_hash", response.TxHash).
		Msg("LayerZero message sent successfully")
	
	return nil
}

// getChainIDs returns the source and destination chain IDs for LayerZero
func (lzc *LayerZeroClient) getChainIDs(chainID string) (uint16, uint16, error) {
	// LayerZero chain IDs mapping
	chainIDMap := map[string]struct {
		source uint16
		dest   uint16
	}{
		"ethereum": {source: 101, dest: 101}, // Ethereum mainnet
		"base":     {source: 184, dest: 184}, // Base mainnet
		"solana":   {source: 101, dest: 101}, // Use Ethereum as source for Solana
		"aptos":    {source: 101, dest: 101}, // Use Ethereum as source for Aptos
	}
	
	mapping, ok := chainIDMap[chainID]
	if !ok {
		return 0, 0, fmt.Errorf("unsupported chain ID: %s", chainID)
	}
	
	return mapping.source, mapping.dest, nil
}

// getContractAddresses returns the source and destination contract addresses
func (lzc *LayerZeroClient) getContractAddresses(chainID string) (common.Address, common.Address, error) {
	// This would be configured based on your deployment
	// For now, return placeholder addresses
	sourceAddr := common.HexToAddress("0x1234567890123456789012345678901234567890")
	destAddr := common.HexToAddress("0x0987654321098765432109876543210987654321")
	
	return sourceAddr, destAddr, nil
}

// getAdapterParams returns adapter parameters for the message
func (lzc *LayerZeroClient) getAdapterParams(message *Message) []byte {
	// This would contain additional parameters for the message
	// For now, return empty bytes
	return []byte{}
}

// sendLayerZeroMessage sends a message to the LayerZero endpoint
func (lzc *LayerZeroClient) sendLayerZeroMessage(ctx context.Context, message *LayerZeroMessage) (*LayerZeroResponse, error) {
	// Convert message to JSON
	messageJSON, err := json.Marshal(message)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal message: %w", err)
	}
	
	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", lzc.endpoint, bytes.NewBuffer(messageJSON))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+lzc.apiKey)
	
	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()
	
	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}
	
	// Parse response
	var response LayerZeroResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}
	
	return &response, nil
}

// EstimateFee estimates the fee for sending a message
func (lzc *LayerZeroClient) EstimateFee(ctx context.Context, message *Message) (*big.Int, error) {
	// Get chain IDs
	sourceChainID, destChainID, err := lzc.getChainIDs(message.ChainID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chain IDs: %w", err)
	}
	
	// Get contract addresses
	sourceAddr, destAddr, err := lzc.getContractAddresses(message.ChainID)
	if err != nil {
		return nil, fmt.Errorf("failed to get contract addresses: %w", err)
	}
	
	// Create LayerZero message for fee estimation
	_ = &LayerZeroMessage{
		SourceChainID:  sourceChainID,
		DestChainID:    destChainID,
		SourceAddress:  sourceAddr,
		DestAddress:    destAddr,
		Payload:        message.Payload,
		AdapterParams:  lzc.getAdapterParams(message),
		Fee:            big.NewInt(0),
		RefundAddress:  crypto.PubkeyToAddress(lzc.privateKey.PublicKey),
		ZroPaymentAddress: common.Address{},
	}
	
	// Estimate fee (this would be done via LayerZero API in a real implementation)
	// For now, return a placeholder fee
	return big.NewInt(100000000000000000), nil // 0.1 ETH
}

// GetMessageStatus checks the status of a sent message
func (lzc *LayerZeroClient) GetMessageStatus(ctx context.Context, messageID string) (string, error) {
	// This would query the LayerZero API for message status
	// For now, return a placeholder status
	return "delivered", nil
}

// RetryMessage retries a failed message
func (lzc *LayerZeroClient) RetryMessage(ctx context.Context, message *Message) error {
	log.Info().
		Str("message_type", message.Type.String()).
		Str("chain_id", message.ChainID).
		Int("retry_count", message.RetryCount).
		Msg("Retrying LayerZero message")
	
	// Update message status
	message.Status = StatusRetrying
	message.RetryCount++
	
	// Send the message again
	return lzc.SendMessage(ctx, message)
}

// SignMessage signs a message with the relayer's private key
func (lzc *LayerZeroClient) SignMessage(message *Message) ([]byte, error) {
	if lzc.privateKey == nil {
		return nil, fmt.Errorf("private key not set")
	}
	
	// Create hash of the message payload
	hash := crypto.Keccak256Hash(message.Payload)
	
	// Sign the hash
	signature, err := crypto.Sign(hash.Bytes(), lzc.privateKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign message: %w", err)
	}
	
	return signature, nil
}

// VerifySignature verifies a message signature
func (lzc *LayerZeroClient) VerifySignature(message *Message, signature []byte) (bool, error) {
	if lzc.privateKey == nil {
		return false, fmt.Errorf("private key not set")
	}
	
	// Create hash of the message payload
	hash := crypto.Keccak256Hash(message.Payload)
	
	// Recover the public key from the signature
	pubKey, err := crypto.SigToPub(hash.Bytes(), signature)
	if err != nil {
		return false, fmt.Errorf("failed to recover public key: %w", err)
	}
	
	// Compare with the expected public key
	expectedPubKey := lzc.privateKey.Public()
	return pubKey.Equal(expectedPubKey), nil
}