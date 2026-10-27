<template>
  <nav
    class="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-2"
    aria-label="Sections and people"
  >
    <template v-for="group in groups" :key="group.label">
      <p
        v-if="group.tiles.length"
        class="pf-kicker shrink-0 self-center text-[0.6rem] text-secondary [writing-mode:vertical-rl]"
      >
        {{ group.label }}
      </p>
      <button
        v-for="t in group.tiles"
        :key="`${t.target.type}:${t.target.id}`"
        type="button"
        data-nav
        class="pf-gallery-tile pf-focusable"
        :class="
          sameTarget(t.target, forge.galleryTarget) ? 'pf-art-card-on' : ''
        "
        :aria-pressed="sameTarget(t.target, forge.galleryTarget)"
        :aria-label="`${t.label}: ${t.painted} of ${t.count} painted`"
        @click="forge.showTarget(t.target)"
      >
        <span class="pf-art-card-frame">
          <img
            v-if="t.cover"
            :src="t.cover"
            alt=""
            loading="lazy"
            class="pf-art-card-img"
          />
          <PlaybookArt
            v-else-if="t.scene"
            :title="t.label"
            :scene="t.scene"
            class="absolute inset-0"
          />
          <span v-else class="pf-art-card-empty text-[0.6rem]">No art yet</span>
          <span
            class="pf-art-card-badge"
            :class="t.painted === t.count ? 'text-success' : ''"
            >{{ t.painted }}/{{ t.count }}</span
          >
        </span>
        <span class="pf-label line-clamp-1 px-1.5 py-1 text-left text-xs">{{
          t.label
        }}</span>
      </button>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { sameTarget } from '~/utils/playbookForge/gallery'

// The gallery's shelf: every section, then every person, each shown by its
// art with how much of it is painted.
const forge = usePlaybookForgeStore()
const groups = computed(() => [
  { label: 'Sections', tiles: forge.galleryTiles.sections },
  {
    label: forge.galleryBook?.peopleLabel || 'People',
    tiles: forge.galleryTiles.people,
  },
])
</script>
