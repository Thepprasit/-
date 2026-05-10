export type Role = 'CUSTOMER' | 'MERCHANT' | 'ADMIN'
export type CrowdLevel = 'QUIET' | 'MODERATE' | 'BUSY' | 'VERY_BUSY'
export type MissionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY'
export type BadgeType = 'EXPLORER' | 'FOODIE' | 'SOCIAL' | 'LOYALIST' | 'PIONEER' | 'NIGHTOWL'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  level: number
  xp: number
  points: number
  streak: number
  role: Role
  createdAt: string
}

export interface Store {
  id: string
  name: string
  slug: string
  description: string
  category: string
  subcategory?: string
  location: string
  latitude: number
  longitude: number
  images: string[]
  phone?: string
  website?: string
  openingHours?: OpeningHours
  crowdLevel: CrowdLevel
  averageRating: number
  totalVisitors: number
  weeklyVisitors: number
  isApproved: boolean
  isFeatured: boolean
  isHiddenGem: boolean
  qrCode?: string
  ownerId: string
  createdAt: string
}

export interface OpeningHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  open: string
  close: string
  closed?: boolean
}

export interface Mission {
  id: string
  title: string
  description: string
  pointsReward: number
  xpReward: number
  difficulty: MissionDifficulty
  startDate: string
  endDate: string
  targetStoreId?: string
  targetStore?: Store
  isDynamic: boolean
  isActive: boolean
  requiredCheckIns: number
  badgeReward?: BadgeType
  imageUrl?: string
  createdAt: string
}

export interface UserMission {
  id: string
  userId: string
  missionId: string
  mission: Mission
  progress: number
  isCompleted: boolean
  completedAt?: string
  startedAt: string
}

export interface CheckIn {
  id: string
  userId: string
  storeId: string
  store?: Store
  pointsEarned: number
  xpEarned: number
  qrVerified: boolean
  createdAt: string
}

export interface Review {
  id: string
  userId: string
  storeId: string
  user?: User
  rating: number
  comment: string
  images: string[]
  helpful: number
  createdAt: string
}

export interface CrowdReport {
  id: string
  userId: string
  storeId: string
  level: CrowdLevel
  createdAt: string
}

export interface Reward {
  id: string
  title: string
  description: string
  pointsRequired: number
  storeId: string
  store?: Store
  quantity: number
  expiryDate: string
  imageUrl?: string
  isActive: boolean
}

export interface Analytics {
  id: string
  storeId: string
  totalViews: number
  totalCheckIns: number
  repeatCustomers: number
  missionTraffic: number
  dailyStats?: DailyStat[]
  weeklyStats?: WeeklyStat[]
}

export interface DailyStat {
  date: string
  visitors: number
  checkIns: number
  revenue?: number
}

export interface WeeklyStat {
  week: string
  visitors: number
  newCustomers: number
  returnCustomers: number
}

export interface Badge {
  id: string
  type: BadgeType
  name: string
  description: string
  imageUrl: string
  xpRequired: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface MissionEngineConfig {
  lowTrafficThreshold: number
  highTrafficThreshold: number
  lowTrafficReward: number
  mediumTrafficReward: number
  highTrafficReward: number
}

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000
]

export const CROWD_COLORS: Record<CrowdLevel, string> = {
  QUIET: '#22c55e',
  MODERATE: '#eab308',
  BUSY: '#f97316',
  VERY_BUSY: '#ef4444',
}

export const CROWD_LABELS: Record<CrowdLevel, string> = {
  QUIET: 'Quiet',
  MODERATE: 'Moderate',
  BUSY: 'Busy',
  VERY_BUSY: 'Very Busy',
}

export const DIFFICULTY_COLORS: Record<MissionDifficulty, string> = {
  EASY: '#22c55e',
  MEDIUM: '#eab308',
  HARD: '#f97316',
  LEGENDARY: '#8b5cf6',
}

export const CATEGORY_ICONS: Record<string, string> = {
  cafe: '☕',
  restaurant: '🍜',
  bar: '🍻',
  shop: '🛍️',
  activity: '🎯',
  temple: '⛩️',
  market: '🏪',
  hotel: '🏨',
  spa: '💆',
  art: '🎨',
}



