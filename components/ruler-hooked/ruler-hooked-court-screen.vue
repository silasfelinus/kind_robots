<!-- The throne room. A petition is set out on a rainbow edict panel (its
     painting, full text and petitioner) and answered from a hand of
     illustrated choice cards whose signed kingdom changes are shown before
     you commit (RulerHookedCourt, t-054). Between petitions the advisor stands
     at the left. Finales and the closed
     chronicle are read from the royal scroll here. -->
<template>
  <section class="rh-screen rh-court" aria-label="Royal Court">
    <RulerHookedArt
      class="rh-backdrop rh-court__backdrop"
      :candidates="BACKDROPS.court"
      eager
    />

    <div
      class="rh-court__stage"
      :class="{ 'has-presenter': presenter && !store.activeCard }"
    >
      <RulerHookedArt
        v-if="presenter && !store.activeCard"
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

        <article v-else-if="store.pendingEnding" class="rh-scroll rh-ending">
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
          class="rh-scroll rh-ending"
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

        <article v-else class="rh-scroll rh-quiet">
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
  filter: saturate(1.25) brightness(0.62) blur(1px);
}
.rh-court__stage {
  container: rhcourt / size;
  position: relative;
  z-index: 2;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  align-items: end;
  padding: clamp(4rem, 8cqi, 4.6rem) clamp(0.6rem, 2cqi, 1.5rem)
    clamp(0.6rem, 2cqi, 1.25rem);
}
.rh-court__presenter {
  display: none;
}
@container rhconsole (min-width: 900px) {
  .rh-court__stage.has-presenter {
    grid-template-columns: minmax(12rem, 26%) 1fr;
    gap: 1rem;
  }
  .rh-court__presenter {
    display: block;
    align-self: stretch;
    border: 3px solid transparent;
    border-radius: 1.2rem;
    background:
      linear-gradient(160deg, rgb(33 26 103), var(--rh-plum-deep)) padding-box,
      var(--rh-spectrum) border-box;
    box-shadow:
      0 0 0 2px var(--rh-ink),
      6px 6px 0 2px var(--rh-hot);
  }
}
.rh-court__main {
  display: grid;
  gap: clamp(0.5rem, 1.5cqi, 0.9rem);
  align-content: safe end;
  max-height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 0.35rem 0.35rem;
  scrollbar-width: thin;
}
.rh-court__main:has(> .rh-petition-court) {
  align-self: stretch;
  height: 100%;
  overflow-x: hidden;
  padding-right: 0.6rem;
}
.rh-scroll {
  position: relative;
  padding: 1.6rem clamp(0.9rem, 2cqi, 1.3rem) 1.1rem;
  border: 2px solid var(--rh-gold);
  border-radius: 1.15rem;
  background:
    var(--rh-spectrum) top / 100% 6px no-repeat,
    linear-gradient(155deg, rgb(33 26 103 / 0.95), rgb(8 13 53 / 0.95));
  color: #f4faff;
  box-shadow:
    0 0 0 3px var(--rh-plum),
    6px 6px 0 3px var(--rh-hot),
    0 14px 35px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(8px);
}
.rh-scroll .rh-title {
  color: var(--rh-gold-soft);
  text-shadow: 2px 2px 0 var(--rh-hot);
}
.rh-scroll__ribbon {
  position: absolute;
  top: -0.85rem;
  left: 50%;
  translate: -50% 0;
  padding: 0.2rem 1.4rem;
  background: var(--rh-spectrum);
  border: 2px solid var(--rh-ink);
  border-radius: 999px;
  color: var(--rh-ink);
  font-family: var(--rh-display);
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 3px 3px 0 var(--rh-hot);
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
  border: 3px solid var(--rh-ink);
  box-shadow: 0 0 0 2px var(--rh-gold);
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
