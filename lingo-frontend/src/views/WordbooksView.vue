<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import AppIcon from '../components/AppIcon.vue'
import IOSAppShell from '../components/IOSAppShell.vue'
import { APP_TABS, STUDY_ALGORITHM_OPTIONS, ALGORITHM_LABELS } from '../constants/ui'
import type { StudyAlgorithm, WordbookSummary } from '../types/models'
import { readApiError } from '../utils/errors'

const LIMIT_OPTIONS = [5, 10, 15, 20, 30, 50]

interface WordbookTheme {
  tint: string
  surface: string
  shadow: string
}

interface DisplayWordbook extends WordbookSummary {
  hint: string
  indexLabel: string
  theme: WordbookTheme
  limit: number
  algorithm: StudyAlgorithm
}

interface DailySentence {
  content: string
  note: string
}

const router = useRouter()
const loading = ref(true)
const errorMessage = ref('')
const wordbooks = ref<WordbookSummary[]>([])
const username = localStorage.getItem('username') ?? '学习者'
const dailySentence = ref<DailySentence | null>(null)
const typedContent = ref('')
const typedNote = ref('')
const openLimitId = ref<number | null>(null)
const todayReviewed = ref(0)
const todayNew = ref(0)
const hardWords = ref<{ word: string; translation: string }[]>([])
let typeTimer: ReturnType<typeof setTimeout> | null = null

function startTypewriter(sentence: DailySentence): void {
  typedContent.value = ''
  typedNote.value = ''
  if (typeTimer) clearTimeout(typeTimer)

  let i = 0
  const content = sentence.content
  function typeChar() {
    if (i < content.length) {
      typedContent.value += content[i]
      i++
      typeTimer = setTimeout(typeChar, 38)
    } else {
      // 英文打完后淡入中文
      setTimeout(() => { typedNote.value = sentence.note }, 200)
    }
  }
  setTimeout(typeChar, 300)
}

const wordbookThemes: readonly WordbookTheme[] = [
  {
    tint: '#0A84FF',
    surface: 'linear-gradient(135deg, rgba(10, 132, 255, 0.24), rgba(10, 132, 255, 0.1))',
    shadow: 'rgba(10, 132, 255, 0.14)'
  },
  {
    tint: '#30D158',
    surface: 'linear-gradient(135deg, rgba(48, 209, 88, 0.22), rgba(48, 209, 88, 0.08))',
    shadow: 'rgba(48, 209, 88, 0.14)'
  },
  {
    tint: '#FF9F0A',
    surface: 'linear-gradient(135deg, rgba(255, 159, 10, 0.24), rgba(255, 159, 10, 0.08))',
    shadow: 'rgba(255, 159, 10, 0.14)'
  },
  {
    tint: '#BF5AF2',
    surface: 'linear-gradient(135deg, rgba(191, 90, 242, 0.22), rgba(191, 90, 242, 0.08))',
    shadow: 'rgba(191, 90, 242, 0.14)'
  }
]

function getWordbookLimit(id: number): number {
  return Number(localStorage.getItem(`wb-limit-${id}`) || 20)
}

function setWordbookLimit(id: number, limit: number): void {
  localStorage.setItem(`wb-limit-${id}`, String(limit))
  wordbooks.value = [...wordbooks.value]
}

function getWordbookAlgorithm(id: number): StudyAlgorithm {
  return (localStorage.getItem(`wb-algo-${id}`) as StudyAlgorithm) || 'sm2'
}

function setWordbookAlgorithm(id: number, algo: StudyAlgorithm): void {
  localStorage.setItem(`wb-algo-${id}`, algo)
  wordbooks.value = [...wordbooks.value]
}

const displayWordbooks = computed<DisplayWordbook[]>(() =>
  wordbooks.value.map((wordbook, index) => ({
    ...wordbook,
    hint: wordbook.description?.trim() || '点击进入一轮学习。',
    indexLabel: `Book ${String(index + 1).padStart(2, '0')}`,
    theme: wordbookThemes[index % wordbookThemes.length],
    limit: getWordbookLimit(wordbook.id),
    algorithm: getWordbookAlgorithm(wordbook.id)
  }))
)

async function loadWordbooks(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await api.get<WordbookSummary[]>('/wordbooks')
    wordbooks.value = response.data
  } catch (error) {
    errorMessage.value = readApiError(error, '无法加载词书，请稍后重试。')
  } finally {
    loading.value = false
  }
}

