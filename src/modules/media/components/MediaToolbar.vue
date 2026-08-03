<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Trash2, Plus } from '@lucide/vue'

defineProps<{
  selectedCount: number
  allSelected: boolean
  hasMedia: boolean
  uploading: boolean
  bulkAdding: boolean
  bulkDeleting: boolean
  canAdd: boolean
}>()

const emit = defineEmits<{
  'select-all': [checked: boolean]
  clear: []
  add: []
  delete: []
  upload: [files: File[]]
}>()

const fileInput = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length > 0) emit('upload', files)
}
</script>

<template>
  <div class="flex items-center justify-between gap-2 min-h-9">
    <div class="flex items-center gap-2">
      <label v-if="hasMedia" class="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox :model-value="allSelected" @update:model-value="(v) => emit('select-all', !!v)" />
        Seleccionar Todo
      </label>
    </div>

    <div class="flex items-center gap-2">
      <Button variant="outline" :disabled="bulkAdding || bulkDeleting" @click="emit('clear')"
        >Cancelar</Button
      >
      <!-- add -->
      <Button
        v-if="canAdd && selectedCount > 0"
        :disabled="bulkAdding || bulkDeleting"
        @click="emit('add')"
      >
        <Loader2 v-if="bulkAdding" class="animate-spin" />
        <Plus v-else />
        {{ bulkAdding ? 'Agregando...' : `Agregar ${selectedCount}` }}
      </Button>

      <!-- upload -->
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4"
        class="hidden"
        @change="onFileSelected"
      />
      <Button v-if="selectedCount === 0 || !canAdd" :disabled="uploading" @click="triggerUpload">
        <Plus /> {{ uploading ? 'Subiendo...' : 'Subir Archivo' }}
      </Button>

      <!-- delete -->
      <Button
        v-if="selectedCount > 0"
        :disabled="bulkAdding || bulkDeleting"
        variant="outline"
        class="text-muted-foreground"
        @click="emit('delete')"
      >
        <Loader2 v-if="bulkDeleting" class="animate-spin" />
        <Trash2 v-else />
      </Button>
    </div>
  </div>
</template>
