<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const loading = ref(true)
const stats = ref<any>(null)

onMounted(async () => {
  try {
    const res = await api.get('/stats')
    stats.value = res.data
  } finally {
    loading.value = false
  }
})

const algoNames: Record<string, string> = {
  sm2: 'SM-2',
  ebbinghaus: '艾宾浩斯',
  fsrs: 'FSRS',
  leitner: 'Leitner'
}
</script>

<template>
  <div class="page">
    <div class="navbar">
      <button class="back-btn" @click="router.push('/wordbooks')">‹ 返回</button>
      <h2 class="nav-title">学习统计</h2>
      <div style="width:48px" />
    </div>

    <div v-if="loading" class="center">
      <div class="spinner" />
    </div>

    <div v-else-if="stats">
      <!-- 主要数据 -->
      <div class="stats-grid">
        <div class="stat-card blue">
          <div class="stat-value">{{ stats.total_learned }}</div>
          <div class="stat-label">累计学习</div>
        </div>
        <div class="stat-card green">
          <div class="stat-value">{{ stats.today_reviewed }}</div>
          <div class="stat-label">今日复习</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-value">{{ stats.due_for_review }}</div>
          <div class="stat-label">待复习</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-value">{{ stats.streak_days }}</div>
          <div class="stat-label">打卡天数</div>
        </div>
      </div>

      <!-- 算法详情 -->
      <div class="section">
        <p class="section-title">各算法学习情况</p>
        <div class="algo-card">
          <div v-if="stats.by_algorithm.length === 0" class="empty">
            <p>暂无学习记录</p>
            <p style="font-size:13px;color:#8E8E93;margin-top:4px">开始学习后这里会显示数据</p>
          </div>
          <div
            v-for="(item, i) in stats.by_algorithm"
            :key="item.algorithm"
            class="algo-row"
            :class="{ last: i === stats.by_algorithm.length - 1 }"
          >
            <div class="algo-name">{{ algoNames[item.algorithm] || item.algorithm }}</div>
            <div class="algo-count">{{ item.learned }} 词</div>
          </div>
        </div>
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
  padding: 56px 0 24px;
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
  width: 48px;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
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

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-card.blue { background: linear-gradient(135deg, #007AFF, #5AC8FA); }
.stat-card.green { background: linear-gradient(135deg, #34C759, #30D158); }
.stat-card.orange { background: linear-gradient(135deg, #FF9500, #FF6B00); }
.stat-card.purple { background: linear-gradient(135deg, #AF52DE, #BF5AF2); }

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -1px;
}

.stat-label {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  font-weight: 500;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 4px;
}

.algo-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
}

.algo-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #F2F2F7;
}

.algo-row.last { border-bottom: none; }

.algo-name {
  font-size: 16px;
  color: #1C1C1E;
  font-weight: 500;
}

.algo-count {
  font-size: 15px;
  color: #8E8E93;
}

.empty {
  padding: 32px;
  text-align: center;
  color: #3C3C43;
  font-size: 16px;
}
</style>
