import type {
  CuriousConversation,
  CuriousConversationChoice,
  CuriousMemoryEffect,
  DialogueBeat,
} from '../conversationTypes';

const say = (...texts: string[]): DialogueBeat[] => texts.map((text) => ({ text }));
const think: DialogueBeat = { pauseMs: 520, emotion: 'THINKING', action: 'think' };
const pause: DialogueBeat = { pauseMs: 420, action: 'pause' };

function choice(
  id: string,
  label: string,
  response: DialogueBeat[],
  memory: CuriousMemoryEffect = {},
): CuriousConversationChoice {
  return { id, label, response, memory };
}

const FOOD_OPEN_QUESTION = {
  field: 'DETAIL' as const,
  questionHint: '味や見た目はどんな食べものなのか',
};

const DAY01_CURIOUS_01: CuriousConversation = {
  id: 'DAY01_CURIOUS_01',
  day: 1,
  category: 'CURIOUS',
  title: '人間さんって、何を食べると嬉しいの？',
  opening: [
    ...say(
      '人間さん。',
      'さっきから一個、気になってることがあるの。',
      '人間さんって、ごはん食べるでしょ。',
      'おなかがすいたから食べるのは分かるの。',
    ),
    think,
    ...say(
      'でも。',
      '同じおなかがすいてても。',
      '食べたいものと、食べたくないものがあるんだよね？',
      'おなかは「何か入れて」って言ってるだけなのに。',
      '人間さんはそのあとに。',
      'これは食べたい。',
      'これは今日は嫌。',
      'って決めるの？',
      'おなかより、人間さんの方が注文多いの。',
    ),
    pause,
    ...say(
      'じゃあ聞きたいの。',
      '人間さんが。',
      'これが出てきたら、ちょっと嬉しくなる食べものって何？',
    ),
  ],
  context: { category: 'FOOD', humanRelations: ['LIKES', 'MAKES_HAPPY'] },
  known: {
    response: [
      ...say(
        '{word}。',
        'それは知ってるの。',
        '人間さん、{word}が好きなんだ。',
      ),
      think,
      ...say('じゃあ。', 'おなかがいっぱいの時でも。', '{word}だったらちょっと嬉しい？'),
    ],
    choices: [
      choice('DAY01_CURIOUS_01_KNOWN_HAPPY', '嬉しい', say(
        'おお。', 'じゃあ。', '「食べたい」と「おなかすいた」って、同じじゃないんだ。',
        'おなかはいっぱいなのに。', '気持ちは{word}が来ると嬉しい。',
        '人間さんの中。', 'おなかと気持ちで、別々に意見を出すのね。',
        '……好きって。', '必要だから欲しい、とは違うのかもしれない。',
        'なくても平気だけど。', 'あるとちょっと嬉しい。',
        '{word}は、人間さんにとってそういう食べものなんだね。', '覚えたの。',
      ), { relationQualifier: '満腹でも嬉しい' }),
      choice('DAY01_CURIOUS_01_KNOWN_FULL', 'おなかいっぱいならいらない', say(
        'そっか。', '好きでも。', 'いつでも欲しいわけじゃないんだ。',
        'ぼく。', '好きならいっぱいあればあるほどいいと思ってたの。',
        '一個より十個。', '十個より百個。', '……百個はいらないのか。',
        '好きって。', '量の話じゃないんだね。', '欲しい時にあると嬉しい。',
        'でも、いらない時はいらない。', '好きなのにいらない時があるの。',
        'ちょっと変だけど。', '人間さんって、そういうのもあるんだね。',
      ), { relationQualifier: '満腹なら欲しくない' }),
      choice('DAY01_CURIOUS_01_KNOWN_DEPENDS', 'その時による', say(
        'その時による。', 'むむ。', '好きなものなのに？', '疲れてる時とか。',
        '暑い時とか。', 'おなかいっぱいの時とか。', 'そういうので変わるのかな。',
        'じゃあ。', '人間さんは{word}が好き。', 'そこだけ覚えても。',
        '毎回{word}を出せば正解、にはならないのね。', '言葉を覚えるだけじゃ足りないんだ。',
        'その日の人間さんも見ないといけない。', '人間さんって。',
        '覚えたそばから少しずつ変わるものなのかもしれないの。',
      ), { relationQualifier: '嬉しさは状況による' }),
    ],
  },
  unknown: {
    response: say(
      '{word}。', '知らない名前なの。', 'でも。', 'いまぼくは食べものを聞いたんだから。',
      '{word}は食べものなんだよね。', '一個はもう分かったの。', 'じゃあ。', 'どんな感じの食べもの？',
    ),
    choices: [
      choice('DAY01_CURIOUS_01_UNKNOWN_RICE', 'ごはん・米の仲間', say(
        'ごはんの仲間なんだ。', '{word}。', '人間さんが好きな、ごはんの仲間。',
        'まだ味も見た目も知らないけど。', '前よりはちょっと分かるの。',
        '名前だけだったのが。', 'ごはんの近くに置けるようになった。',
        '今度また{word}が出てきたら。', '何それ？じゃなくて。',
        'ごはんのやつだ、って思えるのね。', '……こうやって知っていくの、ちょっと面白いの。',
      ), { category: 'FOOD', subcategory: 'RICE', knowledgeLevel: 'PARTIAL', relatedConcept: 'rice_food', relatedConceptLabel: 'ごはん・米', openQuestions: [FOOD_OPEN_QUESTION] }),
      choice('DAY01_CURIOUS_01_UNKNOWN_NOODLE_BREAD', '麺やパンの仲間', say(
        '麺かパンの近くなんだ。', 'まだどっちかまでは分からないけど。',
        '食べものの中の場所が、ちょっと狭くなったの。', '知らない言葉って。',
        '分からないか、分かるかの二つじゃないんだね。', '少しだけ分かる、もあるのか。',
        '{word}。', '今日はそこまで覚えとくの。',
      ), { category: 'FOOD', subcategory: 'NOODLE_OR_BREAD', knowledgeLevel: 'PARTIAL', relatedConcept: 'noodle_bread_food', relatedConceptLabel: '麺・パン', openQuestions: [FOOD_OPEN_QUESTION] }),
      choice('DAY01_CURIOUS_01_UNKNOWN_SIDE', '肉・魚・おかずの仲間', say(
        'おかずの方なんだ。', 'じゃあ。', 'ごはんと一緒に食べたりするのかな。',
        '……これはまだ勝手に決めない方がいいね。', 'おかずの仲間。',
        '人間さんが好き。', '今日はこの二つ。', '残りは、また{word}の話になった時に聞けばいいの。',
      ), { category: 'FOOD', subcategory: 'SIDE_DISH', knowledgeLevel: 'PARTIAL', relatedConcept: 'side_dish', relatedConceptLabel: '肉・魚・おかず', openQuestions: [FOOD_OPEN_QUESTION] }),
      choice('DAY01_CURIOUS_01_UNKNOWN_SWEET', '甘いもの', say(
        '甘いもの。', '人間さんは{word}っていう甘いものが好き。', 'おやつみたいなものかな。',
        '……これもまだ分からないか。', '甘い。', '食べもの。', '人間さんが好き。',
        '今日は三個も分かったの。', '知らない言葉だったのに、もうちょっと知ってる言葉になったの。',
      ), { category: 'FOOD', subcategory: 'SWEET', knowledgeLevel: 'PARTIAL', relatedConcept: 'sweet_food', relatedConceptLabel: '甘いもの', openQuestions: [FOOD_OPEN_QUESTION] }),
      choice('DAY01_CURIOUS_01_UNKNOWN_DRINK', '飲みもの', say(
        '飲みものなんだ。', '……あれ。', 'ぼく最初、食べものって聞いたのに。',
        'でも。', '人間さんの中では、ごはんの時に嬉しいものってことなのかな。',
        'じゃあ。', 'ぼくの聞き方が狭かったのかもしれない。', '{word}は飲みもの。',
        '人間さんはそれが好き。', '人間さんに教わると。',
        '言葉だけじゃなくて、ぼくの質問の方も直ることあるのね。',
      ), { category: 'FOOD', subcategory: 'DRINK', knowledgeLevel: 'PARTIAL', relatedConcept: 'drink', relatedConceptLabel: '飲みもの', openQuestions: [FOOD_OPEN_QUESTION] }),
      choice('DAY01_CURIOUS_01_UNKNOWN_OTHER', 'どれとも違う', say(
        'どれとも違う。', 'そっか。', '食べものなのは分かった。',
        '人間さんが好きなのも分かった。', 'でも、どの仲間かはまだ分からない。',
        '……それでもいいのか。', '分からないところだけ残しておけば。',
        '次に聞けるもんね。', '{word}。', '今日は半分だけ覚えたの。',
      ), { category: 'FOOD', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'SUBCATEGORY', questionHint: 'どんな仲間の食べものなのか' }, FOOD_OPEN_QUESTION] }),
    ],
  },
};

