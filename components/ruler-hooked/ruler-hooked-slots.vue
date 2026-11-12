<!-- A self-contained opening ritual, part of the game stage, not a web form. -->
<template>
  <section class="rh-screen rh-title-screen">
    <RulerHookedArt
      class="rh-backdrop"
      :candidates="BACKDROPS.title"
      eager
      position="center 40%"
    />
    <div class="rh-title-screen__veil" aria-hidden="true" />

    <header class="rh-title-screen__head">
      <h1 class="rh-lockup">
        <span class="rh-lockup__the">The</span>
        <span class="rh-lockup__main">Ruler <em>is</em> Hooked</span>
      </h1>
      <p class="rh-lockup__tag">
        A crown, a lake, and a very questionable fishing rod
      </p>
      <button
        v-if="store.slots.length"
        type="button"
        class="rh-btn rh-title-screen__toggle"
        :aria-pressed="showSaves"
        @click="showSaves = !showSaves"
      >
        {{ showSaves ? 'Begin a new reign' : 'Continue a reign' }}
      </button>
    </header>

    <div v-if="showSaves" class="rh-parchment rh-title-screen__panel rh-ledger">
      <p class="rh-eyebrow">The royal archives</p>
      <h2 class="rh-title rh-title--big">Reigns remembered</h2>
      <div
        v-for="slot in store.slots"
        :key="slot.saveId"
        class="rh-ledger__row"
      >
        <template v-if="editingSlotId === slot.saveId">
          <input
            v-model="editedSlotName"
            type="text"
            maxlength="80"
            class="rh-input"
            aria-label="Rename this reign"
            @keydown.enter.prevent="saveRename"
            @keydown.esc.prevent="editingSlotId = null"
          />
          <button
            type="button"
            class="rh-btn rh-btn--small"
            @click="saveRename"
          >
            Save
          </button>
          <button
            type="button"
            class="rh-btn rh-btn--small"
            @click="editingSlotId = null"
          >
            Cancel
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="rh-ledger__pick"
            @click="selectSlot(slot.saveId)"
          >
            <strong>{{ slot.name }}</strong>
            <span
              >Day {{ Math.floor(slot.turnCount / 5) + 1 }} ·
              {{ slot.status.toLowerCase() }}</span
            >
          </button>
          <button
            type="button"
            class="rh-btn rh-btn--small"
            @click="beginRename(slot.saveId, slot.name)"
          >
            Rename
          </button>
        </template>
        <button
          type="button"
          class="rh-btn rh-btn--small rh-btn--danger"
          :aria-label="'Delete ' + slot.name"
          @click="store.deleteSlot(slot.saveId)"
        >
          Delete
        </button>
      </div>
      <GameAchievementStrip game="ruler-hooked" layout="icons" class="mt-2" />
    </div>

    <form v-else class="rh-title-screen__panel rh-oath" @submit.prevent="start">
      <div class="rh-panel rh-oath__likeness">
        <p class="rh-oath__label">Choose a likeness</p>
        <RulerHookedCosmeticsPicker
          v-model="presetId"
          @custom-file="(file: File | null) => (customPortraitFile = file)"
        />
      </div>

      <div class="rh-parchment rh-oath__ledger">
        <p class="rh-eyebrow">The coronation ledger</p>
        <h2 class="rh-title rh-title--big">Who takes the throne?</h2>
        <p class="rh-oath__lede">
          Sign your name and choose a title. After the ceremony the kingdom is
          seen through your eyes.
        </p>
        <label class="rh-field">
          <span>Your name</span>
          <input
            v-model="rulerName"
            type="text"
            maxlength="64"
            autocomplete="off"
            placeholder="Mo"
            required
            class="rh-input"
          />
        </label>
        <label class="rh-field">
          <span>Your honorific</span>
          <input
            v-model="honorific"
            type="text"
            list="ruler-honorific-suggestions"
            maxlength="40"
            placeholder="Queen"
            class="rh-input"
          />
          <datalist id="ruler-honorific-suggestions">
            <option
              v-for="title in honorificSuggestions"
              :key="title"
              :value="title"
            />
          </datalist>
        </label>
        <p class="rh-oath__quip">
          “The court is waiting. The fish, regrettably, are not.”
        </p>
        <button
          type="submit"
          class="rh-btn rh-btn--gold rh-btn--big rh-oath__go"
          :disabled="!rulerName.trim() || creating"
        >
          {{ creating ? 'Preparing the reign…' : 'Begin your reign' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import {
  HERO_RULER_PRESET_ID,
  RULER_PRESETS,
} from '~/utils/rulerHooked/rulerPresets'
import { BACKDROPS } from '~/utils/rulerHooked/artLibrary'

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
const honorificSuggestions = [
  ...new Set(RULER_PRESETS.map((preset) => preset.title)),
]

function selectSlot(saveId: string) {
  store.loadSlot(saveId)
  emit('picked')
}
async function start() {
  if (!rulerName.value.trim() || creating.value) return
  creating.value = true
  try {
    await store.newGame(
      '',
      rulerName.value.trim(),
      honorific.value.trim() || 'Ruler',
      {
        presetId: presetId.value,
        customPortraitFile: customPortraitFile.value ?? undefined,
      },
    )
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

<style scoped>
.rh-title-screen__veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 20%, transparent 30%, rgb(37 11 31 / 0.45)),
    linear-gradient(180deg, rgb(37 11 31 / 0.15), rgb(37 11 31 / 0.55));
  pointer-events: none;
}
.rh-title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.5rem, 2cqi, 1.25rem);
  padding: clamp(0.75rem, 3cqi, 2rem) clamp(0.6rem, 3cqi, 2rem);
  overflow-y: auto;
}
.rh-title-screen__head {
  position: relative;
  z-index: 2;
  display: grid;
  justify-items: center;
  gap: 0.35rem;
  text-align: center;
}
.rh-lockup {
  display: grid;
  justify-items: center;
  color: #fff1c9;
  font-family: var(--rh-display);
  font-weight: 800;
  line-height: 0.9;
  text-shadow:
    0 3px 0 #5a1d3f,
    0 0 2px #5a1d3f,
    0 8px 22px rgb(0 0 0 / 0.55);
}
.rh-lockup__the {
  font-size: clamp(0.9rem, 2.4cqi, 1.4rem);
  letter-spacing: 0.35em;
  text-transform: uppercase;
}
.rh-lockup__main {
  font-size: clamp(2.2rem, 8.5cqi, 5.5rem);
}
.rh-lockup__main em {
  font-size: 0.6em;
  color: var(--rh-gold-soft);
}
.rh-lockup__tag {
  padding: 0.2rem 1rem;
  border-radius: 0.4rem;
  background: rgb(59 21 48 / 0.82);
  border: 1px solid var(--rh-gold);
  color: var(--rh-gold-soft);
  font-style: italic;
  font-size: clamp(0.78rem, 1.6cqi, 0.95rem);
}
.rh-title-screen__toggle {
  margin-top: 0.25rem;
}
.rh-title-screen__panel {
  position: relative;
  z-index: 2;
  width: min(60rem, 100%);
}
.rh-oath {
  display: grid;
  gap: clamp(0.6rem, 2cqi, 1rem);
}
@container rhconsole (min-width: 760px) {
  .rh-oath {
    grid-template-columns: minmax(16rem, 0.9fr) 1.1fr;
    align-items: stretch;
  }
}
.rh-oath > *,
.rh-title-screen__panel {
  min-width: 0;
}
.rh-oath__likeness {
  padding: 0.75rem;
}
.rh-oath__label {
  text-align: center;
  color: var(--rh-gold-soft);
  font-family: var(--rh-display);
  font-weight: 700;
  margin-bottom: 0.4rem;
}
.rh-oath__ledger {
  display: grid;
  gap: 0.6rem;
  align-content: center;
}
.rh-oath__lede,
.rh-oath__quip {
  font-size: 0.92rem;
  line-height: 1.4;
}
.rh-oath__quip {
  font-style: italic;
  opacity: 0.75;
}
.rh-oath__go {
  width: 100%;
}
.rh-field {
  display: grid;
  gap: 0.2rem;
}
.rh-field > span {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--rh-plum);
}
.rh-ledger {
  max-width: 40rem;
  display: grid;
  gap: 0.5rem;
}
.rh-ledger__row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem;
  border-radius: 0.7rem;
  background: rgb(255 255 255 / 0.5);
  border: 1px solid rgb(58 38 22 / 0.2);
}
.rh-ledger__pick {
  display: grid;
  flex: 1;
  min-width: 0;
  min-height: 3.25rem;
  padding: 0.25rem 0.5rem;
  text-align: left;
  border-radius: 0.5rem;
}
.rh-ledger__pick:hover {
  background: rgb(217 164 65 / 0.18);
}
.rh-ledger__pick strong {
  font-family: var(--rh-display);
  font-size: 1.1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rh-ledger__pick span {
  font-size: 0.78rem;
  opacity: 0.75;
}
</style>
