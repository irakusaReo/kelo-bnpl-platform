package creditscore

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"time"

	"kelo-backend/pkg/blockchain"

	"github.com/rs/zerolog/log"
)

// HCSMessage represents a message from Hedera Consensus Service
type HCSMessage struct {
	TopicID        string          `json:"topic_id"`
	SequenceNumber uint64          `json:"sequence_number"`
	Message        string          `json:"message"`
	RunningHash    string          `json:"running_hash"`
	Timestamp      time.Time       `json:"timestamp"`
	ConsensusTime  time.Time       `json:"consensus_time"`
	Submitter      string          `json:"submitter"`
	Signature      string          `json:"signature"`
	Metadata       json.RawMessage `json:"metadata"`
}

// HCSRepaymentMessage represents a repayment message on HCS
type HCSRepaymentMessage struct {
	MessageType    string    `json:"message_type"`
	LoanID         string    `json:"loan_id"`
	UserID         string    `json:"user_id"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	Timestamp      time.Time `json:"timestamp"`
	TransactionID  string    `json:"transaction_id"`
	Status         string    `json:"status"`
	Reference      string    `json:"reference"`
	ChainID        string    `json:"chain_id"`
}

// HCSLoanMessage represents a loan-related message on HCS
type HCSLoanMessage struct {
	MessageType    string    `json:"message_type"`
	LoanID         string    `json:"loan_id"`
	UserID         string    `json:"user_id"`
	MerchantID     string    `json:"merchant_id"`
	Amount         float64   `json:"amount"`
	InterestRate   float64   `json:"interest_rate"`
	Duration       int       `json:"duration"`
	Status         string    `json:"status"`
	Timestamp      time.Time `json:"timestamp"`
	ChainID        string    `json:"chain_id"`
	TokenID        string    `json:"token_id"`
}

// HCSCreditEvent represents a credit-related event on HCS
type HCSCreditEvent struct {
	EventType      string    `json:"event_type"`
	UserID         string    `json:"user_id"`
	Timestamp      time.Time `json:"timestamp"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	Description    string    `json:"description"`
	Reference      string    `json:"reference"`
	Confidence     float64   `json:"confidence"` // Confidence score for AI-analyzed events
	Category       string    `json:"category"`   // positive, negative, neutral
}

// HCSBehaviorPattern represents user behavior patterns derived from HCS messages
type HCSBehaviorPattern struct {
	UserID             string    `json:"user_id"`
	PatternType        string    `json:"pattern_type"` // repayment, borrowing, risk
	Description        string    `json:"description"`
	Score              float64   `json:"score"`
	Frequency          float64   `json:"frequency"` // events per month
	Consistency        float64   `json:"consistency"` // 0-1 scale
	LastObserved       time.Time `json:"last_observed"`
	Trend              string    `json:"trend"` // improving, stable, declining
}

// HCSAnalytics represents analytics derived from HCS messages
type HCSAnalytics struct {
	UserID             string               `json:"user_id"`
	TotalMessages      uint64               `json:"total_messages"`
	RepaymentMessages  uint64               `json:"repayment_messages"`
	LoanMessages       uint64               `json:"loan_messages"`
	CreditEvents       uint64               `json:"credit_events"`
	BehaviorPatterns   []HCSBehaviorPattern `json:"behavior_patterns"`
	RiskScore          float64              `json:"risk_score"`
	ReliabilityScore   float64              `json:"reliability_score"`
	ActivityScore      float64              `json:"activity_score"`
	LastActivity       time.Time            `json:"last_activity"`
	AnalysisPeriod     time.Time            `json:"analysis_period_start"`
	AnalysisEnd        time.Time            `json:"analysis_period_end"`
}

// HCSQuery represents a query for HCS messages
type HCSQuery struct {
	TopicID        string    `json:"topic_id"`
	UserID         string    `json:"user_id"`
	StartTime      time.Time `json:"start_time"`
	EndTime        time.Time `json:"end_time"`
	MessageTypes   []string  `json:"message_types"`
	Limit          int       `json:"limit"`
	SequenceNumber *uint64   `json:"sequence_number"`
}