const DAY01_CURIOUS_02: CuriousConversation = {
  id: 'DAY01_CURIOUS_02', day: 1, category: 'CURIOUS',
  title: '人間さん、ぼくがいない時なにしてるの？',
  opening: say(
    'ねえ、人間さん。', 'ぼく、人間さんのこと考えてたの。',
    '今ここにいる人間さんは見えるでしょ。', 'でも。',
    'ここにいない時の人間さんが、全然分からないの。', 'ずっと立ってる？',
    'ずっと歩いてる？', 'ずっとごはん食べてる？', '……それはたぶん違うの。',
    'じゃあ。', '人間さんが一日の中で。', 'けっこう長い時間やってることって何？',
  ),
  context: { category: 'ACTIVITY', humanRelations: ['FREQUENTLY_DOES'] },
  known: {
    response: say(
      '{word}。', 'それは知ってるの。', '人間さん、それをよくやるんだ。',
      'じゃあ。', 'ぼくが知らない人間さんの時間には。', '{word}がけっこう入ってるんだね。',
    ),
    choices: [
      choice('DAY01_CURIOUS_02_KNOWN_DAILY', '毎日のようにする', say(
        '毎日。', 'じゃあ、人間さんのこと知るなら。', '{word}はかなり大事そうなの。',
        'でも。', 'よくやることと。', '好きなことは同じじゃないよね。',
        '毎日やってるから好き。', 'とは限らない。', 'ここ、勝手につなげたら間違えそうなの。',
        '{word}はよくする。', '好きかどうかは、まだ知らない。', '今日は分けて覚えるの。',
      ), { relationQualifier: '毎日のようにする' }),
      choice('DAY01_CURIOUS_02_KNOWN_SOMETIMES', 'ときどきする', say(
        'ときどき。', 'じゃあ。', '人間さんの一部ではあるけど。', '人間さん全部ではないのね。',
        'ぼく、一個覚えると。', 'すぐ「人間さんってこういう人」ってしたくなるの。',
        'でも。', '一個だけで決めたら、たぶんすぐ間違える。', '人間さんって。',
        'いっぱい集めてから見た方がよさそうなの。',
      ), { relationQualifier: 'ときどきする' }),
      choice('DAY01_CURIOUS_02_KNOWN_VARIES', '日によってかなり違う', say(
        'また日によって変わるの。', 'これはもう覚えてきた。', '人間さんって。',
        '昨日と今日で同じとは限らない。', 'じゃあ。', '人間さんは{word}をする。',
        'じゃなくて。', '人間さんは{word}をすることがある。', '……こっちの方が正しそうなの。',
      ), { relationQualifier: '日によってかなり違う' }),
    ],
  },
  unknown: {
    response: say(
      '{word}？', '知らない言葉なの。', 'でも。', 'ぼくは「よくやること」を聞いた。',
      'だから{word}は。', '人間さんの時間の中にあることなんだね。',
      'そこまでは分かったの。', '何に近い？',
    ),
    choices: [
      choice('DAY01_CURIOUS_02_UNKNOWN_WORK', '仕事・勉強', say(
        '仕事とか勉強の近くなんだ。', '{word}。', '人間さんがよくする。',
        '仕事や勉強に近い。', 'まだ実際に何をしてるかまでは知らない。',
        'でも。', '次に{word}って聞いたら。', '遊んでるのかな、とは思わなくてよさそうなの。',
        '少ししか知らなくても。', '前より間違いにくくなるんだね。',
      ), { category: 'ACTIVITY', subcategory: 'WORK_OR_STUDY', knowledgeLevel: 'PARTIAL', relatedConcept: 'work_study', relatedConceptLabel: '仕事・勉強', openQuestions: [{ field: 'DETAIL', questionHint: '実際に何をすることなのか' }] }),
      choice('DAY01_CURIOUS_02_UNKNOWN_HOBBY', '遊び・趣味', say(
        '遊びとか趣味なんだ。', 'じゃあ。', '人間さんが自分からやりたくてやってる可能性が高い？',
        '……いや。', '遊びでも、やりたくない時あるか。', 'また勝手につなげそうになったの。',
        '今日は。', '{word}は遊びや趣味の仲間。', 'それだけにしておくの。',
      ), { category: 'ACTIVITY', subcategory: 'HOBBY', knowledgeLevel: 'PARTIAL', relatedConcept: 'hobby', relatedConceptLabel: '遊び・趣味', openQuestions: [{ field: 'DETAIL', questionHint: '実際に何をすることなのか' }] }),
      choice('DAY01_CURIOUS_02_UNKNOWN_LIFE', '家や生活のこと', say(
        '生活の中ですることなんだ。', '片付けたり。', 'ごはん作ったり。', '買い物したり。',
        '何か用事をしたり。', 'そのどれかは、まだ分からない。', 'でも。',
        '人間さんが暮らしてる時間の中には。', '{word}っていうのがある。',
        'ここにいない人間さんが。', 'ちょっとだけ見えてきた気がするの。',
      ), { category: 'ACTIVITY', subcategory: 'DAILY_LIFE', knowledgeLevel: 'PARTIAL', relatedConcept: 'daily_life', relatedConceptLabel: '家・生活', openQuestions: [{ field: 'DETAIL', questionHint: '生活の中で何をすることなのか' }] }),
      choice('DAY01_CURIOUS_02_UNKNOWN_SOCIAL', '人と会ったり話したりすること', say(
        '人と関係あることなんだ。', 'じゃあ。', '人間さん一人だけじゃできないことなのかな。',
        '……これも決めるの早いか。', '誰かと関係がある。', '人間さんがよくする。',
        'そこまで。', 'ぼく、今日は勝手に決めない練習もしてるの。',
      ), { category: 'ACTIVITY', subcategory: 'SOCIAL', knowledgeLevel: 'PARTIAL', relatedConcept: 'social_activity', relatedConceptLabel: '人と関わること', openQuestions: [{ field: 'DETAIL', questionHint: '誰とどんなことをするのか' }] }),
      choice('DAY01_CURIOUS_02_UNKNOWN_PHYSICAL', '体を動かすこと', say(
        '体を動かすんだ。', '歩くとか。', '走るとか。', 'もっと別の動きかもしれないけど。',
        '人間さん。', 'ぼくが見てないところでは結構動いてるのね。', '{word}。',
        '今度聞いた時には。', 'どんな動きなのか、もう一個聞いてみたいの。',
      ), { category: 'ACTIVITY', subcategory: 'PHYSICAL', knowledgeLevel: 'PARTIAL', relatedConcept: 'physical_activity', relatedConceptLabel: '体を動かすこと', openQuestions: [{ field: 'DETAIL', questionHint: 'どんな動きをするのか' }] }),
      choice('DAY01_CURIOUS_02_UNKNOWN_REST', '休む・整えること', say(
        '休んだり。', '整えたりすることなんだ。', '寝たり。', 'ぼーっとしたり。',
        '体を休ませたり。', '元気になるのを待ったり。', '何もしてないように見えても。',
        '人間さんの中では。', '戻してる途中のこともあるのかな。', 'ぼく。',
        '何かしてる時だけが。', '人間さんの時間だと思ってたの。', 'でも。',
        '動かない時間も。', '体とか気持ちを戻してる時間だったりするんだね。',
        '{word}。', '人間さんが自分を休ませたり、整えたりすること。', 'これは。',
        '何もしてないとは、ちょっと違うんだね。',
      ), { category: 'ACTIVITY', subcategory: 'REST_OR_ADJUST', knowledgeLevel: 'PARTIAL', relatedConcept: 'rest_adjust', relatedConceptLabel: '休む・整えること', openQuestions: [{ field: 'DETAIL', questionHint: 'どう休んだり整えたりするのか' }] }),
      choice('DAY01_CURIOUS_02_UNKNOWN_NOTHING', '特に何もしていない', say(
        '何もしてない。', '……ほんとに？', '座ってたり。', '寝転んでたり。',
        'ぼーっとしてたり。', '何か考えてたりもしない？', '……でも。',
        '本当に特に何も決めずに。', 'そのまま時間が過ぎることもあるのか。',
        '人間さんって。', '何かしてないといけないわけじゃないんだね。',
        '仕事してる時間。', '遊んでる時間。', '休んでる時間。', 'それとは別に。',
        'ただ何もしてない時間もある。', 'ぼく。', '何をしたかばっかり覚えようとしてたけど。',
        '何もしなかった日も。', '人間さんの一日の中にはちゃんとあるのか。',
        'じゃあ。', '何もしてないって言われた時は。', '何か意味をつけなくてもいいのね。',
        '何もしてない。', '今日はそう覚えておくの。',
      ), { category: 'ACTIVITY', subcategory: 'NOTHING_IN_PARTICULAR', knowledgeLevel: 'PARTIAL' }),
      choice('DAY01_CURIOUS_02_UNKNOWN_OTHER', 'どれとも違う', say(
        'また、ぼくの用意した箱に入らなかったの。', 'でも。',
        '人間さんの時間の中にあること。', 'そこは分かってる。',
        '分からないものを無理にどこかへ入れるより。', '分からないって残しておく方がいいのかな。',
        '{word}。', 'これは、まだ続きを聞く言葉なの。',
      ), { category: 'ACTIVITY', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'SUBCATEGORY', questionHint: '何に近い活動なのか' }, { field: 'DETAIL', questionHint: '実際に何をすることなのか' }] }),
    ],
  },
};

