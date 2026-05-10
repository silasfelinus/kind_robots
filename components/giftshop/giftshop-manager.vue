<!-- /components/content/shop/giftshop-manager.vue -->
<template>
  <dashboard-shell
    title="Giftshop"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Stocking shelves, checking carts, and negotiating with sticker goblins..."
    nav-grid-class="xl:grid-cols-3"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #actions>
      <div class="badge badge-primary gap-1">
        <Icon name="kind-icon:cart" class="h-3 w-3" />
        {{ cartStore.items.length }} in cart
      </div>
    </template>

    <template #default="{ activeTab: currentTab }">
      <div
        v-if="statusMessage"
        class="mb-4 rounded-2xl border p-3 text-sm"
        :class="
          statusTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ statusMessage }}
      </div>

      <section
        v-if="currentTab === 'overview' || currentTab === 'products'"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <article
          v-for="item in cartItems"
          :key="item.id"
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <div v-if="item.needsArt" class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <label class="label p-0 font-semibold">🎨 Upload Your Art</label>

              <button
                type="button"
                class="btn btn-xs btn-secondary rounded-xl"
                @click="activateUpload(item)"
              >
                <Icon name="kind-icon:image" class="h-4 w-4" />
                Choose
              </button>
            </div>

            <div
              class="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border bg-base-100"
            >
              <img
                v-if="customImages[item.id]"
                :src="customImages[item.id]"
                :alt="`${item.label} custom art`"
                class="h-full w-full object-contain"
              />

              <div
                v-else
                class="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-sm text-base-content/60"
              >
                <Icon name="kind-icon:image" class="h-8 w-8 text-primary" />
                <span>Upload art for this item</span>
              </div>
            </div>

            <image-upload
              v-if="activeUploadItemId === item.id"
              class="rounded-2xl bg-base-100"
            />

            <div
              v-if="customArtImageIds[item.id]"
              class="rounded-2xl border border-base-300 bg-base-100 px-3 py-2 text-xs text-base-content/60"
            >
              Linked ArtImage #{{ customArtImageIds[item.id] }}
            </div>
          </div>

          <img
            v-else
            :src="item.image ?? fallbackImage"
            :alt="item.label"
            class="h-40 w-full rounded-xl border bg-base-100 object-contain"
          />

          <div class="text-lg font-semibold">{{ item.label }}</div>

          <div class="text-sm text-base-content/70">
            {{ item.description }}
          </div>

          <div class="flex flex-col gap-1">
            <div class="text-sm font-medium">
              💰 ${{ item.price.toFixed(2) }}
            </div>
          </div>

          <div class="form-control">
            <label class="label font-semibold">🛒 Quantity</label>

            <input
              v-model.number="quantities[item.id]"
              type="number"
              min="1"
              class="input input-sm input-bordered w-24 rounded-xl"
            />
          </div>

          <button
            class="btn btn-primary btn-sm mt-auto rounded-xl"
            :disabled="item.needsArt && !customArtImageIds[item.id]"
            @click="addToCart(item)"
          >
            ➕ Add to Cart
          </button>
        </article>
      </section>

      <section
        v-else-if="currentTab === 'collections'"
        class="rounded-2xl border border-base-300 bg-base-200 p-4"
      >
        <collection-gallery :show-header="false" />
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown giftshop tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { cartItems, type CartItem } from '@/stores/seeds/cartItems'
import { useCartStore } from '@/stores/cartStore'
import { useNavStore } from '@/stores/navStore'
import { useUploadStore } from '@/stores/uploadStore'

const dashboardKey = 'giftshop' as const

const cartStore = useCartStore()
const navStore = useNavStore()
const uploadStore = useUploadStore()

const fallbackImage = '/images/backtree.webp'

const activeUploadItemId = ref<string | null>(null)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const customImages = reactive<Record<string, string>>({})
const customArtImageIds = reactive<Record<string, number>>({})
const customArtIds = reactive<Record<string, number>>({})

const quantities = reactive<Record<string, number>>(
  Object.fromEntries(cartItems.map((item) => [item.id, 1])),
)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const uploadReadyCount = computed(() => {
  return cartItems.filter((item) => {
    return !item.needsArt || customArtImageIds[item.id]
  }).length
})

const managerSummary = computed(() => {
  return `${cartItems.length} products available. ${uploadReadyCount.value} ready to add. ${cartStore.items.length} cart item(s) selected.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)
}

async function refreshManagerData() {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await navStore.initialize()
    statusTone.value = 'success'
    statusMessage.value = 'Giftshop refreshed.'
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to refresh giftshop.'
  } finally {
    isLoadingManager.value = false
  }
}

function activateUpload(item: CartItem) {
  activeUploadItemId.value = item.id
  statusMessage.value = ''

  uploadStore.setTarget({
    model: 'Art',
    modelId: null,
    galleryName: 'giftshopUploads',
    collectionLabel: 'giftshop',
    promptString: `[GiftShopImage:${item.label}]`,
    path: '[GiftShopImage]',
    buttonLabel: `Upload for ${item.label}`,
    icon: 'kind-icon:gift',
    showPreview: false,
    applyImage: async ({ artImageId, artId, imageData }) => {
      customArtImageIds[item.id] = artImageId
      customArtIds[item.id] = artId
      customImages[item.id] = imageData || item.image || fallbackImage

      statusTone.value = 'success'
      statusMessage.value = `${item.label} art uploaded.`
    },
  })
}

function addToCart(item: CartItem) {
  const quantity = Math.max(1, quantities[item.id] || 1)

  const imageUrl = item.needsArt
    ? customImages[item.id] || fallbackImage
    : item.image || fallbackImage

  const artImageId = item.needsArt ? customArtImageIds[item.id] || 0 : 0
  const artId = item.needsArt ? customArtIds[item.id] || 0 : 0

  if (item.needsArt && !artImageId) {
    statusTone.value = 'error'
    statusMessage.value = `Upload art before adding ${item.label} to the cart.`
    activateUpload(item)
    return
  }

  const payload = {
    id: `${item.id}-${Date.now()}`,
    type: item.type,
    artImageId,
    artId,
    imageUrl,
    quantity,
    price: item.price,
    notes: item.label,
  }

  cartStore.addItem(payload)

  statusTone.value = 'success'
  statusMessage.value = `Added ${quantity} × ${item.label} to cart.`
}
</script>
