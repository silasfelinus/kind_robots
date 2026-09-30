<!-- components/cthulhuquarium/cthulhuquarium-play.vue
     /play/aquarium's entry: a signed-in player gets their tank; anyone else
     (including the shared guest account, which must never own a tank) gets
     the shop window. -->
<template>
  <ClientOnly>
    <cthulhuquarium-game v-if="userStore.isLoggedIn" />
    <div v-else class="kr-container flex max-w-5xl flex-col gap-3">
      <cthulhuquarium-shop-window />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()
</script>
