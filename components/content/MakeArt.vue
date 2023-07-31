<template>
  <div class="bg-base p-8">
    <h2 v-if="currentBot" class="text-2xl font-bold mb-4">{{ currentBot.prompt }}</h2>
    <input
      v-model="userText"
      class="input input-bordered w-full mb-4"
      placeholder="Enter your text here"
    />
    <div class="space-y-4">
      <label class="label">
        <span class="label-text">Seed:</span>
        <input v-model="settings.seed" type="number" class="input input-bordered" />
      </label>
      <label class="label">
        <span class="label-text">Sampler Name:</span>
        <input v-model="settings.sampler_name" type="text" class="input input-bordered" />
      </label>
      <label class="label">
        <span class="label-text">Batch Size:</span>
        <input v-model="settings.batch_size" type="number" class="input input-bordered" />
      </label>
      <label class="label">
        <span class="label-text">Number of Iterations:</span>
        <input v-model="settings.n_iter" type="number" class="input input-bordered" />
      </label>
      <label class="label">
        <span class="label-text">Steps:</span>
        <input v-model="settings.steps" type="number" class="input input-bordered" />
      </label>
      <label class="label">
        <span class="label-text">Config Scale:</span>
        <input v-model="settings.cfg_scale" type="number" class="input input-bordered" />
      </label>
      <label class="label">
        <span class="label-text">Width:</span>
        <input
          v-model="settings.width"
          type="number"
          class="input input-bordered"
          min="256"
          step="64"
          max="1024"
        />
      </label>
      <label class="label">
        <span class="label-text">Height:</span>
        <input
          v-model="settings.height"
          type="number"
          class="input input-bordered"
          min="256"
          step="64"
          max="1024"
        />
      </label>
    </div>
    <button class="btn btn-primary mt-4" @click="submit">Submit</button>
    <p class="mt-4 text-xl">{{ statusMessage }}</p>
  </div>
  <div v-if="imageData" class="mt-4">
    <img :src="imageData" alt="Generated Image" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBotStore } from '../../stores/botStore'
import { useStatusStore, StatusType } from '../../stores/statusStore'
import { useErrorStore, ErrorType } from '../../stores/errorStore'

const userText = ref('')
const statusStore = useStatusStore()
const errorStore = useErrorStore()
const botStore = useBotStore()
let currentBot = computed(() => botStore.currentBot)
// Declare a ref for storing the image data
const imageData = ref(null)

const statusMessage = computed(() => statusStore.message)

const settings = ref({
  seed: -1,
  sampler_name: 'string',
  batch_size: 1,
  n_iter: 1,
  steps: 50,
  cfg_scale: 7,
  width: 512,
  height: 512
})

const submit = async () => {
  try {
    if (!currentBot.value) {
      statusStore.setStatus(StatusType.INFO, 'Submitting your text...')
      const body = {
        text: userText.value,
        botId: currentBot.value.id,
        settings: settings.value
      }
      const response = await fetch('https://cafefred.purrsalon.com/sdapi/v1/txt2img', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const result = await response.json()
      // Assuming the image data is in Base64 format
      imageData.value = `data:image/png;base64,${result.images[0]}`

      statusStore.setStatus(StatusType.SUCCESS, 'Successfully submitted!')
    }
  } catch (error) {
    errorStore.handleError(
      () => {
        throw error
      },
      ErrorType.NETWORK_ERROR,
      'Failed to submit text'
    )
    statusStore.setStatus(StatusType.ERROR, 'Failed to submit text')
  }
}
</script>
