<!-- /components/server/add-server.vue -->
<template>
  <div
    class="flex max-h-[min(760px,88vh)] flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
  >
    <div
      v-if="isCloning"
      class="flex shrink-0 items-start gap-3 border-b border-warning/30 bg-warning/10 px-4 py-3"
    >
      <Icon
        name="kind-icon:copy"
        class="mt-0.5 h-4 w-4 shrink-0 text-warning"
      />

      <div>
        <p class="text-xs font-black">Creating your private copy</p>

        <p class="mt-0.5 text-[11px] opacity-70">
          The original stays unchanged. This version belongs to you.
        </p>
      </div>
    </div>

    <div
      class="flex shrink-0 items-start justify-between gap-4 border-b border-base-300 px-4 py-3"
    >
      <div>
        <h2 class="text-base font-black">
          {{ heading }}
        </h2>

        <p class="mt-0.5 text-xs opacity-60">
          {{ subtitle }}
        </p>
      </div>

      <button
        type="button"
        class="btn btn-ghost btn-sm btn-circle shrink-0"
        @click="serverStore.closeServerForm()"
      >
        <Icon name="kind-icon:x" class="h-4 w-4" />
      </button>
    </div>

    <form
      class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-300"
      @submit.prevent="handleSave"
    >
      <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="preset in friendlyPresets"
          :key="preset.key"
          type="button"
          class="group flex min-h-32 flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
          :class="
            selectedFriendlyPreset === preset.key
              ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
              : 'border-base-300 bg-base-200 hover:border-primary/40'
          "
          @click="applyFriendlyPreset(preset.key)"
        >
          <div class="flex w-full items-start justify-between gap-3">
            <div
              class="flex h-11 w-11 items-center justify-center rounded-2xl border border-base-300 bg-base-100"
            >
              <Icon :name="preset.icon" class="h-6 w-6 text-primary" />
            </div>

            <span
              v-if="selectedFriendlyPreset === preset.key"
              class="badge badge-primary badge-sm rounded-2xl"
            >
              Selected
            </span>
          </div>

          <div>
            <p class="font-black text-base-content">
              {{ preset.title }}
            </p>

            <p class="mt-1 text-xs leading-relaxed text-base-content/65">
              {{ preset.description }}
            </p>
          </div>
        </button>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <div class="mb-3 flex items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Icon
              :name="activeFriendlyPreset.icon"
              class="h-5 w-5 text-primary"
            />
          </div>

          <div>
            <h3 class="text-sm font-black">
              {{ activeFriendlyPreset.title }}
            </h3>

            <p class="mt-0.5 text-xs text-base-content/60">
              {{ activeFriendlyPreset.helpText }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <label class="form-control">
            <div class="label py-1">
              <span class="label-text text-xs font-black"> Friendly Name </span>
            </div>

            <input
              v-model="serverStore.serverForm.label"
              class="input input-bordered rounded-2xl bg-base-100"
              :placeholder="activeFriendlyPreset.namePlaceholder"
            />
          </label>

          <label v-if="activeFriendlyPreset.needsBaseUrl" class="form-control">
            <div class="label py-1">
              <span class="label-text text-xs font-black"> Server URL </span>
            </div>

            <div class="flex gap-2">
              <input
                v-model="serverStore.serverForm.baseUrl"
                class="input input-bordered flex-1 rounded-2xl bg-base-100 font-mono text-sm"
                :placeholder="activeFriendlyPreset.urlPlaceholder"
              />

              <button
                v-if="serverStore.serverForm.baseUrl"
                type="button"
                class="btn btn-ghost btn-square rounded-2xl"
                title="Copy URL"
                @click="copyUrl(serverStore.serverForm.baseUrl)"
              >
                <Icon
                  :name="copiedUrl ? 'kind-icon:check' : 'kind-icon:copy'"
                  :class="['h-4 w-4', copiedUrl && 'text-success']"
                />
              </button>
            </div>

            <div class="label py-1">
              <span class="label-text-alt text-xs opacity-60">
                {{ activeFriendlyPreset.urlHint }}
              </span>
            </div>
          </label>

          <div
            v-if="activeFriendlyPreset.needsApiKey"
            class="flex flex-col gap-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black">API Key</span>

              <span
                :class="[
                  'badge badge-sm rounded-2xl',
                  serverHasStoredKey ? 'badge-success' : 'badge-neutral',
                ]"
              >
                {{ serverHasStoredKey ? 'Stored' : 'Not set' }}
              </span>
            </div>

            <div class="flex gap-2">
              <input
                v-model="apiKey"
                :type="showApiKey ? 'text' : 'password'"
                autocomplete="off"
                class="input input-bordered flex-1 rounded-2xl bg-base-100 font-mono text-sm"
                :placeholder="activeFriendlyPreset.apiKeyPlaceholder"
              />

              <button
                type="button"
                class="btn btn-ghost btn-square rounded-2xl"
                :title="showApiKey ? 'Hide' : 'Show'"
                @click="showApiKey = !showApiKey"
              >
                <Icon
                  :name="showApiKey ? 'kind-icon:eye-off' : 'kind-icon:eye'"
                  class="h-4 w-4"
                />
              </button>
            </div>

            <input
              v-model="apiKeyName"
              class="input input-bordered rounded-2xl bg-base-100 text-sm"
              :placeholder="activeFriendlyPreset.apiKeyNamePlaceholder"
            />

            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-outline btn-sm rounded-2xl"
                :disabled="!apiKey.trim() || serverStore.isSaving"
                @click="saveKeyOnly"
              >
                <Icon name="kind-icon:key" class="h-4 w-4" />
                Save Key Only
              </button>

              <button
                type="button"
                class="btn btn-ghost btn-sm rounded-2xl opacity-70"
                :disabled="
                  !serverStore.serverForm.id ||
                  isCloning ||
                  serverStore.isSaving
                "
                @click="clearKey"
              >
                Clear Key
              </button>
            </div>
          </div>

          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-3 text-xs text-base-content/70"
          >
            <div class="flex items-start gap-2">
              <Icon
                :name="selectedAccessModeInfo.icon"
                class="mt-0.5 h-4 w-4 shrink-0 text-primary"
              />

              <div>
                <p class="font-black text-base-content">
                  {{ selectedAccessModeInfo.title }}
                </p>

                <p class="mt-0.5">
                  {{ selectedAccessModeInfo.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <details class="group overflow-hidden rounded-2xl border border-base-300">
        <summary
          class="flex cursor-pointer select-none list-none items-center gap-2 bg-base-200 px-4 py-3 text-xs font-black uppercase tracking-wider text-base-content/60 hover:text-base-content"
        >
          <Icon name="kind-icon:settings" class="h-4 w-4" />
          Advanced Settings

          <span
            class="ml-1 rounded-2xl bg-base-300 px-2 py-0.5 text-[10px] normal-case tracking-normal opacity-70"
          >
            URLs, workflow, transport, flags
          </span>

          <Icon
            name="kind-icon:chevron-down"
            class="ml-auto h-4 w-4 transition-transform group-open:rotate-180"
          />
        </summary>

        <div class="flex flex-col gap-4 p-4">
          <fieldset
            class="grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Title</span>
              </span>

              <input
                v-model="serverStore.serverForm.title"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="Lola Stable Diffusion"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Server Type</span>
              </span>

              <select
                v-model="serverStore.serverForm.serverType"
                class="select select-bordered select-sm rounded-2xl bg-base-100"
                @change="applyServerTypePreset"
              >
                <option value="TEXT">TEXT</option>
                <option value="OPENAI_COMPATIBLE">OPENAI_COMPATIBLE</option>
                <option value="ART">ART</option>
                <option value="COMFY">COMFY</option>
                <option value="A1111">A1111</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold"
                  >Generation Engine</span
                >
              </span>

              <select
                v-model="serverStore.serverForm.generationEngine"
                class="select select-bordered select-sm rounded-2xl bg-base-100"
                @change="applyGenerationEnginePreset"
              >
                <option
                  v-for="engine in generationEngineOptions"
                  :key="engine.value"
                  :value="engine.value"
                >
                  {{ engine.label }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold"
                  >Connection Mode</span
                >
              </span>

              <select
                v-model="serverStore.serverForm.accessMode"
                class="select select-bordered select-sm rounded-2xl bg-base-100"
                @change="applyAccessModePreset"
              >
                <option
                  v-for="mode in accessModeOptions"
                  :key="mode.value"
                  :value="mode.value"
                >
                  {{ mode.label }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold"
                  >Default Transport</span
                >
              </span>

              <select
                v-model="serverStore.serverForm.defaultTransport"
                class="select select-bordered select-sm rounded-2xl bg-base-100"
                @change="applyTransportPreset"
              >
                <option
                  v-for="transport in transportOptions"
                  :key="transport.value"
                  :value="transport.value"
                >
                  {{ transport.label }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Endpoint Path</span>
              </span>

              <input
                v-model="serverStore.serverForm.endpointPath"
                class="input input-bordered input-sm rounded-2xl bg-base-100 font-mono"
                :placeholder="endpointPathPlaceholder"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Health Path</span>
              </span>

              <input
                v-model="serverStore.serverForm.healthPath"
                class="input input-bordered input-sm rounded-2xl bg-base-100 font-mono"
                :placeholder="healthPathPlaceholder"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold"
                  >Browser Base URL</span
                >
              </span>

              <input
                v-model="serverStore.serverForm.browserBaseUrl"
                class="input input-bordered input-sm rounded-2xl bg-base-100 font-mono"
                :placeholder="browserBaseUrlPlaceholder"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold"
                  >Backend Base URL</span
                >
              </span>

              <input
                v-model="serverStore.serverForm.backendBaseUrl"
                class="input input-bordered input-sm rounded-2xl bg-base-100 font-mono"
                :placeholder="backendBaseUrlPlaceholder"
              />
            </label>
          </fieldset>

          <fieldset
            class="grid grid-cols-2 gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 lg:grid-cols-4"
          >
            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Width</span>
              </span>

              <input
                v-model.number="serverStore.serverForm.defaultWidth"
                type="number"
                min="64"
                step="8"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Height</span>
              </span>

              <input
                v-model.number="serverStore.serverForm.defaultHeight"
                type="number"
                min="64"
                step="8"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Steps</span>
              </span>

              <input
                v-model.number="serverStore.serverForm.defaultSteps"
                type="number"
                min="1"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="25"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">CFG / Guidance</span>
              </span>

              <input
                v-model.number="serverStore.serverForm.defaultCfg"
                type="number"
                step="0.5"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="3.5"
              />
            </label>
          </fieldset>

          <fieldset
            class="grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 md:grid-cols-3"
          >
            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold"
                  >Default Sampler</span
                >
              </span>

              <input
                v-model="serverStore.serverForm.defaultSampler"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="Euler a, euler, dpmpp_2m..."
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold"
                  >Default Scheduler</span
                >
              </span>

              <input
                v-model="serverStore.serverForm.defaultScheduler"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="normal, simple, beta..."
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Model Name</span>
              </span>

              <input
                v-model="serverStore.serverForm.model"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="flux-dev, dreamshaper, gpt-image-2..."
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Provider</span>
              </span>

              <input
                v-model="serverStore.serverForm.designer"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="OpenAI, Local Lola, Comfy..."
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Version</span>
              </span>

              <input
                v-model="serverStore.serverForm.version"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="SDXL, Forge, Flux Dev..."
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">API Docs Link</span>
              </span>

              <input
                v-model="serverStore.serverForm.apiLink"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
                placeholder="https://docs.example.com"
              />
            </label>
          </fieldset>

          <details
            class="group overflow-hidden rounded-2xl border border-base-300"
          >
            <summary
              class="flex cursor-pointer select-none list-none items-center gap-2 bg-base-100 px-4 py-3 text-xs font-black uppercase tracking-wider text-base-content/60 hover:text-base-content"
            >
              <Icon name="kind-icon:workflow" class="h-4 w-4" />
              Workflow JSON

              <Icon
                name="kind-icon:chevron-down"
                class="ml-auto h-4 w-4 transition-transform group-open:rotate-180"
              />
            </summary>

            <div class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <label class="form-control">
                <span class="label">
                  <span class="label-text text-xs font-bold"
                    >Workflow Path</span
                  >
                </span>

                <input
                  v-model="serverStore.serverForm.workflowPath"
                  class="input input-bordered input-sm rounded-2xl bg-base-100 font-mono"
                  placeholder="/workflows/flux-dev.json"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text text-xs font-bold"
                    >Workflow Version</span
                  >
                </span>

                <input
                  v-model="serverStore.serverForm.workflowVersion"
                  class="input input-bordered input-sm rounded-2xl bg-base-100"
                  placeholder="flux-dev-v1"
                />
              </label>

              <label class="form-control md:col-span-2">
                <span class="label">
                  <span class="label-text text-xs font-bold"
                    >Workflow JSON</span
                  >
                </span>

                <textarea
                  :value="workflowJsonText"
                  class="textarea textarea-bordered min-h-40 rounded-2xl bg-base-100 font-mono text-xs"
                  placeholder="{ ... Comfy workflow JSON ... }"
                  @input="updateWorkflowJson"
                />
              </label>

              <div
                v-if="workflowJsonError"
                class="rounded-2xl border border-error/30 bg-error/10 px-3 py-2 text-xs text-error md:col-span-2"
              >
                {{ workflowJsonError }}
              </div>
            </div>
          </details>

          <fieldset
            class="grid grid-cols-1 gap-2 rounded-2xl border border-base-300 bg-base-200 p-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label
              v-for="toggle in capabilityToggles"
              :key="toggle.key"
              class="flex cursor-pointer items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-bold hover:border-primary/40"
            >
              <input
                v-model="(serverStore.serverForm as any)[toggle.key]"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
              />
              {{ toggle.label }}
            </label>
          </fieldset>

          <label class="form-control">
            <span class="label">
              <span class="label-text text-xs font-bold">Notes</span>
            </span>

            <textarea
              v-model="serverStore.serverForm.notes"
              class="textarea textarea-bordered rounded-2xl bg-base-100 text-sm"
              rows="2"
              placeholder="Private setup notes, auth quirks, launch flags, cursed YAML sightings..."
            />
          </label>
        </div>
      </details>

      <div class="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          class="btn btn-ghost flex-1 rounded-2xl"
          @click="serverStore.closeServerForm()"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="btn btn-primary flex-1 gap-2 rounded-2xl"
          :disabled="serverStore.isSaving || Boolean(workflowJsonError)"
        >
          <span
            v-if="serverStore.isSaving"
            class="loading loading-spinner loading-xs"
          />

          <Icon v-else name="kind-icon:save" class="h-4 w-4" />

          {{ saveButtonLabel }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import type {
  ServerAccessMode,
  ServerGenerationEngine,
  ServerTransport,
  ServerType,
} from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()
const userStore = useUserStore()
const myUserId = computed(() => userStore.user?.id)

const apiKey = ref('')
const apiKeyName = ref('')
const showApiKey = ref(false)
const copiedUrl = ref(false)
const workflowJsonError = ref('')

type FriendlyServerPresetKey =
  | 'openai-images'
  | 'stable-diffusion'
  | 'comfy-sdxl'
  | 'comfy-flux'
  | 'openai-compatible'

type FriendlyServerPreset = {
  key: FriendlyServerPresetKey
  title: string
  description: string
  helpText: string
  icon: string
  namePlaceholder: string
  needsBaseUrl: boolean
  needsApiKey: boolean
  urlPlaceholder: string
  urlHint: string
  apiKeyPlaceholder: string
  apiKeyNamePlaceholder: string
}

const selectedFriendlyPreset = ref<FriendlyServerPresetKey>('stable-diffusion')

const defaultFriendlyPreset: FriendlyServerPreset = {
  key: 'stable-diffusion',
  title: 'Stable Diffusion / Forge',
  description: 'Best for A1111, Forge, and classic local SD servers.',
  helpText: 'Paste the URL for your local, LAN, or Tailscale image server.',
  icon: 'kind-icon:palette',
  namePlaceholder: 'My Stable Diffusion server',
  needsBaseUrl: true,
  needsApiKey: false,
  urlPlaceholder: 'http://127.0.0.1:7860',
  urlHint: 'Usually http://127.0.0.1:7860, a LAN address, or a Tailscale URL.',
  apiKeyPlaceholder: '',
  apiKeyNamePlaceholder: '',
}

const friendlyPresets = [
  defaultFriendlyPreset,
  {
    key: 'comfy-sdxl',
    title: 'ComfyUI SDXL',
    description:
      'Best for Comfy workflows using SDXL or checkpoint-based generation.',
    helpText:
      'Paste the ComfyUI URL. Kind Robots will use the SDXL workflow route.',
    icon: 'kind-icon:workflow',
    namePlaceholder: 'My Comfy SDXL server',
    needsBaseUrl: true,
    needsApiKey: false,
    urlPlaceholder: 'http://127.0.0.1:8188',
    urlHint:
      'Usually http://127.0.0.1:8188, a LAN address, or a Tailscale URL.',
    apiKeyPlaceholder: '',
    apiKeyNamePlaceholder: '',
  },
] satisfies [FriendlyServerPreset, ...FriendlyServerPreset[]]

function applyFriendlyPreset(key: FriendlyServerPresetKey) {
  selectedFriendlyPreset.value = key

  if (key === 'stable-diffusion') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      title: serverStore.serverForm.title || 'Stable Diffusion Server',
      label: serverStore.serverForm.label || 'Stable Diffusion',
      category: 'image',
      serverType: 'A1111',
      generationEngine: 'A1111',
      defaultTransport: 'BROWSER',
      accessMode: 'LOCAL',
      baseUrl: serverStore.serverForm.baseUrl || '',
      endpointPath: '/sdapi/v1/txt2img',
      healthPath: '/sdapi/v1/progress',
      requiresClientSideCheck: true,
      isPrivateNetwork: true,
      allowBrowserRequests: true,
      requiresApiKey: false,
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsImageEdit: false,
      supportsComfyWorkflow: false,
      supportsWorkflowUpload: false,
      supportsFlux: false,
      supportsKontext: false,
      supportsCheckpointOverride: true,
      supportsSampler: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      defaultWidth: serverStore.serverForm.defaultWidth || 512,
      defaultHeight: serverStore.serverForm.defaultHeight || 512,
      defaultSteps: serverStore.serverForm.defaultSteps || 25,
      defaultCfg: serverStore.serverForm.defaultCfg || 7,
      defaultSampler: serverStore.serverForm.defaultSampler || 'Euler a',
    }

    apiKeyName.value = ''
    return
  }

  if (key === 'comfy-sdxl') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      title: serverStore.serverForm.title || 'ComfyUI SDXL Server',
      label: serverStore.serverForm.label || 'Comfy SDXL',
      category: 'image',
      serverType: 'COMFY',
      generationEngine: 'COMFY',
      defaultTransport: 'BROWSER',
      accessMode: 'LOCAL',
      baseUrl: serverStore.serverForm.baseUrl || '',
      endpointPath: '/prompt',
      healthPath: '/system_stats',
      requiresClientSideCheck: true,
      isPrivateNetwork: true,
      allowBrowserRequests: true,
      requiresApiKey: false,
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsImageEdit: false,
      supportsComfyWorkflow: true,
      supportsWorkflowUpload: true,
      supportsFlux: false,
      supportsKontext: false,
      supportsCheckpointOverride: true,
      supportsSampler: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      defaultWidth: serverStore.serverForm.defaultWidth || 1024,
      defaultHeight: serverStore.serverForm.defaultHeight || 1024,
      defaultSteps: serverStore.serverForm.defaultSteps || 25,
      defaultCfg: serverStore.serverForm.defaultCfg || 7,
      defaultSampler: serverStore.serverForm.defaultSampler || 'euler',
      defaultScheduler: serverStore.serverForm.defaultScheduler || 'normal',
    }

    apiKeyName.value = ''
    return
  }

  if (key === 'comfy-flux') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      title: serverStore.serverForm.title || 'ComfyUI Flux Server',
      label: serverStore.serverForm.label || 'Comfy Flux',
      category: 'image',
      serverType: 'COMFY',
      generationEngine: 'FLUX',
      defaultTransport: 'BROWSER',
      accessMode: 'LOCAL',
      baseUrl: serverStore.serverForm.baseUrl || '',
      endpointPath: '/prompt',
      healthPath: '/system_stats',
      requiresClientSideCheck: true,
      isPrivateNetwork: true,
      allowBrowserRequests: true,
      requiresApiKey: false,
      supportsTxt2Img: true,
      supportsImg2Img: false,
      supportsImageEdit: false,
      supportsComfyWorkflow: true,
      supportsWorkflowUpload: true,
      supportsFlux: true,
      supportsKontext: false,
      supportsCheckpointOverride: false,
      supportsSampler: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      defaultWidth: serverStore.serverForm.defaultWidth || 1024,
      defaultHeight: serverStore.serverForm.defaultHeight || 1024,
      defaultSteps: serverStore.serverForm.defaultSteps || 30,
      defaultCfg: serverStore.serverForm.defaultCfg || 1,
      defaultSampler: serverStore.serverForm.defaultSampler || 'euler',
      defaultScheduler: serverStore.serverForm.defaultScheduler || 'normal',
      model: serverStore.serverForm.model || 'flux1-dev-Q8_0.gguf',
    }

    apiKeyName.value = ''
    return
  }

  if (key === 'openai-images') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      title: serverStore.serverForm.title || 'OpenAI Images',
      label: serverStore.serverForm.label || 'OpenAI Images',
      category: 'image',
      serverType: 'ART',
      generationEngine: 'OPENAI_IMAGE',
      defaultTransport: 'BACKEND',
      accessMode: 'PUBLIC_API_KEY',
      baseUrl: 'https://api.openai.com',
      backendBaseUrl: 'https://api.openai.com',
      browserBaseUrl: null,
      endpointPath: '/v1/images/generations',
      healthPath: '/v1/models',
      requiresClientSideCheck: false,
      isPrivateNetwork: false,
      allowBrowserRequests: false,
      requiresApiKey: true,
      supportsTxt2Img: true,
      supportsImg2Img: false,
      supportsImageEdit: true,
      supportsComfyWorkflow: false,
      supportsWorkflowUpload: false,
      supportsFlux: false,
      supportsKontext: false,
      supportsCheckpointOverride: false,
      supportsSampler: false,
      supportsNegativePrompt: false,
      supportsSeed: false,
      supportsSteps: false,
      defaultWidth: serverStore.serverForm.defaultWidth || 1024,
      defaultHeight: serverStore.serverForm.defaultHeight || 1024,
      model: serverStore.serverForm.model || 'gpt-image-2',
      designer: serverStore.serverForm.designer || 'OpenAI',
    }

    apiKeyName.value = serverStore.serverForm.apiKeyName || 'Authorization'
    return
  }

  serverStore.serverForm = {
    ...serverStore.serverForm,
    title: serverStore.serverForm.title || 'OpenAI-Compatible Server',
    label: serverStore.serverForm.label || 'OpenAI Compatible',
    category: 'text',
    serverType: 'OPENAI_COMPATIBLE',
    generationEngine: 'OTHER',
    defaultTransport: 'BACKEND',
    accessMode: 'PUBLIC_API_KEY',
    baseUrl: serverStore.serverForm.baseUrl || '',
    endpointPath: '/v1/chat/completions',
    healthPath: '/v1/models',
    requiresClientSideCheck: false,
    isPrivateNetwork: false,
    allowBrowserRequests: false,
    requiresApiKey: true,
    supportsChat: true,
    supportsTxt2Img: false,
    supportsImg2Img: false,
    supportsImageEdit: false,
    supportsComfyWorkflow: false,
    supportsWorkflowUpload: false,
    supportsFlux: false,
    supportsKontext: false,
  }

  apiKeyName.value = serverStore.serverForm.apiKeyName || 'Authorization'
}

