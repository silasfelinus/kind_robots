import type { TeamId } from './prototypes'

export interface CampaignChoiceConsequence {
  victory: string
  defeat: string
}

export type ChapterChoiceConsequences = {
  conviction: CampaignChoiceConsequence
  cunning: CampaignChoiceConsequence
}

// Five chapters per crew, each with distinct win and loss epilogues for BOTH approaches.
// This is authored narrative, not dynamic AI text or a replacement for gameplay outcomes.
export const CAMPAIGN_CHOICE_CONSEQUENCES: Record<
  TeamId,
  readonly ChapterChoiceConsequences[]
> = {
  catgirls: [
    {
      conviction: {
        victory:
          'Calico Nine gives every resident the footage of their own door. The safehouses choose which cameras to dismantle, and the spies lose their favorite bargaining chip.',
        defeat:
          'The originals reach the safehouses, but the raid strikes before the neighborhood can hide them. Nine has to carry the last surviving negatives herself.',
      },
      cunning: {
        victory:
          'Nine floods the spy network with footage of empty kennels and false alleys. Three laboratories expose their locations while chasing the decoys.',
        defeat:
          'Undertow detects the fake reel and traces the signal back to the clinic. The residents escape, leaving behind their entire medicine cabinet.',
      },
    },
    {
      conviction: {
        victory:
          "Rivet's workers stamp the patent VOID with a red-hot press, then vote to keep the body mold under community medical control.",
        defeat:
          'The patent burns, but the engineer locks the mold in an armored furnace. Nine escapes with the workers and a list of the people still inside.',
      },
      cunning: {
        victory:
          'Nine slips through the coolant duct and steals the body mold before the auction bell. The clinic can now print replacement organs without asking permission.',
        defeat:
          'The stolen mold jams in the duct and its coolant floods the forge. Nine saves the trapped patient, but the buyers leave with the blueprints.',
      },
    },
    {
      conviction: {
        victory:
          'Nine redirects the march into a moving evacuation corridor. When the fireworks finally burst, the gene-bank doors stand open and the crowd is safely elsewhere.',
        defeat:
          'The evacuation works, but security seals the laboratory with the prisoners still inside. The Saints promise to return with a quieter plan.',
      },
      cunning: {
        victory:
          'Nine re-aims the shaped charge through the vacant armored gate. The blast opens a route for the prisoners while the papier-mâché mascot survives triumphantly.',
        defeat:
          'The gate holds and the mascot catches fire. Nine pulls the marchers away while guards tow the parade float into the impound lot.',
      },
    },
    {
      conviction: {
        victory:
          "Nine preserves the bloodfairies' testimony without bargaining away their histories. The witnesses build a tiny courtroom on the clinic roof.",
        defeat:
          'The original contracts remain intact, but the Exchange threatens each witness separately. Nine gets them out of the court building before anyone is detained.',
      },
      cunning: {
        victory:
          'Nine trades duplicate contracts for a rooftop escort and records every transaction. The swarm carries the evidence to a dozen independent lawyers.',
        defeat:
          'The escort is scattered in an ambush and the duplicate testimony is discredited. Nine still saves the surviving witnesses and their records.',
      },
    },
    {
      conviction: {
        victory:
          'Nine exposes the bidders on a giant public projection. The crowd tears up the auction catalogs, and the newborn-name ledger becomes testimony against its sellers.',
        defeat:
          'The buyers flee through private tunnels, taking the final ledger page. Nine keeps their faces on the public record and starts following the money.',
      },
      cunning: {
        victory:
          "Nine takes the auctioneer's master key and opens the archive to its owners. Families reclaim their own birth records before the Exchange can lock the vault.",
        defeat:
          'The key opens the decoy vault. Nine escapes the auction with a scrap of evidence and a list of names still held hostage.',
      },
    },
  ],
  bloodfairies: [
    {
      conviction: {
        victory:
          'Thimble turns the demolition contest into a rescue concert, making the wrecking ball a stage and the threatened music hall an evacuation hub.',
        defeat:
          "The band keeps the audience safe, but the Saints knock the hall's roof loose. Thimble books the next concert in the street.",
      },
      cunning: {
        victory:
          "Thimble rewires the Saints' charges into a perfectly timed finale, sending sparks skyward while the occupied hall stands.",
        defeat:
          'The charge timer outruns the last chorus. Thimble gets everyone out, but the stage and the amplifiers become scrap.',
      },
    },
    {
      conviction: {
        victory:
          'Thimble brings the clone nurses into an open strike, and the clinic becomes a shared shelter where fairies are patients rather than specimens.',
        defeat:
          'The nurses win time for an evacuation, but the technicians carry the dissection logs underground. Thimble memorizes the route.',
      },
      cunning: {
        victory:
          'Thimble snatches the tissue database during the noise and publishes the names of the missing patients to the rooftop network.',
        defeat:
          'The database is a honeypot full of fake names. Thimble escapes with one genuine patient file and a very angry security drone.',
      },
    },
    {
      conviction: {
        victory:
          'Thimble broadcasts a choir of every voice the city tried to erase. The wings lift again as residents sing the frequency out of phase.',
        defeat:
          'The choir keeps the youngest flyers grounded safely, but the anti-wing signal spreads to the market. Thimble promises another verse.',
      },
      cunning: {
        victory:
          'Thimble cuts the sewer transmitter from its power source, freeing the roofs in one glorious burst of amplifier feedback.',
        defeat:
          'The backup transmitter turns on under the drains. Thimble destroys the first machine but loses the rooftop advantage until dawn.',
      },
    },
    {
      conviction: {
        victory:
          'The ogre workers and fairies march together across the bridge, refusing to collect a toll from anybody who needs to cross.',
        defeat:
          'The picket holds until security brings in a second crew. Thimble organizes food and shelter for the stranded walkers.',
      },
      cunning: {
        victory:
          'Thimble cuts the toll gates loose and turns them into public ramps, giving tiny flyers and heavy ogres equal access.',
        defeat:
          'The gates fall onto the empty service road and block the supply line. Thimble gets the workers out before the company can blame them.',
      },
    },
    {
      conviction: {
        victory:
          'Thimble persuades tenants to form a rooftop cooperative with one vote per home, not per wing or bank account. The moonlight remains common property.',
        defeat:
          'The landlords refuse to recognize the new cooperative. Thimble saves its membership rolls and prepares a citywide appeal.',
      },
      cunning: {
        victory:
          'Thimble forges a deed making every star a public tenant. The ridiculous document survives court because the Exchange used the same loophole first.',
        defeat:
          'The forged deed is spotted by a clerk who hates poetry. Thimble flees with the land registry stamp and a fresh list of allies.',
      },
    },
  ],
  ironjaw: [
    {
      conviction: {
        victory:
          'Rivet puts a ring of workers around the striking assembly. The paymaster has to hear every demand while the company-store coupons burn in a soup pot.',
        defeat:
          'The assembly stays together, but the oxygen tanks leave under guard. Rivet opens the emergency reserve for the night shift.',
      },
      cunning: {
        victory:
          'Rivet intercepts the payroll wagon and swaps its tokens for real wages, delivering the ledger to the workers who earned them.',
        defeat:
          "The wagon slips through a service tunnel. Rivet saves the injured drivers and finds the tunnel's maintenance schematics.",
      },
    },
    {
      conviction: {
        victory:
          'Rivet gives each ogre an individual copy of their stolen work records. The resulting queue of witnesses is longer than the foundry itself.',
        defeat:
          'The records reveal the fraud, but the foreman cuts power to the printers. Rivet preserves the first few signed pages.',
      },
      cunning: {
        victory:
          'Rivet resets the rigged shift clock and triggers a mandatory audit across every forge in the district.',
        defeat:
          "The audit signal is jammed from the drains. Rivet salvages the clock's memory chip and sends a runner to the city clerk.",
      },
    },
    {
      conviction: {
        victory:
          'Rivet secures the emergency furnace controls before the Saints set off their celebration charge. The workers keep their jobs and the old locks come off.',
        defeat:
          'The controls are safe, but the office blast seals the loading door. Rivet cuts a ventilation route for the trapped crew.',
      },
      cunning: {
        victory:
          'Rivet blows through the locked blast doors with a precisely measured charge. Even the Saints applaud the engineering.',
        defeat:
          'The doors deform instead of opening. Rivet orders a retreat and sketches a safer demolition plan on the back of a shift roster.',
      },
    },
    {
      conviction: {
        victory:
          'Rivet invites clone engineers onto the foundry council. Their designs become common property, with every patient retaining control over their own body.',
        defeat:
          'The council votes, but the patent office intervenes before the schematics can be distributed. Rivet hides the original in a furnace brick.',
      },
      cunning: {
        victory:
          'Rivet steals the prototype scanner and duplicates the design for every worker clinic in the district.',
        defeat:
          'The scanner burns out mid-scan. Rivet rescues its living test subject and brings back half a blueprint.',
      },
    },
    {
      conviction: {
        victory:
          'Rivet includes the smallest workers in the union vote. The factory restarts to the beat of fairy wings and ogre hammers working together.',
        defeat:
          'The union holds a fair vote, but management cuts the furnace fuel. Rivet opens the solidarity kitchen while negotiations continue.',
      },
      cunning: {
        victory:
          'Rivet retakes the generator and uses its power to keep the occupied foundry running without the owners.',
        defeat:
          'The generator kicks back and floods the line with sparks. Rivet shields the workers, preserving the machines for another attempt.',
      },
    },
  ],
  riot: [
    {
      conviction: {
        victory:
          'Kaboom invites the welders to build a parade stage from their own scrap, with a safety marshal elected by the whole block.',
        defeat:
          "The welders refuse the boss's confiscation order but cannot stop the tow truck. Kaboom drafts a parade route around the impound yard.",
      },
      cunning: {
        victory:
          'Kaboom sneaks a crew into the depot and retrieves the stage with a glorious paint-bomb diversion.',
        defeat:
          'The guards seize the disguised float. Kaboom escapes with the festival lighting rig and a list of sympathetic welders.',
      },
    },
    {
      conviction: {
        victory:
          "Kaboom brings debtors together to cancel the fireworks contract in public, turning the bank's ledger into the first parade confetti.",
        defeat:
          'The contract survives on a technicality. Kaboom keeps the borrowers together long enough to arrange a legal challenge.',
      },
      cunning: {
        victory:
          'Kaboom rigs the empty bank vault to burst with harmless confetti, revealing its hidden interest clauses to every creditor in Crown Market.',
        defeat:
          'The vault holds and the smoke alarm summons guards. Kaboom flees with a copy of the contract and a pocketful of confetti.',
      },
    },
    {
      conviction: {
        victory:
          'Kaboom gives both bands equal stage time, then books an encore that makes the rival audiences sing together.',
        defeat:
          'The set list is agreed, but a sabotaged mixer kills the show. Kaboom and Thimble save the audience and promise a rematch.',
      },
      cunning: {
        victory:
          'Kaboom challenges Thimble to a battle of amplifiers, then converts the duel into a joint wall-shaking rooftop concert.',
        defeat:
          'The speakers blow before the finale. Kaboom drags the ruined amplifiers offstage while the audience finishes the tune unamplified.',
      },
    },
    {
      conviction: {
        victory:
          'Kaboom warns every marching crew about the ambush. The parade reroutes around the cordon, collecting the spies as very embarrassed volunteers.',
        defeat:
          'The warning reaches most crews, but the back float enters the cordon. Kaboom turns the barricade into an improvised rescue stage.',
      },
      cunning: {
        victory:
          'Kaboom floods the spy network with absurd fake routes, causing the police to blockade their own headquarters while the real parade escapes.',
        defeat:
          'Undertow recognizes the fakes and captures the decoy floats. Kaboom gets the marchers to safety on foot.',
      },
    },
    {
      conviction: {
        victory:
          'Kaboom moves the grand finale away from the clinic, turning the entire festival into a jubilant evacuation escort for the escaped clones.',
        defeat:
          'The crowd clears the clinic, but the storm dampens the fireworks. Kaboom gives the rescued patients the first microphones instead.',
      },
      cunning: {
        victory:
          'Kaboom redirects the planned blast above the empty corporate tower, broadcasting a giant red flare that marks the rescue corridor.',
        defeat:
          "The launch misfires into the tower's armored rooftop. Kaboom cancels the show and helps the clinic staff carry everyone to shelter.",
      },
    },
  ],
  undertow: [
    {
      conviction: {
        victory:
          'The Oracle escorts the technician through the tunnels with a chain of trusted witnesses. Her testimony survives because nobody holds it alone.',
        defeat:
          'The witness reaches the safehouse but the evidence capsule is seized. The Oracle records her account by hand and plans the appeal.',
      },
      cunning: {
        victory:
          "The Oracle clones the evidence into dozens of anonymous drain monitors, keeping the technician's identity out of the broadcast.",
        defeat:
          'A trace flag in the copied file alerts the Exchange. The Oracle hides the witness before the agents arrive.',
      },
    },
    {
      conviction: {
        victory:
          'The Oracle invites the fairies to hear the unedited recordings. They transform the gossip network into a public hearing with accountable witnesses.',
        defeat:
          'The fairies want proof but the master recording has been swapped. The Oracle promises to find who altered the signal.',
      },
      cunning: {
        victory:
          'The Oracle scrambles the rooftop transmitters and replaces the stolen audio with a message explaining how to check a source.',
        defeat:
          'The scramble silences legitimate broadcasts as well. The Oracle restores emergency frequencies before attempting the sabotage again.',
      },
    },
    {
      conviction: {
        victory:
          'The Oracle tells every resident exactly which private conversations were auctioned. The buyers cannot hide behind anonymous contracts anymore.',
        defeat:
          'The revelations arrive too late for several households. The Oracle helps them reclaim the recording rights and identify the brokers.',
      },
      cunning: {
        victory:
          "The Oracle steals the sale ledger and replaces it with a list of every buyer's own embarrassing secrets, ending the auction.",
        defeat:
          'Security captures the decoy ledger. The Oracle escapes with partial records and the name of the next purchaser.',
      },
    },
    {
      conviction: {
        victory:
          'The Oracle gives workers manual switches for their helmet receivers. They choose their own orders for the first time in six years.',
        defeat:
          'Only the first row of helmets can be rewired before security arrives. The Oracle leaves the blueprints with Rivet.',
      },
      cunning: {
        victory:
          "The Oracle reverses the remote command onto the foreman's own control helmet, stopping the forced march immediately.",
        defeat:
          'The foreman pulls the emergency fuse and the control signal goes dark. The Oracle loses the confrontation but learns the override code.',
      },
    },
    {
      conviction: {
        victory:
          'The Oracle broadcasts the raw proof, leaving listeners free to judge the lie and reject the stolen voice on their own terms.',
        defeat:
          'The false Oracle drowns out the proof before enough listeners hear it. The real Oracle keeps a recording for the next transmission.',
      },
      cunning: {
        victory:
          'The Oracle hijacks the final signal with a perfect false-voice imitation that tricks the impostor into confessing live.',
        defeat:
          'The impostor anticipates the forgery and loops it back to the listeners. The Oracle kills the transmission rather than spread another lie.',
      },
    },
  ],
  exchange: [
    {
      conviction: {
        victory:
          'Gilt tears up the medical debt ledger in the square, making the public write-off impossible for the Exchange board to quietly reverse.',
        defeat:
          'The board blocks the write-off, but the neighborhood sees the original figures. Gilt keeps the page with the forged signatures.',
      },
      cunning: {
        victory:
          'Gilt insures the next demolition and uses the payout to buy control of the bank, then cancels the debt herself.',
        defeat:
          'The insurers find the staged damage and freeze the account. Gilt protects the debtors by surrendering the crooked policy.',
      },
    },
    {
      conviction: {
        victory:
          'Gilt transfers controlling factory shares directly to the workers. Even the payroll machines must now ask the shift council for permission.',
        defeat:
          'The shareholders reject the transfer and try to close the plant. Gilt calls their bluff by disclosing the profit books.',
      },
      cunning: {
        victory:
          "Gilt buys the foreman's master switch and uses it to halt production until the board renegotiates with the workers.",
        defeat:
          'The master switch has been duplicated. Gilt pays the workers to walk out rather than watch the machines run without them.',
      },
    },
    {
      conviction: {
        victory:
          'Gilt publishes the forged contracts in court, forcing the Exchange to compensate the neighborhoods it swindled.',
        defeat:
          'The judge postpones the hearing and the originals disappear. Gilt leaves copies with every affected household.',
      },
      cunning: {
        victory:
          'Gilt buys the archive and locks the forged contracts away from predatory bidders, at the cost of holding a dangerous secret herself.',
        defeat:
          'The archive has already been copied. Gilt discovers that secrecy cannot be purchased by the page.',
      },
    },
    {
      conviction: {
        victory:
          'Gilt publicly voids every genetic ownership clause, restoring names and rights to the escaped clones without demanding gratitude.',
        defeat:
          'The registry refuses to honor the ruling until a higher court intervenes. Gilt pays for the appeal without taking a lien.',
      },
      cunning: {
        victory:
          'Gilt takes the laboratory as collateral and converts it into a worker-governed clinic in a single ruthless board vote.',
        defeat:
          "The board keeps control of the lab's medical patents. Gilt walks out with the patients and none of the balance-sheet trophies.",
      },
    },
    {
      conviction: {
        victory:
          "Gilt hands the Exchange's final charter to a vote of the debtors. They dissolve the old corporation and build a cooperative market in its shell.",
        defeat:
          'The vote is challenged and the gold seal disappears. Gilt keeps the ballots intact until a new vote can be held.',
      },
      cunning: {
        victory:
          "Gilt repossesses the rooftops, then declares them a tax-free public trust, turning the Exchange's favorite weapon against itself.",
        defeat:
          'The fairies seize the title office before Gilt can finish the transfer. She escapes with a single signed deed and a new plan.',
      },
    },
  ],
}
