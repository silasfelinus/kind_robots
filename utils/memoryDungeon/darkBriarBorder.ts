import type { DarkBriarScene } from './darkBriar'

/** Border ward: safety versus control, civic debts and the old Thorn Gate. */
export const DARK_BRIAR_BORDER: Record<string, DarkBriarScene> = {
  '7,2': {
    key: '7,2',
    title: 'The Patrol of Unborn Children',
    opening: 'A pair of sentries maintain a barricade against a disaster due next year. Their actual enemies are the families trying to cross to a school that will never open.',
    artPrompt: 'Two weary sentries at thorn barricade; a schoolhouse beyond, children with school satchels and luminous clocks, violet morning, no text.',
    choices: [
      {
        id: 'open',
        label: 'Open a supervised route to the school',
        outcome: 'Parents volunteer to watch the crossing. The sentries discover safety can require a road, not a wall.',
      },
      {
        id: 'proof',
        label: 'Demand the forecast\'s source',
        outcome: 'The prophecy was purchased by a school rival. Its certainty vanishes as soon as someone asks who profited.',
      },
    ],
  },
  '8,2': {
    key: '8,2',
    title: 'The Cliffside Census',
    opening: 'A registrar counts everybody who lives on the cliffs, including a person who exists only when someone misses them. She refuses to delete the entry without asking the missing person.',
    artPrompt: 'Windswept eastern cliff census hut, ghostly extra chair, registrar clutching blue papers, twilight gulls, no writing.',
    choices: [
      {
        id: 'call',
        label: 'Leave an invitation for the uncounted resident',
        outcome: 'An adult stranger arrives, unable to say where they came from. They choose a name and a place to sleep before answering questions.',
      },
      {
        id: 'erase',
        label: 'Challenge the category instead of the person',
        outcome: 'The registrar removes the box marked impossible. She keeps the resident\'s name in the same ledger as everybody else\'s.',
      },
    ],
  },
  '1,3': {
    key: '1,3',
    title: 'The Fence Built from Promises',
    opening: 'A farm family\'s fence is made of vows spoken by their neighbors. When any neighbor changes their mind, the posts loosen and the livestock scatter.',
    artPrompt: 'Old orchard fence composed of knotted glowing promises, nervous farmer and wandering goat, moonlit pines, no letters.',
    choices: [
      {
        id: 'renegotiate',
        label: 'Help the neighbors renegotiate the boundary',
        outcome: 'They replace an eternal vow with a practical maintenance rota. The goats find this considerably less romantic.',
      },
      {
        id: 'repair',
        label: 'Repair the fence with actual timber',
        outcome: 'It works until the first storm. The family realizes they wanted help, not obedience.',
      },
    ],
  },
  '2,3': {
    key: '2,3',
    title: 'The Lantern Keeper\'s Blind Spot',
    opening: 'A lantern keeper has illuminated every hidden danger except the room where she keeps her own memories. There, light turns yesterday into a story told by somebody else.',
    artPrompt: 'Rotating brass lantern in a misty watch house, keeper watching inverted silhouettes through panes, no text.',
    choices: [
      {
        id: 'enter',
        label: 'Enter the dark room with her permission',
        outcome: 'She finds a memory of refusing to rescue a stranger. It hurts, but no spell can change the fact that she later returned.',
      },
      {
        id: 'mirror',
        label: 'Bring the lantern outside instead',
        outcome: 'The keeper learns her tool only shows what she expects. She begins asking travelers which roads they need lit.',
      },
    ],
  },
  '3,3': {
    key: '3,3',
    title: 'The Road of Shared Names',
    opening: 'Travelers exchange names to pass an old toll. A young carter has forgotten which name was hers, but remembers the horse\'s name perfectly.',
    artPrompt: 'Old stone toll arch covered in blank nameplates, nervous carter beside patient shaggy horse, reflected roads, no visible letters.',
    choices: [
      {
        id: 'untangle',
        label: 'Trace the names through their owners',
        outcome: 'The carter chooses her original name freely; the horse still comes when called by the borrowed one.',
      },
      {
        id: 'abolish',
        label: 'Help travelers build a toll-free bypass',
        outcome: 'The keeper protests that somebody must be responsible for the road. Travelers offer money and labor instead of identities.',
      },
    ],
  },
  '7,3': {
    key: '7,3',
    title: 'The Thorn Patrol\'s Unpaid Oath',
    opening: 'The disgruntled sentries you might have fought are still guarding a shortcut. Their contract pays them in memories of heroic victories, so their actual courage is never acknowledged.',
    artPrompt: 'Forest patrol in battered armor, absurd medals made of fog, thorn gate road under siege, bitter candlelit fairy atmosphere.',
    choices: [
      {
        id: 'settle',
        label: 'Read their contract before fighting',
        outcome: 'You find a clause allowing retirement after one honest witness. The sentries beg you not to turn their work into a legend.',
      },
      {
        id: 'organize',
        label: 'Ask the patrol whom they protect',
        outcome: 'They escort villagers through the shortcut instead of charging a duel. Their commander calls it insubordination.',
      },
    ],
  },
  '8,3': {
    key: '8,3',
    title: 'The Gatehouse of Second Opinions',
    opening: 'The gatekeeper offers two keys, one marked certain and one marked perhaps. Every traveler who took the certain key vanished into a pleasant life somebody else had selected.',
    artPrompt: 'Stone gatehouse with two oversized ornate keys hovering before different landscape portals, curious gatekeeper, dramatic side lighting, no readable marks.',
    choices: [
      {
        id: 'perhaps',
        label: 'Choose the uncertain door',
        outcome: 'You arrive on the road you meant to travel, but without guarantees. The gatekeeper admits the other door was easier to advertise.',
      },
      {
        id: 'warn',
        label: 'Warn the waiting travelers about certainty',
        outcome: 'Some leave the queue; others still choose the comfortable door. You cannot make that choice for them.',
      },
    ],
  },
  '1,4': {
    key: '1,4',
    title: 'The Woodsman\'s Unfinished Rescue',
    opening: 'A woodsman swore to cut every dangerous tree. The Reimaginer took him literally and now every stump tells the story of a creature that lost its home.',
    artPrompt: 'Woodsman kneeling among thousands of cut stumps showing spectral nests, distant intact oak, somber reverse moonlight, no writing.',
    choices: [
      {
        id: 'plant',
        label: 'Give the woodsman seedlings and time',
        outcome: 'He plants a mixed forest and invites the displaced creatures to choose where to settle. None forgive him immediately.',
      },
      {
        id: 'confess',
        label: 'Bring the refugees to hear his account',
        outcome: 'They demand a promise to stop, not an apology. His axe becomes a tool for building shelters.',
      },
    ],
  },
  '7,4': {
    key: '7,4',
    title: 'The Bridge Guard Who Let Everyone Through',
    opening: 'At the broad river crossing a guard boasts that nobody has been refused passage. On the other bank, the records show everyone entered the wrong version of their destination.',
    artPrompt: 'Bridge over dark broad river, cheerful guard waving travelers across toward cities with split reflections, warning lanterns, no text.',
    choices: [
      {
        id: 'mark',
        label: 'Mark which destination each traveler requested',
        outcome: 'The guard begins offering honest directions. Some people still prefer the unexpected shore.',
      },
      {
        id: 'rescue',
        label: 'Retrieve the stranded from the wrong bank',
        outcome: 'You bring two families back together, but one traveler decides to remain where they unexpectedly built a life.',
      },
    ],
  },
  '8,4': {
    key: '8,4',
    title: 'The Thorn Gate\'s Open Mouth',
    opening: 'The old gate opened with your Bramble Chime. In the reflection it has no hinges, only a mouth asking whether you still want what you wanted before.',
    artPrompt: 'Giant woven thorn gate shaped like an open mouth, shining bell suspended beside it, two paths one remembered one unknown, no text.',
    choices: [
      {
        id: 'answer',
        label: 'Admit that your wish has changed',
        outcome: 'The mouth closes gently and leaves a gap big enough for one honest traveler; it no longer calls you by your old life.',
      },
      {
        id: 'listen',
        label: 'Ask whose wish opened the gate',
        outcome: 'The gate answers with many voices, including a villager you helped. You were not its only author.',
      },
    ],
  },
  '1,5': {
    key: '1,5',
    title: 'The Hearth That Cannot Cool',
    opening: 'A house is warm in all weather because its founder begged that nobody inside ever feel lonely. Its guests can leave the door, but the house keeps remembering them inside.',
    artPrompt: 'Overbright cozy cottage amid black pines, spectral remembered guests seated around fire, homeowner at open doorway, no text.',
    choices: [
      {
        id: 'invite',
        label: 'Invite the guests to tell their own stories',
        outcome: 'The ghosts disagree with the home\'s recollections. The hearth cools enough for the living to sleep.',
      },
      {
        id: 'vent',
        label: 'Open the chimney and let winter in',
        outcome: 'The cold is real, but so is relief. The host starts making invitations that people may decline.',
      },
    ],
  },
  '5,5': {
    key: '5,5',
    title: 'The Moss Sprite\'s Fair Duel',
    opening: 'The sprite you could have fought has become the judge of every contest in the forest. She rules each bout fairly, then hides that losing contestants remember winning and cannot learn.',
    artPrompt: 'Small formidable moss sprite with glowing referee whistle, two grown challengers seeing conflicting mirror scores on a woodland chessboard, no text.',
    choices: [
      {
        id: 'witness',
        label: 'Ask both players what they remember',
        outcome: 'They replay the duel together, comparing every move. Losing hurts less when memory is not rewritten for comfort.',
      },
      {
        id: 'teach',
        label: 'Let the sprite lose on purpose',
        outcome: 'She discovers embarrassment will not destroy her. She quits being a perfect judge and asks to become a student.',
      },
    ],
  },
}
