import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Playlist } from '@/types/playlist'

export function usePlaylist(id: string) {
  const playlist = ref<Playlist | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPlaylist() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase.from('playlists').select('*').eq('id', id).single()
    if (err) error.value = err.message
    else playlist.value = data
    loading.value = false
  }

  onMounted(fetchPlaylist)

  return { playlist, loading, error, fetchPlaylist }
}
