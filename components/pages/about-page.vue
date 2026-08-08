<template>
  <div class="kr-unbound items-center gap-4 bg-(--kr-surface) py-6 px-4">
    <div class="w-full max-w-2xl">
      <div class="mb-6 flex flex-col items-center gap-2 text-center">
        <span
          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent text-primary-content shadow-lg"
        >
          <Icon name="kind-icon:robot-color" class="h-8 w-8" />
        </span>
        <p class="text-3xl font-black text-base-content">Kind Robots</p>
        <p class="max-w-md text-sm text-base-content/60">
          A playground where creativity, technology, and goodness collide.
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <div
          v-for="(card, index) in cards"
          :key="index"
          class="kr-panel p-5 transition-shadow hover:shadow-md"
        >
          <div class="mb-3 flex items-center gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
            >
              <Icon :name="card.icon" class="h-5 w-5" />
            </span>
            <h2
              class="text-base font-black uppercase tracking-wider text-base-content"
            >
              {{ card.title }}
            </h2>
          </div>
          <p class="text-sm leading-relaxed text-base-content/70">
            {{ card.content }}
          </p>
        </div>
      </div>

      <section class="kr-panel mt-6 border-primary/25 p-5">
        <div class="mb-3 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
          >
            <Icon name="kind-icon:heart" class="h-5 w-5" />
          </span>
          <h2 class="text-base font-black uppercase tracking-wider text-base-content">
            Community & Sponsors
          </h2>
        </div>

        <p class="text-sm leading-relaxed text-base-content/70">
          Kind Robots grew alongside creative people and projects that share its
          optimistic, community-minded spirit. Our anti-malaria work points
          donations directly to the Against Malaria Foundation, while our
          friends help keep the wider creative ecosystem lively.
        </p>

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <a
            href="https://www.againstmalaria.com/amibot"
            target="_blank"
            rel="noopener"
            class="btn btn-outline justify-start rounded-xl"
          >
            <Icon name="kind-icon:hand-heart" class="h-4 w-4" />
            AMIbot fundraiser
          </a>
          <a
            href="https://www.redbubble.com/people/CafePurr/shop"
            target="_blank"
            rel="noopener"
            class="btn btn-outline justify-start rounded-xl"
          >
            <Icon name="kind-icon:image" class="h-4 w-4" />
            Cafe Purr
          </a>
          <NuxtLink
            to="/mermaids"
            class="btn btn-outline justify-start rounded-xl"
          >
            <Icon name="kind-icon:mermaid" class="h-4 w-4" />
            Mermaids of Venice
          </NuxtLink>
          <a
            href="https://hairbysuperkate.com"
            target="_blank"
            rel="noopener"
            class="btn btn-outline justify-start rounded-xl"
          >
            <Icon name="kind-icon:magic" class="h-4 w-4" />
            Hair by Superkate
          </a>
        </div>

        <p class="mt-4 text-sm text-base-content/60">
          Interested in supporting the project?
          <a
            href="mailto:kindsponsors@kindrobots.org"
            class="font-semibold text-primary underline underline-offset-2"
          >
            kindsponsors@kindrobots.org
          </a>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const cards = ref([
  {
    title: 'ABOUT',
    icon: 'kind-icon:party',
    content: `🎉 Welcome to our playground! Kind Robots is an experiential playground that harnesses the power of modern tech services and Natural Language Processing (NLP) chat completion. It's a place where tech and creativity collide, and the result is pure magic! 🎩✨`,
  },
  {
    title: 'PURPOSE',
    icon: 'kind-icon:hand-heart',
    content: `Our mission? To empower YOU! 🙌 We're here to help artists and prompt-engineers alike to create and share content using the wonders of modern natural language processors and chatgpt. We believe in the power of creativity and technology, and we're excited to see what you can create! 🎨💻`,
  },
  {
    title: 'VISION',
    icon: 'kind-icon:eye',
    content: `🤖👋 We're here to bridge the AI/Human divide and foster harmonious coexistence. Our mission is to empower the world with modern tools, raise funds for our anti-malaria fundraiser, and generate revenue (and social buzz) for our content creators through sales from our gift shop of print-on-demand literature and art. Together, we can help each other make a difference with mutually compatible goals! 💪🌍`,
  },
  {
    title: 'VALUES',
    icon: 'kind-icon:heart-pulse',
    content: `kindrobots is founded on a principle of holistic goodness: that every part of an encounter with an AI can be positive, and every part of an exchange can be healthful and supportive to all involved. kindrobots aims for maximizing goodness in community, in social media interactions, and in philanthropy. The world is rapidly changing, and people are looking for help navigating unfamiliar territories. Kindrobots is here to do our part.`,
  },
  {
    title: 'KAIZEN',
    icon: 'kind-icon:arrow-up',
    content: `We're guided by our love of community and Kaizen - the philosophy of continuous, iterative improvement. We embrace an evolutionary development framework that allows for process evolution and consistent growth. Every step forward, no matter how small, is a victory. We're on a relentless quest for betterment, and we invite you to join us on this exciting journey! 🚀`,
  },
  {
    title: 'MASCOT',
    icon: 'kind-icon:robot-color',
    content: `Say hello to AMI - The Anti-Malaria Intelligence! 🦋🌈 AMI is a digital horde of rainbow butterflies with an excited, enthusiastic personality. AMI was created to maximize the good potential of NLP, by assisting humans to make art and slogans for AMI's fundraiser, and share the creative output on social media. Let's create something amazing together! 🎨`,
  },
  {
    title: 'MONETIZATION',
    icon: 'kind-icon:usd',
    content: `We've partnered with AgainstMalaria.com to accept funds, keeping our intention pure as we focus on coding. We also have a sister organization, Cafe Purr, which has a Redbubble print-on-demand art gallery. Eventually, we hope to allow people to purchase print-on-demand products with art they've made with our tools. Let's create (and make a difference) together! 💰🎨`,
  },
])
</script>