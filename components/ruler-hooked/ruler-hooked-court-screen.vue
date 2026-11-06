<!-- The throne room. A petition is presented by the character who brought it
     (painted portrait, left), read from a royal scroll, and answered with
     three illustrated choice cards whose kingdom effects are shown up front. -->
<template>
  <section class="rh-screen rh-court" aria-label="Royal Court">
    <RulerHookedArt
      class="rh-backdrop rh-court__backdrop"
      :candidates="BACKDROPS.court"
      eager
    />

    <div class="rh-court__stage">
      <RulerHookedArt
        v-if="presenter"
        class="rh-court__presenter"
        :candidates="characterCandidates(presenter.slug)"
        :alt="presenterLabel"
        :initial="presenter.name.charAt(0)"
        fit="contain"
        position="center bottom"
      />

      <div class="rh-court__main">
        <template v-if="store.activeCard">
          <article class="rh-parchment rh-scroll">
            <p class="rh-scroll__ribbon">
              {{
                store.activeCard.kind === 'arc-step'
                  ? 'A matter continues'
                  : 'Royal Petition'
              }}
            </p>
            <div class="rh-scroll__grid">
              <div>
                <h2 class="rh-title rh-title--big">
                  {{ store.activeCard.title }}
                </h2>
                <p v-if="store.activeCard.body" class="rh-scroll__body">
                  {{ store.activeCard.body }}
                </p>
                <p v-if="presenter" class="rh-scroll__by">
                  Presented by {{ presenterLabel }}
                </p>
              </div>
              <RulerHookedArt
                class="rh-scroll__art"
                :candidates="cardArt"
                :alt="store.activeCard.title"
              />
            </div>
          </article>
          <div
            class="rh-choices"
            :class="`rh-choices--${store.activeCard.choices.length}`"
          >
            <button
              v-for="(choice, i) in store.activeCard.choices"
              :key="choice.id"
              type="button"
              class="rh-choice"
              @click="decide(choice.id)"
            >
              <span class="rh-choice__ribbon">{{
                ['Decree', 'Or', 'Or else'][i] ?? 'Or'
              }}</span>
              <span class="rh-choice__text">{{ choice.text }}</span>
              <span v-if="chips(choice).length" class="rh-choice__chips">
                <span
                  v-for="chip in chips(choice)"
                  :key="chip.key"
                  class="rh-chip"
                  :class="chip.up ? 'is-up' : 'is-down'"
                >
                  <RulerHookedGlyph :name="chip.glyph" />
                  <span class="sr-only">{{ chip.key }}</span
                  >{{ chip.arrows }}
                </span>
              </span>
              <span v-else class="rh-choice__chips rh-choice__quiet"
                >No visible change</span
              >
            </button>
          </div>
        </template>

        <article
          v-else-if="store.pendingEnding"
          class="rh-parchment rh-scroll rh-ending"
        >
          <p class="rh-scroll__ribbon">A possible finale</p>
          <RulerHookedArt
            class="rh-ending__art"
            :candidates="endingCandidates(store.pendingEnding)"
            :alt="endingTitle"
          />
          <h2 class="rh-title rh-title--big">{{ endingTitle }}</h2>
          <p class="rh-scroll__body">{{ endingBody }}</p>
          <p class="rh-scroll__body">
            Your choices have unlocked a possible conclusion to this reign.
            Ending the story closes this save for fishing and new decrees.
            You can also continue ruling; this finale will not interrupt you again.
          </p>
          <div class="rh-actions">
            <button
              type="button"
              class="rh-btn rh-btn--gold"
              @click="store.acceptEnding()"
            >
              Conclude this reign
            </button>
            <button type="button" class="rh-btn" @click="keepFishing">
              Continue this reign
            </button>
          </div>
        </article>

        <article
          v-else-if="store.save?.status === 'COMPLETE'"
          class="rh-parchment rh-scroll rh-ending"
        >
          <p class="rh-scroll__ribbon">The chronicle closes</p>
          <RulerHookedArt
            class="rh-ending__art"
            :candidates="endingCandidates(store.save.endingKey)"
            :alt="endingTitleFor(store.save.endingKey)"
          />
          <h2 class="rh-title rh-title--big">
            {{ endingTitleFor(store.save.endingKey) }}
          </h2>
          <button
            type="button"
            class="rh-btn rh-btn--gold"
            @click="emit('navigate', 'saves')"
          >
            Begin another reign
          </button>
        </article>

        <article v-else class="rh-parchment rh-scroll rh-quiet">
          <p class="rh-scroll__ribbon">The Royal Court</p>
          <h2 class="rh-title rh-title--big">An unusually quiet court</h2>
          <p class="rh-scroll__body">
            {{
              lastDecree ??
              'No one is waiting with a petition. Quill suggests, very formally, that you go fishing.'
            }}
          </p>
          <button
            type="button"
            class="rh-btn rh-btn--gold"
            @click="emit('navigate', 'lake')"
          >
            To the lake
          </button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import {
  BACKDROPS,
  cardCandidates,
  characterCandidates,
  endingCandidates,
} from '~/utils/rulerHooked/artLibrary'
import { ADVISOR_CHARACTER_SLUG } from '~/utils/rulerHooked/advisor'
import type { AxisKey, Choice } from '~/types/ruler-hooked'
import type { ConsoleScreen } from '~/utils/rulerHooked/tutorial'

