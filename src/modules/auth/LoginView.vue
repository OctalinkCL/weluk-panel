<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()

function onSubmit() {
  router.push({ name: 'admin-companies' })
}
</script>

<template>
  <div class="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm">
    <div class="mb-6 text-center">
      <h1 class="text-xl font-semibold">Weluk</h1>
      <p class="text-sm text-muted-foreground">Panel de administración</p>
    </div>

    <form class="grid gap-4" @submit.prevent="onSubmit">
      <div class="grid gap-1.5">
        <label for="email" class="text-sm font-medium">Email</label>
        <input
          id="email"
          type="email"
          placeholder="admin@weluk.cl"
          class="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div class="grid gap-1.5">
        <label for="password" class="text-sm font-medium">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          class="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <Button type="submit" class="mt-2 w-full">Ingresar</Button>
    </form>
  </div>
</template>
