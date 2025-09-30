package relayer

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/rs/zerolog/log"
)

// MessageFactory creates cross-chain messages from Hedera events
type MessageFactory struct {
	relayerAddress common.Address
}

// NewMessageFactory creates a new message factory
func NewMessageFactory(relayerAddress common.Address) *MessageFactory {
	return &MessageFactory{
		relayerAddress: relayerAddress,
	}
}

// createLoanApprovalMessage creates a loan approval message from a Hedera event
func (tr *TrustedRelayer) createLoanApprovalMessage(event *LoanApprovalEvent, chainID string) (*Message, error) {
	// Create message payload
	payload, err := tr.createLoanApprovalPayload(event)
	if err != nil {
		return nil, fmt.Errorf("failed to create loan approval payload: %w", err)
	}
	
	// Create message
	message := &Message{
		Type:       MessageTypeLoanApproval,
		ChainID:    chainID,
		Payload:    payload,
		Timestamp:  time.Now(),
		Status:     StatusPending,
		RetryCount: 0,
	}
	
	// Sign the message
	signature, err := tr.layerZeroClient.SignMessage(message)
	if err != nil {
		return nil, fmt.Errorf("failed to sign message: %w", err)
	}
	
	message.Signature = signature
	
	// Store message
	messageID := tr.generateMessageID(message)
	tr.storeMutex.Lock()
	tr.messageStore[messageID] = message
	tr.storeMutex.Unlock()
	
	log.Info().
		Str("message_id", messageID).
		Str("chain_id", chainID).
		Msg("Created loan approval message")
	
	return message, nil
}

// createLoanDisbursementMessage creates a loan disbursement message from a Hedera event
func (tr *TrustedRelayer) createLoanDisbursementMessage(event *LoanDisbursementEvent, chainID string) (*Message, error) {
	// Create message payload
	payload, err := tr.createLoanDisbursementPayload(event)
	if err != nil {
		return nil, fmt.Errorf("failed to create loan disbursement payload: %w", err)
	}
	
	// Create message
	message := &Message{
		Type:       MessageTypeLoanDisbursement,
		ChainID:    chainID,
		Payload:    payload,
		Timestamp:  time.Now(),
		Status:     StatusPending,
		RetryCount: 0,
	}
	
	// Sign the message
	signature, err := tr.layerZeroClient.SignMessage(message)
	if err != nil {
		return nil, fmt.Errorf("failed to sign message: %w", err)
	}
	
	message.Signature = signature
	
	// Store message
	messageID := tr.generateMessageID(message)
	tr.storeMutex.Lock()
	tr.messageStore[messageID] = message
	tr.storeMutex.Unlock()
	
	log.Info().
		Str("message_id", messageID).
		Str("chain_id", chainID).
		Msg("Created loan disbursement message")
	
	return message, nil
}

// createRepaymentMessage creates a repayment message from a Hedera event
func (tr *TrustedRelayer) createRepaymentMessage(event *RepaymentEvent, chainID string) (*Message, error) {
	// Create message payload
	payload, err := tr.createRepaymentPayload(event)
	if err != nil {
		return nil, fmt.Errorf("failed to create repayment payload: %w", err)
	}
	
	// Create message
	message := &Message{
		Type:       MessageTypeRepaymentConfirmation,
		ChainID:    chainID,
		Payload:    payload,
		Timestamp:  time.Now(),
		Status:     StatusPending,
		RetryCount: 0,
	}
	
	// Sign the message
	signature, err := tr.layerZeroClient.SignMessage(message)
	if err != nil {
		return nil, fmt.Errorf("failed to sign message: %w", err)
	}
	
	message.Signature = signature
	
	// Store message
	messageID := tr.generateMessageID(message)
	tr.storeMutex.Lock()
	tr.messageStore[messageID] = message
	tr.storeMutex.Unlock()
	
	log.Info().
		Str("message_id", messageID).
		Str("chain_id", chainID).
		Msg("Created repayment message")
	
	return message, nil
}