// HCSAnalyzerConfig represents configuration for HCS analyzer
type HCSAnalyzerConfig struct {
	TopicIDs          []string `json:"topic_ids"`
	AnalysisPeriod    int      `json:"analysis_period_days"`
	PatternThreshold  float64  `json:"pattern_threshold"`
	RiskWeights       map[string]float64 `json:"risk_weights"`
	EnableAIPrediction bool    `json:"enable_ai_prediction"`
}

// NewHCSAnalyzer creates a new HCS analyzer instance
func NewHCSAnalyzer(blockchain *blockchain.Clients) *HCSAnalyzer {
	return &HCSAnalyzer{
		blockchain: blockchain,
		config: HCSAnalyzerConfig{
			TopicIDs:         []string{"0.0.1234", "0.0.1235"}, // Default HCS topics
			AnalysisPeriod:   180, // 6 months
			PatternThreshold: 0.7,
			RiskWeights: map[string]float64{
				"late_payment":    0.4,
				"default":         0.3,
				"high_frequency":  0.2,
				"inconsistent":    0.1,
			},
			EnableAIPrediction: true,
		},
	}
}

// AnalyzeUserBehavior analyzes user behavior from HCS messages
func (h *HCSAnalyzer) AnalyzeUserBehavior(ctx context.Context, userID string) (*HCSAnalytics, error) {
	if userID == "" {
		return nil, fmt.Errorf("user ID cannot be empty")
	}

	// Set analysis period
	endTime := time.Now()
	startTime := endTime.AddDate(0, 0, -h.config.AnalysisPeriod)

	// Query HCS messages for the user
	messages, err := h.queryUserMessages(ctx, userID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to query HCS messages: %w", err)
	}

	if len(messages) == 0 {
		// Return empty analytics for users with no HCS activity
		return &HCSAnalytics{
			UserID:         userID,
			TotalMessages:  0,
			RiskScore:      50.0, // Neutral risk score
			ReliabilityScore: 50.0,
			ActivityScore:  0.0,
			AnalysisPeriod: startTime,
			AnalysisEnd:    endTime,
		}, nil
	}

	// Parse and categorize messages
	repayments, loans, creditEvents, err := h.parseMessages(messages)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HCS messages: %w", err)
	}

	// Analyze behavior patterns
	patterns := h.analyzeBehaviorPatterns(userID, repayments, loans, creditEvents)

	// Calculate scores
	riskScore := h.calculateRiskScore(repayments, loans, creditEvents)
	reliabilityScore := h.calculateReliabilityScore(repayments, loans)
	activityScore := h.calculateActivityScore(messages, startTime, endTime)

	// Get last activity time
	lastActivity := h.getLastActivityTime(messages)

	// Create analytics result
	analytics := &HCSAnalytics{
		UserID:            userID,
		TotalMessages:     uint64(len(messages)),
		RepaymentMessages: uint64(len(repayments)),
		LoanMessages:      uint64(len(loans)),
		CreditEvents:      uint64(len(creditEvents)),
		BehaviorPatterns:  patterns,
		RiskScore:         riskScore,
		ReliabilityScore:  reliabilityScore,
		ActivityScore:     activityScore,
		LastActivity:      lastActivity,
		AnalysisPeriod:    startTime,
		AnalysisEnd:       endTime,
	}

	return analytics, nil
}

// GetRepaymentHistory retrieves repayment history from HCS
func (h *HCSAnalyzer) GetRepaymentHistory(ctx context.Context, userID string, days int) ([]HCSRepaymentMessage, error) {
	if userID == "" {
		return nil, fmt.Errorf("user ID cannot be empty")
	}

	endTime := time.Now()
	startTime := endTime.AddDate(0, 0, -days)

	// Query HCS messages
	messages, err := h.queryUserMessages(ctx, userID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to query HCS messages: %w", err)
	}

	// Parse repayment messages
	var repayments []HCSRepaymentMessage
	for _, msg := range messages {
		repayment, err := h.parseRepaymentMessage(msg)
		if err != nil {
			log.Warn().Err(err).Str("messageID", fmt.Sprintf("%d", msg.SequenceNumber)).Msg("Failed to parse repayment message")
			continue
		}
		if repayment != nil {
			repayments = append(repayments, *repayment)
		}
	}

	// Sort by timestamp (newest first)
	sort.Slice(repayments, func(i, j int) bool {
		return repayments[i].Timestamp.After(repayments[j].Timestamp)
	})

	return repayments, nil
}

