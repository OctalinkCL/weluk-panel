<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import AppSidebar from '@/components/layouts/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function onLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="border-b h-12 flex items-center px-4">
        <SidebarTrigger />
        <Button variant="ghost" size="sm" class="ml-auto" @click="onLogout">Cerrar sesión</Button>
      </header>
      <div class="p-4 lg:p-6">
        <router-view />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
