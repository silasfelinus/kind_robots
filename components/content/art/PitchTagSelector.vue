<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- Pitch Selection -->
    <div class="flex flex-wrap">
      <button
        v-for="pitch in enrichedPitches"
        :key="pitch.id"
        :class="[
          selectedPitch?.id === pitch.id ? 'bg-primary text-white' : 'bg-base-200',
          'rounded-2xl border p-2 m-2',
        ]"
        @click="updateSelectedPitch(pitch.id)"
      >
        {{ pitch.title }} <span v-if="pitch.username">({{ pitch.username }})</span>
      </button>
    </div>

    <!-- User-Specific Toggles, Edit, and Delete -->
    <div v-if="selectedPitch && userStore.userId === selectedPitch?.userId" class="flex items-center space-x-4">
      <button class="bg-warning text-white rounded-2xl p-2" @click="editSelectedPitch">Edit</button>
      <button class="bg-info text-white rounded-2xl p-2" @click="deleteSelectedPitch">Delete</button>
      <button class="bg-accent text-white rounded-2xl p-2" @click="togglePitchMature">
        {{ selectedPitch.isMature ? 'Hide' : 'Show' }} Mature
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTagStore } from '@/stores/tagStore';
import { useUserStore } from '@/stores/userStore';
import { errorHandler } from '@/server/api/utils/error';
import { useFilterStore } from '@/stores/filterStore';
const filterStore = useFilterStore();

const tagStore = useTagStore();
const userStore = useUserStore();

const selectedPitch = computed(() => tagStore.selectedPitch);

const updateSelectedPitch = (pitchId: number) => {
  tagStore.selectPitch(pitchId);
};

const pitches = computed(() => tagStore.pitches);
const enrichedPitches = computed(() => {
  const userStore = useUserStore();
  return pitches.value.map((pitch) => {
    const username = pitch.userId === userStore.userId ? userStore.username : 'Unknown User';
    return { ...pitch, username };
  });
});
const togglePitchMature = () => {
  try {
    if (selectedPitch.value) {
      const currentMatureStatus = selectedPitch.value.isMature ?? false;
      tagStore.updatePitch(selectedPitch.value.id, { isMature: !currentMatureStatus });
    }
  } catch (error: any) {
    const handledError = errorHandler(error);
    console.error('Error toggling pitch Mature:', handledError.message);
  }
};
const showPublicPitches = ref(true); // Initialize from local storage if needed

const addNewPitch = async () => {
  try {
    const newTitle = prompt('Enter the title for the new pitch:');
    if (newTitle) {
      await tagStore.addPitch(newTitle, userStore.userId);
    }
  } catch (error: any) {
    const handledError = errorHandler(error);
    console.error('Error adding new pitch:', handledError.message);
  }
};
const filteredPitches = computed(() => {
  return pitches.value.filter((pitch) => {
    if (userStore.userId === pitch.userId) return true;
    if (showPublicPitches.value && pitch.isPublic) return true;
    if (filterStore.showMature && pitch.isMature) return true;
    return false;
  });
});

const editSelectedPitch = async () => {
  if (selectedPitch.value) {
    const newTitle = prompt('Enter new title for the pitch:');
    if (newTitle) {
      await tagStore.editPitchTitle(selectedPitch.value.id, newTitle);
    }
  }
};

const deleteSelectedPitch = async () => {
  if (selectedPitch.value) {
    const confirmDelete = confirm('Are you sure you want to delete your pitch?');
    if (confirmDelete) {
      await tagStore.deletePitch(selectedPitch.value.id); // Pass the id
      // Use a store method to nullify selectedPitch
    }
  }
};
</script>