const emit = defineEmits<{ navigate: [screen: ConsoleScreen]; chose: [] }>()
const store = useRulerHookedStore()

const presenter = computed(() => {
  const slug = store.activeCard?.characters?.[0] ?? ADVISOR_CHARACTER_SLUG
  return store.bundle.characters.find((c) => c.slug === slug) ?? null
})
const presenterLabel = computed(() =>
  presenter.value
    ? [presenter.value.name, presenter.value.honorific]
        .filter(Boolean)
        .join(' ')
    : '',
)
const cardArt = computed(() =>
  store.activeCard
    ? cardCandidates(store.activeCard, presenter.value?.slug)
    : [],
)

type ChipGlyph = AxisKey | 'coin'
function chips(choice: Choice) {
  const out: { key: string; glyph: ChipGlyph; up: boolean; arrows: string }[] =
    []
  const arrows = (v: number) =>
    (v > 0 ? '▲' : '▼').repeat(Math.abs(v) >= 10 ? 2 : 1)
  for (const [key, v] of Object.entries(choice.effects?.sliders ?? {})) {
    if (!v) continue
    out.push({ key, glyph: key as AxisKey, up: v > 0, arrows: arrows(v) })
  }
  const coins = choice.effects?.counters?.coins
  if (coins)
    out.push({
      key: 'coins',
      glyph: 'coin',
      up: coins > 0,
      arrows: arrows(coins),
    })
  return out
}

const lastDecree = ref<string | null>(null)
function decide(choiceId: string) {
  const choice = store.activeCard?.choices.find((c) => c.id === choiceId)
  lastDecree.value = choice?.result ?? null
  store.choose(choiceId)
  emit('chose')
}

