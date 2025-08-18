<!-- /components/dominion/add-dominion.vue -->
<template>
  <div
    class="rounded-2xl border p-6 m-4 mx-auto bg-base-200 max-w-5xl space-y-6"
  >
    <h1 class="text-4xl text-center font-bold">
      Create or Edit a Dominion Card
    </h1>

    <div class="flex flex-wrap justify-between items-center gap-4">
      <div class="flex-grow max-w-xs">
        <label class="block text-sm font-semibold mb-1">Owner</label>
        <p class="text-sm text-base-content/70">
          {{ userStore.user?.username || 'You' }}
        </p>
      </div>

      <div class="flex gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1">Visibility</label>
          <div class="flex space-x-2">
            <button
              type="button"
              class="btn btn-sm"
              :class="store.form.isPublic ? 'btn-primary' : 'btn-outline'"
              @click="store.form.isPublic = true"
            >
              Public
            </button>
            <button
              type="button"
              class="btn btn-sm"
              :class="!store.form.isPublic ? 'btn-primary' : 'btn-outline'"
              @click="store.form.isPublic = false"
            >
              Private
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-4">
        <label class="form-control">
          <span class="label-text">Title</span>
          <input
            v-model="store.form.title"
            class="input input-bordered"
            placeholder="e.g., Tidal Market"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Slug (optional)</span>
          <input
            v-model="store.form.slug"
            class="input input-bordered"
            placeholder="tidal-market"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Designer</span>
          <input
            v-model="store.form.designer"
            class="input input-bordered"
            placeholder="Kind Designer"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Set ID (optional)</span>
          <input
            v-model="store.form.setId"
            class="input input-bordered"
            placeholder="fanpack-alpha"
          />
        </label>
      </div>

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
          <span class="label-text">ArtImage ID (optional)</span>
          <input
            v-model.number="store.form.artImageId"
            type="number"
            class="input input-bordered"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Art ID (optional)</span>
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

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="form-control">
        <span class="label-text">Rules Text (description)</span>
        <textarea
          v-model="store.form.description"
          rows="4"
          class="textarea textarea-bordered"
          placeholder="+2 Actions. You may discard a card for +$2."
        />
      </label>

      <label class="form-control">
        <span class="label-text">Flavor Line (italics)</span>
        <textarea
          v-model="store.form.italics"
          rows="4"
          class="textarea textarea-bordered"
          placeholder="“The sea gives, the sea takes.”"
        />
      </label>
    </div>

    <div class="grid md:grid-cols-3 gap-4">
      <div class="space-y-2">
        <span class="font-semibold">Types</span>
        <div class="flex gap-2">
          <input
            v-model="typesText"
            @blur="syncTypes"
            class="input input-bordered flex-1"
            placeholder="Action, Attack, Duration"
          />
          <button class="btn btn-sm" @click="syncTypes">Set</button>
        </div>
        <p class="text-xs opacity-70">Comma-separated. Stored as string[].</p>
      </div>

      <div class="space-y-2">
        <span class="font-semibold">Keywords</span>
        <div class="flex gap-2">
          <input
            v-model="keywordsText"
            @blur="syncKeywords"
            class="input input-bordered flex-1"
            placeholder="Gain, Trash, Discard"
          />
          <button class="btn btn-sm" @click="syncKeywords">Set</button>
        </div>
        <p class="text-xs opacity-70">Comma-separated. Stored as string[].</p>
      </div>

      <div class="space-y-2">
        <span class="font-semibold">Duration?</span>
        <div class="form-control">
          <label class="label cursor-pointer flex items-center gap-3">
            <input
              v-model="store.form.isDuration"
              type="checkbox"
              class="toggle"
            />
            <span class="label-text">This card has next-turn effects</span>
          </label>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <h3 class="font-semibold">Bonuses</h3>
        <div class="grid grid-cols-2 gap-2">
          <label class="form-control">
            <span class="label-text">+Cards</span>
            <input
              v-model.number="store.form.cardAdd"
              type="number"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">+Actions</span>
            <input
              v-model.number="store.form.actionAdd"
              type="number"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">+Buys</span>
            <input
              v-model.number="store.form.buyAdd"
              type="number"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">+$ (Coins)</span>
            <input
              v-model.number="store.form.coinAdd"
              type="number"
              class="input input-bordered"
            />
          </label>
          <label class="form-control">
            <span class="label-text">Victory Points</span>
            <input
              v-model.number="store.form.victoryAdd"
              type="number"
              class="input input-bordered"
            />
          </label>
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="font-semibold">Cost</h3>
        <div class="grid grid-cols-3 gap-2">
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
              max="1"
              class="input input-bordered"
            />
          </label>
        </div>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="pt-4">
      <div v-if="store.loading" class="loading loading-ring loading-lg"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-green-500 mt-2">
        {{ successMessage }}
      </div>

      <button
        type="submit"
        class="btn btn-primary mt-4"
        :disabled="store.isSaving"
      >
        <span v-if="store.isSaving">Saving...</span>
        <span v-else>{{
          store.form.id ? 'Update Dominion' : 'Create Dominion'
        }}</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDominionStore } from '~/stores/dominionStore'
import { useUserStore } from '@/stores/userStore'

const store = useDominionStore()
const userStore = useUserStore()

const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const typesText = ref('')
const keywordsText = ref('')

watch(
  () => store.form.types,
  () => {
    typesText.value = Array.isArray(store.form.types)
      ? (store.form.types as string[]).join(', ')
      : ''
  },
  { immediate: true },
)
watch(
  () => store.form.keywords,
  () => {
    keywordsText.value = Array.isArray(store.form.keywords)
      ? (store.form.keywords as string[]).join(', ')
      : ''
  },
  { immediate: true },
)

function syncTypes() {
  store.form.types = (typesText.value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
function syncKeywords() {
  store.form.keywords = (keywordsText.value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

async function handleSubmit() {
  errorMessage.value = null
  successMessage.value = null
  const result = await store.save()
  if (result.success) {
    successMessage.value = store.form.id
      ? 'Dominion updated!'
      : 'Dominion created!'
  } else {
    errorMessage.value = result.message || 'Failed to save dominion.'
  }
}

onMounted(() => {
  // sensible defaults for numbers
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
  store.form.isDuration ??= false
  store.initialize()
})
</script>
