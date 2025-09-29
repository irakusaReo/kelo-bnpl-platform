'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useMerchant } from '@/hooks/use-merchant'
import { 
  QrCode, 
  Download, 
  Copy, 
  RefreshCw, 
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Smartphone,
  Monitor,
  Store,
  CreditCard,
  Share2,
  ExternalLink
} from 'lucide-react'
import type { QRCodePayment } from '@/types/merchant'

// Mock QR codes for demonstration
const mockQRCodes: QRCodePayment[] = [
  {
    id: '1',
    amount: 15000,
    currency: 'KES',
    description: 'Electronics Purchase',
    merchantId: 'merchant_123',
    status: 'active',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reference: 'QR-001'
  },
  {
    id: '2',
    amount: 8500,
    currency: 'KES',
    description: 'Clothing Store',
    merchantId: 'merchant_123',
    status: 'paid',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    customerEmail: 'customer@example.com',
    reference: 'QR-002'
  },
  {
    id: '3',
    amount: 25000,
    currency: 'KES',
    description: 'Furniture Order',
    merchantId: 'merchant_123',
    status: 'expired',
    expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    reference: 'QR-003'
  }
]

export function QRCodeInterface() {
  const { toast } = useToast()
  const {
    isLoading,
    qrCodes,
    createQRCode,
    fetchQRCode,
  } = useMerchant()

  const [qrCodeList, setQrCodeList] = useState(mockQRCodes)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedQR, setSelectedQR] = useState<QRCodePayment | null>(null)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    expiresMinutes: '60',
    currency: 'KES'
  })

  useEffect(() => {
    // Set the first QR code as selected by default
    if (qrCodeList.length > 0 && !selectedQR) {
      setSelectedQR(qrCodeList[0])
    }
  }, [qrCodeList, selectedQR])

  const getStatusColor = (status: QRCodePayment['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paid': return 'bg-blue-100 text-blue-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: QRCodePayment['status']) => {
    switch (status) {
      case 'active': return <QrCode className="h-4 w-4 text-green-600" />
      case 'paid': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'expired': return <Clock className="h-4 w-4 text-red-600" />
      case 'cancelled': return <AlertTriangle className="h-4 w-4 text-gray-600" />
      default: return <QrCode className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTimeUntilExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffTime <= 0) return 'Expired'
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
    return `${diffHours}h`
  }

  const generateQRCode = async () => {
    if (!formData.amount || !formData.description) {
      toast({
        title: 'Invalid Input',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    const amount = parseFloat(formData.amount)
    if (amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const newQR: QRCodePayment = {
        id: Date.now().toString(),
        amount,
        currency: formData.currency,
        description: formData.description,
        merchantId: 'merchant_123',
        status: 'active',
        expiresAt: new Date(Date.now() + parseInt(formData.expiresMinutes) * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        reference: `QR-${String(qrCodeList.length + 1).padStart(3, '0')}`
      }

      setQrCodeList(prev => [newQR, ...prev])
      setSelectedQR(newQR)
      
      // Reset form
      setFormData({
        amount: '',
        description: '',
        expiresMinutes: '60',
        currency: 'KES'
      })

      toast({
        title: 'QR Code Generated',
        description: 'Your QR code has been created successfully.',
      })
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate QR code. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyQRLink = (qrId: string) => {
    const link = `https://pay.kelo.com/qr/${qrId}`
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: 'Link Copied',
        description: 'QR code link has been copied to clipboard.',
      })
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy link. Please copy manually.',
        variant: 'destructive',
      })
    })
  }

  const downloadQRCode = (qr: QRCodePayment) => {
    // In a real implementation, this would download an actual QR code image
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Draw a placeholder QR code
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 300, 300)
      ctx.fillStyle = '#000000'
      ctx.font = '16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('QR Code', 150, 140)
      ctx.fillText(qr.reference, 150, 160)
      ctx.fillText(formatCurrency(qr.amount), 150, 180)
      
      // Download the canvas as image
      const link = document.createElement('a')
      link.download = `kelo-qr-${qr.reference}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      toast({
        title: 'Download Started',
        description: `QR code ${qr.reference} has been downloaded.`,
      })
    }
  }

  const shareQRCode = async (qr: QRCodePayment) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pay with Kelo',
          text: `Scan to pay ${formatCurrency(qr.amount)} for ${qr.description}`,
          url: `https://pay.kelo.com/qr/${qr.id}`
        })
      } catch (error) {
        copyQRLink(qr.id)
      }
    } else {
      copyQRLink(qr.id)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          QR Code Payments
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate QR codes for in-store and online payments
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - QR Generation */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Generate QR Code
              </CardTitle>
              <CardDescription>
                Create a new QR code for payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter payment description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, currency: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In</Label>
                  <Select value={formData.expiresMinutes} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, expiresMinutes: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="360">6 hours</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={generateQRCode}
                disabled={isGenerating || !formData.amount || !formData.description}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active QR Codes</span>
                  <span className="font-semibold">
                    {qrCodeList.filter(qr => qr.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paid Today</span>
                  <span className="font-semibold">
                    {qrCodeList.filter(qr => qr.status === 'paid').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Generated</span>
                  <span className="font-semibold">{qrCodeList.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - QR Display and List */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="display" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="display">QR Display</TabsTrigger>
              <TabsTrigger value="list">All QR Codes</TabsTrigger>
            </TabsList>

            <TabsContent value="display" className="space-y-4">
              {selectedQR ? (
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            {getStatusIcon(selectedQR.status)}
                            <span className="ml-2">{selectedQR.reference}</span>
                          </CardTitle>
                          <CardDescription>
                            {selectedQR.description}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(selectedQR.status)}>
                          {selectedQR.status.charAt(0).toUpperCase() + selectedQR.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* QR Code Display */}
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-64 h-64 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <QrCode className="h-24 w-24 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-500">QR Code Preview</p>
                              <p className="text-xs text-gray-400 mt-1">{selectedQR.reference}</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadQRCode(selectedQR)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyQRLink(selectedQR.id)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => shareQRCode(selectedQR)}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </div>

                        {/* QR Details */}
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm text-gray-600">Amount</Label>
                            <p className="text-2xl font-bold">{formatCurrency(selectedQR.amount)}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm text-gray-600">Status</Label>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(selectedQR.status)}
                              <span className="capitalize">{selectedQR.status}</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm text-gray-600">Expires</Label>
                            <p className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{getTimeUntilExpiry(selectedQR.expiresAt)}</span>
                            </p>
                          </div>

                          <div>
                            <Label className="text-sm text-gray-600">Created</Label>
                            <p>{formatDate(selectedQR.createdAt)}</p>
                          </div>

                          {selectedQR.paidAt && (
                            <div>
                              <Label className="text-sm text-gray-600">Paid At</Label>
                              <p>{formatDate(selectedQR.paidAt)}</p>
                            </div>
                          )}

                          {selectedQR.customerEmail && (
                            <div>
                              <Label className="text-sm text-gray-600">Customer</Label>
                              <p>{selectedQR.customerEmail}</p>
                            </div>
                          )}

                          <div>
                            <Label className="text-sm text-gray-600">Payment Link</Label>
                            <div className="flex">
                              <Input 
                                value={`https://pay.kelo.com/qr/${selectedQR.id}`}
                                readOnly
                                className="text-sm"
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyQRLink(selectedQR.id)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <QrCode className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No QR Code Selected</h3>
                    <p className="text-gray-500 text-center">
                      Generate a new QR code or select one from the list to view details.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="grid gap-4">
                {qrCodeList.map((qr) => (
                  <Card 
                    key={qr.id}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedQR?.id === qr.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedQR(qr)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(qr.status)}
                          <div>
                            <p className="font-medium">{qr.reference}</p>
                            <p className="text-sm text-gray-600">{qr.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>{formatDate(qr.createdAt)}</span>
                              <span>•</span>
                              <span>Expires in {getTimeUntilExpiry(qr.expiresAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold">{formatCurrency(qr.amount)}</p>
                          <Badge className={getStatusColor(qr.status)}>
                            {qr.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}