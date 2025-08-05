<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold">New Editor – Build a Blueprint</h1>

    <!-- Input source toggle -->
    <div class="flex gap-4">
      <label><input type="radio" value="text" v-model="inputType" /> Text</label>
      <label><input type="radio" value="image" v-model="inputType" /> Image</label>
    </div>

    <!-- Prompt input -->
    <div v-if="inputType === 'text'">
      <textarea v-model="prompt" class="textarea textarea-bordered w-full" placeholder="Describe your prompt..." />
    </div>

    <!-- Image input -->
    <div v-else>
      <input type="file" accept="image/*" @change="handleImageUpload" />
      <img v-if="imageData" :src="imageData" class="mt-2 max-w-sm border rounded" />
    </div>

    <!-- Checkpoint selection -->
    <div>
      <label>Checkpoint</label>
      <select v-model="checkpoint" class="select select-bordered">
        <option value="flux">Flux</option>
        <option value="sdxl">SDXL</option>
      </select>
    </div>

    <!-- Modifier steps -->
    <div class="mt-4 space-y-4">
      <h2 class="text-lg font-semibold">Modifier Chain</h2>
      <div v-for="(step, index) in modifierSteps" :key="step.id" class="p-4 border rounded bg-base-100 space-y-2">
        <div class="flex justify-between items-center">
          <span>{{ step.type }}</span>
          <div class="flex gap-2">
            <button class="btn btn-xs" @click="moveStepUp(index)">↑</button>
            <button class="btn btn-xs" @click="moveStepDown(index)">↓</button>
            <button class="btn btn-xs btn-error" @click="removeStep(step.id)">✕</button>
          </div>
        </div>
        <!-- Modifier config (simple key-value textarea for now) -->
        <textarea v-model="step.config.details" class="textarea textarea-bordered w-full" placeholder="Config (optional)" />
      </div>
    </div>

    <!-- Add modifier -->
    <div class="flex items-center gap-2">
      <select v-model="newStepType" class="select select-bordered">
        <option disabled value="">Select modifier...</option>
        <option value="inpaint">Inpaint</option>
        <option value="outpaint">Outpaint</option>
        <option value="upscale">Upscale</option>
        <option value="morph">Morph</option>
      </select>
      <button @click="addModifierStep" class="btn btn-outline">+ Add</button>
    </div>

    <!-- Final submit -->
    <div class="mt-6">
      <button class="btn btn-primary w-full" @click="submitBlueprint" :disabled="loading">
        {{ loading ? 'Submitting…' : 'Submit Blueprint' }}
      </button>
    </div>

    <!-- Output -->
    <div v-if="graphOutput" class="mt-6">
      <h3 class="text-lg font-semibold">Output</h3>
      <img :src="graphOutput" class="rounded border max-w-full" />
    </div>

    <!-- Error -->
    <div v-if="error" class="text-red-600 mt-2">
      Error: {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useComfyStore } from '@/stores/comfyStore'

const comfyStore = useComfyStore()
comfyStore.initialize()

const {
  prompt,
  imageData,
  checkpoint,
  inputType,
  modifierSteps,
  graphOutput,
  loading,
  error,
} = storeToRefs(comfyStore)

const newStepType = ref('')

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => comfyStore.setImage(reader.result as string)
  reader.readAsDataURL(file)
}

function addModifierStep() {
  if (!newStepType.value) return
  comfyStore.addStep(newStepType.value)
  newStepType.value = ''
}

function removeStep(id: string) {
  comfyStore.removeStep(id)
}

function moveStepUp(index: number) {
  comfyStore.moveStepUp(index)
}

function moveStepDown(index: number) {
  comfyStore.moveStepDown(index)
}

async function submitBlueprint() {
  await comfyStore.submitBlueprint()
}
</script>