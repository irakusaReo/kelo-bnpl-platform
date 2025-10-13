package merchant

import (
	"encoding/json"
	"fmt"
	"kelo-backend/pkg/models"

	"github.com/supabase-community/supabase-go"
)

// Service handles merchant-related business logic.
type Service struct {
	db *supabase.Client
}

// NewService creates a new merchant service.
func NewService(db *supabase.Client) *Service {
	return &Service{db: db}
}

// CreateStore creates a new merchant store.
func (s *Service) CreateStore(store *models.MerchantStore) error {
	_, _, err := s.db.From("merchant_stores").Insert(store, false, "", "", "").Execute()
	if err != nil {
		return fmt.Errorf("failed to create merchant store: %w", err)
	}
	return nil
}

// GetStore retrieves a single merchant store by its ID.
func (s *Service) GetStore(storeID string) (*models.MerchantStore, error) {
	var stores []models.MerchantStore
	data, _, err := s.db.From("merchant_stores").Select("*", "exact", false).Eq("id", storeID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get merchant store: %w", err)
	}
	if err := json.Unmarshal(data, &stores); err != nil {
		return nil, fmt.Errorf("failed to unmarshal merchant store: %w", err)
	}
	if len(stores) == 0 {
		return nil, fmt.Errorf("merchant store not found")
	}
	return &stores[0], nil
}

// GetStores retrieves all merchant stores.
func (s *Service) GetStores(category string) ([]models.MerchantStore, error) {
	var stores []models.MerchantStore
	query := s.db.From("merchant_stores").Select("*", "exact", false)
	if category != "" {
		query = query.Eq("category", category)
	}
	data, _, err := query.Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get merchant stores: %w", err)
	}
	if err := json.Unmarshal(data, &stores); err != nil {
		return nil, fmt.Errorf("failed to unmarshal merchant stores: %w", err)
	}
	return stores, nil
}

// UpdateStore updates an existing merchant store.
func (s *Service) UpdateStore(store *models.MerchantStore) error {
	_, _, err := s.db.From("merchant_stores").Update(store, "", "").Eq("id", store.ID).Execute()
	if err != nil {
		return fmt.Errorf("failed to update merchant store: %w", err)
	}
	return nil
}