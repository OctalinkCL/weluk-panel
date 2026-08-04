import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useToggleCompany() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function toggleCompany(id: string, isActive: boolean): Promise<boolean> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('companies')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()

    loading.value = false

    if (err) {
      error.value = err.message
      return false
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo actualizar el estado (revisar policies de RLS).'
      return false
    }
    return true
  }

  return { toggleCompany, loading, error }
}
