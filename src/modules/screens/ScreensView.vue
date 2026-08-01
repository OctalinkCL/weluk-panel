<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCurrentCompanyId } from '@/composables/useCurrentCompanyId'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Monitor, Pencil, Trash2, ImageIcon, EllipsisVertical } from '@lucide/vue'
import { useScreens } from './composables/useScreens'
import { useDeleteScreen } from './composables/useDeleteScreen'
import { useScreenPresence } from './composables/useScreenPresence'
import PairScreenDialog from './components/PairScreenDialog.vue'
import EditScreenDialog from './components/EditScreenDialog.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { getMediaPublicUrl } from '@/lib/mediaStorage'
import type { Screen, ScreenStatus } from '@/types/screen'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const companyId = useCurrentCompanyId()
const { screens, loading, error, fetchScreens } = useScreens(companyId)
const { deleteScreen, loading: deleting, error: deleteError } = useDeleteScreen()
const { onlineDeviceUuids, sync: syncPresence } = useScreenPresence()

watch(
  screens,
  (list) => syncPresence(list.map((screen) => screen.device_uuid)),
  { immediate: true },
)

const STATUS_LABEL: Record<ScreenStatus, string> = {
  pending: 'Pendiente',
  paired: 'Pareada',
  disconnected: 'Desconectada',
}

const editOpen = ref(false)
const selectedScreen = ref<Screen | null>(null)

function openEdit(screen: Screen) {
  selectedScreen.value = screen
  editOpen.value = true
}

// No importa qué ítem de la playlist se muestre — solo sirve de vistazo.
// Playlists viejas sin thumbnail generado caen al ícono, no al original.
function screenThumbnailPath(screen: Screen) {
  return screen.playlist?.playlist_items.find((item) => item.media?.thumbnail_path)?.media?.thumbnail_path ?? null
}

const rows = computed(() =>
  screens.value.map((screen) => {
    const thumbnailPath = screenThumbnailPath(screen)
    return {
      screen,
      statusLabel: STATUS_LABEL[screen.status],
      isOnline: onlineDeviceUuids.value.has(screen.device_uuid),
      thumbnailUrl: thumbnailPath ? getMediaPublicUrl(thumbnailPath) : null,
      playlistName: screen.playlist?.name ?? null,
    }
  }),
)

const confirmDeleteOpen = ref(false)
const screenToDelete = ref<Screen | null>(null)

function openDeleteConfirm(screen: Screen) {
  screenToDelete.value = screen
  confirmDeleteOpen.value = true
}

const deleteConfirmDescription = computed(() =>
  screenToDelete.value
    ? `¿Eliminar "${screenToDelete.value.name}"? Dejará de reproducir contenido y deberá vincularse de nuevo. Otra company podrá vincular este dispositivo.`
    : '',
)

async function onConfirmDelete() {
  if (!screenToDelete.value) return

  const ok = await deleteScreen(screenToDelete.value.id)
  if (!ok) return

  confirmDeleteOpen.value = false
  screenToDelete.value = null
  await fetchScreens()
}
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <!-- header -->
    <header class="flex items-start justify-between lg:items-center">
      <div class="leading-tight">
        <h2 class="text-lg font-medium">Screens</h2>
        <p class="text-sm text-muted-foreground">Pantallas vinculadas a esta company.</p>
      </div>
      <PairScreenDialog v-if="companyId" :company-id="companyId" @paired="fetchScreens" />
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div v-if="loading" class="grid gap-4 lg:grid-cols-5">
      <Skeleton class="h-55 bg-stone-200" v-for="i in 5" :key="i" />
    </div>

    <Empty v-else-if="rows.length === 0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Monitor />
        </EmptyMedia>
        <EmptyTitle>Sin screens</EmptyTitle>
        <EmptyDescription>Todavía no hay pantallas vinculadas a esta company.</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <!-- screens -->
    <div class="grid gap-4 lg:grid-cols-5" v-else>
      <!-- grid screens -->
      <div v-for="row in rows" :key="row.screen.id" class="bg-background rounded p-2 flex flex-col gap-2">
        <!-- name -->
        <header class="flex items-center gap-2">
          <div>
            <span v-if="row.screen.status !== 'paired'" class="text-sm text-muted-foreground">—</span>
            <span v-else>
              <span class="size-3 block rounded-full" :class="row.isOnline ? 'bg-emerald-500' : 'bg-red-400'" />
            </span>
          </div>
          <h6 class="text-base font-semibold">
            {{ row.screen.name }}
            <span class="text-xs text-muted-foreground font-normal ml-2">{{ row.statusLabel }}</span>
          </h6>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="ml-auto w-7">
                <EllipsisVertical class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="openEdit(row.screen)">
                <Pencil class="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem @click="openDeleteConfirm(row.screen)">
                <Trash2 class="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <!-- image -->
        <div class="bg-accent rounded h-33 flex items-center justify-center border overflow-hidden">
          <span v-if="!row.playlistName" class="text-sm text-muted-foreground font-mono">
            [Sin playlist]
          </span>
          <div v-else>
            <div>
              <img v-if="row.thumbnailUrl" :src="row.thumbnailUrl" alt="" loading="lazy"
                class="size-full object-cover" />
              <ImageIcon v-else class="size-12 text-stone-400 stroke-1" />
            </div>

          </div>
        </div>
        <!-- playlist -->
        <p class="border rounded p-2 text-sm">Playlist: <span class="font-semibold">{{ row.playlistName }}</span></p>
      </div>
    </div>
  </div>

  <EditScreenDialog v-model:open="editOpen" :screen="selectedScreen" @updated="fetchScreens" />

  <ConfirmDialog v-model:open="confirmDeleteOpen" title="Eliminar pantalla" :description="deleteConfirmDescription"
    :loading="deleting" :error="deleteError" @confirm="onConfirmDelete" />
</template>
