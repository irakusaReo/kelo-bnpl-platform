package creditscore

import (
	"context"
	"fmt"
	"time"

	"kelo-backend/pkg/blockchain"
	"kelo-backend/pkg/config"
	"kelo-backend/pkg/models"

	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// CreditScoreService provides high-level credit scoring services
type CreditScoreService struct {
	engine         *CreditScoreEngine
	didResolver    *DIDResolver
	hcsAnalyzer    *HCSAnalyzer
	externalAPIs   *ExternalAPIs
	db             *gorm.DB
	blockchain     *blockchain.Clients
	config         *config.Config
}

// CreditScoreReport represents a comprehensive credit score report
type CreditScoreReport struct {
	UserID              string                 `json:"user_id"`
	CurrentScore        int                    `json:"current_score"`
	PreviousScore       int                    `json:"previous_score"`
	ScoreChange         int                    `json:"score_change"`
	Rating              string                 `json:"rating"`
	MaxScore            int                    `json:"max_score"`
	ValidUntil          time.Time              `json:"valid_until"`
	LastUpdated         time.Time              `json:"last_updated"`
	DataSource          string                 `json:"data_source"`
	Factors             ScoringFactors         `json:"factors"`
	Recommendations     []string               `json:"recommendations"`
	OnChainAnalysis     *OnChainAnalysis       `json:"on_chain_analysis,omitempty"`
	OffChainAnalysis    *OffChainAnalysis      `json:"off_chain_analysis,omitempty"`
	DIDAnalysis         *DIDAnalysis           `json:"did_analysis,omitempty"`
	HCSAnalysis         *HCSAnalytics           `json:"hcs_analysis,omitempty"`
	RiskAssessment      *RiskAssessment        `json:"risk_assessment,omitempty"`
	LoanEligibility     *LoanEligibility       `json:"loan_eligibility,omitempty"`
}

// OnChainAnalysis represents on-chain behavior analysis
type OnChainAnalysis struct {
	TotalTransactions    int                    `json:"total_transactions"`
	SuccessRate          float64                `json:"success_rate"`
	TransactionFrequency float64                `json:"transaction_frequency"`
	AccountAge           float64                `json:"account_age_years"`
	DiversityScore       float64                `json:"diversity_score"`
	LastActivity         time.Time              `json:"last_activity"`
	RiskFactors          []string               `json:"risk_factors"`
	Strengths            []string               `json:"strengths"`
}

// OffChainAnalysis represents off-chain data analysis
type OffChainAnalysis struct {
	MpesaAnalysis        *MpesaAnalysis         `json:"mpesa_analysis,omitempty"`
	BankAnalysis         *BankAnalysis          `json:"bank_analysis,omitempty"`
	CRBAnalysis          *CRBAnalysis           `json:"crb_analysis,omitempty"`
	PayslipAnalysis      *PayslipAnalysis       `json:"payslip_analysis,omitempty"`
	DataSources          []string               `json:"data_sources"`
	CompletenessScore    float64                `json:"completeness_score"`
}

// MpesaAnalysis represents M-Pesa transaction analysis
type MpesaAnalysis struct {
	TotalTransactions    int                    `json:"total_transactions"`
	TotalInflow          float64                `json:"total_inflow"`
	TotalOutflow         float64                `json:"total_outflow"`
	NetFlow              float64                `json:"net_flow"`
	AverageTransaction   float64                `json:"average_transaction"`
	ConsistencyScore     float64                `json:"consistency_score"`
	CashFlowScore        float64                `json:"cash_flow_score"`
	Period               string                 `json:"period"`
}

// BankAnalysis represents bank statement analysis
type BankAnalysis struct {
	AccountBalance       float64                `json:"account_balance"`
	TotalTransactions    int                    `json:"total_transactions"`
	RegularIncome        float64                `json:"regular_income"`
	RegularExpenses      float64                `json:"regular_expenses"`
	SavingsRate          float64                `json:"savings_rate"`
	AccountAge           float64                `json:"account_age_years"`
	BankName             string                 `json:"bank_name"`
}

// CRBAnalysis represents Credit Reference Bureau analysis
type CRBAnalysis struct {
	CRBScore             int                    `json:"crb_score"`
	Status               string                 `json:"status"`
	ActiveLoans          int                    `json:"active_loans"`
	ClosedLoans          int                    `json:"closed_loans"`
	DefaultedLoans       int                    `json:"defaulted_loans"`
	RecentEnquiries      int                    `json:"recent_enquiries"`
	Judgments            int                    `json:"judgments"`
	LastUpdated          time.Time              `json:"last_updated"`
}

// PayslipAnalysis represents payslip data analysis
type PayslipAnalysis struct {
	MonthlyIncome        float64                `json:"monthly_income"`
	GrossIncome          float64                `json:"gross_income"`
	NetIncome            float64                `json:"net_income"`
	TaxRate              float64                `json:"tax_rate"`
	DeductionRate        float64                `json:"deduction_rate"`
	EmploymentStability  float64                `json:"employment_stability"`
	Employer             string                 `json:"employer"`
	Period               string                 `json:"period"`
}

// DIDAnalysis represents DID profile analysis
type DIDAnalysis struct {
	IsVerified           bool                   `json:"is_verified"`
	VerificationLevel    string                 `json:"verification_level"`
	TrustScore           float64                `json:"trust_score"`
	IdentityVerified     bool                   `json:"identity_verified"`
	EmploymentVerified   bool                   `json:"employment_verified"`
	BankVerified         bool                   `json:"bank_verified"`
	Badges               []string               `json:"badges"`
	CreatedAt            time.Time              `json:"created_at"`
	LastUpdated          time.Time              `json:"last_updated"`
}

// RiskAssessment represents comprehensive risk assessment
type RiskAssessment struct {
	OverallRisk          float64                `json:"overall_risk"`
	CreditRisk           float64                `json:"credit_risk"`
	BehavioralRisk       float64                `json:"behavioral_risk"`
	FraudRisk            float64                `json:"fraud_risk"`
	MarketRisk           float64                `json:"market_risk"`
	RiskLevel            string                 `json:"risk_level"`
	RiskFactors          []RiskFactor           `json:"risk_factors"`
	MitigationStrategies []string               `json:"mitigation_strategies"`
}

// RiskFactor represents an individual risk factor
type RiskFactor struct {
	Type                 string                 `json:"type"`
	Category             string                 `json:"category"`
	Severity             string                 `json:"severity"`
	Description          string                 `json:"description"`
	Impact               float64                `json:"impact"`
	Likelihood           float64                `json:"likelihood"`
}

// LoanEligibility represents loan eligibility assessment
type LoanEligibility struct {
	IsEligible           bool                   `json:"is_eligible"`
	MaxLoanAmount        float64                `json:"max_loan_amount"`
	RecommendedAmount    float64                `json:"recommended_amount"`
	InterestRate         float64                `json:"interest_rate"`
	LoanDuration         int                    `json:"loan_duration_days"`
	RepaymentTerms       string                 `json:"repayment_terms"`
	EligibilityFactors   []EligibilityFactor   `json:"eligibility_factors"`
	Exclusions           []string               `json:"exclusions"`
}

// EligibilityFactor represents an eligibility factor
type EligibilityFactor struct {
	Factor               string                 `json:"factor"`
	Status               string                 `json:"status"`
	Weight               float64                `json:"weight"`
	Score                float64                `json:"score"`
	Description          string                 `json:"description"`
}

// NewCreditScoreService creates a new credit score service instance
func NewCreditScoreService(db *gorm.DB, blockchain *blockchain.Clients, cfg *config.Config) *CreditScoreService {
	engine := NewCreditScoreEngine(db, blockchain, cfg)
	
	service := &CreditScoreService{
		engine:       engine,
		didResolver:  engine.didResolver,
		hcsAnalyzer:  engine.hcsAnalyzer,
		externalAPIs: engine.externalAPIs,
		db:           db,
		blockchain:   blockchain,
		config:       cfg,
	}

	return service
}

// GenerateCreditScoreReport generates a comprehensive credit score report
func (s *CreditScoreService) GenerateCreditScoreReport(ctx context.Context, userID string, includeDetailed bool) (*CreditScoreReport, error) {
	// Calculate basic credit score
	req := CreditScoreRequest{
		UserID:           userID,
		IncludeMpesa:     true,
		IncludeBank:      true,
		IncludeCRB:       true,
		IncludePayslip:   true,
		ForceRecalculate: true,
	}

	response, err := s.engine.CalculateCreditScore(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate credit score: %w", err)
	}

	// Get user data
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Create basic report
	report := &CreditScoreReport{
		UserID:         response.UserID,
		CurrentScore:   response.Score,
		PreviousScore:  response.PreviousScore,
		ScoreChange:    response.Score - response.PreviousScore,
		Rating:         response.Rating,
		MaxScore:       response.MaxScore,
		ValidUntil:     response.ValidUntil,
		LastUpdated:    time.Now(),
		DataSource:     response.DataSource,
		Factors:        response.Factors,
		Recommendations: response.Recommendations,
	}

	if includeDetailed {
		// Add detailed analyses
		if err := s.addDetailedAnalyses(ctx, &user, report); err != nil {
			log.Error().Err(err).Str("userID", userID).Msg("Failed to add detailed analyses")
		}
	}

	// Add risk assessment
	riskAssessment, err := s.generateRiskAssessment(ctx, &user, report)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to generate risk assessment")
	} else {
		report.RiskAssessment = riskAssessment
	}

	// Add loan eligibility
	loanEligibility, err := s.assessLoanEligibility(ctx, &user, report)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to assess loan eligibility")
	} else {
		report.LoanEligibility = loanEligibility
	}

	return report, nil
}

