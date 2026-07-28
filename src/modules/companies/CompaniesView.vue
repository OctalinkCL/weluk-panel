<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Building2 } from '@lucide/vue'
import { useCompanies } from './composables/useCompanies'
import CreateCompanyDialog from './components/CreateCompanyDialog.vue'
import { formatDate } from '@/lib/utils'

const { companies, loading, error, fetchCompanies } = useCompanies()
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="flex items-start justify-between lg:items-center">
      <div class="leading-tight">
        <h1 class="text-xl font-medium">Companies</h1>
        <p class="text-sm text-muted-foreground">Clientes administrados en Weluk.</p>
      </div>
      <CreateCompanyDialog @created="fetchCompanies" />
    </header>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <div v-if="loading" class="grid gap-2">
      <Skeleton class="h-9" v-for="i in 4" :key="i" />
    </div>

    <Empty v-else-if="companies.length === 0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Building2 />
        </EmptyMedia>
        <EmptyTitle>Sin companies</EmptyTitle>
        <EmptyDescription>Todavía no hay companies creadas.</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <div class="border rounded-lg overflow-hidden" v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Creada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="company in companies" :key="company.id">
            <TableCell class="font-medium">{{ company.name }}</TableCell>
            <TableCell>{{ formatDate(company.created_at) }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
