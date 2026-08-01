import { ref, computed, watch, type Ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useMedia } from './useMedia'
import { useUploadMedia } from './useUploadMedia'
import { useDeleteMedia } from './useDeleteMedia'
import { useAddPlaylistItem } from '@/modules/playlists/composables/useAddPlaylistItem'

type QueueItem = {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'error'
  error?: string
}

const UPLOAD_CONCURRENCY = 3

// Estado compartido por las dos superficies que muestran la biblioteca de
// media (tab Media y el picker dentro de una playlist) — antes vivía dentro
// de MediaGrid.vue con un prop `mode` para diferenciarlas. Acá no hay modos:
// playlistId ausente simplemente deja mediaIdsInPlaylist vacío, sin ramas.
export function useMediaLibrary(companyId: string, playlistId?: Ref<string | undefined>) {
  const { media, loading, error, fetchMedia } = useMedia(companyId)
  const { uploadMedia } = useUploadMedia()
  const { deleteMedia, anyPlaylistsUsing, error: deleteError } = useDeleteMedia()
  const { addPlaylistItem, error: addError } = useAddPlaylistItem()

  const existingItems = ref<{ media_id: string }[]>([])
  const mediaIdsInPlaylist = computed(() => new Set(existingItems.value.map((i) => i.media_id)))

  async function fetchExistingItems() {
    const id = playlistId?.value
    if (!id) {
      existingItems.value = []
      return
    }
    const { data } = await supabase.from('playlist_items').select('media_id').eq('playlist_id', id)
    existingItems.value = data ?? []
  }

  if (playlistId) watch(playlistId, fetchExistingItems, { immediate: true })

  const queue = ref<QueueItem[]>([])
  const queueActive = ref(false)
  const uploading = computed(() => queue.value.some((q) => q.status === 'pending' || q.status === 'uploading'))

  function enqueueFiles(files: File[]) {
    queue.value.push(...files.map((file) => ({ id: crypto.randomUUID(), file, status: 'pending' as const })))
    runQueue()
  }

  async function runQueue() {
    if (queueActive.value) return
    queueActive.value = true

    const worker = async () => {
      let next: QueueItem | undefined
      while ((next = queue.value.find((q) => q.status === 'pending'))) {
        next.status = 'uploading'
        const { media: uploaded, error: uploadErr } = await uploadMedia(companyId, next.file)
        if (uploaded) {
          queue.value = queue.value.filter((q) => q.id !== next!.id)
          await fetchMedia()
        } else {
          next.status = 'error'
          next.error = uploadErr
        }
      }
    }

    await Promise.all(Array.from({ length: UPLOAD_CONCURRENCY }, worker))
    queueActive.value = false
  }

  function removeFromQueue(id: string) {
    queue.value = queue.value.filter((q) => q.id !== id)
  }

  const selectedIds = ref<Set<string>>(new Set())
  const selectableMedia = computed(() => media.value.filter((m) => !mediaIdsInPlaylist.value.has(m.id)))
  const allSelected = computed(
    () => selectableMedia.value.length > 0 && selectedIds.value.size === selectableMedia.value.length,
  )

  function toggleSelected(id: string) {
    if (mediaIdsInPlaylist.value.has(id)) return
    const next = new Set(selectedIds.value)
    next.has(id) ? next.delete(id) : next.add(id)
    selectedIds.value = next
  }

  function selectAll(checked: boolean) {
    selectedIds.value = checked ? new Set(selectableMedia.value.map((m) => m.id)) : new Set()
  }

  function clearSelection() {
    selectedIds.value = new Set()
  }

  const bulkAdding = ref(false)
  const bulkDeleting = ref(false)

  async function addSelected() {
    const id = playlistId?.value
    if (!id) return
    bulkAdding.value = true
    try {
      let order = existingItems.value.length
      for (const mediaId of selectedIds.value) {
        const added = await addPlaylistItem(id, mediaId, order)
        if (added) order++
      }
      await fetchExistingItems()
    } finally {
      bulkAdding.value = false
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds.value)
    if (ids.length === 0) return

    const inUse = await anyPlaylistsUsing(ids)
    const usageWarning = inUse
      ? ' Algunos están en uso en playlists — se quitarán de ahí, y las que ya estén publicadas se actualizarán solas.'
      : ''

    if (!confirm(`¿Eliminar ${ids.length} archivo${ids.length > 1 ? 's' : ''}?${usageWarning} Esta acción no se puede deshacer.`))
      return

    bulkDeleting.value = true
    try {
      for (const mediaId of ids) {
        const item = media.value.find((m) => m.id === mediaId)
        if (item) await deleteMedia(item)
      }
      clearSelection()
      await fetchMedia()
    } finally {
      bulkDeleting.value = false
    }
  }

  return {
    media,
    loading,
    error,
    deleteError,
    addError,
    fetchMedia,
    queue,
    uploading,
    enqueueFiles,
    removeFromQueue,
    selectedIds,
    allSelected,
    toggleSelected,
    selectAll,
    clearSelection,
    mediaIdsInPlaylist,
    bulkAdding,
    bulkDeleting,
    addSelected,
    deleteSelected,
    canAdd: computed(() => !!playlistId?.value),
  }
}
