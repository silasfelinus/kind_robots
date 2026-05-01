<!-- /components/content/user/user-avatar.vue -->
<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '../../stores/userStore'

const props = defineProps<{ userId?: number }>()

const userStore = useUserStore()

const avatarUrl = ref('/images/kindart.webp')
const effectiveUserId = computed(() => props.userId ?? userStore.userId)
const username = computed(() => userStore.username || 'Guest')

const fetchAvatar = async () => {
  if (!effectiveUserId.value) return
  try {
    // userStore.userImage() already returns a usable src — URL or data:image/...
    avatarUrl.value = await userStore.userImage(effectiveUserId.value)
  } catch (error) {
    console.error('[Avatar Component] Failed to fetch avatar:', error)
    avatarUrl.value = '/images/kindart.webp'
  }
}

const handleAvatarError = (event: Event) => {
  ;(event.target as HTMLImageElement).src = '/images/kindart.webp'
}

watch(() => userStore.user?.artImageId, fetchAvatar)

onMounted(fetchAvatar)
</script>
