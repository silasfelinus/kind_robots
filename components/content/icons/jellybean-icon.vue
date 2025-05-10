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

    <div
        v-if="!isEditing && !displayStore.bigMode"
  class="absolute top-full mt-1 text-xs text-center pointer-events-none"
    >
      {{ beanCount || 0 }} /11
    </div>
  </router-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useIconStore } from '@/stores/iconStore'

const milestoneStore = useMilestoneStore()
const displayStore = useDisplayStore()
const iconStore = useIconStore()

const { bigMode } = storeToRefs(displayStore)
const { isEditing } = storeToRefs(iconStore)

const beanCount = computed(() => milestoneStore.milestoneCountForUser)
</script>
