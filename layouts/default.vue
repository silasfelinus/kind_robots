<template>
  <main>
    <SpeedInsights />
    <slot></slot>
  </main>
</template>

<script lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SpeedInsights } from '@vercel/speed-insights/nuxt'
</script>
