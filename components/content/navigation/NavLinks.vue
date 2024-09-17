<!-- components/NavLinks.vue -->
<template>
  <nav
    class="flex gap-4 items-center mx-auto text-center flex-wrap justify-center min-w-0"
  >
    <nuxt-link
      to="/"
      class="text-accent text-lg hover:underline whitespace-nowrap"
      >Kind Robots</nuxt-link
    >
    <nuxt-link
      to="/intro"
      class="text-accent text-lg hover:underline whitespace-nowrap"
      >Welcome</nuxt-link
    >
    <nuxt-link
      to="/memory"
      class="text-accent text-lg hover:underline whitespace-nowrap"
      >Art</nuxt-link
    >
    <nuxt-link
      to="/botcafe"
      class="text-accent text-lg hover:underline whitespace-nowrap"
      >PromptBots</nuxt-link
    >
    <nuxt-link
      to="/amibot"
      class="text-accent text-lg hover:underline whitespace-nowrap"
      >AMI</nuxt-link
    >
  </nav>
</template>