const activeFriendlyPreset = computed<FriendlyServerPreset>(() => {
  return (
    friendlyPresets.find(
      (preset) => preset.key === selectedFriendlyPreset.value,
    ) ?? defaultFriendlyPreset
  )
})

const heading = computed(() => {
  if (isCloning.value) return 'Make this server yours'
  if (serverStore.serverForm.id) return 'Edit connection'
  return 'Connect an AI server'
})

const saveButtonLabel = computed(() => {
  if (isCloning.value) return 'Save My Copy'
  if (serverStore.serverForm.id) return 'Save Changes'
  return 'Create Server'
})

type AccessModeOption = {
  value: ServerAccessMode
  label: string
  icon: string
  title: string
  description: string
  tone: string
}

type GenerationEngineOption = {
  value: ServerGenerationEngine
  label: string
  description: string
}

type TransportOption = {
  value: ServerTransport
  label: string
  description: string
}

const generationEngineOptions: GenerationEngineOption[] = [
  {
    value: 'A1111',
    label: 'A1111 / Forge',
    description:
      'Classic Stable Diffusion txt2img/img2img through A1111 or Forge.',
  },
  {
    value: 'COMFY',
    label: 'Comfy Workflow',
    description:
      'Generic ComfyUI workflow JSON using /prompt, /history, and /view.',
  },
  {
    value: 'FLUX',
    label: 'Flux',
    description: 'Flux text-to-image workflow through ComfyUI.',
  },
  {
    value: 'KONTEXT',
    label: 'Flux Kontext',
    description: 'Image editing workflow through ComfyUI with a source image.',
  },
  {
    value: 'OPENAI_IMAGE',
    label: 'OpenAI Image',
    description: 'Hosted image generation endpoint.',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Custom or experimental generation service.',
  },
]

