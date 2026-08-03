<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { useCurrentCompanyId } from '@/composables/useCurrentCompanyId'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Video, ListVideo, Trash2, Monitor, GripVertical } from '@lucide/vue'
import { usePlaylist } from './composables/usePlaylist'
import { usePlaylistItems } from './composables/usePlaylistItems'
import { usePublishPlaylist } from './composables/usePublishPlaylist'
import { useDeletePlaylistItem } from './composables/useDeletePlaylistItem'
import { useDeletePlaylist } from './composables/useDeletePlaylist'
import { useUpdatePlaylistItem } from './composables/useUpdatePlaylistItem'
import { useReorderPlaylistItems } from './composables/useReorderPlaylistItems'
import MediaPickerDialog from '@/modules/media/components/MediaPickerDialog.vue'
import AssignScreensDialog from './components/AssignScreensDialog.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { getMediaPublicUrl } from '@/lib/mediaStorage'
import type { PlaylistItemWithMedia } from '@/types/playlist'

const route = useRoute()
// La vista se monta por ruta, así que el id no cambia mientras vive.
const companyId = useCurrentCompanyId().value!
const playlistId = route.params.playlistId as string

const { playlist, loading: loadingPlaylist, fetchPlaylist } = usePlaylist(playlistId)
const { items, loading, error, fetchItems } = usePlaylistItems(playlistId)
const { publishPlaylist, loading: publishing, error: publishError } = usePublishPlaylist()
const { deletePlaylistItem, loading: removing, error: removeError } = useDeletePlaylistItem()
const { getScreensUsing } = useDeletePlaylist()
const { updateDuration, error: durationError } = useUpdatePlaylistItem()
const { reorderItems, error: reorderError } = useReorderPlaylistItems()

const mediaOpen = ref(false)
const assignOpen = ref(false)
const assignedScreens = ref<string[]>([])

async function fetchAssignedScreens() {
  assignedScreens.value = await getScreensUsing(playlistId)
}

onMounted(fetchAssignedScreens)

const canPublish = computed(() => items.value.length > 0 && assignedScreens.value.length > 0)

const status = computed(() => {
  if (!playlist.value) return null
  if (!playlist.value.published_at) return 'draft'
  return playlist.value.updated_at > playlist.value.published_at ? 'pending' : 'published'
})

const STATUS_LABEL = {
  draft: 'Borrador',
  pending: 'Cambios sin publicar',
  published: 'Publicada',
}

function fileName(storagePath: string) {
  return storagePath.split('/').pop()
}

async function onAdded() {
  await Promise.all([fetchItems(), fetchPlaylist()])
}

async function onPublish() {
  await publishPlaylist(playlistId)
  await fetchPlaylist()
}

const confirmRemoveOpen = ref(false)
const itemToRemove = ref<PlaylistItemWithMedia | null>(null)

function openRemoveConfirm(item: PlaylistItemWithMedia) {
  itemToRemove.value = item
  confirmRemoveOpen.value = true
}

const removeConfirmDescription = computed(() =>
  itemToRemove.value
    ? `¿Quitar "${fileName(itemToRemove.value.media.storage_path)}" de esta playlist? El archivo no se elimina.`
    : '',
)

async function onConfirmRemove() {
  if (!itemToRemove.value) return

  const ok = await deletePlaylistItem(itemToRemove.value.id)
  if (!ok) return

  confirmRemoveOpen.value = false
  itemToRemove.value = null
  await fetchItems()
  await fetchPlaylist()
}

async function onScreensAssigned() {
  await fetchAssignedScreens()
  await fetchPlaylist()
}

async function onReorder() {
  await reorderItems(items.value)
  await fetchPlaylist()
}

