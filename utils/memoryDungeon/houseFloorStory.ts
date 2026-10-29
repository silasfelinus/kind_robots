import type { HouseProgress } from './house'

export interface HouseFloorBeat {
  /** A narrative movement, not a public level count. */
  title: string
  text: string
  cost: string
}

type HouseStoryState = Pick<HouseProgress, 'decisions' | 'visited'>
type SceneChoices = Readonly<Record<string, string>>

/**
 * Three House thresholds carry the story from borrowed identity, through
 * disputed testimony, to the cost of judgment. These are live callbacks to
 * decisions already saved by the two maps, not extra one-time rewards or
 * mutable story flags. Shortcuts must not pretend the player met witnesses
 * they bypassed.
 */
export function houseFloorBeat(
  roomId: string | undefined,
  house: HouseStoryState | null | undefined,
  briar: SceneChoices,
): HouseFloorBeat | null {
  if (!house) return null

  if (roomId === 'HD-01') {
    if (briar['6,4'] === 'read')
      return {
        title: 'The Letter That Arrived Open',
        text: 'Pip has already warned the residents about the Brass Knight’s destruction order. Behind the porch door, the House is moving its witnesses to safer rooms instead of preparing a polite reception. You enter as the person who broke a seal to give them time.',
        cost: 'The warning bought safety, but the Knight’s apology never arrived intact.',
      }
    if (briar['6,4'] === 'carry')
      return {
        title: 'The Apology at the Threshold',
        text: 'Pip trusts you with the sealed apology, and the House accepts the envelope before it accepts your name. Somewhere inside, a door closes gently around the people who have not heard the Knight’s other order.',
        cost: 'You preserved the courier’s promise, but the residents still lack the warning.',
      }
    if (briar['5,4'] === 'truth')
      return {
        title: 'A Knight Without a Crossing',
        text: 'You challenged the Brass Knight’s account of the bridge before coming here. The porch chairs scrape backward as though the House has been waiting for somebody to question an oath rather than repeat it.',
        cost: 'The false oath is exposed, but no apology or protection came with you.',
      }
    if (briar['5,4'] === 'errand')
      return {
        title: 'An Errand for a Closed Door',
        text: 'The Brass Knight sent you with an apology that he could not bring himself. The House knows his handwriting. It also remembers who was left on the wrong side of the crossing when he made his promise.',
        cost: 'Carrying the message earns a hearing, not forgiveness.',
      }
    return {
      title: 'A Guest, Not an Owner',
      text: 'The porch has set a chair for the life you remember and another for the life Morrow left you. Neither chair is a throne. The House will ask what you have done with other people’s memories before it considers returning your own.',
      cost: 'Entering earns questions, not a claim to anyone else’s past.',
    }
  }

  if (roomId === 'HD-13') {
    if (house.decisions['HD-05'] === 'open')
      return {
        title: 'The Witnesses Find a Road',
        text: 'The Wolf-Mother’s patrol can reach the service hall through the latch you opened. Their boots leave honest mud across a floor the elders kept spotless. The House must hear them now, whether the village approves or not.',
        cost: 'Opening the route protects testimony but exposes the patrol to public scrutiny.',
      }
    if (house.decisions['HD-05'] === 'test')
      return {
        title: 'A Receipt Where a Door Should Be',
        text: 'You found who paid to bar the wolves, and the second floor has a place for that receipt. The Wolf-Mother is still outside the latch. The Index can inspect your evidence while the people it concerns wait in the rain.',
        cost: 'The payment is documented, but the safe passage remains closed.',
      }
    if (house.decisions['HD-06'] === 'stock')
      return {
        title: 'Oren’s Spare Water',
        text: 'Oren has counted the casks you restocked. A frightened housekeeper can retreat down the stairs with drinking water instead of a ceremonial apology. The second floor is less thirsty, though its records remain contested.',
        cost: 'Supplies buy time; they do not name the person who locked the witnesses out.',
      }
    return {
      title: 'The Floor of Other People’s Stories',
      text: 'The staircase divides into testimony, rumor and the records that somebody paid to keep. Pip wants the witnesses named; Vesper asks who would be endangered by that list. Neither will let you call the choice neutral.',
      cost: 'Listening to one account may leave another person waiting without protection.',
    }
  }

  if (roomId === 'HD-25') {
    if (house.decisions['HD-17'] === 'read')
      return {
        title: 'A Name Returned to Its Witness',
        text: 'You carry the testimony you read in the Witness Archive into the Bargain Ledger. The Index must now account for a person, not an empty line. Mosswick offers to keep the copy safe, but asks who authorized him to hold it.',
        cost: 'The evidence can challenge the bargain; publishing it may expose its witness.',
      }
    if (house.decisions['HD-21'] === 'archive')
      return {
        title: 'The Record That Outlived Its Keeper',
        text: 'You preserved the disputed account before entering the Bargain Ledger. Pip recognizes the date; Vesper recognizes the omission. The third floor can no longer pretend the record was lost by accident.',
        cost: 'A durable record gives the claim weight, but does not grant consent to reveal it.',
      }
    if (
      house.decisions['HD-10'] === 'manifest' &&
      !house.visited.includes('HD-13')
    )
      return {
        title: 'The Princess’s Shortcut',
        text: 'Scylla’s manifest led you directly to the Bargain Ledger. Char admires the efficiency and asks which witnesses you walked past to get here. Oren marks the unvisited halls in pencil rather than claiming they were cleared.',
        cost: 'You saved time, but the missing testimony cannot be invented at the verdict.',
      }
    return {
      title: 'The Price of Being Believed',
      text: 'The Bargain Ledger opens to a page with room for a name, a signature and the person who will bear the consequence. The Brass Knight would call that an oath. Pip calls it evidence. Vesper asks whether the signer had a choice.',
      cost: 'A verdict without witnesses may be swift, but it will not settle their claims.',
    }
  }

  return null
}