const transportOptions: TransportOption[] = [
  {
    value: 'BROWSER',
    label: 'Browser direct',
    description:
      'The user browser calls the server directly. Best for Tailscale/local.',
  },
  {
    value: 'BACKEND',
    label: 'Backend proxy',
    description:
      'The Nuxt/Vercel backend calls the server. Best for public APIs and secrets.',
  },
]

const defaultAccessModeOption: AccessModeOption = {
  value: 'LOCAL',
  label: 'Local / LAN',
  icon: 'kind-icon:home',
  title: 'Local or LAN server',
  description: 'Best for localhost, 192.168.x.x, or same-network testing.',
  tone: 'border-info/30 bg-info/10 text-info-content',
}

const accessModeOptions: AccessModeOption[] = [
  defaultAccessModeOption,
  {
    value: 'TAILSCALE',
    label: 'Tailscale, recommended',
    icon: 'kind-icon:shield',
    title: 'Private Tailscale server',
    description:
      'Best default for home AI servers. Test from the browser because your device is inside the tailnet.',
    tone: 'border-success/30 bg-success/10 text-success-content',
  },
  {
    value: 'PUBLIC_PROTECTED',
    label: 'Public protected URL',
    icon: 'kind-icon:lock',
    title: 'Public URL with protection',
    description:
      'For Traefik, Authelia, Authentik, Cloudflare Access, Pomerium, or similar gateways.',
    tone: 'border-warning/30 bg-warning/10 text-warning-content',
  },
  {
    value: 'PUBLIC_API_KEY',
    label: 'Public API key',
    icon: 'kind-icon:key',
    title: 'Public API with key',
    description:
      'For services that accept a key or bearer token. Keep browser calls off when the key must stay private.',
    tone: 'border-warning/30 bg-warning/10 text-warning-content',
  },
  {
    value: 'PUBLIC_OIDC',
    label: 'Public OIDC',
    icon: 'kind-icon:user-check',
    title: 'Public OIDC auth',
    description:
      'Advanced mode for auth providers such as Authelia. Powerful, but YAML gremlins may apply.',
    tone: 'border-secondary/30 bg-secondary/10 text-secondary-content',
  },
  {
    value: 'PUBLIC_UNPROTECTED',
    label: 'Public unprotected',
    icon: 'kind-icon:alert-triangle',
    title: 'Public and unprotected',
    description:
      'Not recommended for ComfyUI, A1111, or anything spicy. Use only for harmless endpoints.',
    tone: 'border-error/30 bg-error/10 text-error-content',
  },
]

