<!-- /components/navigation/tab-select.vue -->
<!--
  THE ACTIVE TAB IS THE CONTROL. Silas, 2026-08-10:

    "we need to combine the tab title and the tab selector, we don't need two
     icons, clicking the active tab title should get us the dropdown to change
     tabs"

  WHAT THIS REPLACES
  ------------------
  A horizontal strip of every tab, plus two chevron scrollers, plus a separate
  map-icon dropdown that listed the same tabs again. Three controls and a
  scrolling viewport to say one thing -- which tab you are on -- and to offer
  one action -- go to another one. The strip was also the single largest
  consumer of header width, and every crowding fix this stage has shipped
  (thinner chevrons, shrinkable channel-select, a min-width floor, capacity
  arithmetic, measured control density) was ultimately paying rent on it.

  A dropdown says the same thing in the width of one tab and offers the same
  action in one click. The whole capacity-and-density apparatus went with it,
  because there is no longer a variable-width strip to starve: this component's
  width follows its label, and the label is one tab's worth of text.

  Presentational and controlled, like the rest of components/navigation: the
  header owns tab resolution and routing, this owns the popover. That keeps the
  `?tab=` disambiguation rule (several tabs can share a route) in the one place
  that already implements it.

  The list itself is ChannelTabList, the same component channel-select expands
  inline -- so picking a tab from here and picking one from the channel menu are
  literally the same widget, not two lists that drift.
-->
<template>
  <div class="tab-select dropdown dropdown-start min-w-0">
    <button
      ref="trigger"
      tabindex="0"
      type="button"
      class="flex h-full min-h-10 w-full min-w-0 items-center gap-2 rounded-r-xl px-2 text-left transition hover:bg-base-200 xl:gap-2.5 xl:px-3"
      :title="`Change tab — currently ${activeTab?.label || 'none'}`"
      :aria-label="`Change tab — currently ${activeTab?.label || 'none'}`"
      aria-haspopup="menu"
      @click="measurePanel"
      @focus="measurePanel"
    >
      <span
        class="kr-icon-8 flex shrink-0 items-center justify-center rounded-lg border border-base-300/70 bg-base-200 sm:h-9 sm:w-9 xl:h-10 xl:w-10"
      >
        <Icon
          :name="activeTab?.icon || channel.icon"
          class="kr-icon-4 shrink-0 xl:h-5 xl:w-5"
        />
      </span>

      <span class="kr-text-black-sm min-w-8 flex-1 truncate sm:text-base">
        {{ activeTab?.label || channel.label }}
      </span>

      <!--
        The only chevron left in this row, and it is part of the label rather
        than a control of its own. It is what tells you the title is clickable —
        without it this reads as the old static title, which is exactly the
        thing that made people look for a separate selector.
      -->
      <Icon
        name="kind-icon:chevron-down"
        class="h-3.5 w-3.5 shrink-0 text-base-content/50 xl:h-4 xl:w-4"
      />
    </button>

    <div
      tabindex="0"
      class="dropdown-content z-120 mt-2 overflow-y-auto kr-panel-flat p-2 shadow-2xl"
      :style="{
        width: `${panelWidth}px`,
        maxHeight: `${panelMaxHeight}px`,
      }"
      :aria-label="`${channel.label} tabs`"
    >
      <!--
        THE HIGHLIGHT USED TO BE WRONG HERE, and the cause is worth keeping.

        On /bots this list marked Dreams. Instrumenting one element showed
        `isActiveTab` computing FALSE for it while the DOM carried `active` --
        a decision and a class that disagreed inside a single render, which
        looked like a Vue patching anomaly and is why an earlier pass wrote it
        off as unexplained.

        It came from the server. app.vue renders workspace-header above
        <NuxtPage>, so during SSR the header resolved its channel and tab from
        a pageStore the page had not filled yet, and fell back to defaults --
        the HOME channel on a Play route, then Play's defaultTab once the
        channel was fixed. Hydration reused those elements, patched their text
        and attributes, and left the server`s `active` on the first row. Always
        position one, which is what made it look positional.

        workspace-header now resolves both channel and tab from `route.path`,
        which is identical on both sides, so the two renders agree and there is
        no mismatch to leave anything behind. Nothing here needed changing --
        recorded so the next person seeing a stale class in a hydrated list
        looks at what the server rendered before suspecting the renderer.
      -->
      <ChannelTabList
        :channel="channel"
        :active-channel-key="channel.channelKey"
        :active-tab-key="activeTabKey"
        :columns="1"
        :tab-columns="tabColumns"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'

const props = defineProps<{
  channel: ResolvedChannel
  activeTabKey: string
}>()

const emit = defineEmits<{ select: [tab: ResolvedTab] }>()

/*
 * USE THE ROOM THAT IS THERE. Silas, 2026-10-09: "we are condensing the list
 * of tabs on nav even when there's plenty of room." The panel was a fixed
 * 18-22rem column capped at 32rem tall, so Play's fifteen tabs scrolled inside
 * a sliver beside an empty desktop. It now measures the space right of and
 * below this control each time it opens: up to three columns of tabs, as tall
 * as the viewport allows, and still one column where a phone-sized gap is all
 * there is.
 */
const COLUMN_WIDTH = 288
const PANEL_PADDING = 16
const VIEWPORT_GUTTER = 12
const MIN_TABS_PER_COLUMN = 5

const trigger = ref<HTMLElement | null>(null)
const tabColumns = ref<1 | 2 | 3>(1)
const panelWidth = ref(COLUMN_WIDTH + PANEL_PADDING)
const panelMaxHeight = ref(512)

function measurePanel(): void {
  const element = trigger.value
  if (!element || typeof window === 'undefined') return

  const rect = element.getBoundingClientRect()
  const viewportBottom = window.visualViewport
    ? window.visualViewport.offsetTop + window.visualViewport.height
    : window.innerHeight
  const availableWidth = window.innerWidth - rect.left - VIEWPORT_GUTTER
  const fitColumns = Math.floor((availableWidth - PANEL_PADDING) / COLUMN_WIDTH)
  const neededColumns = Math.ceil(
    props.channel.tabs.length / MIN_TABS_PER_COLUMN,
  )
  const columns = Math.max(1, Math.min(3, fitColumns, neededColumns)) as
    1 | 2 | 3

  tabColumns.value = columns
  panelWidth.value = Math.min(
    columns * COLUMN_WIDTH + PANEL_PADDING,
    Math.max(availableWidth, 0),
  )
  panelMaxHeight.value = Math.max(
    240,
    Math.floor(viewportBottom - rect.bottom - VIEWPORT_GUTTER - 8),
  )
}

const activeTab = computed(
  () =>
    props.channel.tabs.find((tab) => tab.tabKey === props.activeTabKey) ??
    props.channel.tabs[0] ??
    null,
)
</script>
