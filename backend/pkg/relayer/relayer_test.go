package relayer

import (
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
)

// newTestRelayer creates a new TrustedRelayer for testing purposes.
func newTestRelayer(t *testing.T) *TrustedRelayer {
	// Generate a dummy private key for the relayer.
	privateKey, err := crypto.GenerateKey()
	assert.NoError(t, err)

	// Mock LayerZeroClient - we pass nil for ethclient as it's not used in the mock
	lzClient, err := NewLayerZeroClient(nil, privateKey)
	assert.NoError(t, err)

	relayer := &TrustedRelayer{
		privateKey:   privateKey,
		messageQueue: make(chan *Message, 100),
		messageStore: make(map[string]*Message),
		chainConfigs: map[string]*ChainConfig{
			"ethereum": {
				Enabled: true,
			},
		},
		layerZeroClient: lzClient,
		messageFactory:  NewMessageFactory(101), // Placeholder for LayerZero chain ID
	}
	return relayer
}

func TestTrustedRelayer_HandleLoanApproval(t *testing.T) {
	relayer := newTestRelayer(t)

	event := &LoanApprovalEvent{
		TokenID:      big.NewInt(1),
		Borrower:     common.HexToAddress("0x1234567890123456789012345678901234567890"),
		Merchant:     common.HexToAddress("0x0987654321098765432109876543210987654321"),
		Amount:       big.NewInt(1000),
		InterestRate: big.NewInt(5),
		Duration:     big.NewInt(30),
	}

	err := relayer.handleLoanApproval(event)
	assert.NoError(t, err)
	assert.Len(t, relayer.messageQueue, 1)
}
