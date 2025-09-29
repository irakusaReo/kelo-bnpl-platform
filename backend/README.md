# Kelo Backend Service

This is the backend service for the Kelo BNPL (Buy Now, Pay Later) platform, built with Go.

## Project Structure

```
backend/
├── cmd/                    # Command line applications
│   ├── api/               # API server
│   └── migrator/          # Database migration tool
├── api/                   # API handlers and routes
│   ├── handlers/          # HTTP handlers
│   ├── middleware/        # HTTP middleware
│   └── routes/            # Route definitions
├── internal/              # Internal application code
│   ├── auth/              # Authentication and authorization
│   ├── credit/            # Credit scoring engine
│   ├── relayer/           # Cross-chain relayer service
│   └── utils/             # Utility functions
├── pkg/                   # Public packages
│   ├── blockchain/        # Blockchain interactions
│   ├── config/            # Configuration management
│   ├── logger/            # Logging utilities
│   └── models/            # Data models
├── configs/               # Configuration files
├── scripts/               # Build and deployment scripts
└── docs/                  # Documentation
```

## Features

- **RESTful API**: HTTP API for all platform operations
- **Credit Scoring**: Advanced credit scoring engine with on-chain and off-chain data
- **Cross-chain Relayer**: LayerZero-based cross-chain message relaying
- **Authentication**: JWT-based authentication with DID support
- **Database**: PostgreSQL with GORM ORM
- **Logging**: Structured logging with zerolog
- **Configuration**: Environment-based configuration with viper

## Quick Start

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 14 or higher
- Node.js (for frontend development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kelo/backend
```

2. Install dependencies:
```bash
go mod download
```

3. Set up environment variables:
```bash
cp configs/.env.example configs/.env
# Edit configs/.env with your configuration
```

4. Set up the database:
```bash
# Create database
createdb kelo_db

# Run migrations
go run cmd/migrator/main.go up
```

5. Run the API server:
```bash
go run cmd/api/main.go
```

The API server will start on `http://localhost:8080`.

## Configuration

Configuration is managed through environment variables. See `configs/.env.example` for all available options.

### Environment Variables

- `PORT`: API server port (default: 8080)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `HEDERA_NETWORK`: Hedera network (testnet/mainnet)
- `LAYERZERO_ENDPOINT`: LayerZero endpoint address
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## API Documentation

The API provides the following endpoints:

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/credit-score` - Get user credit score

### Loans
- `POST /api/v1/loans/apply` - Apply for a loan
- `GET /api/v1/loans/:id` - Get loan details
- `GET /api/v1/loans` - List user loans
- `POST /api/v1/loans/:id/repay` - Make a repayment

### Merchants
- `POST /api/v1/merchants/register` - Register as a merchant
- `GET /api/v1/merchants/profile` - Get merchant profile
- `GET /api/v1/merchants/loans` - List merchant loans

### Liquidity Pools
- `GET /api/v1/pools` - List liquidity pools
- `POST /api/v1/pools/deposit` - Deposit liquidity
- `POST /api/v1/pools/withdraw` - Withdraw liquidity

## Development

### Running Tests

```bash
go test ./...
```

### Building

```bash
# Build for current platform
go build -o bin/kelo-api cmd/api/main.go

# Build for multiple platforms
./scripts/build.sh
```

### Code Quality

```bash
# Format code
go fmt ./...

# Lint code
golangci-lint run

# Run security check
gosec ./...
```

## Database Migrations

Migrations are managed using the migrator tool:

```bash
# Run all pending migrations
go run cmd/migrator/main.go up

# Rollback last migration
go run cmd/migrator/main.go down

# Create new migration
go run cmd/migrator/main.go create <migration_name>
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t kelo-backend .

# Run container
docker run -p 8080:8080 kelo-backend
```

### Kubernetes

See `docs/kubernetes.md` for Kubernetes deployment instructions.

## Security

- All sensitive data is encrypted at rest
- JWT tokens are used for authentication
- Input validation is performed on all endpoints
- SQL injection prevention with parameterized queries
- CORS configuration for web security

## Monitoring

The application includes built-in monitoring:

- Health check endpoint: `GET /health`
- Metrics endpoint: `GET /metrics`
- Structured logging with request tracing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.