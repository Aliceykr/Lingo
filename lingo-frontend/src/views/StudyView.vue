<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

interface Word { id: number; word: string; translation: string }

const route = useRoute()
const router = useRouter()
const wordbookId = route.params.id as string

const words = ref<Word[]>([])
const current = ref(0)
const showAnswer = ref(false)
const loading = ref(true)
const algorithm = ref('sm2')
const submitting = ref(false)
const done = ref(false)

const algorithmOptions = [
  { label: 'SM-2', value: 'sm2' },
  { label: '艾宾浩斯', value: 'ebbinghaus' },
  { label: 'FSRS', value: 'fsrs' },
  { label: 'Leitner', value: 'leitner' }
]

async function loadWords() {
  loading.value = true
  showAnswer.value = false
  current.value = 0
  done.value = false
  try {
    const res = await api.get(`/wordbooks/${wordbookId}/study`, {
      params: { algorithm: algorithm.value, limit: 20 }
    })
    words.value = res.data
    if (words.value.length === 0) done.value = true
  } finally {
    loading.value = false
  }
}

async function review(quality: number) {
  if (submitting.value) return
  submitting.value = true
  try {
    await api.post(`/words/${words.value[current.value].id}/review`, {
      algorithm: algorithm.value,
      quality
    })
    if (current.value + 1 < words.value.length) {
      current.value++
      showAnswer.value = false
    } else {
      done.value = true
    }
  } finally {
    submitting.value = false
  }
}

const progress = () => words.value.length > 0 ? Math.round((current.value / words.value.length) * 100) : 0

onMounted(loadWords)
</script>

<template>
  <div class="page">
    <!-- Navbar -->
    <div class="navbar">
      <button class="back-btn" @click="router.push('/wordbooks')">‹ 返回</button>
      <select v-model="algorithm" class="algo-select" @change="loadWords">
        <option v-for="o in algorithmOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="center">
      <div class="spinner" />
    </div>

    <!-- Done -->
    <div v-else-if="done" class="done-screen">
      <div class="done-icon">🎉</div>
      <h2 class="done-title">今日任务完成！</h2>
      <p class="done-desc">继续保持，明天见</p>
      <button class="primary-btn" @click="router.push('/wordbooks')">返回单词本</button>
    </div>

    <!-- Study -->
    <div v-else class="study">
      <!-- Progress -->
      <div class="progress-area">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress() + '%' }" />
        </div>
        <span class="progress-text">{{ current + 1 }} / {{ words.length }}</span>
      </div>

      <!-- Card -->
      <div class="word-card" :class="{ flipped: showAnswer }">
        <div class="card-front" v-if="!showAnswer">
          <p class="word-label">单词</p>
          <h1 class="word-text">{{ words[current]?.word }}</h1>
          <button class="show-btn" @click="showAnswer = true">显示释义</button>
        </div>
        <div class="card-back" v-else>
          <p class="word-label">释义</p>
          <h1 class="word-text">{{ words[current]?.word }}</h1>
          <p class="translation">{{ words[current]?.translation }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="showAnswer" class="actions">
        <button class="action-btn danger" :disabled="submitting" @click="review(1)">
          <span class="action-icon">😓</span>
          <span>不认识</span>
        </button>
        <button class="action-btn warning" :disabled="submitting" @click="review(3)">
          <span class="action-icon">🤔</span>
          <span>模糊</span>
        </button>
        <button class="action-btn success" :disabled="submitting" @click="review(5)">
          <span class="action-icon">😄</span>
          <span>认识</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 430px;
  margin: 0 auto;
  padding: 0 20px 40px;
  min-height: 100vh;
  background: #F2F2F7;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 56px 0 16px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 17px;
  color: #007AFF;
  font-family: inherit;
  cursor: pointer;
  font-weight: 500;
  padding: 0;
}

.algo-select {
  background: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  color: #1C1C1E;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  outline: none;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #E5E5EA;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.done-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
}

.done-icon { font-size: 80px; margin-bottom: 24px; }
.done-title { font-size: 28px; font-weight: 700; color: #1C1C1E; margin-bottom: 8px; }
.done-desc { font-size: 16px; color: #8E8E93; margin-bottom: 40px; }

.primary-btn {
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 16px 32px;
  font-size: 17px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.primary-btn:active { opacity: 0.8; transform: scale(0.97); }

.study { display: flex; flex-direction: column; gap: 20px; }

.progress-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #E5E5EA;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007AFF;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 14px;
  color: #8E8E93;
  font-weight: 500;
  white-space: nowrap;
}

.word-card {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-front, .card-back {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.word-label {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.word-text {
  font-size: 42px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -1px;
}

.translation {
  font-size: 18px;
  color: #3C3C43;
  line-height: 1.6;
  max-width: 280px;
}

.show-btn {
  margin-top: 8px;
  background: #F2F2F7;
  border: none;
  border-radius: 12px;
  padding: 12px 28px;
  font-size: 16px;
  font-weight: 600;
  color: #007AFF;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.show-btn:active { background: #E5E5EA; }

.actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  border: none;
  border-radius: 18px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.15s;
  color: white;
}

.action-btn:active { transform: scale(0.95); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.action-btn.danger { background: #FF3B30; }
.action-btn.warning { background: #FF9500; }
.action-btn.success { background: #34C759; }

.action-icon { font-size: 24px; }
</style>