// createLoanApprovalPayload creates the payload for a loan approval message
func (tr *TrustedRelayer) createLoanApprovalPayload(event *LoanApprovalEvent) ([]byte, error) {
	// Create a structured payload that matches the LayerZero message format
	payload := struct {
		MessageType   uint8         `json:"message_type"`
		LoanID        *big.Int      `json:"loan_id"`
		Borrower      common.Address `json:"borrower"`
		Merchant      common.Address `json:"merchant"`
		Amount        *big.Int      `json:"amount"`
		InterestRate  *big.Int      `json:"interest_rate"`
		Duration      *big.Int      `json:"duration"`
		BorrowerDID   string        `json:"borrower_did"`
		MerchantDID   string        `json:"merchant_did"`
		Timestamp     int64         `json:"timestamp"`
		Relayer       common.Address `json:"relayer"`
	}{
		MessageType:  uint8(MessageTypeLoanApproval),
		LoanID:       event.TokenID,
		Borrower:     event.Borrower,
		Merchant:     event.Merchant,
		Amount:       event.Amount,
		InterestRate: event.InterestRate,
		Duration:     event.Duration,
		BorrowerDID:  event.BorrowerDID,
		MerchantDID:  event.MerchantDID,
		Timestamp:    event.Timestamp.Unix(),
		Relayer:      tr.publicAddress,
	}
	
	// Convert to bytes (in a real implementation, you would use ABI encoding)
	// For now, we'll use a simple JSON encoding
	return tr.encodePayload(payload)
}

// createLoanDisbursementPayload creates the payload for a loan disbursement message
func (tr *TrustedRelayer) createLoanDisbursementPayload(event *LoanDisbursementEvent) ([]byte, error) {
	// Create a structured payload that matches the LayerZero message format
	payload := struct {
		MessageType  uint8         `json:"message_type"`
		LoanID       *big.Int      `json:"loan_id"`
		Merchant     common.Address `json:"merchant"`
		Amount       *big.Int      `json:"amount"`
		Timestamp    int64         `json:"timestamp"`
		Relayer      common.Address `json:"relayer"`
	}{
		MessageType: uint8(MessageTypeLoanDisbursement),
		LoanID:      event.TokenID,
		Merchant:    event.Merchant,
		Amount:      event.Amount,
		Timestamp:   event.Timestamp.Unix(),
		Relayer:     tr.publicAddress,
	}
	
	// Convert to bytes
	return tr.encodePayload(payload)
}

// createRepaymentPayload creates the payload for a repayment message
func (tr *TrustedRelayer) createRepaymentPayload(event *RepaymentEvent) ([]byte, error) {
	// Create a structured payload that matches the LayerZero message format
	payload := struct {
		MessageType  uint8         `json:"message_type"`
		LoanID       *big.Int      `json:"loan_id"`
		Amount       *big.Int      `json:"amount"`
		TotalRepaid  *big.Int      `json:"total_repaid"`
		Payer        common.Address `json:"payer"`
		Timestamp    int64         `json:"timestamp"`
		Relayer      common.Address `json:"relayer"`
	}{
		MessageType: uint8(MessageTypeRepaymentConfirmation),
		LoanID:      event.TokenID,
		Amount:      event.Amount,
		TotalRepaid: event.TotalRepaid,
		Payer:       event.Payer,
		Timestamp:   event.Timestamp.Unix(),
		Relayer:     tr.publicAddress,
	}
	
	// Convert to bytes
	return tr.encodePayload(payload)
}

// encodePayload encodes a payload structure to bytes
func (tr *TrustedRelayer) encodePayload(payload interface{}) ([]byte, error) {
	// This is a placeholder implementation
	// In a real implementation, you would use proper ABI encoding
	// For now, we'll use a simple JSON encoding
	
	// Convert to JSON string
	jsonStr := fmt.Sprintf("%+v", payload)
	
	// Convert to bytes
	return []byte(jsonStr), nil
}

// generateMessageID generates a unique ID for a message
func (tr *TrustedRelayer) generateMessageID(message *Message) string {
	// Create a hash of the message content
	hash := sha256.Sum256(append(message.Payload, message.Signature...))
	
	// Convert to hex string
	return hex.EncodeToString(hash[:])
}

// decodeMessage decodes a message from bytes
func (tr *TrustedRelayer) decodeMessage(data []byte) (*Message, error) {
	// This is a placeholder implementation
	// In a real implementation, you would decode the message from bytes
	// For now, return nil
	return nil, fmt.Errorf("not implemented")
}

