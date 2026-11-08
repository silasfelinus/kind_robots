<!-- components/ruler-hooked/ruler-hooked-court.vue
     The petition before the throne (t-054): the matter, its painting and the
     petitioner on one rainbow edict panel whose text is always shown in full
     (never in an inner scroll box), and the choices as a hand of cards beside
     it. Each card paints the
     corner of the kingdom that choice would change most, as it would leave it,
     with its signed meter changes, computed by the real effects reducer before
     you commit. The court screen supplies the presenter and the backdrop. -->
<template>
  <div v-if="store.activeCard" class="rh-petition-court">
    <article class="rh-edict" data-testid="rh-edict">
      <RulerHookedArt
        class="rh-edict__art"
        :candidates="cardArt"
        :alt="store.activeCard.title"
        :initial="store.activeCard.title.charAt(0)"
        position="center 30%"
      />
      <div class="rh-edict__copy">
        <p class="rh-edict__kind">{{ edictKind }}</p>
        <h2 class="rh-edict__title">{{ store.activeCard.title }}</h2>
        <p v-if="store.activeCard.body" class="rh-edict__body">
          {{ store.activeCard.body }}
        </p>
        <p v-if="by" class="rh-edict__sign">
          <RulerHookedArt
            v-if="presenter"
            class="rh-edict__avatar"
            :candidates="characterCandidates(presenter)"
            :initial="by.charAt(0)"
            position="center 20%"
          />
          <span
            >Presented by <strong>{{ by }}</strong></span
          >
        </p>
      </div>
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
  characterCandidates,
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
  min-height: 100%;
  --hand-accent: var(--rh-gold-soft);
  --hand-accent-2: var(--rh-gold);
  --hand-band: var(--rh-plum-deep);
  --hand-band-ink: #fff;
  --hand-card-max: 13.5rem;
  --hand-card-vh: 22cqh;
  --hand-card-cqw: 30cqw;
  --hand-focus-scale: 1.08;
}
.rh-edict {
  position: relative;
  display: flex;
  flex: none;
  flex-direction: column;
  min-width: 0;
  overflow: clip;
  border: 2px solid var(--rh-gold);
  border-radius: 1.15rem;
  background:
    var(--rh-spectrum) top / 100% 6px no-repeat,
    linear-gradient(155deg, rgb(33 26 103 / 0.95), rgb(8 13 53 / 0.95));
  color: #f4faff;
  font-family: var(--rh-body);
  box-shadow:
    0 0 0 3px var(--rh-plum),
    6px 6px 0 3px var(--rh-hot),
    0 14px 35px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(8px);
  rotate: var(--rh-warp);
}
.rh-edict__art {
  display: none;
}
.rh-edict__copy {
  display: grid;
  gap: 0.35rem;
  justify-items: start;
  padding: 1rem 1rem 0.85rem;
}
.rh-edict__kind {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--rh-spectrum);
  color: var(--rh-ink);
  font-family: var(--rh-display);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 0 0 2px var(--rh-ink);
}
.rh-edict__title {
  color: var(--rh-gold-soft);
  font-family: var(--rh-display);
  font-size: clamp(1.15rem, 2.6cqi, 1.75rem);
  font-weight: 900;
  line-height: 1.1;
  text-shadow:
    2px 2px 0 var(--rh-hot),
    var(--rh-echo);
}
.rh-edict__body {
  font-size: clamp(0.9rem, 1.5cqi, 1.05rem);
  font-weight: 600;
  line-height: 1.45;
}
.rh-edict__sign {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-self: end;
  color: var(--rh-gold);
  font-size: 0.85rem;
  font-weight: 700;
}
.rh-edict__sign strong {
  color: #fff;
}
.rh-edict__avatar {
  flex: none;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  box-shadow:
    0 0 0 2px var(--rh-ink),
    0 0 0 4px var(--rh-gold-soft);
}
.rh-court-hand {
  flex: none;
  min-width: 0;
}
.rh-court-hand :deep(.krh-question) {
  justify-self: start;
  width: fit-content;
  padding: 0.15rem 0.7rem;
  border-radius: 999px;
  background: var(--rh-plum-deep);
  color: var(--rh-gold-soft);
  font-family: var(--rh-display);
  font-size: 0.8rem;
  font-weight: 900;
  box-shadow:
    0 0 0 2px var(--rh-gold),
    3px 3px 0 2px var(--rh-hot);
}
.rh-choice-art {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--rh-plum-deep);
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
  padding: 0.4rem 0.6rem 1.45rem 0.45rem;
  background:
    var(--rh-spectrum) top / 100% 4px no-repeat,
    linear-gradient(160deg, rgb(33 26 103), var(--rh-plum-deep));
  color: #f4faff;
}
.rh-ledger__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
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
  padding-right: 0.1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 900;
}
.rh-ledger__row[data-sign='up'] .rh-ledger__value {
  color: var(--rh-green);
}
.rh-ledger__row[data-sign='down'] .rh-ledger__value {
  color: #ff7ad1;
}
.rh-ledger__none {
  display: block;
  font-style: italic;
  font-weight: 700;
}
@container rhconsole (min-width: 900px) {
  .rh-petition-court {
    display: grid;
    grid-template-columns: minmax(15rem, 32%) minmax(0, 1fr);
    grid-template-rows: 1fr;
    align-items: end;
    gap: clamp(0.9rem, 2cqi, 1.6rem);
    --hand-card-vh: calc((100cqh - 5rem) / 1.65);
  }
  .rh-edict {
    align-self: stretch;
  }
  .rh-edict__art {
    display: block;
    flex: 1 1 auto;
    min-height: 0;
    border-bottom: 3px solid var(--rh-ink);
    box-shadow: 0 3px 0 var(--rh-gold);
  }
  .rh-edict__copy {
    flex: none;
  }
  .rh-court-hand {
    align-self: center;
  }
}
@container rhcourt (max-width: 899px) and (min-height: 600px) {
  .rh-edict__art {
    display: block;
    height: clamp(6rem, 22cqh, 15rem);
    border-bottom: 3px solid var(--rh-ink);
    box-shadow: 0 3px 0 var(--rh-gold);
  }
}
@container rhconsole (max-width: 559px) {
  .rh-ledger__row {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .rh-ledger__label {
    display: none;
  }
  .rh-ledger__value {
    justify-self: end;
  }
}
@container rhconsole (max-width: 899px) {
  .rh-edict__copy {
    padding: 0.85rem 0.8rem 0.7rem;
  }
  .rh-edict__body {
    font-size: 0.88rem;
  }
  .rh-petition-court {
    --hand-card-cqw: 33cqw;
  }
}
</style>
