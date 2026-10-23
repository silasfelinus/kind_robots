<template>
  <section class="rounded-2xl border border-base-300 bg-base-100/90 p-4">
    <div class="mb-4">
      <p class="text-xs font-black uppercase tracking-widest text-primary">The royal ledger</p>
      <h2 class="font-serif text-2xl font-bold">Choose a reign</h2>
      <p class="mt-1 text-sm opacity-70">
        No names, portraits or titles to choose. The kingdom is waiting, and the fish do not care.
      </p>
    </div>

    <div v-if="store.slots.length" class="mb-4 grid gap-2">
      <div
        v-for="slot in store.slots"
        :key="slot.saveId"
        class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-200/80 p-2"
      >
        <button
          type="button"
          class="min-h-12 min-w-0 flex-1 rounded-lg px-2 text-left hover:bg-base-300"
          @click="selectSlot(slot.saveId)"
        >
          <span class="block truncate font-bold">{{ slot.name }}</span>
          <span class="block text-xs opacity-65">Day {{ slot.turnCount + 1 }} · {{ slot.status.toLowerCase() }}</span>
        </button>
        <button type="button" class="btn btn-ghost btn-xs min-h-11" @click="rename(slot.saveId, slot.name)">
          Rename
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs min-h-11 text-error"
          :aria-label="'Delete ' + slot.name"
          @click="store.deleteSlot(slot.saveId)"
        >
          Delete
        </button>
      </div>
    </div>
    <button type="button" class="btn btn-primary min-h-12 w-full" @click="start">
      Begin a new reign
    </button>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const emit = defineEmits<{ picked: [] }>()
const store = useRulerHookedStore()

function selectSlot(saveId: string) {
  store.loadSlot(saveId)
  emit('picked')
}

async function start() {
  await store.newGame('', 'Angler', 'Ruler')
  emit('picked')
}

function rename(saveId: string, current: string) {
  const name = typeof window !== 'undefined' ? window.prompt('Rename this reign', current) : null
  if (name?.trim()) store.renameSlot(saveId, name.trim())
}
</script>
