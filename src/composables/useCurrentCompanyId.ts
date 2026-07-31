import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * De qué company son los datos que la vista actual debe mostrar.
 *
 * Es el único lugar donde vive esta regla: `superadmin` navega el detalle de
 * una company y lleva el id en la URL; `company_admin` entra por `/company/*`
 * y siempre opera sobre la suya. Las vistas de `src/modules/*` las comparten
 * los dos roles (ver CLAUDE.md sección 14), así que necesitan resolverlo sin
 * saber quién está mirando.
 *
 * Ojo: esto es scoping de UI, no seguridad. El aislamiento real entre clientes
 * lo hacen las policies de RLS (`auth_active_company_id()`) — si este valor
 * fuera incorrecto la query devuelve cero filas, no datos de otra company.
 */
export function useCurrentCompanyId(): ComputedRef<string | null> {
  const route = useRoute()
  const authStore = useAuthStore()

  return computed(
    () => (route.params.id as string | undefined) ?? authStore.profile?.company_id ?? null,
  )
}
