<!-- /components/content/giftshop/giftshop-interact.vue -->
<template>
  <section class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div class="kr-panel p-4">
      <div class="flex flex-col gap-5">
        <header
          class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <Icon name="kind-icon:gift" class="kr-icon-primary-7" />

              <h2 class="kr-text-black-2xl text-primary sm:text-3xl">
                Swarm Giftshop
              </h2>

              <div class="badge badge-accent badge-outline">
                Butterfly approved
              </div>
            </div>

            <p class="max-w-3xl text-base-content/75">
              Real things you can buy now, plus a preview of the print-on-demand
              catalog already wired into Kind Robots.
            </p>
          </div>

          <button type="button" class="kr-btn-primary-md-2xl" @click="goToCart">
            <Icon name="kind-icon:cart" class="kr-icon-4" />
            Cart
            <span v-if="cartStore.totalItems" class="kr-badge-secondary">
              {{ cartStore.totalItems }}
            </span>
          </button>
        </header>

        <section class="space-y-3">
          <div class="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p class="kr-text-eyebrow text-primary">Available now</p>
              <h3 class="kr-text-black-xl text-base-content">
                Buy, support, or download
              </h3>
            </div>

            <span class="kr-text-dim-xs">
              Actions live with the thing they describe.
            </span>
          </div>

          <div
            class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr))]"
          >
            <article
              v-if="tokensCatalogEntry"
              class="flex min-h-52 flex-col kr-panel-muted-md"
            >
              <div class="flex items-start justify-between gap-3">
                <div
                  class="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary"
                >
                  <Icon name="kind-icon:jellybean" class="kr-icon-6" />
                </div>
                <span class="kr-badge-primary-sm">
                  ${{ tokensCatalogEntry.price.toFixed(2) }}
                </span>
              </div>

              <h4 class="kr-text-black-primary mt-4">
                {{ tokensCatalogEntry.label }}
              </h4>
              <p class="kr-text-dim-sm-70 mt-1 line-clamp-3">
                {{ tokensCatalogEntry.description }}
              </p>

              <button
                type="button"
                class="btn btn-primary btn-sm mt-auto rounded-2xl"
                @click="addCatalogItem(tokensCatalogEntry)"
              >
                <Icon name="kind-icon:plus" class="kr-icon-4" />
                Add to cart
              </button>
            </article>

            <article
              v-if="donationCatalogEntry"
              class="flex min-h-52 flex-col kr-panel-muted-md"
            >
              <div class="flex items-start justify-between gap-3">
                <div
                  class="flex size-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"
                >
                  <Icon name="kind-icon:hand-heart" class="kr-icon-6" />
                </div>
                <span class="kr-badge-secondary">
                  ${{ donationCatalogEntry.price.toFixed(2) }}
                </span>
              </div>

              <h4 class="kr-text-black-primary mt-4">AMF add-on</h4>
              <p class="kr-text-dim-sm-70 mt-1 line-clamp-3">
                Add a one-dollar Against Malaria Foundation-designated donation
                to this cart.
              </p>

              <div class="mt-auto flex flex-wrap gap-2">
                <NuxtLink
                  to="/giving"
                  class="btn btn-secondary btn-sm rounded-2xl"
                >
                  <Icon name="kind-icon:gift" class="kr-icon-4" />
                  Give directly
                </NuxtLink>

                <button
                  type="button"
                  class="btn btn-outline btn-sm rounded-2xl"
                  @click="addCatalogItem(donationCatalogEntry)"
                >
                  <Icon name="kind-icon:plus" class="kr-icon-4" />
                  Add $1
                </button>
              </div>
            </article>

            <article class="flex min-h-52 flex-col kr-panel-muted-md">
              <div class="flex items-start justify-between gap-3">
                <div
                  class="flex size-11 items-center justify-center rounded-2xl bg-accent/15 text-accent"
                >
                  <Icon name="kind-icon:rocket" class="kr-icon-6" />
                </div>
                <span class="kr-badge-ghost-sm">Monthly</span>
              </div>

              <h4 class="kr-text-black-primary mt-4">Support Kind Robots</h4>
              <p class="kr-text-dim-sm-70 mt-1 line-clamp-3">
                Help cover servers, art generation, stories, and continued
                development with a recurring supporter plan.
              </p>

              <NuxtLink
                to="/giving#monthly-support"
                class="btn btn-accent btn-sm mt-auto rounded-2xl"
              >
                <Icon name="kind-icon:hand-heart" class="kr-icon-4" />
                View supporter plans
              </NuxtLink>
            </article>

            <article class="flex min-h-52 flex-col kr-panel-muted-md">
              <div class="flex items-start justify-between gap-3">
                <div
                  class="flex size-11 items-center justify-center rounded-2xl bg-info/15 text-info"
                >
                  <Icon name="kind-icon:book" class="kr-icon-6" />
                </div>
                <span class="kr-badge-ghost-sm">Digital</span>
              </div>

              <h4 class="kr-text-black-primary mt-4">Mermaids of Venice</h4>
              <p class="kr-text-dim-sm-70 mt-1 line-clamp-3">
                The entitlement-backed PDF edition is already wired for
                purchase and secure download.
              </p>

              <NuxtLink
                to="/mermaids"
                class="btn btn-outline btn-sm mt-auto rounded-2xl"
              >
                <Icon name="kind-icon:book" class="kr-icon-4" />
                View the book
              </NuxtLink>
            </article>
          </div>
        </section>

        <section class="space-y-3">
          <div class="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p class="kr-text-eyebrow text-secondary">Print your art</p>
              <h3 class="kr-text-black-xl text-base-content">
                Posters, shirts, stickers, and mugs
              </h3>
            </div>

            <span class="kr-badge-ghost-sm">POD preview</span>
          </div>

          <p class="kr-text-dim-sm-70 max-w-3xl">
            These are the physical product types already represented by the
            cart and PrintJob pipeline. The Printful vendor submission is still
            the remaining fulfillment gate, so the catalog is visible now
            without pretending an unfulfillable order is ready to ship.
          </p>

          <div
            class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(13rem,100%),1fr))]"
          >
            <article
              v-for="item in physicalCatalog"
              :key="item.id"
              class="overflow-hidden rounded-2xl border border-base-300 bg-base-100"
            >
              <div
                class="relative flex h-44 items-center justify-center overflow-hidden bg-base-200"
              >
                <div
                  v-if="item.type === 'print'"
                  class="relative h-36 w-28 rounded-sm bg-base-100 p-2 shadow-xl ring-1 ring-base-content/15"
                >
                  <img
                    :src="previewImageSrc"
                    :alt="'Poster mockup using ' + previewArtLabel"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div
                  v-else-if="item.type === 'shirt'"
                  class="relative flex size-36 items-center justify-center"
                >
                  <Icon
                    name="kind-icon:shirt"
                    class="absolute size-36 text-base-content/25"
                    aria-hidden="true"
                  />
                  <img
                    :src="previewImageSrc"
                    :alt="'Shirt mockup using ' + previewArtLabel"
                    class="relative mt-3 size-12 rounded-md border border-base-300 object-cover shadow"
                    loading="lazy"
                  />
                </div>

                <div
                  v-else-if="item.type === 'mug'"
                  class="relative flex size-36 items-center justify-center"
                >
                  <Icon
                    name="kind-icon:mug"
                    class="absolute size-36 text-base-content/25"
                    aria-hidden="true"
                  />
                  <img
                    :src="previewImageSrc"
                    :alt="'Mug mockup using ' + previewArtLabel"
                    class="relative mr-5 size-12 rounded-md border border-base-300 object-cover shadow"
                    loading="lazy"
                  />
                </div>

                <div
                  v-else
                  class="-rotate-6 rounded-2xl border-4 border-base-100 bg-base-100 p-1 shadow-xl"
                >
                  <img
                    :src="previewImageSrc"
                    :alt="'Sticker mockup using ' + previewArtLabel"
                    class="size-24 rounded-xl object-cover"
                    loading="lazy"
                  />
                </div>

                <Icon
                  :name="productIcon(item.type)"
                  class="absolute left-3 top-3 size-6 text-base-content/35"
                  aria-hidden="true"
                />

                <span
                  class="absolute bottom-2 right-2 rounded-full bg-base-100/90 px-2 py-1 text-xs font-black text-base-content shadow backdrop-blur"
                >
                  ${{ item.price.toFixed(2) }}
                </span>
              </div>

              <div class="flex min-h-44 flex-col p-4">
                <h4 class="kr-text-black-primary">
                  {{ item.label }}
                </h4>
                <p class="kr-text-dim-sm-70 mt-1 line-clamp-2">
                  {{ item.description }}
                </p>

                <NuxtLink
                  to="/art"
                  class="btn btn-outline btn-sm mt-auto rounded-2xl"
                >
                  <Icon name="kind-icon:image" class="kr-icon-4" />
                  Choose art
                </NuxtLink>
              </div>
            </article>
          </div>

          <div v-if="featuredArt.length" class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <h4 class="kr-text-black-primary">Featured art previews</h4>
              <span class="kr-text-dim-xs">
                Pick one to update the product mockups.
              </span>
            </div>

            <div
              class="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(6rem,1fr))]"
            >
              <button
                v-for="art in featuredArt"
                :key="art.id"
                type="button"
                class="group overflow-hidden rounded-2xl border bg-base-100 p-1 text-left transition"
                :class="
                  previewArt?.id === art.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-base-300 hover:border-primary/50'
                "
                @click="selectedPreviewArt = art"
              >
                <img
                  :src="resolveArtImageThumbSrc(art)"
                  :alt="art.promptString || 'Featured storefront art'"
                  class="aspect-square w-full rounded-xl object-cover"
                  loading="lazy"
                />
              </button>
            </div>
          </div>
        </section>

        <section v-if="featuredArt.length" class="space-y-3">
          <div class="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p class="kr-text-eyebrow text-primary">Featured prints</p>
              <h3 class="kr-text-black-xl text-base-content">
                Curated storefront art
              </h3>
            </div>
          </div>

          <div
            class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(14rem,100%),1fr))]"
          >
            <article
              v-for="art in featuredArt"
              :key="art.id"
              class="overflow-hidden rounded-2xl border border-base-300 bg-base-200"
            >
              <img
                :src="resolveArtImageThumbSrc(art)"
                :alt="art.promptString || 'Featured print'"
                class="h-44 w-full object-cover"
                loading="lazy"
              />

              <div class="flex min-h-36 flex-col gap-2 p-4">
                <p class="kr-text-dim-sm-70 line-clamp-2">
                  {{ art.promptString || 'Featured print' }}
                </p>

                <button
                  v-if="printCatalogEntry"
                  type="button"
                  class="btn btn-sm btn-outline mt-auto rounded-2xl"
                  @click="addFeaturedPrint(art)"
                >
                  <Icon name="kind-icon:plus" class="kr-icon-4" />
                  Add print · ${{ printCatalogEntry.price.toFixed(2) }}
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <aside class="kr-panel self-start p-4 lg:sticky lg:top-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="kr-text-black-xl text-primary">Cart Nest</h3>

          <p class="kr-text-dim-sm-70">
            Guarded by three butterflies and one emotionally available receipt
            printer.
          </p>
        </div>

        <Icon name="kind-icon:cart" class="kr-icon-8 text-secondary" />
      </div>

      <div class="mt-4 grid gap-3">
        <div class="kr-panel-muted-md">
          <div class="kr-text-dim-sm">Items</div>

          <div class="kr-text-black-primary text-3xl">
            {{ cartStore.totalItems }}
          </div>
        </div>

        <div class="kr-panel-muted-md">
          <div class="kr-text-dim-sm">Total</div>

          <div class="text-3xl font-black text-secondary">
            ${{ cartStore.formattedTotalPrice }}
          </div>
        </div>

        <button type="button" class="kr-btn-primary-md-2xl" @click="goToCart">
          <Icon name="kind-icon:cart" class="kr-icon-4" />
          Review cart
        </button>

        <button
          type="button"
          class="kr-btn-ghost-md-2xl"
          :disabled="!cartStore.hasItems"
          @click="cartStore.clearCart()"
        >
          <Icon name="kind-icon:trash" class="kr-icon-4" />
          Release cart butterflies
        </button>

        <p
          v-if="cartStore.lastError"
          class="kr-text-error-sm rounded-2xl border border-error/30 bg-error/10 p-3"
        >
          {{ cartStore.lastError }}
        </p>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cartStore'
