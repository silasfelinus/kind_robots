<template>
  <section
    class="kr-panes grid-cols-1 grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 @3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] @3xl:grid-rows-1"
    aria-label="Start a week on Crystal Street"
  >
    <div class="cs-frame relative min-h-0 overflow-hidden bg-black">
      <img
        src="/crystal-street/cover.webp"
        alt="A towering masked woman with a machete pulls on a cracked hockey mask beside a moonlit lake while skinny-dippers run into the water"
        class="absolute inset-0 h-full w-full object-cover object-[50%_18%]"
      />
      <div
        class="cs-cover-title absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-4 pb-10 pt-3 text-right"
      >
        <p class="cs-kicker text-xs tracking-[0.3em]">
          It came from the Terrors on
        </p>
        <h2 class="cs-display text-4xl leading-none @3xl:text-6xl">
          Crystal Street
        </h2>
        <p class="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/80">
          One week · seven nights · {{ VILLAINS.length }} nightmares
        </p>
      </div>
      <div
        class="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 text-white"
      >
        <p class="mr-auto max-w-md text-sm">
          Glimmer Falls, California. Halloween week, 1986. Something under
          Crystal Street is waking up, and it has a different face every year.
        </p>
        <button
          v-if="inProgress"
          type="button"
          class="btn btn-sm btn-secondary rounded-2xl"
          data-testid="cs-continue-week"
          @click="$emit('resume')"
        >
          Continue {{ store.run?.name }}'s week
        </button>
        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-2xl text-white"
          @click="$emit('scrapbook')"
        >
          Scrapbook · {{ store.bestFound }}/{{ VILLAINS.length }} best
        </button>
      </div>
    </div>

    <form class="kr-pane cs-frame" @submit.prevent="begin">
      <div class="kr-pane-scroll space-y-4 p-3">
        <h2 class="cs-display text-2xl">New week</h2>
        <div class="grid grid-cols-1 gap-3 @lg:grid-cols-2">
          <label class="form-control">
            <span class="cs-kicker mb-1">Your name</span>
            <input
              v-model="name"
              class="input input-bordered input-sm rounded-2xl"
              maxlength="24"
              autocomplete="off"
              placeholder="Alex"
            />
          </label>
          <div>
            <span class="cs-kicker mb-1 block">Pronouns</span>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="p in PRONOUNS"
                :key="p"
                type="button"
                class="btn btn-xs rounded-2xl"
                :class="
                  !customPronouns && pronouns === p
                    ? 'btn-primary'
                    : 'btn-ghost border-base-content/20'
                "
                @click="pickPronouns(p)"
              >
                {{ p }}
              </button>
              <input
                v-model="customPronouns"
                class="input input-bordered input-xs w-24 rounded-2xl"
                maxlength="16"
                placeholder="other"
                aria-label="Other pronouns"
              />
            </div>
          </div>
        </div>

        <fieldset>
          <legend class="cs-kicker mb-1">Who are you this week?</legend>
          <div class="grid grid-cols-2 gap-2 @xl:grid-cols-3">
            <button
              v-for="a in ARCHETYPES"
              :key="a.id"
              type="button"
              class="cs-choice text-left"
              :class="archetype === a.id ? 'ring-2 ring-primary' : ''"
              :aria-pressed="archetype === a.id"
              @click="archetype = a.id"
            >
              <span class="block font-semibold">{{ a.name }}</span>
              <span class="block text-[11px] leading-snug opacity-75">{{
                a.text
              }}</span>
              <span
                class="mt-1 block text-[10px] uppercase tracking-wider opacity-70"
                >{{ topSkills(a.skills) }}</span
              >
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="cs-kicker mb-1">The nightmare</legend>
          <div class="flex flex-wrap gap-1">
            <button
              type="button"
              class="btn btn-xs rounded-2xl"
              :class="
                !villain ? 'btn-primary' : 'btn-ghost border-base-content/20'
              "
              @click="villain = null"
            >
              Surprise me
            </button>
            <button
              v-for="v in metList"
              :key="v.id"
              type="button"
              class="btn btn-xs rounded-2xl"
              :class="
                villain === v.id
                  ? 'btn-primary'
                  : 'btn-ghost border-base-content/20'
              "
              @click="villain = v.id as VillainId"
            >
              {{ v.name }}
            </button>
          </div>
          <p class="mt-1 text-xs opacity-70">
            Nightmares you have faced can be summoned again to chase their Best
            ending.
          </p>
        </fieldset>
      </div>
      <div class="shrink-0 p-3 pt-0">
        <button
          type="submit"
          class="btn btn-primary w-full rounded-2xl"
          data-testid="cs-start"
        >
          Move into Crystal Street
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import { ARCHETYPES, SKILL_LABELS, VILLAINS } from '~/utils/crystalStreet/rules'
import type { Skill } from '~/utils/crystalStreet/types'
import type { VillainId } from '~/utils/crystalStreet/ids'

const emit = defineEmits<{ resume: []; scrapbook: []; started: [] }>()

const PRONOUNS = ['she/her', 'he/him', 'they/them']
const store = useCrystalStreetStore()
const name = ref('')
const pronouns = ref('they/them')
const customPronouns = ref('')
const archetype = ref(ARCHETYPES[2]!.id)
const villain = ref<VillainId | null>(null)

const inProgress = computed(() => !!store.run && !store.run.ending)
const metList = computed(() =>
  VILLAINS.filter((v) => store.metVillains.has(v.id)),
)

function topSkills(skills: Record<Skill, number>): string {
  return (Object.entries(skills) as [Skill, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([s, n]) => `${SKILL_LABELS[s]} ${n}`)
    .join(' · ')
}

function pickPronouns(p: string): void {
  pronouns.value = p
  customPronouns.value = ''
}

function begin(): void {
  store.start({
    name: name.value || 'Alex',
    pronouns: customPronouns.value.trim() || pronouns.value,
    archetype: archetype.value,
    villain: villain.value,
  })
  emit('started')
}
</script>
