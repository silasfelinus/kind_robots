<!-- components/ruler-hooked/ruler-hooked-cosmetics.vue
     In-play "change appearance" panel (ruler-hooked/t-021: "they are
     cosmetic-only by design, so there is no reason to lock them at
     creation"). Collapsed by default so it doesn't compete with the play
     screen; opens onto the same picker the new-game form uses. -->
<template>
  <details class="rounded-xl border border-base-300 bg-base-100 p-3">
    <summary class="cursor-pointer text-xs font-medium opacity-70">
      Change appearance
    </summary>
    <div class="mt-2 flex flex-col gap-2">
      <RulerHookedCosmeticsPicker
        v-model="presetId"
        @custom-file="(f: File | null) => (customPortraitFile = f)"
      />
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Saving…' : 'Save appearance' }}
        </button>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { HERO_RULER_PRESET_ID } from '~/utils/rulerHooked/rulerPresets'

const store = useRulerHookedStore()
const presetId = ref(
  store.save?.ruler.cosmetics?.presetId ?? HERO_RULER_PRESET_ID,
)
const customPortraitFile = ref<File | null>(null)
const saving = ref(false)

async function save() {
  saving.value = true
  try {
    await store.updateCosmetics({
      presetId: presetId.value,
      customPortraitFile: customPortraitFile.value ?? undefined,
    })
    customPortraitFile.value = null
  } finally {
    saving.value = false
  }
}
</script>
