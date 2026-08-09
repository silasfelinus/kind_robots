<!-- /components/dreams/dream-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-2 overflow-hidden rounded-2xl bg-base-300/60 p-2"
  >
    <!--
      `relative z-30` so the tooltips escape. These controls are DaisyUI
      `tooltip tooltip-bottom`, which paints its bubble in a pseudo-element at a
      low z-index and DOWNWARD -- straight into the gallery below. Two things
      then bury it: this header's own `backdrop-blur` opens a stacking context,
      and kr-gallery's mode bar is `sticky top-0 z-20`. Silas, 2026-08-07: "the
      mine only and show archived toggles have poor z-index on the info popup
      and are hiding behind the gallery."

      z-30 clears the sticky bar's z-20; `relative` is what makes the z-index
      apply at all on a static element.
    -->
    <header
      v-if="showToolbar && !isDropdownMode"
      class="relative z-30 shrink-0 rounded-2xl border border-base-300 bg-base-100/95 px-2 py-2 shadow-sm backdrop-blur"
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

        <!--
          ERRORS ONLY. This slot used to render `statusLine` --
          "48/48 shown • 48 active • No Dream selected" -- which Silas called
          out on 2026-08-07: "all redundant info and can be killed." He is
          right on every clause. The count badge beside the title already
          carries the visible number; "48 active" restates it whenever nothing
          is filtered; and "No Dream selected" describes the absence of a thing
          whose presence is already obvious from the cards.

          An error is NOT redundant, so the slot survives for that alone, at
          every width rather than splitting into a desktop line plus a
          mobile-only twin.
        -->
        <p
          v-if="dreamStore.error"
          class="min-w-0 flex-1 truncate text-xs font-medium text-error"
          :title="dreamStore.error"
        >
          {{ dreamStore.error }}
        </p>

        <!--
          Search is an ICON until asked for, at EVERY width. It used to expand
          permanently at sm+, on the reasoning that wide screens have room --
          but room is not the same as needing to spend it, and a permanently
          open `min-w-60 flex-1` input pushes the type filter and the toggles
          toward a wrap on exactly the 1366x768 laptop this stage is fixing.
          Silas, 2026-08-07: "Search should be an icon."

          The icon still turns secondary while a query is active, so a filtered
          list never looks unfiltered just because the box is closed.
        -->
        <button
          v-if="showControls && !searchOpen"
          type="button"
          class="btn btn-sm h-9 shrink-0 rounded-2xl"
          :class="searchQuery ? 'btn-secondary' : 'btn-outline'"
          aria-label="Search Dreams"
          @click="openSearch"
        >
          <Icon name="kind-icon:search" class="h-4 w-4" />
        </button>

        <label
          v-if="showControls"
          class="input input-bordered input-sm h-9 items-center gap-2 rounded-2xl bg-base-200 sm:min-w-60 sm:flex-1 lg:max-w-md"
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

        <!--
          ICON TOGGLES, not a dropdown. Silas, 2026-08-07: "types dropdown would
          be better as icon toggles." A <select> hides every option but one, so
          the shape of the collection -- which types exist, how they divide --
          is invisible until you open it. The toggles show it at rest, and the
          list is short because `dreamTypes` is derived from the Dreams actually
          present rather than from the full DreamType enum.

          Icon-only with the label as tooltip and accessible name: ten labelled
          buttons would be the row this change exists to save.
        -->
        <div
          v-if="showControls"
          class="flex shrink-0 flex-wrap items-center gap-0.5"
          role="group"
          aria-label="Dream type filter"
        >
          <button
            type="button"
            class="btn btn-sm h-9 w-9 rounded-2xl p-0"
            :class="selectedType === 'all' ? 'btn-primary' : 'btn-ghost'"
            :aria-pressed="selectedType === 'all'"
            title="All types"
            aria-label="All types"
            @click="selectedType = 'all'"
          >
            <Icon name="kind-icon:cards" class="h-4 w-4" />
          </button>

          <button
            v-for="type in dreamTypes"
            :key="type"
            type="button"
            class="btn btn-sm h-9 w-9 rounded-2xl p-0"
            :class="selectedType === type ? 'btn-primary' : 'btn-ghost'"
            :aria-pressed="selectedType === type"
            :title="dreamTypeLabel(type)"
            :aria-label="dreamTypeLabel(type)"
            @click="selectedType = type"
          >
            <Icon :name="dreamTypeIcon(type)" class="h-4 w-4" />
          </button>
        </div>

        <!-- The Cards/Heroes/Icons bar used to live HERE, hand-rolled, while
             the other six galleries used kr-gallery's. Silas, 2026-08-04: "I
             wouldn't be clicking the layout options on one side of the screen
             for one and the other for, well, you know you can extrapolate."
             One control, one place, all seven — so it now comes from the
             shared shell below like everywhere else. -->

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

    <kr-card-flip v-model="infoDreamOpen" :label="infoDream?.title || 'Dream'">
      <template #back="{ close, commit }">
        <kr-card-back
          v-if="infoDream"
          v-model:editing="infoDreamEditing"
          :title="infoDream.title || 'Untitled Dream'"
          :subtitle="infoDream.flavorText || ''"
          :description="infoDream.description || infoDream.pitch || ''"
          :art-src="infoDream.imagePath || ''"
          :badges="infoDreamBadges"
          :can-edit="true"
          :can-interact="true"
          interact-label="Open"
          @back="commit"
          @interact="interactWithInfoDream"
        >
          <template #details>
            <dl class="grid grid-cols-2 gap-2 text-xs">
              <div v-if="infoDream.pitch" class="col-span-2">
                <dt class="font-black uppercase opacity-55">Pitch</dt>
                <dd class="whitespace-pre-wrap">{{ infoDream.pitch }}</dd>
              </div>
              <div v-if="infoDream.dreamType">
                <dt class="font-black uppercase opacity-55">Type</dt>
                <dd>{{ infoDream.dreamType }}</dd>
              </div>
              <div v-if="infoDream.flavorText" class="col-span-2">
                <dt class="font-black uppercase opacity-55">Flavor</dt>
                <dd class="whitespace-pre-wrap">{{ infoDream.flavorText }}</dd>
              </div>
            </dl>
          </template>

          <!-- The same dream-maker the dreammaker TAB used to render. It edits
               whatever dreamStore holds, which the watch above loads first. -->
          <template #edit="{ done }">
            <dream-maker @saved="done" @created="done" />
          </template>
        </kr-card-back>

        <div v-else class="p-6 text-center text-sm opacity-60">
          <p>That Dream is no longer available.</p>
          <button
            type="button"
            class="btn btn-ghost btn-sm mt-3 rounded-xl"
            @click="close"
          >
            Close
          </button>
        </div>
      </template>
    </kr-card-flip>

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
            @open="selectDreamAndOpen"
            @edit="startEditingDreamById"
            @delete="handleDreamDeleted"
          />
        </div>

        <!-- t-060: the shared shell owns the grid; dream-card stays the card.
             :mode is bound so the shell picks the right MODE_GRID_CLASS, and
             :modes="[]" hides ITS bar because this gallery already renders one
             in its toolbar above -- two bars driving one mode would be worse
             than none.

             THE PROP WAS MISSING. The comment above described the intent and
             the binding was never written, so /dreams shipped with TWO mode
             pickers: this gallery's button group in the toolbar and the shell's
             own bar underneath it. Both drove `galleryMode`, so they stayed in
             sync and nothing looked broken -- it just cost a whole row on the
             busiest route, which is exactly the vertical budget Silas flagged
             on 2026-08-07. Found while auditing gallery chrome, not by the
             contract: "does it mount kr-gallery" cannot see a duplicated
             control. -->
        <kr-gallery
          v-else
          :items="galleryItems"
          :mode="galleryMode"
          :modes="[]"
          empty-label="dreams"
          @update:mode="galleryMode = $event"
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
              @open="selectDreamAndOpen"
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
  MODE_GRID_CLASS,
  MODE_VARIANT,
  type GalleryMode,
} from '@/utils/galleryVocabulary'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

