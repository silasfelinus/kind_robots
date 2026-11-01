export const BRIAR_COLLISION_SCENES = {
  '2,2': {
    fragment: 'briar-office-key',
    title: 'The Briar Office Key',
    speaker: 'Pip and Mara',
    kind: 'challenge',
    opening:
      'The House That Remembers has acquired a fluorescent accounting floor. Each midnight, the corridor folds back into a wolf road. Mara can prove which night-shift workers are trapped, but the wolf patrol calls their badges stolen names. Pip can translate the old oaths, while Mara holds the private roster. Two matching time stamps on the clock and timecard reveal the shrinking emergency stair.',
    artSubject:
      'Pip and night-shift guard Mara in a fluorescent office grown through a dark Briar forest, a wolf captain blocking a contracting stair, two visible matching clock stamps',
    choices: [
      {
        id: 'translate-shift-oath',
        label: 'Translate the shift roster into a one-night wolf-road oath',
        outcome:
          'Mara asks each worker for consent. Pip signs on for an extra watch, and the wolf opens the guarded stair. The workers escape with their names intact, but Pip owes the captain an escort shift.',
        flag: 'briar-office-night-oath',
        effects: { supplies: -1, trust: 2 },
        artSubject:
          'Pip signs a temporary forest oath beside Mara’s office timecard while a wolf captain opens a guarded stair',
      },
      {
        id: 'redact-and-witness',
        label: 'Share the head count, not the workers’ private names',
        outcome:
          'Mara publishes an anonymous count and Pip witnesses each departure. The wolf accepts the evacuation, but the slow verification leaves the corridor contracting for another watch.',
        flag: 'briar-office-redacted-witness',
        effects: { evidence: 1, danger: 1 },
        artSubject:
          'Mara holds a redacted head count while workers leave a forest-grown office under a wolf patrol’s watch',
      },
      {
        id: 'break-midnight-clock',
        label: 'Break the midnight clock and evacuate immediately',
        outcome:
          'The looping corridor stops and the workers escape. The destroyed timecards leave a payroll dispute; Mara must rebuild the record from testimony instead of magically recovering the archive.',
        flag: 'briar-office-clock-broken',
        effects: { trust: 1, evidence: -1, danger: 1 },
        artSubject:
          'Pip shatters a forest-grown office clock as workers hurry through a splintering fluorescent hallway',
      },
    ],
  },
  '7,6': {
    fragment: 'briar-tide-roots',
    title: 'The Briar Tide Roots',
    speaker: 'Ren, Scylla and Oren',
    kind: 'puzzle',
    opening:
      'The wolf road runs beneath the sea. The House roots hold a dry pocket for Ren’s family, who fled both a census and a flood. Scylla’s tide chart predicts the next current but exposes the hidden shelter address. Oren has six desks, two ropes and three bells before the water turns. Matching root symbols and three visible tide marks reveal a safe route; a missed current leaves a slower dry landing, never an unwinnable rescue.',
    artSubject:
      'Ren’s family sheltered beneath enormous submerged Briar roots, Scylla studying tide marks and hooded Oren building a rope bridge from office furniture',
    choices: [
      {
        id: 'private-tide-escort',
        label: 'Escort the family privately along the hidden current',
        outcome:
          'Oren holds the rope bridge until Ren’s family reaches the high bank unseen. He misses the next immediate encounter, and Ren keeps the only chart showing the refuge address.',
        flag: 'briar-roots-private-escort',
        effects: { supplies: -1, trust: 2 },
        artSubject:
          'Hooded Oren holds a rope bridge through submerged roots while Scylla guides a family by a folded private tide chart',
      },
      {
        id: 'public-dam-crossing',
        label: 'Dam the wolf road and open a public crossing',
        outcome:
          'Office desks divert the current and strangers escape together. The crossing becomes visible to patrols, so Pip promises to help Ren relocate the shelter before the wolves arrive.',
        flag: 'briar-roots-public-dam',
        effects: { trust: 1, danger: 2 },
        artSubject:
          'Office desks dam a seawater root tunnel as Pip and Scylla guide refugees past an approaching wolf patrol',
      },
      {
        id: 'community-ferry-charter',
        label: 'Let the families run a revocable three-bell ferry',
        outcome:
          'Ren keeps the ferry key and the right to stop service. Scylla lends a tide marker; the party leaves supplies to staff the watch, trading speed for a crossing the refugees control.',
        flag: 'briar-roots-revocable-ferry',
        effects: { supplies: -2, trust: 1, evidence: 1 },
        artSubject:
          'Ren holds a wooden ferry pass aboard an office-door raft as Scylla marks the tide and Pip watches the root crossing',
      },
    ],
  },
} as const

export type BriarCollisionSite = keyof typeof BRIAR_COLLISION_SCENES
