<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompany } from '@/modules/companies/composables/useCompany'

const route = useRoute()
const { company, loading } = useCompany(route.params.id as string)
</script>

<template>
  <div class="grid gap-4 lg:gap-6">
    <div>
      <router-link
        to="/admin/companies"
        class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft class="size-4" />
        Companies
      </router-link>
      <Skeleton v-if="loading" class="h-7 w-48 mt-1" />
      <h1 v-else class="text-xl font-medium mt-1">{{ company?.name }}</h1>
    </div>

    <router-view />
  </div>
</template>
