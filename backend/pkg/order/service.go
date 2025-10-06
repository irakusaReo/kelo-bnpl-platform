package order

import (
	"encoding/json"
	"fmt"
	"kelo-backend/pkg/models"

	"github.com/supabase-community/supabase-go"
)

// Service handles order-related business logic.
type Service struct {
	db *supabase.Client
}

// NewService creates a new order service.
func NewService(db *supabase.Client) *Service {
	return &Service{db: db}
}

// CreateOrder creates a new order and its associated items.
// This function should ideally be executed within a database transaction.
func (s *Service) CreateOrder(order *models.Order) (*models.Order, error) {
	// 1. Calculate total amount and set price_at_purchase for items
	var total float64
	var productIDs []string
	for _, item := range order.Items {
		productIDs = append(productIDs, item.ProductID)
	}

	var products []models.Product
	data, _, err := s.db.From("products").Select("id, price", "exact", false).In("id", productIDs).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch product prices: %w", err)
	}
	if err := json.Unmarshal(data, &products); err != nil {
		return nil, fmt.Errorf("failed to unmarshal product prices: %w", err)
	}

	productPrices := make(map[string]float64)
	for _, p := range products {
		productPrices[p.ID] = p.Price
	}

	for i := range order.Items {
		price, ok := productPrices[order.Items[i].ProductID]
		if !ok {
			return nil, fmt.Errorf("product with ID %s not found", order.Items[i].ProductID)
		}
		order.Items[i].PriceAtPurchase = price
		total += price * float64(order.Items[i].Quantity)
	}
	order.TotalAmount = total
	order.Status = "pending" // Set default status

	// 2. Insert the order
	orderToInsert := struct {
		UserID          string  `json:"user_id"`
		MerchantStoreID string  `json:"merchant_store_id"`
		TotalAmount     float64 `json:"total_amount"`
		Status          string  `json:"status"`
	}{
		UserID:          order.UserID,
		MerchantStoreID: order.MerchantStoreID,
		TotalAmount:     order.TotalAmount,
		Status:          order.Status,
	}

	var insertedOrder []models.Order
	data, _, err = s.db.From("orders").Insert(orderToInsert, false, "", "representation", "").Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}
	if err := json.Unmarshal(data, &insertedOrder); err != nil {
		return nil, fmt.Errorf("failed to unmarshal created order: %w", err)
	}
	if len(insertedOrder) == 0 {
		return nil, fmt.Errorf("failed to retrieve created order")
	}
	createdOrder := insertedOrder[0]

	// 3. Insert order items
	for i := range order.Items {
		order.Items[i].OrderID = createdOrder.ID
	}
	_, _, err = s.db.From("order_items").Insert(order.Items, false, "", "", "").Execute()
	if err != nil {
		// Attempt to roll back the order creation
		s.db.From("orders").Delete("", "").Eq("id", createdOrder.ID).Execute()
		return nil, fmt.Errorf("failed to create order items: %w", err)
	}

	createdOrder.Items = order.Items
	return &createdOrder, nil
}

// GetOrdersByUser retrieves all orders for a given user.
func (s *Service) GetOrdersByUser(userID string) ([]models.Order, error) {
	var orders []models.Order
	data, _, err := s.db.From("orders").Select("*", "exact", false).Eq("user_id", userID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get orders by user: %w", err)
	}
	if err := json.Unmarshal(data, &orders); err != nil {
		return nil, fmt.Errorf("failed to unmarshal orders: %w", err)
	}
	return orders, nil
}

// GetOrder retrieves a single order with its items.
func (s *Service) GetOrder(orderID string) (*models.Order, error) {
	var orders []models.Order
	data, _, err := s.db.From("orders").Select("*, order_items(*)", "exact", false).Eq("id", orderID).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get order: %w", err)
	}
	if err := json.Unmarshal(data, &orders); err != nil {
		return nil, fmt.Errorf("failed to unmarshal order: %w", err)
	}
	if len(orders) == 0 {
		return nil, fmt.Errorf("order not found")
	}
	return &orders[0], nil
}