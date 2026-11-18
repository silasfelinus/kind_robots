<template>
  <NuxtPage v-if="route.path.startsWith('/admin/deepheart/')" />
  <main
    v-else
    class="kr-surface h-full min-h-0 overflow-hidden gap-0"
    data-layout="console-fixed"
    data-testid="deepheart"
  >
    <PlaybookKitShell :spec="deepheart" :meter-values="dh.meterValues">
      <div class="dh-page @container h-full min-h-full p-2 @3xl:p-3">
        <p
          v-if="dh.warning"
          class="alert alert-warning mb-2 py-2 text-sm"
          role="alert"
        >
          {{ dh.warning }}
        </p>
        <DeepheartTitle v-if="dh.screen === 'title'" />
        <DeepheartBuilder v-else-if="dh.screen === 'builder'" />
        <DeepheartDelve v-else-if="dh.screen === 'delve' && dh.run" />
        <DeepheartChronicle
          v-else-if="dh.screen === 'chronicle' || dh.screen === 'saves'"
        />
        <DeepheartTitle v-else />
      </div>
    </PlaybookKitShell>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDeepheartStore } from '~/stores/deepheartStore'
import { DEEPHEART as deepheart } from '~/utils/playbookKit/games/deepheart'

const route = useRoute()
const dh = useDeepheartStore()

onMounted(() => dh.load())
</script>

<style scoped>
.dh-page {
  display: flex;
  flex-direction: column;
}
.dh-page > :last-child {
  flex: 1;
  min-height: 0;
}
</style>
