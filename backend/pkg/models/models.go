package models

import (
	"time"
)

// Profile corresponds to the 'profiles' table in Supabase.
// It holds all user-related information.
type Profile struct {
	ID            string    `json:"id"`
	Role          string    `json:"role,omitempty"`
	Status        string    `json:"status,omitempty"`
	WalletAddress string    `json:"wallet_address,omitempty"`
	CreatedAt     time.Time `json:"created_at,omitempty"`
	UpdatedAt     time.Time `json:"updated_at,omitempty"`
	FirstName     string    `json:"first_name,omitempty"`
	LastName      string    `json:"last_name,omitempty"`
	Phone         string    `json:"phone,omitempty"`
	DID           string    `json:"did,omitempty"`
}

// Loan corresponds to the 'loans' table in Supabase.
type Loan struct {
	ID              string     `json:"id"`
	OrderID         string     `json:"order_id"`
	UserID          string     `json:"user_id"`
	PrincipalAmount float64    `json:"principal_amount"`
	InterestRate    float64    `json:"interest_rate"`
	Status          string     `json:"status"`
	DueDate         time.Time  `json:"due_date"`
	CreatedAt       time.Time  `json:"created_at,omitempty"`
	UpdatedAt       time.Time  `json:"updated_at,omitempty"`
	RepaidAt        *time.Time `json:"repaid_at,omitempty"` // Used for repayment behavior score
}

// Repayment corresponds to the 'repayments' table in Supabase.
type Repayment struct {
	ID            string    `json:"id"`
	LoanID        string    `json:"loan_id"`
	Amount        float64    `json:"amount"`
	RepaymentDate time.Time `json:"repayment_date"`
	// The 'status' field from the old model is not in the Supabase schema for this table.
}

// Transaction is a simplified struct for decoding on-chain transaction history.
// In this context, it is not a direct 1:1 mapping to a table but represents
// the data needed for credit scoring from a transaction history source.
type Transaction struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Type      string    `json:"type"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// CreditScore corresponds to the 'credit_scores' table in Supabase.
type CreditScore struct {
	ID            string    `json:"id,omitempty"`
	UserID        string    `json:"user_id"`
	Score         int       `json:"score"`
	PreviousScore int       `json:"previous_score,omitempty"`
	MaxScore      int       `json:"max_score"`
	Factors       string    `json:"factors"` // JSON string
	UpdateReason  string    `json:"update_reason"`
	DataSource    string    `json:"data_source"`
	ValidUntil    time.Time `json:"valid_until"`
	CreatedAt     time.Time `json:"created_at,omitempty"`
}

// PlatformAnalytics holds key platform-wide metrics.
type PlatformAnalytics struct {
	TotalTransactionVolume float64 `json:"total_transaction_volume"`
	TotalValueLocked       float64 `json:"total_value_locked"`
	NewUsersLast30Days     int     `json:"new_users_last_30_days"`
	NewMerchantsLast30Days int     `json:"new_merchants_last_30_days"`
}