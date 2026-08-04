<!-- /components/dreams/dream-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden rounded-2xl bg-base-300/60 p-2"
  >
    <header
      v-if="showToolbar && !isDropdownMode"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100/95 px-2 py-2 shadow-sm backdrop-blur"
    >
      <!-- Wraps, rather than scrolling sideways. This row used to be
           `overflow-x-auto whitespace-nowrap` with shrink-0 controls, so on a
           tablet the view picker sat off the right edge behind a scrollbar
           nobody found -- Silas reviewed /dreams and reported the control as
           "cut off on the right side" without knowing the modes existed. A
           hidden control is a missing control.

           The picker is a button group rather than a <select> for the same
           reason: a dropdown hides every option but one, and the four views
           are the point. -->
      <div class="kr-toolbar min-w-0">
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

        <!-- Truncates to "41/41 shown • 41 active • N..." on a phone, where it
             says nothing and still claims a min-w-28 flex-1 slot that forces a
             wrap. The count badge above already carries the useful number. -->
        <p
          class="hidden min-w-28 max-w-72 flex-1 truncate text-xs font-medium text-base-content/60 sm:block"
          :class="dreamStore.error ? 'text-error' : ''"
          :title="dreamStore.error || statusLine"
        >
          {{ dreamStore.error || statusLine }}
        </p>

        <!-- The error still has to reach a phone, so it gets its own line
             rather than riding on the status paragraph that mobile hides. -->
        <p
          v-if="dreamStore.error"
          class="w-full truncate text-xs font-medium text-error sm:hidden"
          :title="dreamStore.error"
        >
          {{ dreamStore.error }}
        </p>

        <!-- Search is an icon until asked for. A full-width input costs an
             entire toolbar row on a phone for a control most visits never
             touch; at sm+ there is room, so it stays permanently expanded. -->
        <button
          v-if="showControls && !searchOpen"
          type="button"
          class="btn btn-sm h-9 shrink-0 rounded-2xl sm:hidden"
          :class="searchQuery ? 'btn-secondary' : 'btn-outline'"
          aria-label="Search Dreams"
          @click="openSearch"
        >
          <Icon name="kind-icon:search" class="h-4 w-4" />
        </button>

        <label
          v-if="showControls"
          class="input input-bordered input-sm h-9 items-center gap-2 rounded-2xl bg-base-200 sm:flex sm:min-w-60 sm:flex-1 lg:max-w-md"
          :class="searchOpen ? 'flex w-full' : 'hidden'"
        >
          <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            class="grow bg-transparent"
            type="search"
            aria-label="Search Dreams"
            placeholder="Search Dreams..."
            @blur="closeSearchIfEmpty"
          />
        </label>

        <select
          v-if="showControls"
          v-model="selectedType"
          class="select select-bordered select-sm h-9 w-24 shrink-0 rounded-2xl bg-base-200 sm:w-32"
          aria-label="Dream type filter"
        >
          <option value="all">All types</option>
          <option v-for="type in dreamTypes" :key="type" :value="type">
            {{ dreamTypeLabel(type) }}
          </option>
        </select>

        <!-- Named toggles at sm+ (Silas: "they would be perfect on larger
             displays"), single-letter below it. Four labelled buttons are
             ~260px of a 390px phone; four abbreviations are ~130px and keep
             every view one tap away, which a <select> would not. -->
        <div
          v-if="showControls"
          class="flex shrink-0 gap-0.5"
          role="group"
          aria-label="Dream gallery view"
        >
          <button
            v-for="mode in modeOptions"
            :key="mode.value"
            type="button"
            class="btn btn-sm h-9 rounded-2xl px-2 sm:px-3"
            :class="galleryMode === mode.value ? 'btn-primary' : 'btn-ghost'"
            :title="mode.label"
            :aria-label="mode.label"
            :aria-pressed="galleryMode === mode.value"
            @click="galleryMode = mode.value"
          >
            <span class="sm:hidden">{{ mode.abbr }}</span>
            <span class="hidden sm:inline">{{ mode.label }}</span>
          </button>
        </div>

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
            v-if="dreamStore.creativeDreams.length > 0"
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

        <!-- Row stays bespoke: `dream-row` is a horizontal scroll-snap
             filmstrip, not one of kr-gallery's cards/heroes/icons grids. -->
        <div v-if="isRowMode" :class="layoutClass">
          <dream-card
            v-for="dream in filteredDreams"
            :key="dream.id"
            :dream="dream"
            :selected="dreamStore.selectedDream?.id === dream.id"
            :is-selected="dreamStore.selectedDream?.id === dream.id"
            :variant="modeVariant"
            :earned-karma="earnedKarmaByDreamId[dream.id]"
            v-bind="dreamCardProps"
            @choose="selectDreamAndOpen"
            @edit="startEditingDreamById"
            @delete="handleDreamDeleted"
          />
        </div>

        <!-- t-060: the shared shell owns the grid; dream-card stays the card.
             :mode is bound so the shell picks the right MODE_GRID_CLASS, and
             :modes="[]" hides ITS bar because this gallery already renders one
             in its toolbar above -- two bars driving one mode would be worse
             than none. -->
        <kr-gallery
          v-else
          :items="galleryItems"
          :mode="galleryMode"
          :modes="[]"
          empty-label="dreams"
        >
          <template #item="{ item }">
            <dream-card
              v-if="dreamById.get(Number(item.id))"
              :dream="dreamById.get(Number(item.id))!"
              :selected="dreamStore.selectedDream?.id === item.id"
              :is-selected="dreamStore.selectedDream?.id === item.id"
              :variant="modeVariant"
              :earned-karma="earnedKarmaByDreamId[Number(item.id)]"
              v-bind="dreamCardProps"
              @choose="selectDreamAndOpen"
              @edit="startEditingDreamById"
              @delete="handleDreamDeleted"
            />
          </template>
        </kr-gallery>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type {
  ArtImage,
  Character,
  Reward,
  Scenario,
} from '~/prisma/generated/prisma/client'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import {
  GALLERY_MODES,
  MODE_GRID_CLASS,
  MODE_VARIANT,
  type GalleryMode,
} from '@/utils/galleryVocabulary'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

// interface-vision/t-048: batch-fetch earned karma for the broader visible
// set (pre type/search refinement, same "don't re-fetch on every keystroke"
// scoping as reward-gallery's reference wiring — see
// components/rewards/reward-gallery.vue and
// server/api/economy/karma-earned.post.ts for the endpoint). dream-gallery
// has no paging concept (unlike art-gallery's pagedActiveImages), so the
// broader galleryDreams set (filtered by ownership/mature/archived, not yet
// by type/search) is the closest equivalent to a "rendered page".
const KARMA_EARNED_BATCH_LIMIT = 200

type KarmaEarnedRow = {
  refType: string
  refId: string
  earnedKarma: number
}

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
const galleryMode = ref<GalleryMode>('cards')

/**
 * Mobile-only: the search field starts collapsed to its icon and expands on
 * tap. At sm+ the label is permanently visible via CSS, so this flag is
 * irrelevant there and never needs to be set.
 */
const searchOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)

