<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const authStore = useAuthStore()

const fullName = ref(authStore.profile?.full_name ?? '')
const newPassword = ref('')
const confirmPassword = ref('')
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
        <form class="grid gap-4 rounded-lg border bg-background p-6 shadow-xs">
          <div class="grid gap-1.5">
            <label for="profile-name" class="text-sm font-medium">Nombre</label>
            <Input id="profile-name" v-model="fullName" placeholder="Tu nombre" />
          </div>

          <div class="grid gap-1.5">
            <label for="profile-email" class="text-sm font-medium">Email</label>
            <Input id="profile-email" :model-value="authStore.user?.email" disabled readonly />
          </div>

          <Button type="button" class="mt-2 w-fit">Guardar cambios</Button>
        </form>
      </TabsContent>

      <!-- contraseña -->
      <TabsContent value="password">
        <form class="grid gap-4 rounded-lg border bg-background p-6 shadow-xs">
          <div class="grid gap-1.5">
            <label for="profile-new-password" class="text-sm font-medium">Nueva contraseña</label>
            <Input
              id="profile-new-password"
              v-model="newPassword"
              type="password"
              placeholder="••••••••"
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
              placeholder="••••••••"
            />
          </div>

          <Button type="button" class="mt-2 w-fit">Actualizar contraseña</Button>
        </form>
      </TabsContent>
    </Tabs>
  </div>
</template>
