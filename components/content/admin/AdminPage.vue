<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface UserData {
  id: number
  name: string
  email: string
}

// You can define types for other models if necessary
// interface OtherModelData { ... }

const selectedModel = ref('User') // default model
const data = ref<UserData | null>(null) // Use specific type, or adjust for other models

// Fetch data when component is mounted or when selectedModel changes
onMounted(fetchData)
watch(selectedModel, fetchData)

async function fetchData() {
  try {
    // Fetch data dynamically based on the selected model
    const fetchedData = await $fetch<UserData>(`/api/${selectedModel.value}`)

    // Assign the fetched data to the local `data` ref
    data.value = fetchedData
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}
</script>
