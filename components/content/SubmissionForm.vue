<template>
  <div class="bg-gray-50 min-h-screen flex justify-center items-center">
    <div class="bg-white max-w-md mx-auto rounded-xl shadow-lg p-10 space-y-5">
      <h1 class="text-4xl font-bold text-center text-indigo-600 mb-10">Hair by Superkate!</h1>
      <div class="flex justify-center mb-5">
        <img src="/logo.png" alt="logo" class="h-14 w-auto" />
      </div>
      <form class="space-y-5">
        <label class="block text-gray-700">
          Date
          <input
            v-model="date"
            type="date"
            class="input input-bordered w-full"
            aria-label="Date"
            required
          />
        </label>
        <label class="block text-gray-700">
          Client's Name
          <input
            v-model="clientName"
            type="text"
            class="input input-bordered w-full"
            placeholder="Client's Name"
            aria-label="Client's Name"
            required
          />
        </label>
        <label class="block text-gray-700">
          Services Provided
          <input
            v-model="servicesProvided"
            type="text"
            class="input input-bordered w-full"
            placeholder="Services"
          />
        </label>
        <div class="card bordered">
          <div class="card-body space-y-5">
            <div class="space-y-2">
              <label class="block text-gray-700">
                Number of Hours
                <input
                  v-model="hours"
                  type="number"
                  class="input input-bordered w-full"
                  placeholder="Number of hours"
                />
              </label>
              <label class="block text-gray-700">
                Rate per Hour ($)
                <input
                  v-model="rate"
                  type="number"
                  class="input input-bordered w-full"
                  placeholder="Rate per hour"
                />
              </label>
            </div>
            <hr />
            <div class="space-y-2">
              <label class="block text-gray-700">
                Product Cost ($)
                <input
                  v-model="productCost"
                  type="number"
                  class="input input-bordered w-full"
                  placeholder="Product cost"
                />
              </label>
            </div>
            <hr />
            <div class="bg-gray-100 p-2 rounded-md">Total cost: ${{ totalCost }}</div>
            <hr />
            <div class="bg-gray-100 p-2 rounded-md">
              Calculation: (${{ rate }} Rate per hour x {{ hours }} hours) + ${{
                productCost
              }}
              Product Cost = ${{ totalCost }}
            </div>
          </div>
        </div>
        <label class="block text-gray-700">
          Client's Email
          <div class="relative">
            <input
              v-model="clientEmail"
              type="email"
              class="input input-bordered w-full pr-20"
              placeholder="Client's Email"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              + superkate@gmail.com
            </div>
          </div>
        </label>
        <button type="submit" class="btn btn-primary w-full">Send</button>
      </form>
    </div>
  </div>
</template>

<script setup>
let date = ref(new Date().toISOString().substr(0, 10))
let clientName = ref('')
let servicesProvided = ref('')
let hours = ref('')
let rate = ref('')
let productCost = ref('')
let clientEmail = ref('')

let totalCost = computed(() => {
  return hours.value * rate.value + Number(productCost.value)
})

const submitForm = async (event) => {
  event.preventDefault()

  // Call the function to send the email
  await sendBrevoEmail({
    date: date.value,
    clientName: clientName.value,
    servicesProvided: servicesProvided.value,
    hours: hours.value,
    rate: rate.value,
    productCost: productCost.value,
    totalCost: totalCost.value,
    clientEmail: clientEmail.value
  })

  // Clear the form
  date.value = new Date().toISOString().substr(0, 10)
  clientName.value = ''
  servicesProvided.value = ''
  hours.value = ''
  rate.value = ''
  productCost.value = ''
  clientEmail.value = ''
}

const sendBrevoEmail = async (data) => {
  const emailData = {
    sender: { name: 'Your Name', email: 'your-email@example.com' },
    to: [
      { email: 'silasfelinus@gmail.com' },
      { email: 'superkate@gmail.com' },
      { email: data.clientEmail }
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
    `
  }

  try {
    await $fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })
    console.log('Email sent')
  } catch (error) {
    console.error(`Error sending email: ${error}`)
  }
}
</script>
