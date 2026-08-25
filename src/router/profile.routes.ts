import AdminLayout from '@/layouts/AdminLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

// El perfil es del usuario, no de una company — a diferencia de
// workspace.routes.ts, esta ruta no vive bajo `/c/:companySlug`.
export const profileRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'profile',
        component: () => import('@/modules/profile/ProfileView.vue'),
      },
    ],
  },
]
