import type { Role } from './profile'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: Role[]
  }
}
