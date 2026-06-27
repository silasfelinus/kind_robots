<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4">
    <header class="flex items-start gap-3">
      <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
        <Icon name="kind-icon:server" class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wide text-accent/70">Portos</p>
        <h2 class="text-2xl font-black leading-tight">Portos Server Setup</h2>
        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          This tab is reserved for connecting a Porto server address and saving the user/server pairing cleanly once the server entry flow is wired in.
        </p>
      </div>
    </header>

    <div class="grid gap-3 md:grid-cols-2">
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <h3 class="font-bold">Planned flow</h3>
        <p class="mt-2 text-sm leading-relaxed text-base-content/70">
          Let the user add a Porto server address, validate that the endpoint responds, then save the server metadata through the normal server records instead of hiding it in component state.
        </p>
      </article>
      <article class="rounded-2xl border border-base-300 bg-base-200 p-4">
        <h3 class="font-bold">Not built yet</h3>
        <p class="mt-2 text-sm leading-relaxed text-base-content/70">
          The UI here is intentionally a placeholder so the Conductor tab split can land without inventing the Porto persistence contract too early. Tiny robot bureaucracy, but make it safe.
        </p>
      </article>
    </div>
  </section>
</template>
