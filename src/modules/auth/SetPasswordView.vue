<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { homeForRole } from '@/router/role-homes'
import { Button } from '@/components/ui/button'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  error.value = null

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true
  try {
    await authStore.updatePassword(password.value)
    router.push(homeForRole(authStore.role, authStore.profile?.company_id))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo definir la contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm rounded-lg border bg-background p-6 shadow-sm">
    <div class="mb-6 text-center">
      <h1 class="text-xl font-semibold">Weluk</h1>
      <p class="text-sm text-muted-foreground">Definí tu contraseña para activar tu cuenta</p>
    </div>

    <form class="grid gap-4" @submit.prevent="onSubmit">
      <div class="grid gap-1.5">
        <label for="password" class="text-sm font-medium">Contraseña</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          minlength="6"
          placeholder="••••••••"
          class="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div class="grid gap-1.5">
        <label for="confirm-password" class="text-sm font-medium">Confirmar contraseña</label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          required
          minlength="6"
          placeholder="••••••••"
          class="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <Button type="submit" class="mt-2 w-full" :disabled="loading">
        {{ loading ? 'Guardando...' : 'Guardar contraseña' }}
      </Button>
    </form>
  </div>
</template>
