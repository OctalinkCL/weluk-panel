<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Building2, ChevronsUpDown, Check, Settings } from '@lucide/vue'
import { useCompanies } from '@/modules/companies/composables/useCompanies'
import { useCurrentCompanyStore } from '@/stores/currentCompany'

// Solo para superadmin: reemplaza "salir a Companies y volver a entrar" por
// cambiar de cliente sin perder el sidebar/layout. company_admin nunca ve
// esto — solo tiene una company, no hay nada que elegir.
const route = useRoute()
const router = useRouter()
const { companies, loading } = useCompanies()
const companyStore = useCurrentCompanyStore()

// Rutas company-scoped (ver workspace.routes.ts). Si estamos en una que no lo
// es (ej. admin-companies) o en el detalle de una playlist de la company
// vieja, cambiar de cliente cae a Screens en vez de arrastrar el sub-path.
const COMPANY_SCOPED_ROUTES = new Set(['screens', 'playlists', 'media', 'users'])

function selectCompany(slug: string) {
  const routeName =
    typeof route.name === 'string' && COMPANY_SCOPED_ROUTES.has(route.name) ? route.name : 'screens'
  router.push({ name: routeName, params: { companySlug: slug } })
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton size="lg">
            <Building2 class="size-4 shrink-0" />
            <span class="truncate">{{ companyStore.company?.name ?? 'Elegir company' }}</span>
            <ChevronsUpDown class="ml-auto size-4 shrink-0 text-muted-foreground" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem v-if="loading" disabled>Cargando...</DropdownMenuItem>
          <DropdownMenuItem
            v-for="company in companies"
            :key="company.id"
            @select="selectCompany(company.slug)"
          >
            <Check v-if="company.id === companyStore.company?.id" class="size-4" />
            <span v-else class="size-4" />
            <span class="truncate">{{ company.name }}</span>
            <span
              v-if="!company.is_active"
              class="ml-auto text-xs text-muted-foreground"
            >
              Deshabilitada
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem as-child>
            <router-link :to="{ name: 'admin-companies' }">
              <Settings class="size-4" />
              Gestionar companies
            </router-link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
