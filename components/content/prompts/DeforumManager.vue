<template>
  <div class="p-6 max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">Deforum Video Manager</h2>

    <!-- Video Generation Form -->
    <div class="mb-8 p-4 bg-white shadow-lg rounded-lg">
      <h3 class="text-xl font-semibold mb-2">Generate New Video</h3>
      <form @submit.prevent="generateNewVideo">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1" for="prompt">Prompt</label>
          <textarea
            id="prompt"
            v-model="newVideo.promptString"
            class="w-full p-2 border rounded"
            placeholder="Enter your prompt"
            required
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1" for="frames">Frames</label>
          <input
            type="number"
            id="frames"
            v-model.number="newVideo.frames"
            class="w-full p-2 border rounded"
            placeholder="Number of frames (e.g. 240)"
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1" for="translation2D">2D Translation</label>
          <input
            type="text"
            id="translation2D"
            v-model="newVideo.translation2D"
            class="w-full p-2 border rounded"
            placeholder="2D Translation (e.g. '0:(0)')"
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1" for="translation3D">3D Translation</label>
          <input
            type="text"
            id="translation3D"
            v-model="newVideo.translation3D"
            class="w-full p-2 border rounded"
            placeholder="3D Translation (e.g. '0:(0.5)')"
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1" for="checkpoint">Checkpoint</label>
          <input
            type="text"
            id="checkpoint"
            v-model="newVideo.checkpoint"
            class="w-full p-2 border rounded"
            placeholder="Checkpoint (e.g. 'default')"
          />
        </div>
        <div class="flex justify-end">
          <button
            type="submit"
            class="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Generate Video
          </button>
        </div>
      </form>
    </div>

    <!-- Generated Videos List -->
    <div class="p-4 bg-white shadow-lg rounded-lg">
      <h3 class="text-xl font-semibold mb-4">Generated Videos</h3>
      <div v-if="videos.length === 0" class="text-gray-500">No videos generated yet.</div>
      <ul>
        <li v-for="video in videos" :key="video" class="mb-4">
          <div class="flex justify-between items-center">
            <div>
              <p class="text-sm font-semibold text-gray-700">Video URL:</p>
              <a
                :href="video"
                class="text-blue-500 hover:underline"
                target="_blank"
                >{{ video }}</a
              >
            </div>
            <div class="flex items-center space-x-4">
              <button
                class="text-green-500 hover:underline"
                @click="selectVideo(video)"
              >
                View
              </button>
              <button
                class="text-red-500 hover:underline"
                @click="deleteVideo(video)"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Selected Video Display -->
    <div v-if="selectedVideo" class="mt-8 p-4 bg-white shadow-lg rounded-lg">
      <h3 class="text-xl font-semibold mb-2">Selected Video</h3>
      <video
        v-if="selectedVideo"
        :src="selectedVideo"
        controls
        class="w-full h-auto rounded shadow-lg"
      ></video>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDeforumStore } from '@/stores/deforumStore'
import { GenerateDeforumData } from '@/stores/deforumStore'

const deforumStore = useDeforumStore()

// New video form data
const newVideo = ref<GenerateDeforumData>({
  promptString: '',
  frames: 240,
  translation2D: '0:(0)',
  translation3D: '0:(0)',
  checkpoint: 'default',
})

// Fetch videos and selected video from the store
const videos = deforumStore.deforumVideos
const selectedVideo = deforumStore.selectedVideo

// Function to generate a new video
const generateNewVideo = async () => {
  const result = await deforumStore.generateVideo(newVideo.value)
  if (result.success) {
    alert('Video generated successfully!')
  } else {
    alert('Error: ' + result.message)
  }
}

// Function to select a video
const selectVideo = (videoUrl: string) => {
  deforumStore.selectVideo(videoUrl)
}

// Function to delete a video
const deleteVideo = async (videoUrl: string) => {
  if (confirm('Are you sure you want to delete this video?')) {
    await deforumStore.deleteVideo(videoUrl)
  }
}
</script>

<style scoped>
/* Add any custom styles here, if needed */
</style>
