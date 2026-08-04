import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Screen } from '@/types/screen'

export function usePairScreen() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function pairScreen(companyId: string, rawCode: string, name: string): Promise<Screen | null> {
    loading.value = true
    error.value = null

    const code = rawCode.trim().toUpperCase()

    const { data: pairingCode, error: findErr } = await supabase
      .from('pairing_codes')
      .select('device_uuid')
      .eq('code', code)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (findErr || !pairingCode) {
      error.value = 'Código inválido o expirado.'
      loading.value = false
      return null
    }

    const { data: screens, error: screenErr } = await supabase
      .from('screens')
      .upsert(
        { company_id: companyId, device_uuid: pairingCode.device_uuid, name, status: 'paired' },
        { onConflict: 'device_uuid' },
      )
      .select()

    if (screenErr || !screens || screens.length === 0) {
      error.value = screenErr?.message ?? 'No se pudo vincular la pantalla (revisar policies de RLS).'
      loading.value = false
      return null
    }

    const { data: claimed } = await supabase
      .from('pairing_codes')
      .update({ status: 'claimed', claimed_at: new Date().toISOString() })
      .eq('code', code)
      .eq('status', 'pending')
      .select()

    if (!claimed || claimed.length === 0) {
      console.error('[usePairScreen] no se pudo marcar el pairing_code como claimed')
    }

    loading.value = false
    return screens[0] as Screen
  }

  return { pairScreen, loading, error }
}
