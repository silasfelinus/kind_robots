import type { TeamId } from './prototypes'
import {
  arc,
  beat,
  end,
  type AllianceLaterArc,
} from './campaignAllianceArcTypes'

export const riotAllianceArcs = {
  catgirls: arc(
    [
      beat(
        'The lab plants an undercover geneticist in the front row to identify the escape artists.',
        'Keep the fugitives in the backstage crew',
        'The audience watches a real vanishing act while the fugitives roll the scenery away.',
        'Make the geneticist volunteer onstage',
        'The scientist gets tested by his own scanner in front of a delighted crowd.',
      ),
      beat(
        'A catgirl performer insists the rescue show should tell the truth rather than use disguises.',
        'Let her choose when to speak',
        'She interrupts the script on her own terms and the cast follows her lead.',
        'Turn the laboratory files into shadow puppets',
        'The evidence dances across the screen while the hunters chase a fictional villain.',
      ),
      beat(
        'An old mentor of the escapees is held in a cage beneath the hydraulic stage.',
        'Stop the machinery to free them',
        'The final act begins late, but its rescued guest takes the first bow.',
        'Lift the cage into the spotlight',
        'The hunters must explain their captive to a crowd recording every word.',
      ),
      beat(
        'Anarkiss’s biggest sponsor demands that the final trapdoor be locked permanently.',
        'Leave the exit open for the survivors',
        'The troupe rejects the sponsor and opens the trapdoor as a public escape route.',
        'Make the sponsor disappear instead',
        'The sponsor reappears in the courthouse with all the lab contracts in hand.',
      ),
    ],
    end(
      'EVERY ESCAPE ACT NEEDS AN EXIT',
      'The theatre becomes a safe route for escaped catgirls. Its best trick is no trick at all: everyone walks out alive.',
      'The finale ends with the lab owners inside their own transport crates. The audience asks for an encore, but the escapees vote to go home.',
    ),
  ),
  bloodfairies: arc(
    [
      beat(
        'A borrowed Bloodfairy amplifier begins whispering the troupe’s hidden rehearsal cues to the city inspectors.',
        'Rewire the cue line before doors',
        'The cast performs without betrayal, and the fans hear only the song they came for.',
        'Feed the inspectors absurd fake stage directions',
        'The inspection team spends the show searching for a nonexistent rhinoceros.',
      ),
      beat(
        'A rival act offers Anarkiss a solo headline slot if it drops the Bloodfairies from the bill.',
        'Keep the joint billing',
        'The poster prints both crews in the same typeface and the fans stop arguing about who opened.',
        'Book the rival as an unpaid soundcheck',
        'The rival sings for an empty hall while the real audience waits at the correct door.',
      ),
      beat(
        'The final dress rehearsal reveals the band’s roadie trapped inside a rigged fireworks cabinet.',
        'Disarm the cabinet and pull them clear',
        'The roadie returns to the mixing desk with all their fingers and a new verse.',
        'Turn the saboteur’s fuse against the lights',
        'A flash exposes the person who wired the cabinet from the balcony.',
      ),
      beat(
        'The city cancels the midnight concert and replaces the venue with a silent civic awards ceremony.',
        'Hold a quiet street performance',
        'The troupe and band play without amplification, and the fans turn the sidewalks into seats.',
        'Steal the award-show broadcast',
        'The mayor accidentally introduces a Bloodfairy encore as the grand prize.',
      ),
    ],
    end(
      'THE DOUBLE BILL THAT WOULD NOT DIE',
      'The two crews agree that nobody owns the marquee. They keep the venue, split the receipts, and write a safety plan worth rehearsing.',
      'The cancelled show becomes the city’s most-watched broadcast. The troupe steals the spotlight but makes room for the band’s final chorus.',
    ),
  ),
  ironjaw: arc(
    [
      beat(
        'The lizard dancers miss rehearsal when the venue’s floor heating is sold for scrap.',
        'Find blankets and warm the floor',
        'The cast adjusts the choreography while Ironjaw restores the heaters without charging the dancers.',
        'Install the stolen heating under the mayor’s seat',
        'The mayor’s podium steams through the inspection while the cast warms the stage.',
      ),
      beat(
        'The foundry foreman offers Anarkiss a sponsorship if the workers will perform as comic monsters.',
        'Let the workers write their own roles',
        'The stage features a union leader instead of a villain, and the crowd cheers the change.',
        'Expose the sponsorship contract in the show',
        'The foreman hears his price for the workers’ dignity recited in the villain’s monologue.',
      ),
      beat(
        'A giant papier-mâché dragon falls toward the warm nursery during the third act.',
        'Clear the nursery before restarting',
        'The puppeteers rebuild the dragon in sections as every hatchling sleeps safely elsewhere.',
        'Use the collapsing dragon to trap security',
        'The guards stumble out beneath a shower of harmless painted scales.',
      ),
      beat(
        'The city demands that the final parade end at the foundry gate, with the workers locked behind it.',
        'Open the gate and share the parade',
        'The lizard crew joins the cast, and the procession becomes a workers’ festival.',
        'Turn the gate itself into a stage prop',
        'The locked gate rolls away on hidden wheels while management argues with an empty doorway.',
      ),
    ],
    end(
      'THE SHOW WITH A WARM FLOOR',
      'The new theatre has heat, free exits, and a union backstage. Anarkiss calls its best production the one where no worker had to play a monster.',
      'The foundry gate vanishes during curtain call. The crowd finds a union hall on the other side and refuses to applaud the owners.',
    ),
  ),
  undertow: arc(
    [
      beat(
        'The underground stage shares a wall with a listening station that can hear every line of rehearsal.',
        'Perform with written cues until the relay moves',
        'The troupe rehearses in whispers and the Oracle shifts the vulnerable equipment.',
        'Perform a decoy script for the listeners',
        'The police raid a fake alien invasion while the real audience enters through the drains.',
      ),
      beat(
        'A beloved stagehand is discovered to be transmitting nightly set changes to the authorities.',
        'Ask the stagehand who threatened them',
        'The crew finds the pressure point and protects the stagehand’s family.',
        'Turn the transmitter into an open microphone',
        'The officer demanding information accidentally confesses over the theatre speakers.',
      ),
      beat(
        'Anarkiss plans a flood-lit finale under the storm gate, but the water level is rising.',
        'Raise the stage and warn the neighbors',
        'The show moves above the waterline while the Oracle keeps the drains clear.',
        'Use the surge to carry a false police barge',
        'A painted vessel sails past the guards while the real crew exits on foot.',
      ),
      beat(
        'The final pirate broadcast can hide the troupe but would also silence the district’s emergency calls.',
        'Keep the emergency channel alive',
        'The troupe speaks between warning signals and the district learns where to take shelter.',
        'Broadcast the inspectors’ secret rehearsal',
        'The entire city hears the authorities planning a fake raid and cancels their applause.',
      ),
    ],
    end(
      'THE STAGE BELOW THE STORM',
      'The relay and theatre share a permanent home, with an emergency channel louder than any applause. The troupe leaves its doors unlocked.',
      'The inspectors’ own voices announce the rebellion. The Oracle gets a working network, and the troupe gets a standing ovation from the tunnels.',
    ),
  ),
  exchange: arc(
    [
      beat(
        'A cursed sponsor buys the front row and insists every ticket holder sign a blood-red receipt.',
        'Refund the cursed seats',
        'The audience trades its receipts for real tickets, and the sponsor sits alone.',
        'Seat the debt collectors in their own trap',
        'The collectors discover the receipts have charged them for watching the show.',
      ),
      beat(
        'The troupe’s new stage contract demands one performer’s shadow as payment for the lights.',
        'Perform in daylight until the clause is removed',
        'The cast rejects the lights and keeps everyone’s shadow attached.',
        'Sell the sponsor a cardboard silhouette',
        'The occult collector pays premium Meat for a shape with no owner.',
      ),
      beat(
        'The auctioneer schedules a live sale of the audience during the intermission.',
        'Escort everyone through the emergency exit',
        'No one gets counted as merchandise, and the auction hall empties without a bid.',
        'Replace the lot numbers with the bidders’ names',
        'The auctioneer calls the collectors themselves to the podium.',
      ),
      beat(
        'At the finale, the curtain rises on a ledger that lists every future spectator as a debtor.',
        'Burn the ledger with the house lights on',
        'The audience watches the last claim dissolve in a furnace made from old props.',
        'Write the auctioneer into the final scene',
        'The ledger closes around its owner while the crowd exits free.',
      ),
    ],
    end(
      'THE CURTAIN CALL FOR A CREDITOR',
      'Anarkiss keeps the show and the people who paid to see it. The sponsor’s name appears only in a warning above the ticket window.',
      'The auctioneer bids on his own silhouette and loses. The troupe leaves with the crowd, while the stage lights finally go dark.',
    ),
  ),
} satisfies Partial<Record<TeamId, AllianceLaterArc>>
