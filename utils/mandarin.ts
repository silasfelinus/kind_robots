export type MandarinComponentRole =
  | 'semantic'
  | 'phonetic'
  | 'radical'
  | 'form'
  | 'uncertain'

export type MandarinComponent = {
  glyph: string
  role: MandarinComponentRole
  label: string
  meaning?: string
  note?: string
}

export type MandarinSource = {
  label: string
  version: string
  url?: string
  licenseNote?: string
}

export type MandarinCard = {
  key: string
  simplified: string
  traditional?: string
  pinyin: string
  meaning: string
  meanings: string[]
  kind: 'word' | 'character' | 'phrase' | 'component'
  radical?: string
  frequency?: number
  hskLevel?: number
  partsOfSpeech: string[]
  classifiers: string[]
  categories: string[]
  components: MandarinComponent[]
  history?: string
  historyStatus: 'starter' | 'pending'
  source: MandarinSource
}

export type MandarinStudySet = {
  id: string
  label: string
  description: string
  cardKeys: string[]
}

export type MandarinCatalogPayload = {
  cards: MandarinCard[]
  sets: MandarinStudySet[]
  source: MandarinSource
}

export type MandarinCustomSet = {
  id: string
  name: string
  cardKeys: string[]
  createdAt: string
}

export const MANDARIN_SOURCE: MandarinSource = {
  label: 'HSK Vocabulary / CC-CEDICT compilation',
  version: 'jelleverheyen/hsk-vocabulary@a66fd30b9580da2c2af7eb19e4b9d8099a29c061',
  url: 'https://github.com/jelleverheyen/hsk-vocabulary',
  licenseNote: 'Source and attribution details are preserved from the upstream dataset.',
}

const curatedSource: MandarinSource = {
  label: 'Kind Robots curated starter vocabulary',
  version: '2026-08-24',
}

type CuratedSeed = [
  simplified: string,
  pinyin: string,
  meaning: string,
  category: string,
  traditional?: string,
]

const CURATED_SEEDS: CuratedSeed[] = [
  ['猫', 'māo', 'cat', 'animals', '貓'],
  ['狗', 'gǒu', 'dog', 'animals'],
  ['鸟', 'niǎo', 'bird', 'animals', '鳥'],
  ['鱼', 'yú', 'fish', 'animals', '魚'],
  ['兔子', 'tù zi', 'rabbit', 'animals'],
  ['老虎', 'lǎo hǔ', 'tiger', 'animals'],
  ['狮子', 'shī zi', 'lion', 'animals', '獅子'],
  ['熊', 'xióng', 'bear', 'animals'],
  ['熊猫', 'xióng māo', 'giant panda', 'animals', '熊貓'],
  ['猴子', 'hóu zi', 'monkey', 'animals'],
  ['大象', 'dà xiàng', 'elephant', 'animals'],
  ['蛇', 'shé', 'snake', 'animals'],
  ['龙', 'lóng', 'dragon', 'animals', '龍'],
  ['老鼠', 'lǎo shǔ', 'mouse; rat', 'animals'],
  ['猪', 'zhū', 'pig', 'animals', '豬'],
  ['羊', 'yáng', 'sheep; goat', 'animals'],
  ['鸭子', 'yā zi', 'duck', 'animals', '鴨子'],
  ['红色', 'hóng sè', 'red', 'colors', '紅色'],
  ['蓝色', 'lán sè', 'blue', 'colors', '藍色'],
  ['绿色', 'lǜ sè', 'green', 'colors', '綠色'],
  ['黄色', 'huáng sè', 'yellow', 'colors', '黃色'],
  ['黑色', 'hēi sè', 'black', 'colors'],
  ['白色', 'bái sè', 'white', 'colors'],
  ['紫色', 'zǐ sè', 'purple', 'colors'],
  ['粉红色', 'fěn hóng sè', 'pink', 'colors', '粉紅色'],
  ['橙色', 'chéng sè', 'orange', 'colors'],
  ['灰色', 'huī sè', 'gray', 'colors'],
  ['赌场', 'dǔ chǎng', 'casino', 'casino', '賭場'],
  ['赌博', 'dǔ bó', 'gambling; to gamble', 'casino', '賭博'],
  ['赌注', 'dǔ zhù', 'bet; wager', 'casino', '賭注'],
  ['下注', 'xià zhù', 'to place a bet', 'casino'],
  ['筹码', 'chóu mǎ', 'casino chip', 'casino', '籌碼'],
  ['牌', 'pái', 'card; tile;牌', 'casino'],
  ['扑克牌', 'pū kè pái', 'playing cards', 'casino', '撲克牌'],
  ['牌桌', 'pái zhuō', 'card or gaming table', 'casino'],
  ['荷官', 'hé guān', 'casino dealer', 'casino'],
  ['庄家', 'zhuāng jiā', 'banker; house/dealer role', 'casino', '莊家'],
  ['玩家', 'wán jiā', 'player', 'casino'],
  ['洗牌', 'xǐ pái', 'to shuffle cards', 'casino'],
  ['切牌', 'qiē pái', 'to cut the cards', 'casino'],
  ['发牌', 'fā pái', 'to deal cards', 'casino', '發牌'],
  ['补牌', 'bǔ pái', 'to draw an additional card', 'casino', '補牌'],
  ['赢', 'yíng', 'to win', 'casino', '贏'],
  ['输', 'shū', 'to lose', 'casino', '輸'],
  ['平局', 'píng jú', 'tie; draw', 'casino'],
  ['赔率', 'péi lǜ', 'odds; payout rate', 'casino', '賠率'],
  ['赔付', 'péi fù', 'payout; to pay winnings', 'casino', '賠付'],
  ['现金', 'xiàn jīn', 'cash', 'casino', '現金'],
  ['兑现', 'duì xiàn', 'to cash out; redeem', 'casino', '兌現'],
  ['换筹码', 'huàn chóu mǎ', 'exchange for chips', 'casino', '換籌碼'],
  ['黑桃', 'hēi táo', 'spades', 'casino'],
  ['红桃', 'hóng táo', 'hearts', 'casino', '紅桃'],
  ['方块', 'fāng kuài', 'diamonds', 'casino', '方塊'],
  ['梅花', 'méi huā', 'clubs', 'casino'],
  ['点数', 'diǎn shù', 'point value; total of pips', 'casino', '點數'],
  ['总数', 'zǒng shù', 'total number; total', 'casino', '總數'],
  ['双倍', 'shuāng bèi', 'double; twice as much', 'casino', '雙倍'],
  ['请下注', 'qǐng xià zhù', 'please place your bets', 'casino', '請下注'],
  ['停止下注', 'tíng zhǐ xià zhù', 'betting is closed; no more bets', 'casino'],
  ['最小下注', 'zuì xiǎo xià zhù', 'minimum bet', 'casino'],
  ['最大下注', 'zuì dà xià zhù', 'maximum bet', 'casino'],
  ['请稍等', 'qǐng shāo děng', 'please wait a moment', 'casino', '請稍等'],
  ['好运', 'hǎo yùn', 'good luck', 'casino', '好運'],
]

