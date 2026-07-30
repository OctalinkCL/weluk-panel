import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from './auth.routes'
import { superadminRoutes } from './superadmin.routes'
import { companyAdminRoutes } from './company-admin.routes'
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
    ...companyAdminRoutes,
  ],
})

router.beforeEach(authGuard)

export default router
