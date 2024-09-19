<template>
  <div class="bg-base-200 p-4">
    <!-- Dynamic Component Container -->
    <div v-if="!isLoading && selectedComponent">
      <div v-if="errorLoadingComponent">
        🚨 Error loading component: {{ errorLoadingComponent }}
      </div>
      <div v-else>
        <div>
          <!-- Editable Title and Notes for Admins -->
          <div>
            <label>Title:</label>
            <input
              v-if="isAdmin"
              v-model="selectedComponent.title"
              type="text"
              class="input input-bordered w-full"
            />
            <p v-else>{{ selectedComponent.title }}</p>
          </div>

          <div class="mt-4">
            <label>Notes:</label>
            <textarea
              v-if="isAdmin"
              v-model="selectedComponent.notes"
              class="textarea textarea-bordered w-full"
            ></textarea>
            <p v-else>{{ selectedComponent.notes }}</p>
          </div>
        </div>

        <!-- Include the component reaction bar -->
        <ComponentReaction :component-id="selectedComponent.id" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Folder View -->
    <div
      v-else-if="selectedComponents.length === 0"
      class="grid grid-cols-3 gap-4"
    >
      <div
        v-for="folder in folderNames"
        :key="folder"
        class="p-4 rounded-lg hover:bg-primary hover:text-default cursor-pointer transition duration-300 ease-in-out"
        @click="fetchComponents(folder)"
      >
        <div class="text-center">
          <Icon name="bi:folder-fill" class="text-4xl" />
          <p class="mt-2">{{ folder }}</p>
        </div>
      </div>
    </div>

    <!-- Component View -->
    <div v-else class="grid grid-cols-3 gap-4">
      <!-- Back Button -->
      <div class="col-span-full text-right mb-4">
        <Icon
          name="game-Icons:fast-backward-button"
          class="text-4xl cursor-pointer"
          @click="clearSelectedComponents"
        />
      </div>

      <!-- Components List -->
      <div
        v-for="component in selectedComponents"
        :key="component.id"
        class="p-4 rounded-lg hover:bg-secondary hover:text-default cursor-pointer transition duration-300 ease-in-out"
        @click="openComponent(component)"
      >
        <div class="text-center">
          <Icon name="game-Icons:companion-cube" class="text-4xl mb-2" />
          <p>{{ component.componentName }}</p>
        </div>
      </div>
    </div>

    <!-- Error Reporting -->
    <div v-if="errorComponents.length > 0" class="text-red-500 mt-4">
      🚨 Error loading these components: {{ errorComponents.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onErrorCaptured } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.Role === 'ADMIN')

// Component interface based on your Prisma model
interface Component {
  id: number
  createdAt: Date
  updatedAt?: Date | null
  folderName: string
  componentName: string
  isWorking: boolean
  underConstruction: boolean
  isBroken: boolean
  title?: string | null
  notes?: string | null
  Channels: Channel[]
  Tags: Tag[]
  Reactions: Reaction[]
}

interface Channel {
  id: number
  name: string
}

interface Tag {
  id: number
  label: string
}

interface Reaction {
  id: number
  type: string
}

interface Folder {
  folderName: string
  components: string[] // This could also be Component[] if you have full details
}

// State variables
const isLoading = ref(false)
const selectedComponents = ref<Component[]>([]) // Updated to store Component[] instead of string[]
const selectedComponent = ref<Component | null>(null) // Typed correctly now

const folderData = ref<Folder[]>([]) // Use Folder type instead of any

const errorComponents = ref<string[]>([])
const errorLoadingComponent = ref<string | null>(null)

// Fetch data from public/components.json directly
const fetchComponentJSON = async () => {
  try {
    const response = await fetch('/components.json')
    if (!response.ok) {
      throw new Error('Failed to load components.json')
    }
    folderData.value = (await response.json()) as Folder[] // Ensure the type is Folder[]
  } catch (error) {
    console.error('Error loading components.json:', error)
    errorComponents.value.push('Failed to load components.json')
  }
}

const folderNames = computed(() =>
  folderData.value.map((folder) => folder.folderName),
)

const fetchComponents = (folder: string) => {
  const selectedFolderData = folderData.value.find(
    (f) => f.folderName === folder,
  )
  if (selectedFolderData) {
    // Assuming selectedFolderData.components is a string[] or a Component[]
    selectedComponents.value = selectedFolderData.components.map(
      (component) => ({
        // Example structure, adjust based on actual data
        id: Math.random(), // If there's no id, generate one
        folderName: folder,
        componentName: component,
        createdAt: new Date(),
        isWorking: true,
        underConstruction: false,
        isBroken: false,
        Channels: [],
        Tags: [],
        Reactions: [],
      }),
    )
  } else {
    selectedComponents.value = []
  }
}

const clearSelectedComponents = () => {
  selectedComponents.value = []
  selectedComponent.value = null
}

// Function to open a specific component
const openComponent = (component: Component) => {
  selectedComponent.value = component
}

// Fetch folder names and component data when the component is mounted
onMounted(() => {
  fetchComponentJSON()
})

// Global error handler for unexpected errors
onErrorCaptured((error) => {
  console.error('An error occurred:', error)
  return false
})
</script>

<style scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loader {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #000;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}
</style>
