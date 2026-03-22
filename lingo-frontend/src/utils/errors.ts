import type { AxiosError } from 'axios'

interface ApiErrorPayload {
  error?: string
}

export function readApiError(error: unknown, fallback: string): string {
  return (error as AxiosError<ApiErrorPayload>).response?.data?.error ?? fallback
}
