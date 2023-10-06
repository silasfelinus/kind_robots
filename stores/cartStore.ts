import { defineStore } from 'pinia'

export const useCartStore = defineStore({
  id: 'cart',
  state: () => ({
    carts: [] as { id: number; customerId: number }[],
    cartItems: [] as { id: number; cartId: number; productId: number; quantity: number }[]
  }),
  actions: {
    // Cart Actions
    async createCart(customerId: number) {
      try {
        const response = await fetch('/api/cart/index.post.ts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ customerId })
        })
        const data = await response.json()
        if (data.success) {
          this.carts.push(data.newCart)
        }
      } catch (error) {
        console.error(`An error occurred while creating a new cart: ${error}`)
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
    async addItemToCart(cartId: number, productId: number, quantity: number = 1) {
      try {
        const response = await fetch(`/api/carts/${cartId}.post.ts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cartId, productId, quantity })
        })
        const data = await response.json()
        if (data.success) {
          this.cartItems.push(data.newCartItem)
        }
      } catch (error) {
        console.error(`An error occurred while adding an item to the cart: ${error}`)
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
