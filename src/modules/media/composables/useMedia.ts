import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Media } from '@/types/media'

export function useMedia(companyId: string) {
  const media = ref<Media[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMedia() {
    // Solo mostrar el skeleton en la carga inicial real — en un refetch con la
    // lista ya poblada (agregar/quitar/subir), actualizar en el lugar sin
    // tapar los items existentes con placeholders. Mismo patrón que
    // usePlaylistItems.fetchItems().
    if (media.value.length === 0) loading.value = true
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
