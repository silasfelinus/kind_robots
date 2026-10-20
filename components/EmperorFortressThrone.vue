<template>
  <div
    class="grid min-h-full grid-cols-[minmax(0,1fr)] gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)] @7xl:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)]"
  >
    <section
      class="relative flex min-h-48 flex-col justify-end @4xl:min-h-0"
      aria-label="The court"
    >
      <figure
        v-if="sceneArt"
        class="pointer-events-none mt-auto flex justify-center @4xl:absolute @4xl:inset-0"
      >
        <img
          :key="sceneArt"
          :src="sceneArt"
          :alt="sceneAlt"
          class="eod-figure block max-h-52 w-auto object-contain @4xl:h-full @4xl:max-h-none"
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
          <button
            type="button"
            class="eod-finish flex w-full items-center justify-center gap-2 px-5 py-2 text-sm"
            @click="nextUnheard ? (selectedId = nextUnheard.id) : emit('next')"
          >
            {{ nextUnheard ? 'Next petitioner' : 'To the quest room' }}
            <span aria-hidden="true">▸</span>
          </button>
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
import { computed, ref, watch } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { questDef } from '~/utils/emperorOfDust/fortress/content'
import {
  audiencesToday,
  optionBlockers,
} from '~/utils/emperorOfDust/fortress/engine'
import { illustration } from '~/utils/emperorOfDust/fortress/castArt'
import type { Mood } from '~/utils/emperorOfDust/fortress/castArt'
import { npcDef, reactionMood } from '~/utils/emperorOfDust/fortress/npcs'
import type { FortressRun } from '~/utils/emperorOfDust/fortress/types'

const props = defineProps<{ run: FortressRun }>()
const emit = defineEmits<{ next: [] }>()
const court = useEmperorFortressStore()
const audiences = computed(() => audiencesToday(props.run))
const selectedId = ref<string | null>(null)
const responses = ref<Record<string, string>>({})
/** Each answered NPC's reaction, from their faction's change in support. */
const reactions = ref<Record<string, Mood>>({})
const error = ref('')

const heard = (id: string) => props.run.audiencesHeard.includes(id)
const nextUnheard = computed(() =>
  audiences.value.find((entry) => !heard(entry.id)),
)
const selected = computed(
  () => audiences.value.find((entry) => entry.id === selectedId.value) ?? null,
)
const npc = computed(() =>
  selected.value?.npc ? npcDef(selected.value.npc) : undefined,
)
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
