import AdminLayout from '@/layouts/AdminLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

export const companyAdminRoutes: RouteRecordRaw[] = [
  {
    path: '/company',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'home',
        name: 'company-home',
        meta: { roles: ['company_admin'] },
        component: () => import('@/modules/home/CompanyHomeView.vue'),
      },
    ],
  },
]
