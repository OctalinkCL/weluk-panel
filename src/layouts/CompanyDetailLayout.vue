<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Images } from '@lucide/vue'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useCompany } from '@/modules/companies/composables/useCompany'
import MediaLibraryDialog from '@/modules/media/components/MediaLibraryDialog.vue'

const route = useRoute()
const companyId = computed(() => route.params.id as string)
const { company, loading } = useCompany(companyId.value)

const TABS = [
  { label: 'Screens', routeName: 'admin-screens', matches: ['admin-screens'] },
  { label: 'Playlists', routeName: 'admin-playlists', matches: ['admin-playlists', 'admin-playlist-detail'] },
]
const isTabActive = (matches: string[]) => matches.includes(route.name as string)

const mediaOpen = ref(false)
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

    <div class="flex items-center justify-between border-b">
      <nav class="flex gap-4">
        <router-link
          v-for="tab in TABS"
          :key="tab.routeName"
          :to="{ name: tab.routeName, params: { id: route.params.id } }"
          class="pb-2 text-sm border-b-2 -mb-px"
          :class="isTabActive(tab.matches)
            ? 'border-foreground text-foreground font-medium'
            : 'border-transparent text-muted-foreground hover:text-foreground'"
        >
          {{ tab.label }}
        </router-link>
      </nav>
      <Button size="sm" variant="ghost" class="mb-1" @click="mediaOpen = true">
        <Images class="size-4" />
        Media
      </Button>
    </div>

    <router-view />
  </div>

  <MediaLibraryDialog v-model:open="mediaOpen" :company-id="companyId" />
</template>
