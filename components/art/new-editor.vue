<template>
  <div class="p-4 max-w-4xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold">Image Editor</h1>

    <!-- PROMPT -->
    <div class="flex flex-col gap-2">
      <label>Primary Prompt</label>
      <textarea v-model="prompt" rows="2" class="textarea textarea-bordered" placeholder="Describe your image..." />
      
      <label>Secondary Prompt (optional)</label>
      <textarea v-model="promptB" rows="2" class="textarea textarea-bordered" placeholder="Alternate angle or concept..." />
    </div>

    <!-- IMAGE UPLOAD -->
    <div>
      <label class="block mb-1">Input Image (optional)</label>
      <input type="file" accept="image/*" @change="handleImageUpload" class="file-input file-input-bordered" />
      <img v-if="imageData" :src="imageData" class="mt-2 max-w-xs border rounded" />
    </div>

    <!-- MASK UPLOAD -->
    <div v-if="useInpaint">
      <label class="block mb-1">Mask Image (for inpaint)</label>
      <input type="file" accept="image/*" @change="handleMaskUpload" class="file-input file-input-bordered" />
      <img v-if="maskData" :src="maskData" class="mt-2 max-w-xs border rounded" />
    </div>

    <!-- TOGGLES -->
    <div class="flex flex-wrap gap-4">
      <label><input type="checkbox" v-model="useInpaint" /> Inpaint</label>
      <label><input type="checkbox" v-model="useUpscale" /> Upscale</label>
      <label><input type="checkbox" v-model="useOutpaint" /> Outpaint</label>
      <label><input type="checkbox" v-model="useMorph" /> Morph</label>
    </div>

    <!-- SUBMIT -->
    <div>
      <button class="btn btn-accent" :disabled="loading" @click="submit">
        <span v-if="loading">Submitting…</span>
        <span v-else>Submit</span>
      </button>
    </div>

    <!-- RESULT -->
    <div v-if="graphOutput" class="mt-6">
      <h2 class="text-lg font-semibold">Result</h2>
      <img :src="graphOutput" alt="Generated Output" class="max-w-full border rounded" />
    </div>

    <!-- ERROR -->
    <div v-if="error" class="mt-4 text-red-600">
      Error: {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useComfyStore } from '@/stores/comfyStore'

const comfyStore = useComfyStore()
comfyStore.initialize()

const {
  prompt,
  promptB,
  imageData,
  maskData,
  useInpaint,
  useUpscale,
  useOutpaint,
  useMorph,
  graphOutput,
  error,
  loading,
} = storeToRefs(comfyStore)

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => comfyStore.setImage(reader.result as string)
    reader.readAsDataURL(file)
  }
}

function handleMaskUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => comfyStore.setMask(reader.result as string)
    reader.readAsDataURL(file)
  }
}

async function submit() {
  await comfyStore.submitGraph()
}
</script>