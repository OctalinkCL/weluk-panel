import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Screen } from '@/types/screen'

export function useScreens(companyId: string) {
  const screens = ref<Screen[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchScreens() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('screens')
      .select('*, playlist:playlists(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (err) error.value = err.message
    else screens.value = (data ?? []) as Screen[]
    loading.value = false
  }

  onMounted(fetchScreens)

  return { screens, loading, error, fetchScreens }
}
