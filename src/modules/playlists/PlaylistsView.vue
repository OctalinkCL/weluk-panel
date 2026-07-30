<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { ListVideo } from '@lucide/vue'
import { usePlaylists } from './composables/usePlaylists'
import CreatePlaylistDialog from './components/CreatePlaylistDialog.vue'
import { formatDate } from '@/lib/utils'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const companyId = (route.params.id as string | undefined) ?? authStore.profile!.company_id!
const { playlists, loading, error } = usePlaylists(companyId)

function goToDetail(playlistId: string) {
  if (route.params.id) {
    router.push({ name: 'admin-playlist-detail', params: { id: companyId, playlistId } })
  } else {
    router.push({ name: 'company-playlist-detail', params: { playlistId } })
  }
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
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