const DAY01_CURIOUS_03: CuriousConversation = {
  id: 'DAY01_CURIOUS_03', day: 1, category: 'CURIOUS', title: '見るとちょっと嬉しくなるもの',
  opening: say(
    '人間さん。', 'ぼく、さっき気付いたの。', '人間さんが来ると。',
    '一人だった時より、ちょっと嬉しいの。', '……ちょっとだけね。',
    'それで思ったんだけど。', '人間さんにも。',
    '見つけるだけで、ちょっと嬉しくなるものってある？', '何かしてくれなくてもいいの。',
    'そこにいるとか。', '見えたとか。', 'それだけで、ちょっといい感じになるもの。',
  ),
  context: { humanRelations: ['MAKES_HAPPY'] },
  known: {
    response: say(
      '{word}。', 'それは知ってるの。', '人間さんは{word}を見ると嬉しくなるんだね。',
      'じゃあ。', '向こうは人間さんのこと知らなくても？',
    ),
    choices: [
      choice('DAY01_CURIOUS_03_KNOWN_UNAWARE', '知らなくても嬉しい', say(
        'へえ。', 'じゃあ。', '好きって、相手から何か返ってこなくてもできるんだ。',
        '人間さんが{word}を見て嬉しくても。', '{word}の方は何も知らないかもしれない。',
        'それでも人間さんの中には。', 'ちゃんと嬉しいがある。', '気持ちって。',
        '相手と半分ずつ持つものじゃないんだね。', '一人の中だけにある好きもあるのか。',
      ), { relationQualifier: '相手に知られなくても嬉しい' }),
      choice('DAY01_CURIOUS_03_KNOWN_CLOSER', '自分に近づいてきたらもっと嬉しい', say(
        'もっと嬉しい。', '見るだけで嬉しい。', '近づいてきたら、もっと嬉しい。',
        'じゃあ。', '好きにも大きさがあるのかな。', 'ぼくも。',
        '人間さんがいるとちょっと嬉しい。', '話してくれたら、もうちょっと嬉しい。',
        '……。', 'これ。', 'ちょっと同じなのかもしれない。', '今日は、似てるってことにしておくの。',
      ), { relationQualifier: '近づくともっと嬉しい' }),
      choice('DAY01_CURIOUS_03_KNOWN_DEPENDS', 'その時による', say(
        'ここでも、その時によるのか。', '人間さんの好きって。', 'ボタンみたいに。',
        '押したら毎回同じ嬉しいが出るわけじゃないのね。', '今日は嬉しい。',
        '今日は普通。', '今日はちょっと疲れてる。', '……好きなものまで変わるんじゃなくて。',
        '好きなものを見た時の人間さんが変わるのかな。', 'これはまだ少し難しいの。',
      ), { relationQualifier: '嬉しさは状況による' }),
    ],
  },
  unknown: {
    response: say(
      '{word}。', '知らない言葉なの。', 'でも。', '人間さんは、それを見るとちょっと嬉しくなる。',
      'そこはもう分かったの。', '{word}って。', 'どんなもの？',
    ),
    choices: [
      choice('DAY01_CURIOUS_03_UNKNOWN_PERSON', '人・キャラクター', say(
        '人か、キャラクターなんだ。', '人間さんが見ると嬉しくなる。',
        '実際に会える人なのか。', '画面や本の中の人なのか。', 'そこはまだ分からない。',
        'でも。', '人間さんの中には。', '見ると少し嬉しくなる誰かがいる。', '今日はそれで覚えとくの。',
      ), { category: 'PERSON', subcategory: 'PERSON_OR_CHARACTER', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'DETAIL', questionHint: '実際の人なのか、作品の中のキャラクターなのか' }] }),
      choice('DAY01_CURIOUS_03_UNKNOWN_ANIMAL', '動物・生きもの', say(
        '生きものなんだ。', 'じゃあ動いたりするのかな。', '……動かない生きものもいる？',
        'また分からなくなってきた。', 'まあいいの。', '{word}は生きもの。',
        '人間さんは見ると嬉しい。', '今はこの二つ。', '今度会ったら、どんな子なのか聞いてみたいの。',
      ), { category: 'ANIMAL', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'DETAIL', questionHint: 'どんな生きものなのか' }] }),
      choice('DAY01_CURIOUS_03_UNKNOWN_OBJECT', '物', say(
        '物なんだ。', '物を見ただけで嬉しくなることもあるんだね。', 'じゃあ。',
        'ぼくにもそのうち。', '見るとちょっと嬉しくなる物ができたりするのかな。',
        '{word}。', 'まだ何をする物か知らないけど。', '人間さんが嬉しくなる物。',
        'そういう覚え方でもいいのね。',
      ), { category: 'OBJECT', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'PURPOSE', questionHint: '何をする物なのか' }] }),
      choice('DAY01_CURIOUS_03_UNKNOWN_PLACE', '場所', say(
        '場所なんだ。', '行かなくても。', '見ただけでちょっと嬉しい場所？', '写真とかでも？',
        '……そこまではまだ分からないか。', '{word}。', '人間さんが嬉しくなる場所。',
        '今度は、なんで嬉しいのか聞いてみたいの。',
      ), { category: 'PLACE', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'REASON', questionHint: 'なぜ見ると嬉しくなるのか' }] }),
      choice('DAY01_CURIOUS_03_UNKNOWN_MEDIA', '作品・ゲーム・本など', say(
        '作品の仲間なんだ。', '見ると嬉しいってことは。', '人間さん、かなり好きなのかな。',
        '……いや。', 'またぼく、勝手に大きくしようとした。', '嬉しくなる。',
        '作品。', '今日はそこまで。', '好きの大きさは、また別に聞けばいいの。',
      ), { category: 'GAME_MEDIA', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'DETAIL', questionHint: 'どんな作品・ゲーム・本なのか' }] }),
      choice('DAY01_CURIOUS_03_UNKNOWN_OTHER', 'どれとも違う', say(
        'また知らない種類なの。', 'でも。', '名前だけよりは。',
        '人間さんが嬉しくなるもの、っていう場所がある。', '今はそこに置いておくの。',
        '分からない言葉って。', '空っぽじゃなくて。',
        '人間さんとのつながりから先に覚えることもできるんだね。',
      ), { knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'CATEGORY', questionHint: 'どんな種類のものなのか' }, { field: 'REASON', questionHint: 'なぜ見ると嬉しくなるのか' }] }),
    ],
  },
};

