import { defineStore } from 'pinia'
import { errorHandler } from '@/server/api/utils/error' // Import errorHandler

export const useCustomerStore = defineStore({
  id: 'customer',
  state: () => ({
    customers: [] as { id: number; email: string; name?: string }[],
    currentCustomer: null as { id: number; email: string; name?: string } | null
  }),
  actions: {
    // New function to set the current customer
    setCurrentCustomer(customer: { id: number; email: string; name?: string }) {
      this.currentCustomer = customer
    },

    // New function to clear the current customer
    clearCurrentCustomer() {
      this.currentCustomer = null
    },

    // New function to fetch a customer by email
    async fetchCustomerByEmail(email: string) {
      try {
        const response = await fetch(`/api/customers/email/${email}.get.ts`)
        const data = await response.json()
        if (data.success) {
          this.setCurrentCustomer(data.customer)
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        const { success, message, statusCode } = errorHandler({ error })
        console.error(
          `Fetch Customer By Email Error: ${message}, Status Code: ${statusCode}, Success: ${success}`
        )
      }
    },

    // New function to fetch and set the current customer by ID
    async fetchAndSetCurrentCustomerById(id: number) {
      try {
        const customer = await this.fetchCustomerById(id)
        if (customer) {
          this.setCurrentCustomer(customer)
        }
      } catch (error) {
        const { success, message, statusCode } = errorHandler({ error })
        console.error(
          `Fetch And Set Current Customer By ID Error: ${message}, Status Code: ${statusCode}, Success: ${success}`
        )
      }
    },
    setCustomers(customers: { id: number; email: string; name?: string }[]) {
      this.customers = customers
    },
    getCustomerById(id: number) {
      return this.customers.find((customer) => customer.id === id)
    },
    async fetchCustomers() {
      try {
        const response = await fetch('/api/customers/index.get.ts')
        const data = await response.json()
        if (data.success) {
          this.setCustomers(data.customers)
        } else {
          console.error(`Failed to fetch customers: ${data.message}`)
        }
      } catch (error) {
        console.error(`An error occurred while fetching customers: ${error}`)
      }
    },
    async fetchCustomerById(id: number) {
      try {
        const response = await fetch(`/api/customers/${id}.get.ts`)
        const data = await response.json()
        return data.customer
      } catch (error) {
        console.error(`An error occurred while fetching customer by id: ${error}`)
      }
    },
    async createCustomer(customer: { email: string; name?: string }) {
      try {
        const response = await fetch('/api/customers/index.post.ts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customer)
        })
        const data = await response.json()
        if (data.success) {
          this.customers.push(data.newCustomer)
        }
      } catch (error) {
        console.error(`An error occurred while creating a new customer: ${error}`)
      }
    },
    async updateCustomer(id: number, updatedData: { email?: string; name?: string }) {
      try {
        const response = await fetch(`/api/customers/${id}.patch.ts`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedData)
        })
        const data = await response.json()
        if (data.success) {
          const index = this.customers.findIndex((customer) => customer.id === id)
          if (index !== -1) {
            this.customers[index] = { ...this.customers[index], ...updatedData }
          }
        }
      } catch (error) {
        console.error(`An error occurred while updating the customer: ${error}`)
      }
    },
    async deleteCustomer(id: number) {
      try {
        const response = await fetch(`/api/customers/${id}.delete.ts`, {
          method: 'DELETE'
        })
        const data = await response.json()
        if (data.success) {
          const index = this.customers.findIndex((customer) => customer.id === id)
          if (index !== -1) {
            this.customers.splice(index, 1)
          }
        }
      } catch (error) {
        console.error(`An error occurred while deleting the customer: ${error}`)
      }
    }
  }
})
