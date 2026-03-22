<script setup lang="ts">
import type { SegmentedOption } from '../types/models'

interface IOSSegmentedControlProps {
  modelValue: string
  options: readonly SegmentedOption[]
  ariaLabel?: string
  compact?: boolean
}

const props = withDefaults(defineProps<IOSSegmentedControlProps>(), {
  ariaLabel: '分段选择器',
  compact: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function selectOption(value: string): void {
  if (value === props.modelValue) {
    return
  }

  emit('update:modelValue', value)
}
</script>

<template>
  <div class="segmented" :class="{ 'segmented--compact': compact }" :aria-label="ariaLabel" role="tablist">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segment pressable"
      :class="{ 'segment--active': option.value === modelValue }"
      :aria-selected="option.value === modelValue"
      role="tab"
      @click="selectOption(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: var(--fill-quaternary);
  border: 1px solid var(--separator-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}

.segment {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.78rem 0.85rem;
  border-radius: 999px;
  color: var(--label-secondary);
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
}

.segment--active {
  background: var(--surface-secondary);
  color: var(--label-primary);
  box-shadow:
    0 10px 20px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.segmented--compact .segment {
  padding: 0.65rem 0.7rem;
  font-size: 0.83rem;
}
</style>
