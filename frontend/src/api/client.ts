import axios from 'axios'
import { getClientId } from '@/lib/clientId'
import type { ApiError } from './types'

// In dev this is "" and Vite proxies /api -> :8080. In prod set VITE_API_BASE_URL to the Render URL.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

export const api = axios.create({ baseURL, timeout: 15000 })

api.interceptors.request.use((config) => {
  config.headers.set('X-Client-Id', getClientId())
  return config
})

function body(err: unknown): ApiError | undefined {
  return axios.isAxiosError(err) ? (err.response?.data as ApiError | undefined) : undefined
}

export function apiErrorMessage(err: unknown): string {
  const b = body(err)
  if (b?.message) return b.message
  if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
    return 'The request timed out. The server may be waking up.'
  }
  return 'Something went wrong. Please try again.'
}

export function isRetryable(err: unknown): boolean {
  return body(err)?.retryable ?? false
}
