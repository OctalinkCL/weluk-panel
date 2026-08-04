import AdminLayout from '@/layouts/AdminLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

// Árbol de rutas único para superadmin y company_admin — los dos operan sobre
// una company (`:companySlug` en la URL — el id real nunca sale del código,
// ver useCurrentCompanyId/useCurrentCompanySlug), y reusan exactamente los
// mismos módulos (CLAUDE.md sección 14). guards.ts resuelve el slug a la
// company real antes de dejar entrar; un company_admin solo puede resolver
// la suya (RLS). Un superadmin puede moverse entre companies con el switcher
// del sidebar, sin salir y volver a entrar por Companies cada vez.
export const workspaceRoutes: RouteRecordRaw[] = [
  {
    path: '/c/:companySlug',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: (to) => ({ name: 'screens', params: to.params }),
      },
      {
        path: 'screens',
        name: 'screens',
        component: () => import('@/modules/screens/ScreensView.vue'),
      },
      {
        path: 'playlists',
        name: 'playlists',
        component: () => import('@/modules/playlists/PlaylistsView.vue'),
      },
      {
        path: 'playlists/:playlistId',
        name: 'playlist-detail',
        component: () => import('@/modules/playlists/PlaylistDetailView.vue'),
      },
      {
        path: 'media',
        name: 'media',
        component: () => import('@/modules/media/MediaView.vue'),
      },
      {
        path: 'users',
        name: 'users',
        meta: { roles: ['superadmin'] },
        component: () => import('@/modules/users/UsersView.vue'),
      },
    ],
  },
]
