package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"kelo-backend/pkg/blockchain"
	"kelo-backend/pkg/config"
	"kelo-backend/pkg/logger"
	"kelo-backend/pkg/relayer"

	"github.com/rs/zerolog/log"
)

func main() {
	// Parse command line flags
	var (
		configPath = flag.String("config", "", "Path to configuration file")
		version    = flag.Bool("version", false, "Show version information")
	)
	flag.Parse()

	if *version {
		fmt.Println("Kelo Trusted Relayer v1.0.0")
		os.Exit(0)
	}

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Initialize logger
	if err := logger.Initialize(cfg.LogLevel); err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize logger")
	}

	log.Info().
		Str("environment", cfg.Environment).
		Str("version", "1.0.0").
		Msg("Starting Kelo Trusted Relayer")

	// Create context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize blockchain clients
	bc, err := blockchain.NewClients(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize blockchain clients")
	}

	// Initialize trusted relayer
	relayer, err := relayer.NewTrustedRelayer(cfg, bc)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize trusted relayer")
	}

	// Set up signal handling
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start the relayer service
	if err := relayer.Start(); err != nil {
		log.Fatal().Err(err).Msg("Failed to start trusted relayer")
	}

	// Wait for shutdown signal
	select {
	case <-sigChan:
		log.Info().Msg("Received shutdown signal")
	case <-ctx.Done():
		log.Info().Msg("Context cancelled")
	}

	// Graceful shutdown
	log.Info().Msg("Shutting down trusted relayer...")
	
	if err := relayer.Stop(); err != nil {
		log.Error().Err(err).Msg("Error during shutdown")
	} else {
		log.Info().Msg("Trusted relayer stopped successfully")
	}
}