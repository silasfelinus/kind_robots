import { defineStore } from 'pinia'
import type { Cart, CartItem } from '@prisma/client'
import { useErrorStore, ErrorType } from './../stores/errorStore'

export const useCartStore = defineStore({
  id: 'cart',
  state: () => ({
    currentCartId: null as number | null,
    carts: [] as Cart[],
    cartItems: [] as CartItem[],  // Explicitly typed as CartItem array
  }),
  actions: {
    setCurrentCartId(cartId: number) {
      this.currentCartId = cartId
    },
        // Add the missing updateCartItem method
        async updateCartItem(id: number, updatedData: { quantity: number }) {
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
    
        // Add the missing deleteCartItem method
        async deleteCartItem(id: number) {
          const errorStore = useErrorStore()
          try {
            const response = await fetch(`/api/cartItem/${id}.delete.ts`, {
              method: 'DELETE',
            })
            const data = await response.json()
            if (data.success) {
              this.cartItems = this.cartItems.filter((item) => item.id !== id)
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

    async createCart(customerId: number): Promise<{
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

    async fetchCartByCustomerId(customerId: number): Promise<Cart | null> {
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
        return null
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
          this.carts = this.carts.filter(cart => cart.id !== cartId)
        }
      } catch (error) {
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'An error occurred while deleting the cart',
        )
        console.error(`An error occurred while deleting the cart: ${error}`)
      }
    },

    async fetchItemsByCartId(cartId: number): Promise<void> {
      const errorStore = useErrorStore()
      try {
        const response = await fetch(`/api/carts/${cartId}.get.ts`)
        const data = await response.json()
        if (data.success) {
          this.cartItems = data.items  // Ensure response is well-typed
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
  },
})

export type { Cart, CartItem }
