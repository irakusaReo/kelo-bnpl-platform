package creditscore

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"kelo-backend/pkg/utils"

	"github.com/rs/zerolog/log"
)

// MpesaClient handles integration with M-Pesa API
type MpesaClient struct {
	apiKey    string
	secret    string
	baseURL   string
	authToken string
	client    *http.Client
}

// BankClient handles integration with bank APIs
type BankClient struct {
	apiKeys map[string]string // bank_name -> api_key
	client  *http.Client
}

// CRBClient handles integration with Credit Reference Bureau
type CRBClient struct {
	apiKey  string
	baseURL string
	client  *http.Client
}

// PayslipClient handles integration with payroll systems
type PayslipClient struct {
	apiKeys map[string]string // employer -> api_key
	client  *http.Client
}

// NewMpesaClient creates a new M-Pesa API client
func NewMpesaClient(apiKey, secret string) *MpesaClient {
	return &MpesaClient{
		apiKey:  apiKey,
		secret:  secret,
		baseURL: "https://api.safaricom.co.ke",
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewBankClient creates a new bank API client
func NewBankClient() *BankClient {
	return &BankClient{
		apiKeys: make(map[string]string),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewCRBClient creates a new CRB API client
func NewCRBClient() *CRBClient {
	return &CRBClient{
		apiKey:  os.Getenv("CRB_API_KEY"),
		baseURL: "https://api.crb.co.ke",
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewPayslipClient creates a new payslip API client
func NewPayslipClient() *PayslipClient {
	return &PayslipClient{
		apiKeys: make(map[string]string),
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetStatement retrieves M-Pesa statement for a phone number
func (m *MpesaClient) GetStatement(ctx context.Context, phoneNumber string) (*MpesaStatement, error) {
	if err := m.authenticate(ctx); err != nil {
		return nil, fmt.Errorf("M-Pesa authentication failed: %w", err)
	}

	endDate := time.Now()
	startDate := endDate.AddDate(0, -6, 0)
	url := fmt.Sprintf("%s/mpesa/statement/v1/query", m.baseURL)
	
	request := map[string]interface{}{
		"phoneNumber":   phoneNumber,
		"startDate":     startDate.Format("2006-01-02"),
		"endDate":       endDate.Format("2006-01-02"),
		"transactionType": "ALL",
	}

	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", m.authToken),
		"Content-Type":  "application/json",
	}

	respBody, err := utils.MakeRequest(ctx, m.client, "POST", url, headers, request)
	if err != nil {
		return nil, fmt.Errorf("failed to get M-Pesa statement: %w", err)
	}

	var statement MpesaStatement
	if err := json.Unmarshal(respBody, &statement); err != nil {
		return nil, fmt.Errorf("failed to parse M-Pesa statement: %w", err)
	}

	statement.TotalInflow = 0
	statement.TotalOutflow = 0
	for _, tx := range statement.Transactions {
		if tx.Type == "received" {
			statement.TotalInflow += tx.Amount
		} else {
			statement.TotalOutflow += tx.Amount
		}
	}
	statement.NetFlow = statement.TotalInflow - statement.TotalOutflow
	statement.PeriodStart = startDate
	statement.PeriodEnd = endDate

	return &statement, nil
}

// GetBankStatement retrieves bank statement for an account
func (b *BankClient) GetBankStatement(ctx context.Context, bankName, accountNumber string) (*BankStatement, error) {
	apiKey, exists := b.apiKeys[bankName]
	if !exists {
		return nil, fmt.Errorf("API key not configured for bank: %s", bankName)
	}

	var baseURL string
	switch bankName {
	case "equity":
		baseURL = "https://api.equitybank.co.ke"
	case "kcb":
		baseURL = "https://api.kcbgroup.co.ke"
	case "coop":
		baseURL = "https://api.co-opbank.co.ke"
	case "ncba":
		baseURL = "https://api.ncbagroup.co.ke"
	default:
		return nil, fmt.Errorf("unsupported bank: %s", bankName)
	}

	url := fmt.Sprintf("%s/accounts/%s/statement", baseURL, accountNumber)
	endDate := time.Now()
	startDate := endDate.AddDate(0, -6, 0)
	request := map[string]interface{}{
		"startDate": startDate.Format("2006-01-02"),
		"endDate":   endDate.Format("2006-01-02"),
	}
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", apiKey),
		"Content-Type":  "application/json",
	}

	respBody, err := utils.MakeRequest(ctx, b.client, "POST", url, headers, request)
	if err != nil {
		return nil, fmt.Errorf("failed to get bank statement: %w", err)
	}

	var statement BankStatement
	if err := json.Unmarshal(respBody, &statement); err != nil {
		return nil, fmt.Errorf("failed to parse bank statement: %w", err)
	}

	statement.PeriodStart = startDate
	statement.PeriodEnd = endDate
	statement.BankName = bankName

	return &statement, nil
}

// GetCRBReport retrieves CRB report for a customer
func (c *CRBClient) GetCRBReport(ctx context.Context, customerID string) (*CRBReport, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("CRB API key not configured")
	}

	url := fmt.Sprintf("%s/credit-reports/%s", c.baseURL, customerID)
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", c.apiKey),
		"Content-Type":  "application/json",
	}

	respBody, err := utils.MakeRequest(ctx, c.client, "GET", url, headers, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get CRB report: %w", err)
	}

	var report CRBReport
	if err := json.Unmarshal(respBody, &report); err != nil {
		return nil, fmt.Errorf("failed to parse CRB report: %w", err)
	}

	report.CustomerID = customerID
	report.LastUpdated = time.Now()

	return &report, nil
}

// GetPayslip retrieves payslip data for an employee
func (p *PayslipClient) GetPayslip(ctx context.Context, employer, employeeID, period string) (*Payslip, error) {
	apiKey, exists := p.apiKeys[employer]
	if !exists {
		return nil, fmt.Errorf("API key not configured for employer: %s", employer)
	}

	var baseURL string
	switch employer {
	case "safaricom":
		baseURL = "https://api.safaricom.co.ke/payroll"
	case "equity":
		baseURL = "https://api.equitybank.co.ke/payroll"
	case "kcb":
		baseURL = "https://api.kcbgroup.co.ke/payroll"
	default:
		baseURL = fmt.Sprintf("https://api.%s.co.ke/payroll", employer)
	}

	url := fmt.Sprintf("%s/employees/%s/payslips/%s", baseURL, employeeID, period)
	headers := map[string]string{
		"Authorization": fmt.Sprintf("Bearer %s", apiKey),
		"Content-Type":  "application/json",
	}

	respBody, err := utils.MakeRequest(ctx, p.client, "GET", url, headers, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get payslip: %w", err)
	}

	var payslip Payslip
	if err := json.Unmarshal(respBody, &payslip); err != nil {
		return nil, fmt.Errorf("failed to parse payslip: %w", err)
	}

	payslip.EmployeeID = employeeID
	payslip.Employer = employer
	payslip.Period = period

	return &payslip, nil
}

// authenticate authenticates with M-Pesa API
func (m *MpesaClient) authenticate(ctx context.Context) error {
	if m.authToken != "" {
		return nil
	}

	url := fmt.Sprintf("%s/oauth/v1/generate?grant_type=client_credentials", m.baseURL)
	auth := base64.StdEncoding.EncodeToString([]byte(m.apiKey + ":" + m.secret))
	headers := map[string]string{
		"Authorization": "Basic " + auth,
		"Content-Type":  "application/json",
	}

	respBody, err := utils.MakeRequest(ctx, m.client, "GET", url, headers, nil)
	if err != nil {
		return fmt.Errorf("failed to authenticate: %w", err)
	}

	var authResponse struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}

	if err := json.Unmarshal(respBody, &authResponse); err != nil {
		return fmt.Errorf("failed to parse auth response: %w", err)
	}

	m.authToken = authResponse.AccessToken

	go func() {
		time.Sleep(time.Duration(authResponse.ExpiresIn) * time.Second)
		m.authToken = ""
	}()

	return nil
}

// AddBankAPIKey adds an API key for a specific bank
func (b *BankClient) AddBankAPIKey(bankName, apiKey string) {
	b.apiKeys[bankName] = apiKey
	log.Info().Str("bank", bankName).Msg("Added bank API key")
}

// AddEmployerAPIKey adds an API key for a specific employer
func (p *PayslipClient) AddEmployerAPIKey(employer, apiKey string) {
	p.apiKeys[employer] = apiKey
	log.Info().Str("employer", employer).Msg("Added employer API key")
}

// ValidateBankAccount validates bank account details
func (b *BankClient) ValidateBankAccount(ctx context.Context, bankName, accountNumber string) (bool, error) {
	if len(accountNumber) < 8 {
		return false, nil
	}
	return true, nil
}

// ValidateEmployer validates employer details
func (p *PayslipClient) ValidateEmployer(ctx context.Context, employer string) (bool, error) {
	if employer == "" {
		return false, nil
	}
	return true, nil
}

// GetTransactionHistory retrieves transaction history from external sources
func (m *MpesaClient) GetTransactionHistory(ctx context.Context, phoneNumber string, days int) ([]MpesaTransaction, error) {
	statement, err := m.GetStatement(ctx, phoneNumber)
	if err != nil {
		return nil, err
	}
	
	cutoffDate := time.Now().AddDate(0, 0, -days)
	var filteredTransactions []MpesaTransaction
	
	for _, tx := range statement.Transactions {
		if tx.Timestamp.After(cutoffDate) {
			filteredTransactions = append(filteredTransactions, tx)
		}
	}
	
	return filteredTransactions, nil
}

// GetCreditScoreFromCRB retrieves credit score from CRB
func (c *CRBClient) GetCreditScoreFromCRB(ctx context.Context, customerID string) (int, error) {
	report, err := c.GetCRBReport(ctx, customerID)
	if err != nil {
		return 0, err
	}
	return report.Score, nil
}

// GetEmploymentHistory retrieves employment history from payslips
func (p *PayslipClient) GetEmploymentHistory(ctx context.Context, employer, employeeID string, months int) ([]Payslip, error) {
	var payslips []Payslip
	
	for i := 0; i < months; i++ {
		period := time.Now().AddDate(0, -i, 0).Format("2006-01")
		payslip, err := p.GetPayslip(ctx, employer, employeeID, period)
		if err != nil {
			log.Warn().Err(err).Str("period", period).Msg("Failed to get payslip for period")
			continue
		}
		payslips = append(payslips, *payslip)
	}
	
	return payslips, nil
}