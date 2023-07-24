<template>
  <div
    v-if="bot"
    ref="card"
    :class="[
      `p-${paddingSize}`,
      `border-${borderSize}`,
      `border-${borderColor}`,
      `bg-${bgColor}`,
      `rounded-${borderRadius}`,
      'relative',
      'draggable',
      'h-full',
      'max-w-xs',
      'mx-auto',
      'rounded-xl',
      'shadow-md',
      'overflow-hidden',
      'md:max-w-2xl'
    ]"
    :style="{ transform: `translate(${x}px, ${y}px)` }"
  >
    <div
      class="absolute top-0 right-0 bg-accent p-1 rounded"
      :style="{ width: handleSize + 'px', height: handleSize + 'px' }"
    >
      <button
        class="relative z-10 block rounded-md bg-white p-2 focus:outline-none"
        @click="menuOpen = !menuOpen"
      >
        <svg
          class="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M2 3a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 7a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm1 5a1 1 0 100 2h14a1 1 0 100-2H3z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <div
        v-if="menuOpen"
        class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
      >
        <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
          <a
            href="#"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            >Option 1</a
          >
          <a
            href="#"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            >Option 2</a
          >
          <a
            href="#"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            role="menuitem"
            >Option 3</a
          >
        </div>
      </div>
    </div>
    <div class="md:flex">
      <div class="md:flex-shrink-0">
        <avatar-image class="h-48 w-full object-cover md:w-48" />
      </div>
      <div :class="`p-8 bg-${contentColor} p-${innerPaddingSize}`">
        <div :class="`uppercase tracking-wide text-sm text-${titleColor} font-semibold`">
          {{ bot.name }}
        </div>
        <div class="block mt-1 text-lg leading-tight font-medium text-black hover:underline">
          {{ bot.description }}
        </div>
        <div class="mt-2 flex items-center text-sm text-${textColor}">
          <div v-if="bot.underConstruction" :class="`text-${statusColor}`">Under Construction</div>
          <bot-prompt />
        </div>
      </div>
    </div>
    <div class="absolute top-1/2 left-0">
      <button class="bg-accent text-white p-2 rounded-r">&lt;</button>
    </div>
    <div class="absolute top-1/2 right-0">
      <button class="bg-accent text-white p-2 rounded-l">&gt;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import interact from 'interactjs'
import { useBotStore } from '../../stores/botStore'

const botsStore = useBotStore()
const bot = computed(() => botsStore.getActiveBot)

let bgColor = inject('bgColor', 'base-200') // changed to base-200
let borderColor = inject('borderColor', 'secondary') // using secondary for border
let borderSize = inject('borderSize', '2')
let borderRadius = inject('borderRadius', 'lg')
let paddingSize = inject('paddingSize', '4')
let buttonColor = inject('buttonColor', 'accent') // accent for buttons

let handleSize = '20'
let contentColor = 'secondary'
let titleColor = 'primary'
let textColor = 'base'
let statusColor = 'accent'
let innerPaddingSize = '4'

let buttonTextColor = 'white'
let buttonPadding = '2'

const card = ref(null)

let x = ref(0)
let y = ref(0)
let menuOpen = ref(false)

function dragMoveListener(event: any) {
  x.value += event.dx
  y.value += event.dy
}

onMounted(() => {
  interact(card.value as unknown as HTMLElement).draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ],
    autoScroll: true,
    listeners: {
      move: dragMoveListener
    }
  })
})

onBeforeUnmount(() => {
  interact(card.value as unknown as HTMLElement).unset()
})
</script>
../../stores/botStore
