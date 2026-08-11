import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/profile'

// Usa la RPC `update_own_profile` en vez de un UPDATE directo sobre la
// tabla: `profiles` no tiene (a propósito) una policy de UPDATE plana,
// porque eso dejaría reescribir `role`/`company_id` de la propia fila
// (RLS es por fila, no por columna) — ver weluk-schema.sql. La función es
// security definer y solo toca `full_name`, acotada a `auth.uid()`.
export function useUpdateProfile() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function updateProfile(fullName: string): Promise<Profile | null> {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.rpc('update_own_profile', {
      p_full_name: fullName,
    })

    loading.value = false

    if (err) {
      error.value = err.message
      return null
    }
    if (!data) {
      error.value = 'No se pudo actualizar el perfil.'
      return null
    }
    return data as Profile
  }

  return { updateProfile, loading, error }
}
