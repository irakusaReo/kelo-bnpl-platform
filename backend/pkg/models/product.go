package models

import (
	"time"
)

// Product represents a product in the Kelo marketplace.
type Product struct {
	ID              string    `json:"id"`
	MerchantStoreID string    `json:"merchant_store_id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	Price           float64   `json:"price"`
	SKU             string    `json:"sku,omitempty"`
	Images          []string  `json:"images,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}