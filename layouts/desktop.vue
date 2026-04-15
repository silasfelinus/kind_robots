<!-- /layouts/desktop.vue -->
<template>
  <div class="relative flex flex-col min-h-dvh w-full overflow-hidden bg-base-100">
    <div class="pointer-events-none absolute inset-0 bg-info/5"></div>

    <div
      v-if="showHeaderFinal"
      class="relative z-10 w-full shrink-0 border-b border-base-300 bg-info/10"
      :style="{ height: `calc(var(--vh) * ${headerHeight})` }"
    >
      <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-info bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-info shadow-lg">
        H1 Desktop Header
      </div>

      <button
        class="btn btn-xs btn-outline absolute right-2 top-2 z-30 rounded-2xl"
        @click="debugStore.toggle('header')"
      >
        Toggle
      </button>

      <header class="h-full w-full min-h-0 pt-8">
        <slot name="header">
          <div
            v-if="debugStore.enabled && debugStore.fillerHeader"
            class="flex h-full items-center justify-between gap-4 px-5"
          >
            <div class="flex items-center gap-3">
              <Icon name="kind-icon:butterfly." class="text-3xl text-info" />
              <div>
                <div class="font-black">Kind Robots Desktop</div>
                <div class="text-xs opacity-70">Header filler with title and controls</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn btn-xs rounded-2xl">Search</button>
              <button class="btn btn-xs rounded-2xl">Create</button>
              <button class="btn btn-xs rounded-2xl">Theme</button>
              <button class="btn btn-xs rounded-2xl">Profile</button>
            </div>
          </div>

          <main-header v-else />
        </slot>
      </header>
    </div>

    <div class="relative z-10 flex flex-1 min-h-0 w-full overflow-hidden">
      <aside
        v-if="showLeftSidebarFinal"
        class="relative shrink-0 h-full overflow-y-auto border-r border-base-300 bg-secondary/10"
        :style="{ width: `${sidebarLeftWidth}vw` }"
      >
        <div class="pointer-events-none absolute left-2 top-2 z-20 rounded-2xl border border-secondary bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-secondary shadow-lg">
          L2 Desktop Left
        </div>

        <button
          class="btn btn-xs btn-outline absolute right-2 top-2 z-30 rounded-2xl"
          @click="debugStore.toggle('left')"
        >
          Toggle
        </button>

        <div class="h-full min-h-0 pt-8">
          <slot name="left">
            <div
              v-if="debugStore.enabled && debugStore.fillerLeft"
              class="flex h-full flex-col gap-3 p-3"
            >
              <button class