import type { TeamId } from './prototypes'
import {
  arc,
  beat,
  end,
  type AllianceLaterArc,
} from './campaignAllianceArcTypes'

export const catgirlAllianceArcs = {
  bloodfairies: arc(
    [
      beat(
        'A bounty hunter attends the second gig with a scanner hidden in a drumstick.',
        'Swap the drumsticks',
        'The drummer plays with wooden spoons while the scanner goes down a garbage chute.',
        'Let the scanner sing',
        'The hunter broadcasts a false hit on the sound system and pursues the wrong singer.',
      ),
      beat(
        'The lab offers the band a recording contract in exchange for one escaped vocalist.',
        'Refuse the contract onstage',
        'The crowd chants the missing singer’s chosen name until the lawyers leave.',
        'Plant a counterfeit singer',
        'A mannequin in sequins signs the contract; the hunters escort it away in a limousine.',
      ),
      beat(
        'An injured roadie knows which catgirl carries the nursery map, and the guards are closing in.',
        'Carry the roadie through the alley',
        'The band loses its equipment, but the roadie and the map reach the safehouse.',
        'Turn the road cases into decoys',
        'The guards seize six amplifiers and miss the map folded in a guitar strap.',
      ),
      beat(
        'At the final show, the lab demands that every masked musician remove their disguise.',
        'Keep every mask on',
        'Fans pass identical masks forward until the entire crowd becomes impossible to catalogue.',
        'Expose the lab’s surveillance feed',
        'The arena sees the hunters’ faces and camera positions instead of the performers.',
      ),
    ],
    end(
      'NO SERIAL NUMBERS ON THE SETLIST',
      'The band releases the record without photographs or genetic credits. The catgirls choose their own names, and the audience learns them by singing along.',
      'The broadcast makes the hunters public figures. The city recognizes the escapees, not the laboratory’s property, and the final encore belongs to both crews.',
    ),
  ),
  ironjaw: arc(
    [
      beat(
        'Rivet discovers the hatchery runs on heat diverted from Ironjaw’s sleeping quarters.',
        'Warm both nurseries in shifts',
        'The lizard mechanics build a rotating furnace that keeps every cot alive through the night.',
        'Steal the laboratory’s entire boiler',
        'The lab goes dark; a boiler rolls down the escape route behind a stolen truck.',
      ),
      beat(
        'An escaped hatchling carries a gene key that could unlock every remaining cage.',
        'Keep the hatchling out of the raid',
        'A mechanic copies the key without touching the frightened child.',
        'Use the key during a daylight breach',
        'The research wing opens from end to end while alarms call every guard to one corridor.',
      ),
      beat(
        'The union discovers the scientists falsified both crews’ birth records.',
        'Collect witness statements',
        'Workers preserve every testimony before the remaining files can burn.',
        'Broadcast the falsified records',
        'Families across the city recognize the signatures and turn on the laboratory recruiters.',
      ),
      beat(
        'The lab threatens to cut the shared heating grid unless the catgirls surrender their leader.',
        'Build an independent warm shelter',
        'The new foundry keeps the refugees alive without a corporate thermostat.',
        'Seize the power switch first',
        'Rivet takes the central control room and puts the scientists on a meter they cannot afford.',
      ),
    ],
    end(
      'THE WARMEST ROOM IN THE CITY',
      'The rescued hatchlings and escaped workers open a warm communal workshop. Nobody has to prove their species, age, or ownership to come inside.',
      'The laboratory loses both its birth registry and its power grid. The new union signs its first charter with names the workers chose themselves.',
    ),
  ),
  riot: arc(
    [
      beat(
        'The stage’s disappearing cabinet arrives sealed with an actual captive inside.',
        'Free the captive before rehearsal',
        'The magician performs with an empty box while the missing person takes the service stairs.',
        'Turn the inspection into the trick',
        'The inspector climbs into the cabinet and emerges wearing the captive’s tracking tag.',
      ),
      beat(
        'The hunters bribe an understudy to reveal the trapdoor under the stage.',
        'Give the understudy a safe exit',
        'The understudy confesses before curtain and is ushered into the escape convoy.',
        'Move the trapdoor under the VIP box',
        'The hunters inspect the wrong floor while the escape route opens under their own seats.',
      ),
      beat(
        'A kidnapped stagehand is scheduled to be sold as part of the intermission raffle.',
        'Cancel the raffle and rescue them',
        'The audience gets a refund and the stagehand gets a name instead of a number.',
        'Rig the raffle against its sponsors',
        'Every winning ticket leads security into the same empty storage cage.',
      ),
      beat(
        'The lab rolls a mobile DNA scanner onto the stage during the midnight finale.',
        'Invite the whole crowd behind the curtain',
        'The audience hides the escapees under a hundred identical costumes.',
        'Make the scanner reveal its owners',
        'Its screen projects the hunters’ own contraband samples above the footlights.',
      ),
    ],
    end(
      'THE LAST GREAT ESCAPE',
      'Anarkiss keeps the trapdoor open after the curtain falls. Catgirls and stagehands use it as a route out of every locked room in the district.',
      'The hunters become the final act in the show they tried to shut down. Their stolen records spill from the rafters, and every captive gets an exit.',
    ),
  ),
  undertow: arc(
    [
      beat(
        'A neighborhood printer secretly keeps copies of the deleted names for the laboratory.',
        'Protect the printer’s family',
        'The printer turns over the hidden plates and follows the escapees into witness protection.',
        'Replace the plates with decoy identities',
        'The laboratory raids six empty apartments while the real families board a night ferry.',
      ),
      beat(
        'The escape route appears in the city’s public flood-warning system.',
        'Take the relay offline for a night',
        'The Oracle routes warning bells by hand while the catgirls move through silent tunnels.',
        'Poison the hunters’ map',
        'The pursuit squad follows a perfect digital route into a sealed pumping station.',
      ),
      beat(
        'Undertow’s oldest informant refuses to delete the evidence of experiments on children.',
        'Protect the evidence and its witnesses',
        'Copies move into safe hands, and the survivors choose when to tell their stories.',
        'Release only the doctors’ own admissions',
        'The city hears the scientists confess without exposing a single child.',
      ),
      beat(
        'The final transmission could reveal every safehouse along with the laboratory’s crimes.',
        'Broadcast a redacted archive',
        'The public gets proof while the surviving fugitives remain untraceable.',
        'Broadcast a hunter-only frequency',
        'The laboratory hears its own encrypted orders read back by a free voice.',
      ),
    ],
    end(
      'THE FREQUENCY OF A FREE NAME',
      'The archived evidence belongs to its survivors. Undertow keeps the signal open for emergencies, never for another inventory of bodies.',
      'The hunters’ private network becomes a public confession booth. No escapee appears on the screen, but every stolen order has a signature.',
    ),
  ),
  exchange: arc(
    [
      beat(
        'The Exchange buys the lab’s old cloning patents and starts charging rent on the escapees’ shadows.',
        'Contest the patents in the public ledger',
        'A line of living witnesses makes the ownership certificates impossible to enforce.',
        'Bid with a fraudulent master copy',
        'The collectors purchase a blank book and discover the debt has no legal subject.',
      ),
      beat(
        'A debt collector offers to erase every clone’s balance in return for one original DNA sample.',
        'Protect the original from the bargain',
        'No sample changes hands; the creditors are forced to argue with people rather than data.',
        'Auction a synthetic sample instead',
        'Every buyer receives the same counterfeit swab, and the market collapses under claims.',
      ),
      beat(
        'The ancient notary insists that escaped copies cannot inherit their own wages.',
        'Write a charter of individual ownership',
        'Each clone signs for their labor with a separate name and a steady hand.',
        'Force the notary to testify under oath',
        'The notary admits the copies have already paid their debts a thousand times.',
      ),
      beat(
        'The final auction lot contains the birth certificate of the first free catgirl.',
        'Remove the certificate from sale',
        'It goes into a family archive where no one can place another bid.',
        'Bid the auction house against itself',
        'The collectors spend every last Meat credit to buy a document that cannot be owned.',
      ),
    ],
    end(
      'A DEED FOR NO ONE',
      'The Exchange cancels its claim to living people. Every clone leaves with an independent contract, and the first free name is written on the door.',
      'The last auctioneer sells the idea of ownership to a hall of empty chairs. The catgirls take the receipts and shred them at sunrise.',
    ),
  ),
} satisfies Partial<Record<TeamId, AllianceLaterArc>>
