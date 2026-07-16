<!-- components/ruler-hooked/ruler-hooked-slots.vue
     Save-slot picker (data-model.md §2.2): new / continue / rename / delete.
     Reads and drives the store directly. -->
<template>
  <div class="rounded-xl border border-base-300 bg-base-100 p-4">
    <h3 class="mb-2 text-sm font-bold uppercase tracking-wide opacity-70">Save slots</h3>

    <div v-if="store.slots.length" class="mb-3 flex flex-col gap-1">
      <div
        v-for="slot in store.slots"
        :key="slot.saveId"
        class="flex items-center gap-2 rounded-lg px-2 py-1"
        :class="slot.saveId === store.save?.saveId ? 'bg-primary/10' : 'hover:bg-base-200'"
      >
        <button type="button" class="flex-1 text-left" @click="store.loadSlot(slot.saveId)">
          <span class="font-medium">{{ slot.name }}</span>
          <span class="ml-2 text-xs opacity-60">turn {{ slot.turnCount }} · {{ slot.status.toLowerCase() }}</span>
        </button>
        <button type="button" class="btn btn-ghost btn-xs" @click="rename(slot.saveId, slot.name)">rename</button>
        <button type="button" class="btn btn-ghost btn-xs text-error" @click="store.deleteSlot(slot.saveId)">delete</button>
      </div>
    </div>
    <p v-else class="mb-3 text-xs opacity-60">No saves yet — start a new reign.</p>

    <div class="flex flex-wrap items-end gap-2">
      <label class="form-control">
        <span class="label-text text-xs">Ruler name</span>
        <input v-model="rulerName" type="text" placeholder="Mo" class="input input-bordered input-sm w-28" />
      </label>
      <label class="form-control">
        <span class="label-text text-xs">Title</span>
        <select v-model="honorific" class="select select-bordered select-sm">
          <option>Queen</option><option>King</option><option>Ruler</option>
        </select>
      </label>
      <button type="button" class="btn btn-primary btn-sm" :disabled="!rulerName.trim()" @click="start">
        New reign
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const store = useRulerHookedStore()
const rulerName = ref('Mo')
const honorific = ref('Queen')

function start() {
  if (!rulerName.value.trim()) return
  store.newGame('', rulerName.value.trim(), honorific.value)
}
function rename(saveId: string, current: string) {
  const name = typeof window !== 'undefined' ? window.prompt('Rename this reign', current) : null
  if (name && name.trim()) store.renameSlot(saveId, name.trim())
}
</script>
