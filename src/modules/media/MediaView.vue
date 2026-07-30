<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MediaGrid from './components/MediaGrid.vue'

const route = useRoute()
const authStore = useAuthStore()
const companyId = (route.params.id as string | undefined) ?? authStore.profile!.company_id!
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="leading-tight">
      <h2 class="text-lg font-medium">Media</h2>
      <p class="text-sm text-muted-foreground">Biblioteca de contenido de esta company.</p>
    </header>

    <MediaGrid :company-id="companyId" />
  </div>
</template>
