package relayer

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/rs/zerolog/log"
)

// ErrorHandler handles errors and retry logic for the relayer service
type ErrorHandler struct {
	maxRetries        int
	baseDelay         time.Duration
	maxDelay         time.Duration
	backoffFactor    float64
	circuitBreakers  map[string]*CircuitBreaker
	cbMutex          sync.RWMutex
}

// CircuitBreaker implements the circuit breaker pattern for error handling
type CircuitBreaker struct {
	name          string
	maxFailures   int
	resetTimeout  time.Duration
	failures      int
	lastFailure   time.Time
	state         CircuitState
	mutex         sync.RWMutex
}

// CircuitState represents the state of a circuit breaker
type CircuitState int

const (
	CircuitClosed CircuitState = iota
	CircuitOpen
	CircuitHalfOpen
)

// RetryConfig holds configuration for retry logic
type RetryConfig struct {
	MaxRetries     int           `json:"max_retries"`
	BaseDelay      time.Duration `json:"base_delay"`
	MaxDelay       time.Duration `json:"max_delay"`
	BackoffFactor  float64       `json:"backoff_factor"`
}

// ErrorContext provides context about an error
type ErrorContext struct {
	Operation     string        `json:"operation"`
	ChainID       string        `json:"chain_id"`
	MessageType   MessageType   `json:"message_type"`
	RetryCount    int           `json:"retry_count"`
	LastError     error         `json:"last_error"`
	Timestamp     time.Time     `json:"timestamp"`
	Duration      time.Duration `json:"duration"`
}

// RecoveryStrategy defines how to recover from different types of errors
type RecoveryStrategy interface {
	ShouldRetry(err error, ctx *ErrorContext) bool
	GetDelay(retryCount int, ctx *ErrorContext) time.Duration
	Recover(ctx *ErrorContext) error
}

// NewErrorHandler creates a new error handler
func NewErrorHandler(config *RetryConfig) *ErrorHandler {
	if config == nil {
		config = &RetryConfig{
			MaxRetries:    3,
			BaseDelay:     1 * time.Second,
			MaxDelay:     30 * time.Second,
			BackoffFactor: 2.0,
		}
	}
	
	return &ErrorHandler{
		maxRetries:       config.MaxRetries,
		baseDelay:        config.BaseDelay,
		maxDelay:         config.MaxDelay,
		backoffFactor:    config.BackoffFactor,
		circuitBreakers:  make(map[string]*CircuitBreaker),
	}
}

// HandleError handles an error with retry logic
func (eh *ErrorHandler) HandleError(ctx context.Context, err error, operation string, retryFunc func() error) error {
	errorCtx := &ErrorContext{
		Operation:  operation,
		Timestamp:  time.Now(),
		LastError:  err,
	}
	
	// Get circuit breaker for this operation
	cb := eh.getCircuitBreaker(operation)
	
	// Check if circuit breaker allows the operation
	if !cb.Allow() {
		return fmt.Errorf("circuit breaker is open for operation: %s", operation)
	}
	
	// Attempt the operation with retries
	for attempt := 0; attempt <= eh.maxRetries; attempt++ {
		errorCtx.RetryCount = attempt
		
		// Try the operation
		err = retryFunc()
		if err == nil {
			// Success
			cb.OnSuccess()
			return nil
		}
		
		errorCtx.LastError = err
		errorCtx.Duration = time.Since(errorCtx.Timestamp)
		
		// Log the error
		log.Error().
			Err(err).
			Str("operation", operation).
			Int("attempt", attempt).
			Dur("duration", errorCtx.Duration).
			Msg("Operation failed")
		
		// Notify circuit breaker of failure
		cb.OnFailure()
		
		// Check if we should retry
		if attempt == eh.maxRetries || !eh.shouldRetry(err, errorCtx) {
			break
		}
		
		// Calculate delay
		delay := eh.calculateDelay(attempt, errorCtx)
		
		// Wait before retry
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
			// Continue to next attempt
		}
	}
	
	// All retries failed
	return fmt.Errorf("operation failed after %d attempts: %w", eh.maxRetries+1, err)
}

// getCircuitBreaker gets or creates a circuit breaker for the specified operation
func (eh *ErrorHandler) getCircuitBreaker(operation string) *CircuitBreaker {
	eh.cbMutex.RLock()
	cb, exists := eh.circuitBreakers[operation]
	eh.cbMutex.RUnlock()
	
	if exists {
		return cb
	}
	
	eh.cbMutex.Lock()
	defer eh.cbMutex.Unlock()
	
	// Check again in case another goroutine created it
	cb, exists = eh.circuitBreakers[operation]
	if !exists {
		cb = NewCircuitBreaker(operation, 5, 5*time.Minute)
		eh.circuitBreakers[operation] = cb
	}
	
	return cb
}

// shouldRetry determines if an error should be retried
func (eh *ErrorHandler) shouldRetry(err error, ctx *ErrorContext) bool {
	// Don't retry context errors
	if err == context.Canceled || err == context.DeadlineExceeded {
		return false
	}
	
	// Don't retry if we've exceeded max retries
	if ctx.RetryCount >= eh.maxRetries {
		return false
	}
	
	// Check error type
	switch err := err.(type) {
	case *TemporaryError:
		return true
	case *RateLimitError:
		return true
	case *NetworkError:
		return true
	case *ValidationError:
		return false // Validation errors are permanent
	case *AuthenticationError:
		return false // Authentication errors are permanent
	default:
		// For unknown errors, retry up to max retries
		return ctx.RetryCount < eh.maxRetries
	}
}

