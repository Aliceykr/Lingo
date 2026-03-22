<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '../api'
import IOSAppShell from '../components/IOSAppShell.vue'
import { ALGORITHM_LABELS, APP_TABS } from '../constants/ui'
import type { StudyStatsResponse } from '../types/models'
import { readApiError } from '../utils/errors'

const loading = ref(true)
const errorMessage = ref('')
const stats = ref<StudyStatsResponse | null>(null)

const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  weekday: 'short'
}).format(new Date())

const completionRate = computed(() => {
  if (!stats.value) return 0
  const due = stats.value.due_for_review + stats.value.today_reviewed
  if (due === 0) return 100
  return Math.min(100, Math.round((stats.value.today_reviewed / due) * 100))
})

const masteryPercent = computed(() => {
  if (!stats.value) return 0
  return Math.min(100, Math.round((stats.value.avg_interval / 30) * 100))
})

const topAlgorithm = computed(() => {
  if (!stats.value || stats.value.by_algorithm.length === 0) return null
  const top = [...stats.value.by_algorithm].sort((a, b) => b.learned - a.learned)[0]
  return { label: ALGORITHM_LABELS[top.algorithm] ?? top.algorithm, learned: top.learned }
})

const algorithmSummary = computed(() => {
  if (!stats.value || stats.value.by_algorithm.length === 0) return []
  const total = stats.value.by_algorithm.reduce((s, i) => s + i.learned, 0) || 1
  return stats.value.by_algorithm.map(item => ({
    key: item.algorithm,
    label: ALGORITHM_LABELS[item.algorithm] ?? item.algorithm,
    learned: item.learned,
    percent: Math.round((item.learned / total) * 100)
  }))
})

async function loadStats(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await api.get<StudyStatsResponse>('/stats')
    stats.value = response.data
  } catch (error) {
    errorMessage.value = readApiError(error, '统计信息暂时不可用，请稍后再试。')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadStats()
})
</script>

