import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './auth.routes'
import { superadminRoutes } from './superadmin.routes'
import { workspaceRoutes } from './workspace.routes'
import { authGuard } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'login' },
    },
    ...authRoutes,
    ...superadminRoutes,
    ...workspaceRoutes,
  ],
})

router.beforeEach(authGuard)

export default router
