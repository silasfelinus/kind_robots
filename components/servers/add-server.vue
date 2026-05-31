<!-- /components/server/add-server.vue -->
<template>
  <form
    class="flex max-h-[min(760px,88vh)] flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    @submit.prevent="saveServer"
  >
    <header class="flex shrink-0 items-start justify-between gap-3 border-b border-base-300 bg-base-200 p-4">
      <div class="min-w-0">
        <h2 class="text-xl font-black text-primary">
          {{ form.id ? 'Edit Server' : 'Add Server' }}
        </h2>
        <p class="text-sm text-base-content/60">
          Servers are now simple access cards: type, URL, endpoint, health path, and auth.
        </p>
      </div>

      <button
        class="btn btn-sm btn-ghost rounded-xl"
        type="button"
        title="Close"
        @click="closeForm"
      >
        <Icon name="kind-icon:x" class="h-4 w-4" />
      </button>
    </header>

    <main class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
      <section class="grid gap-3 md:grid-cols-2">
        <label class="form-control">
          <span class="label-text font-bold">Title</span>
          <input
            v-model="form.title"
            class="input input-bordered rounded-xl"
            placeholder="Comfy"
            required
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Label</span>
          <input
            v-model="form.label"
            class="input input-bordered rounded-xl"
            placeholder="Friendly display label"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Server Type</span>
          <select
            v-model="form.serverType"
            class="select select-bordered rounded-xl"
            @change="applyServerTypeDefaults"
          >
            <option value="A1111">A1111</option>
            <option value="COMFY">COMFY</option>
            <option value="OPENAI">OPENAI</option>
            <option value="ANTHROPIC">ANTHROPIC</option>
            <option value="CUSTOM">CUSTOM</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Access Mode</span>
          <select v-model="form.accessMode" class="select select-bordered rounded-xl">
            <option value="BROWSER">BROWSER</option>
            <option value="BACKEND">BACKEND</option>
            <option value="TAILSCALE">TAILSCALE</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="LOCAL">LOCAL</option>
          </select>
        </label>

        <label class="form-control md:col-span-2">
          <span class="label-text font-bold">Base URL</span>
          <input
            v-model="form.baseUrl"
            class="input input-bordered rounded-xl"
            placeholder="https://ferngrotto.foxhound-chicken.ts.net"
            required
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Endpoint Path</span>
          <input
            v-model="form.endpointPath"
            class="input input-bordered rounded-xl"
            placeholder="/prompt"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Health Path</span>
          <input
            v-model="form.healthPath"
            class="input input-bordered rounded-xl"
            placeholder="/system_stats"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Category</span>
          <input
            v-model="form.category"
            class="input input-bordered rounded-xl"
            placeholder="personal"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Model</span>
          <input
            v-model="form.model"
            class="input input-bordered rounded-xl"
            placeholder="Optional model name"
          />
        </label>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <h3 class="mb-3 text-sm font-black uppercase tracking-wide text-base-content/60">
          Auth
        </h3>

        <div class="grid gap-3 md:grid-cols-2">
          <label class="form-control">
            <span class="label-text font-bold">Auth Type</span>
            <select v-model="form.authType" class="select select-bordered rounded-xl">
              <option value="NONE">NONE</option>
              <option value="BEARER">BEARER</option>
              <option value="HEADER">HEADER</option>
              <option value="QUERY">QUERY</option>
              <option value="API_KEY">API_KEY</option>
            </select>
          </label>

          <label class="form-control">
            <span class="label-text font-bold">API Key Header Name</span>
            <input
              v-model="form.apiKeyName"
              class="input input-bordered rounded-xl"
              placeholder="X-API-Key"
            />
          </label>

          <label class="form-control md:col-span-2">
            <span class="label-text font-bold">API Key</span>
            <input
              v-model="apiKey"
              :type="showApiKey ? 'text' : 'password'"
              class="input input-bordered rounded-xl"
              placeholder="Leave blank to keep existing key"
              autocomplete="off"
            />
          </label>

          <div class="flex flex-wrap gap-2 md:col-span-2">
            <button
              class="btn btn-sm rounded-xl"
              type="button"
              @click="showApiKey = !showApiKey"
            >
              <Icon :name="showApiKey ? 'kind-icon:eye-off' : 'kind-icon:eye'" class="h-4 w-4" />
              {{ showApiKey ? 'Hide key' : 'Show key' }}
            </button>

            <button
              v-if="form.id"
              class="btn btn-sm btn-warning rounded-xl"
              type="button"
              @click="clearApiKey"
            >
              Clear stored key
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <h3 class="mb-3 text-sm font-black uppercase tracking-wide text-base-content/60">
          Visibility
        </h3>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
            <input v-model="form.isActive" class="checkbox checkbox-primary" type="checkbox" />
            <span class="font-bold">Active</span>
          </label>

          <label class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
            <input v-model="form.isDefault" class="checkbox checkbox-primary" type="checkbox" />
            <span class="font-bold">Default</span>
          </label>

          <label class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
            <input v-model="form.isPublic" class="checkbox checkbox-primary" type="checkbox" />
            <span class="font-bold">Public</span>
          </label>

          <label class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
            <input v-model="form.isMature" class="checkbox checkbox-primary" type="checkbox" />
            <span class="font-bold">Mature</span>
          </label>
        </div>
      </section>

      <label class="form-control">
        <span class="label-text font-bold">Description</span>
        <textarea
          v-model="form.description"
          class="textarea textarea-bordered min-h-24 rounded-xl"
          placeholder="What this server is used for"
        />
      </label>

      <label class="form-control">
        <span class="label-text font-bold">Notes</span>
        <textarea
          v-model="form.notes"
          class="textarea textarea-bordered min-h-24 rounded-xl"
          placeholder="Private setup notes"
        />
      </label>

      <p v-if="message" class="rounded-xl border border-base-300 bg-base-200 p-3 text-sm">
        {{ message }}
      </p>
    </main>

    <footer class="flex shrink-0 flex-wrap justify-end gap-2 border-t border-base-300 bg-base-200 p-4">
      <button class="btn btn-ghost rounded-xl" type="button" @click="closeForm">
        Cancel
      </button>

      <button
        class="btn btn-primary rounded-xl"
        type="submit"
        :disabled="serverStore.isSaving || !form.title || !form.baseUrl"
      >
        <span v-if="serverStore.isSaving" class="loading loading-spinner loading-sm" />
        Save Server
      </button>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { ServerType } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()
