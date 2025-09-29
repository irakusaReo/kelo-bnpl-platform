export interface WalletConnection {
  address: string
  chainId: number
  network: string
  balance: string
  isConnected: boolean
  provider: 'metamask' | 'hashpack' | 'walletconnect' | 'coinbase'
}

export interface WalletTransaction {
  hash: string
  from: string
  to: string
  value: string
  gasUsed: string
  status: 'pending' | 'success' | 'failed'
  timestamp: number
  blockNumber?: number
}

export interface HederaAccount {
  accountId: string
  publicKey: string
  balance: number
  network: 'mainnet' | 'testnet' | 'previewnet'
}

export interface DIDDocument {
  id: string
  controller: string
  verificationMethod: Array<{
    id: string
    type: string
    controller: string
    publicKeyHex: string
  }>
  authentication: string[]
  assertionMethod: string[]
  keyAgreement: string[]
  capabilityInvocation: string[]
  capabilityDelegation: string[]
  created: string
  updated: string
}

export interface DIDCredential {
  id: string
  type: string[]
  issuer: string
  issuanceDate: string
  expirationDate: string
  credentialSubject: Record<string, any>
  proof: {
    type: string
    created: string
    proofPurpose: string
    verificationMethod: string
    signature: string
  }
}

export type WalletProvider = 'metamask' | 'hashpack' | 'walletconnect' | 'coinbase'

export type NetworkType = 'ethereum' | 'base' | 'arbitrum' | 'avalanche' | 'celo' | 'polygon' | 'kava' | 'hedera-mainnet' | 'hedera-testnet' | 'hedera-previewnet'

export interface NetworkConfig {
  name: string
  chainId: number
  rpcUrl: string
  currency: string
  blockExplorer: string
  isTestnet?: boolean
}