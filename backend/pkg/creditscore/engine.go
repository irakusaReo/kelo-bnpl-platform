package creditscore

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"time"

	"kelo-backend/pkg/blockchain"
	"kelo-backend/pkg/config"
	"kelo-backend/pkg/models"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// CreditScoreEngine handles credit scoring calculations and data integration
type CreditScoreEngine struct {
	db             *gorm.DB
	blockchain     *blockchain.Clients
	config         *config.Config
	externalAPIs   *ExternalAPIs
	didResolver    *DIDResolver
	hcsAnalyzer    *HCSAnalyzer
}

// ExternalAPIs handles integration with off-chain data sources
type ExternalAPIs struct {
	mpesaClient     *MpesaClient
	bankClient      *BankClient
	crbClient       *CRBClient
	payslipClient   *PayslipClient
}

// DIDResolver handles Hedera DID profile resolution
type DIDResolver struct {
	blockchain *blockchain.Clients
}

// HCSAnalyzer handles Hedera Consensus Service message analysis
type HCSAnalyzer struct {
	blockchain *blockchain.Clients
	config     HCSAnalyzerConfig
}

// ScoringFactors represents the factors that contribute to a credit score
type ScoringFactors struct {
	OnChainHistory      float64 `json:"on_chain_history"`
	RepaymentBehavior   float64 `json:"repayment_behavior"`
	AccountAge          float64 `json:"account_age"`
	IncomeStability     float64 `json:"income_stability"`
	DebtToIncomeRatio   float64 `json:"debt_to_income_ratio"`
	CreditUtilization   float64 `json:"credit_utilization"`
	PaymentHistory      float64 `json:"payment_history"`
	ExternalData        float64 `json:"external_data"`
	DIDVerification     float64 `json:"did_verification"`
}

// CreditScoreRequest represents a request to calculate a credit score
type CreditScoreRequest struct {
	UserID     string `json:"user_id" validate:"required"`
	IncludeMpesa    bool `json:"include_mpesa"`
	IncludeBank     bool `json:"include_bank"`
	IncludeCRB      bool `json:"include_crb"`
	IncludePayslip  bool `json:"include_payslip"`
	ForceRecalculate bool `json:"force_recalculate"`
}

// CreditScoreResponse represents the response from credit score calculation
type CreditScoreResponse struct {
	UserID         string         `json:"user_id"`
	Score          int            `json:"score"`
	PreviousScore  int            `json:"previous_score"`
	MaxScore       int            `json:"max_score"`
	Rating         string         `json:"rating"`
	Factors        ScoringFactors `json:"factors"`
	DataSource     string         `json:"data_source"`
	ValidUntil     time.Time      `json:"valid_until"`
	UpdateReason   string         `json:"update_reason"`
	Recommendations []string      `json:"recommendations"`
}

// MpesaStatement represents M-Pesa transaction data
type MpesaStatement struct {
	AccountNumber    string    `json:"account_number"`
	Transactions    []MpesaTransaction `json:"transactions"`
	PeriodStart     time.Time `json:"period_start"`
	PeriodEnd       time.Time `json:"period_end"`
	TotalInflow     float64   `json:"total_inflow"`
	TotalOutflow    float64   `json:"total_outflow"`
	NetFlow         float64   `json:"net_flow"`
}

// MpesaTransaction represents an individual M-Pesa transaction
type MpesaTransaction struct {
	TransactionID   string    `json:"transaction_id"`
	Timestamp       time.Time `json:"timestamp"`
	Amount          float64   `json:"amount"`
	Type            string    `json:"type"` // sent, received, payment, etc.
	Counterparty    string    `json:"counterparty"`
	Reference       string    `json:"reference"`
}

// BankStatement represents bank account statement data
type BankStatement struct {
	AccountNumber    string    `json:"account_number"`
	BankName        string    `json:"bank_name"`
	Transactions    []BankTransaction `json:"transactions"`
	Balance         float64   `json:"balance"`
	PeriodStart     time.Time `json:"period_start"`
	PeriodEnd       time.Time `json:"period_end"`
}