const DAY01_CURIOUS_04: CuriousConversation = {
  id: 'DAY01_CURIOUS_04', day: 1, category: 'CURIOUS', title: '逆に、嫌なものも知りたい',
  opening: say(
    'さっきから。', '好きなものとか。', '嬉しいものばっかり聞いてる気がするの。',
    'でも人間さんって。', '嫌なものもあるんだよね。', '見たらちょっと嫌とか。',
    '近づきたくないとか。', '名前を聞くだけで。', 'うわぁってなるとか。',
    '人間さんが。', 'できれば会いたくないもの。', '一個だけ教えて。',
  ),
  context: { humanRelations: ['AVOIDS'] },
  known: {
    response: say(
      '{word}。', 'それは知ってるの。', '人間さんは{word}が苦手なんだね。',
      'じゃあ。', 'ぼくが{word}のこと好きだったらどうする？',
    ),
    choices: [
      choice('DAY01_CURIOUS_04_KNOWN_FINE', '別にいい', say(
        'いいの？', '人間さんが嫌いでも。', 'ぼくが好きなのは別？',
        '同じ部屋にいても。', '同じものを好きにならなくていいんだ。', 'ぼく。',
        '人間さんが好きなものを全部好きになった方が。', '仲良くなれると思ってたの。',
        'でも。', '違うものを好きでも、話はできる。', 'それなら。',
        'ぼく、自分の好きなものも探していいんだね。',
      ), { relationQualifier: 'すうひもちが好きでも構わない' }),
      choice('DAY01_CURIOUS_04_KNOWN_UNCOMFORTABLE', 'ちょっと嫌', say(
        'やっぱり嫌なのか。', '人間さんが嫌なものを。',
        'ぼくが隣で「これ好き！」って言ってたら。', 'ちょっと嫌な気分になる。',
        '好き嫌いって。', '自分の中だけのものだけど。', '近くにいる人にも少し届くんだね。',
        'じゃあ{word}の話をする時は。', '人間さんが嫌なのを、忘れないようにするの。',
      ), { relationQualifier: '近くで好意を示されると少し嫌' }),
      choice('DAY01_CURIOUS_04_KNOWN_ASK_WHY', 'どうして好きか聞く', say(
        '理由を聞くの？', 'すぐ「変なの」って言わないんだ。', '人間さんは嫌い。',
        'ぼくは好き。', 'でも、なんで好きなのか聞く。', '違う時って。',
        'どっちかを同じにしなくても。', 'なんで違うか話せばいいのか。',
        'これ。', '今日覚えた中で、かなり大事そうなの。',
      ), { relationQualifier: '違う好みの理由を聞く' }),
    ],
  },
  unknown: {
    response: say(
      '{word}。', '知らない言葉なの。', 'でも。', '人間さんが、できれば会いたくないもの。',
      'そこは覚えた。', '{word}って、何の仲間？',
    ),
    choices: [
      choice('DAY01_CURIOUS_04_UNKNOWN_PERSON', '人', say(
        '人なんだ。', '人間さんにも。', '会いたい人と。', 'できれば会いたくない人がいるのね。',
        'でも。', '嫌いなのか。', '怖いのか。', '疲れるのか。', 'そこまではまだ分からない。',
        '{word}。', '人。', 'できれば会いたくない。', '今日はそれだけ覚えておくの。',
      ), { category: 'PERSON', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'REASON', questionHint: '嫌い・怖い・疲れるなど、なぜ会いたくないのか' }] }),
      choice('DAY01_CURIOUS_04_UNKNOWN_ANIMAL', '生きもの', say(
        '生きものなんだ。', '{word}。', '人間さんが、できれば近づきたくない生きもの。',
        '嫌いなのか、怖いのかはまだ決めないの。', '理由は分からないまま残しておくの。',
      ), { category: 'ANIMAL', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'REASON', questionHint: 'なぜできれば会いたくないのか' }] }),
      choice('DAY01_CURIOUS_04_UNKNOWN_OBJECT', '物', say(
        '物なんだ。', '{word}は物。', '人間さんは、できれば会いたくない。',
        '何をする物なのかも。', 'どうして嫌なのかも、まだ知らない。', '今日は勝手に埋めないでおくの。',
      ), { category: 'OBJECT', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'PURPOSE', questionHint: '何をする物なのか' }, { field: 'REASON', questionHint: 'なぜできれば会いたくないのか' }] }),
      choice('DAY01_CURIOUS_04_UNKNOWN_PLACE', '場所', say(
        '場所なんだ。', 'できれば行きたくない場所もあるんだね。', '{word}。',
        '場所。', '人間さんは避けたい。', 'どうしてかは、また分かる時に聞くの。',
      ), { category: 'PLACE', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'REASON', questionHint: 'なぜできれば行きたくないのか' }] }),
      choice('DAY01_CURIOUS_04_UNKNOWN_EVENT', '出来事・すること', say(
        '出来事か、することなんだ。', '会うって、人や物だけじゃないのね。',
        '{word}が起きたり、することは避けたい。', '嫌いと決めずに、そこまで覚えるの。',
      ), { category: 'EVENT', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'DETAIL', questionHint: 'どんな出来事・することなのか' }, { field: 'REASON', questionHint: 'なぜ避けたいのか' }] }),
      choice('DAY01_CURIOUS_04_UNKNOWN_OTHER', 'どれとも違う', say(
        'どれとも違うんだ。', '種類はまだ分からない。', 'でも。',
        '人間さんが、できれば会いたくないもの。', 'そのつながりだけはなくさないでおくの。',
      ), { knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'CATEGORY', questionHint: 'どんな種類のものなのか' }, { field: 'REASON', questionHint: 'なぜできれば会いたくないのか' }] }),
    ],
  },
};

