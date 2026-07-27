<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'
import { Button } from '@/components/ui/button'

const counter = useCounterStore()
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4">
    <h1 class="text-3xl font-bold">Hola mundo, Weluk Panel</h1>
    <p class="text-muted-foreground">
      {{ counter.count }} veces contado (Pinia funcionando).
    </p>
    <Button @click="counter.increment">+1 (shadcn-vue Button)</Button>
  </main>
</template>