import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/stores/app-store'
import type { Store, Mission, Review, CrowdLevel, PaginatedResponse } from '@/types'

// Stores
export function useStores(params?: {
  category?: string
  search?: string
  featured?: boolean
  hiddenGems?: boolean
  lat?: number
  lng?: number
  radius?: number
  page?: number
}) {
  return useQuery({
    queryKey: ['stores', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.category) searchParams.set('category', params.category)
      if (params?.search) searchParams.set('search', params.search)
      if (params?.featured) searchParams.set('featured', 'true')
      if (params?.hiddenGems) searchParams.set('hiddenGems', 'true')
      if (params?.lat) searchParams.set('lat', String(params.lat))
      if (params?.lng) searchParams.set('lng', String(params.lng))
      if (params?.radius) searchParams.set('radius', String(params.radius))
      if (params?.page) searchParams.set('page', String(params.page))

      const res = await fetch(`/api/stores?${searchParams}`)
      if (!res.ok) throw new Error('Failed to fetch stores')
      return res.json() as Promise<PaginatedResponse<Store>>
    },
  })
}

export function useStore(id: string) {
  return useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      const res = await fetch(`/api/stores/${id}`)
      if (!res.ok) throw new Error('Failed to fetch store')
      return res.json() as Promise<Store>
    },
    enabled: !!id,
  })
}

// Missions
export function useMissions(active?: boolean) {
  return useQuery({
    queryKey: ['missions', { active }],
    queryFn: async () => {
      const params = active !== undefined ? `?active=${active}` : ''
      const res = await fetch(`/api/missions${params}`)
      if (!res.ok) throw new Error('Failed to fetch missions')
      return res.json() as Promise<Mission[]>
    },
  })
}

export function useUserMissions() {
  return useQuery({
    queryKey: ['user-missions'],
    queryFn: async () => {
      const res = await fetch('/api/missions/user')
      if (!res.ok) throw new Error('Failed to fetch user missions')
      return res.json()
    },
  })
}

// Reviews
export function useStoreReviews(storeId: string) {
  return useQuery({
    queryKey: ['reviews', storeId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?storeId=${storeId}`)
      if (!res.ok) throw new Error('Failed to fetch reviews')
      return res.json() as Promise<Review[]>
    },
    enabled: !!storeId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { storeId: string; rating: number; comment: string; images?: string[] }) => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create review')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.storeId] })
      queryClient.invalidateQueries({ queryKey: ['store', variables.storeId] })
    },
  })
}

// Check-ins
export function useCheckIn() {
  const queryClient = useQueryClient()
  const showPointsAnimation = useAppStore(s => s.showPointsAnimation)

  return useMutation({
    mutationFn: async (data: {
      storeId: string
      lat?: number
      lng?: number
      qrCode?: string
    }) => {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Check-in failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      showPointsAnimation(data.pointsEarned)
      queryClient.invalidateQueries({ queryKey: ['user-missions'] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

// Crowd Reports
export function useCrowdReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { storeId: string; level: CrowdLevel }) => {
      const res = await fetch('/api/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to submit crowd report')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store', variables.storeId] })
    },
  })
}

// Analytics (merchant)
export function useStoreAnalytics(storeId: string, range: '7d' | '30d' | '90d') {
  return useQuery({
    queryKey: ['analytics', storeId, range],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/${storeId}?range=${range}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
    enabled: !!storeId,
  })
}

// Rewards
export function useRewards(storeId?: string) {
  return useQuery({
    queryKey: ['rewards', storeId],
    queryFn: async () => {
      const params = storeId ? `?storeId=${storeId}` : ''
      const res = await fetch(`/api/rewards${params}`)
      if (!res.ok) throw new Error('Failed to fetch rewards')
      return res.json()
    },
  })
}

export function useRedeemReward() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Redemption failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
    },
  })
}

// Geolocation
export function useGeolocation() {
  const setMapCenter = useAppStore(s => s.setMapCenter)

  const getCurrentPosition = (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          resolve(pos.coords)
        },
        reject,
        { timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  return { getCurrentPosition }
}