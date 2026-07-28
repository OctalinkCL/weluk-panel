<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { homeForRole } from '@/router/role-homes'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    await authStore.login(email.value, password.value)
    router.push({ name: homeForRole(authStore.role) })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
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
          v-model="email"
          type="email"
          required
          placeholder="admin@weluk.cl"
          class="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div class="grid gap-1.5">
        <label for="password" class="text-sm font-medium">Contraseña</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
          class="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <Button type="submit" class="mt-2 w-full" :disabled="loading">
        {{ loading ? 'Ingresando...' : 'Ingresar' }}
      </Button>
    </form>
  </div>
</template>