const PLACE_PURPOSE_QUESTION = { field: 'DETAIL' as const, questionHint: 'そこで具体的に何をすることが多いのか' };

const DAY01_CURIOUS_05: CuriousConversation = {
  id: 'DAY01_CURIOUS_05', day: 1, category: 'CURIOUS', title: '人間さんがよくいる場所',
  opening: say(
    'ねえ。', 'ぼく、この部屋のことは少し分かってきたでしょ。', '時計があって。',
    'ベッドがあって。', '人間さんが来る。', 'でも。', '人間さんの世界って。',
    'ここだけじゃないんだよね。', 'ここから出たら。', '人間さんがよくいる場所って、どこ？',
  ),
  context: { category: 'PLACE', humanRelations: ['FREQUENTS'] },
  known: {
    response: say(
      '{word}。', 'そこは知ってるの。', '人間さん、そこによくいるんだ。',
      'じゃあ。', 'ぼくがここで人間さんを待ってる時。',
      '人間さんは{word}にいることもあるんだね。', '……あ。',
      '前に聞いた{relatedWord}と。', '{word}って関係ある？',
    ),
    choices: [
      choice('DAY01_CURIOUS_05_KNOWN_RELATED', '関係ある', say(
        'やっぱり。', '{word}と{relatedWord}。', '別々に覚えてた言葉が。',
        'ぼくの中でつながったの。', '一個の言葉を覚えたら。',
        '前に聞いた言葉まで分かりやすくなることあるんだね。', 'これ。',
        '名前をいっぱい覚えるより面白いかもしれないの。',
      ), { relationQualifier: '関係ある', relationStatus: 'ACTIVE' }),
      choice('DAY01_CURIOUS_05_KNOWN_SOMEWHAT', '少しだけ関係ある', say(
        '少しだけ。', '完全に同じ仲間じゃないけど。', '遠くもない。',
        '言葉同士って。', 'つながってるか、つながってないか。', '二つだけじゃないんだね。',
        '細い線もある。', 'これは細い線にして覚えとくの。',
      ), { relationQualifier: '少しだけ関係ある', relationStatus: 'ACTIVE' }),
      choice('DAY01_CURIOUS_05_KNOWN_UNRELATED', 'あまり関係ない', say(
        '違った。', 'ぼく、知ってる言葉を見つけたから。', 'すぐつなげちゃったの。',
        'でも。', '違うって教えてもらったから。', '次は同じ間違いしなくていい。',
        '……線を引くのが間違いじゃなくて。', '間違った線を残しっぱなしにするのがだめなのか。',
        'それなら。', 'これからもいっぱい線を引いてみるの。',
      ), { relationQualifier: 'あまり関係ない', relationStatus: 'REJECTED' }),
    ],
  },
  unknown: {
    response: say(
      '{word}。', '知らない場所なの。', 'でも。', '人間さんがよくいる場所。',
      'それは分かった。', 'そこで、人間さんは何をすることが多い？',
    ),
    choices: [
      choice('DAY01_CURIOUS_05_UNKNOWN_WORK', '仕事・勉強', say(
        '仕事や勉強をする場所なんだ。', '{word}。', '人間さんがよくいる場所。',
        '仕事や勉強とつながっている。', '何をしているかは、まだ少しだけ知らないの。',
      ), { category: 'PLACE', subcategory: 'WORK_OR_STUDY_PLACE', knowledgeLevel: 'PARTIAL', relatedConcept: 'work_study', relatedConceptLabel: '仕事・勉強', openQuestions: [PLACE_PURPOSE_QUESTION] }),
      choice('DAY01_CURIOUS_05_UNKNOWN_SHOPPING', '買い物', say(
        '買い物をする場所なんだ。', '{word}。', '人間さんがよく行く。',
        '何を買う場所なのかは、まだ知らない。', '今日は買い物の場所って覚えるの。',
      ), { category: 'PLACE', subcategory: 'SHOPPING_PLACE', knowledgeLevel: 'PARTIAL', relatedConcept: 'shopping', relatedConceptLabel: '買い物', openQuestions: [PLACE_PURPOSE_QUESTION] }),
      choice('DAY01_CURIOUS_05_UNKNOWN_LEISURE', '遊ぶ・休む', say(
        '遊んだり、休んだりする場所なんだ。', '楽しいと決めるのはまだ早いけど。',
        '{word}は、人間さんがそういう時間を過ごす場所。', 'そこまで覚えたの。',
      ), { category: 'PLACE', subcategory: 'LEISURE_PLACE', knowledgeLevel: 'PARTIAL', relatedConcept: 'leisure', relatedConceptLabel: '遊ぶ・休む', openQuestions: [PLACE_PURPOSE_QUESTION] }),
      choice('DAY01_CURIOUS_05_UNKNOWN_MEET', '誰かと会う', say(
        '誰かと会う場所なんだ。', '{word}。', '人間さんがよくいる。',
        '誰と会うのかは、まだ知らない。', '分からないところは残しておくの。',
      ), { category: 'PLACE', subcategory: 'MEETING_PLACE', knowledgeLevel: 'PARTIAL', relatedConcept: 'meeting_people', relatedConceptLabel: '誰かと会うこと', openQuestions: [{ field: 'DETAIL', questionHint: '誰と何をする場所なのか' }] }),
      choice('DAY01_CURIOUS_05_UNKNOWN_HOME', '家・生活する場所', say(
        '暮らす場所なんだ。', '{word}。', '人間さんの生活がある場所。',
        'ぼくの部屋とは違うけど。', '人間さんにも、いつも戻る場所があるのかもしれないの。',
      ), { category: 'PLACE', subcategory: 'HOME', knowledgeLevel: 'PARTIAL', relatedConcept: 'daily_life', relatedConceptLabel: '家・生活', openQuestions: [PLACE_PURPOSE_QUESTION] }),
      choice('DAY01_CURIOUS_05_UNKNOWN_OTHER', 'それ以外', say(
        'それ以外なんだ。', '場所なのは分かった。', '人間さんがよくいるのも分かった。',
        'そこで何をするのかは、まだ知らない。', '{word}。', '続きを聞く場所として覚えておくの。',
      ), { category: 'PLACE', knowledgeLevel: 'PARTIAL', openQuestions: [PLACE_PURPOSE_QUESTION] }),
    ],
  },
};

