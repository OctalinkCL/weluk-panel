export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    const cleanup = () => URL.revokeObjectURL(url)

    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      cleanup()
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : null)
    }
    video.onerror = () => {
      cleanup()
      resolve(null)
    }
    video.src = url
  })
}