// Earned karma comes from useEarnedKarma (t-066); the scoping decision below
// is t-048's and is unchanged.
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

/** Which stored art the current mode asks dream-card for. */
const modeVariant = computed(() => MODE_VARIANT[galleryMode.value])

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
// set, so re-fetching on every keystroke would be wasted work. dream-gallery
// has no paging concept (unlike art-gallery's pagedActiveImages), so the
// broader galleryDreams set (filtered by ownership/mature/archived, not yet by
// type/search) is the closest equivalent to a "rendered page".
const { earnedKarma: earnedKarmaByDreamId } = useEarnedKarma('dream', () =>
  galleryDreams.value.map((dream) => dream.id),
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
/*
 * Icons is a browse view: a text-forward row whose art is a 3rem square.
 * Three floating action circles over that is the "cramped displays" Silas
 * photographed -- the buttons were larger than the artwork. Actions stay on
 * Cards and Heroes, where there is room for them.
 */
const dreamCardProps = computed(() => ({
  compact: isCompact.value,
  showImage: props.showImages,
  showActions: props.showCardActions && galleryMode.value !== 'icons',
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

/*
 * One icon per DreamType. Every name here is verified against assets/icons --
 * an Icon whose name does not resolve renders a broken glyph rather than
 * failing loudly, so guessing is expensive. `wish` and `brainstorm` have no
 * same-named file; `magic` and `brain` are the closest real ones.
 *
 * Unknown types fall back to the generic Dream glyph rather than to nothing:
 * dreamTypes is built from live data, so a value added to the enum shows up
 * here before anyone updates this map.
 */
const DREAM_TYPE_ICON: Record<string, string> = {
  ART: 'kind-icon:art',
  BRAINSTORM: 'kind-icon:brain',
  PROMPTBOT: 'kind-icon:robot',
  NARRATOR: 'kind-icon:story',
  CHARACTER: 'kind-icon:mask',
  REWARD: 'kind-icon:gift',
  SCENARIO: 'kind-icon:map',
  LOCATION: 'kind-icon:map',
  PITCH: 'kind-icon:pitch',
  WISH: 'kind-icon:magic',
}

function dreamTypeIcon(type?: string | null): string {
  return DREAM_TYPE_ICON[String(type || '').toUpperCase()] || 'kind-icon:dream'
}

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

/*
 * EDITING HAPPENS ON THE CARD, like every other object.
 *
 * This used to load the record and then send you to the DREAMMAKER TAB --
 * `navStore.setDashboardTab('dream', 'dreammaker')` -- so editing a Dream
 * navigated away from the grid you were reading, and the only thing that
 * justified it was that Dreams had always worked that way. Silas, 2026-08-09:
 * "consistency is great without a solid reason, and I don't think this one is
 * anything but 'that's how we did it before'. (Tradition is a terrible
 * excuse, imo)".
 *
 * dream-maker still edits whatever dreamStore is holding, so the load has to
 * happen BEFORE the form appears -- same reason bot-gallery loads through
 * startEditingBot when its panel enters edit mode. Opening the form against a
 * stale editing target is how you save changes onto the wrong Dream.
 *
 * The `editing` emit survives: a host may still want to know, and dropping it
 * would be a silent contract break for anything listening.
 */
async function startEditingDreamById(id: number) {
  const dream = await dreamStore.startEditingDream(id)

  if (!dream) return

  infoDreamId.value = id
  infoDreamEditing.value = true
  emit('editing', dream)
}

/*
 * INFO FIRST, INTERACTION AFTER -- the frame Bots, Resources, Rewards,
 * Characters and Scenarios all use now.
 *
 * THE DROPDOWN BRANCH COMES FIRST, as everywhere else: this gallery is also
 * embedded as a picker, where a click has to pick and nothing else.
 */
const infoDreamId = ref<number | null>(null)
const infoDreamEditing = ref(false)

const infoDream = computed(
  () =>
    dreamStore.dreams.find((entry) => entry.id === infoDreamId.value) ?? null,
)

const infoDreamOpen = computed({
  get: () => infoDreamId.value !== null,
  set: (value: boolean) => {
    if (!value) {
      infoDreamId.value = null
      infoDreamEditing.value = false
    }
  },
})

const infoDreamBadges = computed(() => {
  const dream = infoDream.value
  if (!dream) return []

  return [
    dream.dreamType,
    dream.isMature ? '18+' : '',
    dream.isPublic ? 'Public' : '',
  ]
    .map((entry) => String(entry ?? '').trim())
    .filter((entry) => entry.length > 0)
})

/* Interact LEAVES: opening a Dream is the old selectDreamAndOpen path. */
async function interactWithInfoDream() {
  const id = infoDreamId.value
  infoDreamOpen.value = false
  if (id) await selectDreamAndOpen(id)
}

/* Loading before the form appears, for the same reason as the edit entry. */
watch(infoDreamEditing, async (isEditing) => {
  if (!isEditing || !infoDreamId.value) return
  await dreamStore.startEditingDream(infoDreamId.value)
})

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
