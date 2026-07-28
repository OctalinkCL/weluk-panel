import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './auth.routes'
import { superadminRoutes } from './superadmin.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'login' },
    },
    ...authRoutes,
    ...superadminRoutes,
  ],
})

export default router
