<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import MediaGrid from './MediaGrid.vue'

defineProps<{
  open: boolean
  companyId: string
  playlistId: string
}>()

const emit = defineEmits<{ 'update:open': [value: boolean]; added: [] }>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Elegir contenido</DialogTitle>
        <DialogDescription>
          Selecciona uno o más archivos y luego agrégalos a la playlist. Si no está, súbelo aquí mismo.
        </DialogDescription>
      </DialogHeader>

      <MediaGrid
        :company-id="companyId"
        mode="pick"
        :playlist-id="playlistId"
        @added="emit('added')"
      />
    </DialogContent>
  </Dialog>
</template>
