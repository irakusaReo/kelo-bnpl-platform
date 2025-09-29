package logger

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Init initializes the global logger
func Init(level string) {
	// Parse log level
	logLevel, err := zerolog.ParseLevel(level)
	if err != nil {
		logLevel = zerolog.InfoLevel
	}

	// Set global log level
	zerolog.SetGlobalLevel(logLevel)

	// Configure logger
	log.Logger = log.With().Timestamp().Logger()

	log.Info().Msgf("Logger initialized with level: %s", level)
}

// GinMiddleware returns a Gin middleware for logging HTTP requests
func GinMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Log after request is processed
		end := time.Now()
		latency := end.Sub(start)

		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		bodySize := c.Writer.Size()

		if raw != "" {
			path = path + "?" + raw
		}

		log.Info().
			Str("client_ip", clientIP).
			Str("method", method).
			Str("path", path).
			Int("status", statusCode).
			Int("body_size", bodySize).
			Dur("latency", latency).
			Msg("HTTP request")
	}
}

// RequestLogger creates a logger for HTTP requests
func RequestLogger(r *http.Request) *zerolog.Event {
	return log.Info().
		Str("method", r.Method).
		Str("path", r.URL.Path).
		Str("remote_addr", r.RemoteAddr).
		Str("user_agent", r.UserAgent())
}

// ErrorLogger creates a logger for errors
func ErrorLogger(err error) *zerolog.Event {
	return log.Error().Err(err)
}

// InfoLogger creates a logger for info messages
func InfoLogger() *zerolog.Event {
	return log.Info()
}

// DebugLogger creates a logger for debug messages
func DebugLogger() *zerolog.Event {
	return log.Debug()
}

// WarnLogger creates a logger for warning messages
func WarnLogger() *zerolog.Event {
	return log.Warn()
}