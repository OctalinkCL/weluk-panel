<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useUpdateProfile } from './composables/useUpdateProfile'

const authStore = useAuthStore()

const fullName = ref(authStore.profile?.full_name ?? '')
const { updateProfile, loading: savingName, error: nameError } = useUpdateProfile()
const nameSaved = ref(false)

async function onSaveName() {
  nameSaved.value = false
  const updated = await updateProfile(fullName.value)
  if (!updated || !authStore.profile) return

  authStore.profile.full_name = updated.full_name
  nameSaved.value = true
}

const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)
const passwordError = ref<string | null>(null)
const passwordSaved = ref(false)

async function onSavePassword() {
  passwordError.value = null
  passwordSaved.value = false

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Las contraseñas no coinciden.'
    return
  }

  savingPassword.value = true
  try {
    await authStore.updatePassword(newPassword.value)
    newPassword.value = ''
    confirmPassword.value = ''
    passwordSaved.value = true
  } catch (err) {
    passwordError.value = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.'
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="grid gap-6 max-w-lg">
    <header class="leading-tight">
      <h2 class="text-lg font-medium">Mi perfil</h2>
      <p class="text-sm text-muted-foreground">Administra tus datos y tu contraseña.</p>
    </header>

    <Tabs default-value="data">
      <TabsList>
        <TabsTrigger value="data">Datos</TabsTrigger>
        <TabsTrigger value="password">Contraseña</TabsTrigger>
      </TabsList>

      <!-- datos personales -->
      <TabsContent value="data">
        <form class="grid gap-4 rounded-lg border bg-background p-6 shadow-xs" @submit.prevent="onSaveName">
          <div class="grid gap-1.5">
            <label for="profile-name" class="text-sm font-medium">Nombre</label>
            <Input
              id="profile-name"
              v-model="fullName"
              required
              placeholder="Tu nombre"
              @input="nameSaved = false"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="profile-email" class="text-sm font-medium">Email</label>
            <Input id="profile-email" :model-value="authStore.user?.email" disabled readonly />
          </div>

          <p v-if="nameError" class="text-sm text-destructive">{{ nameError }}</p>
          <p v-else-if="nameSaved" class="text-sm text-emerald-600">Cambios guardados.</p>

          <Button type="submit" class="mt-2 w-fit" :disabled="savingName">
            {{ savingName ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </form>
      </TabsContent>

      <!-- contraseña -->
      <TabsContent value="password">
        <form class="grid gap-4 rounded-lg border bg-background p-6 shadow-xs" @submit.prevent="onSavePassword">
          <div class="grid gap-1.5">
            <label for="profile-new-password" class="text-sm font-medium">Nueva contraseña</label>
            <Input
              id="profile-new-password"
              v-model="newPassword"
              type="password"
              required
              minlength="6"
              placeholder="••••••••"
              @input="passwordSaved = false"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="profile-confirm-password" class="text-sm font-medium"
              >Confirmar contraseña</label
            >
            <Input
              id="profile-confirm-password"
              v-model="confirmPassword"
              type="password"
              required
              minlength="6"
              placeholder="••••••••"
              @input="passwordSaved = false"
            />
          </div>

          <p v-if="passwordError" class="text-sm text-destructive">{{ passwordError }}</p>
          <p v-else-if="passwordSaved" class="text-sm text-emerald-600">Contraseña actualizada.</p>

          <Button type="submit" class="mt-2 w-fit" :disabled="savingPassword">
            {{ savingPassword ? 'Guardando...' : 'Actualizar contraseña' }}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  </div>
</template>
