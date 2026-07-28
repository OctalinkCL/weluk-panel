import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Screen } from '@/types/screen'

export function useEditScreen() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function editScreen(id: string, name: string): Promise<Screen | null> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.from('screens').update({ name }).eq('id', id).select()

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo editar la pantalla (revisar policies de RLS).'
      return null
    }
    return data[0] as Screen
  }

  return { editScreen, loading, error }
}
