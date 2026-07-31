<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCurrentCompanyId } from '@/composables/useCurrentCompanyId'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { ListVideo, Trash2 } from '@lucide/vue'
import { usePlaylists } from './composables/usePlaylists'
import { useDeletePlaylist } from './composables/useDeletePlaylist'
import CreatePlaylistDialog from './components/CreatePlaylistDialog.vue'
import { formatDate } from '@/lib/utils'
import type { Playlist } from '@/types/playlist'

const router = useRouter()
// La vista se monta por ruta, así que el id no cambia mientras vive: se toma
// una vez (`usePlaylists` recibe un string, no un ref).
const companyId = useCurrentCompanyId().value!
const { playlists, loading, error, fetchPlaylists } = usePlaylists(companyId)
const { deletePlaylist, getScreensUsing, loading: deleting } = useDeletePlaylist()

function goToDetail(playlistId: string) {
  router.push({ name: 'playlist-detail', params: { companyId, playlistId } })
}

async function onDelete(playlist: Playlist) {
  const screenNames = await getScreensUsing(playlist.id)
  const usageWarning =
    screenNames.length > 0
      ? ` Está asignada a: ${screenNames.join(', ')}. Esas pantallas se quedarán sin playlist.`
      : ''

  if (!confirm(`¿Eliminar "${playlist.name}"?${usageWarning}`)) return
  await deletePlaylist(playlist.id)
  await fetchPlaylists()
}
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="flex items-start justify-between lg:items-center">
      <div class="leading-tight">
        <h2 class="text-lg font-medium">Playlists</h2>
        <p class="text-sm text-muted-foreground">Playlists de esta company.</p>
      </div>
      <CreatePlaylistDialog :company-id="companyId" />
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div v-if="loading" class="grid gap-2">
      <Skeleton class="h-9" v-for="i in 3" :key="i" />
    </div>

    <Empty v-else-if="playlists.length === 0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ListVideo />
        </EmptyMedia>
        <EmptyTitle>Sin playlists</EmptyTitle>
        <EmptyDescription>Todavía no hay playlists creadas para esta company.</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <div class="border rounded-lg overflow-hidden" v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead class="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="playlist in playlists"
            :key="playlist.id"
            class="cursor-pointer"
            @click="goToDetail(playlist.id)"
          >
            <TableCell class="font-medium">{{ playlist.name }}</TableCell>
            <TableCell>
              <span class="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                {{ playlist.published_at ? 'Publicada' : 'Borrador' }}
              </span>
            </TableCell>
            <TableCell>{{ formatDate(playlist.created_at) }}</TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end" @click.stop>
                <Button
                  size="sm"
                  variant="ghost"
                  class="text-destructive hover:text-destructive"
                  :disabled="deleting"
                  @click="onDelete(playlist)"
                >
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
</template>
