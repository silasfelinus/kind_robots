<template>
  <div
    v-if="state !== 'hidden'"
    class="absolute inset-0 z-20 overflow-hidden rounded-3xl bg-[#120826] text-white"
    role="dialog"
    aria-label="Rainbow Space Princess opening"
  >
    <video
      v-if="state === 'playing'"
      ref="video"
      class="h-full w-full object-contain"
      :poster="opening.poster"
      playsinline
      :muted="arcade.muted"
      @ended="close"
      @error="onPlaybackError"
    >
      <source :src="opening.webm" type="video/webm" />
      <source :src="opening.mp4" type="video/mp4" />
    </video>
    <template v-else>
      <img
        :src="opening.poster"
        alt="The four pilot ships over the pearl palace"
        width="1280"
        height="720"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-[#120826] via-[#120826]/60 to-transparent"
      />
      <div
        class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 text-center sm:p-8"
      >
        <p
          class="text-xs font-bold uppercase tracking-[0.3em] text-pink-200/80"
          aria-live="polite"
        >
          {{
            state === 'failed'
              ? 'Opening video unavailable'
              : `Opening · ${Math.round(opening.seconds)} seconds · sound on`
          }}
        </p>
        <h2 class="text-3xl font-black leading-none sm:text-5xl">
          Rainbow Bullet Hell
          <span
            class="block bg-gradient-to-r from-pink-300 via-yellow-200 to-cyan-300 bg-clip-text text-transparent"
            >Space Princess</span
          >
        </h2>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            ref="playButton"
            type="button"
            class="btn btn-lg rounded-2xl border-0 bg-pink-300 text-[#251345] hover:bg-pink-200"
            @click="play"
          >
            <Icon name="kind-icon:play" class="kr-icon-5" />
            {{ state === 'failed' ? 'Try opening again' : 'Play the opening' }}
          </button>
          <button
            type="button"
            class="btn btn-lg btn-ghost rounded-2xl border border-white/40 text-white hover:bg-white/10"
            @click="close"
          >
            Skip to the flight
          </button>
        </div>
      </div>
    </template>
    <button
      v-if="state === 'playing'"
      type="button"
      class="btn btn-sm absolute right-3 top-3 rounded-full border border-white/30 bg-black/50 text-white"
      @click="close"
    >
      Skip ▸
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useArcadeStore } from '~/stores/arcadeStore'
import type { RainbowOpeningMedia } from '~/utils/arcade/games/rainbowOpening'

defineProps<{ opening: RainbowOpeningMedia }>()
const emit = defineEmits<{ showing: [boolean] }>()

const SLUG = 'rainbow-bullet-hell-space-princess'
const arcade = useArcadeStore()
const state = ref<'hidden' | 'offer' | 'playing' | 'failed'>('hidden')
const video = ref<HTMLVideoElement | null>(null)
const playButton = ref<HTMLButtonElement | null>(null)
let frame = 0
let playbackAttempt = 0

watch(state, (now) => emit('showing', now !== 'hidden'))

async function play() {
  const attempt = ++playbackAttempt
  cancelAnimationFrame(frame)
  state.value = 'playing'
  await nextTick()
  const player = video.value
  if (!player || attempt !== playbackAttempt || state.value !== 'playing') {
    return
  }
  player.volume = arcade.volume
  pollPads()
  try {
    await player.play()
  } catch {
    if (attempt !== playbackAttempt || state.value !== 'playing') return
    player.muted = true
    try {
      await player.play()
    } catch {
      if (attempt === playbackAttempt) onPlaybackError()
    }
  }
}

function onPlaybackError() {
  if (state.value !== 'playing') return
  ++playbackAttempt
  cancelAnimationFrame(frame)
  state.value = 'failed'
  pollPads()
  void nextTick(() => {
    if (state.value === 'failed') playButton.value?.focus()
  })
}

function close() {
  ++playbackAttempt
  cancelAnimationFrame(frame)
  state.value = 'hidden'
  arcade.markOpeningSeen(SLUG)
}

function offer() {
  ++playbackAttempt
  cancelAnimationFrame(frame)
  state.value = 'offer'
  pollPads()
  void nextTick(() => playButton.value?.focus())
}

function onKey(event: KeyboardEvent) {
  if (state.value === 'hidden') return
  if (state.value === 'playing') {
    if (['Escape', 'Enter', ' ', 'a', 'A'].includes(event.key)) {
      event.preventDefault()
      close()
    }
  } else if (event.key === 'Escape') close()
}

function pollPads() {
  cancelAnimationFrame(frame)
  const pressed = () =>
    Array.from(navigator.getGamepads?.() ?? []).some((pad) =>
      pad?.buttons.some((button) => button.pressed),
    )
  let armed = false
  const tick = () => {
    if (state.value === 'hidden') return
    if (!pressed()) {
      armed = true
    } else if (armed) {
      armed = false
      if (state.value === 'playing') close()
      else void play()
      return
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  if (!arcade.openingSeen(SLUG)) offer()
})
onBeforeUnmount(() => {
  ++playbackAttempt
  window.removeEventListener('keydown', onKey)
  cancelAnimationFrame(frame)
})

defineExpose({ offer, play })
</script>
