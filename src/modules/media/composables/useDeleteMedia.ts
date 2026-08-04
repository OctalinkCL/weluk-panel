import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Media } from '@/types/media'

export function useDeleteMedia() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Chequeo agregado para borrado en lote: solo necesita saber si ALGUNO de los
  // seleccionados está en uso, no el detalle de qué archivo afecta qué playlist
  // (con varios archivos ese detalle se vuelve ilegible) — una sola query.
  async function anyPlaylistsUsing(mediaIds: string[]): Promise<boolean> {
    if (mediaIds.length === 0) return false
    const { data } = await supabase.from('playlist_items').select('id').in('media_id', mediaIds).limit(1)
    return !!data && data.length > 0
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

    const pathsToRemove = [item.storage_path, ...(item.thumbnail_path ? [item.thumbnail_path] : [])]
    const { data: removed, error: storageErr } = await supabase.storage.from('media').remove(pathsToRemove)

    loading.value = false

    if (storageErr || !removed || removed.length < pathsToRemove.length) {
      // la fila ya se borró (por eso desaparece de la lista), pero el archivo real
      // quedó huérfano en Storage — avisar en vez de fallar en silencio
      error.value = `El registro se eliminó, pero el archivo en Storage no se pudo borrar${storageErr ? `: ${storageErr.message}` : ''}.`
      return true
    }

    return true
  }

  return { deleteMedia, anyPlaylistsUsing, loading, error }
}
