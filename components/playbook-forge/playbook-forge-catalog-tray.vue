<template>
  <aside
    class="pf-panel kr-scroll flex min-h-0 flex-col gap-4 p-3 @5xl:p-4"
    aria-label="Focused item and tray"
  >
    <section v-if="item" class="flex flex-col gap-2" aria-label="Focused item">
      <div class="pf-art-card-frame">
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          alt=""
          class="pf-art-card-img"
        />
        <span v-else-if="item.prompt" class="pf-art-card-prompt">
          <span class="pf-kicker text-[0.55rem] text-secondary">Prompt</span>
          <span>{{ item.prompt }}</span>
        </span>
        <span v-else class="pf-art-card-empty text-xs opacity-60"
          >No picture yet.</span
        >
      </div>
      <p class="pf-kicker text-[0.6rem] opacity-70">{{ item.label }}</p>
      <p class="pf-display text-xl">{{ item.title }}</p>
      <p v-if="item.blurb" class="text-sm leading-snug opacity-85">
        {{ item.blurb }}
      </p>
      <p v-if="item.prompt && item.imageUrl" class="text-xs italic opacity-70">
        {{ item.prompt }}
      </p>
      <button
        type="button"
        data-nav
        class="pf-label btn btn-sm pf-focusable"
        :class="forge.inTray(item.key) ? 'btn-ghost' : 'btn-primary'"
        @click="forge.toggleTray(item)"
      >
        {{
          forge.inTray(item.key) ? 'Remove from the tray' : 'Add to the tray'
        }}
      </button>
    </section>
    <p v-else class="pf-help text-sm">
      Pick anything to see it large. The tray collects ideas: Facets become
      sparks, and Characters, Locations, Scenarios, Rewards and game art become
      designs with their pictures and prompts.
    </p>

    <section class="flex flex-col gap-2" aria-label="Tray">
      <div class="flex items-baseline justify-between gap-2">
        <p class="pf-kicker text-secondary">Tray · {{ forge.tray.length }}</p>
        <button
          v-if="forge.tray.length"
          type="button"
          class="text-xs underline opacity-70"
          @click="forge.clearTray()"
        >
          Clear
        </button>
      </div>
      <ul v-if="forge.tray.length" class="grid grid-cols-4 gap-1.5">
        <li v-for="t in forge.tray" :key="t.key" class="relative">
          <button
            type="button"
            class="pf-art-card-frame block w-full"
            :title="`${t.title} (${t.tab})`"
            @click="forge.catalogFocus = t.key"
          >
            <img
              v-if="t.imageUrl"
              :src="t.imageUrl"
              alt=""
              class="pf-art-card-img"
            />
            <span
              v-else
              class="pf-art-card-empty text-[0.55rem] leading-tight"
              >{{ t.title }}</span
            >
          </button>
          <button
            type="button"
            class="absolute right-0 top-0 bg-black/70 px-1 text-xs text-white"
            :aria-label="`Remove ${t.title}`"
            @click="forge.toggleTray(t)"
          >
            ×
          </button>
        </li>
      </ul>
      <div v-if="forge.tray.length" class="flex flex-col gap-1.5">
        <button
          type="button"
          data-nav
          class="pf-label btn btn-sm btn-primary pf-focusable"
          @click="forge.trayToIdea()"
        >
          Start a playbook from these
        </button>
        <button
          v-if="forge.existing"
          type="button"
          data-nav
          class="pf-label btn btn-sm btn-secondary pf-focusable"
          @click="forge.trayToGame()"
        >
          Add to {{ forge.existing.title }} as designs
        </button>
      </div>
      <p v-if="forge.status" class="text-xs opacity-80" role="status">
        {{ forge.status }}
      </p>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'

// The catalogue's side panel: the focused item large, and the brainstorm
// tray that starts a playbook or adds designs to the open game.

const forge = usePlaybookForgeStore()
const item = computed(() => {
  const key = forge.catalogFocus
  if (!key) return null
  return (
    Object.values(forge.catalog)
      .flat()
      .find((i) => i?.key === key) ??
    forge.tray.find((i) => i.key === key) ??
    null
  )
})
</script>
