<template>
  <div class="h-screen flex flex-col items-center justify-center text-center text-2xl font-serif">
    <div class="flex-grow flex flex-row pt-12">
      <transition name="fade" mode="out-in"> <slot class="relative z-10" /> </transition>
    </div>
  </div>
</template>
