<!-- /components/sharing/share-manager.vue -->
<!--
  Minimal owner-facing Grant manager (kind-robots/t-062, SHARING-SPEC.md).
  Drop this into any surface an owner/admin already controls for a
  PROJECT/RESOURCE/PACK subject: it lists who currently has access, lets the
  owner search the user directory and grant VIEW/ADMIN, and lets them revoke
  an existing grant. The server enforces ownership on every call
  (assertCanManageGrantSubject) — this component only reflects that back.
-->
<template>
  <div class="kr-panel-flat flex flex-col gap-3 p-3">
    <header class="flex items-center justify-between gap-2">
      <h3 class="kr-text-black-sm">Sharing{{ title ? ` — ${title}` : '' }}</h3>
      <span v-if="grants.loading" class="kr-text-dim-sm-50">Loading…</span>
    </header>

    <p v-if="activeGrants.length === 0" class="kr-text-dim-sm-50">
      Not shared with anyone yet.
    </p>
    <ul v-else class="flex flex-col gap-1.5">
      <li
        v-for="grant in activeGrants"
        :key="grant.id"
        class="flex items-center justify-between gap-2 rounded-xl bg-base-200 px-2.5 py-1.5"
      >
        <span class="text-sm truncate">
          {{ granteeLabel(grant.granteeId) }}
          <span class="kr-badge-ghost-sm ml-1">{{ grant.level }}</span>
        </span>
        <button
          type="button"
          class="kr-btn-ghost-xs-lg shrink-0"
          :disabled="revokingId === grant.id"
          @click="onRevoke(grant.id)"
        >
          Revoke
        </button>
      </li>
    </ul>

    <div class="flex flex-col gap-2 border-t border-base-300/60 pt-2.5">
      <input
        v-model="search"
        type="search"
        placeholder="Find someone to share with…"
        class="kr-input-muted rounded-xl"
        @input="onSearch"
      />
      <p v-if="isSearching" class="kr-text-dim-sm-50">Searching…</p>
      <ul
        v-else-if="search.trim() && directory.length"
        class="flex flex-col gap-1.5"
      >
        <li
          v-for="candidate in directory"
          :key="candidate.id"
          class="flex items-center justify-between gap-2 rounded-xl bg-base-200 px-2.5 py-1.5"
        >
          <span class="text-sm truncate">{{
            candidate.designerName || candidate.username
          }}</span>
          <div class="flex shrink-0 items-center gap-1.5">
            <select
              v-model="level"
              class="select select-bordered select-xs rounded-lg"
            >
              <option value="VIEW">Can view</option>
              <option value="ADMIN">Can edit</option>
            </select>
            <button
              type="button"
              class="kr-btn-primary-xs-lg"
              :disabled="sharing"
              @click="onShare(candidate)"
            >
              Share
            </button>
          </div>
        </li>
      </ul>
      <p v-else-if="search.trim()" class="kr-text-dim-sm-50">No matches.</p>
    </div>

    <p v-if="grants.error" class="text-sm text-error">{{ grants.error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGrantStore } from '@/stores/grantStore'
import { performFetch } from '@/stores/utils'
import type { GrantLevel, GrantSubject } from '~/prisma/generated/prisma/client'

type DirectoryCandidate = {
  id: number
  username: string
  designerName?: string | null
}

const props = defineProps<{
  subjectType: GrantSubject
  subjectId: number
  title?: string
}>()

const grants = useGrantStore()

const search = ref('')
const directory = ref<DirectoryCandidate[]>([])
const isSearching = ref(false)
const level = ref<GrantLevel>('VIEW')
const sharing = ref(false)
const revokingId = ref<number | null>(null)
const granteeNames = ref<Map<number, string>>(new Map())
let searchTimer: ReturnType<typeof setTimeout> | null = null

const activeGrants = computed(() =>
  grants.subjectGrants.filter((grant) => grant.status === 'ACTIVE'),
)

function granteeLabel(granteeId: number): string {
  return granteeNames.value.get(granteeId) ?? `user #${granteeId}`
}

async function resolveGranteeNames() {
  const missing = [
    ...new Set(
      activeGrants.value
        .map((grant) => grant.granteeId)
        .filter((id) => !granteeNames.value.has(id)),
    ),
  ]
  if (!missing.length) return

  await Promise.all(
    missing.map(async (id) => {
      const res = await performFetch<{
        username?: string
        designerName?: string | null
      }>(`/api/users/${id}`)
      if (res.success && res.data) {
        granteeNames.value.set(
          id,
          res.data.designerName || res.data.username || `user #${id}`,
        )
      }
    }),
  )
}

async function runSearch() {
  isSearching.value = true
  try {
    const q = search.value.trim()
    if (!q) {
      directory.value = []
      return
    }
    const res = await performFetch<DirectoryCandidate[]>(
      `/api/users/directory?search=${encodeURIComponent(q)}`,
    )
    directory.value = res.success && Array.isArray(res.data) ? res.data : []
  } finally {
    isSearching.value = false
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, 300)
}

async function onShare(candidate: DirectoryCandidate) {
  sharing.value = true
  try {
    const created = await grants.createGrant({
      granteeId: candidate.id,
      subjectType: props.subjectType,
      subjectId: props.subjectId,
      level: level.value,
    })
    if (created) {
      granteeNames.value.set(
        candidate.id,
        candidate.designerName || candidate.username,
      )
      search.value = ''
      directory.value = []
    }
  } finally {
    sharing.value = false
  }
}

async function onRevoke(grantId: number) {
  revokingId.value = grantId
  try {
    await grants.revokeGrant(grantId)
  } finally {
    revokingId.value = null
  }
}

onMounted(async () => {
  await grants.loadSubjectGrants(props.subjectType, props.subjectId)
  await resolveGranteeNames()
})
</script>
