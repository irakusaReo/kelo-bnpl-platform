package relayer

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"kelo-backend/pkg/blockchain"

	"github.com/ethereum/go-ethereum/common"
	"github.com/rs/zerolog/log"
)

// HederaEventListener listens for events on Hedera smart contracts
type HederaEventListener struct {
	client       *blockchain.HederaClient
	contractAddr common.Address
	eventHandler func(interface{}) error
	quitChan     chan struct{}
}

// NewHederaEventListener creates a new Hedera event listener
func NewHederaEventListener(client *blockchain.HederaClient, contractAddr string) (*HederaEventListener, error) {
	if contractAddr == "" {
		return nil, fmt.Errorf("contract address is required")
	}

	return &HederaEventListener{
		client:       client,
		contractAddr: common.HexToAddress(contractAddr),
		quitChan:     make(chan struct{}),
	}, nil
}

// Start starts the event listener
func (hel *HederaEventListener) Start(ctx context.Context, eventHandler func(interface{}) error) error {
	log.Info().Str("contract", hel.contractAddr.Hex()).Msg("Starting Hedera event listener")
	hel.eventHandler = eventHandler
	// In a real implementation, you would start polling or subscribing to events here.
	// For this mock implementation, we will wait for simulated events.
	go func() {
		<-ctx.Done()
		hel.Stop()
	}()
	return nil
}

// Stop stops the event listener
func (hel *HederaEventListener) Stop() {
	log.Info().Msg("Stopping Hedera event listener")
	close(hel.quitChan)
}

// SimulateLoanCreatedEvent simulates a loan creation event for testing purposes
func (hel *HederaEventListener) SimulateLoanCreatedEvent() {
	event := &LoanApprovalEvent{
		TokenID:      big.NewInt(int64(time.Now().Unix())),
		Borrower:     common.HexToAddress("0x1234567890123456789012345678901234567890"),
		Merchant:     common.HexToAddress("0x0987654321098765432109876543210987654321"),
		Amount:       big.NewInt(1000000000000000000), // 1 ETH
		InterestRate: big.NewInt(1000),             // 10%
		Duration:     big.NewInt(30),               // 30 days
		BorrowerDID:  "did:hedera:test:123",
		MerchantDID:  "did:hedera:test:456",
		Timestamp:    time.Now(),
	}

	if err := hel.eventHandler(event); err != nil {
		log.Error().Err(err).Msg("Failed to handle simulated event")
	}
}
