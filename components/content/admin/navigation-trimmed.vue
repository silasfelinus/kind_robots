<template>
  <div class="relative bg-base-200 rounded-2xl m-4 p-4">
    <!-- View Toggle -->
    <div class="absolute top-4 right-4 flex space-x-2 z-50">
      <icon
        name="grommet-icons:grid"
        class="text-2xl cursor-pointer"
        @click="setView('fourRow')"
      />
      <icon
        name="ion:grid-outline"
        class="text-2xl cursor-pointer"
        @click="setView('twoRow')"
      />
      <icon
        name="bi:fullscreen"
        class="text-2xl cursor-pointer"
        @click="setView('single')"
      />
    </div>

    <!-- User Navigation View -->
    <div class="flex flex-wrap">
      <nuxt-link
        v-for="item in userNavigation"
        :key="item.path"
        :to="item.path"
        :class="itemClass"
      >
        <!-- Wrap each item in a transition -->
        <transition name="fade" mode="out-in">
          <!-- Item Layout -->
          <div
            v-show="true"
            class="flex flex-col items-center cursor-pointer hover:bg-accent transition rounded-2xl p-4 relative"
          >
            <div class="flex-grow relative">
              <img
                :src="item.image"
                alt=""
                class="object-cover rounded-2xl border w-full h-[70%]"
              />
              <div
                v-if="view === 'single'"
                class="absolute inset-0 flex justify-center items-center bg-opacity-75 bg-black text-white hover:opacity-100 opacity-0 transition-opacity"
              >
                <div>
                  <div class="text-lg font-bold">
                    {{ item.title }}
                  </div>
                  <div class="text-sm">
                    {{ item.description }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="view !== 'single'" class="text-lg font-bold mt-2">
              {{ item.title }}
            </div>
            <button
              class="bg-primary py-1 px-4 rounded hover:bg-secondary transition mt-2"
            >
              Go
            </button>
          </div>
        </transition>
      </nuxt-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import { userNavigation } from '@/training/userNavigation'

const view = ref('twoRow')
const itemClass = ref('w-1/2 p-4')

// Load saved view from local storage
onMounted(() => {
  const savedView = window.localStorage.getItem('view')
  if (savedView) {
    view.value = savedView
  }
})

const setView = (newView: string) => {
  view.value = newView
  window.localStorage.setItem('view', newView)
}

watch(view, (newView) => {
  if (newView === 'twoRow') {
    itemClass.value = 'w-1/2 p-4'
  } else if (newView === 'fourRow') {
    itemClass.value = 'w-1/4 p-4'
  } else if (newView === 'single') {
    itemClass.value = 'w-full p-4'
  }
})
</script>

<style scoped>
.icon {
  width: 24px;
  height: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.flex-grow {
  flex-grow: 1;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
