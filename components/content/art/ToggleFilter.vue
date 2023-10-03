<template>
  <div class="flex justify-center items-center relative">
    <!-- Mature Content Toggle -->
    <div
      v-if="userRole !== 'CHILD'"
      :class="[
        'flex justify-center items-center m-2 w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-all ease-in-out hover:scale-110 hover:shadow-lg rounded-full',
        { 'bg-accent': isMatureToggled }
      ]"
      @click="toggleMature"
      @mouseover="showMatureTooltip = true"
      @mouseleave="showMatureTooltip = false"
    >
      <icon
        :name="'emojione-monotone:lipstick'"
        :title="'Toggle Mature Content'"
        class="w-full h-full"
      />
      <div
        v-show="showMatureTooltip"
        class="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full mt-[-20px] bg-base-200 p-2 rounded-2xl border z-50 text-sm"
      >
        Toggle Mature Content
      </div>
      <div
        v-if="showMaturePopup"
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mb-[-20px] bg-base-200 p-2 rounded-2xl border z-50 text-sm transition-opacity duration-1000 ease-in-out"
      >
        Mature Content {{ isMatureToggled ? 'Enabled' : 'Disabled' }}
      </div>
    </div>
    <!-- Public Content Toggle -->
    <div
      :class="[
        'flex justify-center items-center m-2 w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-all ease-in-out hover:scale-110 hover:shadow-lg rounded-full',
        { 'bg-accent': isPublicToggled }
      ]"
      @click="togglePublic"
      @mouseover="showPublicTooltip = true"
      @mouseleave="showPublicTooltip = false"
    >
      <icon
        :name="'icon-park-twotone:city-one'"
        :title="'Toggle Public Content'"
        class="w-full h-full"
      />
      <div
        v-show="showPublicTooltip"
        class="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-full mt-[-20px] bg-base-200 p-2 rounded-2xl border z-50 text-sm"
      >
        Toggle Public Content
      </div>
      <div
        v-if="showPublicPopup"
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mb-[-20px] bg-base-200 p-2 rounded-2xl border z-50 text-sm transition-opacity duration-1000 ease-in-out"
      >
        Public Content {{ isPublicToggled ? 'Visible' : 'Hidden' }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilterStore } from '@/stores/filterStore'
import { useUserStore } from '@/stores/userStore'

const filterStore = useFilterStore()
const userStore = useUserStore()

const userRole = userStore.role
const isMatureToggled = computed(() => filterStore.showMature)
const isPublicToggled = computed(() => filterStore.showPublic)

const showMatureTooltip = ref(false)
const showMaturePopup = ref(false)
const showPublicTooltip = ref(false)
const showPublicPopup = ref(false)

const toggleMature = () => {
  filterStore.toggleMature()
  showMaturePopup.value = true
  setTimeout(() => {
    showMaturePopup.value = false
  }, 2000)
}

const togglePublic = () => {
  filterStore.togglePublic()
  showPublicPopup.value = true
  setTimeout(() => {
    showPublicPopup.value = false
  }, 2000)
}
</script>
