<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUpdateProfile } from './composables/useUpdateProfile'

const authStore = useAuthStore()
const { updateProfile, loading, error } = useUpdateProfile()

const fullName = ref('')
const success = ref(false)

watch(
  () => authStore.profile?.full_name,
  (value) => {
    fullName.value = value ?? ''
  },
  { immediate: true },
)

async function onSubmit() {
  success.value = false
  if (!authStore.user) return

  const updated = await updateProfile(fullName.value)
  if (updated) {
    await authStore.fetchProfile(authStore.user.id)
    success.value = true
  }
}
</script>

<template>
  <form class="grid max-w-md gap-4" @submit.prevent="onSubmit">
    <div class="grid gap-1.5">
      <label for="full-name" class="text-sm font-medium">Nombre</label>
      <Input id="full-name" v-model="fullName" required placeholder="Tu nombre" />
    </div>

    <div class="grid gap-1.5">
      <label for="email" class="text-sm font-medium">Email</label>
      <Input id="email" :model-value="authStore.user?.email" disabled />
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    <p v-if="success" class="text-sm text-muted-foreground">Cambios guardados.</p>

    <div class="flex justify-end">
      <Button type="submit" :disabled="loading">
        {{ loading ? 'Guardando...' : 'Guardar cambios' }}
      </Button>
    </div>
  </form>
</template>
