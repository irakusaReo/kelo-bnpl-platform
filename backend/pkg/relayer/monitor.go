package relayer

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Monitor provides comprehensive monitoring and logging capabilities
type Monitor struct {
	// Metrics
	metrics *RelayerMetrics
	
	// Prometheus metrics
	promMetrics *PrometheusMetrics
	
	// Logging
	logger zerolog.Logger
	
	// Event tracking
	eventBuffer *EventBuffer
	
	// Health checks
	healthChecks map[string]*HealthCheck
	
	// Alerting
	alertManager *AlertManager
	
	// Context
	ctx context.Context
	
	// Mutex for thread safety
	mu sync.RWMutex
}

// Event represents a monitored event
type Event struct {
	ID          string                 `json:"id"`
	Type        EventType              `json:"type"`
	ChainID     string                 `json:"chain_id"`
	MessageType MessageType             `json:"message_type"`
	Timestamp   time.Time              `json:"timestamp"`
	Duration    time.Duration          `json:"duration,omitempty"`
	Status      EventStatus            `json:"status"`
	Metadata    map[string]interface{} `json:"metadata"`
	Error       string                 `json:"error,omitempty"`
}

// EventType represents the type of event
type EventType int

const (
	EventTypeMessageReceived EventType = iota
	EventTypeMessageProcessed
	EventTypeMessageSent
	EventTypeMessageConfirmed
	EventTypeMessageFailed
	EventTypeTransactionSubmitted
	EventTypeTransactionConfirmed
	EventTypeTransactionFailed
	EventTypeErrorOccurred
	EventTypeHealthCheck
)

// EventStatus represents the status of an event
type EventStatus int

const (
	EventStatusSuccess EventStatus = iota
	EventStatusFailure
	EventStatusWarning
	EventStatusInfo
)

// EventBuffer stores recent events for analysis
type EventBuffer struct {
	events    []*Event
	maxSize   int
	mu        sync.RWMutex
}

// HealthCheck represents a health check
type HealthCheck struct {
	Name        string        `json:"name"`
	Status      HealthStatus  `json:"status"`
	LastChecked time.Time     `json:"last_checked"`
	Duration    time.Duration `json:"duration"`
	Error       string        `json:"error,omitempty"`
}

// HealthStatus represents the status of a health check
type HealthStatus int

const (
	HealthStatusHealthy HealthStatus = iota
	HealthStatusDegraded
	HealthStatusUnhealthy
)

