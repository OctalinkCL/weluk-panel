import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/company'

export function useCompanies() {
  const companies = ref<Company[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCompanies() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
    if (err) error.value = err.message
    else companies.value = data ?? []
    loading.value = false
  }

  onMounted(fetchCompanies)

  return { companies, loading, error, fetchCompanies }
}
