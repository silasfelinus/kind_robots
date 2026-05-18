<!-- /components/code/code-cards.vue -->
<template>
  <section
    class="w-full rounded-2xl border border-base-300 bg-base-200/95 p-2 shadow-lg"
  >
    <div class="flex items-center justify-between gap-2 pb-2">
      <div class="flex min-w-0 items-center gap-2">
        <icon name="kind-icon:cards" class="h-5 w-5 text-primary" />
        <p class="truncate text-sm font-bold text-base-content">
          Prompt Tools
        </p>
      </div>

      <button
        class="btn btn-xs rounded-2xl border border-secondary bg-secondary/20 text-secondary-content"
        type="button"
        @click="$emit('reshuffle')"
      >
        <icon name="kind-icon:shuffle" class="h-4 w-4" />
        Reshuffle
      </button>
    </div>

    <div
      v-if="cards.length"
      class="flex w-full gap-2 overflow-x-auto pb-1"
    >
      <button
        v-for="card in cards"
        :key="card.id"
        class="group flex min-w-[220px] max-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary hover:bg-primary/10 active:scale-[0.98]"
        type="button"
        @click="$emit('play', card)"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-base-200 text-primary transition group-hover:bg-primary group-hover:text-primary-content"
        >
          <icon :name="card.icon" class="h-6 w-6" />
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-base-content">
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
      No prompt-tools loaded. The deck gremlin has wandered off.
    </div>
  </section>
</template>

<script setup lang="ts">
export type CodeCardKind =
  | 'add-pitch'
  | 'add-dream'
  | 'add-character'
  | 'add-reward'
  | 'add-scenario'
  | 'create-art'
  | 'edit-target'
  | 'interact-target'
  | 'add-skill'
  | 'add-treasure'
  | 'expand-concept'

export type CodeModel =
  | 'pitch'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'art'

export interface CodeCard {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  kind: CodeCardKind
  model?: CodeModel
  targetId?: number
  targetTitle?: string
}

defineProps<{
  cards: CodeCard[]
}>()

defineEmits<{
  play: [card: CodeCard]
  reshuffle: []
}>()
</script>