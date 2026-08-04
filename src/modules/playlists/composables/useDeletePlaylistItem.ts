import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useDeletePlaylistItem() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function deletePlaylistItem(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.from('playlist_items').delete().eq('id', id).select()

    loading.value = false

    if (err) {
      error.value = err.message
      return false
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo quitar el ítem (revisar policies de RLS).'
      return false
    }
    return true
  }

  return { deletePlaylistItem, loading, error }
}
