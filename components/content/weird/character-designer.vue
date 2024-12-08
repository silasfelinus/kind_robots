<template>
  <div class="rounded-2xl border p-4 m-4 mx-auto bg-base-200 grid gap-4 grid-cols-1">
    <h1 class="text-4xl text-center col-span-full">Create or Edit a Character</h1>

    <!-- Top Section -->
    <div class="flex flex-wrap justify-between items-center col-span-full gap-4">
      <!-- Name and Honorific -->
      <div class="w-full lg:w-1/2 space-y-2">
        <h2 class="text-lg font-medium">Character Info</h2>
        <div class="flex items-center space-x-2">
          <CheckboxToggle
            v-model="characterStore.keepField.name"
            label="Freeze Name"
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

      <!-- Mode Toggle, Visibility, and Refresh -->
      <div class="w-full lg:w-1/2 flex items-center space-x-4">
        <generation-toggle />
        <button
          class="btn btn-primary"
          :class="{ 'btn-active': characterStore.characterForm.isPublic }"
          @click="toggleVisibility(!characterStore.characterForm.isPublic)"
        >
          {{ characterStore.characterForm.isPublic ? 'Public' : 'Private' }}
        </button>
        <button class="btn btn-secondary" @click="refreshCharacter">
          Refresh Character
        </button>
      </div>
    </div>

    <!-- Middle Section -->
    <div class="flex flex-wrap w-full mt-4">
      <!-- Left: Art Section -->
      <div class="w-full md:w-1/2 p-4">
        <h2 class="text-lg font-medium flex justify-between items-center">
          Character Art
          <gallery-selector class="w-auto" @gallery-selected="setGallery" />
        </h2>
        <div class="grid gap-4">
          <CheckboxToggle
            v-model="characterStore.keepField.artPrompt"
            label="Freeze Art Prompt"
          />
          <div class="flex justify-center">
            <img
              v-if="characterStore.characterForm.imagePath"
              :src="characterStore.characterForm.imagePath"
              alt="Character Portrait"
              class="object-cover w-48 h-64 rounded-lg"
            />
            <img
              v-else
              src="/images/bot.webp"
              alt="Default Portrait"
              class="object-cover w-48 h-64 rounded-lg"
            />
          </div>
          <button class="btn btn-accent w-full" @click="galleryStore.changeToRandomImage">
            Get Random Image
          </button>
          <character-uploader class="w-full mt-2" @uploaded="setArtImageId" />
          <textarea
            v-model="characterStore.characterForm.artPrompt"
            placeholder="Describe your character's appearance or a scene..."
            class="w-full p-3 rounded-lg border"
            :disabled="characterStore.keepField.artPrompt"
          ></textarea>
          <button
            class="btn btn-primary w-full"
            :disabled="characterStore.isGeneratingArt"
            @click="generateArtImage"
          >
            {{ characterStore.isGeneratingArt ? 'Generating...' : 'Generate Art' }}
          </button>
        </div>
      </div>

      <!-- Right: Stats Section -->
      <div class="w-full md:w-1/2 p-4">
        <h2 class="text-lg font-medium">Stats</h2>
        <div class="grid grid-cols-2 gap-4">
          <template v-for="i in 6" :key="'stat-' + i">
            <div>
              <label
                class="block text-sm font-bold uppercase"
                :for="'statName' + i"
              >
                <input
                  v-model="characterStore.characterForm[`statName${i}`]"
                  type="text"
                  class="w-full p-2 rounded-lg border"
                />
              </label>
              <input
                :id="'statValue' + i"
                :value="characterStore.characterForm[`statValue${i}`]"
                type="number"
                class="w-full p-2 rounded-lg border text-center"
                disabled
              />
            </div>
          </template>
        </div>
        <button class="btn btn-secondary mt-2" @click="characterStore.rerollStats">
          Reroll Stats
        </button>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="grid gap-4 mt-4">
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

function refreshCharacter() {
  characterStore.generateRandomCharacter()
}

onMounted(() => {
  characterStore.generateRandomCharacter()
})
</script>
