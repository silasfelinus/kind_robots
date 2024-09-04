<template>
  <div class="art-generator">
    <h1>Test Art Generation API</h1>
    <form @submit.prevent="generateArt">
      <div>
        <label for="prompt">Prompt:</label>
        <input
          id="prompt"
          v-model="formData.prompt"
          type="text"
          placeholder="Enter prompt..."
          required
        />
      </div>
      <div>
        <label for="designer">Designer:</label>
        <input
          id="designer"
          v-model="formData.designer"
          type="text"
          placeholder="Enter designer..."
        />
      </div>
      <div>
        <label for="galleryName">Gallery Name:</label>
        <input
          id="galleryName"
          v-model="formData.galleryName"
          type="text"
          placeholder="Enter gallery name..."
        />
      </div>
      <div>
        <label for="cfg">CFG:</label>
        <input
          id="cfg"
          v-model="formData.cfg"
          type="text"
          placeholder="Enter CFG..."
        />
      </div>
      <div>
        <label for="steps">Steps:</label>
        <input
          id="steps"
          v-model="formData.steps"
          type="number"
          placeholder="Enter steps..."
        />
      </div>
      <button type="submit">Generate Art</button>
    </form>

    <div v-if="steps.length">
      <h2>API Steps</h2>
      <ul>
        <li v-for="(step, index) in steps" :key="index">
          {{ step }}
        </li>
      </ul>
    </div>

    <div v-if="errorMessage" class="error">
      <h2>Error</h2>
      <p>{{ errorMessage }}</p>
    </div>

    <div v-if="imageUrl" class="image-preview">
      <h2>Generated Image</h2>
      <img :src="imageUrl" alt="Generated Art" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const formData = ref({
  prompt: '',
  designer: '',
  galleryName: '',
  cfg: 'default_cfg',
  steps: 20,
})

const steps = ref([])
const imageUrl = ref('')
const errorMessage = ref('')

const generateArt = async () => {
  steps.value = []
  imageUrl.value = ''
  errorMessage.value = ''

  const payload = { ...formData.value }
  try {
    // Start the art generation
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

      // Display generated image
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
