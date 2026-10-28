<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-3 p-4 md:p-6">
      <p v-if="error" class="text-sm">{{ error }}</p>
      <p v-else-if="!notes.length" class="text-sm">Nothing waiting.</p>
      <article
        v-for="note in notes"
        :key="note.id"
        class="space-y-2 rounded-lg border p-3"
      >
        <p class="text-xs">{{ note.gameSlug }} · {{ note.rating }}★</p>
        <p class="break-words text-sm">{{ note.comment }}</p>
        <div class="flex gap-2">
          <button class="kr-btn" @click="decide(note.id, 'release')">
            Release
          </button>
          <button class="kr-btn" @click="decide(note.id, 'dismiss')">
            Dismiss
          </button>
        </div>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
interface HeldNote {
  id: number
  gameSlug: string
  rating: number
  comment: string
}

const notes = ref<HeldNote[]>([])
const error = ref('')

async function load() {
  const res = await $fetch<
    { success: boolean; data?: HeldNote[]; message?: string },
    string
  >('/api/admin/guest-ratings').catch(() => null)
  if (res?.success) notes.value = res.data ?? []
  else error.value = res?.message ?? 'Admin sign-in required.'
}

async function decide(id: number, action: 'release' | 'dismiss') {
  await $fetch<unknown, string>(`/api/admin/guest-ratings/${id}`, {
    method: 'POST',
    body: { action },
  }).catch(() => null)
  notes.value = notes.value.filter((note) => note.id !== id)
}

onMounted(load)
</script>
