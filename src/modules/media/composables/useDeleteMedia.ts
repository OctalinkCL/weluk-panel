import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Media } from '@/types/media'

export function useDeleteMedia() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function getPlaylistsUsing(mediaId: string): Promise<string[]> {
    const { data } = await supabase.from('playlist_items').select('playlists(name)').eq('media_id', mediaId)
    const rows = (data ?? []) as unknown as { playlists: { name: string } | null }[]
    return rows.map((row) => row.playlists?.name).filter((name): name is string => !!name)
  }

  async function deleteMedia(item: Media): Promise<boolean> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.from('media').delete().eq('id', item.id).select()

    if (err) {
      error.value = err.message
      loading.value = false
      return false
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo eliminar el archivo (revisar policies de RLS).'
      loading.value = false
      return false
    }

    const { data: removed, error: storageErr } = await supabase.storage.from('media').remove([item.storage_path])

    loading.value = false

    if (storageErr || !removed || removed.length === 0) {
      // la fila ya se borró (por eso desaparece de la lista), pero el archivo real
      // quedó huérfano en Storage — avisar en vez de fallar en silencio
      error.value = `El registro se eliminó, pero el archivo en Storage no se pudo borrar${storageErr ? `: ${storageErr.message}` : ''}.`
      return true
    }

    return true
  }

  return { deleteMedia, getPlaylistsUsing, loading, error }
}
