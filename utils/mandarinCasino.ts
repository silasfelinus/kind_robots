import type { MandarinCard, MandarinSource, MandarinStudySet } from './mandarin'

export type MandarinCasinoCard = MandarinCard & {
  usageNote?: string
}

const CASINO_SOURCE: MandarinSource = {
  label: 'Kind Robots practical casino Mandarin curriculum',
  version: '2026-08-25 · terminology cross-checked against Macau DICJ game rules',
  url: 'https://www.dicj.gov.mo/web/cn/rules/',
  licenseNote:
    'Game-specific labels are curated learning guidance. Macau regulatory terminology is identified in usage notes where it may differ from everyday Mandarin or another casino region.',
}

type CasinoSeed = {
  simplified: string
  pinyin: string
  meaning: string
  group: keyof typeof CASINO_STUDY_SET_META
  traditional?: string
  meanings?: string[]
  usageNote?: string
}

export const CASINO_STUDY_SET_META: Record<
  string,
  Pick<MandarinStudySet, 'label' | 'description'>
> = {
  'casino-general': {
    label: 'Casino floor essentials',
    description: 'Core table, betting, chip, payout, and customer-facing language usable across games.',
  },
  'casino-baccarat': {
    label: 'Baccarat Mandarin',
    description: 'Banker/player betting sides, pairs, third-card language, commission, and common baccarat calls.',
  },
  'casino-blackjack': {
    label: 'Blackjack Mandarin',
    description: 'Hit, stand, bust, double, split, insurance, totals, and Macau-specific table terminology.',
  },
  'casino-roulette': {
    label: 'Roulette Mandarin',
    description: 'Wheel, number, color, odd/even, high/low, and common inside/outside wager language.',
  },
  'casino-sic-bo': {
    label: 'Sic Bo Mandarin',
    description: 'Dice, big/small, odd/even, triples, totals, and table calls used around Sic Bo.',
  },
  'casino-poker': {
    label: 'Poker Mandarin',
    description: 'Cards, blinds, calls, raises, folds, community cards, and practical poker-table vocabulary.',
  },
  'casino-customer': {
    label: 'Dealer phrases',
    description: 'Short, polite phrases a dealer can use with Mandarin-speaking guests at the table.',
  },
}

