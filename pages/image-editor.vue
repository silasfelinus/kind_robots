<template>
  <div class="p-6 space-y-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold">Image Editor</h1>

    <!-- Upload -->
    <input
      type="file"
      accept="image/*"
      @change="handleUpload"
      class="file-input"
    />

    <!-- Canvas -->
    <canvas
      ref="canvas"
      class="border w-full rounded"
      :width="width"
      :height="height"
    />

    <!-- Controls -->
    <div class="flex gap-4">
      <button class="btn btn-accent" @click="applyGrayscale">Grayscale</button>
      <button class="btn btn-accent" @click="sendToFlux">Run FLUX</button>
    </div>

    <!-- Result -->
    <div v-if="resultImage">
      <h2 class="font-semibold mt-4">Edited Result</h2>
      <img :src="resultImage" class="rounded border" />
    </div>
  </div>
</template>

<script setup lang="ts">
const file = ref<File | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = computed(() => canvas.value?.getContext('2d') ?? null)
const resultImage = ref<string | null>(null)
const width = 512
const height = 512

function handleUpload(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files?.[0]) return
  file.value = target.files[0]

  const img = new Image()
  img.onload = () => {
    ctx.value?.clearRect(0, 0, width, height)
    ctx.value?.drawImage(img, 0, 0, width, height)
  }
  img.src = URL.createObjectURL(file.value)
}

function applyGrayscale() {
  if (!ctx.value || !canvas.value) return
  const imageData = ctx.value.getImageData(0, 0, width, height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    data[i] = data[i + 1] = data[i + 2] = avg
  }
  ctx.value.putImageData(imageData, 0, 0)
}

async function sendToFlux() {
  if (!canvas.value) return
  const dataUrl = canvas.value.toDataURL('image/png')

  const res = await fetch('/api/flux', {
    method: 'POST',
    body: JSON.stringify({ image: dataUrl }),
    headers: { 'Content-Type': 'application/json' },
  })

  const { output } = await res.json()
  resultImage.value = output
}
</script>
