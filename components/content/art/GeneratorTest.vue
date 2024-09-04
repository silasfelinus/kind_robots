<template>
  <div class="art-generator">
    <h1>Complete Art Generation Options</h1>
    <form @submit.prevent="generateArt">
      <!-- Prompt String -->
      <div>
        <label for="promptString">Prompt:</label>
        <input
          id="promptString"
          v-model="formData.promptString"
          type="text"
          placeholder="Enter prompt..."
          required
        />
      </div>

      <!-- Title -->
      <div>
        <label for="title">Title:</label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          placeholder="Enter title..."
        />
      </div>

      <!-- Description -->
      <div>
        <label for="description">Description:</label>
        <input
          id="description"
          v-model="formData.description"
          type="text"
          placeholder="Enter description..."
        />
      </div>

      <!-- Flavor Text -->
      <div>
        <label for="flavorText">Flavor Text:</label>
        <input
          id="flavorText"
          v-model="formData.flavorText"
          type="text"
          placeholder="Enter flavor text..."
        />
      </div>

      <!-- Highlight Image -->
      <div>
        <label for="highlightImage">Highlight Image:</label>
        <input
          id="highlightImage"
          v-model="formData.highlightImage"
          type="text"
          placeholder="Enter highlight image URL..."
        />
      </div>

      <!-- CFG Value -->
      <div>
        <label for="cfg">CFG:</label>
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

      <!-- Steps -->
      <div>
        <label for="steps">Steps:</label>
        <input
          id="steps"
          v-model="formData.steps"
          type="number"
          placeholder="Enter steps..."
        />
      </div>

      <!-- Checkpoint -->
      <div>
        <label for="checkpoint">Checkpoint:</label>
        <input
          id="checkpoint"
          v-model="formData.checkpoint"
          type="text"
          placeholder="Enter checkpoint..."
        />
      </div>

      <!-- Sampler -->
      <div>
        <label for="sampler">Sampler:</label>
        <input
          id="sampler"
          v-model="formData.sampler"
          type="text"
          placeholder="Enter sampler..."
        />
      </div>

      <!-- Seed -->
      <div>
        <label for="seed">Seed (optional):</label>
        <input
          id="seed"
          v-model="formData.seed"
          type="number"
          placeholder="Enter seed..."
        />
      </div>

      <!-- Designer -->
      <div>
        <label for="designer">Designer:</label>
        <input
          id="designer"
          v-model="formData.designer"
          type="text"
          placeholder="Enter designer name..."
        />
      </div>

      <!-- Gallery Name -->
      <div>
        <label for="galleryName">Gallery Name:</label>
        <input
          id="galleryName"
          v-model="formData.galleryName"
          type="text"
          placeholder="Enter gallery name..."
        />
      </div>

      <!-- Channel Name -->
      <div>
        <label for="channelName">Channel Name:</label>
        <input
          id="channelName"
          v-model="formData.channelName"
          type="text"
          placeholder="Enter channel name..."
        />
      </div>

      <!-- Pitch Name -->
      <div>
        <label for="pitch">Pitch Name:</label>
        <input
          id="pitch"
          v-model="formData.pitch"
          type="text"
          placeholder="Enter pitch name..."
        />
      </div>

      <!-- Public/Private Option -->
      <div>
        <label for="isPublic">Is Public?</label>
        <input id="isPublic" v-model="formData.isPublic" type="checkbox" />
      </div>

      <!-- Mature Content -->
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

// CFG options from 1 to 36
const cfgOptions = Array.from({ length: 36 }, (_, i) => i + 1)

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
  galleryName: '',
  channelName: '',
  pitch: '',
  isPublic: true,
  isMature: false,
})

const steps = ref([])
const imageUrl = ref('')
const errorMessage = ref('')

const generateArt = async () => {
  steps.value = []
  imageUrl.value = ''
  errorMessage.value = ''

  // Calculate CFG value with optional half step
  const cfgValue = formData.value.cfgHalf
    ? formData.value.cfg + 0.5
    : formData.value.cfg

  const payload = { ...formData.value, cfg: cfgValue }

  try {
    steps.value.push('🚀 Sending request to generate art...')
    const res = await fetch('/api/art/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (data.success) {
      steps.value.push('🎨 Art entry created successfully!')
      steps.value.push(`🖼 Path: ${data.newArt.path}`)
      steps.value.push('🎉 Art generation complete!')

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
