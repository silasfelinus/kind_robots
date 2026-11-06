<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden"
    data-layout="console-fixed"
    data-testid="monstress-private-preview"
  >
    <div
      v-if="!mayPlay"
      class="grid h-full min-h-0 flex-1 place-items-center bg-base-300 p-5 text-center"
    >
      <div class="max-w-md space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] opacity-60">
          Private studio preview
        </p>
        <p class="text-2xl font-bold">Access restricted</p>
        <p class="opacity-75">
          This preview requires an administrator account with mature content enabled.
        </p>
        <p v-if="caseStore.checking" class="text-sm opacity-60">Checking account access…</p>
      </div>
    </div>
    <PlaybookKitShell
      v-else
      :spec="MONSTRESS_CONVENTION"
      :meter-values="{ leads: Math.min(10, caseStore.state.evidence.length) }"
    >
      <MonstressConventionScene />
    </PlaybookKitShell>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useMonstressConventionStore } from '~/stores/monstressConventionStore'
import { useUserStore } from '~/stores/userStore'
import { MONSTRESS_CONVENTION } from '~/utils/playbookKit/games/monstressConvention'

const user = useUserStore()
const caseStore = useMonstressConventionStore()
const mayPlay = computed(
  () => caseStore.authorized && user.isAdmin && user.showMature,
)

onMounted(() => {
  watch(
    () => [user.token, user.showMature, user.isAdmin],
    () => void caseStore.verifyAccess(),
    { immediate: true },
  )
})
</script>
