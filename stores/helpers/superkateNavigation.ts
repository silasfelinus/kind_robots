// Navigation visibility is a convenience, not a data-access boundary.
// Client records remain protected by the owner-scoped stylist API.
type ServicesViewer = {
  id?: number | null
  username?: string | null
  email?: string | null
}

export function isSuperkateServicesViewer(
  user: ServicesViewer | null | undefined,
  isAdmin = false,
): boolean {
  if (isAdmin) return true
  if (!user) return false
  if (user.id === 1279) return true

  const username = user.username?.trim().toLowerCase()
  const email = user.email?.trim().toLowerCase()
  return (
    username === 'superkate' ||
    email === 'superkate@gmail.com' ||
    email === 'superkate@kindrobots.org'
  )
}
