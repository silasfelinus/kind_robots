<!-- /components/dreams/dream-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <section
      v-if="showHeader"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div
        class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <Icon name="kind-icon:dream" class="h-6 w-6 text-primary" />
            <h2 class="truncate text-xl font-black text-primary">
              {{ title }}
            </h2>

            <span class="badge badge-outline rounded-xl">
              {{ filteredDreams.length }} Dream{{
                filteredDreams.length === 1 ? '' : 's'
              }}
            </span>
          </div>

          <p class="mt-1 text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-if="allowRefresh"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading || dreamStore.loading"
            @click="refreshDreams(true)"
          >
            <span
              v-if="isLoading || dreamStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            Refresh
          </button>

          <button
            v-if="allowAdd"
            class="btn btn-primary btn-sm rounded-xl text-white"
            type="button"
            @click="startAddingDream"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            New Dream
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="showControls && !isDropdownMode"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm"
    >
      <div class="grid gap-2 lg:grid-cols-[minmax(0,1fr)_12rem_10rem_auto]">
        <label
          class="input input-bordered input-sm flex items-center gap-2 rounded-2xl bg-base-200"
        >
          <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
          <input
            v-model="searchQuery"
            class="grow"
            type="search"
            placeholder="Search Dreams, vibes, scenarios, cast..."
          />
        </label>

        <select
          v-model="selectedType"
          class="select select-bordered select-sm rounded-2xl bg-base-200"
        >
          <option value="all">All types</option>
          <option v-for="type in dreamTypes" :key="type" :value="type">
            {{ dreamTypeLabel(type) }}
          </option>
        </select>

        <select
          v-model="layoutMode"
          class="select select-bordered select-sm rounded-2xl bg-base-200"
        >
          <option value="grid">Grid</option>
          <option value="row">Row</option>
        </select>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="showMineOnly ? 'btn-secondary' : 'btn-outline'"
            @click="showMineOnly = !showMineOnly"
          >
            <Icon name="kind-icon:user" class="h-4 w-4" />
            Mine
          </button>

          <button
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="showArchived ? 'btn-warning' : 'btn-outline'"
            @click="showArchived = !showArchived"
          >
            <Icon name="kind-icon:archive" class="h-4 w-4" />
            Archived
          </button>
        </div>
      </div>
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading || dreamStore.loading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="dreamStore.error"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ dreamStore.error }}
        </p>
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

            <div class="flex shrink-0 items-center gap-2">
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

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

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
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:dream" class="h-12 w-12 text-primary" />

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
            <span class="badge badge-ghost">
              Loaded: {{ exclusionSummary.total }}
            </span>

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
          Make the first vibe
        </button>
      </div>

      <div v-else :class="layoutClass">
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
          image-fit="cover"
          @choose="previewDream"
          @edit="startEditingDreamById"
          @delete="handleDreamDeleted"
        />
      </div>
    </section>

    <div
      v-if="pendingDream"
      class="fixed inset-0 z-50 flex items-center justify-center bg-neutral/70 p-4 backdrop-blur-sm"
      @click.self="closeDreamPreview"
    >
      <section
        class="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl"
      >
        <header
          class="flex flex-wrap items-start justify-between gap-3 border-b border-base-300 bg-base-200 p-4"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-primary rounded-xl">
                {{ dreamTypeLabel(pendingDream.dreamType) }}
              </span>

              <span
                class="badge rounded-xl"
                :class="pendingDream.isPublic ? 'badge-success' : 'badge-ghost'"
              >
                {{ pendingDream.isPublic ? 'Public' : 'Private' }}
              </span>

              <span
                class="badge rounded-xl"
                :class="pendingDream.isActive ? 'badge-info' : 'badge-warning'"
              >
                {{ pendingDream.isActive ? 'Active' : 'Archived' }}
              </span>

              <span
                v-if="pendingDream.isMature"
                class="badge badge-warning rounded-xl"
              >
                Mature
              </span>
            </div>

            <h2 class="mt-2 text-2xl font-black text-base-content">
              {{ getDreamTitle(pendingDream) }}
            </h2>

            <p
              class="mt-2 line-clamp-4 text-sm leading-relaxed text-base-content/70"
            >
              {{ getDreamDescription(pendingDream) }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm"
            @click="closeDreamPreview"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </header>

        <section
          class="grid max-h-[60vh] gap-3 overflow-y-auto p-4 md:grid-cols-[12rem_minmax(0,1fr)]"
        >
          <figure
            v-if="showImages"
            class="aspect-4/5 overflow-hidden rounded-2xl border border-base-300 bg-base-300"
          >
            <img
              v-if="previewImage(pendingDream)"
              :src="previewImage(pendingDream)"
              :alt="`${getDreamTitle(pendingDream)} preview`"
              class="h-full w-full object-cover"
              loading="lazy"
            />

            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
            >
              <Icon name="kind-icon:dream" class="h-16 w-16 opacity-70" />
            </div>
          </figure>

          <div class="grid gap-3">
            <div v-if="showStats" class="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-center"
              >
                <p class="text-2xl font-black text-primary">
                  {{ pendingRelatedDreams.length }}
                </p>
                <p class="text-xs text-base-content/55">Related</p>
              </div>

              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-center"
              >
                <p class="text-2xl font-black text-secondary">
                  {{ pendingScenarioRows.length }}
                </p>
                <p class="text-xs text-base-content/55">Scenarios</p>
              </div>

              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-center"
              >
                <p class="text-2xl font-black text-accent">
                  {{ pendingCharacterRows.length }}
                </p>
                <p class="text-xs text-base-content/55">Characters</p>
              </div>

              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-center"
              >
                <p class="text-2xl font-black text-info">
                  {{ pendingArtCount + pendingRewardCount }}
                </p>
                <p class="text-xs text-base-content/55">Art / Rewards</p>
              </div>
            </div>

            <section
              v-if="pendingRelatedDreams.length"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-black text-primary">Related Dreams</h3>
                <span class="badge badge-primary badge-sm rounded-xl">
                  {{ pendingRelatedDreams.length }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="dream in pendingRelatedDreams.slice(0, 8)"
                  :key="`related-${dream.id}`"
                  class="badge badge-outline rounded-xl"
                >
                  {{ getDreamTitle(dream) }}
                </span>
              </div>
            </section>

            <section
              v-if="pendingScenarioRows.length"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-black text-secondary">Scenarios</h3>
                <span class="badge badge-secondary badge-sm rounded-xl">
                  {{ pendingScenarioRows.length }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="scenario in pendingScenarioRows.slice(0, 8)"
                  :key="`scenario-${scenario.id}`"
                  class="badge badge-secondary rounded-xl"
                >
                  {{ scenarioTitle(scenario) }}
                </span>
              </div>
            </section>

            <section
              v-if="pendingCharacterRows.length"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-black text-accent">Characters</h3>
                <span class="badge badge-accent badge-sm rounded-xl">
                  {{ pendingCharacterRows.length }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="character in pendingCharacterRows.slice(0, 10)"
                  :key="`character-${character.id}`"
                  class="badge badge-accent rounded-xl"
                >
                  {{ characterName(character) }}
                </span>
              </div>
            </section>

            <section
              class="rounded-2xl border border-primary/30 bg-primary/5 p-3"
            >
              <h3 class="font-black text-primary">Confirm Selection</h3>
              <p class="mt-1 text-sm leading-relaxed text-base-content/65">
                Selecting this Dream loads it as the active experience. The
                workspace Narrator updates to this Dream, and the manager moves
                to the Interact screen.
              </p>
            </section>
          </div>
        </section>

        <footer
          class="flex flex-wrap justify-end gap-2 border-t border-base-300 bg-base-200 p-4"
        >
          <button
            type="button"
            class="btn btn-ghost rounded-2xl"
            @click="closeDreamPreview"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary rounded-2xl text-white"
            :disabled="dreamStore.loading"
            @click="confirmDreamSelection"
          >
            <span
              v-if="dreamStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:target" class="h-4 w-4" />
            Select Dream
          </button>
        </footer>
      </section>
    </div>
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
  }>(),
  {
    variant: 'dashboard',
    title: 'Dreams',
    subtitle:
      'Choose a Dream vibe, confirm the connected elements, then open the experience.',
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
const pendingDream = ref<DreamWithRelations | null>(null)
const layoutMode = ref<'grid' | 'row'>(props.variant === 'row' ? 'row' : 'grid')

const isDropdownMode = computed(() => props.variant === 'dropdown')

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

const pendingScenarioRows = computed(() => {
  const dream = pendingDream.value
  if (!dream) return []

  return scenarioRowsForDream(dream)
})

const pendingCharacterRows = computed(() => {
  const dream = pendingDream.value
  if (!dream) return []

  return characterRowsForDream(dream)
})

const pendingRelatedDreams = computed(() => {
  const dream = pendingDream.value
  if (!dream) return []

  return galleryDreams.value
    .filter((candidate) => candidate.id !== dream.id)
    .map((candidate) => ({
      dream: candidate,
      score: relationScore(dream, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => entry.dream)
})

const pendingArtCount = computed(() => {
  const dream = pendingDream.value
  if (!dream) return 0

  return artCount(dream)
})

const pendingRewardCount = computed(() => {
  return (
    pendingDream.value?._count?.Rewards ??
    pendingDream.value?.Rewards?.length ??
    0
  )
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

function selectDreamFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingDream()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    pendingDream.value = null
    return
  }

  const dream = filteredDreams.value.find((item) => item.id === id)
  if (!dream) return

  previewDream(dream)
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

function previewDream(dream: DreamWithRelations) {
  pendingDream.value = dream
}

function closeDreamPreview() {
  pendingDream.value = null
}

async function confirmDreamSelection() {
  const dream = pendingDream.value
  if (!dream) return

  const selected = await dreamStore.selectDreamById(dream.id)
  if (!selected) return

  await dreamStore.fetchArtForDream(dream.id)

  pendingDream.value = null

  emit('selected', selected)
  emit('opened', selected)
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

function characterRowsForDream(dream: DreamWithRelations) {
  const direct = dream.Characters ?? []
  const scenarioCast = scenarioRowsForDream(dream).flatMap(
    (scenario) => scenario.Characters ?? [],
  )

  return uniqueById([...direct, ...scenarioCast] as Character[])
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

function artCount(dream: DreamWithRelations) {
  return dream._count?.ArtImages ?? collectionArt(dream).length ?? 0
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

function scenarioTitle(scenario: Partial<Scenario>) {
  return scenario.title || `Scenario #${scenario.id}`
}

function characterName(character: Partial<Character>) {
  return (
    character.name ||
    character.title ||
    character.honorific ||
    `Character #${character.id}`
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
    scenarioText,
    characterText,
    rewardText,
  ]
    .filter(Boolean)
    .join(' ')
}

function relationScore(source: DreamWithRelations, target: DreamWithRelations) {
  let score = 0

  if (source.dreamType && source.dreamType === target.dreamType) score += 2

  score += sharedCount(dreamScenarioIds(source), dreamScenarioIds(target)) * 5
  score += sharedCount(dreamCharacterIds(source), dreamCharacterIds(target)) * 4
  score += sharedCount(dreamRewardIds(source), dreamRewardIds(target)) * 3
  score += sharedCount(
    tokenSet(dreamSearchText(source)),
    tokenSet(dreamSearchText(target)),
  )

  return score
}

function dreamScenarioIds(dream: DreamWithRelations) {
  return new Set(
    [
      dream.Scenario?.id,
      ...(dream.Scenarios ?? []).map((scenario) => scenario.id),
    ].filter((id): id is number => Number.isInteger(id)),
  )
}

function dreamCharacterIds(dream: DreamWithRelations) {
  const scenarioCharactersList = (
    (dream.Scenarios ?? []) as DreamScenarioWithCharacters[]
  )
    .flatMap((scenario) => scenario.Characters ?? [])
    .map((character) => character.id)

  return new Set(
    [
      ...(dream.Characters ?? []).map((character) => character.id),
      ...scenarioCharactersList,
    ].filter((id): id is number => Number.isInteger(id)),
  )
}

function dreamRewardIds(dream: DreamWithRelations) {
  return new Set(
    (dream.Rewards ?? [])
      .map((reward: Reward) => reward.id)
      .filter((id): id is number => Number.isInteger(id)),
  )
}

function sharedCount<T>(first: Set<T>, second: Set<T>) {
  let count = 0

  first.forEach((value) => {
    if (second.has(value)) count += 1
  })

  return count
}

function tokenSet(text: string) {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'that',
    'this',
    'into',
    'where',
    'when',
    'what',
    'are',
    'you',
    'your',
    'dream',
    'vibe',
    'story',
    'stories',
  ])

  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  )
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
.dream-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 1rem;
}

.dream-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.dream-row > * {
  min-width: min(240px, 85vw);
  max-width: 360px;
}
</style>
