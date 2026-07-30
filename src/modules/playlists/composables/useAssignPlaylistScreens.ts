import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export interface AssignableScreen {
  id: string
  name: string
  current_playlist_id: string | null
}

export function useAssignPlaylistScreens(companyId: string) {
  const screens = ref<AssignableScreen[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchScreens() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('screens')
      .select('id, name, current_playlist_id')
      .eq('company_id', companyId)
      .order('name', { ascending: true })
    if (err) error.value = err.message
    else screens.value = data ?? []
    loading.value = false
  }

  async function assignScreens(
    playlistId: string,
    selectedIds: string[],
    publishedAt: string | null,
  ): Promise<boolean> {
    saving.value = true
    error.value = null

    const toAssign = screens.value
      .filter((s) => selectedIds.includes(s.id) && s.current_playlist_id !== playlistId)
      .map((s) => s.id)
    const toUnassign = screens.value
      .filter((s) => s.current_playlist_id === playlistId && !selectedIds.includes(s.id))
      .map((s) => s.id)

    const now = new Date().toISOString()

    // El visor solo puede leer playlists publicadas (RLS de anon) — si se asigna una
    // pantalla a una playlist en borrador, publicarla acá evita que la pantalla se
    // quede sin poder leerla hasta que alguien apriete "Publicar" a mano.
    if (toAssign.length > 0 && !publishedAt) {
      const { data, error: err } = await supabase
        .from('playlists')
        .update({ published_at: now })
        .eq('id', playlistId)
        .select()
      if (err || !data || data.length === 0) {
        error.value = err?.message ?? 'No se pudo publicar la playlist al asignar pantallas.'
        saving.value = false
        return false
      }
    }

    if (toAssign.length > 0) {
      const { data, error: err } = await supabase
        .from('screens')
        .update({ current_playlist_id: playlistId, current_playlist_updated_at: now })
        .in('id', toAssign)
        .select()
      if (err || !data || data.length !== toAssign.length) {
        error.value = err?.message ?? 'No se pudieron asignar todas las pantallas (revisar policies de RLS).'
        saving.value = false
        return false
      }
    }

    if (toUnassign.length > 0) {
      const { data, error: err } = await supabase
        .from('screens')
        .update({ current_playlist_id: null, current_playlist_updated_at: now })
        .in('id', toUnassign)
        .select()
      if (err || !data || data.length !== toUnassign.length) {
        error.value = err?.message ?? 'No se pudieron desasignar todas las pantallas (revisar policies de RLS).'
        saving.value = false
        return false
      }
    }

    saving.value = false
    return true
  }

  return { screens, loading, saving, error, fetchScreens, assignScreens }
}
