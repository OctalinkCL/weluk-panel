import type { Database } from '@/lib/database.types'

export type Role = 'superadmin' | 'company_admin'

export type Profile = Omit<Database['public']['Tables']['profiles']['Row'], 'role'> & {
  role: Role
  // Embed de `companies(slug)` — null solo para superadmin (company_id null).
  // Es lo que usa homeForRole/guards.ts para armar la URL `/c/:companySlug`.
  company: { slug: string } | null
}
