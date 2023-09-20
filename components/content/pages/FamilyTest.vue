<template>
  <div class="bg-base-200 min-h-screen p-6">
    <h1 class="text-lg font-bold mb-4">Family Tree</h1>
    <button class="bg-primary rounded-2xl p-2 text-lg border mr-4" @click="loadData('mater')">
      Load Mater Data
    </button>
    <button class="bg-primary rounded-2xl p-2 text-lg border mr-4" @click="loadData('pater')">
      Load Pater Data
    </button>
    <div v-if="materData">
      <h2 class="text-lg font-bold mb-4">Mater Data (First 10 entries)</h2>
      <div class="bg-info p-4 rounded-2xl">
        <ul>
          <li v-for="(person, id) in materData" :key="id">
            <strong>ID:</strong> {{ id }} <br />
            <strong>Name:</strong> {{ person.name }} <br />
            <strong>Lifespan:</strong> {{ person.lifespan }} <br />
            <!-- Add other person properties here -->
          </li>
        </ul>
      </div>
    </div>
    <div v-if="paterData">
      <h2 class="text-lg font-bold mb-4">Pater Data (First 10 entries)</h2>
      <div class="bg-info p-4 rounded-2xl">
        <ul>
          <li v-for="(person, id) in paterData" :key="id">
            <strong>ID:</strong> {{ id }} <br />
            <strong>Name:</strong> {{ person.name }} <br />
            <strong>Lifespan:</strong> {{ person.lifespan }} <br />
            <!-- Add other person properties here -->
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFamilyTreeStore } from '@/stores/familyTreeStore'

const store = useFamilyTreeStore()
const materData = computed(() => store.materDataFirst10)
const paterData = computed(() => store.paterDataFirst10)

const loadData = async (branch: 'mater' | 'pater') => {
  try {
    await store.fetchData(branch)
  } catch (error: any) {
    console.error(`Error fetching ${branch} data:`, error)
  }
}

onMounted(() => {
  store.initFavorites()
})
</script>
