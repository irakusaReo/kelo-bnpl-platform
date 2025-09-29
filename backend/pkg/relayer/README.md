# Kelo Trusted Relayer Service

The Kelo Trusted Relayer Service is a critical component that acts as the bridge between the core logic on Hedera and the multi-chain liquidity pools. It listens for important on-chain events (like loan approvals on Hedera) and securely constructs, signs, and submits corresponding LayerZero messages to the correct liquidity chains for fund disbursement.

## Overview

The trusted relayer service provides:

- **Event Listening**: Monitors Hedera smart contracts for loan-related events
- **Cross-Chain Messaging**: Constructs and sends LayerZero messages to multiple chains
- **Secure Transaction Handling**: Manages secure transaction submission with proper nonce and gas management
- **Error Handling & Retry**: Implements robust error handling with exponential backoff and circuit breakers
- **Monitoring & Logging**: Comprehensive monitoring with Prometheus metrics and structured logging
- **Health Checks**: Built-in health monitoring for all components

## Architecture

### Core Components

1. **TrustedRelayer** (`relayer.go`)
   - Main service orchestrator
   - Manages event listeners and message processing
   - Handles service lifecycle (start/stop)

2. **HederaEventListener** (`hedera_listener.go`)
   - Listens for events on Hedera smart contracts
   - Decodes event logs into structured events
   - Supports polling-based event detection

3. **LayerZeroClient** (`layerzero_client.go`)
   - Handles LayerZero message sending
   - Manages cross-chain communication
   - Provides message signing and verification

4. **TransactionManager** (`transaction_manager.go`)
   - Manages secure transaction submission
   - Handles nonce management and gas price estimation
   - Provides transaction monitoring and confirmation

5. **ErrorHandler** (`error_handler.go`)
   - Implements retry logic with exponential backoff
   - Circuit breaker pattern for error handling
   - Different error types with appropriate recovery strategies

6. **Monitor** (`monitor.go`)
   - Comprehensive monitoring and metrics collection
   - Prometheus metrics integration
   - Health checks and alert management

### Message Flow

```
Hedera Event → Event Listener → Message Factory → Message Queue → 
Transaction Manager → LayerZero → Destination Chain
```

## Configuration

The service is configured through environment variables:

### Required Configuration

```bash
# Basic Configuration
PORT=8081
ENVIRONMENT=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kelo_db

# Security
JWT_SECRET=your_jwt_secret_here
RELAYER_PRIVATE_KEY=your_private_key_here

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# LayerZero Configuration
LAYERZERO_ENDPOINT=https://api.layerzero.network
LAYERZERO_API_KEY=your_layerzero_api_key

# Chain Configurations
ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_LIQUIDITY_POOL=0x0987654321098765432109876543210987654321

BASE_RPC=https://mainnet.base.org
BASE_LIQUIDITY_POOL=0xabcdefabcdefabcdefabcdefabcdefabcd

SOLANA_RPC=https://api.mainnet-beta.solana.com
APTOS_RPC=https://fullnode.mainnet.aptoslabs.com

# External APIs
MPESA_API_KEY=your_mpesa_api_key
MPESA_SECRET=your_mpesa_secret

# Retry Configuration
MAX_RETRIES=3
```

### Optional Configuration

```bash
# Redis for caching (optional)
REDIS_URL=redis://localhost:6379

# Custom gas settings
MAX_GAS_PRICE=500000000000  # 500 Gwei
MAX_GAS_LIMIT=2000000       # 2M gas
```

## Installation

### Prerequisites

- Go 1.19 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher (optional)

### Build

```bash
# Clone the repository
git clone https://github.com/kelo/relayer.git
cd relayer

# Install dependencies
go mod download

# Build the binary
go build -o bin/relayer ./cmd/relayer

# Or build with version info
go build -ldflags "-X main.version=1.0.0" -o bin/relayer ./cmd/relayer
```

### Docker

