import { defineStore } from 'pinia'
import type { Cart, CartItem } from '@prisma/client'
import { useErrorStore } from './../stores/errorStore' // Import your errorStore

export const useCartStore = defineStore({
  id: 'cart',
  state: () => ({
    currentCartId: null as number | null,
    carts: [] as { id: number; customerId: number }[],
    cartItems: [] as {
      id: number
      cartId: number
      productId: number
      quantity: number
    }[],
  }),
  actions: {
    setCurrentCartId(cartId: number) {
      this.currentCartId = cartId
    },

    async createCart(
      customerId: number,
    ): Promise<{
      success: boolean
      cartId?: number
      message?: string
      statusCode?: number
    }> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customerId }),
        })
        const data = await response.json()
        if (data.success) {
          this.carts.push(data.newCart)
          return { success: true, cartId: data.newCart.id }
        } else {
          errorStore.setError(data.type, data.message)
          return { success: false, message: data.message }
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'An error occurred while creating a new cart',
        )
        console.error(`An error occurred while creating a new cart: ${error}`)
        return { success: false, message: 'An error occurred', statusCode: 500 }
      }
    },

    async fetchCartByCustomerId(customerId: number) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/customers/${customerId}.get.ts`)
        const data = await response.json()
        return data.cart
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'An error occurred while fetching cart by customer ID',
        )
        console.error(
          `An error occurred while fetching cart by customer ID: ${error}`,
        )
      }
    },

    async deleteCart(cartId: number) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/cart/${cartId}.delete.ts`, {
          method: 'DELETE',
        })
        const data = await response.json()
        if (data.success) {
          const index = this.carts.findIndex((cart) => cart.id === cartId)
          if (index !== -1) {
            this.carts.splice(index, 1)
          }
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'An error occurred while deleting the cart',
        )
        console.error(`An error occurred while deleting the cart: ${error}`)
      }
    },

    // CartItem Actions
    async addItem(productId: number, quantity: number = 1) {
      const errorStore = useErrorStore()
      if (!this.currentCartId) {
        errorStore.setError(ErrorType.VALIDATION_ERROR, 'No active cart.')
        return
      }
      try {
        const response = await fetch(
          `/api/carts/${this.currentCartId}.post.ts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cartId: this.currentCartId,
              productId,
              quantity,
            }),
          },
        )
        const data = await response.json()
        if (data.success) {
          this.cartItems.push(data.newCartItem)
        } else {
          errorStore.setError(data.type, data.message)
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'An error occurred while adding item to cart',
        )
        console.error(`An error occurred while adding item to cart: ${error}`)
      }
    },

    async fetchItemsByCartId(cartId: number) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/carts/${cartId}.get.ts`)
        const data = await response.json()
        if (data.success) {
          this.cartItems = data.items
        } else {
          errorStore.setError(data.type, data.message)
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'An error occurred while fetching items by cart ID',
        )
        console.error(
          `An error occurred while fetching items by cart ID: ${error}`,
        )
      }
    },

    async updateCartItem(
      id: number,
      updatedData: { productId?: number; quantity?: number },
    ) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/cartItem/${id}.patch.ts`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        })
        const data = await response.json()
        if (data.success) {
          const index = this.cartItems.findIndex((item) => item.id === id)
          if (index !== -1) {
            this.cartItems[index] = { ...this.cartItems[index], ...updatedData }
          }
        } else {
          errorStore.setError(data.type, data.message)
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'An error occurred while updating the cart item',
        )
        console.error(
          `An error occurred while updating the cart item: ${error}`,
        )
      }
    },

    async deleteCartItem(id: number) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/cartItem/${id}.delete.ts`, {
          method: 'DELETE',
        })
        const data = await response.json()
        if (data.success) {
          const index = this.cartItems.findIndex((item) => item.id === id)
          if (index !== -1) {
            this.cartItems.splice(index, 1)
          }
        } else {
          errorStore.setError(data.type, data.message)
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'An error occurred while deleting the cart item',
        )
        console.error(
          `An error occurred while deleting the cart item: ${error}`,
        )
      }
    },

    async batchAddItemsToCart(
      items: { cartId: number; productId: number; quantity: number }[],
    ) {
      const errorStore = useErrorStore()
      try {
        const response = await fetch('/api/cartItem/index.post.ts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(items),
        })
        const data = await response.json()
        if (data.success) {
          this.cartItems.push(...data.newCartItems)
        } else {
          errorStore.setError(data.type, data.message)
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.UNKNOWN_ERROR,
          'An error occurred while batch adding items to the cart',
        )
        console.error(
          `An error occurred while batch adding items to the cart: ${error}`,
        )
      }
    },
  },
})

export type { Cart, CartItem }
