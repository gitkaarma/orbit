// TypeScript mirrors of the backend DTOs.

export interface Apod {
  date: string
  title: string
  explanation: string
  mediaType: string // "image" | "video"
  url: string // embeddable player for video, the image for image
  thumbnailUrl: string | null // a still frame (== url for images; null for videos without one)
  hdurl: string | null
  copyright: string | null
}

export interface LibraryItem {
  nasaId: string
  title: string
  description: string | null
  dateCreated: string | null
  center: string | null
  thumbUrl: string
  imageUrl: string
  keywords: string[]
}

export interface Asteroid {
  id: string
  name: string
  diameterMinM: number
  diameterMaxM: number
  closeApproachDate: string
  missDistanceKm: number
  missDistanceLunar: number
  velocityKmh: number
  hazardous: boolean
  magnitude: number
}

export interface AsteroidFeed {
  start: string
  end: string
  count: number
  hazardousCount: number
  asteroids: Asteroid[]
}

export interface EpicImage {
  identifier: string
  caption: string
  date: string
  imageUrl: string
  thumbUrl: string
  lat: number
  lon: number
}

export interface IssTle {
  name: string
  line1: string
  line2: string
}

export type FavoriteType = 'apod' | 'library' | 'epic' | 'asteroid'

export interface FavoriteDto {
  itemType: string
  externalId: string
  title: string | null
  imageUrl: string | null
  sourceUrl: string | null
  addedAt: string
}

export interface FavoriteInput {
  itemType: FavoriteType
  externalId: string
  title?: string | null
  imageUrl?: string | null
  sourceUrl?: string | null
}

export interface ApiError {
  error: string
  message: string
  retryable: boolean
}
