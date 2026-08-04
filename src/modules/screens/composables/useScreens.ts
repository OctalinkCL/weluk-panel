import { ref, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Screen } from '@/types/screen'

export function useScreens(companyId: MaybeRefOrGetter<string | null | undefined>) {
  const screens = ref<Screen[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchScreens() {
    const id = toValue(companyId)
    if (!id) return

    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('screens')
      .select(
        '*, playlist:playlists(name, playlist_items(order_index, media(thumbnail_path)))',
      )
      .eq('company_id', id)
      .order('created_at', { ascending: false })
    if (err) {
      error.value = err.message
    } else {
      const result = (data ?? []) as Screen[]
      // order() con referencedTable no resuelve playlist_items porque está
      // anidado dentro de playlists (a su vez embebido) — se ordena acá para
      // que la miniatura de la playlist sea determinista entre refrescos.
      for (const screen of result) {
        screen.playlist?.playlist_items.sort((a, b) => a.order_index - b.order_index)
      }
      screens.value = result
    }
    loading.value = false
  }

  watch(() => toValue(companyId), fetchScreens, { immediate: true })

  return { screens, loading, error, fetchScreens }
}
