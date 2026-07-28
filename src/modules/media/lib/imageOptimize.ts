const MAX_DIMENSION = 1920
const QUALITY = 0.8

export async function optimizeImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY))
    if (!blob) return file

    const optimizedName = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([blob], optimizedName, { type: 'image/webp' })
  } catch (err) {
    console.error('[optimizeImage] no se pudo optimizar, se sube el original:', err)
    return file
  }
}
