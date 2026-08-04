import type { RouteLocationRaw } from 'vue-router'
import type { Role } from '@/types/profile'

// A dónde mandar a cada rol tras login/redirect. company_admin necesita el
// slug de su company en la URL (workspace.routes.ts vive bajo
// `/c/:companySlug`); si todavía no cargó el profile, cae a login — no
// debería pasar en la práctica porque el guard ya exige sesión antes de
// llegar acá.
export function homeForRole(role: Role | undefined, companySlug?: string | null): RouteLocationRaw {
  if (role === 'superadmin') return { name: 'admin-companies' }
  if (role === 'company_admin' && companySlug) return { name: 'screens', params: { companySlug } }
  return { name: 'login' }
}
