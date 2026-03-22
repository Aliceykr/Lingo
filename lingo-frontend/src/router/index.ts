import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'wordbooks' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/wordbooks',
    name: 'wordbooks',
    component: () => import('../views/WordbooksView.vue'),
    meta: { auth: true }
  },
  {
    path: '/wordbooks/:id/study',
    name: 'study',
    component: () => import('../views/StudyView.vue'),
    meta: { auth: true }
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('../views/StatsView.vue'),
    meta: { auth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.auth && !token) {
    next({ name: 'login' })
    return
  }

  if (to.meta.guestOnly && token) {
    next({ name: 'wordbooks' })
    return
  }

  next()
})

export default router
