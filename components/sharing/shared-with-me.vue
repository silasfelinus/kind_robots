<!-- /components/sharing/shared-with-me.vue -->
<!--
  Minimal "what has been shared with me" view (kind-robots/t-062,
  SHARING-SPEC.md). Lists this user's active Grants and resolves each
  subject's display title from its own (now Grant-aware) detail endpoint.
-->
<template>
  <section class="kr-container max-w-2xl flex flex-col gap-4 p-4">
    <header>
      <h1 class="kr-text-black-2xl">Shared with me</h1>
      <p class="kr-text-dim-sm-70">
        Projects, resources, and packs other people have shared with your
        account.
      </p>
    </header>

    <p v-if="grants.loading" class="kr-text-dim-sm-50">Loading…</p>
    <p v-else-if="!activeGrants.length" class="kr-text-dim-sm-50">
      Nothing has been shared with you yet.
    </p>

    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="grant in activeGrants"
        :key="grant.id"
        class="kr-panel-flat flex items-center justify-between gap-2 p-3"
      >
        <div class="flex min-w-0 flex-col">
          <span class="kr-text-black-sm truncate">{{ titleFor(grant) }}</span>
          <span class="kr-text-dim-sm-50">
            {{ subjectKindLabel(grant.subjectType) }} · shared by
            {{ granterLabel(grant.granterId) }}
          </span>
        </div>
        <span class="kr-badge-ghost-sm shrink-0">{{ grant.level }}</span>
      </li>
    </ul>

    <p v-if="grants.error" class="kr-text-error-sm">{{ grants.error }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGrantStore } from '@/stores/grantStore'
import { performFetch } from '@/stores/utils'
import type { Grant } from '~/prisma/generated/prisma/client'

const grants = useGrantStore()
const subjectTitles = ref<Map<string, string>>(new Map())
const granterNames = ref<Map<number, string>>(new Map())

const activeGrants = computed(() =>
  grants.sharedWithMe.filter((grant) => grant.status === 'ACTIVE'),
)

function subjectKey(grant: Grant): string {
  return `${grant.subjectType}:${grant.subjectId}`
}

function subjectKindLabel(subjectType: Grant['subjectType']): string {
  if (subjectType === 'PROJECT') return 'Project'
  if (subjectType === 'RESOURCE') return 'Resource'
  return 'Pack'
}

function titleFor(grant: Grant): string {
  return (
    subjectTitles.value.get(subjectKey(grant)) ??
    `${subjectKindLabel(grant.subjectType)} #${grant.subjectId}`
  )
}

function granterLabel(granterId: number | null): string {
  if (!granterId) return 'someone'
  return granterNames.value.get(granterId) ?? `user #${granterId}`
}

async function resolveSubjectTitles() {
  await Promise.all(
    activeGrants.value.map(async (grant) => {
      const key = subjectKey(grant)
      if (subjectTitles.value.has(key)) return

      if (grant.subjectType === 'PROJECT') {
        const res = await performFetch<{ title?: string }>(
          `/api/projects/${grant.subjectId}`,
        )
        if (res.success && res.data?.title) {
          subjectTitles.value.set(key, res.data.title)
        }
      } else if (grant.subjectType === 'RESOURCE') {
        const res = await performFetch<{
          name?: string
          customLabel?: string | null
        }>(`/api/resources/${grant.subjectId}`)
        if (res.success && res.data) {
          subjectTitles.value.set(
            key,
            res.data.customLabel || res.data.name || key,
          )
        }
      }
    }),
  )
}

async function resolveGranterNames() {
  const missing = [
    ...new Set(
      activeGrants.value
        .map((grant) => grant.granterId)
        .filter(
          (id): id is number => id != null && !granterNames.value.has(id),
        ),
    ),
  ]

  await Promise.all(
    missing.map(async (id) => {
      const res = await performFetch<{
        username?: string
        designerName?: string | null
      }>(`/api/users/${id}`)
      if (res.success && res.data) {
        granterNames.value.set(
          id,
          res.data.designerName || res.data.username || `user #${id}`,
        )
      }
    }),
  )
}

onMounted(async () => {
  await grants.loadSharedWithMe()
  await Promise.all([resolveSubjectTitles(), resolveGranterNames()])
})
</script>
