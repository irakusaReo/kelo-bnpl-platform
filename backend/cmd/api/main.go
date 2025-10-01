package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"kelo-backend/pkg/blockchain"
	"kelo-backend/pkg/config"
	"kelo-backend/pkg/creditscore"
	"kelo-backend/pkg/logger"
	"kelo-backend/pkg/models"
	"kelo-backend/pkg/relayer"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/supabase/postgrest-go"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Initialize logger
	logger.Init(cfg.LogLevel)

	// Initialize Supabase client
	supabaseClient := postgrest.NewClient(cfg.SupabaseURL, "public", nil)
	if supabaseClient.ClientError != nil {
		log.Fatal().Err(supabaseClient.ClientError).Msg("Failed to initialize Supabase client")
	}
	supabaseClient.TokenAuth(cfg.SupabaseServiceRoleKey)


	// Initialize blockchain clients
	blockchainClients, err := blockchain.NewClients(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize blockchain clients")
	}

	// Initialize services
	creditScoreService := creditscore.NewCreditScoreService(supabaseClient, blockchainClients, cfg)
	relayerService, err := relayer.NewTrustedRelayer(cfg, blockchainClients)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize relayer service")
	}

	// Initialize handlers
	creditScoreHandler := creditscore.NewCreditScoreHandler(creditScoreService)
	relayerHandler := relayer.NewHandler(relayerService)

	// Initialize Gin router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(logger.GinMiddleware())
	router.Use(corsMiddleware())

	// Setup routes
	creditScoreHandler.RegisterRoutes(router)
	relayerHandler.RegisterRoutes(router)

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Info().Msgf("Starting server on port %d", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// Start background services
	go startBackgroundServices(relayerService, creditScoreService)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	log.Info().Msg("Server exited")
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func startBackgroundServices(relayerService *relayer.TrustedRelayer, creditScoreService *creditscore.CreditScoreService) {
	// Start credit scoring background job
	go func() {
		ticker := time.NewTicker(6 * time.Hour) // Run every 6 hours
		defer ticker.Stop()

		for range ticker.C {
			log.Info().Msg("Running credit scoring engine background job")
			// In a real implementation, you would query for users who need score updates
		}
	}()

	// Start relayer service
	go func() {
		if err := relayerService.Start(); err != nil {
			log.Error().Err(err).Msg("Failed to start relayer service")
		}
	}()

	log.Info().Msg("Background services started")
}