export const CURATED_MANDARIN_CARDS: MandarinCard[] = CURATED_SEEDS.map(
  ([simplified, pinyin, meaning, category, traditional]) => ({
    key: `curated:${simplified}`,
    simplified,
    ...(traditional && traditional !== simplified ? { traditional } : {}),
    pinyin,
    meaning,
    meanings: [meaning],
    kind: simplified.length === 1 ? 'character' : 'phrase',
    partsOfSpeech: [],
    classifiers: [],
    categories: [category, 'beginner'],
    components: [],
    historyStatus: 'pending',
    source: curatedSource,
  }),
)

export const STARTER_COMPONENT_GUIDES: Record<
  string,
  { components: MandarinComponent[]; history: string }
> = {
  说: {
    components: [
      {
        glyph: '讠',
        role: 'semantic',
        label: 'speech component',
        meaning: 'speech; language',
        note: 'The simplified left-side form of 言 points toward the meaning domain.',
      },
      {
        glyph: '兑',
        role: 'phonetic',
        label: 'sound component',
        note: 'This side primarily supplies a historical sound clue rather than a second definition.',
      },
    ],
    history:
      'Traditional 說 uses 言 on the left and 兌 as the phonetic element. Simplified 说 compresses 言 to 讠 and uses the simplified form 兑. The semantic/phonetic roles are more useful than a literal picture-story.',
  },
  妈: {
    components: [
      {
        glyph: '女',
        role: 'semantic',
        label: 'female component',
        meaning: 'woman; female',
      },
      {
        glyph: '马',
        role: 'phonetic',
        label: 'sound component',
        note: '馬/马 contributes the sound family, not the meaning “horse.”',
      },
    ],
    history:
      'Traditional 媽 combines 女 with phonetic 馬. Simplified 妈 keeps the same structure while simplifying 馬 to 马.',
  },
  请: {
    components: [
      {
        glyph: '讠',
        role: 'semantic',
        label: 'speech component',
        meaning: 'speech; language',
      },
      {
        glyph: '青',
        role: 'phonetic',
        label: 'sound component',
        note: '青 links 请 to a large phonetic family including 清 and 情.',
      },
    ],
    history:
      'Traditional 請 combines 言 with phonetic 青. Simplified 请 compresses 言 to 讠 while preserving 青.',
  },
  清: {
    components: [
      {
        glyph: '氵',
        role: 'semantic',
        label: 'water component',
        meaning: 'water; liquid',
      },
      {
        glyph: '青',
        role: 'phonetic',
        label: 'sound component',
      },
    ],
    history:
      '清 belongs to the common semantic-phonetic pattern: water 氵 identifies the meaning field and 青 supplies a sound clue.',
  },
  河: {
    components: [
      {
        glyph: '氵',
        role: 'semantic',
        label: 'water component',
        meaning: 'water; liquid',
      },
      {
        glyph: '可',
        role: 'phonetic',
        label: 'sound component',
      },
    ],
    history:
      '河 combines the water component 氵 with phonetic 可. The two sides do different jobs: meaning field on the left, historical sound clue on the right.',
  },
}

