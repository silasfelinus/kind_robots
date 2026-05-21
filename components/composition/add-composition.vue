<!-- /components/content/composition/add-composition.vue -->
<template>
  <div
    class="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="text-center">
      <h1 class="text-3xl font-bold text-primary md:text-4xl">{{ heading }}</h1>
      <p class="mt-2 text-sm text-base-content/70">{{ subtitle }}</p>
    </header>

    <div
      v-if="mode === 'edit' && !compositionStore.selected"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Select a composition before editing.
    </div>

    <template v-else>
      <!-- ── Core fields ─────────────────────────────────────────────────── -->
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="form-control lg:col-span-2">
          <span class="label"
            ><span class="label-text font-bold">Title</span></span
          >
          <input
            v-model="compositionStore.form.title"
            type="text"
            placeholder="Give this composition a name"
            class="input input-bordered w-full bg-base-100"
          />
        </label>

        <label class="form-control lg:col-span-2">
          <span class="label"
            ><span class="label-text font-bold">Description</span></span
          >
          <textarea
            v-model="compositionStore.form.description"
            placeholder="What is this composition about?"
            class="textarea textarea-bordered min-h-24 w-full bg-base-100"
          />
        </label>

        <!-- Mode -->
        <label class="form-control">
          <span class="label"
            ><span class="label-text font-bold">Output Mode</span></span
          >
          <select
            v-model="compositionStore.form.mode"
            class="select select-bordered w-full bg-base-100"
          >
            <option value="both">Both (narrative + art prompt)</option>
            <option value="narrative">Narrative only</option>
            <option value="art">Art prompt only</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label"
            ><span class="label-text font-bold">Label</span></span
          >
          <input
            v-model="compositionStore.form.label"
            type="text"
            placeholder="Short display label"
            class="input input-bordered w-full bg-base-100"
          />
        </label>
      </section>

      <!-- ── Ingredients ────────────────────────────────────────────────── -->
      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="mb-1 text-xl font-bold text-base-content">Ingredients</h2>
        <p class="mb-4 text-sm text-base-content/60">
          Link saved records or write freeform blurbs. Both can coexist — the
          blurb overrides the linked record's text in the synthesis prompt.
        </p>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Character -->
          <div
            class="ingredient-slot rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon name="kind-icon:user" class="h-5 w-5 text-primary" />
              <span class="font-bold text-base-content">Character</span>
            </div>
            <label class="form-control mb-2">
              <span class="label-text text-xs text-base-content/60"
                >Link a saved character</span
              >
              <input
                v-model.number="compositionStore.form.characterId"
                type="number"
                placeholder="Character ID (optional)"
                class="input input-bordered input-sm w-full bg-base-100"
                min="1"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs text-base-content/60"
                >Or describe freeform</span
              >
              <textarea
                v-model="compositionStore.form.characterBlurb"
                placeholder="e.g. 'A weary elven cartographer with a secret map tattoo...'"
                class="textarea textarea-bordered textarea-sm min-h-20 w-full bg-base-100 text-sm"
              />
            </label>
          </div>

          <!-- Dream / Location -->
          <div
            class="ingredient-slot rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon name="kind-icon:map" class="h-5 w-5 text-primary" />
              <span class="font-bold text-base-content">Location (Dream)</span>
            </div>
            <label class="form-control mb-2">
              <span class="label-text text-xs text-base-content/60"
                >Link a saved dream</span
              >
              <input
                v-model.number="compositionStore.form.dreamId"
                type="number"
                placeholder="Dream ID (optional)"
                class="input input-bordered input-sm w-full bg-base-100"
                min="1"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs text-base-content/60"
                >Or describe freeform</span
              >
              <textarea
                v-model="compositionStore.form.dreamBlurb"
                placeholder="e.g. 'A rain-slicked market district on a gas-giant moon...'"
                class="textarea textarea-bordered textarea-sm min-h-20 w-full bg-base-100 text-sm"
              />
            </label>
          </div>

          <!-- Scenario -->
          <div
            class="ingredient-slot rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon name="kind-icon:scroll" class="h-5 w-5 text-primary" />
              <span class="font-bold text-base-content">Scenario</span>
            </div>
            <label class="form-control mb-2">
              <span class="label-text text-xs text-base-content/60"
                >Link a saved scenario</span
              >
              <input
                v-model.number="compositionStore.form.scenarioId"
                type="number"
                placeholder="Scenario ID (optional)"
                class="input input-bordered input-sm w-full bg-base-100"
                min="1"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs text-base-content/60"
                >Or describe freeform</span
              >
              <textarea
                v-model="compositionStore.form.scenarioBlurb"
                placeholder="e.g. 'A tense negotiation that's about to go sideways...'"
                class="textarea textarea-bordered textarea-sm min-h-20 w-full bg-base-100 text-sm"
              />
            </label>
          </div>

          <!-- Pitch / Concept -->
          <div
            class="ingredient-slot rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon name="kind-icon:lightbulb" class="h-5 w-5 text-primary" />
              <span class="font-bold text-base-content">Concept (Pitch)</span>
            </div>
            <label class="form-control mb-2">
              <span class="label-text text-xs text-base-content/60"
                >Link a saved pitch</span
              >
              <input
                v-model.number="compositionStore.form.pitchId"
                type="number"
                placeholder="Pitch ID (optional)"
                class="input input-bordered input-sm w-full bg-base-100"
                min="1"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs text-base-content/60"
                >Or describe freeform</span
              >
              <textarea
                v-model="compositionStore.form.pitchBlurb"
                placeholder="e.g. 'Folk-horror with a hopeful ending...'"
                class="textarea textarea-bordered textarea-sm min-h-20 w-full bg-base-100 text-sm"
              />
            </label>
          </div>

          <!-- Reward / Loot -->
          <div
            class="ingredient-slot rounded-2xl border border-base-300 bg-base-200 p-3 lg:col-span-2"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon name="kind-icon:star" class="h-5 w-5 text-primary" />
              <span class="font-bold text-base-content">Reward / Loot</span>
            </div>
            <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <label class="form-control">
                <span class="label-text text-xs text-base-content/60"
                  >Link a saved reward</span
                >
                <input
                  v-model.number="compositionStore.form.rewardId"
                  type="number"
                  placeholder="Reward ID (optional)"
                  class="input input-bordered input-sm w-full bg-base-100"
                  min="1"
                />
              </label>
              <label class="form-control">
                <span class="label-text text-xs text-base-content/60"
                  >Or describe freeform</span
                >
                <textarea
                  v-model="compositionStore.form.rewardBlurb"
                  placeholder="e.g. 'A compass that always points toward regret...'"
                  class="textarea textarea-bordered textarea-sm min-h-20 w-full bg-base-100 text-sm"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Flags ──────────────────────────────────────────────────────── -->
      <section
        class="grid grid-cols-2 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 sm:grid-cols-4"
      >
        <label class="flex cursor-pointer flex-col items-center gap-2">
          <span class="text-sm font-bold">Public</span>
          <input
            v-model="compositionStore.form.isPublic"
            type="checkbox"
            class="toggle toggle-success"
          />
        </label>
        <label class="flex cursor-pointer flex-col items-center gap-2">
          <span class="text-sm font-bold">Mature</span>
          <input
            v-model="compositionStore.form.isMature"
            type="checkbox"
            class="toggle toggle-warning"
          />
        </label>
      </section>

      <!-- ── Status ─────────────────────────────────────────────────────── -->
      <div
        v-if="statusMessage"
        class="rounded-2xl border p-3 text-sm"
        :class="
          statusTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ statusMessage }}
      </div>

      <!-- ── Actions ────────────────────────────────────────────────────── -->
      <footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          v-if="mode === 'edit'"
          class="btn btn-ghost rounded-xl"
          type="button"
          @click="resetFromSelected"
        >
          Revert
        </button>
        <button
          v-else
          class="btn btn-ghost rounded-xl"
          type="button"
          @click="resetForAdd"
        >
          Reset
        </button>
        <button
          class="btn btn-success rounded-xl"
          type="button"
          :disabled="compositionStore.isSaving"
          @click="saveComposition"
        >
          <span
            v-if="compositionStore.isSaving"
            class="loading loading-spinner loading-sm"
          />
          {{ saveLabel }}
        </button>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCompositionStore } from '@/stores/compositionStore'
