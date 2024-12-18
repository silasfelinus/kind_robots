<template>
  <div class="flex flex-col items-center justify-center gap-4 text-center p-4">
    <!-- Animated Image -->
    <img
      src="/images/gifs/robo_alert.gif"
      alt="Confused Bot"
      class="w-32 h-32 md:w-48 md:h-48 mx-auto"
    />

    <!-- Error Message -->
    <div>
      <Icon name="kind-icon:error" class="text-error text-5xl" />
      <p class="text-lg font-semibold mt-4">Oops! Something went wrong.</p>
      <p class="text-sm text-gray-500 mt-2">
        Please select a different mode or action.
      </p>
    </div>
  </div>
</template>
