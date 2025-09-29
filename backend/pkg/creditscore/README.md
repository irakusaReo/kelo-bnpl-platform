# Kelo Credit Scoring Engine

A comprehensive credit scoring engine for the Kelo BNPL platform that integrates on-chain and off-chain data sources to provide accurate credit assessments for users in Kenya.

## Overview

The Credit Scoring Engine is designed to provide holistic credit assessments by combining:

- **On-chain data**: Blockchain transaction history, loan repayment behavior, and DeFi activity
- **Off-chain data**: M-Pesa statements, bank statements, CRB reports, and payslip data
- **DID verification**: Hedera-based decentralized identity verification
- **HCS analysis**: Hedera Consensus Service message analysis for behavioral patterns

## Architecture

### Core Components

1. **CreditScoreEngine** (`engine.go`)
   - Main engine that orchestrates credit score calculations
   - Integrates multiple data sources and scoring factors
   - Provides weighted scoring based on configurable parameters

2. **ExternalAPIs** (`external_apis.go`)
   - Handles integration with external data sources
   - M-Pesa API client for transaction history
   - Bank API clients for statement data
   - CRB (Credit Reference Bureau) integration
   - Payslip data integration with payroll systems

3. **DIDResolver** (`did_resolver.go`)
   - Manages Hedera DID (Decentralized Identifier) operations
   - Verifies DID documents on the blockchain
   - Extracts and validates user profile data
   - Provides trust scoring based on verification level

4. **HCSAnalyzer** (`hcs_analyzer.go`)
   - Analyzes Hedera Consensus Service messages
   - Detects behavioral patterns and anomalies
   - Provides risk assessment based on on-chain activity
   - Supports AI-powered risk prediction

5. **CreditScoreService** (`service.go`)
   - High-level service layer
   - Generates comprehensive credit reports
   - Provides risk assessment and loan eligibility
   - Manages external data source integration

6. **CreditScoreHandler** (`handler.go`)
   - HTTP API handler for credit scoring endpoints
   - RESTful API for credit score operations
   - Authentication and authorization middleware
   - Comprehensive error handling

## Scoring Methodology

### Scoring Factors

The credit score is calculated using a weighted combination of the following factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| On-chain History | 25% | Blockchain transaction history and behavior |
| Repayment Behavior | 30% | Loan repayment history and consistency |
| Account Age | 10% | Platform account tenure and activity |
| External Data | 20% | Off-chain data sources (M-Pesa, bank, CRB, payslip) |
| DID Verification | 15% | Decentralized identity verification status |

### Score Range

- **300-599**: Very Poor
- **600-649**: Poor
- **650-699**: Fair
- **700-749**: Good
- **750-850**: Excellent

## Data Sources Integration

### On-chain Data Sources

1. **Blockchain Transactions**
   - Ethereum/Base transaction history
   - Solana and Aptos activity
   - Hedera token operations
   - DeFi protocol interactions

2. **Loan Repayments**
   - On-chain repayment tracking
   - Smart contract interactions
   - Cross-chain repayment verification

3. **HCS Messages**
   - Hedera Consensus Service analysis
   - Behavioral pattern detection
   - Anomaly detection and risk scoring

### Off-chain Data Sources

1. **M-Pesa Integration**
   - Transaction history analysis
   - Cash flow assessment
   - Consistency scoring
   - Fraud detection patterns

2. **Bank Statements**
   - Account balance analysis
   - Income and expense tracking
   - Savings rate calculation
   - Financial stability assessment

3. **CRB Reports**
   - Credit score integration
   - Loan history analysis
   - Default risk assessment
   - Judgment and enquiry analysis

4. **Payslip Data**
   - Income verification
   - Employment stability
   - Tax and deduction analysis
   - Financial capacity assessment

### DID Verification

1. **Hedera DID Registry**
   - Identity verification on blockchain
   - Trust score calculation
   - Badge and credential verification
   - Anti-fraud measures

## API Endpoints

### Credit Score Operations

- `GET /api/v1/creditscore/{userID}` - Get current credit score
- `PUT /api/v1/creditscore/{userID}` - Update credit score
- `GET /api/v1/creditscore/{userID}/report` - Get comprehensive report
- `GET /api/v1/creditscore/{userID}/history` - Get score history

### External Data Sources

- `POST /api/v1/creditscore/{userID}/datasources` - Add external data source

### Analytics and Assessment

- `GET /api/v1/creditscore/{userID}/analytics` - Get user analytics
- `GET /api/v1/creditscore/{userID}/risk` - Get risk assessment
- `GET /api/v1/creditscore/{userID}/eligibility` - Get loan eligibility

### DID Operations

- `GET /api/v1/creditscore/{userID}/did` - Get DID analysis
- `POST /api/v1/creditscore/{userID}/did/verify` - Verify DID

### HCS Analysis

- `GET /api/v1/creditscore/{userID}/hcs/behavior` - Get HCS behavior analysis
- `GET /api/v1/creditscore/{userID}/hcs/repayments` - Get HCS repayment history
- `GET /api/v1/creditscore/{userID}/hcs/loans` - Get HCS loan history

## Configuration

### Environment Variables

The credit scoring engine requires the following environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/kelo_db

