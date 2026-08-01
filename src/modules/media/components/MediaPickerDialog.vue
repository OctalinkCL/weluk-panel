<script setup lang="ts">
import { toRef } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { XIcon } from '@lucide/vue'
import MediaToolbar from './MediaToolbar.vue'
import MediaGrid from './MediaGrid.vue'
import { useMediaLibrary } from '../composables/useMediaLibrary'

const props = defineProps<{
  open: boolean
  companyId: string
  playlistId: string
}>()

const emit = defineEmits<{ 'update:open': [value: boolean]; added: [] }>()

const {
  media,
  loading,
  error,
  deleteError,
  addError,
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
} = useMediaLibrary(props.companyId, toRef(props, 'playlistId'))

async function onAdd() {
  await addSelected()
  emit('added')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-3xl max-h-[85vh] flex flex-col gap-3" :show-close-button="false">
      <div class="flex items-start gap-2">
        <MediaToolbar
          class="flex-1"
          :selected-count="selectedIds.size"
          :all-selected="allSelected"
          :has-media="media.length > 0"
          :uploading="uploading"
          :bulk-adding="bulkAdding"
          :bulk-deleting="bulkDeleting"
          :can-add="true"
          @select-all="selectAll"
          @clear="clearSelection"
          @add="onAdd"
          @delete="deleteSelected"
          @upload="enqueueFiles"
        />
        <Button variant="ghost" size="icon-sm" class="shrink-0" @click="emit('update:open', false)">
          <XIcon />
          <span class="sr-only">Close</span>
        </Button>
      </div>

      <DialogHeader>
        <DialogTitle>Elegir contenido</DialogTitle>
        <DialogDescription>
          Selecciona uno o más archivos y luego agrégalos a la playlist. Si no está, súbelo aquí mismo.
        </DialogDescription>
      </DialogHeader>

      <p v-if="error || deleteError || addError" class="text-sm text-destructive">
        {{ error || deleteError || addError }}
      </p>

      <div class="overflow-y-auto">
        <MediaGrid
          :media="media"
          :loading="loading"
          :queue="queue"
          :selected-ids="selectedIds"
          :media-ids-in-playlist="mediaIdsInPlaylist"
          @toggle="toggleSelected"
          @remove-queued="removeFromQueue"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>
