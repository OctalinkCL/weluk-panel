import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'

interface InviteUserParams {
  email: string
  full_name: string
  company_id: string
}

export function useInviteUser() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function inviteUser(params: InviteUserParams) {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase.functions.invoke('invite-user', {
      body: { ...params, role: 'company_admin', redirectTo: `${window.location.origin}/set-password` },
    })

    loading.value = false

    if (err) {
      if (err instanceof FunctionsHttpError) {
        const body = await err.context.json().catch(() => null)
        error.value = body?.error ?? 'No se pudo invitar al usuario.'
      } else {
        error.value = err.message
      }
      return null
    }

    return data
  }

  return { inviteUser, loading, error }
}
