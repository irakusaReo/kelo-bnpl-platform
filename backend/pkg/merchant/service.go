package merchant

import (
	"encoding/json"
	"fmt"
	"kelo-backend/pkg/models"
	"sort"

	"github.com/supabase-community/supabase-go"
	"github.com/supabase-community/postgrest-go"
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

// GetRecentOrders retrieves the most recent orders for a merchant.
func (s *Service) GetRecentOrders(merchantID string) ([]models.Order, error) {
	var stores []struct {
		ID string `json:"id"`
	}
	storeData, _, err := s.db.From("merchant_stores").Select("id", "exact", false).Eq("merchant_id", merchantID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get merchant stores: %w", err)
	}
	if err := json.Unmarshal(storeData, &stores); err != nil {
		return nil, fmt.Errorf("failed to unmarshal merchant stores: %w", err)
	}

	if len(stores) == 0 {
		return []models.Order{}, nil
	}

	var storeIDs []string
	for _, store := range stores {
		storeIDs = append(storeIDs, store.ID)
	}

	var orders []models.Order
	query := s.db.From("orders").Select("*", "exact", false).In("merchant_store_id", storeIDs).Order("created_at", &postgrest.OrderOpts{Ascending: false}).Limit(5, "")
	orderData, _, err := query.Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get recent orders: %w", err)
	}
	if err := json.Unmarshal(orderData, &orders); err != nil {
		return nil, fmt.Errorf("failed to unmarshal recent orders: %w", err)
	}

	return orders, nil
}

// GetSalesAnalytics retrieves aggregated sales data for a merchant.
func (s *Service) GetSalesAnalytics(merchantID, startDate, endDate string) (*models.SalesAnalytics, error) {
	// Step 1: Get the IDs of all stores for the merchant
	var stores []struct {
		ID string `json:"id"`
	}
	storeData, _, err := s.db.From("merchant_stores").Select("id", "exact", false).Eq("merchant_id", merchantID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get merchant stores: %w", err)
	}
	if err := json.Unmarshal(storeData, &stores); err != nil {
		return nil, fmt.Errorf("failed to unmarshal merchant stores: %w", err)
	}

	if len(stores) == 0 {
		return &models.SalesAnalytics{}, nil // No stores, no sales
	}

	var storeIDs []string
	for _, store := range stores {
		storeIDs = append(storeIDs, store.ID)
	}

	// Step 2: Fetch orders from those stores, optionally filtering by date
	var orders []models.Order
	query := s.db.From("orders").Select("*", "exact", false).In("merchant_store_id", storeIDs)

	if startDate != "" {
		query = query.Gte("created_at", startDate)
	}
	if endDate != "" {
		query = query.Lte("created_at", endDate)
	}

	orderData, _, err := query.Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get orders: %w", err)
	}
	if err := json.Unmarshal(orderData, &orders); err != nil {
		return nil, fmt.Errorf("failed to unmarshal orders: %w", err)
	}

	// Step 3: Calculate total revenue and sales volume
	var totalRevenue float64
	salesVolume := len(orders)
	var orderIDs []string
	for _, order := range orders {
		totalRevenue += order.TotalAmount
		orderIDs = append(orderIDs, order.ID)
	}

	if len(orderIDs) == 0 {
		return &models.SalesAnalytics{
			TotalRevenue:     totalRevenue,
			SalesVolume:      salesVolume,
			TopSellingProducts: []models.Product{},
		}, nil
	}

	// Step 4: Fetch order items to determine top-selling products
	var orderItems []models.OrderItem
	itemData, _, err := s.db.From("order_items").Select("*", "exact", false).In("order_id", orderIDs).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get order items: %w", err)
	}
	if err := json.Unmarshal(itemData, &orderItems); err != nil {
		return nil, fmt.Errorf("failed to unmarshal order items: %w", err)
	}

	// Step 5: Aggregate product quantities
	productQuantities := make(map[string]int)
	for _, item := range orderItems {
		productQuantities[item.ProductID] += item.Quantity
	}

	type productSale struct {
		ID       string
		Quantity int
	}

	var sortedProducts []productSale
	for id, qty := range productQuantities {
		sortedProducts = append(sortedProducts, productSale{ID: id, Quantity: qty})
	}

	sort.Slice(sortedProducts, func(i, j int) bool {
		return sortedProducts[i].Quantity > sortedProducts[j].Quantity
	})

	// Step 6: Fetch details for the top-selling products (e.g., top 5)
	var topProductIDs []string
	limit := 5
	if len(sortedProducts) < limit {
		limit = len(sortedProducts)
	}
	for i := 0; i < limit; i++ {
		topProductIDs = append(topProductIDs, sortedProducts[i].ID)
	}

	var topProducts []models.Product
	if len(topProductIDs) > 0 {
		productData, _, err := s.db.From("products").Select("*", "exact", false).In("id", topProductIDs).Execute()
		if err != nil {
			return nil, fmt.Errorf("failed to get top products: %w", err)
		}
		if err := json.Unmarshal(productData, &topProducts); err != nil {
			return nil, fmt.Errorf("failed to unmarshal top products: %w", err)
		}
	}

	// Final assembly
	analytics := &models.SalesAnalytics{
		TotalRevenue:     totalRevenue,
		SalesVolume:      salesVolume,
		TopSellingProducts: topProducts,
	}

	return analytics, nil
}

// GetPayoutHistory retrieves the payout history for a merchant.
func (s *Service) GetPayoutHistory(merchantID string) ([]models.Payout, error) {
	var payouts []models.Payout
	data, _, err := s.db.From("payouts").Select("*", "exact", false).Eq("merchant_id", merchantID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get payout history: %w", err)
	}
	if err := json.Unmarshal(data, &payouts); err != nil {
		return nil, fmt.Errorf("failed to unmarshal payout history: %w", err)
	}
	return payouts, nil
}

// RequestPayout creates a new payout request for a merchant.
func (s *Service) RequestPayout(payout *models.Payout) error {
	// In a real application, you would perform balance checks and other validation here.
	// For now, we'll just create the payout record with a "pending" status.
	payout.Status = "pending"
	_, _, err := s.db.From("payouts").Insert(payout, false, "", "", "").Execute()
	if err != nil {
		return fmt.Errorf("failed to create payout request: %w", err)
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