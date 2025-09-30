package creditscore

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"kelo-backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// CreditScoreHandler handles HTTP requests for credit scoring
type CreditScoreHandler struct {
	service *CreditScoreService
}

// NewCreditScoreHandler creates a new credit score handler
func NewCreditScoreHandler(service *CreditScoreService) *CreditScoreHandler {
	return &CreditScoreHandler{
		service: service,
	}
}

// RegisterRoutes registers the credit score routes with a gin router
func (h *CreditScoreHandler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api/v1/creditscore")
	api.Use(h.AuthMiddleware()) // Apply auth middleware to the group

	// Credit score routes
	api.GET("/:userID", h.GetCreditScore)
	api.PUT("/:userID", h.UpdateCreditScore)
	api.GET("/:userID/report", h.GetCreditScoreReport)
	api.GET("/:userID/history", h.GetCreditScoreHistory)

	// External data source routes
	api.POST("/:userID/datasources", h.AddExternalDataSource)

	// Analytics routes
	api.GET("/:userID/analytics", h.GetUserAnalytics)
	api.GET("/:userID/risk", h.GetRiskAssessment)
	api.GET("/:userID/eligibility", h.GetLoanEligibility)

	// DID-related routes
	api.GET("/:userID/did", h.GetDIDAnalysis)
	api.POST("/:userID/did/verify", h.VerifyDID)

	// HCS-related routes
	api.GET("/:userID/hcs/behavior", h.GetHCSBehavior)
	api.GET("/:userID/hcs/repayments", h.GetHCSRepayments)
	api.GET("/:userID/hcs/loans", h.GetHCSLoans)
}

