<template>
  <div class="kr-surface kr-scroll h-full min-h-0">
    <SlimeCityPvpGame />
  </div>
</template>

<script setup lang="ts">
import { gameLinkPreviewMeta } from '~/utils/gameLinkPreview'

// Duel invites (?duel=<code>) are shared links: give them a real card.
useSeoMeta(
  gameLinkPreviewMeta('slime-city-pvp', useRuntimeConfig().public.appBaseUrl) ??
    {},
)
useHead({ title: 'Slime City Duels | Kind Robots' })
</script>
