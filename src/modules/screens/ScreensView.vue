<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Monitor, Pencil } from '@lucide/vue'
import { useScreens } from './composables/useScreens'
import { useDisconnectScreen } from './composables/useDisconnectScreen'
import PairScreenDialog from './components/PairScreenDialog.vue'
import EditScreenDialog from './components/EditScreenDialog.vue'
import { formatDate } from '@/lib/utils'
import type { Screen, ScreenStatus } from '@/types/screen'

const route = useRoute()
const authStore = useAuthStore()
const companyId = (route.params.id as string | undefined) ?? authStore.profile!.company_id!
const { screens, loading, error, fetchScreens } = useScreens(companyId)
const { disconnectScreen, loading: disconnecting } = useDisconnectScreen()

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

async function onDisconnect(screen: Screen) {
  if (!confirm(`¿Desconectar "${screen.name}"? Volverá a mostrar un código de pairing.`)) return
  await disconnectScreen(screen.id)
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
      <PairScreenDialog :company-id="companyId" @paired="fetchScreens" />
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div v-if="loading" class="grid gap-2">
      <Skeleton class="h-9" v-for="i in 3" :key="i" />
    </div>

    <Empty v-else-if="screens.length === 0">
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
            <TableHead>Última conexión</TableHead>
            <TableHead class="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="screen in screens" :key="screen.id">
            <TableCell class="font-medium">{{ screen.name }}</TableCell>
            <TableCell>
              <span class="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                {{ STATUS_LABEL[screen.status] }}
              </span>
            </TableCell>
            <TableCell>{{ screen.last_seen_at ? formatDate(screen.last_seen_at) : 'Nunca' }}</TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1">
                <Button size="sm" variant="ghost" @click="openEdit(screen)">
                  <Pencil class="size-4" />
                  Editar
                </Button>
                <Button
                  v-if="screen.status === 'paired'"
                  size="sm"
                  variant="ghost"
                  class="text-destructive hover:text-destructive"
                  :disabled="disconnecting"
                  @click="onDisconnect(screen)"
                >
                  Desconectar
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>

  <EditScreenDialog
    v-model:open="editOpen"
    :screen="selectedScreen"
    @updated="fetchScreens"
  />
</template>
