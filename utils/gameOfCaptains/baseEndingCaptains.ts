import type { CaptainId } from './rules'

/**
 * Per-captain versions of the logs no galactic family claims (Silas,
 * 2026-10-26: "adding a captain to the mix will multiply it"): the four base
 * logs any voyage can close on and the counter council's two. Each line is
 * read straight after the log's own verdict, as the earned families' lines
 * are (galacticEndings.ts), so with these all sixteen endings plus the
 * counter logs have six versions each.
 *
 * Registers follow the rewritten captains (characterDossiers.ts): Fluke the
 * stuttering, bored time traveler; Vale the genius punkette; Solace the
 * paranoid final girl promoted from janitor; Rex the bombastic wannabe hero;
 * Quill the severely gothic recycled-fluid drinker; Ro the velvet
 * horror-show host.
 */
export const UNCLAIMED_ENDINGS = [
  'CAPTAIN OF THE OPEN HORIZON',
  'THE LAST SHIP HOME',
  'THE GALACTIC BARGAIN',
  'THE COST OF COMMAND',
  'THE UNION CANCELLATION',
  'THE WITNESS COALITION',
] as const
export type UnclaimedEnding = (typeof UNCLAIMED_ENDINGS)[number]

export const UNCLAIMED_ENDING_CAPTAINS: Record<
  UnclaimedEnding,
  Record<CaptainId, string>
> = {
  'CAPTAIN OF THE OPEN HORIZON': {
    fluke:
      'Fluke checks the thirteen-handed watch and finds, for the first time, that every hand agrees. He says it is v-very boring and stays to see what happens next.',
    vale: 'Vale is offered the worlds’ thanks in the form of a licence. She frames the licence unsigned, and hangs it upside down on the backrest beside her old band’s safety certificate.',
    solace:
      'Solace counts everyone off the couch at the jump gate, twice, then a third time with the mop under one arm. All present. She puts the laminated exit map in a drawer and does not lock it.',
    rex: 'Rex arrives at the bar to find the cameras already gone. He tells the story to Vox anyway, with the wind machine switched off, and it takes four minutes instead of forty.',
    quill:
      'Quill raises his flask to the protected worlds and drinks his own good health. The crew decline a sip, as always. He notes, for the first time, that he does not mind.',
    ro: 'Ro hosts the closing ceremony with the fog machine on its lowest setting and a single organ chord. Darlings, they say, we won, and nobody had to look devastating.',
  },
  'THE LAST SHIP HOME': {
    fluke:
      'Fluke has seen a dozen grander endings than this one in other centuries and walked out of all of them. He stays for the families’ names, and repeats each one without a stutter.',
    vale: 'Vale’s jump field held together on solder, contempt and a borrowed traffic light, and it held for every one of the wounded. She files no patent. She files a list of everyone it carried.',
    solace:
      'Solace was a janitor four weeks before this. She carries the last stretcher off herself, because the last one through is the one the monster gets, and nothing gets them.',
    rex: 'Rex is called a disgrace by three treaties and a hero by nobody with a camera. A child he carried out calls him the tall one with the blanket, which he has had engraved on a seventh medal.',
    quill:
      'Quill gave the wounded the clean water from his own recycler and drank nothing for two days. He calls it a lapse in resource sovereignty. The crew call it a fever, and put him to bed.',
    ro: 'Ro reads the treaty denunciations aloud in their best late-night voice, one after another, until the rescued families are laughing. Then they read out the families’ names in a plain voice.',
  },
  'THE GALACTIC BARGAIN': {
    fluke:
      'Fluke reads the terms of the debt and recognises his own handwriting at the bottom, signed eleven years from now. He initials it again, today, so that at least the two of them agree.',
    vale: 'Vale reads the bargain like a set of terms of service and finds the loophole on page nine. She leaves it in, and tells the other side exactly where it is, because a trap is not a contract.',
    solace:
      'Solace has seen this part of the film. She reads the small print with a torch under the blanket, finds the clause where the deal eats someone, and has it struck before she signs.',
    rex: 'Rex shakes the enemy’s hand for the cameras and then asks the cameras to leave. The handshake is a little longer after that, and a little more honest, and nobody photographs it.',
    quill:
      'Quill signs the bargain in a black glove and asks for a copy of every clause about bodies. There are four. He reads each one twice and adds a mourning veil to his collection for the fifth.',
    ro: 'Ro once ended a war with forged credentials and a coronation. This time the credentials are real and the bargain is worse, and they say, in a small voice, that they preferred the forgery.',
  },
  'THE COST OF COMMAND': {
    fluke:
      'Fluke always knew this was how it ended, and was bored by it in advance. Losing in the present is new. He finds it, against every expectation, interesting, and writes the warning in pencil.',
    vale: 'Vale’s gambit fails at the hardware level, which she has always said is the honest level. Her warning to the next captain is a wiring diagram with every mistake circled in red.',
    solace:
      'Solace’s premonitions were right and she acted on the wrong one. She writes the warning herself, plainly, on the back of the laminated map: trust the crew sooner. They stayed.',
    rex: 'Rex finally gets the heroic last stand he rehearsed, and nobody is watching it but the crew, who stay. He does not give the speech. He writes the warning instead, and it is short.',
    quill:
      'Quill seals the written warning in his biosuit’s specimen pouch, where it will keep forever at body temperature. He suspects the next captain will not want it there, and moves it to the armrest.',
    ro: 'Ro dims the lights on their own failure with impeccable timing. Then they turn them back up, because the crew is still here, and hand the next captain the warning and the fog machine.',
  },
  'THE UNION CANCELLATION': {
    fluke:
      'Fluke has watched every season of the Showrunner’s programme from the future, and was b-bored by all of them. The cancellation is the first episode he has not already seen.',
    vale: 'Vale wires the crew’s evidence straight into the Showrunner’s broadcast desk with a karaoke cable. The union votes the show off the air while the show is still on it.',
    solace:
      'Solace knows this kind of programme: the cleaner always dies first. She sits in the front row of the union vote with her mop across her knees and watches the credits roll, alive.',
    rex: 'Rex was promised a starring role in the Showrunner’s finale. He gives the role to the stagehands, who vote, and is listed in the closing credits under crowd, which he says is fair.',
    quill:
      'Quill asks the union to confirm that every performer’s body belonged to themselves under the old contracts. It did not. He reads the new contract three times and finds that it does.',
    ro: 'Ro has hosted a hundred late-night horror shows and never once been cancelled. They watch this one end from the wings, applaud the union, and borrow the Showrunner’s organ for the wrap party.',
  },
  'THE WITNESS COALITION': {
    fluke:
      'Fluke is asked by the coalition to testify about what will happen. He declines. He testifies about what did, in the present tense, stuttering only on the names, and the coalition writes them down.',
    vale: 'Vale gives evidence with her hair crackling and her hands steady. She tells the coalition how every machine on the couch was built, and lets them decide whether she was right to.',
    solace:
      'Solace has survived eleven disasters by never investigating anything alone. Here nobody does. She counts the witnesses, all of them, and is quietly astonished at how many of them came back.',
    rex: 'Rex is called as a witness and does not mention himself once. The coalition’s clerk, who has read his file, checks twice that it is the same man.',
    quill:
      'Quill presents his evidence in sealed jars, each labelled with the name of whoever it came from and their written consent. The coalition says it is the most ethical exhibit table it has ever seen.',
    ro: 'Ro opens the coalition’s hearing with an organ chord and the words dearly doomed, out of habit. Then they sit down in the gallery, take off the crown, and let the witnesses speak.',
  },
}
