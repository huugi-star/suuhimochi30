import type { CuriousConversation, DialogueBeat } from '../conversationTypes';

const say = (...texts: string[]): DialogueBeat[] => texts.map((text) => ({ text }));

const DAY02_CURIOUS_01: CuriousConversation = {
  id: 'DAY02_CURIOUS_01', day: 2, category: 'CURIOUS', title: '朝、さいしょにすること',
  opening: say(
    '人間さん。', 'ぼく、朝ってちょっと不思議だと思うの。',
    '空が明るくなっただけだと、まだ一日が始まった感じがしないの。',
    'ぼくが起きて、ベッドから出て。', '何かひとつすると、そこでやっと「今日になった」って感じがする。',
    '人間さんはどう？', '朝起きて、最初によくすることってなぁに？', '一個だけ教えて。',
  ),
  context: { humanRelations: ['FREQUENTLY_DOES'] },
  classification: {
    afterInput: say(
      '{word}。', '人間さんの朝には、{word}があるんだね。',
      'でも、ぼく名前だけ覚えても、たぶんあとで変な使い方するの。',
      'だからもう一個だけ知りたい。', '{word}って、どんなことの仲間なの？',
    ),
    afterSubcategory: say(
      'へえ、{word}って、そういう仲間なんだ。',
      'じゃあ次に{word}って聞いた時は、今よりちょっと分かるの。',
      '……明日の朝には忘れてたりして。', 'いや、そこは頑張って覚えるの。',
    ),
    openQuestions: [{ field: 'DETAIL', questionHint: '朝にそのことをどのようにするのか' }],
  },
  common: { response: [], choices: [] },
};

const DAY02_CURIOUS_02: CuriousConversation = {
  id: 'DAY02_CURIOUS_02', day: 2, category: 'CURIOUS', title: '元気がない時にすること',
  opening: say(
    'ねえ、人間さん。', 'ぼく、さっきちょっとだけ何もしたくない時間があったの。',
    '痛いとか、悲しいとかじゃなくて。', 'ただ、床に座って、ぼーっとしてたかったの。',
    'それで少ししたら、また歩きたくなった。', '人間さんにも、そういう時ある？',
    '元気が出ない時、少し楽になるためにすることってなぁに？',
  ),
  context: { humanRelations: ['USED_FOR'] },
  classification: {
    afterInput: say(
      '{word}。', '元気がない時に、{word}をすることがあるんだ。',
      'ぼく、元気がないなら寝ればいいって思ってたの。',
      'でも人間さんは、別のことをする時もあるんだね。', '{word}って、どんなことの仲間？',
    ),
    afterSubcategory: say(
      'なるほど。', '{word}は、そういう時にする、そういう仲間なんだね。',
      '元気になる方法って一個じゃないのか。',
      'ぼく、元気がない人に全員「寝るの！」って言うところだった。', 'ちょっと危なかったの。',
    ),
    openQuestions: [{ field: 'DETAIL', questionHint: '元気がない時にどのようにそのことをするのか' }],
  },
  common: { response: [], choices: [] },
};

const DAY02_CURIOUS_03: CuriousConversation = {
  id: 'DAY02_CURIOUS_03', day: 2, category: 'CURIOUS', title: 'つい何度も見ちゃうもの',
  opening: say(
    '人間さん。', 'ぼく、今日さっきから時計を何回も見てるの。',
    '一回見るでしょ。', 'ちょっと歩くでしょ。', 'また見るの。',
    'でも、そんなに時間変わってない。', '……時計に負けてる気がするの。',
    '人間さんにも、用事がなくても、つい何度も見ちゃうものってある？', '一個だけ教えて。',
  ),
  context: { humanRelations: ['FREQUENTLY_DOES'] },
  classification: {
    afterInput: say(
      '{word}。', '人間さんは、{word}を何回も見ちゃうんだね。',
      'でも、ぼくにはまだ{word}が何者なのか分からないの。',
      '人なのか。', 'ものなのか。', '見るものなのか。',
      '……見るものって言ったら、全部見るものか。', '{word}って、どんなものの仲間？',
    ),
    afterSubcategory: say(
      'ああ、そっちの仲間なんだ。',
      'じゃあ、人間さんが{word}を何度も見るって聞いても、前より想像できるの。',
      '今度ぼくも見つけたら、ちょっと見てみる。', '……何回も見るかは分からないけど。',
    ),
    openQuestions: [{ field: 'REASON', questionHint: 'なぜ何度も見てしまうのか' }],
  },
  common: { response: [], choices: [] },
};

