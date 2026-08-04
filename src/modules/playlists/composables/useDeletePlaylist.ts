import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useDeletePlaylist() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function getScreensUsing(playlistId: string): Promise<string[]> {
    const { data } = await supabase.from('screens').select('name').eq('current_playlist_id', playlistId)
    return (data ?? []).map((row) => row.name)
  }

  async function deletePlaylist(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.from('playlists').delete().eq('id', id).select()

    loading.value = false

    if (err) {
      error.value = err.message
      return false
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo eliminar la playlist (revisar policies de RLS).'
      return false
    }
    return true
  }

  return { deletePlaylist, getScreensUsing, loading, error }
}
