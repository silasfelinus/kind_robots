<!-- /components/content/art/print-swag.vue -->
<template>
  <div class="space-y-4">
    <h3 class="text-lg font-bold">🖼️ Print Your Art</h3>

    <div class="flex justify-center">
      <img
        :src="imageUrl"
        alt="Selected Art"
        class="rounded-xl border border-base-300 max-h-48 object-contain"
      />
    </div>

    <div class="form-control">
      <label class="label font-semibold">🪄 Choose Product</label>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="type in printTypes"
          :key="type.id"
          @click="selectedType = type.id"
          :class="[
            'btn btn-sm justify-start flex items-center gap-2',
            selectedType === type.id ? 'btn-accent' : 'btn-outline',
          ]"
        >
          <Icon :name="type.icon" class="text-lg" />
          {{ type.label }}
        </button>
      </div>
    </div>

    <div class="form-control">
      <label class="label font-semibold">🎨 Use Different Art?</label>
      <input
        v-model="customImageUrl"
        class="input input-bordered w-full"
        placeholder="Paste a different image URL..."
      />
    </div>

    <div class="form-control">
      <label class="label font-semibold">🛒 Quantity</label>
      <input
        v-model.number="quantity"
        type="number"
        min="1"
        class="input input-bordered w-24"
      />
    </div>

    <p v-if="eligibility && !eligibility.eligible" class="text-sm text-error">
      🚫 Not eligible for print: {{ eligibility.reason }}
    </p>

    <button
      class="btn btn-primary w-full"
      :disabled="eligibility ? !eligibility.eligible : false"
      @click="addToCart"
    >
      ➕ Add to Cart
    </button>

    <button class="btn btn-ghost text-sm underline" @click="emit('close')">
      Cancel and Close
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{ artImageId?: number }>()
const emit = defineEmits(['close'])

const selectedType = ref('print')
const quantity = ref(1)
const customImageUrl = ref('')

type PrintEligibility = { eligible: boolean; reason: string }
const eligibility = ref<PrintEligibility | null>(null)

const printTypes = [
  { id: 'print', label: 'Art Print', icon: 'kind-icon:print' },
  { id: 'shirt', label: 'T-Shirt', icon: 'kind-icon:shirt' },
  { id: 'sticker', label: 'Sticker', icon: 'kind-icon:sticker' },
  { id: 'mug', label: 'Mug', icon: 'kind-icon:mug' },
]

const fallbackImage = '/images/art-placeholder.jpg'
const imageUrl = computed(() =>
  customImageUrl.value.trim()
    ? customImageUrl.value.trim()
    : props.artImageId
      ? `/api/media/art/${props.artImageId}`
      : fallbackImage,
)

// A custom-URL image (not one of the caller's own ArtImage rows) has no
// eligibility record to check against, so it is left ungated here.
watch(
  () => props.artImageId,
  async (artImageId) => {
    eligibility.value = null
    if (!artImageId) return

    try {
      const response = await $fetch<
        { success: boolean; data: PrintEligibility },
        string
      >(`/api/art/image/${artImageId}/print-eligibility`)
      eligibility.value = response.success ? response.data : null
    } catch {
      eligibility.value = null
    }
  },
  { immediate: true },
)

const addToCart = () => {
  console.log('🛍️ Add to cart:', {
    type: selectedType.value,
    image: imageUrl.value,
    quantity: quantity.value,
  })
  alert(`Added ${quantity.value} ${selectedType.value}(s) to cart!`)
}
</script>
