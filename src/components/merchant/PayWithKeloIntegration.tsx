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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useMerchant } from '@/hooks/use-merchant'
import { 
  Copy, 
  Download, 
  ExternalLink, 
  Code, 
  Smartphone, 
  Monitor,
  CreditCard,
  QrCode,
  Settings,
  CheckCircle,
  AlertCircle,
  FileText,
  Globe,
  ShoppingCart
} from 'lucide-react'
import type { PayWithKeloConfig, IntegrationSnippet } from '@/types/merchant'

// Mock integration code snippets
const mockSnippets: Record<string, string> = {
  web_button: `<button class="kelo-pay-button" data-amount="1000" data-currency="KES" data-merchant-id="your_merchant_id">
  Pay with Kelo
</button>

<script src="https://cdn.kelo.com/pay.js"></script>
<script>
  KeloPay.init({
    merchantId: 'your_merchant_id',
    environment: 'sandbox'
  });
</script>`,
  
  web_widget: `<div id="kelo-payment-widget"></div>

<script src="https://cdn.kelo.com/widget.js"></script>
<script>
  KeloWidget.init({
    container: '#kelo-payment-widget',
    merchantId: 'your_merchant_id',
    amount: 1000,
    currency: 'KES',
    onSuccess: function(payment) {
      console.log('Payment successful:', payment);
    },
    onError: function(error) {
      console.error('Payment failed:', error);
    }
  });
</script>`,

  mobile_android: `// Add to your build.gradle
implementation 'com.kelo:mobile-sdk:1.0.0'

// In your Activity
KeloPay.initialize(this, "your_merchant_id", Environment.SANDBOX);

// Create payment
val paymentRequest = PaymentRequest(
    amount = 1000,
    currency = "KES",
    description = "Product Purchase"
)

KeloPay.startPayment(this, paymentRequest, object : PaymentCallback {
    override fun onSuccess(payment: Payment) {
        // Handle successful payment
    }
    
    override fun onError(error: KeloError) {
        // Handle payment error
    }
})`,

  mobile_ios: `// Add to your Podfile
pod 'KeloPaySDK', '~> 1.0.0'

// In your ViewController
import KeloPaySDK

class ViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        
        KeloPay.initialize(merchantId: "your_merchant_id", environment: .sandbox)
    }
    
    func startPayment() {
        let request = PaymentRequest(
            amount: 1000,
            currency: "KES",
            description: "Product Purchase"
        )
        
        KeloPay.startPayment(request: request, from: self) { result in
            switch result {
            case .success(let payment):
                // Handle successful payment
            case .failure(let error):
                // Handle payment error
            }
        }
    }
}`,

  api_curl: `curl -X POST https://api.kelo.com/v1/payments \\
  -H "Authorization: Bearer your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1000,
    "currency": "KES",
    "description": "Product Purchase",
    "customer_email": "customer@example.com",
    "callback_url": "https://your-site.com/callback"
  }'`,

  api_nodejs: `const KeloPay = require('kelo-pay');

const kelo = new KeloPay({
  apiKey: 'your_api_key',
  environment: 'sandbox'
});

async function createPayment() {
  try {
    const payment = await kelo.payments.create({
      amount: 1000,
      currency: 'KES',
      description: 'Product Purchase',
      customerEmail: 'customer@example.com',
      callbackUrl: 'https://your-site.com/callback'
    });
    
    console.log('Payment created:', payment);
    return payment;
  } catch (error) {
    console.error('Payment creation failed:', error);
  }
}`,

  api_python: `import kelo

# Initialize the client
kelo_client = kelo.Client(
    api_key='your_api_key',
    environment='sandbox'
)

# Create a payment
try:
    payment = kelo_client.payments.create(
        amount=1000,
        currency='KES',
        description='Product Purchase',
        customer_email='customer@example.com',
        callback_url='https://your-site.com/callback'
    )
    print('Payment created:', payment)
except kelo.KeloError as e:
    print('Payment creation failed:', e)`
}

