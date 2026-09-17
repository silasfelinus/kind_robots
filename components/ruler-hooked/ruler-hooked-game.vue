<!-- components/ruler-hooked/ruler-hooked-game.vue
     The playable Ruler Hooked PoC, dropped into the /ruler-hooked scaffold's
     #interactive slot. Offline-first & client-only: all state lives in the
     localStorage-backed store; no server round-trip is needed to play.

     ruler-hooked/t-024, Silas playing 2026-09-11: "It should all be one
     navigable screen... the introduction could be on a centered window, but
     we need a background. basically, start with the game experience ready
     to go." The stage now renders unconditionally -- a preview scene (every
     region at its default/first state, no save required) behind the setup
     modal when there is no reign yet, the real scene once one exists -- and
     save-slot management (new reign / continue / rename / delete) moved out
     of the scrolled document into that same modal instead of always
     stacking below the play area. -->
<template>
  <ClientOnly>
    <div class="kr-container max-w-3xl flex flex-col gap-4">
      <RulerHookedStage
        :scene="store.scene ?? previewScene"
        :regions="store.bundle.regions"
        :ruler-custom-portrait-id="
          store.save?.ruler.cosmetics?.customPortraitId ?? null
        "
      />

      <template v-if="store.save">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="kr-text-bold-sm">{{ store.save.ruler.honorific }} {{ store.save.ruler.name }}</p>
            <p class="kr-text-faded-xs">Turn {{ store.save.turnCount }} · {{ store.save.status.toLowerCase() }} · {{ store.save.counters.fishCaught ?? 0 }} fish</p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square rounded-2xl border border-base-300"
              title="Manage saves"
              @click="showSlots = true"
            >
              <Icon name="kind-icon:save" class="kr-icon-4" />
            </button>
            <button
              type="button"
              class="kr-btn-primary-md-plain"
              :disabled="!store.canFish"
              @click="store.startFishing()"
            >
              🎣 Cast a line
            </button>
          </div>
        </div>

        <RulerHookedCosmetics />

        <RulerHookedHealth :health="store.save.kingdomHealth" />

        <RulerHookedFishingEncounter
          v-if="store.activeFishing"
          :encounter="store.activeFishing"
          @stop="store.fishingStop($event)"
        />

        <div
          v-if="store.lastEscape"
          class="rounded-xl border border-warning/40 bg-warning/10 p-4"
          role="status"
        >
          <p class="font-bold">{{ store.lastEscape.fishName }} got away.</p>
          <p class="mt-1 text-sm opacity-75">{{ store.lastEscape.cue }}</p>
        </div>

        <RulerHookedCatch
          v-if="store.lastCatch"
          :catch-result="store.lastCatch"
        />

        <RulerHookedCard
          v-if="store.activeCard"
          :card="store.activeCard"
          @choose="store.choose($event)"
        />

        <div v-if="store.pendingEnding" class="rounded-xl border border-accent bg-accent/10 p-4">
          <p class="kr-text-bold-sm">An ending is within reach:</p>
          <p class="kr-text-bold-lg mt-1">{{ endingTitle }}</p>
          <p v-if="endingBody" class="kr-text-faded-sm-80">{{ endingBody }}</p>
          <div class="mt-3 flex gap-2">
            <button type="button" class="btn btn-accent btn-sm" @click="store.acceptEnding()">Take this ending</button>
            <button type="button" class="kr-btn-ghost-plain" @click="store.declineEnding()">Keep fishing</button>
          </div>
        </div>

        <div v-if="store.save.status === 'COMPLETE'" class="rounded-xl border border-success bg-success/10 p-4 text-center">
          <p class="kr-text-bold-lg">{{ endingTitleFor(store.save.endingKey) }}</p>
          <p class="kr-text-faded-sm-80">The reign is complete. Start another from Manage saves above.</p>
        </div>

        <RulerHookedFishopedia :save="store.save" />
      </template>
    </div>

    <Teleport to="body">
      <dialog
        v-if="showSlots"
        class="modal modal-open"
        aria-modal="true"
        @cancel.prevent="onDialogCancel"
      >
        <div
          class="modal-box flex max-w-md flex-col gap-3 rounded-3xl border border-base-300 bg-base-100"
        >
          <RulerHookedSlots @picked="showSlots = false" />
          <button
            v-if="store.save"
            type="button"
            class="kr-btn-ghost-plain self-end"
            @click="showSlots = false"
          >
            Back to the lake
          </button>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button type="button" @click="onDialogCancel">close</button>
        </form>
      </dialog>
    </Teleport>

    <template #fallback>
      <div class="py-12 text-center text-sm opacity-60">Loading the lake…</div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { createRun } from '~/utils/rulerHooked/newGame'
import { resolveScene } from '~/utils/rulerHooked/compositor'

const store = useRulerHookedStore()

// The setup modal is forced open whenever there is no active reign (first
// visit, or the active save was just deleted) and stays closed otherwise;
// "picked" (ruler-hooked-slots.vue) closes it explicitly once a slot is
// loaded or a new reign is created, and "Manage saves" / "Back to the lake"
// toggle it manually while a reign is already active.
const showSlots = ref(!store.save)
watch(
  () => store.save,
  (save) => {
    if (!save) showSlots.value = true
  },
)
function onDialogCancel() {
  // No reign yet: this modal is the only content, so Escape can't dismiss it.
  if (store.save) showSlots.value = false
}

// Preview scene (ruler-hooked/t-024): every region resolved at its own
// default/first state, purely for rendering a background behind the setup
// modal before any save exists. Never persisted -- createRun's normal
// defaults (HERO_RULER_PRESET_ID, kingdomHealth at 50, empty overrides) are
// exactly the "nobody has chosen anything yet" scene.
const previewScene = computed(() =>
  resolveScene(
    createRun(store.bundle, {
      saveId: 'preview',
      name: '',
      seed: 'preview',
      rulerName: '',
      stamp: '1970-01-01T00:00:00Z',
    }),
    store.bundle.regions,
  ),
)

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
