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
	storeRoutes := router.Group("/stores")
	{
		storeRoutes.POST("/", middleware.AuthMiddleware("merchant"), h.CreateStore)
		storeRoutes.GET("/", h.GetStores)
		storeRoutes.GET("/:id", h.GetStore)
		storeRoutes.PUT("/:id", middleware.AuthMiddleware("merchant"), h.UpdateStore)
	}
}

// CreateStore handles the creation of a new merchant store.
func (h *Handler) CreateStore(c *gin.Context) {
	var store models.MerchantStore
	if err := c.ShouldBindJSON(&store); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real application, the merchant ID would be extracted from the JWT token.
	// For now, we'll assume the client provides it.

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