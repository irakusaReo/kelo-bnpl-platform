package bnpl

import (
	"context"
	"encoding/json"
	"fmt"
	"kelo-backend/pkg/blockchain"
	"kelo-backend/pkg/models"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/supabase-community/supabase-go"
)

// RepaymentService handles the business logic for loan repayments.
type RepaymentService struct {
	db        *supabase.Client
	bcClients *blockchain.Clients
}

// NewRepaymentService creates a new RepaymentService.
func NewRepaymentService(db *supabase.Client, bcClients *blockchain.Clients) *RepaymentService {
	return &RepaymentService{
		db:        db,
		bcClients: bcClients,
	}
}

// ProcessRepayment handles a user's loan repayment.
func (s *RepaymentService) ProcessRepayment(ctx context.Context, userID, loanID string, amount float64) error {
	log.Info().
		Str("userId", userID).
		Str("loanId", loanID).
		Float64("amount", amount).
		Msg("Processing new loan repayment")

	// 1. Validate the loan and user
	var loan models.Loan
	data, _, err := s.db.From("loans").Select("*", "exact", false).Eq("id", loanID).Eq("user_id", userID).Single().Execute()
	if err != nil {
		return fmt.Errorf("failed to retrieve loan: %w", err)
	}
	if err := json.Unmarshal([]byte(data), &loan); err != nil {
		return fmt.Errorf("failed to unmarshal loan data: %w", err)
	}

	if loan.Status == "PAID" {
		return fmt.Errorf("loan is already fully paid")
	}

	// 2. Record the repayment in the database
	repayment := models.Repayment{
		LoanID:        loan.ID,
		Amount:        amount,
		RepaymentDate: time.Now(),
	}
	_, _, err = s.db.From("repayments").Insert(repayment, false, "", "", "").Execute()
	if err != nil {
		return fmt.Errorf("failed to record repayment in database: %w", err)
	}

	// 3. Update the loan status
	newOutstandingAmount := loan.OutstandingAmount - amount
	loanStatus := "PARTIALLY_PAID"
	if newOutstandingAmount <= 0 {
		loanStatus = "PAID"
		newOutstandingAmount = 0 // Ensure it doesn't go negative
	}

	updateData := map[string]interface{}{
		"outstanding_amount": newOutstandingAmount,
		"status":             loanStatus,
	}
	_, _, err = s.db.From("loans").Update(updateData, "", "").Eq("id", loanID).Execute()
	if err != nil {
		return fmt.Errorf("failed to update loan status: %w", err)
	}

	// 4. Update the on-chain representation (Hedera NFT)
	hederaClient := s.bcClients.GetHederaClient()
	if hederaClient != nil && loan.OnchainID != "" {
		// The OnchainID should store the TokenID and SerialNumber, e.g., "0.0.12345/1"
		// For this implementation, we'll assume OnchainID is just the TokenID for simplicity.
		// A real implementation would need to parse this.

		// Create new metadata for the NFT
		newMetadata, err := json.Marshal(map[string]interface{}{
			"loanId":             loanID,
			"outstanding_amount": newOutstandingAmount,
			"status":             loanStatus,
		})
		if err != nil {
			log.Error().Err(err).Msg("Failed to create new NFT metadata")
			// We continue even if metadata fails, as the DB update is the source of truth
		} else {
			// A serial number of 1 is assumed for this single-mint token.
			err = hederaClient.UpdateLoanNFTStatus(ctx, loan.OnchainID, 1, newMetadata)
			if err != nil {
				// Log the error but don't fail the transaction.
				// On-chain updates can be retried or reconciled later.
				log.Error().Err(err).Msg("Failed to update on-chain loan NFT status")
			}
		}
	}

	log.Info().Str("loanId", loanID).Msg("Successfully processed repayment")
	return nil
}