<template>
  <IOSAppShell
    large-title="学习统计"
    :subtitle="todayLabel"
    active-tab="stats"
    :tabs="APP_TABS"
    content-key="stats"
  >
    <template #nav-leading>
      <div class="date-chip">{{ todayLabel }}</div>
    </template>

    <template #nav-trailing>
      <button type="button" class="refresh-chip pressable" @click="loadStats">刷新</button>
    </template>

    <template #sidebar-footer>
      <div class="sidebar-card">
        <p class="sidebar-label">连续学习</p>
        <strong class="sidebar-value">{{ stats?.streak_days ?? 0 }} 天</strong>
        <span class="sidebar-note">保持每日一轮，记忆曲线最稳定。</span>
      </div>
    </template>

    <template #hero>
      <div class="hero-grid">
        <article class="hero-card hero-card--streak glass-surface">
          <p class="hero-label">连续天数</p>
          <strong class="hero-value">{{ stats?.streak_days ?? 0 }}</strong>
          <div class="streak-bar">
            <span
              v-for="i in 7"
              :key="i"
              class="streak-dot"
              :class="{ 'streak-dot--active': i <= Math.min(stats?.streak_days ?? 0, 7) }"
            />
          </div>
          <p class="hero-note">近 7 天打卡点</p>
        </article>

        <article class="hero-card hero-card--completion glass-surface">
          <p class="hero-label">今日完成率</p>
          <strong class="hero-value">{{ completionRate }}%</strong>
          <div class="ring-wrap">
            <svg class="ring" viewBox="0 0 64 64">
              <circle class="ring-bg" cx="32" cy="32" r="28" />
              <circle
                class="ring-fill"
                cx="32" cy="32" r="28"
                :stroke-dasharray="`${completionRate * 1.759} 175.9`"
              />
            </svg>
          </div>
          <p class="hero-note">复习 {{ stats?.today_reviewed ?? 0 }} / 待 {{ stats?.due_for_review ?? 0 }} 词</p>
        </article>

        <article class="hero-card hero-card--mastery glass-surface">
          <p class="hero-label">平均掌握度</p>
          <strong class="hero-value">{{ masteryPercent }}%</strong>
          <div class="mastery-bar">
            <span :style="{ width: masteryPercent + '%' }" />
          </div>
          <p class="hero-note">平均复习间隔 {{ stats?.avg_interval ?? 0 }} 天</p>
        </article>
      </div>
    </template>

    <div v-if="loading" class="state-card glass-surface">
      <span class="ios-spinner" aria-hidden="true" />
      <p>正在汇总统计数据。</p>
    </div>

    <div v-else-if="errorMessage" class="state-card glass-surface">
      <p class="state-title">暂时无法显示统计</p>
      <p class="state-body">{{ errorMessage }}</p>
      <button type="button" class="ios-button ios-button--secondary pressable" @click="loadStats">重新加载</button>
    </div>

    <section v-else-if="stats" class="dashboard-grid">
      <div class="main-col">
        <div class="metrics-grid">
          <article class="metric-card metric-card--blue glass-surface">
            <p class="metric-label">累计学习</p>
            <strong class="metric-value">{{ stats.total_learned }}</strong>
            <p class="metric-note">词</p>
          </article>
          <article class="metric-card metric-card--orange glass-surface">
            <p class="metric-label">待复习队列</p>
            <strong class="metric-value">{{ stats.due_for_review }}</strong>
            <p class="metric-note">词</p>
          </article>
        </div>

        <article class="board-card glass-surface">
          <div class="board-header">
            <div>
              <p class="board-label">算法分布</p>
              <h2 class="board-title">各算法学习量对比</h2>
            </div>
            <div v-if="topAlgorithm" class="top-algo-badge">
              <span class="top-algo-label">最多</span>
              <strong>{{ topAlgorithm.label }}</strong>
            </div>
          </div>

          <div v-if="algorithmSummary.length > 0" class="algorithm-table">
            <div v-for="item in algorithmSummary" :key="item.key" class="algorithm-row">
              <div class="algorithm-copy">
                <strong>{{ item.label }}</strong>
                <span>{{ item.learned }} 词</span>
              </div>
              <div class="algorithm-bar">
                <span :style="{ width: `${item.percent}%` }" />
              </div>
              <span class="algorithm-percent">{{ item.percent }}%</span>
            </div>
          </div>

          <div v-else class="empty-state">
            <p class="state-title">暂无算法数据</p>
            <p class="state-body">开始学习后将显示各算法的学习量分布。</p>
          </div>
        </article>
      </div>

      <aside class="insight-stack">
        <article v-if="topAlgorithm" class="insight-card insight-card--highlight glass-surface">
          <p class="board-label">主力算法</p>
          <strong class="insight-algo">{{ topAlgorithm.label }}</strong>
          <p class="insight-desc">已处理 {{ topAlgorithm.learned }} 词，是你最常用的复习策略。</p>
        </article>

        <article class="insight-card glass-surface">
          <p class="board-label">学习里程碑</p>
          <div class="milestone-list">
            <div
              v-for="m in [100, 500, 1000, 2000, 5000]"
              :key="m"
              class="milestone-item"
              :class="{ 'milestone-item--done': stats.total_learned >= m }"
            >
              <span class="milestone-dot" />
              <span class="milestone-label">{{ m }} 词</span>
              <span class="milestone-status">{{ stats.total_learned >= m ? '✓ 已达成' : `还差 ${m - stats.total_learned}` }}</span>
            </div>
          </div>
        </article>

        <article class="insight-card glass-surface">
          <p class="board-label">记忆健康度</p>
          <div class="health-row">
            <div class="health-item">
              <span class="health-label">连续打卡</span>
              <strong
                class="health-value"
                :class="stats.streak_days >= 7 ? 'health-value--good' : stats.streak_days >= 3 ? 'health-value--ok' : 'health-value--warn'"
              >{{ stats.streak_days >= 7 ? '优秀' : stats.streak_days >= 3 ? '良好' : '需加强' }}</strong>
            </div>
            <div class="health-item">
              <span class="health-label">复习队列</span>
              <strong
                class="health-value"
                :class="stats.due_for_review <= 20 ? 'health-value--good' : stats.due_for_review <= 50 ? 'health-value--ok' : 'health-value--warn'"
              >{{ stats.due_for_review <= 20 ? '清爽' : stats.due_for_review <= 50 ? '适中' : '积压中' }}</strong>
            </div>
            <div class="health-item">
              <span class="health-label">掌握深度</span>
              <strong
                class="health-value"
                :class="masteryPercent >= 60 ? 'health-value--good' : masteryPercent >= 30 ? 'health-value--ok' : 'health-value--warn'"
              >{{ masteryPercent >= 60 ? '扎实' : masteryPercent >= 30 ? '成长中' : '初学' }}</strong>
            </div>
          </div>
        </article>
      </aside>
    </section>
  </IOSAppShell>
</template>

<style scoped>
.date-chip,
.refresh-chip {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  background: var(--fill-quaternary);
  color: var(--label-secondary);
  font-size: 0.92rem;
  font-weight: 600;
}

.sidebar-card {
  padding: 16px;
  border-radius: 20px;
  background: var(--fill-quaternary);
  display: grid;
  gap: 4px;
}

