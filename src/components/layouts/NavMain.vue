<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Building2, Monitor } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/profile'

const route = useRoute()
const authStore = useAuthStore()

const NAV_ITEMS = [
  { label: 'Companies', routeName: 'admin-companies', icon: Building2, roles: ['superadmin'] as Role[] },
  { label: 'Screens', routeName: 'company-screens', icon: Monitor, roles: ['company_admin'] as Role[] },
]

const visibleItems = computed(() =>
  NAV_ITEMS.filter((item) => authStore.role && item.roles.includes(authStore.role)),
)
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in visibleItems" :key="item.routeName">
          <SidebarMenuButton as-child :is-active="route.name === item.routeName">
            <router-link :to="{ name: item.routeName }">
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
            </router-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
