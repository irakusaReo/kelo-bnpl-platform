package models

import (
        "fmt"
        "time"

        "gorm.io/gorm"
)

// User represents a platform user
type User struct {
        ID           string    `json:"id" gorm:"primaryKey"`
        Email        string    `json:"email" gorm:"uniqueIndex;not null"`
        PasswordHash string    `json:"-" gorm:"not null"`
        FirstName    string    `json:"first_name"`
        LastName     string    `json:"last_name"`
        Phone        string    `json:"phone"`
        DID          string    `json:"did"` // Decentralized Identifier
        WalletAddress string  `json:"wallet_address"`
        IsActive     bool      `json:"is_active" gorm:"default:true"`
        CreatedAt    time.Time `json:"created_at"`
        UpdatedAt    time.Time `json:"updated_at"`
        
        // Relations
        Loans         []Loan         `json:"loans" gorm:"foreignKey:UserID"`
        CreditScores  []CreditScore  `json:"credit_scores" gorm:"foreignKey:UserID"`
        Transactions  []Transaction  `json:"transactions" gorm:"foreignKey:UserID"`
}

// Merchant represents a merchant on the platform
type Merchant struct {
        ID           string    `json:"id" gorm:"primaryKey"`
        UserID       string    `json:"user_id" gorm:"not null"`
        BusinessName string    `json:"business_name" gorm:"not null"`
        BusinessType string    `json:"business_type"`
        Description  string    `json:"description"`
        Website      string    `json:"website"`
        Address      string    `json:"address"`
        City         string    `json:"city"`
        Country      string    `json:"country"`
        PostalCode   string    `json:"postal_code"`
        Phone        string    `json:"phone"`
        Email        string    `json:"email"`
        DID          string    `json:"did"` // Merchant DID
        WalletAddress string  `json:"wallet_address"`
        IsVerified   bool      `json:"is_verified" gorm:"default:false"`
        IsActive     bool      `json:"is_active" gorm:"default:true"`
        CreatedAt    time.Time `json:"created_at"`
        UpdatedAt    time.Time `json:"updated_at"`
        
        // Relations
        User  User  `json:"user" gorm:"foreignKey:UserID"`
        Loans []Loan `json:"loans" gorm:"foreignKey:MerchantID"`
}

// Loan represents a loan agreement
type Loan struct {
        ID               string    `json:"id" gorm:"primaryKey"`
        UserID           string    `json:"user_id" gorm:"not null"`
        MerchantID       string    `json:"merchant_id" gorm:"not null"`
        Amount           float64   `json:"amount" gorm:"type:decimal(20,8);not null"`
        InterestRate     float64   `json:"interest_rate" gorm:"type:decimal(10,4);not null"`
        Duration         int       `json:"duration" gorm:"not null"` // in days
        Status           string    `json:"status" gorm:"not null;default:'pending"` // pending, approved, active, repaid, defaulted
        Purpose          string    `json:"purpose"`
        TokenID          string    `json:"token_id"` // NFT token ID on Hedera
        ChainID          string    `json:"chain_id"` // Blockchain chain ID
        TransactionHash  string    `json:"transaction_hash"`
        DueDate          time.Time `json:"due_date"`
        ApprovedAt      *time.Time `json:"approved_at"`
        DisbursedAt      *time.Time `json:"disbursed_at"`
        RepaidAt         *time.Time `json:"repaid_at"`
        CreatedAt        time.Time `json:"created_at"`
        UpdatedAt        time.Time `json:"updated_at"`
        
        // Relations
        User       User        `json:"user" gorm:"foreignKey:UserID"`
        Merchant   Merchant    `json:"merchant" gorm:"foreignKey:MerchantID"`
        Repayments []Repayment `json:"repayments" gorm:"foreignKey:LoanID"`
}

// Repayment represents a loan repayment
type Repayment struct {
ID              string    `json:"id" gorm:"primaryKey"`
LoanID          string    `json:"loan_id" gorm:"not null"`
Amount          float64   `json:"amount" gorm:"type:decimal(20,8);not null"`
TransactionHash string  `json:"transaction_hash"`
ChainID         string    `json:"chain_id"`
Status          string    `json:"status" gorm:"not null;default:'pending'"` // pending, completed, failed
PaymentMethod   string    `json:"payment_method"` // mpesa, bank_transfer, crypto
ReferenceNumber string    `json:"reference_number"`
CreatedAt       time.Time `json:"created_at"`
UpdatedAt       time.Time `json:"updated_at"`

// Relations
Loan Loan `json:"loan" gorm:"foreignKey:LoanID"`
}

