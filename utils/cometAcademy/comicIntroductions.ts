import { identityFor } from './identityArcs'
import { henchmanForVillain } from './villainHenchmen'
import { campaignStagesFor } from './identityCampaignStages'
import { identityArtKey } from './artSlots'
import type { SignaturePowerId } from './specialPowers'

export type ComicIntroRole = 'hero' | 'villain' | 'henchman' | 'lieutenant'
export type ComicIntro = {
  key: string
  name: string
  role: ComicIntroRole
  issue: string
  tagline: string
  caption: string
  artKey: string | null
  motif: 'sunrise' | 'danger' | 'underworld' | 'command'
}

export function comicIntroFor(
  signature: SignaturePowerId,
  role: ComicIntroRole,
): ComicIntro {
  const identity = identityFor(signature)
  const crew = henchmanForVillain(signature)
  const campaign = campaignStagesFor(signature)
  const base = {
    key: signature + ':' + role,
    role,
    issue: 'COMET CITY / FIRST APPEARANCE',
  }
  switch (role) {
    case 'hero':
      return {
        ...base,
        name: identity.hero.alias,
        tagline: identity.hero.focus.toUpperCase() + ' / THE CITY NEEDS A HERO',
        caption: identity.hero.method,
        motif: 'sunrise',
        artKey: identityArtKey(signature, 'hero'),
      }
    case 'villain':
      return {
        ...base,
        name: identity.villain.alias,
        tagline: "VILLAIN / EVERYONE IS SOMEONE ELSE'S NEMESIS",
        caption: identity.villain.method,
        motif: 'danger',
        artKey: identityArtKey(signature, 'villain'),
      }
    case 'henchman':
      return {
        ...base,
        name: crew.name,
        tagline: 'ONE-HIT CREW / LED BY ' + crew.captain.toUpperCase(),
        caption: crew.move,
        motif: 'underworld',
        artKey: null,
      }
    case 'lieutenant':
      return {
        ...base,
        name: campaign.lieutenant.name,
        tagline: 'SECOND-IN-COMMAND / SIGNATURE THREAT',
        caption: campaign.lieutenant.power,
        motif: 'command',
        artKey: null,
      }
  }
}

/**
 * Lettering and captions are always rendered as real accessible HTML by
 * ComicCharacterReveal; prompts produce clean character art without typography.
 * One stable key per villain identity and role is shared by both games.
 */
export const COMIC_INTRO_ART_SLOTS = [
  'poster-front',
  'intro-clean-art',
  'portrait-neutral',
  'story-neutral',
  'tactical-standee-2x1',
] as const

export const COMIC_INTRO_PROMPT = {
  key: 'comic-introduction',
  label: 'Comic-book character intro / art-only',
  base: 'Full-figure commanding superhero comic-panel introduction illustration, mature Western animation, confident readable silhouette, kinetic diagonal composition, cinematic cel shading and painted shadows, halftone accent shapes, generous negative space across lower third for a separate typographic title overlay, thick ink outlines, dimensional action pose, no words, no lettering, no logo, no watermark.',
  requirement:
    'Character identity, costume and pose must agree with the approved poster. Keep all names and captions OUT of the image; rendered UI adds lettering.',
  aspect: '3:2',
} as const
