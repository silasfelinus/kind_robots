<!-- components/ruler-hooked/ruler-hooked-court.vue
     The petition before the throne (t-054): the matter set out as a printed
     broadside edict, and the choices as a hand of cards. Each card paints the
     corner of the kingdom that choice would change most, as it would leave it,
     with its signed meter changes, computed by the real effects reducer before
     you commit. The court screen supplies the presenter and the backdrop. -->
<template>
  <div v-if="store.activeCard" class="rh-petition-court">
    <article class="rh-edict rh-broadside kr-scroll">
      <p class="rh-broadside-head rh-edict__kind">{{ edictKind }}</p>
      <h2 class="rh-edict__title">{{ store.activeCard.title }}</h2>
      <RulerHookedArt
        class="rh-edict__cut"
        :candidates="cardArt"
        :alt="store.activeCard.title"
      />
      <p v-if="store.activeCard.body" class="rh-edict__body">
        {{ store.activeCard.body }}
      </p>
      <p v-if="by" class="rh-edict__sign">— Presented by {{ by }}</p>
      <span class="rh-edict__seal" aria-hidden="true" />
    </article>

    <div class="rh-court-hand">
      <KrChoiceHand
        :choices="hand"
        :deal-key="store.activeCard.id"
        question="Your decree"
        testid-prefix="rh-choice"
        @play="emit('decree', $event.id)"
      >
        <template #art="{ choice }">
          <span class="rh-choice-art">
            <RulerHookedArt
              class="rh-choice-art__scene rh-tier-art"
              :candidates="previews[choice.id]?.art ?? cardArt"
              :position="`center ${previews[choice.id]?.focus ?? 50}%`"
            />
            <span class="rh-ledger">
              <span
                v-for="row in previews[choice.id]?.deltas ?? []"
                :key="row.key"
                class="rh-ledger__row"
                :data-sign="row.delta > 0 ? 'up' : 'down'"
              >
                <RulerHookedGlyph :name="row.glyph" />
                <span class="rh-ledger__label">{{ row.label }}</span>
                <span class="rh-ledger__value">{{ row.signed }}</span>
              </span>
              <span
                v-if="!previews[choice.id]?.deltas.length"
                class="rh-ledger__row rh-ledger__none"
                >No change to the realm</span
              >
            </span>
          </span>
        </template>
      </KrChoiceHand>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import {
  previewChoiceDeltas,
  resolveChoice,
} from '~/utils/rulerHooked/applyEffects'
import { resolveScene } from '~/utils/rulerHooked/compositor'
import {
  cardCandidates,
  sceneVistaCandidates,
} from '~/utils/rulerHooked/artLibrary'
import { AXIS_LABEL, REGION_PIN } from '~/utils/rulerHooked/console'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'
import type { AxisKey, RegionKey } from '~/types/ruler-hooked'

const props = defineProps<{ by?: string; presenter?: string }>()
const emit = defineEmits<{ decree: [choiceId: string] }>()
const store = useRulerHookedStore()

const cardArt = computed(() =>
  store.activeCard ? cardCandidates(store.activeCard, props.presenter) : [],
)

const edictKind = computed(() => {
  const kind = store.activeCard?.kind
  if (kind === 'arc-step') return 'A matter continues'
  if (kind === 'finale') return 'The final matter'
  return 'Royal Petition'
})

