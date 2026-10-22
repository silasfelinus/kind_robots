import type { TalkDef } from './types'

/**
 * Hidden wanderers are people with unfinished lives, not vending machines
 * dispensing a follower when a random card says yes.
 *
 * Every strand asks a different question at least twice, and a surviving
 * relationship may reach the court in exile. The choices matter mechanically
 * and leave flags used in their epilogues. A player who meets them late has
 * fewer opportunities, which is part of the cost of a sprawling court.
 */
export const SECRET_TALKS: readonly TalkDef[] = [
  {
    id: 'nettle-1',
    follower: 'F021',
    title: 'The First Clean Sheet',
    fromDay: 8,
    requires: { notFlags: ['komodo-betrayal'] },
    lines: [
      'Nettle has hung red thread over six beds. Five are occupied. The sixth has clean sheets and a stool beside it.',
      '“They will bring the fevered girl from the Freeholds by dusk,” she says. “She has not paid a toll since she was born. The gate clerk says that makes her no one.”',
      'There is a way to pay for the beds out of the treasury. There is another way to make the soldiers collect the debt. Nettle will stay for either, but asks which the emperor calls medicine.',
    ],
    options: [
      {
        id: 'treasury',
        label: 'Pay eight brass for the bed and forbid an infirmary toll.',
        requires: { cost: 8 },
        effects: { local: { yard: 2 }, flags: ['nettle-beds-open'] },
        response:
          'The girl arrives under one coat between two men. By nightfall the beds are full. Nettle writes their names on the wall, even those who cannot read them.',
      },
      {
        id: 'levy',
        label: 'Tell the Watch to collect the infirmary charge from the Freeholds.',
        effects: { brass: 12, local: { 'gate-watch': 1, yard: -1 }, flags: ['nettle-beds-levy'] },
        response:
          'The ledgers balance by supper. In the morning two beds are empty. Nettle tells you the families carried their sick home before the collectors arrived.',
      },
    ],
  },
  {
    id: 'nettle-2',
    follower: 'F021',
    title: 'The Household That Counted Four',
    fromDay: 17,
    requires: { flags: ['heard:nettle-1'], notFlags: ['komodo-betrayal'] },
    lines: [
      'A family sleeps on the floor of the infirmary. A grandmother, a father and two children. A customs ledger records three people, each of them healthy.',
      '“The fourth died last winter,” Nettle says. “They kept the fourth ration so the little one would not starve. Tell the truth and the Yard loses a ration. Let the lie stand and every other family is owed one.”',
      'Nettle has a quill waiting for you. She will not put the name in until you answer.',
    ],
    options: [
      {
        id: 'make-room',
        label: 'Register the living four and fund the missing ration for the next month.',
        requires: { cost: 15 },
        effects: { local: { yard: 2, ledger: -1 }, flags: ['nettle-four-names'] },
        response:
          'The fourth name is written. Nettle gives the quill back to you. At the next meal the grandmother carries a tray to a neighboring bed that has no family at all.',
      },
      {
        id: 'open-books',
        label: 'Publish the false ration entry and let every family challenge the records.',
        effects: { local: { ledger: 1, yard: -1 }, flags: ['nettle-open-books'] },
        response:
          'People line up outside the Archive for two days. Four families get their names back. Two lose extra food they had depended on. Nettle keeps a tally of each and asks you to read it.',
      },
    ],
  },
  {
    id: 'nettle-exile',
    follower: 'F021',
    title: 'Red Thread on the Border',
    fromDay: 44,
    requires: { flags: ['komodo-betrayal', 'heard:nettle-2'] },
    lines: [
      'Nettle has packed two wagons of medicinal roots. One is bound for the wounded in your hideout. The other is bound for families still living under the tower.',
      '“There are enough medicines to make one wagon safe,” she says. “Not two. I can take a longer route, but the roots will spoil if the weather turns.”',
      'She waits beside both wagons. She has not marked either with the crown.',
    ],
    options: [
      {
        id: 'outside',
        label: 'Pay twenty brass for another team and send the medicine back to the occupied villages.',
        requires: { cost: 20 },
        effects: { local: { yard: 2 }, affinity: { freeholds: 2 }, items: ['caravan-salve'], flags: ['nettle-crossed-border'] },
        response:
          'The carts leave under plain canvas. Weeks later, somebody at the occupied gate hangs red thread where you can see it from the hills.',
      },
      {
        id: 'own-wounded',
        label: 'Keep the medicines with the exiles. You still have wounded here.',
        effects: { local: { 'gate-watch': 2 }, flags: ['nettle-saved-hideout'] },
        response:
          'The guards recover. Three return to duty. Nettle speaks little at supper. She has learned something about what a kingdom means after its walls are gone.',
      },
    ],
  },
  {
    id: 'tiller-1',
    follower: 'F022',
    title: 'A Signal from Beneath the Tracks',
    fromDay: 18,
    requires: { notFlags: ['komodo-betrayal'] },
    lines: [
      'Tiller fixes a piece of copper wire between two dead railway spikes. A tapping comes back from underground.',
      '“Three short. One long,” he says. “A warning, if the old schedule is still true.” It has not been true in a hundred years.',
      'The copper is worth food. So is an early warning, if the voice has anybody alive behind it. Tiller cannot bring himself to cut the wire.',
    ],
    options: [
      {
        id: 'sell',
        label: 'Sell the recovered copper before the traders leave.',
        effects: { brass: 18, local: { lamplight: -1 }, flags: ['tiller-sold-wire'] },
        response:
          'The merchant weighs it without listening. Tiller keeps the two spikes, tapping them together at night when everyone else has gone to bed.',
      },
      {
        id: 'listen',
        label: 'Pay for a relay. Let the Archive record every knock.',
        requires: { cost: 12 },
        effects: { local: { lamplight: 2 }, affinity: { rustline: 2 }, flags: ['tiller-kept-signal'] },
        response:
          'The signal repeats five times. On the sixth, it spells the name of a village whose rails were lifted a generation ago.',
      },
    ],
  },
  {
    id: 'tiller-2',
    follower: 'F022',
    title: 'Three Signals, Two Villages',
    fromDay: 31,
    requires: { flags: ['heard:tiller-1'], notFlags: ['komodo-betrayal'] },
    lines: [
      'A message comes through the signal wires at dawn: the eastern tunnel is failing. A passenger wagon lies stuck beneath it.',
      'Tiller also hears a second code. The floodwater under the tunnel will carry the fallen stone into the river settlement downstream. He has one crew, with daylight enough for one place.',
      '“If we save the people on the wagon, the town takes the water,” he says. “If we shore up the river, they must walk out through the tunnel before it falls.”',
    ],
    options: [
      {
        id: 'wagon',
        label: 'Send the crew for the stranded wagon. Warn the river settlement by rider.',
        requires: { cost: 10 },
        effects: { affinity: { rustline: 3 }, local: { yard: -1 }, flags: ['tiller-wagon-rescued'] },
        response:
          'Every passenger leaves the tunnel. In the river settlement they count two ruined homes. The people there know why the engineers came too late.',
      },
      {
        id: 'river',
        label: 'Shore up the river settlement and send lanterns into the tunnel.',
        effects: { local: { yard: 2 }, affinity: { rustline: -3 }, items: ['signal-coil'], flags: ['tiller-river-saved'] },
        response:
          'The river barely rises. At dusk four passengers stumble out of the old tunnel. A fifth stays behind, and Tiller writes the name on the wire spool.',
      },
    ],
  },
  {
    id: 'sera-1',
    follower: 'F023',
    title: 'The Record of Twenty-Three',
    fromDay: 28,
    requires: { notFlags: ['komodo-betrayal'] },
    lines: [
      'Sera lays two registers on the Archive table. In one, twenty-three people died in the northern winter. In the other, there are no deaths at all.',
      '“They were not lost,” Sera says. “Their names were sold. The families who bought the empty pages are still at court, and their children have done nothing wrong.”',
      'The old bellkeeper asks whether a truth can be published without making new victims of it.',
    ],
    options: [
      {
        id: 'publish',
        label: 'Restore the names in the public register, including the buyers.',
        effects: { local: { lamplight: 2, 'old-houses': -2 }, flags: ['sera-names-public'] },
        response:
          'The paper is pinned to the chapel door. A family takes its name back. Another spends the afternoon scrubbing that name from its gate.',
      },
      {
        id: 'witness',
        label: 'Record the names under seal, and pay for private testimony from the families.',
        requires: { cost: 12 },
        effects: { local: { lamplight: 1, 'old-houses': 1 }, flags: ['sera-names-witnessed'] },
        response:
          'People come one by one. By winter there are twenty-three statements, each signed in a different hand. The bellkeeper makes you promise the seal can be broken someday.',
      },
    ],
  },
  {
    id: 'sera-2',
    follower: 'F023',
    title: 'The Thirteenth Toll',
    fromDay: 37,
    requires: { flags: ['heard:sera-1'], notFlags: ['komodo-betrayal'] },
    lines: [
      'The bell in Hollow Bell rings thirteen times. A town with twelve hours of daylight has never needed a thirteenth.',
      'Sera has tracked the sound to a buried chapel. An inspection crew could open it, but the square above is full of refugees who have nowhere else to sleep.',
      '“Some nights the dead deserve an answer,” Sera says. “And some nights the living deserve a roof.”',
    ],
    options: [
      {
        id: 'excavate',
        label: 'Relocate the square at court expense and open the buried chapel.',
        requires: { cost: 18 },
        effects: { local: { lamplight: 2, yard: -1 }, items: ['bell-clapper'], flags: ['sera-buried-bell'] },
        response:
          'The stone beneath the square holds a bell without a clapper. There are names carved inside it, too high for any visitor to have reached with a chisel.',
      },
      {
        id: 'leave-it',
        label: 'Leave the square standing and ring twelve strokes for the living.',
        effects: { local: { yard: 2, lamplight: -1 }, flags: ['sera-twelve-strokes'] },
        response:
          'The families stay dry. At the thirteenth hour Sera sits awake beside the lamp, making a list of every voice the bell might have carried.',
      },
    ],
  },
  {
    id: 'tarn-1',
    follower: 'F024',
    title: 'The Wrong Map',
    fromDay: 39,
    requires: { notFlags: ['komodo-betrayal'] },
    lines: [
      'Tarn has found two copies of a caravan map. One marks the only pass the raiders have not watched. The other marks a dry well where an escort might wait.',
      '“The first map gets the children out,” Tarn says. “The second keeps the raiders from knowing where the children went. The messenger carrying either may not come back.”',
      'The Watch asks for a map. A group of families at the gate asks for a map. You have time to send one runner.',
    ],
    options: [
      {
        id: 'families',
        label: 'Send the real pass to the families and make the Watch improvise.',
        effects: { local: { yard: 2, 'gate-watch': -2 }, flags: ['tarn-families-map'] },
        response:
          'The families leave at dusk. Three watchmen ride on a false road to draw the raiders away. Two come home. The third leaves his saddle behind.',
      },
      {
        id: 'watch',
        label: 'Give the pass to the Watch and promise the families a guarded crossing tomorrow.',
        effects: { local: { 'gate-watch': 2, yard: -2 }, flags: ['tarn-watch-map'] },
        response:
          'The Watch secures the crossing. The families wait through the night. By morning the oldest child has a fever and nobody can say whose delay made it worse.',
      },
    ],
  },
  {
    id: 'tarn-exile',
    follower: 'F024',
    title: 'The Cart without Horses',
    fromDay: 46,
    requires: { flags: ['komodo-betrayal', 'heard:tarn-1'] },
    lines: [
      'A cart stands across the exile road with both horses gone. A family hides beneath its canvas. Farther up the road a medicine wagon has broken an axle in the same mud.',
      'Tarn says there is room in the escort for only one. The families are cold. The wounded in the hideout are waiting for medicine. Each can be reached before night, but not both.',
    ],
    options: [
      {
        id: 'family',
        label: 'Bring the family in before dark. Find medicines on another road.',
        effects: { local: { yard: 2, 'gate-watch': -1 }, flags: ['tarn-families-sheltered'] },
        response:
          'At the hideout, the children sleep between the cooking fire and the wet blankets. One soldier asks when the wagon is due. Tarn does not meet his eyes.',
      },
      {
        id: 'medicine',
        label: 'Take the medicine wagon. Leave the family fuel, food and a marked route.',
        effects: { local: { 'gate-watch': 2, yard: -1 }, flags: ['tarn-medicine-delivered'] },
        response:
          'The medicines arrive dry. At dawn the cart is gone from the road. The food has been eaten and the fire is cold. You do not know which direction the family chose.',
      },
    ],
  },
  {
    id: 'odo-1',
    follower: 'F025',
    title: 'The Sand That Fell Twice',
    fromDay: 45,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Odo pours black sand from a glass gauge. It falls upward for a heartbeat, then settles in the palm of the hand.',
      '“The storm is already over in the north,” Odo says. “Here, it has not started.” The farmers want to plant before the next rain. The exiled Watch wants every cart ready to shelter the walls.',
      'There are not enough teams to plow and fortify in the same afternoon.',
    ],
    options: [
      {
        id: 'fields',
        label: 'Send the carts to plant. Trust the old banks to hold through the storm.',
        effects: { local: { yard: 2, 'gate-watch': -2 }, flags: ['odo-planted-early'] },
        response:
          'Seeds go in the earth under a black sky. The first rain comes warm. By dawn a bank has washed away, but tiny green shoots stand in the field.',
      },
      {
        id: 'banks',
        label: 'Build the flood banks first. Spend brass replacing the lost seed.',
        requires: { cost: 18 },
        effects: { local: { 'gate-watch': 2, yard: -1 }, flags: ['odo-held-bank'] },
        response:
          'The bank holds. The farmers must wait another week, and the first planting will be small. Odo draws the weather backwards in the sand, from harvest to seed.',
      },
    ],
  },
  {
    id: 'odo-2',
    follower: 'F025',
    title: 'Tomorrow in a Bottle',
    fromDay: 49,
    requires: { flags: ['heard:odo-1', 'komodo-betrayal'] },
    lines: [
      'Odo has sealed a scrap of paper inside the rain gauge. It gives the exact price of salt at tomorrow’s market.',
      '“If it is right, you can feed everybody at the hideout,” Odo says. “The same ink says three merchants never reach the market at all. I do not know how much of it you can change.”',
      'The only escort available for the merchants is the one that would bring the salt to your own people.',
    ],
    options: [
      {
        id: 'profit',
        label: 'Use the forecast to buy salt cheaply, and save the hideout’s reserves.',
        effects: { brass: 25, local: { ledger: 1, yard: -1 }, flags: ['odo-kept-forecast'] },
        response:
          'The price is right. The salt arrives. Nobody says why the three missing stalls have been roped off at the market.',
      },
      {
        id: 'warn',
        label: 'Send the escort to warn the merchants. Tear up the prediction before you can profit.',
        effects: { brass: -8, local: { yard: 2, ledger: -1 }, items: ['storm-glass-vial'], flags: ['odo-broke-forecast'] },
        response:
          'Two merchants turn back. The third refuses to believe a warning from an exile and drives on. At night Odo leaves the broken gauge outside. A blue drop forms in the glass.',
      },
    ],
  },
]
