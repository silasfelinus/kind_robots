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

    <button class="btn btn-primary w-full" @click="addToCart">
      ➕ Add to Cart
    </button>

    <button class="btn btn-ghost text-sm underline" @click="emit('close')">
      Cancel and Close
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ artImageId?: number }>()
const emit = defineEmits(['close'])

const selectedType = ref('print')
const quantity = ref(1)
const customImageUrl = ref('')

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

const addToCart = () => {
  console.log('🛍️ Add to cart:', {
    type: selectedType.value,
    image: imageUrl.value,
    quantity: quantity.value,
  })
  alert(`Added ${quantity.value} ${selectedType.value}(s) to cart!`)
}
</script>
