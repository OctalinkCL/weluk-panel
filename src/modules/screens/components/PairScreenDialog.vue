<script setup lang="ts">
import { ref, computed } from 'vue'
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
import { usePairScreen } from '../composables/usePairScreen'

const props = defineProps<{ companyId: string }>()
const emit = defineEmits<{ paired: [] }>()

const open = ref(false)
const rawCode = ref('')
const code = computed({
  get: () => rawCode.value,
  set: (value: string) => {
    rawCode.value = value.toUpperCase()
  },
})
const name = ref('')
const { pairScreen, loading, error } = usePairScreen()

async function onSubmit() {
  const screen = await pairScreen(props.companyId, code.value, name.value)
  if (screen) {
    code.value = ''
    name.value = ''
    open.value = false
    emit('paired')
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button size="sm">Vincular pantalla</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Vincular pantalla</DialogTitle>
        <DialogDescription>Ingresa el código que muestra la pantalla.</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="onSubmit">
        <div class="grid gap-1.5">
          <label for="code" class="text-sm font-medium">Código</label>
          <Input id="code" v-model="code" required placeholder="XXXXX" />
        </div>

        <div class="grid gap-1.5">
          <label for="screen-name" class="text-sm font-medium">Nombre</label>
          <Input id="screen-name" v-model="name" required placeholder="Nombre descriptivo" />
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <DialogFooter>
          <Button type="submit" :disabled="loading">
            {{ loading ? 'Vinculando...' : 'Vincular pantalla' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
