<template>
  <div
    class="rounded-2xl border p-4 m-4 mx-auto bg-base-200 grid gap-4 grid-cols-1"
  >
    <h1 class="text-4xl text-center col-span-full">
      Create or Edit a Character
    </h1>

    <!-- Top Section -->
    <div
      class="flex flex-wrap justify-between items-center col-span-full gap-4"
    >
      <!-- Title, Honorific, and Class -->
      <div class="w-full lg:w-1/2 space-y-2">
        <h2 class="text-lg font-medium">Character Info</h2>
        <div class="flex items-center space-x-2">
          <CheckboxToggle
            v-model="characterStore.keepField.name"
            label="Freeze Name"
            title="Prevent changes to name"
          />
          <input
            v-model="characterStore.characterForm.name"
            type="text"
            class="w-full p-3 rounded-lg border"
            placeholder="Name"
            :disabled="characterStore.keepField.name"
          />
          <span>The</span>
          <CheckboxToggle
            v-model="characterStore.keepField.honorific"
            label="Freeze Honorific"
            title="Prevent changes to honorific"
          />
          <input
            v-model="characterStore.characterForm.honorific"
            type="text"
            class="w-full p-3 rounded-lg border"
            placeholder="Honorific"
            :disabled="characterStore.keepField.honorific"
          />
        </div>
        <div class="flex items-center space-x-2">
          <CheckboxToggle
            v-model="characterStore.keepField.class"
            label="Freeze Class"
            title="Prevent changes to class"
          />
          <input
            v-model="characterStore.characterForm.class"
            type="text"
            class="w-full p-3 rounded-lg border"
            placeholder="Class"
            :disabled="characterStore.keepField.class"
          />
        </div>
      </div>

      <!-- Mode and Public Toggle -->
      <div class="w-full lg:w-1/2 flex items-center space-x-4">
        <CheckboxToggle
          v-model="characterStore.generationMode"
          label="Generation Mode"
          title="Enable or disable generation mode"
        />
        <button
          class="btn btn-primary"
          :class="{
            'btn-active': characterStore.characterForm.isPublic,
          }"
          @click="toggleVisibility(!characterStore.characterForm.isPublic)"
        >
          {{ characterStore.characterForm.isPublic ? 'Public' : 'Private' }}
        </button>
      </div>

      <!-- Designer -->
      <div class="w-full lg:w-auto">
        <label class="block text-sm font-medium">Designer:</label>
        <p>{{ designerName }}</p>
      </div>
    </div>

    <!-- Middle Section -->
    <div class="flex flex-wrap w-full mt-4">
      <!-- Left: Art Section -->
      <div class="w-full md:w-1/2 p-4">
        <h2 class="text-lg font-medium">Character Art</h2>
        <div class="grid gap-4">
          <CheckboxToggle
            v-model="characterStore.keepField.artPrompt"
            label="Freeze Art Prompt"
            title="Prevent changes to art prompt"
          />
          <div class="flex justify-center">
            <img
              v-if="characterStore.artImagePath"
              :src="characterStore.artImagePath"
              alt="Character Portrait"
              class="object-cover w-48 h-64 rounded-lg"
            />
            <img
              v-else
              src="/images/placeholder-portrait.webp"
              alt="Default Portrait"
              class="object-cover w-48 h-64 rounded-lg"
            />
          </div>
          <textarea
            v-model="characterStore.characterForm.artPrompt"
            placeholder="Describe your character's appearance or a scene..."
            class="w-full p-3 rounded-lg border"
            :disabled="characterStore.keepField.artPrompt"
          ></textarea>
          <div class="flex space-x-2">
            <button
              class="btn btn-primary w-1/2"
              :disabled="characterStore.isGeneratingArt"
              @click="generateArtImage"
            >
              {{
                characterStore.isGeneratingArt
                  ? 'Generating...'
                  : 'Generate Art'
              }}
            </button>
            <character-uploader class="w-1/2" @uploaded="setArtImageId" />
          </div>
        </div>
      </div>

      <!-- Right: Stats -->
      <div class="w-full md:w-1/2 p-4">
        <h2 class="text-lg font-medium">Stats</h2>
        <div class="grid grid-cols-2 gap-4">
          <template v-for="i in 6" :key="'stat-' + i">
            <div class="relative">
              <CheckboxToggle
                v-model="characterStore.keepField[`statName${i}`]"
                :label="'Freeze Stat ' + i"
                :title="'Prevent changes to Stat ' + i"
              />
              <label
                :for="'statName' + i"
                class="block text-sm font-bold uppercase"
              >
                {{
                  characterStore.characterForm[
                    `statName${i}` as keyof Character
                  ] || 'Stat'
                }}
              </label>
              <input
                :id="'statValue' + i"
                v-model="
                  characterStore.characterForm[
                    `statValue${i}` as keyof Character
                  ]
                "
                type="number"
                class="w-full p-2 rounded-lg border text-center"
              />
            </div>
          </template>
        </div>
        <button
          class="btn btn-secondary mt-2"
          @click="characterStore.rerollStats"
        >
          Reroll Stats
        </button>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="grid gap-4 mt-4">
      <!-- Rewards -->
      <div>
        <h2 class="text-lg font-medium">Choose Reward:</h2>
        <character-rewards />
      </div>

      <!-- Backstory -->
      <div>
        <CheckboxToggle
          v-model="characterStore.keepField.backstory"
          label="Freeze Backstory"
          title="Prevent changes to backstory"
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

      <!-- Additional Fields -->
      <div>
        <h2 class="text-lg font-medium">Other Details</h2>
        <p>Quirks, Inventory, Skills</p>
      </div>
    </div>

    <!-- Submit Button -->
    <form
      class="bg-white shadow-md rounded-xl p-6 w-full mt-4"
      @submit.prevent="handleSubmit"
    >
      <div v-if="isLoading" class="loading loading-ring loading-lg mt-4"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-green-500 mt-2">
        {{ successMessage }}
      </div>

      <div class="flex flex-col md:flex-row md:space-x-4 mt-6">
        <button
          type="submit"
          class="btn btn-primary w-full md:w-auto"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Saving...</span>
          <span v-else>{{
            characterStore.selectedCharacter
              ? 'Update Character'
              : 'Create New Character'
          }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'

const characterStore = useCharacterStore()
const userStore = useUserStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const designerName = computed(() =>
  userStore.getUsernameByUserId(characterStore.selectedCharacter?.userId || 10),
)

function toggleVisibility(value: boolean) {
  characterStore.characterForm.isPublic = value
}

function setArtImageId(id: number) {
  characterStore.setArtImageId(id)
}

async function generateArtImage() {
  await characterStore.generateArtImage()
}

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
</script>
