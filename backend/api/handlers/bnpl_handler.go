package handlers

import (
	"net/http"

	"kelo-backend/pkg/bnpl"

	"github.com/gin-gonic/gin"
)

// BNPLHandler handles HTTP requests for BNPL
type BNPLHandler struct {
	service *bnpl.Service
}

// NewBNPLHandler creates a new BNPL handler
func NewBNPLHandler(service *bnpl.Service) *BNPLHandler {
	return &BNPLHandler{
		service: service,
	}
}

// RegisterRoutes registers the BNPL routes
func (h *BNPLHandler) RegisterRoutes(router *gin.RouterGroup) {
	bnpl := router.Group("/bnpl")
	{
		bnpl.POST("/apply", h.ApplyForLoan)
		bnpl.GET("/loans", h.GetUserLoans)
		bnpl.GET("/loans/:id", h.GetLoanDetails)
		bnpl.POST("/loans/:id/repay", h.MakeLoanRepayment)
	}
}

// ApplyForLoan handles a loan application
func (h *BNPLHandler) ApplyForLoan(c *gin.Context) {
	var req struct {
		Amount float64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	loan, err := h.service.ApplyForLoan(c.Request.Context(), req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, loan)
}

// GetUserLoans lists loans for the current user
func (h *BNPLHandler) GetUserLoans(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"loans": []string{"loan1", "loan2"}})
}

// GetLoanDetails gets details for a specific loan
func (h *BNPLHandler) GetLoanDetails(c *gin.Context) {
	loanID := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"loan_id": loanID, "amount": 50000})
}

// MakeLoanRepayment handles a loan repayment
func (h *BNPLHandler) MakeLoanRepayment(c *gin.Context) {
	loanID := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"message": "Repayment for loan " + loanID + " submitted successfully"})
}
