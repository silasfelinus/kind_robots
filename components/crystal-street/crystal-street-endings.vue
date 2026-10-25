<template>
  <section
    class="kr-panes grid-cols-1 grid-rows-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-3 @3xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] @3xl:grid-rows-1"
    aria-label="Endings"
  >
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-xl">Endings</h2>
        <span class="cs-pill cs-pill-good ml-auto"
          >{{ villainEndings(store.scrapbook.endings).length }}/{{
            VILLAINS.length * 4
          }}</span
        >
      </div>
      <div class="kr-pane-scroll p-3">
        <button
          type="button"
          class="btn btn-sm mb-3 w-full rounded-2xl"
          :class="wall ? 'btn-primary' : 'btn-outline'"
          :aria-pressed="wall"
          data-testid="cs-endings-wall-toggle"
          @click="wall = !wall"
        >
          {{ wall ? 'Back to one nightmare' : 'See every ending at once' }}
        </button>
        <crystal-street-villain-list
          v-model="selected"
          label="Choose a nightmare"
          @update:model-value="wall = false"
        />
        <h3 class="cs-kicker mb-1 mt-4">Special endings</h3>
        <ul
          class="grid grid-cols-2 gap-2"
          aria-label="Special endings"
          data-testid="cs-special-endings"
        >
          <li
            v-for="special in SPECIALS"
            :key="special"
            class="cs-card p-2 text-xs"
            :class="foundSpecial(special) ? '' : 'opacity-60'"
          >
            <p class="font-semibold">
              {{
                foundSpecial(special) ? SPECIAL_ENDINGS[special].title : '???'
              }}
            </p>
            <p class="opacity-75">{{ SPECIAL_HOW[special] }}</p>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="wall" class="kr-pane cs-frame" data-testid="cs-endings-wall">
      <div class="kr-toolbar px-3 pt-3">
        <h3 class="cs-display text-lg">Every ending</h3>
        <span class="ml-auto text-xs opacity-75"
          >{{ villainEndings(store.scrapbook.endings).length }}/{{
            VILLAINS.length * ENDING_TIERS.length
          }}
          found</span
        >
      </div>
      <div class="kr-pane-scroll p-3">
        <ul
          class="mx-auto max-w-xl space-y-1"
          aria-label="Every nightmare's four endings"
        >
          <li
            v-for="v in VILLAINS"
            :key="v.id"
            class="grid grid-cols-[minmax(0,7rem)_repeat(4,minmax(0,1fr))] items-center gap-1.5"
          >
            <button
              type="button"
              class="truncate text-left text-xs font-semibold"
              :class="store.metVillains.has(v.id) ? '' : 'opacity-50'"
              @click="openVillain(v.id)"
            >
              {{ store.metVillains.has(v.id) ? v.name : '???' }}
            </button>
            <button
              v-for="tier in ENDING_TIERS"
              :key="tier"
              type="button"
              class="cs-card block w-full overflow-hidden text-left"
              :aria-label="
                isFound(v.id, tier)
                  ? `${v.name}: ${v.endings[tier].title}`
                  : `${store.metVillains.has(v.id) ? v.name : 'Unknown nightmare'}: ${TIER_LABELS[tier]} not found`
              "
              @click="openVillain(v.id)"
            >
              <crystal-street-art
                v-if="isFound(v.id, tier)"
                frame="aspect-[16/9]"
                kind="ending"
                :seed="`${v.id}:${tier}`"
                :src="`/crystal-street/endings/${v.id}-${tier}.webp`"
                :palette="v.palette"
                :sigil="v.sigil"
                :alt="v.endings[tier].art"
              />
              <span
                v-else
                class="flex aspect-[16/9] items-center justify-center bg-base-300 text-sm font-black opacity-40"
                aria-hidden="true"
                >?</span
              >
              <span
                class="block truncate px-1 text-[9px] uppercase tracking-wider"
                >{{ TIER_LABELS[tier] }}</span
              >
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="kr-pane cs-frame" data-testid="cs-endings-reel">
      <div class="kr-toolbar px-3 pt-3">
        <h3 class="cs-display truncate text-lg">
          {{ met && villain ? villain.name : '???' }}
        </h3>
        <span class="ml-auto text-xs opacity-75">{{ foundCount }}/4 found</span>
      </div>
      <div class="kr-pane-scroll space-y-3 p-3">
        <figure
          v-if="villain && met"
          class="cs-polaroid mx-auto w-full max-w-56"
          data-testid="cs-ending-photo"
        >
          <crystal-street-art
            frame="aspect-[3/4]"
            kind="ending"
            :seed="`${villain.id}:photo`"
            :src="`/crystal-street/villains/${villain.id}-ending.webp`"
            :palette="villain.palette"
            :sigil="villain.sigil"
            :alt="villain.endingPhoto"
          />
          <figcaption class="mt-1 text-center text-xs font-semibold">
            {{ villain.name }}, the last photo
          </figcaption>
        </figure>
        <ul
          v-if="villain && met"
          class="grid grid-cols-1 gap-3 @xl:grid-cols-2"
        >
          <li
            v-for="tier in foundTiers"
            :key="tier"
            class="cs-card overflow-hidden"
          >
            <crystal-street-art
              frame="aspect-[16/9]"
              kind="ending"
              :seed="`${villain.id}:${tier}`"
              :src="`/crystal-street/endings/${villain.id}-${tier}.webp`"
              :palette="villain.palette"
              :sigil="villain.sigil"
              :alt="villain.endings[tier].art"
            >
              <span
                class="cs-stamp absolute left-2 top-2"
                :class="`cs-stamp-${tier}`"
                >{{ TIER_LABELS[tier] }}</span
              >
            </crystal-street-art>
            <div class="space-y-1 p-3">
              <p class="font-semibold leading-tight">
                {{ villain.endings[tier].title }}
              </p>
              <p class="text-sm leading-relaxed">
                {{ villain.endings[tier].text }}
              </p>
            </div>
          </li>
        </ul>
        <p
          v-if="villain && met && foundTiers.length < ENDING_TIERS.length"
          class="text-xs opacity-75"
        >
          Still to find:
          {{
            ENDING_TIERS.filter((t) => !found(t))
              .map((t) => TIER_LABELS[t])
              .join(', ')
          }}.
        </p>
        <p v-if="!met" class="text-sm opacity-80">
          Finish a week and its ending is pasted in here.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  ENDING_TIERS,
  TIER_LABELS,
  VILLAINS,
  SPECIAL_ENDINGS,
  endingKey,
  specialKey,
  villainById,
  villainEndings,
} from '~/utils/crystalStreet/rules'
import type { EndingTier, SpecialEnding } from '~/utils/crystalStreet/types'