// calculateDelay calculates the delay before the next retry
func (eh *ErrorHandler) calculateDelay(attempt int, ctx *ErrorContext) time.Duration {
	// Exponential backoff with jitter
	delay := time.Duration(float64(eh.baseDelay) * math.Pow(eh.backoffFactor, float64(attempt)))
	
	// Cap at max delay
	if delay > eh.maxDelay {
		delay = eh.maxDelay
	}
	
	// Add jitter to prevent thundering herd
	jitter := time.Duration(float64(delay) * 0.1 * (float64(time.Now().UnixNano()%1000) / 1000.0))
	delay += jitter
	
	return delay
}

// NewCircuitBreaker creates a new circuit breaker
func NewCircuitBreaker(name string, maxFailures int, resetTimeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		name:         name,
		maxFailures:  maxFailures,
		resetTimeout: resetTimeout,
		state:        CircuitClosed,
	}
}

// Allow checks if the circuit breaker allows the operation
func (cb *CircuitBreaker) Allow() bool {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()
	
	if cb.state == CircuitClosed {
		return true
	}
	
	if cb.state == CircuitOpen {
		if time.Since(cb.lastFailure) > cb.resetTimeout {
			// Move to half-open state
			cb.mutex.RUnlock()
			cb.mutex.Lock()
			defer cb.mutex.Unlock()
			
			if cb.state == CircuitOpen {
				cb.state = CircuitHalfOpen
				cb.failures = 0
				log.Info().Str("circuit_breaker", cb.name).Msg("Circuit breaker moved to half-open state")
			}
			return true
		}
		return false
	}
	
	// Half-open state - allow one attempt
	return true
}

// OnSuccess is called when an operation succeeds
func (cb *CircuitBreaker) OnSuccess() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	
	if cb.state == CircuitHalfOpen {
		// Reset to closed state
		cb.state = CircuitClosed
		cb.failures = 0
		log.Info().Str("circuit_breaker", cb.name).Msg("Circuit breaker reset to closed state")
	}
}

// OnFailure is called when an operation fails
func (cb *CircuitBreaker) OnFailure() {
	cb.mutex.Lock()
	defer cb.mutex.Unlock()
	
	cb.failures++
	cb.lastFailure = time.Now()
	
	if cb.failures >= cb.maxFailures {
		if cb.state != CircuitOpen {
			cb.state = CircuitOpen
			log.Warn().
				Str("circuit_breaker", cb.name).
				Int("failures", cb.failures).
				Dur("reset_timeout", cb.resetTimeout).
				Msg("Circuit breaker opened")
		}
	}
}

// GetState returns the current state of the circuit breaker
func (cb *CircuitBreaker) GetState() CircuitState {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()
	return cb.state
}

// GetStats returns statistics about the circuit breaker
func (cb *CircuitBreaker) GetStats() map[string]interface{} {
	cb.mutex.RLock()
	defer cb.mutex.RUnlock()
	
	return map[string]interface{}{
		"name":        cb.name,
		"state":       cb.state.String(),
		"failures":    cb.failures,
		"last_failure": cb.lastFailure,
	}
}

// String returns the string representation of CircuitState
func (cs CircuitState) String() string {
	switch cs {
	case CircuitClosed:
		return "CLOSED"
	case CircuitOpen:
		return "OPEN"
	case CircuitHalfOpen:
		return "HALF_OPEN"
	default:
		return "UNKNOWN"
	}
}

// Error types for different failure scenarios

// TemporaryError represents a temporary error that should be retried
type TemporaryError struct {
	Err error
}

func (e *TemporaryError) Error() string {
	return fmt.Sprintf("temporary error: %v", e.Err)
}

func (e *TemporaryError) Unwrap() error {
	return e.Err
}

// RateLimitError represents a rate limit error
type RateLimitError struct {
	RetryAfter time.Duration
	Err        error
}

func (e *RateLimitError) Error() string {
	return fmt.Sprintf("rate limit error (retry after %v): %v", e.RetryAfter, e.Err)
}

func (e *RateLimitError) Unwrap() error {
	return e.Err
}

// NetworkError represents a network-related error
type NetworkError struct {
	Err error
}

func (e *NetworkError) Error() string {
	return fmt.Sprintf("network error: %v", e.Err)
}

func (e *NetworkError) Unwrap() error {
	return e.Err
}

// ValidationError represents a validation error
type ValidationError struct {
	Err error
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation error: %v", e.Err)
}

func (e *ValidationError) Unwrap() error {
	return e.Err
}

// AuthenticationError represents an authentication error
type AuthenticationError struct {
	Err error
}

func (e *AuthenticationError) Error() string {
	return fmt.Sprintf("authentication error: %v", e.Err)
}

func (e *AuthenticationError) Unwrap() error {
	return e.Err
}

// RetryableOperation represents an operation that can be retried
type RetryableOperation struct {
	Name        string
	Operation   func() error
	MaxRetries  int
	BaseDelay   time.Duration
	MaxDelay    time.Duration
	Backoff     float64
	Context     *ErrorContext
}

// Execute executes the retryable operation with error handling
func (op *RetryableOperation) Execute(ctx context.Context) error {
	errorHandler := NewErrorHandler(&RetryConfig{
		MaxRetries:    op.MaxRetries,
		BaseDelay:     op.BaseDelay,
		MaxDelay:      op.MaxDelay,
		BackoffFactor: op.Backoff,
	})
	
	return errorHandler.HandleError(ctx, nil, op.Name, op.Operation)
}

// NewRetryableOperation creates a new retryable operation
func NewRetryableOperation(name string, operation func() error) *RetryableOperation {
	return &RetryableOperation{
		Name:       name,
		Operation:  operation,
		MaxRetries: 3,
		BaseDelay:  1 * time.Second,
		MaxDelay:   30 * time.Second,
		Backoff:    2.0,
	}
}