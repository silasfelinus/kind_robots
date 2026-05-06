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
        <p class="text-xs font-black">Creating a personal copy</p>

        <p class="mt-0.5 text-[11px] opacity-70">
          The original is unchanged. Only you can see this version.
        </p>
      </div>
    </div>

    <div
      class="flex shrink-0 items-start justify-between gap-4 border-b border-base-300 px-4 py-3"
    >
      <div>
        <h2 class="text-sm font-black">
          {{
            isCloning
              ? 'Customize Server'
              : serverStore.serverForm.id
                ? 'Edit Server'
                : 'Configure Server'
          }}
        </h2>

        <p class="mt-0.5 text-[11px] opacity-55">{{ subtitle }}</p>
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
      <fieldset
        class="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-200 p-4"
      >
        <legend
          class="px-1 text-[10px] font-black uppercase tracking-widest opacity-45"
        >
          Quick Setup
        </legend>

        <label v-if="!serverStore.serverForm.id" class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">Blueprint</span>

          <select
            v-model="serverStore.selectedBlueprintServerId"
            class="select select-bordered select-sm rounded-xl text-xs"
            @change="selectBlueprint"
          >
            <option :value="null">Start from a new blank server</option>

            <option
              v-for="server in serverStore.blueprintServers"
              :key="server.id"
              :value="server.id"
            >
              [{{ server.generationEngine || server.serverType }}]
              {{ server.label || server.title }}
            </option>
          </select>
        </label>

        <div
          v-if="selectedBlueprint"
          class="rounded-xl border border-info/30 bg-info/10 px-3 py-2 text-[11px]"
        >
          <div class="flex items-start gap-2">
            <Icon
              name="kind-icon:copy"
              class="mt-0.5 h-3.5 w-3.5 shrink-0 text-info"
            />

            <div>
              <p class="font-black">Using blueprint</p>

              <p class="mt-0.5 opacity-70">
                {{ selectedBlueprint.label || selectedBlueprint.title }}
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Title</span>

            <input
              v-model="serverStore.serverForm.title"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="Lola Stable Diffusion"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Label</span>

            <input
              v-model="serverStore.serverForm.label"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="Lola A1111"
            />
          </label>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Server Type</span>

            <select
              v-model="serverStore.serverForm.serverType"
              class="select select-bordered select-sm rounded-xl text-xs"
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

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">
              Generation Engine
            </span>

            <select
              v-model="serverStore.serverForm.generationEngine"
              class="select select-bordered select-sm rounded-xl text-xs"
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

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">
              Default Transport
            </span>

            <select
              v-model="serverStore.serverForm.defaultTransport"
              class="select select-bordered select-sm rounded-xl text-xs"
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
        </div>

        <div
          class="grid grid-cols-1 gap-3 rounded-xl border border-base-300 bg-base-100 p-3 text-[11px] md:grid-cols-2"
        >
          <div>
            <p class="font-black">
              {{
                selectedGenerationEngine?.label ||
                serverStore.serverForm.generationEngine ||
                'Generation Engine'
              }}
            </p>

            <p class="mt-0.5 opacity-65">
              {{ selectedGenerationEngine?.description || 'Custom engine.' }}
            </p>
          </div>

          <div>
            <p class="font-black">
              {{
                selectedTransport?.label ||
                serverStore.serverForm.defaultTransport ||
                'Transport'
              }}
            </p>

            <p class="mt-0.5 opacity-65">
              {{ selectedTransport?.description || 'Custom transport.' }}
            </p>
          </div>
        </div>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">Connection Mode</span>

          <select
            v-model="serverStore.serverForm.accessMode"
            class="select select-bordered select-sm rounded-xl text-xs"
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

        <div
          :class="[
            'rounded-xl border px-3 py-2 text-[11px]',
            selectedAccessModeInfo.tone,
          ]"
        >
          <div class="flex items-start gap-2">
            <Icon
              :name="selectedAccessModeInfo.icon"
              class="mt-0.5 h-3.5 w-3.5 shrink-0"
            />

            <div>
              <p class="font-black">{{ selectedAccessModeInfo.title }}</p>

              <p class="mt-0.5 opacity-70">
                {{ selectedAccessModeInfo.description }}
              </p>
            </div>
          </div>
        </div>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">Base URL</span>

          <div class="flex gap-1.5">
            <input
              v-model="serverStore.serverForm.baseUrl"
              class="input input-bordered input-sm flex-1 rounded-xl font-mono text-xs"
              :placeholder="baseUrlPlaceholder"
            />

            <button
              v-if="serverStore.serverForm.baseUrl"
              type="button"
              class="btn btn-ghost btn-sm btn-square rounded-xl"
              title="Copy URL"
              @click="copyUrl(serverStore.serverForm.baseUrl)"
            >
              <Icon
                :name="copiedUrl ? 'kind-icon:check' : 'kind-icon:copy'"
                :class="['h-3.5 w-3.5', copiedUrl && 'text-success']"
              />
            </button>
          </div>
        </label>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">
              Browser Base URL
            </span>

            <input
              v-model="serverStore.serverForm.browserBaseUrl"
              class="input input-bordered input-sm rounded-xl font-mono text-xs"
              :placeholder="browserBaseUrlPlaceholder"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">
              Backend Base URL
            </span>

            <input
              v-model="serverStore.serverForm.backendBaseUrl"
              class="input input-bordered input-sm rounded-xl font-mono text-xs"
              :placeholder="backendBaseUrlPlaceholder"
            />
          </label>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Endpoint Path</span>

            <input
              v-model="serverStore.serverForm.endpointPath"
              class="input input-bordered input-sm rounded-xl font-mono text-xs"
              :placeholder="endpointPathPlaceholder"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Health Path</span>

            <input
              v-model="serverStore.serverForm.healthPath"
              class="input input-bordered input-sm rounded-xl font-mono text-xs"
              :placeholder="healthPathPlaceholder"
            />
          </label>
        </div>

        <div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
          <label
            class="flex cursor-pointer flex-col gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-[11px]"
          >
            <span class="flex items-center gap-2 font-black">
              <input
                v-model="serverStore.serverForm.requiresClientSideCheck"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
              />
              Health check from browser
            </span>

            <span class="pl-6 opacity-60">
              Use this when Vercel cannot reach the server, but your browser
              can.
            </span>
          </label>

          <label
            class="flex cursor-pointer flex-col gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-[11px]"
          >
            <span class="flex items-center gap-2 font-black">
              <input
                v-model="serverStore.serverForm.isPrivateNetwork"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
              />
              Private / local / tailnet URL
            </span>

            <span class="pl-6 opacity-60">
              For localhost, LAN IPs, Tailscale, or anything not publicly
              reachable.
            </span>
          </label>

          <label
            class="flex cursor-pointer flex-col gap-1 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-[11px]"
          >
            <span class="flex items-center gap-2 font-black">
              <input
                v-model="serverStore.serverForm.allowBrowserRequests"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
              />
              Allow browser-direct calls
            </span>

            <span class="pl-6 opacity-60">
              Let the frontend fetch this server directly. Requires CORS to
              allow your site.
            </span>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Width</span>

            <input
              v-model.number="serverStore.serverForm.defaultWidth"
              type="number"
              min="64"
              step="8"
              class="input input-bordered input-sm rounded-xl text-xs"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Height</span>

            <input
              v-model.number="serverStore.serverForm.defaultHeight"
              type="number"
              min="64"
              step="8"
              class="input input-bordered input-sm rounded-xl text-xs"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Steps</span>

            <input
              v-model.number="serverStore.serverForm.defaultSteps"
              type="number"
              min="1"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="25"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">CFG / Guidance</span>

            <input
              v-model.number="serverStore.serverForm.defaultCfg"
              type="number"
              step="0.5"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="3.5"
            />
          </label>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">
              Default Sampler
            </span>

            <input
              v-model="serverStore.serverForm.defaultSampler"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="Euler a, euler, dpmpp_2m..."
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">
              Default Scheduler
            </span>

            <input
              v-model="serverStore.serverForm.defaultScheduler"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="normal, simple, beta..."
            />
          </label>
        </div>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">
            API Docs / Info Link
          </span>

          <input
            v-model="serverStore.serverForm.apiLink"
            class="input input-bordered input-sm rounded-xl text-xs"
            placeholder="https://docs.example.com"
          />
        </label>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Model Name</span>

            <input
              v-model="serverStore.serverForm.model"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="v1-5-pruned, flux-dev, gpt-4o-mini..."
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">
              Designer / Provider
            </span>

            <input
              v-model="serverStore.serverForm.designer"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="OpenAI, Stability, Local Lola..."
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Version</span>

            <input
              v-model="serverStore.serverForm.version"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="1.0, SDXL, Forge, Comfy..."
            />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
          <label
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-bold"
          >
            <input
              v-model="serverStore.serverForm.isEditable"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-xs"
            />
            Editable
          </label>

          <label
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-bold"
          >
            <input
              v-model="serverStore.serverForm.isPublic"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-xs"
            />
            Public
          </label>

          <label
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-bold"
          >
            <input
              v-model="serverStore.serverForm.isOfficial"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-xs"
            />
            Official
          </label>

          <label
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs font-bold"
          >
            <input
              v-model="serverStore.serverForm.isDefault"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-xs"
            />
            Default
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Sort Order</span>

            <input
              v-model.number="serverStore.serverForm.sortOrder"
              type="number"
              class="input input-bordered input-sm rounded-xl text-xs"
            />
          </label>
        </div>

        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold opacity-70">Notes</span>

          <textarea
            v-model="serverStore.serverForm.notes"
            class="textarea textarea-bordered rounded-xl text-xs"
            rows="2"
            placeholder="Private setup notes, auth quirks, launch flags, cursed YAML discoveries..."
          />
        </label>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold opacity-70">API Key</span>

            <span
              :class="[
                'badge badge-xs',
                serverHasStoredKey ? 'badge-success' : 'badge-neutral',
              ]"
            >
              {{ serverHasStoredKey ? '🔑 Stored' : 'Not set' }}
            </span>
          </div>

          <div class="flex gap-1.5">
            <input
              v-model="apiKey"
              :type="showApiKey ? 'text' : 'password'"
              autocomplete="off"
              placeholder="Leave blank to keep existing"
              class="input input-bordered input-sm flex-1 rounded-xl font-mono text-xs"
            />

            <button
              type="button"
              class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl"
              :title="showApiKey ? 'Hide' : 'Show'"
              @click="showApiKey = !showApiKey"
            >
              <Icon
                :name="showApiKey ? 'kind-icon:eye-off' : 'kind-icon:eye'"
                class="h-3.5 w-3.5"
              />
            </button>
          </div>

          <input
            v-model="apiKeyName"
            class="input input-bordered input-sm rounded-xl text-xs"
            placeholder="Label: OpenAI, Groq, Stability..."
          />

          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              class="btn btn-outline btn-xs rounded-lg"
              :disabled="!apiKey.trim() || serverStore.isSaving"
              @click="saveKeyOnly"
            >
              Save Key Only
            </button>

            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg opacity-60"
              :disabled="
                !serverStore.serverForm.id || isCloning || serverStore.isSaving
              "
              @click="clearKey"
            >
              Clear Key
            </button>
          </div>
        </div>
      </fieldset>

      <details class="group overflow-hidden rounded-xl border border-base-300">
        <summary
          class="flex cursor-pointer select-none list-none items-center gap-2 bg-base-200 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider opacity-60 hover:opacity-90"
        >
          <Icon name="kind-icon:workflow" class="h-3.5 w-3.5" />
          Workflow Settings

          <Icon
            name="kind-icon:chevron-down"
            class="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180"
          />
        </summary>

        <div class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">Workflow Path</span>

            <input
              v-model="serverStore.serverForm.workflowPath"
              class="input input-bordered input-sm rounded-xl font-mono text-xs"
              placeholder="/workflows/flux-dev.json"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold opacity-70">
              Workflow Version
            </span>

            <input
              v-model="serverStore.serverForm.workflowVersion"
              class="input input-bordered input-sm rounded-xl text-xs"
              placeholder="flux-dev-v1"
            />
          </label>

          <label class="flex flex-col gap-1 sm:col-span-2">
            <span class="text-[11px] font-bold opacity-70">Workflow JSON</span>

            <textarea
              :value="workflowJsonText"
              class="textarea textarea-bordered min-h-40 rounded-xl font-mono text-xs"
              placeholder="{ ... Comfy workflow JSON ... }"
              @input="updateWorkflowJson"
            />
          </label>

          <div
            v-if="workflowJsonError"
            class="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
          >
            {{ workflowJsonError }}
          </div>
        </div>
      </details>

      <details class="group overflow-hidden rounded-xl border border-base-300">
        <summary
          class="flex cursor-pointer select-none list-none items-center gap-2 bg-base-200 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider opacity-60 hover:opacity-90"
        >
          <Icon name="kind-icon:settings" class="h-3.5 w-3.5" />
          More Settings

          <Icon
            name="kind-icon:chevron-down"
            class="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180"
          />
        </summary>

        <div class="flex flex-col gap-3 p-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="flex flex-col gap-1">
              <span class="text-[11px] font-bold opacity-70">Category</span>

              <input
                v-model="serverStore.serverForm.category"
                class="input input-bordered input-sm rounded-xl text-xs"
              />
            </label>

            <label class="flex flex-col gap-1">
              <span class="text-[11px] font-bold opacity-70">
                OIDC Provider
              </span>

              <input
                v-model="serverStore.serverForm.oidcProvider"
                class="input input-bordered input-sm rounded-xl text-xs"
                placeholder="authelia"
              />
            </label>

            <label
              class="flex cursor-pointer items-end gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-xs font-bold"
            >
              <input
                v-model="serverStore.serverForm.useOidc"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
              />
              Use OIDC
            </label>

            <label class="flex flex-col gap-1 sm:col-span-2">
              <span class="text-[11px] font-bold opacity-70">Description</span>

              <textarea
                v-model="serverStore.serverForm.description"
                class="textarea textarea-bordered rounded-xl text-xs"
                rows="2"
              />
            </label>
          </div>

          <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <label
              v-for="toggle in capabilityToggles"
              :key="toggle.key"
              class="flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-xs font-bold hover:border-primary/40"
            >
              <input
                v-model="(serverStore.serverForm as any)[toggle.key]"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
              />
              {{ toggle.label }}
            </label>
          </div>
        </div>
      </details>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm flex-1 rounded-xl"
          @click="serverStore.closeServerForm()"
        >
          Cancel
        </button>

        <button
          type="submit"
          class="btn btn-primary btn-sm flex-1 gap-1.5 rounded-xl"
          :disabled="serverStore.isSaving || Boolean(workflowJsonError)"
        >
          <span
            v-if="serverStore.isSaving"
            class="loading loading-spinner loading-xs"
          />

          <Icon v-else name="kind-icon:save" class="h-3.5 w-3.5" />

          {{
            isCloning
              ? 'Save My Copy'
              : serverStore.serverForm.id
                ? 'Save Changes'
                : 'Create Server'
          }}
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

  window.addEventListener('keydown', onKeydown)
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
