import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Media } from '@/types/media'

export function useMedia(companyId: string) {
  const media = ref<Media[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMedia() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('media')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    if (err) error.value = err.message
    else media.value = (data ?? []) as Media[]
    loading.value = false
  }

  onMounted(fetchMedia)

  return { media, loading, error, fetchMedia }
}