// GetCreditScore handles GET /api/v1/creditscore/:userID
func (h *CreditScoreHandler) GetCreditScore(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	response, err := h.service.GetUserCreditScore(c.Request.Context(), userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get credit score")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteSuccessResponse(c, response)
}

// UpdateCreditScore handles PUT /api/v1/creditscore/:userID
func (h *CreditScoreHandler) UpdateCreditScore(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	response, err := h.service.UpdateUserCreditScore(c.Request.Context(), userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to update credit score")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteSuccessResponse(c, response)
}

// GetCreditScoreReport handles GET /api/v1/creditscore/:userID/report
func (h *CreditScoreHandler) GetCreditScoreReport(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	includeDetailed := c.Query("detailed") == "true"
	report, err := h.service.GenerateCreditScoreReport(c.Request.Context(), userID, includeDetailed)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to generate credit score report")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteSuccessResponse(c, report)
}

// GetCreditScoreHistory handles GET /api/v1/creditscore/:userID/history
func (h *CreditScoreHandler) GetCreditScoreHistory(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	history, err := h.service.GetCreditScoreHistory(c.Request.Context(), userID, limit)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get credit score history")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteSuccessResponse(c, history)
}

// AddExternalDataSource handles POST /api/v1/creditscore/:userID/datasources
func (h *CreditScoreHandler) AddExternalDataSource(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	var request struct {
		SourceType string `json:"source_type" binding:"required"`
		Identifier string `json:"identifier" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	err := h.service.AddExternalDataSource(c.Request.Context(), userID, request.SourceType, request.Identifier)
	if err != nil {
		log.Error().Err(err).
			Str("userID", userID).
			Str("sourceType", request.SourceType).
			Str("identifier", request.Identifier).
			Msg("Failed to add external data source")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	response := gin.H{
		"message":     "External data source added successfully",
		"source_type": request.SourceType,
		"identifier":  request.Identifier,
		"added_at":    time.Now(),
	}
	utils.WriteCreatedResponse(c, response)
}

// GetUserAnalytics handles GET /api/v1/creditscore/:userID/analytics
func (h *CreditScoreHandler) GetUserAnalytics(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	report, err := h.service.GenerateCreditScoreReport(c.Request.Context(), userID, true)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get user analytics")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	analytics := gin.H{
		"user_id":             userID,
		"current_score":       report.CurrentScore,
		"previous_score":      report.PreviousScore,
		"score_change":        report.ScoreChange,
		"rating":              report.Rating,
		"factors":             report.Factors,
		"on_chain_analysis":  report.OnChainAnalysis,
		"off_chain_analysis": report.OffChainAnalysis,
		"hcs_analysis":        report.HCSAnalysis,
		"generated_at":        time.Now(),
	}
	utils.WriteSuccessResponse(c, analytics)
}

// GetRiskAssessment handles GET /api/v1/creditscore/:userID/risk
func (h *CreditScoreHandler) GetRiskAssessment(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	report, err := h.service.GenerateCreditScoreReport(c.Request.Context(), userID, true)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get risk assessment")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	if report.RiskAssessment == nil {
		utils.WriteErrorResponse(c, http.StatusNotFound, "Risk assessment not available")
		return
	}

	utils.WriteSuccessResponse(c, report.RiskAssessment)
}

// GetLoanEligibility handles GET /api/v1/creditscore/:userID/eligibility
func (h *CreditScoreHandler) GetLoanEligibility(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	report, err := h.service.GenerateCreditScoreReport(c.Request.Context(), userID, true)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get loan eligibility")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	if report.LoanEligibility == nil {
		utils.WriteErrorResponse(c, http.StatusNotFound, "Loan eligibility assessment not available")
		return
	}

	utils.WriteSuccessResponse(c, report.LoanEligibility)
}

// GetDIDAnalysis handles GET /api/v1/creditscore/:userID/did
func (h *CreditScoreHandler) GetDIDAnalysis(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	report, err := h.service.GenerateCreditScoreReport(c.Request.Context(), userID, true)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get DID analysis")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	if report.DIDAnalysis == nil {
		utils.WriteErrorResponse(c, http.StatusNotFound, "DID analysis not available")
		return
	}

	utils.WriteSuccessResponse(c, report.DIDAnalysis)
}

// VerifyDID handles POST /api/v1/creditscore/:userID/did/verify
func (h *CreditScoreHandler) VerifyDID(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	var request struct {
		DID string `json:"did" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	if !ValidateDIDFormat(request.DID) {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "Invalid DID format")
		return
	}

	isVerified, err := h.service.didResolver.VerifyDID(c.Request.Context(), request.DID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("did", request.DID).Msg("Failed to verify DID")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	response := gin.H{
		"did":         request.DID,
		"is_verified": isVerified,
		"verified_at": time.Now(),
	}
	utils.WriteSuccessResponse(c, response)
}

// GetHCSBehavior handles GET /api/v1/creditscore/:userID/hcs/behavior
func (h *CreditScoreHandler) GetHCSBehavior(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	analytics, err := h.service.hcsAnalyzer.AnalyzeUserBehavior(c.Request.Context(), userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get HCS behavior analysis")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteSuccessResponse(c, analytics)
}

// GetHCSRepayments handles GET /api/v1/creditscore/:userID/hcs/repayments
func (h *CreditScoreHandler) GetHCSRepayments(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "90"))
	repayments, err := h.service.hcsAnalyzer.GetRepaymentHistory(c.Request.Context(), userID, days)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get HCS repayment history")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	response := gin.H{
		"user_id":    userID,
		"days":       days,
		"repayments": repayments,
		"count":      len(repayments),
		"generated_at": time.Now(),
	}
	utils.WriteSuccessResponse(c, response)
}

// GetHCSLoans handles GET /api/v1/creditscore/:userID/hcs/loans
func (h *CreditScoreHandler) GetHCSLoans(c *gin.Context) {
	userID := c.Param("userID")
	if userID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "User ID is required")
		return
	}

	days, _ := strconv.Atoi(c.DefaultQuery("days", "180"))
	loans, err := h.service.hcsAnalyzer.GetLoanHistory(c.Request.Context(), userID, days)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get HCS loan history")
		utils.WriteErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	response := gin.H{
		"user_id":     userID,
		"days":        days,
		"loans":       loans,
		"count":       len(loans),
		"generated_at": time.Now(),
	}
	utils.WriteSuccessResponse(c, response)
}

// AuthMiddleware creates a gin middleware for authentication and authorization
func (h *CreditScoreHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			utils.WriteErrorResponse(c, http.StatusUnauthorized, "Authorization token required")
			c.Abort()
			return
		}

		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}

		if token == "" {
			utils.WriteErrorResponse(c, http.StatusUnauthorized, "Invalid authorization token")
			c.Abort()
			return
		}

		// In a real implementation, you would validate the JWT and extract user info
		ctx := context.WithValue(c.Request.Context(), "userID", "user_id_from_token")
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}