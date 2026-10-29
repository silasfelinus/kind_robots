import { CREW_PROFILES } from '../gameOfCaptains/crewAssignments'

export const GUEST_IDENTITIES = [
  {
    id: 'guest-zuzu',
    source: 'Zuzu world',
    personId: 'zuzu',
    signature: 'animal-technical-training',
    realName: 'Zuzu',
    pronouns: 'he/him',
    backstory:
      'Zuzu was an assassin trained in the oath-bound, weird-west lands of his home dimension. A damaged Comet City portal brings him to a future of surveillance drones and monorails, where his old targets have no jurisdiction and his choices finally belong to him.',
    student: {
      alias: 'Zuzu, Koala Assassin',
      conflict:
        'The academy offers the stranded killer asylum in exchange for teaching its cadets to evade capture.',
    },
    hero: {
      alias: 'Zuzu, Koala Assassin',
      method:
        'Silent acrobatics, precise sword work and a deliberate refusal to kill on a corporate warrant.',
    },
    villain: {
      alias: 'Zuzu, Koala Assassin',
      method:
        'A stolen dimensional targeting rig and clockwork exosuit let him strike victims who never knew they were named.',
    },
    quests: {
      protagonist:
        'Reject an assassination contract from the portal authority and find the child whose rescue would close the gateway.',
      antagonist:
        'Zuzu, Koala Assassin is using extradimensional warrants to erase witnesses to the transit consortium.',
      partner:
        'Zuzu asks whether an oath can be broken to save someone who never consented to it.',
    },
    heroDecision:
      "Return home with the old guild still hunting him, or stay as the city's first blade sworn to rescue.",
    villainDecision:
      'Accept control of the portal registry and decide who is permitted to exist in Comet City.',
    sidekick:
      'Offer precise sword drills, but refuse to be treated as an expendable hired assassin.',
    romance:
      'A possible adult relationship must earn mutual understanding of very different worlds; loyalty never means obedience.',
    arrival:
      'A portal tears open above the commuter rail. A koala assassin in a weatherworn coat lands with a sword already drawn.',
  },
  {
    id: 'guest-tess-helio',
    source: 'Space Couch',
    personId: 'tess-helio',
    signature: 'stellar-navigation',
    realName: 'Tess Helio',
    pronouns: 'she/they',
    backstory:
      'Tess Helio is the navigator from the starship crew of Space Couch, not an invented academy student. Her grandmother left her a map of moving safe harbors; an emergency jump strands her ship near Comet City, and the academy mistakes her rescue beacon for a weapon.',
    student: {
      alias: 'Visiting Cadet Starling',
      conflict:
        'The school wants to photocopy the secret harbor chart before returning the navigator to her crew.',
    },
    hero: {
      alias: 'Starwake',
      method:
        'Navigation beacons, impossible orbital slingshots and sanctuary corridors divert disasters without exposing hidden refugees.',
    },
    villain: {
      alias: 'The Void Cartographer',
      method:
        'She weaponizes stolen jump coordinates to strand rivals and place every secret refuge under her command.',
    },
    quests: {
      protagonist:
        "Save a stranded refugee transport while keeping the grandmother's sanctuary routes off the public network.",
      antagonist:
        'The Void Cartographer offers the city a perfect evacuation map that secretly deposits dissidents into her custody.',
      partner:
        'Tess needs someone who respects that her crew and ship are home, not a disposable sidequest.',
    },
    heroDecision:
      'Refuse an academy award and return to the crew once the refugee ship is safe.',
    villainDecision:
      'Turn every rescue into a recorded debt and monopolize the jump gates.',
    sidekick:
      'Chart a safe exit for a rookie without surrendering the location of hidden worlds.',
    romance:
      'Affection is possible only with an adult who accepts her independent duty to her crew and her right to depart.',
    arrival:
      'A starship navigator appears through a fractured jump gate, carrying a scratched chart that refuses to show its destination.',
  },
] as const

export type GuestIdentity = (typeof GUEST_IDENTITIES)[number]

export function guestIdentityFor(id: GuestIdentity['id']): GuestIdentity {
  return GUEST_IDENTITIES.find((guest) => guest.id === id)!
}

export const TESS_CREW_SOURCE = CREW_PROFILES.find(
  (member) => member.id === 'tess',
)!
