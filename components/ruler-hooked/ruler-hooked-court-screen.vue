<!-- The throne room. A petition is presented by the character who brought it
     (painted portrait, left), printed as a broadside edict, and answered from
     a hand of illustrated choice cards whose signed kingdom changes are shown
     before you commit (RulerHookedCourt, t-054). Finales and the closed
     chronicle are read from the royal scroll here. -->
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
        <RulerHookedCourt
          v-if="store.activeCard"
          :by="presenterLabel"
          :presenter="presenter?.slug"
          @decree="decide"
        />

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
            Ending the story closes this save for fishing and new decrees. You
            can also continue ruling; this finale will not interrupt you again.
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
  characterCandidates,
  endingCandidates,
} from '~/utils/rulerHooked/artLibrary'
import { ADVISOR_CHARACTER_SLUG } from '~/utils/rulerHooked/advisor'
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
.rh-court__main:has(> .rh-petition-court) {
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
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
.rh-scroll__body {
  margin-top: 0.35rem;
  font-size: clamp(0.88rem, 1.6cqi, 1.02rem);
  line-height: 1.45;
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
