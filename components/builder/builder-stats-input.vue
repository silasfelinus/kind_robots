<!-- /components/builder/builder-stats-input.vue -->
<template>
  <div class="flex flex-col gap-4">
    <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
      <p class="mb-2 text-xs font-black uppercase tracking-widest text-base-content/50">Number blocks</p>
      <div class="grid grid-cols-6 gap-2">
        <button
          v-for="block in blocks"
          :key="block"
          type="button"
          class="btn rounded-2xl text-lg font-black"
          :class="blockClass(block)"
          @click="store.selectStatBlock(block)"
        >
          {{ block }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <button
        v-for="stat in store.draftStats"
        :key="stat.key"
        type="button"
        class="flex items-center gap-3 rounded-2xl border-2 bg-base-100 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md"
        :class="stat.value ? 'border-primary/40' : 'border-base-300'"
        @click="store.assignStat(stat.key)"
      >
        <span class="text-3xl leading-none">{{ stat.display }}</span>
        <span class="min-w-0 flex-1">
          <span class="block truncate font-black text-base-content">{{ stat.name }}</span>
          <span class="text-xs text-base-content/50">{{ stat.key }}</span>
        </span>
        <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg font-black text-primary">
          {{ stat.value || '—' }}
        </span>
      </button>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-3">
      <p class="text-sm font-semibold" :class="store.statAllocationComplete ? 'text-success' : 'text-base-content/50'">
        {{ store.statAllocationComplete ? 'Stats are allocated.' : 'Assign each number from 1 to 6 once.' }}
      </p>
      <button type="button" class="btn btn-sm btn-ghost rounded-xl border border-base-300" @click="store.rollAllStats()">
        <Icon name="kind-icon:dice" class="h-4 w-4" />
        Roll all
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
const blocks = [1, 2, 3, 4, 5, 6]

function blockClass(block: number): string {
  if (store.selectedStatBlock === block) return 'btn-primary'
  if (store.usedStatValues.includes(block)) return 'btn-ghost border border-success text-success'
  return 'btn-ghost border border-base-300'
}
</script>
