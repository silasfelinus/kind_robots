<template>
  <div class="art-card rounded-2xl p-2 m-1 border bg-base-200">
    <h2>{{ art.prompt }}</h2>
    <img :src="art.path" alt="Artwork" />
    <div v-if="art.ArtReaction">
      <h3>Reactions</h3>
      <div v-for="reaction in art.ArtReaction" :key="reaction.id">
        <p>Claps: {{ reaction.claps }}</p>
        <p>Boos: {{ reaction.boos }}</p>
        <p>Comment: {{ reaction.comment }}</p>
      </div>
    </div>
    <div v-else>
      <button @click="createReaction">Add Reaction</button>
    </div>
    <button v-if="canDelete" @click="deleteArt">Delete</button>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { useArtStore, ExtendedArt, ArtReaction } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const userStore = useUserStore()

// Define the props and their types
const { art } = defineProps<{
  art: ExtendedArt
}>()

// Function to create a reaction
const createReaction = async () => {
  // Your logic to create a reaction goes here
  console.log('Creating reaction for art:', art.id)

  // Sample data for the new reaction
  const newReaction: Partial<ArtReaction> = {
    userId: 1, // Replace with the actual user ID
    artId: art.id,
    claps: 10,
    boos: 0,
    title: 'Awesome!',
    reaction: 'happy',
    comment: 'I love this art!'
  }

  try {
    await artStore.createArtReaction(newReaction as ArtReaction)
    console.log('Reaction created successfully!')
  } catch (error) {
    console.error('Failed to create reaction:', error)
  }
}

// Function to delete art
const deleteArt = () => {
  artStore.deleteArt(art.id)
}

// Computed property to check if the user can delete the art
const canDelete = computed(() => {
  return userStore.userId === art.userId || userStore.role === 'ADMIN'
})
</script>