// Alert represents an alert
type Alert struct {
	ID          string        `json:"id"`
	Type        AlertType     `json:"type"`
	Severity    AlertSeverity `json:"severity"`
	Title       string        `json:"title"`
	Description string        `json:"description"`
	Timestamp   time.Time     `json:"timestamp"`
	Resolved    bool          `json:"resolved"`
	ResolvedAt  time.Time     `json:"resolved_at,omitempty"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// AlertType represents the type of alert
type AlertType int

const (
	AlertTypeError AlertType = iota
	AlertTypeWarning
	AlertTypeInfo
)

// AlertSeverity represents the severity of an alert
type AlertSeverity int

const (
	SeverityLow AlertSeverity = iota
	SeverityMedium
	SeverityHigh
	SeverityCritical
)

// AlertManager manages alerts
type AlertManager struct {
	alerts    map[string]*Alert
	rules     []*AlertRule
	mu        sync.RWMutex
	notifiers []AlertNotifier
}

// AlertRule defines a rule for generating alerts
type AlertRule struct {
	Name        string
	Condition   func(*Monitor) bool
	Severity    AlertSeverity
	Message     string
	Enabled     bool
	LastTriggered time.Time
}

// AlertNotifier sends alert notifications
type AlertNotifier interface {
	Notify(alert *Alert) error
}

// PrometheusMetrics holds Prometheus metrics
type PrometheusMetrics struct {
	messagesProcessed *prometheus.CounterVec
	messagesSent     *prometheus.CounterVec
	messagesFailed   *prometheus.CounterVec
	transactionLatency *prometheus.HistogramVec
	errorCount       *prometheus.CounterVec
	healthStatus     *prometheus.GaugeVec
}

// NewMonitor creates a new monitor
func NewMonitor(ctx context.Context) *Monitor {
	return &Monitor{
		metrics:      &RelayerMetrics{},
		promMetrics:  NewPrometheusMetrics(),
		logger:       log.With().Str("component", "monitor").Logger(),
		eventBuffer:  NewEventBuffer(1000),
		healthChecks: make(map[string]*HealthCheck),
		alertManager: NewAlertManager(),
		ctx:          ctx,
	}
}

// NewPrometheusMetrics creates new Prometheus metrics
func NewPrometheusMetrics() *PrometheusMetrics {
	return &PrometheusMetrics{
		messagesProcessed: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "relayer_messages_processed_total",
				Help: "Total number of messages processed",
			},
			[]string{"chain_id", "message_type", "status"},
		),
		messagesSent: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "relayer_messages_sent_total",
				Help: "Total number of messages sent",
			},
			[]string{"chain_id", "message_type"},
		),
		messagesFailed: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "relayer_messages_failed_total",
				Help: "Total number of messages failed",
			},
			[]string{"chain_id", "message_type", "error_type"},
		),
		transactionLatency: promauto.NewHistogramVec(
			prometheus.HistogramOpts{
				Name:    "relayer_transaction_latency_seconds",
				Help:    "Transaction latency in seconds",
				Buckets: prometheus.DefBuckets,
			},
			[]string{"chain_id", "message_type"},
		),
		errorCount: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "relayer_errors_total",
				Help: "Total number of errors",
			},
			[]string{"operation", "error_type"},
		),
		healthStatus: promauto.NewGaugeVec(
			prometheus.GaugeOpts{
				Name: "relayer_health_status",
				Help: "Health status of the relayer",
			},
			[]string{"component"},
		),
	}
}

// NewEventBuffer creates a new event buffer
func NewEventBuffer(maxSize int) *EventBuffer {
	return &EventBuffer{
		events:  make([]*Event, 0, maxSize),
		maxSize: maxSize,
	}
}

// NewAlertManager creates a new alert manager
func NewAlertManager() *AlertManager {
	return &AlertManager{
		alerts: make(map[string]*Alert),
		rules:  make([]*AlertRule, 0),
	}
}

// RecordEvent records an event
func (m *Monitor) RecordEvent(event *Event) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	// Add to event buffer
	m.eventBuffer.Add(event)
	
	// Update metrics
	m.updateMetrics(event)
	
	// Log event
	m.logEvent(event)
	
	// Check alert rules
	m.alertManager.CheckRules(m)
}

// updateMetrics updates metrics based on the event
func (m *Monitor) updateMetrics(event *Event) {
	switch event.Type {
	case EventTypeMessageProcessed:
		m.metrics.MessagesProcessed++
		m.promMetrics.messagesProcessed.WithLabelValues(
			event.ChainID,
			event.MessageType.String(),
			event.Status.String(),
		).Inc()
		
	case EventTypeMessageSent:
		m.metrics.MessagesSent++
		m.promMetrics.messagesSent.WithLabelValues(
			event.ChainID,
			event.MessageType.String(),
		).Inc()
		
	case EventTypeMessageFailed:
		m.metrics.MessagesFailed++
		m.promMetrics.messagesFailed.WithLabelValues(
			event.ChainID,
			event.MessageType.String(),
			"unknown",
		).Inc()
		
	case EventTypeTransactionSubmitted:
		if event.Duration > 0 {
			m.promMetrics.transactionLatency.WithLabelValues(
				event.ChainID,
				event.MessageType.String(),
			).Observe(event.Duration.Seconds())
		}
		
	case EventTypeErrorOccurred:
		m.promMetrics.errorCount.WithLabelValues(
			event.Metadata["operation"].(string),
			"unknown",
		).Inc()
	}
	
	// Update average latency
	if event.Duration > 0 {
		m.metrics.AverageLatency = time.Duration(
			(int64(m.metrics.AverageLatency)*int64(m.metrics.MessagesProcessed-1) + int64(event.Duration)) /
				int64(m.metrics.MessagesProcessed),
		)
	}
	
	m.metrics.LastProcessedTime = time.Now()
}

// logEvent logs the event
func (m *Monitor) logEvent(event *Event) {
	eventLog := m.logger.Info()
	
	if event.Status == EventStatusFailure {
		eventLog = m.logger.Error()
	} else if event.Status == EventStatusWarning {
		eventLog = m.logger.Warn()
	}
	
	eventLog.
		Str("event_id", event.ID).
		Str("event_type", event.Type.String()).
		Str("chain_id", event.ChainID).
		Str("message_type", event.MessageType.String()).
		Str("status", event.Status.String()).
		Time("timestamp", event.Timestamp).
		Dur("duration", event.Duration).
		Msg("Event recorded")
	
	if event.Error != "" {
		eventLog.Str("error", event.Error)
	}
	
	if len(event.Metadata) > 0 {
		eventLog.Interface("metadata", event.Metadata)
	}
}

// AddHealthCheck adds a health check
func (m *Monitor) AddHealthCheck(name string, checkFunc func() error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.healthChecks[name] = &HealthCheck{
		Name:   name,
		Status: HealthStatusHealthy,
	}
	
	// Start health check goroutine
	go m.runHealthCheck(name, checkFunc)
}

// runHealthCheck runs a health check periodically
func (m *Monitor) runHealthCheck(name string, checkFunc func() error) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for {
		select {
		case <-m.ctx.Done():
			return
		case <-ticker.C:
			start := time.Now()
			err := checkFunc()
			duration := time.Since(start)
			
			m.mu.Lock()
			healthCheck := m.healthChecks[name]
			healthCheck.LastChecked = time.Now()
			healthCheck.Duration = duration
			
			if err != nil {
				healthCheck.Status = HealthStatusUnhealthy
				healthCheck.Error = err.Error()
				
				// Record error event
				m.RecordEvent(&Event{
					ID:        generateEventID(),
					Type:      EventTypeErrorOccurred,
					Timestamp: time.Now(),
					Status:    EventStatusFailure,
					Error:     err.Error(),
					Metadata: map[string]interface{}{
						"operation":     "health_check",
						"health_check":  name,
						"check_duration": duration,
					},
				})
			} else {
				healthCheck.Status = HealthStatusHealthy
				healthCheck.Error = ""
			}
			
			// Update Prometheus metrics
			m.promMetrics.healthStatus.WithLabelValues(name).Set(float64(healthCheck.Status))
			m.mu.Unlock()
		}
	}
}

// GetHealthStatus returns the overall health status
func (m *Monitor) GetHealthStatus() HealthStatus {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	// Check all health checks
	hasUnhealthy := false
	hasDegraded := false
	
	for _, check := range m.healthChecks {
		switch check.Status {
		case HealthStatusUnhealthy:
			hasUnhealthy = true
		case HealthStatusDegraded:
			hasDegraded = true
		}
	}
	
	if hasUnhealthy {
		return HealthStatusUnhealthy
	}
	if hasDegraded {
		return HealthStatusDegraded
	}
	return HealthStatusHealthy
}

// GetMetrics returns the current metrics
func (m *Monitor) GetMetrics() *RelayerMetrics {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	return m.metrics
}

// GetRecentEvents returns recent events
func (m *Monitor) GetRecentEvents(limit int) []*Event {
	return m.eventBuffer.GetRecent(limit)
}

// GetHealthChecks returns all health checks
func (m *Monitor) GetHealthChecks() map[string]*HealthCheck {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	checks := make(map[string]*HealthCheck)
	for k, v := range m.healthChecks {
		checks[k] = v
	}
	
	return checks
}

// GetAlerts returns all alerts
func (m *Monitor) GetAlerts() []*Alert {
	return m.alertManager.GetAlerts()
}

// AddAlertRule adds an alert rule
func (m *Monitor) AddAlertRule(rule *AlertRule) {
	m.alertManager.AddRule(rule)
}

// AddAlertNotifier adds an alert notifier
func (m *Monitor) AddAlertNotifier(notifier AlertNotifier) {
	m.alertManager.AddNotifier(notifier)
}

// EventBuffer methods

// Add adds an event to the buffer
func (eb *EventBuffer) Add(event *Event) {
	eb.mu.Lock()
	defer eb.mu.Unlock()
	
	eb.events = append(eb.events, event)
	
	// Remove oldest events if buffer is full
	if len(eb.events) > eb.maxSize {
		eb.events = eb.events[1:]
	}
}

// GetRecent returns recent events
func (eb *EventBuffer) GetRecent(limit int) []*Event {
	eb.mu.RLock()
	defer eb.mu.RUnlock()
	
	if limit > len(eb.events) {
		limit = len(eb.events)
	}
	
	return eb.events[len(eb.events)-limit:]
}

// AlertManager methods

// AddRule adds an alert rule
func (am *AlertManager) AddRule(rule *AlertRule) {
	am.mu.Lock()
	defer am.mu.Unlock()
	
	am.rules = append(am.rules, rule)
}

// AddNotifier adds an alert notifier
func (am *AlertManager) AddNotifier(notifier AlertNotifier) {
	am.mu.Lock()
	defer am.mu.Unlock()
	
	am.notifiers = append(am.notifiers, notifier)
}

// CheckRules checks all alert rules
func (am *AlertManager) CheckRules(monitor *Monitor) {
	am.mu.RLock()
	defer am.mu.RUnlock()
	
	for _, rule := range am.rules {
		if !rule.Enabled {
			continue
		}
		
		if rule.Condition(monitor) {
			// Create alert
			alert := &Alert{
				ID:          generateAlertID(),
				Type:        AlertTypeWarning,
				Severity:    rule.Severity,
				Title:       rule.Name,
				Description: rule.Message,
				Timestamp:   time.Now(),
				Resolved:    false,
				Metadata: map[string]interface{}{
					"rule_name": rule.Name,
				},
			}
			
			// Add alert
			am.mu.Lock()
			am.alerts[alert.ID] = alert
			am.mu.Unlock()
			
			// Send notifications
			for _, notifier := range am.notifiers {
				go func(n AlertNotifier, a *Alert) {
					if err := n.Notify(a); err != nil {
						log.Error().Err(err).Str("alert_id", a.ID).Msg("Failed to send alert notification")
					}
				}(notifier, alert)
			}
			
			rule.LastTriggered = time.Now()
		}
	}
}

// GetAlerts returns all alerts
func (am *AlertManager) GetAlerts() []*Alert {
	am.mu.RLock()
	defer am.mu.RUnlock()
	
	alerts := make([]*Alert, 0, len(am.alerts))
	for _, alert := range am.alerts {
		alerts = append(alerts, alert)
	}
	
	return alerts
}

// Helper functions

// generateEventID generates a unique event ID
func generateEventID() string {
	return fmt.Sprintf("evt_%d", time.Now().UnixNano())
}

// generateAlertID generates a unique alert ID
func generateAlertID() string {
	return fmt.Sprintf("alert_%d", time.Now().UnixNano())
}

// String methods for enums

func (et EventType) String() string {
	return [...]string{
		"MESSAGE_RECEIVED",
		"MESSAGE_PROCESSED",
		"MESSAGE_SENT",
		"MESSAGE_CONFIRMED",
		"MESSAGE_FAILED",
		"TRANSACTION_SUBMITTED",
		"TRANSACTION_CONFIRMED",
		"TRANSACTION_FAILED",
		"ERROR_OCCURRED",
		"HEALTH_CHECK",
	}[et]
}

func (es EventStatus) String() string {
	return [...]string{
		"SUCCESS",
		"FAILURE",
		"WARNING",
		"INFO",
	}[es]
}

func (hs HealthStatus) String() string {
	return [...]string{
		"HEALTHY",
		"DEGRADED",
		"UNHEALTHY",
	}[hs]
}

func (at AlertType) String() string {
	return [...]string{
		"ERROR",
		"WARNING",
		"INFO",
	}[at]
}

func (as AlertSeverity) String() string {
	return [...]string{
		"LOW",
		"MEDIUM",
		"HIGH",
		"CRITICAL",
	}[as]
}

// LogNotifier is a simple alert notifier that logs alerts
type LogNotifier struct{}

func (ln *LogNotifier) Notify(alert *Alert) error {
	log.Info().
		Str("alert_id", alert.ID).
		Str("type", alert.Type.String()).
		Str("severity", alert.Severity.String()).
		Str("title", alert.Title).
		Str("description", alert.Description).
		Time("timestamp", alert.Timestamp).
		Msg("Alert triggered")
	return nil
}