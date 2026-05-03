<!-- /components/content/weird/scenario-card.vue -->
<template>
  <article
    :class="[
      'relative flex cursor-pointer flex-col rounded-2xl border bg-base-200 transition-all hover:shadow-lg',
      compact ? 'gap-2 p-3' : 'gap-4 p-4',
      selected ? 'border-primary bg-primary/10' : 'border-base-300',
    ]"
    @click="selectScenario"
  >
    <div
      v-if="showActions && selected"
      class="absolute right-2 top-2 z-20 flex items-center gap-2"
    >
      <button
        v-if="canEdit"
        class="rounded-full bg-base-100 p-2 text-primary shadow hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Scenario"
        @click.stop="emit('edit', scenario.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="allowClone"
        class="rounded-full bg-base-100 p-2 text-secondary shadow hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Scenario"
        @click.stop="emit('clone', scenario.id)"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="canDelete"
        class="rounded-full bg-base-100 p-2 text-error shadow hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Scenario"
        @click.stop="deleteScenario"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </div>

    <div
      :class="[
        'flex w-full gap-4',
        compact ? 'flex-col' : 'flex-col md:flex-row',
      ]"
    >
      <div
        v-if="showImage"
        :class="[
          'shrink-0 overflow-hidden rounded-2xl bg-base-300',
          compact ? 'h-32 w-full' : 'h-40 w-full md:h-48 md:w-48',
        ]"
      >
        <img
          :src="computedScenarioImage"
          alt="Scenario Image"
          class="h-full w-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <h2
          :class="[
            'font-bold leading-tight text-base-content',
            compact ? 'line-clamp-1 text-base' : 'text-xl',
          ]"
        >
          {{ scenario.title || 'Untitled Scenario' }}
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
            User {{ scenario.userId }}
          </span>
        </div>

        <div
          v-if="showInspirations && scenario.inspirations && !compact"
          class="rounded-xl bg-base-100 p-3 text-sm text-base-content/70"
        >
          <p class="mb-1 font-bold text-base-content">Inspirations</p>
          <p class="whitespace-pre-wrap">
            {{ scenario.inspirations }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="showChoices && selected && introChoices.length"
      class="grid w-full grid-cols-1 gap-3 pt-2 md:grid-cols-2 xl:grid-cols-3"
    >
      <button
        v-for="(intro, index) in introChoices"
        :key="index"
        class="btn btn-secondary h-auto min-h-16 w-full whitespace-normal rounded-xl px-4 py-3 text-left leading-relaxed"
        type="button"
        @click.stop="setCurrentChoice(intro)"
      >
        {{ intro }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
    allowEdit?: boolean
    allowDelete?: boolean
    allowClone?: boolean
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
    allowEdit: true,
    allowDelete: true,
    allowClone: true,
  },
)

const emit = defineEmits<{
  select: [id: number]
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
  choice: [choice: string]
}>()

const scenarioStore = useScenarioStore()
const userStore = useUserStore()
const artStore = useArtStore()

const artImage = ref<ArtImage | null>(null)

const canEdit = computed(
  () =>
    props.allowEdit &&
    (userStore.isAdmin || userStore.userId === props.scenario.userId),
)

const canDelete = computed(
  () =>
    props.allowDelete &&
    (userStore.isAdmin || userStore.userId === props.scenario.userId),
)

const computedScenarioImage = computed(() =>
  artImage.value
    ? `data:image/${artImage.value.fileType};base64,${artImage.value.imageData}`
    : props.scenario.imagePath || '/images/scenarios/space.webp',
)

const introChoices = computed(() => {
  const raw = props.scenario.intros

  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === 'string')
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (entry): entry is string => typeof entry === 'string',
      )
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
  emit('select', props.scenario.id)
}

async function deleteScenario() {
  const deleted = await scenarioStore.deleteScenario(props.scenario.id)

  if (deleted !== false) {
    emit('delete', props.scenario.id)
  }
}

function setCurrentChoice(choice: string) {
  scenarioStore.currentChoice = choice
  emit('choice', choice)
}

onMounted(async () => {
  if (!props.scenario.artImageId || !props.showImage) return

  try {
    const result = await artStore.getArtImageById(props.scenario.artImageId)

    if (result) {
      artImage.value = result
    }
  } catch (error) {
    console.error('Failed to load scenario art image:', error)
  }
})
</script>
