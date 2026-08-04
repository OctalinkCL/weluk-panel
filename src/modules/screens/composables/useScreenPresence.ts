import { ref, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Presence, no polling: el visor hace channel.track() una sola vez al conectar
// sobre el canal `screen-${device_uuid}` que ya mantiene abierto 24/7 para el
// sync de playlist (ver CLAUDE.md sección 5/13). Acá solo escuchamos ese mismo
// canal por cada pantalla visible — Supabase multiplexa todos los canales sobre
// un único WebSocket, así que esto no suma conexiones concurrentes nuevas.
export function useScreenPresence() {
  const onlineDeviceUuids = ref<Set<string>>(new Set())
  const channels = new Map<string, RealtimeChannel>()

  function setOnline(deviceUuid: string, isOnline: boolean) {
    const next = new Set(onlineDeviceUuids.value)
    if (isOnline) next.add(deviceUuid)
    else next.delete(deviceUuid)
    onlineDeviceUuids.value = next
  }

  function watchScreen(deviceUuid: string) {
    if (channels.has(deviceUuid)) return
    const channel = supabase.channel(`screen-${deviceUuid}`)
    channel
      .on('presence', { event: 'sync' }, () => {
        setOnline(deviceUuid, Object.keys(channel.presenceState()).length > 0)
      })
      .subscribe()
    channels.set(deviceUuid, channel)
  }

  function unwatchAll() {
    for (const channel of channels.values()) supabase.removeChannel(channel)
    channels.clear()
    onlineDeviceUuids.value = new Set()
  }

  // Sincroniza contra la lista visible actual: suma canales nuevos y cierra
  // los de pantallas que ya no están (ej. se eliminó una) — evita ir
  // acumulando suscripciones huérfanas mientras la vista sigue montada.
  function sync(deviceUuids: string[]) {
    const visible = new Set(deviceUuids)
    for (const deviceUuid of channels.keys()) {
      if (!visible.has(deviceUuid)) {
        supabase.removeChannel(channels.get(deviceUuid)!)
        channels.delete(deviceUuid)
        setOnline(deviceUuid, false)
      }
    }
    for (const deviceUuid of visible) watchScreen(deviceUuid)
  }

  onUnmounted(unwatchAll)

  return { onlineDeviceUuids, sync, unwatchAll }
}
