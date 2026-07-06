<!-- /components/pages/serendipity-voice-page.vue -->
<!--
  Serendipity Voice — the Kind Robots front end for the Alexa voice surface.
  It connects to the local serendipity-voice relay, shows the shared message
  feed, and applies spoken commands to the app. Say "Serendipity, turn
  butterflies on" to your Echo (or use the simulate box below) and the butterfly
  animation turns on right here via animationStore + the app-wide fx-region.
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4 md:p-6"
    data-animation-surface
  >
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span
          class="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary"
        >
          <Icon name="kind-icon:butterfly" class="h-7 w-7" />
        </span>
        <div>
          <h1 class="text-2xl font-black tracking-tight">Serendipity Voice</h1>
          <p class="text-sm text-base-content/60">
            Talk to Kind Robots through your Amazon Echo.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
          :class="
            voice.connected
              ? 'bg-success/20 text-success'
              : 'bg-error/15 text-error'
          "
        >
          <span
            class="h-2 w-2 rounded-full"
            :class="voice.connected ? 'bg-success' : 'bg-error'"
          />
          {{ voice.connected ? 'Relay connected' : 'Relay offline' }}
        </span>
        <button
          class="btn btn-sm"
          :class="voice.polling ? 'btn-warning' : 'btn-primary'"
          type="button"
          @click="toggleConnection"
        >
          {{ voice.polling ? 'Disconnect' : 'Connect' }}
        </button>
      </div>
    </header>

    <!-- Relay endpoint -->
    <div
      class="flex flex-wrap items-end gap-3 rounded-xl border border-base-300 bg-base-200/60 p-3"
    >
      <label class="flex-1">
        <span
          class="mb-1 block text-xs font-bold uppercase text-base-content/60"
        >
          Relay URL
        </span>
        <input
          v-model="relayInput"
          class="input input-bordered input-sm w-full"
          placeholder="http://localhost:4173"
          @change="saveRelay"
        />
      </label>
      <p class="text-xs text-base-content/50">
        The serendipity-voice dev server (npm run dev:web).
      </p>
    </div>

    <!-- Simulate an Echo utterance -->
    <div class="rounded-xl border border-base-300 bg-base-200/60 p-3">
      <p class="mb-2 text-xs font-bold uppercase text-base-content/60">
        Speak to Serendipity (or simulate)
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="phrase in quickPhrases"
          :key="phrase"
          class="btn btn-xs btn-outline"
          type="button"
          @click="send(phrase)"
        >
          {{ phrase }}
        </button>
      </div>
      <form class="mt-3 flex gap-2" @submit.prevent="send(utterance)">
        <input
          v-model="utterance"
          class="input input-bordered input-sm flex-1"
          placeholder="Serendipity, turn butterflies on"
        />
        <button class="btn btn-sm btn-primary" type="submit">Send</button>
      </form>
    </div>

    <div class="grid flex-1 gap-4 md:grid-cols-[1fr,16rem]">
      <!-- Message feed -->
      <div
        class="flex min-h-48 flex-col rounded-xl border border-base-300 bg-base-100"
      >
        <div
          class="border-b border-base-300 px-3 py-2 text-xs font-bold uppercase text-base-content/60"
        >
          Message feed
        </div>
        <div class="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          <p
            v-if="voice.recentMessages.length === 0"
            class="text-sm text-base-content/50"
          >
            Waiting for messages. Connect the relay, then say “Serendipity, turn
            butterflies on.”
          </p>
          <div
            v-for="message in voice.recentMessages"
            :key="message.id"
            class="flex items-start gap-2"
          >
            <span
              class="mt-0.5 rounded-full px-2 py-0.5 text-[0.65rem] font-black uppercase"
              :class="roleClass(message.role)"
            >
              {{ message.role }}
            </span>
            <span class="text-sm text-base-content/90">{{ message.text }}</span>
          </div>
        </div>
      </div>

      <!-- Live animation state -->
      <aside
        class="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-200/60 p-3"
      >
        <div>
          <p class="text-xs font-bold uppercase text-base-content/60">
            Active animations
          </p>
          <p
            v-if="activeEffects.length === 0"
            class="mt-1 text-sm text-base-content/50"
          >
            None running.
          </p>
          <ul v-else class="mt-1 space-y-1">
            <li
              v-for="effect in activeEffects"
              :key="effect.id"
              class="flex items-center gap-2 text-sm font-semibold"
            >
              <Icon
                :name="effect.icon"
                class="h-4 w-4"
                :style="{ color: effect.color }"
              />
              {{ effect.label }}
            </li>
          </ul>
        </div>

        <div class="border-t border-base-300 pt-2">
          <p class="text-xs font-bold uppercase text-base-content/60">Theme</p>
          <p class="mt-1 text-sm font-semibold">{{ currentTheme }}</p>
        </div>

        <div v-if="voice.lastAppliedText" class="text-xs text-success">
          Last applied: {{ voice.lastAppliedText }}
        </div>
        <div v-if="voice.lastError" class="text-xs text-error">
          {{ voice.lastError }}
        </div>

        <p class="mt-auto text-[0.7rem] leading-snug text-base-content/50">
          Effects render app-wide through fx-region, so butterflies appear over
          this page the moment the command lands.
        </p>
      </aside>
    </div>

    <!-- Art drafts (surfaced from voice; never generated or published here) -->
    <div
      v-if="voice.artRequests.length > 0"
      class="rounded-xl border border-base-300 bg-base-200/60 p-3"
    >
      <p class="mb-2 text-xs font-bold uppercase text-base-content/60">
        Art drafts from voice ({{ voice.artRequests.length }})
      </p>
      <ul class="space-y-2">
        <li
          v-for="art in voice.artRequests"
          :key="art.id"
          class="rounded-lg border border-base-300 bg-base-100 p-2"
        >
          <p class="text-sm font-semibold">“{{ art.prompt }}”</p>
          <p class="mt-0.5 text-xs text-base-content/60">
            style: {{ art.style || '—' }} · size: {{ art.size || '—' }} ·
            gallery: {{ art.gallery || '—' }}
          </p>
        </li>
      </ul>
      <p class="mt-2 text-[0.7rem] leading-snug text-base-content/50">
        Drafts only — review here, then generate through the normal Kind Robots
        art flow. Voice never generates or publishes images on its own.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  useSerendipityVoiceStore,
  type VoiceBusRole,
} from '@/stores/serendipityVoiceStore'
import { useAnimationStore } from '@/stores/animationStore'
import { useThemeStore } from '@/stores/themeStore'

