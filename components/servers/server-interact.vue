<!-- /components/server/server-interact.vue -->
<template>
  <section class="flex w-full flex-col gap-4 rounded-2xl bg-base-200 p-4">
    <header
      class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md lg:flex-row lg:items-center lg:justify-between lg:text-left"
    >
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-primary md:text-3xl">
          Server Tools
        </h1>

        <p
          class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base lg:mx-0"
        >
          Inspect active art and text servers, ping them, and keep the engines
          honest.
        </p>
      </div>

      <div
        class="flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-end"
      >
        <details class="dropdown dropdown-end">
          <summary class="btn btn-primary rounded-xl">
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            Server
          </summary>

          <ul
            class="menu dropdown-content z-80 mt-2 w-72 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl"
          >
            <li>
              <button type="button" @click="startServerPreset('COMFY')">
                <Icon name="kind-icon:palette" class="h-4 w-4" />
                ComfyUI image server
              </button>
            </li>

            <li>
              <button type="button" @click="startServerPreset('A1111')">
                <Icon name="kind-icon:image" class="h-4 w-4" />
                A1111 image server
              </button>
            </li>

            <li>
              <button
                type="button"
                @click="startServerPreset('OPENAI_COMPATIBLE')"
              >
                <Icon name="kind-icon:chat" class="h-4 w-4" />
                OpenAI-compatible text server
              </button>
            </li>

            <li>
              <button type="button" @click="startServerPreset('TEXT')">
                <Icon name="kind-icon:bot" class="h-4 w-4" />
                Generic text server
              </button>
            </li>

            <li>
              <button type="button" @click="startServerPreset('OTHER')">
                <Icon name="kind-icon:server" class="h-4 w-4" />
                Blank custom server
              </button>
            </li>
          </ul>
        </details>

        <button
          class="btn btn-ghost rounded-xl"
          type="button"
          :disabled="serverStore.loading || serverStore.isInitializing"
          @click="loadServers(true)"
        >
          <span
            v-if="serverStore.loading || serverStore.isInitializing"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Load DB
        </button>
      </div>
    </header>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="mb-3 text-xl font-bold text-primary">Active Art Server</h2>

        <server-card
          v-if="serverStore.activeArtServer"
          :server="serverStore.activeArtServer"
          :selected="true"
          :show-actions="true"
          :allow-delete="false"
        />

        <server-gallery
          v-else
          mode="art"
          variant="dropdown"
          title="Art Server"
          subtitle="Choose an art server."
          :show-controls="false"
          :show-toolbar="true"
          :allow-delete="false"
          :allow-test="true"
        />
      </article>

      <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="mb-3 text-xl font-bold text-secondary">
          Active Text Server
        </h2>

        <server-card
          v-if="serverStore.activeTextServer"
          :server="serverStore.activeTextServer"
          :selected="true"
          :show-actions="true"
          :allow-delete="false"
        />

        <server-gallery
          v-else
          mode="text"
          variant="dropdown"
          title="Text Server"
          subtitle="Choose a text server."
          :show-controls="false"
          :show-toolbar="true"
          :allow-delete="false"
          :allow-test="true"
        />
      </article>
    </section>

    <section
      v-if="healthMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        healthOk
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-error/40 bg-error/10 text-error'
      "
    >
      {{ healthMessage }}
    </section>

    <section
      v-if="showServerForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <add-server @saved="handleServerSaved" @close="showServerForm = false" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { ServerType } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()

const showServerForm = ref(false)
const healthMessage = ref('')
const healthOk = ref(false)

async function loadServers(force = false) {
  await serverStore.initialize({
    force,
    fetchRemote: true,
  })
}

function startServerPreset(serverType: ServerType) {
  const isText = serverType === 'TEXT' || serverType === 'OPENAI_COMPATIBLE'
  const isComfy = serverType === 'COMFY'
  const isA1111 = serverType === 'A1111'
  const isArt = isComfy || isA1111 || serverType === 'ART'

  serverStore.startAddingServer({
    title: '',
    label: '',
    description: '',
    category: isText ? 'text' : isArt ? 'image' : 'custom',
    serverType,
    baseUrl: '',
    endpointPath: isText
      ? '/v1/chat/completions'
      : isComfy
        ? '/prompt'
        : isA1111
          ? '/sdapi/v1/txt2img'
          : '',
    healthPath: isText
      ? '/v1/models'
      : isComfy
        ? '/system_stats'
        : isA1111
          ? '/sdapi/v1/progress'
          : '',
    isActive: true,
    supportsChat: isText,
    supportsTxt2Img: isArt,
    supportsImg2Img: isArt,
    supportsComfyWorkflow: isComfy,
    supportsCheckpointOverride: isArt,
    supportsSampler: isArt,
    supportsNegativePrompt: isArt,
    supportsSeed: isArt,
    supportsSteps: isArt,
    lastStatus: 'UNKNOWN',
  })

  showServerForm.value = true
}


async function handleServerSaved() {
  showServerForm.value = false
  await serverStore.fetchAllServers(true)
}

onMounted(async () => {
  await loadServers(false)
})
</script>
