<template>
  <div class="bg-gray-50 min-h-screen flex justify-center items-center">
    <div class="bg-white max-w-md mx-auto rounded-xl shadow-lg p-10 space-y-5">
      <h1 class="text-4xl font-bold text-center text-indigo-600 mb-10">
        Hair by Superkate!
      </h1>
      <div class="flex justify-center mb-5">
        <site-logo />
      </div>
      <form class="space-y-5" @submit.prevent="submitForm">
        <!-- Date -->
        <label class="block text-gray-700">
          Date
          <input
            v-model="form.date"
            type="date"
            class="input input-bordered w-full"
            aria-label="Date"
            required
          />
        </label>
        <!-- Client's Name -->
        <label class="block text-gray-700">
          Client's Name
          <input
            v-model="form.clientName"
            type="text"
            class="input input-bordered w-full"
            placeholder="Client's Name"
            aria-label="Client's Name"
            required
          />
        </label>
        <!-- Services Provided -->
        <label class="block text-gray-700">
          Services Provided
          <input
            v-model="form.servicesProvided"
            type="text"
            class="input input-bordered w-full"
            placeholder="Services"
          />
        </label>
        <!-- Cost Calculation Card -->
        <div class="card bordered">
          <div class="card-body space-y-5">
            <div class="space-y-2">
              <!-- Number of Hours -->
              <label class="block text-gray-700">
                Number of Hours
                <input
                  v-model="form.hours"
                  type="number"
                  class="input input-bordered w-full"
                  placeholder="Number of hours"
                  min="0"
                />
              </label>
              <!-- Rate per Hour -->
              <label class="block text-gray-700">
                Rate per Hour ($)
                <input
                  v-model="form.rate"
                  type="number"
                  class="input input-bordered w-full"
                  placeholder="Rate per hour"
                  min="0"
                />
              </label>
            </div>
            <hr />
            <!-- Product Cost -->
            <div class="space-y-2">
              <label class="block text-gray-700">
                Product Cost ($)
                <input
                  v-model="form.productCost"
                  type="number"
                  class="input input-bordered w-full"
                  placeholder="Product cost"
                  min="0"
                />
              </label>
            </div>
            <hr />
            <!-- Total Cost -->
            <div class="bg-gray-100 p-2 rounded-md">
              Total cost: ${{ totalCost }}
            </div>
            <hr />
            <!-- Calculation Breakdown -->
            <div class="bg-gray-100 p-2 rounded-md">
              Calculation: (${{ form.rate }} Rate per hour x
              {{ form.hours }} hours) + ${{ form.productCost }} Product Cost =
              ${{ totalCost }}
            </div>
          </div>
        </div>
        <!-- Client's Email -->
        <label class="block text-gray-700">
          Client's Email
          <div class="relative">
            <input
              v-model="form.clientEmail"
              type="email"
              class="input input-bordered w-full pr-20"
              placeholder="Client's Email"
              required
            />
            <div
              class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
            >
              + superkate@gmail.com
            </div>
          </div>
        </label>
        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary w-full">Send</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Define form structure
interface FormData {
  date: string
  clientName: string
  servicesProvided: string
  hours: string
  rate: string
  productCost: string
  clientEmail: string
}

// Initialize form data with default values
const form = ref<FormData>({
  date: new Date().toISOString().substr(0, 10),
  clientName: '',
  servicesProvided: '',
  hours: '',
  rate: '',
  productCost: '',
  clientEmail: '',
})

// Computed property to calculate total cost
const totalCost = computed(() => {
  return (
    Number(form.value.hours) * Number(form.value.rate) +
    Number(form.value.productCost)
  )
})

// Function to handle form submission
const submitForm = async () => {
  // Call the function to send the email
  await sendBrevoEmail({
    ...form.value,
    totalCost: totalCost.value,
  })

  // Clear form data after submission
  form.value = {
    date: new Date().toISOString().substr(0, 10),
    clientName: '',
    servicesProvided: '',
    hours: '',
    rate: '',
    productCost: '',
    clientEmail: '',
  }
}

const sendBrevoEmail = async (data: FormData & { totalCost: number }) => {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    throw new Error('API key for Brevo is not defined.')
  }

  const emailData = {
    sender: { name: 'Superkate', email: 'your-email@example.com' },
    to: [
      { email: 'silasfelinus@gmail.com' },
      { email: 'superkate@gmail.com' },
      { email: data.clientEmail },
    ],
    subject: 'Hair by Superkate!',
    htmlContent: `
      <p>Date: ${data.date}</p>
      <p>Client's Name: ${data.clientName}</p>
      <p>Services Provided: ${data.servicesProvided}</p>
      <p>Hours: ${data.hours}</p>
      <p>Rate: ${data.rate}</p>
      <p>Product Cost: ${data.productCost}</p>
      <p>Total Cost: ${data.totalCost}</p>
    `,
  }

  try {
    await $fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey, // Safely pass the API key now
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })
    console.log('Email sent')
  } catch (error) {
    console.error(`Error sending email: ${error}`)
  }
}
</script>
