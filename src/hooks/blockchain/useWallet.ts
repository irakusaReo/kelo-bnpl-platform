'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { WalletConnection, WalletTransaction, WalletProvider, NetworkType } from '@/types/blockchain/wallet'
import { NETWORKS, WALLET_EVENTS } from '@/utils/constants/blockchain'

interface WalletState {
  connection: WalletConnection | null
  transactions: WalletTransaction[]
  isLoading: boolean
  error: string | null
  currentProvider: WalletProvider | null
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connection: null,
    transactions: [],
    isLoading: false,
    error: null,
    currentProvider: null,
  })
  
  const { toast } = useToast()

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = useCallback(async () => {
    try {
      // Check MetaMask connection
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          await connectWallet('metamask')
        }
      }

      // Check HashPack connection
      if (window.hashpack) {
        const pairingData = await window.hashpack.getPairingData()
        if (pairingData.accountIds.length > 0) {
          await connectWallet('hashpack')
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }, [])

  const connectWallet = useCallback(async (provider: WalletProvider) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      let connection: WalletConnection | null = null

      switch (provider) {
        case 'metamask':
          connection = await connectMetaMask()
          break
        case 'hashpack':
          connection = await connectHashPack()
          break
        case 'walletconnect':
          connection = await connectWalletConnect()
          break
        case 'coinbase':
          connection = await connectCoinbase()
          break
        default:
          throw new Error('Unsupported wallet provider')
      }

      if (connection) {
        setState(prev => ({
          ...prev,
          connection,
          currentProvider: provider,
          isLoading: false,
          error: null,
        }))

        toast({
          title: 'Wallet Connected',
          description: `Successfully connected to ${provider}`,
        })

        // Setup event listeners
        setupEventListeners(provider)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [toast])

  const connectMetaMask = useCallback(async (): Promise<WalletConnection> => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    })

    const network = Object.values(NETWORKS).find(n => n.chainId === parseInt(chainId, 16))

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      network: network?.name || 'Unknown',
      balance: balance,
      isConnected: true,
      provider: 'metamask',
    }
  }, [])

  const connectHashPack = useCallback(async (): Promise<WalletConnection> => {
    if (!window.hashpack) {
      throw new Error('HashPack is not installed')
    }

    const pairingData = await window.hashpack.connect()
    const accountInfo = await window.hashpack.getAccountInfo()
    
    return {
      address: accountInfo.accountIds[0],
      chainId: 295, // Hedera mainnet
      network: 'Hedera Mainnet',
      balance: accountInfo.balance?.tinybars || '0',
      isConnected: true,
      provider: 'hashpack',
    }
  }, [])

  const connectWalletConnect = useCallback(async (): Promise<WalletConnection> => {
    // WalletConnect implementation would go here
    throw new Error('WalletConnect not implemented yet')
  }, [])

  const connectCoinbase = useCallback(async (): Promise<WalletConnection> => {
    // Coinbase Wallet implementation would go here
    throw new Error('Coinbase Wallet not implemented yet')
  }, [])

  const disconnectWallet = useCallback(async () => {
    try {
      if (state.currentProvider === 'hashpack' && window.hashpack) {
        await window.hashpack.disconnect()
      }

      setState(prev => ({
        ...prev,
        connection: null,
        currentProvider: null,
        transactions: [],
      }))

      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      })
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }, [state.currentProvider, toast])

  const switchNetwork = useCallback(async (networkType: NetworkType) => {
    if (!state.connection || !state.currentProvider) {
      throw new Error('No wallet connected')
    }

    try {
      const network = NETWORKS[networkType]
      
      if (state.currentProvider === 'metamask') {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        })
      } else if (state.currentProvider === 'hashpack') {
        // HashPack network switching would go here
        throw new Error('Network switching not implemented for HashPack yet')
      }

      // Update connection state
      setState(prev => ({
        ...prev,
        connection: prev.connection ? {
          ...prev.connection,
          chainId: network.chainId,
          network: network.name,
        } : null,
      }))

      toast({
        title: 'Network Switched',
        description: `Switched to ${network.name}`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch network'
      toast({
        title: 'Network Switch Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }, [state.connection, state.currentProvider, toast])

  const sendTransaction = useCallback(async (to: string, amount: string) => {
    if (!state.connection || !state.currentProvider) {
      throw new Error('No wallet connected')
    }

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      let txHash: string

      if (state.currentProvider === 'metamask') {
        const transaction = {
          to,
          value: amount,
          from: state.connection.address,
        }

        txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [transaction],
        })
      } else {
        throw new Error('Transaction not implemented for this wallet type')
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        transactions: [
          ...prev.transactions,
          {
            hash: txHash,
            from: state.connection!.address,
            to,
            value: amount,
            gasUsed: '0',
            status: 'pending',
            timestamp: Date.now(),
          },
        ],
      }))

      toast({
        title: 'Transaction Sent',
        description: `Transaction hash: ${txHash}`,
      })

      return txHash
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send transaction'
      setState(prev => ({ ...prev, isLoading: false }))
      
      toast({
        title: 'Transaction Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [state.connection, state.currentProvider, toast])

  const setupEventListeners = useCallback((provider: WalletProvider) => {
    if (provider === 'metamask' && window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setState(prev => ({
            ...prev,
            connection: prev.connection ? {
              ...prev.connection,
              address: accounts[0],
            } : null,
          }))
        }
      })

      window.ethereum.on('chainChanged', (chainId: string) => {
        const network = Object.values(NETWORKS).find(n => n.chainId === parseInt(chainId, 16))
        setState(prev => ({
          ...prev,
          connection: prev.connection ? {
            ...prev.connection,
            chainId: parseInt(chainId, 16),
            network: network?.name || 'Unknown',
          } : null,
        }))
      })

      window.ethereum.on('disconnect', () => {
        disconnectWallet()
      })
    }
  }, [disconnectWallet])

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    checkConnection,
  }
}