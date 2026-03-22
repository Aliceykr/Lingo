<script setup lang="ts">
import { ref, watch } from 'vue'
import { STUDY_ALGORITHM_OPTIONS } from '../constants/ui'
import type { StudyAlgorithm } from '../types/models'

const emit = defineEmits<{ close: [] }>()

const LIMIT_OPTIONS = [5, 10, 15, 20, 30, 50]

function load() {
  return {
    limit: Number(localStorage.getItem('setting-limit') || 20),
    algorithm: (localStorage.getItem('setting-algorithm') || 'sm2') as StudyAlgorithm
  }
}

const limit = ref(load().limit)
const algorithm = ref<StudyAlgorithm>(load().algorithm)

watch([limit, algorithm], () => {
  localStorage.setItem('setting-limit', String(limit.value))
  localStorage.setItem('setting-algorithm', algorithm.value)
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-panel glass-surface" role="dialog" aria-modal="true" aria-label="学习设置">
        <div class="modal-header">
          <h2 class="modal-title">学习设置</h2>
          <button class="modal-close pressable" aria-label="关闭" @click="emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="settings-body">
          <!-- 每组卡片数量 -->
          <section class="setting-section">
            <p class="setting-label">每组卡片数量</p>
            <p class="setting-desc">每次进入学习时抽取的单词数。</p>
            <div class="pill-group">
              <button
                v-for="n in LIMIT_OPTIONS"
                :key="n"
                type="button"
                class="pill pressable"
                :class="{ 'pill--active': limit === n }"
                @click="limit = n"
              >
                {{ n }} 张
              </button>
            </div>
          </section>

          <div class="setting-divider" />

          <!-- 默认复习算法 -->
          <section class="setting-section">
            <p class="setting-label">默认复习算法</p>
            <p class="setting-desc">进入学习时默认使用的间隔复习算法。</p>
            <div class="algo-group">
              <button
                v-for="opt in STUDY_ALGORITHM_OPTIONS"
                :key="opt.value"
                type="button"
                class="algo-card pressable"
                :class="{ 'algo-card--active': algorithm === opt.value }"
                @click="algorithm = opt.value as StudyAlgorithm"
              >
                {{ opt.label }}
              </button>
            </div>
          </section>
        </div>

        <div class="modal-footer">
          <button type="button" class="ios-button ios-button--primary pressable" @click="emit('close')">
            完成
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 24px;
  animation: backdrop-in 220ms ease;
}

@keyframes backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal-panel {
  width: min(100%, 480px);
  border-radius: 28px;
  overflow: hidden;
  animation: panel-in 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.95);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--separator-soft);
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: -0.03em;
}

.modal-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--fill-quaternary);
  color: var(--label-secondary);
}

.settings-body {
  padding: 20px 24px;
  display: grid;
  gap: 0;
}

.setting-section {
  padding: 4px 0 20px;
}

.setting-divider {
  height: 1px;
  background: var(--separator-soft);
  margin-bottom: 20px;
}

.setting-label {
  margin: 0 0 4px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.setting-desc {
  margin: 0 0 14px;
  font-size: 0.92rem;
  color: var(--label-secondary);
  line-height: 1.5;
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 600;
  background: var(--fill-quaternary);
  color: var(--label-secondary);
  border: 1px solid transparent;
  transition: background 200ms ease, color 200ms ease;
}

.pill--active {
  background: rgba(10, 132, 255, 0.12);
  color: var(--accent-blue);
  border-color: rgba(10, 132, 255, 0.25);
}

.algo-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.algo-card {
  min-height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 0.96rem;
  font-weight: 600;
  background: var(--fill-quaternary);
  color: var(--label-secondary);
  border: 1px solid transparent;
  transition: background 200ms ease, color 200ms ease;
}

.algo-card--active {
  background: rgba(10, 132, 255, 0.12);
  color: var(--accent-blue);
  border-color: rgba(10, 132, 255, 0.25);
}

.modal-footer {
  padding: 0 24px 24px;
}

.modal-footer .ios-button {
  width: 100%;
}
</style>
