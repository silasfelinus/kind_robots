<script setup lang="ts">
const title = ref('Kind Robots')

useSeoMeta({
  title,
  ogTitle: title,
})

definePageMeta({
  layout: 'default',
})
</script>