const selectedBlueprint = computed(() => {
  const id = serverStore.selectedBlueprintServerId

  if (!id) return null

  return serverStore.getServerById(id)
})

const selectedAccessModeInfo = computed<AccessModeOption>(() => {
  return (
    accessModeOptions.find(
      (mode) => mode.value === serverStore.serverForm.accessMode,
    ) ?? defaultAccessModeOption
  )
})

const selectedGenerationEngine = computed(() => {
  return generationEngineOptions.find(
    (engine) => engine.value === serverStore.serverForm.generationEngine,
  )
})

const selectedTransport = computed(() => {
  return transportOptions.find(
    (transport) => transport.value === serverStore.serverForm.defaultTransport,
  )
})

const serverHasStoredKey = computed(() => {
  return Boolean(serverStore.serverForm.apiKey)
})

const isCloning = computed(() => {
  return Boolean(
    !serverStore.serverForm.id && serverStore.selectedBlueprintServerId,
  )
})

const subtitle = computed(() => {
  if (isCloning.value) {
    return 'Your edits create a private copy. The blueprint stays unchanged.'
  }

  if (serverStore.serverForm.id) {
    return 'Adjust this private server configuration.'
  }

  return `New ${serverStore.serverForm.generationEngine ?? serverStore.serverForm.serverType ?? 'TEXT'} server.`
})

