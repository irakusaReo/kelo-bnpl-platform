package zk

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

type ZKHandler struct {
	service *ZKService
}

func NewZKHandler(service *ZKService) *ZKHandler {
	return &ZKHandler{service: service}
}

func (h *ZKHandler) RegisterRoutes(router *gin.RouterGroup) {
	router.POST("/zk/generate-inputs", h.generateInputs)
	router.POST("/zk/submit-proof", h.submitProof)
}

func (h *ZKHandler) generateInputs(c *gin.Context) {
	var req struct {
		UserID string `json:"user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	inputs, err := h.service.GenerateZKInputs(c.Request.Context(), req.UserID)
	if err != nil {
		log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to generate ZK inputs")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate ZK inputs"})
		return
	}

	c.JSON(http.StatusOK, inputs)
}

type SubmitProofRequest struct {
	UserID       string   `json:"user_id"`
	Proof        []byte   `json:"proof"`
	PublicInputs [][]byte `json:"public_inputs"`
}

func (h *ZKHandler) submitProof(c *gin.Context) {
	var req SubmitProofRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	txHash, err := h.service.SubmitZKProof(c.Request.Context(), req.UserID, req.Proof, req.PublicInputs)
	if err != nil {
		log.Error().Err(err).Str("userID", req.UserID).Msg("Failed to submit ZK proof")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit ZK proof"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tx_hash": txHash})
}