// GetLoanHistory retrieves loan history from HCS
func (h *HCSAnalyzer) GetLoanHistory(ctx context.Context, userID string, days int) ([]HCSLoanMessage, error) {
	if userID == "" {
		return nil, fmt.Errorf("user ID cannot be empty")
	}

	endTime := time.Now()
	startTime := endTime.AddDate(0, 0, -days)

	// Query HCS messages
	messages, err := h.queryUserMessages(ctx, userID, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to query HCS messages: %w", err)
	}

	// Parse loan messages
	var loans []HCSLoanMessage
	for _, msg := range messages {
		loan, err := h.parseLoanMessage(msg)
		if err != nil {
			log.Warn().Err(err).Str("messageID", fmt.Sprintf("%d", msg.SequenceNumber)).Msg("Failed to parse loan message")
			continue
		}
		if loan != nil {
			loans = append(loans, *loan)
		}
	}

	// Sort by timestamp (newest first)
	sort.Slice(loans, func(i, j int) bool {
		return loans[i].Timestamp.After(loans[j].Timestamp)
	})

	return loans, nil
}

// PredictCreditRisk predicts credit risk based on HCS behavior patterns
func (h *HCSAnalyzer) PredictCreditRisk(ctx context.Context, userID string) (float64, error) {
	if !h.config.EnableAIPrediction {
		return 50.0, nil // Neutral prediction if AI is disabled
	}

	// Get user behavior analytics
	analytics, err := h.AnalyzeUserBehavior(ctx, userID)
	if err != nil {
		return 0.0, fmt.Errorf("failed to analyze user behavior: %w", err)
	}

	// Use AI to predict credit risk (simplified implementation)
	riskScore := h.predictRiskWithAI(analytics)

	return riskScore, nil
}

// DetectAnomalies detects anomalous behavior patterns in HCS messages
func (h *HCSAnalyzer) DetectAnomalies(ctx context.Context, userID string) ([]HCSBehaviorPattern, error) {
	analytics, err := h.AnalyzeUserBehavior(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze user behavior: %w", err)
	}

	var anomalies []HCSBehaviorPattern

	// Detect anomalies in behavior patterns
	for _, pattern := range analytics.BehaviorPatterns {
		if h.isAnomalousPattern(pattern) {
			anomalies = append(anomalies, pattern)
		}
	}

	return anomalies, nil
}

// queryUserMessages queries HCS messages for a specific user
func (h *HCSAnalyzer) queryUserMessages(ctx context.Context, userID string, startTime, endTime time.Time) ([]HCSMessage, error) {
	var allMessages []HCSMessage

	// Query all configured topics
	for _, topicID := range h.config.TopicIDs {
		messages, err := h.queryTopicMessages(ctx, topicID, userID, startTime, endTime)
		if err != nil {
			log.Warn().Err(err).Str("topicID", topicID).Str("userID", userID).Msg("Failed to query topic messages")
			continue
		}
		allMessages = append(allMessages, messages...)
	}

	return allMessages, nil
}

// queryTopicMessages queries HCS messages from a specific topic
func (h *HCSAnalyzer) queryTopicMessages(ctx context.Context, topicID, userID string, startTime, endTime time.Time) ([]HCSMessage, error) {
	// In a real implementation, you would:
	// 1. Use Hedera SDK to query HCS messages
	// 2. Filter by user ID and time range
	// 3. Parse and return the messages

	// For now, simulate querying HCS messages
	hederaClient := h.blockchain.GetHederaClient()
	if hederaClient == nil {
		return nil, fmt.Errorf("Hedera client not available")
	}

	// Simulate HCS message query
	log.Info().
		Str("topicID", topicID).
		Str("userID", userID).
		Time("startTime", startTime).
		Time("endTime", endTime).
		Msg("Querying HCS messages")

	// Generate simulated messages for demonstration
	messages := h.generateSimulatedMessages(topicID, userID, startTime, endTime)

	return messages, nil
}

