'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { DIDDocument, DIDCredential } from '@/types/blockchain/wallet'
import { DID_METHODS, CREDENTIAL_TYPES } from '@/utils/constants/blockchain'

interface DIDState {
  didDocument: DIDDocument | null
  credentials: DIDCredential[]
  isLoading: boolean
  error: string | null
  isResolved: boolean
}

export function useHederaDID() {
  const [state, setState] = useState<DIDState>({
    didDocument: null,
    credentials: [],
    isLoading: false,
    error: null,
    isResolved: false,
  })
  
  const { toast } = useToast()

  const createDID = useCallback(async (accountId: string, publicKey: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/blockchain/did/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          accountId,
          publicKey,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          didDocument: result.data.didDocument,
          isLoading: false,
          isResolved: true,
        }))

        toast({
          title: 'DID Created',
          description: 'Your Hedera DID has been created successfully',
        })

        return result.data.didDocument
      } else {
        throw new Error(result.message || 'Failed to create DID')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create DID'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      toast({
        title: 'DID Creation Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [toast])

  const resolveDID = useCallback(async (did: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/blockchain/did/resolve?did=${encodeURIComponent(did)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          didDocument: result.data.didDocument,
          isLoading: false,
          isResolved: true,
        }))

        return result.data.didDocument
      } else {
        throw new Error(result.message || 'Failed to resolve DID')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resolve DID'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      toast({
        title: 'DID Resolution Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [toast])

  const updateDID = useCallback(async (did: string, updates: Partial<DIDDocument>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/blockchain/did/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          did,
          updates,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          didDocument: result.data.didDocument,
          isLoading: false,
        }))

        toast({
          title: 'DID Updated',
          description: 'Your DID document has been updated successfully',
        })

        return result.data.didDocument
      } else {
        throw new Error(result.message || 'Failed to update DID')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update DID'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      toast({
        title: 'DID Update Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [toast])

  const issueCredential = useCallback(async (
    did: string,
    credentialType: string,
    credentialSubject: Record<string, any>,
    expirationDate?: string
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/blockchain/did/credentials/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          did,
          type: [CREDENTIAL_TYPES.VERIFIABLE_CREDENTIAL, credentialType],
          credentialSubject,
          expirationDate: expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          credentials: [...prev.credentials, result.data.credential],
          isLoading: false,
        }))

        toast({
          title: 'Credential Issued',
          description: 'Verifiable credential has been issued successfully',
        })

        return result.data.credential
      } else {
        throw new Error(result.message || 'Failed to issue credential')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to issue credential'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      toast({
        title: 'Credential Issuance Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [toast])

  const verifyCredential = useCallback(async (credential: DIDCredential) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/blockchain/did/credentials/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          credential,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({ ...prev, isLoading: false }))
        return result.data.verificationResult
      } else {
        throw new Error(result.message || 'Failed to verify credential')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify credential'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      toast({
        title: 'Credential Verification Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [toast])

  const getCredentials = useCallback(async (did: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/blockchain/did/credentials?did=${encodeURIComponent(did)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          credentials: result.data.credentials,
          isLoading: false,
        }))

        return result.data.credentials
      } else {
        throw new Error(result.message || 'Failed to fetch credentials')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch credentials'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      toast({
        title: 'Failed to Fetch Credentials',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [toast])

  const revokeCredential = useCallback(async (credentialId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/blockchain/did/credentials/${credentialId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          credentials: prev.credentials.filter(c => c.id !== credentialId),
          isLoading: false,
        }))

        toast({
          title: 'Credential Revoked',
          description: 'Verifiable credential has been revoked successfully',
        })

        return true
      } else {
        throw new Error(result.message || 'Failed to revoke credential')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke credential'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      
      toast({
        title: 'Credential Revocation Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      
      throw error
    }
  }, [toast])

  const generateDIDFromAccountId = useCallback((accountId: string): string => {
    return `${DID_METHODS.HEDERA}${accountId}`
  }, [])

  const validateDID = useCallback((did: string): boolean => {
    return did.startsWith(DID_METHODS.HEDERA) && did.length > DID_METHODS.HEDERA.length
  }, [])

  return {
    ...state,
    createDID,
    resolveDID,
    updateDID,
    issueCredential,
    verifyCredential,
    getCredentials,
    revokeCredential,
    generateDIDFromAccountId,
    validateDID,
  }
}