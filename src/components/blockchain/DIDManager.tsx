'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHederaDID } from '@/hooks/blockchain/useHederaDID'
import { useWallet } from '@/hooks/blockchain/useWallet'
import { DIDDocument, DIDCredential } from '@/types/blockchain/wallet'
import { 
  Shield, 
  Key, 
  FileText, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react'

export default function DIDManager() {
  const { connection } = useWallet()
  const {
    didDocument,
    credentials,
    isLoading,
    error,
    isResolved,
    createDID,
    resolveDID,
    updateDID,
    issueCredential,
    verifyCredential,
    getCredentials,
    revokeCredential,
    generateDIDFromAccountId,
    validateDID
  } = useHederaDID()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false)
  const [selectedCredential, setSelectedCredential] = useState<DIDCredential | null>(null)

  const [newCredential, setNewCredential] = useState({
    type: '',
    subject: '{}',
    expirationDate: ''
  })

  useEffect(() => {
    if (connection && connection.provider === 'hashpack') {
      const did = generateDIDFromAccountId(connection.address)
      if (validateDID(did)) {
        resolveDID(did)
      }
    }
  }, [connection, resolveDID, generateDIDFromAccountId, validateDID])

  const handleCreateDID = async () => {
    if (!connection) return

    try {
      await createDID(connection.address, connection.address)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create DID:', error)
    }
  }

  const handleIssueCredential = async () => {
    if (!didDocument) return

    try {
      const credentialSubject = JSON.parse(newCredential.subject)
      await issueCredential(
        didDocument.id,
        newCredential.type,
        credentialSubject,
        newCredential.expirationDate
      )
      setIsCredentialDialogOpen(false)
      setNewCredential({ type: '', subject: '{}', expirationDate: '' })
    } catch (error) {
      console.error('Failed to issue credential:', error)
    }
  }

  const handleVerifyCredential = async (credential: DIDCredential) => {
    try {
      await verifyCredential(credential)
      setSelectedCredential(credential)
    } catch (error) {
      console.error('Failed to verify credential:', error)
    }
  }

  const handleRevokeCredential = async (credentialId: string) => {
    try {
      await revokeCredential(credentialId)
    } catch (error) {
      console.error('Failed to revoke credential:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getCredentialTypeIcon = (type: string) => {
    if (type.includes('KYC')) return '🆔'
    if (type.includes('Credit')) return '💳'
    if (type.includes('Identity')) return '👤'
    return '📄'
  }

  return (
    <div className="space-y-6">
      {/* DID Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Decentralized Identity (DID)</span>
          </CardTitle>
          <CardDescription>
            Manage your Hedera DID and verifiable credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {didDocument ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">DID</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {didDocument.id}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(didDocument.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <div>{formatDate(didDocument.created)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <div>{formatDate(didDocument.updated)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Verification Methods</Label>
                  <div>{didDocument.verificationMethod.length}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Controller</Label>
                  <div className="truncate">{didDocument.controller}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No DID Found</h3>
              <p className="text-muted-foreground mb-4">
                Create a Hedera DID to manage your decentralized identity
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create DID
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Hedera DID</DialogTitle>
                    <DialogDescription>
                      Create a new decentralized identity for your Hedera account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Account ID</Label>
                      <Input value={connection?.address || ''} disabled />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDID} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create DID'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credentials Section */}
      {didDocument && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Verifiable Credentials</span>
                </CardTitle>
                <CardDescription>
                  Manage your verifiable credentials and attestations
                </CardDescription>
              </div>
              <Dialog open={isCredentialDialogOpen} onOpenChange={setIsCredentialDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Issue Credential
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Issue New Credential</DialogTitle>
                    <DialogDescription>
                      Create a new verifiable credential for your DID
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="credential-type">Credential Type</Label>
                      <Input
                        id="credential-type"
                        placeholder="e.g., KYCVerification, CreditScore"
                        value={newCredential.type}
                        onChange={(e) => setNewCredential(prev => ({ ...prev, type: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="credential-subject">Subject (JSON)</Label>
                      <Textarea
                        id="credential-subject"
                        placeholder='{"name": "John Doe", "age": 30}'
                        value={newCredential.subject}
                        onChange={(e) => setNewCredential(prev => ({ ...prev, subject: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiration-date">Expiration Date</Label>
                      <Input
                        id="expiration-date"
                        type="date"
                        value={newCredential.expirationDate}
                        onChange={(e) => setNewCredential(prev => ({ ...prev, expirationDate: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCredentialDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleIssueCredential} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Issue Credential'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {credentials.length > 0 ? (
              <div className="grid gap-4">
                {credentials.map((credential) => (
                  <Card key={credential.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{getCredentialTypeIcon(credential.type[1])}</span>
                        <div>
                          <h4 className="font-semibold">{credential.type[1]}</h4>
                          <p className="text-sm text-muted-foreground">
                            Issued: {formatDate(credential.issuanceDate)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires: {formatDate(credential.expirationDate)}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyCredential(credential)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(credential.id)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy ID
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeCredential(credential.id)}
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Revoke
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Credentials</h3>
                <p className="text-muted-foreground mb-4">
                  Issue your first verifiable credential to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}