'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/hooks/blockchain/useWallet'
import { SUPPORTED_WALLETS } from '@/utils/constants/blockchain'
import { WalletProvider } from '@/types/blockchain/wallet'
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'

interface WalletSelectorProps {
  trigger?: React.ReactNode
  className?: string
}

export default function WalletSelector({ trigger, className }: WalletSelectorProps) {
  const { connectWallet, disconnectWallet, connection, isLoading } = useWallet()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleWalletSelect = async (provider: WalletProvider) => {
    try {
      await connectWallet(provider)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = async () => {
    await disconnectWallet()
    setIsDialogOpen(false)
  }

  const getWalletIcon = (providerId: string) => {
    switch (providerId) {
      case 'metamask':
        return '🦊'
      case 'hashpack':
        return '🔷'
      case 'walletconnect':
        return '🔗'
      case 'coinbase':
        return '📱'
      default:
        return '👛'
    }
  }

  const getWalletStatus = () => {
    if (!connection) return 'disconnected'
    return connection.isConnected ? 'connected' : 'connecting'
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string) => {
    // Convert from wei to ether for EVM chains
    const balanceInEther = parseInt(balance) / Math.pow(10, 18)
    return balanceInEther.toFixed(4)
  }

  if (connection) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
          <span className="text-lg">{getWalletIcon(connection.provider)}</span>
          <div className="text-sm">
            <div className="font-medium">{formatAddress(connection.address)}</div>
            <div className="text-muted-foreground">
              {formatBalance(connection.balance)} {connection.network.split(' ')[0]}
            </div>
          </div>
          <Badge variant={getWalletStatus() === 'connected' ? 'default' : 'secondary'}>
            {getWalletStatus() === 'connected' ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <AlertCircle className="w-3 h-3 mr-1" />
            )}
            {getWalletStatus()}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet provider to connect to the Kelo platform
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {SUPPORTED_WALLETS.map((wallet) => (
            <Card 
              key={wallet.id}
              className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
              onClick={() => handleWalletSelect(wallet.id as WalletProvider)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getWalletIcon(wallet.id)}</span>
                  <div>
                    <h3 className="font-semibold">{wallet.name}</h3>
                    <p className="text-sm text-muted-foreground">{wallet.description}</p>
                    <div className="flex gap-1 mt-1">
                      {wallet.networks.map((network) => (
                        <Badge key={network} variant="outline" className="text-xs">
                          {network}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Don't have a wallet? Install one of the supported wallets:
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Install MetaMask
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://www.hashpack.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Install HashPack
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}