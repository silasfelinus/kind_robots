<!-- /components/content/icons/jellybean-icon.vue -->
<template>
  <router-link
    to="/milestones"
    class="group relative flex items-center justify-center w-[3rem] h-[3rem]"
  >
    <Icon
      name="kind-icon:jellybean"
      class="w-full h-full max-w-[3rem] max-h-[3rem] transition-transform hover:scale-110"
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
