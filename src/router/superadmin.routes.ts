import AdminLayout from '@/layouts/AdminLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

export const superadminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'companies',
        name: 'admin-companies',
        meta: { roles: ['superadmin'] },
        component: () => import('@/modules/companies/CompaniesView.vue'),
      },
    ],
  },
]
