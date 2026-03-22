<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

interface Wordbook { id: number; name: string; description: string }

const router = useRouter()
const wordbooks = ref<Wordbook[]>([])
const loading = ref(true)
const username = localStorage.getItem('username') || ''

const wbColors = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#AF52DE', '#5AC8FA']
const wbIcons = ['📚', '🎯', '🔥', '⭐', '💡', '🌟']

onMounted(async () => {
  try {
    const res = await api.get('/wordbooks')
    wordbooks.value = res.data
  } finally {
    loading.value = false
  }
})

function logout() {
  localStorage.clear()
  router.push('/login')
}
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>
        <p class="greeting">你好，{{ username }} 👋</p>
        <h1 class="title">单词本</h1>
      </div>
      <div class="header-actions">
        <button class="icon-btn" @click="router.push('/stats')">📊</button>
        <button class="icon-btn" @click="logout">🚪</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner" />
    </div>

    <!-- Wordbooks -->
    <div v-else class="wordbooks">
      <div
        v-for="(wb, i) in wordbooks"
        :key="wb.id"
        class="wb-card"
        :style="{ background: `linear-gradient(135deg, ${wbColors[i % wbColors.length]}, ${wbColors[(i+1) % wbColors.length]})` }"
        @click="router.push(`/wordbooks/${wb.id}/study`)"
      >
        <div class="wb-icon">{{ wbIcons[i % wbIcons.length] }}</div>
        <div class="wb-info">
          <h2 class="wb-name">{{ wb.name }}</h2>
          <p class="wb-desc">{{ wb.description || '点击开始学习' }}</p>
        </div>
        <div class="wb-arrow">›</div>
      </div>
    </div>

    <!-- Bottom tip -->
    <p class="tip">每日坚持，词汇量稳步提升 🚀</p>
  </div>
</template>

<style scoped>
.page {
  max-width: 430px;
  margin: 0 auto;
  padding: 60px 20px 40px;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.greeting {
  font-size: 15px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #1C1C1E;
}

.header-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #FFFFFF;
  border: none;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:active { transform: scale(0.92); }

.loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E5E5EA;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.wordbooks {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wb-card {
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}

.wb-card:active {
  transform: scale(0.97);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.wb-icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.wb-info { flex: 1; }

.wb-name {
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
}

.wb-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.75);
}

.wb-arrow {
  font-size: 28px;
  color: rgba(255,255,255,0.6);
  font-weight: 300;
}

.tip {
  text-align: center;
  color: #8E8E93;
  font-size: 14px;
  margin-top: 32px;
}
</style>