// addDetailedAnalyses adds detailed analyses to the credit report
func (s *CreditScoreService) addDetailedAnalyses(ctx context.Context, user *models.User, report *CreditScoreReport) error {
	// On-chain analysis
	onChainAnalysis, err := s.generateOnChainAnalysis(ctx, user)
	if err != nil {
		return fmt.Errorf("failed to generate on-chain analysis: %w", err)
	}
	report.OnChainAnalysis = onChainAnalysis

	// Off-chain analysis
	offChainAnalysis, err := s.generateOffChainAnalysis(ctx, user)
	if err != nil {
		return fmt.Errorf("failed to generate off-chain analysis: %w", err)
	}
	report.OffChainAnalysis = offChainAnalysis

	// DID analysis
	if user.DID != "" {
		didAnalysis, err := s.generateDIDAnalysis(ctx, user)
		if err != nil {
			return fmt.Errorf("failed to generate DID analysis: %w", err)
		}
		report.DIDAnalysis = didAnalysis
	}

	// HCS analysis
	hcsAnalysis, err := s.hcsAnalyzer.AnalyzeUserBehavior(ctx, user.ID)
	if err != nil {
		return fmt.Errorf("failed to generate HCS analysis: %w", err)
	}
	report.HCSAnalysis = hcsAnalysis

	return nil
}

