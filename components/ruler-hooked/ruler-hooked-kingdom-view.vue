<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="kr-text-faded-xs kr-text-eyebrow-bold">THE REALM</p>
        <h3 class="kr-text-bold-lg">{{ realmHeadline }}</h3>
        <p class="kr-text-faded-sm-80 mt-1">{{ realmSummary }}</p>
      </div>
      <span class="badge badge-outline shrink-0">Turn {{ save.turnCount }}</span>
    </div>

    <RulerHookedStage
      :scene="scene"
      :regions="regions"
      :ruler-custom-portrait-id="save.ruler.cosmetics?.customPortraitId ?? null"
    />

    <div class="grid gap-2 sm:grid-cols-2">
      <div
        v-for="axis in troubledAxes"
        :key="axis.key"
        class="kr-panel-tint-compact-50 flex items-center justify-between gap-3"
      >
        <div>
          <p class="kr-text-faded-xs capitalize">{{ axis.key }}</p>
          <p class="text-sm font-medium">{{ axis.reading }}</p>
        </div>
        <span class="text-lg font-bold tabular-nums">{{ axis.value }}</span>
      </div>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between gap-2">
        <div>
          <p class="kr-text-faded-xs kr-text-eyebrow-bold">PEOPLE OF THE REALM</p>
          <p class="kr-text-faded-sm-80">Faces behind the petitions and consequences.</p>
        </div>
        <span class="badge badge-ghost">{{ populace.length }}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <article
          v-for="person in populace"
          :key="person.slug"
          class="overflow-hidden rounded-2xl border border-base-300 bg-base-200/40"
        >
          <div class="aspect-square bg-base-300/40">
            <img
              v-if="!brokenPortraits.has(person.slug)"
              :src="characterFallbackPortraitPath(person.slug)"
              :alt="person.name"
              class="h-full w-full object-cover"
              loading="lazy"
              @error="brokenPortraits.add(person.slug)"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-3xl font-bold opacity-40"
            >
              {{ person.name.charAt(0) }}
            </div>
          </div>
          <div class="p-2">
            <p class="truncate text-sm font-bold">{{ person.name }}</p>
            <p class="kr-text-faded-xs line-clamp-2">{{ person.role || person.drive || 'Citizen of the realm' }}</p>
          </div>
        </article>
      </div>
    </div>

    <div>
      <p class="kr-text-faded-xs kr-text-eyebrow-bold mb-2">RECENT CONSEQUENCES</p>
      <ol v-if="recentChoices.length" class="flex flex-col gap-2">
        <li
          v-for="entry in recentChoices"
          :key="`${entry.turn}-${entry.cardId}`"
          class="rounded-xl border border-base-300 bg-base-200/30 p-3 text-sm"
        >
          <span class="kr-text-faded-xs">Turn {{ entry.turn }}</span>
          <p class="font-medium">{{ entry.choiceText }}</p>
          <p v-if="entry.resultText" class="kr-text-faded-sm-80 mt-1">{{ entry.resultText }}</p>
        </li>
      </ol>
      <p v-else class="kr-text-faded-sm-80">The realm is waiting for its first decision.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AXIS_KEYS } from '~/types/ruler-hooked'
import type { ContentBundle, RegionsManifest, RunSave, SceneState } from '~/types/ruler-hooked'
import { characterFallbackPortraitPath } from '~/utils/rulerHooked/characterArt'

const props = defineProps<{
  save: RunSave
  bundle: ContentBundle
  scene: SceneState | null
  regions: RegionsManifest
}>()

const brokenPortraits = reactive(new Set<string>())

function readingFor(value: number): string {
  if (value <= 20) return 'in crisis'
  if (value <= 40) return 'struggling'
  if (value <= 60) return 'holding steady'
  if (value <= 80) return 'doing well'
  return 'thriving'
}

const axisState = computed(() =>
  AXIS_KEYS.map((key) => {
    const value = Math.round(props.save.kingdomHealth[key] ?? 50)
    return { key, value, reading: readingFor(value) }
  }),
)

const troubledAxes = computed(() =>
  [...axisState.value].sort((a, b) => a.value - b.value).slice(0, 4),
)

const weakest = computed(() => troubledAxes.value[0])
const strongest = computed(() => [...axisState.value].sort((a, b) => b.value - a.value)[0])
const realmHeadline = computed(() => {
  if (!weakest.value || !strongest.value) return 'The realm endures.'
  if (weakest.value.value <= 30) return `${weakest.value.key} demands attention.`
  if (strongest.value.value >= 75) return `${strongest.value.key} is flourishing.`
  return 'The realm is holding together.'
})
const realmSummary = computed(() => {
  if (!weakest.value || !strongest.value) return 'Your choices will leave marks on this place.'
  return `${strongest.value.key} is your strongest front; ${weakest.value.key} is the pressure point people feel most.`
})

const populace = computed(() =>
  props.bundle.characters
    .filter((person) => person.slug !== props.save.ruler.characterSlug)
    .slice(0, 6),
)

const recentChoices = computed(() => [...props.save.choiceLog].reverse().slice(0, 4))
</script>
