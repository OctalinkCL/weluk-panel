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
      {
        path: 'playlists',
        name: 'company-playlists',
        meta: { roles: ['company_admin'] },
        component: () => import('@/modules/playlists/PlaylistsView.vue'),
      },
      {
        path: 'playlists/:playlistId',
        name: 'company-playlist-detail',
        meta: { roles: ['company_admin'] },
        component: () => import('@/modules/playlists/PlaylistDetailView.vue'),
      },
      {
        path: 'media',
        name: 'company-media',
        meta: { roles: ['company_admin'] },
        component: () => import('@/modules/media/MediaView.vue'),
      },
    ],
  },
]
