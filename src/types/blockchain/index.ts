// Blockchain-related types

export interface BlockchainNetwork {
  id: string;
  name: string;
  chainId: number;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
  gasPrice?: number;
  confirmationsRequired: number;
}

export interface Wallet {
  id: string;
  userId: string;
  networkId: string;
  address: string;
  publicKey?: string;
  encryptedPrivateKey?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface Transaction {
  id: string;
  hash: string;
  networkId: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  currency: string;
  gasPrice?: number;
  gasUsed?: number;
  status: TransactionStatus;
  blockNumber?: number;
  timestamp: string;
  confirmations: number;
  type: TransactionType;
  metadata?: Record<string, any>;
}

export type TransactionStatus = "pending" | "confirmed" | "failed" | "reverted";
export type TransactionType = "loan_disbursement" | "loan_repayment" | "transfer" | "fee" | "other";

export interface Token {
  id: string;
  networkId: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: number;
  isActive: boolean;
  isNative: boolean;
  price?: number;
  lastUpdated?: string;
}

export interface LiquidityPool {
  id: string;
  networkId: string;
  tokenAddress: string;
  totalLiquidity: number;
  yourLiquidity: number;
  sharePercentage: number;
  apr: number;
  isActive: boolean;
  createdAt: string;
}

export interface CrossChainMessage {
  id: string;
  sourceChainId: string;
  destinationChainId: string;
  messageType: MessageType;
  payload: string;
  status: MessageStatus;
  sourceTxHash?: string;
  destinationTxHash?: string;
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export type MessageType = "loan_approval" | "loan_disbursement" | "loan_repayment" | "credit_score_update" | "liquidity_transfer";
export type MessageStatus = "pending" | "sent" | "confirmed" | "failed";

export interface SmartContract {
  id: string;
  networkId: string;
  name: string;
  address: string;
  abi: any[];
  version: string;
  isActive: boolean;
  deployedAt: string;
  lastUpdated: string;
}

export interface ContractEvent {
  id: string;
  contractId: string;
  eventName: string;
  parameters: Record<string, any>;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  processed: boolean;
}

export interface GasEstimate {
  networkId: string;
  gasLimit: number;
  gasPrice: number;
  totalCost: number;
  currency: string;
  estimatedTime: number;
}

export interface BlockchainConfig {
  networks: BlockchainNetwork[];
  defaultNetwork: string;
  gasPriceOracle: string;
  blockConfirmations: Record<string, number>;
  contractAddresses: Record<string, Record<string, string>>;
}

export interface Web3Provider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  sendTransaction(transaction: any): Promise<string>;
  getBalance(address: string): Promise<number>;
  getNetwork(): Promise<BlockchainNetwork>;
  getAccounts(): Promise<string[]>;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image?: string;
  attributes?: NFTAttribute[];
  external_url?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface LoanNFT {
  id: string;
  tokenId: string;
  networkId: string;
  contractAddress: string;
  owner: string;
  metadata: NFTMetadata;
  loanId: string;
  status: NFTStatus;
  createdAt: string;
  transferredAt?: string;
}

export type NFTStatus = "active" | "transferred" | "burned";

export interface DeFiPosition {
  id: string;
  userId: string;
  protocol: string;
  networkId: string;
  type: DeFiPositionType;
  tokens: string[];
  amount: number;
  value: number;
  apy: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DeFiPositionType = "lending" | "borrowing" | "liquidity_pool" | "staking" | "yield_farming";

export interface BlockchainAnalytics {
  totalTransactions: number;
  totalVolume: number;
  activeUsers: number;
  averageGasPrice: number;
  networkUtilization: number;
  topTokens: Token[];
  recentTransactions: Transaction[];
}