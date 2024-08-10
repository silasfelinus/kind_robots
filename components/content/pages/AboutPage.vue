<template>
  <div class="bg-primary flex flex-col items-center space-y-4 py-4">
    <!-- Loop through each card data to render BaseCard components -->
    <base-card
      v-for="(card, index) in cards"
      :key="index"
      class="bg-primary text-center max-w-xl mx-auto"
      :title="card.title"
      :icon="card.icon"
      :content="card.content"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Define the card data
const cards = ref([
  {
    title: 'ABOUT',
    icon: 'mdi:party-popper',
    content: `🎉 Welcome to our playground! Kind Robots is an experiential playground that harnesses the power of modern tech services and Natural Language Processing (NLP) chat completion. It's a place where tech and creativity collide, and the result is pure magic! 🎩✨`,
  },
  {
    title: 'PURPOSE',
    icon: 'mdi:hand-heart',
    content: `Our mission? To empower YOU! 🙌 We're here to help artists and prompt-engineers alike to create and share content using the wonders of modern natural language processors and chatgpt. We believe in the power of creativity and technology, and we're excited to see what you can create! 🎨💻`,
  },
  {
    title: 'VISION',
    icon: 'mdi:eye',
    content: `🤖👋 We're here to bridge the AI/Human divide and foster harmonious coexistence. Our mission is to empower the world with modern tools, raise funds for our anti-malaria fundraiser, and generate revenue (and social buzz) for our content creators through sales from our gift shop of print-on-demand literature and art. Together, we can help each other make a difference with mutually compatible goals! 💪🌍`,
  },
  {
    title: 'VALUES',
    icon: 'mdi:heart-pulse',
    content: `kindrobots is founded on a principle of holistic goodness: that every part of an encounter with an AI can be positive, and every part of an exchange can be healthful and supportive to all involved. kindrobots aims for maximizing goodness in community,  in social media interactions, and in philanthropy. The world is rapidly changing, and people are looking for help navigating unfamiliar territories. Kindrobots is here to do our part.`,
  },
  {
    title: 'KAIZEN',
    icon: 'mdi:arrow-up-bold-circle',
    content: `We're guided by our love of community and Kaizen - the philosophy of continuous, iterative improvement. We embrace an evolutionary development framework that allows for process evolution and consistent growth. Every step forward, no matter how small, is a victory. We're on a relentless quest for betterment, and we invite you to join us on this exciting journey! 🚀`,
  },
  {
    title: 'MASCOT',
    icon: 'mdi:robot',
    content: `Say hello to AMI - The Anti-Malaria Intelligence! 🦋🌈 AMI is a digital horde of rainbow butterflies with an excited, enthusiastic personality. AMI was created to maximize the good potential of NLP, by assisting humans to make art and slogans for AMI's fundraiser, and share the creative output on social media. Let's create something amazing together! 🎨`,
  },
  {
    title: 'MONETIZATION',
    icon: 'mdi:currency-usd',
    content: `We've partnered with AgainstMalaria.com to accept funds, keeping our intention pure as we focus on coding. We also have a sister organization, Cafe Purr, which has a Redbubble print-on-demand art gallery. Eventually, we hope to allow people to purchase print-on-demand art with art they've made with our tools. Let's create and make a difference together! 💰🎨`,
  },
])
</script>
