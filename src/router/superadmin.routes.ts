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
      {
        path: 'companies/:id',
        meta: { roles: ['superadmin'] },
        component: () => import('@/layouts/CompanyDetailLayout.vue'),
        children: [
          {
            path: '',
            redirect: (to) => ({ name: 'admin-screens', params: to.params }),
          },
          {
            path: 'screens',
            name: 'admin-screens',
            component: () => import('@/modules/screens/ScreensView.vue'),
          },
          {
            path: 'playlists',
            name: 'admin-playlists',
            component: () => import('@/modules/playlists/PlaylistsView.vue'),
          },
          {
            path: 'playlists/:playlistId',
            name: 'admin-playlist-detail',
            component: () => import('@/modules/playlists/PlaylistDetailView.vue'),
          },
        ],
      },
    ],
  },
]
