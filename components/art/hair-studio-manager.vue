<!-- /components/art/hair-studio-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3">
    <header
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <span
        class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary"
      >
        <Icon name="kind-icon:magic" class="h-6 w-6" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="text-lg font-black">Hair Studio</h2>
        <p class="text-sm text-base-content/60">
          Preview a new color or cut on a private client photo.
        </p>
      </div>
      <span
        v-if="stylist.isBusy"
        class="flex items-center gap-2 text-sm font-bold text-primary"
      >
        <span class="loading loading-spinner loading-sm" />
        styling
      </span>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <stylist-restyle />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useStylistStore } from '@/stores/stylistStore'

const stylist = useStylistStore()
</script>