import { performFetch } from '@/stores/utils'
import {
  resolveArtImageSrc,
  resolveArtImageThumbSrc,
} from '@/utils/artImageSrc'
import { cartItems, type CartItem } from '@/stores/seeds/cartItems'
import type { ArtImage } from '~/prisma/generated/prisma/client'

type FeaturedArtImage = Pick<
  ArtImage,
  'id' | 'promptString' | 'imagePath' | 'path' | 'thumbnailPath' | 'cardPath'
>

const cartStore = useCartStore()
const router = useRouter()
const featuredArt = ref<FeaturedArtImage[]>([])
const selectedPreviewArt = ref<FeaturedArtImage | null>(null)

const tokensCatalogEntry = cartItems.find((item) => item.id === 'tokens')
const donationCatalogEntry = cartItems.find((item) => item.id === 'donation')
const printCatalogEntry = cartItems.find((item) => item.id === 'print')

const physicalCatalog = cartItems.filter(
  (item) =>
    item.needsArt &&
    ['print', 'shirt', 'sticker', 'mug'].includes(item.id),
)

const previewArt = computed(
  () => selectedPreviewArt.value ?? featuredArt.value[0] ?? null,
)

const previewImageSrc = computed(() => {
  return previewArt.value
    ? resolveArtImageThumbSrc(previewArt.value)
    : '/icon-512x512.png'
})