const baseUrlPlaceholder = computed(() => {
  if (serverStore.serverForm.accessMode === 'TAILSCALE') {
    return 'https://ferngrotto.foxhound-chicken.ts.net:8443'
  }

  if (serverStore.serverForm.serverType === 'COMFY') {
    return 'http://127.0.0.1:8188'
  }

  if (serverStore.serverForm.serverType === 'A1111') {
    return 'http://127.0.0.1:7860'
  }

  return 'http://localhost:7860'
})

const browserBaseUrlPlaceholder = computed(() => {
  if (serverStore.serverForm.accessMode === 'TAILSCALE') {
    return 'https://ferngrotto.foxhound-chicken.ts.net:8443'
  }

  return serverStore.serverForm.baseUrl || 'http://127.0.0.1:8188'
})

const backendBaseUrlPlaceholder = computed(() => {
  if (serverStore.serverForm.accessMode === 'PUBLIC_API_KEY') {
    return 'https://api.example.com'
  }

  return serverStore.serverForm.baseUrl || 'https://lola-api.acrocatranch.com'
})

const endpointPathPlaceholder = computed(() => {
  if (serverStore.serverForm.generationEngine === 'A1111') {
    return '/sdapi/v1/txt2img'
  }

  if (
    serverStore.serverForm.generationEngine === 'COMFY' ||
    serverStore.serverForm.generationEngine === 'FLUX' ||
    serverStore.serverForm.generationEngine === 'KONTEXT'
  ) {
    return '/prompt'
  }

  if (serverStore.serverForm.serverType === 'OPENAI_COMPATIBLE') {
    return '/v1/chat/completions'
  }

  return '/generate'
})

