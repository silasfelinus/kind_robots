<!-- A self-contained opening ritual, part of the game stage, not a web form. -->
<template>
  <section class="relative flex h-full min-h-0 w-full flex-col overflow-hidden text-amber-50">
    <header class="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/25 bg-slate-950/65 px-4 py-3 backdrop-blur-md sm:px-6">
      <div>
        <p class="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">A crown, a coastline, a questionable fishing rod</p>
        <h1 class="font-serif text-2xl font-black tracking-wide sm:text-4xl">The Ruler Is Hooked</h1>
      </div>
      <button
        v-if="store.slots.length"
        type="button"
        class="min-h-11 rounded-xl border border-amber-200/40 bg-slate-900/70 px-4 text-sm font-bold text-amber-100 hover:bg-amber-100/15"
        :aria-pressed="showSaves"
        @click="showSaves = !showSaves"
      >
        <Icon name="kind-icon:book" class="mr-1 inline-block kr-icon-4" />
        {{ showSaves ? 'New reign' : 'Continue a reign' }}
      </button>
    </header>

    <div
      v-if="showSaves"
      class="relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 sm:p-8"
    >
      <p class="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The royal archives</p>
      <h2 class="font-serif text-3xl font-black">Reigns remembered</h2>
      <div
        v-for="slot in store.slots"
        :key="slot.saveId"
        class="flex items-center gap-2 rounded-2xl border border-amber-200/30 bg-slate-950/85 p-3 shadow-lg"
      >
        <template v-if="editingSlotId === slot.saveId">
          <input
            v-model="editedSlotName"
            type="text"
            maxlength="80"
            class="min-h-12 min-w-0 flex-1 rounded-xl border border-amber-300/50 bg-slate-900 px-3 font-serif text-amber-50"
            aria-label="Rename this reign"
            @keydown.enter.prevent="saveRename"
            @keydown.esc.prevent="editingSlotId = null"
          />
          <button type="button" class="min-h-11 rounded-lg border border-amber-200/40 px-3 text-sm" @click="saveRename">Save</button>
          <button type="button" class="min-h-11 rounded-lg px-2 text-sm" @click="editingSlotId = null">Cancel</button>
        </template>
        <template v-else>
          <button
            type="button"
            class="min-h-16 min-w-0 flex-1 rounded-xl px-2 text-left hover:bg-amber-100/10"
            @click="selectSlot(slot.saveId)"
          >
            <span class="block truncate font-serif text-lg font-bold">{{ slot.name }}</span>
            <span class="block text-xs text-amber-100/70">Day {{ slot.turnCount + 1 }} · {{ slot.status.toLowerCase() }}</span>
          </button>
          <button type="button" class="min-h-11 rounded-lg px-2 text-xs hover:bg-amber-100/10" @click="beginRename(slot.saveId, slot.name)">
            Rename
          </button>
        </template>
        <button type="button" class="min-h-11 rounded-lg px-2 text-xs text-red-200 hover:bg-red-700/30" :aria-label="'Delete ' + slot.name" @click="store.deleteSlot(slot.saveId)">
          Delete
        </button>
      </div>
    </div>

    <form
      v-else
      class="relative z-10 grid min-h-0 flex-1 gap-3 overflow-y-auto px-3 py-3 sm:gap-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:overflow-hidden"
      @submit.prevent="start"
    >
      <div class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-amber-300/35 bg-slate-950/80 p-3 backdrop-blur-md sm:p-4">
        <p class="mb-2 text-center text-xs font-black uppercase tracking-[0.19em] text-amber-300">Choose a likeness</p>
        <RulerHookedCosmeticsPicker
          v-model="presetId"
          @custom-file="(file: File | null) => (customPortraitFile = file)"
        />
      </div>

      <div class="flex min-h-0 flex-col justify-center gap-4 rounded-3xl border border-amber-300/35 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-lg sm:p-6">
        <div class="border-b border-amber-200/25 pb-3">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">The coronation ledger</p>
          <h2 class="mt-1 font-serif text-3xl font-black sm:text-4xl">Who takes the throne?</h2>
          <p class="mt-2 max-w-lg font-serif text-sm leading-relaxed text-amber-100/75 sm:text-base">
            Record your name, choose a title, and select the portrait that will mark your accession.
            Once the ceremony ends, the world is shown through your eyes.
          </p>
        </div>

        <label class="block">
          <span class="mb-1 block text-xs font-bold uppercase tracking-widest text-amber-200">Your name</span>
          <input
            v-model="rulerName"
            type="text"
            maxlength="64"
            autocomplete="off"
            placeholder="Mo"
            required
            class="min-h-12 w-full rounded-xl border border-amber-300/50 bg-slate-900/90 px-4 font-serif text-xl text-amber-50 outline-none placeholder:text-amber-200/35 focus-visible:border-amber-200 focus-visible:ring-2 focus-visible:ring-amber-300/50"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-bold uppercase tracking-widest text-amber-200">Your honorific</span>
          <input
            v-model="honorific"
            type="text"
            list="ruler-honorific-suggestions"
            maxlength="40"
            placeholder="Queen"
            class="min-h-12 w-full rounded-xl border border-amber-300/50 bg-slate-900/90 px-4 font-serif text-xl text-amber-50 outline-none placeholder:text-amber-200/35 focus-visible:border-amber-200 focus-visible:ring-2 focus-visible:ring-amber-300/50"
          />
          <datalist id="ruler-honorific-suggestions">
            <option v-for="title in honorificSuggestions" :key="title" :value="title" />
          </datalist>
        </label>

        <p class="font-serif text-sm italic text-amber-100/65">
          “The court is waiting. The fish, regrettably, are not.”
        </p>
        <button
          type="submit"
          class="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-amber-100/60 bg-amber-300 px-5 font-serif text-xl font-black text-slate-950 shadow-[0_10px_30px_rgba(221,176,73,0.24)] hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!rulerName.trim() || creating"
        >
          <Icon name="kind-icon:crown" class="size-6" />
          {{ creating ? 'Preparing the reign…' : 'Begin your reign' }}
          <Icon name="kind-icon:chevron-right" class="size-5" />
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { HERO_RULER_PRESET_ID, RULER_PRESETS } from '~/utils/rulerHooked/rulerPresets'

const emit = defineEmits<{ picked: [] }>()
const store = useRulerHookedStore()
const showSaves = ref(false)
const creating = ref(false)
const editingSlotId = ref<string | null>(null)
const editedSlotName = ref('')
const rulerName = ref('Mo')
const honorific = ref('Queen')
const presetId = ref(HERO_RULER_PRESET_ID)
const customPortraitFile = ref<File | null>(null)
const honorificSuggestions = [...new Set(RULER_PRESETS.map((preset) => preset.title))]

function selectSlot(saveId: string) {
  store.loadSlot(saveId)
  emit('picked')
}
async function start() {
  if (!rulerName.value.trim() || creating.value) return
  creating.value = true
  try {
    await store.newGame('', rulerName.value.trim(), honorific.value.trim() || 'Ruler', {
      presetId: presetId.value,
      customPortraitFile: customPortraitFile.value ?? undefined,
    })
    emit('picked')
  } finally {
    creating.value = false
  }
}
function beginRename(saveId: string, current: string) {
  editingSlotId.value = saveId
  editedSlotName.value = current
}
function saveRename() {
  if (!editingSlotId.value || !editedSlotName.value.trim()) return
  store.renameSlot(editingSlotId.value, editedSlotName.value.trim())
  editingSlotId.value = null
}
</script>
