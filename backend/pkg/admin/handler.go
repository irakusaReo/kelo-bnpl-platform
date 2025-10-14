package admin

import (
	"kelo-backend/pkg/middleware"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	admin := router.Group("/admin")
	admin.Use(middleware.AuthMiddleware("Admin"))
	{
		// User Management
		admin.GET("/users", h.GetUsers)
		admin.GET("/users/:id", h.GetUser)
		admin.PUT("/users/:id/suspend", h.SuspendUser)
		admin.PUT("/users/:id/unsuspend", h.UnsuspendUser)
		admin.PUT("/users/:id/role", h.ChangeUserRole)

		// Merchant Management
		admin.GET("/merchants", h.GetMerchants)
		admin.GET("/merchants/:id", h.GetMerchant)
		admin.PUT("/merchants/:id/approve", h.ApproveMerchant)
		admin.PUT("/merchants/:id/suspend", h.SuspendMerchant)

		// Platform Analytics
		admin.GET("/analytics", h.GetPlatformAnalytics)
	}
}

func (h *Handler) GetUsers(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if err != nil || pageSize <= 0 {
		pageSize = 10
	}

	search := c.Query("search")

	users, err := h.service.GetUsers(c.Request.Context(), page, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func (h *Handler) GetUser(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	user, err := h.service.GetUser(c.Request.Context(), userID)
	if err != nil {
		// In a real app, you'd check for a specific "not found" error.
		// For now, we'll assume any error from the service is a 404.
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *Handler) SuspendUser(c *gin.Context) {
	userID := c.Param("id")
	if err := h.service.UpdateUserStatus(c.Request.Context(), userID, "SUSPENDED"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to suspend user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User suspended successfully"})
}

func (h *Handler) UnsuspendUser(c *gin.Context) {
	userID := c.Param("id")
	if err := h.service.UpdateUserStatus(c.Request.Context(), userID, "ACTIVE"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unsuspend user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User unsuspended successfully"})
}

func (h *Handler) ChangeUserRole(c *gin.Context) {
	userID := c.Param("id")
	var req struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.service.ChangeUserRole(c.Request.Context(), userID, req.Role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change user role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role updated successfully"})
}

func (h *Handler) GetMerchants(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if err != nil || pageSize <= 0 {
		pageSize = 10
	}

	status := c.Query("status")
	search := c.Query("search")

	merchants, err := h.service.GetMerchants(c.Request.Context(), page, pageSize, status, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch merchants"})
		return
	}

	c.JSON(http.StatusOK, merchants)
}

func (h *Handler) GetMerchant(c *gin.Context) {
	merchantID := c.Param("id")
	if merchantID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Merchant ID is required"})
		return
	}

	merchant, err := h.service.GetMerchant(c.Request.Context(), merchantID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Merchant not found"})
		return
	}

	c.JSON(http.StatusOK, merchant)
}

func (h *Handler) ApproveMerchant(c *gin.Context) {
	merchantID := c.Param("id")
	if err := h.service.UpdateMerchantStatus(c.Request.Context(), merchantID, "APPROVED"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve merchant"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Merchant approved successfully"})
}

func (h *Handler) SuspendMerchant(c *gin.Context) {
	merchantID := c.Param("id")
	if err := h.service.UpdateMerchantStatus(c.Request.Context(), merchantID, "SUSPENDED"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to suspend merchant"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Merchant suspended successfully"})
}

func (h *Handler) GetPlatformAnalytics(c *gin.Context) {
	analytics, err := h.service.GetPlatformAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch platform analytics"})
		return
	}

	c.JSON(http.StatusOK, analytics)
}
