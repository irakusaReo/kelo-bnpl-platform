package handlers

import (
	"kelo-backend/pkg/bnpl"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RepaymentHandler struct {
	service *bnpl.RepaymentService
}

func NewRepaymentHandler(service *bnpl.RepaymentService) *RepaymentHandler {
	return &RepaymentHandler{service: service}
}

type RepaymentRequest struct {
	LoanID string  `json:"loan_id" binding:"required"`
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

// HandleRepayment processes a user's request to make a loan repayment.
// @Summary Make a loan repayment
// @Description Processes a payment for an outstanding loan.
// @Tags Repayment
// @Accept json
// @Produce json
// @Param repayment body RepaymentRequest true "Repayment Details"
// @Success 200 {object} map[string]string "message: Repayment successful"
// @Failure 400 {object} map[string]string "error: Invalid request payload"
// @Failure 401 {object} map[string]string "error: Unauthorized"
// @Failure 500 {object} map[string]string "error: Internal server error"
// @Router /repayment [post]
func (h *RepaymentHandler) HandleRepayment(c *gin.Context) {
	// Extract user ID from the Gin context (set by AuthMiddleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format in token"})
		return
	}

	var req RepaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.ProcessRepayment(c.Request.Context(), userIDStr, req.LoanID, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Repayment successful"})
}
