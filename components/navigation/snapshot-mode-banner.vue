<!-- /components/navigation/snapshot-mode-banner.vue -->
<!-- Thin degraded-mode strip: renders only while at least one store is
     showing nightly-snapshot rows instead of live data (see
     stores/helpers/snapshotLoader). Disappears on its own as soon as the
     stores recover, so it needs no dismiss control. -->
<template>
  <div
    v-if="snapshotActiveModels.length"
    class="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs text-base-content/80"
    role="status"
  >
    <Icon name="kind-icon:warning" class="size-3.5 shrink-0 text-warning" />
    <span class="font-semibold">
      Live data is unreachable — showing recent snapshots
    </span>
    <span class="flex flex-wrap items-center gap-1">
      <span
        v-for="model in snapshotActiveModels"
        :key="model"
        class="badge badge-warning badge-outline badge-xs"
      >
        {{ model }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { snapshotActiveModels } from '@/stores/helpers/snapshotLoader'
</script>
