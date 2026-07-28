import AuthLayout from '@/layouts/AuthLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/modules/auth/LoginView.vue'),
      },
    ],
  },
]
