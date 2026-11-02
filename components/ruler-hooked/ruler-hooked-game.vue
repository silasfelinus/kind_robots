<template>
  <ClientOnly>
    <main
      class="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden bg-slate-950 p-2 sm:p-3"
    >
      <template v-if="!store.save">
        <div
          class="relative isolate min-h-0 flex-1 overflow-hidden rounded-2xl bg-slate-950"
        >
          <RulerHookedStage
            :scene="previewScene"
            :regions="store.bundle.regions"
            :fill="true"
            class="pointer-events-none absolute inset-0 h-full w-full scale-105 !rounded-none !border-0 opacity-45 blur-[1px]"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/75 via-transparent to-slate-950/70"
          />
          <RulerHookedSlots class="relative z-10 h-full" @picked="onPicked" />
        </div>
      </template>

      <template v-else>
        <header-page-bar>
          <div
            class="flex min-w-0 flex-1 items-center gap-2"
            data-testid="ruler-hooked-bar"
          >
            <nav
              class="flex min-w-0 flex-1 flex-nowrap gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none]"
              aria-label="Ruler Hooked screens"
            >
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                class="btn btn-sm shrink-0 px-2 @4xl:px-3"
                :class="screen === tab.id ? 'btn-primary' : 'btn-ghost'"
                :title="tab.label"
                :aria-current="screen === tab.id ? 'page' : undefined"
                @click="screen = tab.id"
              >
                <Icon :name="tab.icon" class="kr-icon-4" />
                <span class="sr-only @4xl:not-sr-only">{{ tab.label }}</span>
              </button>
            </nav>
            <div
              class="flex shrink-0 items-center gap-2 text-xs font-bold @xl:gap-3"
              title="The crown can wait. The fish cannot."
            >
              <span>Day {{ store.save.turnCount + 1 }}</span>
              <span>🎣 {{ store.save.counters.fishCaught ?? 0 }}</span>
              <span>🪙 {{ store.coins }}</span>
            </div>
          </div>
        </header-page-bar>

        <div
          v-if="screen === 'opening'"
          class="grid min-h-0 gap-3 ruler-scene-grid"
        >
          <RulerHookedStage
            :scene="store.scene"
            :regions="store.bundle.regions"
          />
          <section
            class="min-h-0 rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <RulerHookedOpening @skip="finishOpening" @done="finishOpening" />
          </section>
        </div>

        <div
          v-else-if="screen === 'map'"
          class="grid min-h-0 gap-3 ruler-scene-grid"
        >
          <div class="space-y-3">
            <RulerHookedStage
              :scene="store.scene"
              :regions="store.bundle.regions"
            />
            <RulerHookedHealth :health="store.save.kingdomHealth" />
          </div>
          <section
            class="flex min-h-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100/95 p-4"
          >
            <div>
              <p
                class="text-xs font-bold uppercase tracking-widest text-primary"
              >
                Royal cartography
              </p>
              <h2 class="font-serif text-2xl font-bold">
                Where shall we fish?
              </h2>
              <p class="mt-1 text-sm opacity-70">
                The land changes with your decrees. For now, only the castle
                lake is open.
              </p>
            </div>
            <button
              type="button"
              class="flex min-h-24 w-full items-center gap-3 rounded-2xl border-2 border-primary bg-primary/10 p-3 text-left hover:bg-primary/20"
              @click="screen = 'lake'"
            >
              <Icon
                name="kind-icon:fish"
                class="size-8 shrink-0 text-primary"
              />
              <span class="flex-1"
                ><strong class="block">Castle Lake</strong
                ><span class="text-xs opacity-75"
                  >Open · Your fishing grounds</span
                ></span
              >
              <Icon name="kind-icon:chevron-right" class="kr-icon-4" />
            </button>
            <div
              class="flex min-h-16 items-center gap-3 rounded-xl border border-dashed border-base-content/20 bg-base-200/40 p-3 opacity-65"
            >
              <Icon name="kind-icon:lock" class="kr-icon-4" />
              <div>
                <strong class="block text-sm">The outer waterways</strong
                ><span class="text-xs">Locked until the realm changes</span>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-outline min-h-11"
              @click="screen = 'briefing'"
            >
              Read the kingdom briefing
            </button>
            <p
              v-if="store.save.status === 'COMPLETE'"
              class="text-sm font-bold text-success"
            >
              {{ endingTitleFor(store.save.endingKey) }}. Begin another reign
              from Saves.
            </p>
          </section>
        </div>

        <div
          v-else-if="screen === 'lake'"
          class="grid min-h-0 gap-3 ruler-scene-grid"
        >
          <RulerHookedStage
            :scene="store.scene"
            :regions="store.bundle.regions"
          />
          <section
            class="min-h-0 space-y-3 overflow-y-auto rounded-2xl border border-base-300 bg-base-100/95 p-4"
          >
            <p class="text-xs font-bold uppercase tracking-widest text-primary">
              Castle Lake · Fishing
            </p>
            <RulerHookedFishingEncounter
              v-if="store.activeFishing"
              :encounter="store.activeFishing"
              @stop="store.fishingStop($event)"
              @tap="store.reelFishing('TAP')"
              @release="store.reelFishing('RELEASE')"
            />
            <template v-else>
              <h2 class="font-serif text-2xl font-bold">Just one more cast.</h2>
              <p class="text-sm opacity-75">
                Two timed clicks to cast and hook, then reel with taps. Give the
                line slack when it gets tight.
              </p>
              <button
                type="button"
                class="btn btn-primary min-h-14 w-full text-lg"
                :disabled="!store.canFish"
                @click="store.startFishing()"
              >
                🎣 Cast a line
              </button>
              <p v-if="!store.canFish" class="text-xs opacity-65">
                A royal decision awaits, or this reign has ended.
              </p>
              <RulerHookedAdvisor />
            </template>
          </section>
        </div>

        <div
          v-else-if="screen === 'catch'"
          class="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <RulerHookedCatch
            v-if="store.lastCatch"
            :catch-result="store.lastCatch"
          />
          <div
            v-else-if="store.lastEscape"
            class="rounded-2xl bg-warning/10 p-4"
            role="status"
          >
            <h2 class="font-serif text-xl font-bold">
              {{ store.lastEscape.fishName }} escaped
            </h2>
            <p>{{ store.lastEscape.cue }}</p>
          </div>
          <button
            type="button"
            class="btn btn-primary min-h-12"
            @click="screen = 'briefing'"
          >
            Hear the royal briefing
          </button>
        </div>

        <section
          v-else-if="screen === 'briefing'"
          class="grid min-h-0 gap-3 ruler-scene-grid"
        >
          <div class="min-h-0 space-y-3">
            <RulerHookedStage
              :scene="store.scene"
              :regions="store.bundle.regions"
            />
            <RulerHookedAdvisor />
          </div>
          <div
            class="min-h-0 max-h-[58dvh] overflow-y-auto rounded-2xl border border-base-300 bg-base-100/95 p-4"
          >
            <div v-if="store.activeCard">
              <p
                class="mb-2 text-xs font-bold uppercase tracking-widest text-primary"
              >
                The court demands an answer
              </p>
              <RulerHookedCard
                :card="store.activeCard"
                :advisor-name="store.advisorCharacter?.name"
                :advisor-slug="store.advisorCharacter?.slug"
                @choose="makeChoice($event)"
              />
            </div>
            <div v-else-if="store.pendingEnding" class="space-y-3">
              <p
                class="text-xs font-bold uppercase tracking-widest text-primary"
              >
                The end of a reign
              </p>
              <h2 class="font-serif text-2xl font-bold">{{ endingTitle }}</h2>
              <p class="text-sm">{{ endingBody }}</p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="takeEnding"
                >
                  Accept this ending
                </button>
                <button
                  type="button"
                  class="btn btn-outline"
                  @click="keepFishing"
                >
                  Keep fishing
                </button>
              </div>
            </div>
            <div v-else class="space-y-3">
              <h2 class="font-serif text-2xl font-bold">
                An unusually quiet court
              </h2>
              <p class="text-sm opacity-75">
                Fish the lake to turn the day. When the court has an issue, it
                will arrive here as a decision.
              </p>
              <button
                type="button"
                class="btn btn-primary"
                @click="screen = 'map'"
              >
                Return to the map
              </button>
            </div>
          </div>
        </section>

        <div
          v-else-if="screen === 'shop'"
          class="mx-auto min-h-0 max-h-[68dvh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <RulerHookedShop />
        </div>

        <div
          v-else-if="screen === 'records'"
          class="grid min-h-0 gap-3 ruler-scene-grid"
        >
          <div
            class="max-h-[62dvh] overflow-y-auto rounded-2xl bg-base-100 p-4"
          >
            <RulerHookedReignReview :save="store.save" />
          </div>
          <div
            class="max-h-[62dvh] overflow-y-auto rounded-2xl bg-base-100 p-4"
          >
            <RulerHookedFishopedia :save="store.save" />
          </div>
        </div>

        <div v-else-if="screen === 'saves'" class="mx-auto w-full max-w-3xl">
          <RulerHookedSlots @picked="onPicked" />
        </div>
      </template>
    </main>

    <template #fallback>
      <div class="py-12 text-center text-sm opacity-60">
        Preparing the royal lake…
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { createRun } from '~/utils/rulerHooked/newGame'
import { resolveScene } from '~/utils/rulerHooked/compositor'

