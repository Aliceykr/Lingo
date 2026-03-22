export type AuthMode = 'login' | 'register'

export type StudyAlgorithm = 'sm2' | 'ebbinghaus' | 'fsrs' | 'leitner'

export type AppIconName =
  | 'books'
  | 'chart'
  | 'power'
  | 'chevron-right'
  | 'chevron-left'
  | 'sparkles'
  | 'check-circle'
  | 'question-circle'
  | 'xmark-circle'
  | 'settings'

export interface AuthResponse {
  token: string
  username: string
}

export interface WordbookSummary {
  id: number
  name: string
  description: string | null
}

export interface StudyWord {
  id: number
  word: string
  translation: string
}

export interface StatsByAlgorithm {
  algorithm: StudyAlgorithm | string
  learned: number
}

export interface StudyStatsResponse {
  total_learned: number
  today_reviewed: number
  due_for_review: number
  streak_days: number
  by_algorithm: StatsByAlgorithm[]
  avg_interval: number
}

export interface SegmentedOption {
  label: string
  value: string
}

export interface AppTabItem {
  key: string
  label: string
  to: string
  icon: AppIconName
}
