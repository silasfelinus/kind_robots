<template>
  <section
    v-if="run && encounter"
    class="kr-panes cs-encounter grid-cols-1 gap-3 @3xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
    :aria-label="encounter.title"
  >
    <crystal-street-art
      class="cs-frame min-h-40 @3xl:min-h-0"
      frame="h-full"
      :seed="artSeed"
      :src="artSrc"
      :kind="artKind"
      :palette="palette"
      :sigil="sigil"
      :alt="artAlt"
      :brief="artAlt"
    >
      <div
        class="absolute left-2 top-2 flex flex-wrap gap-1 cs-micro font-bold uppercase tracking-widest"
      >
        <span class="cs-tag">{{ kindLabel }}</span>
        <span v-if="ward" class="cs-tag cs-tag-ward">Ward: {{ ward }}</span>
      </div>
      <div
        v-if="store.run?.pending"
        class="absolute bottom-2 right-2 flex items-center gap-1"
        aria-hidden="true"
      >
        <span
          v-for="(d, i) in store.run.pending.roll.dice"
          :key="i"
          class="cs-die"
          :class="store.run.pending.roll.success ? 'cs-die-win' : 'cs-die-lose'"
          >{{ d }}</span
        >
      </div>
    </crystal-street-art>

    <div class="kr-pane cs-frame p-3 sm:p-4">
      <div class="kr-pane-scroll space-y-3 pr-1">
        <header>
          <p class="cs-kicker">{{ encounter.place }}</p>
          <h2 class="cs-display text-2xl leading-tight sm:text-3xl">
            {{ encounter.title }}
          </h2>
        </header>

        <p v-if="!pending" class="text-sm leading-relaxed sm:text-base">
          {{ encounter.text }}
        </p>

        <template v-else-if="outcome">
          <p
            class="cs-verdict"
            :class="pending.roll.success ? 'cs-verdict-win' : 'cs-verdict-lose'"
            role="status"
          >
            {{ pending.roll.success ? 'Success' : 'Failure' }} ·
            {{ pending.roll.dice[0] + pending.roll.dice[1] }}
            {{ pending.roll.modifier >= 0 ? '+' : '−' }}
            {{ Math.abs(pending.roll.modifier) }} = {{ pending.roll.total }} vs
            {{ pending.roll.target }}
          </p>
          <p class="cs-label uppercase tracking-wider opacity-70">
            {{ chosen?.label }} · {{ pending.roll.breakdown.join(' · ') }}
          </p>
          <p class="text-sm leading-relaxed sm:text-base">{{ outcome.text }}</p>
          <ul class="flex flex-wrap gap-1">
            <li
              v-for="chip in chips"
              :key="chip.text"
              class="cs-pill"
              :class="`cs-pill-${chip.tone}`"
            >
              {{ chip.text }}
            </li>
            <li v-if="pending.shielded" class="cs-pill cs-pill-good">
              {{ shieldName }} took the hit
            </li>
          </ul>
          <div class="flex flex-wrap gap-2 pt-1">
            <button
              v-if="helper"
              type="button"
              class="btn btn-sm btn-outline btn-secondary rounded-2xl"
              @click="store.reroll()"
            >
              {{ shortName(helper.name) }}: {{ helper.perk.name }} (reroll)
            </button>
            <button
              type="button"
              class="btn btn-sm btn-primary rounded-2xl"
              data-testid="cs-continue"
              @click="store.resolve()"
            >
              Continue
            </button>
          </div>
        </template>
      </div>
      <div v-if="!pending" class="cs-hand shrink-0 pt-2">
        <KrChoiceHand
          :choices="hand"
          :deal-key="`${encounter.id}:${run.log.length}`"
          testid-prefix="cs-choice"
          @play="(picked) => store.choose(picked.id)"
        >
          <template #art="{ choice }">
            <crystal-street-art
              frame="h-full"
              :seed="`${encounter.id}:${choice.id}`"
              :src="`/crystal-street/outcomes/${encounter.id}--${choice.id}-success.webp`"
              :fallback="`/crystal-street/scenes/${encounter.id}.webp`"
              :kind="artKind"
              :palette="palette"
              :sigil="sigil"
            />
          </template>
        </KrChoiceHand>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  SKILL_LABELS,
  bonusApplies,
  companionById,
  FACTION_LABELS,
  effectChips,
  itemById,
  lockReason,
  modifierFor,
  rerollHelper,
  successChance,
  villainOf,
  wardFor,
  shortName,
  standingShift,
} from '~/utils/crystalStreet/rules'
import type { Choice, Faction } from '~/utils/crystalStreet/types'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

