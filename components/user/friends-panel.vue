<!-- /components/user/friends-panel.vue -->
<!--
  Friends & people. Real UI over the existing UserRelation backend (friendStore):
  incoming requests, your friends, a consent-aware directory search, and blocks.
  "Message" hands off to the threaded messenger via conversationStore.
-->
<template>
  <section class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
    <header>
      <h1 class="text-2xl font-black">Friends</h1>
      <p class="text-sm text-base-content/70">
        Connect with people, manage requests, and control who can reach you.
      </p>
    </header>

    <!-- Incoming requests -->
    <div v-if="friends.allIncomingRequests.length" class="rounded-2xl border border-base-300 bg-base-100 p-4">
      <h2 class="mb-3 text-lg font-black">Requests</h2>
      <div class="flex flex-col gap-2">
        <div
          v-for="r in friends.allIncomingRequests"
          :key="r.id"
          class="flex items-center justify-between gap-2 rounded-xl bg-base-200 p-2"
        >
          <span class="font-semibold">{{ nameFor(r.userId) }} · {{ r.type.toLowerCase() }}</span>
          <div class="flex gap-1">
            <button class="btn btn-primary btn-xs rounded-lg" @click="friends.confirmRequest(r.id)">Accept</button>
            <button class="btn btn-ghost btn-xs rounded-lg" @click="friends.rejectRequest(r.id)">Decline</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Your friends -->
    <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
      <h2 class="mb-3 text-lg font-black">Your friends ({{ friends.friendCount }})</h2>
      <p v-if="!friends.friendIds.length" class="text-sm text-base-content/50">
        No friends yet — find some below.
      </p>
      <div class="flex flex-col gap-2">
        <div
          v-for="id in friends.friendIds"
          :key="id"
          class="flex items-center justify-between gap-2 rounded-xl bg-base-200 p-2"
        >
          <div class="flex items-center gap-2">
            <div class="avatar">
              <div class="h-8 w-8 rounded-full bg-base-300">
                <img v-if="avatarFor(id)" :src="avatarFor(id)" :alt="nameFor(id)" />
              </div>
            </div>
            <span class="font-semibold">{{ nameFor(id) }}</span>
          </div>
          <div class="flex gap-1">
            <button class="btn btn-primary btn-xs rounded-lg" @click="message(id)">Message</button>
            <button class="btn btn-ghost btn-xs rounded-lg" @click="friends.removeFriend(id)">Remove</button>
            <button class="btn btn-ghost btn-xs rounded-lg text-error" @click="friends.blockUser(id)">Block</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Find people -->
    <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
      <h2 class="mb-3 text-lg font-black">Find people</h2>
      <input
        v-model="search"
        type="search"
        placeholder="Search the directory…"
        class="input input-bordered mb-3 w-full rounded-xl bg-base-200"
        @input="onSearch"
      />
      <p v-if="isSearching" class="text-sm text-base-content/50">Searching…</p>
      <div class="flex flex-col gap-2">
        <div
          v-for="u in directory"
          :key="u.id"
          class="flex items-center justify-between gap-2 rounded-xl bg-base-200 p-2"
        >
          <div class="flex items-center gap-2">
            <div class="avatar">
              <div class="h-8 w-8 rounded-full bg-base-300">
                <img v-if="u.avatarImage" :src="u.avatarImage" :alt="u.username" />
              </div>
            </div>
            <span class="font-semibold">{{ u.designerName || u.username }}</span>
          </div>
          <div class="flex gap-1">
            <button
              v-if="friends.relationship(u.id) === 'none' && u.allowFriendRequests"
              class="btn btn-primary btn-xs rounded-lg"
              @click="friends.sendFriendRequest(u.id)"
            >
              Add friend
            </button>
            <span v-else-if="friends.relationship(u.id) === 'outgoing'" class="badge badge-ghost badge-sm">Requested</span>
            <span v-else-if="friends.relationship(u.id) === 'friend'" class="badge badge-success badge-sm">Friend</span>
            <button
              v-if="u.messagePolicy !== 'NONE'"
              class="btn btn-ghost btn-xs rounded-lg"
              @click="message(u.id)"
            >
              Message
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Blocked -->
    <div v-if="friends.blockedIds.length" class="rounded-2xl border border-base-300 bg-base-100 p-4">
      <h2 class="mb-3 text-lg font-black">Blocked</h2>
      <div class="flex flex-col gap-2">
        <div
          v-for="id in friends.blockedIds"
          :key="id"
          class="flex items-center justify-between gap-2 rounded-xl bg-base-200 p-2"
        >
          <span class="font-semibold">{{ nameFor(id) }}</span>
          <button class="btn btn-ghost btn-xs rounded-lg" @click="friends.unblockUser(id)">Unblock</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useFriendStore } from '@/stores/friendStore'
import { useConversationStore } from '@/stores/conversationStore'
import { performFetch } from '@/stores/utils'

type DirectoryUser = {
  id: number
  username: string
  designerName?: string | null
  avatarImage?: string | null
  bio?: string | null
  allowFriendRequests: boolean
  messagePolicy: string
}

const userStore = useUserStore()
const friends = useFriendStore()
const convo = useConversationStore()

const search = ref('')
const directory = ref<DirectoryUser[]>([])
const isSearching = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// Resolve ids to display info from the fetched user list.
const usersById = computed(() => {
  const map = new Map<number, { username: string; avatarImage?: string | null }>()
  for (const u of userStore.users) {
    if (u.id != null) map.set(u.id, { username: u.username ?? `user#${u.id}`, avatarImage: u.avatarImage })
  }
  return map
})
function nameFor(id: number): string {
  return usersById.value.get(id)?.username ?? `user#${id}`
}
function avatarFor(id: number): string {
  return usersById.value.get(id)?.avatarImage ?? ''
}

async function runSearch() {
  isSearching.value = true
  try {
    const q = search.value.trim()
    const res = await performFetch<DirectoryUser[]>(
      `/api/users/directory${q ? `?search=${encodeURIComponent(q)}` : ''}`,
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

async function message(userId: number) {
  const id = await convo.startWith(userId)
  if (id) navigateTo(`/messages?c=${id}`)
}

onMounted(async () => {
  await Promise.all([friends.load(true), userStore.fetchUsers()])
  await runSearch()
})
</script>
