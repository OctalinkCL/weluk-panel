import AdminLayout from '@/layouts/AdminLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

// Ajustes de la cuenta del usuario (nombre, contraseña) — a diferencia de
// workspace.routes.ts, NO cuelga de /c/:companySlug: es del usuario, no de
// una company. Un superadmin que todavía no entró a ninguna company (su
// home real es admin-companies) también necesita poder editar su propio
// perfil sin pasar antes por un cliente. Se llega solo desde el dropdown
// del header (AppHeader.vue) — no tiene ítem en el sidebar principal.
export const accountRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@/modules/profile/ProfileLayout.vue'),
        children: [
          {
            path: '',
            name: 'profile',
            component: () => import('@/modules/profile/ProfileView.vue'),
          },
          {
            path: 'password',
            name: 'profile-password',
            component: () => import('@/modules/profile/PasswordView.vue'),
          },
        ],
      },
    ],
  },
]
