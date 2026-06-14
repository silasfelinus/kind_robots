<!-- /components/tutorial-page.vue -->
<template>
  <div
    v-if="visible && config"
    :class="
      inline
        ? 'tutorial-inline'
        : 'fixed inset-0 z-50 flex items-center justify-center p-4'
    "
  >
    <div
      v-if="!inline"
      class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"
      @click="close"
    />

    <section
      class="relative flex w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl"
      :class="inline ? '' : 'max-h-[90vh] max-w-2xl'"
      :role="inline ? undefined : 'dialog'"
      :aria-modal="inline ? undefined : true"
      :aria-label="`${config.title} tutorial`"
    >
      <header class="relative shrink-0">
        <div class="relative aspect-16/6 w-full overflow-hidden bg-base-200">
          <img
            v-if="heroImage"
            :src="heroImage"
            :alt="`${config.title} tutorial`"
            class="h-full w-full object-cover"
          />

          <div
            class="absolute inset-0 bg-linear-to-t from-base-300/90 via-base-300/30 to-transparent"
          />

          <div class="absolute inset-x-0 bottom-0 px-5 pb-4 sm:px-6">
            <p
              class="mb-1 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-base-100/80 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary shadow-sm backdrop-blur"
            >
              <Icon name="kind-icon:info" class="h-3.5 w-3.5" />
              Tutorial
            </p>

            <h2 class="text-2xl font-black text-base-content drop-shadow-sm">
              {{ config.title }}
            </h2>

            <p
              v-if="config.tagline"
              class="mt-1 text-sm font-semibold italic text-base-content/80 drop-shadow-sm"
            >
              {{ config.tagline }}
            </p>
          </div>
        </div>

        <button
          v-if="!inline"
          type="button"
          class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 bg-base-100/70 backdrop-blur-sm"
          aria-label="Close tutorial"
          @click="close"
        >
          ✕
        </button>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <p class="text-base font-semibold leading-relaxed text-base-content/80">
          {{ config.overview }}
        </p>

        <div
          v-if="