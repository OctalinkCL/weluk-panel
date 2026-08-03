<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Video, Images, Check, Loader2, TriangleAlert, X } from '@lucide/vue'
import { getMediaPublicUrl } from '@/lib/mediaStorage'
import type { Media } from '@/types/media'

type QueueItem = {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'error'
  error?: string
}

defineProps<{
  media: Media[]
  loading: boolean
  queue: QueueItem[]
  selectedIds: Set<string>
  mediaIdsInPlaylist: Set<string>
}>()

const emit = defineEmits<{ toggle: [id: string]; 'remove-queued': [id: string] }>()

function fileName(storagePath: string) {
  return storagePath.split('/').pop()
}
</script>

<template>
  <div>
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

    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
      <!-- items en cola -->
      <div v-for="item in queue" :key="item.id" class="relative border rounded-lg overflow-hidden">
        <div class="aspect-video bg-muted flex items-center justify-center relative">
          <Skeleton class="absolute inset-0" />
          <Loader2
            v-if="item.status === 'uploading'"
            class="relative size-6 animate-spin text-muted-foreground"
          />
          <TriangleAlert
            v-else-if="item.status === 'error'"
            class="relative size-6 text-destructive"
          />
        </div>
        <div class="p-2 flex items-center justify-between gap-1">
          <div class="min-w-0">
            <p class="text-xs font-medium truncate">{{ item.file.name }}</p>
            <p v-if="item.status === 'error'" class="text-xs truncate text-destructive">
              {{ item.error }}
            </p>
          </div>
          <Button
            v-if="item.status === 'error'"
            size="icon-sm"
            variant="ghost"
            class="shrink-0"
            @click="emit('remove-queued', item.id)"
          >
            <X class="size-3.5" />
          </Button>
        </div>
      </div>

      <!-- items -->
      <div
        v-for="item in media"
        :key="item.id"
        class="group relative border rounded-lg overflow-hidden cursor-pointer hover:border-foreground transition"
        :class="[
          selectedIds.has(item.id) ? 'ring-3 ring-blue-600' : '',
          mediaIdsInPlaylist.has(item.id) ? 'opacity-60' : '',
        ]"
        @click="emit('toggle', item.id)"
      >
        <div class="aspect-video bg-muted flex items-center justify-center">
          <img
            v-if="item.thumbnail_path || item.type === 'image'"
            :src="getMediaPublicUrl(item.thumbnail_path ?? item.storage_path)"
            loading="lazy"
            class="size-full object-cover"
          />
          <Video v-else class="size-6 text-muted-foreground" />
        </div>
        <div class="p-2">
          <p class="text-xs font-medium truncate">{{ fileName(item.storage_path) }}</p>
          <p class="text-xs text-muted-foreground">
            {{ item.type === 'image' ? 'Imagen' : 'Video' }}
          </p>
        </div>

        <div
          v-if="mediaIdsInPlaylist.has(item.id)"
          class="absolute top-1 left-1 size-5 rounded-full bg-foreground text-background flex items-center justify-center"
        >
          <Check class="size-3" />
        </div>
      </div>
    </div>
  </div>
</template>
