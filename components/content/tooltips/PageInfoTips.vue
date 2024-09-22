<template>
  <div class="tutorial-cards-container fixed bottom-0 right-0 z-40 flex flex-col-reverse items-end space-y-2 space-y-reverse p-2">
    <!-- Bot Message Cards -->
    <div v-if="showInfo" class="flex w-full justify-between items-center">
      <div class="flex flex-col-reverse items-end space-y-2 space-y-reverse">
        <!-- AMIbot Message Card -->
        <MessageCard
          v-if="showAmiCard"
          :show="true"
          bg-class="bg-base-200 shadow-2xl border-accent backdrop-blur-lg"
          image-src="/images/amibotsquare1.webp"
          alt-text="AMI"
          username="AMIbot"
          :message="page.amitip"
          @remove-card="showAmiCard = false"
        />

        <!-- DottiBot Message Card -->
        <MessageCard
          v-if="showDottiCard"
          :show="true"
          bg-class="bg-base-200 shadow-2xl border-secondary backdrop-blur-lg"
          image-src="/images/avatars/dottie1.webp"
          alt-text="Dotti"
          username="DottiBot"
          :message="page.dottitip"
          @remove-card="showDottiCard = false"
        />
      </div>
      <!-- Tooltip Toggle Button -->
      <tooltip-toggle class="ml-auto" />
    </div>
    
    <!-- Tooltip Toggle when Cards are Hidden -->
    <div v-else>
      <tooltip-toggle />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// State for showing and hiding message cards
const showInfo = ref(true)
const showAmiCard = ref(true)
const showDottiCard = ref(true)
</script>
