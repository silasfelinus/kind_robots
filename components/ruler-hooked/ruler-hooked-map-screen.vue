<!-- The Royal Atlas: a parchment sheet of painted postcards, one per corner of
     the kingdom, each painted in that region's CURRENT state. Your decrees
     repaint the atlas; the lake is where you fish. A painted kingdom map is
     queued (backdrops/royal-map); until then the sheet is the map. -->
<template>
  <section class="rh-screen rh-map" aria-label="Royal Atlas">
    <RulerHookedArt
      class="rh-backdrop rh-map__backdrop"
      :candidates="BACKDROPS.map"
      eager
    />
    <div class="rh-map__sheet rh-parchment">
      <header class="rh-map__head">
        <p class="rh-eyebrow">Royal cartography</p>
        <h2 class="rh-title rh-title--big">The Kingdom Atlas</h2>
        <p class="rh-map__lede">
          Every corner is painted as it stands today. Your decrees repaint them.
        </p>
      </header>
      <ul class="rh-map__grid">
        <li
          v-for="(place, i) in places"
          :key="place.region"
          :style="{ '--tilt': `${TILTS[i % TILTS.length]}deg` }"
        >
          <component
            :is="place.region === 'lake' ? 'button' : 'div'"
            class="rh-postcard"
            :class="{ 'is-open': place.region === 'lake' }"
            :type="place.region === 'lake' ? 'button' : undefined"
            @click="place.region === 'lake' && emit('navigate', 'lake')"
          >
            <RulerHookedArt
              class="rh-postcard__art"
              :candidates="place.art"
              :alt="place.name"
            />
            <span class="rh-postcard__copy">
              <strong>{{ place.name }}</strong>
              <span class="rh-postcard__state">{{ place.stateLabel }}</span>
              <span class="rh-postcard__blurb">{{ place.blurb }}</span>
              <span v-if="place.axis" class="rh-postcard__axis">
                <RulerHookedGlyph :name="place.axis" />{{ place.axisLabel }}
                {{ place.axisValue }}%
              </span>
              <span
                v-if="place.region === 'lake'"
                class="rh-btn rh-btn--gold rh-postcard__go"
                >Fish here</span
              >
            </span>
          </component>
        </li>
        <li :style="{ '--tilt': '1.5deg' }">
          <div class="rh-postcard is-locked">
            <span
              class="rh-postcard__art rh-postcard__fog"
              aria-hidden="true"
            />
            <span class="rh-postcard__copy">
              <strong>The Outer Waterways</strong>
              <span class="rh-postcard__state">Uncharted</span>
              <span class="rh-postcard__blurb"
                >Falls, flats and a river that runs uphill on Tuesdays. Quill is
                drawing the map.</span
              >
            </span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { BACKDROPS, vistaCandidates } from '~/utils/rulerHooked/artLibrary'
import type { AxisKey, RegionKey } from '~/types/ruler-hooked'
import type { ConsoleScreen } from '~/utils/rulerHooked/tutorial'

const emit = defineEmits<{ navigate: [screen: ConsoleScreen] }>()
const store = useRulerHookedStore()

const TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.4]

const PLACES: {
  region: RegionKey
  name: string
  axis?: AxisKey
  states: Record<string, [label: string, blurb: string]>
}[] = [
  {
    region: 'lake',
    name: 'Castle Lake',
    states: {
      clear: [
        'Your fishing grounds',
        'Clear, cold and stubbornly full of opinions with fins.',
      ],
    },
  },
  {
    region: 'far_shore',
    name: 'The Far Shore',
    axis: 'nature',
    states: {
      pristine: ['Pristine', 'Reeds, herons and nobody in a hurry.'],
      farmed: [
        'Farmed',
        'Neat fields to the waterline. The herons are negotiating.',
      ],
      industrial: [
        'Industrial',
        'Chimneys where the reeds were. The fish have noticed.',
      ],
    },
  },
  {
    region: 'treeline',
    name: 'The Wildwood',
    axis: 'nature',
    states: {
      wild: ['Wild', 'Old trees, older moss, druids who know your name.'],
      tended: ['Tended', 'Paths and pruning. The wood allows it.'],
      logged: ['Logged', 'Stumps and sawdust. The druids are writing letters.'],
      overbuilt: [
        'Overbuilt',
        'Towers where the forest stood. Vex is delighted.',
      ],
    },
  },
  {
    region: 'village_edge',
    name: 'Willowbrook Village',
    axis: 'prosperity',
    states: {
      hamlet: ['Hamlet', 'Six cottages, one inn, everyone related.'],
      township: [
        'Township',
        'A market square and a surprising number of bakeries.',
      ],
      boomtown: [
        'Boomtown',
        'Scaffolding everywhere. Nobody remembers the old inn.',
      ],
    },
  },
  {
    region: 'castle_grounds',
    name: 'Castle Grounds',
    axis: 'treasury',
    states: {
      humble: ['Humble', 'Patched banners and a very loyal goat.'],
      flourishing: [
        'Flourishing',
        'Gardens, fountains, freshly painted crenellations.',
      ],
      gaudy: ['Gaudy', 'Gold leaf on the gold leaf.'],
    },
  },
]
const AXIS_LABEL: Record<AxisKey, string> = {
  nature: 'Nature',
  prosperity: 'Prosperity',
  treasury: 'Treasury',
  joy: 'Joy',
  order: 'Order',
}

