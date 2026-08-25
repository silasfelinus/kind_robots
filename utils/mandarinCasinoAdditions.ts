import type { MandarinCard } from './mandarin'
import type { MandarinCasinoCard } from './mandarinCasino'

const SOURCE = {
  label: 'Kind Robots practical casino Mandarin curriculum',
  version: '2026-08-25 · specialist terminology QA',
  url: 'https://www.dicj.gov.mo/web/cn/rules/',
  licenseNote:
    'Standard Mandarin pronunciation and game labels are curated for learning; usage notes call out regional casino terminology where relevant.',
}

function card(
  simplified: string,
  pinyin: string,
  meaning: string,
  group: string,
  options: {
    traditional?: string
    usageNote?: string
  } = {},
): MandarinCasinoCard {
  return {
    key: `casino:${simplified}`,
    simplified,
    ...(options.traditional && options.traditional !== simplified
      ? { traditional: options.traditional }
      : {}),
    pinyin,
    meaning,
    meanings: [meaning],
    kind: ([...simplified].length === 1 ? 'character' : 'word') as MandarinCard['kind'],
    partsOfSpeech: [],
    classifiers: [],
    categories: ['casino', group],
    components: [],
    historyStatus: 'pending',
    source: SOURCE,
    ...(options.usageNote ? { usageNote: options.usageNote } : {}),
  }
}

/**
 * Follow-up specialist cards kept separate from the first large seed block so
 * pronunciation QA and cross-game membership stay reviewable. Repeated Hanzi are
 * intentional: the catalog merge unions their categories into one canonical card.
 */
export const CASINO_MANDARIN_ADDITIONS: MandarinCasinoCard[] = [
  // Standard Mandarin reads 骰 as tóu. shǎi is a widespread spoken reading influenced by 色子.
  card('骰宝', 'tóu bǎo', 'Sic Bo', 'casino-sic-bo', {
    traditional: '骰寶',
    usageNote: 'Standard Mandarin reads 骰 as tóu. You will also hear shǎi in everyday speech; both point to the same dice-game vocabulary.',
  }),
  card('骰子', 'tóu zi', 'dice', 'casino-sic-bo', {
    usageNote: 'Standard dictionary pronunciation is tóu zi. The colloquial reading shǎi zi is also widespread.',
  }),
  card('开骰', 'kāi tóu', 'reveal/open the dice', 'casino-sic-bo', {
    traditional: '開骰',
    usageNote: 'Table-language compound built with standard 骰 tóu; spoken regional pronunciation may vary.',
  }),
  card('围骰', 'wéi tóu', 'specific triple', 'casino-sic-bo', {
    traditional: '圍骰',
    usageNote: 'Sic Bo wager where all three dice show the selected number.',
  }),
  card('全骰', 'quán tóu', 'any triple', 'casino-sic-bo', {
    usageNote: 'Sic Bo wager on all three dice matching, regardless of which number.',
  }),
  card('单', 'dān', 'odd', 'casino-sic-bo', { traditional: '單' }),
  card('双', 'shuāng', 'even', 'casino-sic-bo', { traditional: '雙' }),
  card('点数', 'diǎn shù', 'point total', 'casino-sic-bo', { traditional: '點數' }),

  // Suits and ranks. These are shared across blackjack, baccarat, and poker.
  card('花色', 'huā sè', 'card suit', 'casino-general'),
  card('黑桃', 'hēi táo', 'spades', 'casino-general'),
  card('红桃', 'hóng táo', 'hearts', 'casino-general', {
    traditional: '紅桃',
    usageNote: 'Mainland/general card term. Macau rules may also write 紅心 for hearts.',
  }),
  card('红心', 'hóng xīn', 'hearts', 'casino-general', {
    traditional: '紅心',
    usageNote: 'Used in Macau gaming rules; 红桃 is also broadly understood.',
  }),
  card('方块', 'fāng kuài', 'diamonds', 'casino-general', {
    traditional: '方塊',
  }),
  card('梅花', 'méi huā', 'clubs', 'casino-general'),
  card('A牌', 'A pái', 'ace', 'casino-general', {
    usageNote: 'Casino tables commonly say the Latin rank plus 牌. In blackjack an ace can count as one or eleven.',
  }),
  card('K牌', 'K pái', 'king', 'casino-general'),
  card('Q牌', 'Q pái', 'queen', 'casino-general'),
  card('J牌', 'J pái', 'jack', 'casino-general'),
  card('十点牌', 'shí diǎn pái', 'ten-value card', 'casino-blackjack', {
    traditional: '十點牌',
  }),

  // Cross-tag the common suit vocabulary into game-specific study sets without creating new facts.
  card('黑桃', 'hēi táo', 'spades', 'casino-poker'),
  card('红桃', 'hóng táo', 'hearts', 'casino-poker', { traditional: '紅桃' }),
  card('方块', 'fāng kuài', 'diamonds', 'casino-poker', { traditional: '方塊' }),
  card('梅花', 'méi huā', 'clubs', 'casino-poker'),
  card('A牌', 'A pái', 'ace', 'casino-blackjack'),
  card('K牌', 'K pái', 'king', 'casino-blackjack'),
  card('Q牌', 'Q pái', 'queen', 'casino-blackjack'),
  card('J牌', 'J pái', 'jack', 'casino-blackjack'),

  // Practical table limits / buy-in language.
  card('最低投注', 'zuì dī tóu zhù', 'minimum bet', 'casino-general'),
  card('最高投注', 'zuì gāo tóu zhù', 'maximum bet', 'casino-general'),
  card('买入', 'mǎi rù', 'buy-in', 'casino-general', {
    traditional: '買入',
    usageNote: 'Poker/casino finance term. At a table, 换筹码 can be more direct when the guest simply wants chips.',
  }),
  card('兑筹码', 'duì chóu mǎ', 'redeem chips', 'casino-general', {
    traditional: '兌籌碼',
  }),
]
