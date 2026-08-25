<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton size="lg" class="cursor-pointer">
            <Avatar class="size-8">
              <AvatarFallback>{{ userInitial }}</AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left leading-tight">
              <span class="truncate font-semibold text-sm">{{
                authStore.profile?.full_name
              }}</span>
              <span class="truncate text-xs text-muted-foreground">{{
                authStore.user?.email
              }}</span>
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right" class="min-w-60">
          <DropdownMenuLabel class="flex items-center gap-2">
            <Avatar class="cursor-pointer">
              <AvatarFallback>{{ userInitial }}</AvatarFallback>
            </Avatar>
            <div>
              <h6 class="font-semibold text-black text-sm">{{ authStore.profile?.full_name }}</h6>
              <p class="text-muted-foreground">{{ authStore.user?.email }}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem as-child class="h-8 px-3 cursor-pointer">
            <router-link :to="{ name: 'profile' }">Perfil</router-link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="onLogout" class="h-8 px-3 cursor-pointer"
            >Cerrar sesión</DropdownMenuItem
          >
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
    <SidebarMenuItem>
      <div class="px-2 py-1 text-xs text-muted-foreground">v1.1 - Weluk Digital Signage</div>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
