import { supabase } from './supabase'

export function getMediaPublicUrl(storagePath: string) {
  return supabase.storage.from('media').getPublicUrl(storagePath).data.publicUrl
}
