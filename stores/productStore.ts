import { defineStore } from 'pinia'
import type { Product } from '@prisma/client'

export const useProductStore = defineStore({
  id: 'product',
  state: () => ({
    products: [] as Product[],
  }),
  actions: {
    setProducts(products: Product[]) {
      this.products = products
    },
    getProductById(id: number): Product | null {
      return this.products.find((product) => product.id === id) || null
    },
    async fetchProducts() {
      try {
        const response = await fetch('/api/products/index.get.ts')
        const data = await response.json()
        if (data.success) {
          this.setProducts(data.products)
        } else {
          console.error(`Failed to fetch products: ${data.message}`)
        }
      } catch (error) {
        console.error(`An error occurred while fetching products: ${error}`)
      }
    },
    async fetchProductById(id: number) {
      try {
        const response = await fetch(`/api/products/${id}.get.ts`)
        const data = await response.json()
        return data.product
      } catch (error) {
        console.error(
          `An error occurred while fetching product by id: ${error}`,
        )
      }
    },
    async createProduct(product: { name: string; costInPennies: number }) {
      try {
        const response = await fetch('/api/products/index.post.ts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        })
        const data = await response.json()
        if (data.success) {
          this.products.push(data.newProduct)
        }
      } catch (error) {
        console.error(
          `An error occurred while creating a new product: ${error}`,
        )
      }
    },
    async updateProduct(
      id: number,
      updatedData: { name?: string; costInPennies?: number },
    ) {
      try {
        const response = await fetch(`/api/products/${id}.patch.ts`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        })
        const data = await response.json()
        if (data.success) {
          const index = this.products.findIndex((product) => product.id === id)
          if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedData }
          }
        }
      } catch (error) {
        console.error(`An error occurred while updating the product: ${error}`)
      }
    },
    async deleteProduct(id: number) {
      try {
        const response = await fetch(`/api/products/${id}.delete.ts`, {
          method: 'DELETE',
        })
        const data = await response.json()
        if (data.success) {
          const index = this.products.findIndex((product) => product.id === id)
          if (index !== -1) {
            this.products.splice(index, 1)
          }
        }
      } catch (error) {
        console.error(`An error occurred while deleting the product: ${error}`)
      }
    },
  },
})

export type { Product }
