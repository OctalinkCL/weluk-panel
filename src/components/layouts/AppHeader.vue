<script setup lang="ts">
import { computed } from 'vue'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// import { ChevronDown } from '@lucide/vue'

const router = useRouter()
const authStore = useAuthStore()

const userInitial = computed(
  () => authStore.profile?.full_name?.trim().charAt(0).toUpperCase() ?? '',
)

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

    <!-- user_data -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Avatar class="cursor-pointer">
          <!-- <AvatarImage :src="authStore.profile?.avatar_url || 'https://github.com/shadcn.png'" /> -->
          <AvatarFallback>{{ userInitial }}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="min-w-60">
        <DropdownMenuLabel class="flex items-center gap-2">
          <Avatar class="cursor-pointer">
            <!-- <AvatarImage :src="authStore.profile?.avatar_url || 'https://github.com/shadcn.png'" /> -->
            <AvatarFallback>{{ userInitial }}</AvatarFallback>
          </Avatar>
          <div>
            <h6 class="font-semibold text-black text-sm">{{ authStore.profile?.full_name }}</h6>
            <p class="text-muted-foreground">{{ authStore.user?.email }}</p>
          </div>
        </DropdownMenuLabel>
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
