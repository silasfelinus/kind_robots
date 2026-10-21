<template>
  <div
    class="flex min-h-full flex-col gap-3 @4xl:grid"
    :class="court.preferences.readingWidth === 'wide'
      ? '@4xl:grid-cols-[minmax(0,1fr)_minmax(38rem,52rem)] @7xl:grid-cols-[minmax(0,1fr)_minmax(42rem,58rem)]'
      : '@4xl:grid-cols-[minmax(0,1fr)_minmax(30rem,42rem)] @7xl:grid-cols-[minmax(0,1fr)_minmax(36rem,48rem)]'"
  >
    <section
      class="eod-figure-box relative flex min-h-0 flex-1 basis-0 flex-col justify-end"
      aria-label="The court"
    >
      <figure
        v-if="sceneArt"
        class="pointer-events-none absolute inset-0 flex items-end justify-center"
      >
        <img
          :key="sceneArt"
          :src="sceneArt"
          :alt="sceneAlt"
          class="eod-figure block h-full w-auto max-w-full object-contain object-bottom"
        />
      </figure>
      <p
        v-else-if="!audiences.length"
        class="kr-panel mt-auto self-center px-4 py-2 font-serif italic"
      >
        No one has come to court today.
      </p>
    </section>

    <section class="flex shrink-0 flex-col gap-2 @4xl:min-h-0">
      <Teleport v-if="audiences.length" to="#eod-room-tools" defer>
        <div class="flex min-w-0 items-center gap-1.5">
          <span
            class="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75"
          >
            <span class="hidden sm:inline">Audience </span
            >{{ audienceIndex + 1 }} / {{ audiences.length }}
          </span>
          <div
            class="no-scrollbar flex min-w-0 gap-1 overflow-x-auto px-3 [mask-image:linear-gradient(to_right,transparent,#000_0.75rem,#000_calc(100%_-_0.75rem),transparent)]"
            role="group"
            aria-label="Today's petitioners"
          >
            <button
              v-for="audience in audiences"
              :key="audience.id"
              type="button"
              class="btn btn-xs shrink-0 whitespace-nowrap"
              :class="
                selectedId === audience.id
                  ? 'btn-warning'
                  : heard(audience.id)
                    ? 'btn-ghost opacity-60'
                    : 'btn-outline'
              "
              :aria-pressed="selectedId === audience.id"
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
      </Teleport>

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
          <p class="eod-reading italic">
            {{ responses[selected.id] ?? 'The petition has been answered.' }}
          </p>
          <EmperorFortressCodexNote />
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
          v-else-if="scene"
          :key="selected.id + ':' + (scene.beatId ?? '')"
          :title="selected.title"
          :speaker="scene.speaker"
          :subtitle="npc?.species"
          :art="npc ? illustration('npcs', npc.slug) : undefined"
          :lines="sceneLines"
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
import { optionStakes } from '~/utils/emperorOfDust/fortress/board'
import {
  audienceScene,
  audiencesToday,
  optionBlockers,
  optionVisible,
} from '~/utils/emperorOfDust/fortress/engine'
import { illustration } from '~/utils/emperorOfDust/fortress/castArt'
import type { Mood } from '~/utils/emperorOfDust/fortress/castArt'
import { npcDef, reactionMood } from '~/utils/emperorOfDust/fortress/npcs'
import type {
  FortressRun,
  SceneLine,
} from '~/utils/emperorOfDust/fortress/types'

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
/** Where the selected audience stands: its opening, or a later beat. */
const scene = computed(() =>
  selected.value ? audienceScene(props.run, selected.value) : null,
)
const npc = computed(() =>
  scene.value?.npc ? npcDef(scene.value.npc) : undefined,
)
/** The answer that led into a beat opens it, so the scene reads straight on. */
const sceneLines = computed<SceneLine[]>(() => {
  const lines = scene.value?.lines ?? []
  const lead =
    scene.value?.beatId && selected.value
      ? responses.value[selected.value.id]
      : undefined
  return lead ? [lead, ...lines] : lines
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
    selectedId.value =
      audiences.value.find((entry) => !heard(entry.id))?.id ?? null
  },
  { immediate: true },
)

const choices = computed(() =>
  (scene.value?.options ?? [])
    .filter((option) => optionVisible(props.run, option))
    .map((option) => ({
      id: option.id,
      label: option.label,
      stakes: optionStakes(props.run, option),
      blockers: optionBlockers(props.run, option),
    })),
)

function choose(optionId: string) {
  if (!selected.value) return
  error.value = ''
  const id = selected.value.id
  const option = scene.value?.options.find((entry) => entry.id === optionId)
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
