<template>
  <div class="bg-base-200 p-8 flex flex-col md:flex-row">
    <!-- Main Content -->
    <main class="flex-1 mb-12">
      <header class="text-center mb-12">
        <img
          :src="image"
          alt="Background Image"
          class="w-1/2 md:w-1/4 mx-auto mb-4 rounded-lg shadow-lg"
        />
        <h1 class="text-4xl font-bold mb-2">
          {{ title }}
        </h1>
        <h2 v-if="subtitleRef" class="text-2xl font-semibold mb-4">
          {{ subtitleRef }}
        </h2>
        <a :href="amazonLink" class="btn btn-primary block w-max mx-auto mb-4"
          >Amazon Link</a
        >
        <a
          :href="downloadLink"
          class="btn btn-secondary block w-max mx-auto mb-4"
          >Download PDF</a
        >
        <a
          :href="mosquitoNetsLink"
          class="btn btn-tertiary block w-max mx-auto mb-4"
          >Mosquito Nets Project</a
        >
      </header>

      <!-- Europe Images -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Image 1 -->
        <div class="relative cursor-pointer" @click="toggleEurope1Image">
          <img
            v-if="showEuropeImage1"
            :src="europePic1"
            alt="Europe Image 1"
            class="w-full h-auto rounded-lg shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105"
          />
          <p
            v-if="!showEuropeImage1"
            class="text-center font-semibold text-blue-600 cursor-pointer"
          >
            Click to view Europe Image 1
          </p>
        </div>

        <!-- Image 2 -->
        <div class="relative cursor-pointer" @click="toggleEurope2Image">
          <img
            v-if="showEuropeImage2"
            :src="europePic2"
            alt="Europe Image 2"
            class="w-full h-auto rounded-lg shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105"
          />
          <p
            v-if="!showEuropeImage2"
            class="text-center font-semibold text-blue-600 cursor-pointer"
          >
            Click to view Europe Image 2
          </p>
        </div>

        <!-- Image 3 -->
        <div class="relative cursor-pointer" @click="toggleEurope3Image">
          <img
            v-if="showEuropeImage3"
            :src="europePic3"
            alt="Europe Image 3"
            class="w-full h-auto rounded-lg shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105"
          />
          <p
            v-if="!showEuropeImage3"
            class="text-center font-semibold text-blue-600 cursor-pointer"
          >
            Click to view Europe Image 3
          </p>
        </div>
      </section>
    </main>

    <!-- Quotes on the Right Side Panel -->
    <aside class="w-full md:w-1/3 mt-8 md:mt-0">
      <blockquote
        class="p-4 mb-6 border-l-4 border-gray-800 italic bg-white shadow-md rounded-lg"
      >
        "Mermaids of Venice is a literary ballerina - supple, strong,
        astonishing, and captivating in a way that makes your heart race. From
        the first line to the last, I was thoroughly engrossed. It's akin to a
        roller-coaster - once you're on, you're committed to the ride." - Amazon
        Review
      </blockquote>

      <blockquote
        class="p-4 mb-6 border-l-4 border-gray-800 italic bg-white shadow-md rounded-lg"
      >
        "Smart, sexy, and delightfully subversive, I devoured 'Mermaids of
        Venice' the first time I read it. It made me laugh, cry, and gave me
        goosebumps. A linguistically unique treat I highly recommend!" - C
        Curtis
      </blockquote>

      <blockquote
        class="p-4 mb-6 border-l-4 border-gray-800 italic bg-white shadow-md rounded-lg"
      >
        "It's a rarity for a novel to make me laugh out loud, but this one
        managed that feat frequently – for its humor, surprises, wit, heart, and
        magical richness. Silas Knight is truly a master of prose." - C.
        Kinnamon
      </blockquote>
    </aside>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Mermaids of Venice')
const subtitleRef = ref(
  'A subversive fairy tale of gods and street performers.',
)
const image = ref('/images/utility/mermaids/mermaids1.jpg')
const amazonLink = ref(
  'https://www.amazon.com/Mermaids-Venice-Silas-Knight/dp/0615516742',
)
const downloadLink = ref('/mermaids.pdf')
const mosquitoNetsLink = ref('/projects/amibot')
const europePic1 = ref('/images/utility/mermaids/europe1.png')
const europePic2 = ref('/images/utility/mermaids/europe2.jpg')
const europePic3 = ref('/images/utility/mermaids/europe3.jpg')

const showEuropeImage1 = ref(false)
const showEuropeImage2 = ref(false)
const showEuropeImage3 = ref(false)

function toggleEurope1Image() {
  showEuropeImage1.value = !showEuropeImage1.value
}

function toggleEurope2Image() {
  showEuropeImage2.value = !showEuropeImage2.value
}

function toggleEurope3Image() {
  showEuropeImage3.value = !showEuropeImage3.value
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-full text-white font-semibold transition-all duration-300;
}

.btn-primary {
  @apply bg-blue-500 hover:bg-blue-600;
}

.btn-secondary {
  @apply bg-green-500 hover:bg-green-600;
}

.btn-tertiary {
  @apply bg-yellow-500 hover:bg-yellow-600;
}

.icon-effect {
  @apply w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-shadow;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 5px #fff;
  }
  50% {
    box-shadow:
      0 0 20px #fff,
      0 0 30px #ff73fd;
  }
  100% {
    box-shadow: 0 0 5px #fff;
  }
}

.glow-animation:hover {
  animation: glow 1.5s infinite;
}
</style>
