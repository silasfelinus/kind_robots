import { pairKey } from './roster'

// The first beat is SUPPORTS.scene. Each second beat is authored for the
// actual relationship, and unlocks only after a different campfire.
const SCENES: Array<[string, string, string]> = [
  ['brannoc', 'thessaly', 'Brannoc admits his shield arm went numb. Thessaly takes the watch instead, and he falls asleep with his head in her lap.'],
  ['quillon', 'ambrose', 'Quillon cannot hold the chalk steady enough to finish a ward. Ambrose guides his trembling hand and pretends not to notice.'],
  ['brannoc', 'torvald', 'Torvald asks why his brother gave away a ring that meant so much. Brannoc says the debt was never his alone.'],
  ['grell', 'pip', 'Pip says she remembers the caravan fire. Grell stops calling the rescue a debt and calls it what it was: choosing family.'],
  ['idris', 'corso', 'Corso asks why Idris kept the lockpick. Idris says there was never anything wrong with the thief, only what he believed about himself.'],
  ['idris', 'hesk', 'Hesk lets Idris finish the Old Rite without correction. She tells him a prayer spoken for the living need not be perfect.'],
  ['ragna', 'dagny', 'Dagny asks Ragna to sing something not about war. They make up a quiet, uneven song together. Neither knows how it ends.'],
  ['rook', 'wren', 'Wren unfolds the deed to the lost farm. She bought it back last spring. Rook takes her pencil and draws where to plant.'],
  ['moss', 'badger', 'Badger sets a second place for the brother he still hopes to find. Moss sits there, not to replace him, but so the chair is not empty.'],
  ['moss', 'calla', 'Calla changes one note and the dripping stones answer. Moss says the mountain is not healed, but at last it has begun to ask for help.'],
  ['lucan', 'hesper', 'Lucan offers to trade patron clauses for an evening. Hesper shows him how to leave a blank space in a contract. A moth rests there.'],
  ['gloam', 'hesper', 'Gloam fears the moth will follow someone brighter. Hesper reminds them it chose a place to rest, not a place to worship.'],
  ['mortimer', 'crell', 'Mortimer finally gets a crow to answer without prompting. Crell says the trick was making a promise the bird believed.'],
  ['ines', 'crell', 'Ines asks why Crell names every skeleton. Crell asks why Ines never does. They identify the dead before casting another spell.'],
  ['jory', 'delphine', 'Delphine leaves the ending of a verse open. Jory fills it without trying to win. They write a song neither can perform alone.'],
  ['jory', 'pip', 'Pip acts out Jory’s giant ballad with a cooking pot for a helmet. Jory changes the ending so the giant saves everyone without a sword.'],
  ['fen', 'pip', 'Pip admits her knuckles hurt before Fen reaches for the bandages. Fen admits worrying is not the same as being angry.'],
  ['kaz', 'dagny', 'Dagny grows a tomato seedling by the fire. Kaz shows her how to shelter it from the draft. She calls it training in patience.'],
  ['seraphine', 'marisol', 'Seraphine shows Marisol the old exam paper. Marisol folds it into a paper bird and releases it into the firelight.'],
  ['ember', 'quince', 'Ember patches their coat without using flame. Quince notices the restraint and trusts them with an untested formula.'],
  ['aldous', 'quince', 'Quince offers Aldous the first page of a shared notebook. He writes a correction, crosses it out, and adds a question instead.'],
  ['gizelle', 'nettle', 'Their new trap catches an empty bucket and wakes the party. Nettle calls it a failure. Gizelle calls it a brilliant alarm.'],
  ['gizelle', 'liesl', 'Gizelle repairs Liesl’s battered medicine case. Liesl leaves fresh bandages beside her tools without an invoice.'],
  ['tobiah', 'yarrow', 'Tobiah draws the oak as it stands today. Yarrow traces the branches and asks whether two people could sit beneath it in silence.'],
  ['lio', 'ash', 'Ash loses count of their breaths. Lio asks what they heard between the numbers. Ash says wind, and stops measuring it.'],
  ['juniper', 'lio', 'Lio agrees to a proper spar. Juniper lands a clean strike; he bows and asks her to teach him the move.'],
  ['sable', 'thessaly', 'Thessaly asks whether vows belong to orders or to the people they protect. Sable answers by taking the night watch.'],
  ['skarra', 'ash', 'Ash reads Skarra’s letter aloud, not the apology but the weather report on its back. Skarra stays to hear the reply.'],
  ['hollis', 'rook', 'Hollis deliberately sits with her back to an exit. Rook deals the cards face up. For a whole hand, neither expects a trick.'],
  ['tamsin', 'ambrose', 'Tamsin finds a route contradicting Ambrose’s footnote. He strikes out his own observation and writes her name under the correction.'],
  ['vex', 'corso', 'Vex and Corso return Liesl’s purse with interest. She counts the coins and sends them to gather herbs instead of forgiving them.'],
  ['aurel', 'idris', 'Idris asks Aurel to read the copied oath aloud. Aurel stumbles on one word and lets Idris choose the replacement: mercy.'],
  ['pelham', 'corvin', 'Corvin admits he still hears his old master’s criticism. Pelham offers to be a much louder, far less useful voice instead.'],
  ['benny', 'torvald', 'Benny sets the last of the ale aside for whoever gets home. Torvald knots a string around the cask to keep the promise.'],
  ['oona', 'benny', 'Oona teaches Benny her old tavern’s survival song. He sings it softly instead of loudly, and she joins in halfway through.'],
]

export const SUPPORT_SEQUELS: Readonly<Record<string, string>> =
  Object.fromEntries(SCENES.map(([a, b, line]) => [pairKey(a, b), line]))
