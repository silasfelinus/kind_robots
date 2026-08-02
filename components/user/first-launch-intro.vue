<!-- /components/content/user/first-launch-intro.vue -->
<template>
  <dialog
    ref="introDialog"
    class="modal modal-bottom sm:modal-middle"
    @close="onNativeClose"
  >
    <div
      class="modal-box flex h-[92dvh] max-h-[92dvh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl border border-base-300 bg-base-100 p-0 sm:h-auto sm:max-h-[90vh] sm:w-11/12 sm:max-w-2xl sm:rounded-2xl"
    >
      <header
        class="flex shrink-0 items-start justify-between gap-3 border-b border-base-300 bg-base-100 p-4"
      >
        <div class="min-w-0">
          <p
            class="text-xs font-black uppercase tracking-widest text-primary"
          >
            {{ step + 1 }} / {{ steps.length }}
          </p>
          <h2 class="mt-0.5 truncate text-lg font-black sm:text-xl">
            {{ currentStep.title }}
          </h2>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="dismiss"
        >
          Skip
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <Icon :name="currentStep.icon" class="h-8 w-8" />
        </div>

        <p
          class="mt-4 text-center text-sm leading-relaxed text-base-content/75 sm:text-base"
        >
          {{ currentStep.body }}
        </p>

        <ul
          v-if="currentStep.items"
          class="mx-auto mt-4 grid max-w-md grid-cols-2 gap-2 sm:grid-cols-3"
        >
          <li
            v-for="item in currentStep.items"
            :key="item.label"
            class="flex flex-col items-center gap-1 rounded-xl border border-base-300 bg-base-200 p-2 text-center"
          >
            <Icon :name="item.icon" class="h-5 w-5 text-secondary" />
            <span class="text-xs font-bold">{{ item.label }}</span>
          </li>
        </ul>

        <div
          v-if="currentStep.links"
          class="mx-auto mt-5 flex max-w-md flex-col gap-2"
        >
          <NuxtLink
            v-for="link in currentStep.links"
            :key="link.to"
            :to="link.to"
            class="btn btn-outline btn-sm justify-start rounded-xl"
            @click="dismiss"
          >
            <Icon :name="link.icon" class="h-4 w-4" />
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>

      <footer
        class="flex shrink-0 items-center justify-between gap-2 border-t border-base-300 bg-base-100 p-4"
      >
        <div class="flex items-center gap-1.5">
          <span
            v-for="(item, index) in steps"
            :key="item.title"
            class="h-1.5 w-1.5 rounded-full"
            :class="index === step ? 'bg-primary' : 'bg-base-300'"
          />
        </div>

        <div class="flex gap-2">
          <button
            v-if="step > 0"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="back"
          >
            Back
          </button>

          <button
            v-if="step < steps.length - 1"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="next"
          >
            Next
          </button>

          <button
            v-else
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="dismiss"
          >
            <Icon name="kind-icon:check" class="h-4 w-4" />
            Let's go
          </button>
        </div>
      </footer>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button @click="dismiss">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
// /components/content/user/first-launch-intro.vue
//
// Dismissible, re-openable first-launch walkthrough (interface-vision/t-014):
// what Kind Robots is, karma vs mana, the seven object types, and where to
// start. Dismissal persists on the User record via accountStore so it
// follows the account across devices; useIntroStore.open() re-opens it from
// the user dashboard at any time.
import { computed, nextTick, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { useIntroStore } from '@/stores/introStore'

type IntroLink = { to: string; label: string; icon: string }
type IntroItem = { label: string; icon: string }

type IntroStep = {
  title: string
  icon: string
  body: string
  items?: IntroItem[]
  links?: IntroLink[]
}

const introStore = useIntroStore()
const accountStore = useAccountStore()

const introDialog = ref<HTMLDialogElement | null>(null)
const step = ref(0)

const steps: IntroStep[] = [
  {
    title: 'Welcome to Kind Robots',
    icon: 'kind-icon:sparkles',
    body: 'A socially conscious suite of AI-supported creativity tools. Build dreams, characters, and stories with AI, and a share of everything Kind Robots earns goes to our anti-malaria fundraiser — creativity that turns into good in the world.',
  },
  {
    title: 'Karma and mana',
    icon: 'kind-icon:jellybean',
    body: "Karma is your standing on the site — it only ever grows, earned by creating, sharing, and discovering. Mana is your usage budget for AI generation — it refills on its own schedule and has a cap, so it can run low and recover. Karma is a record; mana is a resource.",
  },
  {
    title: 'Seven kinds of things to build',
    icon: 'kind-icon:bot',
    body: 'Everything you make on Kind Robots is one of seven object types:',
    items: [
      { label: 'Bots', icon: 'kind-icon:bot' },
      { label: 'Dreams', icon: 'kind-icon:sparkles' },
      { label: 'Characters', icon: 'kind-icon:users' },
      { label: 'Scenarios', icon: 'kind-icon:map' },
      { label: 'Rewards', icon: 'kind-icon:gift' },
      { label: 'Facets', icon: 'kind-icon:tag' },
      { label: 'Projects', icon: 'kind-icon:folder' },
    ],
  },
  {
    title: 'Where to start',
    icon: 'kind-icon:compass',
    body: "Your dashboard is home base for karma, mana, achievements, and everything you've made. From there, jump into whichever of these calls to you first:",
    links: [
      { to: '/dreams', label: 'Start a Dream', icon: 'kind-icon:sparkles' },
      { to: '/art', label: 'Generate art', icon: 'kind-icon:palette' },
      { to: '/dashboard', label: 'Your dashboard', icon: 'kind-icon:settings' },
    ],
  },
]

const currentStep = computed<IntroStep>(() => steps[step.value] ?? steps[0]!)

function next(): void {
  if (step.value < steps.length - 1) step.value += 1
}

function back(): void {
  if (step.value > 0) step.value -= 1
}

function dismiss(): void {
  introStore.close()
  void accountStore.setIntroDismissed(true)
}

function onNativeClose(): void {
  // Covers ESC / native backdrop-form dismissal, which bypass dismiss().
  if (introStore.isOpen) dismiss()
}

watch(
  () => introStore.isOpen,
  async (open) => {
    await nextTick()
    const dialogEl = introDialog.value
    if (!dialogEl) return

    if (open) {
      step.value = 0
      if (!dialogEl.open) dialogEl.showModal()
    } else if (dialogEl.open) {
      dialogEl.close()
    }
  },
  { immediate: true },
)
</script>
