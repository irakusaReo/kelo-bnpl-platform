package middleware

import (
	"fmt"
	"kelo-backend/pkg/config"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// AuthMiddleware creates a middleware handler that verifies the JWT token
// and checks if the user has one of the required roles.
func AuthMiddleware(requiredRoles ...string) gin.HandlerFunc {
	// In a production app, the config should be loaded once and passed around,
	// not loaded on every middleware instantiation.
	cfg, err := config.Load()
	if err != nil {
		// If config fails to load, the middleware will always fail.
		// This is a design choice to ensure the app doesn't run with invalid config.
		panic(fmt.Sprintf("Failed to load configuration for auth middleware: %v", err))
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is missing"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format, must be Bearer token"})
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(cfg.SupabaseJWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			return
		}

		// Extract user ID (subject) and role from claims
		userID, ok := claims["sub"].(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User ID (sub) not found in token"})
			return
		}

		appMetadata, ok := claims["app_metadata"].(map[string]interface{})
        if !ok {
            // Supabase might not include app_metadata if it's empty.
            // We'll check for the role claim directly for broader compatibility.
            appMetadata = claims
        }

		userRole, ok := appMetadata["role"].(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Role not found in token claims"})
			return
		}

		// Check if the user has one of the required roles
		if len(requiredRoles) > 0 {
			hasRequiredRole := false
			for _, requiredRole := range requiredRoles {
				if userRole == requiredRole {
					hasRequiredRole = true
					break
				}
			}

			if !hasRequiredRole {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "You don't have permission to access this resource"})
				return
			}
		}

		// Set user info in context for downstream handlers
		c.Set("userID", userID)
		c.Set("userRole", userRole)

		c.Next()
	}
}