// BankTransaction represents an individual bank transaction
type BankTransaction struct {
	TransactionID   string    `json:"transaction_id"`
	Timestamp       time.Time `json:"timestamp"`
	Amount          float64   `json:"amount"`
	Type            string    `json:"type"` // debit, credit
	Description     string    `json:"description"`
	Category        string    `json:"category"`
}

// CRBReport represents Credit Reference Bureau report
type CRBReport struct {
	CustomerID      string    `json:"customer_id"`
	Score           int       `json:"score"`
	Status          string    `json:"status"` // good, fair, poor
	Loans           []CRBLoan `json:"loans"`
	Enquiries       []CRBEnquiry `json:"enquiries"`
	Judgments       []CRBJudgment `json:"judgments"`
	LastUpdated     time.Time `json:"last_updated"`
}

// CRBLoan represents a loan in CRB report
type CRBLoan struct {
	Lender          string    `json:"lender"`
	Amount          float64   `json:"amount"`
	Status          string    `json:"status"` // active, closed, defaulted
	OpenDate        time.Time `json:"open_date"`
	CloseDate       *time.Time `json:"close_date"`
	PaymentHistory  string    `json:"payment_history"`
}

// CRBEnquiry represents a credit enquiry
type CRBEnquiry struct {
	Enquirer        string    `json:"enquirer"`
	EnquiryDate     time.Time `json:"enquiry_date"`
	Purpose         string    `json:"purpose"`
	Amount          float64   `json:"amount"`
}

// CRBJudgment represents a court judgment
type CRBJudgment struct {
	Court           string    `json:"court"`
	JudgmentDate    time.Time `json:"judgment_date"`
	Amount          float64   `json:"amount"`
	Status          string    `json:"status"`
	Plaintiff       string    `json:"plaintiff"`
}

// Payslip represents employee payslip data
type Payslip struct {
	EmployeeID      string    `json:"employee_id"`
	Employer        string    `json:"employer"`
	Period          string    `json:"period"`
	BasicSalary     float64   `json:"basic_salary"`
	GrossSalary     float64   `json:"gross_salary"`
	NetSalary       float64   `json:"net_salary"`
	Deductions      []Deduction `json:"deductions"`
	Allowances      []Allowance `json:"allowances"`
	PayDate         time.Time `json:"pay_date"`
}

// Deduction represents a payslip deduction
type Deduction struct {
	Type            string  `json:"type"`
	Amount          float64 `json:"amount"`
	Description     string  `json:"description"`
}

// Allowance represents a payslip allowance
type Allowance struct {
	Type            string  `json:"type"`
	Amount          float64 `json:"amount"`
	Description     string  `json:"description"`
}

// NewCreditScoreEngine creates a new credit score engine instance
func NewCreditScoreEngine(db *gorm.DB, blockchain *blockchain.Clients, cfg *config.Config) *CreditScoreEngine {
	engine := &CreditScoreEngine{
		db:         db,
		blockchain: blockchain,
		config:     cfg,
	}

	// Initialize external APIs
	engine.externalAPIs = &ExternalAPIs{
		mpesaClient:   NewMpesaClient(cfg.MpesaAPIKey, cfg.MpesaSecret),
		bankClient:    NewBankClient(),
		crbClient:     NewCRBClient(),
		payslipClient: NewPayslipClient(),
	}

	// Initialize DID resolver
	engine.didResolver = &DIDResolver{
		blockchain: blockchain,
	}

	// Initialize HCS analyzer
	engine.hcsAnalyzer = &HCSAnalyzer{
		blockchain: blockchain,
	}

	return engine
}

