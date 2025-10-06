package models

import (
	"time"
)

// LiquidityPool represents a liquidity pool in the Kelo system.
type LiquidityPool struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	TotalStaked float64   `json:"total_staked"`
	Apy         float64   `json:"apy,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}