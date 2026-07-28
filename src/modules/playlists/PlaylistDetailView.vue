<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Video, ListVideo } from '@lucide/vue'
import { usePlaylist } from './composables/usePlaylist'
import { usePlaylistItems } from './composables/usePlaylistItems'
import { getMediaPublicUrl } from '@/lib/mediaStorage'

const route = useRoute()
const playlistId = route.params.playlistId as string

const { playlist, loading: loadingPlaylist } = usePlaylist(playlistId)
const { items, loading, error } = usePlaylistItems(playlistId)

function fileName(storagePath: string) {
  return storagePath.split('/').pop()
}
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="leading-tight">
      <Skeleton v-if="loadingPlaylist" class="h-6 w-48" />
      <h2 v-else class="text-lg font-medium">{{ playlist?.name }}</h2>
      <p class="text-sm text-muted-foreground">Contenido de la playlist.</p>
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

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
</template>
