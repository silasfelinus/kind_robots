<!-- /components/code/code-palette.vue -->
<template>
  <aside
    class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
  >
    <header class="border-b border-base-300 p-4">
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <h2 class="flex items-center gap-2 text-lg font-black text-secondary">
            <icon name="kind-icon:toybox" class="h-6 w-6" />
            Toybox
          </h2>

          <p class="mt-1 text-xs text-base-content/60">
            Drag a card, tap to add, or fire a Quick Play.
          </p>
        </div>

        <button
          class="btn btn-ghost btn-xs btn-circle lg:hidden"
          type="button"
          title="Close toybox"
          @click="codeStore.setMobileTray('closed')"
        >
          <icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <label
        class="input input-sm mt-3 flex w-full items-center gap-2 rounded-2xl border-base-300 bg-base-200"
      >
        <icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
        <input
          v-model="search"
          class="min-w-0 flex-1"
          type="search"
          placeholder="Find a card..."
        />
      </label>

      <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          class="btn btn-xs shrink-0 rounded-2xl"
          :class="selectedCategory === 'all' ? 'btn-primary' : 'btn-outline'"
          type="button"
          @click="selectedCategory = 'all'"
        >
          All
        </button>

        <button
          v-for="category in categories"
          :key="category"
          class="btn btn-xs shrink-0 rounded-2xl"
          :class="selectedCategory === category ? 'btn-primary' : 'btn-outline'"
          type="button"
          @click="selectedCategory = category"
        >
          {{ category }}
        </button>
      </div>
    </header>

    <section
      v-if="codeStore.showQuickPlays"
      class="border-b border-base-300 bg-base-200/80 p-3"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <div class="flex min-w-0 items-center gap-2">
          <icon name="kind-icon:cards" class="h-5 w-5 text-primary" />
          <p class="truncate text-sm font-black text-base-content">
            Quick Plays
          </p>
        </div>

        <div class="flex shrink-0 gap-1">
          <button
            class="btn btn-ghost btn-xs btn-circle"
            type="button"
            title="Hide Quick Plays"
            @click="codeStore.toggleQuickPlays(false)"
          >
            <icon name="kind-icon:chevron-up" class="h-4 w-4" />
          </button>

          <button
            class="btn btn-xs rounded-2xl border border-secondary bg-secondary/20 text-secondary-content"
            type="button"
            @click="codeStore.reshuffleActionHand()"
          >
            <icon name="kind-icon:shuffle" class="h-4 w-4" />
            Reshuffle
          </button>
        </div>
      </div>

      <div
        v-if="codeStore.actionHand.length"
        class="flex gap-2 overflow-x-auto pb-1 lg:max-h-65 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden"
      >
        <button
          v-for="card in codeStore.actionHand"
          :key="card.id"
          class="group flex min-w-55 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 active:scale-[0.98] lg:min-w-0"
          type="button"
          @click="codeStore.playActionCard(card)"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-base-200 text-primary transition group-hover:bg-primary group-hover:text-primary-content"
          >
            <icon :name="card.icon" class="h-6 w-6" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-black text-base-content">
              {{ card.title }}
            </p>

            <p class="truncate text-xs text-base-content/70">
              {{ card.subtitle }}
            </p>

            <p class="line-clamp-2 text-xs text-base-content/60">
              {{ card.description }}
            </p>
          </div>
        </button>
      </div>

      <div
        v-else
        class="flex items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-4 text-sm text-base-content/60"
      >
        No Quick Plays loaded. The deck gremlin has wandered off.
      </div>
    </section>

    <section v-else class="border-b border-base-300 bg-base-200/80 p-3">
      <button
        class="btn btn-sm btn-outline w-full rounded-2xl"
        type="button"
        @click="codeStore.toggleQuickPlays(true)"
      >
        <icon name="kind-icon:cards" class="h-4 w-4" />
        Show Quick Plays
      </button>
    </section>

    <section class="min-h-0 flex-1 overflow-y-auto p-3">
      <div
        v-for="(definitions, category) in filteredGroups"
        :key="category"
        class="mb-4 space-y-2"
      >
        <h3
          class="flex items-center justify-between px-1 text-xs font-black uppercase tracking-wide text-base-content/50"
        >
          <span>{{ category }}</span>
          <span>{{ definitions.length }}</span>
        </h3>

        <div class="grid grid-cols-1 gap-2">
          <button
            v-for="definition in definitions"
            :key="definition.kind"
            class="group flex w-full items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-base-100 hover:shadow-md"
            draggable="true"
            type="button"
            @dragstart="onDragStart($event, definition.kind)"
            @click="addNearTop(definition.kind)"
          >
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-base-100 transition group-hover:scale-105"
              :class="accentClass(definition.accent)"
            >
              <icon :name="definition.icon" class="h-6 w-6" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-black">
                {{ definition.title }}
              </span>

              <span class="block truncate text-xs text-base-content/60">
                {{ definition.subtitle }}
              </span>
            </span>

            <icon
              name="kind-icon:plus"
              class="h-4 w-4 shrink-0 text-base-content/30 transition group-hover:text-primary"
            />
          </button>
        </div>
      </div>

      <div
        v-if="!Object.keys(filteredGroups).length"
        class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/60"
      >
        No cards match that search. The toybox is judging the query, politely.
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useCodeStore,
  type CodeDefinition,
  type CodeKind,
} from '@/stores/codeStore'

const codeStore = useCodeStore()
const search = ref('')
const selectedCategory = ref('all')

const categories = computed(() => {
  return Object.keys(codeStore.groupedDefinitions)
})

const filteredGroups = computed(() => {
  const query = search.value.trim().toLowerCase()
  const groups: Record<string, CodeDefinition[]> = {}

  for (const [category, definitions] of Object.entries(
    codeStore.groupedDefinitions,
  )) {
    if (
      selectedCategory.value !== 'all' &&
      selectedCategory.value !== category
    ) {
      continue
    }

    const filtered = definitions.filter((definition) => {
      if (!query) return true

      return [
        definition.title,
        definition.subtitle,
        definition.description,
        definition.category,
        definition.kind,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })

    if (filtered.length) {
      groups[category] = filtered
    }
  }

  return groups
})

function onDragStart(event: DragEvent, kind: CodeKind) {
  event.dataTransfer?.setData('kindrobots/code-kind', kind)
  event.dataTransfer?.setData('text/plain', kind)
  event.dataTransfer?.setDragImage(event.currentTarget as Element, 24, 24)
}

function addNearTop(kind: CodeKind) {
  const offset = codeStore.nodes.length * 28
  const baseX = 120 + offset
  const baseY = 120 + offset

  codeStore.addNode(kind, baseX, baseY)
}

function accentClass(accent: string) {
  const classes: Record<string, string> = {
    primary: 'border-primary/40 text-primary',
    secondary: 'border-secondary/40 text-secondary',
    accent: 'border-accent/40 text-accent',
    info: 'border-info/40 text-info',
    warning: 'border-warning/40 text-warning',
    error: 'border-error/40 text-error',
    success: 'border-success/40 text-success',
  }

  return classes[accent] ?? 'border-base-300 text-base-content'
}
</script>
