package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
)

// CustomClaims defines the structure of the JWT claims we care about.
type CustomClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates the Supabase JWT token from the Authorization header.
// This is a Gin-compatible middleware.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Warn().Msg("Authorization header is missing")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			log.Warn().Msg("Bearer token is missing or malformed")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Bearer token is required"})
			return
		}

		jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
		if jwtSecret == "" {
			log.Error().Msg("SUPABASE_JWT_SECRET environment variable not set")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Server configuration error"})
			return
		}

		token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Don't forget to validate the alg is what you expect:
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, gin.H{"error": "Unexpected signing method"}
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			log.Warn().Err(err).Msg("Failed to parse JWT")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
			// Token is valid. Add claims to the request context for downstream handlers.
			c.Set("userClaims", claims)
			c.Next()
		} else {
			log.Warn().Msg("Invalid JWT or claims")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
	}
}

// AdminOnlyMiddleware checks if the user has the 'admin' role.
// This should be chained after AuthMiddleware.
func AdminOnlyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		claimsValue, exists := c.Get("userClaims")
		if !exists {
			// This should not happen if AuthMiddleware is used first.
			log.Error().Msg("User claims not found in context")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Server processing error"})
			return
		}

		claims, ok := claimsValue.(*CustomClaims)
		if !ok {
			log.Error().Msg("Could not cast claims from context")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Server processing error"})
			return
		}

		if claims.Role != "admin" {
			log.Warn().Str("role", claims.Role).Msg("Admin access denied")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admins only"})
			return
		}

		c.Next()
	}
}