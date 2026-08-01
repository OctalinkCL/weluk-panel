<script setup lang="ts">
import MediaToolbar from './MediaToolbar.vue'
import MediaGrid from './MediaGrid.vue'
import { useMediaLibrary } from '../composables/useMediaLibrary'

const props = defineProps<{ companyId: string }>()

const {
  media,
  loading,
  error,
  deleteError,
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
  deleteSelected,
} = useMediaLibrary(props.companyId)
</script>

<template>
  <div class="grid gap-4">
    <MediaToolbar
      :selected-count="selectedIds.size"
      :all-selected="allSelected"
      :has-media="media.length > 0"
      :uploading="uploading"
      :bulk-adding="bulkAdding"
      :bulk-deleting="bulkDeleting"
      :can-add="false"
      @select-all="selectAll"
      @clear="clearSelection"
      @delete="deleteSelected"
      @upload="enqueueFiles"
    />

    <p v-if="error || deleteError" class="text-sm text-destructive">{{ error || deleteError }}</p>

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
</template>
