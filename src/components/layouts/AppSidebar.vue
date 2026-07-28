<script setup lang="ts">
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar'

import NavHeader from '@/components/layouts/NavHeader.vue'
import NavMain from '@/components/layouts/NavMain.vue'
import NavFooter from '@/components/layouts/NavFooter.vue'
</script>

<template>
  <Sidebar>
    <SidebarHeader>
      <NavHeader />
    </SidebarHeader>
    <SidebarContent>
      <NavMain />
    </SidebarContent>
    <SidebarFooter>
      <NavFooter />
    </SidebarFooter>
  </Sidebar>
</template>
