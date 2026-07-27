<!-- /components/giftshop/mermaids-pdf-purchase.vue -->
<template>
  <div class="mt-1 flex flex-col gap-2">
    <div
      v-if="notice"
      class="rounded-xl border p-2 text-xs font-medium"
      :class="
        notice === 'success'
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-warning/40 bg-warning/10 text-warning'
      "
    >
      {{
        notice === 'success'
          ? '🧜 Purchase complete — your download is ready below.'
          : 'Checkout cancelled. No charge was made.'
      }}
    </div>

    <div v-if="!userStore.isLoggedIn" class="flex flex-wrap items-center gap-2">
      <span
        class="badge badge-outline badge-lg gap-1 rounded-2xl text-xs text-base-content/70"
      >
        <Icon name="kind-icon:sparkles" class="h-3.5 w-3.5" />
        PDF edition — $9.99
      </span>
      <NuxtLink to="/login" class="btn btn-outline btn-sm rounded-2xl">
        Log in to buy the PDF
      </NuxtLink>
    </div>

    <div v-else-if="checkingOwnership" class="text-xs text-base-content/50">
      Checking your library...
    </div>

    <div v-else-if="owned" class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="btn btn-success btn-sm rounded-2xl"
        :disabled="downloading"
        @click="download"
      >
        <Icon name="kind-icon:download" class="h-4 w-4" />
        {{ downloading ? 'Preparing download...' : 'Download PDF' }}
      </button>
    </div>

    <div v-else class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="btn btn-primary btn-sm rounded-2xl"
        :disabled="purchasing"
        @click="purchase"
      >
        <Icon name="kind-icon:cart" class="h-4 w-4" />
        {{ purchasing ? 'Redirecting to checkout...' : 'Buy PDF — $9.99' }}
      </button>
    </div>

    <p v-if="error" class="text-xs text-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

const PRODUCT_SLUG = 'mermaids-of-venice-pdf'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const owned = ref(false)
const checkingOwnership = ref(false)
const purchasing = ref(false)
const downloading = ref(false)
const error = ref('')
const notice = ref<'success' | 'cancelled' | null>(null)

onMounted(async () => {
  const purchaseQuery = route.query.purchase
  if (purchaseQuery === 'success' || purchaseQuery === 'cancelled') {
    notice.value = purchaseQuery
    const { purchase: _drop, ...restQuery } = route.query
    router.replace({ query: restQuery })
  }

  if (userStore.isLoggedIn) {
    await checkOwnership()
  }
})

async function checkOwnership() {
  checkingOwnership.value = true
  try {
    const result = await performFetch<{ slugs: string[] }>(
      '/api/store/entitlements',
    )
    if (result.success && result.data) {
      owned.value = result.data.slugs.includes(PRODUCT_SLUG)
    }
  } finally {
    checkingOwnership.value = false
  }
}

async function purchase() {
  purchasing.value = true
  error.value = ''
  try {
    const result = await performFetch<{ url: string }>(
      '/api/store/product-checkout',
      {
        method: 'POST',
        body: JSON.stringify({ slug: PRODUCT_SLUG }),
      },
    )

    if (!result.success || !result.data?.url) {
      error.value = result.message || 'Checkout failed. Please try again.'
      return
    }

    if (import.meta.client) {
      window.location.href = result.data.url
    }
  } finally {
    purchasing.value = false
  }
}

// A plain <a href> download link can't carry the Bearer auth header
// (performFetch's convention — see stores/utils.ts), so the file is fetched
// as an authenticated blob and saved via a throwaway object URL instead.
async function download() {
  downloading.value = true
  error.value = ''
  try {
    const response = await fetch(`/api/store/download/${PRODUCT_SLUG}`, {
      headers: userStore.token
        ? { Authorization: `Bearer ${userStore.token}` }
        : {},
    })

    if (!response.ok) {
      error.value = 'Download failed. Please try again.'
      return
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = 'mermaids-of-venice.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } finally {
    downloading.value = false
  }
}
</script>
