package creditscore

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"kelo-backend/pkg/blockchain"
	"kelo-backend/pkg/config"
	"kelo-backend/pkg/models"

	"github.com/stretchr/testify/assert"
	"github.com/supabase/postgrest-go"
)

// setupTestServer configures a mock HTTP server to simulate the Supabase (PostgREST) API.
// It returns the server instance and a CreditScoreEngine configured to use the mock server.
func setupTestServer(t *testing.T) (*httptest.Server, *CreditScoreEngine) {
	// This handler simulates the PostgREST API by returning JSON based on the request path.
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/profiles":
			// Mock response for fetching a user profile.
			userProfile := []models.Profile{
				{
					ID:            "test_user_001",
					CreatedAt:     time.Now().Add(-370 * 24 * time.Hour), // ~1 year old
					WalletAddress: "0x1234567890123456789012345678901234567890",
					Phone:         "+254712345678",
					DID:           "did:hedera:testnet:0.0.1234567",
				},
			}
			json.NewEncoder(w).Encode(userProfile)
		case "/transactions":
			// Mock response for fetching on-chain transactions.
			transactions := []models.Transaction{
				{UserID: "test_user_001", Type: "deposit", Status: "confirmed", CreatedAt: time.Now().Add(-25 * 24 * time.Hour)},
				{UserID: "test_user_001", Type: "withdrawal", Status: "confirmed", CreatedAt: time.Now().Add(-20 * 24 * time.Hour)},
				{UserID: "test_user_001", Type: "disbursement", Status: "confirmed", CreatedAt: time.Now().Add(-15 * 24 * time.Hour)},
			}
			json.NewEncoder(w).Encode(transactions)
		case "/loans":
			// Mock response for fetching loans.
			loans := []models.Loan{
				{UserID: "test_user_001", Status: "paid_off", DueDate: time.Now().Add(-5 * 24 * time.Hour), RepaidAt: &[]time.Time{time.Now().Add(-6 * 24 * time.Hour)}[0]},
				{UserID: "test_user_001", Status: "active", DueDate: time.Now().Add(15 * 24 * time.Hour)},
			}
			json.NewEncoder(w).Encode(loans)
		case "/credit_scores":
			if r.Method == http.MethodPost {
				// Mock response for inserting a new credit score.
				w.WriteHeader(http.StatusCreated)
				fmt.Fprintln(w, `[]`) // PostgREST returns an empty array on successful insert.
			} else {
				// Mock response for fetching existing credit scores.
				scores := []models.CreditScore{
					{Score: 700, UserID: "test_user_001", Factors: `{}`, ValidUntil: time.Now().Add(15 * 24 * time.Hour)},
				}
				json.NewEncoder(w).Encode(scores)
			}
		default:
			http.NotFound(w, r)
		}
	})

	server := httptest.NewServer(handler)
	client := postgrest.NewClient(server.URL, "", nil)
	cfg := &config.Config{MpesaAPIKey: "test_key", MpesaSecret: "test_secret"}
	engine := NewCreditScoreEngine(client, &blockchain.Clients{}, cfg)

	return server, engine
}

// TestCreditScoreEngine contains the suite of tests for the credit score engine.
func TestCreditScoreEngine(t *testing.T) {
	server, engine := setupTestServer(t)
	defer server.Close()

	// Test case for the main credit score calculation logic.
	t.Run("CalculateCreditScore", func(t *testing.T) {
		req := CreditScoreRequest{UserID: "test_user_001", ForceRecalculate: true}
		response, err := engine.CalculateCreditScore(context.Background(), req)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, "test_user_001", response.UserID)
		assert.GreaterOrEqual(t, response.Score, 300)
		assert.LessOrEqual(t, response.Score, 850)
	})

	// Test case for on-chain history scoring.
	t.Run("CalculateOnChainHistoryScore", func(t *testing.T) {
		user := &models.Profile{ID: "test_user_001", WalletAddress: "0x123", CreatedAt: time.Now()}
		score, err := engine.calculateOnChainHistoryScore(context.Background(), user)
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, score, 0.0)
	})

	// Test case for repayment behavior scoring.
	t.Run("CalculateRepaymentBehaviorScore", func(t *testing.T) {
		user := &models.Profile{ID: "test_user_001"}
		score, err := engine.calculateRepaymentBehaviorScore(context.Background(), user)
		assert.NoError(t, err)
		assert.GreaterOrEqual(t, score, 0.0)
	})

	// Test case for account age scoring.
	t.Run("CalculateAccountAgeScore", func(t *testing.T) {
		user := &models.Profile{CreatedAt: time.Now().Add(-370 * 24 * time.Hour)}
		score := engine.calculateAccountAgeScore(user)
		assert.Equal(t, 40.0, score)
	})

	// Test case for the final score calculation logic.
	t.Run("CalculateFinalScore", func(t *testing.T) {
		factors := ScoringFactors{OnChainHistory: 80, RepaymentBehavior: 90, AccountAge: 60, ExternalData: 70, DIDVerification: 85}
		finalScore := engine.calculateFinalScore(factors)
		assert.GreaterOrEqual(t, finalScore, 300)
		assert.LessOrEqual(t, finalScore, 850)
	})

	// Test case for score rating logic.
	t.Run("GetScoreRating", func(t *testing.T) {
		assert.Equal(t, "Excellent", engine.getScoreRating(800))
		assert.Equal(t, "Good", engine.getScoreRating(720))
	})

	// Test case for recommendation generation.
	t.Run("GenerateRecommendations", func(t *testing.T) {
		factors := ScoringFactors{OnChainHistory: 50, RepaymentBehavior: 70}
		recommendations := engine.generateRecommendations(factors, 550)
		assert.NotEmpty(t, recommendations)
		assert.Contains(t, recommendations, "Increase on-chain transaction activity to improve your score")
	})

	// Test case for saving a credit score.
	t.Run("SaveCreditScore", func(t *testing.T) {
		response := &CreditScoreResponse{UserID: "test_user_001", Score: 720}
		user := &models.Profile{ID: "test_user_001"}
		err := engine.saveCreditScore(user, response)
		assert.NoError(t, err)
	})

	// Test case for retrieving a recent valid score.
	t.Run("GetRecentValidScore", func(t *testing.T) {
		recentScore, err := engine.getRecentValidScore("test_user_001")
		assert.NoError(t, err)
		assert.NotNil(t, recentScore)
		assert.Equal(t, 700, recentScore.Score)
	})
}