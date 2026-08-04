<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const MIN_SECONDS = 1
const UNITS = Array.from({ length: 60 }, (_, i) => i) // 0..59
const pad = (n: number) => String(n).padStart(2, '0')

// Elegir un minuto y después un segundo son dos selecciones discretas y
// seguidas. Sin coalescer, pasar de 0:08 a 2:00 sería 2 updates a
// playlist_items en vez de 1.
const COMMIT_DELAY_MS = 300

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits<{ commit: [value: number] }>()

const minutes = ref(Math.floor(props.modelValue / 60))
const seconds = ref(props.modelValue % 60)
let timer: ReturnType<typeof setTimeout> | undefined

// Puede cambiar desde afuera (refetch al agregar o quitar ítems).
watch(
  () => props.modelValue,
  (next) => {
    minutes.value = Math.floor(next / 60)
    seconds.value = next % 60
  },
)

const minutesStr = computed(() => String(minutes.value))
const secondsStr = computed(() => String(seconds.value))

function commit(nextMinutes: number, nextSeconds: number) {
  const total = nextMinutes * 60 + nextSeconds
  // 0:00 no es una duración válida — rechazado en silencio, los selects
  // vuelven a mostrar el último valor válido porque están controlados por
  // minutes/seconds y acá no se los toca.
  if (total < MIN_SECONDS) return

  minutes.value = nextMinutes
  seconds.value = nextSeconds

  clearTimeout(timer)
  timer = setTimeout(() => {
    if (total !== props.modelValue) emit('commit', total)
  }, COMMIT_DELAY_MS)
}

function onMinutesChange(value: string) {
  commit(Number(value), seconds.value)
}

function onSecondsChange(value: string) {
  commit(minutes.value, Number(value))
}

// position="popper" (necesario para que max-h-40 funcione, ver comentario en
// SelectContent) no alinea el ítem seleccionado con el trigger como hacía el
// modo por defecto — sin esto, el dropdown siempre abriría mostrando 00
// arriba de todo, aunque el valor actual sea 45. Solo puede haber un listbox
// abierto a la vez, así que alcanza con buscarlo en todo el documento.
function scrollToSelected(open: boolean) {
  if (!open) return
  nextTick(() => {
    document
      .querySelector<HTMLElement>('[role="listbox"] [role="option"][data-state="checked"]')
      ?.scrollIntoView({ block: 'center' })
  })
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="flex border rounded-lg">
    <div class="grid">
      <span class="text-[10px] font-medium px-2 pt-1">Minutos</span>
      <Select :model-value="minutesStr" @update:model-value="(v) => onMinutesChange(v as string)"
        @update:open="scrollToSelected">
        <SelectTrigger size="sm" class="w-15 text-xs border-0 font-mono">
          <SelectValue>{{ pad(minutes) }}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" class="max-h-80 min-w-15 font-mono p-px">
          <SelectItem v-for="m in UNITS" :key="m" :value="String(m)" class="text-xs">
            {{ pad(m) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="grid border-l">
      <span class="text-[10px] font-medium px-2 pt-1">Segundos</span>
      <Select :model-value="secondsStr" @update:model-value="(v) => onSecondsChange(v as string)"
        @update:open="scrollToSelected">
        <SelectTrigger size="sm" class="w-15 text-xs border-0 font-mono">
          <SelectValue>{{ pad(seconds) }}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" class="max-h-80 min-w-15 font-mono p-px">
          <SelectItem v-for="s in UNITS" :key="s" :value="String(s)" class="text-xs">
            {{ pad(s) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