const healthPathPlaceholder = computed(() => {
  if (
    serverStore.serverForm.serverType === 'COMFY' ||
    serverStore.serverForm.generationEngine === 'COMFY' ||
    serverStore.serverForm.generationEngine === 'FLUX' ||
    serverStore.serverForm.generationEngine === 'KONTEXT'
  ) {
    return '/system_stats'
  }

  if (
    serverStore.serverForm.serverType === 'A1111' ||
    serverStore.serverForm.generationEngine === 'A1111'
  ) {
    return '/sdapi/v1/progress'
  }

  if (serverStore.serverForm.serverType === 'OPENAI_COMPATIBLE') {
    return '/v1/models'
  }

  return '/health'
})

const workflowJsonText = computed(() => {
  const workflowJson = serverStore.serverForm.workflowJson

  if (!workflowJson) return ''

  try {
    return JSON.stringify(workflowJson, null, 2)
  } catch {
    return ''
  }
})

const capabilityToggles = [
  { key: 'supportsChat', label: 'Chat' },
  { key: 'supportsTxt2Img', label: 'Txt to Img' },
  { key: 'supportsImg2Img', label: 'Img to Img' },
  { key: 'supportsImageEdit', label: 'Image Edit' },
  { key: 'supportsInpaint', label: 'Inpaint' },
  { key: 'supportsOutpaint', label: 'Outpaint' },
  { key: 'supportsComfyWorkflow', label: 'Comfy Workflow' },
  { key: 'supportsWorkflowUpload', label: 'Workflow Upload' },
  { key: 'supportsFlux', label: 'Flux' },
  { key: 'supportsKontext', label: 'Kontext' },
  { key: 'supportsCheckpointOverride', label: 'Checkpoint Override' },
  { key: 'supportsSampler', label: 'Sampler' },
  { key: 'supportsNegativePrompt', label: 'Negative Prompt' },
  { key: 'supportsSeed', label: 'Seed' },
  { key: 'supportsSteps', label: 'Steps' },
  { key: 'supportsBatch', label: 'Batch' },
  { key: 'supportsVideo', label: 'Video' },
  { key: 'requiresApiKey', label: 'Requires API Key' },
  { key: 'isActive', label: 'Active' },
] as const

function applyAccessModePreset() {
  const accessMode = serverStore.serverForm.accessMode

  if (accessMode === 'TAILSCALE' || accessMode === 'LOCAL') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      defaultTransport: 'BROWSER',
      isPrivateNetwork: true,
      requiresClientSideCheck: true,
      allowBrowserRequests: true,
      isPublic: false,
      useOidc: false,
      oidcProvider: null,
      requiresApiKey: false,
    }
    return
  }

  if (accessMode === 'PUBLIC_API_KEY') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      defaultTransport: 'BACKEND',
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: false,
      requiresApiKey: true,
      isPublic: false,
      useOidc: false,
      oidcProvider: null,
    }
    return
  }

  if (accessMode === 'PUBLIC_OIDC') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      defaultTransport: 'BACKEND',
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: false,
      isPublic: false,
      useOidc: true,
      requiresApiKey: false,
      oidcProvider: serverStore.serverForm.oidcProvider || 'authelia',
    }
    return
  }

  if (accessMode === 'PUBLIC_PROTECTED') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      defaultTransport: 'BACKEND',
      isPrivateNetwork: false,
      requiresClientSideCheck: false,
      allowBrowserRequests: false,
      isPublic: false,
      useOidc: false,
      requiresApiKey: false,
    }
    return
  }

  serverStore.serverForm = {
    ...serverStore.serverForm,
    defaultTransport: 'BROWSER',
    isPrivateNetwork: false,
    requiresClientSideCheck: false,
    allowBrowserRequests: true,
    isPublic: false,
    useOidc: false,
  }
}

function applyTransportPreset() {
  if (serverStore.serverForm.defaultTransport === 'BROWSER') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      allowBrowserRequests: true,
    }
    return
  }

  serverStore.serverForm = {
    ...serverStore.serverForm,
    allowBrowserRequests: false,
    requiresClientSideCheck: false,
  }
}