import { useUserStore } from '@/stores/userStore'

const props = withDefaults(defineProps<{ mode?: 'add' | 'edit' }>(), {
  mode: 'add',
})

const emit = defineEmits<{ saved: [] }>()

const compositionStore = useCompositionStore()
const userStore = useUserStore()

const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const mode = computed(() => props.mode)
const heading = computed(() =>
  mode.value === 'edit' ? 'Edit Composition' : 'New Composition',
)
const subtitle = computed(() =>
  mode.value === 'edit'
    ? 'Update the ingredients and outputs of this composition.'
    : 'Assemble ingredients from your creative library into a synthesis-ready record.',
)
const saveLabel = computed(() =>
  mode.value === 'edit' ? 'Save Changes' : 'Save Composition',
)

onMounted(async () => {
  await compositionStore.initialize()
  prepareForm()
})

watch(
  () => props.mode,
  () => prepareForm(),
)

function prepareForm() {
  if (mode.value === 'edit') {
    resetFromSelected()
    return
  }
  resetForAdd()
}

function resetForAdd() {
  compositionStore.startAddingModel()
  if (!Object.keys(compositionStore.form || {}).length) {
    compositionStore.form = {
      title: '',
      mode: 'both',
      isPublic: true,
      isMature: false,
      userId: userStore.userId || 10,
    }
  }
  statusMessage.value = ''
}