// parseMessages parses and categorizes HCS messages
func (h *HCSAnalyzer) parseMessages(messages []HCSMessage) ([]HCSRepaymentMessage, []HCSLoanMessage, []HCSCreditEvent, error) {
	var repayments []HCSRepaymentMessage
	var loans []HCSLoanMessage
	var creditEvents []HCSCreditEvent

	for _, msg := range messages {
		// Try to parse as repayment message
		if repayment, err := h.parseRepaymentMessage(msg); err == nil && repayment != nil {
			repayments = append(repayments, *repayment)
			continue
		}

		// Try to parse as loan message
		if loan, err := h.parseLoanMessage(msg); err == nil && loan != nil {
			loans = append(loans, *loan)
			continue
		}

		// Try to parse as credit event
		if event, err := h.parseCreditEvent(msg); err == nil && event != nil {
			creditEvents = append(creditEvents, *event)
			continue
		}
	}

	return repayments, loans, creditEvents, nil
}

// parseRepaymentMessage parses a repayment message from HCS
func (h *HCSAnalyzer) parseRepaymentMessage(msg HCSMessage) (*HCSRepaymentMessage, error) {
	// Check if message contains repayment data
	var repayment HCSRepaymentMessage
	if err := json.Unmarshal(msg.Metadata, &repayment); err != nil {
		return nil, err
	}

	// Validate required fields
	if repayment.MessageType != "repayment" {
		return nil, fmt.Errorf("not a repayment message")
	}

	if repayment.LoanID == "" || repayment.UserID == "" {
		return nil, fmt.Errorf("missing required fields in repayment message")
	}

	// Set timestamp from message if not provided
	if repayment.Timestamp.IsZero() {
		repayment.Timestamp = msg.Timestamp
	}

	return &repayment, nil
}

// parseLoanMessage parses a loan message from HCS
func (h *HCSAnalyzer) parseLoanMessage(msg HCSMessage) (*HCSLoanMessage, error) {
	// Check if message contains loan data
	var loan HCSLoanMessage
	if err := json.Unmarshal(msg.Metadata, &loan); err != nil {
		return nil, err
	}

	// Validate required fields
	if loan.MessageType != "loan" {
		return nil, fmt.Errorf("not a loan message")
	}

	if loan.LoanID == "" || loan.UserID == "" || loan.MerchantID == "" {
		return nil, fmt.Errorf("missing required fields in loan message")
	}

	// Set timestamp from message if not provided
	if loan.Timestamp.IsZero() {
		loan.Timestamp = msg.Timestamp
	}

	return &loan, nil
}

// parseCreditEvent parses a credit event from HCS
func (h *HCSAnalyzer) parseCreditEvent(msg HCSMessage) (*HCSCreditEvent, error) {
	// Check if message contains credit event data
	var event HCSCreditEvent
	if err := json.Unmarshal(msg.Metadata, &event); err != nil {
		return nil, err
	}

	// Validate required fields
	if event.EventType == "" || event.UserID == "" {
		return nil, fmt.Errorf("missing required fields in credit event")
	}

	// Set timestamp from message if not provided
	if event.Timestamp.IsZero() {
		event.Timestamp = msg.Timestamp
	}

	return &event, nil
}

// analyzeBehaviorPatterns analyzes behavior patterns from parsed messages
func (h *HCSAnalyzer) analyzeBehaviorPatterns(userID string, repayments []HCSRepaymentMessage, loans []HCSLoanMessage, creditEvents []HCSCreditEvent) []HCSBehaviorPattern {
	var patterns []HCSBehaviorPattern

	// Analyze repayment patterns
	if len(repayments) > 0 {
		repaymentPattern := h.analyzeRepaymentPattern(userID, repayments)
		patterns = append(patterns, repaymentPattern)
	}

	// Analyze borrowing patterns
	if len(loans) > 0 {
		borrowingPattern := h.analyzeBorrowingPattern(userID, loans)
		patterns = append(patterns, borrowingPattern)
	}

	// Analyze risk patterns
	if len(repayments) > 0 || len(loans) > 0 {
		riskPattern := h.analyzeRiskPattern(userID, repayments, loans, creditEvents)
		patterns = append(patterns, riskPattern)
	}

	return patterns
}

