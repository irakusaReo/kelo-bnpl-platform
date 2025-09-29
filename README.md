# 🚀 Kelo BNPL Platform

A modern, blockchain-powered Buy Now Pay Later (BNPL) platform designed for the Kenyan market, integrating multi-chain blockchain technology with traditional financial services.

## 🌟 Project Overview

Kelo is a comprehensive BNPL platform that enables users to:
- **Access instant loans** with flexible repayment terms
- **Stake cryptocurrency** as collateral for better loan terms
- **Make purchases** at partner merchants using BNPL
- **Manage finances** through a unified dashboard
- **Leverage blockchain** for transparent, secure transactions

The platform integrates multiple blockchain networks (Ethereum, Hedera, Solana, Aptos) through LayerZero cross-chain technology, providing users with unparalleled flexibility and security.

## 🛠️ Technology Stack

### Frontend Technologies
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe JavaScript development
- **🎨 Tailwind CSS 4** - Utility-first CSS framework
- **🧩 shadcn/ui** - High-quality, accessible UI components
- **🎯 Lucide React** - Beautiful icon library
- **🔄 TanStack Query** - Powerful data synchronization
- **🐻 Zustand** - Lightweight state management
- **🔐 NextAuth.js** - Authentication solution
- **📊 Recharts** - Data visualization library
- **🌐 Socket.IO** - Real-time communication

### Backend Technologies
- **🐹 Go 1.21** - High-performance backend language
- **🌐 Gin Framework** - HTTP web framework
- **🗄️ PostgreSQL** - Primary database
- **🔴 Redis** - Caching and session management
- **🔍 Prisma ORM** - Database toolkit
- **🔐 JWT Authentication** - Secure token-based auth
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
- **🐘 PostgreSQL** - Production database
- **🔴 Redis** - In-memory data store
- **📋 Fluentd** - Log aggregation
- **🛡️ Nginx** - Reverse proxy and load balancer

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git for version control
- Node.js 18+ (for local development without Docker)

### Development Setup with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/kelo-bnpl-platform.git
   cd kelo-bnpl-platform
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development environment**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Or start with build
   docker-compose up -d --build
   ```

4. **Verify services are running**
   ```bash
   # Check container status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   ```

5. **Access the applications**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8080
   - **API Documentation**: http://localhost:8080/swagger/index.html
   - **Prisma Studio**: http://localhost:5555
   - **Redis Commander**: http://localhost:8082
   - **Mailhog**: http://localhost:8025

### Service Descriptions

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js application |
| Backend API | 8080 | Go REST API |
| Credit Scoring API | 8081 | AI-powered credit scoring |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache and session store |
| Prisma Studio | 5555 | Database management UI |
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

# Database operations
docker-compose exec postgres psql -U kelo_user -d kelo_db
docker-compose exec redis redis-cli

# Clean up (remove containers, networks, volumes)
docker-compose down -v
```

### Local Development (Without Docker)

1. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   go mod download
   cd ..
   ```

2. **Set up database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Run migrations (if any)
   npx prisma migrate dev
   ```

3. **Start services**
   ```bash
   # Start backend (in separate terminal)
   cd backend
   go run ./cmd/api/main.go
   
   # Start frontend (in another terminal)
   npm run dev
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
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── blockchain/           # Blockchain components
│   │   ├── charts/               # Data visualization
│   │   ├── forms/                # Form components
│   │   ├── layout/               # Layout components
│   │   ├── merchant/             # Merchant components
│   │   └── tables/               # Data tables
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility libraries
│   ├── services/                 # API services
│   ├── store/                    # State management
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Utility functions
├── backend/                      # Go backend source
│   ├── cmd/                      # Command-line applications
│   │   ├── api/                  # Main API server
│   │   └── relayer/              # Cross-chain relayer
│   ├── pkg/                      # Go packages
│   │   ├── blockchain/           # Blockchain clients
│   │   ├── config/               # Configuration management
│   │   ├── creditscore/          # Credit scoring engine
│   │   ├── logger/               # Logging utilities
│   │   ├── models/               # Data models
│   │   └── relayer/              # Cross-chain relayer
│   ├── api/                      # API documentation
│   ├── database/                 # Database schemas
│   └── go.mod                    # Go module definition
├── contracts/                    # Smart contracts
│   ├── evm/                      # Ethereum contracts
│   ├── hedera/                   # Hedera contracts
│   ├── solana/                   # Solana programs
│   ├── aptos/                    # Aptos modules
│   └── layerzero/                # LayerZero adapters
├── prisma/                       # Database toolkit
│   └── schema.prisma             # Database schema
├── .github/                      # GitHub configuration
│   └── workflows/                # CI/CD workflows
├── docker-compose.yml            # Development environment
├── docker-compose.prod.yml      # Production environment
├── Dockerfile.backend            # Backend container
├── Dockerfile.frontend           # Frontend container
└── README.md                     # This file
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```bash
# Database
DATABASE_URL=postgresql://kelo_user:kelo_password@postgres:5432/kelo_db

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000

# Blockchain
BLOCKCHAIN_NETWORK=ethereum
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR-INFURA-PROJECT-ID
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.12345
HEDERA_PRIVATE_KEY=your-hedera-private-key

# APIs
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
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
   - Set up PostgreSQL and Redis
   - Configure load balancer
   - Set up monitoring and logging
   - Configure SSL certificates

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: User, merchant, and admin roles
- **Blockchain Security**: Smart contract audits and secure key management
- **Data Encryption**: Encryption at rest and in transit
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting and DDoS protection
- **Secure Headers**: Security headers and CSP policies
- **Audit Logging**: Comprehensive audit trails

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

Built with ❤️ for the Kenyan fintech ecosystem. Powered by blockchain technology.