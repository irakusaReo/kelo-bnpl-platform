package models

import (
	"time"
)

// Order represents an order in the Kelo marketplace.
type Order struct {
	ID              string      `json:"id"`
	UserID          string      `json:"user_id"`
	MerchantStoreID string      `json:"merchant_store_id"`
	TotalAmount     float64     `json:"total_amount"`
	Status          string      `json:"status"`
	Items           []OrderItem `json:"items"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

// OrderItem represents an item within an order.
type OrderItem struct {
	OrderID         string  `json:"order_id"`
	ProductID       string  `json:"product_id"`
	Quantity        int     `json:"quantity"`
	PriceAtPurchase float64 `json:"price_at_purchase"`
}