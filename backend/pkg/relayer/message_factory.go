package relayer

import (
	"encoding/json"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

// MessageFactory creates cross-chain messages from Hedera events
type MessageFactory struct {
	layerzeroChainID uint32
}

// NewMessageFactory creates a new message factory
func NewMessageFactory(layerzeroChainID uint32) *MessageFactory {
	return &MessageFactory{
		layerzeroChainID: layerzeroChainID,
	}
}

// LoanDisbursementPayload represents the data sent to the EVM chain
type LoanDisbursementPayload struct {
	LoanID   *big.Int       `json:"loan_id"`
	Merchant common.Address `json:"merchant"`
	Amount   *big.Int       `json:"amount"`
}

// CreateLoanDisbursementPayload creates the payload for a loan disbursement message
func (mf *MessageFactory) CreateLoanDisbursementPayload(event *LoanApprovalEvent) ([]byte, error) {
	if event == nil {
		return nil, fmt.Errorf("event cannot be nil")
	}

	payload := LoanDisbursementPayload{
		LoanID:   event.TokenID,
		Merchant: event.Merchant,
		Amount:   event.Amount,
	}

	// In a real implementation, you would use ABI encoding.
	// For now, we'll use JSON encoding.
	return json.Marshal(payload)
}
