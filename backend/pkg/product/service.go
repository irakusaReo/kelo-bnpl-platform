package product

import (
	"encoding/json"
	"fmt"
	"kelo-backend/pkg/models"

	"github.com/supabase-community/supabase-go"
)

// Service handles product-related business logic.
type Service struct {
	db *supabase.Client
}

// NewService creates a new product service.
func NewService(db *supabase.Client) *Service {
	return &Service{db: db}
}

// CreateProduct creates a new product for a merchant.
func (s *Service) CreateProduct(product *models.Product) error {
	_, _, err := s.db.From("products").Insert(product, false, "", "", "").Execute()
	if err != nil {
		return fmt.Errorf("failed to create product: %w", err)
	}
	return nil
}

// GetProduct retrieves a single product by its ID.
func (s *Service) GetProduct(productID string) (*models.Product, error) {
	var products []models.Product
	data, _, err := s.db.From("products").Select("*", "exact", false).Eq("id", productID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get product: %w", err)
	}

	if err := json.Unmarshal(data, &products); err != nil {
		return nil, fmt.Errorf("failed to unmarshal product: %w", err)
	}

	if len(products) == 0 {
		return nil, fmt.Errorf("product not found")
	}

	return &products[0], nil
}

// GetProductsByStore retrieves all products for a given merchant store.
func (s *Service) GetProductsByStore(storeID string) ([]models.Product, error) {
	var products []models.Product
	data, _, err := s.db.From("products").Select("*", "exact", false).Eq("merchant_store_id", storeID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get products by store: %w", err)
	}

	if err := json.Unmarshal(data, &products); err != nil {
		return nil, fmt.Errorf("failed to unmarshal products: %w", err)
	}

	return products, nil
}

// UpdateProduct updates an existing product.
func (s *Service) UpdateProduct(product *models.Product) error {
	_, _, err := s.db.From("products").Update(product, "", "").Eq("id", product.ID).Execute()
	if err != nil {
		return fmt.Errorf("failed to update product: %w", err)
	}
	return nil
}

// DeleteProduct deletes a product by its ID.
func (s *Service) DeleteProduct(productID string) error {
	_, _, err := s.db.From("products").Delete("", "").Eq("id", productID).Execute()
	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}
	return nil
}