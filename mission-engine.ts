import type { Store, Mission, MissionDifficulty, MissionEngineConfig } from '@/types'

const DEFAULT_CONFIG: MissionEngineConfig = {
  lowTrafficThreshold: 100,
  highTrafficThreshold: 500,
  lowTrafficReward: 150,
  mediumTrafficReward: 75,
  highTrafficReward: 25,
}

export function calculateMissionReward(
  store: Store,
  config: MissionEngineConfig = DEFAULT_CONFIG
): number {
  const { weeklyVisitors } = store
  const { lowTrafficThreshold, highTrafficThreshold, lowTrafficReward, mediumTrafficReward, highTrafficReward } = config

  if (weeklyVisitors < lowTrafficThreshold) {
    // Low traffic: high reward to incentivize visits
    return lowTrafficReward
  } else if (weeklyVisitors < highTrafficThreshold) {
    // Medium traffic: moderate reward
    return mediumTrafficReward
  } else {
    // High traffic: low reward (already popular)
    return highTrafficReward
  }
}

export function calculateDifficulty(store: Store): MissionDifficulty {
  if (store.isHiddenGem) return 'HARD'
  if (store.weeklyVisitors < 100) return 'MEDIUM'
  if (store.weeklyVisitors < 500) return 'EASY'
  return 'EASY'
}

export function generateDynamicMissions(stores: Store[]): Partial<Mission>[] {
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Sort stores by traffic (ascending) to prioritize low-traffic stores
  const sortedStores = [...stores]
    .filter(s => s.isApproved)
    .sort((a, b) => a.weeklyVisitors - b.weeklyVisitors)

  const missions: Partial<Mission>[] = []

  // Generate missions for bottom 30% traffic stores
  const lowTrafficStores = sortedStores.slice(0, Math.ceil(sortedStores.length * 0.3))
  
  for (const store of lowTrafficStores.slice(0, 5)) {
    const pointsReward = calculateMissionReward(store)
    const difficulty = calculateDifficulty(store)
    
    missions.push({
      title: `Discover ${store.name}`,
      description: `Be one of the first to visit ${store.name} and earn bonus points! This ${store.category} is waiting to be discovered.`,
      pointsReward,
      xpReward: Math.floor(pointsReward / 2),
      difficulty,
      startDate: now.toISOString(),
      endDate: weekEnd.toISOString(),
      targetStoreId: store.id,
      isDynamic: true,
      isActive: true,
      requiredCheckIns: 1,
    })
  }

  // Weekly challenge mission
  missions.push({
    title: 'Weekly Chiang Mai Explorer',
    description: 'Visit 5 different locations across Chiang Mai this week. Explore the city like a local!',
    pointsReward: 500,
    xpReward: 250,
    difficulty: 'LEGENDARY',
    startDate: now.toISOString(),
    endDate: weekEnd.toISOString(),
    isDynamic: true,
    isActive: true,
    requiredCheckIns: 5,
  })

  return missions
}

export function validateCheckIn(params: {
  userId: string
  storeId: string
  userLat: number
  userLng: number
  storeLat: number
  storeLng: number
  qrCode?: string
  lastCheckIn?: Date
}): { valid: boolean; reason?: string } {
  const { userLat, userLng, storeLat, storeLng, qrCode, lastCheckIn } = params

  // Anti-fraud: prevent duplicate check-ins within 30 minutes
  if (lastCheckIn) {
    const timeSinceLastCheckIn = Date.now() - lastCheckIn.getTime()
    const thirtyMinutes = 30 * 60 * 1000
    if (timeSinceLastCheckIn < thirtyMinutes) {
      return { valid: false, reason: 'You already checked in here recently. Please wait 30 minutes.' }
    }
  }

  // Geolocation validation: must be within 200 meters
  const distance = calculateDistance(userLat, userLng, storeLat, storeLng)
  if (distance > 0.2) { // 200 meters in km
    // Allow QR override if QR code is provided and valid
    if (!qrCode) {
      return { valid: false, reason: `You must be within 200m of the store to check in. You are ${Math.round(distance * 1000)}m away.` }
    }
  }

  // QR verification (if provided)
  if (qrCode) {
    const expectedQR = generateStoreQR(params.storeId)
    if (qrCode !== expectedQR) {
      return { valid: false, reason: 'Invalid QR code.' }
    }
  }

  return { valid: true }
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

export function generateStoreQR(storeId: string): string {
  // In production, use HMAC or JWT-signed tokens
  return Buffer.from(`loopcnx:${storeId}:${process.env.QR_SECRET || 'secret'}`).toString('base64')
}

export function calculateXPGain(action: 'checkin' | 'review' | 'mission' | 'report'): number {
  const gains = {
    checkin: 10,
    review: 25,
    mission: 50,
    report: 5,
  }
  return gains[action]
}

export function calculateLevelFromXP(xp: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000]
  let level = 1
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1
    else break
  }
  return Math.min(level, 10)
}

export function getXPForNextLevel(currentXP: number): { current: number; next: number; progress: number } {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000]
  const currentLevel = calculateLevelFromXP(currentXP)
  const currentThreshold = thresholds[currentLevel - 1] || 0
  const nextThreshold = thresholds[currentLevel] || thresholds[thresholds.length - 1]
  const progress = ((currentXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100

  return {
    current: currentXP - currentThreshold,
    next: nextThreshold - currentThreshold,
    progress: Math.min(progress, 100),
  }
}

export function calculateCrowdLevel(reports: Array<{ level: string; createdAt: Date }>): string {
  // Only consider reports from the last 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  const recentReports = reports.filter(r => r.createdAt > twoHoursAgo)

  if (recentReports.length === 0) return 'QUIET'

  const levelScores: Record<string, number> = {
    QUIET: 1,
    MODERATE: 2,
    BUSY: 3,
    VERY_BUSY: 4,
  }

  const avgScore = recentReports.reduce((sum, r) => sum + (levelScores[r.level] || 1), 0) / recentReports.length

  if (avgScore < 1.5) return 'QUIET'
  if (avgScore < 2.5) return 'MODERATE'
  if (avgScore < 3.5) return 'BUSY'
  return 'VERY_BUSY'
}