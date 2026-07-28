import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useDisconnectScreen() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function disconnectScreen(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('screens')
      .update({ status: 'disconnected', current_playlist_id: null })
      .eq('id', id)
      .select()

    loading.value = false

    if (err) {
      error.value = err.message
      return false
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo desconectar la pantalla (revisar policies de RLS).'
      return false
    }
    return true
  }

  return { disconnectScreen, loading, error }
}
