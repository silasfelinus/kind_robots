<template>
  <section
    v-if="userStore.isGuest"
    class="rounded-xl border border-base-content/15 bg-base-100/80 p-3 text-xs leading-snug"
    aria-label="Support the Against Malaria Foundation"
    data-testid="guest-fundraiser-strip"
  >
    <p class="font-bold text-base-content">
      Free to make. No ads. A cause worth sharing.
    </p>
    <p class="mt-1 text-base-content/75">
      Kind Robots doesn't charge for this. If it made you laugh,
      <a
        :href="FUNDRAISER_URL"
        class="link link-primary font-semibold"
        target="_blank"
        rel="noopener noreferrer"
        @click="support.markGave()"
      >
        support our malaria fundraiser
      </a>.
      Donations go straight to the Against Malaria Foundation.
    </p>
  </section>
</template>

<script setup lang="ts">
import { useSupportStore } from '@/stores/supportStore'
import { useUserStore } from '@/stores/userStore'
import { FUNDRAISER_URL } from '~/utils/supportShare'

const userStore = useUserStore()
const support = useSupportStore()
</script>
