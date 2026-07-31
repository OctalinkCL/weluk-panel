import { supabase } from '@/lib/supabase'
import { optimizeImage, createImageThumbnail } from '../lib/imageOptimize'
import { readVideoDuration } from '../lib/videoMetadata'
import { captureVideoThumbnail } from '../lib/videoThumbnail'
import type { Media, MediaType } from '@/types/media'

const ALLOWED_TYPES: Record<string, MediaType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
}
const MAX_SIZE_BYTES = 15 * 1024 * 1024

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

export type UploadMediaResult = { media: Media; error: null } | { media: null; error: string }

export function useUploadMedia() {
  // Sin estado global de loading/error: uploadMedia se llama en paralelo para
  // varios archivos a la vez (cola de subida en MediaGrid.vue), así que cada
  // llamada devuelve su propio resultado en vez de pisar un ref compartido.
  async function uploadMedia(companyId: string, file: File): Promise<UploadMediaResult> {
    const mediaType = ALLOWED_TYPES[file.type]
    if (!mediaType) {
      return { media: null, error: 'Formato no permitido. Usa JPEG, PNG, WEBP o MP4.' }
    }
    if (file.size > MAX_SIZE_BYTES) {
      return { media: null, error: 'El archivo supera el límite de 15 MB.' }
    }

    const optimizedFile = mediaType === 'image' ? await optimizeImage(file) : file
    const durationSeconds = mediaType === 'video' ? await readVideoDuration(optimizedFile) : null
    const thumbnailBlob =
      mediaType === 'video' ? await captureVideoThumbnail(optimizedFile) : await createImageThumbnail(optimizedFile)

    const baseName = sanitizeFileName(optimizedFile.name)
    const storagePath = `${companyId}/${crypto.randomUUID()}-${baseName}`

    const { error: uploadErr } = await supabase.storage
      .from('media')
      .upload(storagePath, optimizedFile, { cacheControl: '31536000', upsert: false })

    if (uploadErr) {
      return { media: null, error: uploadErr.message }
    }

    // El thumbnail es best-effort: si falla la captura o la subida, el video
    // igual se registra sin thumbnail_path (columna nullable) en vez de
    // abortar toda la subida por un frame que no se pudo generar.
    let thumbnailPath: string | null = null
    if (thumbnailBlob) {
      const candidatePath = `${companyId}/${crypto.randomUUID()}-thumb.webp`
      const { error: thumbErr } = await supabase.storage
        .from('media')
        .upload(candidatePath, thumbnailBlob, { cacheControl: '31536000', upsert: false })
      if (!thumbErr) thumbnailPath = candidatePath
    }

    const { data, error: insertErr } = await supabase
      .from('media')
      .insert({
        company_id: companyId,
        type: mediaType,
        storage_path: storagePath,
        thumbnail_path: thumbnailPath,
        ...(durationSeconds ? { duration_seconds: durationSeconds } : {}),
      })
      .select()

    if (insertErr || !data || data.length === 0) {
      // el archivo (y su thumbnail, si se generó) ya se subieron a Storage pero
      // no quedaron registrados — evita dejarlos huérfanos
      await supabase.storage.from('media').remove([storagePath, ...(thumbnailPath ? [thumbnailPath] : [])])
      return {
        media: null,
        error: insertErr?.message ?? 'No se pudo registrar el archivo (revisar policies de RLS).',
      }
    }

    return { media: data[0] as Media, error: null }
  }

  return { uploadMedia }
}
