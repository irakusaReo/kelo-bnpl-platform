package creditscore

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"kelo-backend/pkg/models"

	"github.com/gorilla/mux"
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

// RegisterRoutes registers the credit score routes
func (h *CreditScoreHandler) RegisterRoutes(router *mux.Router) {
	// Credit score routes
	router.HandleFunc("/api/v1/creditscore/{userID}", h.GetCreditScore).Methods("GET")
	router.HandleFunc("/api/v1/creditscore/{userID}", h.UpdateCreditScore).Methods("PUT")
	router.HandleFunc("/api/v1/creditscore/{userID}/report", h.GetCreditScoreReport).Methods("GET")
	router.HandleFunc("/api/v1/creditscore/{userID}/history", h.GetCreditScoreHistory).Methods("GET")
	
	// External data source routes
	router.HandleFunc("/api/v1/creditscore/{userID}/datasources", h.AddExternalDataSource).Methods("POST")
	
	// Analytics routes
	router.HandleFunc("/api/v1/creditscore/{userID}/analytics", h.GetUserAnalytics).Methods("GET")
	router.HandleFunc("/api/v1/creditscore/{userID}/risk", h.GetRiskAssessment).Methods("GET")
	router.HandleFunc("/api/v1/creditscore/{userID}/eligibility", h.GetLoanEligibility).Methods("GET")
	
	// DID-related routes
	router.HandleFunc("/api/v1/creditscore/{userID}/did", h.GetDIDAnalysis).Methods("GET")
	router.HandleFunc("/api/v1/creditscore/{userID}/did/verify", h.VerifyDID).Methods("POST")
	
	// HCS-related routes
	router.HandleFunc("/api/v1/creditscore/{userID}/hcs/behavior", h.GetHCSBehavior).Methods("GET")
	router.HandleFunc("/api/v1/creditscore/{userID}/hcs/repayments", h.GetHCSRepayments).Methods("GET")
	router.HandleFunc("/api/v1/creditscore/{userID}/hcs/loans", h.GetHCSLoans).Methods("GET")
}

