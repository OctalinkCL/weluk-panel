import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/company'

export function useCompany(id: string) {
  const company = ref<Company | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCompany() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase.from('companies').select('*').eq('id', id).single()
    if (err) error.value = err.message
    else company.value = data
    loading.value = false
  }

  onMounted(fetchCompany)

  return { company, loading, error, fetchCompany }
}