const apiKey = ref('')
const showApiKey = ref(false)
const message = ref('')

const form = computed(() => serverStore.serverForm)

function applyServerTypeDefaults() {
  const serverType = form.value.serverType as ServerType

  if (serverType === 'COMFY') {
    form.value.endpointPath ||= '/prompt'
    form.value.healthPath ||= '/system_stats'
    form.value.accessMode ||= 'TAILSCALE'
    form.value.authType ||= 'NONE'
    form.value.category ||= 'image'
    return
  }

  if (serverType === 'A1111') {
    form.value.endpointPath ||= '/sdapi/v1/txt2img'
    form.value.healthPath ||= '/sdapi/v1/progress'
    form.value.accessMode ||= 'TAILSCALE'
    form.value.authType ||= 'NONE'
    form.value.category ||= 'image'
    return
  }

  if (serverType === 'OPENAI') {
    form.value.baseUrl ||= 'https://api.openai.com'
    form.value.endpointPath ||= '/v1/chat/completions'
    form.value.healthPath ||= '/v1/models'
    form.value.accessMode ||= 'BACKEND'
    form.value.authType ||= 'BEARER'
    form.value.category ||= 'text'
    return
  }

  if (serverType === 'ANTHROPIC') {
    form.value.baseUrl ||= 'https://api.anthropic.com'
    form.value.endpointPath ||= '/v1/messages'
    form.value.healthPath ||= '/v1/models'
    form.value.accessMode ||= 'BACKEND'
    form.value.authType ||= 'API_KEY'
    form.value.apiKeyName ||= 'x-api-key'
    form.value.category ||= 'text'
    return
  }

  form.value.category ||= 'custom'
}

async function saveServer() {
  message.value = ''

  const result = await serverStore.saveServer()

  if (!result.success) {
    message.value = result.message || 'Server save failed.'
    return
  }

  if (form.value.id && apiKey.value.trim()) {
    const keyResult = await serverStore.updateServerApiKey(form.value.id, {
      apiKey: apiKey.value.trim(),
      apiKeyName: form.value.apiKeyName || null,
      authType: form.value.authType || 'API_KEY',
    })

    if (!keyResult.success) {
      message.value = keyResult.message || 'Server saved, but API key update failed.'
      return
    }
  }

  apiKey.value = ''
  message.value = result.message || 'Server saved.'
}

async function clearApiKey() {
  if (!form.value.id) return

  const result = await serverStore.updateServerApiKey(form.value.id, {
    clearKey: true,
    authType: 'NONE',
  })

  message.value = result.message || (result.success ? 'API key cleared.' : 'Could not clear API key.')
}

function closeForm() {
  serverStore.closeServerForm?.()
}
</script>
