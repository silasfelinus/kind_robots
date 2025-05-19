// server-only: runs only during SSR or from server context
export const usePageContent = async (path: string) => {
  const result = await queryCollection('content').path(path).first()
  return result
}
