<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-col items-center">
      <!-- Toggle Button for Showing Add/Edit Form -->
      <button
        class="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        @click="toggleForm">
        {{ isEditing ? 'Edit Pitch' : 'Add Pitch' }}
      </button>

      <!-- Pitch Form -->
      <div v-if="showForm" class="w-full max-w-lg">
        <form @submit.prevent="isEditing ? updatePitch() : createPitch()" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="title">
              Title
            </label>
            <input class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="title" type="text" placeholder="Pitch Title" v-model="newPitch.title">
          </div>
          <div class="mb-6">
            <label class="block text-gray-700 text-sm font-bold mb-2" for="pitch">
              Pitch
            </label>
            <textarea class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" id="pitch" v-model="newPitch.pitch" placeholder="Describe your pitch here"></textarea>
          </div>
          <div class="flex items-center justify-between">
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              {{ isEditing ? 'Update Pitch' : 'Submit Pitch' }}
            </button>
            <button class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" @click="toggleForm">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <!-- Pitch List -->
      <div class="w-full max-w-2xl">
        <div v-for="pitch in pitches" :key="pitch.id" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold">{{ pitch.title }}</h3>
            <p class="text-gray-700 text-base">{{ pitch.pitch }}</p>
          </div>
          <div>
            <button v-if="canEdit(pitch)" @click="editPitch(pitch)" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded">Edit</button>
            <button v-if="canDelete(pitch)" @click="deletePitch(pitch.id)" class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePitchStore } from './../../../stores/usePitchStore';
import { useUserStore } from './../../../stores/useUserStore';

const pitchStore = usePitchStore()
const { createPitch, updatePitch, deletePitch } = pitchStore;
const computed =(()=> pitchStore.pitches)
const { user } = useUserStore();

const showForm = ref(false);
const isEditing = ref(false);
const newPitch = ref({
  id: null,
  title: '',
  pitch: '',
});

const toggleForm = () => {
  if (isEditing.value) {
    isEditing.value = false;
    newPitch.value = { id: null, title: '', pitch: '' };
  }
  showForm.value = !showForm.value;
};

const editPitch = (pitch) => {
  newPitch.value = { ...pitch };
  isEditing.value = true;
  showForm.value = true;
};

const canEdit = (pitch) => {
  return user.value.userId === pitch.userId || user.value.userType === 'ADMIN';
};

const canDelete = (pitch) => {
  return user.value.userId === pitch.userId || user.value.userType === 'ADMIN';
};
</script>

<style scoped>
/* Additional Tailwind CSS styling can go here */
</style>