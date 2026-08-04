<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useCreateCompany } from '../composables/useCreateCompany'

const emit = defineEmits<{ created: [] }>()

const open = ref(false)
const name = ref('')
const { createCompany, loading, error } = useCreateCompany()

async function onSubmit() {
  const company = await createCompany(name.value)
  if (company) {
    name.value = ''
    open.value = false
    emit('created')
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button>Default</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nueva company</DialogTitle>
        <DialogDescription>Crea un cliente nuevo en Weluk.</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="onSubmit">
        <div class="grid gap-1.5">
          <label for="name" class="text-sm font-medium">Nombre</label>
          <Input id="name" v-model="name" required placeholder="Nombre del cliente" />
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <DialogFooter>
          <Button type="submit" :disabled="loading">
            {{ loading ? 'Creando...' : 'Crear company' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
