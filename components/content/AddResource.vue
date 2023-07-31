<template>
  <div class="add-resource-container">
    <h1 class="text-3xl mb-4 text-center">Add a Resource</h1>
    <form class="bg-white shadow-lg rounded-lg p-8" @submit="handleSubmit">
      <label for="name" class="block text-sm font-medium text-gray-600">Name</label>
      <input
        id="name"
        v-model="name"
        type="text"
        class="mt-1 p-2 w-full rounded-md border"
        required
      />

      <label for="isNSFW" class="block text-sm font-medium text-gray-600">Is NSFW?</label>
      <input
        id="isNSFW"
        v-model="isNSFW"
        type="checkbox"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <label for="customLabel" class="block text-sm font-medium text-gray-600">Custom Label</label>
      <input
        id="customLabel"
        v-model="customLabel"
        type="text"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <label for="MediaPath" class="block text-sm font-medium text-gray-600">Media Path</label>
      <input
        id="MediaPath"
        v-model="MediaPath"
        type="text"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <label for="customUrl" class="block text-sm font-medium text-gray-600">Custom URL</label>
      <input
        id="customUrl"
        v-model="customUrl"
        type="url"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <label for="civitaiUrl" class="block text-sm font-medium text-gray-600">CivitAI URL</label>
      <input
        id="civitaiUrl"
        v-model="civitaiUrl"
        type="url"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <label for="huggingUrl" class="block text-sm font-medium text-gray-600"
        >Hugging Face URL</label
      >
      <input
        id="huggingUrl"
        v-model="huggingUrl"
        type="url"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <label for="localPath" class="block text-sm font-medium text-gray-600">Local Path</label>
      <input
        id="localPath"
        v-model="localPath"
        type="text"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <label for="description" class="block text-sm font-medium text-gray-600">Description</label>
      <textarea
        id="description"
        v-model="description"
        class="mt-1 p-2 w-full rounded-md border"
      ></textarea>

      <label for="resourceType" class="block text-sm font-medium text-gray-600"
        >Resource Type</label
      >
      <select id="resourceType" v-model="resourceType" class="mt-1 p-2 w-full rounded-md border">
        <option v-for="type in resourceTypes" :key="type" :value="type">{{ type }}</option>
      </select>

      <button type="submit" class="btn btn-success w-full mt-4">Add Resource</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Resource, ResourceType } from '@prisma/client'
import { useResourceStore } from '../../stores/resourceStore'

const resourceStore = useResourceStore()

const resourceTypes = Object.values(ResourceType)

const name = ref('')
const isNSFW = ref(false)
const customLabel = ref('')
const MediaPath = ref('')
const customUrl = ref('')
const civitaiUrl = ref('')
const huggingUrl = ref('')
const localPath = ref('')
const description = ref('')
const resourceType = ref(ResourceType.CHECKPOINT)

async function handleSubmit(e: Event) {
  e.preventDefault()
  const resourceData: Partial<Resource>[] = [
    {
      name: name.value,
      isNSFW: isNSFW.value,
      customLabel: customLabel.value,
      MediaPath: MediaPath.value,
      customUrl: customUrl.value,
      civitaiUrl: civitaiUrl.value,
      huggingUrl: huggingUrl.value,
      localPath: localPath.value,
      description: description.value,
      resourceType: resourceType.value
    }
  ]
  await resourceStore.addResources(resourceData)
}
</script>

<style>
/* Add any necessary CSS styling here */
</style>
