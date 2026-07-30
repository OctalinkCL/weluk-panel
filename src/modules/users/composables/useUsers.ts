import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/profile'

export function useUsers(companyId: string) {
  const users = ref<Profile[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (err) error.value = err.message
    else users.value = (data ?? []) as Profile[]
    loading.value = false
  }

  onMounted(fetchUsers)

  return { users, loading, error, fetchUsers }
}
