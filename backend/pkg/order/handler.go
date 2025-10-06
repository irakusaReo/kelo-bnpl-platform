package order

import (
	"kelo-backend/pkg/middleware"
	"kelo-backend/pkg/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for orders.
type Handler struct {
	service *Service
}

// NewHandler creates a new order handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers the order routes.
func (h *Handler) RegisterRoutes(router gin.IRouter) {
	orderRoutes := router.Group("/orders")
	orderRoutes.Use(middleware.AuthMiddleware("user", "merchant")) // Both users and merchants can be customers
	{
		orderRoutes.POST("/", h.CreateOrder)
		orderRoutes.GET("/", h.GetOrdersByUser)
		orderRoutes.GET("/:id", h.GetOrder)
	}
}

// CreateOrder handles the creation of a new order.
func (h *Handler) CreateOrder(c *gin.Context) {
	var order models.Order
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}
	order.UserID = userID.(string)

	createdOrder, err := h.service.CreateOrder(&order)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, createdOrder)
}

// GetOrdersByUser retrieves all orders for the authenticated user.
func (h *Handler) GetOrdersByUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	orders, err := h.service.GetOrdersByUser(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// GetOrder retrieves a single order.
func (h *Handler) GetOrder(c *gin.Context) {
	orderID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	order, err := h.service.GetOrder(orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Security check: Ensure the user requesting the order is the one who created it.
	// An admin or merchant might have different access rules.
	if order.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to view this order"})
		return
	}

	c.JSON(http.StatusOK, order)
}