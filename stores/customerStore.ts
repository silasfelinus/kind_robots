import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './../stores/errorStore' // Import errorStore and ErrorType

export const useCustomerStore = defineStore({
  id: 'customer',
  state: () => ({
    customers: [] as { id: number; email: string; name?: string }[],
    currentCustomer: null as {
      id: number
      email: string
      name?: string
    } | null,
  }),
  actions: {
    setCurrentCustomer(customer: { id: number; email: string; name?: string }) {
      this.currentCustomer = customer
    },

    clearCurrentCustomer() {
      this.currentCustomer = null
    },

    async fetchCustomerByUserId(
      userId: number,
    ): Promise<{ success: boolean; customerId?: number; message?: string }> {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch(`/api/customers/userId/${userId}.get.ts`)
        const data = await response.json()
        if (data.success) {
          this.setCurrentCustomer(data.customer)
          return { success: true, customerId: data.customer.id }
        } else {
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to fetch customer by userId: ${data.message}`,
          )
          return { success: false, message: data.message }
        }
      } catch (err) {
        const error = err as Error // Type assertion
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Network error occurred while fetching customer by userId',
        )
        console.error(`Fetch Customer By UserId Error: ${error.message}`)
        return { success: false, message: error.message }
      }
    },

    async fetchCustomerByEmail(email: string) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch(`/api/customers/email/${email}.get.ts`)
        const data = await response.json()
        if (data.success) {
          this.setCurrentCustomer(data.customer)
        } else {
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to fetch customer by email: ${data.message}`,
          )
          throw new Error(data.message)
        }
      } catch (err) {
        const error = err as Error // Type assertion
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Network error occurred while fetching customer by email',
        )
        console.error(`Fetch Customer By Email Error: ${error.message}`)
      }
    },

    async fetchAndSetCurrentCustomerById(id: number) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const customer = await this.fetchCustomerById(id)
        if (customer) {
          this.setCurrentCustomer(customer)
        }
      } catch (err) {
        const error = err as Error // Type assertion
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Network error occurred while fetching and setting customer by ID',
        )
        console.error(
          `Fetch And Set Current Customer By ID Error: ${error.message}`,
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
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch('/api/customers/index.get.ts')
        const data = await response.json()
        if (data.success) {
          this.setCustomers(data.customers)
        } else {
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to fetch customers: ${data.message}`,
          )
          console.error(`Failed to fetch customers: ${data.message}`)
        }
      } catch (err) {
        const error = err as Error // Type assertion
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Network error occurred while fetching customers',
        )
        console.error(
          `An error occurred while fetching customers: ${error.message}`,
        )
      }
    },

    async fetchCustomerById(id: number) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch(`/api/customers/${id}.get.ts`)
        const data = await response.json()
        return data.customer
      } catch (err) {
        const error = err as Error // Type assertion
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Network error occurred while fetching customer by id: ${error.message}`,
        )
        console.error(
          `An error occurred while fetching customer by id: ${error.message}`,
        )
      }
    },

    async createCustomer(data: {
      email?: string
      name?: string
      userId?: number
    }): Promise<{ success: boolean; customerId?: number; message?: string }> {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch('/api/customers/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const responseData = await response.json()
        if (responseData.success) {
          this.customers.push(responseData.newCustomer)
          return { success: true, customerId: responseData.newCustomer.id }
        } else {
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to create customer: ${responseData.message}`,
          )
          return { success: false, message: responseData.message }
        }
      } catch (err) {
        const error = err as Error // Type assertion
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          'Network error occurred while creating customer',
        )
        console.error(`Create Customer Error: ${error.message}`)
        return { success: false, message: error.message }
      }
    },

    async updateCustomer(
      id: number,
      updatedData: { email?: string; name?: string },
    ) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch(`/api/customers/${id}.patch.ts`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        })
        const data = await response.json()
        if (data.success) {
          const index = this.customers.findIndex(
            (customer) => customer.id === id,
          )
          if (index !== -1) {
            this.customers[index] = { ...this.customers[index], ...updatedData }
          }
        } else {
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to update customer: ${data.message}`,
          )
        }
      } catch (err) {
        const error = err as Error // Type assertion
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Network error occurred while updating customer: ${error.message}`,
        )
        console.error(
          `An error occurred while updating the customer: ${error.message}`,
        )
      }
    },

    async deleteCustomer(id: number) {
      const errorStore = useErrorStore() // Use errorStore
      try {
        const response = await fetch(`/api/customers/${id}.delete.ts`, {
          method: 'DELETE',
        })
        const data = await response.json()
        if (data.success) {
          const index = this.customers.findIndex(
            (customer) => customer.id === id,
          )
          if (index !== -1) {
            this.customers.splice(index, 1)
          }
        } else {
          errorStore.setError(
            ErrorType.VALIDATION_ERROR,
            `Failed to delete customer: ${data.message}`,
          )
        }
      } catch (err) {
        const error = err as Error // Type assertion
        errorStore.setError(
          ErrorType.NETWORK_ERROR,
          `Network error occurred while deleting customer: ${error.message}`,
        )
        console.error(
          `An error occurred while deleting the customer: ${error.message}`,
        )
      }
    },
  },
})