.sidebar-label,
.hero-label,
.metric-label,
.board-label {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.sidebar-value { font-size: 1.4rem; letter-spacing: -0.03em; }
.sidebar-note, .hero-note, .state-body, .insight-desc {
  color: var(--label-secondary);
  font-size: 0.88rem;
  line-height: 1.55;
  margin: 0;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.hero-card {
  padding: 22px;
  border-radius: 28px;
  display: grid;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.hero-card--streak {
  background: linear-gradient(145deg, rgba(191, 90, 242, 0.2), rgba(10, 132, 255, 0.08)), var(--surface-primary);
}
.hero-card--completion {
  background: linear-gradient(145deg, rgba(48, 209, 88, 0.18), rgba(10, 132, 255, 0.06)), var(--surface-primary);
}
.hero-card--mastery {
  background: linear-gradient(145deg, rgba(255, 159, 10, 0.18), rgba(255, 59, 48, 0.06)), var(--surface-primary);
}

.hero-value {
  font-size: 2.4rem;
  line-height: 1;
  letter-spacing: -0.06em;
}

.streak-bar { display: flex; gap: 6px; }
.streak-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--fill-tertiary);
  transition: background 300ms ease;
}
.streak-dot--active { background: var(--accent-purple); }

.ring-wrap {
  position: absolute;
  right: 16px; top: 50%;
  transform: translateY(-50%);
  width: 52px; height: 52px;
  opacity: 0.75;
}
.ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--fill-tertiary); stroke-width: 5; }
.ring-fill {
  fill: none; stroke: var(--accent-green); stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dasharray 800ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mastery-bar {
  height: 6px; border-radius: 999px;
  background: var(--fill-tertiary); overflow: hidden;
}
.mastery-bar span {
  display: block; height: 100%; border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-orange), rgba(255, 59, 48, 0.8));
  transition: width 800ms cubic-bezier(0.22, 1, 0.36, 1);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.85fr);
  gap: 18px;
  align-items: start;
}

.main-col { display: grid; gap: 18px; }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.metric-card {
  min-height: 130px; padding: 20px;
  border-radius: 28px;
  display: grid; align-content: space-between;
}
.metric-card--blue { background: linear-gradient(145deg, rgba(10, 132, 255, 0.2), rgba(10, 132, 255, 0.06)); }
.metric-card--orange { background: linear-gradient(145deg, rgba(255, 159, 10, 0.22), rgba(255, 159, 10, 0.06)); }
.metric-value { font-size: 2.2rem; line-height: 1; letter-spacing: -0.05em; }
.metric-note { font-size: 0.82rem; color: var(--label-tertiary); margin: 0; }

.board-card { padding: 22px; border-radius: 28px; }
.board-header {
  display: flex; align-items: flex-end;
  justify-content: space-between; gap: 16px;
  margin-bottom: 18px;
}
.board-title { margin: 6px 0 0; font-size: 1.35rem; line-height: 1.15; letter-spacing: -0.03em; }

.top-algo-badge {
  display: grid; gap: 2px; text-align: right;
  font-size: 0.88rem;
}
.top-algo-label { font-size: 0.72rem; color: var(--label-tertiary); text-transform: uppercase; letter-spacing: 0.08em; }

.algorithm-table { display: grid; gap: 14px; }
.algorithm-row {
  display: grid;
  grid-template-columns: minmax(120px, 180px) minmax(0, 1fr) 48px;
  align-items: center; gap: 14px;
}
.algorithm-copy { display: grid; gap: 4px; }
.algorithm-copy span, .algorithm-percent { color: var(--label-secondary); font-size: 0.88rem; }
.algorithm-bar { height: 8px; border-radius: 999px; overflow: hidden; background: var(--fill-tertiary); }
.algorithm-bar span {
  display: block; height: 100%; border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-blue), rgba(191, 90, 242, 0.9));
  transition: width 600ms cubic-bezier(0.22, 1, 0.36, 1);
}

.insight-stack { display: grid; gap: 18px; }
.insight-card { padding: 22px; border-radius: 28px; }
.insight-card--highlight {
  background: linear-gradient(145deg, rgba(10, 132, 255, 0.16), rgba(191, 90, 242, 0.1)), var(--surface-primary);
}
.insight-algo { font-size: 1.6rem; letter-spacing: -0.04em; }

.milestone-list { display: grid; gap: 10px; margin-top: 14px; }
.milestone-item {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center; gap: 10px;
  opacity: 0.45;
  transition: opacity 200ms ease;
}
.milestone-item--done { opacity: 1; }
.milestone-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--fill-tertiary);
}
.milestone-item--done .milestone-dot { background: var(--accent-green); }
.milestone-label { font-size: 0.94rem; font-weight: 600; }
.milestone-status { font-size: 0.82rem; color: var(--label-tertiary); }
.milestone-item--done .milestone-status { color: var(--accent-green); }

.health-row { display: grid; gap: 10px; margin-top: 14px; }
.health-item {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface-elevated);
}
.health-label { font-size: 0.88rem; color: var(--label-secondary); }
.health-value { font-size: 0.92rem; font-weight: 700; }
.health-value--good { color: var(--accent-green); }
.health-value--ok { color: var(--accent-orange); }
.health-value--warn { color: var(--accent-red); }

.state-title { margin: 0; font-size: 1.08rem; font-weight: 600; }
.empty-state { min-height: 160px; display: grid; place-content: center; text-align: center; }

@media (max-width: 1180px) {
  .hero-grid, .dashboard-grid { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .hero-grid { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: 1fr; }
  .algorithm-row { grid-template-columns: 1fr; }
}
</style>