type RulerScreen =
  | 'opening'
  | 'map'
  | 'lake'
  | 'catch'
  | 'briefing'
  | 'shop'
  | 'records'
  | 'saves'

const store = useRulerHookedStore()
const screen = ref<RulerScreen>('map')
const tabs: { id: RulerScreen; label: string; icon: string }[] = [
  { id: 'map', label: 'Kingdom map', icon: 'kind-icon:map' },
  { id: 'lake', label: 'Go fishing', icon: 'kind-icon:fish' },
  { id: 'briefing', label: 'Briefings', icon: 'kind-icon:scroll' },
  { id: 'shop', label: 'Royal shop', icon: 'kind-icon:coin' },
  { id: 'records', label: 'Chronicle', icon: 'kind-icon:book' },
  { id: 'saves', label: 'Saves', icon: 'kind-icon:save' },
]
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

function onPicked() {
  screen.value = store.showOpening ? 'opening' : 'map'
}
function finishOpening() {
  store.dismissOpening()
  screen.value = 'map'
}
function makeChoice(choiceId: string) {
  store.choose(choiceId)
  screen.value = store.pendingEnding ? 'briefing' : 'map'
}
function takeEnding() {
  store.acceptEnding()
  screen.value = 'map'
}
function keepFishing() {
  store.declineEnding()
  screen.value = 'map'
}

watch(
  () => store.activeCard,
  (card) => {
    if (card && !store.activeFishing && screen.value === 'lake') {
      screen.value = store.lastCatch || store.lastEscape ? 'catch' : 'briefing'
    }
  },
)
onMounted(() => {
  store.init()
  screen.value = store.showOpening ? 'opening' : 'map'
})

function endingTitleFor(key: string | null): string {
  return (
    store.bundle.endings.find((x) => x.outcomeKey === key)?.title ??
    'A Reign Remembered'
  )
}
const endingTitle = computed(() => endingTitleFor(store.pendingEnding))
const endingBody = computed(
  () =>
    store.bundle.endings.find((x) => x.outcomeKey === store.pendingEnding)
      ?.body ?? '',
)
</script>

<style scoped>
.ruler-scene-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
}
</style>
