<script setup lang="ts">
import { useCurrentCompanyId } from '@/composables/useCurrentCompanyId'
import MediaLibrary from './components/MediaLibrary.vue'

const companyId = useCurrentCompanyId()
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <header class="leading-tight">
      <h2 class="text-lg font-medium">Media</h2>
      <p class="text-sm text-muted-foreground">Biblioteca de contenido de esta company.</p>
    </header>

    <MediaLibrary v-if="companyId" :company-id="companyId" />
  </div>
</template>
