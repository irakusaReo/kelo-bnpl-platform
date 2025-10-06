package liquidity

import (
	"kelo-backend/pkg/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for liquidity pools.
type Handler struct {
	service *Service
}

// NewHandler creates a new liquidity handler.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes registers the liquidity pool routes.
func (h *Handler) RegisterRoutes(router gin.IRouter) {
	poolRoutes := router.Group("/pools")
	// These endpoints should be accessible by both users and merchants.
	poolRoutes.Use(middleware.AuthMiddleware("user", "merchant"))
	{
		poolRoutes.GET("/", h.GetPools)
		poolRoutes.POST("/deposit", h.Deposit)
		poolRoutes.POST("/withdraw", h.Withdraw)
	}
}

// GetPools retrieves all liquidity pools.
func (h *Handler) GetPools(c *gin.Context) {
	pools, err := h.service.GetPools()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pools)
}

// Deposit handles a user depositing funds into a pool.
func (h *Handler) Deposit(c *gin.Context) {
	var req struct {
		PoolID string  `json:"pool_id" binding:"required"`
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")

	tx, err := h.service.Deposit(userID.(string), req.PoolID, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deposit successful", "transaction": tx})
}

// Withdraw handles a user withdrawing funds from a pool.
func (h *Handler) Withdraw(c *gin.Context) {
	var req struct {
		PoolID string  `json:"pool_id" binding:"required"`
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")

	tx, err := h.service.Withdraw(userID.(string), req.PoolID, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Withdrawal successful", "transaction": tx})
}