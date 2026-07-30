<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Users } from '@lucide/vue'
import { useUsers } from './composables/useUsers'
import InviteUserDialog from './components/InviteUserDialog.vue'
import { formatDate } from '@/lib/utils'
import type { Role } from '@/types/profile'

const route = useRoute()
const companyId = route.params.id as string
const { users, loading, error, fetchUsers } = useUsers(companyId)

const ROLE_LABEL: Record<Role, string> = {
  superadmin: 'Superadmin',
  company_admin: 'Admin de la company',
}
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="flex items-start justify-between lg:items-center">
      <div class="leading-tight">
        <h2 class="text-lg font-medium">Usuarios</h2>
        <p class="text-sm text-muted-foreground">Usuarios con acceso a esta company.</p>
      </div>
      <InviteUserDialog :company-id="companyId" @invited="fetchUsers" />
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div v-if="loading" class="grid gap-2">
      <Skeleton class="h-9" v-for="i in 3" :key="i" />
    </div>

    <Empty v-else-if="users.length === 0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>Sin usuarios</EmptyTitle>
        <EmptyDescription>Todavía no hay usuarios invitados a esta company.</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <div class="border rounded-lg overflow-hidden" v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Invitado el</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="user in users" :key="user.id">
            <TableCell class="font-medium">{{ user.full_name }}</TableCell>
            <TableCell>
              <span class="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                {{ ROLE_LABEL[user.role] }}
              </span>
            </TableCell>
            <TableCell>{{ formatDate(user.created_at) }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
