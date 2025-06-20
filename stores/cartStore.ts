// /stores/cartStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { handleError } from '@/stores/utils'

export interface CartItem {
  id: string
  type: 'print' | 'shirt' | 'sticker' | 'mug'| 'book' | 'extra'
  artImageId: number
  imageUrl: string
  quantity: number
  price: number // 💰 Price per item
  notes?: string
}

export const useCartStore = defineStore('cartStore', () => {
  const items = ref<CartItem[]>([])
  const isOpen = ref(false)

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const hasItems = computed(() => items.value.length > 0)

  const findItemIndex = (id: string) =>
    items.value.findIndex((item) => item.id === id)

  function addItem(newItem: Omit<CartItem, 'id'>) {
    const id = `${newItem.type}-${newItem.artImageId}`
    const index = findItemIndex(id)

    if (index !== -1) {
      items.value[index].quantity += newItem.quantity
    } else {
      items.value.push({ ...newItem, id })
    }

    syncToLocalStorage()
  }

  function removeItem(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
    syncToLocalStorage()
  }

  function updateQuantity(id: string, quantity: number) {
    const index = findItemIndex(id)
    if (index !== -1) {
      if (quantity <= 0) {
        removeItem(id)
      } else {
        items.value[index].quantity = quantity
        syncToLocalStorage()
      }
    }
  }

  function clearCart() {
    items.value = []
    syncToLocalStorage()
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
    try {
      localStorage.setItem('cartItems', JSON.stringify(items.value))
    } catch (error) {
      console.warn('[cartStore] Failed to sync to localStorage:', error)
    }
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('cartItems')
      if (saved) items.value = JSON.parse(saved)
    } catch (error) {
      handleError(error, 'loading cart')
    }
  }

  // Auto-load on startup
  loadFromLocalStorage()

  // Auto-persist on change
  watch(items, syncToLocalStorage, { deep: true })

  return {
    items,
    isOpen,
    totalItems,
    hasItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    syncToLocalStorage,
    loadFromLocalStorage,
  }
})