const places = computed(() =>
  PLACES.map((p) => {
    const state =
      store.save?.regionStates?.[p.region] ?? Object.keys(p.states)[0]!
    const [stateLabel, blurb] = p.states[state] ?? Object.values(p.states)[0]!
    return {
      ...p,
      stateLabel,
      blurb,
      art:
        p.region === 'lake'
          ? vistaCandidates('lake', 'clear', store.timeOfDay)
          : vistaCandidates(p.region, state, store.timeOfDay),
      axisLabel: p.axis ? AXIS_LABEL[p.axis] : '',
      axisValue: p.axis
        ? Math.round(store.save?.kingdomHealth[p.axis] ?? 0)
        : 0,
    }
  }),
)
</script>

<style scoped>
.rh-map__backdrop {
  filter: blur(2px) brightness(0.6) saturate(0.8);
}
.rh-map__sheet {
  position: absolute;
  z-index: 2;
  inset: clamp(4.25rem, 11cqi, 5.5rem) clamp(0.5rem, 2.5cqi, 2rem)
    clamp(0.5rem, 2cqi, 1.25rem);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  overflow-y: auto;
  scrollbar-width: thin;
}
.rh-map__head {
  text-align: center;
}
.rh-map__lede {
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.8;
}
.rh-map__grid {
  display: grid;
  gap: clamp(0.6rem, 2cqi, 1.25rem);
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
  padding: 0.35rem 0.25rem 0.5rem;
}
.rh-map__grid > li {
  transform: rotate(var(--tilt));
}
.rh-postcard {
  display: grid;
  width: 100%;
  height: 100%;
  text-align: left;
  background: #fffaf0;
  padding: 0.45rem 0.45rem 0.6rem;
  border-radius: 0.3rem;
  box-shadow:
    0 1px 0 rgb(58 38 22 / 0.2),
    0 8px 16px rgb(58 38 22 / 0.3);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}
.rh-postcard.is-open {
  cursor: pointer;
  outline: 3px solid var(--rh-gold);
}
.rh-postcard.is-open:hover,
.rh-postcard.is-open:focus-visible {
  transform: translateY(-3px) rotate(calc(var(--tilt) * -1));
  box-shadow:
    0 0 0 3px #ffd977,
    0 14px 24px rgb(58 38 22 / 0.4);
}
.rh-postcard__art {
  aspect-ratio: 7 / 4;
  border-radius: 0.2rem;
}
.rh-postcard__fog {
  display: block;
  background:
    radial-gradient(circle at 30% 40%, rgb(255 255 255 / 0.5), transparent 40%),
    radial-gradient(
      circle at 70% 60%,
      rgb(255 255 255 / 0.35),
      transparent 45%
    ),
    linear-gradient(160deg, #9fb3bf, #6d7f8a);
}
.rh-postcard__copy {
  display: grid;
  gap: 0.15rem;
  padding: 0.45rem 0.2rem 0;
  color: var(--rh-ink);
}
.rh-postcard__copy strong {
  font-family: var(--rh-display);
  font-size: 1.05rem;
}
.rh-postcard__state {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rh-plum);
}
.rh-postcard__blurb {
  font-size: 0.82rem;
  line-height: 1.35;
}
.rh-postcard__axis {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  opacity: 0.85;
}
.rh-postcard__go {
  justify-self: start;
  margin-top: 0.35rem;
}
.rh-postcard.is-locked {
  filter: grayscale(0.5);
  opacity: 0.85;
}
.rh-map__sheet {
  left: var(--rh-sheet-left, clamp(0.5rem, 2.5cqi, 2rem));
}
</style>
