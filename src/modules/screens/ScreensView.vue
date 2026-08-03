<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCurrentCompanyId } from '@/composables/useCurrentCompanyId'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Monitor, Pencil, Trash2, EllipsisVertical, MonitorPlay, Film } from '@lucide/vue'
import { useScreens } from './composables/useScreens'
import { useDeleteScreen } from './composables/useDeleteScreen'
import { useScreenPresence } from './composables/useScreenPresence'
import PairScreenDialog from './components/PairScreenDialog.vue'
import EditScreenDialog from './components/EditScreenDialog.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { getMediaPublicUrl } from '@/lib/mediaStorage'
import type { Screen, ScreenStatus } from '@/types/screen'
import {
  ItemGroup,
  Item,
  ItemHeader,
  ItemContent,
  ItemDescription
} from '@/components/ui/item'
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

watch(screens, (list) => syncPresence(list.map((screen) => screen.device_uuid)), {
  immediate: true,
})

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
  return (
    screen.playlist?.playlist_items.find((item) => item.media?.thumbnail_path)?.media
      ?.thumbnail_path ?? null
  )
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
    ? `¿Eliminar "${screenToDelete.value.name}"? Dejará de reproducir contenido y deberá vincularse de nuevo.`
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
  <div class="grid gap-6">
    <!-- header -->
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="leading-tight">
        <h2 class="text-lg font-medium">Pantallas</h2>
        <p class="text-sm text-muted-foreground">Administra las pantallas de tu empresa.</p>
      </div>
      <PairScreenDialog v-if="companyId" :company-id="companyId" @paired="fetchScreens" />
    </header>

    <!-- error -->
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <!-- loading -->
    <div v-if="loading" class="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Skeleton class="h-68 md:h-56.75 bg-white rounded shadow-xs" v-for="i in 4" :key="i" />
    </div>

    <!-- empty -->
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
    <ItemGroup class="grid md:grid-cols-3 lg:grid-cols-4 gap-4" v-else>
      <!-- item -->
      <Item v-for="row in rows" :key="row.screen.id" class="bg-background gap-1 shadow-xs">
        <!-- header -->
        <ItemHeader class="items-start">
          <div>
            <p class="text-xs font-medium flex items-center gap-1 text-muted-foreground"
              v-if="row.screen.status === 'paired'">
              <span class="size-1.5 block rounded-full" :class="row.isOnline ? 'bg-emerald-500' : 'bg-stone-300'" />
              <span>{{ row.isOnline ? 'Conectada' : 'Desconectada' }}</span>
            </p>
            <h3 class="text-lg font-medium">{{ row.screen.name }}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon-sm">
                <EllipsisVertical class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        </ItemHeader>
        <ItemContent>
          <!-- image -->
          <div
            class="w-full bg-sky-950 text-white/80 aspect-video rounded flex items-center justify-center overflow-hidden">
            <!-- no_playlist_assigned -->
            <p v-if="!row.playlistName" class="font-mono font-medium text-xs">
              Sin Playlist asignada
            </p>
            <!-- playlist_assigned -->
            <div v-else>
              <!-- image -->
              <img v-if="row.thumbnailUrl" :src="row.thumbnailUrl" alt="" loading="lazy"
                class="size-full object-cover border" />
              <!-- icon -->
              <MonitorPlay v-else class="size-12 stroke-1" />
            </div>
          </div>
          <ItemDescription class="flex items-center gap-1.5 text-xs  mt-1">
            <Film :size="15" class="text-amber-500" /> Playlist: <span class="text-primary font-medium">
              {{ row.playlistName ?? 'Sin playlist' }}</span>
          </ItemDescription>
        </ItemContent>
      </Item>
      <!-- ./item -->
    </ItemGroup>
  </div>

  <!-- dialogs -->
  <EditScreenDialog v-model:open="editOpen" :screen="selectedScreen" @updated="fetchScreens" />
  <ConfirmDialog v-model:open="confirmDeleteOpen" title="Eliminar pantalla" :description="deleteConfirmDescription"
    :loading="deleting" :error="deleteError" @confirm="onConfirmDelete" />
</template>
