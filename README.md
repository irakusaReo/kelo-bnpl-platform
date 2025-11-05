# 🚀 Kelo BNPL Platform

A modern, blockchain-powered Buy Now Pay Later (BNPL) platform designed for the Kenyan market, integrating multi-chain blockchain technology with the powerful, open-source Supabase backend.

Link to pitch deck: https://docs.google.com/presentation/d/1P6xggEAc8RXulhUR38Z6Un5pv1q_RvhMwRBn3lJUyNI/edit?usp=sharing

## 🌟 Project Overview

Kelo is a comprehensive BNPL platform that enables users to:
- **Access instant loans** with flexible repayment terms
- **Stake cryptocurrency** as collateral for better loan terms
- **Merchants can also participate** in liquidity pools to earn returns.
- **Make purchases** at partner merchants using BNPL
- **Manage finances** through a unified dashboard
- **Leverage blockchain** for transparent, secure transactions

The platform integrates multiple blockchain networks (Ethereum, Base, Arbitrum, Avalanche, Celo, Polygon, Kava, Hedera, Solana, Aptos) through LayerZero cross-chain technology, providing users with unparalleled flexibility and security.

## 🛠️ Technology Stack

### Frontend Technologies
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe JavaScript development
- **🎨 Tailwind CSS 4** - Utility-first CSS framework
- **🧩 shadcn/ui** - High-quality, accessible UI components
- **🎯 Lucide React** - Beautiful icon library
- **🔄 TanStack Query** - Powerful data synchronization
- **🐻 Zustand** - Lightweight state management
- **📊 Recharts** - Data visualization library
- **🌐 Socket.IO** - Real-time communication

### Backend Technologies
- ** supabase** - The open-source Firebase alternative. Handles Database, Authentication, and more.
- **🐹 Go 1.21** - High-performance backend language for custom business logic (e.g., credit scoring).
- **🌐 Gin Framework** - HTTP web framework for the Go services.
- **🔴 Redis** - Caching and session management
- **📊 Prometheus** - Metrics and monitoring
- **📝 ZeroLog** - Structured logging

### Blockchain Integration
- **⛓️ Ethereum** - Mainnet and testnet smart contracts and DeFi integration
- **🔵 Base** - Coinbase's L2 network for scalable transactions
- **🔶 Arbitrum** - Leading Layer 2 scaling solution for Ethereum
- **🔺 Avalanche** - High-throughput blockchain for DeFi applications
- **🌿 Celo** - Mobile-first blockchain with stablecoin focus
- **🟣 Polygon** - Leading Layer 2 scaling solution and sidechain
- **🟢 Kava** - Cross-chain DeFi platform with EVM compatibility
- **🌿 Hedera** - Enterprise-grade DLT with HCS for DID and HCS for consensus
- **🔷 Solana** - High-performance blockchain for microtransactions
- **🅰️ Aptos** - Next-gen Layer 1 blockchain for advanced DeFi
- **🌉 LayerZero** - Cross-chain messaging protocol for interoperability
- **🦊 MetaMask** - EVM wallet integration for all EVM chains
- **🎒 HashPack** - Hedera wallet integration

### DevOps & Infrastructure
- **🐳 Docker** - Containerization
- **🚀 Docker Compose** - Multi-container orchestration
- **🔧 GitHub Actions** - CI/CD pipeline
- **📈 Grafana** - Monitoring and visualization
- ** supabase** - Production database and backend services.
- **🔴 Redis** - In-memory data store
- **📋 Fluentd** - Log aggregation
- **🛡️ Nginx** - Reverse proxy and load balancer

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git for version control
- A Supabase account and a new project created.

### Development Setup with Docker

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/kelo-bnpl-platform.git
    cd kelo-bnpl-platform
    ```

2.  **Configure Environment Variables**
    -   First, get your project credentials from the Supabase dashboard under `Project Settings` > `API`.
    -   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    -   Edit the new `.env` file with your Supabase credentials.

3.  **Set up the Supabase Database**
    -   In the Supabase dashboard, navigate to the **SQL Editor**.
    -   Copy the entire contents of `db/supabase_schema.sql` and run it.
    -   Copy the entire contents of `db/migration_01_alter_profiles.sql` and run it.
    -   Copy the entire contents of `db/migration_02_create_transactions.sql` and run it.

4.  **Start the development environment**
    ```bash
    # Start all services
    docker-compose up -d

    # Or start with a fresh build
    docker-compose up -d --build
    ```

5.  **Verify services are running**
    ```bash
    # Check container status
    docker-compose ps

    # View logs
    docker-compose logs -f
    ```

6.  **Access the applications**
    -   **Frontend**: http://localhost:3000
    -   **Backend API**: http://localhost:8080
    -   **API Documentation**: http://localhost:8080/swagger/index.html
    -   **Redis Commander**: http://localhost:8082
    -   **Mailhog**: http://localhost:8025

### Service Descriptions

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js application |
| Backend API | 8080 | Go REST API |
| Credit Scoring API | 8081 | AI-powered credit scoring |
| Redis | 6379 | Cache and session store |
| Redis Commander | 8082 | Redis management UI |
| Mailhog | 8025 | Email testing interface |

### Development Commands

```bash
# Start development environment
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Access service shells
docker-compose exec backend bash
docker-compose exec frontend bash

# Access Redis
docker-compose exec redis redis-cli

