<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    loadingLabel?: string
    cancelLabel?: string
    loading?: boolean
    variant?: 'destructive' | 'default'
    error?: string | null
  }>(),
  {
    confirmLabel: 'Eliminar',
    loadingLabel: 'Eliminando...',
    cancelLabel: 'Cancelar',
    loading: false,
    variant: 'destructive',
    error: null,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>{{ description }}</AlertDialogDescription>
      </AlertDialogHeader>

      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="loading">{{ cancelLabel }}</AlertDialogCancel>
        <Button :variant="variant" :disabled="loading" @click="emit('confirm')">
          {{ loading ? loadingLabel : confirmLabel }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
