<!-- /components/sharing/resource-share-panel.vue -->
<!--
  Owner-facing "Share this resource" panel (kind-robots/t-062,
  SHARING-SPEC.md). Same shape as project-share-panel.vue, split out of
  pages/resources/[id]/share.vue so the page shell stays a thin wrapper
  (one-header layout-contract rule).
-->
<template>
  <section class="kr-container max-w-2xl flex flex-col gap-4 p-4">
    <p v-if="loading" class="kr-text-dim-sm-50">Loading…</p>
    <p v-else-if="!resource" class="text-sm text-error">
      Resource not found, or you don't have permission to view it.
    </p>
    <template v-else-if="canManage">
      <header>
        <h1 class="kr-text-black-2xl">
          Share "{{ resource.customLabel || resource.name }}"
        </h1>
        <p class="kr-text-dim-sm-70">
          Give specific people view or edit access to this resource, independent
          of whether it's public.
        </p>
      </header>
      <ShareManager subject-type="RESOURCE" :subject-id="resource.id" />
    </template>
    <p v-else class="text-sm text-error">
      Only this resource's owner or an admin can manage sharing.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ShareManager from '@/components/sharing/share-manager.vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type ResourceSummary = {
  id: number
  name: string
  customLabel?: string | null
  userId: number | null
}

const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const resource = ref<ResourceSummary | null>(null)

const canManage = computed(
  () =>
    !!resource.value &&
    (userStore.isAdmin || resource.value.userId === userStore.user?.id),
)

onMounted(async () => {
  try {
    const res = await performFetch<ResourceSummary>(
      `/api/resources/${route.params.id}`,
    )
    resource.value = res.success && res.data ? res.data : null
  } finally {
    loading.value = false
  }
})
</script>
