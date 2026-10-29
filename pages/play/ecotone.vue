<template>
  <main class="kr-surface">
    <div class="kr-scroll flex flex-col">
      <EcotoneBoard />
    </div>
  </main>
</template>

<script setup lang="ts">
useSeoMeta(
  gameLinkPreviewMeta('ecotone', useRuntimeConfig().public.appBaseUrl) ?? {},
)
useHead({ title: 'Ecotone' })
</script>
