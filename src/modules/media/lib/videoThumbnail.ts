const SEEK_SECONDS = 0.5
const THUMB_WIDTH = 480
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
    video.onseeked = () => {
      const scale = Math.min(1, THUMB_WIDTH / video.videoWidth)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        finish(null)
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => finish(blob), 'image/webp', QUALITY)
    }

    video.src = url
  })
}
