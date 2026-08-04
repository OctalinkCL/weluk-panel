import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { PlaylistItemWithMedia } from '@/types/playlist'

export function useReorderPlaylistItems() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function reorderItems(items: PlaylistItemWithMedia[]): Promise<boolean> {
    loading.value = true
    error.value = null

    const results = await Promise.all(
      items.map((item, index) =>
        supabase.from('playlist_items').update({ order_index: index }).eq('id', item.id).select(),
      ),
    )

    loading.value = false

    const failed = results.find((r) => r.error || !r.data || r.data.length === 0)
    if (failed) {
      error.value = failed.error?.message ?? 'No se pudo reordenar (revisar policies de RLS).'
      return false
    }
    return true
  }

  return { reorderItems, loading, error }
}
