<!-- /components/dominion/add-dominion.vue -->
<template>
  <!-- ...unchanged header and first grid... -->

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="space-y-4">
      <!-- existing color input... -->
      <label class="form-control">
        <span class="label-text">Color (theming only)</span>
        <input
          v-model="store.form.color"
          class="input input-bordered"
          placeholder="blue | green | gold"
        />
      </label>

      <!-- ✅ NEW: Icon input + preview -->
      <label class="form-control">
        <span class="label-text">Icon (optional)</span>
        <div class="flex gap-3 items-center">
          <input
            v-model="store.form.icon"
            class="input input-bordered flex-1"
            placeholder="e.g., kind-icon:castle or mdi:castle"
          />
          <Icon :name="store.form.icon || 'kind-icon:card'" class="text-3xl" />
        </div>
        <p class="text-xs opacity-70 mt-1">
          Use any supported icon name (e.g. <code>kind-icon:castle</code>,
          <code>mdi:castle</code>). Leave blank to use the default card icon.
        </p>
      </label>

      <!-- existing ArtImage ID + Art ID + Version fields... -->
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

    <!-- right column in this grid remains as your current fields (or swap if you prefer) -->
    <!-- ... -->
  </div>

  <!-- ...rest of your form unchanged... -->
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

// ...existing watches...

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

  // ✅ Normalize empty string icon to null so PATCH/POST can clear it
  if (store.form.icon === '') store.form.icon = null as any

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