function signed(n: number): string {
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`
}

interface Preview {
  art: string[]
  focus: number
  deltas: {
    key: string
    glyph: AxisKey | 'coin'
    label: string
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
      art: focusKey
        ? [
            ...sceneVistaCandidates(
              focusKey,
              scene,
              store.timeOfDay,
              now.regionStates[focusKey],
            ),
            ...cardArt.value,
          ]
        : cardArt.value,
      focus: (focusKey && REGION_PIN[focusKey]?.y) || 50,
      deltas: deltas.map((d) => ({
        key: d.key,
        glyph: d.key === 'coins' ? 'coin' : d.key,
        label: d.key === 'coins' ? 'Coins' : AXIS_LABEL[d.key],
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

function onDigit(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (!/^[1-9]$/.test(event.key)) return
  const choice = store.activeCard?.choices[Number(event.key) - 1]
  const target = event.target as HTMLElement | null
  if (!choice || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA')
    return
  event.preventDefault()
  emit('decree', choice.id)
}
onMounted(() => window.addEventListener('keydown', onDigit))
onBeforeUnmount(() => window.removeEventListener('keydown', onDigit))
</script>

<style scoped>
.rh-petition-court {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.6rem;
  height: 100%;
  min-height: 0;
  --hand-accent: var(--rh-madder);
  --hand-accent-2: var(--rh-ochre);
  --hand-band: #efe3c6;
  --hand-band-ink: #1d150d;
  --hand-card-max: 13.5rem;
  --hand-card-vh: 26vh;
  --hand-card-cqw: 30cqw;
  --hand-focus-scale: 1.08;
}
.rh-edict {
  position: relative;
  flex: 0 1 auto;
  min-width: 0;
  min-height: 5rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.9rem 1.1rem 1rem;
}
.rh-edict__kind {
  font-size: 0.72rem;
}
.rh-edict__title {
  margin-top: 0.1rem;
  font-family: var(--rh-display);
  font-size: clamp(1.05rem, 2.6cqi, 1.7rem);
  font-weight: 900;
  line-height: 1.1;
}
.rh-edict__cut {
  float: right;
  width: clamp(5rem, 30%, 12rem);
  aspect-ratio: 7 / 4;
  margin: 0.3rem 0 0.4rem 0.8rem;
  filter: sepia(0.35) contrast(1.15) saturate(0.85);
  box-shadow:
    0 0 0 2px var(--rh-woodcut),
    0 0 0 4px var(--rh-rag),
    0 0 0 5px var(--rh-woodcut);
}
.rh-edict__body {
  margin-top: 0.45rem;
  font-size: 0.95rem;
  line-height: 1.4;
}
.rh-edict__body::first-letter {
  float: left;
  margin: 0.1rem 0.3rem 0 0;
  padding: 0 0.2rem;
  background: var(--rh-madder);
  color: var(--rh-rag);
  font-size: 2.4em;
  font-weight: 900;
  line-height: 0.9;
}
.rh-edict__sign {
  clear: both;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-style: italic;
  text-align: right;
  padding-right: 2.6rem;
}
.rh-edict__seal {
  position: absolute;
  right: 0.8rem;
  bottom: 0.5rem;
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
}
.rh-court-hand :deep(.krh-question) {
  color: var(--rh-gold-hi);
  text-shadow: 0 1px 3px #000;
}
.rh-choice-art {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--rh-rag);
}
.rh-choice-art__scene {
  flex: 1 1 auto;
  min-height: 0;
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
}
.rh-ledger__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.25;
}
.rh-ledger__row :deep(.rh-glyph) {
  width: 0.85rem;
  height: 0.85rem;
}
.rh-ledger__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rh-ledger__value {
  font-variant-numeric: tabular-nums;
  font-weight: 900;
}
.rh-ledger__row[data-sign='up'] .rh-ledger__value {
  color: #2d7a63;
}
.rh-ledger__row[data-sign='down'] .rh-ledger__value {
  color: var(--rh-madder);
}
.rh-ledger__none {
  display: block;
  font-style: italic;
  font-weight: 600;
}
@container rhconsole (max-width: 899px) {
  .rh-edict__cut {
    display: none;
  }
  .rh-edict {
    padding: 0.7rem 0.8rem 0.8rem;
  }
  .rh-edict__body {
    font-size: 0.85rem;
  }
  .rh-petition-court {
    --hand-card-cqw: 33cqw;
  }
}
</style>
