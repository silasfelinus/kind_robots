<!-- /components/scenarios/scenario-card.vue -->
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
        v-if="showActions && canEdit"
        class="rounded-full bg-base-100/90 p-2 text-primary shadow backdrop-blur transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Scenario"
        @click.stop="emit('edit', scenario.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowClone"
        class="rounded-full bg-base-100/90 p-2 text-secondary shadow backdrop-blur transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Scenario"
        @click.stop="emit('clone', scenario.id)"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && canDelete"
        class="rounded-full bg-base-100/90 p-2 text-error shadow backdrop-blur transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Scenario"
        @click.stop="deleteScenario"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <div class="flex w-full flex-col">
      <figure
        v-if="showImage"
        :class="[
          'relative w-full overflow-hidden rounded-xl bg-base-300',
          compact ? 'aspect-video' : 'aspect-4/3',
        ]"
      >
        <img
          :src="computedScenarioImage"
          :alt="scenarioTitle"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        <div
          class="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2"
        >
          <span
            v-if="scenario.userId === userStore.userId"
            class="badge badge-primary badge-sm shadow"
          >
            Yours
          </span>
          <span v-else />

          <span
            v-if="scenario.isMature"
            class="badge badge-warning badge-sm shadow"
          >
            Mature
          </span>
        </div>

        <figcaption
          class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-12"
        >
          <h2
            :class="[
              'font-black leading-tight text-white drop-shadow',
              compact ? 'line-clamp-1 text-base' : 'line-clamp-2 text-lg',
            ]"
            :title="scenarioTitle"
          >
            {{ scenarioTitle }}
          </h2>

          <p
            v-if="scenario.genres"
            class="mt-0.5 line-clamp-1 text-xs font-medium text-white/75"
          >
            {{ scenario.genres }}
          </p>
        </figcaption>

        <div
          v-if="activeSelected"
          class="absolute right-2 top-9 rounded-full bg-primary p-1.5 text-primary-content shadow-lg"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" />
        </div>
      </figure>

      <div v-else class="flex items-start justify-between gap-2">
        <h2
          class="line-clamp-2 text-base font-black leading-tight text-base-content"
        >
          {{ scenarioTitle }}
        </h2>

        <Icon
          v-if="activeSelected"
          name="kind-icon:check"
          class="h-5 w-5 shrink-0 text-primary"
        />
      </div>

      <div v-if="showDescription && !compact" class="px-0.5 pt-2.5">
        <p class="line-clamp-3 text-sm leading-relaxed text-base-content/70">
          {{ scenario.description || 'No description yet.' }}
        </p>
      </div>

      <div v-if="showMeta" class="flex flex-wrap gap-1.5 px-0.5 pt-2">
        <span
          v-if="scenario.locations"
          class="badge badge-ghost badge-sm max-w-full truncate"
          :title="scenario.locations"
        >
          <Icon name="kind-icon:map" class="mr-1 h-3 w-3" />
          {{ scenario.locations }}
        </span>

        <span v-if="introCount" class="badge badge-outline badge-sm">
          {{ introCount }} {{ introCount === 1 ? 'opening' : 'openings' }}
        </span>
      </div>

      <div
        v-if="showInspirations && scenario.inspirations && !compact"
        class="mx-0.5 mt-2.5 rounded-xl border border-base-300 bg-base-100 p-2.5"
      >
        <p
          class="text-[0.65rem] font-bold uppercase tracking-wider text-base-content/50"
        >
          Inspirations
        </p>

        <p
          class="mt-0.5 line-clamp-2 text-xs leading-relaxed text-base-content/70"
        >
          {{ scenario.inspirations }}
        </p>
      </div>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Scenario } from '~/prisma/generated/prisma/client'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'
import { parseScenarioIntros } from '@/stores/helpers/scenarioHelper'

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
    showReaction?: boolean
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
    showInspirations: false,
    showReaction: true,
    allowEdit: true,
    allowDelete: true,
    allowClone: true,
    fallbackImage: '/images/scenarios/space.webp',
  },
)

const emit = defineEmits<{
  choose: [scenario: Scenario]
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
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

const introCount = computed(() => {
  return parseScenarioIntros(props.scenario.intros).length
})

async function selectScenario() {
  await scenarioStore.selectScenario(props.scenario.id)
  emit('choose', props.scenario)
}

async function deleteScenario() {
  const deleted = await scenarioStore.deleteScenario(props.scenario.id)

  if (deleted !== false) {
    emit('delete', props.scenario.id)
  }
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
