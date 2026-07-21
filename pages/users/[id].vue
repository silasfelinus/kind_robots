<!-- /pages/users/[id].vue -->
<template>
  <section class="h-full min-h-0 overflow-y-auto p-4 sm:p-6">
    <div class="mx-auto max-w-2xl">
      <NuxtLink
        to="/wonderlab"
        class="btn btn-ghost btn-sm mb-4 rounded-xl"
      >
        <Icon name="kind-icon:arrow-left" class="size-4" />
        Back to WonderLab
      </NuxtLink>

      <article
        v-if="user"
        class="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-lg"
      >
        <div class="h-28 bg-linear-to-br from-primary/25 via-secondary/15 to-accent/20" />
        <div class="px-5 pb-6 sm:px-8">
          <div
            class="-mt-14 flex size-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-base-100 bg-base-200 shadow-md"
          >
            <img
              v-if="user.avatarImage"
              :src="normalizeImagePath(user.avatarImage)"
              :alt="displayName"
              class="h-full w-full object-cover"
            />
            <Icon v-else name="kind-icon:user" class="size-12 text-primary/60" />
          </div>

          <div class="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-widest text-primary">
                Public Kind Robots profile
              </p>
              <h1 class="mt-1 break-words text-3xl font-black">
                {{ displayName }}
              </h1>
              <p
                v-if="user.username"
                class="mt-1 text-sm font-semibold text-base-content/55"
              >
                @{{ user.username }}
              </p>
            </div>
            <span v-if="user.Role" class="badge badge-outline rounded-xl">
              {{ formatRole(user.Role) }}
            </span>
          </div>

          <p class="mt-5 rounded-2xl bg-base-200/70 p-4 text-sm leading-relaxed text-base-content/70">
            This member has chosen to make their Kind Robots profile public.
          </p>
        </div>
      </article>

      <div
        v-else-if="status === 'pending'"
        class="flex min-h-64 items-center justify-center rounded-3xl border border-base-300 bg-base-100"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else
        class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-warning/40 bg-warning/5 p-6 text-center"
      >
        <Icon name="kind-icon:user" class="size-12 text-warning" />
        <h1 class="text-xl font-black">Public profile unavailable</h1>
        <p class="max-w-md text-sm text-base-content/65">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app'

type PublicUser = {
  id: number
  username: string | null
  name: string | null
  avatarImage: string | null
  artImageId: number | null
  designerName: string | null
  Role: string | null
  isPublic: boolean
}

type PublicUserResponse = {
  success: boolean
  data?: PublicUser
  message: string
  statusCode?: number
}

const route = useRoute()
const userId = computed(() => {
  const raw = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
})
const asyncKey = computed(() => `public-user:${userId.value}`)

const { data, status } = await useAsyncData<PublicUserResponse>(
  asyncKey,
  () => $fetch<PublicUserResponse>(`/api/users/public/${userId.value}` as string),
  {
    watch: [userId],
  },
)

const user = computed(() => (data.value?.success ? data.value.data ?? null : null))
const displayName = computed(
  () =>
    user.value?.designerName?.trim() ||
    user.value?.name?.trim() ||
    user.value?.username?.trim() ||
    'Kind Robots member',
)
const errorMessage = computed(
  () => data.value?.message || 'This profile is private or does not exist.',
)

useSeoMeta({
  title: () => `${displayName.value} · Kind Robots`,
  description: () => `Public Kind Robots profile for ${displayName.value}.`,
})

function normalizeImagePath(value: string): string {
  if (value.startsWith('/') || value.startsWith('http')) return value
  return `/images/${value}`
}

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}
</script>