// LiquidityPool represents a liquidity pool
type LiquidityPool struct {
        ID               string    `json:"id" gorm:"primaryKey"`
TokenAddress     string    `json:"token_address" gorm:"not null"`
TokenSymbol      string    `json:"token_symbol" gorm:"not null"`
ChainID          string    `json:"chain_id" gorm:"not null"`
TotalLiquidity   float64   `json:"total_liquidity" gorm:"type:decimal(20,8);default:0"`
TotalDeposits    float64   `json:"total_deposits" gorm:"type:decimal(20,8);default:0"`
TotalWithdrawals float64  `json:"total_withdrawals" gorm:"type:decimal(20,8);default:0"`
TotalInterestPaid float64 `json:"total_interest_paid" gorm:"type:decimal(20,8);default:0"`
InterestRate     float64   `json:"interest_rate" gorm:"type:decimal(10,4);not null"`
IsActive         bool      `json:"is_active" gorm:"default:true"`
ContractAddress  string    `json:"contract_address"`
CreatedAt        time.Time `json:"created_at"`
UpdatedAt        time.Time `json:"updated_at"`

// Relations
Providers []LiquidityProvider `json:"providers" gorm:"foreignKey:PoolID"`
}

// LiquidityProvider represents a liquidity provider
type LiquidityProvider struct {
ID               string    `json:"id" gorm:"primaryKey"`
PoolID           string    `json:"pool_id" gorm:"not null"`
UserID           string    `json:"user_id" gorm:"not null"`
TotalDeposited   float64   `json:"total_deposited" gorm:"type:decimal(20,8);default:0"`
TotalWithdrawn   float64   `json:"total_withdrawn" gorm:"type:decimal(20,8);default:0"`
InterestEarned   float64   `json:"interest_earned" gorm:"type:decimal(20,8);default:0"`
IsActive         bool      `json:"is_active" gorm:"default:true"`
LastInterestCalc time.Time `json:"last_interest_calc"`
CreatedAt        time.Time `json:"created_at"`
UpdatedAt        time.Time `json:"updated_at"`

// Relations
Pool LiquidityPool `json:"pool" gorm:"foreignKey:PoolID"`
User User          `json:"user" gorm:"foreignKey:UserID"`
}

// CreditScore represents a user's credit score
type CreditScore struct {
ID             string    `json:"id" gorm:"primaryKey"`
UserID         string    `json:"user_id" gorm:"not null"`
Score          int       `json:"score" gorm:"not null"`
PreviousScore  int       `json:"previous_score"`
MaxScore       int       `json:"max_score" gorm:"default:850"`
Factors        string    `json:"factors"` // JSON string of scoring factors
UpdateReason   string    `json:"update_reason"`
DataSource     string    `json:"data_source"` // on_chain, off_chain, combined
ValidUntil     time.Time `json:"valid_until"`
CreatedAt      time.Time `json:"created_at"`
UpdatedAt      time.Time `json:"updated_at"`

// Relations
User User `json:"user" gorm:"foreignKey:UserID"`
}

// Transaction represents a blockchain transaction
type Transaction struct {
ID               string    `json:"id" gorm:"primaryKey"`
UserID           string    `json:"user_id"`
Type             string    `json:"type" gorm:"not null"` // deposit, withdrawal, disbursement, repayment
Amount           float64   `json:"amount" gorm:"type:decimal(20,8);not null"`
TokenAddress     string    `json:"token_address"`
TokenSymbol      string    `json:"token_symbol"`
ChainID          string    `json:"chain_id"`
TransactionHash  string    `json:"transaction_hash" gorm:"not null"`
BlockNumber      uint64    `json:"block_number"`
Status           string    `json:"status" gorm:"not null;default:'pending'"` // pending, confirmed, failed
GasUsed          uint64    `json:"gas_used"`
GasPrice         float64   `json:"gas_price" gorm:"type:decimal(20,8)"`
Fee              float64   `json:"fee" gorm:"type:decimal(20,8)"`
Metadata         string    `json:"metadata"` // JSON string for additional data
CreatedAt        time.Time `json:"created_at"`
UpdatedAt        time.Time `json:"updated_at"`

// Relations
User User `json:"user" gorm:"foreignKey:UserID"`
}

// BeforeCreate hooks for generating IDs
func (u *User) BeforeCreate(tx *gorm.DB) error {
        if u.ID == "" {
                u.ID = generateID()
        }
        return nil
}

func (m *Merchant) BeforeCreate(tx *gorm.DB) error {
        if m.ID == "" {
                m.ID = generateID()
        }
        return nil
}

func (l *Loan) BeforeCreate(tx *gorm.DB) error {
        if l.ID == "" {
                l.ID = generateID()
        }
        return nil
}

func (r *Repayment) BeforeCreate(tx *gorm.DB) error {
        if r.ID == "" {
                r.ID = generateID()
        }
        return nil
}

func (p *LiquidityPool) BeforeCreate(tx *gorm.DB) error {
        if p.ID == "" {
                p.ID = generateID()
        }
        return nil
}

func (lp *LiquidityProvider) BeforeCreate(tx *gorm.DB) error {
        if lp.ID == "" {
                lp.ID = generateID()
        }
        return nil
}

func (cs *CreditScore) BeforeCreate(tx *gorm.DB) error {
        if cs.ID == "" {
                cs.ID = generateID()
        }
        return nil
}

func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
        if t.ID == "" {
                t.ID = generateID()
        }
        return nil
}

// Helper function to generate unique IDs
func generateID() string {
        return fmt.Sprintf("kelo_%d", time.Now().UnixNano())
}