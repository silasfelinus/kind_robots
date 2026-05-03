<!-- /components/content/weird/scenario-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="scenario.id"
    target-type="scenario"
    reaction-category="SCENARIO"
    :target-title="scenarioTitle"
    @select="selectScenario"
  >
    <template #actions>
      <button
        v-if="showActions && canEdit && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Scenario"
        @click.stop="emit('edit', scenario.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowClone && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Scenario"
        @click.stop="emit('clone', scenario.id)"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && canDelete && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Scenario"
        @click.stop="deleteScenario"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <div
      :class="[
        'flex w-full gap-4',
        compact ? 'flex-col' : 'flex-col md:flex-row',
      ]"
    >
      <div
        v-if="showImage"
        :class="[
          'relative shrink-0 overflow-hidden rounded-2xl border border-base-300 bg-base-300',
          compact ? 'h-32 w-full' : 'h-40 w-full md:h-48 md:w-48',
        ]"
      >
        <img
          :src="computedScenarioImage"
          :alt="scenarioTitle"
          class="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />

        <div class="absolute left-2 top-2 flex flex-wrap gap-1">
          <span
            v-if="scenario.userId === userStore.userId"
            class="badge badge-primary badge-sm"
          >
            Yours
          </span>

          <span v-else class="badge badge-ghost badge-sm"> Scenario </span>
        </div>

        <div
          v-if="activeSelected"
          class="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" />
        </div>
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <h2
          :class="[
            'font-black leading-tight text-base-content',
            compact ? 'line-clamp-1 text-base' : 'text-xl',
          ]"
          :title="scenarioTitle"
        >
          {{ scenarioTitle }}
        </h2>

        <p
          v-if="showDescription"
          :class="[
            'text-base-content/70',
            compact ? 'line-clamp-2 text-sm' : 'text-sm md:text-base',
          ]"
        >
          {{ scenario.description || 'No description available.' }}
        </p>

        <div v-if="showMeta" class="flex flex-wrap gap-2">
          <span
            v-if="scenario.genres"
            class="badge badge-outline badge-sm max-w-full truncate"
          >
            {{ scenario.genres }}
          </span>

          <span v-if="scenario.userId" class="badge badge-ghost badge-sm">
            User #{{ scenario.userId }}
          </span>

          <span v-if="scenario.artImageId" class="badge badge-primary badge-sm">
            Art Image #{{ scenario.artImageId }}
          </span>
        </div>

        <div
          v-if="showInspirations && scenario.inspirations && !compact"
          class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm text-base-content/70"
        >
          <p class="mb-1 font-bold text-base-content">Inspirations</p>

          <p class="whitespace-pre-wrap">
            {{ scenario.inspirations }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="showChoices && activeSelected && introChoices.length"
      class="grid w-full grid-cols-1 gap-3 pt-2 md:grid-cols-2 xl:grid-cols-3"
    >
      <button
        v-for="(intro, index) in introChoices"
        :key="`${intro}-${index}`"
        class="btn btn-secondary h-auto min-h-16 w-full whitespace-normal rounded-xl px-4 py-3 text-left leading-relaxed"
        type="button"
        @click.stop="setCurrentChoice(intro)"
      >
        {{ intro }}
      </button>
    </div>

    <details
      v-if="showDebug"
      class="rounded-2xl border border-base-300 bg-base-100 p-2"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-base-content/70">
        Debug
      </summary>

      <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
        JSON.stringify(scenario, null, 2)
      }}</pre>
    </details>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Scenario } from '~/prisma/generated/prisma/client'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'

const props = withDefaults(
  defineProps<{
    scenario: Scenario
    selected?: boolean
    showImage?: boolean
    compact?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showInspirations?: boolean
    showChoices?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowClone?: boolean
    fallbackImage?: string
  }>(),
  {
    selected: false,
    showImage: true,
    compact: false,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showInspirations: true,
    showChoices: true,
    showReaction: true,
    showDebug: false,
    allowEdit: true,
    allowDelete: true,
    allowClone: true,
    fallbackImage: '/images/scenarios/space.webp',
  },
)

const emit = defineEmits<{
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
  choice: [choice: string]
}>()

const scenarioStore = useScenarioStore()
const userStore = useUserStore()
const artStore = useArtStore()

const artImage = ref<ArtImage | null>(null)

const activeSelected = computed(() => {
  return (
    props.selected || scenarioStore.selectedScenario?.id === props.scenario.id
  )
})

const scenarioTitle = computed(() => {
  return props.scenario.title || `Scenario #${props.scenario.id}`
})

const canEdit = computed(() => {
  return (
    props.allowEdit &&
    (userStore.isAdmin || userStore.userId === props.scenario.userId)
  )
})

const canDelete = computed(() => {
  return (
    props.allowDelete &&
    (userStore.isAdmin || userStore.userId === props.scenario.userId)
  )
})

const computedScenarioImage = computed(() => {
  if (artImage.value?.imageData) {
    return `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
  }

  return props.scenario.imagePath || props.fallbackImage
})

const introChoices = computed<string[]>(() => {
  const raw = props.scenario.intros

  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === 'string')
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => {
        return typeof entry === 'string'
      })
    }

    return []
  } catch {
    return raw
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
})

function selectScenario() {
  scenarioStore.selectScenario(props.scenario.id)
}

async function deleteScenario() {
  const deleted = await scenarioStore.deleteScenario(props.scenario.id)

  if (deleted !== false) {
    emit('delete', props.scenario.id)
  }
}

function setCurrentChoice(choice: string) {
  scenarioStore.setCurrentChoice(choice)
  emit('choice', choice)
}

async function loadScenarioImage() {
  artImage.value = null

  if (!props.scenario.artImageId || !props.showImage) return

  try {
    const result = await artStore.getArtImageById(props.scenario.artImageId)

    if (result) {
      artImage.value = result
    }
  } catch (error) {
    console.error('Failed to load scenario art image:', error)
  }
}

onMounted(async () => {
  await loadScenarioImage()
})

watch(
  () => props.scenario.artImageId,
  async () => {
    await loadScenarioImage()
  },
)
</script>
