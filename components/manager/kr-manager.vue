<!-- /components/manager/kr-manager.vue -->
<!--
  THE SHARED MANAGER SHELL — the layout every primary-model dashboard wears.

  WHY THIS EXISTS
  ---------------
  Silas, 2026-08-06: "We're supposed to be making consistent bespoke components
  so every piece, especially our main models, follows the same high quality and
  consistent layout ... If we are just tweaking individual managers and looking
  for extra galleries, then we're going to keep reinforcing the same problems:
  that the site is a hodgepodge of individually created llm sites that don't
  agree on layout."

  He was describing the measured state exactly. The six core managers were one
  component, hand-copied and then separately edited:

    - bot-manager and character-manager carried CHARACTER-FOR-CHARACTER
      identical tab-resolution blocks -- same 35 lines, same names, same order.
    - reward-manager reimplemented the same logic a third way (its own tab
      union, its own array, reading navStore.dashboardShell.dashboardKey rather
      than isDashboardTabKey). facet-manager had a fourth variant.
    - All of them opened with the same root shell string.
    - And then FOUR different loading/error banners. scenario-manager said
      "Loading weirdness from the database..." with a Try Again button;
      dream-manager used an icon-only tooltip refresh at text-xs; bot, reward
      and character shared a third at text-sm shadow.

  Every model agreed on the SCRIPT contract (isLoadingManager, managerError,
  refreshManagerData, activeTab). Only the LAYOUT had been re-invented, which is
  the precise shape of the complaint.

  THE BUG THIS ACTUALLY FIXES
  ---------------------------
  /facets shipped with two Facet browsers: the Gallery tab through
  facet-gallery -> kr-gallery, and a SECOND hand-rolled
  `<article v-for="facet in filteredFacets">` card grid inside facet-manager's
  Library tab, whose only click target expanded an editor inside the grid cell
  and which linked to the canonical profile from nowhere.

  That was possible because nothing owned manager layout. A free-form manager
  always has somewhere to put a rival grid. Converting galleries one at a time
  would have left the generator running -- so the fix is structural: the shell
  owns the frame, the model fills the slots, and there is no free space to
  hand-roll a second browser into.

  WHAT THIS OWNS, AND WHAT IT DOES NOT
  ------------------------------------
  Owns:   the root shell, the one status banner, tab resolution, the two pane
          shapes, and the unknown-tab recovery.
  Leaves: data. The model owns its store, its fetch, and its error text — this
          shell takes `loading`/`error` and emits `refresh`, exactly as
          kr-gallery takes `items` and emits `update:mode`. Reaching for a
          store here would make it undroppable into seven different models,
          which is the mistake kr-gallery is guarded against by
          verifyGalleryAdoption.ts.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <!--
      ONE status banner. It appears only while loading or after a failure, so
      the common case costs no vertical space — that was true of every variant
      this replaces and is worth keeping. The refresh control is always present
      when the banner is, because the four originals disagreed about whether a
      user could retry a plain load or only an error.
    -->
    <div
      v-if="loading || error"
      class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 text-sm shadow"
      :class="
        error ? 'border-error/40 bg-error/10' : 'border-base-300 bg-base-100'
      "
      role="status"
      aria-live="polite"
    >
      <p
        class="min-w-0 flex-1"
        :class="error ? 'text-error' : 'text-base-content/70'"
      >
        {{ error || loadingLabel }}
      </p>

      <button
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="error ? 'btn-error' : 'btn-ghost'"
        :disabled="loading"
        @click="emit('refresh')"
      >
        <span v-if="loading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
        Refresh
      </button>
    </div>

    <!--
      Content that outlives the tab switch.

      The one deliberate hole in "the shell owns the frame", and it is narrow
      on purpose: dream-manager renders its daily-dream generator above every
      tab. Anything that belongs to a single tab goes in that tab's slot -- a
      grid here would be a rival browser on every tab at once, which is the
      failure this component exists to prevent.
    -->
    <slot name="persistent" />

    <!--
      THE ACTIVE PANE, in one of exactly two shapes.

      `flush`  the child owns its own scrolling — the browse tabs, where
               <model>-interact insets a gallery that is already a scroll owner.
               A second scroll container here is what produced the nested
               double-scrollbars the layout contract forbids.
      `panel`  this shell scrolls, inside a padded card — the form tabs, where
               the content is a plain document that would otherwise run off the
               bottom of a fixed-height flex child.

      Declared once per manager via `panelTabs` rather than by each slot
      wrapping itself, because a slot that brings its own wrapper is how the
      shapes diverged the first time.
    -->
    <section
      v-if="renderedTab"
      :key="renderedTab"
      :class="
        isPanelTab(renderedTab)
          ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-base-300 bg-base-100 p-4'
          : 'flex h-full min-h-0 flex-1 flex-col overflow-hidden'
      "
    >
      <!--
        THE PANEL HEADER COMES FROM THE CONFIG, not from the manager.

        dashboardHelper already carries `title`, `summary` and `icon` for every
        tab, and every manager was hand-writing its own copy on top of that —
        differently. reward-manager's Add tab said "Add Reward / Create a skill,
        item, pet, boon, curse, magic favor, or narrative plot grenade" while
        its config said "Reward Generator / Create fresh skills, items, powers,
        pets, and more." Two sources for one string is two strings.

        So the wording lives in one place. A manager that wants different copy
        edits the config, which is also what the ⌘K palette and the tab strip
        read — so the change lands everywhere at once instead of in one panel.

        Only PANEL tabs get this. Flush tabs inset a gallery or workspace that
        renders its own chrome, and the page frontmatter already supplies the
        page title — the brief's one-header rule.
      -->
      <header
        v-if="isPanelTab(renderedTab) && tabConfig"
        class="mb-4 flex items-start justify-between gap-3"
      >
        <div class="flex min-w-0 items-start gap-3">
          <Icon
            v-if="tabConfig.icon"
            :name="tabConfig.icon"
            class="mt-1 size-6 shrink-0 text-primary"
          />
          <div class="min-w-0">
            <h2 class="text-xl font-black text-primary">
              {{ tabConfig.title }}
            </h2>
            <p
              v-if="tabConfig.summary"
              class="mt-1 text-sm text-base-content/60"
            >
              {{ tabConfig.summary }}
            </p>
          </div>
        </div>

        <button
          class="btn btn-ghost btn-sm shrink-0 rounded-xl"
          type="button"
          @click="goToDefaultTab"
        >
          <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">{{ defaultTabLabel }}</span>
        </button>
      </header>

      <slot :name="renderedTab" :tab="renderedTab" />
    </section>

    <!--
      A tab the manager declares no slot for. bot-manager alone had this
      recovery and it is the correct behaviour for all of them: a stale
      localStorage tab key, or a dashboardHelper entry added ahead of its slot,
      otherwise renders an empty page with no way out.
    -->
    <div
      v-else
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-center text-warning"
    >
      <Icon name="kind-icon:warning" class="h-10 w-10" />

      <div>
        <p class="text-lg font-black">Unknown tab: {{ activeTab }}</p>
        <p class="mt-1 text-sm opacity-80">Expected one of: {{ slotTabs }}</p>
      </div>

      <button
        class="btn btn-warning btn-sm rounded-xl"
        type="button"
        @click="goToDefaultTab"
      >
        Go to {{ defaultTabLabel }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useSlots, watch } from 'vue'
