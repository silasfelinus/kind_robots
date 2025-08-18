<!-- /components/dominion/dominion-gallery.vue -->
<template>
  <div class="max-w-6xl mx-auto p-4 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-3xl font-bold">Dominion Gallery</h1>
      <NuxtLink to="/add-dominion" class="btn btn-primary"
        >New Dominion</NuxtLink
      >
    </div>

    <div class="flex flex-wrap gap-2 items-end">
      <label class="form-control w-48">
        <span class="label-text">Set ID</span>
        <input
          v-model="filters.setId"
          class="input input-bordered"
          placeholder="fanpack-alpha"
        />
      </label>
      <label class="form-control w-48">
        <span class="label-text">User ID</span>
        <input
          v-model.number="filters.userId"
          type="number"
          class="input input-bordered"
        />
      </label>
      <label class="form-control w-60">
        <span class="label-text">Search</span>
        <input
          v-model="filters.search"
          class="input input-bordered"
          placeholder="title, text, notes…"
        />
      </label>
      <label class="label cursor-pointer ml-2">
        <span class="label-text mr-2">Public Only</span>
        <input type="checkbox" class="toggle" v-model="filters.publicOnly" />
      </label>
      <button class="btn btn-outline" @click="load()">Apply</button>
      <button class="btn btn-ghost" @click="reset()">Reset</button>
    </div>

    <div v-if="store.loading" class="loading loading-ring loading-lg"></div>

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="card in store.items"
        :key="card.id"
        class="rounded-xl border bg-base-100 p-4 shadow-sm hover:shadow-md transition"
      >
        <div class="flex justify-between items-start">
          <h3 class="font-bold text-lg">{{ card.title }}</h3>
          <span v-if="card.isPublic" class="badge badge-primary">Public</span>
          <span v-else class="badge">Private</span>
        </div>

        <p class="text-xs opacity-70 mb-2">
          {{ card.setId || 'No set' }} · v{{ card.version }}
        </p>

        <p class="text-sm line-clamp-3 mb-2">{{ card.description }}</p>
        <p v-if="card.italics" class="text-sm italic opacity-80">
          “{{ card.italics }}”
        </p>

        <div class="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div><b>+Cards</b> {{ card.cardAdd }}</div>
          <div><b>+Acts</b> {{ card.actionAdd }}</div>
          <div><b>+Buys</b> {{ card.buyAdd }}</div>
          <div><b>+$</b> {{ card.coinAdd }}</div>
          <div><b>VP</b> {{ card.victoryAdd }}</div>
          <div><b>Cost</b> {{ costLabel(card) }}</div>
        </div>

        <div class="mt-3 flex flex-wrap gap-1">
          <span
            v-for="t in card.types as string[]"
            :key="t"
            class="badge badge-ghost"
            >{{ t }}</span
          >
        </div>

        <div class="mt-4 flex gap-2">
          <NuxtLink
            :to="`/add-dominion?id=${card.id}`"
            class="btn btn-sm btn-outline"
            >Edit</NuxtLink
          >
          <button
            class="btn btn-sm btn-error btn-outline"
            @click="remove(card.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="!store.loading && !store.items.length"
      class="text-center opacity-70"
    >
      No dominions found. Try resetting filters or create a new one.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useDominionStore } from '~/stores/dominionStore'

const store = useDominionStore()
const filters = reactive({
  userId: undefined as number | undefined,
  publicOnly: true,
  setId: '',
  search: '',
})

function buildQuery() {
  const q = new URLSearchParams()
  if (filters.userId) q.set('userId', String(filters.userId))
  if (filters.publicOnly) q.set('publicOnly', 'true')
  if (filters.setId) q.set('setId', filters.setId)
  if (filters.search) q.set('search', filters.search)
  return q.toString()
}

async function load() {
  // fetch with filters by temporarily swapping performFetch call inside store if desired,
  // or just hit the endpoint directly here:
  const query = buildQuery()
  const res = await fetch(`/api/dominions${query ? `?${query}` : ''}`)
  const data = await res.json()
  if (data.success) store.items = data.data
}

function reset() {
  filters.userId = undefined
  filters.publicOnly = true
  filters.setId = ''
  filters.search = ''
  load()
}

function costLabel(card: any) {
  const parts: string[] = []
  if (card.priceCoins) parts.push(`${card.priceCoins}💰`)
  if (card.priceDebt) parts.push(`${card.priceDebt}🕱`)
  if (card.pricePotion) parts.push(`${card.pricePotion}🧪`)
  return parts.join(' ') || '0💰'
}

async function remove(id: number) {
  if (!confirm('Delete this dominion?')) return
  const res = await fetch(`/api/dominions/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('apiKey') || ''}`,
    },
  })
  const data = await res.json()
  if (data.success) await load()
}

onMounted(async () => {
  await store.initialize()
  await load()
})
</script>
