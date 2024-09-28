<template>
  <div 
    class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg flex flex-col items-center justify-center cursor-pointer transform hover:scale-105 transition-transform duration-300 ease-in-out"
    @click="testStore"
  >
    <div class="text-center">
      <p class="text-xl font-bold mb-2">{{ label }}</p>
      <p v-if="status" :class="status === 'success' ? 'text-green-400' : 'text-red-400'">
        {{ status === 'success' ? '✅ Success' : '❌ Failed' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface StoreTestProps {
  label: string;
  loadStore: () => Promise<any>;
}

const props = defineProps<StoreTestProps>();

const status = ref<'' | 'success' | 'failed'>('')

const testStore = async () => {
  try {
    await props.loadStore();
    status.value = 'success';
  } catch (error) {
    status.value = 'failed';
  }
}
</script>

<style scoped>
.shadow-lg {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}
</style>
