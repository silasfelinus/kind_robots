<!-- /components/sharing/project-share-panel.vue -->
<!--
  Owner-facing "Share this project" panel (kind-robots/t-062,
  SHARING-SPEC.md). Fetches the project (itself now Grant-aware, see
  server/api/projects/[id].get.ts), confirms the viewer may manage it, then
  renders <ShareManager>. Split out of pages/projects/[id]/share.vue so the
  page shell stays a thin wrapper (one-header layout-contract rule).
-->
<template>
  <section class="kr-container max-w-2xl flex flex-col gap-4 p-4">
    <p v-if="loading" class="kr-text-dim-sm-50">Loading…</p>
    <p v-else-if="!project" class="kr-text-sm text-error">
      Project not found, or you don't have permission to view it.
    </p>
    <template v-else-if="canManage">
      <header>
        <h1 class="kr-text-black-2xl">Share "{{ project.title }}"</h1>
        <p class="kr-text-dim-sm-70">
          Give specific people view or edit access to this project, independent
          of whether it's public.
        </p>
      </header>
      <ShareManager subject-type="PROJECT" :subject-id="project.id" />
    </template>
    <p v-else class="kr-text-sm text-error">
      Only this project's owner or an admin can manage sharing.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ShareManager from '@/components/sharing/share-manager.vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type ProjectSummary = { id: number; title: string; userId: number | null }

const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const project = ref<ProjectSummary | null>(null)

const canManage = computed(
  () =>
    !!project.value &&
    (userStore.isAdmin || project.value.userId === userStore.user?.id),
)

onMounted(async () => {
  try {
    const res = await performFetch<ProjectSummary>(
      `/api/projects/${route.params.id}`,
    )
    project.value = res.success && res.data ? res.data : null
  } finally {
    loading.value = false
  }
})
</script>
