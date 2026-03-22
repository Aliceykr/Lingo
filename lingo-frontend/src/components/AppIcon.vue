<script setup lang="ts">
import type { AppIconName } from '../types/models'

interface AppIconProps {
  name: AppIconName
  size?: number
}

withDefaults(defineProps<AppIconProps>(), {
  size: 20
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.85"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'books'">
      <path d="M6.5 6.5A2.5 2.5 0 0 1 9 4h9.5v12.5a2.5 2.5 0 0 0-2.5-2.5H9A2.5 2.5 0 0 0 6.5 16.5Z" />
      <path d="M6.5 16.5A2.5 2.5 0 0 1 9 14h7" />
      <path d="M4.5 7.5h2" />
      <path d="M4.5 11.5h2" />
    </template>

    <template v-else-if="name === 'chart'">
      <path d="M4 19.5h16" />
      <path d="M7 16V10" />
      <path d="M12 16V6.5" />
      <path d="M17 16v-4.5" />
    </template>

    <template v-else-if="name === 'power'">
      <path d="M14 4h4.5v16H14" />
      <path d="M10 8.5 5.5 12 10 15.5" />
      <path d="M5.5 12H15" />
    </template>

    <template v-else-if="name === 'chevron-right'">
      <path d="m9 6 6 6-6 6" />
    </template>

    <template v-else-if="name === 'chevron-left'">
      <path d="m15 6-6 6 6 6" />
    </template>

    <template v-else-if="name === 'sparkles'">
      <path d="m12 3 1.35 3.65L17 8l-3.65 1.35L12 13l-1.35-3.65L7 8l3.65-1.35Z" />
      <path d="m18.5 14 0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8Z" />
      <path d="m5.5 14 0.8 2.2 2.2 0.8-2.2 0.8-0.8 2.2-0.8-2.2-2.2-0.8 2.2-0.8Z" />
    </template>

    <template v-else-if="name === 'check-circle'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.8 12 2.1 2.1 4.3-4.6" />
    </template>

    <template v-else-if="name === 'question-circle'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.65 9.3a2.55 2.55 0 0 1 4.9.95c0 1.65-1.75 2.15-2.4 3.05" />
      <path d="M12 16.8h.01" />
    </template>

    <template v-else-if="name === 'xmark-circle'">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9.4 9.4 5.2 5.2" />
      <path d="m14.6 9.4-5.2 5.2" />
    </template>

    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
    </template>
  </svg>
</template>