const props = defineProps<{ initial?: string }>()

const store = useCrystalStreetStore()
const selected = ref(
  props.initial ??
    VILLAINS.find((v) => store.metVillains.has(v.id))?.id ??
    VILLAINS[0]!.id,
)
const villain = computed(() => villainById(selected.value))
const met = computed(() => store.metVillains.has(selected.value))
const found = (tier: EndingTier) =>
  store.scrapbook.endings.includes(endingKey(selected.value, tier))
const foundTiers = computed(() => ENDING_TIERS.filter(found))
// The wall: every nightmare's four endings at once, found ones illustrated.
const wall = ref(false)
const isFound = (id: string, tier: EndingTier) =>
  store.scrapbook.endings.includes(endingKey(id, tier))
function openVillain(id: string): void {
  selected.value = id
  wall.value = false
}
const foundCount = computed(() => foundTiers.value.length)

const SPECIALS: SpecialEnding[] = [
  'final-girl',
  'family',
  'officials',
  'neighbors',
]
const SPECIAL_HOW: Record<SpecialEnding, string> = {
  'final-girl': 'Win Halloween alone after your friends fall away.',
  family: 'Let your family run out of patience.',
  officials: 'Let the sheriff and the school run out of patience.',
  neighbors: 'Let the cul-de-sac run out of patience.',
}
const foundSpecial = (special: SpecialEnding) =>
  store.scrapbook.endings.includes(specialKey(special))
</script>
