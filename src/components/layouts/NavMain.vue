<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Building2, Monitor, ListVideo, Images, Users } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useCurrentCompanySlug } from '@/composables/useCurrentCompanySlug'
import { useCurrentCompanyStore } from '@/stores/currentCompany'
import type { Role } from '@/types/profile'

const route = useRoute()
const authStore = useAuthStore()
const routeCompanySlug = useCurrentCompanySlug()
const currentCompanyStore = useCurrentCompanyStore()

// Fuera de `/c/:companySlug` (ej. /profile) no hay slug en la URL. Un
// company_admin tiene una sola company siempre (profile.company, ya
// resuelto en cada fetchProfile — sobrevive un reload en frío, a diferencia
// del store de navegación) así que ni siquiera depende de la URL. Un
// superadmin no tiene company fija: usa la última resuelta por guards.ts en
// esta sesión (currentCompanyStore), que se pierde en una carga en frío de
// una ruta sin slug — aceptado a propósito (superadmin tiene workaround
// manual: entrar primero por Companies).
const companySlug = computed(() => {
  if (authStore.role === 'company_admin') return authStore.profile?.company?.slug ?? null
  return routeCompanySlug.value ?? currentCompanyStore.company?.slug ?? null
})

// `companyScoped: true` = la ruta vive bajo `/c/:companySlug` y necesita el
// slug en el link; las de gestión de companies (superadmin) no.
const NAV_ITEMS = [
  {
    label: 'Companies',
    routeName: 'admin-companies',
    icon: Building2,
    roles: ['superadmin'] as Role[],
    companyScoped: false,
  },
  {
    label: 'Screens',
    routeName: 'screens',
    icon: Monitor,
    roles: ['superadmin', 'company_admin'] as Role[],
    companyScoped: true,
  },
  {
    label: 'Playlists',
    routeName: 'playlists',
    icon: ListVideo,
    roles: ['superadmin', 'company_admin'] as Role[],
    companyScoped: true,
  },
  {
    label: 'Media',
    routeName: 'media',
    icon: Images,
    roles: ['superadmin', 'company_admin'] as Role[],
    companyScoped: true,
  },
  {
    label: 'Usuarios',
    routeName: 'users',
    icon: Users,
    roles: ['superadmin'] as Role[],
    companyScoped: true,
  },
]

const visibleItems = computed(() =>
  NAV_ITEMS.filter((item) => authStore.role && item.roles.includes(authStore.role))
    // Sin company seleccionada (superadmin recién entrando, antes de elegir
    // una en Companies) no hay a dónde apuntar un link company-scoped.
    .filter((item) => !item.companyScoped || companySlug.value),
)
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu class="gap-1">
        <SidebarMenuItem v-for="item in visibleItems" :key="item.routeName">
          <SidebarMenuButton
            as-child
            :is-active="route.name === item.routeName"
            class="text-primary"
          >
            <router-link
              :to="
                item.companyScoped
                  ? { name: item.routeName, params: { companySlug } }
                  : { name: item.routeName }
              "
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
