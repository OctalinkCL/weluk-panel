<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Video, ListVideo } from '@lucide/vue'
import { usePlaylist } from './composables/usePlaylist'
import { usePlaylistItems } from './composables/usePlaylistItems'
import { usePublishPlaylist } from './composables/usePublishPlaylist'
import MediaPickerDialog from '@/modules/media/components/MediaPickerDialog.vue'
import { getMediaPublicUrl } from '@/lib/mediaStorage'

const route = useRoute()
const companyId = route.params.id as string
const playlistId = route.params.playlistId as string

const { playlist, loading: loadingPlaylist, fetchPlaylist } = usePlaylist(playlistId)
const { items, loading, error, fetchItems } = usePlaylistItems(playlistId)
const { publishPlaylist, loading: publishing, error: publishError } = usePublishPlaylist()

const mediaOpen = ref(false)

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
  await fetchItems()
  await fetchPlaylist()
}

async function onPublish() {
  await publishPlaylist(playlistId)
  await fetchPlaylist()
}
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="flex items-start justify-between lg:items-center">
      <div class="leading-tight">
        <Skeleton v-if="loadingPlaylist" class="h-6 w-48" />
        <div v-else class="flex items-center gap-2">
          <h2 class="text-lg font-medium">{{ playlist?.name }}</h2>
          <span
            v-if="status"
            class="text-xs px-2 py-0.5 rounded-full border"
            :class="status === 'pending'
              ? 'bg-foreground text-background border-foreground'
              : 'bg-muted text-muted-foreground border-border'"
          >
            {{ STATUS_LABEL[status] }}
          </span>
        </div>
        <p class="text-sm text-muted-foreground">Contenido de la playlist.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="outline" @click="mediaOpen = true">Agregar contenido</Button>
        <Button size="sm" :disabled="publishing || items.length === 0" @click="onPublish">
          {{ publishing ? 'Publicando...' : status === 'draft' ? 'Publicar' : 'Publicar cambios' }}
        </Button>
      </div>
    </header>

    <p v-if="error || publishError" class="text-sm text-destructive">{{ error || publishError }}</p>

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

    <div v-else class="grid gap-2">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="flex items-center gap-4 border rounded-lg p-3"
      >
        <span class="text-sm text-muted-foreground w-5 text-center shrink-0">{{ index + 1 }}</span>

        <div class="size-16 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
          <img
            v-if="item.media.type === 'image'"
            :src="getMediaPublicUrl(item.media.storage_path)"
            class="size-full object-cover"
          />
          <Video v-else class="size-6 text-muted-foreground" />
        </div>

        <div class="flex-1 min-w-0 leading-tight">
          <p class="text-sm font-medium truncate">{{ fileName(item.media.storage_path) }}</p>
          <p class="text-xs text-muted-foreground">{{ item.media.type === 'image' ? 'Imagen' : 'Video' }}</p>
        </div>

        <span class="text-sm text-muted-foreground shrink-0">
          {{ item.duration_seconds ?? item.media.duration_seconds }}s
        </span>
      </div>
    </div>
  </div>

  <MediaPickerDialog
    v-model:open="mediaOpen"
    :company-id="companyId"
    :playlist-id="playlistId"
    @added="onAdded"
  />
</template>
