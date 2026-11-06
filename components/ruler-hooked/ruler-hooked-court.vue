<!-- components/ruler-hooked/ruler-hooked-court.vue
     The Court tab of the console (t-054): the petitioner large, the matter set
     out as a printed broadside edict, and the choices as a hand of cards. Each
     card shows the kingdom as that choice would leave it and its signed meter
     changes, computed by the real effects reducer before you commit. -->
<template>
  <div class="contents">
    <section class="rh-main rh-court">
      <template v-if="store.activeCard">
        <div class="rh-court-top">
          <figure class="rh-petitioner">
            <img
              v-if="portrait"
              :key="portrait"
              :src="portrait"
              :alt="petitioner?.name ?? 'Petitioner'"
              @error="portraitMiss += 1"
            />
            <span v-else class="rh-petitioner-initial" aria-hidden="true">{{
              (petitioner?.name ?? '?').charAt(0)
            }}</span>
            <figcaption v-if="petitioner">{{ petitionerLabel }}</figcaption>
          </figure>

          <article class="rh-edict rh-broadside kr-scroll">
            <p class="rh-broadside-head rh-edict-kind">{{ edictKind }}</p>
            <h2 class="rh-edict-title">{{ store.activeCard.title }}</h2>
            <img
              v-if="cut"
              :key="cut"
              :src="cut"
              alt=""
              class="rh-edict-cut"
              @error="cutMiss += 1"
            />
            <p v-if="store.activeCard.body" class="rh-edict-body">
              {{ store.activeCard.body }}
            </p>
            <p v-if="petitioner" class="rh-edict-sign">
              — {{ relayed ? 'relayed by ' : '' }}{{ petitioner.name }}
            </p>
            <span class="rh-edict-seal" aria-hidden="true" />
          </article>
        </div>

        <div class="rh-court-hand">
          <KrChoiceHand
            :choices="hand"
            :deal-key="store.activeCard.id"
            question="Your decree"
            testid-prefix="rh-choice"
            @play="decree"
          >
            <template #art="{ choice }">
              <span class="rh-choice-art">
                <RulerHookedStage
                  :scene="previews[choice.id]?.scene ?? store.scene"
                  :regions="store.bundle.regions"
                  :fill="true"
                  :labels="false"
                  :focus="previews[choice.id]?.focus"
                  class="rh-choice-scene !rounded-none !border-0"
                />
                <span class="rh-ledger">
                  <span
                    v-for="row in previews[choice.id]?.deltas ?? []"
                    :key="row.key"
                    class="rh-ledger-row"
                    :data-sign="row.delta > 0 ? 'up' : 'down'"
                  >
                    <Icon :name="row.icon" class="rh-ledger-icon" />
                    <span class="rh-ledger-label">{{ row.label }}</span>
                    <span class="rh-ledger-value">{{ row.signed }}</span>
                  </span>
                  <span
                    v-if="!previews[choice.id]?.deltas.length"
                    class="rh-ledger-row rh-ledger-none"
                    >No change to the realm</span
                  >
                </span>
              </span>
            </template>
          </KrChoiceHand>
        </div>
      </template>

      <article
        v-else-if="store.pendingEnding"
        class="rh-edict rh-broadside rh-court-solo kr-scroll"
      >
        <p class="rh-broadside-head rh-edict-kind">The end of a reign</p>
        <h2 class="rh-edict-title">{{ endingTitle }}</h2>
        <p class="rh-edict-body">{{ endingBody }}</p>
        <div class="rh-court-buttons">
          <button type="button" class="btn btn-primary" @click="takeEnding">
            Accept this ending
          </button>
          <button type="button" class="btn btn-outline" @click="keepFishing">
            Keep fishing
          </button>
        </div>
      </article>

      <article v-else class="rh-edict rh-broadside rh-court-solo">
        <p class="rh-broadside-head rh-edict-kind">Court is in recess</p>
        <h2 class="rh-edict-title">An unusually quiet court</h2>
        <p class="rh-edict-body">
          Fish the lake to turn the day. When the court has a matter, it will be
          posted here.
        </p>
        <div class="rh-court-buttons">
          <button type="button" class="btn btn-primary" @click="emit('lake')">
            Back to the lake
          </button>
        </div>
      </article>
    </section>

    <section
      v-if="decrees.length"
      class="rh-aside rh-panel rh-decrees kr-scroll"
      aria-label="Recent decrees"
    >
      <h3 class="rh-decrees-head">Recent decrees</h3>
      <ol>
        <li v-for="entry in decrees" :key="`${entry.turn}-${entry.cardId}`">
          <span class="rh-decrees-day">Day {{ entry.turn + 1 }}</span>
          <strong>{{ entry.prompt }}</strong>
          <span>{{ entry.choiceText }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import {
  previewChoiceDeltas,
  resolveChoice,
} from '~/utils/rulerHooked/applyEffects'
import { resolveScene } from '~/utils/rulerHooked/compositor'
import { cardArtPath } from '~/utils/rulerHooked/cardArt'
import {
  characterFallbackPortraitPath,
  characterPortraitPath,
} from '~/utils/rulerHooked/characterArt'
import { AXIS_ICON, AXIS_LABEL, REGION_PIN } from '~/utils/rulerHooked/console'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'
import type { RegionKey, SceneState } from '~/types/ruler-hooked'

const emit = defineEmits<{ chosen: []; ending: []; lake: [] }>()
const store = useRulerHookedStore()

const relayed = computed(() => !store.activeCard?.characters?.length)
const petitioner = computed(() => {
  const slug =
    store.activeCard?.characters?.[0] ?? store.advisorCharacter?.slug ?? ''
  return store.bundle.characters.find((c) => c.slug === slug) ?? null
})

const petitionerLabel = computed(() =>
  [petitioner.value?.name, petitioner.value?.honorific]
    .filter(Boolean)
    .join(' '),
)

const portraitMiss = ref(0)
const cutMiss = ref(0)
watch(
  () => store.activeCard?.id,
  () => {
    portraitMiss.value = 0
    cutMiss.value = 0
  },
)
const portrait = computed(() => {
  const slug = petitioner.value?.slug
  if (!slug) return null
  const ladder = [
    characterPortraitPath(slug, 'neutral'),
    characterFallbackPortraitPath(slug),
  ]
  return ladder[portraitMiss.value] ?? null
})
const cut = computed(() => {
  const art = store.activeCard?.art
  return art && cutMiss.value === 0 ? cardArtPath(art) : null
})

const edictKind = computed(() => {
  const kind = store.activeCard?.kind
  if (kind === 'arc-step') return 'From the chronicle'
  if (kind === 'finale') return 'The final matter'
  return 'Royal petition'
})

function signed(n: number): string {
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`
}

interface Preview {
  scene: SceneState
  focus: number
  deltas: {
    key: string
    label: string
    icon: string
    signed: string
    delta: number
  }[]
}

const previews = computed<Record<string, Preview>>(() => {
  const save = store.save
  const card = store.activeCard
  const now = store.scene
  if (!save || !card || !now) return {}
  const manifest = store.bundle.regions
  const out: Record<string, Preview> = {}
  for (const choice of card.choices) {
    const deltas = previewChoiceDeltas(save, card, choice)
    const scene = resolveScene(resolveChoice(save, card, choice), manifest)
    const changed = (Object.keys(scene.regionStates) as RegionKey[]).filter(
      (key) =>
        REGION_PIN[key] && scene.regionStates[key] !== now.regionStates[key],
    )
    const decreed = Object.keys(
      choice.effects?.regionOverride ?? {},
    ) as RegionKey[]
    const strongest = [...deltas]
      .filter((d) => d.key !== 'coins')
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
    const driven = strongest
      ? (Object.keys(manifest.regions) as RegionKey[]).find(
          (key) => manifest.regions[key]?.driver?.slider === strongest.key,
        )
      : undefined
    const focusKey = decreed[0] ?? changed[0] ?? driven
    out[choice.id] = {
      scene,
      focus: (focusKey && REGION_PIN[focusKey]?.y) || 50,
      deltas: deltas.map((d) => ({
        key: d.key,
        label: d.key === 'coins' ? 'Coins' : AXIS_LABEL[d.key],
        icon: AXIS_ICON[d.key],
        signed: signed(d.delta),
        delta: d.delta,
      })),
    }
  }
  return out
})

const hand = computed<KrHandChoice[]>(() =>
  (store.activeCard?.choices ?? []).map((choice, index) => {
    const rows = previews.value[choice.id]?.deltas ?? []
    return {
      id: choice.id,
      label: choice.text,
      shortcut: String(index + 1),
      details: rows.length
        ? [rows.map((r) => `${r.label} ${r.signed}`).join(', ')]
        : ['No change to the realm'],
    }
  }),
)

function decree(choice: KrHandChoice) {
  store.choose(choice.id)
  emit('chosen')
}

const ending = computed(() =>
  store.bundle.endings.find((x) => x.outcomeKey === store.pendingEnding),
)
const endingTitle = computed(() => ending.value?.title ?? 'A Reign Remembered')
const endingBody = computed(() => ending.value?.body ?? '')
function takeEnding() {
  store.acceptEnding()
  emit('ending')
}
function keepFishing() {
  store.declineEnding()
  emit('ending')
}

const decrees = computed(() =>
  [...(store.save?.choiceLog ?? [])].reverse().slice(0, 6),
)

function onDigit(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const card = store.activeCard
  const index = Number(event.key) - 1
  const choice = card?.choices[index]
  if (!choice || !/^[1-9]$/.test(event.key)) return
  const target = event.target as HTMLElement | null
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
  event.preventDefault()
  store.choose(choice.id)
  emit('chosen')
}
onMounted(() => window.addEventListener('keydown', onDigit))
onBeforeUnmount(() => window.removeEventListener('keydown', onDigit))
</script>

<style scoped>
.rh-court {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 0;
  --hand-accent: var(--rh-madder);
  --hand-accent-2: var(--rh-ochre);
  --hand-band: #efe3c6;
  --hand-band-ink: #1d150d;
  --hand-card-max: 13.5rem;
  --hand-card-vh: 24vh;
  --hand-card-cqw: 30cqw;
  --hand-focus-scale: 1.08;
}
.rh-court-top {
  display: flex;
  gap: 0.6rem;
  min-height: 0;
  flex: 1 1 auto;
}
.rh-petitioner {
  position: relative;
  flex: 0 0 auto;
  width: clamp(5.5rem, 26%, 15rem);
  margin: 0;
  overflow: hidden;
  border-radius: 0.3rem;
  background: var(--rh-lapis-deep);
  box-shadow:
    0 0 0 2px var(--rh-gold),
    0 0 0 3px var(--rh-gold-lo),
    0 8px 20px #000a;
}
.rh-petitioner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 20%;
}
.rh-console[data-tier='rotten'] .rh-petitioner img {
  filter: sepia(0.3) saturate(0.7);
}
.rh-petitioner-initial {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--rh-gold-hi);
  font-family: var(--rh-chronicle);
  font-size: 3rem;
}
.rh-petitioner figcaption {
  position: absolute;
  inset: auto 0 0;
  padding: 1.2rem 0.5rem 0.35rem;
  background: linear-gradient(transparent, rgb(10 8 20 / 0.85));
  color: var(--rh-gold-hi);
  font-family: var(--rh-chronicle);
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
}
.rh-edict {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.9rem 1.1rem 1rem;
}
.rh-edict-kind {
  font-size: 0.72rem;
}
.rh-edict-title {
  margin-top: 0.1rem;
  font-size: clamp(1.05rem, 2.6cqw, 1.7rem);
  font-weight: 900;
  line-height: 1.1;
}
.rh-edict-cut {
  float: right;
  width: clamp(5rem, 30%, 12rem);
  aspect-ratio: 4 / 3;
  margin: 0.3rem 0 0.4rem 0.8rem;
  object-fit: cover;
  filter: sepia(0.35) contrast(1.15) saturate(0.85);
  box-shadow:
    0 0 0 2px var(--rh-woodcut),
    0 0 0 4px var(--rh-rag),
    0 0 0 5px var(--rh-woodcut);
}
.rh-edict-body {
  margin-top: 0.45rem;
  font-size: 0.95rem;
  line-height: 1.4;
}
.rh-edict-body::first-letter {
  float: left;
  margin: 0.1rem 0.3rem 0 0;
  padding: 0 0.2rem;
  background: var(--rh-madder);
  color: var(--rh-rag);
  font-size: 2.4em;
  font-weight: 900;
  line-height: 0.9;
}
.rh-edict-sign {
  clear: both;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-style: italic;
  text-align: right;
}
.rh-edict-seal {
  position: absolute;
  right: 0.8rem;
  bottom: -0.2rem;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 999px;
  background: radial-gradient(
    circle at 38% 35%,
    #d4554a,
    var(--rh-madder) 55%,
    #5e1712
  );
  box-shadow: 0 0 0 2px #7a1f19;
  opacity: 0.9;
}
.rh-court-hand {
  flex: 0 0 auto;
  margin-top: auto;
}
.rh-court-hand :deep(.krh-question) {
  color: var(--rh-gold-hi);
  text-shadow: 0 1px 3px #000;
}
.rh-court-solo {
  align-self: center;
  max-width: 38rem;
  margin: auto 0;
  flex: 0 1 auto;
}
.rh-court-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;
}
.rh-choice-art {
  display: flex;
  flex-direction: column;
  background: var(--rh-rag);
}
.rh-choice-scene {
  position: relative !important;
  flex: 1 1 auto;
  min-height: 0;
  height: auto !important;
}
.rh-ledger {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 0.05rem;
  padding: 0.3rem 0.4rem 1.45rem;
  border-top: 2px solid var(--rh-woodcut);
  background:
    repeating-linear-gradient(
      90deg,
      rgb(120 90 50 / 0.05) 0 1px,
      transparent 1px 5px
    ),
    var(--rh-rag);
  color: var(--rh-woodcut);
  font-family: var(--rh-press);
}
.rh-ledger-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.25;
}
.rh-ledger-icon {
  width: 0.75rem;
  height: 0.75rem;
}
.rh-ledger-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rh-ledger-value {
  font-variant-numeric: tabular-nums;
  font-weight: 900;
}
.rh-ledger-row[data-sign='up'] .rh-ledger-value {
  color: #2d7a63;
}
.rh-ledger-row[data-sign='down'] .rh-ledger-value {
  color: var(--rh-madder);
}
.rh-ledger-none {
  display: block;
  font-style: italic;
  font-weight: 600;
}
.rh-decrees {
  padding: 0.75rem 0.85rem;
  overflow-y: auto;
}
.rh-decrees-head {
  margin-bottom: 0.35rem;
  color: var(--rh-lapis);
  font-size: 1rem;
  font-variant: small-caps;
  font-weight: 700;
  text-align: center;
}
.rh-decrees ol {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.rh-decrees li {
  display: flex;
  flex-direction: column;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid
    color-mix(in oklab, var(--rh-gold-lo) 40%, transparent);
  font-size: 0.8rem;
  line-height: 1.3;
}
.rh-decrees-day {
  color: var(--rh-vermilion);
  font-size: 0.7rem;
  font-variant: small-caps;
  font-weight: 700;
}
@container rh (max-width: 55.99rem) {
  .rh-court-top {
    flex: 1 1 0;
  }
  .rh-petitioner {
    width: 26%;
  }
  .rh-edict-cut {
    display: none;
  }
  .rh-edict {
    padding: 0.7rem 0.8rem 0.8rem;
  }
  .rh-edict-body {
    font-size: 0.85rem;
  }
  .rh-court {
    --hand-card-cqw: 33cqw;
  }
  .rh-decrees {
    display: none;
  }
}
</style>
