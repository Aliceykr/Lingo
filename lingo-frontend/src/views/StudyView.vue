<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import AppIcon from '../components/AppIcon.vue'
import IOSAppShell from '../components/IOSAppShell.vue'
import IOSSegmentedControl from '../components/IOSSegmentedControl.vue'
import { ALGORITHM_LABELS, APP_TABS, STUDY_ALGORITHM_OPTIONS } from '../constants/ui'
import type { StudyAlgorithm, StudyWord } from '../types/models'
import { readApiError } from '../utils/errors'

const route = useRoute()
const router = useRouter()

const words = ref<StudyWord[]>([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const loading = ref(true)
const submitting = ref(false)
const done = ref(false)
const errorMessage = ref('')
const algorithm = ref<StudyAlgorithm>(
  (localStorage.getItem('setting-algorithm') as StudyAlgorithm) || 'sm2'
)

let loadVersion = 0

const wordbookId = computed(() => String(route.params.id ?? ''))
const currentWord = computed(() => words.value[currentIndex.value] ?? null)
const algorithmLabel = computed(() => ALGORITHM_LABELS[algorithm.value])
const progressPercent = computed(() => {
  if (words.value.length === 0) {
    return done.value ? 100 : 0
  }

  const completedCount = done.value ? words.value.length : currentIndex.value
  return Math.round((completedCount / words.value.length) * 100)
})

const reviewedCount = computed(() => (done.value ? words.value.length : currentIndex.value))

async function loadWords(): Promise<void> {
  const version = ++loadVersion
  loading.value = true
  submitting.value = false
  showAnswer.value = false
  currentIndex.value = 0
  done.value = false
  errorMessage.value = ''

  const limit = Number(localStorage.getItem('setting-limit') || 20)

  try {
    const response = await api.get<StudyWord[]>(`/wordbooks/${wordbookId.value}/study`, {
      params: {
        algorithm: algorithm.value,
        limit
      }
    })

    if (version !== loadVersion) {
      return
    }

    words.value = response.data
    done.value = response.data.length === 0
  } catch (error) {
    if (version !== loadVersion) {
      return
    }

    errorMessage.value = readApiError(error, '当前学习批次无法加载，请稍后重试。')
  } finally {
    if (version === loadVersion) {
      loading.value = false
    }
  }
}

async function review(quality: number): Promise<void> {
  if (submitting.value || !currentWord.value) {
    return
  }

  submitting.value = true

  try {
    await api.post(`/words/${currentWord.value.id}/review`, {
      algorithm: algorithm.value,
      quality
    })

    if (currentIndex.value < words.value.length - 1) {
      currentIndex.value += 1
      showAnswer.value = false
      errorMessage.value = ''
    } else {
      done.value = true
    }
  } catch (error) {
    errorMessage.value = readApiError(error, '提交复习结果失败，请重试。')
  } finally {
    submitting.value = false
  }
}

watch([wordbookId, algorithm], () => {
  void loadWords()
}, { immediate: true })
</script>

<template>
  <IOSAppShell
    large-title="学习桌面"
    :subtitle="algorithmLabel"
    active-tab="wordbooks"
    :tabs="APP_TABS"
    :content-key="'study-' + wordbookId"
  >
    <template #nav-leading>
      <button type="button" class="back-chip pressable" @click="router.push({ name: 'wordbooks' })">
        <AppIcon name="chevron-left" :size="16" />
        <span>返回词书</span>
      </button>
    </template>

    <template #nav-trailing>
      <button type="button" class="refresh-chip pressable" @click="loadWords">
        重新取卡
      </button>
    </template>

    <template #sidebar-footer>
      <div class="session-footer">
        <p class="session-footer__label">当前算法</p>
        <strong>{{ algorithmLabel }}</strong>
        <span>{{ reviewedCount }} / {{ words.length || 20 }} 已完成</span>
      </div>
    </template>

    <template #hero>
      <div class="hero-grid">
        <article class="hero-card glass-surface">
          <p class="hero-label">学习进度</p>
          <strong class="hero-value">{{ progressPercent }}%</strong>
          <div class="hero-progress">
            <span :style="{ width: `${progressPercent}%` }" />
          </div>
        </article>

        <article class="hero-card glass-surface hero-card--wide">
          <p class="hero-label">复习算法</p>
          <IOSSegmentedControl
            v-model="algorithm"
            :options="STUDY_ALGORITHM_OPTIONS"
            :compact="true"
            aria-label="选择复习算法"
          />
        </article>
      </div>
    </template>

    <div v-if="loading" class="state-card glass-surface">
      <span class="ios-spinner" aria-hidden="true" />
      <p>正在准备学习卡片。</p>
    </div>

    <div v-else-if="errorMessage && !currentWord && !done" class="state-card glass-surface">
      <p class="state-title">学习批次不可用</p>
      <p class="state-body">{{ errorMessage }}</p>
      <button type="button" class="ios-button ios-button--secondary pressable" @click="loadWords">
        重新加载
      </button>
    </div>

    <div v-else-if="done" class="state-card glass-surface completion-card">
      <p class="state-label">Session Complete</p>
      <h2 class="state-title">今天的复习已经结束</h2>
      <p class="state-body">桌面模式下建议直接切去统计页查看本轮完成情况。</p>
      <div class="completion-actions">
        <button type="button" class="ios-button ios-button--secondary pressable" @click="loadWords">
          再来一组
        </button>
        <button type="button" class="ios-button ios-button--primary pressable" @click="router.push({ name: 'stats' })">
          查看统计
        </button>
      </div>
    </div>

    <section v-else class="study-layout">
      <aside class="study-inspector glass-surface">
        <div class="inspector-block">
          <p class="state-label">当前状态</p>
          <div class="inspector-metrics">
            <div>
              <span>已完成</span>
              <strong>{{ reviewedCount }}</strong>
            </div>
            <div>
              <span>剩余</span>
              <strong>{{ Math.max(words.length - reviewedCount, 0) }}</strong>
            </div>
          </div>
        </div>

        <div class="inspector-block">
          <p class="state-label">操作顺序</p>
          <ol class="instruction-list">
            <li>先阅读单词，在脑内完成回忆。</li>
            <li>点击显示释义，确认答案是否匹配。</li>
            <li>根据熟悉程度选择右侧按钮提交。</li>
          </ol>
        </div>

        <div class="inspector-block">
          <p class="state-label">评分说明</p>
          <div class="grade-guide">
            <span class="grade grade--danger">没想起来</span>
            <span class="grade grade--warning">有点模糊</span>
            <span class="grade grade--success">记住了</span>
          </div>
        </div>
      </aside>

      <div class="study-stage">
        <article class="flashcard glass-surface">
          <p class="flashcard-label">{{ showAnswer ? '释义' : '单词' }}</p>
          <h2 class="flashcard-word">{{ currentWord?.word }}</h2>

          <Transition name="answer-fade" mode="out-in">
            <p v-if="showAnswer" key="translation" class="flashcard-translation">
              {{ currentWord?.translation }}
            </p>
            <p v-else key="hint" class="flashcard-hint">
              在桌面端，建议先完整思考 2 到 3 秒，再翻面确认。
            </p>
          </Transition>
        </article>

        <p v-if="errorMessage" class="inline-error">{{ errorMessage }}</p>

        <button
          v-if="!showAnswer"
          type="button"
          class="ios-button ios-button--primary reveal-button pressable"
          @click="showAnswer = true"
        >
          显示释义
        </button>

        <div v-else class="review-row">
          <button
            type="button"
            class="review-button review-button--danger pressable"
            :disabled="submitting"
            @click="review(1)"
          >
            <AppIcon name="xmark-circle" :size="20" />
            <span>没想起来</span>
          </button>

          <button
            type="button"
            class="review-button review-button--warning pressable"
            :disabled="submitting"
            @click="review(3)"
          >
            <AppIcon name="question-circle" :size="20" />
            <span>有点模糊</span>
          </button>

          <button
            type="button"
            class="review-button review-button--success pressable"
            :disabled="submitting"
            @click="review(5)"
          >
            <AppIcon name="check-circle" :size="20" />
            <span>记住了</span>
          </button>
        </div>
      </div>
    </section>
  </IOSAppShell>
</template>

<style scoped>
.back-chip,
.refresh-chip {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--fill-quaternary);
  color: var(--label-secondary);
  font-size: 0.92rem;
  font-weight: 600;
}

.session-footer {
  padding: 16px;
  border-radius: 20px;
  background: var(--fill-quaternary);
  display: grid;
  gap: 4px;
}

.session-footer__label,
.hero-label,
.state-label {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.session-footer span,
.state-body,
.flashcard-hint,
.flashcard-translation {
  color: var(--label-secondary);
  line-height: 1.6;
}

.hero-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
}

.hero-card {
  padding: 20px 22px;
  border-radius: 26px;
  display: grid;
  gap: 14px;
}

.hero-card--wide {
  align-content: center;
}

.hero-value {
  font-size: 2rem;
  line-height: 1;
  letter-spacing: -0.05em;
}

.hero-progress {
  height: 8px;
  border-radius: 999px;
  background: var(--fill-tertiary);
  overflow: hidden;
}

.hero-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-blue), rgba(94, 92, 230, 0.92));
  transition: width 380ms var(--ease-spring);
}

