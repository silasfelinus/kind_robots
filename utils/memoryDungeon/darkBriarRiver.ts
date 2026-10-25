import type { DarkBriarScene } from './darkBriar'

/** River and southern valley: repairs, community, shelter and departures. */
export const DARK_BRIAR_RIVER: Record<string, DarkBriarScene> = {
  '6,5': {
    key: '6,5',
    title: 'The Village That Has Two Mayors',
    opening:
      'Two people remember winning the same election. Both have kept the village alive through difficult winters, and neither can bear the idea that the other is imaginary.',
    artPrompt:
      'Two proud adult village mayors offering shelter from opposite sides of same divided town square, doubled banners and shared market stalls, no text.',
    choices: [
      {
        id: 'council',
        label: 'Call a council of the people they served',
        outcome:
          'Residents refuse to choose which mayor was real. They form a council and give both a job they can be held accountable for.',
      },
      {
        id: 'ballots',
        label: 'Audit the old ballots together',
        outcome:
          'Both sets are authentic. Somebody wished every voter could get the leader they trusted; the Reimaginer forgot the leaders had to share a town.',
      },
    ],
  },
  '7,5': {
    key: '7,5',
    title: 'The River That Remembers Drowning',
    opening:
      'A river has learned to recite the names of everyone it ever carried away. The ferryman asks you to silence it because grieving families are beginning to mistake it for the living.',
    artPrompt:
      'Night river forming faces in its ripples, solemn ferryman with rope boat, families listening under willows, painterly blue and purple, no words.',
    choices: [
      {
        id: 'listen',
        label: 'Hear the names without summoning them',
        outcome:
          'A family hears the right name for the first time in years and gathers to tell the story behind it.',
      },
      {
        id: 'channel',
        label: 'Create a memorial beside the river',
        outcome:
          'The ferryman helps carve stones. The river may keep speaking, but nobody needs to answer it alone.',
      },
    ],
  },
  '8,5': {
    key: '8,5',
    title: 'The Lantern at Salt Cliffs',
    opening:
      'A cliff beacon was changed to promise every boat safe harbor. The lighthouse shines so convincingly that ships now sail straight through the rocks toward an imaginary port.',
    artPrompt:
      'Perilous sea cliffs under violet clouds, lighthouse beacon showing a false harbor of floating gold buildings, real fishing boat steering toward rocks, no text.',
    choices: [
      {
        id: 'redirect',
        label: 'Guide the boats by honest signals',
        outcome:
          'Sailors turn away from the pretty illusion and into rough but navigable water. The harbor keeper cries with relief.',
      },
      {
        id: 'repair',
        label: 'Move the light to the true headland',
        outcome:
          'The new beacon reveals a hard coastline and a workable landing. The keeper realizes a promise cannot replace a map.',
      },
    ],
  },
  '1,6': {
    key: '1,6',
    title: 'The Well That Grants Second Chances',
    opening:
      'A village well returns a dropped object from one day earlier. People have begun throwing their mistakes into it, convinced that an apology can be fetched back like a ring.',
    artPrompt:
      'Old enchanted well surrounded by discarded letters and broken wedding rings, cautious villagers peering into shimmering yesterday, no text.',
    choices: [
      {
        id: 'retrieve',
        label: 'Recover a mistake without erasing it',
        outcome:
          'The lost ring returns; so does the memory of who dropped it. Its owner chooses what repair would actually help.',
      },
      {
        id: 'close',
        label: "Stop the well being used for other people's lives",
        outcome:
          "The villagers agree nobody may cast another person's history into the water, no matter how merciful they feel.",
      },
    ],
  },
  '5,6': {
    key: '5,6',
    title: 'The Orchard with Two Harvests',
    opening:
      'One grove bears fruit that tastes of a wonderful remembered future, the next tastes of the life someone actually endured. The farmer is rich, exhausted, and no longer eats either.',
    artPrompt:
      'Split orchard with one luminous apple tree and one scarred but fruitful tree, exhausted farmer holding two differently colored apples, no lettering.',
    choices: [
      {
        id: 'share',
        label: 'Serve both fruits at the village table',
        outcome:
          'People argue fiercely and then begin asking what they can change this season instead of borrowing a harvest.',
      },
      {
        id: 'rest',
        label: 'Offer to tend the grove while the farmer rests',
        outcome:
          'He tells you the first fruit was never a lie. He simply forgot a good future still requires work.',
      },
    ],
  },
  '6,6': {
    key: '6,6',
    title: 'The Council of Living Boundaries',
    opening:
      'A boundary stone has begun walking at night, trying to follow each family as they move. Two villages accuse one another of stealing ground; the stone insists it is keeping everyone at home.',
    artPrompt:
      'Ancient boundary monolith striding across wet meadow, villagers from two settlements holding ropes, distant sheltering roofs, no text.',
    choices: [
      {
        id: 'settle',
        label: 'Ask both villages where they want the border',
        outcome:
          'They negotiate shared grazing instead. The stone stops walking when nobody asks it to own a person.',
      },
      {
        id: 'follow',
        label: 'Follow the stone to its first foundation',
        outcome:
          'Beneath the original marker you find a petition for shelter signed by people now living on both sides.',
      },
    ],
  },
  '7,6': {
    key: '7,6',
    title: 'The Riverbank Chest of Complications',
    opening:
      'The chest that once contained a lantern now holds receipts for every hint a stranger gave you. Most are favors. One is an order someone obeyed against their better judgment.',
    artPrompt:
      'Weathered treasure chest on river sand overflowing with pale paper receipts and a single dim lantern, dark river reeds, no text.',
    choices: [
      {
        id: 'read',
        label: 'Read the uncomfortable receipt aloud',
        outcome:
          'A former guide admits the order frightened them. They accept your apology only after you ask what they need now.',
      },
      {
        id: 'return',
        label: 'Return the lantern to its first keeper',
        outcome:
          'She says it was a gift. She would rather you use it to find the person whose voice the ledger omitted.',
      },
    ],
  },
  '8,6': {
    key: '8,6',
    title: 'The Ferry That Carries the Shore',
    opening:
      'At the eastern ford a little ferry stays still while the landscape slips past it. Passengers applaud the speed until they notice the bank they left has moved closer to their homes.',
    artPrompt:
      'Small rope ferry motionless in shifting river while shoreline slides like stage scenery, travelers with umbrellas watching distorted maps, no words.',
    choices: [
      {
        id: 'anchor',
        label: 'Anchor the boat to a real landmark',
        outcome:
          "The river slows. A carpenter loses a week's wages, but stranded passengers can once again choose their destination.",
      },
      {
        id: 'ask',
        label: 'Let the passengers decide when to land',
        outcome:
          'They vote to wait for the true shore. The ferryman learns patience is a form of navigation.',
      },
    ],
  },
  '1,7': {
    key: '1,7',
    title: 'The Stone Circle of Borrowed Courage',
    opening:
      'The old standing stones whisper perfect versions of what frightened people wish they had said. A timid baker rehearses an imaginary brave speech while a real argument unfolds outside.',
    artPrompt:
      'Moonlit standing stones each containing translucent figures giving grand speeches, anxious baker listening behind, no text.',
    choices: [
      {
        id: 'join',
        label: 'Invite the baker to speak imperfectly',
        outcome:
          'His voice shakes and the crowd hears him anyway. The stones go quiet for an hour.',
      },
      {
        id: 'break',
        label: 'Interrupt the imaginary speeches',
        outcome:
          'The crowd hears its own silence for the first time. Some are angry with you for taking away an easier hero.',
      },
    ],
  },
  '2,7': {
    key: '2,7',
    title: 'The Three Quiet Stones Reversed',
    opening:
      'The rune puzzle has been reversed by someone trying to erase a mistake. Two leaves follow the sun now, but neither answer will open a door until the question is put back in the right order.',
    artPrompt:
      'Three ancient standing stones reflected in still black water, sun and leaf symbols shimmering in alternate orders, no written letters.',
    choices: [
      {
        id: 'interpret',
        label: 'Ask what the symbols protected',
        outcome:
          'The stones once guided lost children home. You place a small lantern beside them rather than forcing a universal answer.',
      },
      {
        id: 'invert',
        label: 'Try the reverse path from the river',
        outcome:
          'The same sequence makes sense from the other bank. A road opens without requiring the first route to be false.',
      },
    ],
  },
  '3,7': {
    key: '3,7',
    title: 'The Treasury of Small Repairs',
    opening:
      'A miniature treasury contains nothing expensive: repaired shoes, patched coats, replaced bridge nails. The royal auditor calls it a scandal because these purchases saved lives without producing legends.',
    artPrompt:
      'Modest brick treasury filled with lovingly repaired boots, patched jackets and iron nails, royal auditor standing in ornate empty vault, no words.',
    choices: [
      {
        id: 'defend',
        label: 'Defend the small repairs before the auditor',
        outcome:
          'The ledger shows fewer disasters than expected. The auditor is forced to admit prevention has no dramatic portrait.',
      },
      {
        id: 'fund',
        label: 'Invite the village to choose the next repair',
        outcome:
          'They vote for a handrail at the school steps. It is unglamorous and everybody knows who to thank.',
      },
    ],
  },
  '4,7': {
    key: '4,7',
    title: 'The Wedding That Was Never Promised',
    opening:
      'Guests have been waiting for a bride and groom whose childhood wishes mentioned a wedding, though neither now wants to marry. The music continues whenever someone says they will disappoint the family.',
    artPrompt:
      'Abandoned candlelit wedding pavilion in gloomy forest, two adult almost-newlyweds holding unworn rings while guests wait, no text.',
    choices: [
      {
        id: 'announce',
        label: 'Help the couple tell their guests the truth',
        outcome:
          'The musicians stop, then begin a dance to celebrate the people who showed up. Several guests quietly leave.',
      },
      {
        id: 'listen',
        label: 'Let the couple tell you what they wanted instead',
        outcome:
          'One wants a workshop; the other wants to sail. Their relatives begin arguing about which dream counts as a betrayal.',
      },
    ],
  },
}
