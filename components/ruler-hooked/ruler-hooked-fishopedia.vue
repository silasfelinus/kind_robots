<!-- The Fishopedia: one big painted specimen plate, and a carousel of every
     species below it. Undiscovered fish show as ink silhouettes with only
     their rarity revealed. -->
<template>
  <section class="rh-screen rh-pedia" aria-label="Fishopedia">
    <RulerHookedArt
      class="rh-backdrop rh-pedia__backdrop"
      :candidates="BACKDROPS.fishopedia"
      eager
    />

    <div class="rh-pedia__body">
      <article v-if="selected" class="rh-pedia__plate">
        <RulerHookedArt
          class="rh-pedia__art"
          :class="{ 'is-unknown': !selectedEntry }"
          :candidates="fishCandidates(selected.slug)"
          :alt="selectedEntry ? selected.name : 'An undiscovered fish'"
          eager
        />
        <div class="rh-parchment rh-pedia__card">
          <h2 class="rh-title rh-title--big">
            {{ selectedEntry ? selected.name : 'Not yet caught' }}
          </h2>
          <p class="rh-pedia__tags">
            <span
              :class="`rh-rarity rh-rarity--${selected.rarity.toLowerCase()}`"
              >{{ titleCase(selected.rarity) }}</span
            >
            <span v-if="selectedEntry" class="rh-pedia__tag">{{
              AFFINITY[selected.affinity]
            }}</span>
            <span class="rh-pedia__tag">{{
              habitatLabel(selected.habitats)
            }}</span>
          </p>
          <p class="rh-pedia__note">
            {{ selectedEntry ? selected.fishopediaNote : selected.silhouette }}
          </p>
          <dl v-if="selectedEntry" class="rh-pedia__stats">
            <div>
              <dt>Best size</dt>
              <dd>{{ formatSize(selectedEntry.bestSizeCm) }}</dd>
            </div>
            <div>
              <dt>Caught</dt>
              <dd>{{ selectedEntry.countCaught }}×</dd>
            </div>
            <div>
              <dt>First landed</dt>
              <dd>
                Day {{ Math.floor(selectedEntry.firstCaughtTurn / 5) + 1 }}
              </dd>
            </div>
          </dl>
          <p v-else class="rh-pedia__hint">{{ selected.catchBehavior }}</p>
        </div>
      </article>

      <div class="rh-pedia__shelf">
        <div class="rh-pedia__shelfhead">
          <span class="rh-plaque-flat"
            >Collection {{ discovered }} / {{ roster.length }}</span
          >
          <div
            class="rh-pedia__filters"
            role="tablist"
            aria-label="Filter by rarity"
          >
            <button
              v-for="f in FILTERS"
              :key="f.id"
              type="button"
              role="tab"
              :aria-selected="filter === f.id"
              :class="{ 'is-on': filter === f.id }"
              @click="filter = f.id"
            >
              {{ f.label }}
            </button>
          </div>
        </div>
        <ul class="rh-pedia__strip">
          <li v-for="fish in shown" :key="fish.slug">
            <button
              type="button"
              class="rh-specimen"
              :class="{
                'is-on': selectedSlug === fish.slug,
                'is-unknown': !save.fishopedia[fish.slug],
              }"
              :aria-label="
                save.fishopedia[fish.slug]
                  ? fish.name
                  : `Undiscovered ${titleCase(fish.rarity)} fish`
              "
              @click="selectedSlug = fish.slug"
            >
              <RulerHookedArt
                class="rh-specimen__art"
                :candidates="fishCandidates(fish.slug)"
              />
              <span class="rh-specimen__name">{{
                save.fishopedia[fish.slug] ? fish.name : '? ? ?'
              }}</span>
              <span
                class="rh-specimen__gem"
                :class="`rh-rarity--${fish.rarity.toLowerCase()}`"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  FishAffinity,
  Rarity,
  RegionKey,
  RunSave,
} from '~/types/ruler-hooked'
import { RULER_HOOKED_FISH } from '~/utils/rulerHooked/fish'
import { BACKDROPS, fishCandidates } from '~/utils/rulerHooked/artLibrary'

const props = defineProps<{ save: RunSave }>()
const roster = RULER_HOOKED_FISH

const RARITY_ORDER: Rarity[] = [
  'MYTHIC',
  'LEGENDARY',
  'EPIC',
  'RARE',
  'UNCOMMON',
  'COMMON',
]
const FILTERS: { id: 'ALL' | 'CAUGHT' | 'RARE+'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'CAUGHT', label: 'Caught' },
  { id: 'RARE+', label: 'Rare & up' },
]
const AFFINITY: Record<FishAffinity, string> = {
  GOOD: 'Kindly',
  NEUTRAL: 'Neutral',
  EVIL: 'Wicked',
}

const filter = ref<'ALL' | 'CAUGHT' | 'RARE+'>('ALL')
const sorted = computed(() =>
  [...roster].sort((a, b) => {
    const caught =
      Number(!!props.save.fishopedia[b.slug]) -
      Number(!!props.save.fishopedia[a.slug])
    return (
      caught || RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
    )
  }),
)
const shown = computed(() =>
  sorted.value.filter((f) =>
    filter.value === 'CAUGHT'
      ? !!props.save.fishopedia[f.slug]
      : filter.value === 'RARE+'
        ? RARITY_ORDER.indexOf(f.rarity) <= RARITY_ORDER.indexOf('RARE')
        : true,
  ),
)
const discovered = computed(() => Object.keys(props.save.fishopedia).length)

const selectedSlug = ref<string>(
  Object.values(props.save.fishopedia).sort(
    (a, b) => b.firstCaughtTurn - a.firstCaughtTurn,
  )[0]?.fishSlug ??
    roster[0]?.slug ??
    '',
)
const selected = computed(
  () => roster.find((f) => f.slug === selectedSlug.value) ?? roster[0],
)
const selectedEntry = computed(() =>
  selected.value ? props.save.fishopedia[selected.value.slug] : undefined,
)

