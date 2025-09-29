package creditscore

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

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
	// Authenticate with M-Pesa API
	if err := m.authenticate(ctx); err != nil {
		return nil, fmt.Errorf("M-Pesa authentication failed: %w", err)
	}

	// Get statement for the last 6 months
	endDate := time.Now()
	startDate := endDate.AddDate(0, -6, 0)

	url := fmt.Sprintf("%s/mpesa/statement/v1/query", m.baseURL)
	
	request := map[string]interface{}{
		"phoneNumber":   phoneNumber,
		"startDate":     startDate.Format("2006-01-02"),
		"endDate":       endDate.Format("2006-01-02"),
		"transactionType": "ALL",
	}

	resp, err := m.makeRequest(ctx, "POST", url, request)
	if err != nil {
		return nil, fmt.Errorf("failed to get M-Pesa statement: %w", err)
	}

	// Parse response
	var statement MpesaStatement
	if err := json.Unmarshal(resp, &statement); err != nil {
		return nil, fmt.Errorf("failed to parse M-Pesa statement: %w", err)
	}

	// Calculate totals
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

	// Different banks have different API endpoints
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
	
	// Get statement for the last 6 months
	endDate := time.Now()
	startDate := endDate.AddDate(0, -6, 0)

	request := map[string]interface{}{
		"startDate": startDate.Format("2006-01-02"),
		"endDate":   endDate.Format("2006-01-02"),
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get bank statement: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("bank API returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var statement BankStatement
	if err := json.Unmarshal(body, &statement); err != nil {
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

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get CRB report: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("CRB API returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var report CRBReport
	if err := json.Unmarshal(body, &report); err != nil {
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

	// Different payroll systems have different API endpoints
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

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get payslip: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("payslip API returned status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var payslip Payslip
	if err := json.Unmarshal(body, &payslip); err != nil {
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
		// Check if token is still valid (tokens typically expire after 1 hour)
		return nil
	}

	url := fmt.Sprintf("%s/oauth/v1/generate?grant_type=client_credentials", m.baseURL)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create auth request: %w", err)
	}

	req.SetBasicAuth(m.apiKey, m.secret)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to authenticate: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("authentication failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read auth response: %w", err)
	}

	var authResponse struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}

	if err := json.Unmarshal(body, &authResponse); err != nil {
		return fmt.Errorf("failed to parse auth response: %w", err)
	}

	m.authToken = authResponse.AccessToken

	// Set up token expiration (in a real implementation, you'd refresh automatically)
	go func() {
		time.Sleep(time.Duration(authResponse.ExpiresIn) * time.Second)
		m.authToken = ""
	}()

	return nil
}

// makeRequest makes an authenticated request to M-Pesa API
func (m *MpesaClient) makeRequest(ctx context.Context, method, url string, data interface{}) ([]byte, error) {
	var body io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request data: %w", err)
		}
		body = io.NopCloser(io.MultiReader(body, io.NewReader(string(jsonData))))
	}

	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", m.authToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
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
	// This is a placeholder implementation
	// In a real implementation, you would call the bank's validation API
	
	// Simulate validation
	if len(accountNumber) < 8 {
		return false, nil
	}
	
	return true, nil
}

// ValidateEmployer validates employer details
func (p *PayslipClient) ValidateEmployer(ctx context.Context, employer string) (bool, error) {
	// This is a placeholder implementation
	// In a real implementation, you would check if the employer is registered
	
	// Simulate validation
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
	
	// Filter transactions by date range
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
	// This is a placeholder implementation
	// In a real implementation, you would retrieve multiple payslips
	
	var payslips []Payslip
	
	// Simulate retrieving payslips for the last N months
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