async function loadDailySentence(): Promise<void> {
  try {
    const res = await fetch('https://api.timelessq.com/english-sentence')
    const json = await res.json()
    if (json.errno === 0 && json.data) {
      const sentence = { content: json.data.content, note: json.data.note }
      dailySentence.value = sentence
      startTypewriter(sentence)
    }
  } catch {
    // 静默失败
  }
}

function openWordbook(id: number): void {
  localStorage.setItem('setting-limit', String(getWordbookLimit(id)))
  localStorage.setItem('setting-algorithm', getWordbookAlgorithm(id))
  void router.push({ name: 'study', params: { id } })
}

function logout(): void {
  localStorage.clear()
  void router.replace({ name: 'login' })
}

function toggleLimitPanel(id: number, e: Event): void {
  e.stopPropagation()
  openLimitId.value = openLimitId.value === id ? null : id
}

onMounted(() => {
  void loadWordbooks()
  void loadDailySentence()
  void loadTodayStats()
})

async function loadTodayStats(): Promise<void> {
  try {
    const [todayRes, hardRes] = await Promise.all([
      api.get<{ today_reviewed: number; today_new: number }>('/stats/today'),
      api.get<{ word: string; translation: string }[]>('/stats/hard-words')
    ])
    todayReviewed.value = todayRes.data.today_reviewed
    todayNew.value = todayRes.data.today_new
    hardWords.value = hardRes.data
  } catch {
    // 静默失败
  }
}
</script>

