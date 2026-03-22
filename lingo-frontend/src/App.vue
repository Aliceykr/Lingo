<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import ThemeToggle from './components/ThemeToggle.vue'

const route = useRoute()
</script>

<template>
  <div class="app-root">
    <div class="app-ambient app-ambient--violet" />
    <div class="app-ambient app-ambient--cyan" />

    <ThemeToggle />

    <RouterView v-slot="{ Component }">
      <Transition name="workspace-switch" mode="out-in">
        <component :is="Component" :key="route.name" />
      </Transition>
    </RouterView>
  </div>
</template>

<style scoped>
.app-root {
  position: relative;
  min-height: 100dvh;
  isolation: isolate;
}

.app-ambient {
  position: fixed;
  border-radius: 999px;
  filter: blur(72px);
  opacity: 0.72;
  pointer-events: none;
  z-index: -1;
}

.app-ambient--violet {
  top: -8rem;
  right: -6rem;
  width: 16rem;
  height: 16rem;
  background: rgba(110, 173, 255, 0.22);
}

.app-ambient--cyan {
  bottom: 5rem;
  left: -7rem;
  width: 18rem;
  height: 18rem;
  background: rgba(84, 184, 255, 0.2);
}

@media (prefers-color-scheme: dark) {
  .app-ambient--violet {
    background: rgba(10, 132, 255, 0.2);
  }

  .app-ambient--cyan {
    background: rgba(94, 92, 230, 0.16);
  }
}

/* 路由切换：只让 workspace 右侧内容动，侧边栏通过 will-change 隔离 */
.workspace-switch-enter-active {
  transition:
    opacity 460ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 500ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.workspace-switch-leave-active {
  transition:
    opacity 220ms cubic-bezier(0.4, 0, 1, 1),
    transform 240ms cubic-bezier(0.4, 0, 1, 1),
    filter 200ms ease;
  pointer-events: none;
}

.workspace-switch-enter-active :deep(.workspace) {
  transition: inherit;
}

.workspace-switch-enter-from :deep(.workspace) {
  opacity: 0;
  transform: translateY(32px) scale(0.96);
  filter: blur(8px) saturate(0.5);
}

.workspace-switch-leave-to :deep(.workspace) {
  opacity: 0;
  transform: translateY(-14px) scale(0.97);
  filter: blur(6px) saturate(0.4);
}

.workspace-switch-enter-from,
.workspace-switch-leave-to {
  opacity: 1;
  transform: none;
  filter: none;
}</style>
