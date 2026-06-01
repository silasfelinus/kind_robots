<template>
  <div class="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-base-200">
    <dashboard-shell class="shrink-0" />

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-2 sm:p-3 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_20rem]"
    >
      <aside
        class="hidden min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 lg:flex lg:flex-col"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <slot name="left">
            <splash-tutorial />
          </slot>
        </div>
      </aside>

      <main
        class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div
          class="h-full min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4"
        >
          <slot />
        </div>
      </main>

      <aside
        class="hidden min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:flex xl:flex-col"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <slot name="right">
            <user-panel />
          </slot>
        </div>
      </aside>
    </div>
  </div>
</template>