// generateOnChainAnalysis generates on-chain behavior analysis
func (s *CreditScoreService) generateOnChainAnalysis(ctx context.Context, user *models.User) (*OnChainAnalysis, error) {
	if user.WalletAddress == "" {
		return &OnChainAnalysis{
			TotalTransactions: 0,
			SuccessRate:      0,
			RiskFactors:      []string{"No wallet address provided"},
		}, nil
	}

	// Get user's blockchain transactions
	var transactions []models.Transaction
	if err := s.db.Where("user_id = ?", user.ID).Find(&transactions).Error; err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}

	analysis := &OnChainAnalysis{
		TotalTransactions: len(transactions),
	}

	if len(transactions) == 0 {
		analysis.RiskFactors = append(analysis.RiskFactors, "No transaction history")
		return analysis, nil
	}

	// Calculate success rate
	successfulTransactions := 0
	for _, tx := range transactions {
		if tx.Status == "confirmed" {
			successfulTransactions++
		}
	}
	analysis.SuccessRate = float64(successfulTransactions) / float64(len(transactions)) * 100

	// Calculate transaction frequency
	analysis.TransactionFrequency = s.engine.calculateTransactionFrequency(transactions)

	// Calculate account age
	analysis.AccountAge = s.engine.calculateBlockchainAccountAge(user) / 20 // Convert to years

	// Calculate diversity score
	analysis.DiversityScore = s.engine.calculateTransactionDiversity(transactions)

	// Get last activity
	analysis.LastActivity = transactions[len(transactions)-1].CreatedAt

	// Identify risk factors and strengths
	if analysis.SuccessRate < 90 {
		analysis.RiskFactors = append(analysis.RiskFactors, "Low transaction success rate")
	}
	if analysis.TransactionFrequency < 40 {
		analysis.RiskFactors = append(analysis.RiskFactors, "Low transaction frequency")
	}
	if analysis.AccountAge < 1 {
		analysis.RiskFactors = append(analysis.RiskFactors, "New blockchain account")
	}

	if analysis.SuccessRate >= 95 {
		analysis.Strengths = append(analysis.Strengths, "High transaction success rate")
	}
	if analysis.TransactionFrequency >= 80 {
		analysis.Strengths = append(analysis.Strengths, "Consistent transaction activity")
	}
	if analysis.AccountAge >= 2 {
		analysis.Strengths = append(analysis.Strengths, "Established blockchain presence")
	}

	return analysis, nil
}