import { useNavStore } from '@/stores/navStore'
import {
  getDashboardConfig,
  getDashboardDefaultTab,
  getDashboardTabConfig,
  getDashboardTabs,
  isDashboardTabKey,
  type DashboardKey,
} from '@/stores/helpers/dashboardHelper'

const props = withDefaults(
  defineProps<{
    /** The dashboardHelper entry that owns this model's tabs. */
    dashboardKey: DashboardKey
    loading?: boolean
    /** Null/empty means no failure. The model owns the wording. */
    error?: string | null
    loadingLabel?: string
    /** Tabs that render in a padded, shell-scrolled panel rather than flush. */
    panelTabs?: readonly string[]
    /**
     * Legacy tab keys to rewrite, `stored -> canonical`.
     *
     * Only for values that must land on a NON-default tab: anything unknown
     * already falls back to the default, so a migration only needs entries
     * that would otherwise lose the user's intent. dream renamed its maker tab
     * and carries `{ add: 'dreammaker', maker: 'dreammaker' }` so a stale
     * localStorage key still opens the maker rather than the browse tab.
     */
    aliases?: Readonly<Record<string, string>>
  }>(),
  {
    loading: false,
    error: null,
    loadingLabel: 'Loading...',
    panelTabs: () => [],
    aliases: () => ({}),
  },
)

