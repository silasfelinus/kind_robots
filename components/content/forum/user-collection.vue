<template>
  <div class="collection bg-base-100 p-4 rounded-lg shadow">
    <h4 class="text-lg font-bold mb-2">User Collection</h4>
    <div v-if="collection.length > 0" class="grid grid-cols-2 gap-2">
      <div
        v-for="item in collection"
        :key="item.id"
        class="item rounded-md shadow-sm p-2 bg-base-200"
      >
        {{ item.name }}
      </div>
    </div>
    <p v-else class="text-gray-500">No items in collection.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { performFetch, handleError } from '@/stores/utils'

const props = defineProps<{ userId: number }>()
const collection = ref([])

async function fetchCollection() {
  try {
    const response = await performFetch(`/api/collections/${props.userId}`)
    if (response.success && response.data) {
      collection.value = response.data
    } else {
      handleError(new Error(response.message || 'Failed to fetch collection'))
    }
  } catch (error) {
    handleError(error, 'fetching user collection')
  }
}

onMounted(fetchCollection)
</script>
