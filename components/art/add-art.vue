<template>
  <section class="w-full h-full">
    <div
      class="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-6"
    >
      <div
        class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <h1 class="text-2xl font-bold text-primary sm:text-3xl">
          🎨 Art-Maker
        </h1>
        <p class="text-sm text-base-content/70 sm:text-base">
          Pick a model, build a prompt, choose a gallery, then make something
          weird.
        </p>
      </div>

      <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
        <div class="xl:col-span-3">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">🧠 Model</div>
            <checkpoint-gallery />
          </div>
        </div>

        <div class="xl:col-span-6">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">📝 Prompt</div>
            <art-randomizer />
          </div>
        </div>

        <div class="xl:col-span-3">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 text-lg font-semibold text-primary">
              🏛️ Gallery
            </div>
            <collection-gallery />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <art-display />
      </div>
    </div>
  </section>
</template>
