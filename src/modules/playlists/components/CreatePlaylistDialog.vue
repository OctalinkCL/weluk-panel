<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentCompanySlug } from '@/composables/useCurrentCompanySlug'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useCreatePlaylist } from '../composables/useCreatePlaylist'

const props = defineProps<{ companyId: string }>()

const router = useRouter()
const companySlug = useCurrentCompanySlug()
const open = ref(false)
const name = ref('')
const { createPlaylist, loading, error } = useCreatePlaylist()

async function onSubmit() {
  const playlist = await createPlaylist(props.companyId, name.value)
  if (playlist) {
    name.value = ''
    open.value = false
    router.push({ name: 'playlist-detail', params: { companySlug: companySlug.value, playlistId: playlist.id } })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button size="sm">Nueva playlist</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nueva playlist</DialogTitle>
        <DialogDescription>Crea una playlist para esta company.</DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="onSubmit">
        <div class="grid gap-1.5">
          <label for="playlist-name" class="text-sm font-medium">Nombre</label>
          <Input id="playlist-name" v-model="name" required placeholder="Nombre de la playlist" />
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <DialogFooter>
          <Button type="submit" :disabled="loading">
            {{ loading ? 'Creando...' : 'Crear playlist' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
