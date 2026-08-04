<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import AppSidebar from '@/components/layouts/AppSidebar.vue'
import AppHeader from '@/components/layouts/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { useCurrentCompanyStore } from '@/stores/currentCompany'

const router = useRouter()
const authStore = useAuthStore()
const companyStore = useCurrentCompanyStore()

async function onLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="bg-[#f9f9f9]">
      <AppHeader />
      <div class="p-4 lg:p-6">
        <router-view />
      </div>
    </SidebarInset>
  </SidebarProvider>
  <!--
    Aviso, no la seguridad real: si esto se saca del DOM con el inspector, el
    resto de la app sigue vacía igual — las policies de RLS (auth_active_company_id())
    devuelven cero filas para una company deshabilitada, con o sin este overlay.
  -->
  <div
    v-if="
      authStore.role === 'company_admin' && companyStore.company && !companyStore.company.is_active
    "
    class="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
  >
    <div class="max-w-sm text-center grid gap-3">
      <h2 class="text-lg font-medium">Cuenta deshabilitada</h2>
      <p class="text-sm text-muted-foreground">
        Tu empresa fue deshabilitada. Contacta a soporte si crees que es un error.
      </p>
      <Button variant="outline" @click="onLogout">Cerrar sesión</Button>
    </div>
  </div>
</template>
