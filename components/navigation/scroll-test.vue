<!-- /components/debug/scroll-test.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <header
      class="shrink-0 rounded-2xl border border-info/40 bg-info/10 p-4 text-info"
    >
      <h2 class="text-xl font-black">Scroll Test Goblin</h2>
      <p class="text-sm font-medium opacity-80">
        If this does not scroll vertically, the problem is above this component.
      </p>
    </header>

    <section
      class="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div class="flex min-h-[2400px] flex-col gap-4">
        <article
          v-for="item in items"
          :key="item"
          class="rounded-2xl border border-base-300 bg-base-200 p-5 shadow-sm"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-widest text-primary">
                Scroll Row {{ item }}
              </p>

              <h3 class="mt-1 text-2xl font-black text-base-content">
                This card exists to force vertical overflow
              </h3>

              <p class="mt-2 max-w-3xl text-base leading-relaxed text-base-content/70">
                This is intentionally chunky test content. The scroll container
                is the inner rounded panel, not the page, not the body, not the
                dashboard shell. If the scrollbar appears here and moves smoothly,
                your outer app shell is allowing nested scrolling correctly.
              </p>
            </div>

            <div
              class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-content"
            >
              {{ item }}
            </div>
          </div>
        </article>

        <div
          class="rounded-2xl border border-success/40 bg-success/10 p-6 text-success"
        >
          <p class="text-2xl font-black">Bottom reached ✅</p>
          <p class="mt-2 text-sm font-medium opacity-80">
            If you can see this, the scroll chain is working.
          </p>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
const items = Array.from({ length: 32 }, (_, index) => index + 1)
</script>