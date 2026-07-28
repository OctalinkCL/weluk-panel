<script setup lang="ts">
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/layouts/AppSidebar.vue'
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="border-b h-12 flex items-center px-4">
        <SidebarTrigger />
      </header>
      <div class="p-4 lg:p-6">
        <router-view />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
