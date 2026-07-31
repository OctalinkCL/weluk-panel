import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/**
 * De qué company son los datos que la vista actual debe mostrar.
 *
 * Las vistas de `src/modules/*` viven bajo `/c/:companyId/*` (workspace.routes.ts)
 * y las comparten `superadmin` y `company_admin` por igual — un company_admin
 * siempre navega su propia company (el guard lo fuerza), un superadmin la
 * elige con el switcher del sidebar. Como el id siempre está en la URL para
 * los dos roles, esto es una lectura directa, no un fallback.
 *
 * Ojo: esto es scoping de UI, no seguridad. El aislamiento real entre clientes
 * lo hacen las policies de RLS (`auth_active_company_id()`).
 */
export function useCurrentCompanyId(): ComputedRef<string | null> {
  const route = useRoute()
  return computed(() => (route.params.companyId as string | undefined) ?? null)
}
