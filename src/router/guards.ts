import type { NavigationGuard } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { homeForRole } from './role-homes'

export const authGuard: NavigationGuard = (to) => {
  const authStore = useAuthStore()

  if (to.matched.some((r) => r.meta.requiresAuth) && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: homeForRole(authStore.role) }
  }
  if (to.meta.roles && !to.meta.roles.includes(authStore.role!)) {
    return { name: homeForRole(authStore.role) }
  }
}