// analyzeRepaymentPattern analyzes repayment behavior patterns
func (h *HCSAnalyzer) analyzeRepaymentPattern(userID string, repayments []HCSRepaymentMessage) HCSBehaviorPattern {
	// Calculate repayment consistency
	onTimePayments := 0
	totalPayments := len(repayments)
	
	for _, repayment := range repayments {
		if repayment.Status == "completed" {
			onTimePayments++
		}
	}

	consistency := float64(onTimePayments) / float64(totalPayments)

	// Calculate frequency (payments per month)
	if len(repayments) == 0 {
		return HCSBehaviorPattern{}
	}

	timeSpan := repayments[len(repayments)-1].Timestamp.Sub(repayments[0].Timestamp)
	frequency := float64(len(repayments)) / (timeSpan.Hours() / (24 * 30))

	// Calculate score based on consistency and timeliness
	score := consistency * 100.0

	// Determine trend
	trend := "stable"
	if consistency > 0.9 {
		trend = "improving"
	} else if consistency < 0.7 {
		trend = "declining"
	}

	return HCSBehaviorPattern{
		UserID:      userID,
		PatternType: "repayment",
		Description: fmt.Sprintf("Repayment behavior with %.1f%% consistency", consistency*100),
		Score:       score,
		Frequency:   frequency,
		Consistency: consistency,
		LastObserved: repayments[len(repayments)-1].Timestamp,
		Trend:       trend,
	}
}

// analyzeBorrowingPattern analyzes borrowing behavior patterns
func (h *HCSAnalyzer) analyzeBorrowingPattern(userID string, loans []HCSLoanMessage) HCSBehaviorPattern {
	if len(loans) == 0 {
		return HCSBehaviorPattern{}
	}

	// Calculate average loan amount
	totalAmount := 0.0
	for _, loan := range loans {
		totalAmount += loan.Amount
	}
	avgAmount := totalAmount / float64(len(loans))

	// Calculate frequency (loans per month)
	timeSpan := loans[len(loans)-1].Timestamp.Sub(loans[0].Timestamp)
	frequency := float64(len(loans)) / (timeSpan.Hours() / (24 * 30))

	// Calculate score based on responsible borrowing
	// Lower frequency and reasonable amounts are better
	score := 100.0 - math.Min(frequency*10, 50) // Deduct for high frequency
	if avgAmount > 100000 { // High amounts reduce score
		score -= 20
	}

	// Determine trend
	trend := "stable"
	if frequency > 2.0 {
		trend = "increasing"
	} else if frequency < 0.5 {
		trend = "decreasing"
	}

	return HCSBehaviorPattern{
		UserID:      userID,
		PatternType: "borrowing",
		Description: fmt.Sprintf("Borrowing pattern with average amount %.2f", avgAmount),
		Score:       math.Max(score, 0),
		Frequency:   frequency,
		Consistency: 1.0, // Loans are usually consistent
		LastObserved: loans[len(loans)-1].Timestamp,
		Trend:       trend,
	}
}

// analyzeRiskPattern analyzes risk patterns from all credit events
func (h *HCSAnalyzer) analyzeRiskPattern(userID string, repayments []HCSRepaymentMessage, loans []HCSLoanMessage, creditEvents []HCSCreditEvent) HCSBehaviorPattern {
	riskScore := 0.0

	// Analyze repayment risks
	latePayments := 0
	for _, repayment := range repayments {
		if repayment.Status == "failed" || repayment.Status == "late" {
			latePayments++
		}
	}
	if len(repayments) > 0 {
		riskScore += float64(latePayments) / float64(len(repayments)) * 40
	}

	// Analyze loan risks
	activeLoans := 0
	for _, loan := range loans {
		if loan.Status == "active" {
			activeLoans++
		}
	}
	if len(loans) > 0 {
		riskScore += float64(activeLoans) / float64(len(loans)) * 30
	}

	// Analyze credit event risks
	negativeEvents := 0
	for _, event := range creditEvents {
		if event.Category == "negative" {
			negativeEvents++
		}
	}
	if len(creditEvents) > 0 {
		riskScore += float64(negativeEvents) / float64(len(creditEvents)) * 30
	}

	// Calculate overall risk score (inverted - higher score means lower risk)
	finalScore := 100.0 - math.Min(riskScore, 100.0)

	return HCSBehaviorPattern{
		UserID:      userID,
		PatternType: "risk",
		Description: fmt.Sprintf("Risk assessment score: %.1f", finalScore),
		Score:       finalScore,
		Frequency:   float64(len(repayments) + len(loans) + len(creditEvents)),
		Consistency: 1.0,
		LastObserved: time.Now(),
		Trend:       "stable",
	}
}

