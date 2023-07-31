<template>
  <div class="h-screen flex flex-col">
    <div class="flex-grow">
      <slot />
      <div class="bg-base-100 p-4">
        <div>
          <avatar-image />
        </div>
      </div>
    </div>
  </div>
</template>
