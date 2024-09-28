<<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
    <div 
      v-for="store in storeList" 
      :key="store.name" 
      class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg flex flex-col items-center justify-center cursor-pointer transform hover:scale-105 transition-transform duration-300 ease-in-out"
      @click="testStore(store)"
    >
      <div class="text-center">
        <p class="text-xl font-bold mb-2">{{ store.label }}</p>
        <p v-if="store.status" :class="store.status === 'success' ? 'text-green-400' : 'text-red-400'">
          {{ store.status === 'success' ? '✅ Success' : '❌ Failed' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useArtStore } from '@/stores/artStore'
import { useBotStore } from '@/stores/botStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useComponentStore } from '@/stores/componentStore'
import { useTagStore } from '@/stores/tagStore'

// Define a type for our store
interface Store {
  name: string;
  label: string;
  loadStore: () => void;
  status: '' | 'success' | 'failed';
}

const storeList = ref<Store[]>([
  { name: 'displayStore', label: 'Display Store', loadStore: useDisplayStore, status: '' },
  { name: 'userStore', label: 'User Store', loadStore: useUserStore, status: '' },
  { name: 'pitchStore', label: 'Pitch Store', loadStore: usePitchStore, status: '' },
  { name: 'promptStore', label: 'Prompt Store', loadStore: usePromptStore, status: '' },
  { name: 'artStore', label: 'Art Store', loadStore: useArtStore, status: '' },
  { name: 'botStore', label: 'Bot Store', loadStore: useBotStore, status: '' },
  { name: 'galleryStore', label: 'Gallery Store', loadStore: useGalleryStore, status: '' },
  { name: 'componentStore', label: 'Component Store', loadStore: useComponentStore, status: '' },
  { name: 'tagStore', label: 'Tag Store', loadStore: useTagStore, status: '' },
])

const testStore = (store: Store) => {
  try {
    store.loadStore()  // Attempt to load the store
    store.status = 'success'  // If successful, mark status as success
  } catch (error) {
    store.status = 'failed'  // If there's an error, mark status as failed
  }
}
</script>

<style scoped>
.grid {
  max-width: 1200px;
  margin: 0 auto;
}
.shadow-lg {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}
</style>
