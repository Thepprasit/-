import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Store, Mission, UserMission } from '@/types'

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void

  // Stores
  savedStores: string[]
  toggleSavedStore: (storeId: string) => void
  isSaved: (storeId: string) => boolean

  // Missions
  activeMissions: UserMission[]
  setActiveMissions: (missions: UserMission[]) => void

  // UI
  mapCenter: { lat: number; lng: number }
  setMapCenter: (center: { lat: number; lng: number }) => void
  selectedStore: Store | null
  setSelectedStore: (store: Store | null) => void

  // Notifications
  pointsAnimation: { show: boolean; amount: number }
  showPointsAnimation: (amount: number) => void
  hidePointsAnimation: () => void

  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      savedStores: [],
      toggleSavedStore: (storeId) => {
        const { savedStores } = get()
        const isSaved = savedStores.includes(storeId)
        set({
          savedStores: isSaved
            ? savedStores.filter(id => id !== storeId)
            : [...savedStores, storeId],
        })
      },
      isSaved: (storeId) => get().savedStores.includes(storeId),

      activeMissions: [],
      setActiveMissions: (missions) => set({ activeMissions: missions }),

      mapCenter: { lat: 18.7883, lng: 98.9853 },
      setMapCenter: (center) => set({ mapCenter: center }),
      selectedStore: null,
      setSelectedStore: (store) => set({ selectedStore: store }),

      pointsAnimation: { show: false, amount: 0 },
      showPointsAnimation: (amount) => set({ pointsAnimation: { show: true, amount } }),
      hidePointsAnimation: () => set({ pointsAnimation: { show: false, amount: 0 } }),

      theme: 'light',
      toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'loopcnx-store',
      partialize: (state) => ({
        savedStores: state.savedStores,
        theme: state.theme,
      }),
    }
  )
)

// Merchant store
interface MerchantState {
  currentStore: Store | null
  setCurrentStore: (store: Store | null) => void
  analyticsRange: '7d' | '30d' | '90d'
  setAnalyticsRange: (range: '7d' | '30d' | '90d') => void
}

export const useMerchantStore = create<MerchantState>()((set) => ({
  currentStore: null,
  setCurrentStore: (store) => set({ currentStore: store }),
  analyticsRange: '7d',
  setAnalyticsRange: (range) => set({ analyticsRange: range }),
}))