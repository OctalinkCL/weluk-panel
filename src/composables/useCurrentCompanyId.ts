import { computed, type ComputedRef } from 'vue'
import { useCurrentCompanyStore } from '@/stores/currentCompany'

/**
 * El id real (uuid) de la company actual — para queries a Supabase (FKs,
 * RLS). Nunca se lee de la URL directamente: la URL lleva el slug
 * (`/c/:companySlug/*`), que guards.ts resuelve una vez por navegación a la
 * fila real (ver useCurrentCompanyStore). Para armar links a otras vistas de
 * la misma company, ver useCurrentCompanySlug().
 */
export function useCurrentCompanyId(): ComputedRef<string | null> {
  const store = useCurrentCompanyStore()
  return computed(() => store.company?.id ?? null)
}