const SEEDS: CasinoSeed[] = [
  // General casino floor language.
  { simplified: '赌场', traditional: '賭場', pinyin: 'dǔ chǎng', meaning: 'casino', group: 'casino-general' },
  { simplified: '赌博', traditional: '賭博', pinyin: 'dǔ bó', meaning: 'gambling; to gamble', group: 'casino-general' },
  { simplified: '赌注', traditional: '賭注', pinyin: 'dǔ zhù', meaning: 'bet; wager', group: 'casino-general' },
  {
    simplified: '投注',
    pinyin: 'tóu zhù',
    meaning: 'to wager; to place a bet',
    group: 'casino-general',
    usageNote: 'Common formal casino/regulatory term. Everyday table speech may also use 下注.',
  },
  { simplified: '下注', pinyin: 'xià zhù', meaning: 'to place a bet', group: 'casino-general' },
  { simplified: '筹码', traditional: '籌碼', pinyin: 'chóu mǎ', meaning: 'casino chip; chips', group: 'casino-general' },
  { simplified: '现金', traditional: '現金', pinyin: 'xiàn jīn', meaning: 'cash', group: 'casino-general' },
  { simplified: '换筹码', traditional: '換籌碼', pinyin: 'huàn chóu mǎ', meaning: 'to exchange for chips', group: 'casino-general' },
  { simplified: '兑换现金', traditional: '兌換現金', pinyin: 'duì huàn xiàn jīn', meaning: 'to cash out; exchange for cash', group: 'casino-general' },
  { simplified: '扑克牌', traditional: '撲克牌', pinyin: 'pū kè pái', meaning: 'playing cards', group: 'casino-general' },
  { simplified: '牌桌', pinyin: 'pái zhuō', meaning: 'card or gaming table', group: 'casino-general' },
  { simplified: '赌台', traditional: '賭檯', pinyin: 'dǔ tái', meaning: 'gaming table', group: 'casino-general' },
  {
    simplified: '荷官',
    pinyin: 'hé guān',
    meaning: 'casino dealer; croupier',
    group: 'casino-general',
    usageNote: 'Widely understood casino-floor term for the staff member dealing or running a table.',
  },
  {
    simplified: '庄荷',
    traditional: '莊荷',
    pinyin: 'zhuāng hé',
    meaning: 'table dealer; croupier',
    group: 'casino-general',
    usageNote: 'Macau regulatory term for the person operating the game. Do not confuse it with 庄家, which can name a betting side or house hand depending on the game.',
  },
  { simplified: '玩家', pinyin: 'wán jiā', meaning: 'player', group: 'casino-general' },
  {
    simplified: '博彩者',
    pinyin: 'bó cǎi zhě',
    meaning: 'gambler; gaming patron',
    group: 'casino-general',
    usageNote: 'Formal/regulatory wording for a person taking part in gambling; 玩家 or 客人 is more conversational.',
  },
  { simplified: '客人', pinyin: 'kè rén', meaning: 'guest; customer', group: 'casino-customer' },
  { simplified: '牌靴', traditional: '牌靴', pinyin: 'pái xuē', meaning: 'card shoe', group: 'casino-general', usageNote: 'Macau rules also describe the dealing box as 派牌盒（牌靴）.' },
  { simplified: '洗牌', pinyin: 'xǐ pái', meaning: 'to shuffle cards', group: 'casino-general' },
  { simplified: '切牌', pinyin: 'qiē pái', meaning: 'to cut the cards', group: 'casino-general' },
  { simplified: '发牌', traditional: '發牌', pinyin: 'fā pái', meaning: 'to deal cards', group: 'casino-general' },
  { simplified: '收牌', pinyin: 'shōu pái', meaning: 'to collect the cards', group: 'casino-general' },
  { simplified: '烧牌', traditional: '燒牌', pinyin: 'shāo pái', meaning: 'to burn a card', group: 'casino-general', usageNote: 'Poker and shoe-game jargon for discarding a card unseen before continuing the deal.' },
  { simplified: '点数', traditional: '點數', pinyin: 'diǎn shù', meaning: 'point value; total', group: 'casino-general' },
  { simplified: '牌面', pinyin: 'pái miàn', meaning: 'face of a card; displayed card value', group: 'casino-general' },
  { simplified: '一局', pinyin: 'yì jú', meaning: 'one round; one hand of play', group: 'casino-general' },
  { simplified: '投注额', traditional: '投注額', pinyin: 'tóu zhù é', meaning: 'wager amount', group: 'casino-general' },
  { simplified: '投注上限', pinyin: 'tóu zhù shàng xiàn', meaning: 'maximum betting limit', group: 'casino-general' },
  { simplified: '投注下限', pinyin: 'tóu zhù xià xiàn', meaning: 'minimum betting limit', group: 'casino-general' },
  { simplified: '加注', pinyin: 'jiā zhù', meaning: 'to raise; increase a wager', group: 'casino-general' },
  { simplified: '减注', traditional: '減注', pinyin: 'jiǎn zhù', meaning: 'to reduce a wager', group: 'casino-general' },
  { simplified: '移注', pinyin: 'yí zhù', meaning: 'to move a wager', group: 'casino-general', usageNote: 'Formal table/rules wording. Once betting closes, many games prohibit changing or moving an existing wager.' },
  {
    simplified: '派彩',
    pinyin: 'pài cǎi',
    meaning: 'to pay out winnings; payout',
    group: 'casino-general',
    usageNote: 'Very common casino term in Macau/Hong Kong usage for distributing winnings.',
  },
  {
    simplified: '赔彩',
    traditional: '賠彩',
    pinyin: 'péi cǎi',
    meaning: 'to pay a winning wager',
    group: 'casino-general',
    usageNote: 'Macau regulatory wording used in game rules for paying winning bets.',
  },
  { simplified: '赔率', traditional: '賠率', pinyin: 'péi lǜ', meaning: 'odds; payout rate', group: 'casino-general' },
  { simplified: '赢', traditional: '贏', pinyin: 'yíng', meaning: 'to win', group: 'casino-general' },
  { simplified: '输', traditional: '輸', pinyin: 'shū', meaning: 'to lose', group: 'casino-general' },
  { simplified: '和局', pinyin: 'hé jú', meaning: 'tie; tied result', group: 'casino-general' },

  // Baccarat. In baccarat, banker/player are betting positions, not job titles.
  { simplified: '百家乐', traditional: '百家樂', pinyin: 'bǎi jiā lè', meaning: 'baccarat', group: 'casino-baccarat' },
  {
    simplified: '庄家',
    traditional: '莊家',
    pinyin: 'zhuāng jiā',
    meaning: 'Banker side; house hand',
    group: 'casino-baccarat',
    usageNote: 'In baccarat this labels the Banker betting side, not the human dealer. Use 荷官 or 莊荷/庄荷 for the staff member running the table.',
  },
  {
    simplified: '闲家',
    traditional: '閒家',
    pinyin: 'xián jiā',
    meaning: 'Player side',
    group: 'casino-baccarat',
    usageNote: 'In baccarat this is the Player betting side, not necessarily the person sitting at the table. A human player is 玩家 or 博彩者.',
  },
  { simplified: '庄对子', traditional: '莊對子', pinyin: 'zhuāng duì zi', meaning: 'Banker Pair bet', group: 'casino-baccarat' },
  { simplified: '闲对子', traditional: '閒對子', pinyin: 'xián duì zi', meaning: 'Player Pair bet', group: 'casino-baccarat' },
  { simplified: '对子', traditional: '對子', pinyin: 'duì zi', meaning: 'pair', group: 'casino-baccarat' },
  { simplified: '补牌', traditional: '補牌', pinyin: 'bǔ pái', meaning: 'to draw an additional card', group: 'casino-baccarat', usageNote: 'Useful for baccarat third-card procedure as well as other card games.' },
  { simplified: '第三张牌', traditional: '第三張牌', pinyin: 'dì sān zhāng pái', meaning: 'third card', group: 'casino-baccarat' },
  { simplified: '佣金', pinyin: 'yòng jīn', meaning: 'commission', group: 'casino-baccarat' },
  { simplified: '免佣', pinyin: 'miǎn yòng', meaning: 'no commission; commission-free', group: 'casino-baccarat' },
  { simplified: '买庄', traditional: '買莊', pinyin: 'mǎi zhuāng', meaning: 'to bet on Banker', group: 'casino-baccarat', usageNote: 'Casino colloquialism. Formal rules language is 投注于庄家 / 投注於莊家.' },
  { simplified: '买闲', traditional: '買閒', pinyin: 'mǎi xián', meaning: 'to bet on Player', group: 'casino-baccarat', usageNote: 'Casino colloquialism. Formal rules language is 投注于闲家 / 投注於閒家.' },
  { simplified: '庄赢', traditional: '莊贏', pinyin: 'zhuāng yíng', meaning: 'Banker wins', group: 'casino-baccarat' },
  { simplified: '闲赢', traditional: '閒贏', pinyin: 'xián yíng', meaning: 'Player wins', group: 'casino-baccarat' },

  // Blackjack. Keep general Mandarin and Macau table wording side-by-side.
  { simplified: '二十一点', traditional: '二十一點', pinyin: 'èr shí yī diǎn', meaning: 'blackjack; twenty-one', group: 'casino-blackjack' },
  { simplified: '要牌', pinyin: 'yào pái', meaning: 'hit; ask for another card', group: 'casino-blackjack', usageNote: 'Plain conversational Mandarin for taking another card.' },
  { simplified: '停牌', pinyin: 'tíng pái', meaning: 'stand; take no more cards', group: 'casino-blackjack', usageNote: 'Plain conversational Mandarin. Macau rules also use 不博牌 for the stand decision.' },
  {
    simplified: '博牌',
    pinyin: 'bó pái',
    meaning: 'hit; take another card',
    group: 'casino-blackjack',
    usageNote: 'Macau blackjack regulatory term. In broader Mandarin, 要牌 is often more immediately transparent.',
  },
  {
    simplified: '不博牌',
    pinyin: 'bù bó pái',
    meaning: 'stand; decline another card',
    group: 'casino-blackjack',
    usageNote: 'Macau blackjack regulatory counterpart to 博牌.',
  },
  { simplified: '爆牌', pinyin: 'bào pái', meaning: 'bust; go over twenty-one', group: 'casino-blackjack' },
  { simplified: '加倍下注', pinyin: 'jiā bèi xià zhù', meaning: 'double down', group: 'casino-blackjack' },
  { simplified: '分牌', pinyin: 'fēn pái', meaning: 'split a pair', group: 'casino-blackjack' },
  { simplified: '保险', traditional: '保險', pinyin: 'bǎo xiǎn', meaning: 'insurance', group: 'casino-blackjack' },
  { simplified: 'A牌', pinyin: 'A pái', meaning: 'ace', group: 'casino-blackjack', usageNote: 'Casino rules commonly refer to an ace directly as A牌.' },
  { simplified: '人像牌', pinyin: 'rén xiàng pái', meaning: 'face card', group: 'casino-blackjack', usageNote: 'Macau blackjack rules use 人像牌 for J, Q, and K.' },

  // Roulette.
  { simplified: '轮盘赌', traditional: '輪盤賭', pinyin: 'lún pán dǔ', meaning: 'roulette', group: 'casino-roulette' },
  { simplified: '轮盘', traditional: '輪盤', pinyin: 'lún pán', meaning: 'roulette wheel', group: 'casino-roulette' },
  { simplified: '号码', traditional: '號碼', pinyin: 'hào mǎ', meaning: 'number', group: 'casino-roulette' },
  { simplified: '红', traditional: '紅', pinyin: 'hóng', meaning: 'red', group: 'casino-roulette' },
  { simplified: '黑', pinyin: 'hēi', meaning: 'black', group: 'casino-roulette' },
  { simplified: '单', traditional: '單', pinyin: 'dān', meaning: 'odd', group: 'casino-roulette' },
  { simplified: '双', traditional: '雙', pinyin: 'shuāng', meaning: 'even', group: 'casino-roulette' },
  { simplified: '大', pinyin: 'dà', meaning: 'high; big', group: 'casino-roulette' },
  { simplified: '小', pinyin: 'xiǎo', meaning: 'low; small', group: 'casino-roulette' },
  { simplified: '孤丁', pinyin: 'gū dīng', meaning: 'straight-up single-number bet', group: 'casino-roulette', usageNote: 'Macau roulette rules term for a wager on one number.' },
  { simplified: '两门骑线', traditional: '兩門騎綫', pinyin: 'liǎng mén qí xiàn', meaning: 'split bet on two roulette numbers', group: 'casino-roulette', usageNote: 'Macau regulatory/table terminology; other regions may describe the bet differently.' },
  { simplified: '四门骑线', traditional: '四門騎綫', pinyin: 'sì mén qí xiàn', meaning: 'corner bet on four roulette numbers', group: 'casino-roulette', usageNote: 'Macau regulatory/table terminology for a four-number corner wager.' },

  // Sic Bo.
  { simplified: '骰宝', traditional: '骰寶', pinyin: 'shǎi bǎo', meaning: 'Sic Bo', group: 'casino-sic-bo' },
  { simplified: '骰子', pinyin: 'shǎi zi', meaning: 'dice', group: 'casino-sic-bo' },
  { simplified: '开骰', traditional: '開骰', pinyin: 'kāi shǎi', meaning: 'reveal/open the dice', group: 'casino-sic-bo', usageNote: 'Macau rules use 開骰 for the dealer revealing and announcing the dice result.' },
  { simplified: '围骰', traditional: '圍骰', pinyin: 'wéi shǎi', meaning: 'specific triple', group: 'casino-sic-bo', usageNote: 'Sic Bo wager where all three dice show the selected number.' },
  { simplified: '全骰', pinyin: 'quán shǎi', meaning: 'any triple', group: 'casino-sic-bo', usageNote: 'Sic Bo wager on all three dice matching, regardless of which number.' },
  { simplified: '大', pinyin: 'dà', meaning: 'Big', group: 'casino-sic-bo', usageNote: 'In Sic Bo, a Big wager is defined by the game rules, not merely the everyday adjective “big.”' },
  { simplified: '小', pinyin: 'xiǎo', meaning: 'Small', group: 'casino-sic-bo', usageNote: 'In Sic Bo, a Small wager is defined by the game rules, not merely the everyday adjective “small.”' },

  // Poker.
  { simplified: '德州扑克', traditional: '德州撲克', pinyin: 'dé zhōu pū kè', meaning: 'Texas Hold’em', group: 'casino-poker' },
  { simplified: '盲注', pinyin: 'máng zhù', meaning: 'blind bet; blind', group: 'casino-poker' },
  { simplified: '小盲注', pinyin: 'xiǎo máng zhù', meaning: 'small blind', group: 'casino-poker' },
  { simplified: '大盲注', pinyin: 'dà máng zhù', meaning: 'big blind', group: 'casino-poker' },
  { simplified: '跟注', pinyin: 'gēn zhù', meaning: 'call a bet', group: 'casino-poker' },
  { simplified: '弃牌', traditional: '棄牌', pinyin: 'qì pái', meaning: 'fold', group: 'casino-poker' },
  { simplified: '盖牌', traditional: '蓋牌', pinyin: 'gài pái', meaning: 'fold; muck one’s hand', group: 'casino-poker', usageNote: 'Macau Texas Hold’em rules use 蓋牌; 棄牌 is broadly understood poker Mandarin.' },
  { simplified: '全押', pinyin: 'quán yā', meaning: 'all-in', group: 'casino-poker' },
  { simplified: '公共牌', pinyin: 'gōng gòng pái', meaning: 'community cards', group: 'casino-poker' },
  { simplified: '底牌', pinyin: 'dǐ pái', meaning: 'hole cards; concealed cards', group: 'casino-poker' },

  // Short dealer-to-guest phrases. Keep them literal, polite, and table-safe.
  { simplified: '请下注', traditional: '請下注', pinyin: 'qǐng xià zhù', meaning: 'please place your bets', group: 'casino-customer' },
  { simplified: '开始下注', traditional: '開始下注', pinyin: 'kāi shǐ xià zhù', meaning: 'betting is open', group: 'casino-customer' },
  { simplified: '停止投注', pinyin: 'tíng zhǐ tóu zhù', meaning: 'betting is closed; no more bets', group: 'casino-customer', usageNote: 'Formal, broadly understandable table call. Macau rules use both 投注停止 language and game-specific calls such as 截止投注.' },
  { simplified: '请稍等', traditional: '請稍等', pinyin: 'qǐng shāo děng', meaning: 'please wait a moment', group: 'casino-customer' },
  { simplified: '请把筹码放好', traditional: '請把籌碼放好', pinyin: 'qǐng bǎ chóu mǎ fàng hǎo', meaning: 'please place your chips properly', group: 'casino-customer' },
  { simplified: '请不要碰筹码', traditional: '請不要碰籌碼', pinyin: 'qǐng bú yào pèng chóu mǎ', meaning: 'please do not touch the chips', group: 'casino-customer' },
  { simplified: '这一局结束了', traditional: '這一局結束了', pinyin: 'zhè yì jú jié shù le', meaning: 'this round is over', group: 'casino-customer' },
  { simplified: '下一局', pinyin: 'xià yì jú', meaning: 'next round; next hand', group: 'casino-customer' },
  { simplified: '祝你好运', traditional: '祝你好運', pinyin: 'zhù nǐ hǎo yùn', meaning: 'good luck', group: 'casino-customer' },
  { simplified: '谢谢', traditional: '謝謝', pinyin: 'xiè xie', meaning: 'thank you', group: 'casino-customer' },
]

function kindFor(text: string): MandarinCard['kind'] {
  return [...text].length === 1 ? 'character' : [...text].length <= 4 ? 'word' : 'phrase'
}

export const CASINO_MANDARIN_CARDS: MandarinCasinoCard[] = SEEDS.map((seed) => ({
  key: `casino:${seed.simplified}`,
  simplified: seed.simplified,
  ...(seed.traditional && seed.traditional !== seed.simplified
    ? { traditional: seed.traditional }
    : {}),
  pinyin: seed.pinyin,
  meaning: seed.meaning,
  meanings: seed.meanings?.length ? seed.meanings : [seed.meaning],
  kind: kindFor(seed.simplified),
  partsOfSpeech: [],
  classifiers: [],
  categories: ['casino', seed.group],
  components: [],
  historyStatus: 'pending',
  source: CASINO_SOURCE,
  ...(seed.usageNote ? { usageNote: seed.usageNote } : {}),
}))
