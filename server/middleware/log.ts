export default defineEventHandler((res) => {
  console.log('New request: ' + getRequestURL(res))
})
