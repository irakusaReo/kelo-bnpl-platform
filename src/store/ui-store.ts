import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  modalOpen: boolean
  modalContent: React.ReactNode | null
  modalTitle: string
  modalSize: 'sm' | 'md' | 'lg' | 'xl'
  theme: 'light' | 'dark' | 'system'
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
  }>
  loading: boolean
  loadingMessage: string
  
  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
  openModal: (content: React.ReactNode, title: string, size?: 'sm' | 'md' | 'lg' | 'xl') => void
  closeModal: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setLoading: (loading: boolean, message?: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  modalOpen: false,
  modalContent: null,
  modalTitle: '',
  modalSize: 'md',
  theme: 'system',
  notifications: [],
  loading: false,
  loadingMessage: '',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  
  openModal: (content, title, size = 'md') => set({
    modalOpen: true,
    modalContent: content,
    modalTitle: title,
    modalSize: size,
  }),
  
  closeModal: () => set({
    modalOpen: false,
    modalContent: null,
    modalTitle: '',
  }),
  
  setTheme: (theme) => set({ theme }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
      },
    ],
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((notification) => notification.id !== id),
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  setLoading: (loading, message = '') => set({
    loading,
    loadingMessage: message,
  }),
}))