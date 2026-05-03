<!-- /components/content/weird/character-bottom.vue -->
<template>
  <div class="grid gap-1 md:gap-4">
    <div>
      <CheckboxToggle v-model="freezeBackstory" label="Freeze Backstory" />
      <h2 class="text-lg font-medium">Backstory</h2>
      <textarea
        v-model="characterStore.characterForm.backstory"
        class="w-full rounded-lg border p-3"
        placeholder="Write the character's backstory..."
        rows="4"
        :disabled="freezeBackstory"
      ></textarea>
    </div>

    <div class="grid grid-cols-3 gap-1 md:gap-4">
      <div>
        <CheckboxToggle v-model="freezeQuirks" label="Freeze Quirks" />
        <h3 class="text-sm font-bold">Quirks</h3>
        <textarea
          v-model="characterStore.characterForm.quirks"
          class="w-full rounded-lg border p-1 md:p-3"
          placeholder="Enter character's quirks..."
          rows="4"
          :disabled="freezeQuirks"
        ></textarea>
      </div>

      <div>
        <CheckboxToggle v-model="freezeInventory" label="Freeze Inventory" />
        <h3 class="text-sm font-bold">Inventory</h3>
        <textarea
          v-model="characterStore.characterForm.inventory"
          class="w-full rounded-lg border p-1 md:p-3"
          placeholder="Enter character's inventory..."
          rows="4"
          :disabled="freezeInventory"
        ></textarea>
      </div>

      <div>
        <CheckboxToggle v-model="freezeSkills" label="Freeze Skills" />
        <h3 class="text-sm font-bold">Skills</h3>
        <textarea
          v-model="characterStore.characterForm.skills"
          class="w-full rounded-lg border p-1 md:p-3"
          placeholder="Enter character's skills..."
          rows="4"
          :disabled="freezeSkills"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()

const freezeBackstory = computed({
  get: (): boolean => Boolean(characterStore.keepField.backstory),
  set: (value: boolean) => {
    characterStore.keepField.backstory = value
  },
})

const freezeQuirks = computed({
  get: (): boolean => Boolean(characterStore.keepField.quirks),
  set: (value: boolean) => {
    characterStore.keepField.quirks = value
  },
})

const freezeInventory = computed({
  get: (): boolean => Boolean(characterStore.keepField.inventory),
  set: (value: boolean) => {
    characterStore.keepField.inventory = value
  },
})

const freezeSkills = computed({
  get: (): boolean => Boolean(characterStore.keepField.skills),
  set: (value: boolean) => {
    characterStore.keepField.skills = value
  },
})
</script>
