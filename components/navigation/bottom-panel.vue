<!-- /components/navigation/bottom-panel.vue -->
<template>
  <nav
    class="flex h-full w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100/90 p-2 shadow-xl shadow-base-content/10 backdrop-blur"
    aria-label="Display toggles"
  >
    <button
      type="button"
      aria-label="Toggle sidebar"
      title="Toggle sidebar"
      class="group flex h-full min-h-0 aspect-square items-center justify-center overflow-hidden rounded-2xl border border-base-300/80 bg-base-200/80 text-base-content shadow-lg shadow-base-content/10 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-secondary-content active:translate-y-0 active:scale-95"
    >
      <span
        class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-[inherit] bg-linear-to-b from-white/15 to-transparent px-2 text-center"
      >
        <Icon
          name="kind-icon:butterfly"
          class="h-5 w-5 shrink-0 transition-transform duration-300 ease-out group-hover:scale-110"
        />

        <span
          class="hidden max-w-full truncate text-[0.65rem] font-semibold uppercase tracking-wide opacity-80 sm:block"
        >
          Sidebar
        </span>
      </span>
    </button>

    <button
      type="button"
      aria-label="Toggle header"
      title="Toggle header"
      class="group flex h-full min-h-0 aspect-square items-center justify-center overflow-hidden rounded-2xl border border-primary/60 bg-primary/15 text-primary shadow-lg shadow-base-content/10 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary hover:text-primary-content active:translate-y-0 active:scale-95"
    >
      <span
        class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-[inherit] bg-linear-to-b from-white/15 to-transparent px-2 text-center"
      >
        <Icon
          name="kind-icon:chevron-up"
          class="h-5 w-5 shrink-0 transition-transform duration-300 ease-out group-hover:scale-110"
        />

        <span
          class="hidden max-w-full truncate text-[0.65rem] font-semibold uppercase tracking-wide opacity-80 sm:block"
        >
          Header
        </span>
      </span>
    </button>
  </nav>
</template>