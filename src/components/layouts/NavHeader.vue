<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import AppLogo from '@/components/shared/AppLogo.vue'
import CompanySwitcher from './CompanySwitcher.vue'

const authStore = useAuthStore()
</script>

<template>
  <SidebarMenu>
    <!-- logo -->
    <SidebarMenuItem class="pt-3 pb-5 flex items-center justify-between">
      <AppLogo class="w-24 fill-primary" />
    </SidebarMenuItem>
    <!-- company switcher -->
    <SidebarMenuItem v-if="authStore.role === 'superadmin'">
      <CompanySwitcher />
    </SidebarMenuItem>
  </SidebarMenu>
</template>
