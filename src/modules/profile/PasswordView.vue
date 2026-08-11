<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function onSubmit() {
  error.value = null
  success.value = false

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true
  try {
    await authStore.updatePassword(password.value)
    password.value = ''
    confirmPassword.value = ''
    success.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="grid max-w-md gap-4" @submit.prevent="onSubmit">
    <div class="grid gap-1.5">
      <label for="password" class="text-sm font-medium">Contraseña nueva</label>
      <Input id="password" v-model="password" type="password" required minlength="6" placeholder="••••••••" />
    </div>

    <div class="grid gap-1.5">
      <label for="confirm-password" class="text-sm font-medium">Confirmar contraseña</label>
      <Input
        id="confirm-password"
        v-model="confirmPassword"
        type="password"
        required
        minlength="6"
        placeholder="••••••••"
      />
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <p v-if="success" class="text-sm text-muted-foreground">Contraseña actualizada.</p>

    <div class="flex justify-end">
      <Button type="submit" :disabled="loading">
        {{ loading ? 'Guardando...' : 'Guardar contraseña' }}
      </Button>
    </div>
  </form>
</template>
