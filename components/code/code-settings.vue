<!-- /components/code/code-settings.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col bg-base-100">
    <header class="border-b border-base-300 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2
            class="flex items-center gap-2 truncate text-lg font-black text-primary"
          >
            <icon
              :name="definition?.icon || 'kind-icon:settings'"
              class="h-5 w-5 shrink-0"
            />
            {{ node?.title || 'Node Settings' }}
          </h2>

          <p class="mt-1 line-clamp-2 text-xs text-base-content/60">
            {{ definition?.description || 'Select a card to configure it.' }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm btn-circle"
          type="button"
          title="Close settings"
     @click="emit('close')"
        >
          <icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>
    </header>

    <div v-if="node && definition" class="min-h-0 flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <label class="form-control">
            <span class="label pb-1">
              <span class="label-text font-bold">Card title</span>
            </span>

            <input
              v-model="localTitle"
              class="input input-bordered w-full rounded-2xl bg-base-100"
              type="text"
              placeholder="Card title"
              @blur="saveTitle"
              @keydown.enter.prevent="saveTitle"
            />
          </label>

          <div class="mt-3 flex flex-wrap gap-2 text-xs">
            <span class="badge badge-outline rounded-2xl">
              {{ definition.category }}
            </span>

            <span class="badge badge-outline rounded-2xl">
              {{ definition.kind }}
            </span>

            <span
              v-if="definition.inputs.length"
              class="badge badge-info rounded-2xl"
            >
              {{ definition.inputs.length }} inputs
            </span>

            <span
              v-if="definition.outputs.length"
              class="badge badge-secondary rounded-2xl"
            >
              {{ definition.outputs.length }} outputs
            </span>
          </div>
        </section>

        <section
          v-if="hasPromptField"
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <label class="form-control">
            <span class="label pb-1">
              <span class="label-text font-bold">Prompt</span>
              <span class="label-text-alt">{{ promptText.length }} chars</span>
            </span>

            <textarea
              v-model="promptText"
              class="textarea textarea-bordered min-h-32 rounded-2xl bg-base-100"
              placeholder="Write the prompt or instruction for this card..."
              @blur="saveValue('prompt', promptText)"
            />
          </label>
        </section>

        <section
          v-if="hasTextField"
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <label class="form-control">
            <span class="label pb-1">
              <span class="label-text font-bold">Text</span>
              <span class="label-text-alt">{{ textValue.length }} chars</span>
            </span>

            <textarea
              v-model="textValue"
              class="textarea textarea-bordered min-h-32 rounded-2xl bg-base-100"
              placeholder="Start with text, notes, instructions, or raw creative goo..."
              @blur="saveValue('text', textValue)"
            />
          </label>
        </section>

        <section
          v-if="hasImageField"
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="font-black text-base-content">Image source</h3>
              <p class="text-xs text-base-content/60">
                Placeholder for upload, gallery select, or ArtImage binding.
              </p>
            </div>

            <icon name="kind-icon:image" class="h-6 w-6 text-secondary" />
          </div>

          <label class="form-control mt-3">
            <span class="label pb-1">
              <span class="label-text font-bold">ArtImage ID</span>
            </span>

            <input
              v-model.number="imageId"
              class="input input-bordered w-full rounded-2xl bg-base-100"
              type="number"
              min="1"
              placeholder="Optional ArtImage ID"
              @blur="saveValue('artImageId', imageId || null)"
            />
          </label>
        </section>

        <section
          v-if="hasModelSettings"
          class="rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <h3 class="font-black text-base-content">Model settings</h3>

          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="form-control">
              <span class="label pb-1">
                <span class="label-text font-bold">Server</span>
              </span>

              <input
                v-model="serverName"
                class="input input-bordered rounded-2xl bg-base-100"
                type="text"
                placeholder="Server name"
                @blur="saveValue('serverName', serverName)"
              />
            </label>

            <label class="form-control">
              <span class="label pb-1">
                <span class="label-text font-bold">Model</span>
              </span>

              <input
                v-model="modelName"
                class="input input-bordered rounded-2xl bg-base-100"
                type="text"
                placeholder="Model or workflow"
                @blur="saveValue('modelName', modelName)"
              />
            </label>

            <label class="form-control">
              <span class="label pb-1">
                <span class="label-text font-bold">Checkpoint</span>
              </span>

              <input
                v-model="checkpoint"
                class="input input-bordered rounded-2xl bg-base-100"
                type="text"
                placeholder="Checkpoint"
                @blur="saveValue('checkpoint', checkpoint)"
              />
            </label>

            <label class="form-control">
              <span class="label pb-1">
                <span class="label-text font-bold">Seed</span>
              </span>

              <input
                v-model.number="seed"
                class="input input-bordered rounded-2xl bg-base-100"
                type="number"
                placeholder="-1"
                @blur="saveValue('seed', seed)"
              />
            </label>

            <label class="form-control">
              <span class="label pb-1">
                <span class="label-text font-bold">Steps</span>
              </span>

              <input
                v-model.number="steps"
                class="input input-bordered rounded-2xl bg-base-100"
                type="number"
                min="1"
                max="150"
                placeholder="30"
                @blur="saveValue('steps', steps)"
              />
            </label>

            <label class="form-control">
              <span class="label pb-1">
                <span class="label-text font-bold">CFG</span>
              </span>

              <input
                v-model.number="cfg"
                class="input input-bordered rounded-2xl bg-base-100"
                type="number"
                min="1"
                max="30"
                step="0.5"
                placeholder="3.5"
                @blur="saveValue('cfg', cfg)"
              />
            </label>
          </div>

          <div class="mt-4 space-y-2">
            <label
              class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
            >
              <span>
                <span class="block text-sm font-bold">Save output</span>
                <span class="block text-xs text-base-content/60">
                  Store generated output when this node runs.
                </span>
              </span>

              <input
                v-model="saveOutput"
                class="toggle toggle-primary"
                type="checkbox"
                @change="saveValue('saveOutput', saveOutput)"
              />
            </label>

            <label
              class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
            >
              <span>
                <span class="block text-sm font-bold">Use previous output</span>
                <span class="block text-xs text-base-content/60">
                  Prefer connected input data over manual settings.
                </span>
              </span>

              <input
                v-model="useConnectedInput"
                class="toggle toggle-secondary"
                type="checkbox"
                @change="saveValue('useConnectedInput', useConnectedInput)"
              />
            </label>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="font-black text-base-content">Ports</h3>

          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <p
                class="text-xs font-black uppercase tracking-wide text-base-content/50"
              >
                Inputs
              </p>

              <div class="mt-2 space-y-2">
                <div
                  v-for="port in definition.inputs"
                  :key="port.id"
                  class="flex items-center justify-between gap-2 rounded-xl bg-base-200 px-2 py-1.5 text-xs"
                >
                  <span class="truncate font-bold">{{ port.label }}</span>
                  <span class="badge badge-outline badge-xs">{{
                    port.type
                  }}</span>
                </div>

                <p
                  v-if="!definition.inputs.length"
                  class="text-xs text-base-content/50"
                >
                  No inputs. This card starts a chain.
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <p
                class="text-xs font-black uppercase tracking-wide text-base-content/50"
              >
                Outputs
              </p>

              <div class="mt-2 space-y-2">
                <div
                  v-for="port in definition.outputs"
                  :key="port.id"
                  class="flex items-center justify-between gap-2 rounded-xl bg-base-200 px-2 py-1.5 text-xs"
                >
                  <span class="truncate font-bold">{{ port.label }}</span>
                  <span class="badge badge-outline badge-xs">{{
                    port.type
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="flex min-h-0 flex-1 items-center justify-center p-4">
      <div
        class="max-w-sm rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
      >
        <icon
          name="kind-icon:settings"
          class="mx-auto h-10 w-10 text-base-content/40"
        />

        <h3 class="mt-3 font-black text-base-content">No card selected</h3>

        <p class="mt-1 text-sm text-base-content/60">
          Select a card to configure its tiny robot feelings.
        </p>
      </div>
    </div>

    <footer v-if="node" class="border-t border-base-300 p-3">
      <div class="flex flex-wrap justify-end gap-2">
        <button
          class="btn btn-sm btn-outline rounded-2xl"
          type="button"
          @click="resetLocalValues"
        >
          <icon name="kind-icon:refresh" class="h-4 w-4" />
          Reset
        </button>

        <button
          class="btn btn-sm btn-primary rounded-2xl"
          type="button"
          @click="saveAll"
        >
          <icon name="kind-icon:check" class="h-4 w-4" />
          Save
        </button>
      </div>
    </footer>
  </section>
</template>


<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCodeStore } from '@/stores/codeStore'

const emit = defineEmits<{
  close: []
}>()

const codeStore = useCodeStore()
const node = computed(() => codeStore.selectedNode)
const definition = computed(() => codeStore.selectedDefinition)

const localTitle = ref('')
const promptText = ref('')
const textValue = ref('')
const imageId = ref<number | null>(null)
const serverName = ref('')
const modelName = ref('')
const checkpoint = ref('')
const seed = ref(-1)
const steps = ref(30)
const cfg = ref(3.5)
const saveOutput = ref(true)
const useConnectedInput = ref(true)

const hasPromptField = computed(() => {
  return Boolean(
    definition.value?.inputs.some((port) => {
      return port.id === 'prompt' || port.label.toLowerCase().includes('prompt')
    }),
  )
})

const hasTextField = computed(() => {
  return Boolean(
    definition.value?.kind === 'text-input' ||
    definition.value?.inputs.some((port) => port.type === 'text'),
  )
})

const hasImageField = computed(() => {
  return Boolean(
    definition.value?.kind === 'image-upload-select' ||
    definition.value?.inputs.some((port) => port.type === 'image') ||
    definition.value?.outputs.some((port) => port.type === 'image'),
  )
})

const hasModelSettings = computed(() => {
  const kind = definition.value?.kind

  return Boolean(
    kind &&
    [
      'openai-text',
      'openai-image',
      'anthropic-text',
      'stable-diffusion',
      'comfy-sdxl',
      'comfy-kombine',
      'comfy-kontext',
      'comfy-schnell',
      'comfy-dev',
      'image2vid',
      'text2vid',
      'img2model',
    ].includes(kind),
  )
})

watch(
  node,
  () => {
    resetLocalValues()
  },
  { immediate: true },
)

function valueAsString(key: string, fallback = '') {
  const value = node.value?.values?.[key]

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return fallback
}

function valueAsNumber(key: string, fallback: number) {
  const value = node.value?.values?.[key]

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function valueAsBoolean(key: string, fallback: boolean) {
  const value = node.value?.values?.[key]

  if (typeof value === 'boolean') {
    return value
  }

  return fallback
}

function resetLocalValues() {
  localTitle.value = node.value?.title ?? ''
  promptText.value = valueAsString('prompt')
  textValue.value = valueAsString('text')
  imageId.value = valueAsNumber('artImageId', 0) || null
  serverName.value = valueAsString('serverName')
  modelName.value = valueAsString('modelName')
  checkpoint.value = valueAsString('checkpoint')
  seed.value = valueAsNumber('seed', -1)
  steps.value = valueAsNumber('steps', 30)
  cfg.value = valueAsNumber('cfg', 3.5)
  saveOutput.value = valueAsBoolean('saveOutput', true)
  useConnectedInput.value = valueAsBoolean('useConnectedInput', true)
}

function saveTitle() {
  if (!node.value) return
  codeStore.updateNodeTitle(node.value.id, localTitle.value)
}

function saveValue(key: string, value: unknown) {
  if (!node.value) return
  codeStore.updateNodeValue(node.value.id, key, value)
}

function saveAll() {
  if (!node.value) return

  codeStore.updateNodeTitle(node.value.id, localTitle.value)

  codeStore.updateNodeValues(node.value.id, {
    prompt: promptText.value,
    text: textValue.value,
    artImageId: imageId.value,
    serverName: serverName.value,
    modelName: modelName.value,
    checkpoint: checkpoint.value,
    seed: seed.value,
    steps: steps.value,
    cfg: cfg.value,
    saveOutput: saveOutput.value,
    useConnectedInput: useConnectedInput.value,
  })

  codeStore.setMessage(`${localTitle.value || 'Card'} settings saved.`)
}
</script>
