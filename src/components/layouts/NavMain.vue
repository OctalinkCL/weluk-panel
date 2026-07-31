<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Building2, Monitor, ListVideo, Images, Users } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useCurrentCompanyId } from '@/composables/useCurrentCompanyId'
import type { Role } from '@/types/profile'

const route = useRoute()
const authStore = useAuthStore()
const companyId = useCurrentCompanyId()

// `companyId: true` = la ruta vive bajo `/c/:companyId` y necesita el param
// en el link; las de gestión de companies (superadmin) no.
const NAV_ITEMS = [
  { label: 'Companies', routeName: 'admin-companies', icon: Building2, roles: ['superadmin'] as Role[], companyScoped: false },
  { label: 'Screens', routeName: 'screens', icon: Monitor, roles: ['superadmin', 'company_admin'] as Role[], companyScoped: true },
  { label: 'Playlists', routeName: 'playlists', icon: ListVideo, roles: ['superadmin', 'company_admin'] as Role[], companyScoped: true },
  { label: 'Media', routeName: 'media', icon: Images, roles: ['superadmin', 'company_admin'] as Role[], companyScoped: true },
  { label: 'Usuarios', routeName: 'users', icon: Users, roles: ['superadmin'] as Role[], companyScoped: true },
]

const visibleItems = computed(() =>
  NAV_ITEMS.filter((item) => authStore.role && item.roles.includes(authStore.role))
    // Sin company seleccionada (superadmin recién entrando, antes de elegir
    // una en Companies) no hay a dónde apuntar un link company-scoped.
    .filter((item) => !item.companyScoped || companyId.value),
)
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in visibleItems" :key="item.routeName">
          <SidebarMenuButton as-child :is-active="route.name === item.routeName">
            <router-link
              :to="item.companyScoped ? { name: item.routeName, params: { companyId } } : { name: item.routeName }"
            >
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
            </router-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
