import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/company'

export function useEditCompany() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function editCompany(id: string, name: string): Promise<Company | null> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.from('companies').update({ name }).eq('id', id).select()

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }
    if (!data || data.length === 0) {
      error.value = 'No se pudo editar la company (revisar policies de RLS).'
      return null
    }
    return data[0]
  }

  return { editCompany, loading, error }
}