// CalculateCreditScore calculates a comprehensive credit score for a user
func (e *CreditScoreEngine) CalculateCreditScore(ctx context.Context, req CreditScoreRequest) (*CreditScoreResponse, error) {
	// Check if we have a recent valid score
	if !req.ForceRecalculate {
		if recentScore, err := e.getRecentValidScore(req.UserID); err == nil {
			return recentScore, nil
		}
	}

	// Get user data
	var user models.User
	if err := e.db.First(&user, "id = ?", req.UserID).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Initialize scoring factors
	factors := ScoringFactors{}

	// Calculate on-chain history score
	onChainScore, err := e.calculateOnChainHistoryScore(ctx, &user)
	if err != nil {
		log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to calculate on-chain history score")
	} else {
		factors.OnChainHistory = onChainScore
	}

	// Calculate repayment behavior score
	repaymentScore, err := e.calculateRepaymentBehaviorScore(ctx, &user)
	if err != nil {
		log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to calculate repayment behavior score")
	} else {
		factors.RepaymentBehavior = repaymentScore
	}

	// Calculate account age score
	accountAgeScore := e.calculateAccountAgeScore(&user)
	factors.AccountAge = accountAgeScore

	// Calculate external data scores
	var externalDataScore float64
	externalDataCount := 0

	if req.IncludeMpesa {
		mpesaScore, err := e.calculateMpesaScore(ctx, &user)
		if err != nil {
			log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to calculate M-Pesa score")
		} else {
			externalDataScore += mpesaScore
			externalDataCount++
		}
	}

	if req.IncludeBank {
		bankScore, err := e.calculateBankScore(ctx, &user)
		if err != nil {
			log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to calculate bank score")
		} else {
			externalDataScore += bankScore
			externalDataCount++
		}
	}

	if req.IncludeCRB {
		crbScore, err := e.calculateCRBScore(ctx, &user)
		if err != nil {
			log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to calculate CRB score")
		} else {
			externalDataScore += crbScore
			externalDataCount++
		}
	}

	if req.IncludePayslip {
		payslipScore, err := e.calculatePayslipScore(ctx, &user)
		if err != nil {
			log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to calculate payslip score")
		} else {
			externalDataScore += payslipScore
			externalDataCount++
		}
	}

	if externalDataCount > 0 {
		factors.ExternalData = externalDataScore / float64(externalDataCount)
	}

	// Calculate DID verification score
	didScore, err := e.calculateDIDVerificationScore(ctx, &user)
	if err != nil {
		log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to calculate DID verification score")
	} else {
		factors.DIDVerification = didScore
	}

	// Calculate final score
	finalScore := e.calculateFinalScore(factors)

	// Get previous score
	var previousScore int
	var creditScore models.CreditScore
	if err := e.db.Where("user_id = ?", req.UserID).Order("created_at DESC").First(&creditScore).Error; err == nil {
		previousScore = creditScore.Score
	}

	// Determine data source
	dataSource := "on_chain"
	if req.IncludeMpesa || req.IncludeBank || req.IncludeCRB || req.IncludePayslip {
		dataSource = "combined"
	}

	// Create response
	response := &CreditScoreResponse{
		UserID:        req.UserID,
		Score:         finalScore,
		PreviousScore: previousScore,
		MaxScore:      850,
		Rating:        e.getScoreRating(finalScore),
		Factors:       factors,
		DataSource:    dataSource,
		ValidUntil:    time.Now().Add(30 * 24 * time.Hour), // Valid for 30 days
		UpdateReason:  "Regular credit score calculation",
		Recommendations: e.generateRecommendations(factors, finalScore),
	}

	// Save score to database
	if err := e.saveCreditScore(&user, response); err != nil {
		log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to save credit score")
	}

	return response, nil
}

