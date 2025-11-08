'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useUser } from '@/contexts/UserContext'
import { WalletConnection, WalletTransaction, WalletProvider, NetworkType } from '@/types/blockchain/wallet'
import { NETWORKS, WALLET_EVENTS } from '@/utils/constants/blockchain'
import { ethers } from 'ethers'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import CoinbaseWalletSDK from '@coinbase/wallet-sdk'

interface WalletState {
  connection: WalletConnection | null
  transactions: WalletTransaction[]
  isLoading: boolean
  error: string | null
  currentProvider: WalletProvider | null
  providerInstance: any | null
}

declare global {
  interface Window {
    hashpack?: any;
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connection: null,
    transactions: [],
    isLoading: false,
    error: null,
    currentProvider: null,
    providerInstance: null,
  })
  
  const { toast } = useToast()
  const { supabase, user } = useUser()

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
      let providerInstance: any | null = null

      switch (provider) {
        case 'metamask':
          ({ connection, providerInstance } = await connectMetaMask())
          break
        case 'hashpack':
          ({ connection, providerInstance } = await connectHashPack())
          break
        case 'walletconnect':
          ({ connection, providerInstance } = await connectWalletConnect())
          break
        case 'coinbase':
          ({ connection, providerInstance } = await connectCoinbase())
          break
        default:
          throw new Error('Unsupported wallet provider')
      }

      if (connection) {
        // Update the user's profile with the wallet address
        if (supabase && user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ wallet_address: connection.address })
            .eq('id', user.id)

          if (updateError) {
            toast({
              title: 'Profile Update Failed',
              description: 'Could not save wallet address to your profile.',
              variant: 'destructive',
            })
            console.error("Error updating profile with wallet address:", updateError)
          } else {
            toast({
              title: 'Profile Updated',
              description: 'Your wallet address has been saved.',
            })
          }
        }

        setState(prev => ({
          ...prev,
          connection,
          providerInstance,
          currentProvider: provider,
          isLoading: false,
          error: null,
        }))

        toast({
          title: 'Wallet Connected',
          description: `Successfully connected to ${provider}`,
        })

        // Setup event listeners
        setupEventListeners(provider, providerInstance)
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
  }, [toast, supabase, user])

  const connectMetaMask = useCallback(async (): Promise<{ connection: WalletConnection, providerInstance: any }> => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    const provider = window.ethereum
    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    const chainId = await provider.request({ method: 'eth_chainId' })
    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    })

    const network = Object.values(NETWORKS).find(n => n.chainId === parseInt(chainId, 16))

    const connection: WalletConnection = {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      network: network?.name || 'Unknown',
      balance: balance,
      isConnected: true,
      provider: 'metamask',
    }

    return { connection, providerInstance: provider }
  }, [])

  const connectHashPack = useCallback(async (): Promise<{ connection: WalletConnection, providerInstance: any }> => {
    if (!window.hashpack) {
      throw new Error('HashPack is not installed')
    }

    const hashpack = window.hashpack
    const pairingData = await hashpack.connect()
    const accountInfo = await hashpack.getAccountInfo()
    
    const connection: WalletConnection = {
      address: accountInfo.accountIds[0],
      chainId: 295, // Hedera mainnet
      network: 'Hedera Mainnet',
      balance: accountInfo.balance?.tinybars || '0',
      isConnected: true,
      provider: 'hashpack',
    }

    return { connection, providerInstance: hashpack }
  }, [])

  const connectWalletConnect = useCallback(async (): Promise<{ connection: WalletConnection, providerInstance: any }> => {
    const mainChainId = 1; // Ethereum Mainnet as the default required chain
    const optionalChainIds = Object.values(NETWORKS)
      .map(n => n.chainId)
      .filter(id => id !== mainChainId && ![295, 296, 297].includes(id));

    const provider = await EthereumProvider.init({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      chains: [mainChainId],
      optionalChains: optionalChainIds,
      showQrModal: true,
    })

    await provider.enable()
    const web3Provider = new ethers.BrowserProvider(provider)
    const signer = await web3Provider.getSigner()
    const address = await signer.getAddress()
    const chainId = (await web3Provider.getNetwork()).chainId
    const balance = await web3Provider.getBalance(address)

    const network = Object.values(NETWORKS).find(n => n.chainId === Number(chainId))

    const connection: WalletConnection = {
      address,
      chainId: Number(chainId),
      network: network?.name || 'Unknown',
      balance: balance.toString(),
      isConnected: true,
      provider: 'walletconnect',
    }

    return { connection, providerInstance: provider }
  }, [])

  const connectCoinbase = useCallback(async (): Promise<{ connection: WalletConnection, providerInstance: any }> => {
    const sdk = new CoinbaseWalletSDK({
      appName: 'Kelo BNPL',
      appLogoUrl: `${window.location.origin}/logo.png`,
    })
    const provider = sdk.makeWeb3Provider(NETWORKS.ethereum.rpcUrl, NETWORKS.ethereum.chainId)

    const accounts = await provider.request({ method: 'eth_requestAccounts' })
    const web3Provider = new ethers.BrowserProvider(provider)
    const signer = await web3Provider.getSigner()
    const address = await signer.getAddress()
    const chainId = (await web3Provider.getNetwork()).chainId
    const balance = await web3Provider.getBalance(address)

    const network = Object.values(NETWORKS).find(n => n.chainId === Number(chainId))

    const connection: WalletConnection = {
      address,
      chainId: Number(chainId),
      network: network?.name || 'Unknown',
      balance: balance.toString(),
      isConnected: true,
      provider: 'coinbase',
    }

    return { connection, providerInstance: provider }
  }, [])

  const disconnectWallet = useCallback(async () => {
    try {
      if (state.currentProvider === 'hashpack' && window.hashpack) {
        await window.hashpack.disconnect()
      } else if (state.currentProvider === 'walletconnect' && state.providerInstance) {
        await state.providerInstance.disconnect()
      }

      setState(prev => ({
        ...prev,
        connection: null,
        currentProvider: null,
        transactions: [],
        providerInstance: null,
      }))

      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      })
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }, [state.currentProvider, state.providerInstance, toast])

  const switchNetwork = useCallback(async (networkType: NetworkType) => {
    if (!state.connection || !state.currentProvider || !state.providerInstance) {
      throw new Error('No wallet connected')
    }

    try {
      const network = NETWORKS[networkType]
      if (state.connection.chainId === network.chainId) {
        toast({ title: 'Network is already active' })
        return
      }
      
      const provider = state.providerInstance;

      if (['metamask', 'walletconnect', 'coinbase'].includes(state.currentProvider)) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }],
          })
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: `0x${network.chainId.toString(16)}`,
                    chainName: network.name,
                    rpcUrls: [network.rpcUrl],
                    nativeCurrency: {
                      name: network.currency,
                      symbol: network.currency,
                      decimals: 18,
                    },
                    blockExplorerUrls: [network.blockExplorer],
                  },
                ],
              })
            } catch (addError) {
              throw new Error("Failed to add new network.")
            }
          } else {
            throw switchError
          }
        }
      } else if (state.currentProvider === 'hashpack') {
        // HashPack network switching would go here
        throw new Error('Network switching not implemented for HashPack yet')
      }

      // Update connection state
      const newConnection = {
        ...state.connection,
        chainId: network.chainId,
        network: network.name,
      }
      setState(prev => ({...prev, connection: newConnection }))

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
  }, [state.connection, state.currentProvider, state.providerInstance, toast])

  const sendTransaction = useCallback(async (to: string, amount: string) => {
    if (!state.connection || !state.currentProvider || !state.providerInstance) {
      throw new Error('No wallet connected')
    }

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      let txHash: string

      if (['metamask', 'walletconnect', 'coinbase'].includes(state.currentProvider)) {
        const web3Provider = new ethers.BrowserProvider(state.providerInstance)
        const signer = await web3Provider.getSigner()

        const transaction = {
          to,
          value: ethers.parseEther(amount),
        }

        const txResponse = await signer.sendTransaction(transaction)
        txHash = txResponse.hash
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
  }, [state.connection, state.currentProvider, state.providerInstance, toast])

  const setupEventListeners = useCallback((provider: WalletProvider, providerInstance: any) => {
    const handleAccountsChanged = (accounts: string[]) => {
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
    }

    const handleChainChanged = (chainId: string) => {
      const network = Object.values(NETWORKS).find(n => n.chainId === parseInt(chainId, 16))
      setState(prev => ({
        ...prev,
        connection: prev.connection ? {
          ...prev.connection,
          chainId: parseInt(chainId, 16),
          network: network?.name || 'Unknown',
        } : null,
      }))
    }

    if (providerInstance?.on) {
      providerInstance.on('accountsChanged', handleAccountsChanged)
      providerInstance.on('chainChanged', handleChainChanged)
      providerInstance.on('disconnect', disconnectWallet)
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
