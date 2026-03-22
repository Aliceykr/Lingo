<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isDark = ref(false)
const pulling = ref(false)

// 位置状态，right/top 单位 px
const pos = ref({ right: 28, top: 0 })
const dragging = ref(false)

let dragStartX = 0
let dragStartY = 0
let startRight = 28
let startTop = 0
let movedEnough = false

function applyTheme(dark: boolean) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme(isDark.value)

  const savedPos = localStorage.getItem('theme-toggle-pos')
  if (savedPos) {
    try {
      pos.value = JSON.parse(savedPos)
    } catch {}
  }
})

function onPointerDown(e: PointerEvent) {
  dragging.value = true
  movedEnough = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  startRight = pos.value.right
  startTop = pos.value.top
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedEnough = true
  const newRight = Math.max(8, Math.min(window.innerWidth - 60, startRight - dx))
  const newTop = Math.max(0, Math.min(window.innerHeight - 80, startTop + dy))
  pos.value = { right: newRight, top: newTop }
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  localStorage.setItem('theme-toggle-pos', JSON.stringify(pos.value))
}

function onClick() {
  if (movedEnough || pulling.value) return
  pulling.value = true
  setTimeout(() => {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    pulling.value = false
  }, 320)
}

onUnmounted(() => {
  // pointer capture 自动释放，无需额外清理
})
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :class="{
      'theme-toggle--dark': isDark,
      'theme-toggle--pulling': pulling,
      'theme-toggle--dragging': dragging
    }"
    :style="{ right: pos.right + 'px', top: pos.top + 'px' }"
    :aria-label="isDark ? '切换为浅色模式' : '切换为深色模式'"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @click="onClick"
  >
    <!-- 绳子 -->
    <span class="toggle-rope">
      <span class="toggle-rope__line" />
      <span class="toggle-rope__knot" />
    </span>

    <!-- 灯泡外壳 -->
    <span class="toggle-bulb">
      <span class="toggle-glow" />
      <svg class="toggle-filament" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3C8.5 3 6 5.8 6 9c0 2.1 1 3.9 2.5 5H15.5C17 12.9 18 11.1 18 9c0-3.2-2.5-6-6-6Z" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 0;
  right: 28px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  border: none;
  cursor: grab;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: none;
}

.theme-toggle--dragging {
  cursor: grabbing;
}

/* ── 绳子 ── */
.toggle-rope {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.toggle-rope__line {
  width: 2px;
  height: 28px;
  border-radius: 999px;
  background: var(--label-tertiary);
  transition:
    height 320ms cubic-bezier(0.32, 0.72, 0, 1),
    background 300ms ease;
}

.toggle-rope__knot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--label-tertiary);
  margin-top: -1px;
  transition: background 300ms ease;
}

.theme-toggle--pulling .toggle-rope__line {
  height: 44px;
}

.theme-toggle--pulling .toggle-rope__line,
.theme-toggle--pulling .toggle-rope__knot {
  background: var(--accent-blue);
}

/* ── 灯泡 ── */
.toggle-bulb {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--surface-elevated);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-card);
  transition:
    background 300ms ease,
    box-shadow 300ms ease,
    transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
}

.theme-toggle--pulling .toggle-bulb {
  transform: translateY(10px);
}

.theme-toggle:not(.theme-toggle--pulling) .toggle-bulb {
  transition:
    background 300ms ease,
    box-shadow 300ms ease,
    transform 420ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* 拖动时灯泡略微缩放提示 */
.theme-toggle--dragging .toggle-bulb {
  transform: scale(1.08);
  box-shadow:
    var(--shadow-card),
    0 0 0 3px rgba(10, 132, 255, 0.22);
}

/* ── 光晕 ── */
.toggle-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 220, 80, 0.0), transparent 70%);
  transition: background 400ms ease;
  pointer-events: none;
}

.theme-toggle--dark .toggle-glow {
  background: radial-gradient(circle, rgba(255, 220, 80, 0.55), transparent 70%);
}

/* ── 灯丝图标 ── */
.toggle-filament {
  width: 22px;
  height: 22px;
  color: var(--label-tertiary);
  transition: color 300ms ease;
  position: relative;
  z-index: 1;
}

.theme-toggle--dark .toggle-filament {
  color: #ffd54f;
}

.theme-toggle--dark .toggle-bulb {
  background: rgba(255, 214, 0, 0.18);
  box-shadow:
    var(--shadow-card),
    0 0 24px rgba(255, 210, 0, 0.32);
}
</style>