export const BUILT_IN_SET_TERMS: Record<string, string[]> = {
  numbers: [
    '零', '一', '二', '两', '三', '四', '五', '六', '七', '八', '九', '十', '百',
    '千', '万', '多少', '半', '一半', '元', '钱', '双倍',
  ],
  family: [
    '家', '家人', '爸爸', '妈妈', '父亲', '母亲', '哥哥', '姐姐', '弟弟', '妹妹',
    '儿子', '女儿', '爷爷', '奶奶', '孩子', '朋友',
  ],
  'food-drink': [
    '吃', '吃饭', '喝', '水', '茶', '牛奶', '米饭', '饭', '饭店', '面包', '鸡蛋',
    '水果', '菜', '杯子',
  ],
  animals: [
    '猫', '狗', '鸟', '鱼', '马', '牛', '鸡', '兔子', '老虎', '狮子', '熊', '熊猫',
    '猴子', '大象', '蛇', '龙', '老鼠', '猪', '羊', '鸭子',
  ],
  colors: [
    '红色', '蓝色', '绿色', '黄色', '黑色', '白色', '紫色', '粉红色', '橙色', '灰色',
    '白', '黑', '红', '蓝', '绿', '黄',
  ],
  'time-calendar': [
    '今天', '明天', '昨天', '现在', '时间', '小时', '上午', '下午', '晚上', '早上',
    '中午', '星期', '月', '年', '今年', '明年', '去年', '生日', '日期',
  ],
  'travel-places': [
    '车', '汽车', '火车', '飞机', '机场', '车站', '路', '地图', '医院', '学校',
    '商店', '商场', '饭店', '北京', '中国', '外国', '家', '房间',
  ],
  'everyday-actions': [
    '来', '去', '走', '跑', '看', '听', '说', '写', '读', '吃', '喝', '睡', '学习',
    '工作', '买', '找', '给', '拿', '坐', '站', '开', '关', '洗', '想', '知道',
  ],
  'questions-grammar': [
    '吗', '呢', '什么', '怎么', '谁', '哪', '哪儿', '哪里', '多少', '为什么', '的',
    '了', '着', '也', '都', '很', '不', '没', '没有', '有', '是', '在', '会', '能', '要',
  ],
  greetings: [
    '你好', '您好', '谢谢', '再见', '对不起', '没关系', '不客气', '请', '请问', '请进',
    '请坐', '早上', '晚上',
  ],
  casino: CURATED_SEEDS.filter((seed) => seed[3] === 'casino').map(
    (seed) => seed[0],
  ),
}

export const BUILT_IN_SET_META: Record<
  string,
  { label: string; description: string }
> = {
  numbers: {
    label: 'Numbers & money',
    description: 'Counting, quantities, prices, and the number language you use constantly.',
  },
  family: {
    label: 'Family & people',
    description: 'Family relationships and everyday people words.',
  },
  'food-drink': {
    label: 'Food & drink',
    description: 'Meals, drinks, ordering, and everyday kitchen vocabulary.',
  },
  animals: {
    label: 'Animals',
    description: 'The beginner-deck menagerie, from cats and dogs through pandas and dragons.',
  },
  colors: {
    label: 'Colors',
    description: 'Core color words in practical noun-friendly forms.',
  },
  'time-calendar': {
    label: 'Time & calendar',
    description: 'Days, dates, clock time, and words for past, present, and future.',
  },
  'travel-places': {
    label: 'Travel & places',
    description: 'Transport, directions, buildings, and common destinations.',
  },
  'everyday-actions': {
    label: 'Everyday actions',
    description: 'High-frequency verbs that make beginner sentences move.',
  },
  'questions-grammar': {
    label: 'Questions & glue words',
    description: 'Question words, particles, negation, and other high-frequency sentence machinery.',
  },
  greetings: {
    label: 'Greetings & practical phrases',
    description: 'Polite expressions and phrases that are useful immediately.',
  },
  casino: {
    label: 'Casino Mandarin',
    description: 'Dealer-facing bets, chips, cards, payouts, suits, table instructions, and customer phrases.',
  },
}
