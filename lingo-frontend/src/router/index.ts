import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/wordbooks' },
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/wordbooks', component: () => import('../views/WordbooksView.vue'), meta: { auth: true } },
    { path: '/wordbooks/:id/study', component: () => import('../views/StudyView.vue'), meta: { auth: true } },
    { path: '/stats', component: () => import('../views/StatsView.vue'), meta: { auth: true } }
  ]
})

router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.auth && !token) next('/login')
  else if (to.path === '/login' && token) next('/wordbooks')
  else next()
})

export default router
