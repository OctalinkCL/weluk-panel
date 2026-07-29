<script setup lang="ts">
import { useRoute } from 'vue-router'
import MediaGrid from './components/MediaGrid.vue'

const route = useRoute()
const companyId = route.params.id as string
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
