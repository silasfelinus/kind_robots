<template>
  <div class="bg-base-100 p-4">
    <h1 class="text-2xl mb-4">Training Line Manager</h1>

    <!-- List of Training Lines -->
    <ul>
      <li v-for="line in trainingLines" :key="line.id">
        <span class="bg-primary p-2">{{ line.role }}: {{ line.content }}</span>
        <button class="bg-accent" @click="setCurrentLine(line.id)">Edit</button>
        <button class="bg-secondary" @click="deleteLine(line.id)">Delete</button>
      </li>
    </ul>

    <!-- Form to Edit/Create Training Line -->
    <div v-if="currentTrainingLine">
      <h2>Edit Training Line</h2>
      <input v-model="currentTrainingLine.role" placeholder="Role" />
      <input v-model="currentTrainingLine.content" placeholder="Content" />
      <button class="bg-accent" @click="updateLine">Save</button>
    </div>

    <!-- Button to Create New Line -->
    <button class="bg-primary" @click="createNewLine">Create New Line</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTrainingLineStore } from '~/stores/trainingLineStore'

const store = useTrainingLineStore()
const {
  fetchTrainingLines,
  trainingLines,
  setCurrentTrainingLineById,
  currentTrainingLine,
  createTrainingLine,
  deleteTrainingLineById,
  updateTrainingLine
} = store

// Fetch training lines on component mount
fetchTrainingLines()

const setCurrentLine = (id) => {
  setCurrentTrainingLineById(id)
}

const deleteLine = async (id) => {
  await deleteTrainingLineById(id)
  await fetchTrainingLines()
}

const updateLine = async () => {
  if (currentTrainingLine) {
    await updateTrainingLine(currentTrainingLine.id, currentTrainingLine)
    await fetchTrainingLines()
  }
}

const createNewLine = async () => {
  const newLine = { role: 'New Role', content: 'New Content' }
  await createTrainingLine(newLine)
  await fetchTrainingLines()
}
</script>
