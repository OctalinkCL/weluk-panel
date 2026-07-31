import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/**
 * El slug de la company actual, tal como está en la URL — para armar links a
 * otras vistas de la misma company (Screens/Playlists/Media/Usuarios). Para
 * el id real (uuid, usado en queries), ver useCurrentCompanyId().
 */
export function useCurrentCompanySlug(): ComputedRef<string | null> {
  const route = useRoute()
  return computed(() => (route.params.companySlug as string | undefined) ?? null)
}
