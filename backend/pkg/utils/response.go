package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// WriteErrorResponse sends a JSON error response.
func WriteErrorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{"error": message})
}

// WriteSuccessResponse sends a JSON success response with status 200.
func WriteSuccessResponse(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, data)
}

// WriteCreatedResponse sends a JSON success response with status 201.
func WriteCreatedResponse(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, data)
}