// generateOffChainAnalysis generates off-chain data analysis
func (s *CreditScoreService) generateOffChainAnalysis(ctx context.Context, user *models.User) (*OffChainAnalysis, error) {
	analysis := &OffChainAnalysis{
		DataSources: []string{},
	}

	dataSources := 0
	totalScore := 0.0

	// M-Pesa analysis
	if user.Phone != "" {
		mpesaAnalysis, err := s.generateMpesaAnalysis(ctx, user)
		if err == nil && mpesaAnalysis != nil {
			analysis.MpesaAnalysis = mpesaAnalysis
			analysis.DataSources = append(analysis.DataSources, "M-Pesa")
			dataSources++
			totalScore += 25.0 // Each data source contributes 25% to completeness
		}
	}

	// Bank analysis (placeholder - would need bank account info)
	bankAnalysis, err := s.generateBankAnalysis(ctx, user)
	if err == nil && bankAnalysis != nil {
		analysis.BankAnalysis = bankAnalysis
		analysis.DataSources = append(analysis.DataSources, "Bank")
		dataSources++
		totalScore += 25.0
	}

	// CRB analysis (placeholder - would need national ID)
	crbAnalysis, err := s.generateCRBAnalysis(ctx, user)
	if err == nil && crbAnalysis != nil {
		analysis.CRBAnalysis = crbAnalysis
		analysis.DataSources = append(analysis.DataSources, "CRB")
		dataSources++
		totalScore += 25.0
	}

	// Payslip analysis (placeholder - would need employment info)
	payslipAnalysis, err := s.generatePayslipAnalysis(ctx, user)
	if err == nil && payslipAnalysis != nil {
		analysis.PayslipAnalysis = payslipAnalysis
		analysis.DataSources = append(analysis.DataSources, "Payslip")
		dataSources++
		totalScore += 25.0
	}

	analysis.CompletenessScore = totalScore

	return analysis, nil
}

