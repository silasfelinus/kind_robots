<template>
  <div class="art-generator">
    <h1>Complete Art Generation Options</h1>
    <form @submit.prevent="generateArt">
      <!-- Prompt String (required) -->
      <div>
        <label for="promptString">Prompt (Required):</label>
        <input
          id="promptString"
          v-model="formData.promptString"
          type="text"
          placeholder="Enter the prompt (e.g., 'a cyberpunk city at night')"
          required
        />
      </div>

      <!-- Title (optional) -->
      <div>
        <label for="title">Title (Optional):</label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          placeholder="Enter title (e.g., 'Night City')"
        />
      </div>

      <!-- Description (optional) -->
      <div>
        <label for="description">Description (Optional):</label>
        <input
          id="description"
          v-model="formData.description"
          type="text"
          placeholder="Enter description (e.g., 'A futuristic city filled with neon lights')"
        />
      </div>

      <!-- Flavor Text (optional) -->
      <div>
        <label for="flavorText">Flavor Text (Optional):</label>
        <input
          id="flavorText"
          v-model="formData.flavorText"
          type="text"
          placeholder="Add extra context (e.g., 'Gothic theme with dark tones')"
        />
      </div>

      <!-- Highlight Image (optional) -->
      <div>
        <label for="highlightImage">Highlight Image URL (Optional):</label>
        <input
          id="highlightImage"
          v-model="formData.highlightImage"
          type="text"
          placeholder="Enter a URL for the highlight image"
        />
      </div>

      <!-- CFG Value (required) -->
      <div>
        <label for="cfg">CFG Value (Required):</label>
        <select id="cfg" v-model="formData.cfg">
          <option v-for="value in cfgOptions" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
        <div>
          <label>
            <input v-model="formData.cfgHalf" type="checkbox" />
            Add .5 to CFG
          </label>
        </div>
      </div>

      <!-- Steps (required) -->
      <div>
        <label for="steps">Steps (Required, default 20):</label>
        <input
          id="steps"
          v-model="formData.steps"
          type="number"
          placeholder="Enter number of steps (e.g., 50)"
        />
      </div>

      <!-- Checkpoint (optional) -->
      <div>
        <label for="checkpoint">Checkpoint (Optional):</label>
        <input
          id="checkpoint"
          v-model="formData.checkpoint"
          type="text"
          placeholder="Enter the checkpoint (e.g., 'v1.2')"
        />
      </div>

      <!-- Sampler (optional) -->
      <div>
        <label for="sampler">Sampler (Optional):</label>
        <input
          id="sampler"
          v-model="formData.sampler"
          type="text"
          placeholder="Enter sampler (e.g., 'Euler')"
        />
      </div>

      <!-- Seed (optional) -->
      <div>
        <label for="seed">Seed (Optional):</label>
        <input
          id="seed"
          v-model="formData.seed"
          type="number"
          placeholder="Enter a seed value for randomization"
        />
      </div>

      <!-- Designer (optional) -->
      <div>
        <label for="designer">Designer (Optional):</label>
        <input
          id="designer"
          v-model="formData.designer"
          type="text"
          placeholder="Enter designer's name"
        />
      </div>

      <gallery-selector />

      <!-- Channel Name (optional) -->
      <div>
        <label for="channelName">Channel Name (Optional):</label>
        <input
          id="channelName"
          v-model="formData.channelName"
          type="text"
          placeholder="Enter channel name (optional)"
        />
      </div>

      <!-- Pitch Name (optional) -->
      <div>
        <label for="pitch">Pitch Name (Optional):</label>
        <input
          id="pitch"
          v-model="formData.pitch"
          type="text"
          placeholder="Enter pitch name (e.g., 'Gothcore')"
        />
      </div>

      <!-- Is Public (checkbox) -->
      <div>
        <label for="isPublic">Is Public?</label>
        <input id="isPublic" v-model="formData.isPublic" type="checkbox" />
      </div>

      <!-- Is Mature Content (checkbox) -->
      <div>
        <label for="isMature">Is Mature Content?</label>
        <input id="isMature" v-model="formData.isMature" type="checkbox" />
      </div>

      <!-- Submit Button -->
      <button type="submit">Generate Art</button>
    </form>

    <!-- API Steps -->
    <div v-if="steps.length">
      <h2>API Steps</h2>
      <ul>
        <li v-for="(step, index) in steps" :key="index">
          {{ step }}
        </li>
      </ul>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error">
      <h2>Error</h2>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Generated Image Preview -->
    <div v-if="imageUrl" class="image-preview">
      <h2>Generated Image</h2>
      <img :src="imageUrl" alt="Generated Art" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useGalleryStore } from './../../../stores/galleryStore'

// CFG options from 1 to 36
const cfgOptions = Array.from({ length: 36 }, (_, i) => i + 1)

const userStore = useUserStore()
const galleryStore = useGalleryStore()

const user = computed(() => userStore.currentUser)
const gallery = computed(() => galleryStore.currentGallery)

const formData = ref({
  promptString: '',
  title: '',
  description: '',
  flavorText: '',
  highlightImage: '',
  cfg: 3, // Default CFG value
  cfgHalf: false, // Default is no half step
  steps: 20,
  checkpoint: '',
  sampler: '',
  seed: undefined,
  designer: '',
  galleryName: gallery.value.name,
  galleryId: gallery.value.id,
  channelName: '',
  pitch: '',
  isPublic: true,
  isMature: false,
  userId: user.value.userId || 1,
  username: user.value.username,
})

const steps = ref([])
const imageUrl = ref('')
const errorMessage = ref('')

const generateArt = async () => {
  imageUrl.value = ''
  errorMessage.value = ''

  try {
    const res = await fetch('/api/art/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData.value),
    })

    const data = await res.json()

    if (data.success) {
      console.log('🎨 Art generation complete!')

      imageUrl.value = `/public/${data.newArt.path}`
    } else {
      throw new Error(data.message || 'Unknown error')
    }
  } catch (error) {
    console.error('Error generating art:', error)
    steps.value.push('⚠️ Error generating art')
    errorMessage.value = error.message || 'An unknown error occurred'
  }
}
</script>

<style scoped>
.art-generator {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.error {
  color: red;
}

.image-preview img {
  max-width: 100%;
  margin-top: 1rem;
}
</style>
