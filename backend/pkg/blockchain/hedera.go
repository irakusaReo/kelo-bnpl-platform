package blockchain

import (
	"context"
	"encoding/json"
	"fmt"
	"kelo-backend/pkg/config"
	"os"

	"github.com/hiero-ledger/hiero-sdk-go/v2"
	"github.com/rs/zerolog/log"
)

// HederaClient represents a Hedera blockchain client
type HederaClient struct {
	client          *hedera.Client
	loanUpdateTopic string
}

// NewHederaClient creates a new Hedera client
func NewHederaClient(cfg *config.Config) *HederaClient {
	var client *hedera.Client
	var err error

	// Configure client for testnet, mainnet, or previewnet
	switch cfg.HederaNetwork {
	case "mainnet":
		client = hedera.ClientForMainnet()
	case "testnet":
		client = hedera.ClientForTestnet()
	case "previewnet":
		client = hedera.ClientForPreviewnet()
	default:
		log.Fatal().Msgf("invalid hedera network specified: %s", cfg.HederaNetwork)
		return nil
	}

	// Get operator ID and key from environment variables
	operatorID, err := hedera.AccountIDFromString(os.Getenv("HEDERA_OPERATOR_ID"))
	if err != nil {
		log.Fatal().Err(err).Msg("failed to parse HEDERA_OPERATOR_ID")
		return nil
	}

	operatorKey, err := hedera.PrivateKeyFromString(os.Getenv("HEDERA_OPERATOR_KEY"))
	if err != nil {
		log.Fatal().Err(err).Msg("failed to parse HEDERA_OPERATOR_KEY")
		return nil
	}

	// Set the operator account ID and key
	client.SetOperator(operatorID, operatorKey)

	return &HederaClient{
		client:          client,
		loanUpdateTopic: cfg.HederaLoanUpdateTopicID,
	}
}

// MintLoanAgreementNFT mints a new HTS NFT to represent a loan agreement.
func (c *HederaClient) MintLoanAgreementNFT(ctx context.Context, loanID string, metadata []byte) (string, int64, error) {
	log.Info().Str("loanId", loanID).Msg("Minting new loan agreement NFT on Hedera")

	op := c.client.GetOperator()

	// 1. Create the NFT class (Token)
	tokenCreateTx, err := hedera.NewTokenCreateTransaction().
		SetTokenName(fmt.Sprintf("Kelo Loan Agreement - %s", loanID)).
		SetTokenSymbol("KELOLON").
		SetTokenType(hedera.TokenTypeNonFungibleUnique).
		SetDecimals(0).
		SetInitialSupply(0).
		SetTreasuryAccountID(op.AccountID).
		SetSupplyType(hedera.TokenSupplyTypeFinite).
		SetMaxSupply(1).
		SetAdminKey(op.PublicKey).
		SetFreezeKey(op.PublicKey).
		SetWipeKey(op.PublicKey).
		SetSupplyKey(op.PublicKey).
		SetFreezeDefault(true).
		Execute(c.client)
	if err != nil {
		return "", 0, fmt.Errorf("failed to create NFT token: %w", err)
	}

	receipt, err := tokenCreateTx.GetReceipt(c.client)
	if err != nil {
		return "", 0, fmt.Errorf("failed to get token creation receipt: %w", err)
	}

	tokenID := *receipt.TokenID
	log.Info().Str("tokenId", tokenID.String()).Msg("Successfully created NFT token class")

	// 2. Mint the actual NFT with metadata
	mintTx, err := hedera.NewTokenMintTransaction().
		SetTokenID(tokenID).
		SetMetadata(metadata).
		Execute(c.client)
	if err != nil {
		return "", 0, fmt.Errorf("failed to mint NFT: %w", err)
	}

	mintReceipt, err := mintTx.GetReceipt(c.client)
	if err != nil {
		return "", 0, fmt.Errorf("failed to get token mint receipt: %w", err)
	}

	if len(mintReceipt.SerialNumbers) == 0 {
		return "", 0, fmt.Errorf("no serial numbers returned in mint receipt")
	}

	serial := mintReceipt.SerialNumbers[0]
	log.Info().
		Str("tokenId", tokenID.String()).
		Int64("serialNumber", serial).
		Msg("Successfully minted NFT")

	return tokenID.String(), serial, nil
}

// RecordLoanCreationEvent records the loan creation on the Hedera Consensus Service.
func (c *HederaClient) RecordLoanCreationEvent(ctx context.Context, topicIDStr string, eventData []byte) error {
	log.Info().Str("topicId", topicIDStr).Msg("Recording loan creation event on HCS")

	topicID, err := hedera.TopicIDFromString(topicIDStr)
	if err != nil {
		return fmt.Errorf("failed to parse topic ID: %w", err)
	}

	tx, err := hedera.NewTopicMessageSubmitTransaction().
		SetTopicID(topicID).
		SetMessage(eventData).
		Execute(c.client)
	if err != nil {
		return fmt.Errorf("failed to submit message to HCS topic: %w", err)
	}

	// Check the receipt to confirm the transaction was successful
	_, err = tx.GetReceipt(c.client)
	if err != nil {
		return fmt.Errorf("failed to get HCS message submission receipt: %w", err)
	}

	log.Info().Str("topicId", topicIDStr).Msg("Successfully recorded event on HCS")
	return nil
}

// UpdateLoanNFTStatus updates the metadata of the loan NFT when a repayment is made.
func (c *HederaClient) UpdateLoanNFTStatus(ctx context.Context, tokenIDStr string, serialNumber int64, newMetadata []byte) error {
	log.Info().
		Str("tokenId", tokenIDStr).
		Int64("serialNumber", serialNumber).
		Msg("Updating loan NFT status on Hedera")

	tokenID, err := hedera.TokenIDFromString(tokenIDStr)
	if err != nil {
		return fmt.Errorf("failed to parse token ID: %w", err)
	}

	// Note: Updating the metadata of a specific NFT (serial) is done via TokenMintTransaction
	// on an existing token class, not TokenUpdateTransaction. We are minting a new serial with new metadata.
	// This seems incorrect for the use case, but is the way the SDK is designed.
	// A better approach would be to have mutable metadata on the NFT.
	// For now, we will assume the loan NFT is a single-mint token and we cannot update it this way.
	// The correct way to handle this would be to associate the loan ID with a separate, mutable
	// data store (e.g., a smart contract or another HCS topic) and reference that from the NFT.
	//
	// Given the constraints, we will simulate this by submitting a message to the HCS topic instead.
	// This is a more realistic implementation of status updates.
	log.Warn().Msg("Token metadata updates for specific serials are not directly supported via TokenUpdateTransaction. Submitting to HCS as a workaround.")

	if c.loanUpdateTopic == "" {
		return fmt.Errorf("loan update topic ID is not configured")
	}

	updateEvent, err := json.Marshal(map[string]interface{}{
		"tokenId":      tokenIDStr,
		"serialNumber": serialNumber,
		"newMetadata":  string(newMetadata), // Assuming metadata is a string or can be represented as one
	})
	if err != nil {
		return fmt.Errorf("failed to marshal update event: %w", err)
	}

	return c.RecordLoanCreationEvent(ctx, c.loanUpdateTopic, updateEvent)
}
