import AdminLayout from '@/layouts/AdminLayout.vue'
import type { RouteRecordRaw } from 'vue-router'

// Árbol de rutas único para superadmin y company_admin — los dos operan sobre
// una company (`:companyId` en la URL, ver useCurrentCompanyId), y reusan
// exactamente los mismos módulos (CLAUDE.md sección 14). Un company_admin
// solo puede navegar su propia company (guards.ts lo fuerza); un superadmin
// puede moverse entre companies con el switcher del sidebar, sin salir y
// volver a entrar por Companies cada vez.
export const workspaceRoutes: RouteRecordRaw[] = [
  {
    path: '/c/:companyId',
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
