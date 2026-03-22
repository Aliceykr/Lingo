import type { AppTabItem, SegmentedOption } from '../types/models'

export const APP_TABS: readonly AppTabItem[] = [
  {
    key: 'wordbooks',
    label: '词书',
    to: '/wordbooks',
    icon: 'books'
  },
  {
    key: 'stats',
    label: '统计',
    to: '/stats',
    icon: 'chart'
  }
]

export const AUTH_MODE_OPTIONS = [
  {
    label: '登录',
    value: 'login'
  },
  {
    label: '注册',
    value: 'register'
  }
] as const satisfies readonly SegmentedOption[]

export const STUDY_ALGORITHM_OPTIONS = [
  {
    label: 'SM-2',
    value: 'sm2'
  },
  {
    label: '艾宾',
    value: 'ebbinghaus'
  },
  {
    label: 'FSRS',
    value: 'fsrs'
  },
  {
    label: 'Leitner',
    value: 'leitner'
  }
] as const satisfies readonly SegmentedOption[]

export const ALGORITHM_LABELS: Record<string, string> = {
  sm2: 'SM-2',
  ebbinghaus: '艾宾浩斯',
  fsrs: 'FSRS',
  leitner: 'Leitner'
}
