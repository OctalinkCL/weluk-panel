import type { Database } from '@/lib/database.types'

export type Role = 'superadmin' | 'company_admin'

export type Profile = Omit<Database['public']['Tables']['profiles']['Row'], 'role'> & {
  role: Role
}