# Clean up (remove containers, networks, volumes)
docker-compose down -v
```

## 🏗️ Project Structure

```
kelo-bnpl-platform/
├── src/                          # Next.js frontend source
│   ├── app/                      # App Router pages
│   │   ├── api/                  # API routes
│   │   ├── auth/                 # Authentication pages
│   │   ├── dashboard/            # User dashboard
│   │   ├── merchant/             # Merchant portal
│   │   └── admin/                # Admin panel
│   ├── components/               # React components
│   ├── contexts/                 # React Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility libraries
│   └── types/                    # TypeScript definitions
├── backend/                      # Go backend source
│   ├── cmd/                      # Command-line applications
│   ├── pkg/                      # Go packages
│   ├── api/                      # API documentation
│   └── go.mod                    # Go module definition
├── contracts/                    # Smart contracts
├── db/                           # Supabase database schemas
│   ├── supabase_schema.sql       # Main schema file
│   └── ...migrations             # Migration files
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD workflows
├── docker-compose.yml            # Development environment
├── docker-compose.prod.yml       # Production environment
├── Dockerfile.backend            # Backend container
├── Dockerfile.frontend           # Frontend container
└── README.md                     # This file
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure in your `.env` file:

```bash
# Backend API Configuration
PORT=8080
ENVIRONMENT=development
LOG_LEVEL=info

# Supabase Configuration
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Blockchain Configuration
RELAYER_PRIVATE_KEY=

# EVM Chains
ETHEREUM_RPC=
ETHEREUM_LIQUIDITY_POOL=
BASE_RPC=
BASE_LIQUIDITY_POOL=
ARBITRUM_RPC=
ARBITRUM_LIQUIDITY_POOL=
AVALANCHE_RPC=
AVALANCHE_LIQUIDITY_POOL=
CELO_RPC=
CELO_LIQUIDITY_POOL=
POLYGON_RPC=
POLYGON_LIQUIDITY_POOL=
KAVA_RPC=
KAVA_LIQUIDITY_POOL=

# Other Chains
HEDERA_NETWORK=testnet
HEDERA_CONTRACT_ADDRESS=
SOLANA_RPC=
APTOS_RPC=

# LayerZero Configuration
LAYERZERO_ENDPOINT=
LAYERZERO_API_KEY=

# Other Services
MPESA_API_KEY=
MPESA_SECRET=
REDIS_URL=redis://localhost:6379

# Other Settings
MAX_RETRIES=3

# APIs (Public for frontend)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
```

### Blockchain Configuration

The platform supports multiple blockchain networks:

- **Ethereum**: Mainnet and testnet support with full DeFi integration
- **Base**: Mainnet and testnet support for scalable L2 transactions
- **Arbitrum**: Mainnet and testnet support for Layer 2 scaling
- **Avalanche**: Mainnet and testnet support for high-throughput DeFi
- **Celo**: Mainnet and testnet support for mobile-first blockchain
- **Polygon**: Mainnet and testnet support for Layer 2 scaling
- **Kava**: Mainnet and testnet support for cross-chain DeFi
- **Hedera**: Mainnet, testnet, and previewnet with HCS integration
- **Solana**: Mainnet and devnet support for high-performance transactions
- **Aptos**: Mainnet and testnet support for next-gen DeFi

Configure the desired networks in the backend configuration file with their respective RPC endpoints and liquidity pool addresses.

## 🚀 Production Deployment

### Using Docker Compose (Production)

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale frontend=2
```

### Manual Deployment

1. **Build containers**
   ```bash
   # Build backend
   docker build -f Dockerfile.backend -t kelo-backend:latest .

   # Build frontend
   docker build -f Dockerfile.frontend -t kelo-frontend:latest .
   ```

2. **Deploy to container registry**
   ```bash
   docker tag kelo-backend:latest your-registry/kelo-backend:latest
   docker tag kelo-frontend:latest your-registry/kelo-frontend:latest

   docker push your-registry/kelo-backend:latest
   docker push your-registry/kelo-frontend:latest
   ```

3. **Configure production environment**
   - Set up Supabase for production use.
   - Configure a production-ready Redis instance.
   - Configure load balancer (Nginx is included in docker-compose.prod.yml).
   - Set up monitoring and logging.
   - Configure SSL certificates.

## 🔒 Security Features

- **Supabase Auth**: Built-in authentication with email, social logins, and JWTs.
- **Row-Level Security (RLS)**: Fine-grained access control policies at the database level.
- **Blockchain Security**: Smart contract audits and secure key management.
- **Data Encryption**: Encryption at rest and in transit.
- **Input Validation**: Comprehensive input sanitization.
- **Rate Limiting**: API rate limiting and DDoS protection.
- **Secure Headers**: Security headers and CSP policies.
- **Audit Logging**: Comprehensive audit trails via Supabase logs.

## 📊 Monitoring & Observability

- **Health Checks**: Service health monitoring
- **Metrics**: Prometheus metrics collection
- **Logging**: Structured logging with ZeroLog
- **Tracing**: Distributed tracing support
- **Alerting**: Automated alerting and notifications
- **Dashboards**: Grafana dashboards for visualization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check the `/docs` folder
- **Issues**: Create an issue on GitHub
- **Discussions**: Join our GitHub discussions
- **Email**: support@kelo.co.ke

---

Built with ❤️ for the Kenyan fintech ecosystem. Powered by Supabase and blockchain technology.
