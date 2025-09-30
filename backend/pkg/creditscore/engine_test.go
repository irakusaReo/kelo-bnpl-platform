package creditscore

import (
        "context"
        "fmt"
        "testing"
        "time"

        "kelo-backend/pkg/blockchain"
        "kelo-backend/pkg/config"
        "kelo-backend/pkg/models"

        "github.com/stretchr/testify/assert"
        "github.com/stretchr/testify/mock"
        "gorm.io/driver/sqlite"
        "gorm.io/gorm"
)

// MockBlockchainClient is a mock for blockchain operations
type MockBlockchainClient struct {
        mock.Mock
}

func (m *MockBlockchainClient) GetEthereumClient() interface{} {
        args := m.Called()
        return args.Get(0)
}

func (m *MockBlockchainClient) GetBaseClient() interface{} {
        args := m.Called()
        return args.Get(0)
}

func (m *MockBlockchainClient) GetSolanaClient() interface{} {
        args := m.Called()
        return args.Get(0)
}

func (m *MockBlockchainClient) GetAptosClient() interface{} {
        args := m.Called()
        return args.Get(0)
}

func (m *MockBlockchainClient) GetHederaClient() interface{} {
        args := m.Called()
        return args.Get(0)
}

// TestCreditScoreEngine tests the credit scoring engine functionality
func TestCreditScoreEngine(t *testing.T) {
        // Setup in-memory SQLite database
        db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
        assert.NoError(t, err)

        // Auto migrate tables
        err = db.AutoMigrate(
                &models.User{},
                &models.Merchant{},
                &models.Loan{},
                &models.Repayment{},
                &models.LiquidityPool{},
                &models.LiquidityProvider{},
                &models.CreditScore{},
                &models.Transaction{},
        )
        assert.NoError(t, err)

        // Create test user
        user := models.User{
                BaseModel:    models.BaseModel{ID: "test_user_001", CreatedAt: time.Now().Add(-30 * 24 * time.Hour), UpdatedAt: time.Now()},
                Email:        "test@example.com",
                PasswordHash: "hashed_password",
                FirstName:    "John",
                LastName:     "Doe",
                Phone:        "+254712345678",
                DID:          "did:hedera:testnet:0.0.1234567",
                WalletAddress: "0x1234567890123456789012345678901234567890",
                IsActive:     true,
        }
        err = db.Create(&user).Error
        assert.NoError(t, err)

        // Create test transactions
        transactions := []models.Transaction{
                {
                        BaseModel:        models.BaseModel{ID: "tx_001", CreatedAt: time.Now().Add(-25 * 24 * time.Hour), UpdatedAt: time.Now()},
                        UserID:           user.ID,
                        Type:             "deposit",
                        Amount:           1000.0,
                        TokenSymbol:      "USDC",
                        ChainID:          "ethereum",
                        TransactionHash:  "0xabc123",
                        Status:           "confirmed",
                },
                {
                        BaseModel:        models.BaseModel{ID: "tx_002", CreatedAt: time.Now().Add(-20 * 24 * time.Hour), UpdatedAt: time.Now()},
                        UserID:           user.ID,
                        Type:             "withdrawal",
                        Amount:           500.0,
                        TokenSymbol:      "USDC",
                        ChainID:          "ethereum",
                        TransactionHash:  "0xdef456",
                        Status:           "confirmed",
                },
                {
                        BaseModel:        models.BaseModel{ID: "tx_003", CreatedAt: time.Now().Add(-15 * 24 * time.Hour), UpdatedAt: time.Now()},
                        UserID:           user.ID,
                        Type:             "disbursement",
                        Amount:           2000.0,
                        TokenSymbol:      "USDT",
                        ChainID:          "base",
                        TransactionHash:  "0xghi789",
                        Status:           "confirmed",
                },
        }
        for _, tx := range transactions {
                err = db.Create(&tx).Error
                assert.NoError(t, err)
        }

        // Create test loans
        loans := []models.Loan{
                {
                        BaseModel:    models.BaseModel{ID: "loan_001", CreatedAt: time.Now().Add(-30 * 24 * time.Hour), UpdatedAt: time.Now()},
                        UserID:       user.ID,
                        MerchantID:   "merchant_001",
                        Amount:       10000.0,
                        InterestRate: 5.0,
                        Duration:     30,
                        Status:       "repaid",
                        DueDate:      time.Now().Add(-5 * 24 * time.Hour),
                        RepaidAt:     &[]time.Time{time.Now().Add(-6 * 24 * time.Hour)}[0],
                },
                {
                        BaseModel:    models.BaseModel{ID: "loan_002", CreatedAt: time.Now().Add(-20 * 24 * time.Hour), UpdatedAt: time.Now()},
                        UserID:       user.ID,
                        MerchantID:   "merchant_002",
                        Amount:       15000.0,
                        InterestRate: 7.5,
                        Duration:     45,
                        Status:       "active",
                        DueDate:      time.Now().Add(15 * 24 * time.Hour),
                },
        }
        for _, loan := range loans {
                err = db.Create(&loan).Error
                assert.NoError(t, err)
        }

        // Create test repayments
        repayments := []models.Repayment{
                {
                        BaseModel:    models.BaseModel{ID: "repayment_001", CreatedAt: time.Now().Add(-6 * 24 * time.Hour), UpdatedAt: time.Now()},
                        LoanID:       "loan_001",
                        Amount:       10500.0,
                        Status:       "completed",
                },
        }
        for _, repayment := range repayments {
                err = db.Create(&repayment).Error
                assert.NoError(t, err)
        }

        // Create mock blockchain client
        mockBlockchain := &MockBlockchainClient{}

        // Create config
        cfg := &config.Config{
                MpesaAPIKey: "test_mpesa_key",
                MpesaSecret: "test_mpesa_secret",
        }

        // Create credit scoring engine
        engine := NewCreditScoreEngine(db, &blockchain.Clients{}, cfg)

        // Test credit score calculation
        t.Run("CalculateCreditScore", func(t *testing.T) {
                ctx := context.Background()
                req := CreditScoreRequest{
                        UserID:           user.ID,
                        IncludeMpesa:     true,
                        IncludeBank:      true,
                        IncludeCRB:       true,
                        IncludePayslip:   true,
                        ForceRecalculate: true,
                }

                response, err := engine.CalculateCreditScore(ctx, req)
                assert.NoError(t, err)
                assert.NotNil(t, response)
                assert.Equal(t, user.ID, response.UserID)
                assert.GreaterOrEqual(t, response.Score, 300)
                assert.LessOrEqual(t, response.Score, 850)
                assert.NotEmpty(t, response.Rating)
                assert.NotEmpty(t, response.Factors)
                assert.NotEmpty(t, response.Recommendations)
        })

        // Test on-chain history calculation
        t.Run("CalculateOnChainHistoryScore", func(t *testing.T) {
                ctx := context.Background()
                score, err := engine.calculateOnChainHistoryScore(ctx, &user)
                assert.NoError(t, err)
                assert.GreaterOrEqual(t, score, 0.0)
                assert.LessOrEqual(t, score, 100.0)
        })

        // Test repayment behavior calculation
        t.Run("CalculateRepaymentBehaviorScore", func(t *testing.T) {
                ctx := context.Background()
                score, err := engine.calculateRepaymentBehaviorScore(ctx, &user)
                assert.NoError(t, err)
                assert.GreaterOrEqual(t, score, 0.0)
                assert.LessOrEqual(t, score, 100.0)
        })

        // Test account age calculation
        t.Run("CalculateAccountAgeScore", func(t *testing.T) {
                score := engine.calculateAccountAgeScore(&user)
                assert.GreaterOrEqual(t, score, 0.0)
                assert.LessOrEqual(t, score, 100.0)
        })

        // Test final score calculation
        t.Run("CalculateFinalScore", func(t *testing.T) {
                factors := ScoringFactors{
                        OnChainHistory:    80.0,
                        RepaymentBehavior:  90.0,
                        AccountAge:        60.0,
                        ExternalData:      70.0,
                        DIDVerification:   85.0,
                }

                finalScore := engine.calculateFinalScore(factors)
                assert.GreaterOrEqual(t, finalScore, 300)
                assert.LessOrEqual(t, finalScore, 850)
        })

        // Test score rating
        t.Run("GetScoreRating", func(t *testing.T) {
                ratings := map[int]string{
                        300: "Very Poor",
                        550: "Poor",
                        670: "Fair",
                        720: "Good",
                        800: "Excellent",
                }

                for score, expectedRating := range ratings {
                        rating := engine.getScoreRating(score)
                        assert.Equal(t, expectedRating, rating)
                }
        })

        // Test recommendations generation
        t.Run("GenerateRecommendations", func(t *testing.T) {
                factors := ScoringFactors{
                        OnChainHistory:    50.0,
                        RepaymentBehavior:  70.0,
                        AccountAge:        30.0,
                        ExternalData:      40.0,
                        DIDVerification:   60.0,
                }

                recommendations := engine.generateRecommendations(factors, 550)
                assert.NotEmpty(t, recommendations)
                assert.Contains(t, recommendations, "Increase on-chain transaction activity to improve your score")
        })

        // Test credit score persistence
        t.Run("SaveCreditScore", func(t *testing.T) {
                response := &CreditScoreResponse{
                        UserID:        user.ID,
                        Score:         720,
                        PreviousScore: 700,
                        MaxScore:      850,
                        Rating:        "Good",
                        Factors: ScoringFactors{
                                OnChainHistory:    80.0,
                                RepaymentBehavior:  90.0,
                                AccountAge:        60.0,
                                ExternalData:      70.0,
                                DIDVerification:   85.0,
                        },
                        DataSource:   "combined",
                        ValidUntil:   time.Now().Add(30 * 24 * time.Hour),
                        UpdateReason: "Test calculation",
                }

                err := engine.saveCreditScore(&user, response)
                assert.NoError(t, err)

                // Verify credit score was saved
                var savedScore models.CreditScore
                err = db.Where("user_id = ?", user.ID).First(&savedScore).Error
                assert.NoError(t, err)
                assert.Equal(t, response.Score, savedScore.Score)
                assert.Equal(t, response.PreviousScore, savedScore.PreviousScore)
                assert.Equal(t, response.MaxScore, savedScore.MaxScore)
                assert.NotEmpty(t, savedScore.Factors)
        })

        // Test recent valid score retrieval
        t.Run("GetRecentValidScore", func(t *testing.T) {
                // Create a valid credit score
                validScore := models.CreditScore{
                        BaseModel:    models.BaseModel{ID: "valid_score_001", CreatedAt: time.Now(), UpdatedAt: time.Now()},
                        UserID:       user.ID,
                        Score:        750,
                        PreviousScore: 720,
                        MaxScore:     850,
                        Factors:      `{"on_chain_history":85,"repayment_behavior":90,"account_age":70,"external_data":80,"did_verification":90}`,
                        DataSource:   "combined",
                        ValidUntil:   time.Now().Add(15 * 24 * time.Hour), // Valid for 15 more days
                }
                err := db.Create(&validScore).Error
                assert.NoError(t, err)

                // Retrieve recent valid score
                recentScore, err := engine.getRecentValidScore(user.ID)
                assert.NoError(t, err)
                assert.NotNil(t, recentScore)
                assert.Equal(t, validScore.Score, recentScore.Score)
                assert.Equal(t, validScore.PreviousScore, recentScore.PreviousScore)
        })

        // Test transaction frequency calculation
        t.Run("CalculateTransactionFrequency", func(t *testing.T) {
                frequency := engine.calculateTransactionFrequency(transactions)
                assert.GreaterOrEqual(t, frequency, 0.0)
                assert.LessOrEqual(t, frequency, 100.0)
        })

        // Test transaction diversity calculation
        t.Run("CalculateTransactionDiversity", func(t *testing.T) {
                diversity := engine.calculateTransactionDiversity(transactions)
                assert.GreaterOrEqual(t, diversity, 0.0)
                assert.LessOrEqual(t, diversity, 100.0)
        })

        // Test blockchain account age calculation
        t.Run("CalculateBlockchainAccountAge", func(t *testing.T) {
                age := engine.calculateBlockchainAccountAge(&user)
                assert.GreaterOrEqual(t, age, 0.0)
                assert.LessOrEqual(t, age, 100.0)
        })
}

