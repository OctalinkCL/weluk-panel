<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

async function onLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header
    class="bg-background border-b border-black/6 h-15 flex items-center justify-between px-4 sticky top-0"
  >
    <SidebarTrigger />

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" class="cursor-pointer ml-auto">
          {{ authStore.profile?.full_name || 'Perfil' }}
          <ChevronDown class="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="h-8 px-3 cursor-pointer">Perfil</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem @click="onLogout" class="h-8 px-3 cursor-pointer"
          >Cerrar sesión</DropdownMenuItem
        >
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
