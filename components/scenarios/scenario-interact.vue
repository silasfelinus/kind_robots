<!-- /components/content/weird/scenario-interact.vue -->
<!--
  The Scenario router: browse until you pick one, then work on it.

  This is the frame every core object shares, and the only thing the interact
  tier is for:

    <x-gallery v-if="!selected" />     <x-{activity} v-else />

  It used to be 531 lines, because the configure and play phases were inlined
  here rather than living in a story surface. dream-interact does the same job in
  57. Everything model-specific moved to scenario-story.vue unchanged --
  per Silas, the interact tier "is where we are actually hitting what we do with
  them uniquely", so the frame is what is shared, not the contents.

  The status banner stays here: it belongs to the frame, reporting on browse,
  configure and play alike, the same way kr-manager owns its one banner.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 text-smart">
    <div
      v-if="storyStore.statusMessage"
      class="shrink-0 rounded-2xl border p-3 text-smart"
      :class="
        storyStore.statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ storyStore.statusMessage }}
    </div>

    <!-- show-header off: kr-manager renders the panel title. See bot-gallery. -->
    <scenario-gallery
      v-if="storyStore.phase === 'browse'"
      class="min-h-0 flex-1"
      variant="grid"
      :show-header="false"
      :show-inspirations="false"
    />

    <!-- No class here on purpose: the story surface is multi-root (configure and
         play are siblings), so an attribute would have nowhere to land. Both
         sections already carry their own `min-h-0 flex-1` inside it. -->
    <scenario-story v-else />
  </section>
</template>

<script setup lang="ts">
import { useStoryStore } from '@/stores/storyStore'

const storyStore = useStoryStore()
</script>