// GetCreditScore handles GET /api/v1/creditscore/{userID}
func (h *CreditScoreHandler) GetCreditScore(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	response, err := h.service.GetUserCreditScore(ctx, userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get credit score")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// UpdateCreditScore handles PUT /api/v1/creditscore/{userID}
func (h *CreditScoreHandler) UpdateCreditScore(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	response, err := h.service.UpdateUserCreditScore(ctx, userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to update credit score")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetCreditScoreReport handles GET /api/v1/creditscore/{userID}/report
func (h *CreditScoreHandler) GetCreditScoreReport(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	includeDetailed := r.URL.Query().Get("detailed") == "true"

	ctx := r.Context()
	report, err := h.service.GenerateCreditScoreReport(ctx, userID, includeDetailed)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to generate credit score report")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(report)
}

// GetCreditScoreHistory handles GET /api/v1/creditscore/{userID}/history
func (h *CreditScoreHandler) GetCreditScoreHistory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	limit := 10 // Default limit

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	ctx := r.Context()
	history, err := h.service.GetCreditScoreHistory(ctx, userID, limit)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get credit score history")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(history)
}

// AddExternalDataSource handles POST /api/v1/creditscore/{userID}/datasources
func (h *CreditScoreHandler) AddExternalDataSource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	var request struct {
		SourceType string `json:"source_type" validate:"required"`
		Identifier string `json:"identifier" validate:"required"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if request.SourceType == "" || request.Identifier == "" {
		http.Error(w, "Source type and identifier are required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	err := h.service.AddExternalDataSource(ctx, userID, request.SourceType, request.Identifier)
	if err != nil {
		log.Error().Err(err).
			Str("userID", userID).
			Str("sourceType", request.SourceType).
			Str("identifier", request.Identifier).
			Msg("Failed to add external data source")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"message":     "External data source added successfully",
		"source_type": request.SourceType,
		"identifier":  request.Identifier,
		"added_at":    time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetUserAnalytics handles GET /api/v1/creditscore/{userID}/analytics
func (h *CreditScoreHandler) GetUserAnalytics(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Get detailed credit score report with analytics
	ctx := r.Context()
	report, err := h.service.GenerateCreditScoreReport(ctx, userID, true)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get user analytics")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Extract analytics data
	analytics := map[string]interface{}{
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(analytics)
}

// GetRiskAssessment handles GET /api/v1/creditscore/{userID}/risk
func (h *CreditScoreHandler) GetRiskAssessment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Get credit score report with risk assessment
	ctx := r.Context()
	report, err := h.service.GenerateCreditScoreReport(ctx, userID, true)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get risk assessment")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if report.RiskAssessment == nil {
		http.Error(w, "Risk assessment not available", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(report.RiskAssessment)
}

// GetLoanEligibility handles GET /api/v1/creditscore/{userID}/eligibility
func (h *CreditScoreHandler) GetLoanEligibility(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Get credit score report with loan eligibility
	ctx := r.Context()
	report, err := h.service.GenerateCreditScoreReport(ctx, userID, true)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get loan eligibility")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if report.LoanEligibility == nil {
		http.Error(w, "Loan eligibility assessment not available", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(report.LoanEligibility)
}

// GetDIDAnalysis handles GET /api/v1/creditscore/{userID}/did
func (h *CreditScoreHandler) GetDIDAnalysis(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Get credit score report with DID analysis
	ctx := r.Context()
	report, err := h.service.GenerateCreditScoreReport(ctx, userID, true)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get DID analysis")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if report.DIDAnalysis == nil {
		http.Error(w, "DID analysis not available", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(report.DIDAnalysis)
}

// VerifyDID handles POST /api/v1/creditscore/{userID}/did/verify
func (h *CreditScoreHandler) VerifyDID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	var request struct {
		DID string `json:"did" validate:"required"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if request.DID == "" {
		http.Error(w, "DID is required", http.StatusBadRequest)
		return
	}

	// Validate DID format
	if !ValidateDIDFormat(request.DID) {
		http.Error(w, "Invalid DID format", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	isVerified, err := h.service.didResolver.VerifyDID(ctx, request.DID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Str("did", request.DID).Msg("Failed to verify DID")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"did":         request.DID,
		"is_verified": isVerified,
		"verified_at": time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetHCSBehavior handles GET /api/v1/creditscore/{userID}/hcs/behavior
func (h *CreditScoreHandler) GetHCSBehavior(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	analytics, err := h.service.hcsAnalyzer.AnalyzeUserBehavior(ctx, userID)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get HCS behavior analysis")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(analytics)
}

// GetHCSRepayments handles GET /api/v1/creditscore/{userID}/hcs/repayments
func (h *CreditScoreHandler) GetHCSRepayments(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	daysStr := r.URL.Query().Get("days")
	days := 90 // Default 90 days

	if daysStr != "" {
		if parsedDays, err := strconv.Atoi(daysStr); err == nil && parsedDays > 0 {
			days = parsedDays
		}
	}

	ctx := r.Context()
	repayments, err := h.service.hcsAnalyzer.GetRepaymentHistory(ctx, userID, days)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get HCS repayment history")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"user_id":    userID,
		"days":       days,
		"repayments": repayments,
		"count":      len(repayments),
		"generated_at": time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetHCSLoans handles GET /api/v1/creditscore/{userID}/hcs/loans
func (h *CreditScoreHandler) GetHCSLoans(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Parse query parameters
	daysStr := r.URL.Query().Get("days")
	days := 180 // Default 180 days

	if daysStr != "" {
		if parsedDays, err := strconv.Atoi(daysStr); err == nil && parsedDays > 0 {
			days = parsedDays
		}
	}

	ctx := r.Context()
	loans, err := h.service.hcsAnalyzer.GetLoanHistory(ctx, userID, days)
	if err != nil {
		log.Error().Err(err).Str("userID", userID).Msg("Failed to get HCS loan history")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"user_id":     userID,
		"days":        days,
		"loans":       loans,
		"count":       len(loans),
		"generated_at": time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Middleware for authentication and authorization
func (h *CreditScoreHandler) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "Authorization token required", http.StatusUnauthorized)
			return
		}

		// Remove "Bearer " prefix if present
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}

		// Validate token (this is a simplified implementation)
		// In a real implementation, you would validate the JWT token
		if token == "" {
			http.Error(w, "Invalid authorization token", http.StatusUnauthorized)
			return
		}

		// Add user context (simplified)
		ctx := r.Context()
		ctx = contextWithUserID(ctx, "user_id_from_token") // In real implementation, extract from token

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Helper function to add user ID to context
func contextWithUserID(ctx context.Context, userID string) context.Context {
	// In a real implementation, you would use a proper context key type
	type contextKey string
	const userIDKey contextKey = "userID"
	return context.WithValue(ctx, userIDKey, userID)
}

// Helper function to get user ID from context
func getUserIDFromContext(ctx context.Context) (string, bool) {
	type contextKey string
	const userIDKey contextKey = "userID"
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}

// Error response helper
func writeErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}

// Success response helper
func writeSuccessResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)
}

// Created response helper
func writeCreatedResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(data)
}