async function onDurationChange(item: PlaylistItemWithMedia, event: Event) {
  const value = Math.round(Number((event.target as HTMLInputElement).value))
  if (!Number.isFinite(value) || value <= 0) return
  const ok = await updateDuration(item.id, value)
  if (ok) {
    item.duration_seconds = value
    await fetchPlaylist()
  }
}
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="flex items-start justify-between lg:items-center">
      <div class="leading-tight">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-medium">{{ playlist?.name }}</h2>
          <p v-if="status" class="text-xs px-2 py-0.5 rounded-full border" :class="status === 'pending'
            ? 'bg-foreground text-background border-foreground'
            : 'bg-muted text-muted-foreground border-border'">
            {{ STATUS_LABEL[status] }}
            <span v-if="loadingPlaylist">...</span>
          </p>
        </div>
        <p class="text-sm text-muted-foreground">
          <template v-if="assignedScreens.length > 0">Pantallas: {{ assignedScreens.join(', ') }}</template>
          <template v-else>Sin pantallas asignadas.</template>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="mediaOpen = true">Agregar contenido</Button>
        <Button variant="outline" @click="assignOpen = true">
          <Monitor class="size-4" />
          Asignar pantallas
        </Button>
        <Button :disabled="publishing || !canPublish" @click="onPublish">
          {{ publishing ? 'Publicando...' : status === 'draft' ? 'Publicar' : 'Publicar cambios' }}
        </Button>
      </div>
    </header>

    <p v-if="!canPublish" class="text-sm text-muted-foreground">
      <template v-if="items.length === 0">Agregá al menos un ítem para poder publicar.</template>
      <template v-else>Asigná al menos una pantalla para poder publicar.</template>
    </p>

    <p v-if="error || publishError || removeError || durationError || reorderError" class="text-sm text-destructive">
      {{ error || publishError || removeError || durationError || reorderError }}
    </p>

    <div v-if="loading" class="grid gap-2">
      <Skeleton class="h-20" v-for="i in 3" :key="i" />
    </div>

    <Empty v-else-if="items.length === 0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListVideo />
        </EmptyMedia>
        <EmptyTitle>Sin contenido</EmptyTitle>
        <EmptyDescription>Todavía no hay ítems en esta playlist.</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <VueDraggable v-else v-model="items" handle=".drag-handle" :animation="150" class="grid gap-2" @end="onReorder">
      <div v-for="(item, index) in items" :key="item.id"
        class="flex items-center gap-4 border rounded-lg p-3 bg-background">
        <GripVertical class="drag-handle size-4 text-muted-foreground cursor-grab shrink-0" />

        <span class="text-sm text-muted-foreground w-5 text-center shrink-0">{{ index + 1 }}</span>

        <div class="size-16 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
          <img v-if="item.media.thumbnail_path || item.media.type === 'image'"
            :src="getMediaPublicUrl(item.media.thumbnail_path ?? item.media.storage_path)" loading="lazy"
            class="size-full object-cover" />
          <Video v-else class="size-6 text-muted-foreground" />
        </div>

        <div class="flex-1 min-w-0 leading-tight">
          <p class="text-sm font-medium truncate">{{ fileName(item.media.storage_path) }}</p>
          <p class="text-xs text-muted-foreground">
            {{ item.media.type === 'image' ? 'Imagen' : 'Video' }}
            <template v-if="item.media.type === 'video'">· Original: {{ item.media.duration_seconds }}s</template>
          </p>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <Input type="number" min="1" class="w-16 h-8 text-sm text-center"
            :model-value="item.duration_seconds ?? item.media.duration_seconds"
            @change="onDurationChange(item, $event)" />
          <span class="text-sm text-muted-foreground">s</span>
        </div>

        <Button size="icon-sm" variant="ghost" class="text-destructive hover:text-destructive shrink-0"
          :disabled="removing" @click="openRemoveConfirm(item)">
          <Trash2 class="size-4" />
        </Button>
      </div>
    </VueDraggable>
  </div>

  <MediaPickerDialog v-model:open="mediaOpen" :company-id="companyId" :playlist-id="playlistId" @added="onAdded" />

  <AssignScreensDialog v-model:open="assignOpen" :company-id="companyId" :playlist-id="playlistId"
    :published-at="playlist?.published_at ?? null" @assigned="onScreensAssigned" />

  <ConfirmDialog
    v-model:open="confirmRemoveOpen"
    title="Quitar de la playlist"
    :description="removeConfirmDescription"
    confirm-label="Quitar"
    loading-label="Quitando..."
    :loading="removing"
    :error="removeError"
    @confirm="onConfirmRemove"
  />
</template>
