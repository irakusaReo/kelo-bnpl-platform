'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ModalState {
  isOpen: boolean
  title: string
  content: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    content: null,
    size: 'md',
  })

  const openModal = useCallback((title: string, content: React.ReactNode, size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
    setModalState({
      isOpen: true,
      title,
      content,
      size,
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
    }))
  }, [])

  return {
    modalState,
    openModal,
    closeModal,
  }
}