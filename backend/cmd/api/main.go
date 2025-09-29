package main

import (
        "context"
        "fmt"
        "log"
        "net/http"
        "os"
        "os/signal"
        "syscall"
        "time"

        "kelo-backend/api/routes"
        "kelo-backend/internal/auth"
        "kelo-backend/internal/credit"
        "kelo-backend/internal/relayer"
        "kelo-backend/pkg/blockchain"
        "kelo-backend/pkg/config"
        "kelo-backend/pkg/creditscore"
        "kelo-backend/pkg/logger"
        "kelo-backend/pkg/models"

        "github.com/gin-gonic/gin"
        "github.com/rs/zerolog/log"
        "github.com/gorilla/mux"
        "gorm.io/driver/postgres"
        "gorm.io/gorm"
        "gorm.io/gorm/logger"
)

func main() {
        // Load configuration
        cfg, err := config.Load()
        if err != nil {
                log.Fatal("Failed to load configuration:", err)
        }

        // Initialize logger
        logger.Init(cfg.LogLevel)

        // Connect to database
        db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
                Logger: logger.Default.LogMode(logger.Silent),
        })
        if err != nil {
                log.Fatal("Failed to connect to database:", err)
        }

        // Auto migrate database models
        if err := db.AutoMigrate(
                &models.User{},
                &models.Merchant{},
                &models.Loan{},
                &models.Repayment{},
                &models.LiquidityPool{},
                &models.LiquidityProvider{},
                &models.CreditScore{},
                &models.Transaction{},
        ); err != nil {
                log.Fatal("Failed to migrate database:", err)
        }

        // Initialize blockchain clients
        blockchainClients, err := blockchain.NewClients(cfg)
        if err != nil {
                log.Fatal("Failed to initialize blockchain clients:", err)
        }

        // Initialize services
        authService := auth.NewService(cfg, db)
        creditService := credit.NewService(cfg, db, blockchainClients)
        relayerService := relayer.NewService(cfg, db, blockchainClients)
        
        // Initialize credit scoring engine
        creditScoreService := creditscore.NewCreditScoreService(db, blockchainClients, cfg)
        creditScoreHandler := creditscore.NewCreditScoreHandler(creditScoreService)

        // Initialize Gin router
        if cfg.Environment == "production" {
                gin.SetMode(gin.ReleaseMode)
        }

        router := gin.New()
        router.Use(gin.Recovery())
        
        // Add custom middleware
        router.Use(logger.GinMiddleware())
        router.Use(corsMiddleware())

        // Setup routes
        routes.SetupRoutes(router, authService, creditService, relayerService)
        
        // Create separate router for credit scoring API (using gorilla/mux)
        creditRouter := mux.NewRouter()
        creditScoreHandler.RegisterRoutes(creditRouter)
        
        // Apply authentication middleware to credit scoring routes
        creditRouter.Use(creditScoreHandler.AuthMiddleware)

        // Create HTTP server
        srv := &http.Server{
                Addr:         fmt.Sprintf(":%d", cfg.Port),
                Handler:      router,
                ReadTimeout:  15 * time.Second,
                WriteTimeout: 15 * time.Second,
                IdleTimeout:  60 * time.Second,
        }
        
        // Create separate server for credit scoring API
        creditSrv := &http.Server{
                Addr:         fmt.Sprintf(":%d", cfg.Port+1), // Run on port + 1
                Handler:      creditRouter,
                ReadTimeout:  15 * time.Second,
                WriteTimeout: 15 * time.Second,
                IdleTimeout:  60 * time.Second,
        }

        // Start servers in goroutines
        go func() {
                log.Info().Msgf("Starting main server on port %d", cfg.Port)
                if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
                        log.Fatal().Err(err).Msg("Failed to start main server")
                }
        }()
        
        go func() {
                log.Info().Msgf("Starting credit scoring API server on port %d", cfg.Port+1)
                if err := creditSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
                        log.Fatal().Err(err).Msg("Failed to start credit scoring server")
                }
        }()

        // Start background services
        go startBackgroundServices(cfg, creditService, relayerService, creditScoreService)

        // Wait for interrupt signal
        quit := make(chan os.Signal, 1)
        signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
        <-quit

        log.Info().Msg("Shutting down server...")

        // Graceful shutdown with timeout
        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()

        // Shutdown both servers
        shutdownErr := make(chan error, 2)
        
        go func() {
                if err := srv.Shutdown(ctx); err != nil {
                        shutdownErr <- fmt.Errorf("main server shutdown error: %w", err)
                } else {
                        shutdownErr <- nil
                }
        }()
        
        go func() {
                if err := creditSrv.Shutdown(ctx); err != nil {
                        shutdownErr <- fmt.Errorf("credit scoring server shutdown error: %w", err)
                } else {
                        shutdownErr <- nil
                }
        }()
        
        // Wait for both servers to shutdown
        for i := 0; i < 2; i++ {
                if err := <-shutdownErr; err != nil {
                        log.Fatal().Err(err).Msg("Server forced to shutdown")
                }
        }

        log.Info().Msg("Server exited")
}

func corsMiddleware() gin.HandlerFunc {
        return func(c *gin.Context) {
                c.Header("Access-Control-Allow-Origin", "*")
                c.Header("Access-Control-Allow-Credentials", "true")
                c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
                c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

                if c.Request.Method == "OPTIONS" {
                        c.AbortWithStatus(204)
                        return
                }

                c.Next()
        }
}

func startBackgroundServices(cfg *config.Config, creditService *credit.Service, relayerService *relayer.Service, creditScoreService *creditscore.CreditScoreService) {
        // Start credit scoring background job
        go func() {
                ticker := time.NewTicker(24 * time.Hour) // Run daily
                defer ticker.Stop()

                for range ticker.C {
                        if err := creditService.UpdateCreditScores(); err != nil {
                                log.Error().Err(err).Msg("Failed to update credit scores")
                        }
                }
        }()

        // Start credit scoring engine background job
        go func() {
                ticker := time.NewTicker(6 * time.Hour) // Run every 6 hours
                defer ticker.Stop()

                for range ticker.C {
                        // Update credit scores for active users
                        // This is a simplified implementation
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

        // Start blockchain monitoring
        go func() {
                ticker := time.NewTicker(1 * time.Minute) // Check every minute
                defer ticker.Stop()

                for range ticker.C {
                        if err := relayerService.MonitorBlockchainEvents(); err != nil {
                                log.Error().Err(err).Msg("Failed to monitor blockchain events")
                        }
                }
        }()

        log.Info().Msg("Background services started")
}