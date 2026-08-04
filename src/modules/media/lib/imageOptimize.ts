import { resizeToWebp } from './resizeToWebp'

const MAX_DIMENSION = 1920
const QUALITY = 0.8

const THUMB_DIMENSION = 480
const THUMB_QUALITY = 0.75

export async function optimizeImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    const blob = await resizeToWebp(bitmap, bitmap.width, bitmap.height, MAX_DIMENSION, QUALITY)
    if (!blob) return file

    const optimizedName = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], optimizedName, { type: 'image/webp' })
  } catch (err) {
    console.error('[optimizeImage] no se pudo optimizar, se sube el original:', err)
    return file
  }
}

// Best-effort, mismo criterio que captureVideoThumbnail: si falla, la imagen
// igual se sube y el panel cae al original (thumbnail_path queda null).
export async function createImageThumbnail(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file)
    return await resizeToWebp(bitmap, bitmap.width, bitmap.height, THUMB_DIMENSION, THUMB_QUALITY)
  } catch (err) {
    console.error('[createImageThumbnail] no se pudo generar el thumbnail:', err)
    return null
  }
}
