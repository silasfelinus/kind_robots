<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4">
    <header class="flex items-start gap-3">
      <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
        <Icon name="kind-icon:wand" class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wide text-primary/70">Wishmaster</p>
        <h2 class="text-2xl font-black leading-tight">One-shot wishes</h2>
        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          Wishmaster treats a wish as the lightweight Todo-shaped request: scoped, prioritized, and tracked until it is fulfilled. Projects stay reserved for infrastructure-heavy systems.
        </p>
      </div>
    </header>

    <div class="grid gap-3 md:grid-cols-3">
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">Open wishes</p>
        <p class="mt-2 text-3xl font-black text-primary">{{ todoStore.openWishes.length }}</p>
        <p class="mt-1 text-xs leading-relaxed text-base-content/60">Single-shot requests waiting for an agent or human to make them real.</p>
      </article>
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">Fulfilled</p>
        <p class="mt-2 text-3xl font-black text-success">{{ todoStore.doneWishes.length }}</p>
        <p class="mt-1 text-xs leading-relaxed text-base-content/60">Wishes that reached DONE without needing a whole project shell.</p>
      </article>
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <p class="text-xs font-bold uppercase tracking-wide text-base-content/40">Archived</p>
        <p class="mt-2 text-3xl font-black text-base-content/40">{{ todoStore.archivedWishes.length }}</p>
        <p class="mt-1 text-xs leading-relaxed text-base-content/60">Completed or retired requests kept out of the active queue.</p>
      </article>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <h3 class="font-bold">What belongs here</h3>
        <p class="mt-2 text-sm leading-relaxed text-base-content/70">
          Use a wish for a bounded request: fix a bug, make one asset batch, draft one thing, generate a pitch batch, or ask an agent to perform one clear cycle.
        </p>
      </article>
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <h3 class="font-bold">What becomes a project</h3>
        <p class="mt-2 text-sm leading-relaxed text-base-content/70">
          Promote the work to a project only when it needs durable infrastructure: roadmap, milestones, dependencies, art assets, public surface, or repeated agent cycles.
        </p>
      </article>
    </div>

    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/50">Recent wishes</h3>
        <span v-if="todoStore.loading" class="loading loading-spinner loading-xs text-primary" />
      </div>
      <article
        v-for="wish in recentWishes"
        :key="wish.id"
        class="rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
      >
        <div class="flex items-start gap-3">
          <Icon :name="wish.status === 'DONE' ? 'kind-icon:check-circle' : 'kind-icon:sparkles'" class="mt-0.5 size-4 shrink-0" :class="wish.status === 'DONE' ? 'text-success' : 'text-primary'" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold">{{ wish.title }}</p>
            <p class="mt-1 text-xs text-base-content/50">{{ wishLabel(wish) }} · {{ wish.priority.toLowerCase() }}</p>
            <p v-if="wish.description" class="mt-2 line-clamp-2 text-xs leading-relaxed text-base-content/60">{{ wish.description }}</p>
          </div>
          <span class="badge badge-xs shrink-0" :class="wish.status === 'DONE' ? 'badge-success' : 'badge-primary'">{{ wish.status }}</span>
        </div>
      </article>
      <p v-if="!todoStore.loading && !recentWishes.length" class="rounded-2xl border border-dashed border-base-300 bg-base-200/50 p-6 text-center text-sm text-base-content/50">
        No wishes yet. The goblin inbox is weirdly peaceful.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTodoStore } from '@/stores/todoStore'
import { wishLabel } from '@/stores/helpers/wishmaster'

const todoStore = useTodoStore()

const recentWishes = computed(() => todoStore.wishes.slice(0, 8))

onMounted(() => {
  if (!todoStore.hasLoaded) todoStore.fetchTodos(true)
})
</script>
