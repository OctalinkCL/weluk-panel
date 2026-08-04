import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { PlaylistItem } from '@/types/playlist'

export function useAddPlaylistItem() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function addPlaylistItem(playlistId: string, mediaId: string, orderIndex: number): Promise<PlaylistItem | null> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('playlist_items')
      .insert({ playlist_id: playlistId, media_id: mediaId, order_index: orderIndex })
      .select()

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo agregar el ítem (revisar policies de RLS).'
      return null
    }
    return data[0]
  }

  return { addPlaylistItem, loading, error }
}
