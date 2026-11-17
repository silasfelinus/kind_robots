<template>
  <section class="flex h-full min-h-0 w-full flex-col">
    <header-page-bar>
      <span class="inline-flex items-center gap-2 text-sm font-black">
        <Icon name="kind-icon:sparkles" class="size-5" />
        K8 Wildlife
      </span>
    </header-page-bar>

    <div
      v-if="!allowed"
      class="grid min-h-0 flex-1 place-items-center overflow-hidden p-4"
    >
      <div class="kr-panel max-w-lg p-6 text-center">
        <h2 class="text-xl font-bold">Private wildlife portfolio</h2>
        <p class="mt-2 text-sm opacity-75">
          Sign in as K8 or an administrator to open this project.
        </p>
        <NuxtLink to="/login" class="btn btn-primary mt-4">Sign in</NuxtLink>
      </div>
    </div>

    <div
      v-else
      class="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-neutral text-neutral-content"
    >
      <picture class="absolute inset-0">
        <source
          media="(max-width: 600px)"
          srcset="
            https://raw.githubusercontent.com/silasfelinus/critical-mass/main/admin/public/k8-animals/mobile/02-sloth.webp
          "
        />
        <img
          class="h-full w-full object-cover"
          src="https://raw.githubusercontent.com/silasfelinus/critical-mass/main/admin/public/k8-animals/02-sloth.webp"
          alt="K8 as a rainbow-haired sloth, resting in her fantastic portfolio world"
        />
      </picture>
      <div
        class="absolute inset-0 bg-gradient-to-t from-neutral via-neutral/65 to-transparent"
      />

      <div class="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-8">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-warning">
          Your private project
        </p>
        <h1 class="max-w-xl text-3xl font-black leading-none sm:text-5xl">
          K8 Wildlife
        </h1>
        <p class="max-w-xl text-sm text-base-100/90 sm:text-base">
          Eleven spectacular animals, a 0–10 risk dial, and one unmistakable K8.
          The selected creature and account figures live in Critical Mass.
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <a
            v-if="launchUrl"
            :href="launchUrl"
            class="btn btn-primary"
            rel="noopener noreferrer"
          >
            Open my Wildlife portfolio
            <Icon name="kind-icon:external-link" class="size-4" />
          </a>
          <span
            v-else
            class="rounded-xl border border-warning/50 bg-warning/20 px-3 py-2 text-sm"
            role="status"
          >
            The Critical Mass portal address has not been connected yet.
          </span>
          <a
            href="https://github.com/silasfelinus/critical-mass"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-ghost btn-sm"
          >
            Project source
          </a>
        </div>
        <p class="text-xs opacity-75">
          Trading settings and portfolio data remain private to the Critical
          Mass account. This project link never stores exchange credentials.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { isSuperkateServicesViewer } from '@/stores/helpers/superkateNavigation'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const config = useRuntimeConfig()
const allowed = computed(() =>
  isSuperkateServicesViewer(userStore.user, userStore.isAdmin),
)

const launchUrl = computed(() => {
  const raw = String(config.public.k8PortalUrl ?? '').trim()
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return ''
    url.pathname = '/k8'
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return ''
  }
})
</script>
