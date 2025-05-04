<!-- /components/content/story/smart-icons.vue -->
<template>
  <div class="relative w-full h-full max-h-[4rem] overflow-hidden">
    <div class="relative w-full h-full flex items-center pr-[4.5rem]">
      <!-- Scroll Buttons -->
      <!-- ... unchanged ... -->

      <!-- Scrollable Area -->
      <div
        ref="scrollContainer"
        class="overflow-x-auto scrollbar-hide w-full h-full touch-pan-x snap-x snap-mandatory"
        @scroll="checkScrollEdges"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @touchstart="startTouch"
        @touchmove="onTouchMove"
        @touchend="endDrag"
      >
        <div class="flex items-center gap-6 min-w-fit px-2 h-full select-none">
          <div
            v-for="(icon, index) in editableIcons"
            :key="icon.id"
            class="group relative flex flex-col items-center justify-center snap-start"
            :class="{ 'cursor-move': isEditing }"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @drop="onDrop(index)"
          >
            <!-- Nav Icon -->
            <NuxtLink
              v-if="!isEditing && icon.link && icon.type !== 'utility'"
              :to="icon.link"
              class="flex flex-col items-center"
            >
              <Icon
                :name="icon.icon || 'lucide:help-circle'"
                class="hover:scale-110 transition-transform text-3xl w-[3rem] h-[3rem]"
              />
              <span
                class="absolute top-full left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-base-200 shadow-md text-xs text-center whitespace-nowrap z-40 transition-opacity duration-200 pointer-events-none"
                :class="bigMode ? 'opacity-0 group-hover:opacity-100' : 'hidden md:block'"
              >
                {{ icon.label || icon.title }}
              </span>
            </NuxtLink>

            <!-- Utility Component -->
            <div
              v-else-if="icon.type === 'utility'"
              class="flex items-center justify-center text-3xl w-[3rem] h-[3rem]"
            >
              <component :is="icon.component" />
            </div>

            <!-- Fallback or edit-mode icon -->
            <Icon
              v-else
              :name="icon.icon || 'lucide:help-circle'"
              class="text-3xl w-[3rem] h-[3rem]"
            />

            <!-- Remove Button -->
            <button
              v-if="isEditing"
              class="mt-1 text-xs bg-red-500 text-white rounded-full px-2 py-0.5 hover:bg-red-600"
              @click="removeIcon(index)"
            >
              ✕
            </button>
          </div>

          <!-- Add Icon -->
          <NuxtLink
            to="/icongallery"
            @click="isEditing && confirmEdit()"
            class="group flex flex-col items-center justify-center text-3xl w-[3rem] h-[3rem] snap-start"
          >
            <Icon name="lucide:plus-circle" class="hover:scale-110 transition-transform" />
            <span
              class="absolute top-full left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-base-200 shadow-md text-xs text-center whitespace-nowrap z-40 transition-opacity duration-200 pointer-events-none"
              :class="bigMode ? 'opacity-0 group-hover:opacity-100' : 'hidden md:block'"
            >
              Add Icon
            </span>
          </NuxtLink>
        </div>
      </div>

      <!-- Edit / Confirm / Revert Buttons -->
      <!-- ... unchanged ... -->
    </div>
  </div>
</template>

<!-- script and scroll logic unchanged -->

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
