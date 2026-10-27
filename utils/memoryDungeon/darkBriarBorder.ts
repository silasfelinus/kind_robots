import type { DarkBriarScene } from './darkBriar'

/** Border ward: safety versus control, civic debts and the old Thorn Gate. */
export const DARK_BRIAR_BORDER: Record<string, DarkBriarScene> = {
  '7,2': {
    key: '7,2',
    title: 'The Patrol of Unborn Children',
    opening:
      'A pair of sentries maintain a barricade against a disaster due next year. Their actual enemies are the families trying to cross to a school that will never open.',
    artPrompt:
      'Two weary sentries stand at a barricade of thorn branches across a lane. Beyond it waits a small schoolhouse, and families with school satchels stand on the near side. Violet morning light. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'open',
        label: 'Open a supervised route to the school',
        outcome:
          'Parents volunteer to watch the crossing. The sentries discover safety can require a road, not a wall.',
      },
      {
        id: 'proof',
        label: "Demand the forecast's source",
        outcome:
          'The prophecy was purchased by a school rival. Its certainty vanishes as soon as someone asks who profited.',
      },
    ],
  },
  '8,2': {
    key: '8,2',
    title: 'The Cliffside Census',
    opening:
      'A registrar counts everybody who lives on the cliffs, including a person who exists only when someone misses them. She refuses to delete the entry without asking the missing person.',
    artPrompt:
      'A small wooden hut on a windswept sea cliff. A registrar in a blue coat stands in its doorway clutching a sheaf of blue papers, and inside an extra empty chair glows faintly. Gulls wheel overhead at twilight. Medium-wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'call',
        label: 'Leave an invitation for the uncounted resident',
        outcome:
          'An adult stranger arrives, unable to say where they came from. They choose a name and a place to sleep before answering questions.',
      },
      {
        id: 'erase',
        label: 'Challenge the category instead of the person',
        outcome:
          "The registrar removes the box marked impossible. She keeps the resident's name in the same ledger as everybody else's.",
      },
    ],
  },
  '1,3': {
    key: '1,3',
    title: 'The Fence Built from Promises',
    opening:
      "A farm family's fence is made of vows spoken by their neighbors. When any neighbor changes their mind, the posts loosen and the livestock scatter.",
    artPrompt:
      'An orchard fence made of knotted ropes of faint golden light. A nervous farmer holds a goat on a lead as the fence posts lean apart. Moonlit pine trees behind. Medium shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'renegotiate',
        label: 'Help the neighbors renegotiate the boundary',
        outcome:
          'They replace an eternal vow with a practical maintenance rota. The goats find this considerably less romantic.',
      },
      {
        id: 'repair',
        label: 'Repair the fence with actual timber',
        outcome:
          'It works until the first storm. The family realizes they wanted help, not obedience.',
      },
    ],
  },
  '2,3': {
    key: '2,3',
    title: "The Lantern Keeper's Blind Spot",
    opening:
      'A lantern keeper has illuminated every hidden danger except the room where she keeps her own memories. There, light turns yesterday into a story told by somebody else.',
    artPrompt:
      'A rotating brass lantern in a misty stone watch house. Its keeper, an older woman in a knitted shawl, looks through the glass panes at upside-down shadow figures. Medium shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'enter',
        label: 'Enter the dark room with her permission',
        outcome:
          'She finds a memory of refusing to rescue a stranger. It hurts, but no spell can change the fact that she later returned.',
      },
      {
        id: 'mirror',
        label: 'Bring the lantern outside instead',
        outcome:
          'The keeper learns her tool only shows what she expects. She begins asking travelers which roads they need lit.',
      },
    ],
  },
  '3,3': {
    key: '3,3',
    title: 'The Road of Shared Names',
    opening:
      "Travelers exchange names to pass an old toll. A young carter has forgotten which name was hers, but remembers the horse's name perfectly.",
    artPrompt:
      'An old stone toll arch over a road, with rows of small blank brass plates bolted to its stones. A nervous young carter in a flat cap stands beside a patient shaggy brown horse. The wet road reflects the arch. Medium-wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'untangle',
        label: 'Trace the names through their owners',
        outcome:
          'The carter chooses her original name freely; the horse still comes when called by the borrowed one.',
      },
      {
        id: 'abolish',
        label: 'Help travelers build a toll-free bypass',
        outcome:
          'The keeper protests that somebody must be responsible for the road. Travelers offer money and labor instead of identities.',
      },
    ],
  },
  '7,3': {
    key: '7,3',
    title: "The Thorn Patrol's Unpaid Oath",
    opening:
      'The disgruntled sentries you might have fought are still guarding a shortcut. Their contract pays them in memories of heroic victories, so their actual courage is never acknowledged.',
    artPrompt:
      'Forest patrol in battered armor, absurd medals made of fog, thorn gate road under siege, bitter candlelit fairy atmosphere.',
    choices: [
      {
        id: 'settle',
        label: 'Read their contract before fighting',
        outcome:
          'You find a clause allowing retirement after one honest witness. The sentries beg you not to turn their work into a legend.',
      },
      {
        id: 'organize',
        label: 'Ask the patrol whom they protect',
        outcome:
          'They escort villagers through the shortcut instead of charging a duel. Their commander calls it insubordination.',
      },
    ],
  },
  '8,3': {
    key: '8,3',
    title: 'The Gatehouse of Second Opinions',
    opening:
      'The gatekeeper offers two keys, one marked certain and one marked perhaps. Every traveler who took the certain key vanished into a pleasant life somebody else had selected.',
    artPrompt:
      'A stone gatehouse with two oversized ornate iron keys floating before two doorways, one opening onto green hills and one onto a grey misty road. A curious gatekeeper with a lantern stands between them. Strong side light. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'perhaps',
        label: 'Choose the uncertain door',
        outcome:
          'You arrive on the road you meant to travel, but without guarantees. The gatekeeper admits the other door was easier to advertise.',
      },
      {
        id: 'warn',
        label: 'Warn the waiting travelers about certainty',
        outcome:
          'Some leave the queue; others still choose the comfortable door. You cannot make that choice for them.',
      },
    ],
  },
  '1,4': {
    key: '1,4',
    title: "The Woodsman's Unfinished Rescue",
    opening:
      'A woodsman swore to cut every dangerous tree. The Reimaginer took him literally and now every stump tells the story of a creature that lost its home.',
    artPrompt:
      'A woodsman in a leather jerkin kneels with his axe on the ground among hundreds of fresh tree stumps, and pale empty bird nests sit on the stumps. One whole oak stands far off on the hill. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'plant',
        label: 'Give the woodsman seedlings and time',
        outcome:
          'He plants a mixed forest and invites the displaced creatures to choose where to settle. None forgive him immediately.',
      },
      {
        id: 'confess',
        label: 'Bring the refugees to hear his account',
        outcome:
          'They demand a promise to stop, not an apology. His axe becomes a tool for building shelters.',
      },
    ],
  },
  '7,4': {
    key: '7,4',
    title: 'The Bridge Guard Who Let Everyone Through',
    opening:
      'At the broad river crossing a guard boasts that nobody has been refused passage. On the other bank, the records show everyone entered the wrong version of their destination.',
    artPrompt:
      "A wooden bridge over a broad dark river. A cheerful guard waves travellers across toward the far bank, where the town's reflection in the water shows a different town. Warning lanterns hang on the rails. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.",
    choices: [
      {
        id: 'mark',
        label: 'Mark which destination each traveler requested',
        outcome:
          'The guard begins offering honest directions. Some people still prefer the unexpected shore.',
      },
      {
        id: 'rescue',
        label: 'Retrieve the stranded from the wrong bank',
        outcome:
          'You bring two families back together, but one traveler decides to remain where they unexpectedly built a life.',
      },
    ],
  },
  '8,4': {
    key: '8,4',
    title: "The Thorn Gate's Open Mouth",
    opening:
      'The old gate opened with your Bramble Chime. In the reflection it has no hinges, only a mouth asking whether you still want what you wanted before.',
    artPrompt:
      'A giant gate of woven thorns shaped like an open mouth stands over a forest road, with a shining brass bell hanging from a branch beside it. Two paths lead through it into the forest. Low-angle wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'answer',
        label: 'Admit that your wish has changed',
        outcome:
          'The mouth closes gently and leaves a gap big enough for one honest traveler; it no longer calls you by your old life.',
      },
      {
        id: 'listen',
        label: 'Ask whose wish opened the gate',
        outcome:
          'The gate answers with many voices, including a villager you helped. You were not its only author.',
      },
    ],
  },
  '1,5': {
    key: '1,5',
    title: 'The Hearth That Cannot Cool',
    opening:
      'A house is warm in all weather because its founder begged that nobody inside ever feel lonely. Its guests can leave the door, but the house keeps remembering them inside.',
    artPrompt:
      'A brightly lit cottage among black pines with every window glowing orange. Through the open door, pale translucent guests sit around a fire, and the homeowner stands in the doorway. Wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'invite',
        label: 'Invite the guests to tell their own stories',
        outcome:
          "The ghosts disagree with the home's recollections. The hearth cools enough for the living to sleep.",
      },
      {
        id: 'vent',
        label: 'Open the chimney and let winter in',
        outcome:
          'The cold is real, but so is relief. The host starts making invitations that people may decline.',
      },
    ],
  },
  '5,5': {
    key: '5,5',
    title: "The Moss Sprite's Fair Duel",
    opening:
      'The sprite you could have fought has become the judge of every contest in the forest. She rules each bout fairly, then hides that losing contestants remember winning and cannot learn.',
    artPrompt:
      'A knee-high moss-covered sprite with a leaf cap, twig fingers and glinting green eyes blows a tiny wooden whistle while standing on a stone chessboard set into a woodland clearing, between two adult challengers who glare at each other. Medium-wide shot. Hand-painted gouache and ink illustration under cold violet moonlight with silver-blue shadows.',
    choices: [
      {
        id: 'witness',
        label: 'Ask both players what they remember',
        outcome:
          'They replay the duel together, comparing every move. Losing hurts less when memory is not rewritten for comfort.',
      },
      {
        id: 'teach',
        label: 'Let the sprite lose on purpose',
        outcome:
          'She discovers embarrassment will not destroy her. She quits being a perfect judge and asks to become a student.',
      },
    ],
  },
}
