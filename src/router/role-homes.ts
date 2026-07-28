import type { Role } from '@/types/profile'

const ROLE_HOME: Partial<Record<Role, string>> = {
  superadmin: 'admin-companies',
}

export function homeForRole(role: Role | undefined): string {
  return (role && ROLE_HOME[role]) ?? 'login'
}