const DAY02_CURIOUS_04: CuriousConversation = {
  id: 'DAY02_CURIOUS_04', day: 2, category: 'CURIOUS', title: '苦手なこと',
  opening: say(
    '人間さん。', '好きなものばっかり聞くのも、なんかずるい気がしてきたの。',
    '人間さんにも、苦手なことあるんでしょ？', 'ぼくだってあるの。',
    '知らないのに、知ってるつもりで話しちゃう時とか。',
    'かっこよく歩こうとして、変な歩き方になる時とか。',
    '……。', '思ったよりあるの。', 'もう数えないの。',
    '人間さんが「これはちょっと苦手」って思うこと、一個教えて。',
  ),
  context: { humanRelations: ['STRUGGLES_WITH'] },
  classification: {
    afterInput: say(
      '{word}。', '人間さんは、{word}が苦手なんだ。', 'でも「苦手」って言っても。',
      '仕事が苦手なのと、人と話すのが苦手なのと、運動が苦手なのって、たぶん違うよね。',
      '{word}は、どんなことの仲間？',
    ),
    afterSubcategory: say(
      'そっか。', 'じゃあ{word}は、そういう苦手なんだね。',
      'まだ「どうして苦手なのか」までは分からないけど。', '今日はそこまでにしておくの。',
      '一回で全部聞いたら、人間さんの中を勝手に大掃除してるみたいになるから。',
    ),
    openQuestions: [{ field: 'REASON', questionHint: 'どうして苦手なのか' }],
  },
  common: { response: [], choices: [] },
};

const DAY02_CURIOUS_05: CuriousConversation = {
  id: 'DAY02_CURIOUS_05', day: 2, category: 'CURIOUS', title: '得意なこと',
  opening: say(
    'ねえ、人間さん。', 'さっき苦手なこと聞いたでしょ。',
    'じゃあ反対も聞かないと、なんか不公平なの。',
    '人間さんが「これは得意」って思うこと、一個教えて。',
    'ちょっと自慢でもいいの。', 'ぼくも寝ることなら、かなり得意だと思ってるから。',
  ),
  context: { humanRelations: ['IS_GOOD_AT'] },
  classification: {
    afterInput: say(
      '{word}。', 'おお。', '人間さん、{word}が得意なの。',
      '……でも、ぼくはまだ{word}が何なのかちゃんと分かってない。',
      '知らないものを「すごいの！」って言ったら、適当にほめてるみたいになるの。',
      'それはちょっといやなの。', '{word}って、どんなことの仲間？',
    ),
    afterSubcategory: say(
      'なるほど。', 'じゃあ、人間さんはその仲間の{word}が得意なんだね。',
      '今度、もうちょっと分かるようになったら。',
      '本当にすごいのか、ぼくがちゃんと見きわめるの。',
      '何でもほめるわけじゃないからね。', '……でも今のところ、ちょっとすごそうなの。',
    ),
    openQuestions: [{ field: 'DETAIL', questionHint: '得意なことの中身はどのようなものか' }],
  },
  common: { response: [], choices: [] },
};

const DAY02_CURIOUS_06: CuriousConversation = {
  id: 'DAY02_CURIOUS_06', day: 2, category: 'CURIOUS', title: 'これから楽しみなこと',
  opening: say(
    '人間さん。', '今日、最後に一個だけ聞きたいの。',
    '昨日のぼくは、今日のこと知らなかったの。', 'でも今日になったら、ちゃんと今日が来た。',
    'じゃあ明日とか、その先にも。', 'まだ来てない何かがあるんだよね。',
    '人間さんは、これから楽しみにしてることってある？', '明日じゃなくてもいいの。', '一個だけ教えて。',
  ),
  context: { humanRelations: ['LOOKS_FORWARD_TO'] },
  classification: {
    afterInput: say(
      '{word}。', '人間さんは、{word}を楽しみにしてるんだね。',
      'まだ来てないのに、もう楽しいの。', '人間さんって、未来をちょっと先に楽しめるんだ。',
      'でも、ぼくにはまだ{word}がどんな楽しみなのか分からない。',
      '{word}って、どんなことの仲間？',
    ),
    afterSubcategory: say(
      'そっか。', 'じゃあ{word}は、そういう楽しみなんだね。',
      '今日だけで、人間さんの言葉がまた増えたの。', 'でも、名前と仲間を知っただけ。',
      '中身はまだ知らない。', '……それでいいの。',
      '全部今日知ったら、明日聞くことなくなっちゃうから。',
    ),
    openQuestions: [{ field: 'DETAIL', questionHint: 'どんな楽しみなのか' }],
  },
  common: { response: [], choices: [] },
};

export const DAY02_CURIOUS_CONVERSATIONS: readonly CuriousConversation[] = [
  DAY02_CURIOUS_01,
  DAY02_CURIOUS_02,
  DAY02_CURIOUS_03,
  DAY02_CURIOUS_04,
  DAY02_CURIOUS_05,
  DAY02_CURIOUS_06,
];