function applyServerTypePreset() {
  const serverType = serverStore.serverForm.serverType as ServerType | undefined

  if (serverType === 'COMFY') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      generationEngine:
        serverStore.serverForm.generationEngine === 'FLUX' ||
        serverStore.serverForm.generationEngine === 'KONTEXT'
          ? serverStore.serverForm.generationEngine
          : 'COMFY',
      endpointPath: serverStore.serverForm.endpointPath || '/prompt',
      healthPath: serverStore.serverForm.healthPath || '/system_stats',
      category: serverStore.serverForm.category || 'image',
      supportsComfyWorkflow: true,
      supportsWorkflowUpload: true,
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsChat: false,
      supportsCheckpointOverride: false,
      supportsSampler: false,
      supportsNegativePrompt: false,
      supportsSeed: true,
      supportsSteps: true,
      supportsVideo: Boolean(serverStore.serverForm.supportsVideo),
    }
    return
  }

  if (serverType === 'A1111') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      generationEngine: 'A1111',
      endpointPath: serverStore.serverForm.endpointPath || '/sdapi/v1/txt2img',
      healthPath: serverStore.serverForm.healthPath || '/sdapi/v1/progress',
      category: serverStore.serverForm.category || 'image',
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsImageEdit: false,
      supportsInpaint: false,
      supportsOutpaint: false,
      supportsChat: false,
      supportsComfyWorkflow: false,
      supportsWorkflowUpload: false,
      supportsFlux: false,
      supportsKontext: false,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
      supportsSampler: true,
      supportsCheckpointOverride: true,
    }
    return
  }

  if (serverType === 'ART') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      generationEngine: serverStore.serverForm.generationEngine || 'OTHER',
      endpointPath: serverStore.serverForm.endpointPath || '/generate',
      healthPath: serverStore.serverForm.healthPath || '/health',
      category: serverStore.serverForm.category || 'image',
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsChat: false,
      supportsComfyWorkflow: false,
    }
    return
  }

  if (serverType === 'OPENAI_COMPATIBLE') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      generationEngine: 'OTHER',
      healthPath: serverStore.serverForm.healthPath || '/v1/models',
      endpointPath:
        serverStore.serverForm.endpointPath || '/v1/chat/completions',
      category: serverStore.serverForm.category || 'text',
      supportsChat: true,
      supportsTxt2Img: false,
      supportsImg2Img: false,
      supportsImageEdit: false,
      supportsInpaint: false,
      supportsOutpaint: false,
      supportsComfyWorkflow: false,
      supportsWorkflowUpload: false,
      supportsFlux: false,
      supportsKontext: false,
      supportsCheckpointOverride: false,
      supportsSampler: false,
      supportsNegativePrompt: false,
      supportsSeed: false,
      supportsSteps: false,
      supportsVideo: false,
    }
    return
  }

  if (serverType === 'TEXT') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      generationEngine: 'OTHER',
      healthPath: serverStore.serverForm.healthPath || '/health',
      endpointPath:
        serverStore.serverForm.endpointPath || '/v1/chat/completions',
      category: serverStore.serverForm.category || 'text',
      supportsChat: true,
      supportsTxt2Img: false,
      supportsImg2Img: false,
      supportsImageEdit: false,
      supportsInpaint: false,
      supportsOutpaint: false,
      supportsComfyWorkflow: false,
      supportsWorkflowUpload: false,
      supportsFlux: false,
      supportsKontext: false,
      supportsCheckpointOverride: false,
      supportsSampler: false,
      supportsNegativePrompt: false,
      supportsSeed: false,
      supportsSteps: false,
      supportsVideo: false,
    }
  }
}

function applyGenerationEnginePreset() {
  const engine = serverStore.serverForm.generationEngine

  if (engine === 'A1111') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      serverType: 'A1111',
      endpointPath: serverStore.serverForm.endpointPath || '/sdapi/v1/txt2img',
      healthPath: serverStore.serverForm.healthPath || '/sdapi/v1/progress',
      category: serverStore.serverForm.category || 'image',
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsImageEdit: false,
      supportsInpaint: false,
      supportsOutpaint: false,
      supportsComfyWorkflow: false,
      supportsWorkflowUpload: false,
      supportsFlux: false,
      supportsKontext: false,
      supportsCheckpointOverride: true,
      supportsSampler: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsSteps: true,
    }
    return
  }

  if (engine === 'COMFY') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      serverType: 'COMFY',
      endpointPath: serverStore.serverForm.endpointPath || '/prompt',
      healthPath: serverStore.serverForm.healthPath || '/system_stats',
      category: serverStore.serverForm.category || 'image',
      supportsComfyWorkflow: true,
      supportsWorkflowUpload: true,
      supportsFlux: false,
      supportsKontext: false,
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsImageEdit: false,
      supportsSeed: true,
      supportsSteps: true,
    }
    return
  }

  if (engine === 'FLUX') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      serverType: 'COMFY',
      endpointPath: serverStore.serverForm.endpointPath || '/prompt',
      healthPath: serverStore.serverForm.healthPath || '/system_stats',
      category: serverStore.serverForm.category || 'image',
      supportsComfyWorkflow: true,
      supportsWorkflowUpload: true,
      supportsFlux: true,
      supportsKontext: false,
      supportsTxt2Img: true,
      supportsImg2Img: false,
      supportsImageEdit: false,
      supportsSeed: true,
      supportsSteps: true,
      defaultCfg: serverStore.serverForm.defaultCfg ?? 3.5,
      defaultWidth: serverStore.serverForm.defaultWidth || 1024,
      defaultHeight: serverStore.serverForm.defaultHeight || 1024,
    }
    return
  }

  if (engine === 'KONTEXT') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      serverType: 'COMFY',
      endpointPath: serverStore.serverForm.endpointPath || '/prompt',
      healthPath: serverStore.serverForm.healthPath || '/system_stats',
      category: serverStore.serverForm.category || 'image',
      supportsComfyWorkflow: true,
      supportsWorkflowUpload: true,
      supportsFlux: false,
      supportsKontext: true,
      supportsImageEdit: true,
      supportsImg2Img: true,
      supportsTxt2Img: false,
      supportsSeed: true,
      supportsSteps: true,
      defaultCfg: serverStore.serverForm.defaultCfg ?? 2.5,
    }
    return
  }

  if (engine === 'OPENAI_IMAGE') {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      serverType: 'ART',
      category: serverStore.serverForm.category || 'image',
      defaultTransport: 'BACKEND',
      allowBrowserRequests: false,
      requiresClientSideCheck: false,
      isPrivateNetwork: false,
      supportsTxt2Img: true,
      supportsImg2Img: true,
      supportsImageEdit: true,
      supportsComfyWorkflow: false,
      supportsWorkflowUpload: false,
      supportsFlux: false,
      supportsKontext: false,
    }
  }
}

