<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Building2, Pencil } from '@lucide/vue'
import { useCompanies } from './composables/useCompanies'
import { useToggleCompany } from './composables/useToggleCompany'
import CreateCompanyDialog from './components/CreateCompanyDialog.vue'
import EditCompanyDialog from './components/EditCompanyDialog.vue'
import { formatDate } from '@/lib/utils'
import type { Company } from '@/types/company'

const router = useRouter()
const { companies, loading, error, fetchCompanies } = useCompanies()
const { toggleCompany, loading: toggling } = useToggleCompany()

const editOpen = ref(false)
const selectedCompany = ref<Company | null>(null)

function goToDetail(id: string) {
  router.push({ name: 'screens', params: { companyId: id } })
}

function openEdit(company: Company) {
  selectedCompany.value = company
  editOpen.value = true
}

async function onToggle(company: Company) {
  const action = company.is_active ? 'deshabilitar' : 'habilitar'
  if (!confirm(`¿Seguro que deseas ${action} "${company.name}"?`)) return
  await toggleCompany(company.id, !company.is_active)
  await fetchCompanies()
}
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
            <TableHead class="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="company in companies"
            :key="company.id"
            class="cursor-pointer"
            @click="goToDetail(company.id)"
          >
            <TableCell class="font-medium flex items-center gap-2">
              {{ company.name }}
              <span
                v-if="!company.is_active"
                class="text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border"
              >
                Deshabilitada
              </span>
            </TableCell>
            <TableCell>{{ formatDate(company.created_at) }}</TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-1" @click.stop>
                <Button size="sm" variant="ghost" @click="openEdit(company)">
                  <Pencil class="size-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  class="text-destructive hover:text-destructive"
                  :disabled="toggling"
                  @click="onToggle(company)"
                >
                  {{ company.is_active ? 'Deshabilitar' : 'Habilitar' }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>

  <EditCompanyDialog
    v-model:open="editOpen"
    :company="selectedCompany"
    @updated="fetchCompanies"
  />
</template>
