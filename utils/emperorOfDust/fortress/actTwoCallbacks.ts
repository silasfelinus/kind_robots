import type { AudienceDef } from './types'

// Callback audiences appended to Act II days (content.ts merges them by day).
export const ACT_TWO_CALLBACK_AUDIENCES: Readonly<
  Record<number, readonly AudienceDef[]>
> = {
  19: [
    {
      id: 'd19-knotted-bandage',
      title: 'A Knot at the Postern',
      speaker: 'Captain Ferro Dunmark',
      npc: 'ferro-dunmark',
      faction: 'gate-watch',
      requires: { flags: ['d16-informant-spy'] },
      lines: [
        'Dunmark does not sit. He sets a small thing on the arm of the throne and steps back from it.',
        'A strip of dirty cloth. A painted feather. The cloth is knotted around the quill. Tight.',
        'It was on the postern latch at dawn. Nobody on the wall saw who left it. The Watch knows the cloth, Majesty. Same paw.',
        'The girl’s map is not due yet. This isn’t the map.',
        {
          who: 'Young Komodo',
          npc: 'young-komodo',
          text: 'A Pack message, Your Majesty. They want it understood that they know. The feather means they have not yet decided what to do about it.',
        },
      ],
      options: [
        {
          id: 'ask-dunmark',
          label: 'Ask Dunmark what he would do.',
          effects: {},
          response:
            'Dunmark looks at the cloth. He takes his time. He has been a soldier longer than he has been anything else.',
          next: 'dunmark',
        },
        {
          id: 'wait',
          label:
            'Say nothing. Pin the feather over the fire and wait for the map.',
          effects: {
            local: { 'gate-watch': 1 },
            flags: ['d19-feather-pinned'],
          },
          response:
            'The Watch hangs the feather over the fire beside the ration card. Nobody sings that night. Nobody sleeps near the postern.',
        },
        {
          id: 'recall',
          label: 'Send a rider to bring her out. Today.',
          requires: { cost: 15 },
          effects: {
            affinity: { jackalwire: -10 },
            local: { yard: 1, 'gate-watch': -1 },
            flags: ['d19-informant-recalled'],
          },
          response:
            'The rider returns after dark with a girl asleep across the saddle. The Pack finds the empty bedroll by morning. Gristle Vane sends no feather this time. Only silence, and silence costs more.',
        },
      ],
      beats: [
        {
          id: 'dunmark',
          lines: [
            '“If she runs, they know she was ours. If she stays, they may be waiting for her to carry the next map out.”',
            '“I sent her. Not you, Majesty. I stood on that wall and said she was fifteen and could draw. I said it like a compliment.”',
            {
              who: 'Young Komodo',
              npc: 'young-komodo',
              text: 'A recalled spy tells the Pack the crown flinches. A kept spy is a coin on the table. Both cost something. Only one costs a girl.',
            },
          ],
          options: [
            {
              id: 'wait',
              label: 'Keep her there. Pin the feather and wait for the map.',
              effects: {
                local: { 'gate-watch': 1 },
                flags: ['d19-feather-pinned'],
              },
              response:
                'Dunmark nods once. He pins the feather himself. His hands are steady. He does not look at the door the rest of the day.',
            },
            {
              id: 'recall',
              label: 'Bring her out. The map can go unmade.',
              requires: { cost: 15 },
              effects: {
                affinity: { jackalwire: -10 },
                local: { yard: 1, 'gate-watch': -1 },
                flags: ['d19-informant-recalled'],
              },
              response:
                'Dunmark rides out himself. He is back before dawn, and the girl is in front of him in the saddle. She is asleep. He won’t let anyone else lift her down.',
            },
            {
              id: 'answer-pack',
              label:
                'Send the feather back with a message: the crown’s people are the crown’s.',
              effects: {
                affinity: { jackalwire: 5 },
                local: { 'gate-watch': -2, yard: 1 },
                flags: ['d19-pack-answered'],
              },
              response:
                'The message goes out on a Watch horse. The horse comes back alone. Dunmark unties the note from the saddle and reads it standing. Then he burns it.',
            },
          ],
        },
      ],
    },
  ],
}
