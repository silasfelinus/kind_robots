<!-- /components/dominion/edit-dominion.vue -->
<template>
  <div
    class="bg-base-100 rounded-2xl p-6 w-full max-w-2xl shadow-xl border border-base-content/10"
  >
    <h2 class="text-2xl font-bold mb-4 text-center">Edit Dominion</h2>

    <div class="grid gap-4">
      <label class="form-control">
        <span class="label-text">Title</span>
        <input
          v-model="store.form.title"
          class="input input-bordered"
          placeholder="Tidal Market"
        />
      </label>

      <div class="grid grid-cols-2 gap-4">
        <label class="form-control">
          <span class="label-text">Slug</span>
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
      </div>

      <label class="form-control">
        <span class="label-text">Rules Text (description)</span>
        <textarea
          v-model="store.form.description"
          class="textarea textarea-bordered"
          rows="3"
          placeholder="+2 Actions. You may discard a card for +$2."
        />
      </label>

      <label class="form-control">
        <span class="label-text">Flavor Line (italics)</span>
        <textarea
          v-model="store.form.italics"
          class="textarea textarea-bordered"
          rows="2"
          placeholder="“The sea gives, the sea takes.”"
        />
      </label>

      <div class="grid grid-cols-2 gap-4">
        <label class="form-control">
          <span class="label-text">Types (comma-separated)</span>
          <input
            v-model="typesText"
            @blur="syncTypes"
            class="input input-bordered"
            placeholder="Action, Attack, Duration"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Keywords (comma-separated)</span>
          <input
            v-model="keywordsText"
            @blur="syncKeywords"
            class="input input-bordered"
            placeholder="Gain, Trash, Discard"
          />
        </label>
      </div>

      <div class="grid grid-cols-3 gap-4">
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
          <span class="label-text">Set ID</span>
          <input
            v-model="store.form.setId"
            class="input input-bordered"
            placeholder="fanpack-alpha"
          />
        </label>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <label class="form-control">
          <span class="label-text">Version</span>
          <input
            v-model.number="store.form.version"
            type="number"
            min="1"
            class="input input-bordered"
          />
        </label>

        <label class="form-control">
          <span class="label-text">Visibility</span>
          <select v-model="store.form.isPublic" class="select select-bordered">
            <option :value="true">Public</option>
            <option :value="false">Private</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text">Is Duration?</span>
          <select
            v-model="store.form.isDuration"
            class="select select-bordered"
          >
            <option :value="false">No</option>
            <option :value="true">Yes</option>
          </select>
        </label>
      </div>

      <div class="grid grid-cols-5 gap-3">
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
          <span class="label-text">+$</span>
          <input
            v-model.number="store.form.coinAdd"
            type="number"
            class="input input-bordered"
          />
        </label>
        <label class="form-control">
          <span class="label-text">VP</span>
          <input
            v-model.number="store.form.victoryAdd"
            type="number"
            class="input input-bordered"
          />
        </label>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <label class="form-control">
          <span class="label-text">Cost (Coins)</span>
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

    <div class="flex justify-end mt-6 gap-2">
      <button class="btn btn-outline btn-sm" @click="$emit('close')">
        Cancel
      </button>
      <button class="btn btn-primary btn-sm" @click="handleSave">Save</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useDominionStore } from '~/stores/dominionStore'

const store = useDominionStore()
const emit = defineEmits(['close'])

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

async function handleSave() {
  const res = await store.save()
  if (res.success) emit('close')
}

onMounted(() => {
  // initialize sane defaults for numeric fields if undefined
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
})
</script>
