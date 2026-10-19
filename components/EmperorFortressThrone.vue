<template>
  <div class="grid gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
    <section class="kr-panel space-y-3 p-4">
      <p class="text-xs font-semibold uppercase tracking-widest text-warning">
        {{ today?.advisor ?? 'Young Komodo' }} · morning briefing
      </p>
      <template v-if="today">
        <p class="font-serif text-lg italic">“{{ today.komodo }}”</p>
        <ul class="grid gap-2">
          <li
            v-for="report in today.briefings"
            :key="report.id"
            class="rounded-xl border p-3"
            :class="
              eyeReveals(run, report.truth) || forecastMark(run, report)
                ? 'border-warning bg-warning/10'
                : 'border-base-content/15 bg-base-100'
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
              class="text-xs font-semibold uppercase tracking-wider opacity-60"
            >
              {{ report.source }}
            </p>
            <p class="mt-1 text-sm">{{ report.text }}</p>
          </li>
        </ul>
        <p class="text-xs opacity-60">Two of these are true. One is not.</p>
      </template>
      <p v-else class="text-sm opacity-75">
        Komodo has no written briefing for Day {{ run.day }} yet. Only the first
        {{ DAYS.length }} days are scripted so far; the wasteland’s daily chores
        still reach the quest room.
      </p>
    </section>

    <section class="space-y-3">
      <div class="kr-panel p-4">
        <h2 class="font-serif text-2xl font-bold">The throne room</h2>
        <p v-if="!audiences.length" class="mt-2 text-sm opacity-75">
          No one has come to court today.
        </p>
        <div v-else class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="audience in audiences"
            :key="audience.id"
            type="button"
            class="btn btn-sm"
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
            <span v-if="heard(audience.id)" class="text-xs">· heard</span>
          </button>
        </div>
      </div>

      <template v-if="selected">
        <div
          v-if="heard(selected.id)"
          class="kr-panel space-y-2 p-4"
          role="status"
        >
          <p class="text-xs font-semibold uppercase tracking-widest opacity-60">
            {{ selected.speaker }}
          </p>
          <img
            v-if="reactionArt"
            :src="reactionArt"
            :alt="`${npc?.name}, ${reactions[selected.id]}`"
            class="mx-auto block max-h-80 w-auto bg-base-200 object-contain"
          />
          <p class="font-serif text-lg italic">
            {{ responses[selected.id] ?? 'The petition has been answered.' }}
          </p>
        </div>
        <p v-if="!heard(selected.id) && npc" class="text-xs opacity-70">
          {{ npc.name }} · {{ npc.species }}
        </p>
        <EmperorFortressDialogue
          v-if="!heard(selected.id)"
          :key="selected.id"
          :speaker="selected.speaker"
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
import { computed, ref, watch } from 'vue'
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
const reactionArt = computed(() => {
  const mood = selected.value ? reactions.value[selected.value.id] : undefined
  return npc.value && mood
    ? illustration('npcs', npc.value.slug, mood)
    : undefined
})

watch(
  () => props.run.day,
  () => {
    responses.value = {}
    reactions.value = {}
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
