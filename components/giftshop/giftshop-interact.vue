<!-- /components/content/giftshop/giftshop-interact.vue -->
<template>
  <section class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
    <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div class="flex flex-col gap-4">
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="min-w-0 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <Icon name="kind-icon:gift" class="h-7 w-7 text-primary" />

              <h3 class="text-2xl font-black text-primary sm:text-3xl">
                Swarm Giftshop
              </h3>

              <div class="badge badge-accent badge-outline">
                Butterfly approved
              </div>
            </div>

            <p class="max-w-3xl text-base-content/75">
              The butterflies have requisitioned this storefront for prints,
              tokens, support items, and artifacts of questionable but
              delightful utility. Accounting says this is normal. Accounting is
              also butterflies.
            </p>
          </div>

          <button
            type="button"
            class="btn btn-primary rounded-2xl"
            @click="goToCart"
          >
            <Icon name="kind-icon:cart" class="h-4 w-4" />
            Cart
            <span v-if="cartStore.totalItems" class="badge badge-secondary">
              {{ cartStore.totalItems }}
            </span>
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <article
            v-for="feature in giftshopFeatures"
            :key="feature.title"
            class="rounded-2xl border border-base-300 bg-base-200 p-4 transition hover:border-primary/50 hover:bg-primary/10"
          >
            <Icon :name="feature.icon" class="mb-3 h-7 w-7 text-secondary" />

            <h4 class="font-black text-base-content">
              {{ feature.title }}
            </h4>

            <p class="mt-1 text-sm leading-relaxed text-base-content/70">
              {{ feature.text }}
            </p>
          </article>
        </div>

        <div
          class="rounded-2xl border border-info/30 bg-info/10 p-4 text-sm text-info-content"
        >
          <div class="flex items-start gap-3">
            <Icon name="kind-icon:sparkles" class="mt-1 h-5 w-5 shrink-0" />

            <div class="space-y-1">
              <p class="font-black">Storefront staging area</p>

              <p>
                This is now the place to wire product cards, token packs, print
                options, and whatever AMI has classified as commercially
                whimsical.
              </p>
            </div>
          </div>
        </div>

        <div class="grid gap-3 xl:grid-cols-2">
          <article
            v-for="item in showcaseItems"
            :key="item.title"
            class="rounded-2xl border border-base-300 bg-base-200 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <h4 class="font-black text-primary">
                  {{ item.title }}
                </h4>

                <p class="text-sm text-base-content/70">
                  {{ item.text }}
                </p>
              </div>

              <Icon :name="item.icon" class="h-8 w-8 shrink-0 text-secondary" />
            </div>

            <button
              type="button"
              class="btn btn-sm btn-outline mt-4 rounded-2xl"
              @click="addDemoItem(item)"
            >
              <Icon name="kind-icon:plus" class="h-4 w-4" />
              Add demo item
            </button>
          </article>
        </div>
      </div>
    </div>

    <aside class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-xl font-black text-primary">Cart Nest</h3>

          <p class="text-sm text-base-content/70">
            Guarded by three butterflies and one emotionally available receipt
            printer.
          </p>
        </div>

        <Icon name="kind-icon:cart" class="h-8 w-8 text-secondary" />
      </div>

      <div class="mt-4 grid gap-3">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <div class="text-sm text-base-content/60">Items</div>

          <div class="text-3xl font-black text-primary">
            {{ cartStore.totalItems }}
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <div class="text-sm text-base-content/60">Total</div>

          <div class="text-3xl font-black text-secondary">
            ${{ cartStore.formattedTotalPrice }}
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary rounded-2xl"
          @click="goToCart"
        >
          <Icon name="kind-icon:cart" class="h-4 w-4" />
          Review cart
        </button>

        <button
          type="button"
          class="btn btn-ghost rounded-2xl"
          :disabled="!cartStore.hasItems"
          @click="cartStore.clearCart()"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          Release cart butterflies
        </button>

        <p
          v-if="cartStore.lastError"
          class="rounded-2xl border border-error/30 bg-error/10 p-3 text-sm text-error"
        >
          {{ cartStore.lastError }}
        </p>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCartStore, type CartItem } from '@/stores/cartStore'
import { useNavStore } from '@/stores/navStore'

type GiftshopFeature = {
  title: string
  icon: string
  text: string
}

type ShowcaseItem = {
  title: string
  icon: string
  text: string
  type: CartItem['type']
  artImageId: number
  imageUrl: string
  price: number
}

const cartStore = useCartStore()
const navStore = useNavStore()

const giftshopFeatures: GiftshopFeature[] = [
  {
    title: 'Prints',
    icon: 'kind-icon:image',
    text: 'Turn favorite generated art into real-world wall bait.',
  },
  {
    title: 'Tokens',
    icon: 'kind-icon:jellybean',
    text: 'Fuel experiments, generations, and future robot nonsense.',
  },
  {
    title: 'Support',
    icon: 'kind-icon:hand-heart',
    text: 'Help the swarm fund both the site and the malaria mission.',
  },
]

const showcaseItems: ShowcaseItem[] = [
  {
    title: 'Butterfly Print',
    icon: 'kind-icon:butterfly',
    text: 'A placeholder print item until product cards get their full royal parade.',
    type: 'print',
    artImageId: 1,
    imageUrl: '/images/butterfly-placeholder.webp',
    price: 12,
  },
  {
    title: 'Jellybean Token Pack',
    icon: 'kind-icon:jellybean',
    text: 'A tiny pile of imaginary nectar for keeping the robots politely caffeinated.',
    type: 'tokens',
    artImageId: 2,
    imageUrl: '/images/jellybean-placeholder.webp',
    price: 5,
  },
]

onMounted(() => {
  void cartStore.initialize()
})

function addDemoItem(item: ShowcaseItem) {
  cartStore.addItem({
    type: item.type,
    artImageId: item.artImageId,
    imageUrl: item.imageUrl,
    quantity: 1,
    price: item.price,
    notes: item.title,
  })

  goToCart()
}

function goToCart() {
  navStore.setDashboardTab?.('giftshop', 'cart')
}
</script>
