<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'
import type { AppTabItem } from '../types/models'

interface IOSAppShellProps {
  largeTitle: string
  inlineTitle?: string
  subtitle?: string
  showTabBar?: boolean
  activeTab?: string
  tabs?: readonly AppTabItem[]
  contentKey?: string
}

withDefaults(defineProps<IOSAppShellProps>(), {
  inlineTitle: undefined,
  subtitle: undefined,
  showTabBar: false,
  activeTab: undefined,
  tabs: () => [],
  contentKey: undefined
})
</script>

<template>
  <div class="desktop-shell">
    <aside v-if="tabs.length > 0" class="sidebar glass-surface">
      <div class="sidebar-top">
        <div class="traffic-lights" aria-hidden="true">
          <span class="traffic-light traffic-light--red" />
          <span class="traffic-light traffic-light--yellow" />
          <span class="traffic-light traffic-light--green" />
        </div>

        <div class="brand-lockup">
          <span class="brand-mark">
            <AppIcon name="sparkles" :size="18" />
          </span>
          <div class="brand-copy">
            <strong>Lingo</strong>
            <span>Desktop Workspace</span>
          </div>
        </div>
      </div>

      <div class="sidebar-section">
        <p class="sidebar-label">Workspace</p>

        <nav class="sidebar-nav" aria-label="主导航">
          <RouterLink
            v-for="tab in tabs"
            :key="tab.key"
            :to="tab.to"
            class="sidebar-link pressable"
            :class="{ 'sidebar-link--active': tab.key === activeTab }"
          >
            <AppIcon :name="tab.icon" :size="17" />
            <span>{{ tab.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-footer">
        <slot name="sidebar-footer" />
      </div>
    </aside>

    <section class="workspace">
      <header class="toolbar glass-surface">
        <div class="toolbar-side">
          <slot name="nav-leading" />
        </div>

        <div class="toolbar-copy">
          <p v-if="subtitle" class="toolbar-subtitle">{{ subtitle }}</p>
          <h1 class="toolbar-title">{{ largeTitle }}</h1>
        </div>

        <div class="toolbar-side toolbar-side--end">
          <slot name="nav-trailing" />
        </div>
      </header>

      <main class="workspace-scroll ios-scroll">
        <section v-if="$slots.hero" class="hero-area">
          <slot name="hero" />
        </section>

        <Transition name="content-slide" mode="out-in">
          <section :key="contentKey" class="workspace-content">
            <slot />
          </section>
        </Transition>
      </main>
    </section>
  </div>
</template>

<style scoped>
.desktop-shell {
  width: min(100vw, 1600px);
  height: 100dvh;
  margin: 0 auto;
  padding: 18px;
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr);
  gap: 18px;
}

.sidebar {
  padding: 18px;
  border-radius: 30px;
  display: grid;
  grid-template-rows: auto auto 1fr;
  min-height: 0;
  will-change: transform;
}

.sidebar-top {
  display: grid;
  gap: 16px;
}

.traffic-lights {
  display: inline-flex;
  gap: 8px;
}

.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.35);
}

.traffic-light--red {
  background: #ff5f57;
}

.traffic-light--yellow {
  background: #febc2e;
}

.traffic-light--green {
  background: #28c840;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(10, 132, 255, 0.18), rgba(10, 132, 255, 0.08));
  color: var(--accent-blue);
  box-shadow: 0 16px 28px rgba(10, 132, 255, 0.18);
}

.brand-copy {
  display: grid;
  gap: 2px;
}

.brand-copy strong {
  font-size: 1rem;
  line-height: 1.2;
}

.brand-copy span {
  font-size: 0.82rem;
  color: var(--label-tertiary);
}

.sidebar-section {
  margin-top: 26px;
}

.sidebar-label {
  margin: 0 0 10px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.sidebar-nav {
  display: grid;
  gap: 6px;
}

.sidebar-link {
  min-height: 48px;
  padding: 0 14px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--label-secondary);
  font-size: 0.96rem;
  font-weight: 600;
}

.sidebar-link--active {
  background: rgba(10, 132, 255, 0.1);
  color: var(--accent-blue);
}

.sidebar-footer {
  align-self: end;
  min-height: 0;
}

.workspace {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 18px;
}

.toolbar {
  min-height: 94px;
  padding: 18px 22px;
  border-radius: 30px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.toolbar-side {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-side--end {
  justify-content: flex-end;
}

.toolbar-copy {
  text-align: center;
  min-width: 0;
}

.toolbar-subtitle {
  margin: 0 0 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--label-tertiary);
}

.toolbar-title {
  margin: 0;
  font-size: 1.85rem;
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.workspace-scroll {
  min-height: 0;
  padding-right: 4px;
  perspective: 1200px;
  perspective-origin: 50% 0%;
}

.hero-area {
  margin-bottom: 18px;
}

.workspace-content {
  display: grid;
  gap: 18px;
  padding-bottom: 18px;
}

@media (max-width: 1100px) {
  .desktop-shell {
    padding: 12px;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 12px;
  }

  .toolbar {
    grid-template-columns: 1fr;
    justify-items: start;
    text-align: left;
  }

  .toolbar-copy {
    text-align: left;
  }

  .toolbar-side--end {
    justify-content: flex-start;
  }
}

@media (max-width: 840px) {
  .desktop-shell {
    height: auto;
    min-height: 100dvh;
    grid-template-columns: 1fr;
  }

  .sidebar {
    grid-template-rows: auto auto;
  }

  .sidebar-footer {
    display: none;
  }
}

.content-slide-enter-active {
  transition:
    opacity 500ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 540ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 440ms cubic-bezier(0.22, 1, 0.36, 1);
}

.content-slide-leave-active {
  transition:
    opacity 240ms cubic-bezier(0.4, 0, 1, 1),
    transform 260ms cubic-bezier(0.4, 0, 1, 1),
    filter 220ms ease;
  pointer-events: none;
}

.content-slide-enter-from {
  opacity: 0;
  transform: translateY(48px) scale(0.94) perspective(800px) rotateX(3deg);
  filter: blur(12px) saturate(0.6);
}

.content-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95) perspective(800px) rotateX(-2deg);
  filter: blur(8px) saturate(0.4);
}
</style>