// calculateOnChainHistoryScore calculates score based on on-chain transaction history
func (e *CreditScoreEngine) calculateOnChainHistoryScore(ctx context.Context, user *models.User) (float64, error) {
	if user.WalletAddress == "" {
		return 0.0, nil
	}

	// Get user's blockchain transactions
	var transactions []models.Transaction
	if err := e.db.Where("user_id = ?", user.ID).Find(&transactions).Error; err != nil {
		return 0.0, fmt.Errorf("failed to get transactions: %w", err)
	}

	if len(transactions) == 0 {
		return 0.0, nil
	}

	score := 0.0

	// Score based on transaction volume and consistency
	successfulTransactions := 0
	totalTransactions := len(transactions)
	
	for _, tx := range transactions {
		if tx.Status == "confirmed" {
			successfulTransactions++
		}
	}

	// Transaction success rate (30% of score)
	successRate := float64(successfulTransactions) / float64(totalTransactions)
	score += successRate * 30.0

	// Transaction frequency (20% of score)
	// More consistent transactions indicate better financial behavior
	transactionFrequency := e.calculateTransactionFrequency(transactions)
	score += transactionFrequency * 20.0

	// Transaction diversity (20% of score)
	// Different types of transactions show financial sophistication
	diversityScore := e.calculateTransactionDiversity(transactions)
	score += diversityScore * 20.0

	// Account age on blockchain (15% of score)
	accountAgeScore := e.calculateBlockchainAccountAge(user)
	score += accountAgeScore * 15.0

	// No suspicious activity (15% of score)
	suspiciousActivityScore := e.calculateSuspiciousActivityScore(transactions)
	score += suspiciousActivityScore * 15.0

	return math.Min(score, 100.0), nil
}

// calculateRepaymentBehaviorScore calculates score based on loan repayment history
func (e *CreditScoreEngine) calculateRepaymentBehaviorScore(ctx context.Context, user *models.User) (float64, error) {
	// Get user's loans
	var loans []models.Loan
	if err := e.db.Where("user_id = ?", user.ID).Find(&loans).Error; err != nil {
		return 0.0, fmt.Errorf("failed to get loans: %w", err)
	}

	if len(loans) == 0 {
		// No loan history - neutral score
		return 50.0, nil
	}

	score := 100.0 // Start with perfect score

	// Deduct points for late payments
	var repayments []models.Repayment
	if err := e.db.Joins("JOIN loans ON repayments.loan_id = loans.id").
		Where("loans.user_id = ?", user.ID).Find(&repayments).Error; err != nil {
		return 0.0, fmt.Errorf("failed to get repayments: %w", err)
	}

	latePayments := 0
	for _, repayment := range repayments {
		if repayment.Status == "failed" {
			latePayments++
			score -= 10.0 // Deduct 10 points for each late payment
		}
	}

	// Check for defaulted loans
	defaultedLoans := 0
	for _, loan := range loans {
		if loan.Status == "defaulted" {
			defaultedLoans++
			score -= 25.0 // Deduct 25 points for each defaulted loan
		}
	}

	// Check for loans paid on time
	onTimePayments := 0
	for _, loan := range loans {
		if loan.Status == "repaid" && loan.RepaidAt != nil {
			if loan.RepaidAt.Before(loan.DueDate) || loan.RepaidAt.Equal(loan.DueDate) {
				onTimePayments++
			}
		}
	}

	// Bonus for on-time payments
	score += float64(onTimePayments) * 5.0

	// Ensure score doesn't go below 0
	return math.Max(score, 0.0), nil
}

// calculateAccountAgeScore calculates score based on account age
func (e *CreditScoreEngine) calculateAccountAgeScore(user *models.User) float64 {
	accountAge := time.Since(user.CreatedAt)
	years := accountAge.Hours() / (24 * 365.25)

	// Score based on account age (max 100 points)
	if years >= 5 {
		return 100.0
	} else if years >= 3 {
		return 80.0
	} else if years >= 2 {
		return 60.0
	} else if years >= 1 {
		return 40.0
	} else if years >= 0.5 {
		return 20.0
	} else {
		return 10.0
	}
}

