// /components/content/icons/jellybean-icon.vue
<template>
  <icon-shell>
    <template #icon>
      <router-link
        to="/milestones"
        class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
      >
        <Icon
          name="kind-icon:jellybean"
          class="w-full h-full max-w-[3rem] max-h-[3rem]"
        />
      </router-link>
    </template>

    <template #label>
      <span
        v-if="!isEditing && !bigMode"
        class="text-center w-full text-xs truncate"
      >
        {{ beanCount || 0 }} /11
      </span>
    </template>
  </icon-shell>
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
