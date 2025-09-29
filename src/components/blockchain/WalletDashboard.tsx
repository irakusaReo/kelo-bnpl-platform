'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import WalletSelector from '@/components/blockchain/WalletSelector'
import WalletBalance from '@/components/blockchain/WalletBalance'
import DIDManager from '@/components/blockchain/DIDManager'
import TransactionHistory from '@/components/blockchain/TransactionHistory'
import { useWallet } from '@/hooks/blockchain/useWallet'
import { 
  Wallet, 
  Shield, 
  FileText, 
  TrendingUp, 
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function WalletDashboard() {
  const { connection, isLoading } = useWallet()
  const [activeTab, setActiveTab] = useState('overview')

  if (!connection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Wallet & DID Management</h1>
            <p className="text-xl text-muted-foreground">
              Connect your wallet to manage your decentralized identity and blockchain assets
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Connect Your Wallet</span>
              </CardTitle>
              <CardDescription>
                Choose a wallet provider to get started with the Kelo platform
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <WalletSelector />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Wallet Dashboard</h1>
              <p className="text-xl text-muted-foreground">
                Manage your blockchain assets and decentralized identity
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <WalletSelector />
              <Badge variant={connection.isConnected ? 'default' : 'secondary'}>
                {connection.isConnected ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {connection.isConnected ? 'Connected' : 'Connecting'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="identity" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Identity</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Transactions</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WalletBalance showDetails={true} />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>
                    Common wallet and identity management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('identity')}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Manage DID
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('transactions')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Transactions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('wallet')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Wallet Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <TransactionHistory maxItems={5} />
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WalletBalance showDetails={true} />
              <Card>
                <CardHeader>
                  <CardTitle>Network Information</CardTitle>
                  <CardDescription>
                    Current network connection details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Network</div>
                      <div className="font-medium">{connection.network}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Chain ID</div>
                      <div className="font-medium">{connection.chainId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Provider</div>
                      <div className="font-medium capitalize">{connection.provider}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="font-medium">
                        {connection.isConnected ? 'Connected' : 'Disconnected'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Identity Tab */}
          <TabsContent value="identity">
            <DIDManager />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <TransactionHistory showFilters={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}