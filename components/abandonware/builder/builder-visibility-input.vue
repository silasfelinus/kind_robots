<!-- /components/builder/builder-visibility-input.vue -->
<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <button
      type="button"
      class="rounded-2xl border-2 bg-base-100 p-4 text-left transition-all hover:border-primary/60"
      :class="store.sheet.isPublic ? 'border-primary bg-primary/10' : 'border-base-300'"
      @click="store.updateSheet({ isPublic: !Boolean(store.sheet.isPublic) })"
    >
      <Icon name="kind-icon:globe" class="mb-2 h-7 w-7 text-primary" />
      <p class="font-black text-base-content">Public</p>
      <p class="text-sm text-base-content/60">Visible to the wider Kind Robots ecosystem.</p>
    </button>

    <button
      type="button"
      class="rounded-2xl border-2 bg-base-100 p-4 text-left transition-all hover:border-warning/60"
      :class="store.sheet.isMature ? 'border-warning bg-warning/10' : 'border-base-300'"
      @click="store.updateSheet({ isMature: !Boolean(store.sheet.isMature) })"
    >
      <Icon name="kind-icon:warning" class="mb-2 h-7 w-7 text-warning" />
      <p class="font-black text-base-content">Mature</p>
      <p class="text-sm text-base-content/60">Marks this model as mature or filtered content.</p>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
</script>