```bash
# Build Docker image
docker build -t kelo/relayer:latest .

# Run with Docker
docker run -p 8081:8081 \
  -e DATABASE_URL=postgresql://... \
  -e RELAYER_PRIVATE_KEY=... \
  kelo/relayer:latest
```

## Usage

### Running the Service

```bash
# Run with default configuration
./bin/relayer

# Run with custom config file
./bin/relayer -config /path/to/config.yaml

# Show version
./bin/relayer -version
```

### Environment Variables

The service can be configured entirely through environment variables. Create a `.env` file:

```bash
# .env
PORT=8081
ENVIRONMENT=production
LOG_LEVEL=info
DATABASE_URL=postgresql://user:password@localhost:5432/kelo_db
JWT_SECRET=your_jwt_secret_here
RELAYER_PRIVATE_KEY=your_private_key_here
HEDERA_NETWORK=testnet
HEDERA_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
LAYERZERO_ENDPOINT=https://api.layerzero.network
LAYERZERO_API_KEY=your_layerzero_api_key
ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_LIQUIDITY_POOL=0x0987654321098765432109876543210987654321
BASE_RPC=https://mainnet.base.org
BASE_LIQUIDITY_POOL=0xabcdefabcdefabcdefabcdefabcdefabcd
SOLANA_RPC=https://api.mainnet-beta.solana.com
APTOS_RPC=https://fullnode.mainnet.aptoslabs.com
MPESA_API_KEY=your_mpesa_api_key
MPESA_SECRET=your_mpesa_secret
MAX_RETRIES=3
```

## API Endpoints

