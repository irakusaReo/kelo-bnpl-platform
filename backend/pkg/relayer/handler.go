package relayer

import (
	"net/http"

	"kelo-backend/pkg/middleware"
	"kelo-backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

// Handler handles HTTP requests for the relayer service.
type Handler struct {
	service *TrustedRelayer
}

// NewHandler creates a new relayer handler.
func NewHandler(service *TrustedRelayer) *Handler {
	return &Handler{
		service: service,
	}
}

// RegisterRoutes registers the relayer's admin routes with a gin router.
func (h *Handler) RegisterRoutes(router gin.IRouter) {
	// All relayer routes are for admins only.
	admin := router.Group("/api/v1/admin/relayer")
	admin.Use(middleware.AuthMiddleware("admin"))

	admin.GET("/status", h.GetRelayerStatus)
	admin.GET("/metrics", h.GetRelayerMetrics)
	admin.GET("/messages/:id", h.GetMessageStatus)
}

// GetRelayerStatus provides a simple status check for the relayer.
func (h *Handler) GetRelayerStatus(c *gin.Context) {
	// In a real-world scenario, this would check the health of underlying connections.
	// For now, we'll return a simple "running" status if the handler is active.
	utils.WriteSuccessResponse(c, gin.H{
		"status": "running",
		"address": h.service.publicAddress.Hex(),
	})
}

// GetRelayerMetrics returns the current performance metrics for the relayer.
func (h *Handler) GetRelayerMetrics(c *gin.Context) {
	metrics := h.service.GetMetrics()
	utils.WriteSuccessResponse(c, metrics)
}

// GetMessageStatus returns the status of a specific message being processed by the relayer.
func (h *Handler) GetMessageStatus(c *gin.Context) {
	messageID := c.Param("id")
	if messageID == "" {
		utils.WriteErrorResponse(c, http.StatusBadRequest, "Message ID is required")
		return
	}

	message, err := h.service.GetMessageStatus(messageID)
	if err != nil {
		utils.WriteErrorResponse(c, http.StatusNotFound, err.Error())
		return
	}

	utils.WriteSuccessResponse(c, message)
}