<!-- /components/dominions/add-dominion.vue -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">
        {{ store.form.id ? 'Edit Dominion Card' : 'Create Dominion Card' }}
      </h2>
      <div class="flex gap-2">
        <button class="btn btn-ghost" type="button" @click="resetForm">
          Reset
        </button>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="submitting || !store.form.title || !store.form.effects"
          @click="handleSubmit"
        >
          {{
            submitting ? 'Saving…' : store.form.id ? 'Save Changes' : 'Create'
          }}
        </button>
      </div>
    </header>

    <!-- Alerts -->
    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <!-- Top: Title / Slug / Designer / Visibility -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <label class="form-control">
        <span class="label-text">Title *</span>
        <input
          v-model="store.form.title"
          class="input input-bordered"
          placeholder="Card title"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Slug (optional)</span>
        <input
          v-model="store.form.slug"
          class="input input-bordered"
          placeholder="auto-generated if blank"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Designer (credit)</span>
        <input
          v-model="store.form.designer"
          class="input input-bordered"
          placeholder="Your name or handle"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Public?</span>
        <input
          v-model="store.form.isPublic"
          type="checkbox"
          class="toggle toggle-primary"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Mature?</span>
        <input v-model="store.form.isMature" type="checkbox" class="toggle" />
      </label>

      <label class="form-control">
        <span class="label-text">Set / Expansion ID (optional)</span>
        <input
          v-model="store.form.setId"
          class="input input-bordered"
          placeholder="e.g., fan-expansion-1"
        />
      </label>
    </div>

    <!-- Middle A: Description / Italics / Notes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="form-control">
        <span class="label-text">Description (optional)</span>
        <textarea
          v-model="store.form.description"
          class="textarea textarea-bordered min-h-28"
          placeholder="What the card is about, flavor summary..."
        />
      </label>

      <div class="grid grid-rows-2 gap-4">
        <label class="form-control">
          <span class="label-text">Italic Text (optional)</span>
          <input
            v-model="store.form.italics"
            class="input input-bordered"
            placeholder="Short italicized flavor line"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Notes (optional)</span>
          <input
            v-model="store.form.notes"
            class="input input-bordered"
            placeholder="Design notes / playtest notes"
          />
        </label>
      </div>
    </div>

    <!-- Middle B: Theme color / Icon / Art refs / Version -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-4">
        <label class="form-control">
          <span class="label-text">Color (theming only)</span>
          <input
            v-model="store.form.color"
            class="input input-bordered"
            placeholder="blue | green | gold"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Icon (optional)</span>
          <div class="flex gap-3 items-center">
            <input
              v-model="store.form.icon"
              class="input input-bordered flex-1"
              placeholder="e.g., kind-icon:castle or mdi:castle"
            />
            <Icon
              :name="store.form.icon || 'kind-icon:card'"
              class="text-3xl"
            />
          </div>
          <p class="text-xs opacity-70 mt-1">
            Use any supported icon name. Leave blank to use the default card
            icon.
          </p>
        </label>

        <div class="grid grid-cols-3 gap-3">
          <label class="form-control">
            <span class="label-text">ArtImage ID</span>
            <input
              v-model.number="store.form.artImageId"
              type="number"
              class="input input-bordered"
            />
          </label>

          <label class="form-control">
            <span class="label-text">Art ID</span>
            <input
              v-model.number="store.form.artId"
              type="number"
              class="input input-bordered"
            />
          </label>

          <label class="form-control">
            <span class="label-text">Version</span>
            <input
              v-model.number="store.form.version"
              type="number"
              min="1"
              class="input input-bordered"
            />
          </label>
        </div>
      </div>

      <!-- Types / Keywords CSV -->
      <div class="space-y-4">
        <label class="form-control">
          <span class="label-text">Types (comma-separated)</span>
          <input
            v-model="typesText"
            class="input input-bordered"
            placeholder="Action, Attack, Duration"
          />
          <p class="text-xs opacity-70 mt-1">
            Stored as text to match the schema. Example:
            <code>Action, Attack, Duration</code>
          </p>
        </label>

        <label class="form-control">
          <span class="label-text">Keywords (comma-separated)</span>
          <input
            v-model="keywordsText"
            class="input input-bordered"
            placeholder="Trash, Gain, Remodel"
          />
          <p class="text-xs opacity-70 mt-1">
            Stored as text to match the schema. Example:
            <code>Trash, Gain, Remodel</code>
          </p>
        </label>
      </div>
    </div>

    <!-- Costs / Adds -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div class="card bg-base-200 p-4 space-y-3">
        <h3 class="font-semibold">Costs</h3>
        <div class="grid grid-cols-3 gap-3">
          <label class="form-control">
            <span class="label-text">Coins</span>
            <input
              v-model.number="store.form.priceCoins"
              type="number"
              min="0"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">Debt</span>
            <input
              v-model.number="store.form.priceDebt"
              type="number"
              min="0"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">Potion</span>
            <input
              v-model.number="store.form.pricePotion"
              type="number"
              min="0"
              class="input input-bordered"
            />
          </label>
        </div>
      </div>

      <div class="card bg-base-200 p-4 space-y-3">
        <h3 class="font-semibold">Gains (+)</h3>
        <div class="grid grid-cols-5 gap-3">
          <label class="form-control">
            <span class="label-text">+Cards</span>
            <input
              v-model.number="store.form.cardAdd"
              type="number"
              min="0"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">+Actions</span>
            <input
              v-model.number="store.form.actionAdd"
              type="number"
              min="0"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">+Buys</span>
            <input
              v-model.number="store.form.buyAdd"
              type="number"
              min="0"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">+Coins</span>
            <input
              v-model.number="store.form.coinAdd"
              type="number"
              min="0"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">+VP</span>
            <input
              v-model.number="store.form.victoryAdd"
              type="number"
              min="0"
              class="input input-bordered"
            />
          </label>
        </div>
      </div>

      <div class="card bg-base-200 p-4 space-y-3">
        <h3 class="font-semibold">Duration</h3>
        <label class="form-control">
          <span class="label-text">Is Duration?</span>
          <input
            v-model="store.form.isDuration"
            type="checkbox"
            class="toggle"
          />
        </label>
        <label v-if="store.form.isDuration" class="form-control">
          <span class="label-text">Duration JSON (optional)</span>
          <textarea
            v-model="store.form.durationJSON"
            class="textarea textarea-bordered min-h-28"
            placeholder='e.g. {"nextTurn": { "cards": 1, "actions": 1 }}'
          />
        </label>
      </div>
    </div>

    <!-- Effects (rules text) -->
    <label class="form-control">
      <span class="label-text">Effects / Rules Text *</span>
      <textarea
        v-model="store.form.effects"
        class="textarea textarea-bordered min-h-40"
        placeholder="Exact card text and instructions."
      />
    </label>

    <!-- Setup text -->
    <label class="form-control">
      <span class="label-text">Setup Text (optional)</span>
      <input
        v-model="store.form.setupText"
        class="input input-bordered"
        placeholder="Setup instructions shown when the game starts"
      />
    </label>

    <!-- Footer actions -->
    <div class="flex items-center justify-end gap-2">
      <button class="btn btn-ghost" type="button" @click="resetForm">
        Reset
      </button>
      <button
        class="btn btn-primary"
        type="button"
        :disabled="submitting || !store.form.title || !store.form.effects"
        @click="handleSubmit"
      >
        {{ submitting ? 'Saving…' : store.form.id ? 'Save Changes' : 'Create' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Path: /components/dominions/add-dominion.vue
 * - Prisma schema is source of truth. `types`/`keywords` are String: keep CSV.
 * - Normalize empty icon "" to null.
 * - Provide sensible numeric defaults and booleans.
 */
import { ref, watch, onMounted } from 'vue'
import { useDominionStore } from '~/stores/dominionStore'
import { useUserStore } from '@/stores/userStore'

const store = useDominionStore()
const userStore = useUserStore()

const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const submitting = ref(false)

const typesText = ref('') // CSV string for UI
const keywordsText = ref('') // CSV string for UI

function normalizeCsvString(s: string | null | undefined): string {
  const parts = (s || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  return parts.join(', ')
}

function seedDefaults() {
  store.form.cardAdd ??= 0
  store.form.actionAdd ??= 0
  store.form.buyAdd ??= 0
  store.form.coinAdd ??= 0
  store.form.victoryAdd ??= 0
  store.form.priceCoins ??= 0
  store.form.priceDebt ??= 0
  store.form.pricePotion ??= 0
  store.form.version ??= 1
  store.form.isPublic ??= true
  store.form.isMature ??= false
  store.form.isDuration ??= false
  store.form.userId ??= userStore.user?.id ?? 10
}

function syncTypes() {
  store.form.types = normalizeCsvString(typesText.value)
}
function syncKeywords() {
  store.form.keywords = normalizeCsvString(keywordsText.value)
}

watch(typesText, syncTypes)
watch(keywordsText, syncKeywords)

watch(
  () => store.form.id,
  () => {
    typesText.value = normalizeCsvString(store.form.types as any)
    keywordsText.value = normalizeCsvString(store.form.keywords as any)
    if (store.form.icon === '') store.form.icon = null as any
  },
  { immediate: true },
)

async function handleSubmit() {
  errorMessage.value = null
  successMessage.value = null
  submitting.value = true

  try {
    // final guard before save
    syncTypes()
    syncKeywords()
    if (store.form.icon === '') store.form.icon = null as any

    const result = await store.save()
    if (result.success) {
      successMessage.value = store.form.id
        ? 'Dominion updated!'
        : 'Dominion created!'
    } else {
      errorMessage.value = result.message || 'Failed to save dominion.'
    }
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to save dominion.'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  // Clear messages
  errorMessage.value = null
  successMessage.value = null

  // Clear selection + form object via store API
  store.deselect()

  // Seed Prisma-compliant defaults
  seedDefaults()

  // Reset CSV UI fields
  typesText.value = normalizeCsvString(store.form.types as any)
  keywordsText.value = normalizeCsvString(store.form.keywords as any)

  if (store.form.icon === '') store.form.icon = null as any
}

onMounted(async () => {
  await store.initialize()
  seedDefaults()

  // seed UI fields from current form
  typesText.value = normalizeCsvString(store.form.types as any)
  keywordsText.value = normalizeCsvString(store.form.keywords as any)

  if (store.form.icon === '') store.form.icon = null as any
})
</script>