// validateMessage validates a message before processing
func (tr *TrustedRelayer) validateMessage(message *Message) error {
	// Check if message is nil
	if message == nil {
		return fmt.Errorf("message is nil")
	}
	
	// Check if payload is empty
	if len(message.Payload) == 0 {
		return fmt.Errorf("message payload is empty")
	}
	
	// Check if signature is empty
	if len(message.Signature) == 0 {
		return fmt.Errorf("message signature is empty")
	}
	
	// Verify signature
	valid, err := tr.layerZeroClient.VerifySignature(message, message.Signature)
	if err != nil {
		return fmt.Errorf("failed to verify signature: %w", err)
	}
	
	if !valid {
		return fmt.Errorf("invalid message signature")
	}
	
	// Check if message type is valid
	switch message.Type {
	case MessageTypeLoanApproval, MessageTypeLoanDisbursement, MessageTypeRepaymentConfirmation:
		// Valid types
	default:
		return fmt.Errorf("invalid message type: %d", message.Type)
	}
	
	// Check if chain ID is supported
	if _, ok := tr.chainConfigs[message.ChainID]; !ok {
		return fmt.Errorf("unsupported chain ID: %s", message.ChainID)
	}
	
	return nil
}

// createLiquidityTransferMessage creates a liquidity transfer message
func (tr *TrustedRelayer) createLiquidityTransferMessage(fromPool, toPool common.Address, token common.Address, amount *big.Int, reason string, chainID string) (*Message, error) {
	// Create message payload
	payload := struct {
		MessageType uint8         `json:"message_type"`
		FromPool    common.Address `json:"from_pool"`
		ToPool      common.Address `json:"to_pool"`
		Token       common.Address `json:"token"`
		Amount      *big.Int      `json:"amount"`
		Reason      string        `json:"reason"`
		Timestamp   int64         `json:"timestamp"`
		Relayer     common.Address `json:"relayer"`
	}{
		MessageType: uint8(MessageTypeLiquidityTransfer),
		FromPool:    fromPool,
		ToPool:      toPool,
		Token:       token,
		Amount:      amount,
		Reason:      reason,
		Timestamp:   time.Now().Unix(),
		Relayer:     tr.publicAddress,
	}
	
	payloadBytes, err := tr.encodePayload(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode payload: %w", err)
	}
	
	// Create message
	message := &Message{
		Type:       MessageTypeLiquidityTransfer,
		ChainID:    chainID,
		Payload:    payloadBytes,
		Timestamp:  time.Now(),
		Status:     StatusPending,
		RetryCount: 0,
	}
	
	// Sign the message
	signature, err := tr.layerZeroClient.SignMessage(message)
	if err != nil {
		return nil, fmt.Errorf("failed to sign message: %w", err)
	}
	
	message.Signature = signature
	
	// Store message
	messageID := tr.generateMessageID(message)
	tr.storeMutex.Lock()
	tr.messageStore[messageID] = message
	tr.storeMutex.Unlock()
	
	log.Info().
		Str("message_id", messageID).
		Str("chain_id", chainID).
		Msg("Created liquidity transfer message")
	
	return message, nil
}

// createCreditScoreUpdateMessage creates a credit score update message
func (tr *TrustedRelayer) createCreditScoreUpdateMessage(userDID string, newScore, previousScore *big.Int, updateReason string, chainID string) (*Message, error) {
	// Create message payload
	payload := struct {
		MessageType  uint8   `json:"message_type"`
		UserDID      string  `json:"user_did"`
		NewScore     *big.Int `json:"new_score"`
		PreviousScore *big.Int `json:"previous_score"`
		UpdateReason string  `json:"update_reason"`
		Timestamp    int64   `json:"timestamp"`
		Relayer      common.Address `json:"relayer"`
	}{
		MessageType:  uint8(MessageTypeCreditScoreUpdate),
		UserDID:      userDID,
		NewScore:     newScore,
		PreviousScore: previousScore,
		UpdateReason: updateReason,
		Timestamp:    time.Now().Unix(),
		Relayer:      tr.publicAddress,
	}
	
	payloadBytes, err := tr.encodePayload(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode payload: %w", err)
	}
	
	// Create message
	message := &Message{
		Type:       MessageTypeCreditScoreUpdate,
		ChainID:    chainID,
		Payload:    payloadBytes,
		Timestamp:  time.Now(),
		Status:     StatusPending,
		RetryCount: 0,
	}
	
	// Sign the message
	signature, err := tr.layerZeroClient.SignMessage(message)
	if err != nil {
		return nil, fmt.Errorf("failed to sign message: %w", err)
	}
	
	message.Signature = signature
	
	// Store message
	messageID := tr.generateMessageID(message)
	tr.storeMutex.Lock()
	tr.messageStore[messageID] = message
	tr.storeMutex.Unlock()
	
	log.Info().
		Str("message_id", messageID).
		Str("chain_id", chainID).
		Msg("Created credit score update message")
	
	return message, nil
}