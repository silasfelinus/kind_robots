<!-- /components/dreams/dream-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden rounded-2xl bg-base-300/60 p-2"
  >
    <header
      v-if="showToolbar && !isDropdownMode"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100/95 px-2 py-2 shadow-sm backdrop-blur"
    >
      <div
        class="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap dream-toolbar-scroll"
      >
        <div
          v-if="showHeader"
          class="flex min-w-0 shrink-0 items-center gap-1.5 pr-1"
          :title="subtitle"
        >
          <Icon name="kind-icon:dream" class="h-4 w-4 text-primary" />
          <h2
            class="max-w-36 truncate text-sm font-black text-primary sm:max-w-48"
          >
            {{ title }}
          </h2>
          <span class="badge badge-primary badge-sm rounded-xl">
            {{ filteredDreams.length }}
          </span>
        </div>

        <p
          class="min-w-28 max-w-72 flex-1 truncate text-xs font-medium text-base-content/60"
          :class="dreamStore.error ? 'text-error' : ''"
          :title="dreamStore.error || statusLine"
        >
          {{ dreamStore.error || statusLine }}
        </p>

        <label
          v-if="showControls"
          class="input input-bordered input-sm flex h-9 min-w-48 flex-1 items-center gap-2 rounded-2xl bg-base-200 sm:min-w-60 lg:max-w-md"
        >
          <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
          <input
            v-model="searchQuery"
            class="grow bg-transparent"
            type="search"
            aria-label="Search Dreams"
            placeholder="Search Dreams..."
          />
        </label>

        <select
          v-if="showControls"
          v-model="selectedType"
          class="select select-bordered select-sm h-9 w-32 shrink-0 rounded-2xl bg-base-200"
          aria-label="Dream type filter"
        >
          <option value="all">All types</option>
          <option v-for="type in dreamTypes" :key="type" :value="type">
            {{ dreamTypeLabel(type) }}
          </option>
        </select>

        <select
          v-if="showControls"
          v-model="layoutMode"
          class="select select-bordered select-sm h-9 w-24 shrink-0 rounded-2xl bg-base-200"
          aria-label="Dream gallery layout"
        >
          <option value="grid">Grid</option>
          <option value="row">Row</option>
        </select>

        <button
          v-if="showControls"
          type="button"
          class="btn btn-sm tooltip tooltip-bottom shrink-0 rounded-2xl"
          :class="showMineOnly ? 'btn-secondary' : 'btn-outline'"
          data-tip="Mine only"
          aria-label="Show only my Dreams"
          @click="showMineOnly = !showMineOnly"
        >
          <Icon name="kind-icon:user" class="h-4 w-4" />
        </button>

        <button
          v-if="showControls"
          type="button"
          class="btn btn-sm tooltip tooltip-bottom shrink-0 rounded-2xl"
          :class="showArchived ? 'btn-warning' : 'btn-outline'"
          data-tip="Show archived"
          aria-label="Show archived Dreams"
          @click="showArchived = !showArchived"
        >
          <Icon name="kind-icon:archive" class="h-4 w-4" />
        </button>

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm tooltip tooltip-bottom shrink-0 rounded-2xl"
          type="button"
          :disabled="isLoading || dreamStore.loading"
          data-tip="Refresh Dreams"
          aria-label="Refresh Dreams"
          @click="refreshDreams(true)"
        >
          <span
            v-if="isLoading || dreamStore.loading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
        </button>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm tooltip tooltip-bottom shrink-0 rounded-2xl text-white"
          type="button"
          data-tip="New Dream"
          aria-label="New Dream"
          @click="startAddingDream"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
        </button>
      </div>
    </header>

    <section class="min-h-0 flex-1 overflow-auto overscroll-contain">
      <div
        v-if="isLoading || dreamStore.loading"
        class="flex h-full min-h-48 items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="dreamStore.error"
        class="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ dreamStore.error }}
        </p>

        <button
          v-if="allowRefresh"
          type="button"
          class="btn btn-error btn-sm rounded-2xl"
          @click="refreshDreams(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Try Again
        </button>
      </div>

      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
              >
                <Icon name="kind-icon:dream" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Dream
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedDreamTitle }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedDreamSubtitle }}
                </p>
              </div>
            </div>

            <button
              v-if="canEditSelected"
              class="btn btn-secondary btn-sm rounded-xl"
              type="button"
              @click="startEditingSelectedDream"
            >
              <Icon name="kind-icon:pencil" class="h-4 w-4" />
              <span class="hidden sm:inline">Edit</span>
            </button>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
            :value="dreamStore.selectedDream?.id ?? ''"
            aria-label="Select Dream"
            @change="selectDreamFromEvent"
          >
            <option value="">Choose a Dream</option>

            <option
              v-for="dream in filteredDreams"
              :key="dream.id"
              :value="dream.id"
            >
              {{ getDreamTitle(dream) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>
            <option v-if="allowAdd" value="__add__">Add Dream</option>
          </select>

          <div
            v-if="dreamStore.selectedDream"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedDreamDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="dreamStore.selectedDream.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm">Private</span>

              <span
                v-if="dreamStore.selectedDream.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span
                v-if="dreamStore.selectedDream.dreamType"
                class="badge badge-outline badge-sm"
              >
                {{ dreamTypeLabel(dreamStore.selectedDream.dreamType) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredDreams.length === 0"
        class="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200/70 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:dream" class="h-12 w-12 text-primary/70" />

        <div class="max-w-2xl">
          <p class="text-lg font-bold">
            {{ emptyStateTitle }}
          </p>

          <div class="mt-3 flex flex-col gap-2 text-sm">
            <p
              v-for="reason in emptyStateDetails"
              :key="reason"
              class="rounded-2xl border border-base-300 bg-base-100 px-3 py-2 text-left"
            >
              {{ reason }}
            </p>
          </div>

          <div
            v-if="dreamStore.dreams.length > 0"
            class="mt-3 flex flex-wrap justify-center gap-2 text-xs"
          >
            <span class="badge badge-ghost"
              >Loaded: {{ exclusionSummary.total }}</span
            >

            <span
              v-if="exclusionSummary.hiddenByOwnership"
              class="badge badge-warning"
            >
              Private: {{ exclusionSummary.hiddenByOwnership }}
            </span>

            <span
              v-if="exclusionSummary.hiddenByMature"
              class="badge badge-warning"
            >
              Mature: {{ exclusionSummary.hiddenByMature }}
            </span>

            <span
              v-if="exclusionSummary.hiddenByArchived"
              class="badge badge-warning"
            >
              Archived: {{ exclusionSummary.hiddenByArchived }}
            </span>

            <span v-if="exclusionSummary.hiddenByType" class="badge badge-info">
              Type: {{ exclusionSummary.hiddenByType }}
            </span>

            <span
              v-if="exclusionSummary.hiddenBySearch"
              class="badge badge-secondary"
            >
              Search: {{ exclusionSummary.hiddenBySearch }}
            </span>
          </div>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl text-white"
          type="button"
          @click="startAddingDream"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Make the first Dream
        </button>
      </div>

      <div v-else class="flex flex-col gap-3">
        <dream-sheet-toolbar
          v-if="showSheetToolbar"
          :dreams="filteredDreams"
          :auto-refresh="autoLoadSheets"
        />

        <div :class="layoutClass">
          <dream-card
            v-for="dream in filteredDreams"
            :key="dream.id"
            :dream="dream"
            :selected="dreamStore.selectedDream?.id === dream.id"
            :is-selected="dreamStore.selectedDream?.id === dream.id"
            :compact="isCompact"
            :show-image="showImages"
            :show-actions="showCardActions"
            :show-description="showDescriptions"
            :show-meta="showMeta"
            :show-stats="showStats"
            :show-debug="showDebug"
            :allow-edit="allowEdit"
            :allow-delete="allowDelete"
            :show-pitch-sheet-preview="showPitchSheetPreview"
            :load-pitch-sheet-preview="autoLoadSheets"
            image-fit="cover"
            @choose="selectDreamAndOpen"
            @edit="startEditingDreamById"
            @delete="handleDreamDeleted"
          />
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type {
  ArtImage,
  Character,
  Reward,
  Scenario,
} from '~/prisma/generated/prisma/client'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'

type DreamScenarioWithCharacters = Scenario & {
  Characters?: Partial<Character>[]
}

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showHeader?: boolean
    showImages?: boolean
    showControls?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    showStats?: boolean
    showDebug?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
    openOnSelect?: boolean
    showPitchSheetPreview?: boolean
    showSheetToolbar?: boolean
    autoLoadSheets?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Dreams',
    subtitle: 'Choose a Dream to open its workspace.',
    showHeader: true,
    showImages: true,
    showControls: true,
    showCardActions: true,
    showDescriptions: false,
    showMeta: true,
    showStats: true,
    showDebug: false,
    allowAdd: true,
    allowEdit: true,
    allowDelete: false,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
    openOnSelect: true,
    showPitchSheetPreview: true,
    showSheetToolbar: false,
    autoLoadSheets: true,
  },
)

const emit = defineEmits<{
  (event: 'selected', dream: DreamWithRelations): void
  (event: 'opened', dream: DreamWithRelations): void
  (event: 'editing', dream: DreamWithRelations): void
  (event: 'created'): void
}>()

const dreamStore = useDreamStore()
const navStore = useNavStore()
const userStore = useUserStore()

const selectedType = ref('all')
const searchQuery = ref('')
const showMineOnly = ref(false)
const showArchived = ref(false)
const isLoading = ref(false)
const layoutMode = ref<'grid' | 'row'>(props.variant === 'row' ? 'row' : 'grid')

const isDropdownMode = computed(() => props.variant === 'dropdown')

const showToolbar = computed(() => {
  return (
    props.showHeader ||
    props.showControls ||
    props.allowAdd ||
    props.allowRefresh
  )
})

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return layoutMode.value === 'row' || props.variant === 'row'
    ? 'dream-row'
    : 'dream-grid'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const showMature = computed(() => {
  return userStore.user?.showMature ?? userStore.showMature ?? false
})

const selectedDream = computed(() => {
  return dreamStore.selectedDream
})

const selectedDreamTitle = computed(() => {
  return selectedDream.value
    ? getDreamTitle(selectedDream.value)
    : 'No Dream selected'
})

const selectedDreamSubtitle = computed(() => {
  const dream = selectedDream.value

  if (!dream) return 'Choose a Dream to load the workspace.'

  return (
    [
      dreamTypeLabel(dream.dreamType),
      dream.isPublic ? 'Public' : 'Private',
      dream.isActive ? 'Active' : 'Archived',
    ]
      .filter(Boolean)
      .join(' / ') || 'Dream selected.'
  )
})

const selectedDreamDescription = computed(() => {
  const dream = selectedDream.value

  if (!dream) return 'No Dream selected.'

  return getDreamDescription(dream)
})

const canEditSelected = computed(() => {
  const dream = selectedDream.value

  if (!props.allowEdit || !dream?.id) return false
  if (userStore.isAdmin) return true

  return dream.userId === currentUserId.value
})

const galleryDreams = computed<DreamWithRelations[]>(() => {
  let dreams = dreamStore.dreams ?? []

  if (!showArchived.value) {
    dreams = dreams.filter((dream) => dream.isActive !== false)
  }

  if (!userStore.isAdmin && currentUserId.value !== null) {
    dreams = dreams.filter((dream) => {
      return dream.isPublic || dream.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    dreams = dreams.filter((dream) => !dream.isMature)
  }

  if (showMineOnly.value) {
    dreams = dreams.filter((dream) => dream.userId === currentUserId.value)
  }

  return dreams
})

const dreamTypes = computed(() => {
  const set = new Set<string>()

  for (const dream of galleryDreams.value) {
    const type = dream.dreamType?.trim()

    if (type) {
      set.add(type)
    }
  }

  return Array.from(set).sort()
})

const filteredDreams = computed<DreamWithRelations[]>(() => {
  let dreams = galleryDreams.value

  if (selectedType.value !== 'all') {
    dreams = dreams.filter((dream) => dream.dreamType === selectedType.value)
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    dreams = dreams.filter((dream) => {
      return dreamMatchesSearch(dream, query)
    })
  }

  return dreams
})

const statusLine = computed(() => {
  const selected = dreamStore.selectedDream
    ? `Selected: ${getDreamTitle(dreamStore.selectedDream)}`
    : 'No Dream selected'

  const total = dreamStore.dreams.length
  const visible = filteredDreams.value.length
  const active = dreamStore.activeDreams?.length ?? galleryDreams.value.length
  const hidden = Math.max(total - visible, 0)
  const hiddenText = hidden ? ` • ${hidden} hidden` : ''

  return `${visible}/${total} shown • ${active} active${hiddenText} • ${selected}`
})

const exclusionSummary = computed(() => {
  const allDreams = dreamStore.dreams ?? []
  const currentId = currentUserId.value
  const query = searchQuery.value.trim().toLowerCase()

  const counts = {
    total: allDreams.length,
    hiddenByOwnership: 0,
    hiddenByMature: 0,
    hiddenByArchived: 0,
    hiddenByMineOnly: 0,
    hiddenByType: 0,
    hiddenBySearch: 0,
  }

  for (const dream of allDreams) {
    const hiddenByArchived = !showArchived.value && dream.isActive === false

    if (hiddenByArchived) {
      counts.hiddenByArchived++
      continue
    }

    const hiddenByOwnership =
      !userStore.isAdmin &&
      currentId !== null &&
      !dream.isPublic &&
      dream.userId !== currentId

    if (hiddenByOwnership) {
      counts.hiddenByOwnership++
      continue
    }

    const hiddenByMature = !showMature.value && dream.isMature

    if (hiddenByMature) {
      counts.hiddenByMature++
      continue
    }

    const hiddenByMineOnly = showMineOnly.value && dream.userId !== currentId

    if (hiddenByMineOnly) {
      counts.hiddenByMineOnly++
      continue
    }

    const hiddenByType =
      selectedType.value !== 'all' && dream.dreamType !== selectedType.value

    if (hiddenByType) {
      counts.hiddenByType++
      continue
    }

    if (query && !dreamMatchesSearch(dream, query)) {
      counts.hiddenBySearch++
    }
  }

  return counts
})

const emptyStateTitle = computed(() => {
  if (dreamStore.dreams.length === 0) {
    return 'No Dreams loaded.'
  }

  return `${dreamStore.dreams.length} Dreams loaded, but none match this gallery.`
})

const emptyStateDetails = computed(() => {
  const summary = exclusionSummary.value
  const reasons: string[] = []

  if (summary.hiddenByArchived > 0) {
    reasons.push(
      `${summary.hiddenByArchived} hidden because archived Dreams are off.`,
    )
  }

  if (summary.hiddenByOwnership > 0) {
    reasons.push(
      `${summary.hiddenByOwnership} hidden because they are private and not owned by the current user.`,
    )
  }

  if (summary.hiddenByMature > 0) {
    reasons.push(
      `${summary.hiddenByMature} hidden because mature content is turned off.`,
    )
  }

  if (summary.hiddenByMineOnly > 0) {
    reasons.push(`${summary.hiddenByMineOnly} hidden by the Mine filter.`)
  }

  if (summary.hiddenByType > 0) {
    reasons.push(
      `${summary.hiddenByType} hidden by the selected type filter: ${selectedType.value}.`,
    )
  }

  if (summary.hiddenBySearch > 0) {
    reasons.push(
      `${summary.hiddenBySearch} hidden because they do not match the search: "${searchQuery.value.trim()}".`,
    )
  }

  if (!currentUserId.value && !userStore.isAdmin) {
    reasons.push(
      'The current user is not loaded yet, so owned private Dreams may be unavailable.',
    )
  }

  if (reasons.length === 0 && dreamStore.dreams.length > 0) {
    reasons.push(
      'Dreams are loaded, but the visible list is empty. Check isPublic, isMature, isActive, dreamType, or userId values.',
    )
  }

  return reasons
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshDreams()
  }
})

function dreamMatchesSearch(dream: DreamWithRelations, query: string) {
  return dreamSearchText(dream).toLowerCase().includes(query)
}

function getDreamTitle(dream: DreamWithRelations) {
  return dream.title || dream.slug || `Dream ${dream.id}`
}

function getDreamDescription(dream: DreamWithRelations) {
  return (
    dream.pitch ||
    dream.description ||
    dream.flavorText ||
    dream.artPrompt ||
    'No Dream summary yet.'
  )
}

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function refreshDreams(force = false) {
  isLoading.value = true

  try {
    const shouldForceFetch = force || dreamStore.dreams.length === 0

    await dreamStore.initialize({
      force: shouldForceFetch,
      fetchRemote: true,
    })
  } finally {
    isLoading.value = false
  }
}

async function selectDreamFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingDream()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    dreamStore.deselectDream?.()
    return
  }

  const dream = filteredDreams.value.find((item) => item.id === id)
  if (!dream) return

  await selectDreamAndOpen(dream)
}

function startAddingDream() {
  dreamStore.startAddingDream()
  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('created')
}

async function startEditingSelectedDream() {
  const id = dreamStore.selectedDream?.id

  if (!id) return

  await startEditingDreamById(id)
}

async function startEditingDreamById(id: number) {
  const dream = await dreamStore.startEditingDream(id)

  if (!dream) return

  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('editing', dream)
}

async function selectDreamAndOpen(dream: DreamWithRelations | number) {
  const id = typeof dream === 'number' ? dream : dream.id

  if (!Number.isInteger(id) || id <= 0) return

  const selected = await dreamStore.selectDreamById(id)
  if (!selected) return

  await dreamStore.fetchArtForDream(id)

  emit('selected', selected)

  if (props.openOnSelect) {
    emit('opened', selected)
  }
}

async function handleDreamDeleted(id: number) {
  const result = await dreamStore.deleteDream(id)

  if (result.success && dreamStore.selectedDream?.id === id) {
    dreamStore.deselectDream?.()
  }

  await refreshDreams(true)
}

function scenarioRowsForDream(dream: DreamWithRelations) {
  const rows = [
    dream.Scenario,
    ...((dream.Scenarios ?? []) as DreamScenarioWithCharacters[]),
  ].filter(Boolean) as DreamScenarioWithCharacters[]

  return uniqueById(rows)
}

function collectionArt(dream: DreamWithRelations) {
  return [
    ...(dream.ArtImages ?? []),
    ...(dream.ArtCollection?.ArtImages ?? []),
    ...(dream.ArtCollections ?? []).flatMap(
      (collection) => collection.ArtImages ?? [],
    ),
  ] as Partial<ArtImage>[]
}

function previewImage(dream: DreamWithRelations) {
  const firstCollectionImage = collectionArt(dream).find((art) => {
    return art.imagePath || art.path || art.fileName
  })

  return (
    dream.imagePath ||
    dream.highlightImage ||
    dream.ArtImage?.imagePath ||
    dream.ArtImage?.path ||
    dream.ArtImage?.fileName ||
    firstCollectionImage?.imagePath ||
    firstCollectionImage?.path ||
    firstCollectionImage?.fileName ||
    ''
  )
}

function dreamSearchText(dream: DreamWithRelations) {
  const scenarioText = (
    (dream.Scenarios ?? []) as DreamScenarioWithCharacters[]
  )
    .map((scenario) => {
      const characterText =
        scenario.Characters?.map((character) =>
          [
            character.name,
            character.honorific,
            character.title,
            character.role,
            character.class,
            character.species,
            character.genre,
          ]
            .filter(Boolean)
            .join(' '),
        ).join(' ') ?? ''

      return [
        scenario.title,
        scenario.description,
        scenario.locations,
        scenario.genres,
        scenario.inspirations,
        characterText,
      ]
        .filter(Boolean)
        .join(' ')
    })
    .join(' ')

  const primaryScenarioText = scenarioRowsForDream(dream)
    .map((scenario) =>
      [
        scenario.title,
        scenario.description,
        scenario.locations,
        scenario.genres,
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ')

  const characterText = (dream.Characters ?? [])
    .map((character) =>
      [
        character.name,
        character.honorific,
        character.title,
        character.role,
        character.class,
        character.species,
        character.genre,
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ')

  const rewardText = (dream.Rewards ?? [])
    .map((reward: Reward) =>
      [reward.name, reward.description, reward.rarity, reward.rewardType]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ')

  return [
    dream.title,
    dream.slug,
    dream.pitch,
    dream.description,
    dream.flavorText,
    dream.artPrompt,
    dream.examples,
    dream.designer,
    dream.dreamType,
    primaryScenarioText,
    scenarioText,
    characterText,
    rewardText,
    previewImage(dream),
  ]
    .filter(Boolean)
    .join(' ')
}

function uniqueById<T extends { id?: number | null }>(items: T[]) {
  const seen = new Set<number>()
  const unique: T[] = []

  items.forEach((item) => {
    const id = Number(item?.id)
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) return

    seen.add(id)
    unique.push(item)
  })

  return unique
}
</script>

<style scoped>
.dream-toolbar-scroll {
  scrollbar-width: thin;
}

.dream-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
  align-items: stretch;
}

.dream-grid > * {
  min-height: 20rem;
}

.dream-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x proximity;
}

.dream-row > * {
  min-width: min(220px, 78vw);
  max-width: 320px;
  min-height: 18rem;
  flex-shrink: 0;
  scroll-snap-align: start;
}
</style>
