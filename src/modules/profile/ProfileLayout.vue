<script setup lang="ts">
import { useRoute } from 'vue-router'
import { User, Lock } from '@lucide/vue'

const route = useRoute()

const NAV_ITEMS = [
  { label: 'Perfil', routeName: 'profile', icon: User },
  { label: 'Seguridad', routeName: 'profile-password', icon: Lock },
]
</script>

<template>
  <div class="grid gap-6">
    <header class="leading-tight">
      <h2 class="text-lg font-medium">Settings</h2>
      <p class="text-sm text-muted-foreground">
        Administra la configuración de tu cuenta y tus preferencias.
      </p>
    </header>

    <div class="grid gap-6 md:grid-cols-[220px_1fr]">
      <nav class="grid gap-1 self-start rounded-lg border bg-background p-2">
        <router-link
          v-for="item in NAV_ITEMS"
          :key="item.routeName"
          :to="{ name: item.routeName }"
          class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          :class="{ 'bg-muted text-foreground': route.name === item.routeName }"
        >
          <component :is="item.icon" class="size-4" />
          {{ item.label }}
        </router-link>
      </nav>

      <div class="rounded-lg border bg-background p-6">
        <router-view />
      </div>
    </div>
  </div>
</template>