// generateMpesaAnalysis generates M-Pesa transaction analysis
func (s *CreditScoreService) generateMpesaAnalysis(ctx context.Context, user *models.User) (*MpesaAnalysis, error) {
	if user.Phone == "" {
		return nil, nil
	}

	// Get M-Pesa statement
	statement, err := s.externalAPIs.mpesaClient.GetStatement(ctx, user.Phone)
	if err != nil {
		return nil, fmt.Errorf("failed to get M-Pesa statement: %w", err)
	}

	if statement == nil || len(statement.Transactions) == 0 {
		return nil, nil
	}

	analysis := &MpesaAnalysis{
		TotalTransactions: len(statement.Transactions),
		TotalInflow:      statement.TotalInflow,
		TotalOutflow:     statement.TotalOutflow,
		NetFlow:          statement.NetFlow,
		Period:           fmt.Sprintf("%s to %s", statement.PeriodStart.Format("2006-01-02"), statement.PeriodEnd.Format("2006-01-02")),
	}

	// Calculate average transaction
	if len(statement.Transactions) > 0 {
		totalAmount := 0.0
		for _, tx := range statement.Transactions {
			totalAmount += tx.Amount
		}
		analysis.AverageTransaction = totalAmount / float64(len(statement.Transactions))
	}

	// Calculate consistency and cash flow scores
	analysis.ConsistencyScore = s.engine.calculateMpesaConsistency(statement)
	analysis.CashFlowScore = s.engine.calculateMpesaCashFlow(statement)

	return analysis, nil
}

// generateBankAnalysis generates bank statement analysis
func (s *CreditScoreService) generateBankAnalysis(ctx context.Context, user *models.User) (*BankAnalysis, error) {
	// Placeholder implementation
	// In a real implementation, you would need bank account information
	return &BankAnalysis{
		AccountBalance:  50000.0,
		TotalTransactions: 25,
		RegularIncome:   150000.0,
		RegularExpenses: 120000.0,
		SavingsRate:     20.0,
		AccountAge:      3.5,
		BankName:        "Equity Bank",
	}, nil
}

// generateCRBAnalysis generates CRB report analysis
func (s *CreditScoreService) generateCRBAnalysis(ctx context.Context, user *models.User) (*CRBAnalysis, error) {
	// Placeholder implementation
	// In a real implementation, you would need national ID or other identifier
	return &CRBAnalysis{
		CRBScore:        720,
		Status:          "Good",
		ActiveLoans:     2,
		ClosedLoans:     5,
		DefaultedLoans:  0,
		RecentEnquiries: 1,
		Judgments:       0,
		LastUpdated:     time.Now().Add(-30 * 24 * time.Hour),
	}, nil
}

// generatePayslipAnalysis generates payslip data analysis
func (s *CreditScoreService) generatePayslipAnalysis(ctx context.Context, user *models.User) (*PayslipAnalysis, error) {
	// Placeholder implementation
	// In a real implementation, you would need employment information
	return &PayslipAnalysis{
		MonthlyIncome:       150000.0,
		GrossIncome:         180000.0,
		NetIncome:           150000.0,
		TaxRate:             16.7,
		DeductionRate:       10.0,
		EmploymentStability: 95.0,
		Employer:           "Example Company Ltd",
		Period:             "2024-01",
	}, nil
}

// generateDIDAnalysis generates DID profile analysis
func (s *CreditScoreService) generateDIDAnalysis(ctx context.Context, user *models.User) (*DIDAnalysis, error) {
	if user.DID == "" {
		return nil, nil
	}

	// Get DID profile
	profile, err := s.didResolver.GetDIDProfile(ctx, user.DID)
	if err != nil {
		return nil, fmt.Errorf("failed to get DID profile: %w", err)
	}

	analysis := &DIDAnalysis{
		IsVerified:        profile.Verification.IsVerified,
		VerificationLevel: profile.Verification.VerificationLevel,
		TrustScore:       profile.Verification.TrustScore,
		IdentityVerified: profile.Identity.Verified,
		EmploymentVerified: profile.Employment.Status == "active",
		BankVerified:      len(profile.Financial.BankAccounts) > 0,
		Badges:           profile.Verification.Badges,
		CreatedAt:        profile.CreatedAt,
		LastUpdated:      profile.UpdatedAt,
	}

	return analysis, nil
}

