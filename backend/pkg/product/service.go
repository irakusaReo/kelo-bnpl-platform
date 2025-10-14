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

// IsStoreOwner checks if a merchant owns a store.
func (s *Service) IsStoreOwner(storeID string, merchantID string) (bool, error) {
	var stores []models.MerchantStore
	data, _, err := s.db.From("merchant_stores").Select("*", "exact", false).Eq("id", storeID).Eq("merchant_id", merchantID).Execute()
	if err != nil {
		return false, fmt.Errorf("failed to get store: %w", err)
	}
	if err := json.Unmarshal(data, &stores); err != nil {
		return false, fmt.Errorf("failed to unmarshal store: %w", err)
	}
	return len(stores) > 0, nil
}

// IsProductOwner checks if a merchant owns a product.
func (s *Service) IsProductOwner(productID string, merchantID string) (bool, error) {
	product, err := s.GetProduct(productID)
	if err != nil {
		return false, err
	}
	return s.IsStoreOwner(product.StoreID, merchantID)
}

// UpdateProduct updates an existing product.
func (s *Service) UpdateProduct(product *models.Product) error {
	_, _, err := s.db.From("products").Update(product, "", "").Eq("id", product.ID).Execute()
	if err != nil {
		return fmt.Errorf("failed to update product: %w", err)
	}
	return nil
}

// UpdateProductStock updates the stock of a product.
func (s *Service) UpdateProductStock(productID string, stock int) (*models.Product, error) {
	var results []models.Product
	data, _, err := s.db.From("products").Update(map[string]interface{}{"stock": stock}, "", "exact").Eq("id", productID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to update product stock: %w", err)
	}

	if err := json.Unmarshal(data, &results); err != nil {
		return nil, fmt.Errorf("failed to unmarshal updated product: %w", err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("product not found after update")
	}

	return &results[0], nil
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

// GetProducts retrieves all products from INTEGRATED merchants, optionally filtered by category.
func (s *Service) GetProducts(category string) ([]models.Product, error) {
	// Step 1: Get the IDs of all INTEGRATED stores
	var integratedStores []struct {
		ID string `json:"id"`
	}
	storeData, _, err := s.db.From("merchant_stores").Select("id", "exact", false).Eq("integrationType", "INTEGRATED").Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get integrated stores: %w", err)
	}
	if err := json.Unmarshal(storeData, &integratedStores); err != nil {
		return nil, fmt.Errorf("failed to unmarshal integrated stores: %w", err)
	}

	if len(integratedStores) == 0 {
		// No integrated stores, so no products to return
		return []models.Product{}, nil
	}

	var storeIDs []string
	for _, store := range integratedStores {
		storeIDs = append(storeIDs, store.ID)
	}

	// Step 2: Fetch products belonging to those stores
	var products []models.Product
	query := s.db.From("products").Select("*", "exact", false).In("storeId", storeIDs)

	if category != "" {
		query = query.Eq("category", category)
	}
	data, _, err := query.Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get products: %w", err)
	}

	if err := json.Unmarshal(data, &products); err != nil {
		return nil, fmt.Errorf("failed to unmarshal products: %w", err)
	}

	return products, nil
}


// GetProductsByStore retrieves all products for a given merchant store.
func (s *Service) GetProductsByStore(storeID string) ([]models.Product, error) {
	var products []models.Product
	data, _, err := s.db.From("products").Select("*", "exact", false).Eq("storeId", storeID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get products by store: %w", err)
	}

	if err := json.Unmarshal(data, &products); err != nil {
		return nil, fmt.Errorf("failed to unmarshal products: %w", err)
	}

	return products, nil
}

// DeleteProduct deletes a product by its ID.
func (s *Service) DeleteProduct(productID string) error {
	_, _, err := s.db.From("products").Delete("", "").Eq("id", productID).Execute()
	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}
	return nil
}
