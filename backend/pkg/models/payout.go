package models

import "time"

// Payout represents a payout request from a merchant.
type Payout struct {
	ID         string    `json:"id,omitempty"`
	MerchantID string    `json:"merchant_id"`
	Amount     float64   `json:"amount"`
	Status     string    `json:"status"` // e.g., pending, completed, failed
	CreatedAt  time.Time `json:"created_at,omitempty"`
	UpdatedAt  time.Time `json:"updated_at,omitempty"`
}
