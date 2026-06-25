import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from './client'
import type {
  Apod,
  AsteroidFeed,
  EpicImage,
  FavoriteDto,
  FavoriteInput,
  IssTle,
  LibraryItem,
} from './types'

const get = async <T>(url: string, params?: Record<string, unknown>): Promise<T> =>
  (await api.get<T>(url, { params })).data

const HOUR = 60 * 60 * 1000

export function useApod(date?: string) {
  return useQuery({
    queryKey: ['apod', date ?? 'today'],
    queryFn: () => get<Apod>('/api/apod', date ? { date } : undefined),
    staleTime: HOUR,
  })
}

export function useApodArchive() {
  return useQuery({
    queryKey: ['apod', 'archive'],
    queryFn: () => get<Apod[]>('/api/apod/range'),
    staleTime: 6 * HOUR,
  })
}

/** The backend caps each page at 60 results; a full page means there is likely more. */
const LIBRARY_PAGE_SIZE = 60

export function useLibrarySearch(query: string, page = 1) {
  const q = query.trim()
  return useQuery({
    queryKey: ['library', q.toLowerCase(), page],
    queryFn: () => get<LibraryItem[]>('/api/library/search', { q, page }),
    enabled: q.length >= 1,
    staleTime: 30 * 60 * 1000,
  })
}

/** Paginated search for the Explore page; "Load more" appends the next page. */
export function useLibrarySearchInfinite(query: string) {
  const q = query.trim()
  return useInfiniteQuery({
    queryKey: ['library', 'infinite', q.toLowerCase()],
    queryFn: ({ pageParam }) => get<LibraryItem[]>('/api/library/search', { q, page: pageParam }),
    enabled: q.length >= 1,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length >= LIBRARY_PAGE_SIZE ? allPages.length + 1 : undefined,
    staleTime: 30 * 60 * 1000,
  })
}

export function useAsteroids() {
  return useQuery({
    queryKey: ['asteroids'],
    queryFn: () => get<AsteroidFeed>('/api/asteroids'),
    staleTime: HOUR,
  })
}

export function useEpicLatest() {
  return useQuery({
    queryKey: ['epic'],
    queryFn: () => get<EpicImage[]>('/api/epic/latest'),
    staleTime: HOUR,
  })
}

/** The orbital elements; the live position is propagated client-side from these. */
export function useIssTle() {
  return useQuery({
    queryKey: ['iss', 'tle'],
    queryFn: () => get<IssTle>('/api/iss/tle'),
    staleTime: 6 * HOUR,
  })
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => get<FavoriteDto[]>('/api/favorites'),
    staleTime: 30 * 1000,
  })
}

export function useAddFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: FavoriteInput) => api.post('/api/favorites', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
}

export function useRemoveFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemType, externalId }: { itemType: string; externalId: string }) =>
      api.delete(`/api/favorites/${itemType}/${encodeURIComponent(externalId)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  })
}
