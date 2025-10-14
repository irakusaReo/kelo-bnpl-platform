package merchant

import (
	"kelo-backend/pkg/middleware"
	"kelo-backend/pkg/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for merchants.
type Handler struct {
	service *Service
}

// NewHandler creates a new merchant handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers the merchant routes.
func (h *Handler) RegisterRoutes(router gin.IRouter) {
	merchantRoutes := router.Group("/merchant")
	{
		merchantRoutes.GET("/analytics", middleware.AuthMiddleware("merchant"), h.GetSalesAnalytics)
		merchantRoutes.GET("/payouts", middleware.AuthMiddleware("merchant"), h.GetPayoutHistory)
		merchantRoutes.POST("/payouts", middleware.AuthMiddleware("merchant"), h.RequestPayout)
		merchantRoutes.GET("/orders/recent", middleware.AuthMiddleware("merchant"), h.GetRecentOrders)
	}

	storeRoutes := router.Group("/stores")
	{
		storeRoutes.POST("/", middleware.AuthMiddleware("merchant"), h.CreateStore)
		storeRoutes.GET("/", h.GetStores)
		storeRoutes.GET("/:id", h.GetStore)
		storeRoutes.PUT("/:id", middleware.AuthMiddleware("merchant"), h.UpdateStore)
	}
}

// GetSalesAnalytics handles the request for sales analytics.
func (h *Handler) GetSalesAnalytics(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	merchantID, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	analytics, err := h.service.GetSalesAnalytics(merchantID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// GetPayoutHistory retrieves the payout history for a merchant.
func (h *Handler) GetPayoutHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	merchantID, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	payouts, err := h.service.GetPayoutHistory(merchantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, payouts)
}

// RequestPayout handles a new payout request from a merchant.
func (h *Handler) RequestPayout(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	merchantID, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	var payout models.Payout
	if err := c.ShouldBindJSON(&payout); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	payout.MerchantID = merchantID

	if err := h.service.RequestPayout(&payout); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, payout)
}

// GetRecentOrders retrieves the most recent orders for a merchant.
func (h *Handler) GetRecentOrders(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	merchantID, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	orders, err := h.service.GetRecentOrders(merchantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// CreateStore handles the creation of a new merchant store.
func (h *Handler) CreateStore(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	merchantID, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	var store models.MerchantStore
	if err := c.ShouldBindJSON(&store); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	store.OwnerID = merchantID

	if err := h.service.CreateStore(&store); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, store)
}

// GetStore retrieves a single merchant store.
func (h *Handler) GetStore(c *gin.Context) {
	storeID := c.Param("id")
	store, err := h.service.GetStore(storeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Store not found"})
		return
	}

	c.JSON(http.StatusOK, store)
}

// GetStores retrieves all merchant stores.
func (h *Handler) GetStores(c *gin.Context) {
	category := c.Query("category")
	stores, err := h.service.GetStores(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stores)
}

// UpdateStore updates an existing merchant store.
func (h *Handler) UpdateStore(c *gin.Context) {
	storeID := c.Param("id")
	var store models.MerchantStore
	if err := c.ShouldBindJSON(&store); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	store.ID = storeID

	// Ensure the authenticated merchant owns this store.

	if err := h.service.UpdateStore(&store); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, store)
}