// calculateRiskScore calculates overall risk score
func (h *HCSAnalyzer) calculateRiskScore(repayments []HCSRepaymentMessage, loans []HCSLoanMessage, creditEvents []HCSCreditEvent) float64 {
	riskScore := 0.0

	// Apply risk weights
	for _, weight := range h.config.RiskWeights {
		switch weight {
		case h.config.RiskWeights["late_payment"]:
			// Calculate late payment risk
			latePayments := 0
			for _, repayment := range repayments {
				if repayment.Status == "failed" || repayment.Status == "late" {
					latePayments++
				}
			}
			if len(repayments) > 0 {
				riskScore += (float64(latePayments) / float64(len(repayments))) * weight * 100
			}

		case h.config.RiskWeights["default"]:
			// Calculate default risk
			defaultedLoans := 0
			for _, loan := range loans {
				if loan.Status == "defaulted" {
					defaultedLoans++
				}
			}
			if len(loans) > 0 {
				riskScore += (float64(defaultedLoans) / float64(len(loans))) * weight * 100
			}

		case h.config.RiskWeights["high_frequency"]:
			// Calculate high frequency risk
			totalEvents := len(repayments) + len(loans) + len(creditEvents)
			if totalEvents > 50 { // High frequency threshold
				riskScore += weight * 100
			}

		case h.config.RiskWeights["inconsistent"]:
			// Calculate inconsistency risk
			// This would involve more complex pattern analysis
			riskScore += weight * 20 // Base inconsistency risk
		}
	}

	return math.Min(riskScore, 100.0)
}

// calculateReliabilityScore calculates reliability score
func (h *HCSAnalyzer) calculateReliabilityScore(repayments []HCSRepaymentMessage, loans []HCSLoanMessage) float64 {
	if len(repayments) == 0 && len(loans) == 0 {
		return 50.0 // Neutral score for no activity
	}

	reliabilityScore := 100.0

	// Deduct for failed repayments
	failedRepayments := 0
	for _, repayment := range repayments {
		if repayment.Status == "failed" {
			failedRepayments++
			reliabilityScore -= 10
		}
	}

	// Deduct for defaulted loans
	defaultedLoans := 0
	for _, loan := range loans {
		if loan.Status == "defaulted" {
			defaultedLoans++
			reliabilityScore -= 25
		}
	}

	return math.Max(reliabilityScore, 0.0)
}

// calculateActivityScore calculates activity score
func (h *HCSAnalyzer) calculateActivityScore(messages []HCSMessage, startTime, endTime time.Time) float64 {
	if len(messages) == 0 {
		return 0.0
	}

	// Calculate activity frequency
	duration := endTime.Sub(startTime)
	activityRate := float64(len(messages)) / (duration.Hours() / (24 * 30)) // events per month

	// Normalize to 0-100 scale
	if activityRate >= 10 {
		return 100.0
	} else if activityRate >= 5 {
		return 80.0
	} else if activityRate >= 2 {
		return 60.0
	} else if activityRate >= 1 {
		return 40.0
	} else {
		return 20.0
	}
}

// getLastActivityTime gets the timestamp of the last activity
func (h *HCSAnalyzer) getLastActivityTime(messages []HCSMessage) time.Time {
	if len(messages) == 0 {
		return time.Time{}
	}

	lastTime := messages[0].Timestamp
	for _, msg := range messages {
		if msg.Timestamp.After(lastTime) {
			lastTime = msg.Timestamp
		}
	}

	return lastTime
}

