import type { AudienceDef } from './types'

const firstBill = [
  'd08-blankets-restored',
  'd08-blankets-leased',
  'd08-blankets-evicted',
]
const wartimeBill = [
  'd28-sellers-yard',
  'd28-sellers-warrants',
  'd28-sellers-mustered',
]
const exileBill = [
  'd37-sellers-escorted',
  'd37-sellers-left',
  'd37-sellers-records-saved',
  'd37-sellers-names-exposed',
  'd37-sellers-bonds-redeemed',
  'd37-sellers-claims-sold',
]

/** A Day 8 market-charter decision is still someone's livelihood in exile. */
export const MARKET_ACCOUNT_AUDIENCES: Readonly<
  Record<number, readonly AudienceDef[]>
> = {
  28: [
    {
      id: 'd28-market-bill',
      title: 'Four Empty Pitches',
      speaker: 'A Freehold egg-seller and Factor Marisol Tallow',
      npc: 'marisol-tallow',
      faction: 'ledger',
      requires: { standing: { flags: firstBill, min: 1 } },
      lines: [
        'The egg-seller sets four receipts on the throne step. Each bears your seal. She has walked here from the market in her good shoes. The soles have come loose.',
        '“The roads are full of soldiers. My customers are the ones who have no boots. I need a place to sell eggs, not another certificate saying I once had one.”',
        'Factor Tallow holds the original charter open. “The crown signed every page. A seal cannot feed her. Neither can an exception that leaves a second seller outside.”',
        {
          who: 'Young Komodo',
          npc: 'young-komodo',
          text: 'When the war reaches this gate, Majesty, it will not ask whether the charter was fair. It will ask who owns the food.',
        },
      ],
      variants: [
        {
          flags: ['d08-blankets-restored'],
          lines: [
            'The egg-seller has brought the title to her restored pitch. A Ledger cousin has written his unpaid deposit across the back.',
            '“You bought back my stall. I sold there until the troops took the road. Now a man says I owe him the ground beneath it.”',
            'Factor Tallow lays down the cousin’s receipt. “Your payment returned the pitch, Majesty. It did not return his deposit.”',
            {
              who: 'Young Komodo',
              npc: 'young-komodo',
              text: 'Two honest claimants. One patch of dirt. The army can take it from both for free.',
            },
          ],
        },
        {
          flags: ['d08-blankets-leased'],
          lines: [
            'The egg-seller has kept the seven-day lease inside her apron. Three of its dates have been crossed through so hard the paper tore.',
            '“You gave us a week. We sold eggs for five days. Then the troops came. Now the factor calls the last two days rent owed.”',
            'Factor Tallow shows the arithmetic. It is correct. That makes the seller angrier.',
            {
              who: 'Young Komodo',
              npc: 'young-komodo',
              text: 'The crown bought them time. Time passed. There is the difficulty with lending it.',
            },
          ],
        },
        {
          flags: ['d08-blankets-evicted'],
          lines: [
            'The egg-seller brings the Watch’s eviction order. It is spotted with road mud and still carries the price of eight brass.',
            '“Your guards moved our blankets outside the gate. We have sold food to their replacements from a ditch ever since.”',
            'Factor Tallow keeps the charter shut. “The fees were law. So were the removals. Hunger was not in the language.”',
            {
              who: 'Young Komodo',
              npc: 'young-komodo',
              text: 'The soldiers already know where the sellers sleep. A second order could give them a different place.',
            },
          ],
        },
      ],
      options: [
        {
          id: 'reserve-yard',
          label: 'Spend twenty brass on shared Yard pitches. Displace the army stores.',
          requires: { cost: 20 },
          effects: {
            affinity: { freeholds: 6 },
            local: { yard: 2, ledger: -2, 'gate-watch': -1 },
            flags: ['d28-sellers-yard'],
          },
          response:
            'Four chalk squares appear beside the Yard ovens. The quartermaster moves his grain sacks under a leaking roof. The sellers put out eggs before the paint is dry.',
        },
        {
          id: 'open-warrants',
          label: 'Publish every stall warrant. Leave the sellers to fight the Ledger.',
          effects: {
            affinity: { freeholds: 2 },
            local: { lamplight: 2, ledger: -3, yard: -1 },
            flags: ['d28-sellers-warrants'],
          },
          response:
            'The warrants go on the gate. By sunset a Ledger cousin has named the egg-seller as his enemy. She can read her own name. She asks for a guard. No guard is promised.',
        },
        {
          id: 'muster-sellers',
          label: 'Take sixteen brass from the army. Put the sellers on ration duty.',
          effects: {
            brass: 16,
            affinity: { freeholds: -7 },
            local: { yard: 2, ledger: 2 },
            flags: ['d28-sellers-mustered'],
          },
          response:
            'The army pays for four kitchen hands. Their baskets are confiscated with the rest of the supplies. The egg-seller gets a bed, two meals and no wage she can take home.',
        },
      ],
    },
  ],
  37: [
    {
      id: 'd37-market-bill',
      title: 'The Market Leaves',
      speaker: 'Factor Marisol Tallow',
      npc: 'marisol-tallow',
      faction: 'ledger',
      requires: { standing: { flags: wartimeBill, min: 1 } },
      lines: [
        'Factor Tallow has a market ledger under her coat. Beyond the gate, carts have been burning since dawn.',
        '“Four sellers, Your Majesty. Four different versions of what you promised. They are all trying to get out before night.”',
        'She lays a clean page beside the dirty one. “I can write whichever version you want. It will not change who gets through the gate.”',
      ],
      variants: [
        {
          flags: ['d28-sellers-yard'],
          lines: [
            'The Yard stalls are still standing. The roads into them are not. Four sellers wait with their carts beside the Watch.',
            'Factor Tallow has their keys. “You paid for the pitches, Majesty. The army wants the wagons. The sellers want their families carried first.”',
          ],
        },
        {
          flags: ['d28-sellers-warrants'],
          lines: [
            'Copies of the stall warrants have been nailed to the market gate. Someone has blackened the sellers’ names with pitch.',
            'Factor Tallow holds one clean copy. “A public record is an excellent target. The sellers have asked whether you meant to protect them or merely prove a point.”',
          ],
        },
        {
          flags: ['d28-sellers-mustered'],
          lines: [
            'The army has left the market with four kitchens and four unpaid sellers. Their baskets hang from the wagons like empty helmets.',
            'Factor Tallow slides a payroll page across the table. “The army paid the crown. It did not pay the hands. Shall I call the difference a levy?”',
          ],
        },
      ],
      options: [
        {
          id: 'escort',
          label: 'Pay fifteen brass for a Watch escort. Let the grain go unguarded.',
          requires: { flags: ['d28-sellers-yard'], cost: 15 },
          effects: {
            affinity: { freeholds: 5 },
            local: { 'gate-watch': -2, yard: -1 },
            flags: ['d37-sellers-escorted'],
          },
          response:
            'The four carts leave in a line behind the Watch. Someone cuts open the unguarded grain shed before dawn. All four sellers reach the river.',
        },
        {
          id: 'leave',
          label: 'Save the grain. Tell the sellers the road is theirs to risk.',
          requires: { flags: ['d28-sellers-yard'] },
          effects: {
            affinity: { freeholds: -4 },
            local: { yard: 2 },
            flags: ['d37-sellers-left'],
          },
          response:
            'The carts go separately. One returns at dark with a broken axle. Three do not. The grain stays dry, and the quartermaster thanks you.',
        },
        {
          id: 'hide-copy',
          label: 'Pay ten brass to hide the witnesses and their copies.',
          requires: { flags: ['d28-sellers-warrants'], cost: 10 },
          effects: {
            affinity: { freeholds: 3 },
            local: { lamplight: -2, ledger: -1 },
            flags: ['d37-sellers-records-saved'],
          },
          response:
            'The sellers take shelter behind the Archive wall. Your written proof goes into a tin under the floor. Nobody outside knows who still has a copy.',
        },
        {
          id: 'post-copy',
          label: 'Read the names from the gate. Keep the warrants public.',
          requires: { flags: ['d28-sellers-warrants'] },
          effects: {
            affinity: { freeholds: -3 },
            local: { lamplight: 3, ledger: -3 },
            flags: ['d37-sellers-names-exposed'],
          },
          response:
            'A clerk reads through the list while the fire climbs the market roof. The sellers stand beside him. Everyone hears their names. Everyone with a debt hears them too.',
        },
        {
          id: 'redeem-pay',
          label: 'Spend twenty brass to release the kitchen hands with wages.',
          requires: { flags: ['d28-sellers-mustered'], cost: 20 },
          effects: {
            affinity: { freeholds: 6 },
            local: { ledger: -2, yard: -1 },
            flags: ['d37-sellers-bonds-redeemed'],
          },
          response:
            'The egg-seller weighs her wages twice. She goes to collect the others. The army leaves without cooks and burns its last decent meal.',
        },
        {
          id: 'sell-claims',
          label: 'Sell their unpaid wages to the Ledger for fifteen brass.',
          requires: { flags: ['d28-sellers-mustered'] },
          effects: {
            brass: 15,
            affinity: { freeholds: -8 },
            local: { ledger: 3, yard: 1 },
            flags: ['d37-sellers-claims-sold'],
          },
          response:
            'Tallow pays in silvered brass, one disc per signed warrant. The sellers remain in the kitchens. Their wages now belong to someone who can afford to wait.',
        },
      ],
    },
  ],
  46: [
    {
      id: 'd46-market-bill',
      title: 'The Fourth Receipt',
      speaker: 'The Freehold egg-seller',
      faction: 'freeholds',
      requires: { standing: { flags: exileBill, min: 1 } },
      lines: [
        'A woman finds the hideout with a basket on her arm. Inside are four folded market papers and one egg. The egg is cracked.',
        '“I came before the war with an empty basket. Now I have all the proof a clerk could want. People are still hungry.”',
        'She sets the egg on the table. “I am not here to tell you whether you were a good ruler. I want to know what we carry when we leave.”',
      ],
      variants: [
        {
          flags: ['d37-sellers-escorted'],
          lines: [
            'The egg-seller walks into the hideout on a Watch crutch. All four sellers reached the river. One guard did not.',
            'She has kept his name beside the receipts. “We are safe. His family is not. What does the new crown owe them?”',
          ],
        },
        {
          flags: ['d37-sellers-left'],
          lines: [
            'The egg-seller walks into the hideout alone. The other three carts never found the same road.',
            'She has their old rent slips. “You kept the grain. I have no quarrel with the grain. But I want their names kept somewhere.”',
          ],
        },
        {
          flags: ['d37-sellers-records-saved'],
          lines: [
            'The egg-seller has brought the tin of hidden warrants. Its bottom is dark with cellar water.',
            '“The papers survived. The people who held them are still hiding. Someone must put names to what the Ledger did.”',
          ],
        },
        {
          flags: ['d37-sellers-names-exposed'],
          lines: [
            'The egg-seller carries a gate notice ripped at the nail holes. Her name is the only one still legible.',
            '“We told the truth. A man followed my daughter for two nights after that. The paper was braver than we could afford.”',
          ],
        },
        {
          flags: ['d37-sellers-bonds-redeemed'],
          lines: [
            'The egg-seller comes into the hideout with four paid wage slips. She lays them on the table, each in a different hand.',
            '“We were paid. It cost the army its cooks. A woman on that road starved anyway. I remember her too.”',
          ],
        },
        {
          flags: ['d37-sellers-claims-sold'],
          lines: [
            'The egg-seller arrives with the kitchen wage warrants. The Ledger bought her work without buying her consent.',
            '“They say you can forgive a debt after you sell it. I would like to see that law written before someone asks me to sign.”',
          ],
        },
      ],
      options: [
        {
          id: 'food',
          label: 'Spend fifteen brass on four food carts. No new warrants.',
          requires: { cost: 15 },
          effects: {
            affinity: { freeholds: 5 },
            local: { ledger: -2 },
            flags: ['d46-sellers-fed'],
          },
          response:
            'The food goes out with no seals on the sacks. The seller counts four full carts. She knows that tomorrow somebody else will be counting empty ones.',
        },
        {
          id: 'record',
          label: 'Carry the four accounts into the postwar record, names included.',
          effects: {
            local: { lamplight: 2, ledger: -2 },
            affinity: { freeholds: -1 },
            flags: ['d46-sellers-recorded'],
          },
          response:
            'She checks every spelling and takes one copy. “Someone may come after us,” she says. “At least they will have to read first.”',
        },
        {
          id: 'burn',
          label: 'Burn the warrants. Free the sellers; erase the honest claims too.',
          effects: {
            local: { ledger: -4, lamplight: -2 },
            affinity: { freeholds: 2 },
            flags: ['d46-sellers-warrants-burned'],
          },
          response:
            'The papers catch fast. The seller stays to watch. “There was money owed to us in there too,” she says. She leaves the ashes where you can see them.',
        },
      ],
    },
  ],
}
