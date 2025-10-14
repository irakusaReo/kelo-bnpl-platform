package product

import (
	"kelo-backend/pkg/middleware"
	"kelo-backend/pkg/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for products.
type Handler struct {
	service *Service
}

// NewHandler creates a new product handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers the product routes.
func (h *Handler) RegisterRoutes(router gin.IRouter) {
	productRoutes := router.Group("/products")
	{
		productRoutes.GET("/", h.GetProducts)
		productRoutes.GET("/:id", h.GetProduct)
		productRoutes.POST("/", middleware.AuthMiddleware("merchant"), h.CreateProduct)
		productRoutes.PUT("/:id", middleware.AuthMiddleware("merchant"), h.UpdateProduct)
		productRoutes.DELETE("/:id", middleware.AuthMiddleware("merchant"), h.DeleteProduct)
		productRoutes.PATCH("/:id/stock", middleware.AuthMiddleware("merchant"), h.UpdateProductStock)
	}

	storeRoutes := router.Group("/stores")
	{
		storeRoutes.GET("/:store_id/products", h.GetProductsByStore)
	}
}

// CreateProduct handles the creation of a new product.
func (h *Handler) CreateProduct(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real application, you would get the merchant ID from the authenticated user
	// and ensure they own the store. For now, we'll assume the client provides it.

	if err := h.service.CreateProduct(&product); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, product)
}

// GetProduct retrieves a single product.
func (h *Handler) GetProduct(c *gin.Context) {
	productID := c.Param("id")
	product, err := h.service.GetProduct(productID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// GetProducts retrieves all products, optionally filtered by category.
func (h *Handler) GetProducts(c *gin.Context) {
	category := c.Query("category")
	products, err := h.service.GetProducts(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, products)
}

// GetProductsByStore retrieves all products for a store.
func (h *Handler) GetProductsByStore(c *gin.Context) {
	storeID := c.Param("store_id")
	products, err := h.service.GetProductsByStore(storeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, products)
}

// UpdateProduct updates an existing product.
func (h *Handler) UpdateProduct(c *gin.Context) {
	productID := c.Param("id")
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product.ID = productID

	// Again, ensure the authenticated merchant owns this product.

	if err := h.service.UpdateProduct(&product); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, product)
}

// DeleteProduct deletes a product.
func (h *Handler) DeleteProduct(c *gin.Context) {
	productID := c.Param("id")

	// Ensure the authenticated merchant owns this product.

	if err := h.service.DeleteProduct(productID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// UpdateProductStock handles updating the stock of a product.
func (h *Handler) UpdateProductStock(c *gin.Context) {
	productID := c.Param("id")
	var payload struct {
		Stock int `json:"stock"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	product, err := h.service.UpdateProductStock(productID, payload.Stock)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, product)
}