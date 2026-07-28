import AdminLayout from '@/layouts/AdminLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

export const superadminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: 'companies',
        name: 'admin-companies',
        component: () => import('@/modules/companies/CompaniesView.vue'),
      },
    ],
  },
]
