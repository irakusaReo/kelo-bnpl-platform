package models

import (
	"time"
)

// MerchantStore represents a merchant's store in the Kelo marketplace.
type MerchantStore struct {
	ID          string    `json:"id"`
	MerchantID  string    `json:"merchant_id"`
	StoreName   string    `json:"store_name"`
	StoreURL    string    `json:"store_url,omitempty"`
	StoreAddress string   `json:"store_address,omitempty"`
	LogoURL     string    `json:"logo_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}