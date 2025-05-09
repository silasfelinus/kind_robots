<!-- /components/content/icons/jellybean-icon.vue -->
<template>
  <router-link
    to="/milestones"
    class="group flex flex-col items-center justify-center w-[80px] min-w-[72px] max-w-[90px] transition-all"
  >
    <Icon
      name="kind-icon:jellybean"
      class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
    />

    <!-- Fade transition between bean count and ✕ -->
    <transition name="fade" mode="out-in">
      <div
        v-if="!isEditing"
        key="beanCount"
        class="mt-2 text-center text-sm md:block hidden"
      >
        {{ beanCount || 0 }} /11
      </div>

      <button
        v-else
        key="remove"
        class="mt-2 text-xs bg-red-500 text-white rounded-full px-2 py-0.5 hover:bg-red-600"
        @click.stop="removeSelf"
      >
        ✕
      </button>
    </transition>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores/displayStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useIconStore } from '@/stores/iconStore'

const displayStore = useDisplayStore()
const { bigMode } = storeToRefs(displayStore)

const milestoneStore = useMilestoneStore()
const beanCount = computed(() => milestoneStore.milestoneCountForUser)

const iconStore = useIconStore()
const { isEditing } = storeToRefs(iconStore)

function removeSelf() {
  const JELLYBEAN_ICON_ID = 5 // Replace with actual ID if different
  iconStore.removeIconFromSmartBar(JELLYBEAN_ICON_ID)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.router-link {
  text-decoration: none;
  color: inherit;
}
</style>