const HABITAT: Partial<Record<RegionKey, string>> = {
  lake: 'Open lake',
  near_bank: 'Near bank',
  far_shore: 'Far shore',
  treeline: 'Wood-shade',
  village_edge: 'Village shallows',
  castle_grounds: 'Castle moat',
  sky: 'Sky?!',
}
function habitatLabel(h: RegionKey[]) {
  return h
    .map((x) => HABITAT[x] ?? x)
    .slice(0, 2)
    .join(' · ')
}
function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}
function formatSize(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(cm >= 1000 ? 1 : 2)} m`
  return `${cm.toFixed(1)} cm`
}
</script>

<style scoped>
.rh-pedia__backdrop {
  filter: brightness(0.5) saturate(0.9);
}
.rh-pedia__body {
  position: absolute;
  z-index: 2;
  inset: clamp(4.25rem, 11cqi, 5.5rem) clamp(0.5rem, 2.5cqi, 2rem)
    clamp(0.5rem, 2cqi, 1rem);
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 0.6rem;
}
.rh-pedia__body > *,
.rh-pedia__plate > * {
  min-width: 0;
}
.rh-pedia__plate {
  display: grid;
  min-height: 0;
  gap: 0.6rem;
  grid-template-rows: minmax(8rem, 1fr) auto;
}
@container rhconsole (min-width: 760px) {
  .rh-pedia__plate {
    grid-template-rows: none;
    grid-template-columns: 1.35fr 1fr;
    align-items: stretch;
  }
}
.rh-pedia__art {
  border-radius: 1.2rem;
  border: 2px solid var(--rh-gold);
  box-shadow:
    0 0 0 4px rgb(59 21 48 / 0.7),
    0 12px 28px rgb(0 0 0 / 0.5);
  min-height: 0;
}
.rh-pedia__art.is-unknown :deep(img),
.rh-specimen.is-unknown :deep(img) {
  /* A shape glimpsed under the water: the paintings have no alpha, so a
     true silhouette is impossible -- blur and sink the colour instead. */
  filter: blur(14px) brightness(0.45) saturate(0.35) hue-rotate(160deg);
  transform: scale(1.15);
}
.rh-pedia__art.is-unknown::after,
.rh-specimen.is-unknown .rh-specimen__art::after {
  content: '?';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgb(255 243 214 / 0.75);
  font-family: var(--rh-display);
  font-size: clamp(1.5rem, 8cqi, 5rem);
  font-weight: 800;
  text-shadow: 0 2px 8px rgb(0 0 0 / 0.6);
}
.rh-pedia__card {
  display: grid;
  align-content: start;
  gap: 0.45rem;
  overflow-y: auto;
  min-height: 0;
}
.rh-pedia__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.78rem;
}
.rh-pedia__tag {
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgb(58 38 22 / 0.3);
}
.rh-pedia__note {
  font-style: italic;
  line-height: 1.45;
}
.rh-pedia__hint {
  font-size: 0.85rem;
  opacity: 0.8;
}
.rh-pedia__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
}
.rh-pedia__stats div {
  padding: 0.35rem 0.5rem;
  border-radius: 0.6rem;
  background: rgb(255 255 255 / 0.5);
  border: 1px solid rgb(58 38 22 / 0.2);
  text-align: center;
}
.rh-pedia__stats dt {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.7;
}
.rh-pedia__stats dd {
  font-family: var(--rh-display);
  font-weight: 700;
}
.rh-pedia__shelf {
  padding: 0.5rem;
  border-radius: 1rem;
  background: linear-gradient(
    180deg,
    rgb(59 21 48 / 0.92),
    rgb(37 11 31 / 0.95)
  );
  border: 1.5px solid var(--rh-gold);
}
.rh-pedia__shelfhead {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.45rem;
}
.rh-plaque-flat {
  font-family: var(--rh-display);
  font-weight: 700;
  color: var(--rh-gold-soft);
}
.rh-pedia__filters {
  display: flex;
  gap: 0.25rem;
}
.rh-pedia__filters button {
  min-height: 2.25rem;
  padding: 0.15rem 0.75rem;
  border-radius: 999px;
  color: #fbeed3;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgb(217 164 65 / 0.45);
}
.rh-pedia__filters button.is-on {
  background: var(--rh-gold);
  color: var(--rh-plum-deep);
}
.rh-pedia__strip {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
}
.rh-pedia__strip li {
  scroll-snap-align: start;
  flex: 0 0 clamp(6.5rem, 15cqi, 9rem);
}
.rh-specimen {
  position: relative;
  display: grid;
  width: 100%;
  border-radius: 0.7rem;
  overflow: hidden;
  border: 1.5px solid rgb(217 164 65 / 0.5);
  background: #1c3444;
  cursor: pointer;
}
.rh-specimen.is-on {
  border-color: #ffd977;
  box-shadow:
    0 0 0 2px #ffd977,
    0 0 14px rgb(255 217 119 / 0.5);
}
.rh-specimen__art {
  aspect-ratio: 4 / 3;
}
.rh-specimen__name {
  padding: 0.2rem 0.3rem 0.3rem;
  background: var(--rh-parch);
  color: var(--rh-ink);
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rh-specimen__gem {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  width: 0.8rem;
  height: 0.8rem;
  rotate: 45deg;
  border: 1.5px solid #fff3d6;
  background: var(--rh-gem, #c8b48a);
}
.rh-pedia__body {
  left: var(--rh-sheet-left, clamp(0.5rem, 2.5cqi, 2rem));
}
</style>
