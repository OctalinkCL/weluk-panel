import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { PlaylistWithThumbnail } from '@/types/playlist'

export function usePlaylists(companyId: string) {
  const playlists = ref<PlaylistWithThumbnail[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPlaylists() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('playlists')
      .select('*, playlist_items(media(thumbnail_path))')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      // Solo 1 ítem embebido por playlist (el de menor order_index) — alcanza
      // para una miniatura de vistazo, evita traer los N ítems completos.
      .order('order_index', { referencedTable: 'playlist_items' })
      .limit(1, { referencedTable: 'playlist_items' })
    if (err) error.value = err.message
    else playlists.value = (data ?? []) as PlaylistWithThumbnail[]
    loading.value = false
  }

  onMounted(fetchPlaylists)

  return { playlists, loading, error, fetchPlaylists }
}
