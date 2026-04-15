<!-- /app.vue -->
<script setup lang="ts">
// /app.vue
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartbarStore } from '@/stores/smartbarStore'

const smartbarStore = useSmartbarStore()
const router = useRouter()

const isNavigating = ref(false)

const showSwarm = computed(() => smartbarStore.showSwarm)

router.beforeEach(() => {
  isNavigating.value = true
})

router.afterEach(() => {
  setTimeout(() => {
    isNavigating.value = false
  }, 400)
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>