function openSearch(): void {
  searchOpen.value = true
  // The input does not exist until the flag flips, so focus after the patch.
  nextTick(() => searchInput.value?.focus())
}

function closeSearchIfEmpty(): void {
  // Re-collapse only when nothing was typed; a live query must stay visible or
  // the list looks filtered for no discoverable reason.
  if (!searchQuery.value) searchOpen.value = false
}

/** All four. dream-card honours each via its `variant` prop. */
const modeOptions = GALLERY_MODES

/** Which stored art the current mode asks dream-card for. */
const modeVariant = computed(() => MODE_VARIANT[galleryMode.value])
const earnedKarmaByDreamId = ref<Record<number, number>>({})

const isDropdownMode = computed(() => props.variant === 'dropdown')
const isRowMode = computed(() => props.variant === 'row')

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

/**
 * `dream-row` is a horizontal scroll-snap FILMSTRIP, and it exists only for the
 * embedded `variant="row"` prop — a Dream strip sitting inside another page.
 * It is not a view mode and must never be reachable from the mode toggle. A
 * previous pass wired the old `list` mode to it, which put a horizontal
 * carousel behind a button labelled List; `list` has since been removed
 * entirely, but the rule outlives it — a layout is not a mode.
 *
 * The three real modes lay out through the shared MODE_GRID_CLASS, so Dreams
 * matches the Project gallery exactly.
 */