export function PayWithKeloIntegration() {
  const { toast } = useToast()
  const {
    isLoading,
    config,
    snippets,
    fetchIntegrationConfig,
    generateIntegrationSnippet,
  } = useMerchant()

  const [selectedPlatform, setSelectedPlatform] = useState('web')
  const [selectedType, setSelectedType] = useState('button')
  const [codeSnippet, setCodeSnippet] = useState(mockSnippets.web_button)
  const [isCopied, setIsCopied] = useState(false)
  const [integrationConfig, setIntegrationConfig] = useState<PayWithKeloConfig>({
    merchantId: 'demo_merchant_123',
    apiKey: 'sk_demo_123456789',
    environment: 'sandbox',
    currency: 'KES',
    callbackUrl: '',
    webhookUrl: '',
    theme: {
      primaryColor: '#10b981',
      secondaryColor: '#3b82f6',
      logo: ''
    }
  })

  useEffect(() => {
    fetchIntegrationConfig()
  }, [fetchIntegrationConfig])

  useEffect(() => {
    const snippetKey = `${selectedPlatform}_${selectedType}`
    setCodeSnippet(mockSnippets[snippetKey] || mockSnippets.web_button)
  }, [selectedPlatform, selectedType])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      toast({
        title: 'Copied to Clipboard',
        description: 'Code snippet has been copied to your clipboard.',
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard. Please copy manually.',
        variant: 'destructive',
      })
    }
  }

  const downloadSnippet = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Download Started',
      description: `${filename} has been downloaded.`,
    })
  }

  const handleGenerateSnippet = async () => {
    try {
      await generateIntegrationSnippet(selectedType as IntegrationSnippet['type'], selectedPlatform as IntegrationSnippet['platform'])
      toast({
        title: 'Snippet Generated',
        description: 'Your integration snippet has been generated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate integration snippet.',
        variant: 'destructive',
      })
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return <Monitor className="h-5 w-5" />
      case 'mobile': return <Smartphone className="h-5 w-5" />
      case 'pos': return <CreditCard className="h-5 w-5" />
      default: return <Code className="h-5 w-5" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'button': return <CreditCard className="h-5 w-5" />
      case 'widget': return <ShoppingCart className="h-5 w-5" />
      case 'api': return <Code className="h-5 w-5" />
      default: return <Code className="h-5 w-5" />
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Pay with Kelo Integration
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Integrate Kelo BNPL payments into your website or application
        </p>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Integration Configuration
          </CardTitle>
          <CardDescription>
            Your merchant account settings and API credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchant-id">Merchant ID</Label>
              <div className="flex">
                <Input id="merchant-id" value={integrationConfig.merchantId} readOnly />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(integrationConfig.merchantId)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex">
                <Input id="api-key" type="password" value={integrationConfig.apiKey} readOnly />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(integrationConfig.apiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select value={integrationConfig.environment} onValueChange={(value) => 
                setIntegrationConfig(prev => ({ ...prev, environment: value as 'sandbox' | 'production' }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={integrationConfig.currency} onValueChange={(value) => 
                setIntegrationConfig(prev => ({ ...prev, currency: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="callback-url">Callback URL</Label>
              <Input 
                id="callback-url"
                placeholder="https://your-site.com/callback"
                value={integrationConfig.callbackUrl}
                onChange={(e) => setIntegrationConfig(prev => ({ ...prev, callbackUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input 
                id="webhook-url"
                placeholder="https://your-site.com/webhook"
                value={integrationConfig.webhookUrl}
                onChange={(e) => setIntegrationConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="test-mode"
              checked={integrationConfig.environment === 'sandbox'}
              onCheckedChange={(checked) => 
                setIntegrationConfig(prev => ({ ...prev, environment: checked ? 'sandbox' : 'production' }))
              }
            />
            <Label htmlFor="test-mode">Test Mode (Sandbox)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Integration Options */}
      <Tabs defaultValue="button" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="button">Payment Button</TabsTrigger>
          <TabsTrigger value="widget">Payment Widget</TabsTrigger>
          <TabsTrigger value="api">API Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="button" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Button
                </CardTitle>
                <CardDescription>
                  Add a "Pay with Kelo" button to your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Web</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Integration Type</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="button">Button</SelectItem>
                        <SelectItem value="widget">Widget</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Code Snippet</h4>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(codeSnippet)}
                      >
                        {isCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {isCopied ? 'Copied!' : 'Copy'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadSnippet('kelo-integration.html', codeSnippet)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                    <code>{codeSnippet}</code>
                  </pre>
                </div>

                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Ready to integrate</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Implementation Steps</CardTitle>
                <CardDescription>
                  Follow these steps to integrate the payment button
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Copy the code snippet</p>
                      <p className="text-sm text-gray-600">Copy the HTML and JavaScript code above</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Add to your website</p>
                      <p className="text-sm text-gray-600">Paste the code where you want the button to appear</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Test the integration</p>
                      <p className="text-sm text-gray-600">Use test credentials to verify everything works</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Go live</p>
                      <p className="text-sm text-gray-600">Switch to production environment when ready</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="widget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Payment Widget
              </CardTitle>
              <CardDescription>
                Embed a complete payment form in your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Widget Code</h4>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(mockSnippets.web_widget)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                  <code>{mockSnippets.web_widget}</code>
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Features</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Complete payment form</li>
                    <li>• BNPL options display</li>
                    <li>• Real-time validation</li>
                    <li>• Customizable styling</li>
                    <li>• Mobile responsive</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Best For</h4>
                  <ul className="text-sm space-y-1">
                    <li>• E-commerce websites</li>
                    <li>• Service providers</li>
                    <li>• Subscription services</li>
                    <li>• Custom applications</li>
                    <li>• High-volume merchants</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="h-5 w-5 mr-2" />
                  API Integration
                </CardTitle>
                <CardDescription>
                  Integrate using our REST API for maximum flexibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="curl" className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">cURL Example</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(mockSnippets.api_curl)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{mockSnippets.api_curl}</code>
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="nodejs" className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Node.js Example</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(mockSnippets.api_nodejs)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{mockSnippets.api_nodejs}</code>
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="python" className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Python Example</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(mockSnippets.api_python)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{mockSnippets.api_python}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>
                  Complete API reference and documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">REST API Documentation</p>
                      <p className="text-sm text-gray-600">Complete API reference with examples</p>
                    </div>
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Docs
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">SDK Libraries</p>
                      <p className="text-sm text-gray-600">Official SDKs for popular platforms</p>
                    </div>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Postman Collection</p>
                      <p className="text-sm text-gray-600">Test API endpoints easily</p>
                    </div>
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Get Collection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}