# API Keys (for external integrations)
MPESA_API_KEY=your_mpesa_api_key
MPESA_SECRET=your_mpesa_secret
CRB_API_KEY=your_crb_api_key

# Blockchain Configuration
HEDERA_NETWORK=testnet
ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
BASE_RPC=https://base-mainnet.infura.io/v3/YOUR_PROJECT_ID
SOLANA_RPC=https://api.mainnet-beta.solana.com
APTOS_RPC=https://fullnode.mainnet.aptoslabs.com

# Security
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
```

### Configuration Files

The engine can be configured through:

1. **Environment variables** (primary)
2. **Configuration files** (YAML/JSON)
3. **Runtime configuration** (API endpoints)

## Security Features

### Data Protection

- **Encryption**: All sensitive data is encrypted at rest and in transit
- **API Security**: JWT-based authentication and authorization
- **Rate Limiting**: Prevents abuse of external API endpoints
- **Audit Logging**: Comprehensive audit trail for all operations

### Fraud Detection

- **Pattern Analysis**: Detects suspicious transaction patterns
- **Anomaly Detection**: AI-powered anomaly detection in user behavior
- **Cross-validation**: Validates data across multiple sources
- **Real-time Monitoring**: Continuous monitoring for fraudulent activity

### Privacy Compliance

- **GDPR Compliant**: Data processing follows GDPR principles
- **User Consent**: Explicit consent required for data processing
- **Data Minimization**: Only necessary data is collected and processed
- **Right to Erasure**: Users can request data deletion

## Performance Considerations

### Caching Strategy

- **Redis Caching**: Frequently accessed data is cached
- **Score Validity**: Credit scores are cached for 30 days
- **External API Caching**: External API responses are cached
- **Database Optimization**: Optimized queries and indexing

### Scalability

- **Horizontal Scaling**: Service can be scaled horizontally
- **Load Balancing**: Multiple instances can handle high load
- **Database Sharding**: Supports database sharding for large datasets
- **Async Processing**: Background jobs for non-critical operations

### Monitoring

- **Health Checks**: Comprehensive health monitoring
- **Performance Metrics**: Detailed performance metrics
- **Error Tracking**: Real-time error tracking and alerting
- **Resource Monitoring**: CPU, memory, and disk usage monitoring

## Testing

### Unit Tests

```bash
# Run unit tests
go test ./pkg/creditscore/... -v

# Run tests with coverage
go test ./pkg/creditscore/... -v -cover

# Run specific test
go test ./pkg/creditscore/... -v -run TestCalculateCreditScore
```

### Integration Tests

```bash
# Run integration tests
go test ./pkg/creditscore/... -v -tags=integration

# Run tests with external dependencies
go test ./pkg/creditscore/... -v -tags=integration -external
```

### Performance Tests

```bash
# Run performance benchmarks
go test ./pkg/creditscore/... -v -bench=.

# Run load tests
go test ./pkg/creditscore/... -v -bench=. -benchmem
```

## Deployment

### Docker Deployment

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o credit-score-engine ./pkg/creditscore

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/credit-score-engine .
COPY --from=builder /app/config ./config

CMD ["./credit-score-engine"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: credit-scoring-engine
spec:
  replicas: 3
  selector:
    matchLabels:
      app: credit-scoring-engine
  template:
    metadata:
      labels:
        app: credit-scoring-engine
    spec:
      containers:
      - name: credit-scoring-engine
        image: kelo/credit-scoring-engine:latest
        ports:
        - containerPort: 8081
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: MPESA_API_KEY
          valueFrom:
            secretKeyRef:
              name: mpesa-secret
              key: api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## Monitoring and Observability

### Metrics

The following metrics are collected:

- **Credit Score Calculations**: Number of score calculations
- **API Response Times**: Response times for all endpoints
- **External API Calls**: Latency and success rates
- **Database Queries**: Query performance and success rates
- **Error Rates**: Error counts by type and endpoint

### Logging

Structured logging with the following information:

- **Request/Response Logs**: All API requests and responses
- **Error Logs**: Detailed error information with stack traces
- **Audit Logs**: All operations for compliance and security
- **Performance Logs**: Performance metrics and optimization data

### Alerting

Alerts are configured for:

- **High Error Rates**: When error rates exceed thresholds
- **Slow Response Times**: When API responses are slow
- **External API Failures**: When external APIs are unavailable
- **Database Issues**: When database performance degrades

## Contributing

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/kelo/credit-scoring-engine.git
   cd credit-scoring-engine
   ```

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run tests**
   ```bash
   go test ./...
   ```

5. **Start development server**
   ```bash
   go run cmd/api/main.go
   ```

### Code Style

- Follow Go standard formatting (`go fmt`)
- Use conventional commit messages
- Write comprehensive tests
- Document public APIs and functions

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- **Documentation**: [Kelo Documentation](https://docs.kelo.co.ke)
- **Issues**: [GitHub Issues](https://github.com/kelo/credit-scoring-engine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kelo/credit-scoring-engine/discussions)
- **Email**: support@kelo.co.ke

## Changelog

### v1.0.0 (2024-01-15)

- Initial release
- Core credit scoring engine
- External API integrations
- DID verification support
- HCS analysis capabilities
- RESTful API endpoints
- Comprehensive testing suite