<template>
  <IOSAppShell
    large-title="词书工作区"
    subtitle="macOS 风格桌面布局"
    active-tab="wordbooks"
    :tabs="APP_TABS"
    content-key="wordbooks"
  >
    <template #nav-trailing>
      <button type="button" class="logout-button pressable" aria-label="退出登录" @click="logout">
        <AppIcon name="power" :size="17" />
      </button>
    </template>

    <template #sidebar-footer>
      <div class="profile-card">
        <p class="profile-label">当前账户</p>
        <strong class="profile-name">{{ username }}</strong>
        <span class="profile-note">桌面版学习空间</span>
      </div>
    </template>

    <template #hero>
      <div class="overview-grid">
        <article class="overview-card overview-card--primary glass-surface">
          <p class="overview-label">今日学习</p>
          <strong class="overview-value">{{ todayNew }}</strong>
          <p class="overview-note">今日新学 {{ todayNew }} 词，复习 {{ todayReviewed }} 词。</p>
        </article>

        <article class="overview-card glass-surface hard-words-card">
          <p class="overview-label">今日易错</p>
          <div v-if="hardWords.length > 0" class="hard-list">
            <div v-for="w in hardWords" :key="w.word" class="hard-item">
              <strong class="hard-word">{{ w.word }}</strong>
              <span class="hard-translation">{{ w.translation }}</span>
            </div>
          </div>
          <p v-else class="overview-note">暂无今日易错记录。</p>
        </article>
      </div>
    </template>

    <div v-if="loading" class="state-card glass-surface">
      <span class="ios-spinner" aria-hidden="true" />
      <p>正在同步你的词书。</p>
    </div>

    <div v-else-if="errorMessage" class="state-card glass-surface">
      <p class="state-title">载入失败</p>
      <p class="state-body">{{ errorMessage }}</p>
      <button type="button" class="ios-button ios-button--secondary pressable" @click="loadWordbooks">
        重新加载
      </button>
    </div>

    <section v-else class="workspace-grid">
      <article class="board-card glass-surface">
        <div class="board-header">
          <div>
            <p class="board-label">词书列表</p>
            <h2 class="board-title">选择一个词书开始学习</h2>
          </div>
          <span class="board-meta">{{ displayWordbooks.length }} 项</span>
        </div>

        <div v-if="displayWordbooks.length > 0" class="book-list">
          <div
            v-for="wordbook in displayWordbooks"
            :key="wordbook.id"
            class="book-row-wrap"
          >
            <button
              type="button"
              class="book-row pressable"
              @click="openWordbook(wordbook.id)"
            >
              <span
                class="book-badge"
                :style="{
                  background: wordbook.theme.surface,
                  color: wordbook.theme.tint,
                  boxShadow: `0 18px 28px ${wordbook.theme.shadow}`
                }"
              >
                <AppIcon name="books" :size="18" />
              </span>

              <span class="book-copy">
                <strong class="book-name">{{ wordbook.name }}</strong>
                <span class="book-description">{{ wordbook.hint }}</span>
              </span>

              <span class="book-meta">{{ wordbook.indexLabel }}</span>

              <!-- 每组卡片数设置按钮 -->
              <button
                type="button"
                class="limit-badge pressable"
                :style="{ color: wordbook.theme.tint, background: wordbook.theme.surface }"
                :aria-label="`设置 ${wordbook.name} 每组卡片数`"
                @click="toggleLimitPanel(wordbook.id, $event)"
              >
                {{ wordbook.limit }} 张
              </button>

              <span class="book-cta">开始</span>
            </button>

            <!-- 展开的设置面板 -->
            <Transition name="limit-drop">
              <div v-if="openLimitId === wordbook.id" class="limit-panel" @click.stop>
                <div class="limit-section">
                  <p class="limit-panel__label">每组卡片数</p>
                  <div class="limit-pills">
                    <button
                      v-for="n in LIMIT_OPTIONS"
                      :key="n"
                      type="button"
                      class="limit-pill pressable"
                      :class="{ 'limit-pill--active': wordbook.limit === n }"
                      @click="setWordbookLimit(wordbook.id, n)"
                    >
                      {{ n }}
                    </button>
                  </div>
                </div>
                <div class="limit-divider" />
                <div class="limit-section">
                  <p class="limit-panel__label">学习曲线算法</p>
                  <div class="algo-pills">
                    <button
                      v-for="opt in STUDY_ALGORITHM_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="limit-pill pressable"
                      :class="{ 'limit-pill--active': wordbook.algorithm === opt.value }"
                      @click="setWordbookAlgorithm(wordbook.id, opt.value as StudyAlgorithm)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div v-else class="empty-state">
          <p class="state-title">还没有词书</p>
          <p class="state-body">后端返回数据后，这里会按桌面列表视图展示全部词书。</p>
        </div>
      </article>

      <aside class="inspector-stack">
        <!-- 每日一句 -->
        <article class="inspector-card glass-surface daily-card">
          <p class="board-label">每日一句</p>
          <div v-if="dailySentence" class="daily-sentence">
            <p class="daily-content">
              {{ typedContent }}<span v-if="typedContent.length < (dailySentence?.content.length ?? 0)" class="daily-cursor" />
            </p>
            <Transition name="note-fade">
              <p v-if="typedNote" class="daily-note">{{ typedNote }}</p>
            </Transition>
          </div>
          <div v-else class="daily-loading">
            <span class="ios-spinner" aria-hidden="true" />
          </div>
        </article>

        <article class="inspector-card glass-surface">
          <p class="board-label">快速入口</p>
          <button
            v-if="displayWordbooks[0]"
            type="button"
            class="quick-start pressable"
            @click="openWordbook(displayWordbooks[0].id)"
          >
            <span>继续最近词书</span>
            <strong>{{ displayWordbooks[0].name }}</strong>
          </button>
          <p v-else class="state-body">当前没有可直接进入的词书。</p>
        </article>
      </aside>
    </section>
  </IOSAppShell>
</template>

<style scoped>
.logout-button {
  width: 42px;
  min-height: 40px;
  padding: 0;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--fill-quaternary);
  color: var(--label-secondary);
}

.profile-card {
  padding: 16px;
  border-radius: 20px;
  background: var(--fill-quaternary);
  display: grid;
  gap: 4px;
}

.profile-label,
.overview-label,
.board-label {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.profile-name {
  font-size: 1rem;
}

.profile-note,
.overview-note,
.state-body,
.book-description {
  color: var(--label-secondary);
  line-height: 1.5;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.overview-card {
  min-height: 168px;
  padding: 22px;
  border-radius: 26px;
  display: grid;
  align-content: space-between;
}

.overview-card--primary {
  background:
    linear-gradient(140deg, rgba(10, 132, 255, 0.24), rgba(10, 132, 255, 0.08)),
    var(--surface-primary);
}

.hard-words-card {
  background:
    linear-gradient(140deg, rgba(255, 59, 48, 0.12), rgba(255, 159, 10, 0.06)),
    var(--surface-primary);
}

.hard-list {
  display: grid;
  gap: 8px;
  margin-top: 4px;
}

.hard-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 59, 48, 0.07);
}

