import type { TeamId } from './prototypes'
import {
  arc,
  beat,
  end,
  type AllianceLaterArc,
} from './campaignAllianceArcTypes'

export const exchangeAllianceArcs = {
  catgirls: arc(
    [
      beat(
        'The first clone’s signature has begun appearing on debts signed centuries before she existed.',
        'Give her the right to reject the document',
        'Her own handwriting appears in the ledger only after she chooses what to sign.',
        'Sell the impossible signature to the auditors',
        'The auditors buy a paradox that makes their entire archive legally worthless.',
      ),
      beat(
        'The underworld notary proposes dividing the clones into shares of one original person.',
        'Record each clone as a separate individual',
        'The notary reluctantly issues names instead of fractions and the copies walk away.',
        'Assign the notary as the final fractional share',
        'The ancient clerk discovers he owns a tiny slice of every debt he ever imposed.',
      ),
      beat(
        'A collector kidnaps the oldest clone to authenticate all the other signatures.',
        'Rescue her without another bargain',
        'The oldest clone walks out with the others and tears up the seal herself.',
        'Swap her for the collector’s own double',
        'The collector must prove he is real while his duplicate sells his office.',
      ),
      beat(
        'The last contract would let the Exchange own every future clone before birth.',
        'End the contract in open court',
        'The agreement is declared void, and the freed clones write their own family registry.',
        'Make the future-ownership clause eat itself',
        'The ledger tries to claim its own unwritten pages and disappears into its binding.',
      ),
    ],
    end(
      'THE NAMES THAT WOULD NOT DIVIDE',
      'The Exchange leaves the clones off its property rolls. The first free signature is a personal letter, not another receipt.',
      'The final owner of the clones turns out to be the contract itself. The book closes, and every copied person gets to start an unwritten life.',
    ),
  ),
  bloodfairies: arc(
    [
      beat(
        'The cursed record begins playing the names of concertgoers who have not yet bought tickets.',
        'Hide the record until the venue is safe',
        'The band performs live while the cursed disc stays locked in a soundproof case.',
        'Sell a counterfeit pressing to the collectors',
        'The buyers pay in Meat for a record that plays their own names on repeat.',
      ),
      beat(
        'The bass player’s heartbeat starts matching a rhythm written in the ancient debt ledger.',
        'Break the rhythm and protect the musician',
        'The drummer changes the time signature and the bassist’s pulse returns to normal.',
        'Force the collector to follow the beat',
        'The debt clerk must dance to a song that counts every payment he stole.',
      ),
      beat(
        'An occult patron offers to buy the band’s final encore before it has been written.',
        'Let the band own the unfinished song',
        'The musicians destroy the pre-sale and write the refrain together that night.',
        'Write a cursed chorus for the patron',
        'The collector sings his own outstanding debts and loses his voice at the auction.',
      ),
      beat(
        'The last concert takes place on an altar made from unpaid contracts.',
        'Dismantle the altar before the show',
        'The audience gets a safer floor and the spirits tied to the paper finally rest.',
        'Amplify the altar’s debt-chime',
        'Every unpaid creditor hears the note and abandons the hall before the last chord.',
      ),
    ],
    end(
      'THE RECORD THAT OWNS ITS SONG',
      'The musicians take their masters home. The Exchange’s oldest pressing contains silence, and the spirits trapped in its grooves are free.',
      'The album closes with a creditor naming himself as the final debtor. The band sells the record for ordinary Meat, no souls included.',
    ),
  ),
  ironjaw: arc(
    [
      beat(
        'A furnace bill arrives addressed to lizards who have not hatched yet.',
        'Cancel the unborn workers’ accounts',
        'The ledger keeper releases the ink before the hatchlings learn to read.',
        'Sell the debts back to the original investors',
        'The investors discover their grandchildren owe interest to a stove they financed.',
      ),
      beat(
        'The Exchange’s heat vault opens only when an Ironjaw worker gives up a memory of home.',
        'Find a different way to heat the nursery',
        'The workers repair a broken boiler and keep every memory inside their own heads.',
        'Feed the vault the investor’s memories instead',
        'The vault opens on a lifetime of secret bargains and spits out a heat key.',
      ),
      beat(
        'The foundry reveals a furnace that burns contracts and exhales human voices.',
        'Free the voices before using the fire',
        'The workers wait until each trapped name has been spoken and released.',
        'Burn the owners’ original title deeds',
        'The furnace coughs out their signatures and refuses to heat the management offices.',
      ),
      beat(
        'The investor from below demands one last living worker as payment for the union’s warmth.',
        'Refuse the living tithe',
        'The union shuts the vault and opens the foundry to anyone needing shelter.',
        'Offer the creditor its own ledger as fuel',
        'The furnace burns the collector’s claim and leaves the workers warm.',
      ),
    ],
    end(
      'THE FURNACE THAT LEARNED TO SAY NO',
      'The new contract sets a price of zero for every worker’s pulse and body heat. Ironjaw keeps the furnace, and no future hatchling owes a tithe.',
      'The creditors lose the forge when its oldest contract burns itself. The remaining heat belongs to the people who kept it alive.',
    ),
  ),
  riot: arc(
    [
      beat(
        'The auction hall issues tickets that require spectators to pledge a memory before sitting down.',
        'Return the memories at the door',
        'The audience recovers the pieces of itself that the ticket clerk stole.',
        'Auction the clerk’s hidden memories instead',
        'The clerk flees when the bidding reveals all the secrets behind his mask.',
      ),
      beat(
        'Anarkiss finds its understudy named as the next lot in a sealed programme.',
        'Remove the understudy from the sale',
        'The troupe walks out with a living performer, not a ticket number.',
        'Switch the lot number to the auctioneer',
        'The auctioneer discovers his own photograph beneath the red velvet cloth.',
      ),
      beat(
        'The auction stage is built over a vault containing every spectator’s shadow.',
        'Open the vault and return the shadows',
        'Each spectator leaves with the shape that had followed them all their lives.',
        'Turn the spotlight on the hidden buyer',
        'The collector’s impossible shadow stretches across the screen for all to see.',
      ),
      beat(
        'The final curtain is rigged to turn applause into an irreversible contract.',
        'End the show with silence',
        'The troupe takes a bow without trapping anyone in an unwanted bargain.',
        'Make the collector clap alone',
        'His solitary applause signs away his own auction hall to the actors.',
      ),
    ],
    end(
      'THE AUDIENCE OWNS THE LAST BOW',
      'The troupe takes the stage without selling its spectators. The Exchange locks its cursed ticket booth and keeps the refund line open.',
      'The last bid is the collector’s own applause. Anarkiss inherits the auction hall and turns it into a theatre with a proper exit.',
    ),
  ),
  undertow: arc(
    [
      beat(
        'The Exchange’s secret ledger begins writing the Oracle’s friends into debts that have not happened.',
        'Warn the friends and protect their names',
        'The prophecy loses its grip when the witnesses refuse to sign.',
        'Place the creditor’s name on the futures list',
        'The collector reads the next debt aloud and realizes it is his own.',
      ),
      beat(
        'A forgotten vault under the sewer contains the original price paid for the city’s secrets.',
        'Return the records to their owners',
        'Witnesses decide what to keep and what to burn; the Oracle does not claim the archive.',
        'Auction a forged copy of the archive',
        'Collectors pay for an empty vault while the real records leave through the drains.',
      ),
      beat(
        'The Oracle is offered immortality in return for naming one protected informant.',
        'Refuse the bargain on the informant’s behalf',
        'The ancient creditor learns that a living person is not a line item.',
        'Give the creditor a false informant',
        'The collector pursues the name of his own childhood alias and leaves the real witness untouched.',
      ),
      beat(
        'The last debt collection is set to erase every unbought secret from human memory.',
        'Open a free public archive',
        'People choose which memories belong in the archive and which must stay private.',
        'Make the creditor remember every lie',
        'The ancient collector cannot finish the incantation under the weight of his own false accounts.',
      ),
    ],
    end(
      'THE DEBT THAT WOULD NOT REMEMBER',
      'The Exchange gives up its claims to the Oracle’s witnesses. The new archive keeps truth without assigning it a price.',
      'The collector’s false ledgers collapse under their own contradictions. Undertow keeps the evidence, while the cursed vault forgets the names.',
    ),
  ),
} satisfies Partial<Record<TeamId, AllianceLaterArc>>
