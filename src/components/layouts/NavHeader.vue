<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import CompanySwitcher from './CompanySwitcher.vue'

const authStore = useAuthStore()
</script>

<template>
  <CompanySwitcher v-if="authStore.role === 'superadmin'" />
  <SidebarMenu v-else>
    <SidebarMenuItem>
      <div class="px-2 py-2 text-sm font-medium">Weluk</div>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
