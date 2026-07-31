<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCurrentCompanyId } from '@/composables/useCurrentCompanyId'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Monitor, Pencil, Trash2, ImageIcon } from '@lucide/vue'
import { useScreens } from './composables/useScreens'
import { useDeleteScreen } from './composables/useDeleteScreen'
import { useScreenPresence } from './composables/useScreenPresence'
import PairScreenDialog from './components/PairScreenDialog.vue'
import EditScreenDialog from './components/EditScreenDialog.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { getMediaPublicUrl } from '@/lib/mediaStorage'
import type { Screen, ScreenStatus } from '@/types/screen'

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
    <header class="flex items-start justify-between lg:items-center">
      <div class="leading-tight">
        <h2 class="text-lg font-medium">Screens</h2>
        <p class="text-sm text-muted-foreground">Pantallas vinculadas a esta company.</p>
      </div>
      <PairScreenDialog v-if="companyId" :company-id="companyId" @paired="fetchScreens" />
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div v-if="loading" class="grid gap-2">
      <Skeleton class="h-9" v-for="i in 3" :key="i" />
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

    <div class="border rounded-lg overflow-hidden" v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Conexión</TableHead>
            <TableHead>Playlist</TableHead>
            <TableHead class="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in rows" :key="row.screen.id">
            <TableCell class="font-medium">{{ row.screen.name }}</TableCell>
            <TableCell>
              <span class="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                {{ row.statusLabel }}
              </span>
            </TableCell>
            <TableCell>
              <span v-if="row.screen.status !== 'paired'" class="text-sm text-muted-foreground">—</span>
              <span v-else class="flex items-center gap-1.5 text-sm">
                <span
                  class="size-2 rounded-full"
                  :class="row.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40'"
                />
                {{ row.isOnline ? 'En línea' : 'Sin conexión' }}
              </span>
            </TableCell>
            <TableCell>
              <span v-if="!row.playlistName" class="text-sm text-muted-foreground">Sin playlist</span>
              <div v-else class="flex items-center gap-2">
                <div class="size-8 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  <img
                    v-if="row.thumbnailUrl"
                    :src="row.thumbnailUrl"
                    alt=""
                    loading="lazy"
                    class="size-full object-cover"
                  />
                  <ImageIcon v-else class="size-4 text-muted-foreground" />
                </div>
                <span class="text-sm">{{ row.playlistName }}</span>
              </div>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" @click="openEdit(row.screen)">
                  <Pencil class="size-4" />
                  Editar
                </Button>
                <Button size="sm" variant="ghost" class="text-destructive hover:text-destructive"
                  :disabled="deleting" @click="openDeleteConfirm(row.screen)">
                  <Trash2 class="size-4" />
                  Eliminar
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>

  <EditScreenDialog v-model:open="editOpen" :screen="selectedScreen" @updated="fetchScreens" />

  <ConfirmDialog
    v-model:open="confirmDeleteOpen"
    title="Eliminar pantalla"
    :description="deleteConfirmDescription"
    :loading="deleting"
    :error="deleteError"
    @confirm="onConfirmDelete"
  />
</template>
