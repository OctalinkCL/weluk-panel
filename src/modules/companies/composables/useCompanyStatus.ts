import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export function useCompanyStatus() {
  const isActive = ref(true)
  const checked = ref(false)

  async function fetchStatus(companyId: string) {
    const { data } = await supabase.from('companies').select('is_active').eq('id', companyId).maybeSingle()
    isActive.value = data?.is_active ?? true
    checked.value = true
  }

  return { isActive, checked, fetchStatus }
}
