<!-- /components/storybook/storybook-collection.vue -->
<!--
  THE COLLECTION (storybook/t-036): every adventure this account has, and the
  ending albums they filled.

  Replaces the localStorage "Recent stories" drawer, which was per-browser and
  vanished when a reader opened the site on their phone. Adventures are rows
  now, so the list is the same everywhere.
-->
<template>
  <section class="space-y-4">
    <div>
      <div class="mb-2 flex items-baseline justify-between gap-2">
        <h3 class="kr-text-semibold-sm">Your adventures</h3>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          :disabled="runStore.isLoading"
          @click="refresh"
        >
          Refresh
        </button>
      </div>

      <p v-if="!runStore.adventures.length" class="kr-text-dim-xs">
        No stories yet. Deal a table and open one.
      </p>

      <ul v-else class="space-y-1" data-testid="storybook-adventures">
        <li
          v-for="adventure in runStore.adventures"
          :key="adventure.id"
          class="flex flex-wrap items-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
        >
          <span class="min-w-0 flex-1">
            <span class="kr-text-semibold-sm block truncate">
              {{ adventure.title }}
            </span>
            <span class="kr-text-dim-xs">
              {{ adventure.mode }} · turn {{ adventure.turnIndex
              }}<span v-if="adventure.turnBudget">
                of {{ adventure.turnBudget }}</span
              >
              <span v-if="adventure.Ending">
                · {{ adventure.Ending.title }}
              </span>
            </span>
          </span>
          <button
            type="button"
            class="btn btn-sm"
            :class="
              adventure.status === 'ACTIVE' ? 'btn-primary' : 'btn-outline'
            "
            @click="emit('open', adventure.id)"
          >
            {{ adventure.status === 'ACTIVE' ? 'Resume' : 'Reread' }}
          </button>
        </li>
      </ul>
    </div>

    <div v-if="runStore.decks.length">
      <h3 class="kr-text-semibold-sm mb-2">Ending albums</h3>
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-2"
        data-testid="storybook-albums"
      >
        <button
          v-for="deck in runStore.decks"
          :key="deck.key"
          type="button"
          class="rounded-2xl border border-base-300 bg-base-100 p-2 text-left transition hover:border-primary"
          @click="runStore.fetchCollection(deck.key)"
        >
          <span class="kr-text-semibold-sm block">{{ deck.title }}</span>
          <span class="kr-text-dim-xs">
            {{ albumLabel(deck.key, deck.endingCount) }}
          </span>
        </button>
      </div>

      <div
        v-if="runStore.collection"
        class="mt-2 rounded-2xl border border-primary/30 bg-primary/5 p-2"
      >
        <p class="kr-text-semibold-sm">
          {{ runStore.collection.deck.title }} ·
          {{ runStore.collection.found }} of {{ runStore.collection.total }}
          found
        </p>
        <p class="kr-text-dim-xs">
          {{
            runStore.collection.endings
              .filter((entry) => entry.unlocked)
              .map((entry) => entry.title)
              .join(', ') || 'Nothing found in this deck yet.'
          }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useStorybookRunStore } from '@/stores/storybookRunStore'

const emit = defineEmits<{ open: [runId: number] }>()

const runStore = useStorybookRunStore()

function albumLabel(deckKey: string, endingCount?: number): string {
  if (runStore.collection?.deck.key === deckKey) {
    return `${runStore.collection.found} of ${runStore.collection.total} found`
  }
  return endingCount ? `${endingCount} endings` : 'Open to count'
}

async function refresh() {
  await Promise.allSettled([
    runStore.fetchAdventures(),
    runStore.fetchDecks(),
  ])
}

onMounted(refresh)
</script>
