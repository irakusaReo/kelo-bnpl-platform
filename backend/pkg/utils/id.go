package utils

import (
	"fmt"
	"time"
)

// GenerateID creates a unique, time-based ID with a "kelo_" prefix.
func GenerateID() string {
	return fmt.Sprintf("kelo_%d", time.Now().UnixNano())
}