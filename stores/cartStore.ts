import { defineStore } from 'pinia'
import { Cart, CartItem } from '@prisma/client'
import { errorHandler } from '@/server/api/utils/error' // Import your errorHandler

export const useCartStore = defineStore({
  id: 'cart',
  state: () => ({
    currentCartId: null as number | null,
    carts: [] as { id: number; customerId: number }[],
    cartItems: [] as { id: number; cartId: number; productId: number; quantity: number }[]
  }),
  actions: {
    setCurrentCartId(cartId: number) {
      this.currentCartId = cartId
    },
    async createCart(
      customerId: number
    ): Promise<{ success: boolean; cartId?: number; message?: string }> {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ customerId })
        })
        const data = await response.json()
        if (data.success) {
          this.carts.push(data.newCart)
          return { success: true, cartId: data.newCart.id }
        } else {
          return { success: false, message: data.message }
        }
      } catch (error) {
        console.error(`An error occurred while creating a new cart: ${error}`)
        return { success: false, message: error instanceof Error ? error.message : String(error) }
      }
    },

    async fetchCartByCustomerId(customerId: number) {
      try {
        const response = await fetch(`/api/customers/${customerId}.get.ts`)
        const data = await response.json()
        return data.cart
      } catch (error) {
        console.error(`An error occurred while fetching cart by customer ID: ${error}`)
      }
    },
    async deleteCart(cartId: number) {
      try {
        const response = await fetch(`/api/cart/${cartId}.delete.ts`, {
          method: 'DELETE'
        })
        const data = await response.json()
        if (data.success) {
          const index = this.carts.findIndex((cart) => cart.id === cartId)
          if (index !== -1) {
            this.carts.splice(index, 1)
          }
        }
      } catch (error) {
        console.error(`An error occurred while deleting the cart: ${error}`)
      }
    },
    // CartItem Actions
    async addItem(productId: number, quantity: number = 1) {
      if (!this.currentCartId) {
        // Handle this case appropriately, maybe create a new cart
        errorHandler({ success: false, message: 'No active cart.', statusCode: 400 })
        return
      }
      try {
        const response = await fetch(`/api/carts/${this.currentCartId}.post.ts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cartId: this.currentCartId, productId, quantity })
        })
        const data = await response.json()
        if (data.success) {
          this.cartItems.push(data.newCartItem)
        }
      } catch (error: any) {
        errorHandler({ success: false, message: error.message, statusCode: 500 })
      }
    },
    async fetchItemsByCartId(cartId: number) {
      try {
        const response = await fetch(`/api/carts/${cartId}.get.ts`)
        const data = await response.json()
        if (data.success) {
          this.cartItems = data.items
        }
      } catch (error) {
        console.error(`An error occurred while fetching items by cart ID: ${error}`)
      }
    },
    async updateCartItem(id: number, updatedData: { productId?: number; quantity?: number }) {
      try {
        const response = await fetch(`/api/cartItem/${id}.patch.ts`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedData)
        })
        const data = await response.json()
        if (data.success) {
          const index = this.cartItems.findIndex((item) => item.id === id)
          if (index !== -1) {
            this.cartItems[index] = { ...this.cartItems[index], ...updatedData }
          }
        }
      } catch (error) {
        console.error(`An error occurred while updating the cart item: ${error}`)
      }
    },
    async deleteCartItem(id: number) {
      try {
        const response = await fetch(`/api/cartItem/${id}.delete.ts`, {
          method: 'DELETE'
        })
        const data = await response.json()
        if (data.success) {
          const index = this.cartItems.findIndex((item) => item.id === id)
          if (index !== -1) {
            this.cartItems.splice(index, 1)
          }
        }
      } catch (error) {
        console.error(`An error occurred while deleting the cart item: ${error}`)
      }
    },
    async batchAddItemsToCart(items: { cartId: number; productId: number; quantity: number }[]) {
      try {
        const response = await fetch('/api/cartItem/index.post.ts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(items)
        })
        const data = await response.json()
        if (data.success) {
          this.cartItems.push(...data.newCartItems)
        }
      } catch (error) {
        console.error(`An error occurred while batch adding items to the cart: ${error}`)
      }
    }
  }
})

export type { Cart, CartItem }
