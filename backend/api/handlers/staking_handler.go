package handlers

import (
	"net/http"

	"kelo-backend/pkg/staking"

	"github.com/gin-gonic/gin"
)

// StakingHandler handles HTTP requests for Staking
type StakingHandler struct {
	service *staking.Service
}

// NewStakingHandler creates a new Staking handler
func NewStakingHandler(service *staking.Service) *StakingHandler {
	return &StakingHandler{
		service: service,
	}
}

// RegisterRoutes registers the Staking routes
func (h *StakingHandler) RegisterRoutes(router *gin.RouterGroup) {
	staking := router.Group("/staking")
	{
		staking.GET("/pools", h.GetLiquidityPools)
		staking.POST("/deposit", h.DepositLiquidity)
		staking.POST("/withdraw", h.WithdrawLiquidity)
	}
}

// GetLiquidityPools lists available liquidity pools
func (h *StakingHandler) GetLiquidityPools(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"pools": []string{"pool1", "pool2"}})
}

// DepositLiquidity handles a deposit into a liquidity pool
func (h *StakingHandler) DepositLiquidity(c *gin.Context) {
	var req struct {
		Amount float64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deposit, err := h.service.DepositLiquidity(c.Request.Context(), req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, deposit)
}

// WithdrawLiquidity handles a withdrawal from a liquidity pool
func (h *StakingHandler) WithdrawLiquidity(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Withdrawal successful"})
}