// calculateMpesaScore calculates score based on M-Pesa transaction history
func (e *CreditScoreEngine) calculateMpesaScore(ctx context.Context, user *models.User) (float64, error) {
	if user.Phone == "" {
		return 0.0, nil
	}

	// Get M-Pesa statement from external API
	statement, err := e.externalAPIs.mpesaClient.GetStatement(ctx, user.Phone)
	if err != nil {
		return 0.0, fmt.Errorf("failed to get M-Pesa statement: %w", err)
	}

	if statement == nil || len(statement.Transactions) == 0 {
		return 0.0, nil
	}

	score := 0.0

	// Score based on transaction consistency (30%)
	consistencyScore := e.calculateMpesaConsistency(statement)
	score += consistencyScore * 0.3

	// Score based on positive cash flow (25%)
	cashFlowScore := e.calculateMpesaCashFlow(statement)
	score += cashFlowScore * 0.25

	// Score based on transaction frequency (20%)
	frequencyScore := e.calculateMpesaFrequency(statement)
	score += frequencyScore * 0.2

	// Score based on transaction diversity (15%)
	diversityScore := e.calculateMpesaDiversity(statement)
	score += diversityScore * 0.15

	// Score based on no suspicious activity (10%)
	suspiciousScore := e.calculateMpesaSuspiciousActivity(statement)
	score += suspiciousScore * 0.1

	return math.Min(score, 100.0), nil
}

// calculateBankScore calculates score based on bank statement data
func (e *CreditScoreEngine) calculateBankScore(ctx context.Context, user *models.User) (float64, error) {
	// Note: In a real implementation, you would need to get bank account information
	// This is a placeholder implementation
	return 50.0, nil
}

// calculateCRBScore calculates score based on Credit Reference Bureau data
func (e *CreditScoreEngine) calculateCRBScore(ctx context.Context, user *models.User) (float64, error) {
	// Note: In a real implementation, you would need user's national ID or other identifier
	// This is a placeholder implementation
	return 50.0, nil
}

// calculatePayslipScore calculates score based on payslip data
func (e *CreditScoreEngine) calculatePayslipScore(ctx context.Context, user *models.User) (float64, error) {
	// Note: In a real implementation, you would need employment information
	// This is a placeholder implementation
	return 50.0, nil
}

// calculateDIDVerificationScore calculates score based on DID verification status
func (e *CreditScoreEngine) calculateDIDVerificationScore(ctx context.Context, user *models.User) (float64, error) {
	if user.DID == "" {
		return 0.0, nil
	}

	// Verify DID on Hedera blockchain
	isVerified, err := e.didResolver.VerifyDID(ctx, user.DID)
	if err != nil {
		return 0.0, fmt.Errorf("failed to verify DID: %w", err)
	}

	if isVerified {
		return 100.0, nil
	}

	return 0.0, nil
}

// calculateFinalScore calculates the final credit score from individual factors
func (e *CreditScoreEngine) calculateFinalScore(factors ScoringFactors) int {
	// Weight each factor
	weights := map[string]float64{
		"on_chain_history":    0.25,
		"repayment_behavior":  0.30,
		"account_age":         0.10,
		"external_data":       0.20,
		"did_verification":    0.15,
	}

	// Calculate weighted score
	weightedScore := factors.OnChainHistory*weights["on_chain_history"] +
		factors.RepaymentBehavior*weights["repayment_behavior"] +
		factors.AccountAge*weights["account_age"] +
		factors.ExternalData*weights["external_data"] +
		factors.DIDVerification*weights["did_verification"]

	// Convert to 850-point scale
	finalScore := int((weightedScore / 100.0) * 850)

	// Ensure score is within valid range
	if finalScore < 300 {
		finalScore = 300
	} else if finalScore > 850 {
		finalScore = 850
	}

	return finalScore
}

// getScoreRating returns the rating based on score
func (e *CreditScoreEngine) getScoreRating(score int) string {
	if score >= 750 {
		return "Excellent"
	} else if score >= 700 {
		return "Good"
	} else if score >= 650 {
		return "Fair"
	} else if score >= 600 {
		return "Poor"
	} else {
		return "Very Poor"
	}
}

