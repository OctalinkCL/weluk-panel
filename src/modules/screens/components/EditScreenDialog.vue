<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useEditScreen } from '../composables/useEditScreen'
import type { Screen } from '@/types/screen'

const props = defineProps<{
  open: boolean
  screen: Screen | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  updated: []
}>()

const name = ref('')
const { editScreen, loading, error } = useEditScreen()

watch(
  () => props.screen,
  (screen) => {
    name.value = screen?.name ?? ''
  },
)

async function onSubmit() {
  if (!props.screen) return
  const updated = await editScreen(props.screen.id, name.value)
  if (updated) {
    emit('update:open', false)
    emit('updated')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar pantalla</DialogTitle>
        <DialogDescription>Actualiza el nombre de la pantalla.</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="onSubmit">
        <div class="grid gap-1.5">
          <label for="edit-screen-name" class="text-sm font-medium">Nombre</label>
          <Input id="edit-screen-name" v-model="name" required placeholder="Nombre descriptivo" />
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <DialogFooter>
          <Button type="submit" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
