import type { NavigationGuard } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { homeForRole } from './role-homes'

export const authGuard: NavigationGuard = (to) => {
  const authStore = useAuthStore()

  if (to.matched.some((r) => r.meta.requiresAuth) && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && authStore.isAuthenticated) {
    return homeForRole(authStore.role, authStore.profile?.company_id)
  }
  if (to.meta.roles && !to.meta.roles.includes(authStore.role!)) {
    return homeForRole(authStore.role, authStore.profile?.company_id)
  }
  // company_admin solo puede navegar su propia company bajo `/c/:companyId` —
  // el id en la URL es de navegación, la seguridad real la hace RLS
  // (auth_active_company_id()), pero esto evita que un link a mano o un typo
  // lo deje mirando (sin datos) la pantalla de otro cliente.
  if (
    authStore.role === 'company_admin' &&
    typeof to.params.companyId === 'string' &&
    to.params.companyId !== authStore.profile?.company_id
  ) {
    return homeForRole(authStore.role, authStore.profile?.company_id)
  }
}