.hard-word {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-red);
  flex-shrink: 0;
}

.hard-translation {
  font-size: 0.88rem;
  color: var(--label-secondary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview-value {
  font-size: 2.1rem;
  line-height: 1;
  letter-spacing: -0.05em;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.9fr);
  gap: 18px;
}

.board-card,
.inspector-card {
  padding: 22px;
  border-radius: 28px;
}

.board-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.board-title {
  margin: 6px 0 0;
  font-size: 1.45rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.board-meta {
  color: var(--label-tertiary);
  font-size: 0.88rem;
  font-weight: 600;
}

.book-list {
  display: grid;
  gap: 10px;
}

.book-row-wrap {
  display: grid;
  gap: 0;
}

.book-row {
  width: 100%;
  min-height: 92px;
  padding: 16px 18px;
  border-radius: 22px;
  background: var(--surface-elevated);
  border: 1px solid var(--separator-soft);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 14px;
  transition: border-radius 200ms ease;
}

.book-row-wrap:has(.limit-panel) .book-row {
  border-radius: 22px 22px 0 0;
}

.book-badge {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.book-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.book-name {
  font-size: 1.02rem;
}

.book-description {
  font-size: 0.92rem;
}

.book-meta {
  color: var(--label-tertiary);
  font-size: 0.82rem;
  font-weight: 600;
}

.limit-badge {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
}

.book-cta {
  min-width: 64px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-grid;
  place-items: center;
  background: rgba(10, 132, 255, 0.1);
  color: var(--accent-blue);
  font-size: 0.88rem;
  font-weight: 700;
}

/* 每组卡片数面板 */
.limit-panel {
  padding: 14px 18px;
  background: var(--surface-elevated);
  border: 1px solid var(--separator-soft);
  border-top: none;
  border-radius: 0 0 22px 22px;
  display: grid;
  gap: 10px;
}

.limit-panel__label {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.limit-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.limit-pill {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
  background: var(--fill-quaternary);
  color: var(--label-secondary);
  border: 1px solid transparent;
  transition: background 180ms ease, color 180ms ease;
}

.limit-pill--active {
  background: rgba(10, 132, 255, 0.12);
  color: var(--accent-blue);
  border-color: rgba(10, 132, 255, 0.25);
}

.limit-drop-enter-active {
  transition: opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.limit-drop-leave-active {
  transition: opacity 160ms ease, transform 180ms ease;
}
.limit-drop-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.limit-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.limit-divider {
  height: 1px;
  background: var(--separator-soft);
  margin: 4px 0;
}

.limit-section {
  display: grid;
  gap: 10px;
}

.algo-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 每日一句特效 */
.daily-card {
  position: relative;
  overflow: hidden;
}

.daily-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(10, 132, 255, 0.06), rgba(191, 90, 242, 0.06));
  pointer-events: none;
}

.daily-sentence {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.daily-content {
  margin: 0;
  font-size: 1rem;
  line-height: 1.75;
  color: var(--label-primary);
  font-style: italic;
  letter-spacing: 0.01em;
}

.daily-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--accent-blue);
  margin-left: 2px;
  vertical-align: text-bottom;
  border-radius: 1px;
  animation: blink 800ms steps(1) infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.daily-note {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--label-secondary);
  padding-top: 10px;
  border-top: 1px solid var(--separator-soft);
}

.note-fade-enter-active {
  transition: opacity 600ms ease, transform 600ms cubic-bezier(0.22, 1, 0.36, 1);
}
.note-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.daily-loading {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--label-tertiary);
  font-size: 0.9rem;
}

.inspector-stack {
  display: grid;
  gap: 18px;
  align-content: start;
}

.quick-start {
  width: 100%;
  margin-top: 14px;
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(10, 132, 255, 0.1);
  color: var(--accent-blue);
  display: grid;
  gap: 6px;
  text-align: left;
}

.state-title {
  font-size: 1.08rem;
  font-weight: 600;
}

.empty-state {
  min-height: 240px;
  display: grid;
  place-content: center;
  text-align: center;
}

@media (max-width: 1180px) {
  .overview-grid,
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .book-row {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
  }

  .book-meta {
    display: none;
  }
}
</style>
