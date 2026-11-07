<!-- components/ruler-hooked/ruler-hooked-court.vue
     The petition before the throne (t-054): the matter set out as a flat,
     legible edict card, and the choices as a hand of cards. Each card paints the
     corner of the kingdom that choice would change most, as it would leave it,
     with its signed meter changes, computed by the real effects reducer before
     you commit. The court screen supplies the presenter and the backdrop. -->
<template>
  <div v-if="store.activeCard" class="rh-petition-court">
    <article class="rh-edict kr-scroll">
      <p class="rh-edict__kind">{{ edictKind }}</p>
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
  --hand-accent: var(--rh-hot);
  --hand-accent-2: var(--rh-gold);
  --hand-band: var(--rh-plum-deep);
  --hand-band-ink: #fff;
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
  padding: 1.05rem 1.1rem 1rem;
  border: 3px solid var(--rh-ink);
  border-radius: 0.8rem;
  background:
    var(--rh-spectrum) top / 100% 6px no-repeat,
    var(--rh-parch);
  color: var(--rh-ink);
  font-family: var(--rh-body);
  box-shadow: 5px 5px 0 var(--rh-hot);
}
.rh-edict__kind {
  display: inline-block;
  padding: 0.12rem 0.55rem;
  border-radius: 999px;
  background: var(--rh-ink);
  color: var(--rh-gold-soft);
  font-family: var(--rh-display);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rh-edict__title {
  margin-top: 0.3rem;
  font-family: var(--rh-display);
  font-size: clamp(1.05rem, 2.6cqi, 1.7rem);
  font-weight: 900;
  line-height: 1.1;
  text-shadow: var(--rh-echo);
}
.rh-edict__cut {
  float: right;
  width: clamp(5rem, 30%, 12rem);
  aspect-ratio: 7 / 4;
  margin: 0.3rem 0 0.4rem 0.8rem;
  border: 3px solid var(--rh-ink);
  border-radius: 0.5rem;
  box-shadow: 4px 4px 0 var(--rh-gold);
}
.rh-edict__body {
  margin-top: 0.45rem;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.4;
}
.rh-edict__sign {
  clear: both;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--rh-plum);
  text-align: right;
}
.rh-court-hand {
  flex: 0 0 auto;
}
.rh-court-hand :deep(.krh-question) {
  color: var(--rh-gold-soft);
  text-shadow:
    0 0 4px var(--rh-plum-deep),
    0 1px 2px var(--rh-plum-deep);
}
.rh-choice-art {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--rh-parch);
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
  border-top: 3px solid var(--rh-ink);
  background: var(--rh-parch);
  color: var(--rh-ink);
}
.rh-ledger__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 800;
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
  color: var(--rh-green-ink);
}
.rh-ledger__row[data-sign='down'] .rh-ledger__value {
  color: var(--rh-pink-ink);
}
.rh-ledger__none {
  display: block;
  font-style: italic;
  font-weight: 700;
}
@container rhconsole (max-width: 899px) {
  .rh-edict__cut {
    display: none;
  }
  .rh-edict {
    padding: 0.85rem 0.8rem 0.8rem;
  }
  .rh-edict__body {
    font-size: 0.85rem;
  }
  .rh-petition-court {
    --hand-card-cqw: 33cqw;
  }
}
</style>
