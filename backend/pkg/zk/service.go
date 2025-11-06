package zk

import (
	"context"
	"fmt"
	// "kelo-backend/pkg/models"

	"kelo-backend/pkg/config"

	// "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/rs/zerolog/log"
	"github.com/supabase-community/supabase-go"
)

// ZKService provides ZK-proof related services
type ZKService struct {
	client    *supabase.Client
	ethClient *ethclient.Client
	config    *config.Config
	// contract  *KeloCreditVerifier
}

// NewZKService creates a new ZK service instance
func NewZKService(client *supabase.Client, config *config.Config) (*ZKService, error) {
	ethClient, err := ethclient.Dial(config.ScrollTestnetRPC)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Scroll Testnet: %w", err)
	}

	// address := common.HexToAddress(config.KeloCreditVerifierAddress)
	// contract, err := NewKeloCreditVerifier(address, ethClient)
	// if err != nil {
	// 	return nil, fmt.Errorf("failed to instantiate KeloCreditVerifier contract: %w", err)
	// }

	return &ZKService{
		client:    client,
		ethClient: ethClient,
		config:    config,
		// contract:  contract,
	}, nil
}

// GenerateZKInputs generates the private inputs for the ZK-circuit
func (s *ZKService) GenerateZKInputs(ctx context.Context, userID string) (map[string]interface{}, error) {
	// In a real implementation, this would involve gathering cross-chain data
	// from various sources (e.g., wallet activity, HCS data, off-chain data).
	// For now, we'll just return some dummy data.
	inputs := map[string]interface{}{
		"userId":         userID,
		"totalTx":        100,
		"successRate":    95,
		"accountAge":     2,
		"diversityScore": 80,
		"netFlow":        5000,
	}

	log.Info().Str("userID", userID).Msg("Generated ZK inputs")
	return inputs, nil
}

// SubmitZKProof submits the ZK-proof to the smart contract
func (s *ZKService) SubmitZKProof(ctx context.Context, userID string, proof []byte, publicInputs [][]byte) (string, error) {
	// This is a placeholder for submitting the proof to the smart contract.
	// In a real implementation, this would involve sending a transaction
	// to the KeloCreditVerifier.sol contract on the Scroll Testnet.
	// We'll just log the proof and public inputs for now.
	log.Info().
		Str("userID", userID).
		Bytes("proof", proof).
		Interface("publicInputs", publicInputs).
		Msg("Submitted ZK proof")

	// Return a dummy transaction hash
	return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", nil
}
