<template>
  <div class="kr-unbound items-center gap-4 bg-(--kr-surface) py-6 px-4">
    <div class="w-full max-w-2xl">
      <div class="mb-6 flex flex-col items-center gap-2 text-center">
        <span
          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent text-primary-content shadow-lg"
        >
          <Icon name="kind-icon:robot-color" class="kr-icon-8" />
        </span>
        <p class="text-3xl font-black text-base-content">Kind Robots</p>
        <p class="kr-text-dim-sm max-w-md">
          Free, handmade games and stories, with no ads, raising money to fight
          malaria.
        </p>
      </div>

      <section class="kr-panel mb-6 p-4">
        <div class="mb-3 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
          >
            <Icon name="kind-icon:heart" class="kr-icon-5" />
          </span>
          <div>
            <p class="font-black">Support</p>
            <p class="kr-text-dim-xs-60">
              Meet the project, give directly to Against Malaria, or visit the shop.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <NuxtLink to="/about" class="btn btn-outline min-w-36 flex-1 justify-start rounded-xl">
            <Icon name="kind-icon:butterfly" class="kr-icon-4" />
            About
          </NuxtLink>
          <NuxtLink to="/giving" class="btn btn-outline min-w-36 flex-1 justify-start rounded-xl">
            <Icon name="kind-icon:hand-heart" class="kr-icon-4" />
            Giving
          </NuxtLink>
          <NuxtLink to="/sanctuary" class="btn btn-outline min-w-36 flex-1 justify-start rounded-xl">
            <Icon name="kind-icon:gift" class="kr-icon-4" />
            Gift Shop
          </NuxtLink>
        </div>
      </section>

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
              <Icon :name="card.icon" class="kr-icon-5" />
            </span>
            <h2
              class="kr-text-eyebrow text-base tracking-wider text-base-content"
            >
              {{ card.title }}
            </h2>
          </div>
          <p class="kr-text-dim-sm-70 leading-relaxed">
            {{ card.content }}
          </p>
        </div>
      </div>

      <section class="kr-panel mt-6 border-primary/25 p-5">
        <div class="mb-3 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
          >
            <Icon name="kind-icon:heart" class="kr-icon-5" />
          </span>
          <h2 class="kr-text-eyebrow text-base tracking-wider text-base-content">
            Community & Sponsors
          </h2>
        </div>

        <p class="kr-text-dim-sm-70 leading-relaxed">
          Kind Robots grew up alongside creative friends and projects that share
          its spirit. Donations go directly to the Against Malaria Foundation
          through the AMIbot fundraiser, and these friends keep the wider
          creative neighborhood lively.
        </p>

        <div class="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div class="mb-2 flex items-center gap-2">
            <Icon name="kind-icon:butterfly" class="kr-icon-4 text-primary" />
            <p class="kr-text-bold-content">How the mission share works</p>
          </div>
          <p class="kr-text-dim-sm-70 leading-relaxed">
            Direct donations still go straight to Against Malaria and never pass
            through Kind Robots. Separately, paid Kind Robots usage keeps an
            auditable internal revenue ledger: after provider costs, the current
            model divides net revenue among the platform, the anti-malaria mission,
            and the attributed creator. The mission portion is an accounting
            obligation until it is actually remitted, not a donation receipt or a
            claim that money has already reached the fundraiser. Rainbow Butterflies
            and AMI own the mission-facing reconciliation and transparency around
            that process.
          </p>
        </div>

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <a
            href="https://www.againstmalaria.com/amibot"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline justify-start rounded-xl"
          >
            <Icon name="kind-icon:hand-heart" class="kr-icon-4" />
            AMIbot fundraiser
          </a>
          <a
            href="https://www.redbubble.com/people/CafePurr/shop"
            target="_blank"
            rel="noopener"
            class="btn btn-outline justify-start rounded-xl"
          >
            <Icon name="kind-icon:image" class="kr-icon-4" />
            Cafe Purr
          </a>
          <NuxtLink
            to="/mermaids"
            class="btn btn-outline justify-start rounded-xl"
          >
            <Icon name="kind-icon:mermaid" class="kr-icon-4" />
            Mermaids of Venice
          </NuxtLink>
          <a
            href="https://hairbysuperkate.com"
            target="_blank"
            rel="noopener"
            class="btn btn-outline justify-start rounded-xl"
          >
            <Icon name="kind-icon:magic" class="kr-icon-4" />
            Hair by Superkate
          </a>
        </div>

        <p class="kr-text-dim-sm mt-4">
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
    title: 'WHAT THIS IS',
    icon: 'kind-icon:play',
    content: `Kind Robots is a playground of free, handmade games and interactive stories: arcade cabinets, illustrated gamebooks, card adventures, pinball tables and more. Many of them run entirely without AI. They were drawn, written and built by hand, and you can play them without making an account.`,
  },
  {
    title: 'CREATIVE STUDIOS',
    icon: 'kind-icon:magic',
    content: `For people who want them, there are optional AI-assisted studios for making art, stories and music videos. They are there to help with your own ideas. Nothing else on the site depends on them, and you never have to use them to play.`,
  },
  {
    title: 'NO ADS',
    icon: 'kind-icon:eye',
    content: `There are no ads here, and nobody is selling your attention. The games are free because that is the point of them.`,
  },
  {
    title: 'AGAINST MALARIA',
    icon: 'kind-icon:hand-heart',
    content: `Kind Robots raises money for the Against Malaria Foundation, which funds bed nets that protect families from malaria. Gifts go through a direct fundraiser page at againstmalaria.com/amibot, straight to the foundation. Kind Robots never touches that money.`,
  },
  {
    title: 'MASCOT',
    icon: 'kind-icon:butterfly',
    content: `AMI, the Anti-Malaria Intelligence, is a cheerful swarm of rainbow butterflies. You will find AMI around the site, cheering on the fundraiser and anyone making something.`,
  },
  {
    title: 'WHO MAKES IT',
    icon: 'kind-icon:heart',
    content: `Kind Robots is made by Silas Knight in Northern California. Silas is a street performer, the author of the novel Mermaids of Venice, and a Rocky Horror host. He builds the site a little at a time, and it gets a bit better most weeks.`,
  },
])
</script>