// predictRiskWithAI uses AI to predict credit risk (simplified)
func (h *HCSAnalyzer) predictRiskWithAI(analytics *HCSAnalytics) float64 {
	// In a real implementation, you would use machine learning models
	// For now, use a simple weighted calculation

	weights := map[string]float64{
		"risk_score":         0.4,
		"reliability_score":  0.3,
		"activity_score":     0.2,
		"behavior_patterns":  0.1,
	}

	predictedRisk := analytics.RiskScore*weights["risk_score"] +
		(100.0-analytics.ReliabilityScore)*weights["reliability_score"] +
		analytics.ActivityScore*weights["activity_score"]

	// Adjust based on behavior patterns
	for _, pattern := range analytics.BehaviorPatterns {
		if pattern.PatternType == "risk" {
			predictedRisk += (100.0 - pattern.Score) * weights["behavior_patterns"]
		}
	}

	return math.Min(predictedRisk, 100.0)
}

// isAnomalousPattern checks if a behavior pattern is anomalous
func (h *HCSAnalyzer) isAnomalousPattern(pattern HCSBehaviorPattern) bool {
	// Define anomaly thresholds
	anomalyThresholds := map[string]struct {
		Score       float64
		Frequency   float64
		Consistency float64
	}{
		"repayment": {Score: 30.0, Frequency: 10.0, Consistency: 0.3},
		"borrowing": {Score: 20.0, Frequency: 5.0, Consistency: 0.5},
		"risk":       {Score: 25.0, Frequency: 20.0, Consistency: 0.4},
	}

	threshold, exists := anomalyThresholds[pattern.PatternType]
	if !exists {
		return false
	}

	return pattern.Score < threshold.Score ||
		pattern.Frequency > threshold.Frequency ||
		pattern.Consistency < threshold.Consistency
}

// generateSimulatedMessages generates simulated HCS messages for testing
func (h *HCSAnalyzer) generateSimulatedMessages(topicID, userID string, startTime, endTime time.Time) []HCSMessage {
	// This is a simplified simulation for demonstration
	// In a real implementation, you would query actual HCS messages
	
	var messages []HCSMessage
	numMessages := 10 // Simulate 10 messages
	
	for i := 0; i < numMessages; i++ {
		// Generate random timestamp within range
		randomDuration := time.Duration(float64(endTime.Sub(startTime)) * float64(i) / float64(numMessages))
		timestamp := startTime.Add(randomDuration)

		// Create message
		message := HCSMessage{
			TopicID:        topicID,
			SequenceNumber: uint64(i + 1),
			Message:        fmt.Sprintf("Message %d for user %s", i+1, userID),
			RunningHash:    fmt.Sprintf("hash_%d", i),
			Timestamp:      timestamp,
			ConsensusTime:  timestamp,
			Submitter:      "0.0.2998",
			Signature:      fmt.Sprintf("sig_%d", i),
		}

		// Add metadata based on message type
		if i%3 == 0 {
			// Repayment message
			repayment := HCSRepaymentMessage{
				MessageType:   "repayment",
				LoanID:        fmt.Sprintf("loan_%d", i),
				UserID:        userID,
				Amount:        5000.0,
				Currency:      "KES",
				Timestamp:     timestamp,
				TransactionID: fmt.Sprintf("tx_%d", i),
				Status:        "completed",
				Reference:     fmt.Sprintf("ref_%d", i),
				ChainID:       "hedera",
			}
			message.Metadata, _ = json.Marshal(repayment)
		} else if i%3 == 1 {
			// Loan message
			loan := HCSLoanMessage{
				MessageType:  "loan",
				LoanID:       fmt.Sprintf("loan_%d", i),
				UserID:       userID,
				MerchantID:   "merchant_1",
				Amount:       10000.0,
				InterestRate: 5.0,
				Duration:     30,
				Status:       "active",
				Timestamp:    timestamp,
				ChainID:      "hedera",
				TokenID:      fmt.Sprintf("token_%d", i),
			}
			message.Metadata, _ = json.Marshal(loan)
		} else {
			// Credit event
			event := HCSCreditEvent{
				EventType:   "credit_update",
				UserID:      userID,
				Timestamp:   timestamp,
				Amount:      0.0,
				Currency:    "KES",
				Description: "Credit score updated",
				Reference:   fmt.Sprintf("ref_%d", i),
				Confidence:  0.9,
				Category:    "neutral",
			}
			message.Metadata, _ = json.Marshal(event)
		}

		messages = append(messages, message)
	}

	return messages
}