const voice = useSerendipityVoiceStore()
const animationStore = useAnimationStore()
const themeStore = useThemeStore()

const relayInput = ref(voice.relayBaseUrl)
const utterance = ref('Serendipity, turn butterflies on')

const quickPhrases = [
  'Serendipity, turn butterflies on',
  'Serendipity, turn butterflies off',
  'Serendipity, surprise me',
  'Serendipity, set theme to synthwave',
  'Serendipity, use the retro theme',
  'Serendipity, generate art of a robot fox painting a portal',
  'Serendipity, turn off all animations',
]

const activeEffects = computed(() => animationStore.screenEffects)
const currentTheme = computed(() => themeStore.currentTheme)

function roleClass(role: VoiceBusRole): string {
  if (role === 'voice') return 'bg-primary/20 text-primary'
  if (role === 'view') return 'bg-info/20 text-info'
  return 'bg-base-300 text-base-content/70'
}

function toggleConnection(): void {
  if (voice.polling) voice.stop()
  else voice.start()
}

function saveRelay(): void {
  voice.setRelayBaseUrl(relayInput.value)
  relayInput.value = voice.relayBaseUrl
  if (voice.polling) {
    voice.stop()
    voice.start()
  }
}

function send(text: string): void {
  void voice.sendVoiceText(text)
}

onMounted(() => {
  voice.start()
  relayInput.value = voice.relayBaseUrl
})

onBeforeUnmount(() => {
  voice.stop()
})
</script>