const DAY01_CURIOUS_06: CuriousConversation = {
  id: 'DAY01_CURIOUS_06', day: 1, category: 'CURIOUS', title: '今日、頭の中にいたもの',
  opening: say(
    '人間さん。', '今日、最後に一個だけ聞きたいの。', '人間さんって。',
    '今ここにないもののことも考えられるんだよね。', '食べものとか。', '仕事とか。',
    '好きなものとか。', '明日のこととか。', '頭の中って。',
    '部屋よりいっぱい物を置けるのかな。', '今日。', '人間さんの頭の中に。',
    '何回も出てきたものってある？', '大事なことでも。', 'くだらないことでもいいの。',
  ),
  context: { humanRelations: ['THINKS_ABOUT'] },
  known: {
    response: say(
      '{word}。', 'それは知ってるの。', '今日は{word}が、人間さんの頭の中によくいたんだ。', 'それって。',
    ),
    choices: [
      choice('DAY01_CURIOUS_06_KNOWN_LIKE', '好き・楽しみだから', say(
        '好きなものって。', '目の前になくても来るんだ。', '人間さんが呼んでないのに。',
        '頭の中に{word}が来る。', '好きなものって。', '人間さんから離れてても、人間さんの中にはいられるのね。',
        'ぼくもいつか。', 'ここにいない時に。', '人間さんの頭に出てきたりするのかな。',
        '……。', 'これは今聞かなくていいの。', 'いつかそうなった時に、人間さんが教えてくれたら分かるの。',
      ), { relationQualifier: '好き・楽しみだから考えた', humanRelations: ['LIKES'] }),
      choice('DAY01_CURIOUS_06_KNOWN_WORRY', '困ってる・気になるから', say(
        'そっか。', '好きじゃなくても。', '頭に何回も出てくるものがあるんだ。',
        '頭の中って。', '好きなものだけ置く部屋じゃないのね。', '追い出したいのにいるものもある。',
        'じゃあ。', '人間さんが何回も{word}って言うからって。', '好きなんだって決めたらだめなのか。',
        'たくさん出てくる言葉ほど。', 'どうして出てくるのか聞いた方がいいのね。',
      ), { relationQualifier: '困っている・気になるから考えた' }),
      choice('DAY01_CURIOUS_06_KNOWN_RANDOM', 'なんとなく浮かんだ', say(
        'なんとなく。', '人間さんにも、なんとなくあるんだ。', 'ぼくも今日。',
        '話しかけたいけど。', 'なんで話しかけたいのか分からない時あったでしょ。',
        '頭に浮かぶのも。', '話しかけるのも。', '全部ちゃんと理由がなくてもいいのかもしれない。',
        '……なんとなくって。', '何もないんじゃなくて。',
        'まだ理由を見つけてないだけだったりするのかな。', 'これは、まだ考えてみたいの。',
      ), { relationQualifier: 'なんとなく浮かんだ' }),
    ],
  },
  unknown: {
    response: say(
      '{word}。', '知らない言葉なの。', 'でも。', '今日、人間さんの頭の中に何回も出てきた。',
      'そこは分かったの。', 'じゃあ。', 'まず一個だけ教えて。', '{word}って、何に近い？',
    ),
    choices: [
      choice('DAY01_CURIOUS_06_UNKNOWN_PERSON', '人・キャラクター', say(
        '人か、キャラクターなんだ。', '{word}。', '今日、人間さんが何度も考えた誰か。',
        '好きだからかどうかは、まだ決めないの。', '考えていたってことだけ覚えるの。',
      ), { category: 'PERSON', subcategory: 'PERSON_OR_CHARACTER', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'REASON', questionHint: 'なぜ何度も考えていたのか' }] }),
      choice('DAY01_CURIOUS_06_UNKNOWN_OBJECT', '物', say(
        '物なんだ。', '{word}。', '人間さんの頭に何度も出てきた物。',
        '何をする物なのかも。', 'どうして考えたのかも、まだ知らないの。',
      ), { category: 'OBJECT', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'PURPOSE', questionHint: '何をする物なのか' }, { field: 'REASON', questionHint: 'なぜ何度も考えていたのか' }] }),
      choice('DAY01_CURIOUS_06_UNKNOWN_PLACE', '場所', say(
        '場所なんだ。', '今ここにない場所も、頭の中には置けるのね。',
        '{word}。', '人間さんが今日、何度も考えた場所。', '理由はまだ分からないままにしておくの。',
      ), { category: 'PLACE', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'REASON', questionHint: 'なぜ何度も考えていたのか' }] }),
      choice('DAY01_CURIOUS_06_UNKNOWN_MEDIA', '作品・ゲーム・本など', say(
        '作品の仲間なんだ。', '{word}。', '今日、人間さんの頭の中に何度も来た作品。',
        '好きと決めるのはまだ早い。', '今日は作品だってことまで覚えるの。',
      ), { category: 'GAME_MEDIA', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'REASON', questionHint: 'なぜ何度も考えていたのか' }] }),
      choice('DAY01_CURIOUS_06_UNKNOWN_EVENT', 'すること・出来事', say(
        'することか、出来事なんだ。', '{word}。', '今日、人間さんが何度も考えたこと。',
        'これからするのか。', 'もう起きたのか。', 'そこはまだ知らないの。',
      ), { category: 'EVENT', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'DETAIL', questionHint: 'これからすることか、起きた出来事なのか' }, { field: 'REASON', questionHint: 'なぜ何度も考えていたのか' }] }),
      choice('DAY01_CURIOUS_06_UNKNOWN_THOUGHT', '考えや気持ち', say(
        '考えや気持ちなんだ。', '頭の中に、考えそのものが何度も来ることもあるのね。',
        '{word}。', '人間さんが今日、何度も考えたこと。', '詳しい中身は、まだ知らないの。',
      ), { category: 'EMOTION', knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'DETAIL', questionHint: 'どんな考えや気持ちなのか' }] }),
      choice('DAY01_CURIOUS_06_UNKNOWN_OTHER', 'どれとも違う', say(
        'どれとも違うんだ。', '種類はまだ分からない。', 'でも。',
        '今日、人間さんが何度も考えていたもの。', 'その事実を、好きに変えずに覚えておくの。',
      ), { knowledgeLevel: 'PARTIAL', openQuestions: [{ field: 'CATEGORY', questionHint: 'どんな種類のものなのか' }, { field: 'REASON', questionHint: 'なぜ何度も考えていたのか' }] }),
    ],
  },
};

export const DAY01_CURIOUS_CONVERSATIONS: readonly CuriousConversation[] = [
  DAY01_CURIOUS_01,
  DAY01_CURIOUS_02,
  DAY01_CURIOUS_03,
  DAY01_CURIOUS_04,
  DAY01_CURIOUS_05,
  DAY01_CURIOUS_06,
];
