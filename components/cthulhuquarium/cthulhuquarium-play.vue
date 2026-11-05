<!-- components/cthulhuquarium/cthulhuquarium-play.vue
     /play/aquarium's entry: a signed-in player gets their tank; anyone else
     (including the shared guest account, which must never own a tank) gets
     the shop window. -->
<template>
  <shell-console-theme theme="cthulhuquarium" />
  <ClientOnly>
    <cthulhuquarium-game v-if="userStore.isLoggedIn" />
    <div
      v-else
      class="kr-container kr-scroll flex min-h-0 max-w-6xl flex-1 flex-col gap-3 py-2"
    >
      <cthulhuquarium-shop-window />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()
</script>
