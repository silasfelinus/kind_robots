export default defineEventHandler((event) => {
  const { OPENAI_API_KEY } = useRuntimeConfig()
  console.log(OPENAI_API_KEY)
  console.log('testing')
})
