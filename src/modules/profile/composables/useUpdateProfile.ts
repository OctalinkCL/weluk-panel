import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

// `update_own_profile` es una función security definer acotada a `full_name`
// (ver weluk-schema.sql) — `profiles` no tiene policy de UPDATE a propósito,
// una policy plana dejaría reescribir `role`/`company_id` de la propia fila.
export function useUpdateProfile() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function updateProfile(fullName: string) {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .rpc('update_own_profile', { p_full_name: fullName })
      .single()

    loading.value = false

    const result = data as { id: string; full_name: string | null } | null

    if (err) {
      error.value = err.message
      return null
    }
    if (!result?.id) {
      error.value = 'No se pudo actualizar el perfil (revisar policies de RLS).'
      return null
    }
    return result
  }

  return { updateProfile, loading, error }
}
