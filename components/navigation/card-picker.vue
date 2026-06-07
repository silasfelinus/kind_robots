<!-- /components/user/card-back-picker.vue -->
<template>
  <div class="flex h-full w-full flex-col gap-4 p-4">
    <header class="flex flex-col gap-1">
      <h2 class="text-lg font-black text-base-content">Card Back</h2>
      <p class="text-sm text-base-content/60">
        Pick the design shown when your workspace cards flip.
      </p>
    </header>

    <div
      class="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-5"
    >
      <button
        v-for="back in CARD_BACKS"
        :key="back"
        type="button"
        class="group relative overflow-hidden rounded-2xl border-2 bg-base-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
        :class="
          back === selected
            ? 'border-primary ring-2 ring-primary/40'
            : 'border-base-300 hover:border-primary/60'
        "
        :aria-pressed="back === selected"
        :aria-label="`Card back ${back}`"
        @click="select(back)"
      >
        <div class="relative aspect-2/3 w-full overflow-hidden">
          <img
            :src="cardBackSrc(back)"
            :alt="`Card back ${back}`"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          <div
            v-if="back === selected"
            class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-content shadow"
          >
            <Icon name="kind-icon:check" class="h-4 w-4" />
          </div>
        </div>

        <div class="w-full bg-base-100 px-2 py-1.5">
          <p class="text-center text-xs font-bold text-base-content/75">
            Back {{ back }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const CARD_BACKS = [1, 2, 3, 4, 5] as const
type CardBack = (typeof CARD_BACKS)[number]

const CARD_BACK_STORAGE_KEY = 'kr.workspaceCardBack'

const selected = ref<CardBack>(1)

function cardBackSrc(back: CardBack): string {
  return `/images/adventure/card/card-back${back}.webp`
}

function select(back: CardBack): void {
  selected.value = back

  if (!import.meta.client) return

  try {
    window.localStorage.setItem(CARD_BACK_STORAGE_KEY, String(back))
  } catch {
    /* ignore storage failures */
  }

  // Notify any open listeners (e.g. workspace-hand) within the same tab.
  window.dispatchEvent(new CustomEvent('kr:card-back-change', { detail: back }))
}

onMounted(() => {
  if (!import.meta.client) return

  try {
    const stored = window.localStorage.getItem(CARD_BACK_STORAGE_KEY)
    const parsed = stored ? Number(stored) : NaN
    if (CARD_BACKS.includes(parsed as CardBack)) {
      selected.value = parsed as CardBack
    }
  } catch {
    /* ignore storage failures */
  }
})
</script>
