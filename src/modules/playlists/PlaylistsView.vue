<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentCompanyId } from '@/composables/useCurrentCompanyId'
import { useCurrentCompanySlug } from '@/composables/useCurrentCompanySlug'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { ListVideo, Trash2, ImageOff, EllipsisVertical, Pencil, Calendar } from '@lucide/vue'
import { usePlaylists } from './composables/usePlaylists'
import { useDeletePlaylist } from './composables/useDeletePlaylist'
import CreatePlaylistDialog from './components/CreatePlaylistDialog.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { formatDate } from '@/lib/utils'
import { getMediaPublicUrl } from '@/lib/mediaStorage'
import type { Playlist, PlaylistWithThumbnail } from '@/types/playlist'

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

const router = useRouter()
// La vista se monta por ruta, así que ninguno de los dos cambia mientras
// vive: se toman una vez (`usePlaylists` recibe un string, no un ref).
const companyId = useCurrentCompanyId().value!
const companySlug = useCurrentCompanySlug().value!
const { playlists, loading, error, fetchPlaylists } = usePlaylists(companyId)
const { deletePlaylist, getScreensUsing, loading: deleting, error: deleteError } = useDeletePlaylist()

function playlistThumbnailUrl(playlist: PlaylistWithThumbnail) {
  const thumbnailPath = playlist.playlist_items[0]?.media?.thumbnail_path
  return thumbnailPath ? getMediaPublicUrl(thumbnailPath) : null
}

const rows = computed(() =>
  playlists.value.map((playlist) => ({
    playlist,
    thumbnailUrl: playlistThumbnailUrl(playlist),
  })),
)

function goToDetail(playlistId: string) {
  router.push({ name: 'playlist-detail', params: { companySlug, playlistId } })
}

const confirmDeleteOpen = ref(false)
const playlistToDelete = ref<Playlist | null>(null)
const screenNamesUsing = ref<string[]>([])

async function openDeleteConfirm(playlist: Playlist) {
  playlistToDelete.value = playlist
  screenNamesUsing.value = await getScreensUsing(playlist.id)
  confirmDeleteOpen.value = true
}

const deleteConfirmDescription = computed(() => {
  if (!playlistToDelete.value) return ''
  const usageWarning =
    screenNamesUsing.value.length > 0
      ? ` Está asignada a: ${screenNamesUsing.value.join(', ')}. Esas pantallas se quedarán sin playlist.`
      : ''
  return `¿Eliminar "${playlistToDelete.value.name}"?${usageWarning}`
})

async function onConfirmDelete() {
  if (!playlistToDelete.value) return

  const ok = await deletePlaylist(playlistToDelete.value.id)
  if (!ok) return

  confirmDeleteOpen.value = false
  playlistToDelete.value = null
  await fetchPlaylists()
}
</script>

<template>
  <div class="grid gap-6">
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="leading-tight">
        <h2 class="text-lg font-medium">Playlists</h2>
        <p class="text-sm text-muted-foreground">Creá y editá las playlists que se reproducirán en las pantallas.</p>
      </div>
      <CreatePlaylistDialog :company-id="companyId" />
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <!-- loading -->
    <div v-if="loading" class="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Skeleton class="h-68 md:h-56.75 bg-white rounded shadow-xs" v-for="i in 4" :key="i" />
    </div>

    <!-- empty -->
    <Empty v-else-if="playlists.length === 0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListVideo />
        </EmptyMedia>
        <EmptyTitle>Sin playlists</EmptyTitle>
        <EmptyDescription>Todavía no hay playlists creadas para esta company.</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <!-- playlist -->
    <ItemGroup class="grid md:grid-cols-3 lg:grid-cols-4 gap-4" v-else>
      <Item v-for="row in rows" :key="row.playlist.id" class="bg-background gap-1 shadow-xs">
        <!-- header -->
        <ItemHeader class="items-start">
          <div>
            <p class="text-xs font-medium flex items-center gap-1 text-muted-foreground">
              <span class="size-1.5 block rounded-full"
                :class="row.playlist.published_at ? 'bg-indigo-500' : 'bg-stone-300'" />
              {{ row.playlist.published_at ? 'Publicada' : 'Borrador' }}
            </p>
            <h3 class="text-lg font-medium cursor-pointer" @click="goToDetail(row.playlist.id)">{{ row.playlist.name }}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon-sm">
                <EllipsisVertical class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="goToDetail(row.playlist.id)">
                <Pencil class="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="deleting" @click="openDeleteConfirm(row.playlist)">
                <Trash2 class="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ItemHeader>
        <ItemContent>
          <!-- image -->
          <div
            class="w-full bg-indigo-500 text-white/80 aspect-video rounded flex items-center justify-center overflow-hidden cursor-pointer"
            @click="goToDetail(row.playlist.id)">
            <img v-if="row.thumbnailUrl" :src="row.thumbnailUrl" alt="" loading="lazy"
              class="size-full object-cover border" />
            <ImageOff v-else class="size-9 stroke-1" />
          </div>
          <ItemDescription class="flex items-center gap-1.5  text-xs  mt-1">
            <Calendar :size="15" class="text-stone" />Creada: <span class="text-primary font-medium">
              {{ formatDate(row.playlist.created_at) }}</span>
          </ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>

  </div>

  <ConfirmDialog v-model:open="confirmDeleteOpen" title="Eliminar playlist" :description="deleteConfirmDescription"
    :loading="deleting" :error="deleteError" @confirm="onConfirmDelete" />
</template>
