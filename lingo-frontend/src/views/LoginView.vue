<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const isLogin = ref(true)
const error = ref('')

async function submit() {
  if (!username.value || !password.value) {
    error.value = '请填写用户名和密码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const url = isLogin.value ? '/auth/login' : '/auth/register'
    const res = await api.post(url, { username: username.value, password: password.value })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('username', res.data.username)
    router.push('/wordbooks')
  } catch (err: any) {
    error.value = err.response?.data?.error || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-content">
      <!-- Logo -->
      <div class="logo-area">
        <div class="logo-icon">📖</div>
        <h1 class="app-name">Lingo</h1>
        <p class="app-desc">智能背单词，科学记忆</p>
      </div>

      <!-- Tab -->
      <div class="tab-bar">
        <button :class="['tab', isLogin && 'active']" @click="isLogin = true; error = ''">登录</button>
        <button :class="['tab', !isLogin && 'active']" @click="isLogin = false; error = ''">注册</button>
      </div>

      <!-- Form -->
      <div class="form-card">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" class="ios-input" autocomplete="username" />
        </div>
        <div class="divider" />
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="请输入密码" class="ios-input" @keyup.enter="submit" />
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="error-msg">{{ error }}</p>

      <!-- Submit -->
      <button class="submit-btn" :disabled="loading" @click="submit">
        <span v-if="!loading">{{ isLogin ? '登录' : '创建账号' }}</span>
        <span v-else class="loading-dots">···</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-content {
  width: 100%;
  max-width: 360px;
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 16px rgba(0,122,255,0.4));
}

.app-name {
  font-size: 36px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}

.app-desc {
  font-size: 15px;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.2px;
}

.tab-bar {
  display: flex;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 3px;
  margin-bottom: 16px;
}

.tab {
  flex: 1;
  padding: 9px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.6);
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.tab.active {
  background: rgba(255,255,255,0.15);
  color: #FFFFFF;
}

.form-card {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  margin-bottom: 12px;
}

.form-group {
  padding: 4px 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  margin-top: 10px;
}

.ios-input {
  width: 100%;
  background: transparent;
  border: none;
  padding: 6px 0 10px;
  font-size: 17px;
  font-family: inherit;
  color: #FFFFFF;
  outline: none;
}

.ios-input::placeholder {
  color: rgba(255,255,255,0.25);
}

.divider {
  height: 1px;
  background: rgba(255,255,255,0.08);
  margin: 0 16px;
}

.error-msg {
  color: #FF6B6B;
  font-size: 14px;
  text-align: center;
  margin-bottom: 12px;
}

.submit-btn {
  width: 100%;
  padding: 16px;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: -0.2px;
}

.submit-btn:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-dots {
  letter-spacing: 4px;
  font-size: 20px;
}
</style>
