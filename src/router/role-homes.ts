import type { RouteLocationRaw } from 'vue-router'
import type { Role } from '@/types/profile'

// A dónde mandar a cada rol tras login/redirect. company_admin necesita su
// companyId en la URL (workspace.routes.ts vive bajo `/c/:companyId`); si
// todavía no cargó el profile, cae a login — no debería pasar en la práctica
// porque el guard ya exige sesión antes de llegar acá.
export function homeForRole(role: Role | undefined, companyId?: string | null): RouteLocationRaw {
  if (role === 'superadmin') return { name: 'admin-companies' }
  if (role === 'company_admin' && companyId) return { name: 'screens', params: { companyId } }
  return { name: 'login' }
}
