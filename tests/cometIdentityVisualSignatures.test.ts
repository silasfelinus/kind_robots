import { describe, expect, it } from 'vitest'
import { identityFor } from '../utils/cometAcademy/identityArcs'
import {
  IDENTITY_VISUAL_SIGNATURES,
  visualSignatureFor,
} from '../utils/cometAcademy/identityVisualSignatures'
import type { SignaturePowerId } from '../utils/cometAcademy/specialPowers'

describe('canonical visual signatures', () => {
  it('authors one physical model for both fire and genius in every origin', () => {
    const origins = ['accident', 'mutant', 'tech', 'magic', 'alien', 'psychic']
    for (const origin of origins) {
      for (const affinity of ['fire', 'genius']) {
        const signature = `${origin}-${affinity}` as SignaturePowerId
        const visual = visualSignatureFor(signature)
        expect(visual).not.toBeNull()
        expect(visual?.silhouette.length).toBeGreaterThan(15)
        expect(visual?.anatomy.length).toBeGreaterThan(15)
        expect(visual?.portraitDirection.length).toBeGreaterThan(15)
        const person = identityFor(signature)
        expect(person.student.alias).toBe(person.hero.alias)
        expect(person.hero.alias).toBe(person.villain.alias)
      }
    }
    expect(Object.keys(IDENTITY_VISUAL_SIGNATURES)).toHaveLength(12)
  })

  it('does not pretend the remaining identities have delivered visual contracts', () => {
    expect(visualSignatureFor('accident-air')).toBeNull()
  })
})
