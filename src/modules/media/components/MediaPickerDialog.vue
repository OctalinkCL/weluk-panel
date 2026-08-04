<script setup lang="ts">
import { toRef, watch } from 'vue'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { XIcon } from '@lucide/vue'
import MediaToolbar from './MediaToolbar.vue'
import MediaGrid from './MediaGrid.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
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
  fetchExistingItems,
  bulkAdding,
  bulkDeleting,
  addSelected,
  deleteConfirmOpen,
  deleteConfirmDescription,
  requestDelete,
  confirmDelete,
} = useMediaLibrary(props.companyId, toRef(props, 'playlistId'))

// Reset al reabrir, no al agregar — así la selección no desaparece de
// golpe mientras el modal sigue visible cerrándose. También hay que
// refetchear qué media ya está en la playlist: este dialog queda montado
// durante toda la vida de PlaylistDetailView, así que sin esto un delete
// hecho fuera del picker (ej. desde la lista de la playlist) deja
// mediaIdsInPlaylist desactualizado hasta un refresh de página.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      clearSelection()
      fetchExistingItems()
    }
  },
)

async function onAdd() {
  await addSelected()
  emit('update:open', false)
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
          @delete="requestDelete"
          @upload="enqueueFiles"
        />
        <Button variant="ghost" class="shrink-0" @click="emit('update:open', false)">
          <XIcon />
          <span class="sr-only">Close</span>
        </Button>
      </div>

      <DialogTitle class="sr-only">Elegir contenido</DialogTitle>

      <p v-if="error || deleteError || addError" class="text-sm text-destructive">
        {{ error || deleteError || addError }}
      </p>

      <div class="overflow-y-auto min-h-120 lg:max-h-120">
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

  <ConfirmDialog
    v-model:open="deleteConfirmOpen"
    title="Eliminar archivos"
    :description="deleteConfirmDescription"
    :loading="bulkDeleting"
    :error="deleteError"
    @confirm="confirmDelete"
  />
</template>
