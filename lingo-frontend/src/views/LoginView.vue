<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import AppIcon from '../components/AppIcon.vue'
import IOSSegmentedControl from '../components/IOSSegmentedControl.vue'
import { AUTH_MODE_OPTIONS } from '../constants/ui'
import type { AuthMode, AuthResponse } from '../types/models'
import { readApiError } from '../utils/errors'

interface AuthFormState {
  username: string
  password: string
}

const router = useRouter()
const mode = ref<AuthMode>('login')
const loading = ref(false)
const errorMessage = ref('')
const form = reactive<AuthFormState>({
  username: '',
  password: ''
})

const titleText = computed(() => (mode.value === 'login' ? '登录 Lingo' : '创建账户'))
const actionText = computed(() => (mode.value === 'login' ? '继续' : '创建账户'))
const helperText = computed(() =>
  mode.value === 'login'
    ? '使用你的词书继续今天的学习节奏。'
    : '创建一个新账户，开始建立你的记忆系统。'
)

watch(mode, () => {
  errorMessage.value = ''
})

async function submit(): Promise<void> {
  if (!form.username.trim() || !form.password.trim()) {
    errorMessage.value = '请输入用户名和密码。'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const endpoint = mode.value === 'login' ? '/auth/login' : '/auth/register'
    const response = await api.post<AuthResponse>(endpoint, {
      username: form.username.trim(),
      password: form.password
    })

    localStorage.setItem('token', response.data.token)
    localStorage.setItem('username', response.data.username)
    await router.replace({ name: 'wordbooks' })
  } catch (error) {
    errorMessage.value = readApiError(error, '暂时无法完成认证，请稍后重试。')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-brand glass-surface">
      <div class="traffic-lights" aria-hidden="true">
        <span class="traffic-light traffic-light--red" />
        <span class="traffic-light traffic-light--yellow" />
        <span class="traffic-light traffic-light--green" />
      </div>

      <div class="brand-hero">
        <span class="brand-mark-lg">
          <AppIcon name="sparkles" :size="28" />
        </span>
        <p class="brand-kicker">Language Memory OS</p>
        <h1 class="brand-title">Lingo</h1>
        <p class="brand-desc">以 macOS 桌面风格组织单词学习、回忆与间隔复习。</p>
      </div>

      <ul class="feature-list">
        <li>
          <span class="feature-dot feature-dot--blue" />
          SM-2 间隔复习算法，科学安排每日复习队列
        </li>
        <li>
          <span class="feature-dot feature-dot--green" />
          多词书管理，随时切换学习目标
        </li>
        <li>
          <span class="feature-dot feature-dot--purple" />
          统计看板，追踪连续天数与算法分布
        </li>
      </ul>

      <p class="brand-footnote">系统字体 · 毛玻璃层次 · 连续圆角 · 接近原生 App 的交互触感</p>
    </div>

    <!-- 右侧表单区 -->
    <div class="auth-form-wrap">
      <div class="auth-panel glass-surface">
        <IOSSegmentedControl
          v-model="mode"
          :options="AUTH_MODE_OPTIONS"
          aria-label="切换登录或注册"
        />

        <section class="auth-copy">
          <h2 class="auth-title">{{ titleText }}</h2>
          <p class="auth-subtitle">{{ helperText }}</p>
        </section>

        <div class="inset-group form-group">
          <label class="field-row">
            <span class="field-label">用户名</span>
            <input
              v-model="form.username"
              type="text"
              class="field-input"
              placeholder="输入用户名"
              autocomplete="username"
            />
          </label>

          <label class="field-row">
            <span class="field-label">密码</span>
            <input
              v-model="form.password"
              type="password"
              class="field-input"
              placeholder="输入密码"
              autocomplete="current-password"
              @keyup.enter="submit"
            />
          </label>
        </div>

        <p v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </p>

        <button
          type="button"
          class="ios-button ios-button--primary submit-button pressable"
          :disabled="loading"
          @click="submit"
        >
          {{ loading ? '处理中...' : actionText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── 页面容器 ── */
.auth-page {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 18px;
  gap: 18px;
}

/* ── 左侧品牌栏 ── */
.auth-brand {
  border-radius: 30px;
  padding: 28px;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 0;
}

.traffic-lights {
  display: inline-flex;
  gap: 8px;
  margin-bottom: 0;
}

.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35);
}

.traffic-light--red   { background: #ff5f57; }
.traffic-light--yellow{ background: #febc2e; }
.traffic-light--green { background: #28c840; }

.brand-hero {
  display: grid;
  gap: 0.55rem;
  align-self: center;
  padding: 2rem 0;
}

.brand-mark-lg {
  width: 4rem;
  height: 4rem;
  display: inline-grid;
  place-items: center;
  border-radius: 1.375rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.34)),
    rgba(10, 132, 255, 0.14);
  color: var(--accent-blue);
  box-shadow: 0 20px 36px rgba(10, 132, 255, 0.2);
}

.brand-kicker {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--label-tertiary);
  margin: 0.8rem 0 0;
}

.brand-title {
  font-size: clamp(2.4rem, 4vw, 3.6rem);
  line-height: 1.0;
  letter-spacing: -0.05em;
  margin: 0;
}

.brand-desc {
  max-width: 22rem;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--label-secondary);
  margin: 0;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
  align-self: end;
  padding-bottom: 2rem;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.94rem;
  color: var(--label-secondary);
  line-height: 1.5;
}

.feature-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.feature-dot--blue   { background: var(--accent-blue); }
.feature-dot--green  { background: var(--accent-green); }
.feature-dot--purple { background: var(--accent-purple); }

.brand-footnote {
  font-size: 0.82rem;
  line-height: 1.55;
  color: var(--label-quaternary);
  margin: 0;
}

/* ── 右侧表单区 ── */
.auth-form-wrap {
  display: grid;
  place-items: center;
}

.auth-panel {
  width: min(100%, 420px);
  padding: 28px;
  border-radius: 30px;
}

.auth-copy {
  display: grid;
  gap: 0.35rem;
  margin: 1.4rem 0 1rem;
}

.auth-title {
  font-size: 1.65rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0;
}

.auth-subtitle {
  font-size: 0.98rem;
  line-height: 1.55;
  color: var(--label-secondary);
  margin: 0;
}

.form-group {
  margin-top: 1rem;
}

.field-row {
  display: grid;
  gap: 0.45rem;
  padding: 0.9rem 1.125rem;
}

.field-row + .field-row {
  border-top: 1px solid var(--separator-soft);
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.field-input {
  width: 100%;
  font-size: var(--type-body);
  line-height: 1.3;
}

.error-banner {
  margin-top: 0.9rem;
  padding: 0.8rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 59, 48, 0.12);
  color: var(--accent-red);
  font-size: 0.92rem;
}

.submit-button {
  width: 100%;
  margin-top: 1rem;
}

/* ── 响应式：中等屏幕 ── */
@media (max-width: 900px) {
  .auth-page {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    padding: 14px;
    gap: 14px;
  }

  .auth-brand {
    grid-template-rows: auto auto;
    padding: 22px 24px;
    min-height: unset;
  }

  .brand-hero {
    padding: 1.2rem 0 0;
  }

  .feature-list {
    display: none;
  }

  .brand-footnote {
    display: none;
  }

  .auth-form-wrap {
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
  }
}

/* ── 响应式：小屏手机 ── */
@media (max-width: 560px) {
  .auth-brand {
    border-radius: 22px;
    padding: 18px 20px;
  }

  .auth-panel {
    border-radius: 22px;
    padding: 20px;
  }

  .brand-title {
    font-size: 2rem;
  }
}

/* ── 暗色模式 ── */
@media (prefers-color-scheme: dark) {
  .brand-mark-lg {
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.04)),
      rgba(10, 132, 255, 0.24);
    box-shadow: 0 20px 38px rgba(10, 132, 255, 0.24);
  }

  .error-banner {
    background: rgba(255, 69, 58, 0.16);
  }
}
</style>