const layoutClass = computed(() =>
  props.variant === 'row' ? 'dream-row' : MODE_GRID_CLASS[galleryMode.value],
)

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
  let dreams = dreamStore.creativeDreams ?? []

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

// Pre search/type refinement — those filters only narrow an already-fetched
// set, so re-fetching on every keystroke would be wasted work.
const visibleDreamIdsKey = computed(() =>
  galleryDreams.value
    .slice(0, KARMA_EARNED_BATCH_LIMIT)
    .map((dream) => dream.id)
    .join(','),
)

async function refreshEarnedKarma() {
  const ids = galleryDreams.value
    .slice(0, KARMA_EARNED_BATCH_LIMIT)
    .map((dream) => dream.id)

  if (!ids.length) {
    earnedKarmaByDreamId.value = {}
    return
  }

  const res = await performFetch<KarmaEarnedRow[]>(
    '/api/economy/karma-earned',
    {
      method: 'POST',
      body: JSON.stringify({
        items: ids.map((id) => ({ refType: 'dream', refId: id })),
      }),
    },
  )

  if (!res.success || !Array.isArray(res.data)) return

  const next: Record<number, number> = {}

  for (const row of res.data) {
    const id = Number(row.refId)
    if (Number.isFinite(id)) next[id] = row.earnedKarma
  }

  earnedKarmaByDreamId.value = next
}

watch(
  visibleDreamIdsKey,
  () => {
    void refreshEarnedKarma()
  },
  { immediate: true },
)

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

/*
 * interface-vision t-060 — the last of the seven. The grid renders through the
 * shared kr-gallery shell while dream-card stays the card, so t-064's
 * reactions, earned karma and edit/archive actions survive. This gallery
 * already drove MODE_GRID_CLASS and dream-card's `variant` itself, so adopting
 * the shell is mostly handing over markup it was duplicating.
 */
const galleryItems = computed<GalleryItem[]>(() =>
  filteredDreams.value.map((dream) => ({
    id: dream.id,
    title: dream.title || `Dream ${dream.id}`,
    source: dream,
  })),
)

/** Slot props give back a GalleryItem, so map the id to the real record. */
const dreamById = computed(
  () => new Map(filteredDreams.value.map((d) => [d.id, d])),
)

/** The card's shared props in one place so row and grid cannot drift. */
const dreamCardProps = computed(() => ({
  compact: isCompact.value,
  showImage: props.showImages,
  showActions: props.showCardActions,
  showDescription: props.showDescriptions,
  showMeta: props.showMeta,
  showStats: props.showStats,
  showDebug: props.showDebug,
  allowEdit: props.allowEdit,
  allowDelete: props.allowDelete,
  showPitchSheetPreview: props.showPitchSheetPreview,
  loadPitchSheetPreview: props.autoLoadSheets,
  imageFit: 'cover' as const,
}))

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

  const total = dreamStore.creativeDreams.length
  const visible = filteredDreams.value.length
  const active = dreamStore.activeDreams?.length ?? galleryDreams.value.length
  const hidden = Math.max(total - visible, 0)
  const hiddenText = hidden ? ` • ${hidden} hidden` : ''

  return `${visible}/${total} shown • ${active} active${hiddenText} • ${selected}`
})

const exclusionSummary = computed(() => {
  const allDreams = dreamStore.creativeDreams ?? []
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
  if (dreamStore.creativeDreams.length === 0) {
    return 'No Dreams loaded.'
  }

  return `${dreamStore.creativeDreams.length} Dreams loaded, but none match this gallery.`
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

  if (reasons.length === 0 && dreamStore.creativeDreams.length > 0) {
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
    const shouldForceFetch = force || dreamStore.creativeDreams.length === 0

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
/* Retained for callers asking for the legacy grid directly; the mode toggle
   now lays out through the shared MODE_GRID_CLASS instead. Widened from 220px,
   which read as cramped on a wide screen. */
.dream-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 1rem;
  align-items: stretch;
}

.dream-grid > * {
  min-height: 24rem;
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
