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
import { useEditCompany } from '../composables/useEditCompany'
import type { Company } from '@/types/company'

const props = defineProps<{
  open: boolean
  company: Company | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  updated: []
}>()

const name = ref('')
const { editCompany, loading, error } = useEditCompany()

watch(
  () => props.company,
  (company) => {
    name.value = company?.name ?? ''
  },
)

async function onSubmit() {
  if (!props.company) return
  const updated = await editCompany(props.company.id, name.value)
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
        <DialogTitle>Editar company</DialogTitle>
        <DialogDescription>Actualiza el nombre del cliente.</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="onSubmit">
        <div class="grid gap-1.5">
          <label for="edit-name" class="text-sm font-medium">Nombre</label>
          <Input id="edit-name" v-model="name" required placeholder="Nombre del cliente" />
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
