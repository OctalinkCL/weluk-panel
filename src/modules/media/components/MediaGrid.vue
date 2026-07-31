<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Video, Images, Check, Loader2, TriangleAlert, X } from '@lucide/vue'
import { supabase } from '@/lib/supabase'
import { useMedia } from '../composables/useMedia'
import { useUploadMedia } from '../composables/useUploadMedia'
import { useDeleteMedia } from '../composables/useDeleteMedia'
import { useAddPlaylistItem } from '@/modules/playlists/composables/useAddPlaylistItem'
import { getMediaPublicUrl } from '@/lib/mediaStorage'
import type { Media } from '@/types/media'

type QueueItem = {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'error'
  error?: string
}

const UPLOAD_CONCURRENCY = 3

const props = withDefaults(
  defineProps<{
    companyId: string
    mode?: 'browse' | 'pick'
    playlistId?: string
  }>(),
  { mode: 'browse' },
)

const emit = defineEmits<{ added: [] }>()

const { media, loading, error, fetchMedia } = useMedia(props.companyId)
const { uploadMedia } = useUploadMedia()
const { deleteMedia, anyPlaylistsUsing, error: deleteError } = useDeleteMedia()
const { addPlaylistItem, error: addError } = useAddPlaylistItem()

const fileInput = ref<HTMLInputElement | null>(null)
const existingItems = ref<{ media_id: string }[]>([])
const mediaIdsInPlaylist = computed(() => new Set(existingItems.value.map((i) => i.media_id)))

const queue = ref<QueueItem[]>([])
const queueActive = ref(false)
const uploading = computed(() => queue.value.some((q) => q.status === 'pending' || q.status === 'uploading'))

const selectedIds = ref<Set<string>>(new Set())
const bulkDeleting = ref(false)
const bulkAdding = ref(false)

async function fetchExistingItems() {
  if (!props.playlistId) return
  const { data } = await supabase.from('playlist_items').select('media_id').eq('playlist_id', props.playlistId)
  existingItems.value = data ?? []
}

onMounted(() => {
  if (props.mode === 'pick') fetchExistingItems()
})

watch(() => props.playlistId, fetchExistingItems)

function triggerUpload() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length === 0) return

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
      const { media: uploaded, error: uploadErr } = await uploadMedia(props.companyId, next.file)
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

function fileName(storagePath: string) {
  return storagePath.split('/').pop()
}

function toggleSelected(id: string) {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}

function clearSelection() {
  selectedIds.value = new Set()
}

function onCardClick(item: Media) {
  if (props.mode === 'pick' && mediaIdsInPlaylist.value.has(item.id)) return
  toggleSelected(item.id)
}

async function addSelected() {
  if (!props.playlistId) return
  bulkAdding.value = true
  try {
    let order = existingItems.value.length
    for (const id of selectedIds.value) {
      const added = await addPlaylistItem(props.playlistId, id, order)
      if (added) order++
    }
    clearSelection()
    await fetchExistingItems()
    emit('added')
  } finally {
    bulkAdding.value = false
  }
}

async function onBulkDelete() {
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
    for (const id of ids) {
      const item = media.value.find((m) => m.id === id)
      if (item) await deleteMedia(item)
    }
    clearSelection()
    await fetchMedia()
  } finally {
    bulkDeleting.value = false
  }
}
</script>

<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between gap-2">
      <div v-if="selectedIds.size > 0" class="flex items-center gap-2 text-sm">
        <span class="text-muted-foreground">{{ selectedIds.size }} seleccionado{{ selectedIds.size > 1 ? 's' : '' }}</span>
        <Button size="sm" variant="ghost" :disabled="bulkAdding || bulkDeleting" @click="clearSelection">Cancelar</Button>
        <Button v-if="mode === 'pick'" size="sm" :disabled="bulkAdding || bulkDeleting" @click="addSelected">
          <Loader2 v-if="bulkAdding" class="size-3.5 animate-spin" />
          {{ bulkAdding ? 'Agregando...' : `Agregar ${selectedIds.size} a la lista` }}
        </Button>
        <Button size="sm" variant="destructive" :disabled="bulkAdding || bulkDeleting" @click="onBulkDelete">
          <Loader2 v-if="bulkDeleting" class="size-3.5 animate-spin" />
          {{ bulkDeleting ? 'Eliminando...' : `Eliminar ${selectedIds.size}` }}
        </Button>
      </div>
      <div v-else />

      <div>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4"
          class="hidden"
          @change="onFileSelected"
        />
        <Button size="sm" :disabled="uploading" @click="triggerUpload">
          {{ uploading ? 'Subiendo...' : 'Subir archivos' }}
        </Button>
      </div>
    </div>

    <p v-if="error || deleteError || addError" class="text-sm text-destructive">
      {{ error || deleteError || addError }}
    </p>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Skeleton class="aspect-video" v-for="i in 4" :key="i" />
    </div>

    <Empty v-else-if="media.length === 0 && queue.length === 0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Images />
        </EmptyMedia>
        <EmptyTitle>Sin archivos</EmptyTitle>
        <EmptyDescription>Todavía no se ha subido contenido para esta company.</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="item in queue" :key="item.id" class="relative border rounded-lg overflow-hidden">
        <div class="aspect-video bg-muted flex items-center justify-center relative">
          <Skeleton class="absolute inset-0" />
          <Loader2 v-if="item.status === 'uploading'" class="relative size-6 animate-spin text-muted-foreground" />
          <TriangleAlert v-else-if="item.status === 'error'" class="relative size-6 text-destructive" />
        </div>
        <div class="p-2 flex items-center justify-between gap-1">
          <div class="min-w-0">
            <p class="text-xs font-medium truncate">{{ item.file.name }}</p>
            <p v-if="item.status === 'error'" class="text-xs truncate text-destructive">{{ item.error }}</p>
          </div>
          <Button
            v-if="item.status === 'error'"
            size="icon-sm"
            variant="ghost"
            class="shrink-0"
            @click="removeFromQueue(item.id)"
          >
            <X class="size-3.5" />
          </Button>
        </div>
      </div>

      <div
        v-for="item in media"
        :key="item.id"
        class="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-foreground"
        :class="selectedIds.has(item.id) ? 'ring-2 ring-primary' : ''"
        @click="onCardClick(item)"
      >
        <div class="aspect-video bg-muted flex items-center justify-center">
          <img
            v-if="item.type === 'image' || item.thumbnail_path"
            :src="getMediaPublicUrl(item.type === 'image' ? item.storage_path : item.thumbnail_path!)"
            class="size-full object-cover"
          />
          <Video v-else class="size-6 text-muted-foreground" />
        </div>
        <div class="p-2">
          <p class="text-xs font-medium truncate">{{ fileName(item.storage_path) }}</p>
        </div>

        <div
          v-if="mode === 'pick' && mediaIdsInPlaylist.has(item.id)"
          class="absolute top-1 left-1 size-5 rounded-full bg-foreground text-background flex items-center justify-center"
        >
          <Check class="size-3" />
        </div>
      </div>
    </div>
  </div>
</template>
