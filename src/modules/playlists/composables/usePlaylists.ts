import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Playlist } from '@/types/playlist'

export function usePlaylists(companyId: string) {
  const playlists = ref<Playlist[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPlaylists() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('playlists')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (err) error.value = err.message
    else playlists.value = data ?? []
    loading.value = false
  }

  onMounted(fetchPlaylists)

  return { playlists, loading, error, fetchPlaylists }
}
