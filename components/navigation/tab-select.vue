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
  <div class="tab-select dropdown dropdown-end min-w-0">
    <button
      tabindex="0"
      type="button"
      class="flex h-full min-h-10 w-full min-w-0 items-center gap-2 rounded-r-xl px-2 text-left transition hover:bg-base-200 xl:gap-2.5 xl:px-3"
      :title="`Change tab — currently ${activeTab?.label || 'none'}`"
      :aria-label="`Change tab — currently ${activeTab?.label || 'none'}`"
      aria-haspopup="menu"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-base-300/70 bg-base-200 sm:h-9 sm:w-9 xl:h-10 xl:w-10"
      >
        <Icon
          :name="activeTab?.icon || channel.icon"
          class="h-4 w-4 shrink-0 xl:h-5 xl:w-5"
        />
      </span>

      <span class="min-w-0 flex-1 truncate text-sm font-black sm:text-base">
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
      class="dropdown-content z-120 mt-2 w-[min(22rem,calc(100vw-1rem))] max-h-[min(70vh,32rem)] overflow-y-auto kr-panel-flat p-2 shadow-2xl"
      :aria-label="`${channel.label} tabs`"
    >
      <!--
        KNOWN, PRE-EXISTING: the highlight in this list does not track the
        route. On /bots it marks Dreams -- the Play channel's defaultTab --
        rather than Bots, even though this component's own trigger names Bots
        correctly and the value handed down is `bots`.

        NOT introduced here. Reproduced on merged main with this branch stashed,
        by opening channel-select and expanding a channel: its inline copy of
        the same ChannelTabList marks Dreams too. So the defect lives in
        ChannelTabList or in what both callers feed it, and this component only
        makes it easier to see by putting the list on the primary control.

        Ruled out along the way: HMR (reproduces on a cold server), SSR
        mismatch (the server renders no active marker in this list), and stale
        vnode reuse (re-keying the list on activeTabKey changed nothing).
        Instrumentation showed the same element carrying
        `data-dbg="dreams~bots"` and `class="active bg-secondary ..."` at once,
        which should not be possible in a single render -- so the cause is
        still unexplained and deliberately NOT papered over here.

        Left as-is rather than worked around: a fix belongs in ChannelTabList
        where both callers get it, not in one host.
      -->
      <ChannelTabList
        :channel="channel"
        :active-channel-key="channel.channelKey"
        :active-tab-key="activeTabKey"
        :columns="1"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'

const props = defineProps<{
  channel: ResolvedChannel
  activeTabKey: string
}>()

const emit = defineEmits<{ select: [tab: ResolvedTab] }>()

const activeTab = computed(
  () =>
    props.channel.tabs.find((tab) => tab.tabKey === props.activeTabKey) ??
    props.channel.tabs[0] ??
    null,
)
</script>
