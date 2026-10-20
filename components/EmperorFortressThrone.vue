<template>
  <div
    class="grid min-h-full grid-cols-[minmax(0,1fr)] gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)] @7xl:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]"
  >
    <section
      class="relative flex min-h-64 flex-col justify-end @4xl:min-h-0"
      aria-label="The court"
    >
      <div class="relative z-10 self-start @4xl:max-w-md">
        <button
          type="button"
          class="kr-panel flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-warning"
          :aria-expanded="showBriefing"
          @click="showBriefing = !showBriefing"
        >
          {{ today?.advisor?.name ?? 'Young Komodo' }} · morning briefing
          <Icon
            :name="
              showBriefing ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
            "
            class="h-3.5 w-3.5"
          />
        </button>
        <div v-if="showBriefing" class="kr-panel mt-2 space-y-2 p-3">
          <template v-if="today">
            <div class="flex items-start gap-2">
              <img
                v-if="advisorArt"
                :src="advisorArt"
                :alt="today.advisor?.name ?? 'Young Komodo'"
                class="h-20 w-14 shrink-0 rounded-md bg-base-200 object-cover object-top"
              />
              <p class="font-serif text-base italic">“{{ today.komodo }}”</p>
            </div>
            <ul class="grid gap-1.5">
              <li
                v-for="report in today.briefings"
                :key="report.id"
                class="rounded-md border p-2"
                :class="
                  eyeReveals(run, report.truth) || forecastMark(run, report)
                    ? 'border-warning bg-warning/10'
                    : 'border-base-content/15 bg-base-200/70'
                "
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
                <p
                  class="text-[10px] font-semibold uppercase tracking-wider opacity-60"
                >
                  {{ report.source }}
                </p>
                <p class="text-sm leading-snug">{{ report.text }}</p>
              </li>
            </ul>
            <p class="text-xs italic opacity-70">
              Two of these are true. One is not.
            </p>
          </template>
          <p v-else class="text-sm opacity-75">
            Komodo has no written briefing for Day {{ run.day }} yet. Only the
            first {{ DAYS.length }} days are scripted so far; the wasteland’s
            daily chores still reach the quest room.
          </p>
        </div>
      </div>

      <figure
        v-if="sceneArt"
        class="pointer-events-none mt-auto flex justify-center @4xl:absolute @4xl:inset-y-0 @4xl:left-[38%] @4xl:right-0"
      >
        <img
          :key="sceneArt"
          :src="sceneArt"
          :alt="sceneAlt"
          class="eod-figure block max-h-72 w-auto object-contain @4xl:h-full @4xl:max-h-none"
        />
      </figure>
      <p
        v-else-if="!audiences.length"
        class="kr-panel mt-auto self-center px-4 py-2 font-serif italic"
      >
        No one has come to court today.
      </p>
    </section>

    <section class="flex min-h-0 flex-col gap-2">
      <div v-if="audiences.length" class="kr-panel p-2">
        <p
          class="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70"
        >
          Audience {{ audienceIndex + 1 }} / {{ audiences.length }}
        </p>
        <div class="mt-1 flex flex-wrap gap-1">
          <button
            v-for="audience in audiences"
            :key="audience.id"
            type="button"
            class="btn btn-xs"
            :class="
              selectedId === audience.id
                ? 'btn-warning'
                : heard(audience.id)
                  ? 'btn-ghost opacity-60'
                  : 'btn-outline'
            "
            @click="selectedId = audience.id"
          >
            {{ audience.title }}
            <Icon
              v-if="heard(audience.id)"
              name="kind-icon:check"
              class="h-3 w-3"
            />
          </button>
        </div>
      </div>

      <template v-if="selected">
        <div
          v-if="heard(selected.id)"
          class="kr-panel space-y-2 p-4"
          role="status"
        >
          <h2 class="font-serif text-lg font-bold text-warning">
            {{ selected.title }}
          </h2>
          <p class="text-xs font-semibold uppercase tracking-widest opacity-60">
            {{ selected.speaker }}
          </p>
          <p class="font-serif text-base italic">
            {{ responses[selected.id] ?? 'The petition has been answered.' }}
          </p>
        </div>
        <EmperorFortressDialogue
          v-else
          :key="selected.id"
          :title="selected.title"
          :speaker="selected.speaker"
          :subtitle="npc?.species"
          :art="npc ? illustration('npcs', npc.slug) : undefined"
          :lines="selected.lines"
          :choices="choices"
          @choose="choose"
        />
      </template>
      <p v-if="error" class="kr-note kr-note-error p-3 text-sm" role="alert">
        {{ error }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { DAYS, dayDef, questDef } from '~/utils/emperorOfDust/fortress/content'
import {
  audiencesToday,
  forecastMark,
  optionBlockers,
} from '~/utils/emperorOfDust/fortress/engine'
import { illustration } from '~/utils/emperorOfDust/fortress/castArt'
import type { Mood } from '~/utils/emperorOfDust/fortress/castArt'
import { npcDef, reactionMood } from '~/utils/emperorOfDust/fortress/npcs'
import { eyeReveals } from '~/utils/emperorOfDust/fortress/relics'
import type { FortressRun } from '~/utils/emperorOfDust/fortress/types'

const props = defineProps<{ run: FortressRun }>()
const court = useEmperorFortressStore()
const today = computed(() => dayDef(props.run.day))
/** The advisor's portrait; Komodo is sad on his last morning at court. */
const advisorArt = computed(() =>
  today.value
    ? illustration(
        'npcs',
        today.value.advisor?.npc ?? 'young-komodo',
        !today.value.advisor && today.value.day === 40 ? 'sad' : 'neutral',
      )
    : undefined,
)
const audiences = computed(() => audiencesToday(props.run))
const selectedId = ref<string | null>(null)
const responses = ref<Record<string, string>>({})
/** Each answered NPC's reaction, from their faction's change in support. */
const reactions = ref<Record<string, Mood>>({})
const error = ref('')

const heard = (id: string) => props.run.audiencesHeard.includes(id)
const selected = computed(
  () => audiences.value.find((entry) => entry.id === selectedId.value) ?? null,
)
const npc = computed(() =>
  selected.value?.npc ? npcDef(selected.value.npc) : undefined,
)
const wide = ref(true)
const showBriefing = ref(true)
onMounted(() => {
  wide.value = window.matchMedia?.('(min-width: 768px)').matches ?? true
  showBriefing.value = wide.value
})
const audienceIndex = computed(() =>
  Math.max(
    0,
    audiences.value.findIndex((entry) => entry.id === selectedId.value),
  ),
)
const sceneArt = computed(() => {
  if (!npc.value) return undefined
  const mood = selected.value ? reactions.value[selected.value.id] : undefined
  return illustration('npcs', npc.value.slug, mood)
})
const sceneAlt = computed(() => {
  const mood = selected.value ? reactions.value[selected.value.id] : undefined
  return npc.value
    ? `${npc.value.name}${mood ? ', ' + mood : ''}, before the throne`
    : ''
})

watch(
  () => props.run.day,
  () => {
    responses.value = {}
    reactions.value = {}
    showBriefing.value = wide.value
    selectedId.value =
      audiences.value.find((entry) => !heard(entry.id))?.id ?? null
  },
  { immediate: true },
)

const choices = computed(() =>
  (selected.value?.options ?? []).map((option) => {
    const notes: string[] = []
    if (option.requires?.cost) notes.push(`Costs ${option.requires.cost} brass`)
    for (const id of option.postsQuests ?? [])
      notes.push(`Posts a quest: ${questDef(id)?.title ?? id}`)
    return {
      id: option.id,
      label: option.label,
      note: notes.join(' · '),
      blockers: optionBlockers(props.run, option),
    }
  }),
)

function choose(optionId: string) {
  if (!selected.value) return
  error.value = ''
  const id = selected.value.id
  const option = selected.value.options.find((entry) => entry.id === optionId)
  const faction = selected.value.faction ?? npc.value?.faction
  try {
    court.answer(id, optionId)
    responses.value = { ...responses.value, [id]: court.lastResponse }
    if (option)
      reactions.value = {
        ...reactions.value,
        [id]: reactionMood(option.effects, faction),
      }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'That did not work.'
  }
}
</script>
