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

type CartCheckoutResult = {
  success: boolean
  message?: string
  url?: string
}

const isClient = typeof window !== 'undefined'
const cartItemsStorageKey = 'cartItems'

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeRemoveLocalStorage(key: string): void {
  if (!isClient) return

  try {
    localStorage.removeItem(key)
  } catch {}
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<CartItem>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.artImageId === 'number' &&
    typeof candidate.imageUrl === 'string' &&
    typeof candidate.quantity === 'number' &&
    typeof candidate.price === 'number'
  )
}

function normalizeQuantity(quantity: number): number {
  return Math.max(1, Math.floor(quantity))
}

function normalizePrice(price: number): number {
  return Math.max(0, Number(price.toFixed(2)))
}

export const useCartStore = defineStore('cartStore', () => {
  const items = ref<CartItem[]>([])
  const isOpen = ref(false)
  const initialized = ref(false)
  const initializing = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const checkoutPromise = ref<Promise<CartCheckoutResult> | null>(null)
  const subscribePromise = ref<Promise<CartCheckoutResult> | null>(null)
  const hydrating = ref(false)

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity * item.price, 0),
  )

  const formattedTotalPrice = computed(() => totalPrice.value.toFixed(2))

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const hasItems = computed(() => items.value.length > 0)

  const findItemIndex = (id: string) =>
    items.value.findIndex((item) => item.id === id)

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function createCartItem(newItem: Omit<CartItem, 'id'>): CartItem {
    return {
      ...newItem,
      id: `${newItem.type}-${newItem.artImageId}`,
      quantity: normalizeQuantity(newItem.quantity),
      price: normalizePrice(newItem.price),
    }
  }

  function initialize(): Promise<void> {
    if (initialized.value) return Promise.resolve()
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        initializing.value = true
        hydrating.value = true
        clearError()
        loadFromLocalStorage()
        initialized.value = true
      } catch (error) {
        handleError(error, 'initializing cart')
        setLastError(error, 'Failed to initialize cart')
        initialized.value = false
      } finally {
        hydrating.value = false
        initializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  function addItem(newItem: Omit<CartItem, 'id'>) {
    const item = createCartItem(newItem)
    const index = findItemIndex(item.id)

    if (index !== -1) {
      const existing = items.value[index]
      if (!existing) return

      existing.quantity += item.quantity

      if (item.notes) {
        existing.notes = item.notes
      }

      return
    }

    items.value.push(item)
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

    const existing = items.value[index]
    if (!existing) return

    existing.quantity = normalizeQuantity(quantity)
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
    if (!isClient || hydrating.value) return

    safeSetLocalStorage(cartItemsStorageKey, JSON.stringify(items.value))
  }

  function loadFromLocalStorage() {
    const saved = safeGetLocalStorage(cartItemsStorageKey)

    if (!saved) return

    try {
      const parsed = JSON.parse(saved)

      if (!Array.isArray(parsed)) {
        safeRemoveLocalStorage(cartItemsStorageKey)
        items.value = []
        return
      }

      items.value = parsed
        .filter((item): item is CartItem => isCartItem(item))
        .map((item) => ({
          ...item,
          quantity: normalizeQuantity(item.quantity),
          price: normalizePrice(item.price),
        }))
    } catch (error) {
      handleError(error, 'loading cart')
      setLastError(error, 'Failed to load cart')
      items.value = []
      safeRemoveLocalStorage(cartItemsStorageKey)
    }
  }

  async function checkout(userId: number): Promise<CartCheckoutResult> {
    if (checkoutPromise.value) return checkoutPromise.value

    checkoutPromise.value = (async () => {
      try {
        loading.value = true
        clearError()

        if (!items.value.length) {
          return {
            success: false,
            message: 'Your cart is empty.',
          }
        }

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

        return {
          success: true,
          url: result.data.url,
        }
      } catch (error) {
        handleError(error, 'checkout')
        setLastError(error, 'Checkout failed. Please try again later.')

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Checkout failed. Please try again later.',
        }
      } finally {
        loading.value = false
        checkoutPromise.value = null
      }
    })()

    return checkoutPromise.value
  }

  async function subscribe(userId: number): Promise<CartCheckoutResult> {
    if (subscribePromise.value) return subscribePromise.value

    subscribePromise.value = (async () => {
      try {
        loading.value = true
        clearError()

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

        return {
          success: true,
          url: result.data.url,
        }
      } catch (error) {
        handleError(error, 'subscribe')
        setLastError(error, 'Subscription failed. Try again later.')

        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Subscription failed. Try again later.',
        }
      } finally {
        loading.value = false
        subscribePromise.value = null
      }
    })()

    return subscribePromise.value
  }

  async function cancelSubscription(
    userId: number,
  ): Promise<CartCheckoutResult> {
    try {
      loading.value = true
      clearError()

      return {
        success: false,
        message: `Cancel subscription for user ${userId} is not implemented yet.`,
      }
    } catch (error) {
      handleError(error, 'cancelSubscription')
      setLastError(error, 'Cancellation failed.')

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Cancellation failed.',
      }
    } finally {
      loading.value = false
    }
  }

  function resetInitialization() {
    initialized.value = false
    initializing.value = false
    initializePromise.value = null
    checkoutPromise.value = null
    subscribePromise.value = null
    lastError.value = null
  }

  if (isClient) {
    watch(items, syncToLocalStorage, { deep: true })
  }

  return {
    items,
    isOpen,
    initialized,
    initializing,
    loading,
    lastError,
    initializePromise,
    checkoutPromise,
    subscribePromise,

    totalItems,
    totalPrice,
    formattedTotalPrice,
    hasItems,

    initialize,
    resetInitialization,
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
