<!-- /pages/play/aquarium/browse/index.vue
     Public tank index (cthulhuquarium/t-014) -- unauthenticated, paginated,
     read-only. Backed by GET /api/aquarium/browse (cthulhuquarium/t-009).
     Only isPublic tanks ever appear here; the response already carries
     nothing but display name + tank summary (server/utils/aquarium.ts's
     publicAquariumSummarySelect). -->
<template>
  <main class="kr-surface bg-base-200/40">
    <div
      class="kr-scroll kr-container max-w-5xl space-y-5 px-3 py-5 sm:px-6 sm:py-8"
    >
      <nav class="flex items-center justify-between gap-3">
        <NuxtLink to="/play/aquarium" class="btn btn-ghost btn-sm rounded-xl">
          <Icon name="kind-icon:arrow-left" class="size-4" />
          Your tank
        </NuxtLink>
      </nav>

      <header
        class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-lg sm:p-7"
      >
        <p class="text-xs font-black uppercase tracking-[0.25em] text-primary">
          Cthulhuquarium
        </p>
        <h2 class="mt-1 text-3xl font-black uppercase sm:text-4xl">
          Public tanks
        </h2>
        <p class="mt-2 max-w-2xl text-sm text-base-content/65">
          Every owner viewable, per the pitch. Read-only -- no feeding, no
          clicking, no writes from a visitor session.
        </p>
      </header>

      <div
        v-if="loading && !tanks.length"
        class="grid min-h-[40vh] place-items-center rounded-3xl border border-base-300 bg-base-100"
      >
        <div class="text-center">
          <span class="loading loading-ring loading-lg text-primary" />
          <p class="mt-3 text-sm font-bold text-base-content/55">
            Finding public tanks…
          </p>
        </div>
      </div>

      <div
        v-else-if="errorMessage && !tanks.length"
        class="rounded-3xl border border-error/30 bg-error/10 p-8 text-center"
      >
        <Icon name="kind-icon:warning" class="mx-auto size-10 text-error" />
        <p class="mt-3 text-xl font-black">Could not load public tanks</p>
        <p class="mt-2 text-sm text-base-content/65">{{ errorMessage }}</p>
        <button class="btn btn-error btn-sm mt-5 rounded-xl" @click="load()">
          Try again
        </button>
      </div>

      <div
        v-else-if="!tanks.length"
        class="rounded-3xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center"
      >
        <Icon name="kind-icon:fish" class="mx-auto size-12 text-primary/40" />
        <h2 class="mt-4 text-2xl font-black uppercase">Nothing public yet</h2>
        <p class="mx-auto mt-2 max-w-xl text-sm text-base-content/60">
          No owner has made their tank public. Yours defaults to public -- check
          the toggle at the bottom of your own tank.
        </p>
      </div>

      <template v-else>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="tank in tanks"
            :key="`${tank.User.username}/${tank.slug}`"
            :to="`/play/aquarium/browse/${tank.User.username}/${tank.slug}`"
            class="group flex flex-col gap-2 kr-panel-flat p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div class="flex items-center gap-3">
              <div
                class="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-base-300 bg-base-200"
              >
                <img
                  v-if="tank.User.avatarImage"
                  :src="normalizeImagePath(tank.User.avatarImage)"
                  :alt="tank.User.username"
                  class="h-full w-full object-cover"
                />
                <Icon
                  v-else
                  name="kind-icon:user"
                  class="size-5 text-primary/60"
                />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-black">{{ tank.title }}</p>
                <p class="truncate text-xs text-base-content/55">
                  @{{ tank.User.username }}
                </p>
              </div>
            </div>
            <p class="text-xs font-bold text-base-content/60">
              {{ tank._count.Stock }}
              {{ tank._count.Stock === 1 ? 'occupant' : 'occupants' }}
            </p>
          </NuxtLink>
        </div>

        <div class="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            class="btn btn-outline btn-sm rounded-xl"
            :disabled="loading || skip <= 0"
            @click="prevPage"
          >
            <Icon name="kind-icon:arrow-left" class="size-4" />
            Newer
          </button>
          <p class="text-xs font-bold text-base-content/50">
            {{ Math.min(skip + tanks.length, total) }} of {{ total }}
          </p>
          <button
            type="button"
            class="btn btn-outline btn-sm rounded-xl"
            :disabled="loading || skip + tanks.length >= total"
            @click="nextPage"
          >
            Older
            <Icon name="kind-icon:arrow-right" class="size-4" />
          </button>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import type { PaginationMeta } from '@/types/api'

interface PublicTankOwner {
  username: string
  avatarImage: string | null
}

interface PublicTankSummary {
  slug: string
  title: string
  backgroundKey: string | null
  updatedAt: string
  User: PublicTankOwner
  _count: { Stock: number }
}

const TAKE = 12

const tanks = ref<PublicTankSummary[]>([])
const total = ref(0)
const skip = ref(0)
const loading = ref(false)
const errorMessage = ref('')

useHead({ title: 'Public tanks · Cthulhuquarium' })

function normalizeImagePath(value: string): string {
  if (value.startsWith('/') || value.startsWith('http')) return value
  return `/images/${value}`
}

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await performFetch<PublicTankSummary[], PaginationMeta>(
      `/api/aquarium/browse?take=${TAKE}&skip=${skip.value}`,
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Could not load public tanks.')
    }
    tanks.value = response.data
    total.value = response.meta?.total ?? response.data.length
  } catch (error: unknown) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not load public tanks.'
  } finally {
    loading.value = false
  }
}

function nextPage(): void {
  skip.value += TAKE
  void load()
}

function prevPage(): void {
  skip.value = Math.max(0, skip.value - TAKE)
  void load()
}

onMounted(load)
</script>