async function copyUrl(value?: string | null) {
  if (!value) return

  try {
    await navigator.clipboard.writeText(value)
    copiedUrl.value = true

    setTimeout(() => {
      copiedUrl.value = false
    }, 1500)
  } catch {}
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildFallbackTitle() {
  const label = cleanText(serverStore.serverForm.label)
  const title = cleanText(serverStore.serverForm.title)
  const baseUrl = cleanText(serverStore.serverForm.baseUrl)
  const engine =
    cleanText(serverStore.serverForm.generationEngine) ||
    cleanText(serverStore.serverForm.serverType) ||
    'Server'

  if (title) return title
  if (label) return label

  if (baseUrl) {
    try {
      const url = new URL(baseUrl)
      return `${engine} ${url.hostname}`
    } catch {
      return `${engine} Server`
    }
  }

  return `${engine} Server`
}

function normalizeServerFormForSave() {
  const title = buildFallbackTitle()
  const label = cleanText(serverStore.serverForm.label) || title
  const category =
    cleanText(serverStore.serverForm.category) ||
    (serverStore.serverForm.supportsChat ? 'text' : 'image')

  const browserBaseUrl = cleanText(serverStore.serverForm.browserBaseUrl)
  const backendBaseUrl = cleanText(serverStore.serverForm.backendBaseUrl)

  serverStore.serverForm = {
    ...serverStore.serverForm,
    title,
    label,
    category,
    baseUrl: cleanText(serverStore.serverForm.baseUrl),
    browserBaseUrl: browserBaseUrl || null,
    backendBaseUrl: backendBaseUrl || null,
    endpointPath:
      cleanText(serverStore.serverForm.endpointPath) ||
      endpointPathPlaceholder.value,
    healthPath:
      cleanText(serverStore.serverForm.healthPath) ||
      healthPathPlaceholder.value,
    apiKey: undefined,
    apiKeyName: apiKeyName.value || serverStore.serverForm.apiKeyName || null,
    defaultWidth: Number(serverStore.serverForm.defaultWidth) || 512,
    defaultHeight: Number(serverStore.serverForm.defaultHeight) || 512,
    defaultSteps: serverStore.serverForm.defaultSteps
      ? Number(serverStore.serverForm.defaultSteps)
      : null,
    defaultCfg: serverStore.serverForm.defaultCfg
      ? Number(serverStore.serverForm.defaultCfg)
      : null,
  }
}

function updateWorkflowJson(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value.trim()

  if (!value) {
    serverStore.serverForm.workflowJson = null
    workflowJsonError.value = ''
    return
  }

  try {
    serverStore.serverForm.workflowJson = JSON.parse(value)
    workflowJsonError.value = ''
  } catch (error) {
    workflowJsonError.value =
      error instanceof Error ? error.message : 'Workflow JSON is invalid.'
  }
}

function selectBlueprint() {
  serverStore.setBlueprintServer(serverStore.selectedBlueprintServerId)
  apiKey.value = ''
  apiKeyName.value = serverStore.serverForm.apiKeyName || ''

  if (!selectedBlueprint.value) {
    applyServerTypePreset()
    applyGenerationEnginePreset()
    applyAccessModePreset()
  }
}

async function ensurePrivateServer(): Promise<number | null> {
  if (!userStore.isLoggedIn) return null

  if (serverStore.serverForm.id && !isCloning.value) {
    return serverStore.serverForm.id
  }

  normalizeServerFormForSave()

  serverStore.serverForm = {
    ...serverStore.serverForm,
    id: undefined,
    userId: myUserId.value,
    isPublic: false,
    isOfficial: false,
    isDefault: false,
    isEditable: true,
    apiKey: undefined,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  }

  const result = await serverStore.saveServer()

  if (!result.success || !result.data) return null

  serverStore.selectServer(result.data.id)

  return result.data.id
}

async function saveKeyOnly() {
  if (!apiKey.value.trim()) return

  const id = await ensurePrivateServer()

  if (!id) return

  await serverStore.updateServerApiKey(id, {
    apiKey: apiKey.value,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  })

  apiKey.value = ''
}

async function clearKey() {
  if (!serverStore.serverForm.id || isCloning.value) return

  await serverStore.updateServerApiKey(serverStore.serverForm.id, {
    clearKey: true,
    apiKeyName:
      apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
  })

  apiKey.value = ''
}

async function handleSave() {
  normalizeServerFormForSave()

  if (isCloning.value) {
    serverStore.serverForm = {
      ...serverStore.serverForm,
      id: undefined,
      userId: myUserId.value,
      isPublic: false,
      isOfficial: false,
      isDefault: false,
      isEditable: true,
      apiKey: undefined,
    }
  }

  const result = await serverStore.saveServer()

  if (!result.success || !result.data) return

  if (apiKey.value.trim()) {
    await serverStore.updateServerApiKey(result.data.id, {
      apiKey: apiKey.value,
      apiKeyName:
        apiKeyName.value || serverStore.serverForm.apiKeyName || 'API Key',
    })
  }

  apiKey.value = ''
  serverStore.selectedBlueprintServerId = null

  await serverStore.initialize({
    force: true,
    fetchRemote: true,
  })

  serverStore.selectServer(result.data.id)
  serverStore.closeServerForm()
}

watch(
  () => serverStore.serverForm.apiKeyName,
  (value) => {
    if (!apiKeyName.value && value) {
      apiKeyName.value = value
    }
  },
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    serverStore.closeServerForm()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (!serverStore.serverForm.accessMode) {
    serverStore.serverForm.accessMode = 'LOCAL'
  }

  if (!serverStore.serverForm.generationEngine) {
    serverStore.serverForm.generationEngine =
      serverStore.serverForm.serverType === 'COMFY'
        ? 'COMFY'
        : serverStore.serverForm.serverType === 'A1111'
          ? 'A1111'
          : 'OTHER'
  }

  if (!serverStore.serverForm.defaultTransport) {
    serverStore.serverForm.defaultTransport = 'BROWSER'
  }

  apiKeyName.value = serverStore.serverForm.apiKeyName || ''

  if (serverStore.serverForm.generationEngine === 'OPENAI_IMAGE') {
    selectedFriendlyPreset.value = 'openai-images'
    return
  }

  if (serverStore.serverForm.generationEngine === 'FLUX') {
    selectedFriendlyPreset.value = 'comfy-flux'
    return
  }

  if (
    serverStore.serverForm.generationEngine === 'COMFY' ||
    serverStore.serverForm.serverType === 'COMFY'
  ) {
    selectedFriendlyPreset.value = 'comfy-sdxl'
    return
  }

  if (
    serverStore.serverForm.generationEngine === 'A1111' ||
    serverStore.serverForm.serverType === 'A1111'
  ) {
    selectedFriendlyPreset.value = 'stable-diffusion'
    return
  }

  if (serverStore.serverForm.serverType === 'OPENAI_COMPATIBLE') {
    selectedFriendlyPreset.value = 'openai-compatible'
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-track-transparent {
  scrollbar-color: transparent transparent;
}

.scrollbar-thumb-base-300 {
  scrollbar-color: oklch(var(--b3)) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background: oklch(var(--b3));
}
</style>
