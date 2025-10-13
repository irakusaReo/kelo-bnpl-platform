package config

import (
        "fmt"
        "os"
        "strconv"
        "strings"

        "github.com/joho/godotenv"
        "github.com/spf13/viper"
)

type Config struct {
        Port                   int
        Environment            string
        LogLevel               string
        SupabaseURL            string
        SupabaseServiceRoleKey string
        SupabaseJWTSecret      string
        HederaNetwork          string
        HederaContractAddress  string
        LayerZeroEndpoint      string
        LayerZeroAPIKey        string
        EthereumRPC            string
        EthereumLiquidityPool  string
        BaseRPC                string
        BaseLiquidityPool      string
        ArbitrumRPC            string
        ArbitrumLiquidityPool  string
        AvalancheRPC           string
        AvalancheLiquidityPool string
        CeloRPC                string
        CeloLiquidityPool      string
        PolygonRPC             string
        PolygonLiquidityPool   string
        KavaRPC                string
        KavaLiquidityPool      string
        SolanaRPC              string
        AptosRPC               string
        MpesaAPIKey            string
        MpesaSecret            string
        RedisURL               string
        RelayerPrivateKey      string
        MaxRetries             int
}

func Load() (*Config, error) {
        // Load .env file from the current directory
        err := godotenv.Load()
        if err != nil {
                // If it fails, try loading from the parent directory (for when running from /backend)
                err = godotenv.Load("../.env")
                if err != nil {
                        fmt.Println("No .env file found in current or parent directory")
                }
        }

        // Set default values
        viper.SetDefault("PORT", 8080)
        viper.SetDefault("ENVIRONMENT", "development")
        viper.SetDefault("LOG_LEVEL", "info")
        viper.SetDefault("HEDERA_NETWORK", "testnet")

        // Configure viper
        viper.AutomaticEnv()
        viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

        // Read configuration
        cfg := &Config{
                Port:                   getEnvAsInt("PORT", 8080),
                Environment:            getEnv("ENVIRONMENT", "development"),
                LogLevel:               getEnv("LOG_LEVEL", "info"),
                SupabaseURL:            getEnv("SUPABASE_URL", ""),
                SupabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
                SupabaseJWTSecret:      getEnv("SUPABASE_JWT_SECRET", ""),
                HederaNetwork:          getEnv("HEDERA_NETWORK", "testnet"),
                HederaContractAddress:  getEnv("HEDERA_CONTRACT_ADDRESS", ""),
                LayerZeroEndpoint:      getEnv("LAYERZERO_ENDPOINT", ""),
                LayerZeroAPIKey:        getEnv("LAYERZERO_API_KEY", ""),
                EthereumRPC:            getEnv("ETHEREUM_RPC", ""),
                EthereumLiquidityPool:  getEnv("ETHEREUM_LIQUIDITY_POOL", ""),
                BaseRPC:                getEnv("BASE_RPC", ""),
                BaseLiquidityPool:      getEnv("BASE_LIQUIDITY_POOL", ""),
                ArbitrumRPC:            getEnv("ARBITRUM_RPC", ""),
                ArbitrumLiquidityPool:  getEnv("ARBITRUM_LIQUIDITY_POOL", ""),
                AvalancheRPC:           getEnv("AVALANCHE_RPC", ""),
                AvalancheLiquidityPool: getEnv("AVALANCHE_LIQUIDITY_POOL", ""),
                CeloRPC:                getEnv("CELO_RPC", ""),
                CeloLiquidityPool:      getEnv("CELO_LIQUIDITY_POOL", ""),
                PolygonRPC:             getEnv("POLYGON_RPC", ""),
                PolygonLiquidityPool:   getEnv("POLYGON_LIQUIDITY_POOL", ""),
                KavaRPC:                getEnv("KAVA_RPC", ""),
                KavaLiquidityPool:      getEnv("KAVA_LIQUIDITY_POOL", ""),
                SolanaRPC:              getEnv("SOLANA_RPC", ""),
                AptosRPC:               getEnv("APTOS_RPC", ""),
                MpesaAPIKey:            getEnv("MPESA_API_KEY", ""),
                MpesaSecret:            getEnv("MPESA_SECRET", ""),
                RedisURL:               getEnv("REDIS_URL", ""),
                RelayerPrivateKey:      getEnv("RELAYER_PRIVATE_KEY", ""),
                MaxRetries:             getEnvAsInt("MAX_RETRIES", 3),
        }

        // Validate required configuration
        if cfg.SupabaseURL == "" {
                return nil, fmt.Errorf("SUPABASE_URL is required")
        }
        if cfg.SupabaseServiceRoleKey == "" {
                return nil, fmt.Errorf("SUPABASE_SERVICE_ROLE_KEY is required")
        }
        if cfg.SupabaseJWTSecret == "" {
                return nil, fmt.Errorf("SUPABASE_JWT_SECRET is required")
        }

        return cfg, nil
}

func getEnv(key, defaultValue string) string {
        if value, exists := os.LookupEnv(key); exists {
                return value
        }
        return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
        if value, exists := os.LookupEnv(key); exists {
                if intValue, err := strconv.Atoi(value); err == nil {
                        return intValue
                }
        }
        return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
        if value, exists := os.LookupEnv(key); exists {
                if boolValue, err := strconv.ParseBool(value); err == nil {
                        return boolValue
                }
        }
        return defaultValue
}