function resetFromSelected() {
  if (!compositionStore.selected) return
  compositionStore.form = compositionStore.toModelForm(
    compositionStore.selected,
  )
  statusMessage.value = ''
}

async function saveComposition() {
  if (mode.value === 'edit' && !compositionStore.form.id) {
    statusTone.value = 'error'
    statusMessage.value = 'No composition selected or invalid ID.'
    return
  }

  if (!compositionStore.form.title?.trim()) {
    statusTone.value = 'error'
    statusMessage.value = 'Please provide a title.'
    return
  }

  const hasIngredient =
    compositionStore.form.characterId ||
    compositionStore.form.dreamId ||
    compositionStore.form.scenarioId ||
    compositionStore.form.pitchId ||
    compositionStore.form.rewardId ||
    compositionStore.form.characterBlurb?.trim() ||
    compositionStore.form.dreamBlurb?.trim() ||
    compositionStore.form.scenarioBlurb?.trim() ||
    compositionStore.form.pitchBlurb?.trim() ||
    compositionStore.form.rewardBlurb?.trim()

  if (!hasIngredient) {
    statusTone.value = 'error'
    statusMessage.value =
      'Add at least one ingredient (link or blurb) before saving.'
    return
  }

  try {
    compositionStore.form = {
      ...compositionStore.form,
      userId: compositionStore.form.userId || userStore.userId || 10,
    }

    const saved = await compositionStore.saveModel()
    if (!saved || saved.success === false) {
      throw new Error(compositionStore.error || 'Failed to save composition.')
    }

    statusTone.value = 'success'
    statusMessage.value =
      mode.value === 'edit'
        ? 'Composition updated successfully.'
        : 'Composition saved successfully.'

    emit('saved')
  } catch (error) {
    console.error('Failed to save composition:', error)
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to save composition.'
  }
}
</script>