// generateRiskAssessment generates comprehensive risk assessment
func (s *CreditScoreService) generateRiskAssessment(ctx context.Context, user *models.User, report *CreditScoreReport) (*RiskAssessment, error) {
	assessment := &RiskAssessment{}

	// Calculate credit risk based on score
	creditRisk := 100.0 - float64(report.CurrentScore)/850.0*100.0

	// Calculate behavioral risk from HCS analysis
	behavioralRisk := 0.0
	if report.HCSAnalysis != nil {
		behavioralRisk = report.HCSAnalysis.RiskScore
	}

	// Calculate fraud risk (simplified)
	fraudRisk := 0.0
	if report.DIDAnalysis != nil {
		if !report.DIDAnalysis.IsVerified {
			fraudRisk += 30.0
		}
		if report.DIDAnalysis.TrustScore < 70 {
			fraudRisk += 20.0
		}
	}

	// Calculate market risk (simplified)
	marketRisk := 10.0 // Base market risk

	// Calculate overall risk
	assessment.OverallRisk = (creditRisk*0.4 + behavioralRisk*0.3 + fraudRisk*0.2 + marketRisk*0.1)
	assessment.CreditRisk = creditRisk
	assessment.BehavioralRisk = behavioralRisk
	assessment.FraudRisk = fraudRisk
	assessment.MarketRisk = marketRisk

	// Determine risk level
	if assessment.OverallRisk >= 70 {
		assessment.RiskLevel = "High"
	} else if assessment.OverallRisk >= 40 {
		assessment.RiskLevel = "Medium"
	} else {
		assessment.RiskLevel = "Low"
	}

	// Add risk factors
	assessment.RiskFactors = []RiskFactor{
		{
			Type:        "credit",
			Category:    "score",
			Severity:    s.getSeverityLevel(creditRisk),
			Description: "Credit score based risk",
			Impact:      creditRisk,
			Likelihood:  100.0,
		},
		{
			Type:        "behavioral",
			Category:    "pattern",
			Severity:    s.getSeverityLevel(behavioralRisk),
			Description: "Behavioral pattern risk",
			Impact:      behavioralRisk,
			Likelihood:  80.0,
		},
	}

	// Add mitigation strategies
	if assessment.RiskLevel == "High" {
		assessment.MitigationStrategies = append(assessment.MitigationStrategies,
			"Require additional verification",
			"Reduce loan amount",
			"Shorter loan duration",
			"Higher interest rate",
		)
	} else if assessment.RiskLevel == "Medium" {
		assessment.MitigationStrategies = append(assessment.MitigationStrategies,
			"Standard verification process",
			"Moderate loan amount",
			"Standard loan terms",
		)
	} else {
		assessment.MitigationStrategies = append(assessment.MitigationStrategies,
			"Fast-track approval",
			"Preferred loan terms",
			"Lower interest rate",
		)
	}

	return assessment, nil
}

