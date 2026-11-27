import type { SignaturePowerId } from '../cometAcademy/specialPowers'

export type PersonalCast = {
  allies: readonly [SignaturePowerId, SignaturePowerId]
  foil: SignaturePowerId
  rivals: readonly [SignaturePowerId, SignaturePowerId]
}

export const PERSONAL_CASTS: Record<string, PersonalCast> = {
  'accident-fire': {
    allies: ['tech-genius', 'mutant-earth'],
    foil: 'tech-birthright',
    rivals: ['tech-fire', 'magic-fire'],
  },
  'accident-air': {
    allies: ['tech-air', 'psychic-air'],
    foil: 'alien-air',
    rivals: ['tech-birthright', 'magic-air'],
  },
  'accident-earth': {
    allies: ['magic-earth', 'tech-earth'],
    foil: 'alien-earth',
    rivals: ['psychic-earth', 'mutant-earth'],
  },
  'accident-water': {
    allies: ['tech-water', 'alien-water'],
    foil: 'mutant-water',
    rivals: ['psychic-water', 'magic-water'],
  },
  'accident-discipline': {
    allies: ['tech-discipline', 'mutant-discipline'],
    foil: 'psychic-discipline',
    rivals: ['alien-discipline', 'magic-discipline'],
  },
  'accident-genius': {
    allies: ['tech-genius', 'magic-genius'],
    foil: 'alien-genius',
    rivals: ['psychic-genius', 'mutant-genius'],
  },
  'accident-birthright': {
    allies: ['magic-birthright', 'mutant-birthright'],
    foil: 'tech-birthright',
    rivals: ['alien-birthright', 'psychic-birthright'],
  },
  'accident-social': {
    allies: ['tech-social', 'magic-social'],
    foil: 'psychic-social',
    rivals: ['mutant-social', 'alien-social'],
  },
  'mutant-fire': {
    allies: ['accident-fire', 'tech-water'],
    foil: 'psychic-fire',
    rivals: ['alien-fire', 'magic-fire'],
  },
  'mutant-air': {
    allies: ['accident-air', 'mutant-birthright'],
    foil: 'tech-air',
    rivals: ['alien-air', 'psychic-air'],
  },
  'mutant-earth': {
    allies: ['tech-earth', 'magic-earth'],
    foil: 'accident-earth',
    rivals: ['alien-earth', 'psychic-earth'],
  },
  'mutant-water': {
    allies: ['alien-water', 'tech-water'],
    foil: 'accident-water',
    rivals: ['magic-water', 'psychic-water'],
  },
  'mutant-discipline': {
    allies: ['psychic-discipline', 'tech-discipline'],
    foil: 'alien-discipline',
    rivals: ['accident-discipline', 'magic-discipline'],
  },
  'mutant-genius': {
    allies: ['tech-genius', 'accident-genius'],
    foil: 'alien-genius',
    rivals: ['magic-genius', 'psychic-genius'],
  },
  'mutant-birthright': {
    allies: ['mutant-air', 'magic-birthright'],
    foil: 'accident-birthright',
    rivals: ['tech-birthright', 'alien-birthright'],
  },
  'mutant-social': {
    allies: ['alien-social', 'tech-social'],
    foil: 'psychic-social',
    rivals: ['magic-social', 'accident-social'],
  },
  'tech-fire': {
    allies: ['accident-fire', 'magic-earth'],
    foil: 'tech-birthright',
    rivals: ['psychic-fire', 'alien-fire'],
  },
  'tech-air': {
    allies: ['accident-air', 'mutant-air'],
    foil: 'tech-birthright',
    rivals: ['alien-air', 'magic-air'],
  },
  'tech-earth': {
    allies: ['mutant-earth', 'accident-earth'],
    foil: 'tech-birthright',
    rivals: ['alien-earth', 'magic-earth'],
  },
  'tech-water': {
    allies: ['mutant-water', 'alien-water'],
    foil: 'tech-birthright',
    rivals: ['accident-water', 'psychic-water'],
  },
  'tech-discipline': {
    allies: ['accident-discipline', 'tech-genius'],
    foil: 'tech-birthright',
    rivals: ['alien-discipline', 'mutant-discipline'],
  },
  'tech-genius': {
    allies: ['tech-discipline', 'tech-earth'],
    foil: 'tech-birthright',
    rivals: ['alien-genius', 'magic-genius'],
  },
  'tech-birthright': {
    allies: ['accident-birthright', 'magic-birthright'],
    foil: 'tech-air',
    rivals: ['tech-fire', 'tech-earth'],
  },
  'tech-social': {
    allies: ['accident-social', 'psychic-social'],
    foil: 'mutant-social',
    rivals: ['alien-social', 'tech-birthright'],
  },
  'magic-fire': {
    allies: ['accident-fire', 'psychic-fire'],
    foil: 'alien-fire',
    rivals: ['tech-fire', 'mutant-fire'],
  },
  'magic-air': {
    allies: ['accident-air', 'psychic-air'],
    foil: 'alien-air',
    rivals: ['tech-air', 'mutant-air'],
  },
  'magic-earth': {
    allies: ['accident-earth', 'tech-earth'],
    foil: 'tech-birthright',
    rivals: ['alien-earth', 'psychic-earth'],
  },
  'magic-water': {
    allies: ['psychic-water', 'alien-water'],
    foil: 'accident-water',
    rivals: ['mutant-water', 'tech-water'],
  },
  'magic-discipline': {
    allies: ['mutant-discipline', 'psychic-discipline'],
    foil: 'alien-discipline',
    rivals: ['accident-discipline', 'tech-discipline'],
  },
  'magic-genius': {
    allies: ['accident-genius', 'tech-genius'],
    foil: 'alien-genius',
    rivals: ['psychic-genius', 'mutant-genius'],
  },
  'magic-birthright': {
    allies: ['magic-earth', 'mutant-birthright'],
    foil: 'alien-birthright',
    rivals: ['accident-birthright', 'tech-birthright'],
  },
  'magic-social': {
    allies: ['accident-social', 'psychic-social'],
    foil: 'mutant-social',
    rivals: ['alien-social', 'tech-social'],
  },
  'alien-fire': {
    allies: ['accident-fire', 'magic-discipline'],
    foil: 'tech-birthright',
    rivals: ['psychic-fire', 'tech-fire'],
  },
  'alien-air': {
    allies: ['alien-fire', 'mutant-air'],
    foil: 'tech-air',
    rivals: ['magic-air', 'psychic-air'],
  },
  'alien-earth': {
    allies: ['psychic-earth', 'magic-earth'],
    foil: 'accident-earth',
    rivals: ['tech-earth', 'tech-birthright'],
  },
  'alien-water': {
    allies: ['mutant-water', 'tech-water'],
    foil: 'accident-water',
    rivals: ['magic-water', 'psychic-water'],
  },
  'alien-discipline': {
    allies: ['magic-discipline', 'accident-discipline'],
    foil: 'psychic-discipline',
    rivals: ['tech-discipline', 'mutant-discipline'],
  },
  'alien-genius': {
    allies: ['tech-genius', 'mutant-genius'],
    foil: 'tech-birthright',
    rivals: ['magic-genius', 'psychic-genius'],
  },
  'alien-birthright': {
    allies: ['magic-birthright', 'mutant-birthright'],
    foil: 'accident-birthright',
    rivals: ['tech-birthright', 'psychic-birthright'],
  },
  'alien-social': {
    allies: ['mutant-social', 'accident-social'],
    foil: 'psychic-social',
    rivals: ['tech-social', 'magic-social'],
  },
  'psychic-fire': {
    allies: ['mutant-fire', 'accident-fire'],
    foil: 'alien-fire',
    rivals: ['tech-fire', 'magic-fire'],
  },
  'psychic-air': {
    allies: ['accident-air', 'mutant-air'],
    foil: 'alien-air',
    rivals: ['tech-air', 'magic-air'],
  },
  'psychic-earth': {
    allies: ['accident-earth', 'magic-earth'],
    foil: 'tech-birthright',
    rivals: ['alien-earth', 'tech-earth'],
  },
  'psychic-water': {
    allies: ['alien-water', 'magic-water'],
    foil: 'mutant-water',
    rivals: ['accident-water', 'tech-water'],
  },
  'psychic-discipline': {
    allies: ['magic-discipline', 'mutant-discipline'],
    foil: 'alien-discipline',
    rivals: ['accident-discipline', 'tech-discipline'],
  },
  'psychic-genius': {
    allies: ['accident-genius', 'tech-genius'],
    foil: 'alien-genius',
    rivals: ['magic-genius', 'mutant-genius'],
  },
  'psychic-birthright': {
    allies: ['magic-birthright', 'magic-water'],
    foil: 'tech-birthright',
    rivals: ['alien-birthright', 'accident-birthright'],
  },
  'psychic-social': {
    allies: ['tech-social', 'accident-social'],
    foil: 'mutant-social',
    rivals: ['magic-social', 'alien-social'],
  },
}

export function personalCastFor(lead: string): PersonalCast | undefined {
  return Object.hasOwn(PERSONAL_CASTS, lead) ? PERSONAL_CASTS[lead] : undefined
}
