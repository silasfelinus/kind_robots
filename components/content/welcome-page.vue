<template>
  <div class="min-h-screen bg-gradient-to-r from-primary to-secondary flex flex-col">
    <div class="flex-grow p-6 md:p-12 overflow-auto">
      <site-header>
        <div class="hero">
          <img src="/images/kindtitle.webp" alt="Kind Robots" />
          <h1>Welcome to Kind Robots</h1>
          <p>Your AI friend powered by ChatGPT.</p>
        </div>
        <slot name="headline"> </slot><site-title class="text-lg sm:text-xl font-bold"
      /></site-header>
    </div>
    <site-footer>
      <slot name="footer"></slot>
    </site-footer>
  </div>
</template>
