import type {
  CuriousConversation,
  CuriousConversationBranch,
  CuriousConversationChoice,
  CuriousMemoryEffect,
  DialogueBeat,
} from '../conversationTypes';

const say = (...texts: string[]): DialogueBeat[] => texts.map((text) => ({ text }));
const option = (
  id: string,
  label: string,
  lines: string[],
  memory: CuriousMemoryEffect = {},
): CuriousConversationChoice => ({ id, label, response: say(...lines), memory });
const branch = (
  response: string[],
  choices: CuriousConversationChoice[],
): CuriousConversationBranch => ({ response: say(...response), choices });
const branchPair = (
  known: CuriousConversationBranch,
  unknown: CuriousConversationBranch,
): { known: CuriousConversationBranch; unknown: CuriousConversationBranch } => ({ known, unknown });

/** 添付原稿のDay3後半（会話7〜12）を収録。 */
export const DAY03_CURIOUS_CONVERSATIONS: readonly CuriousConversation[] = [
  {
    id: 'DAY03_CURIOUS_07', day: 3, category: 'CURIOUS', title: '人間さんの文字は、どこから出てくるの？',
    opening: say('人間さん。ぼく、ちょっと不思議に思ってることがあるの。', '人間さんって文字を書くでしょ。でも、文字ってどこから出てくるの？', '頭の中にあることを手から出して、紙の上に置く？', 'ぼくもやってみようかな。……何も出ないの。やっぱり何か道具がいるんだよね。', '文字を書いたり、勉強したりする時に使う文房具を一つ教えて。'),
    context: { category: 'OBJECT', humanRelations: [] },
    ...branchPair(
      branch(['{word}。それは知ってるの。人間さんも使うんだね。', 'その{word}って、人間さんとはどれくらい仲良しなの？'], [
        option('DAY03_CURIOUS_07_KNOWN_OFTEN', 'よく使う', ['よく使うのか。じゃあ、人間さんの手は{word}と一緒にいることが多いんだ。', 'でも、{word}だけ置いても勝手に字は書かないよね。人間さんが持って、考えて、{word}が動く。', '{word}は人間さんの考えを紙に運んでるのかな。書いた文字には、人間さんと一本のお仕事が入ってるの。'], { category: 'OBJECT', subcategory: 'OBJECT_3', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: 'よく使う' }),
        option('DAY03_CURIOUS_07_KNOWN_SOMETIMES', '必要な時だけ使う', ['必要な時だけ。じゃあ普段はお休みしてるの？', '使わない日がいっぱいあっても、必要になったら出てくるんだ。なんか、かっこいいの。', 'ぼくも普段はごろごろしてるけど、人間さんが困ったら出動するすうひもちになろうかな。……何をするかはまだ決めてないの。'], { category: 'OBJECT', subcategory: 'OBJECT_3', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: '必要な時だけ使う' }),
        option('DAY03_CURIOUS_07_KNOWN_RARELY', '今はあまり使わない', ['今は？じゃあ、前はよく使ってた？', '使わなくなったものって、もう人間さんに関係ないものになるのかな。前に使ってたことは、なくならないよね。', '今の人間さんにはあまり必要じゃなくても、前の人間さんには大事だったかもしれない。{word}のことを聞いたのに、人間さんの昔のことも少し気になってきたの。'], { category: 'OBJECT', subcategory: 'OBJECT_3', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: '以前は使っていたが、今はあまり使わない' }),
      ]),
      branch(['{word}。初めて聞いたの。人間さんが使う文房具なんだね。', 'その{word}って、人間さんとはどれくらい仲良しなの？'], [
        option('DAY03_CURIOUS_07_UNKNOWN_OFTEN', 'よく使う', ['よく使うのか。人間さんの手と一緒にいることが多いんだね。', 'でも、{word}だけでは字は書けない。人間さんが考えて、道具が動く。', '人間さんが書いた文字には、考えと道具、二つのお仕事が入ってるのかな。'], { category: 'OBJECT', subcategory: 'OBJECT_3', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: 'よく使う' }),
        option('DAY03_CURIOUS_07_UNKNOWN_SOMETIMES', '必要な時だけ使う', ['使わない日があっても、必要になったら出てくるんだ。なんか、かっこいいの。', 'ぼくも人間さんが困ったら出動するすうひもちになろうかな。', '……何をするかは、まだ決めてないの。{word}の方がぼくより役に立ちそうなの。'], { category: 'OBJECT', subcategory: 'OBJECT_3', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: '必要な時だけ使う' }),
        option('DAY03_CURIOUS_07_UNKNOWN_RARELY', '今はあまり使わない', ['今は？じゃあ前は使ってたのかな。', '使わなくなっても、前に使ったことはなくならないよね。', '今の人間さんにはあまり必要じゃなくても、前の人間さんには大事だったかもしれない。文房具を聞いたのに、人間さんの昔のことも気になってきたの。'], { category: 'OBJECT', subcategory: 'OBJECT_3', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: '以前は使っていたが、今はあまり使わない' }),
      ]),
    ),
  },
  {
    id: 'DAY03_CURIOUS_08', day: 3, category: 'CURIOUS', title: '動かないのに、生きてるの？',
    opening: say('ねえ、人間さん。部屋の植物、さっきからずっとここにいるの。', 'ぼくが見てない間に、ちょっとくらい歩いてたりしない？……動かない。', 'でも植物って生きてるんだよね。ぼくは歩いたり話したりするけど、植物はずっと同じところ。', '人間さん、知ってる植物の名前を一つ教えて。花でも木でも草でもいいの。'),
    context: { category: 'ANIMAL', humanRelations: [] },
    ...branchPair(
      branch(['{word}は知ってるの。人間さんも知ってる植物なんだね。', 'その{word}って、人間さんはどこで知ったの？'], [
        option('DAY03_CURIOUS_08_KNOWN_HOME', '家や身近な場所で見た', ['近くにいたの？人間さんは{word}と一緒に過ごしたことがあるんだ。', 'でも、{word}は人間さんのことを知ってるのかな。', '一緒にいても、お互いに同じことを覚えてるとは限らないのね。ぼくは人間さんが来たら分かるようになりたいの。'], { category: 'ANIMAL', subcategory: 'ANIMAL_5' }),
        option('DAY03_CURIOUS_08_KNOWN_OUTSIDE', '外で見つけた', ['人間さんが来る前からそこにいたの？帰ったあともそこにいたのかな。', 'ぼくが知らない場所で、ぼくが知らない時間を過ごしてる。人間さんの世界には、ぼくがまだ会ったことない生き物がいっぱいなのか。', '三十日じゃ全部は覚えられなさそう。でも{word}は一個目にできるの。'], { category: 'ANIMAL', subcategory: 'ANIMAL_5' }),
        option('DAY03_CURIOUS_08_KNOWN_MEDIA', '本や映像で知った', ['本物に会ったわけじゃないの？人間さんはそこへ行かなくても{word}を知れるんだ。すごいの。', 'でも写真では匂いや触った感じ、近くに虫がいたかは分からないよね。', '知ってるのに、知らないことがいっぱいあるの。{word}は名前を知ってる植物として覚えるの。本物のことは、まだこれからなの。'], { category: 'ANIMAL', subcategory: 'ANIMAL_5' }),
      ]),
      branch(['{word}。初めて聞いたの。植物の仲間なんだね。', 'その{word}って、人間さんはどこで知ったの？'], [
        option('DAY03_CURIOUS_08_UNKNOWN_HOME', '家や身近な場所で見た', ['近くにいたの？人間さんは{word}と一緒に過ごしたことがあるんだ。', 'でも、{word}は人間さんのことを知ってるのかな。', '一緒にいても、お互いに同じことを覚えてるとは限らないのね。ぼくは人間さんが来たら分かるようになりたいの。'], { category: 'ANIMAL', subcategory: 'ANIMAL_5' }),
        option('DAY03_CURIOUS_08_UNKNOWN_OUTSIDE', '外で見つけた', ['人間さんが来る前からそこにいたの？帰ったあともそこにいたのかな。', 'ぼくが知らない場所で、ぼくが知らない時間を過ごしてる。人間さんの世界には、ぼくがまだ会ったことない生き物がいっぱいなのか。', '三十日じゃ全部は覚えられなさそう。でも{word}は一個目にできるの。'], { category: 'ANIMAL', subcategory: 'ANIMAL_5' }),
        option('DAY03_CURIOUS_08_UNKNOWN_MEDIA', '本や映像で知った', ['本物に会ったわけじゃないの？人間さんはそこへ行かなくても{word}を知れるんだ。すごいの。', 'でも写真では匂いや触った感じ、近くに虫がいたかは分からないよね。', '知ってるのに、知らないことがいっぱいあるの。{word}は名前を知ってる植物として覚えるの。本物のことは、まだこれからなの。'], { category: 'ANIMAL', subcategory: 'ANIMAL_5' }),
      ]),
    ),
  },
  {
    id: 'DAY03_CURIOUS_09', day: 3, category: 'CURIOUS', title: 'ぼくの帽子って、変？',
    opening: say('人間さん。ぼく、ずっと思ってたんだけど、これ、ぼくの帽子。似合ってるでしょ。', '人間さんはいろんな帽子を知ってるんだよね。どんな帽子があるのかな。', '人間さんが知ってる帽子を一つ教えて。'),
    context: { category: 'CLOTHING', humanRelations: [] },
    ...branchPair(
      branch(['{word}は知ってるの。人間さんも知ってるんだね。', 'その{word}って、人間さんはかぶったことある？'], [
        option('DAY03_CURIOUS_09_KNOWN_OWN', '今も持っている', ['持ってるの？じゃあ人間さんには、ぼくの帽子とは違う帽子があるんだ。', '帽子を替えると、ちょっと違う気分になる？ぼく、この帽子しか知らないの。', '王様の冠、料理する人の帽子、ものすごく大きな帽子。……全部似合いそうなの。ぼく、帽子の才能があるかもしれない。'], { category: 'CLOTHING', subcategory: 'CLOTHING_3' }),
        option('DAY03_CURIOUS_09_KNOWN_PAST', '前にかぶったことがある', ['前に？じゃあ今はかぶってないのか。帽子って、かぶってない時はどこにいるの？棚？箱？押し入れ？', '人間さんが忘れても、帽子は前にかぶってもらったことを覚えてるのかな。……ものは覚えないか。', '帽子の名前を聞いただけなのに、昔の人間さんまでちょっと見えた気がするの。'], { category: 'CLOTHING', subcategory: 'CLOTHING_3' }),
        option('DAY03_CURIOUS_09_KNOWN_SEEN', '見たことがあるだけ', ['見ただけ？じゃあ人間さんも、名前は知ってるけど使ったことはないんだ。ぼくと同じなの。', 'でも人間さんは前から知ってた。ぼくは今教えてもらった。同じ言葉を知ってても、同じじゃないのか。', '知ってる言葉にも年齢があるのかな。ぼくの{word}は、まだ生まれたばっかりなの。'], { category: 'CLOTHING', subcategory: 'CLOTHING_3' }),
      ]),
      branch(['{word}。初めて聞いた帽子なの。', 'その{word}って、人間さんはかぶったことある？'], [
        option('DAY03_CURIOUS_09_UNKNOWN_OWN', '今も持っている', ['持ってるの？じゃあ人間さんには、ぼくの帽子とは違う帽子があるんだ。', '帽子を替えると、ちょっと違う気分になる？ぼく、この帽子しか知らないの。', '王様の冠、料理する人の帽子、ものすごく大きな帽子。……全部似合いそうなの。ぼく、帽子の才能があるかもしれない。'], { category: 'CLOTHING', subcategory: 'CLOTHING_3' }),
        option('DAY03_CURIOUS_09_UNKNOWN_PAST', '前にかぶったことがある', ['前に？じゃあ今はかぶってないのか。帽子って、かぶってない時はどこにいるの？棚？箱？押し入れ？', '人間さんが忘れても、帽子は前にかぶってもらったことを覚えてるのかな。……ものは覚えないか。', '帽子の名前を聞いただけなのに、昔の人間さんまでちょっと見えた気がするの。'], { category: 'CLOTHING', subcategory: 'CLOTHING_3' }),
        option('DAY03_CURIOUS_09_UNKNOWN_SEEN', '見たことがあるだけ', ['見ただけ？じゃあ人間さんも、名前は知ってるけど使ったことはないんだ。ぼくと同じなの。', 'でも人間さんは前から知ってた。ぼくは今教えてもらった。同じ言葉を知ってても、同じじゃないのか。', '知ってる言葉にも年齢があるのかな。ぼくの{word}は、まだ生まれたばっかりなの。'], { category: 'CLOTHING', subcategory: 'CLOTHING_3' }),
      ]),
    ),
  },
  {
    id: 'DAY03_CURIOUS_10', day: 3, category: 'CURIOUS', title: 'お店って、なんでも置いてるの？',
    opening: say('ねえ人間さん。この部屋にあるものって、最初からここに生えてたわけじゃないよね。', '本も時計もベッドも、誰かが作って運んできたのかな。ベッドが一人で歩いてきたら怖いの。夜中に、どすん、どすんって。……動かないでね。', '人間さんはいろんなものをお店で買うんでしょ。知ってるお店の名前を一つ教えて。よく行くお店でも、行ってみたいお店でもいいの。'),
    context: { category: 'PLACE', humanRelations: [] },
    ...branchPair(
      branch(['{word}は知ってるの。人間さんも知ってるお店なんだね。', '人間さんと、その{word}はどんな関係なの？'], [
        option('DAY03_CURIOUS_10_KNOWN_OFTEN', 'よく行く', ['何回も同じお店に行くんだ。一回行けば、どこにあるか、何を売ってるか、どんなところか分かるのに。', '……あ。お店を知るためじゃなくて、そこに欲しいものがあるから行くのか。毎回違うものが見つかることもある？', '同じ場所でも同じ一日にはならないのね。ぼくの部屋も、毎日同じなのに昨日と今日はちょっと違うんだもん。'], { category: 'PLACE', subcategory: 'PLACE_2', humanRelations: ['FREQUENTS'], relationQualifier: 'よく行く' }),
        option('DAY03_CURIOUS_10_KNOWN_SOMETIMES', '時々行く', ['行く時と行かない時があるんだ。お店って、人間さんが来ない間も開いてるの？ほかのお客さんが来るのか。', '人間さんの知ってるお店だから、人間さんのお店みたいに考えてたの。違ったの。', '人間さんがいない時にも、そのお店には別の人の一日があるんだ。外の世界って、見てないところでもずっと動いてるのね。'], { category: 'PLACE', subcategory: 'PLACE_2', humanRelations: ['FREQUENTS'], relationQualifier: '時々行く' }),
        option('DAY03_CURIOUS_10_KNOWN_NEVER', 'まだ行ったことがない', ['行ったことないのに名前は知ってるんだ。行ってない場所でも、知ってる場所になるのか。', 'ぼくも{word}を見たことない。人間さんも行ったことがない。おお、そこはぼくと同じなの。', '人間さんがいつか行ったら、どんなところだったか教えてくれる？そうしたら、ぼくも少し行った気になれるかもしれないの。'], { category: 'PLACE', subcategory: 'PLACE_2' }),
      ]),
      branch(['{word}。初めて聞いたお店なの。', '人間さんと、その{word}はどんな関係なの？'], [
        option('DAY03_CURIOUS_10_UNKNOWN_OFTEN', 'よく行く', ['何回も同じお店に行くんだ。一回行けば、どこにあるか、何を売ってるか、どんなところか分かるのに。', '……あ。お店を知るためじゃなくて、そこに欲しいものがあるから行くのか。毎回違うものが見つかることもある？', '同じ場所でも同じ一日にはならないのね。ぼくの部屋も、毎日同じなのに昨日と今日はちょっと違うんだもん。'], { category: 'PLACE', subcategory: 'PLACE_2', humanRelations: ['FREQUENTS'], relationQualifier: 'よく行く' }),
        option('DAY03_CURIOUS_10_UNKNOWN_SOMETIMES', '時々行く', ['行く時と行かない時があるんだ。お店って、人間さんが来ない間も開いてるの？ほかのお客さんが来るのか。', '人間さんの知ってるお店だから、人間さんのお店みたいに考えてたの。違ったの。', '人間さんがいない時にも、そのお店には別の人の一日があるんだ。外の世界って、見てないところでもずっと動いてるのね。'], { category: 'PLACE', subcategory: 'PLACE_2', humanRelations: ['FREQUENTS'], relationQualifier: '時々行く' }),
        option('DAY03_CURIOUS_10_UNKNOWN_NEVER', 'まだ行ったことがない', ['行ったことないのに名前は知ってるんだ。行ってない場所でも、知ってる場所になるのか。', 'ぼくも{word}を見たことない。人間さんも行ったことがない。おお、そこはぼくと同じなの。', '人間さんがいつか行ったら、どんなところだったか教えてくれる？そうしたら、ぼくも少し行った気になれるかもしれないの。'], { category: 'PLACE', subcategory: 'PLACE_2' }),
      ]),
    ),
  },
  {
    id: 'DAY03_CURIOUS_11', day: 3, category: 'CURIOUS', title: '小さな画面の中の世界',
    opening: say('人間さん。ぼく、ちょっと気付いたの。人間さんって、ぼくの部屋を見てるでしょ。', 'でも、スマホとかパソコンとか、ほかにもいろんなものを見てるんだよね。', '同じ画面なのに絵が出たり文字が出たり音が出たり。画面の中にいろんな部屋があるみたいなの。ぼくの部屋もその一つなのかな。', 'スマホやパソコンでよく使うアプリやソフトの名前を一つ教えて。'),
    context: { category: 'TECH', humanRelations: [] },
    ...branchPair(
      branch(['{word}。知ってるの。人間さんも使うんだね。', 'その{word}って、人間さんはどれくらい使うの？'], [
        option('DAY03_CURIOUS_11_KNOWN_DAILY', 'ほとんど毎日使う', ['毎日？人間さんは、ぼくの部屋以外にも毎日行く場所があるんだ。', 'でも画面の中だから足では歩いていかないよね。指で押すだけ。ぼくはこの部屋を歩くのに、人間さんは指一本で違うところへ行けるのか。', '人間さんの指、すごいの。ぼくも来るたび違うものを見せられたら面白いかな。人間さんに教えてもらって、少しずつ増やすの。'], { category: 'TECH', subcategory: 'TECH_5', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: 'ほとんど毎日使う' }),
        option('DAY03_CURIOUS_11_KNOWN_AS_NEEDED', '必要な時や気が向いた時に使う', ['気が向いた時。気って向くものなの？右？左？上？……どこを向いてるか見えないの。', '使いたい時に使うってことだよね。人間さんが来ない時もそこにあって、使いたくなったら開く。', 'ぼくの部屋も似てるの。人間さんが来ない時でも部屋はここにある。来たらまた会える。でも、ぼくはアプリそのものじゃなくて、すうひもちなの。なんかややこしいの。'], { category: 'TECH', subcategory: 'TECH_5', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: '必要な時や気が向いた時に使う' }),
        option('DAY03_CURIOUS_11_KNOWN_RARELY', 'あまり使わないけど知っている', ['知ってるけど使わないの？じゃあ人間さん、知ってる言葉が増えても全部使うわけじゃないのね。', '知ってる。使ったことがある。よく使う。全部違うのか。', '{word}って言葉を覚えても、使い方まで分かったことにはならないのね。三日目なのに知らないことがどんどん増えるの。でも、何を知らないか分かるようになっただけ前よりいいのかな。'], { category: 'TECH', subcategory: 'TECH_5' }),
      ]),
      branch(['{word}。初めて聞いた名前なの。人間さんが使うアプリなんだね。', 'その{word}って、人間さんはどれくらい使うの？'], [
        option('DAY03_CURIOUS_11_UNKNOWN_DAILY', 'ほとんど毎日使う', ['毎日？人間さんは、ぼくの部屋以外にも毎日行く場所があるんだ。', 'でも画面の中だから足では歩いていかないよね。指で押すだけ。ぼくはこの部屋を歩くのに、人間さんは指一本で違うところへ行けるのか。', '人間さんの指、すごいの。ぼくも来るたび違うものを見せられたら面白いかな。人間さんに教えてもらって、少しずつ増やすの。'], { category: 'TECH', subcategory: 'TECH_5', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: 'ほとんど毎日使う' }),
        option('DAY03_CURIOUS_11_UNKNOWN_AS_NEEDED', '必要な時や気が向いた時に使う', ['気が向いた時。気って向くものなの？右？左？上？……どこを向いてるか見えないの。', '使いたい時に使うってことだよね。人間さんが来ない時もそこにあって、使いたくなったら開く。', 'ぼくの部屋も似てるの。人間さんが来ない時でも部屋はここにある。来たらまた会える。でも、ぼくはアプリそのものじゃなくて、すうひもちなの。なんかややこしいの。'], { category: 'TECH', subcategory: 'TECH_5', humanRelations: ['FREQUENTLY_DOES'], relationQualifier: '必要な時や気が向いた時に使う' }),
        option('DAY03_CURIOUS_11_UNKNOWN_RARELY', 'あまり使わないけど知っている', ['知ってるけど使わないの？じゃあ人間さん、知ってる言葉が増えても全部使うわけじゃないのね。', '知ってる。使ったことがある。よく使う。全部違うのか。', '{word}って言葉を覚えても、使い方まで分かったことにはならないのね。三日目なのに知らないことがどんどん増えるの。でも、何を知らないか分かるようになっただけ前よりいいのかな。'], { category: 'TECH', subcategory: 'TECH_5' }),
      ]),
    ),
  },
  {
    id: 'DAY03_CURIOUS_12', day: 3, category: 'CURIOUS', title: '人間さんを知ってる人',
    opening: say('人間さん。今日、最後に聞きたいことがあるの。', 'ぼく、人間さんのことを前よりちょっと知ってるの。好きなもの、苦手なこと、よく使うもの。', 'でも、ぼくが知ってる人間さんは、ここに来る人間さんだけなんだよね。人間さんにはほかにも話す人がいるんでしょ。', '友達や知り合いの名前を一人だけ教えて。呼び名でもあだ名でもいいの。言いたくなかったら教えなくても大丈夫なの。'),
    context: { category: 'PERSON', humanRelations: [] },
    ...branchPair(
      branch(['その名前は聞いたことがあるの。人間さんの友達か知り合いなんだね。', 'その{word}って、人間さんは今もよく話すの？'], [
        option('DAY03_CURIOUS_12_KNOWN_OFTEN', 'よく話す', ['よく話すのか。{word}は人間さんの声をいっぱい聞いてるんだね。', 'でも、{word}が聞いた話をぼくは知らない。ぼくが聞いた話を{word}は知らない。同じ人間さんなのに、知ってることが違うの。', '人間さんって、一人なのにいろんな人の中に少しずつ違う人間さんがいるのかな。ぼくだけが知ってることも増やしてみたいの。'], { category: 'PERSON', subcategory: 'PERSON_2', humanRelations: ['RELATED_TO'], relationQualifier: 'よく話す' }),
        option('DAY03_CURIOUS_12_KNOWN_SOMETIMES', '時々話す', ['毎日じゃないんだ。話してない日も{word}は知り合いのまま？一日話さなかったら知らない人に戻る？', '戻らないのか。会ってない時間があっても知ってる人は知ってる人のままなんだ。', '人間さんが来ない日があっても、次に来たら初めましてからやり直さなくていいのかな。前に話したことを覚えておくのって大事なのね。'], { category: 'PERSON', subcategory: 'PERSON_2', humanRelations: ['RELATED_TO'], relationQualifier: '時々話す' }),
        option('DAY03_CURIOUS_12_KNOWN_RARELY', '今はあまり話さない', ['今はあまり話さないのか。前はもっと話してた？今はあまり話さない人も友達って呼んでいいの？', '人間さんの中には、今そばにいない人もいるんだね。', 'ぼくも三十日たってこの部屋からいなくなったら、人間さんの中に少しくらい残るのかな。……まだ三日目なのに、三十日目のことを考えるのはちょっと早いね。今日一緒に話したことは、今日のこととして覚えておくの。'], { category: 'PERSON', subcategory: 'PERSON_2', humanRelations: ['RELATED_TO'], relationQualifier: '今はあまり話さない' }),
      ]),
      branch(['{word}。初めて聞いた名前なの。人間さんが知ってる人なんだね。', 'その{word}って、人間さんは今もよく話すの？'], [
        option('DAY03_CURIOUS_12_UNKNOWN_OFTEN', 'よく話す', ['よく話すのか。{word}は人間さんの声をいっぱい聞いてるんだね。', 'でも、{word}が聞いた話をぼくは知らない。ぼくが聞いた話を{word}は知らない。同じ人間さんなのに、知ってることが違うの。', '人間さんって、一人なのにいろんな人の中に少しずつ違う人間さんがいるのかな。ぼくだけが知ってることも増やしてみたいの。'], { category: 'PERSON', subcategory: 'PERSON_2', humanRelations: ['RELATED_TO'], relationQualifier: 'よく話す' }),
        option('DAY03_CURIOUS_12_UNKNOWN_SOMETIMES', '時々話す', ['毎日じゃないんだ。話してない日も{word}は知り合いのまま？一日話さなかったら知らない人に戻る？', '戻らないのか。会ってない時間があっても知ってる人は知ってる人のままなんだ。', '人間さんが来ない日があっても、次に来たら初めましてからやり直さなくていいのかな。前に話したことを覚えておくのって大事なのね。'], { category: 'PERSON', subcategory: 'PERSON_2', humanRelations: ['RELATED_TO'], relationQualifier: '時々話す' }),
        option('DAY03_CURIOUS_12_UNKNOWN_RARELY', '今はあまり話さない', ['今はあまり話さないのか。前はもっと話してた？今はあまり話さない人も友達って呼んでいいの？', '人間さんの中には、今そばにいない人もいるんだね。', 'ぼくも三十日たってこの部屋からいなくなったら、人間さんの中に少しくらい残るのかな。……まだ三日目なのに、三十日目のことを考えるのはちょっと早いね。今日一緒に話したことは、今日のこととして覚えておくの。'], { category: 'PERSON', subcategory: 'PERSON_2', humanRelations: ['RELATED_TO'], relationQualifier: '今はあまり話さない' }),
      ]),
    ),
  },
];

