import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Media } from '@/types/media'

export function useDeleteMedia() {
  const loading = ref(false)
  const error = ref<string | null>(null)

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

    const { error: storageErr } = await supabase.storage.from('media').remove([item.storage_path])
    if (storageErr) console.error('[useDeleteMedia] no se pudo borrar el archivo de Storage:', storageErr)

    loading.value = false
    return true
  }

  return { deleteMedia, loading, error }
}
