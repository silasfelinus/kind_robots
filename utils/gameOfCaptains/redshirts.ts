import { REDSHIRT_DETAILS_A } from './redshirtsA'
import { REDSHIRT_DETAILS_B } from './redshirtsB'
import type { Skill, Stats } from './crewAssignments'

export type Redshirt = {
  id: string
  name: string
  anatomy: string
  history: string
  secretPower: string
  talent: Skill
  stats: Stats
  portraitPrompt: string
}

/** Stable uniform and portrait prompt: 100 distinct shapes, never a generic human placeholder. */
const specialties = [
  'rescue',
  'science',
  'diplomacy',
  'tactics',
  'luck',
  'culture',
] as const
function hash(text: string): number {
  let n = 2166136261
  for (let i = 0; i < text.length; i++) {
    n = Math.imul(n ^ text.charCodeAt(i), 16777619) >>> 0
  }
  return n
}
const source = [...REDSHIRT_DETAILS_A, ...REDSHIRT_DETAILS_B]
export const REDSHIRTS: readonly Redshirt[] = source.map(
  ([name, anatomy, history, secretPower, talent], index) => {
    const id = 'rs-' + String(index + 1).padStart(3, '0')
    const stats = Object.fromEntries(
      specialties.map((skill) => [
        skill,
        skill === talent ? 5 : 1 + (hash(id + ':' + skill) % 4),
      ]),
    ) as Stats
    return {
      id,
      name,
      anatomy,
      history,
      secretPower,
      talent,
      stats,
      portraitPrompt: `Original illustrated alien character: ${anatomy}; distinct silhouette and facial expression, wearing the SAME brilliant red Space Couch expedition uniform with an identifiable mission insignia, not a spacesuit in any other color. ${history}. Satirical retro space opera / flamboyant science-fantasy portrait, no words.`,
    }
  },
)

export const REDSHIRT_BY_ID: Readonly<Record<string, Redshirt>> =
  Object.fromEntries(REDSHIRTS.map((officer) => [officer.id, officer]))

export function starterRedshirts(seed: number): string[] {
  const offset = Math.abs(Math.floor(seed)) % REDSHIRTS.length
  return Array.from(
    { length: 6 },
    (_, index) => REDSHIRTS[(offset + index * 13) % REDSHIRTS.length]!.id,
  )
}

/** Recruitment only chooses a genuinely new identity, never a fallen person. */
export function nextRedshirt(
  seed: number,
  hired: readonly string[],
  fallen: readonly string[],
): string | null {
  const excluded = new Set([...hired, ...fallen])
  for (let offset = 0; offset < REDSHIRTS.length; offset++) {
    const candidate =
      REDSHIRTS[(Math.abs(Math.floor(seed)) + offset * 37) % REDSHIRTS.length]!
    if (!excluded.has(candidate.id)) return candidate.id
  }
  return null
}
