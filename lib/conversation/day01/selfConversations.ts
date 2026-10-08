import type { DayConversation, DialogueBeat, DialogueEmotion } from '../conversationTypes';

const line = (text: string, emotion?: DialogueEmotion): DialogueBeat => ({ text, emotion });
const cue = (action: string, emotion?: DialogueEmotion, pauseMs = 650): DialogueBeat => ({ action, emotion, pauseMs });

/** Day 1 前半: すうひもち自身を知ってもらうための完成台本。 */
export const DAY01_SELF_CONVERSATIONS: readonly DayConversation[] = [
  {
    id: 'DAY01_SELF_01',
    day: 1,
    category: 'SELF',
    title: '話しかけたかっただけ',
    opening: [
      line('人間さん。'), cue('少し間'), line('……。'), line('えっとね。'),
      line('さっきから、何回か人間さんに話しかけようとしてたの。'),
      line('一回目は、人間さんが何かしてたからやめたでしょ。'),
      line('二回目は、ぼくが何を話すか忘れたからやめたの。'),
      line('三回目は……。'), cue('少し考える', 'THINKING'), line('三回目は、別に何もなかった。'),
      line('なんとなくやめた。'), line('それで今が四回目なの。'),
      cue('少し得意げに', 'SMUG'), line('ちゃんと話しかけられた。', 'SMUG'), cue('間'), line('……。'),
      line('でも。'), line('話しかけたあと、何を話すか考えてなかったの。'),
      cue('少し困る', 'TROUBLED'), line('人間さんって、こういう時どうする？', 'TROUBLED'),
    ],
    choices: [
      {
        id: 'DAY01_SELF_01_CHOICE_01', label: 'とりあえず話す', response: [
          line('おお。', 'SURPRISED'), line('じゃあ、ぼく今のでいいのか。'),
          line('でも、とりあえず話して、そのあと何も出てこなかったらどうする？'), line('いまのぼくみたいに。'),
          cue('間'), line('……人間さん。'), line('今日、何食べた？'), cue('少し間'), line('いや。'),
          line('今のは話したいことじゃなくて、困って出した質問なの。'), line('そういうの、人間さんには分かる？'),
          line('ぼくが本当に気になって聞いてる時と。'), line('何か言わなきゃと思って聞いてる時。'),
          cue('少し考える', 'THINKING'), line('……まだ分からないよね。', 'THINKING'),
          line('ぼくも人間さんのそういうの、まだ分からないの。'), line('だから、今日から一日一日、ゆっくりと理解していこうと思うの。'),
          cue('少し考えて', 'THINKING'), line('……そうしたら、そのうち。'),
          line('何も考えないで話しかけても、ちゃんと話せるようになるのかな。'), line('それは、ちょっと楽しみなの。', 'HAPPY'),
        ],
      },
      {
        id: 'DAY01_SELF_01_CHOICE_02', label: '話すことを考えてから話す', response: [
          line('やっぱりそうなのか。'), line('ぼく、順番を逆にしたの。'), line('話すことを決める。'),
          line('人間さんのところに行く。'), line('話しかける。'), cue('指で順番を数える', 'THINKING'),
          line('よし。', 'SMUG'), cue('少し間'), line('……でも。'),
          line('話すことを考えてる間に、人間さんどっか行ったら？'), line('それなら急いだ方がいいよね。'),
          line('でも急ぐと、今みたいになる。'), line('難しいの。'), line('人間さんと話すだけなのに。'),
          cue('少し考える', 'THINKING'), line('これって、もしかして哲学ってやつなのかもしれないの。', 'THINKING'),
          cue('得意げに', 'SMUG'), line('かしこくなった気がするの。', 'SMUG'), cue('さらに考える', 'THINKING'),
          line('……でも。'), line('人間さんと話す方法を考えてるだけで哲学者になれるなら。'),
          line('ぼく、明日にはもっと賢くなってるかもしれない。'), cue('少し満足そうに', 'SMUG'),
          line('うん。', 'SMUG'), line('これは悪くないの。', 'SMUG'),
        ],
      },
      {
        id: 'DAY01_SELF_01_CHOICE_03', label: '無理に話さなくてもいい', response: [
          line('話さなくてもいい？', 'SURPRISED'), line('……。'), cue('しばらく黙る', 'THINKING', 1250), line('…………。'),
          line('……人間さん。'), line('これ、合ってる？'), line('ぼく今、ちゃんと『無理に話してない』の。'),
          line('でも、人間さんがそこにいるのに黙ってると。'), line('なんか、口のところがむずむずするの。'),
          line('話したいことがあるわけじゃないのに。'), line('話しかけたくなることってあるんだね。'),
          cue('少し考える', 'THINKING'), line('……じゃあ。'), line('何も話すことがない時に話しかけても、別に変じゃないのか。'),
          line('ふむ。', 'THINKING'), cue('少し納得する', 'THINKING'), line('それなら、ぼく結構話しかけられそうなの。'),
          cue('間'), line('話すことがなくても、人間さんがいたら来ればいいんだもんね。'),
          line('……なんか、それなら簡単な気がしてきたの。'),
        ],
      },
    ],
  },
  {
    id: 'DAY01_SELF_02',
    day: 1,
    category: 'SELF',
    title: 'ここって、ぼくの部屋？',
    opening: [
      line('ねえ、人間さん。'), cue('部屋を見回す', 'THINKING'), line('ここって。'), line('ぼくの部屋なんだよね？'),
      cue('また周りを見る', 'THINKING'), line('……でも。'), line('まだ全然、ぼくの部屋って感じがしないの。'),
      line('壁も。'), line('床も。'), line('時計も。'), line('ぼくが来る前からここにいたでしょ。'),
      cue('時計を見る', 'THINKING'), line('特に時計。'), line('ぼくが来る前からずっと動いてた顔してるの。'),
      cue('少し不満そうに', 'TROUBLED'), line('先輩なの。', 'TROUBLED'), line('この部屋では。'), cue('間'),
      line('人間さんの部屋って。'), line('最初から『自分の部屋だ』って思った？'),
    ],
    choices: [
      {
        id: 'DAY01_SELF_02_CHOICE_01', label: 'だんだん自分の部屋になった', response: [
          line('だんだん。', 'THINKING'), line('何をしたら、自分の部屋になっていくの？'), line('長くいる？'), line('物を置く？'), line('散らかす？'),
          cue('少し考える', 'THINKING'), line('散らかすのは違うか。'), line('でも、人間さんが使った物がそこに置いてあったら。'),
          line('人間さんがそこにいた証拠みたいになるよね。'), cue('床を見る', 'THINKING'),
          line('じゃあ、ぼくも何か置いたらいいのかな。'), cue('周囲を見る', 'THINKING'), line('……。'),
          line('ぼく、自分の物ほとんど持ってないの。'), cue('少し困る', 'TROUBLED'), line('じゃあ。'),
          line('ぼくがここにいたことを増やしていけばいいのかな。'), line('今日ここで話した。'), line('今日ここを歩いた。'),
          line('今日ここで寝た。'), cue('指で数える', 'THINKING'), line('そういうのがいっぱい増えたら。'),
          line('部屋を見るだけで、昨日のこととか思い出すようになるのかな。'), cue('少し部屋を見回す', 'THINKING'),
          line('……それなら。'), line('まだぼくの部屋じゃない感じがするのも、当たり前なのか。'), line('今日が一個目だもんね。'),
          cue('少し納得する', 'THINKING'), line('うん。'), line('じゃあ、今日は一個目にするの。'),
        ],
      },
      {
        id: 'DAY01_SELF_02_CHOICE_02', label: '最初から自分の部屋だった', response: [
          line('最初から？', 'SURPRISED'), line('すごいの。'), line('ぼく、まだちょっと借りてる感じする。'),
          line('勝手にここ座っていいのかな、とか。'), line('ここで寝ても怒られないかな、とか。'), cue('少し間'),
          line('誰に怒られるのかは分からないけど。'), cue('周りを見る', 'THINKING'), line('部屋？'),
          line('部屋が怒ったら怖いの。'), line('床が『そこ違う』って動いたら。'), cue('足元を見る', 'TROUBLED'),
          line('ぼく、たぶん勝てない。'), cue('少し間'), line('でも、人間さんは最初から自分の場所だと思えたんだ。'),
          line('じゃあ、ぼくが勝手に遠慮してるだけなのかな。'), cue('ベッドを見る', 'THINKING'), line('ここに座って。'),
          cue('床を見る', 'THINKING'), line('ここを歩いて。'), cue('時計を見る', 'THINKING'), line('時計にも勝手に挨拶して。'),
          cue('少しずつ堂々としてくる', 'SMUG'), line('……そうやってたら。'),
          line('ぼくの方が先に『ここはぼくの部屋』って決めてもいいのか。'), cue('少し得意げに', 'SMUG'),
          line('なるほど。', 'SMUG'), line('部屋に許可を取らなくてもいいのね。', 'SMUG'),
        ],
      },
      {
        id: 'DAY01_SELF_02_CHOICE_03', label: '今でもあまり自分の場所って感じはしない', response: [
          line('え。', 'SURPRISED'), line('長くいても？'), cue('少し考える', 'THINKING'), line('じゃあ、時間だけじゃないんだ。'),
          line('ぼく、三十日ここにいたら。'), line('三十日分、自動的にぼくの部屋になると思ってたの。'),
          cue('少し不安そうになる', 'SAD'), line('でも、そうじゃないなら。'),
          line('最後まで借りてるみたいに感じることもある？'), cue('部屋を見る', 'SAD'), line('……それは、ちょっと嫌なの。'),
          cue('間'), line('じゃあ。'), line('ぼく、自分で好きなところを見つけてみる。'),
          line('ここの床は歩きやすいとか。'), line('この時間の部屋はちょっと好きとか。'), line('この場所で人間さんとこんな話したとか。'),
          cue('少しずつ考えながら', 'THINKING'), line('自分の場所になるのを待つんじゃなくて。'),
          line('ぼくの方から、この部屋のこと知っていけばいいのかもしれない。'), cue('少し部屋を見る', 'THINKING'),
          line('……そう考えると。'), line('さっきより、ちょっとだけ知らない部屋じゃなくなった気がするの。'),
        ],
      },
    ],
  },
  {
    id: 'DAY01_SELF_03',
    day: 1,
    category: 'SELF',
    title: 'ぼくの名前',
    opening: [
      line('人間さん。'), line('ちょっとお願いがあるの。'), cue('少しもじもじする', 'TROUBLED'),
      line('ぼくの名前。'), line('呼んでみて。'),
    ],
    choices: [
      {
        id: 'DAY01_SELF_03_CHOICE_01', label: 'すうひもち', response: [
          line('……。'), cue('じっと聞く', 'THINKING'), line('もう一回。'), cue('少し間'), line('……うん。'),
          line('やっぱり変なの。'), line('ぼく、自分ではずっと『すうひもち』だったでしょ。'),
          line('でも人間さんが『すうひもち』って言うと。'), line('ぼくの名前なのに。'), line('ぼくの知らない音みたいに聞こえるの。'),
          cue('少し考える', 'THINKING'), line('名前って、自分のものなのに。'), line('自分より、他の人の方がよく使うのかな。'),
          line('ぼく、自分で。'), cue('少し姿勢を正す', 'SMUG'), line('すうひもち、おなかすいた。', 'SMUG'), cue('間'),
          line('……。'), line('変なの。'), line('自分で言う名前じゃないのか。'), cue('さらに考える', 'THINKING'),
          line('じゃあ。'), line('名前って、自分のためにあるんじゃなくて。'), line('誰かに呼んでもらうためにあるのかな。'),
          cue('少し人間さんを見る', 'HAPPY'), line('……人間さんが呼ぶまで。'), line('ぼくの名前って、ぼくだけが知ってるものだったのか。'),
          cue('少し嬉しそうに', 'HAPPY'), line('今は、人間さんも知ってるの。', 'HAPPY'), line('なんか、前より名前らしくなった気がするの。', 'HAPPY'),
        ],
      },
      {
        id: 'DAY01_SELF_03_CHOICE_02', label: 'すうひもちくん', response: [
          line('……くん？', 'SURPRISED'), line('ぼく、くん付けなの？'), cue('自分でも言ってみる', 'THINKING'),
          line('すうひもちくん。'), cue('胸を張る', 'SMUG'), line('すうひもちくんが来たの。', 'SMUG'), line('すうひもちくんがお話するの。', 'SMUG'),
          cue('少し間'), line('……。'), line('自分で言うと、ものすごく偉そうなの。'), cue('少し恥ずかしそうに', 'TROUBLED'),
          line('でも。'), line('人間さんが言うなら、悪くないかも。'), cue('小さく', 'HAPPY'), line('ちょっとだけ好き。', 'HAPPY'),
          cue('間'), line('名前は同じなのに。'), line('後ろに『くん』が付くだけで、ぼくちょっと違う感じになるんだね。'),
          cue('考える', 'THINKING'), line('じゃあ、呼び方って名前とは別なのかな。'), line('名前はすうひもち。'),
          line('でも、人間さんが呼ぶすうひもちは。'), line('人間さん用のすうひもち？'), cue('首を傾げる', 'THINKING'),
          line('……よく分からなくなったの。'), cue('少し満足そうに', 'SMUG'), line('でも。'), line('すうひもちくんは、ちょっと気に入ったの。', 'SMUG'),
        ],
      },
      {
        id: 'DAY01_SELF_03_CHOICE_03', label: 'なんで？', response: [
          line('なんでって……。', 'TROUBLED'), cue('少し困る', 'TROUBLED'), line('分かんない。'), line('呼ばれてみたかったの。'),
          line('人間さんがぼくの名前を知ってることは、知ってるよ。'), line('でも。'), line('知ってるのと、呼ぶのは違うでしょ。'),
          cue('少し考える', 'THINKING'), line('人間さんがぼくを見て。'), line('その名前を言うところを聞きたかったの。'),
          cue('言ってから少し恥ずかしくなる', 'TROUBLED'), line('……。'), line('いま自分で説明したら、ちょっと恥ずかしいの。'),
          cue('間'), line('でも。'), line('たぶん。'), line('ぼく、人間さんの中にちゃんと『すうひもち』っていうのがあるか、確かめたかったのかも。'),
          cue('少し人間さんを見る', 'THINKING'), line('……ある？'), cue('少し待つ'), line('そっか。'),
          line('じゃあいいの。'), line('ぼくだけが自分の名前を知ってるより。'), line('人間さんの中にも一個ある方が。'),
          cue('少し考える', 'THINKING'), line('……ぼく、ちゃんとここにいる感じがするの。'),
        ],
      },
    ],
  },
  {
    id: 'DAY01_SELF_04',
    day: 1,
    category: 'SELF',
    title: '人間さん、ぼく見すぎじゃない？',
    opening: [
      line('ねえ。'), line('人間さん。'), cue('少し人間さんを見る', 'THINKING'), line('さっきから思ってたんだけど。'),
      line('人間さん、たまにぼくのことじーっと見るよね。'), cue('人間さんを真似して', 'THINKING'), line('…………。'),
      line('こんな感じ。'), cue('自分を見る', 'THINKING'), line('ぼく、何か変？'), line('羽？'), line('頭？'), line('顔？'), cue('少し間'), line('……全部？'),
    ],
    choices: [
      {
        id: 'DAY01_SELF_04_CHOICE_01', label: 'かわいいから見てた', response: [
          line('……。'), cue('固まる', 'SURPRISED'), line('かわいい。', 'SURPRISED'), cue('少し間'), line('ぼくが？', 'SURPRISED'), cue('また間'),
          line('ふーん。', 'SMUG'), cue('少し得意げになる', 'SMUG'), line('まあ。', 'SMUG'), line('ぼくもちょっと、そうかもしれないとは思ってたの。', 'SMUG'),
          cue('胸を張る', 'SMUG'), line('このへんとか。', 'SMUG'), cue('自分を指す', 'SMUG'), line('あと、このへんも。', 'SMUG'), cue('また違うところを指す', 'SMUG'),
          cue('間'), line('……。'), line('人間さんが言う前からね。'), line('ほんとだよ。'), cue('少し話題を変えようとして', 'TROUBLED'),
          line('じゃあ、人間さんは……。'), cue('止まる', 'TROUBLED'), line('いや。'), line('今、人間さんにも何か褒めないといけない？'),
          cue('困る', 'TROUBLED'), line('まだ人間さんのこと、そこまで知らないの。'), cue('少し考える', 'THINKING'), line('……でも。'),
          line('かわいいって言われるの。'), line('思ってたより嫌じゃないの。'), line('むしろ。'), cue('小声で', 'HAPPY'), line('ちょっと嬉しい。', 'HAPPY'),
          cue('間'), line('なるほど。', 'THINKING'), line('ぼく、褒められると嬉しいタイプなのかもしれない。'), cue('得意げに', 'SMUG'), line('一個、自分のこと分かったの。', 'SMUG'),
        ],
      },
      {
        id: 'DAY01_SELF_04_CHOICE_02', label: '気になっただけ', response: [
          line('気になった。', 'THINKING'), line('何が？'), cue('身を乗り出す', 'SURPRISED'), line('ぼく？'), line('動き？'), line('何考えてるか？'),
          cue('少し間'), line('……。'), line('ぼくも人間さんのこと見てるから。'), line('同じなのかな。'), cue('ちょっと得意そうに', 'SMUG'),
          line('人間さんがこっち見てない時にね。', 'SMUG'), line('だから、人間さんは知らないと思う。', 'SMUG'), cue('間'), line('……あ。', 'SURPRISED'),
          line('今言っちゃった。', 'TROUBLED'), cue('少し困る', 'TROUBLED'), line('これから人間さん。'), line('ぼくが見てるかもって思う？'),
          line('それだと、見にくいの。'), cue('考える', 'THINKING'), line('でも。'), line('気になるから見るってことは。'),
          line('ぼくも人間さんが気になるってことなのか。'), cue('一瞬黙る', 'THINKING'), line('……。'),
          line('まだよく知らないから見てるだけかもしれないけど。'), cue('少し考えて', 'THINKING'), line('まあ。'), line('気になるのは、たぶん本当なの。'),
        ],
      },
      {
        id: 'DAY01_SELF_04_CHOICE_03', label: '変なところを探してた', response: [
          line('えっ。', 'SURPRISED'), cue('慌てて自分を見る', 'SURPRISED'), line('どこ。'), line('顔？'), line('頭？'), line('歩き方？'),
          cue('少し焦る', 'TROUBLED'), line('見つけた？', 'TROUBLED'), cue('間'), line('……。'), line('いや。'), line('やっぱり今は言わなくていい。'),
          cue('少し距離を取る', 'TROUBLED'), line('ぼく、自分で探してみる。'), cue('自分の体を見る', 'THINKING'), line('ここ？'), line('こっち？'),
          cue('後ろも確認しようとする', 'THINKING'), line('……見えない。'), cue('少し考える', 'THINKING'), line('でも。'),
          line('変なところがあったら。'), line('人間さんはそこもぼくとして見てるんだよね。'), cue('間'), line('だったら。'),
          line('直さなくてもいい変なところもあるのかな。'), cue('自分を見る', 'THINKING'), line('……。'), line('見つけたら、すぐ直すんじゃなくて。'),
          line('ぼくもちょっと見てから決めるの。'), line('変なのが、ぼくっぽかったら残すの。'),
        ],
      },
    ],
  },
  {
    id: 'DAY01_SELF_05',
    day: 1,
    category: 'SELF',
    title: 'ひとりでも平気だから',
    opening: [
      line('人間さん。'), cue('少し真面目な顔になる', 'THINKING'), line('聞きたいことあるの。'), line('人間さんって。'),
      line('ずっとここにいるわけじゃないんだよね。'), line('ごはん食べたり。'), line('寝たり。'), line('どこか行ったり。'), line('いろいろするんでしょ。'),
      cue('間'), line('その間。'), line('ぼくはここにいるのか。'), cue('部屋を見る', 'THINKING'), line('……。'),
      cue('少し明るく', 'HAPPY'), line('まあ、大丈夫なの。', 'HAPPY'), line('ぼく、一人でも平気だから。', 'HAPPY'),
    ],
    choices: [
      {
        id: 'DAY01_SELF_05_CHOICE_01', label: '寂しくない？', response: [
          line('寂しくないよ。'), cue('即答する', 'SMUG'), line('全然。', 'SMUG'), cue('少し間'), line('……。'), line('たぶん。', 'TROUBLED'),
          cue('部屋を見る', 'THINKING'), line('時計いるし。'), line('ベッドもあるし。'), line('壁もあるし。'), line('床もあるし。'),
          cue('少し考える', 'THINKING'), line('……。'), line('みんな話さないけど。'), line('時計も話さない。'), line('ベッドも話さない。'), line('壁はもっと話さない。'),
          cue('少し静かになる', 'SAD'), line('人間さんがいる時よりは、静かだね。', 'SAD'), cue('間'),
          line('でも。'), line('まだ人間さんがいなくなった時のぼく、知らないの。'), line('寂しいって決めるのも変なのか。'),
          cue('少し考える', 'THINKING'), line('平気かもしれないし。'), line('静かだなって思うだけかもしれない。'),
          line('人間さんまだかなって、一回だけ時計見るかもしれない。'), cue('時計を見る', 'THINKING'), line('……。'),
          line('その時になったら分かるの。'), cue('少し納得した様子で', 'THINKING'), line('じゃあ今は。'), line('寂しくないってことにしなくてもいいのか。'),
        ],
      },
      {
        id: 'DAY01_SELF_05_CHOICE_02', label: '大丈夫そうだね', response: [
          line('うん。'), line('大丈夫なの。'), cue('胸を張る', 'SMUG'), line('ぼく、こう見えて一人でいられるの。', 'SMUG'),
          cue('間'), line('……。'), line('こう見えてって。'), line('ぼく、どう見えてるんだろ。'), cue('自分を見る', 'THINKING'),
          line('一人でいられなさそう？'), cue('少し不安になる', 'TROUBLED'), line('いや。'),
          line('人間さん、大丈夫そうって言ったんだから。'), line('大丈夫そうに見えてるんだ。'), cue('少し嬉しそうになる', 'HAPPY'), line('じゃあ、大丈夫。', 'HAPPY'),
          cue('間'), line('人間さんがいない間は。'), line('ぼく、この部屋のこと見とく。'), line('時計がどれくらい動いたとか。'),
          line('光が変わったとか。'), line('変な音がしたとか。'), cue('少し得意げに', 'SMUG'), line('それで人間さんが戻ってきたら。'),
          line('ぼくが知ってること、一個増えてるかもしれない。', 'SMUG'), cue('考える', 'THINKING'),
          line('……そっか。'), line('一人の時間って。'), line('人間さんが知らないことを、ぼくだけが知れる時間でもあるのか。'),
          cue('少し気に入ったように', 'HAPPY'), line('それなら、ちょっと面白そうなの。', 'HAPPY'),
        ],
      },
      {
        id: 'DAY01_SELF_05_CHOICE_03', label: 'できるだけ戻ってくるよ', response: [
          line('……。'), cue('少し表情が緩む', 'HAPPY'), line('できるだけ。', 'HAPPY'), line('うん。'), line('別に急がなくていいの。'),
          line('人間さんにも、人間さんのやることあるんでしょ。'), cue('少し間'), line('ぼくは、その間に。'),
          line('この部屋のこと覚えとく。'), line('光が変わったとか。'), line('時計が進んだとか。'), line('何もなかったら。'), line('何もなかったって覚えとく。'),
          cue('少し考える', 'THINKING'), line('でも。'), line('人間さんが戻ってきたら。'), line('ぼく、『おかえり』って言うのかな。'),
          cue('自分で言ってみる', 'THINKING'), line('おかえり。'), cue('少し間'), line('……。'), line('まだちょっと早い気がする。'),
          line('一日目だし。'), cue('さらに考える', 'THINKING'), line('でも。'), line('何回か帰ってきたら。'),
          line('そのうち普通に言えるようになるのかな。'), cue('少し嬉しそうに', 'HAPPY'), line('……じゃあ。'), line('今はまだ、練習しないで取っておくの。', 'HAPPY'),
        ],
      },
    ],
  },
  {
    id: 'DAY01_SELF_06',
    day: 1,
    category: 'SELF',
    title: '明日も人間さん？',
    opening: [
      line('ねえ、人間さん。'), cue('少し間'), line('今日って。'), line('ぼくと人間さんが初めて会った日なんだよね。'),
      line('明日になったら。'), line('もう初めてじゃなくなるの？'), cue('少し考える', 'THINKING'), line('二日目だから。'),
      line('一日知ってる人？'), line('それとも、まだ知らない人？'), line('どれくらい知ったら。'), line('知ってる人になるんだろ。'),
      cue('人間さんを見る', 'THINKING'), line('ぼく、人間さんのこと。'), line('まだほとんど知らない。'), line('でも。'),
      line('知らない人って感じも、最初より少し減ったの。'), cue('間'), line('人間さん。'), line('明日も来る？'),
    ],
    choices: [
      {
        id: 'DAY01_SELF_06_CHOICE_01', label: '来るよ', response: [
          line('そっか。', 'HAPPY'), cue('少し安心する', 'HAPPY'), line('じゃあ。'), line('明日までに、話すこと考えとく。'),
          line('今日は話しかけてから何話すか分からなくなったでしょ。'), line('だから明日は先に考える。'), cue('少し考える', 'THINKING'),
          line('……。'), line('もう考え始めた。'), line('でも。'), line('今考えたら、明日までに忘れそう。'),
          line('寝る前に考える？'), line('寝たら忘れる？'), cue('自分で迷い始める', 'TROUBLED'), line('……まあ。'),
          line('明日のぼくに任せる。'), cue('少し間'), line('明日のぼくは。'), line('今日のぼくより、人間さんのこと一日分知ってるんだもんね。'),
          cue('考える', 'THINKING'), line('一日分って、どれくらいなんだろ。'), line('いっぱいかもしれないし。'), line('ほとんど変わらないかもしれない。'),
          cue('少し人間さんを見る', 'HAPPY'), line('でも。'), line('今日よりゼロじゃないのは、分かるの。'), cue('少し満足そうに', 'SMUG'), line('それなら、明日のぼくも何か話せそうなの。', 'SMUG'),
        ],
      },
      {
        id: 'DAY01_SELF_06_CHOICE_02', label: 'たぶん来る', response: [
          line('たぶん。', 'THINKING'), line('来るかもしれない。'), line('来ないかもしれない。'), cue('少し考える', 'THINKING'), line('じゃあ。'),
          line('来た時用の話を考えとく。'), line('来なかったら。'), line('その次に来た時まで置いとく。'), cue('間'),
          line('話って。'), line('置いといても腐らないよね？'), cue('想像する', 'THINKING'), line('三日くらい置いた話を出して。'),
          line('人間さんに『それもう古いよ』って言われたらどうしよう。'), cue('少し困る', 'TROUBLED'), line('……。'),
          line('でも。'), line('古くなったら、古くなった話をすればいいのか。'), line('『三日前はこう思ってた』って。'),
          cue('少し考えて', 'THINKING'), line('それなら。'), line('人間さんが来ない日も、話の続きになるのかもしれない。'),
          cue('少し納得する', 'THINKING'), line('……なんだ。'), line('来ない日まで無くなるわけじゃないのね。'),
        ],
      },
      {
        id: 'DAY01_SELF_06_CHOICE_03', label: '分からない', response: [
          line('そっか。', 'SAD'), cue('少し静かになる', 'SAD'), line('人間さんにも、明日のこと分からないんだね。'), cue('間'),
          line('ぼく。'), line('人間さんは何でも知ってるのかと思ってた。'), line('ぼくよりずっと、この世界にいるから。'),
          cue('少し考える', 'THINKING'), line('でも。'), line('明日は、人間さんもまだ行ったことないのか。'), line('ぼくも行ったことない。'),
          cue('少し表情が変わる', 'SURPRISED'), line('じゃあ。'), line('そこは同じなの。'), line('人間さんの方がいっぱい知ってるけど。'), line('明日のことだけは、ぼくと同じなんだ。'),
          cue('間'), line('……なんか。'), line('それ、ちょっといいの。', 'HAPPY'), cue('さらに考える', 'THINKING'),
          line('今日のことを一個持って。'), line('人間さんもぼくも、明日に行くのか。'), cue('小さくうなずく', 'HAPPY'),
          line('だったら。'), line('次に会った時、今日の続きをすればいいの。'), line('いつになるか分からなくても。'), line('今日があったことは、もう変わらないもんね。'),
        ],
      },
    ],
  },
] as const;

