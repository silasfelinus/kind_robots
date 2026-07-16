<!-- components/ruler-hooked/ruler-hooked-game.vue
     The playable Ruler Hooked PoC, dropped into the /ruler-hooked scaffold's
     #interactive slot. Offline-first & client-only: all state lives in the
     localStorage-backed store; no server round-trip is needed to play. -->
<template>
  <ClientOnly>
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <template v-if="store.save">
        <RulerHookedStage :scene="store.scene" :regions="store.bundle.regions" />

        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-bold">{{ store.save.ruler.honorific }} {{ store.save.ruler.name }}</p>
            <p class="text-xs opacity-60">Turn {{ store.save.turnCount }} · {{ store.save.status.toLowerCase() }}</p>
          </div>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!store.canFish"
            @click="store.fish()"
          >
            🎣 Cast a line
          </button>
        </div>

        <RulerHookedHealth :health="store.save.kingdomHealth" />

        <RulerHookedCard
          v-if="store.activeCard"
          :card="store.activeCard"
          @choose="store.choose($event)"
        />

        <div v-if="store.pendingEnding" class="rounded-xl border border-accent bg-accent/10 p-4">
          <p class="text-sm font-bold">An ending is within reach:</p>
          <p class="mt-1 text-lg font-bold">{{ endingTitle }}</p>
          <p v-if="endingBody" class="text-sm opacity-80">{{ endingBody }}</p>
          <div class="mt-3 flex gap-2">
            <button type="button" class="btn btn-accent btn-sm" @click="store.acceptEnding()">Take this ending</button>
            <button type="button" class="btn btn-ghost btn-sm" @click="store.declineEnding()">Keep fishing</button>
          </div>
        </div>

        <div v-if="store.save.status === 'COMPLETE'" class="rounded-xl border border-success bg-success/10 p-4 text-center">
          <p class="text-lg font-bold">{{ endingTitleFor(store.save.endingKey) }}</p>
          <p class="text-sm opacity-80">The reign is complete. Start another from the slots below.</p>
        </div>
      </template>

      <RulerHookedSlots />
    </div>

    <template #fallback>
      <div class="py-12 text-center text-sm opacity-60">Loading the lake…</div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const store = useRulerHookedStore()

onMounted(() => {
  store.init()
})

function endingTitleFor(key: string | null): string {
  const e = store.bundle.endings.find((x) => x.outcomeKey === key)
  return e?.title ?? 'A Reign Remembered'
}
const endingTitle = computed(() => endingTitleFor(store.pendingEnding))
const endingBody = computed(
  () => store.bundle.endings.find((x) => x.outcomeKey === store.pendingEnding)?.body ?? '',
)
</script>
