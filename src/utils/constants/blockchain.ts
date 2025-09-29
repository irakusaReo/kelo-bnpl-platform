import { NetworkConfig, NetworkType } from '@/types/blockchain/wallet'

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    currency: 'ETH',
    blockExplorer: 'https://etherscan.io',
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    currency: 'ETH',
    blockExplorer: 'https://basescan.org',
  },
  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    currency: 'ETH',
    blockExplorer: 'https://arbiscan.io',
  },
  avalanche: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    currency: 'AVAX',
    blockExplorer: 'https://snowtrace.io',
  },
  celo: {
    name: 'Celo Mainnet',
    chainId: 42220,
    rpcUrl: 'https://forno.celo.org',
    currency: 'CELO',
    blockExplorer: 'https://celoscan.io',
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    currency: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
  },
  kava: {
    name: 'Kava EVM',
    chainId: 2222,
    rpcUrl: 'https://evm.kava.io',
    currency: 'KAVA',
    blockExplorer: 'https://kavascan.com',
  },
  'hedera-mainnet': {
    name: 'Hedera Mainnet',
    chainId: 295,
    rpcUrl: 'https://mainnet.hashio.io/api',
    currency: 'HBAR',
    blockExplorer: 'https://hashscan.io',
  },
  'hedera-testnet': {
    name: 'Hedera Testnet',
    chainId: 296,
    rpcUrl: 'https://testnet.hashio.io/api',
    currency: 'HBAR',
    blockExplorer: 'https://hashscan.io/testnet',
    isTestnet: true,
  },
  'hedera-previewnet': {
    name: 'Hedera Previewnet',
    chainId: 297,
    rpcUrl: 'https://previewnet.hashio.io/api',
    currency: 'HBAR',
    blockExplorer: 'https://hashscan.io/previewnet',
    isTestnet: true,
  },
}

export const SUPPORTED_WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Connect to your MetaMask wallet',
    icon: '/icons/metamask.svg',
    networks: ['ethereum', 'base', 'arbitrum', 'avalanche', 'celo', 'polygon', 'kava'],
  },
  {
    id: 'hashpack',
    name: 'HashPack',
    description: 'Connect to your HashPack wallet',
    icon: '/icons/hashpack.svg',
    networks: ['hedera-mainnet', 'hedera-testnet', 'hedera-previewnet'],
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Connect using WalletConnect',
    icon: '/icons/walletconnect.svg',
    networks: ['ethereum', 'base', 'arbitrum', 'avalanche', 'celo', 'polygon', 'kava'],
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Connect to your Coinbase wallet',
    icon: '/icons/coinbase.svg',
    networks: ['ethereum', 'base', 'arbitrum', 'avalanche', 'celo', 'polygon', 'kava'],
  },
] as const

export const WALLET_EVENTS = {
  ACCOUNT_CHANGED: 'accountChanged',
  CHAIN_CHANGED: 'chainChanged',
  DISCONNECT: 'disconnect',
  CONNECT: 'connect',
} as const

export const DID_METHODS = {
  HEDERA: 'did:hedera:',
  ETHEREUM: 'did:ethr:',
  KEY: 'did:key:',
} as const

export const CREDENTIAL_TYPES = {
  VERIFIABLE_CREDENTIAL: 'VerifiableCredential',
  KYC_VERIFICATION: 'KYCVerification',
  CREDIT_SCORE: 'CreditScore',
  IDENTITY_VERIFICATION: 'IdentityVerification',
} as const