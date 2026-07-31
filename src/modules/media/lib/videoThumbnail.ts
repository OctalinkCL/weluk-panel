import { resizeToWebp } from './resizeToWebp'

const SEEK_SECONDS = 0.5
const THUMB_DIMENSION = 480
const QUALITY = 0.75

// Falla en silencio (resuelve null) ante cualquier problema — un thumbnail
// faltante no debe bloquear la subida del video (mismo criterio que
// readVideoDuration en videoMetadata.ts).
export function captureVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    let settled = false

    const cleanup = () => {
      URL.revokeObjectURL(url)
      video.remove()
    }
    const finish = (result: Blob | null) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(result)
    }

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.onerror = () => finish(null)
    video.onloadedmetadata = () => {
      // seek corto para evitar un frame negro/transparente en el instante 0
      video.currentTime = Math.min(SEEK_SECONDS, video.duration || 0)
    }
    video.onseeked = async () => {
      const blob = await resizeToWebp(video, video.videoWidth, video.videoHeight, THUMB_DIMENSION, QUALITY)
      finish(blob)
    }

    video.src = url
  })
}
