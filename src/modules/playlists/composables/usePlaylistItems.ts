import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { PlaylistItemWithMedia } from '@/types/playlist'

export function usePlaylistItems(playlistId: string) {
  const items = ref<PlaylistItemWithMedia[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('playlist_items')
      .select('*, media(*)')
      .eq('playlist_id', playlistId)
      .order('order_index', { ascending: true })
    if (err) error.value = err.message
    else items.value = (data ?? []) as unknown as PlaylistItemWithMedia[]
    loading.value = false
  }

  onMounted(fetchItems)

  return { items, loading, error, fetchItems }
}