The service provides HTTP endpoints for monitoring and management:

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": "1h30m",
  "components": {
    "hedera": "healthy",
    "ethereum": "healthy",
    "base": "healthy",
    "layerzero": "healthy"
  }
}
```

### Metrics

```bash
GET /metrics
```

Returns Prometheus metrics in the standard format.

### Service Status

```bash
GET /status
```

Response:
```json
{
  "status": "running",
  "metrics": {
    "messages_processed": 1234,
    "messages_sent": 1200,
    "messages_confirmed": 1180,
    "messages_failed": 20,
    "average_latency": "1.5s",
    "last_processed_time": "2024-01-01T00:00:00Z"
  },
  "pending_transactions": 5,
  "recent_events": [...]
}
```

## Monitoring

### Prometheus Metrics

The service exposes the following Prometheus metrics:

- `relayer_messages_processed_total`: Total messages processed by chain and type
- `relayer_messages_sent_total`: Total messages sent by chain and type
- `relayer_messages_failed_total`: Total messages failed by chain and error type
- `relayer_transaction_latency_seconds`: Transaction latency histogram
- `relayer_errors_total`: Total errors by operation and type
- `relayer_health_status`: Health status of components

### Health Checks

Built-in health checks monitor:

- **Hedera Connection**: Connectivity to Hedera network
- **Chain Connections**: Connectivity to all configured chains
- **LayerZero API**: LayerZero endpoint availability
- **Database**: Database connectivity
- **Memory Usage**: System memory usage
- **Disk Usage**: Disk space availability

### Logging

The service uses structured logging with zerolog. Log levels:

- `debug`: Detailed debugging information
- `info`: General information about service operation
- `warn`: Warning conditions that might need attention
- `error`: Error conditions that should be investigated
- `fatal`: Fatal errors that cause service termination

Example log entry:
```json
{
  "level": "info",
  "component": "relayer",
  "message_type": "LOAN_APPROVAL",
  "chain_id": "ethereum",
  "message_id": "abc123",
  "status": "SENT",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Security

### Private Key Management

- Private keys are loaded from environment variables
- Keys are never logged or exposed in logs
- All transactions are signed using secure cryptographic operations

### Network Security

- All external connections use TLS
- API endpoints support rate limiting
- JWT authentication for protected endpoints

### Transaction Security

- Proper nonce management prevents replay attacks
- Gas price limits prevent gas price manipulation
- Transaction monitoring detects and handles failures

## Testing

### Unit Tests

```bash
# Run unit tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests with race detection
go test -race ./...
```

### Integration Tests

```bash
# Run integration tests
go test -tags=integration ./...

# Run tests against testnet
go test -tags=testnet ./...
```

### Benchmark Tests

```bash
# Run benchmark tests
go test -bench=. ./...

# Run benchmarks with memory profiling
go test -bench=. -memprofile=mem.out ./...
```

## Deployment

### System Requirements

- **CPU**: 2+ cores
- **Memory**: 4GB+ RAM
- **Storage**: 20GB+ SSD
- **Network**: Stable internet connection

### Production Deployment

1. **Environment Setup**
   ```bash
   # Create service user
   sudo useradd -r -s /bin/false relayer
   
   # Create directories
   sudo mkdir -p /opt/relayer /var/log/relayer /etc/relayer
   sudo chown -R relayer:relayer /opt/relayer /var/log/relayer
   ```

2. **Install Service**
   ```bash
   # Copy binary
   sudo cp bin/relayer /opt/relayer/
   sudo chown relayer:relayer /opt/relayer/relayer
   
   # Copy config
   sudo cp .env /etc/relayer/
   sudo chown relayer:relayer /etc/relayer/.env
   sudo chmod 600 /etc/relayer/.env
   ```

3. **Create Systemd Service**
   ```ini
   # /etc/systemd/system/relayer.service
   [Unit]
   Description=Kelo Trusted Relayer Service
   After=network.target
   
   [Service]
   Type=simple
   User=relayer
   Group=relayer
   WorkingDirectory=/opt/relayer
   ExecStart=/opt/relayer/relayer
   Restart=always
   RestartSec=10
   EnvironmentFile=/etc/relayer/.env
   
   [Install]
   WantedBy=multi-user.target
   ```

4. **Start Service**
   ```bash
   # Reload systemd
   sudo systemctl daemon-reload
   
   # Enable service
   sudo systemctl enable relayer
   
   # Start service
   sudo systemctl start relayer
   
   # Check status
   sudo systemctl status relayer
   ```

### Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kelo-relayer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kelo-relayer
  template:
    metadata:
      labels:
        app: kelo-relayer
    spec:
      containers:
      - name: relayer
        image: kelo/relayer:latest
        ports:
        - containerPort: 8081
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: kelo-secrets
              key: database-url
        - name: RELAYER_PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: kelo-secrets
              key: relayer-private-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   ```bash
   # Check logs
   sudo journalctl -u relayer -f
   
   # Check network connectivity
   telnet <hedera-node> 50211
   telnet <ethereum-rpc> 443
   ```

2. **Transaction Failures**
   ```bash
   # Check gas prices
   curl -s https://api.etherscan.io/api?module=gastracker&action=gasoracle
   
   # Check nonce
   curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["<address>", "latest"],"id":1}' <ethereum-rpc>
   ```

3. **Memory Issues**
   ```bash
   # Check memory usage
   sudo systemctl status relayer
   
   # Monitor memory
   top -p $(pgrep relayer)
   ```

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug ./bin/relayer
```

### Performance Tuning

1. **Message Queue Size**
   ```bash
   MESSAGE_QUEUE_SIZE=2000 ./bin/relayer
   ```

2. **Concurrent Processing**
   ```bash
   MAX_CONCURRENT_PROCESSES=10 ./bin/relayer
   ```

3. **Event Polling Interval**
   ```bash
   EVENT_POLL_INTERVAL=2s ./bin/relayer
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Join our Discord community
- Email: support@kelo.finance

## Changelog

### v1.0.0
- Initial release
- Support for Hedera, Ethereum, Base, Solana, and Aptos
- LayerZero integration
- Comprehensive monitoring and logging
- Error handling and retry mechanisms
- Health checks and metrics