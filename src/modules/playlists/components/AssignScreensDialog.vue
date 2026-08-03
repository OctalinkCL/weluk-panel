<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Monitor } from '@lucide/vue'
import { useAssignPlaylistScreens } from '../composables/useAssignPlaylistScreens'

const props = defineProps<{
  open: boolean
  companyId: string
  playlistId: string
  publishedAt: string | null
}>()

const emit = defineEmits<{ 'update:open': [value: boolean]; assigned: [] }>()

const { screens, loading, saving, error, fetchScreens, assignScreens } = useAssignPlaylistScreens(
  props.companyId,
)
const selected = ref<Set<string>>(new Set())

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await fetchScreens()
    selected.value = new Set(
      screens.value.filter((s) => s.current_playlist_id === props.playlistId).map((s) => s.id),
    )
  },
)

const allSelected = computed(
  () => screens.value.length > 0 && selected.value.size === screens.value.length,
)

function toggleAll(checked: boolean) {
  selected.value = checked ? new Set(screens.value.map((s) => s.id)) : new Set()
}

function toggle(id: string, checked: boolean) {
  const next = new Set(selected.value)
  if (checked) next.add(id)
  else next.delete(id)
  selected.value = next
}

async function onSave() {
  const ok = await assignScreens(props.playlistId, Array.from(selected.value), props.publishedAt)
  if (ok) {
    emit('update:open', false)
    emit('assigned')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Asignar pantallas</DialogTitle>
      </DialogHeader>

      <Skeleton v-if="loading" class="h-61.75 rounded" />

      <Empty v-else-if="screens.length === 0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Monitor />
          </EmptyMedia>
          <EmptyTitle>Sin pantallas</EmptyTitle>
          <EmptyDescription>Aun no tiene pantallas vinculadas.</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <div v-else class="grid gap-1 max-h-80 overflow-y-auto border rounded">
        <label
          class="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer font-medium text-sm"
        >
          <Checkbox :model-value="allSelected" @update:model-value="(v) => toggleAll(!!v)" />
          Seleccionar todas
        </label>
        <Separator />
        <div class="h-50 overflow-y-auto px-1">
          <label
            v-for="screen in screens"
            :key="screen.id"
            class="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer text-sm"
          >
            <Checkbox
              :model-value="selected.has(screen.id)"
              @update:model-value="(v) => toggle(screen.id, !!v)"
            />
            <Monitor class="size-4 text-muted-foreground shrink-0" />
            <span class="truncate">{{ screen.name }}</span>
          </label>
        </div>
      </div>

      <p v-if="!publishedAt && screens.length > 0" class="text-sm text-muted-foreground">
        Esta playlist está en borrador — se publica automáticamente al guardar la asignación.
      </p>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <DialogFooter>
        <Button :disabled="saving || loading || screens.length === 0" @click="onSave">
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
