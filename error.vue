<template>
  <main
    class="min-h-screen bg-base-300 px-4 py-8 text-base-content sm:px-6 lg:px-8"
  >
    <section
      class="kr-container flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-6"
    >
      <img
        src="/images/background/error.webp"
        alt="Whimsical robot in the Kind Robots Lost & Found Room"
        class="max-h-[58vh] w-full max-w-3xl rounded-3xl object-contain shadow-2xl"
      />

      <div
        class="kr-panel w-full max-w-3xl rounded-3xl bg-base-100/95 text-center shadow-xl backdrop-blur sm:p-8"
      >
        <p class="text-sm font-black uppercase tracking-[0.2em] text-primary">
          {{ statusCode }} · Lost & Found Room
        </p>
        <h1 class="mt-2 text-3xl font-black sm:text-4xl">
          {{ heading }}
        </h1>
        <p
          class="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-base-content/70"
        >
          {{ message }}
        </p>

        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" class="kr-btn-primary-md-2xl" @click="goHome">
            Go home
          </button>
          <button
            type="button"
            class="kr-btn-ghost-md-2xl"
            @click="retry"
          >
            Try again
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)

const heading = computed(() =>
  isNotFound.value ? 'This page wandered off.' : 'Something went sideways.',
)

const message = computed(() => {
  if (isNotFound.value) {
    return 'We couldn’t find the page you were looking for. It may have been renamed, moved, retired, or never existed at all.'
  }

  return 'Kind Robots hit an unexpected error. You can try the page again or head back home.'
})

async function goHome(): Promise<void> {
  await clearError({ redirect: '/' })
}

function retry(): void {
  if (import.meta.client) window.location.reload()
}
</script>