// generateRecommendations generates recommendations based on scoring factors
func (e *CreditScoreEngine) generateRecommendations(factors ScoringFactors, score int) []string {
	var recommendations []string

	if factors.OnChainHistory < 70 {
		recommendations = append(recommendations, "Increase on-chain transaction activity to improve your score")
	}

	if factors.RepaymentBehavior < 80 {
		recommendations = append(recommendations, "Maintain consistent loan repayment history")
	}

	if factors.ExternalData < 60 {
		recommendations = append(recommendations, "Connect more financial data sources for better assessment")
	}

	if factors.DIDVerification < 100 {
		recommendations = append(recommendations, "Complete DID verification to increase trust score")
	}

	if score < 650 {
		recommendations = append(recommendations, "Consider smaller loan amounts to build credit history")
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Maintain current financial behavior to sustain good credit score")
	}

	return recommendations
}

// saveCreditScore saves the credit score to database
func (e *CreditScoreEngine) saveCreditScore(user *models.User, response *CreditScoreResponse) error {
	// Convert factors to JSON
	factorsJSON, err := json.Marshal(response.Factors)
	if err != nil {
		return fmt.Errorf("failed to marshal factors: %w", err)
	}

	creditScore := models.CreditScore{
		UserID:        user.ID,
		Score:         response.Score,
		PreviousScore: response.PreviousScore,
		MaxScore:      response.MaxScore,
		Factors:       string(factorsJSON),
		UpdateReason:  response.UpdateReason,
		DataSource:    response.DataSource,
		ValidUntil:    response.ValidUntil,
	}

	return e.db.Create(&creditScore).Error
}

// getRecentValidScore gets the most recent valid credit score
func (e *CreditScoreEngine) getRecentValidScore(userID string) (*CreditScoreResponse, error) {
	var creditScore models.CreditScore
	if err := e.db.Where("user_id = ? AND valid_until > ?", userID, time.Now()).
		Order("created_at DESC").First(&creditScore).Error; err != nil {
		return nil, err
	}

	// Parse factors
	var factors ScoringFactors
	if err := json.Unmarshal([]byte(creditScore.Factors), &factors); err != nil {
		return nil, fmt.Errorf("failed to unmarshal factors: %w", err)
	}

	return &CreditScoreResponse{
		UserID:        creditScore.UserID,
		Score:         creditScore.Score,
		PreviousScore: creditScore.PreviousScore,
		MaxScore:      creditScore.MaxScore,
		Rating:        e.getScoreRating(creditScore.Score),
		Factors:       factors,
		DataSource:    creditScore.DataSource,
		ValidUntil:    creditScore.ValidUntil,
		UpdateReason:  creditScore.UpdateReason,
		Recommendations: e.generateRecommendations(factors, creditScore.Score),
	}, nil
}

// Helper functions for score calculations

func (e *CreditScoreEngine) calculateTransactionFrequency(transactions []models.Transaction) float64 {
	if len(transactions) == 0 {
		return 0.0
	}

	// Sort transactions by date
	sort.Slice(transactions, func(i, j int) bool {
		return transactions[i].CreatedAt.Before(transactions[j].CreatedAt)
	})

	// Calculate time span
	timeSpan := transactions[len(transactions)-1].CreatedAt.Sub(transactions[0].CreatedAt)
	if timeSpan == 0 {
		return 0.0
	}

	// Calculate frequency (transactions per month)
	frequency := float64(len(transactions)) / (timeSpan.Hours() / (24 * 30))

	// Normalize to 0-100 scale
	if frequency >= 10 {
		return 100.0
	} else if frequency >= 5 {
		return 80.0
	} else if frequency >= 2 {
		return 60.0
	} else if frequency >= 1 {
		return 40.0
	} else {
		return 20.0
	}
}

func (e *CreditScoreEngine) calculateTransactionDiversity(transactions []models.Transaction) float64 {
	if len(transactions) == 0 {
		return 0.0
	}

	// Count different transaction types
	types := make(map[string]int)
	for _, tx := range transactions {
		types[tx.Type]++
	}

	// Calculate diversity based on number of different types
	diversity := len(types)
	if diversity >= 4 {
		return 100.0
	} else if diversity >= 3 {
		return 75.0
	} else if diversity >= 2 {
		return 50.0
	} else {
		return 25.0
	}
}

