<template>
  <div class="rounded-2xl border p-4 m-4 mx-auto bg-base-200 grid gap-4 grid-cols-1">
    <h1 class="text-4xl text-center col-span-full">Create or Edit a Character</h1>

    <!-- Top Section -->
    <div class="flex flex-wrap justify-between items-center col-span-full gap-4">
      <character-title />
    </div>

    <!-- Middle Section -->
    <div class="flex flex-wrap w-full mt-4">
      <!-- Left: Art Section -->
      <div class="w-full md:w-1/2 p-4">
        <character-art />
      </div>

      <!-- Right: Stats Section -->
      <div class="w-full md:w-1/2 p-4">
        <character-stats />
        <character-rewards />
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="grid gap-4 mt-4">
      <character-bottom />
    </div>

    <!-- Save Button -->
    <div class="text-center mt-4">
      <button class="btn btn-primary" @click="handleSubmit">
        Save Character
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'
import CharacterTitle from '@/components/CharacterTitle.vue'
import CharacterArt from '@/components/CharacterArt.vue'
import CharacterStats from '@/components/CharacterStats.vue'
import CharacterRewards from '@/components/CharacterRewards.vue'
import CharacterBottom from '@/components/CharacterBottom.vue'

const characterStore = useCharacterStore()
const userStore = useUserStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const designerName = computed(() =>
  userStore.getUsernameByUserId(characterStore.selectedCharacter?.userId || 10),
)

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    await characterStore.saveCharacter()
    successMessage.value = characterStore.selectedCharacter
      ? 'Character updated successfully!'
      : 'New character created successfully!'
  } catch (error) {
    errorMessage.value = `Error: ${error}`
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  characterStore.generateRandomCharacter()
})
</script>
