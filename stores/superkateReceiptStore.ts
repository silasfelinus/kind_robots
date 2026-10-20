// /stores/superkateReceiptStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '@/stores/utils'

export type SuperkateReceiptEmailInput = {
  date: string
  clientName: string
  servicesProvided: string
  hours: number
  rate: number
  productCost: number
  clientEmail: string
}

type ReceiptEmailResponse = {
  totalCents: number
  sentCount: number
}

export const useSuperkateReceiptStore = defineStore(
  'superkateReceiptStore',
  () => {
    const isSending = ref(false)
    const lastMessage = ref('')
    const lastError = ref('')

    async function sendReceiptEmail(
      input: SuperkateReceiptEmailInput,
    ): Promise<{ success: boolean; message: string }> {
      isSending.value = true
      lastMessage.value = ''
      lastError.value = ''

      try {
        const response = await performFetch<ReceiptEmailResponse>(
          '/api/stylist/receipt-email',
          {
            method: 'POST',
            body: JSON.stringify(input),
            headers: { 'Content-Type': 'application/json' },
          },
          1,
          20_000,
        )

        if (!response.success) {
          throw new Error(response.message || 'Could not send the receipt email.')
        }

        lastMessage.value = response.message || 'Receipt email sent.'
        return { success: true, message: lastMessage.value }
      } catch (error) {
        lastError.value =
          error instanceof Error
            ? error.message
            : 'Could not send the receipt email.'
        return { success: false, message: lastError.value }
      } finally {
        isSending.value = false
      }
    }

    return {
      isSending,
      lastMessage,
      lastError,
      sendReceiptEmail,
    }
  },
)