// Benchmark tests for performance
func BenchmarkCreditScoreCalculation(b *testing.B) {
        // Setup in-memory database
        db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
        if err != nil {
                b.Fatal(err)
        }

        // Auto migrate tables
        err = db.AutoMigrate(&models.User{}, &models.Transaction{}, &models.Loan{}, &models.Repayment{}, &models.CreditScore{})
        if err != nil {
                b.Fatal(err)
        }

        // Create test user
        user := models.User{
                BaseModel:    models.BaseModel{ID: "benchmark_user", CreatedAt: time.Now().Add(-365 * 24 * time.Hour), UpdatedAt: time.Now()},
                Email:        "benchmark@example.com",
                PasswordHash: "hashed_password",
                IsActive:     true,
        }
        err = db.Create(&user).Error
        if err != nil {
                b.Fatal(err)
        }

        // Create test transactions
        for i := 0; i < 100; i++ {
                tx := models.Transaction{
                        BaseModel:       models.BaseModel{ID: fmt.Sprintf("tx_%d", i), CreatedAt: time.Now().Add(-time.Duration(i) * 24 * time.Hour), UpdatedAt: time.Now()},
                        UserID:          user.ID,
                        Type:            "deposit",
                        Amount:          float64(i * 100),
                        TokenSymbol:     "USDC",
                        ChainID:         "ethereum",
                        TransactionHash: fmt.Sprintf("0x%x", i),
                        Status:          "confirmed",
                }
                err = db.Create(&tx).Error
                if err != nil {
                        b.Fatal(err)
                }
        }

        // Create mock blockchain client and config
        mockBlockchain := &MockBlockchainClient{}
        cfg := &config.Config{}

        // Create credit scoring engine
        engine := NewCreditScoreEngine(db, &blockchain.Clients{}, cfg)

        // Benchmark the credit score calculation
        b.ResetTimer()
        for i := 0; i < b.N; i++ {
                ctx := context.Background()
                req := CreditScoreRequest{
                        UserID:           user.ID,
                        ForceRecalculate: true,
                }

                _, err := engine.CalculateCreditScore(ctx, req)
                if err != nil {
                        b.Fatal(err)
                }
        }
}