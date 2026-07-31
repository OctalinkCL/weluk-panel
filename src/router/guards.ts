import type { NavigationGuard } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCurrentCompanyStore } from '@/stores/currentCompany'
import { homeForRole } from './role-homes'

export const authGuard: NavigationGuard = async (to) => {
  const authStore = useAuthStore()

  if (to.matched.some((r) => r.meta.requiresAuth) && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && authStore.isAuthenticated) {
    return homeForRole(authStore.role, authStore.profile?.company?.slug)
  }
  if (to.meta.roles && !to.meta.roles.includes(authStore.role!)) {
    return homeForRole(authStore.role, authStore.profile?.company?.slug)
  }

  // Rutas bajo `/c/:companySlug` (workspace.routes.ts): resolver el slug a
  // la company real antes de dejar entrar, así las vistas ya la encuentran
  // resuelta al montar (useCurrentCompanyId). Un slug que no existe, o que
  // RLS bloquea por pertenecer a otro cliente (company_admin, policy
  // `id = auth_company_id()`), vuelve 0 filas — mismo patrón de "RLS
  // silenciosa" de CLAUDE.md sección 4, tratado acá como bounce a home en
  // vez de dejar la vista sin datos.
  const slug = to.params.companySlug
  if (typeof slug === 'string') {
    const companyStore = useCurrentCompanyStore()
    const company = await companyStore.resolve(slug)
    if (!company) {
      return homeForRole(authStore.role, authStore.profile?.company?.slug)
    }
  }
}
