<!-- /components/conductor/voice-lab-page.vue -->
<template>
  <ProjectFrontPage slug="alexa-integration" :fallback="config">
    <template #interactive>
      <section
        class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:server" class="size-5 text-primary" />
            <h3
              class="text-sm font-black uppercase tracking-wide text-base-content/70"
            >
              Relay status
            </h3>
          </div>
          <span
            class="flex items-center gap-1.5 rounded-xl border border-base-300 px-2.5 py-1 text-xs font-semibold"
          >
            <span
              class="size-2 rounded-full"
              :class="voice.connected ? 'bg-success' : 'bg-error'"
            />
            {{ voice.connected ? 'Relay connected' : 'Relay offline' }}
          </span>
        </div>
        <p class="text-sm text-base-content/70">
          The Serendipity voice runtime
          (<code>silasfelinus/serendipity-voice</code>) bridges an Alexa skill
          to Kind Robots through a local relay. Run
          <code>npm run dev:web</code> in that repo, then try a request below —
          it exercises the same dispatcher path a real Echo utterance would.
        </p>

        <form class="flex flex-wrap gap-2" @submit.prevent="tryRequest">
          <input
            v-model="tryText"
            type="text"
            placeholder="Serendipity: turn butterflies on"
            class="input input-bordered input-sm min-w-0 flex-1 rounded-xl"
          />
          <button
            type="submit"
            class="btn btn-primary btn-sm gap-1.5 rounded-xl"
            :disabled="!tryText.trim()"
          >
            <Icon name="kind-icon:microphone" class="size-4" />
            Try it
          </button>
        </form>

        <div
          v-if="voice.recentMessages.length"
          class="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200/50 p-3"
        >
          <p
            v-for="message in voice.recentMessages.slice(-6)"
            :key="message.id"
            class="text-xs text-base-content/70"
          >
            <span class="font-bold uppercase">{{ message.role }}:</span>
            {{ message.text }}
          </p>
        </div>
        <p v-if="voice.lastError" class="text-xs text-error">
          {{ voice.lastError }}
        </p>

        <NuxtLink
          to="/serendipity-voice"
          class="btn btn-ghost btn-sm w-fit gap-1.5 rounded-xl border border-base-300"
        >
          <Icon name="kind-icon:external-link" class="size-4" />
          Open the full Serendipity Voice view
        </NuxtLink>
      </section>

      <section
        class="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:book" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            What you can say
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Status</th>
                <th>Try saying</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="adapter in ADAPTERS" :key="adapter.domain">
                <td class="font-semibold">{{ adapter.domain }}</td>
                <td>
                  <span
                    class="badge badge-sm rounded-lg"
                    :class="adapter.badgeClass"
                    >{{ adapter.status }}</span
                  >
                </td>
                <td class="text-base-content/70">
                  <code>{{ adapter.example }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'
import { useSerendipityVoiceStore } from '@/stores/serendipityVoiceStore'

const voice = useSerendipityVoiceStore()
const tryText = ref('Serendipity: turn butterflies on')

function tryRequest() {
  const text = tryText.value.trim()
  if (!text) return
  void voice.sendVoiceText(text)
}

onMounted(() => {
  voice.start()
})
onBeforeUnmount(() => {
  voice.stop()
})

// Mirrors the "Adapter status" table in silasfelinus/serendipity-voice's README.
const ADAPTERS = [
  {
    domain: 'chat',
    status: 'live (flagged)',
    badgeClass: 'badge-success',
    example: 'Serendipity: ask AMI why my relay is cranky',
  },
  {
    domain: 'character',
    status: 'live (flagged)',
    badgeClass: 'badge-success',
    example: 'Serendipity: ask Dotti about the weather',
  },
  {
    domain: 'dream',
    status: 'stubbed',
    badgeClass: 'badge-ghost',
    example: "Serendipity: what's next for the story",
  },
  {
    domain: 'art',
    status: 'draft-only',
    badgeClass: 'badge-info',
    example: 'Serendipity: generate art of a robot fox painting a portal',
  },
  {
    domain: 'music',
    status: 'search prototype',
    badgeClass: 'badge-warning',
    example: 'Serendipity: play the rainy day coding playlist',
  },
  {
    domain: 'project',
    status: 'partly live',
    badgeClass: 'badge-info',
    example: 'Serendipity: draft a task for newsfeed to fix the feed sort',
  },
  {
    domain: 'control',
    status: 'live (local relay)',
    badgeClass: 'badge-success',
    example: 'Serendipity: turn butterflies on',
  },
] as const

const config: ProjectFrontConfig = {
  slug: 'alexa-integration',
  title: 'Voice Lab',
  channelKey: 'wonder',
  tabKey: 'voice-lab',
  icon: 'kind-icon:microphone',
  tagline: 'Kind Robots, out loud.',
  description:
    'The experimental voice frontier: an Alexa skill and a local relay that let Serendipity and friends listen and speak. This lab is where the wiring is documented and the relay status shows whether the voice bridge is awake.',
  launch: {
    label: 'Open Serendipity Voice view',
    href: '/serendipity-voice',
    icon: 'kind-icon:microphone',
  },
  sections: [
    {
      key: 'skill',
      title: 'The skill',
      body: 'An Alexa skill that hands your voice to the Kind Robots narrators and back.',
      icon: 'kind-icon:microphone',
    },
    {
      key: 'relay',
      title: 'The relay',
      body: 'A local relay bridges the skill to the app; its status tells you if voice is live.',
      icon: 'kind-icon:server',
    },
  ],
  deliverables: {
    done: [
      'Voice skill + local relay prototype',
      'Relay status readout',
      'Live adapters: chat, character, control (animations + theme)',
    ],
    next: [
      'Physical Echo dry-run + approval (t-010)',
      'Music + dream adapters to full',
    ],
  },
}
</script>