// assessLoanEligibility assesses loan eligibility
func (s *CreditScoreService) assessLoanEligibility(ctx context.Context, user *models.User, report *CreditScoreReport) (*LoanEligibility, error) {
	eligibility := &LoanEligibility{}

	// Basic eligibility based on credit score
	if report.CurrentScore >= 700 {
		eligibility.IsEligible = true
		eligibility.MaxLoanAmount = 1000000.0
		eligibility.RecommendedAmount = 500000.0
		eligibility.InterestRate = 5.0
	} else if report.CurrentScore >= 650 {
		eligibility.IsEligible = true
		eligibility.MaxLoanAmount = 750000.0
		eligibility.RecommendedAmount = 375000.0
		eligibility.InterestRate = 7.5
	} else if report.CurrentScore >= 600 {
		eligibility.IsEligible = true
		eligibility.MaxLoanAmount = 500000.0
		eligibility.RecommendedAmount = 250000.0
		eligibility.InterestRate = 10.0
	} else {
		eligibility.IsEligible = false
		eligibility.Exclusions = append(eligibility.Exclusions, "Credit score below minimum threshold")
	}

	// Adjust based on risk assessment
	if report.RiskAssessment != nil {
		if report.RiskAssessment.RiskLevel == "High" {
			eligibility.MaxLoanAmount *= 0.5
			eligibility.RecommendedAmount *= 0.5
			eligibility.InterestRate += 5.0
		} else if report.RiskAssessment.RiskLevel == "Medium" {
			eligibility.MaxLoanAmount *= 0.8
			eligibility.RecommendedAmount *= 0.8
			eligibility.InterestRate += 2.5
		}
	}

	// Set loan duration
	eligibility.LoanDuration = 30 // Default 30 days
	eligibility.RepaymentTerms = "Monthly installments"

	// Add eligibility factors
	eligibility.EligibilityFactors = []EligibilityFactor{
		{
			Factor:      "Credit Score",
			Status:      "calculated",
			Weight:      0.4,
			Score:       float64(report.CurrentScore) / 850.0 * 100,
			Description: fmt.Sprintf("Current credit score: %d", report.CurrentScore),
		},
		{
			Factor:      "Risk Level",
			Status:      "assessed",
			Weight:      0.3,
			Score:       100.0 - report.RiskAssessment.OverallRisk,
			Description: fmt.Sprintf("Risk assessment: %s", report.RiskAssessment.RiskLevel),
		},
		{
			Factor:      "Data Sources",
			Status:      "evaluated",
			Weight:      0.2,
			Score:       report.OffChainAnalysis.CompletenessScore,
			Description: fmt.Sprintf("Off-chain data completeness: %.1f%%", report.OffChainAnalysis.CompletenessScore),
		},
		{
			Factor:      "Account History",
			Status:      "analyzed",
			Weight:      0.1,
			Score:       report.Factors.AccountAge,
			Description: fmt.Sprintf("Account age factor: %.1f", report.Factors.AccountAge),
		},
	}

	return eligibility, nil
}

// getSeverityLevel returns severity level based on score
func (s *CreditScoreService) getSeverityLevel(score float64) string {
	if score >= 70 {
		return "High"
	} else if score >= 40 {
		return "Medium"
	} else {
		return "Low"
	}
}

// GetUserCreditScore gets the current credit score for a user
func (s *CreditScoreService) GetUserCreditScore(ctx context.Context, userID string) (*CreditScoreResponse, error) {
	req := CreditScoreRequest{
		UserID:           userID,
		ForceRecalculate: false,
	}

	return s.engine.CalculateCreditScore(ctx, req)
}

// UpdateUserCreditScore updates a user's credit score
func (s *CreditScoreService) UpdateUserCreditScore(ctx context.Context, userID string) (*CreditScoreResponse, error) {
	req := CreditScoreRequest{
		UserID:           userID,
		IncludeMpesa:     true,
		IncludeBank:      true,
		IncludeCRB:       true,
		IncludePayslip:   true,
		ForceRecalculate: true,
	}

	return s.engine.CalculateCreditScore(ctx, req)
}

// GetCreditScoreHistory gets the credit score history for a user
func (s *CreditScoreService) GetCreditScoreHistory(ctx context.Context, userID string, limit int) ([]models.CreditScore, error) {
	var scores []models.CreditScore
	if err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&scores).Error; err != nil {
		return nil, fmt.Errorf("failed to get credit score history: %w", err)
	}

	return scores, nil
}

// AddExternalDataSource adds an external data source for a user
func (s *CreditScoreService) AddExternalDataSource(ctx context.Context, userID, sourceType, identifier string) error {
	// This would integrate with various external data sources
	// For now, it's a placeholder implementation
	
	switch sourceType {
	case "mpesa":
		// Validate M-Pesa phone number
		if len(identifier) < 10 {
			return fmt.Errorf("invalid M-Pesa phone number")
		}
	case "bank":
		// Validate bank account
		if len(identifier) < 8 {
			return fmt.Errorf("invalid bank account number")
		}
	case "crb":
		// Validate national ID
		if len(identifier) < 6 {
			return fmt.Errorf("invalid national ID")
		}
	case "payslip":
		// Validate employee ID
		if identifier == "" {
			return fmt.Errorf("invalid employee ID")
		}
	default:
		return fmt.Errorf("unsupported data source type: %s", sourceType)
	}

	log.Info().
		Str("userID", userID).
		Str("sourceType", sourceType).
		Str("identifier", identifier).
		Msg("Added external data source")

	return nil
}