/*
 * `tab` fires with the rendered tab on mount and on every change.
 *
 * Tab resolution moved into this shell, but a manager can still need to know:
 * scenario-manager preps a blank form exactly once per entry into its "+" tab,
 * without clobbering an unsaved draft. Emitting it keeps that possible without
 * the manager re-deriving the tab from navStore -- which is the duplication
 * this component exists to delete.
 */
const emit = defineEmits<{ refresh: []; tab: [tab: string] }>()

const navStore = useNavStore()
const slots = useSlots()

/*
 * ONE tab resolution, replacing three.
 *
 * The persisted value is untrusted input — a tab key can outlive the config
 * that defined it — so it is validated against dashboardHelper before use and
 * falls back to the declared default rather than rendering nothing.
 */
const activeTab = computed(() => {
  const stored = navStore.getDashboardTab(props.dashboardKey)
  const selected = props.aliases[stored] ?? stored
  return isDashboardTabKey(props.dashboardKey, selected)
    ? selected
    : getDashboardDefaultTab(props.dashboardKey)
})

const isPanelTab = (tab: string): boolean => props.panelTabs.includes(tab)

/**
 * The tab actually rendered.
 *
 * Not always the active one. A dashboard config can carry tabs that live on
 * OTHER routes -- scenario declares storybook, taskmaster and serendipity,
 * each with its own `route`, and selecting one navigates away rather than
 * rendering here. A stale persisted value for such a tab would otherwise leave
 * this manager with nothing to draw.
 *
 * scenario-manager handled that with a bare `v-else` that collapsed every
 * unknown tab to its gallery; this preserves that behaviour for every manager
 * instead of just the one, and keeps the error pane for the genuinely
 * unrecoverable case where even the default tab has no slot.
 */
const renderedTab = computed<string | null>(() => {
  if (hasSlot(activeTab.value)) return activeTab.value

  const fallback = getDashboardDefaultTab(props.dashboardKey)
  if (hasSlot(fallback)) {
    console.warn(
      `\u26A0\uFE0F ${props.dashboardKey} manager has no slot for tab "${activeTab.value}" -- showing "${fallback}"`,
    )
    return fallback
  }
  return null
})

/** The rendered tab's config row, which supplies the panel header's copy. */
const tabConfig = computed(() =>
  renderedTab.value
    ? getDashboardTabConfig(props.dashboardKey, renderedTab.value)
    : null,
)

const hasSlot = (tab: string): boolean => Boolean(slots[tab])

/** What the manager actually implements, for the unknown-tab message. */
const slotTabs = computed(() => Object.keys(slots).sort().join(', '))

const defaultTabLabel = computed(() => {
  const fallback = getDashboardDefaultTab(props.dashboardKey)
  return (
    getDashboardTabs(props.dashboardKey).find((tab) => tab.key === fallback)
      ?.label || getDashboardConfig(props.dashboardKey).label
  )
})

watch(
  renderedTab,
  (tab) => {
    if (tab) emit('tab', tab)
  },
  { immediate: true },
)

function goToDefaultTab(): void {
  navStore.setDashboardTab(
    props.dashboardKey,
    getDashboardDefaultTab(props.dashboardKey),
    'kr-manager unknown-tab recovery',
  )
}
</script>
