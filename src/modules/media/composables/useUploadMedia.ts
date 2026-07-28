import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { optimizeImage } from '../lib/imageOptimize'
import type { Media, MediaType } from '@/types/media'

const ALLOWED_TYPES: Record<string, MediaType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
}
const MAX_SIZE_BYTES = 50 * 1024 * 1024

// Evita nombres con espacios/acentos/caracteres especiales en el storage_path —
// la misma ruta se codifica distinto según si va en la URL (upload) o en el
// body JSON (remove), y un carácter especial puede terminar sin coincidir
// byte a byte entre ambos, dejando el archivo sin poder borrarse nunca.
function sanitizeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
}

export function useUploadMedia() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function uploadMedia(companyId: string, file: File): Promise<Media | null> {
    loading.value = true
    error.value = null

    const mediaType = ALLOWED_TYPES[file.type]
    if (!mediaType) {
      error.value = 'Formato no permitido. Usa JPEG, PNG, WEBP o MP4.'
      loading.value = false
      return null
    }
    if (file.size > MAX_SIZE_BYTES) {
      error.value = 'El archivo supera el límite de 50 MB.'
      loading.value = false
      return null
    }

    const optimizedFile = mediaType === 'image' ? await optimizeImage(file) : file

    const storagePath = `${companyId}/${crypto.randomUUID()}-${sanitizeFileName(optimizedFile.name)}`

    const { error: uploadErr } = await supabase.storage
      .from('media')
      .upload(storagePath, optimizedFile, { cacheControl: '31536000', upsert: false })

    if (uploadErr) {
      error.value = uploadErr.message
      loading.value = false
      return null
    }

    const { data, error: insertErr } = await supabase
      .from('media')
      .insert({ company_id: companyId, type: mediaType, storage_path: storagePath })
      .select()

    if (insertErr || !data || data.length === 0) {
      error.value = insertErr?.message ?? 'No se pudo registrar el archivo (revisar policies de RLS).'
      // el archivo ya se subió a Storage pero no quedó registrado — evita dejarlo huérfano
      await supabase.storage.from('media').remove([storagePath])
      loading.value = false
      return null
    }

    loading.value = false
    return data[0] as Media
  }

  return { uploadMedia, loading, error }
}
