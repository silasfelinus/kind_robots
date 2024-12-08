<template>
  <div class="grid gap-4">
    <!-- Backstory -->
    <div>
      <CheckboxToggle
        v-model="characterStore.keepField.backstory"
        label="Freeze Backstory"
      />
      <h2 class="text-lg font-medium">Backstory</h2>
      <textarea
        v-model="characterStore.characterForm.backstory"
        class="w-full p-3 rounded-lg border"
        placeholder="Write the character's backstory..."
        rows="4"
        :disabled="characterStore.keepField.backstory"
      ></textarea>
    </div>

    <!-- Quirks, Inventory, Skills -->
    <div class="grid grid-cols-3 gap-4">
      <!-- Quirks -->
      <div>
        <CheckboxToggle
          v-model="characterStore.keepField.quirks"
          label="Freeze Quirks"
        />
        <h3 class="text-sm font-bold">Quirks</h3>
        <textarea
          v-model="characterStore.characterForm.quirks"
          class="w-full p-3 rounded-lg border"
          placeholder="Enter character's quirks..."
          rows="4"
          :disabled="characterStore.keepField.quirks"
        ></textarea>
      </div>
      <!-- Inventory -->
      <div>
        <CheckboxToggle
          v-model="characterStore.keepField.inventory"
          label="Freeze Inventory"
        />
        <h3 class="text-sm font-bold">Inventory</h3>
        <textarea
          v-model="characterStore.characterForm.inventory"
          class="w-full p-3 rounded-lg border"
          placeholder="Enter character's inventory..."
          rows="4"
          :disabled="characterStore.keepField.inventory"
        ></textarea>
      </div>
      <!-- Skills -->
      <div>
        <CheckboxToggle
          v-model="characterStore.keepField.skills"
          label="Freeze Skills"
        />
        <h3 class="text-sm font-bold">Skills</h3>
        <textarea
          v-model="characterStore.characterForm.skills"
          class="w-full p-3 rounded-lg border"
          placeholder="Enter character's skills..."
          rows="4"
          :disabled="characterStore.keepField.skills"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()
</script>
