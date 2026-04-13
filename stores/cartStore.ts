// /stores/cartStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { handleError, performFetch } from '@/stores/utils'

export interface CartItem {
  id: string
  type:
    | 'print'
    | 'shirt'
    | 'sticker'
    | 'mug'
    | 'book'
    | 'donation'
    | 'extra'
    | 'subscription'
    | 'tokens'
  artImageId: number
  imageUrl: string
  quantity: number
  price: number
  notes?: string
}

const isClient = typeof window !== 'undefined'

export const useCartStore = defineStore('cartStore', () => {
  const items = ref<CartItem[]>([])
  const isOpen = ref(false)
  const initialized = ref(false)

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity * item.price, 0),
  )

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const hasItems = computed(() => items.value.length > 0)

  const findItemIndex = (id: string) =>
    items.value.findIndex((item) => item.id === id)

  function initialize() {
    if (initialized.value) return
    loadFromLocalStorage()
    initialized.value = true
  }

  function addItem(newItem: Omit<CartItem, 'id'>) {
    const id = `${newItem.type}-${newItem.artImageId}`
    const index = findItemIndex(id)

    if (index !== -1) {
      items.value[index].quantity += newItem.quantity
      if (newItem.notes) {
        items.value[index].notes = newItem.notes
      }
      return
    }

    items.value.push({ ...newItem, id })
  }

  function removeItem(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function updateQuantity(id: string, quantity: number) {
    const index = findItemIndex(id)
    if (index === -1) return

    if (quantity <= 0) {
      removeItem(id)
      return
    }

    items.value[index].quantity = quantity
  }

  function clearCart() {
    items.value = []
  }

  function openCart() {
    isOpen.value = true
  }

  function closeCart() {
    isOpen.value = false
  }

  function toggleCart() {
    isOpen.value = !isOpen.value
  }

  function syncToLocalStorage() {
    if (!isClient) return

    try {
      localStorage.setItem('cartItems', JSON.stringify(items.value))
    } catch (error) {
      console.warn('[cartStore] Failed to sync to localStorage:', error)
    }
  }

  function loadFromLocalStorage() {
    if (!isClient) return

    try {
      const saved = localStorage.getItem('cartItems')
      if (!saved) return

      const parsed = JSON.parse(saved)
      if (!Array.isArray(parsed)) {
        localStorage.removeItem('cartItems')
        items.value = []
        return
      }

      items.value = parsed
    } catch (error) {
      handleError(error, 'loading cart')
      items.value = []
    }
  }

  async function checkout(userId: number) {
    try {
      const cartPayload = items.value.map((item) => ({
        id: item.type,
        quantity: item.quantity,
      }))

      const result = await performFetch<{ url: string }>(
        '/api/stripe/checkout',
        {
          method: 'POST',
          body: JSON.stringify({ userId, cart: cartPayload }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!result.success || !result.data?.url) {
        throw new Error(result.message || 'Failed to initiate checkout.')
      }

      if (isClient) {
        window.location.href = result.data.url
      }
    } catch (error) {
      console.error('[cartStore] Checkout error:', error)
      if (isClient) {
        alert('Checkout failed. Please try again later.')
      }
    }
  }

  async function subscribe(userId: number) {
    try {
      const result = await performFetch<{ url: string }>(
        '/api/stripe/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({ userId }),
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!result.success || !result.data?.url) {
        throw new Error(result.message || 'Subscription checkout failed.')
      }

      if (isClient) {
        window.location.href = result.data.url
      }
    } catch (error) {
      console.error('[cartStore] Subscribe error:', error)
      if (isClient) {
        alert('Subscription failed. Try again later.')
      }
    }
  }

  async function cancelSubscription(userId: number) {
    try {
      alert(`Cancel subscription for user ${userId} (not implemented yet)`)
      console.warn('[cartStore] Cancel subscription is not yet implemented')
    } catch (error) {
      console.error('[cartStore] Cancel error:', error)
      if (isClient) {
        alert('Cancellation failed.')
      }
    }
  }

  if (isClient) {
    watch(items, syncToLocalStorage, { deep: true })
  }

  return {
    items,
    isOpen,
    initialized,
    totalItems,
    totalPrice,
    hasItems,
    initialize,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    syncToLocalStorage,
    loadFromLocalStorage,
    checkout,
    subscribe,
    cancelSubscription,
  }
})