const previewArtLabel = computed(
  () => previewArt.value?.promptString || 'Kind Robots artwork',
)

onMounted(() => {
  void cartStore.initialize()
  void loadFeaturedArt()
})

async function loadFeaturedArt() {
  const response = await performFetch<FeaturedArtImage[]>(
    '/api/art/storefront-featured',
  )

  if (response.success && response.data) {
    featuredArt.value = response.data
  }
}

function productIcon(type: CartItem['type']): string {
  const icons: Partial<Record<CartItem['type'], string>> = {
    print: 'kind-icon:print',
    shirt: 'kind-icon:shirt',
    sticker: 'kind-icon:sticker',
    mug: 'kind-icon:mug',
  }

  return icons[type] ?? 'kind-icon:gift'
}

function addCatalogItem(item: CartItem) {
  if (item.needsArt) return

  cartStore.addItem({
    type: item.type,
    artImageId: 0,
    imageUrl: item.image,
    quantity: 1,
    price: item.price,
    notes: item.label,
  })
}

function addFeaturedPrint(art: FeaturedArtImage) {
  if (!printCatalogEntry) return

  cartStore.addItem({
    type: printCatalogEntry.type,
    artImageId: art.id,
    imageUrl: resolveArtImageSrc(art),
    quantity: 1,
    price: printCatalogEntry.price,
    notes: art.promptString || printCatalogEntry.label,
  })
}

function goToCart(): void {
  void router.push('/cart')
}
</script>
