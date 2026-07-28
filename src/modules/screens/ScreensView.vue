<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Monitor } from '@lucide/vue'
import { useScreens } from './composables/useScreens'
import { formatDate } from '@/lib/utils'
import type { ScreenStatus } from '@/types/screen'

const route = useRoute()
const { screens, loading, error } = useScreens(route.params.id as string)

const STATUS_LABEL: Record<ScreenStatus, string> = {
  pending: 'Pendiente',
  paired: 'Pareada',
  disconnected: 'Desconectada',
}
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="leading-tight">
      <h2 class="text-lg font-medium">Screens</h2>
      <p class="text-sm text-muted-foreground">Pantallas vinculadas a esta company.</p>
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
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
