<template>
  <main class="kr-surface bg-base-300/35">
    <div class="kr-scroll min-h-0 flex-1 px-2 py-2 sm:px-4 sm:py-4">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <section
          class="relative isolate min-h-56 overflow-hidden rounded-3xl border border-amber-200/30 bg-stone-950 text-amber-50 shadow-xl sm:min-h-72"
          aria-label="The World of Zuzu"
        >
          <img
            src="/zuzu-showdown-portraits/zuzu-vs-hd.webp"
            alt=""
            class="absolute inset-0 h-full w-full object-cover object-center opacity-55"
          />
          <div
            class="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/90 to-stone-950/10"
          />
          <div
            class="relative z-10 flex min-h-56 flex-col justify-between gap-5 p-5 sm:min-h-72 sm:max-w-2xl sm:p-8"
          >
            <div>
              <p
                class="text-xs font-black uppercase tracking-[0.35em] text-amber-300"
              >
                Five adventures · One shifting frontier
              </p>
              <h2
                class="mt-2 font-serif text-4xl font-black leading-none tracking-tight sm:text-6xl"
              >
                The World of Zuzu
              </h2>
              <p
                class="mt-3 max-w-lg text-sm leading-relaxed text-amber-100/90 sm:text-base"
              >
                An Edo-era koala ronin rides into a weird west where borders
                move, old debts refuse to die, and something happened to the
                humans. Choose the story, the battlefield or the road ahead.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <NuxtLink
                to="/play/zuzu-gamebook"
                class="btn btn-warning btn-sm font-black text-stone-950"
              >
                Begin the Gamebook
                <Icon name="kind-icon:arrow-right" class="size-4" />
              </NuxtLink>
              <NuxtLink
                to="/play/zuzu-showdown"
                class="btn btn-sm border-amber-100/40 bg-stone-900/70 text-amber-50 hover:bg-stone-800"
              >
                Enter the Showdown
              </NuxtLink>
            </div>
          </div>
        </section>

        <div class="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <p
              class="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary"
            >
              Pick a doorway
            </p>
            <h2 class="font-serif text-xl font-black sm:text-2xl">
              Five ways into the Shifting Lands
            </h2>
          </div>
          <NuxtLink
            to="/play/arcade"
            class="text-xs font-bold text-primary hover:underline"
          >
            Visit the Arcade →
          </NuxtLink>
        </div>

        <section
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3 pb-4"
          aria-label="Zuzu adventures"
        >
          <NuxtLink
            v-for="adventure in adventures"
            :key="adventure.route"
            :to="adventure.route"
            class="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div class="relative aspect-[16/9] overflow-hidden bg-stone-900">
              <img
                :src="adventure.image"
                :alt="adventure.title"
                loading="lazy"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span
                class="absolute bottom-2 left-2 rounded-full bg-stone-950/90 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wide text-amber-50"
              >
                {{ adventure.genre }}
              </span>
            </div>
            <div class="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-4">
              <h3
                class="font-serif text-lg font-black group-hover:text-primary"
              >
                {{ adventure.title }}
              </h3>
              <p class="flex-1 text-xs leading-relaxed opacity-75 sm:text-sm">
                {{ adventure.description }}
              </p>
              <span class="mt-1 text-xs font-black text-primary">
                {{ adventure.action }} →
              </span>
            </div>
          </NuxtLink>
        </section>
        <p class="px-1 pb-3 text-xs opacity-60">
          This world is still growing. Each adventure is playable now, with new
          chapters, encounters and artwork arriving over time.
        </p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
const adventures = [
  {
    title: 'The Bell That Never Rang',
    genre: 'Gamebook',
    route: '/play/zuzu-gamebook',
    image: '/zuzu-gamebook/scenes/waterhole.webp',
    description:
      'Choose your road through an illustrated adventure. Roll dice, survive fights and discover diverging endings.',
    action: 'Open the book',
  },
  {
    title: 'Shifting Lands',
    genre: 'Board adventure',
    route: '/play/zuzu-shifting-lands',
    image: '/images/adventure/card/card-back1.webp',
    description:
      'Travel five changing lands, draw encounters, gather supplies and decide which threats deserve a fight.',
    action: 'Explore the board',
  },
  {
    title: 'Zuzu Showdown',
    genre: 'Fighting game',
    route: '/play/zuzu-showdown',
    image: '/zuzu-showdown-art/hall-card.webp',
    description:
      'Nine fighters, rivalries and a Story mode stretching across the wasteland. Challenge the world or a friend.',
    action: 'Choose your fighter',
  },
  {
    title: 'Ghost Trail',
    genre: 'Action platformer',
    route: '/play/zuzu-ghost-trail',
    image: '/images/arcade/games/zuzu-ghost-trail-title.webp',
    description:
      'Fight across a haunted frontier. Dodge, jump and cut a path through increasingly dangerous ground.',
    action: 'Take the trail',
  },
  {
    title: 'The Last Bell',
    genre: 'Pinball preview',
    route: '/play/zuzu-pinball',
    image: '/zuzu-showdown-portraits/zuzu-vs-hd.webp',
    description:
      'Launch a steel ball toward the River Croc, Abbey bell and hidden passages in a developing 3D table.',
    action: 'Play the table',
  },
] as const
</script>