const store = useCrystalStreetStore()
const run = computed(() => store.run!)
const encounter = computed(() => store.encounter)
const hand = computed<KrHandChoice[]>(() =>
  (encounter.value?.choices ?? []).map((choice) => {
    const lock = lockReason(run.value, choice)
    const bonus = bonusLabel(choice)
    const active = bonusActive(choice)
    return {
      id: choice.id,
      label: choice.label,
      chip: `${SKILL_LABELS[choice.skill]} · ${odds(choice)}%`,
      hint: lock || (active ? bonus : undefined),
      disabled: !!lock,
      details: [
        difficulty(choice.target),
        bonus && !active ? `${bonus} (not yet)` : '',
      ].filter(Boolean),
    }
  }),
)
const pending = computed(() => store.run?.pending ?? null)
const outcome = computed(() => store.outcome)
const chosen = computed(() =>
  encounter.value?.choices.find((c) => c.id === pending.value?.choiceId),
)
const chips = computed(() => {
  if (!outcome.value) return []
  const list = effectChips(outcome.value.effects)
  if (chosen.value && pending.value)
    for (const [faction, delta] of Object.entries(
      standingShift(run.value, chosen.value, pending.value.roll.success),
    ))
      if (delta)
        list.push({
          text: `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${FACTION_LABELS[faction as Faction]}`,
          tone: delta > 0 ? 'good' : 'bad',
        })
  return list
})
const helper = computed(() => (store.run ? rerollHelper(store.run) : null))
const shieldName = computed(() =>
  shortName(companionById(pending.value?.shielded ?? '')?.name ?? ''),
)
const ward = computed(() =>
  store.run?.current ? wardFor(store.run, store.run.current.id) : null,
)
const villain = computed(() => (store.run ? villainOf(store.run) : null))
const kind = computed(() => store.run?.current?.kind ?? 'beat')
const isNightKind = computed(() =>
  ['night', 'signature', 'finale'].includes(kind.value),
)
const palette = computed(() =>
  isNightKind.value && store.run?.revealed
    ? (villain.value?.palette ?? [])
    : [],
)
const sigil = computed(() =>
  kind.value === 'signature' || kind.value === 'finale'
    ? (villain.value?.sigil ?? '')
    : '',
)
const kindLabel = computed(
  () =>
    ({
      beat: 'Daylight',
      clue: 'Investigation',
      meet: 'New friend',
      arc: 'Hanging out',
      night: 'Night',
      signature: villain.value?.name ?? 'Nightmare',
      finale: 'Halloween',
    })[kind.value],
)
const artKind = computed(() =>
  kind.value === 'finale'
    ? 'villain'
    : isNightKind.value
      ? encounter.value?.id.startsWith('deck-dream')
        ? 'dream'
        : 'night'
      : 'day',
)
const artSeed = computed(
  () =>
    `${encounter.value?.id}:${pending.value ? `${pending.value.choiceId}:${pending.value.roll.success}` : 'scene'}`,
)
const artSrc = computed(() => {
  const id = encounter.value?.id
  if (!id) return ''
  if (!pending.value) return `/crystal-street/scenes/${id}.webp`
  return `/crystal-street/outcomes/${id}--${pending.value.choiceId}-${pending.value.roll.success ? 'success' : 'failure'}.webp`
})
const artAlt = computed(() => outcome.value?.art ?? encounter.value?.art ?? '')

function difficulty(target: number): string {
  return target <= 7 ? 'Easy 7' : target <= 9 ? 'Fair 9' : 'Hard 11'
}

function odds(choice: Choice): number {
  if (!store.run) return 0
  const { modifier } = modifierFor(store.run, choice)
  return Math.round(successChance(modifier, choice.target) * 100)
}

function bonusActive(choice: Choice): boolean {
  return !!store.run && bonusApplies(store.run, choice)
}

function bonusLabel(choice: Choice): string {
  const b = choice.bonus
  if (!b) return ''
  if (b.companion)
    return `${shortName(companionById(b.companion)?.name ?? '')} helps +${b.amount}`
  if (b.item) return `${itemById(b.item)?.name} +${b.amount}`
  return `Something you learned +${b.amount}`
}
</script>

<style scoped>
.cs-hand {
  --hand-accent: var(--color-secondary);
  --hand-accent-2: var(--color-primary);
  --hand-band: var(--color-base-200);
  --hand-band-ink: var(--color-base-content);
}
@container (max-width: 40rem) {
  .cs-hand {
    --hand-card-max: 5.75rem;
  }
}
.cs-hand :deep(.krh-card:focus-visible) {
  outline: none;
}
</style>
