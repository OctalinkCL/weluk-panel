import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useUpdatePlaylistItem() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function updateDuration(id: string, durationSeconds: number): Promise<boolean> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('playlist_items')
      .update({ duration_seconds: durationSeconds })
      .eq('id', id)
      .select()

    loading.value = false

    if (err) {
      error.value = err.message
      return false
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo actualizar la duración (revisar policies de RLS).'
      return false
    }
    return true
  }

  return { updateDuration, loading, error }
}
