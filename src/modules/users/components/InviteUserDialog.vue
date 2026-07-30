<script setup lang="ts">
import { ref } from 'vue'
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
import { useInviteUser } from '../composables/useInviteUser'

const props = defineProps<{ companyId: string }>()
const emit = defineEmits<{ invited: [] }>()

const open = ref(false)
const fullName = ref('')
const email = ref('')
const { inviteUser, loading, error } = useInviteUser()

async function onSubmit() {
  const result = await inviteUser({ email: email.value, full_name: fullName.value, company_id: props.companyId })
  if (result) {
    fullName.value = ''
    email.value = ''
    open.value = false
    emit('invited')
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button size="sm">Invitar usuario</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invitar usuario</DialogTitle>
        <DialogDescription>
          Le llegará un email para que defina su propia contraseña y active su cuenta.
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="onSubmit">
        <div class="grid gap-1.5">
          <label for="full-name" class="text-sm font-medium">Nombre</label>
          <Input id="full-name" v-model="fullName" required placeholder="Nombre completo" />
        </div>

        <div class="grid gap-1.5">
          <label for="invite-email" class="text-sm font-medium">Email</label>
          <Input id="invite-email" v-model="email" type="email" required placeholder="usuario@empresa.cl" />
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <DialogFooter>
          <Button type="submit" :disabled="loading">
            {{ loading ? 'Invitando...' : 'Invitar usuario' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
