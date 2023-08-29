<script setup>
const selectedModel = ref('User') // default model
let data = ref(null)

// Fetch data when component is mounted or when selectedModel changes
onMounted(fetchData)
watch(selectedModel, fetchData)

function fetchData() {
  const {
    fetch,
    data: fetchedData,
    error
  } = useFetch(async () => {
    return await fetch(`/api/${selectedModel.value}`)
  })

  fetch()

  data.value = fetchedData.value
  if (error.value) {
    console.error('Failed to fetch data:', error.value)
  }
}
</script>
