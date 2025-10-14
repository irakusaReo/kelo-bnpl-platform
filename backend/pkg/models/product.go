package models

import (
	"time"
)

// Product represents a product in the Kelo marketplace, aligning with the Prisma schema.
type Product struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	Price       float64   `json:"price"`
	Stock       int       `json:"stock"`
	StoreID     string    `json:"storeId"`
	Category    *string   `json:"category"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
