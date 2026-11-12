<template>
  <section
    class="kr-scroll min-h-0 flex-1 rounded-3xl border border-base-content/15 bg-base-200/95 shadow-xl"
    aria-label="Choose your traveler"
    data-testid="shifting-lands-character-creator"
  >
    <div class="space-y-3 p-3 sm:p-4">
      <header class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p
            class="text-[10px] font-black uppercase tracking-[.25em] text-warning"
          >
            A new journey
          </p>
          <h2 class="font-serif text-2xl font-black">
            Who walks the Shifting Lands?
          </h2>
        </div>
        <button
          v-if="canCancel"
          type="button"
          class="btn btn-ghost btn-sm"
          @click="$emit('cancel')"
        >
          Keep the current journey
        </button>
      </header>

      <div
        class="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr))]"
        role="radiogroup"
        aria-label="Travelers"
      >
        <button
          v-for="option in options"
          :key="option.id"
          type="button"
          role="radio"
          :aria-checked="picked === option.id"
          class="overflow-hidden rounded-2xl border bg-base-100 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          :class="
            picked === option.id
              ? 'border-primary ring-2 ring-primary'
              : 'border-base-content/15 opacity-85 hover:opacity-100'
          "
          :data-testid="'traveler-' + option.id"
          @click="picked = option.id"
        >
          <img
            :src="option.portrait"
            :alt="option.name"
            class="aspect-[4/3] w-full object-cover object-[center_30%]"
          />
          <div class="space-y-0.5 p-2">
            <p class="font-serif font-black leading-tight">{{ option.name }}</p>
            <p class="line-clamp-2 text-xs opacity-70">{{ option.blurb }}</p>
          </div>
        </button>
      </div>

      <div
        v-if="picked === 'custom'"
        class="grid gap-3 rounded-2xl border border-base-content/15 bg-base-100/80 p-3"
      >
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-2"
        >
          <label class="form-control">
            <span class="label-text text-xs font-bold">Name</span>
            <input
              v-model="draft.name"
              type="text"
              :maxlength="NAME_MAX"
              class="input input-bordered input-sm"
              placeholder="Your traveler's name"
              autocomplete="off"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-bold">Species</span>
            <select
              v-model="draft.species"
              class="select select-bordered select-sm"
            >
              <option
                v-for="species in SPECIES"
                :key="species.id"
                :value="species.id"
              >
                {{ species.label }}
              </option>
            </select>
          </label>
          <div class="form-control">
            <span class="label-text text-xs font-bold">Pronouns</span>
            <div class="join" role="radiogroup" aria-label="Pronouns">
              <button
                v-for="pronoun in PRONOUNS"
                :key="pronoun"
                type="button"
                role="radio"
                :aria-checked="draft.pronouns === pronoun"
                class="btn join-item btn-sm flex-1"
                :class="draft.pronouns === pronoun ? 'btn-primary' : ''"
                @click="draft.pronouns = pronoun"
              >
                {{ pronoun }}
              </button>
            </div>
          </div>
        </div>
        <p class="text-xs font-bold" aria-live="polite">
          {{ POINT_BUY_TOTAL - skillTotal(draft.skills) }} of
          {{ POINT_BUY_TOTAL }} skill points left · each skill
          {{ SKILL_MIN }} to {{ SKILL_MAX }}
        </p>
      </div>

      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-1.5"
        aria-label="Skills and the odds of a risky check"
      >
        <div
          v-for="skill in SKILL_ORDER"
          :key="skill"
          class="flex items-center justify-between gap-1 rounded-xl bg-base-100 px-2 py-1.5 text-xs"
        >
          <div class="min-w-0">
            <p class="font-bold capitalize">{{ skill }}</p>
            <p class="opacity-60">Risky 9 · {{ odds(skill) }}%</p>
          </div>
          <div class="flex items-center gap-1">
            <button
              v-if="picked === 'custom'"
              type="button"
              class="btn btn-circle btn-ghost btn-xs"
              :aria-label="'Lower ' + skill"
              :disabled="draft.skills[skill] <= SKILL_MIN"
              @click="adjust(skill, -1)"
            >
              −
            </button>
            <strong class="w-6 text-center text-base">
              +{{ shownSkills[skill] }}
            </strong>
            <button
              v-if="picked === 'custom'"
              type="button"
              class="btn btn-circle btn-ghost btn-xs"
              :aria-label="'Raise ' + skill"
              :disabled="
                draft.skills[skill] >= SKILL_MAX ||
                skillTotal(draft.skills) >= POINT_BUY_TOTAL
              "
              @click="adjust(skill, 1)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="chosen && picked !== 'custom'"
        class="flex flex-wrap gap-2 text-xs"
      >
        <span class="badge badge-outline"
          >{{ chosen.startProvisions }} provisions</span
        >
        <span
          v-for="flag in chosen.signatureFlags"
          :key="flag"
          class="badge badge-warning badge-outline"
          >Starts knowing: {{ DEED_FLAGS[flag] ?? flag }}</span
        >
        <span v-if="ownRoad(chosen.id)" class="badge badge-accent badge-outline"
          >Own road: {{ ownRoad(chosen.id) }}</span
        >
      </div>
      <ul
        v-if="picked === 'custom' && problems.length"
        class="space-y-1 text-xs text-error"
      >
        <li v-for="problem in problems" :key="problem">{{ problem }}</li>
      </ul>

      <button
        type="button"
        class="btn btn-primary w-full sm:w-auto"
        :disabled="!chosen"
        data-testid="shifting-lands-begin"
        @click="chosen && $emit('start', chosen)"
      >
        Begin the journey{{ chosen ? ' as ' + chosen.name : '' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  CUSTOM_PORTRAIT_FALLBACK,
  NAME_MAX,
  POINT_BUY_TOTAL,
  PREMADE_CHARACTERS,
  SKILL_MAX,
  SKILL_MIN,
  SKILL_ORDER,
  SPECIES,
  ZUZU,
  characterPortrait,
  customCharacterProblems,
  makeCustomCharacter,
  skillTotal,
  type CustomCharacterInput,
  type PlayableId,
  type Pronouns,
  type ShiftingCharacter,
} from '~/utils/shiftingLands/characters'
import { DEED_FLAGS } from '~/utils/shiftingLands/deckV6'
import {
  personalCardsFor,
  personalOptionsFor,
} from '~/utils/shiftingLands/personalDeckV10'
import { personalEndingsFor } from '~/utils/shiftingLands/personalEndings'
import type { Skill } from '~/utils/shiftingLands/journey'
import type { TrialChoice } from '~/utils/shiftingLands/authoredBosses'
import { trialSuccessPercent } from '~/utils/shiftingLands/trialOdds'

const props = defineProps<{
  current: ShiftingCharacter
  canCancel: boolean
}>()
defineEmits<{ start: [character: ShiftingCharacter]; cancel: [] }>()

const PRONOUNS: readonly Pronouns[] = ['she', 'he', 'they']
// t-053: what only this traveler meets on the road.
function ownRoad(id: PlayableId): string {
  const cards = personalCardsFor(id).length
  const choices = personalOptionsFor(id).length
  const endings = personalEndingsFor(id).length
  if (!cards && !choices && !endings) return ''
  return `${cards} encounters, ${choices} choices and ${endings} endings of their own`
}
const picked = ref<PlayableId>(props.current.id)
const draft = reactive<CustomCharacterInput>(
  props.current.id === 'custom'
    ? {
        name: props.current.name,
        species: props.current.species,
        pronouns: props.current.pronouns,
        skills: { ...props.current.skills },
      }
    : {
        name: '',
        species: 'rabbit',
        pronouns: 'they',
        skills: { ...ZUZU.skills },
      },
)
const options = computed(() => [
  ...PREMADE_CHARACTERS.map((character) => ({
    id: character.id,
    name: character.name,
    blurb: character.blurb,
    portrait: characterPortrait(character),
  })),
  {
    id: 'custom' as const,
    name: 'Your own traveler',
    blurb: 'Name them, choose a species and spend 13 points on six skills.',
    portrait: CUSTOM_PORTRAIT_FALLBACK,
  },
])
const problems = computed(() => customCharacterProblems(draft))
const chosen = computed<ShiftingCharacter | null>(() =>
  picked.value === 'custom'
    ? makeCustomCharacter(draft)
    : (PREMADE_CHARACTERS.find((entry) => entry.id === picked.value) ?? null),
)
const shownSkills = computed<Record<Skill, number>>(() =>
  picked.value === 'custom'
    ? draft.skills
    : (chosen.value?.skills ?? ZUZU.skills),
)
function adjust(skill: Skill, step: number) {
  const next = draft.skills[skill] + step
  if (next < SKILL_MIN || next > SKILL_MAX) return
  if (step > 0 && skillTotal(draft.skills) >= POINT_BUY_TOTAL) return
  draft.skills[skill] = next
}
function odds(skill: Skill): number {
  return trialSuccessPercent(
    { skill, target: 9 } as TrialChoice,
    shownSkills.value,
  )
}
</script>
