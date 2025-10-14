package models

import (
	"time"
)

// IntegrationType defines the type of integration for a merchant.
type IntegrationType string

const (
	// Integrated means the merchant's products are sold directly on Kelo.
	Integrated IntegrationType = "INTEGRATED"
	// Partner means the merchant is listed as a payment option and has an external site.
	Partner IntegrationType = "PARTNER"
)

// MerchantStore represents a merchant's store in the Kelo marketplace, aligning with the Prisma schema.
type MerchantStore struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	Description     *string         `json:"description"`
	OwnerID         string          `json:"ownerId"`
	Status          string          `json:"status"`
	IntegrationType IntegrationType `json:"integrationType"`
	ExternalURL     *string         `json:"externalUrl"`
	Category        *string         `json:"category"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
}