function keepFishing() {
  store.declineEnding()
  emit('navigate', 'lake')
}

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
.rh-court__backdrop {
  filter: saturate(0.75) brightness(0.6) blur(1.5px);
}
.rh-court__stage {
  position: relative;
  z-index: 2;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  align-items: end;
  padding: clamp(4.5rem, 12cqi, 6rem) clamp(0.6rem, 2cqi, 1.5rem)
    clamp(0.6rem, 2cqi, 1.25rem);
}
.rh-court__presenter {
  display: none;
  background: transparent !important;
}
@container rhconsole (min-width: 900px) {
  .rh-court__stage {
    grid-template-columns: minmax(12rem, 26%) 1fr;
    gap: 1rem;
    padding-left: 0;
  }
  .rh-court__presenter {
    display: block;
    align-self: stretch;
    margin-top: 6rem;
    border-radius: 1.2rem 1.2rem 0 0;
    border: 2px solid var(--rh-gold);
    border-bottom: 0;
    box-shadow:
      0 0 0 4px rgb(59 21 48 / 0.6),
      0 12px 30px rgb(0 0 0 / 0.5);
    background: radial-gradient(circle at 50% 30%, #fbeed3, #e3cfa3) !important;
  }
}
.rh-court__main {
  display: grid;
  gap: clamp(0.5rem, 1.5cqi, 0.9rem);
  align-content: end;
  max-height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 0.35rem 0.35rem;
  scrollbar-width: thin;
}
.rh-scroll {
  position: relative;
  padding-top: 1.4rem;
}
.rh-scroll__ribbon {
  position: absolute;
  top: -0.85rem;
  left: 50%;
  translate: -50% 0;
  padding: 0.2rem 1.4rem;
  background: linear-gradient(180deg, #7b2350, var(--rh-plum));
  border: 1.5px solid var(--rh-gold);
  border-radius: 0.4rem;
  color: var(--rh-gold-soft);
  font-family: var(--rh-display);
  font-style: italic;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 3px 8px rgb(0 0 0 / 0.35);
}
.rh-scroll__grid {
  display: grid;
  gap: 0.75rem;
}
@container rhconsole (min-width: 640px) {
  .rh-scroll__grid {
    grid-template-columns: 1fr minmax(10rem, 38%);
    align-items: start;
  }
}
.rh-scroll__body {
  margin-top: 0.35rem;
  font-size: clamp(0.88rem, 1.6cqi, 1.02rem);
  line-height: 1.45;
}
.rh-scroll__by {
  margin-top: 0.45rem;
  font-size: 0.8rem;
  font-style: italic;
  opacity: 0.75;
}
.rh-scroll__art {
  aspect-ratio: 7 / 4;
  border-radius: 0.6rem;
  border: 2px solid rgb(58 38 22 / 0.5);
  box-shadow: 0 4px 10px rgb(0 0 0 / 0.25);
}
.rh-choices {
  display: grid;
  gap: clamp(0.4rem, 1.2cqi, 0.75rem);
  grid-template-columns: 1fr;
}
@container rhconsole (min-width: 640px) {
  .rh-choices--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .rh-choices--3,
  .rh-choices--4 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.rh-choice {
  position: relative;
  display: grid;
  gap: 0.4rem;
  align-content: start;
  text-align: left;
  padding: 1.1rem 0.85rem 0.75rem;
  border-radius: 0.9rem;
  background:
    radial-gradient(120% 90% at 50% 0%, #fff8e6, transparent 70%),
    linear-gradient(180deg, var(--rh-parch), var(--rh-parch-shade));
  color: var(--rh-ink);
  border: 2px solid var(--rh-gold);
  box-shadow:
    0 0 0 3px rgb(59 21 48 / 0.65),
    0 8px 18px rgb(0 0 0 / 0.35);
  cursor: pointer;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}
.rh-choice:hover,
.rh-choice:focus-visible {
  transform: translateY(-3px);
  box-shadow:
    0 0 0 3px #ffd977,
    0 12px 24px rgb(0 0 0 / 0.4);
  outline: none;
}
.rh-choice__ribbon {
  position: absolute;
  top: -0.7rem;
  left: 0.8rem;
  padding: 0.05rem 0.6rem;
  border-radius: 0.3rem;
  background: var(--rh-plum);
  color: var(--rh-gold-soft);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid var(--rh-gold);
}
.rh-choice__text {
  font-family: var(--rh-display);
  font-weight: 700;
  font-size: clamp(0.92rem, 1.7cqi, 1.08rem);
  line-height: 1.25;
}
.rh-choice__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: auto;
}
.rh-choice__quiet {
  font-size: 0.75rem;
  font-style: italic;
  opacity: 0.6;
}
.rh-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.05rem 0.4rem 0.05rem 0.2rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgb(255 255 255 / 0.55);
  border: 1px solid rgb(58 38 22 / 0.2);
}
.rh-chip.is-up {
  color: #2f6a22;
}
.rh-chip.is-down {
  color: #a3283d;
}
.rh-ending__art {
  aspect-ratio: 7 / 4;
  max-height: 40cqh;
  width: 100%;
  border-radius: 0.6rem;
  margin-bottom: 0.6rem;
  border: 2px solid rgb(58 38 22 / 0.5);
}
.rh-quiet,
.rh-ending {
  max-width: 40rem;
  justify-self: center;
  width: 100%;
  display: grid;
  gap: 0.4rem;
  justify-items: start;
}
</style>
