import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Playlist } from '@/types/playlist'

export function usePublishPlaylist() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function publishPlaylist(id: string): Promise<Playlist | null> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('playlists')
      .update({ published_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo publicar la playlist (revisar policies de RLS).'
      return null
    }
    return data[0]
  }

  return { publishPlaylist, loading, error }
}
