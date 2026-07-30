import AdminLayout from '@/layouts/AdminLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

export const companyAdminRoutes: RouteRecordRaw[] = [
  {
    path: '/company',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'screens',
        name: 'company-screens',
        meta: { roles: ['company_admin'] },
        component: () => import('@/modules/screens/ScreensView.vue'),
      },
    ],
  },
]
