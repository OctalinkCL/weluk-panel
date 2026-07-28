<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Video, Trash2, Images } from '@lucide/vue'
import { useMedia } from '../composables/useMedia'
import { useUploadMedia } from '../composables/useUploadMedia'
import { useDeleteMedia } from '../composables/useDeleteMedia'
import { getMediaPublicUrl } from '@/lib/mediaStorage'
import type { Media } from '@/types/media'

const props = defineProps<{ open: boolean; companyId: string }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const { media, loading, error, fetchMedia } = useMedia(props.companyId)
const { uploadMedia, loading: uploading, error: uploadError } = useUploadMedia()
const { deleteMedia, loading: deleting, error: deleteError } = useDeleteMedia()

const fileInput = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  fileInput.value?.click()
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const uploaded = await uploadMedia(props.companyId, file)
  if (uploaded) await fetchMedia()
  input.value = ''
}

function fileName(storagePath: string) {
  return storagePath.split('/').pop()
}

async function onDelete(item: Media) {
  if (!confirm(`¿Eliminar "${fileName(item.storage_path)}"? Se quitará también de cualquier playlist que lo use.`)) return
  await deleteMedia(item)
  await fetchMedia()
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Media</DialogTitle>
        <DialogDescription>Archivos disponibles para esta company.</DialogDescription>
      </DialogHeader>

      <div class="flex justify-end">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          class="hidden"
          @change="onFileSelected"
        />
        <Button size="sm" :disabled="uploading" @click="triggerUpload">
          {{ uploading ? 'Subiendo...' : 'Subir archivo' }}
        </Button>
      </div>

      <p v-if="error || uploadError || deleteError" class="text-sm text-destructive">
        {{ error || uploadError || deleteError }}
      </p>

      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Skeleton class="aspect-video" v-for="i in 4" :key="i" />
      </div>

      <Empty v-else-if="media.length === 0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Images />
          </EmptyMedia>
          <EmptyTitle>Sin archivos</EmptyTitle>
          <EmptyDescription>Todavía no se ha subido contenido para esta company.</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="item in media" :key="item.id" class="group relative border rounded-lg overflow-hidden">
          <div class="aspect-video bg-muted flex items-center justify-center">
            <img
              v-if="item.type === 'image'"
              :src="getMediaPublicUrl(item.storage_path)"
              class="size-full object-cover"
            />
            <Video v-else class="size-6 text-muted-foreground" />
          </div>
          <div class="p-2">
            <p class="text-xs font-medium truncate">{{ fileName(item.storage_path) }}</p>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            class="absolute top-1 right-1 bg-background/80 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100"
            :disabled="deleting"
            @click="onDelete(item)"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
