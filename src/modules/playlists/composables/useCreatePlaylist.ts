import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Playlist } from '@/types/playlist'

export function useCreatePlaylist() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function createPlaylist(companyId: string, name: string): Promise<Playlist | null> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('playlists')
      .insert({ company_id: companyId, name })
      .select()

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo crear la playlist (revisar policies de RLS).'
      return null
    }
    return data[0]
  }

  return { createPlaylist, loading, error }
}
