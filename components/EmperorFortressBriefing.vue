<template>
  <div
    class="eod-briefing flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden @4xl:grid @4xl:grid-rows-[minmax(0,1fr)] @4xl:grid-cols-[minmax(26rem,0.92fr)_minmax(0,1.08fr)] @7xl:grid-cols-[minmax(32rem,0.85fr)_minmax(0,1.15fr)]"
  >
    <figure
      v-if="advisorArt"
      class="eod-figure-box pointer-events-none relative h-28 shrink-0 @4xl:order-2 @4xl:h-auto @4xl:min-h-0 @4xl:flex-1"
    >
      <img
        :key="advisorArt"
        :src="advisorArt"
        :alt="`${advisorName}, with the morning dispatches`"
        class="eod-figure absolute inset-x-0 bottom-0 mx-auto block h-full w-auto max-w-full object-contain object-bottom"
      />
    </figure>
    <div v-else class="hidden @4xl:block" />

    <section
      class="kr-panel kr-scroll flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-3 @4xl:order-1 @4xl:p-4 @7xl:p-5"
      aria-live="polite"
    >
      <div>
        <p
          class="text-sm font-semibold uppercase tracking-[0.16em] text-warning"
        >
          Morning Briefing · Day {{ run.day }}
        </p>
        <h2 class="font-serif text-2xl font-bold text-warning @7xl:text-3xl">
          {{ today?.title ?? 'The morning dispatches' }}
        </h2>
      </div>
      <article
        v-if="chance"
        class="rounded-lg border-2 border-warning/60 bg-base-200/95 p-4 shadow-lg"
        aria-label="Today's unexpected encounter"
      >
        <p class="text-xs font-bold uppercase tracking-widest text-warning">
          A surprise on the road · Act {{ chance.act }}
        </p>
        <h3 class="mt-1 font-serif text-xl font-bold @7xl:text-2xl">
          {{ chance.title }}
        </h3>
        <p class="eod-reading mt-2">{{ chance.text }}</p>
        <div class="mt-3 grid gap-2">
          <button
            v-for="choice in chance.choices"
            :key="choice.id"
            type="button"
            class="eod-choice-reading rounded-md border border-warning/40 bg-base-100/75 px-3 py-3 text-left transition-colors hover:border-warning hover:bg-warning/10 disabled:opacity-50"
            :disabled="acting || (choice.requires?.cost ?? 0) > run.brass"
            @click="pickChance(choice.id)"
          >
            <strong class="block">{{ choice.label }}</strong>
            <span
              class="mt-1 block text-sm font-sans not-italic text-warning opacity-85"
            >
              {{ costLine(choice) }}
            </span>
          </button>
        </div>
        <p v-if="chanceError" class="mt-2 text-sm text-error" role="alert">
          {{ chanceError }}
        </p>
      </article>
      <div
        v-else-if="run.dailyEventOutcome?.day === run.day"
        class="rounded-lg border border-warning/30 bg-base-200/90 p-4"
        role="status"
      >
        <p class="text-xs font-semibold uppercase tracking-widest text-warning">
          The unexpected visitor · {{ run.dailyEventOutcome.title }}
        </p>
        <p class="eod-reading mt-1 italic">{{ run.dailyEventOutcome.text }}</p>
      </div>
      <template v-if="today">
        <p v-if="lines.komodo" class="eod-reading italic">
          <strong class="not-italic text-warning">{{ advisorName }}:</strong>
          “{{ lines.komodo }}”
        </p>
        <p
          v-if="!challenge"
          class="eod-reading text-sm italic opacity-85"
        >
          <strong class="not-italic text-warning"
            >{{ advisorName }} adds:</strong
          >
          “{{ prompt }}”
        </p>
        <ul class="grid gap-1.5 text-center">
          <li v-for="report in reports" :key="report.id">
            <button
              type="button"
              class="w-full rounded-md border px-3 py-2 text-center transition-colors"
              :class="cardTone(report)"
              :disabled="!!challenge || acting"
              :aria-label="
                challenge
                  ? undefined
                  : `Look into the report from ${report.source}`
              "
              @click="challengeReport(report.id)"
            >
              <span
                v-if="eyeReveals(run, report.truth)"
                class="block text-xs font-bold text-warning"
                >The Eye marks this report false</span
              >
              <span
                v-if="forecastMark(run, report)"
                class="block text-xs font-bold text-warning"
                >{{
                  forecastMark(run, report) === 'false'
                    ? 'Nera reads the wind: this report is false'
                    : 'Nera frowns: this report has no weather in it at all'
                }}</span
              >
              <span
                class="block text-xs font-semibold uppercase tracking-wider opacity-75"
              >
                {{ report.source }}
              </span>
              <span class="eod-reading block">{{ report.text }}</span>
              <span
                v-if="!challenge"
                class="mt-2 block text-xs font-bold uppercase tracking-widest text-warning opacity-80"
                >Look into it</span
              >
              <span
                v-else-if="challenge.briefingId === report.id"
                class="mt-2 block border-t pt-2"
                :class="
                  challenge.caught ? 'border-success/50' : 'border-warning/30'
                "
                role="status"
              >
                <span
                  class="block text-xs font-bold uppercase tracking-widest"
                  :class="challenge.caught ? 'text-success' : 'text-warning'"
                  >{{
                    challenge.caught
                      ? `False rumour caught · +${RUMOUR_BOUNTY} brass`
                      : 'Nothing incorrect found'
                  }}</span
                >
                <span class="eod-reading mt-1 block text-sm italic">{{
                  rumourVerdict(report)
                }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p
          v-if="tally.made"
          class="mx-auto text-center text-xs uppercase tracking-widest opacity-70"
        >
          Rumours caught this reign · {{ tally.caught }} of {{ tally.made }}
        </p>
        <p
          v-if="lines.whisper"
          class="eod-reading border-l-2 border-warning/50 pl-3 italic opacity-85"
        >
          {{ lines.whisper.source }}: “{{ lines.whisper.text }}”
        </p>
        <details
          v-if="hindsight.length"
          class="rounded-md border border-error/40 bg-error/5 p-3"
        >
          <summary
            class="cursor-pointer text-xs font-bold uppercase tracking-wider text-error"
          >
            His own reports, read again · {{ hindsight.length }}
          </summary>
          <p class="mt-2 text-xs italic opacity-75">
            The Archive went back through every morning dispatch. These came
            from Young Komodo’s runner.
          </p>
          <ul class="mt-2 grid gap-2 pr-1">
            <li
              v-for="entry in hindsight"
              :key="entry.briefing.id"
              class="border-l-2 border-error/50 pl-3"
            >
              <p
                class="text-xs font-semibold uppercase tracking-wider opacity-75"
              >
                Day {{ entry.day }} · {{ entry.title }}
              </p>
              <p class="text-sm leading-snug line-through opacity-60">
                {{ entry.briefing.text }}
              </p>
              <p class="text-sm leading-snug">{{ entry.hindsight }}</p>
            </li>
          </ul>
        </details>
      </template>
      <p
        v-if="mapLine"
        class="eod-reading border-l-2 border-error/70 pl-3 font-semibold text-error"
      >
        {{ mapLine.source }}: {{ mapLine.text }}
      </p>
      <p
        v-if="candles"
        class="eod-reading border-l-2 border-error/70 pl-3 font-semibold text-error"
      >
        {{ candles.source }}: {{ candles.text }}
      </p>
      <p
        v-if="courting"
        class="eod-reading border-l-2 border-warning/70 pl-3 font-semibold text-warning"
      >
        {{ courting.source }}: {{ courting.text }}
      </p>
      <p v-if="!today" class="eod-reading opacity-85">
        No dispatches came up the road for Day {{ run.day }}. The wasteland’s
        daily chores still reach the quest room.
      </p>
      <button
        type="button"
        class="eod-finish mt-auto self-end px-4 py-2 text-sm"
        @click="emit('next')"
      >
        Open the throne room
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { chanceEvent } from '~/utils/emperorOfDust/fortress/dailyEvents'
import type { ChanceEventChoice } from '~/utils/emperorOfDust/fortress/dailyEvents'
import { illustration } from '~/utils/emperorOfDust/fortress/castArt'
import {
  RUMOUR_BOUNTY,
  dayBriefings,
  dayLines,
  komodoLiesInHindsight,
  rumourPrompt,
  rumourTally,
  rumourVerdict,
  todaysChallenge,
} from '~/utils/emperorOfDust/fortress/briefings'
import { candlesLine } from '~/utils/emperorOfDust/fortress/endings'
import { komodoCourtingLine } from '~/utils/emperorOfDust/fortress/betrayal'
import { dayDef } from '~/utils/emperorOfDust/fortress/content'
import {
  briefingMapLine,
  forecastMark,
} from '~/utils/emperorOfDust/fortress/engine'
import { eyeReveals } from '~/utils/emperorOfDust/fortress/relics'
import type {
  Briefing,
  FortressRun,
} from '~/utils/emperorOfDust/fortress/types'

// The day opens here: the advisor's three dispatches, before court sits.
const props = defineProps<{ run: FortressRun }>()
const emit = defineEmits<{ next: [] }>()
const court = useEmperorFortressStore()
const chance = computed(() =>
  props.run.dailyEvent ? chanceEvent(props.run.dailyEvent) : undefined,
)
const chanceError = ref('')
const acting = ref(false)
const costLine = (choice: ChanceEventChoice): string => {
  const brass = (choice.effects.brass ?? 0) - (choice.requires?.cost ?? 0)
  const local = Object.entries(choice.effects.local ?? {}).map(
    ([name, delta]) => `${name} ${delta && delta > 0 ? '+' : ''}${delta}`,
  )
  const affinity = Object.entries(choice.effects.affinity ?? {}).map(
    ([name, delta]) => `${name} ${delta && delta > 0 ? '+' : ''}${delta}`,
  )
  const visitor = choice.effects.recruitable?.length
    ? 'Follower available to hire'
    : null
  return (
    [
      brass ? `${brass > 0 ? '+' : ''}${brass} brass` : '',
      ...local,
      ...affinity,
      visitor,
    ]
      .filter(Boolean)
      .join(' · ') || 'A story to remember'
  )
}
function pickChance(choiceId: string) {
  const offered = chance.value
  if (!offered || acting.value) return
  acting.value = true
  chanceError.value = ''
  try {
    court.answerChanceEvent(offered.id, choiceId)
  } catch (cause) {
    chanceError.value =
      cause instanceof Error
        ? cause.message
        : 'The visitor could not hear that answer.'
  } finally {
    acting.value = false
  }
}

const today = computed(() => dayDef(props.run.day))
const mapLine = computed(() => briefingMapLine(props.run))
/** The advisor's line and the whisper, as this run hears them. */
const lines = computed(() => dayLines(props.run, today.value))
/** From Day 45: the Hundred Candles rule and today's count. */
const candles = computed(() => candlesLine(props.run))
/** Days 37-40: who Young Komodo sits up with (t-041). */
const courting = computed(() => komodoCourtingLine(props.run))
/** Today's reports as this run reads them (flag-keyed variants applied). */
const reports = computed(() => dayBriefings(props.run, today.value) ?? [])
/** After the betrayal: every report that was Komodo's own lie. */
const hindsight = computed(() => komodoLiesInHindsight(props.run))
const challenge = computed(() => todaysChallenge(props.run))
const prompt = computed(() => rumourPrompt(props.run))
const tally = computed(() => rumourTally(props.run))
const cardTone = (report: Briefing): string => {
  const picked = challenge.value?.briefingId === report.id
  if (picked)
    return challenge.value?.caught
      ? 'border-success bg-success/10'
      : 'border-warning/60 bg-base-200/90'
  const marked =
    eyeReveals(props.run, report.truth) || forecastMark(props.run, report)
  const base = marked
    ? 'border-warning bg-warning/10'
    : 'border-warning/20 bg-base-200/70'
  return challenge.value
    ? `${base} opacity-60`
    : `${base} hover:border-warning hover:bg-warning/10`
}
function challengeReport(briefingId: string) {
  if (challenge.value || acting.value) return
  acting.value = true
  try {
    court.challengeReport(briefingId)
  } finally {
    acting.value = false
  }
}
const advisorName = computed(() => today.value?.advisor?.name ?? 'Young Komodo')
/** The advisor's portrait; Komodo is sad on his last morning at court. */
const advisorArt = computed(() =>
  illustration(
    'npcs',
    today.value?.advisor?.npc ?? 'young-komodo',
    !today.value?.advisor && today.value?.day === 40 ? 'sad' : 'neutral',
  ),
)
</script>
