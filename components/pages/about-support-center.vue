<template>
  <div class="flex min-h-0 flex-col gap-6">
    <section class="kr-container flex flex-col gap-4 p-4 sm:p-6">
      <header class="flex items-start gap-3">
        <span
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
        >
          <Icon name="kind-icon:heart" class="h-6 w-6" />
        </span>
        <div>
          <h1 class="text-2xl font-black">About & Support</h1>
          <p class="kr-text-dim-sm mt-1">
            Meet the project, give directly to Against Malaria, or visit the shop.
          </p>
        </div>
      </header>

      <div class="grid gap-3 md:grid-cols-3">
        <NuxtLink
          to="/about"
          class="kr-panel flex min-h-32 flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
        >
          <Icon name="kind-icon:butterfly" class="h-6 w-6 text-primary" />
          <h2 class="font-black">About</h2>
          <p class="kr-text-dim-sm">The story, values, community, and mission.</p>
        </NuxtLink>

        <NuxtLink
          to="/giving"
          class="kr-panel flex min-h-32 flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
        >
          <Icon name="kind-icon:hand-heart" class="h-6 w-6 text-primary" />
          <h2 class="font-black">Giving</h2>
          <p class="kr-text-dim-sm">Give directly to AMF or support Kind Robots.</p>
        </NuxtLink>

        <NuxtLink
          to="/sanctuary"
          class="kr-panel flex min-h-32 flex-col gap-2 p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
        >
          <Icon name="kind-icon:gift" class="h-6 w-6 text-primary" />
          <h2 class="font-black">Gift Shop</h2>
          <p class="kr-text-dim-sm">Creative products, subscriptions, and mission support.</p>
        </NuxtLink>
      </div>
    </section>

    <about-page />
  </div>
</template>