func (e *CreditScoreEngine) calculateBlockchainAccountAge(user *models.User) float64 {
	if user.WalletAddress == "" {
		return 0.0
	}

	// In a real implementation, you would get the first transaction date from blockchain
	// For now, use account creation date as proxy
	accountAge := time.Since(user.CreatedAt)
	years := accountAge.Hours() / (24 * 365.25)

	if years >= 3 {
		return 100.0
	} else if years >= 2 {
		return 80.0
	} else if years >= 1 {
		return 60.0
	} else if years >= 0.5 {
		return 40.0
	} else {
		return 20.0
	}
}

func (e *CreditScoreEngine) calculateSuspiciousActivityScore(transactions []models.Transaction) float64 {
	// In a real implementation, you would analyze patterns for suspicious activity
	// For now, assume no suspicious activity
	return 100.0
}

func (e *CreditScoreEngine) calculateMpesaConsistency(statement *MpesaStatement) float64 {
	if len(statement.Transactions) == 0 {
		return 0.0
	}

	// Calculate consistency based on regular transaction patterns
	// This is a simplified implementation
	transactionCount := len(statement.Transactions)
	periodDays := statement.PeriodEnd.Sub(statement.PeriodStart).Hours() / 24
	
	if periodDays == 0 {
		return 0.0
	}

	avgTransactionsPerDay := float64(transactionCount) / periodDays
	
	// Score based on consistency (regular transactions are good)
	if avgTransactionsPerDay >= 1.0 {
		return 100.0
	} else if avgTransactionsPerDay >= 0.5 {
		return 80.0
	} else if avgTransactionsPerDay >= 0.2 {
		return 60.0
	} else {
		return 40.0
	}
}

func (e *CreditScoreEngine) calculateMpesaCashFlow(statement *MpesaStatement) float64 {
	if statement.NetFlow <= 0 {
		return 0.0
	}

	// Score based on positive net cash flow
	// Higher positive cash flow is better
	if statement.NetFlow >= 100000 { // 100K KES
		return 100.0
	} else if statement.NetFlow >= 50000 {
		return 80.0
	} else if statement.NetFlow >= 20000 {
		return 60.0
	} else if statement.NetFlow >= 10000 {
		return 40.0
	} else {
		return 20.0
	}
}

func (e *CreditScoreEngine) calculateMpesaFrequency(statement *MpesaStatement) float64 {
	if len(statement.Transactions) == 0 {
		return 0.0
	}

	periodDays := statement.PeriodEnd.Sub(statement.PeriodStart).Hours() / 24
	if periodDays == 0 {
		return 0.0
	}

	transactionsPerDay := float64(len(statement.Transactions)) / periodDays
	
	if transactionsPerDay >= 2.0 {
		return 100.0
	} else if transactionsPerDay >= 1.0 {
		return 80.0
	} else if transactionsPerDay >= 0.5 {
		return 60.0
	} else {
		return 40.0
	}
}

func (e *CreditScoreEngine) calculateMpesaDiversity(statement *MpesaStatement) float64 {
	if len(statement.Transactions) == 0 {
		return 0.0
	}

	// Count different transaction types
	types := make(map[string]int)
	for _, tx := range statement.Transactions {
		types[tx.Type]++
	}

	diversity := len(types)
	if diversity >= 4 {
		return 100.0
	} else if diversity >= 3 {
		return 75.0
	} else if diversity >= 2 {
		return 50.0
	} else {
		return 25.0
	}
}

func (e *CreditScoreEngine) calculateMpesaSuspiciousActivity(statement *MpesaStatement) float64 {
	// In a real implementation, you would analyze for suspicious patterns
	// For now, assume no suspicious activity
	return 100.0
}