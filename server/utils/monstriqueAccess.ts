import {
  viewerShowsMature,
  type MaturityUser,
} from '~/server/utils/contentAccess'

export type MonstriqueAudience = 'general' | 'mature'

export interface MonstriqueViewer {
  kind?: string | null
  user?: MaturityUser | null
}

/**
 * Which MONSTRIQUE edition a request may receive. Only a signed-in human
 * session (a Kind Robots JWT) whose persisted account is opted in and not
 * CHILD (CHILD+ADMIN included) gets the mature edition. API keys, agent
 * credentials, delegated product surfaces, the beta admin key, guests and
 * invalid tokens all get the general edition. No query string can change it.
 */
export function monstriqueAudienceFor(
  auth: MonstriqueViewer | null | undefined,
): MonstriqueAudience {
  return auth?.kind === 'jwt' && viewerShowsMature(auth.user)
    ? 'mature'
    : 'general'
}