.study-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 18px;
}

.study-inspector,
.flashcard {
  border-radius: 28px;
}

.study-inspector {
  padding: 22px;
  display: grid;
  align-content: start;
  gap: 22px;
}

.inspector-metrics {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.inspector-metrics div {
  padding: 14px;
  border-radius: 18px;
  background: var(--surface-elevated);
  display: grid;
  gap: 4px;
}

.inspector-metrics span {
  color: var(--label-tertiary);
  font-size: 0.82rem;
}

.inspector-metrics strong {
  font-size: 1.35rem;
}

.instruction-list {
  margin: 12px 0 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
  color: var(--label-secondary);
  line-height: 1.55;
}

.grade-guide {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.grade {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 0.88rem;
  font-weight: 700;
}

.grade--danger {
  background: rgba(255, 59, 48, 0.12);
  color: var(--accent-red);
}

.grade--warning {
  background: rgba(255, 159, 10, 0.12);
  color: var(--accent-orange);
}

.grade--success {
  background: rgba(48, 209, 88, 0.12);
  color: var(--accent-green);
}

.study-stage {
  display: grid;
  gap: 16px;
}

.flashcard {
  min-height: 440px;
  padding: 40px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 18px;
  text-align: center;
}

.flashcard-label {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.flashcard-word {
  margin: 0;
  font-size: clamp(3rem, 5vw, 4.4rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.flashcard-translation,
.flashcard-hint {
  max-width: 32rem;
  margin: 0;
  font-size: 1.05rem;
}

.reveal-button {
  width: fit-content;
  min-width: 180px;
}

.review-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.review-button {
  min-height: 72px;
  padding: 0 18px;
  border-radius: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  font-size: 0.94rem;
  font-weight: 700;
}

.review-button--danger {
  background: linear-gradient(180deg, rgba(255, 107, 97, 0.96), rgba(255, 59, 48, 0.92));
}

.review-button--warning {
  background: linear-gradient(180deg, rgba(255, 184, 73, 0.96), rgba(255, 159, 10, 0.92));
}

.review-button--success {
  background: linear-gradient(180deg, rgba(52, 199, 89, 0.96), rgba(48, 209, 88, 0.92));
}

.inline-error {
  margin: 0;
  color: var(--accent-red);
}

.state-title {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.15;
}

.completion-card {
  gap: 12px;
}

.completion-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.answer-fade-enter-active,
.answer-fade-leave-active {
  transition:
    transform 260ms var(--ease-spring),
    opacity 220ms var(--ease-spring);
}

.answer-fade-enter-from,
.answer-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1180px) {
  .hero-grid,
  .study-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .review-row {
    grid-template-columns: 1fr;
  }

  .flashcard {
    padding: 28px 20px;
  }
}
</style>
