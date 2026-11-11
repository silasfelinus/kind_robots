<template>
  <div class="kr-surface kr-scroll h-full min-h-0">
    <SlimeCityPvpGame />
  </div>
</template>

<script setup lang="ts">
// Silas, 2026-11-11 PT: "Remove admin limitation" on games between players.
// The two-player board is open to every signed-in player from VS.
import SlimeCityPvpGame from '~/pages/admin/slime-city-pvp.vue'
</script>
