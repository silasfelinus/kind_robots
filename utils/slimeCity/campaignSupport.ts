import type { TeamId } from './prototypes'
import type { BoutTerms } from './city'
import type { CampaignApproach } from './campaign'

export interface ChapterSupport {
  title: string
  story: string
  terms: BoutTerms
}

type ChapterSupportPair = Record<CampaignApproach, ChapterSupport>

/**
 * Authored single-use selection, not a consumable or account currency.
 * Each of six crew campaigns has five earned favors per approach.
 */
export const CAMPAIGN_CHAPTER_SUPPORT: Record<
  TeamId,
  readonly ChapterSupportPair[]
> = {
  catgirls: [
    {
      conviction: {
        title: 'SAFEHOUSE EYES',
        story:
          'The people who recovered their film watch the exits and keep fresh bandages nearby.',
        terms: { playerHp: 1 },
      },
      cunning: {
        title: 'PHANTOM CAMERA',
        story:
          'False footage tricks the guards into exposing their armor, but raises suspicion.',
        terms: { playerMana: 1, enemyArmor: -1 },
      },
    },
    {
      conviction: {
        title: 'VOLUNTEER ENGINEERS',
        story:
          'Freed forge workers reinforce the rescue line and buy time for the last patient.',
        terms: { playerHp: 1, rounds: 2 },
      },
      cunning: {
        title: 'STOLEN FORGE PLANS',
        story:
          'A mold blueprint identifies the weak weld, while the foreman funds a counterattack.',
        terms: { enemyArmor: -1, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'PARADE ESCORT',
        story:
          'The parade marshals persuade a rival fighter to help the civilians instead.',
        terms: { fewerRivals: 1 },
      },
      cunning: {
        title: 'DISTRACTION FIREWORKS',
        story:
          'The crowd creates an opening, and the rival receives the same warning.',
        terms: { playerMana: 2, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'ROOFTOP WITNESSES',
        story:
          'The fairy testimony creates a supply route for the next confrontation.',
        terms: { playerMana: 1 },
      },
      cunning: {
        title: 'WHISPERED CONTRACTS',
        story:
          'A stolen blood contract buys reinforcements, but the rival has planted a trap.',
        terms: { playerMana: 2, rivalTrap: true },
      },
    },
    {
      conviction: {
        title: 'FREE NAME REGISTRY',
        story:
          "The rescued names reveal the next opponent's vulnerable defenses.",
        terms: { enemyArmor: -1 },
      },
      cunning: {
        title: 'MIDNIGHT LEDGER',
        story:
          'The stolen ledger guides the rescue, but an Exchange collector bankrolls the rival.',
        terms: { playerHp: 2, enemyMana: 1 },
      },
    },
  ],
  bloodfairies: [
    {
      conviction: {
        title: 'MUSIC HALL MEDICS',
        story:
          'The surviving hall becomes a first-aid post for another noisy night.',
        terms: { playerHp: 1, rounds: 1 },
      },
      cunning: {
        title: 'ILLEGAL SOUND CHECK',
        story:
          'A rigged sound check supplies extra mana, but alerts the demolition crew.',
        terms: { playerMana: 2, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'FREED PATIENTS',
        story:
          'People rescued from the hospital patch up two battered fighters.',
        terms: { playerHp: 2 },
      },
      cunning: {
        title: 'DISSECTION FILES',
        story:
          'An intercepted patient file exposes armor seams and provides a small charge.',
        terms: { enemyArmor: -1, playerMana: 1 },
      },
    },
    {
      conviction: {
        title: 'WING SAFEHOUSE',
        story: 'The freed flyers convince a rival lookout to walk off the job.',
        terms: { fewerRivals: 1 },
      },
      cunning: {
        title: 'JAMMED FREQUENCY',
        story:
          'A bootleg transmitter powers the crew but leaves a hidden enemy signal.',
        terms: { playerMana: 2, rivalTrap: true },
      },
    },
    {
      conviction: {
        title: 'TOLL FREE SKY',
        story: 'The reclaimed bridge grants the fairies time to cross safely.',
        terms: { playerHp: 1, rounds: 2 },
      },
      cunning: {
        title: 'BRIDGE KEY HEIST',
        story:
          'A stolen toll key exposes weaker armor, but the foreman gets extra funding.',
        terms: { enemyArmor: -1, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'UNOWNED MOONLIGHT',
        story:
          'The freed rooftops host a quiet mana-passing choir before the next riot.',
        terms: { playerMana: 1 },
      },
      cunning: {
        title: 'RENT STRIKE',
        story:
          'An unsanctioned rent strike brings protection while the landlord funds a rival.',
        terms: { playerHp: 1, enemyMana: 1 },
      },
    },
  ],
  ironjaw: [
    {
      conviction: {
        title: 'FAIR PAYDAY',
        story: "Real wages finance the next crew's first tactical supplies.",
        terms: { playerMana: 1 },
      },
      cunning: {
        title: 'COMPANY STORE RAID',
        story:
          'Stolen stock reveals the opposing plating, but an owner purchases retaliation.',
        terms: { enemyArmor: -1, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'REPAIRED SHIFT CLOCK',
        story:
          'An honest shift schedule buys enough time to recover the wounded.',
        terms: { playerMana: 1, rounds: 2 },
      },
      cunning: {
        title: 'STOLEN OVERTIME',
        story:
          'Confiscated overtime energy powers an early push while the enemy gets a bonus.',
        terms: { playerMana: 2, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'EMERGENCY REPAIRS',
        story:
          "The recovered shutoff tools strengthen the workers' front line.",
        terms: { playerHp: 2 },
      },
      cunning: {
        title: 'FOREMAN OVERRIDE',
        story: 'An override unlocks extra mana and strips a defense plate.',
        terms: { enemyArmor: -1, playerMana: 1 },
      },
    },
    {
      conviction: {
        title: 'BODY AUTONOMY',
        story:
          'Lizards with their gene tags scratched out persuade one opponent not to fight.',
        terms: { fewerRivals: 1 },
      },
      cunning: {
        title: 'BLACK MARKET SERUM',
        story:
          'Bootleg growth serum toughens the crew’s scales, but another lab backs the rival.',
        terms: { playerHp: 1, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'NIGHT SHIFT CHOIR',
        story:
          'The factory choir guards the fighters and extends the next night.',
        terms: { playerHp: 1, rounds: 1 },
      },
      cunning: {
        title: 'FORGE BACKDOOR',
        story:
          'A hidden maintenance line delivers mana, though the rival has trapped the door.',
        terms: { playerMana: 2, rivalTrap: true },
      },
    },
  ],
  riot: [
    {
      conviction: {
        title: 'SAFER STAGE',
        story: 'Volunteers reinforce the street stage and extend the showdown.',
        terms: { playerHp: 1, rounds: 1 },
      },
      cunning: {
        title: 'SMOKE MACHINE HEIST',
        story:
          'A stolen smoke machine gives extra energy but advertises your arrival.',
        terms: { playerMana: 2, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'PAID OFF SPARKS',
        story:
          'Debt-free fireworks buy a clean opening charge without alerting the guards.',
        terms: { playerMana: 1 },
      },
      cunning: {
        title: 'FUSE UNDER THE FLOOR',
        story:
          'An illegal fuse provides plenty of charge, with a rival trap as its price.',
        terms: { playerMana: 2, rivalTrap: true },
      },
    },
    {
      conviction: {
        title: 'SHARED ENCORE',
        story:
          'The rival band stalls for a second encore, buying your crew more time.',
        terms: { playerMana: 1, rounds: 2 },
      },
      cunning: {
        title: 'STOLEN SOUND TOWER',
        story:
          'A tower blueprint makes armor easier to crack and charges the amp.',
        terms: { enemyArmor: -1, playerMana: 1 },
      },
    },
    {
      conviction: {
        title: 'PUBLIC AMBUSH MAP',
        story: 'Exposing the false parade route persuades one guard to defect.',
        terms: { fewerRivals: 1 },
      },
      cunning: {
        title: 'PARADE DECOYS',
        story:
          "A fake route shields the crew, but the rival's sponsor is warned.",
        terms: { playerHp: 1, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'CLINIC FIRE WARDENS',
        story:
          'Clinic volunteers reinforce the front line before the grand finale.',
        terms: { playerHp: 2 },
      },
      cunning: {
        title: 'UNLICENSED FIRE CODE',
        story:
          'Stolen inspection records expose a weakness, while opponents receive funds.',
        terms: { enemyArmor: -1, enemyMana: 1 },
      },
    },
  ],
  undertow: [
    {
      conviction: {
        title: 'PROTECTED TECHNICIAN',
        story: 'The sheltered technician patches up exposed field operatives.',
        terms: { playerHp: 1 },
      },
      cunning: {
        title: 'FALSE SAFEHOUSE',
        story:
          'A forged safehouse tip delivers energy but leads through a hidden trap.',
        terms: { playerMana: 2, rivalTrap: true },
      },
    },
    {
      conviction: {
        title: 'PRIVACY WINDOW',
        story: 'Taking the stolen recordings offline buys a little extra time.',
        terms: { playerHp: 1, rounds: 2 },
      },
      cunning: {
        title: 'LEAKED AUDIO KEYS',
        story:
          'Private audio keys reveal a weak point, though the rival pays for new security.',
        terms: { enemyArmor: -1, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'AUCTION WHISTLEBLOWER',
        story:
          'A witness to the recordings auction convinces a guard to leave.',
        terms: { fewerRivals: 1 },
      },
      cunning: {
        title: 'BIDDER IMPERSONATION',
        story:
          'The disguised bidder supplies early mana, while the auctioneer funds the rival.',
        terms: { playerMana: 2, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'UNPLUGGED HELMETS',
        story:
          'Freed helmeted soldiers donate two layers of field protection for the next mission.',
        terms: { playerHp: 2 },
      },
      cunning: {
        title: 'SIGNAL SPOOF',
        story:
          'A spoofed command cracks the armor shell and adds a little mana.',
        terms: { enemyArmor: -1, playerMana: 1 },
      },
    },
    {
      conviction: {
        title: 'REAL ORACLE SIGNAL',
        story:
          'The liberated broadcast supplies mana and a longer window to fight.',
        terms: { playerMana: 1, rounds: 1 },
      },
      cunning: {
        title: 'PHANTOM BROADCAST',
        story:
          'A false transmission shields one operative but boosts rival intelligence.',
        terms: { playerHp: 1, enemyMana: 1 },
      },
    },
  ],
  exchange: [
    {
      conviction: {
        title: 'DEBT BONFIRE',
        story: 'The cancelled hospital bills free a little opening mana.',
        terms: { playerMana: 1 },
      },
      cunning: {
        title: 'FIRE SALE LEVERAGE',
        story:
          'A private ledger buys a head start, but the rival refinances too.',
        terms: { playerMana: 2, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'WORKER OWNERSHIP',
        story: 'A worker-owned factory sends two reinforced supply crates.',
        terms: { playerHp: 2 },
      },
      cunning: {
        title: 'HOSTILE TAKEOVER',
        story:
          'A leveraged strike cracks competitor armor, funding their defense in return.',
        terms: { enemyArmor: -1, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'PUBLIC AUDIT',
        story: 'The exposed forged contracts persuade a collector to resign.',
        terms: { fewerRivals: 1 },
      },
      cunning: {
        title: 'INSIDER TRADING',
        story:
          'Privileged knowledge buys mana, while a hidden trap guards the exchange.',
        terms: { playerMana: 2, rivalTrap: true },
      },
    },
    {
      conviction: {
        title: 'HUMAN RIGHTS HEARING',
        story:
          'The rights case extends the negotiation window for the whole crew.',
        terms: { playerHp: 1, rounds: 2 },
      },
      cunning: {
        title: 'SETTLEMENT CLAUSE',
        story: 'A secret settlement funds field armor as the enemy gets a cut.',
        terms: { playerHp: 1, enemyMana: 1 },
      },
    },
    {
      conviction: {
        title: 'ZERO BALANCE CELEBRATION',
        story:
          'Free rooftop tenants reinforce the field and buy another round.',
        terms: { playerHp: 1, rounds: 1 },
      },
      cunning: {
        title: 'GOLD SEAL ARBITRAGE',
        story:
          'A forged corporate seal reveals armor weaknesses and buys a small charge.',
        terms: { enemyArmor: -1, playerMana: 1 },
      },
    },
  ],
}
