<template>
  <section class="kr-container flex flex-col gap-4 p-4 sm:p-6">
    <header class="flex items-start gap-3">
      <span
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
      >
        <Icon name="kind-icon:users" class="kr-icon-6" />
      </span>
      <div>
        <h1 class="kr-text-black-2xl">Connect</h1>
        <p class="kr-text-dim-sm mt-1">
          Account settings, the newsfeed, and your people now share one Home doorway.
        </p>
      </div>
    </header>

    <div class="home-account-links-grid grid gap-3">
      <NuxtLink
        to="/account"
        class="kr-panel flex min-h-40 flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      >
        <Icon name="kind-icon:settings" class="kr-icon-primary-7" />
        <div>
          <h2 class="font-black">Account</h2>
          <p class="kr-text-dim-sm mt-1">
            Privacy, consent, password, email, and creator earnings.
          </p>
        </div>
        <span class="mt-auto text-sm font-bold text-primary">Open account →</span>
      </NuxtLink>

      <NuxtLink
        to="/plan/newsfeed"
        class="kr-panel flex min-h-40 flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      >
        <Icon name="kind-icon:news" class="kr-icon-primary-7" />
        <div>
          <h2 class="font-black">Newsfeed</h2>
          <p class="kr-text-dim-sm mt-1">
            Fresh art, stories, projects, and gathered updates in one stream.
          </p>
        </div>
        <span class="mt-auto text-sm font-bold text-primary">Open newsfeed →</span>
      </NuxtLink>

      <NuxtLink
        to="/friends"
        class="kr-panel flex min-h-40 flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
      >
        <Icon name="kind-icon:users" class="kr-icon-primary-7" />
        <div>
          <h2 class="font-black">Friends</h2>
          <p class="kr-text-dim-sm mt-1">
            Friend requests, people, chats, messages, and blocks.
          </p>
        </div>
        <span class="mt-auto text-sm font-bold text-primary">Open friends →</span>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.home-account-links-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
}
</style>
