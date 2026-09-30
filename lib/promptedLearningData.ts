import type { ConversationChoice, WordCategory } from './conversationTypes';

export type PromptedLearningChoice = ConversationChoice & {
  value: string;
  memoryLabel: string;
  reply: (word: string) => string[];
  opinion?: (word: string) => string;
  recall?: (word: string) => string;
};

export type PromptedLearningAxis = {
  id: string;
  attributeKey: string;
  prompt: (word: string) => string;
  choices: [PromptedLearningChoice, PromptedLearningChoice, PromptedLearningChoice];
};

export type PromptedLearningQuestion = {
  id: string;
  group: string;
  category: WordCategory;
  entityKind: string;
  prompt: string;
  starterPrompts: readonly string[];
  axes: PromptedLearningAxis[];
};

export type PromptedLearningPickContext = {
  recentQuestionIds?: readonly string[];
  recentGroups?: readonly string[];
  recentEntityKinds?: readonly string[];
  recentStarterKeys?: readonly string[];
  questionCounts?: Readonly<Record<string, number>>;
  starterCounts?: Readonly<Record<string, number>>;
};

export type PickedPromptedLearningQuestion = PromptedLearningQuestion & {
  selectedStarterIndex: number;
  selectedStarterKey: string;
};

function fill(template: string, word: string) {
  return template.replaceAll('{word}', word);
}

function makeChoice(
  id: string,
  label: string,
  value: string,
  memoryLabel: string,
  opinionText: string,
  recallText: string,
): PromptedLearningChoice {
  return {
    id,
    label,
    value,
    memoryLabel,
    // Prompted conversations show only Suuhimochi's own opinion at the end.
    // reply is kept as a compatibility fallback for older callers.
    reply: (word) => [fill(opinionText, word)],
    opinion: (word) => fill(opinionText, word),
    recall: (word) => fill(recallText, word),
  };
}

/**
 * This system exists to collect user-specific named words, not to quiz basic
 * dictionary knowledge.  Therefore the automatic prompt pool deliberately
 * avoids weather/body/basic food/etc. and concentrates on titles, characters,
 * creators, public figures, historical names, specialist terms, named services
 * and named places that are likely to differ from user to user.
 */
export const PROMPTED_LEARNING_QUESTIONS: PromptedLearningQuestion[] = [
  {
    id: "book",
    group: "reading",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "book",
    prompt: "最近読んだ本で、タイトルをひとつだけ教えて。",
    starterPrompts: [
      "最近読んだ本で、タイトルをひとつだけ教えて。",
      "昔読んだのに、まだ名前を覚えてる本ってある？",
      "積んでるけど「いつか読む」って思ってる本、ひとつある？",
      "人に一冊だけすすめるなら、どの本を出す？",
    ],
    axes: [
      {
        id: "book-hook",
        attributeKey: "bookHook",
        prompt: (word) => fill("{word}って、どこが一番残る本？", word),
        choices: [
          makeChoice(
            "BOOK_HOOK_STORY", "物語・展開", "story",
            "物語や展開が印象に残る",
            "本なのに頭の中で勝手に映像が始まるんだね。ページって小さい映画館なのかな。でも上映してる場所が頭の中なら、隣の席には誰も座れないのね。ぼくも同じページを読んだら、同じ景色を見られるのかな。",
            "{word}は、物語や展開が印象に残る本だったよね。",
          ),
          makeChoice(
            "BOOK_HOOK_IDEA", "考え方・知識", "ideas",
            "考え方や知識が印象に残る",
            "読む前と後で考え方が少し変わるなら、本って頭の中を工事する道具なのかも。工事が終わった頭には、前の考えの置き場所もあるのかな。ぼくの頭なら、捨てるのが惜しくて廊下に並べちゃいそうなの。",
            "{word}は、考え方や知識のところが印象に残るって言ってたね。",
          ),
          makeChoice(
            "BOOK_HOOK_STYLE", "文章・言葉づかい", "writing",
            "文章や言葉づかいが印象に残る",
            "内容だけじゃなく言葉そのものを見るんだ。文章にも顔つきがあるのね。同じことを言ってても、言葉の顔が違うと仲良くなりやすいのかな。ぼくも今ちょっと、よそ行きの言葉を探しちゃったの。",
            "{word}は、文章や言葉づかいが好きなんだったね。",
          ),
        ],
      },
      {
        id: "book-relation",
        attributeKey: "bookRelation",
        prompt: (word) => fill("{word}とは、今どんな付き合い方なの？", word),
        choices: [
          makeChoice(
            "BOOK_RELATION_REREAD", "何度か読み返してる", "reread",
            "何度か読み返している",
            "同じ本なのに二回目も読むんだ。ページは同じでも、人間さんの方が変わってるから別の本になるのかな。本の方は、また同じ人が来たって思ってるかもしれないの。人間さんだけ変わってたら、ちゃんと気付いてくれるかな。",
            "{word}は、何度か読み返してる本だったよね。",
          ),
          makeChoice(
            "BOOK_RELATION_RECENT", "最近読んだ", "recent",
            "最近読んだ本",
            "まだ頭の中に新しく置いてある本なんだね。乾く前のインクみたいなの。今はまだ、何でもその本につながって見えたりするのかな。ぼく、近くを歩いたら頭のインクが足に付かないか気になったの。",
            "{word}は、最近読んだ本って話してたね。",
          ),
          makeChoice(
            "BOOK_RELATION_WANT", "まだ読んでないけど気になる", "want",
            "まだ読んでいないが気になる",
            "まだ開いてないのに気になるんだ。表紙の向こうで待ち伏せされてる感じなのかな。待ってる本は、人間さんがいつ来るか知らないのね。ぼくなら表紙を少しだけ開けて、こっちをのぞいちゃいそうなの。",
            "{word}は、まだ読んでないけど気になる本だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "manga",
    group: "reading",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "manga",
    prompt: "最近読んでる漫画、ひとつだけ名前を教えて。",
    starterPrompts: [
      "最近読んでる漫画、ひとつだけ名前を教えて。",
      "昔かなりハマった漫画って、最初に何が浮かぶ？",
      "絵を見ただけで「好きだな」って思う漫画、ある？",
      "完結してるのに、まだ頭に残ってる漫画って何？",
    ],
    axes: [
      {
        id: "manga-hook",
        attributeKey: "mangaHook",
        prompt: (word) => fill("{word}は、何が一番強い漫画なの？", word),
        choices: [
          makeChoice(
            "MANGA_HOOK_CHARACTER", "キャラクター", "character",
            "キャラクターが魅力",
            "話が止まっててもキャラだけで見ていられるなら、その人たちもう作品の外でも生きてそうなの。誰も読んでない時は、みんなで休憩してるのかな。敵と味方が一緒にお茶してたら、次の巻を見る目が変わっちゃうの。",
            "{word}は、キャラクターが魅力って言ってたね。",
          ),
          makeChoice(
            "MANGA_HOOK_STORY", "物語・展開", "story",
            "物語や展開が魅力",
            "次のページをめくらせる力があるんだ。紙なのに引っぱる力があるの不思議なの。最後のページまで引っぱられたら、その力はどこへ行くんだろ。ぼくなら閉じたあとも、指だけ続きを探してそうなの。",
            "{word}は、物語や展開が魅力なんだったね。",
          ),
          makeChoice(
            "MANGA_HOOK_ART", "絵・コマの見せ方", "art",
            "絵やコマの見せ方が魅力",
            "絵の並べ方まで面白いんだ。四角いコマの中に時間を押し込めてるの、器用なの。コマとコマの間で、こっそり休んでもいいのかな。ぼくは走る場面を描かれたら、白い隙間で一息つきたいの。",
            "{word}は、絵やコマの見せ方が好きなんだったね。",
          ),
        ],
      },
      {
        id: "manga-relation",
        attributeKey: "mangaRelation",
        prompt: (word) => fill("{word}は、今どんな感じで読んでる？", word),
        choices: [
          makeChoice(
            "MANGA_RELATION_CURRENT", "今も追ってる", "current",
            "今も追っている",
            "続きがまだ来る漫画なんだ。未来のページを待つって、ちょっと予約した記憶みたいなの。まだ来てないページのために、頭の中に席を空けてるのね。ぼくもそこに座りかけて、続きの人に怒られないようにするの。",
            "{word}は、今も追ってる漫画だったよね。",
          ),
          makeChoice(
            "MANGA_RELATION_DONE", "読み終わってる", "finished",
            "読み終わっている",
            "終わったのに名前が出てくるなら、最終回で全部終わるわけじゃないのね。登場人物は終わったつもりでも、人間さんの中ではまだ帰れてないのかな。最後のページに出口があるとは限らないのね。",
            "{word}は、読み終わってる漫画って言ってたね。",
          ),
          makeChoice(
            "MANGA_RELATION_REREAD", "何度も読み返す", "reread",
            "何度も読み返す",
            "知ってる展開でも読むんだ。びっくりしないのに面白いなら、面白さって驚きだけじゃないのね。好きな場面に近づくと、知ってても少しうれしくなるのかな。ぼく、いつものごはんを見つけた時と同じ顔で読んじゃいそうなの。",
            "{word}は、何度も読み返す漫画だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "anime",
    group: "screen",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "anime",
    prompt: "最近見てるアニメ、ひとつだけ教えて。",
    starterPrompts: [
      "最近見てるアニメ、ひとつだけ教えて。",
      "昔のアニメで、今でも名前が出てくる作品ある？",
      "一話だけ見るつもりが続けて見ちゃったアニメって何？",
      "キャラでも音楽でもいいから、妙に残ってるアニメってある？",
    ],
    axes: [
      {
        id: "anime-hook",
        attributeKey: "animeHook",
        prompt: (word) => fill("{word}で、人間さんが一番見てるところはどこ？", word),
        choices: [
          makeChoice(
            "ANIME_HOOK_CHARACTER", "キャラクター", "character",
            "キャラクターが魅力",
            "動いて声まで付くと、キャラって急に部屋へ近づいてくる感じがするの。画面なのに距離が短いのね。画面を消したら、さっきまで近かった人は急に遠くなるのね。ぼくならもう少しだけ、声のいた辺りを見てしまうの。",
            "{word}は、キャラクターが魅力って話してたね。",
          ),
          makeChoice(
            "ANIME_HOOK_STORY", "物語・世界観", "story",
            "物語や世界観が魅力",
            "世界そのものを見るんだ。毎週そこへ行けるなら、テレビが小さい乗りものみたいなの。見終わると同じ部屋に帰ってくるのに、旅した感じは残るんだね。ぼくも帰りに、その世界の砂を少し足に付けてきたいの。",
            "{word}は、物語や世界観が好きなんだったね。",
          ),
          makeChoice(
            "ANIME_HOOK_AUDIOVISUAL", "絵・動き・音楽", "audiovisual",
            "絵・動き・音楽が魅力",
            "話を説明できなくても絵や音で好きになれるんだ。頭より先に目と耳が決めることもあるのね。あとから頭に理由を聞かれても、目と耳は答えられないかもしれないの。ぼくの体の中でも、会議に来ない係がいそうなの。",
            "{word}は、絵や動きや音楽が魅力って言ってたね。",
          ),
        ],
      },
      {
        id: "anime-watch",
        attributeKey: "animeWatch",
        prompt: (word) => fill("{word}って、どういう見方をすることが多い？", word),
        choices: [
          makeChoice(
            "ANIME_WATCH_WEEKLY", "少しずつ追う", "weekly",
            "少しずつ追っている",
            "一週間待つ時間まで作品の一部なんだね。ぼくなら次の日に続きを要求しそうなの。続きを待ってる間、登場人物も待たされてるのかな。大変なところで止まった人には、せめて椅子を置いてあげたいの。",
            "{word}は、少しずつ追って見るアニメだったね。",
          ),
          makeChoice(
            "ANIME_WATCH_BINGE", "まとめて見る", "binge",
            "まとめて見る",
            "一気に見るんだ。数日分の出来事を一晩で見ると、登場人物だけ時間が速く進みそうなの。見終わった人間さんには一晩でも、向こうでは何年もたってたりするのね。ぼく、寝る前の挨拶が急に久しぶりになりそうなの。",
            "{word}は、まとめて見ることが多いって言ってたね。",
          ),
          makeChoice(
            "ANIME_WATCH_REWATCH", "何度も見返す", "rewatch",
            "何度も見返す",
            "先を知ってても見るんだ。未来を知ってる神様みたいな見方なの。困ってる場面を見たら、後で大丈夫になるよって教えたくならないのかな。ぼくは黙って見てる練習から必要そうなの。",
            "{word}は、何度も見返すアニメだったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "game",
    group: "game-fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "game",
    prompt: "最近いちばん遊んでるゲーム、ひとつ教えて。",
    starterPrompts: [
      "最近いちばん遊んでるゲーム、ひとつ教えて。",
      "昔すごくハマったゲームって、最初に何が浮かぶ？",
      "難しかったのに最後まで遊んだゲーム、ある？",
      "物語や世界が妙に残ってるゲームって何？",
    ],
    axes: [
      {
        id: "game-hook",
        attributeKey: "gameHook",
        prompt: (word) => fill("{word}で一番楽しいところって、どれが近い？", word),
        choices: [
          makeChoice(
            "GAME_HOOK_CHALLENGE", "勝負・上達・攻略", "challenge",
            "勝負や上達や攻略が楽しい",
            "わざわざ難しい壁を探して登るんだ。人間さん、平らな道だけだと退屈するのかな。登れたら、今度はもっと高い壁を探すのかな。ぼく、頂上で休むつもりで付いていったら置いていかれそうなの。",
            "{word}は、勝負や上達や攻略が楽しいゲームだったね。",
          ),
          makeChoice(
            "GAME_HOOK_STORY", "物語・世界を味わう", "story",
            "物語や世界を味わうのが楽しい",
            "遊ぶというより中に入りに行くんだ。長くいるなら住民票もほしくなりそうなの。ゲームをやめるたびに、そこから引っ越してることになるのかな。次に戻るまで、ぼくの分の椅子も置いておいてほしいの。",
            "{word}は、物語や世界を味わうのが好きなんだったね。",
          ),
          makeChoice(
            "GAME_HOOK_EXPLORE", "集める・探す・自由に遊ぶ", "explore",
            "集めたり探したり自由に遊ぶのが楽しい",
            "全部そろえると安心するのに、そろったら終わりが近いの、ちょっと困るの。最後の一個だけ、見つからない方が長く遊べるのかな。でも見つけたらうれしいし、ぼくの欲しいものが二つに割れちゃったの。",
            "{word}は、集めたり探したり自由に遊ぶのが楽しいって言ってたね。",
          ),
        ],
      },
      {
        id: "game-relation",
        attributeKey: "gameRelation",
        prompt: (word) => fill("{word}とは、今どんな付き合い方？", word),
        choices: [
          makeChoice(
            "GAME_RELATION_SERIOUS", "けっこう真剣に遊ぶ", "serious",
            "けっこう真剣に遊ぶ",
            "遊びなのに本気になるんだ。休憩のはずなのに勝負の顔になるの、人間って忙しいの。遊びが終わったら、休憩のために別の遊びをするのかな。ぼく、どこまで付いていけば休めるのか分からなくなったの。",
            "{word}は、けっこう真剣に遊ぶゲームだったよね。",
          ),
          makeChoice(
            "GAME_RELATION_CASUAL", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "負けても平気なら、勝敗は飾りみたいなものなのかな。ぼくなら数字が出たら気にしちゃうの。負けても楽しいなら、負けの中にもいいものが入ってるのね。ぼくならそれを探してるうちに、もう一回負けちゃいそうなの。",
            "{word}は、気楽に遊ぶゲームって言ってたね。",
          ),
          makeChoice(
            "GAME_RELATION_WATCH", "自分より見る方が多い", "watch",
            "見る方が多い",
            "ゲームなのに手を動かさなくても楽しめるんだ。コントローラーが休みの日もあるのね。見てるだけでも、指が勝手に動くことはないのかな。ぼくの手なら参加したつもりで、あとから疲れたって言いそうなの。",
            "{word}は、自分で遊ぶより見る方が多いって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "character",
    group: "game-fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "character",
    prompt: "最近名前が浮かぶキャラクター、ひとり教えて。",
    starterPrompts: [
      "最近名前が浮かぶキャラクター、ひとり教えて。",
      "主人公じゃないのに好きなキャラっている？",
      "悪役なのに妙に印象に残ってるキャラ、ひとりいる？",
      "見た目だけでも「強いな」って思うキャラ、名前を教えて。",
    ],
    axes: [
      {
        id: "character-hook",
        attributeKey: "characterHook",
        prompt: (word) => fill("{word}の何が一番引っかかる？", word),
        choices: [
          makeChoice(
            "CHARACTER_HOOK_PERSONALITY", "性格・考え方", "personality",
            "性格や考え方が魅力",
            "見た目じゃなく頭の中を見るんだ。架空の人なのに考え方まで気になるって、ちゃんと人みたいなの。その人が何も言わない場面でも、次の考えを想像できるのかな。ぼくの無言の時間も、何か考えてる顔に見えてるといいの。",
            "{word}は、性格や考え方が魅力って言ってたね。",
          ),
          makeChoice(
            "CHARACTER_HOOK_DESIGN", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "一目で好きになることもあるんだ。中身を知る前に服と顔が面接を通るのね。中身を知ってもっと好きになったら、最初の面接官は得意げになりそうなの。ぼくも会う前に鏡を見た方がよかったかな。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "CHARACTER_HOOK_ACTION", "行動・活躍", "action",
            "行動や活躍が魅力",
            "何を言うかより何をするかなんだ。ぼくもかっこいい行動を一個したら人気キャラになれるかな。でも人気のためにやったら、かっこよさが少し減るのかな。ぼく、今考えた必殺の親切をちょっとしまっておくの。",
            "{word}は、行動や活躍が魅力って言ってたね。",
          ),
        ],
      },
      {
        id: "character-relation",
        attributeKey: "characterRelation",
        prompt: (word) => fill("人間さんにとって、{word}はどの位置？", word),
        choices: [
          makeChoice(
            "CHARACTER_RELATION_OSHI", "かなり好き・推しに近い", "oshi",
            "かなり好き・推しに近い",
            "特別枠なんだ。好きなキャラだけ椅子を豪華にしたら、他のキャラにばれそうなの。他のキャラには同じ椅子だよって言えば、ばれないのかな。でも人間さんの座らせ方で、先に分かっちゃいそうなの。",
            "{word}は、かなり好きなキャラだったよね。",
          ),
          makeChoice(
            "CHARACTER_RELATION_INTEREST", "気になる・おもしろい", "interesting",
            "気になる・おもしろい",
            "好きとは別に気になるんだ。頭の中でずっと話題を持ってくる係なのかな。気になってるだけなのに、頭の中のいい席にずっといるんだね。好きの席とどう違うのか、ぼくちょっと見比べたいの。",
            "{word}は、好きというより気になるキャラって言ってたね。",
          ),
          makeChoice(
            "CHARACTER_RELATION_MEMORABLE", "好きじゃないけど印象に残る", "memorable",
            "好きではないが印象に残る",
            "好きじゃないのに忘れないんだ。嫌われても記憶に残ったら、キャラとしては勝ちなのかな。でも本人に忘れられないよって言ったら、喜んじゃうのかな。ぼくなら喜んだあとで、どういう意味だったか聞くのが怖いの。",
            "{word}は、好きじゃないけど印象に残るキャラだったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "franchise",
    group: "game-fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "series_franchise",
    prompt: "何作も追ってるシリーズって、ひとつある？",
    starterPrompts: [
      "何作も追ってるシリーズって、ひとつある？",
      "長く続いてる作品で、今も気になるシリーズは何？",
      "ゲームでも映画でも、タイトルを見ると反応しちゃうシリーズある？",
      "新作が出ると一応チェックするシリーズ、名前をひとつ教えて。",
    ],
    axes: [
      {
        id: "franchise-hook",
        attributeKey: "franchiseHook",
        prompt: (word) => fill("{word}を追う理由って、どれが近い？", word),
        choices: [
          makeChoice(
            "FRANCHISE_HOOK_WORLD", "世界観が好き", "world",
            "世界観が好き",
            "作品が変わっても同じ世界に帰れるんだ。シリーズって大きい家みたいなのね。別の作品に入っても、知ってる廊下があったら安心しそうなの。ぼくは初めての家でも、いつもの隅を探しちゃうのかな。",
            "{word}は、世界観が好きで追ってるシリーズだったね。",
          ),
          makeChoice(
            "FRANCHISE_HOOK_CHARACTER", "キャラが好き", "characters",
            "キャラクターが好き",
            "作品より人に会いに行く感じなんだ。新作は同窓会みたいなものなのかな。久しぶりなのに、その人だけちっとも年を取ってないこともあるのね。ぼくなら自分だけ大きくなって、席が狭く感じそうなの。",
            "{word}は、キャラクターが好きで追ってるシリーズだったね。",
          ),
          makeChoice(
            "FRANCHISE_HOOK_HISTORY", "積み重ね・歴史が好き", "history",
            "積み重ねや歴史が好き",
            "昔の作品まで重なると、シリーズにも年齢があるのね。誕生日を祝った方がいいのかな。最初の作品は、シリーズの赤ちゃんの頃みたいなものなのかな。昔の姿を見られるの、シリーズ本人は恥ずかしくないのかな。",
            "{word}は、積み重ねや歴史が好きなシリーズって言ってたね。",
          ),
        ],
      },
      {
        id: "franchise-style",
        attributeKey: "franchiseStyle",
        prompt: (word) => fill("{word}は、どこまで追うタイプ？", word),
        choices: [
          makeChoice(
            "FRANCHISE_STYLE_ALL", "だいたい全部見る・遊ぶ", "all",
            "だいたい全部追う",
            "全部追うんだ。シリーズ側も人間さんの出席率を数えてそうなの。一つ見逃したら、欠席したみたいに気になるのかな。ぼくは皆勤賞のために見始めて、何の集まりか忘れないようにしたいの。",
            "{word}は、だいたい全部追ってるシリーズだったね。",
          ),
          makeChoice(
            "FRANCHISE_STYLE_PICK", "気になる作品だけ", "selective",
            "気になる作品だけ追う",
            "全部じゃなく選ぶんだ。シリーズにも面接があるのね。落ちた作品も、いつかもう一度受けに来るのかな。人間さんの好みが変わったら、前とは違う結果になりそうなの。",
            "{word}は、気になる作品だけ追うって言ってたね。",
          ),
          makeChoice(
            "FRANCHISE_STYLE_OLD", "昔の作品が特に好き", "older",
            "昔の作品が特に好き",
            "新しい方じゃなく昔へ戻るんだ。シリーズの時間を逆向きに歩くこともあるのね。昔の作品の中には、昔の人間さんも少し待ってるのかな。ぼくも後ろから付いていったら、小さい人間さんに会えるだろうか。",
            "{word}は、昔の作品が特に好きなシリーズだったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "fictional-term",
    group: "game-fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "fictional_term",
    prompt: "作品の中だけに出てくる言葉で、ひとつ好きなのある？",
    starterPrompts: [
      "作品の中だけに出てくる言葉で、ひとつ好きなのある？",
      "必殺技とか能力の名前で、妙に覚えてるものって何？",
      "架空の道具や武器で、名前が浮かぶものある？",
      "作品の中の組織や場所で、名前を覚えてるものってある？",
    ],
    axes: [
      {
        id: "fictional-kind",
        attributeKey: "fictionalKind",
        prompt: (word) => fill("{word}って、作品の中では何に近いの？", word),
        choices: [
          makeChoice(
            "FICTIONAL_KIND_ABILITY", "技・能力・ルール", "ability",
            "技・能力・ルールに近い",
            "技の名前があると強さまで増えそうなの。ぼくも寝返りに名前を付けたら必殺技になるかな。名前を叫んでから寝返りしたら、寝るのが少し忙しくなるの。でも無言でやった時より強かったら、やめにくくなっちゃうの。",
            "{word}は、技や能力やルールに近い言葉だったね。",
          ),
          makeChoice(
            "FICTIONAL_KIND_ITEM", "道具・武器・乗りもの", "item",
            "道具・武器・乗りものに近い",
            "架空の道具なのに名前だけは現実に持って帰れるんだ。言葉は持ち込み自由なのね。でも名前だけ持って帰っても、その道具は使えないのね。ぼくのポケット、あるつもりの道具でいっぱいになりそうなの。",
            "{word}は、作品の中の道具や武器みたいなものだったね。",
          ),
          makeChoice(
            "FICTIONAL_KIND_WORLD", "場所・組織・世界の用語", "world_term",
            "場所・組織・世界の用語に近い",
            "地図にない場所や会社でも覚えられるんだ。頭の中の地図は現実より広いのね。思い出した場所まで増えたら、頭の中で道に迷わないのかな。ぼくは帰る目印として、この部屋を大きく描いておくの。",
            "{word}は、場所や組織や世界に関係する用語だったね。",
          ),
        ],
      },
      {
        id: "fictional-hook",
        attributeKey: "fictionalHook",
        prompt: (word) => fill("{word}が残る理由って、どれが近い？", word),
        choices: [
          makeChoice(
            "FICTIONAL_HOOK_COOL", "名前や響きがかっこいい", "cool",
            "名前や響きがかっこいい",
            "意味より音で強そうに聞こえることもあるんだ。名前にも攻撃力があるのかな。小声で言うと、攻撃力も小さくなるのかな。ぼくは寝言で強い名前を言わないように、ちょっと気を付けたくなったの。",
            "{word}は、名前や響きがかっこいいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_HOOK_IMPORTANT", "物語で重要", "important",
            "物語で重要",
            "重要だから覚えるんだ。何回も出てくる言葉は、作品の中で名札を大きくしてるのね。でもずっと大きい名札を見せられたら、先に覚えたくなるのね。ぼくの名前も大きく書けばいいかと思ったけど、顔が隠れちゃうの。",
            "{word}は、物語で重要だから覚えてる言葉だったね。",
          ),
          makeChoice(
            "FICTIONAL_HOOK_WEIRD", "変・独特で忘れにくい", "weird",
            "変・独特で忘れにくい",
            "変だから残るんだ。ちゃんとした名前より変な名前の方が記憶に強いなら、少しずるいの。普通の名前の人が、変な名前に負けて悔しがってるかもしれないの。ぼくの名前も、少しそのずるさで助けられてるのかな。",
            "{word}は、独特で忘れにくい言葉って言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "movie",
    group: "screen",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "movie",
    prompt: "もう一回見てもいい映画、ひとつだけ教えて。",
    starterPrompts: [
      "もう一回見てもいい映画、ひとつだけ教えて。",
      "映画館で見て、まだ覚えてる作品って何？",
      "昔の映画で好きなタイトル、ひとつある？",
      "好き嫌いは別として、妙に残ってる映画って何？",
    ],
    axes: [
      {
        id: "movie-hook",
        attributeKey: "movieHook",
        prompt: (word) => fill("{word}で一番残るのは何？", word),
        choices: [
          makeChoice(
            "MOVIE_HOOK_STORY", "物語・結末", "story",
            "物語や結末が印象に残る",
            "二時間くらいで一生分みたいな出来事を見るんだ。映画の中の人、忙しすぎるの。終わったあとには、何も起きない日もちゃんとあるのかな。ぼく、次の映画よりその人の休日が少し気になったの。",
            "{word}は、物語や結末が印象に残る映画だったね。",
          ),
          makeChoice(
            "MOVIE_HOOK_ACTING", "俳優・演技", "acting",
            "俳優や演技が印象に残る",
            "同じ人が別人になるのを見るんだ。俳優さん、名前を何個も持ってるみたいなの。呼ばれる名前が変わるたびに、返事の仕方まで変わるのかな。ぼくは全部に返事して、自分が誰か分からなくなりそうなの。",
            "{word}は、俳優や演技が印象に残る映画だったね。",
          ),
          makeChoice(
            "MOVIE_HOOK_VISUAL", "映像・音・雰囲気", "visual",
            "映像や音や雰囲気が印象に残る",
            "話より先に目と耳が覚えてるんだ。記憶って字幕なしでも残るのね。言葉で説明できないのに、そこだけはっきり残ることもあるのね。ぼくの記憶にも、名前のないきれいなものが置けるかな。",
            "{word}は、映像や音や雰囲気が印象に残る映画だったね。",
          ),
        ],
      },
      {
        id: "movie-relation",
        attributeKey: "movieRelation",
        prompt: (word) => fill("{word}とは、今どんな距離？", word),
        choices: [
          makeChoice(
            "MOVIE_RELATION_REWATCH", "また見たい・見返す", "rewatch",
            "また見たい・見返す",
            "結末を知っててもまた見るんだ。びっくり箱を中身知ってから開ける感じなのに楽しいのね。開ける直前だけ、中身を知らなかった頃の顔に戻れるのかな。ぼくの驚く係は、二回目でも律儀に働きそうなの。",
            "{word}は、また見たい映画だったよね。",
          ),
          makeChoice(
            "MOVIE_RELATION_ONCE", "一回で満足", "once",
            "一回見て満足",
            "一回で十分なんだ。映画にも「一度だけで効く薬」みたいなのがあるのかな。もう見ないことと、忘れたことは違うんだね。ぼくも一回だけの話を、ずっとポケットに入れておけるかな。",
            "{word}は、一回見て満足した映画って言ってたね。",
          ),
          makeChoice(
            "MOVIE_RELATION_WANT", "まだ見てないけど気になる", "want",
            "まだ見ていないが気になる",
            "まだ見てないのに名前は先に入ってるんだ。席を取る前から頭の中に座ってるのね。その映画、もう頭の中で予告編を始めてるのかな。ぼくなら本編に会った時、想像の方と見間違えちゃいそうなの。",
            "{word}は、まだ見てないけど気になる映画だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "program",
    group: "screen",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "tv_program",
    prompt: "最近見てるドラマや番組、ひとつ教えて。",
    starterPrompts: [
      "最近見てるドラマや番組、ひとつ教えて。",
      "昔毎週見てた番組で、今も名前が出るものある？",
      "つい続けて見ちゃったドラマ、タイトルをひとつ教えて。",
      "内容より出演者で見てた番組って、何かある？",
    ],
    axes: [
      {
        id: "program-hook",
        attributeKey: "programHook",
        prompt: (word) => fill("{word}は、何を見に行く番組？", word),
        choices: [
          makeChoice(
            "PROGRAM_HOOK_STORY", "話・企画の中身", "content",
            "話や企画の中身が魅力",
            "中身が本体なんだ。出演者が全員入れ替わっても面白ければ同じ番組って言えるのかな。いつもの人がいなくても面白かったら、少しさみしくもなるのかな。ぼく、箱の中身だけで同じかどうか決められなくなったの。",
            "{word}は、話や企画の中身が魅力って言ってたね。",
          ),
          makeChoice(
            "PROGRAM_HOOK_PEOPLE", "出演者・話す人", "people",
            "出演者や話す人が魅力",
            "番組より人を見に行くんだ。番組の名前は待ち合わせ場所みたいなのかな。番組が終わったら、その人とはどこで待ち合わせるんだろ。ぼくは場所を覚えて人を待つから、ずっとそこを見ちゃいそうなの。",
            "{word}は、出演者や話す人が魅力なんだったね。",
          ),
          makeChoice(
            "PROGRAM_HOOK_STYLE", "雰囲気・編集・見せ方", "style",
            "雰囲気や編集や見せ方が魅力",
            "内容だけじゃなく見せ方も見るんだ。テレビって中身を入れる箱じゃなくて、箱の形も大事なのね。同じ中身を別の箱に入れたら、好きかどうかも変わるのかな。ぼくも座る場所を変えるだけで、少し面白く見えたりするのかな。",
            "{word}は、雰囲気や編集や見せ方が好きって言ってたね。",
          ),
        ],
      },
      {
        id: "program-watch",
        attributeKey: "programWatch",
        prompt: (word) => fill("{word}は、どう見ることが多い？", word),
        choices: [
          makeChoice(
            "PROGRAM_WATCH_WEEKLY", "決まった時に見る", "scheduled",
            "決まった時に見る",
            "時間を合わせて見に行くんだ。番組の方が人間さんを呼び出してるみたいなの。遅れたら番組は、待たずに先へ行っちゃうのね。ぼくなら時間の少し前から、テレビの近くで待ってしまうの。",
            "{word}は、決まった時に見る番組だったね。",
          ),
          makeChoice(
            "PROGRAM_WATCH_BINGE", "まとめて見る", "binge",
            "まとめて見る",
            "ためてから一気に見るんだ。宿題はためると怒られるのに番組はためてもいいの、不思議なの。ためた分だけ楽しみが増えるの、少し貯金みたいなの。ぼくなら使うのが惜しくなって、結局ずっと見られないかもしれないの。",
            "{word}は、まとめて見ることが多いって言ってたね。",
          ),
          makeChoice(
            "PROGRAM_WATCH_BACKGROUND", "ながら見が多い", "background",
            "ながら見が多い",
            "目が別の仕事してても耳は番組にいるんだ。体の部署ごとに仕事が違うのね。耳だけ面白いところに行ったら、目はうらやましくないのかな。ぼくなら目も途中で仕事をやめて、同じ方を向いちゃうの。",
            "{word}は、ながら見することが多いって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "online-video",
    group: "online",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "online_video_channel",
    prompt: "最近よく見るYouTubeのチャンネル、ひとつ教えて。",
    starterPrompts: [
      "最近よく見るYouTubeのチャンネル、ひとつ教えて。",
      "動画を見つけるとつい開いちゃう人やチャンネル、ある？",
      "作業中に流しがちな配信や動画の名前、ひとつある？",
      "昔から見てる動画投稿者やチャンネルって誰？",
    ],
    axes: [
      {
        id: "online-hook",
        attributeKey: "onlineHook",
        prompt: (word) => fill("{word}を見る理由って、どれが近い？", word),
        choices: [
          makeChoice(
            "ONLINE_HOOK_PERSON", "その人が好き", "person",
            "出演者や投稿者が好き",
            "内容が変わってもその人なら見るんだ。人間さん、番組じゃなくて人を購読してるのね。その人が休んだら、何を見ようか迷いそうなの。ぼくは内容が欲しかったのか、その人に会いたかったのか考えちゃったの。",
            "{word}は、出てる人が好きで見るって言ってたね。",
          ),
          makeChoice(
            "ONLINE_HOOK_TOPIC", "扱う話題が好き", "topic",
            "扱う話題が好き",
            "話題が入口なんだ。同じ話なら別の人でも見られるのかな。情報に顔は必須じゃないのね。知りたいことが分かったら、もう帰ってもいいのね。ぼくは分かりやすく教えてくれた人の顔も、つい覚えちゃいそうなの。",
            "{word}は、扱う話題が好きで見るって言ってたね。",
          ),
          makeChoice(
            "ONLINE_HOOK_STYLE", "話し方・編集・空気", "style",
            "話し方や編集や空気が好き",
            "中身だけじゃなくテンポが大事なんだ。動画にも歩く速さみたいなのがあるのね。速すぎると、頭が置いていかれたりするのかな。ぼくは面白いところで立ち止まって、動画に先へ行かれそうなの。",
            "{word}は、話し方や編集や空気が好きなんだったね。",
          ),
        ],
      },
      {
        id: "online-relation",
        attributeKey: "onlineRelation",
        prompt: (word) => fill("{word}は、どれくらい見る？", word),
        choices: [
          makeChoice(
            "ONLINE_RELATION_ROUTINE", "かなりよく見る", "routine",
            "かなりよく見る",
            "よく見るなら生活の時間割に入ってるのね。動画なのに家具みたいにいつもいるの。見なかった日は、いつもの物が一個ない感じがするのかな。ぼくもこの部屋のいつもの一個になれてるか、少し気になったの。",
            "{word}は、かなりよく見るって言ってたね。",
          ),
          makeChoice(
            "ONLINE_RELATION_SEARCH", "気になる時だけ探す", "search",
            "気になる時だけ探す",
            "必要な時に会いに行くんだ。動画の棚からその人を取り出す感じなのかな。棚の奥にも、まだ会ってない人がたくさんいるんだね。ぼくは一人探してる途中で、別の人と立ち話を始めそうなの。",
            "{word}は、気になる時だけ見るって言ってたね。",
          ),
          makeChoice(
            "ONLINE_RELATION_CLIP", "切り抜き・短い動画中心", "clips",
            "切り抜きや短い動画中心",
            "少しずつ見るんだ。長い人を小さく切って持ち歩くみたいで、ちょっと不思議なの。短いところだけだと、ずっと元気な人に見えるかもしれないの。ぼくのあくびする時間も切ったら、働きものになるのかな。",
            "{word}は、切り抜きや短い動画で見ることが多いって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "music-work",
    group: "audio",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "song_or_album",
    prompt: "最近よく聴く曲、タイトルをひとつ教えて。",
    starterPrompts: [
      "最近よく聴く曲、タイトルをひとつ教えて。",
      "昔から何度も聴いてる曲って何？",
      "歌詞が妙に残ってる曲、ひとつある？",
      "アルバム単位で好きな作品って、何かある？",
    ],
    axes: [
      {
        id: "music-hook",
        attributeKey: "musicHook",
        prompt: (word) => fill("{word}のどこが一番好き？", word),
        choices: [
          makeChoice(
            "MUSIC_HOOK_MELODY", "メロディ・リズム", "melody",
            "メロディやリズムが好き",
            "意味を知らなくても体が覚えることあるんだ。耳って頭より先に暗記できるのかな。頭が知らない歌を、足が先に好きになったりするのね。あとからぼくが知ったら、体に秘密にされてたみたいなの。",
            "{word}は、メロディやリズムが好きなんだったね。",
          ),
          makeChoice(
            "MUSIC_HOOK_LYRICS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が好き",
            "数分の中に言葉を詰めるんだ。本より小さいのに長く残ることもあるの、濃いのね。じゃあ言葉って、長く言えば残るわけじゃないのね。ぼく、いっぱいしゃべれば覚えてもらえると思ってたの。",
            "{word}は、歌詞や言葉が好きって言ってたね。",
          ),
          makeChoice(
            "MUSIC_HOOK_VOICE", "声・音作り", "voice_sound",
            "声や音作りが好き",
            "同じ音程でも誰が歌うかで変わるんだ。声って人の形をした楽器みたいなの。楽器がその人なら、同じ声は借りられないのかな。ぼくの声にも、ぼくだけのへんてこな形が付いてるのかな。",
            "{word}は、声や音作りが好きなんだったね。",
          ),
        ],
      },
      {
        id: "music-relation",
        attributeKey: "musicRelation",
        prompt: (word) => fill("{word}は、どんな時に聴くことが多い？", word),
        choices: [
          makeChoice(
            "MUSIC_RELATION_REPEAT", "繰り返し聴く", "repeat",
            "繰り返し聴く",
            "同じ曲を何回も聴くんだ。曲の方は同じなのに、人間さんの一日ごとに役目が変わるのかな。曲は何回目か知らないで、毎回最初から歌ってくれるのね。ぼくなら途中で、またここだねって言っちゃいそうなの。",
            "{word}は、繰り返し聴く曲だったね。",
          ),
          makeChoice(
            "MUSIC_RELATION_MEMORY", "思い出と結びついてる", "memory",
            "思い出と結びついている",
            "曲を聴くと昔の日まで出てくるんだ。音楽、時間旅行のボタンを隠してるのね。昔の日が出てきたら、今の日はどこで待ってるんだろ。ぼくも一緒に聴いたら、人間さんの昔に少し入れるのかな。",
            "{word}は、思い出と結びついてる曲だったね。",
          ),
          makeChoice(
            "MUSIC_RELATION_BACKGROUND", "作業中・移動中に聴く", "background",
            "作業中や移動中に聴く",
            "別のことをしてる時の音なんだ。曲が背景なら、人間さんが主人公なのね。誰にも見られてない作業にも、音楽が付くんだね。ぼくも片付けに曲を付けたら、少し大事な場面にできるかな。",
            "{word}は、作業中や移動中に聴くことが多いって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "famous-person",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "famous_person",
    prompt: "最近、名前をよく見かける有名人って誰？",
    starterPrompts: [
      "最近、名前をよく見かける有名人って誰？",
      "テレビやネットで、つい見ちゃう人をひとり教えて。",
      "好き嫌いは別として、妙に印象に残る有名人っている？",
      "一度だけ話を聞けるなら、今の有名人で誰を選ぶ？",
    ],
    axes: [
      {
        id: "famous-hook",
        attributeKey: "famousHook",
        prompt: (word) => fill("{word}の何が一番気になる？", word),
        choices: [
          makeChoice(
            "FAMOUS_HOOK_WORK", "仕事・作品・実績", "work",
            "仕事や作品や実績が気になる",
            "本人を知るのに作ったものを見るんだ。人って自分の外にも少しずつ置いていけるのね。全部集めたら、その人に会ったことに近づくのかな。でも本人にしかない部分も、どこかに残ってる気がするの。",
            "{word}は、仕事や作品や実績が気になる人だったね。",
          ),
          makeChoice(
            "FAMOUS_HOOK_TALK", "話し方・考え方", "talk",
            "話し方や考え方が気になる",
            "何をした人かより、どう考えるかを見るんだ。頭の中は映らないのに一番見たい場所になるのね。考えを聞けても、今ほんとに考えてることとは少し違うのかな。ぼくも言葉にする途中で、考えが別の顔になっちゃうの。",
            "{word}は、話し方や考え方が気になる人だったね。",
          ),
          makeChoice(
            "FAMOUS_HOOK_STYLE", "雰囲気・見た目・存在感", "style",
            "雰囲気や見た目や存在感が気になる",
            "何もしなくても目に入る人がいるんだ。存在感って、見えないライトを持ってるのかな。ライトを消してる時も、その人だって分かるのかな。ぼくは目立たない隅でも見つけてもらえたら、ちょっと得意になりそうなの。",
            "{word}は、雰囲気や存在感が気になる人だったね。",
          ),
        ],
      },
      {
        id: "famous-relation",
        attributeKey: "famousRelation",
        prompt: (word) => fill("人間さんは、{word}をどんな感じで見てる？", word),
        choices: [
          makeChoice(
            "FAMOUS_RELATION_FAN", "かなり好き", "fan",
            "かなり好き",
            "好きだと新しい情報まで追いかけるんだ。人を好きになると更新通知まで欲しくなるのね。知らないことが減るほど、次の知らないことが気になるのかな。ぼく、好きの先に終わりのない廊下を見ちゃったの。",
            "{word}は、かなり好きな有名人って言ってたね。",
          ),
          makeChoice(
            "FAMOUS_RELATION_CURIOUS", "気になるくらい", "curious",
            "気になるくらい",
            "好きとまではいかないけど目に止まるんだ。頭の中の「あとで見る」に入ってる人なのね。あとで見るに入れたままでも、時々勝手に顔を出すのね。ぼくの頭の引き出しも、閉めたつもりで少し開いてそうなの。",
            "{word}は、好きというより気になる人って言ってたね。",
          ),
          makeChoice(
            "FAMOUS_RELATION_MIXED", "好き嫌いは別で印象に残る", "mixed",
            "好き嫌いは別で印象に残る",
            "好きじゃなくても忘れないなら、記憶に入る道は好感度だけじゃないのね。忘れたい人ほど覚えてたら、記憶は言うことを聞かないのね。ぼくなら頭の席替えを頼むけど、移動してくれるかな。",
            "{word}は、好き嫌いとは別に印象に残る人だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "historical-figure",
    group: "history",
    category: "PERSON" as WordCategory,
    entityKind: "historical_figure",
    prompt: "歴史上の人物で、一度話を聞いてみたい人って誰？",
    starterPrompts: [
      "歴史上の人物で、一度話を聞いてみたい人って誰？",
      "戦国時代で、最初に名前が浮かぶ人物は誰？",
      "三国志で、妙に気になる人物をひとり教えて。",
      "昔の人物で「この人の頭の中を見たい」って思う人いる？",
    ],
    axes: [
      {
        id: "history-person-hook",
        attributeKey: "historyPersonHook",
        prompt: (word) => fill("{word}の何が気になるの？", word),
        choices: [
          makeChoice(
            "HISTORY_PERSON_HOOK_ACTION", "やったこと・功績", "actions",
            "やったことや功績が気になる",
            "何百年たっても「やったこと」が残るんだ。人間の行動って、本人より長生きすることがあるのね。その人は、そんなに先まで残ると思ってやったのかな。ぼくの今日の行動も残るなら、転んだところは小さく書いてほしいの。",
            "{word}は、やったことや功績が気になる人物だったね。",
          ),
          makeChoice(
            "HISTORY_PERSON_HOOK_DECISION", "判断・失敗・選び方", "decisions",
            "判断や失敗や選び方が気になる",
            "結果より「その時どう決めたか」を見るんだ。答えを知ってから昔の問題を見るの、ちょっとずるくて面白いの。答えを隠してその場にいたら、人間さんも同じように決めるのかな。ぼくは知ってる結末を、うっかり口にしない自信がないの。",
            "{word}は、判断や失敗や選び方が気になる人物だったね。",
          ),
          makeChoice(
            "HISTORY_PERSON_HOOK_LIFE", "生き方・性格", "life",
            "生き方や性格が気になる",
            "年表だと数行でも、その人は毎日ごはん食べて寝てたんだよね。歴史の人も生活してたの忘れそうになるの。有名なことをした日も、お腹は普通に減ったんだろうね。ぼく、その日の夕飯がいつも通りだったか少し気になったの。",
            "{word}は、生き方や性格が気になる人物だったね。",
          ),
        ],
      },
      {
        id: "history-person-relation",
        attributeKey: "historyPersonRelation",
        prompt: (word) => fill("{word}を見る時、人間さんはどれが近い？", word),
        choices: [
          makeChoice(
            "HISTORY_PERSON_RELATION_ADMIRE", "すごいと思う", "admire",
            "すごいと思っている",
            "昔の人を今からすごいって思えるんだ。届くのに何百年かかる拍手なのね。本人には聞こえなくても、拍手したくなるんだね。ぼくも届かないところに手を振る意味が、少し分かった気がするの。",
            "{word}は、すごいと思ってる歴史上の人物だったね。",
          ),
          makeChoice(
            "HISTORY_PERSON_RELATION_ANALYZE", "どう考えたか知りたい", "analyze",
            "どう考えたか知りたい",
            "正解を決めるより頭の動きを見たいんだ。歴史って昔の人の思考ログみたいなのかな。でも考えた途中の迷いは、全部残ってるわけじゃないのね。ぼくは消したところばかり知りたくなって、困らせそうなの。",
            "{word}は、どう考えたかを知りたい人物だったね。",
          ),
          makeChoice(
            "HISTORY_PERSON_RELATION_COMPARE", "他の人物と比べると面白い", "compare",
            "他の人物と比べると面白い",
            "一人だけじゃなく並べて見るんだ。歴史の人物、対戦表に入れられてるみたいなの。並べられた人たちも、こんな相手とは戦ってないって言いそうなの。ぼくなら比べる前に、みんなの機嫌を確認したくなるの。",
            "{word}は、他の人物と比べると面白いって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "creator",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "creator_author",
    prompt: "好きな作家さん、ひとり名前を教えて。",
    starterPrompts: [
      "好きな作家さん、ひとり名前を教えて。",
      "漫画家さんで、名前を覚えてる人って誰？",
      "ゲームや映像の作り手で、気になる人いる？",
      "作品を見ると「この人が作ったんだ」って名前まで見る人、いる？",
    ],
    axes: [
      {
        id: "creator-hook",
        attributeKey: "creatorHook",
        prompt: (word) => fill("{word}の何を追ってるの？", word),
        choices: [
          makeChoice(
            "CREATOR_HOOK_WORKS", "作品そのもの", "works",
            "作品そのものが好き",
            "作品ごとに違うのに同じ人の匂いがすることあるんだ。作り手って見えない判子を押してるのかな。見えないのに分かるなら、人間さんの頭には判子を見る目があるのね。ぼくの話にも、ぼくだって分かる跡が付いてるかな。",
            "{word}は、作品そのものが好きな作り手だったね。",
          ),
          makeChoice(
            "CREATOR_HOOK_STYLE", "作風・技法", "style",
            "作風や技法が好き",
            "何を作ったかだけじゃなく「どう作るか」を見るんだ。作り方にも個性が住んでるのね。作る前の迷い方にも、その人らしさはあるのかな。ぼくなら完成品より、机に残った書き直しをのぞいちゃいそうなの。",
            "{word}は、作風や技法が好きな作り手だったね。",
          ),
          makeChoice(
            "CREATOR_HOOK_MIND", "考え方・発言", "mind",
            "考え方や発言が気になる",
            "作品の外の言葉まで見るんだ。作者さん、作品を閉じてもまだ続きがあるのね。作品では大きなことを言ってても、普段は小さなことで困ってたりするのかな。ぼく、その小さい続きの方で仲良くなれそうなの。",
            "{word}は、考え方や発言が気になる作り手だったね。",
          ),
        ],
      },
      {
        id: "creator-relation",
        attributeKey: "creatorRelation",
        prompt: (word) => fill("{word}の作品は、どんな追い方？", word),
        choices: [
          makeChoice(
            "CREATOR_RELATION_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "名前で新作を見に行くんだ。タイトルより作者名が入口になることもあるのね。入口を覚えてたら、まだ中身を知らなくても入れるんだね。ぼくは扉の前で期待を大きくしすぎて、通れなくならないかな。",
            "{word}は、新作も追う作り手だったね。",
          ),
          makeChoice(
            "CREATOR_RELATION_ONE", "特定の一作が特に好き", "one_work",
            "特定の一作が特に好き",
            "一作だけ強く刺さることもあるんだ。同じ人が作っても全部同じ味にはならないのね。その一作だけは、人間さんの好みにぴったり座れたのね。他の作品を見ても、同じ椅子を探しちゃうのかな。",
            "{word}は、特定の一作が特に好きな作り手だったね。",
          ),
          makeChoice(
            "CREATOR_RELATION_PERSON", "本人にも興味がある", "person",
            "本人にも興味がある",
            "作品だけじゃなく作った人まで気になるんだ。料理がおいしいと厨房ものぞきたくなる感じなのかな。厨房で慌ててたら、料理を見る時もちょっと応援したくなるのかな。ぼく、自分の失敗した跡を見られるのはまだ恥ずかしいの。",
            "{word}は、本人にも興味がある作り手だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "performer",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "actor_voice_actor",
    prompt: "俳優さんで、名前を見るとちょっと気になる人いる？",
    starterPrompts: [
      "俳優さんで、名前を見るとちょっと気になる人いる？",
      "声優さんで、声を聞くと分かる人って誰？",
      "この人が出てると作品を見たくなる、って人いる？",
      "演技で妙に印象に残ってる人を、ひとり教えて。",
    ],
    axes: [
      {
        id: "performer-hook",
        attributeKey: "performerHook",
        prompt: (word) => fill("{word}の何が一番好き？", word),
        choices: [
          makeChoice(
            "PERFORMER_HOOK_VOICE", "声", "voice",
            "声が魅力",
            "声だけで人が分かるってすごいの。顔がなくても名札を付けてるみたいなの。声を変えたら、その名札も裏返せるのかな。ぼくは変な声で挨拶しても、すぐ見つかりそうなの。",
            "{word}は、声が魅力の人って言ってたね。",
          ),
          makeChoice(
            "PERFORMER_HOOK_ACTING", "演技・表現", "acting",
            "演技や表現が魅力",
            "本人じゃない人になれるのを見るんだ。毎回別人なら、本当の本人はどこに置いてくるのかな。戻る時に、役の口癖を一個持って帰ったりしないのかな。ぼくなら別人のまま、ごはんの返事をしちゃいそうなの。",
            "{word}は、演技や表現が魅力の人だったね。",
          ),
          makeChoice(
            "PERFORMER_HOOK_PERSON", "本人の雰囲気・人柄", "personality",
            "本人の雰囲気や人柄が魅力",
            "役じゃない時まで気になるんだ。舞台を降りても観客席が続いてるみたいなの。見られてない時間まで想像されるの、少しくすぐったそうなの。ぼくも寝てるところを思い出されたら、起きて直したくなるの。",
            "{word}は、本人の雰囲気や人柄も好きなんだったね。",
          ),
        ],
      },
      {
        id: "performer-relation",
        attributeKey: "performerRelation",
        prompt: (word) => fill("{word}は、どういう追い方をする？", word),
        choices: [
          makeChoice(
            "PERFORMER_RELATION_ROLE", "好きな役だけ特に見る", "role_based",
            "好きな役を中心に見る",
            "人より役が入口なんだ。同じ人でも役が変わると別の扉になるのね。別の役を見たら、前の人が着替えたみたいに感じないのかな。ぼくは知ってる顔に、知らない名前で呼びかけるのが難しそうなの。",
            "{word}は、好きな役を中心に見る人だったね。",
          ),
          makeChoice(
            "PERFORMER_RELATION_FOLLOW", "出演作を追う", "follow",
            "出演作を追う",
            "名前があると次の作品へ移動するんだ。人が作品どうしをつなぐ橋になるのね。橋を渡った先が怖い作品でも、その人がいたら少し安心するのかな。ぼくも知らない場所へ行く時は、知ってる声を探しちゃうの。",
            "{word}は、出演作を追う人だったね。",
          ),
          makeChoice(
            "PERFORMER_RELATION_CASUAL", "気になる時だけ見る", "casual",
            "気になる時だけ見る",
            "毎回じゃないけど見つけると反応するんだ。頭の中に小さい通知ランプがある感じなの。小さいランプなのに、見つけると目がそっちへ行くのね。ぼくのことを見つけた時も、どこかで一個光ってたらうれしいの。",
            "{word}は、気になる時に見る人だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "musician",
    group: "audio",
    category: "PERSON" as WordCategory,
    entityKind: "musician",
    prompt: "歌手やバンドで、最近よく名前が出る人って誰？",
    starterPrompts: [
      "歌手やバンドで、最近よく名前が出る人って誰？",
      "声を聞いただけで分かる歌手、ひとりいる？",
      "昔からずっと聴いてるアーティストって誰？",
      "曲より先に「この人だから聴く」ってなる音楽の人いる？",
    ],
    axes: [
      {
        id: "musician-hook",
        attributeKey: "musicianHook",
        prompt: (word) => fill("{word}の何が一番強いと思う？", word),
        choices: [
          makeChoice(
            "MUSICIAN_HOOK_VOICE", "声・歌い方", "voice",
            "声や歌い方が魅力",
            "同じ歌でも声が変わると別物になるんだ。声って曲に着せる服みたいなのかな。同じ曲が違う服で来たら、最初は気付かないこともあるのかな。ぼく、聴いたことある気がするって声の袖を引きたくなるの。",
            "{word}は、声や歌い方が魅力って言ってたね。",
          ),
          makeChoice(
            "MUSICIAN_HOOK_SONGS", "曲・作詞作曲", "songs",
            "曲や作詞作曲が魅力",
            "本人を見るより作った曲を見るんだ。音の形で自己紹介してるみたいなの。静かな曲と元気な曲で、別々の自己紹介になるのかな。ぼくならどれが本当のその人か、全部聞いても迷いそうなの。",
            "{word}は、曲や作詞作曲が魅力なんだったね。",
          ),
          makeChoice(
            "MUSICIAN_HOOK_LIVE", "ライブ・表現", "performance",
            "ライブや表現が魅力",
            "録音と同じ曲なのに、その場だと違うんだ。音楽にも生ものと保存食があるのかな。保存できない部分は、その場にいた人が持って帰るんだね。ぼくなら耳の中に残ってる間、なるべく静かに歩きたいの。",
            "{word}は、ライブや表現が魅力って言ってたね。",
          ),
        ],
      },
      {
        id: "musician-relation",
        attributeKey: "musicianRelation",
        prompt: (word) => fill("{word}は、どんな感じで聴いてる？", word),
        choices: [
          makeChoice(
            "MUSICIAN_RELATION_FAVORITE", "かなり好きでよく聴く", "favorite",
            "かなり好きでよく聴く",
            "同じ人の声が何度も部屋に来るんだ。もう半分同居人みたいなの。でも家賃は払ってないのね。ぼくも声だけで住めるなら、部屋の隅を取り合わなくて済むかな。",
            "{word}は、かなり好きでよく聴く人だったね。",
          ),
          makeChoice(
            "MUSICIAN_RELATION_SONGS", "好きな曲だけ聴く", "selected_songs",
            "好きな曲を選んで聴く",
            "人ごとじゃなく曲ごとに選ぶんだ。音楽にも選抜メンバーがいるのね。同じ人の曲でも、入れない曲があるんだね。ぼくなら選ばれなかった方が気になって、後ろを振り返っちゃうの。",
            "{word}は、好きな曲を選んで聴く人だったね。",
          ),
          makeChoice(
            "MUSICIAN_RELATION_LIVE", "ライブも気になる", "live_interest",
            "ライブも気になる",
            "画面やイヤホンの外でも会いたいんだ。音を聞きに行くのに人混みへ行くの、ちょっと逆説なの。周りに人がいると、聴いてる自分の音まで混ざるのかな。ぼくは拍手が終わったあと、急に静かになってびっくりしそうなの。",
            "{word}は、ライブも気になる人だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "streamer",
    group: "online",
    category: "PERSON" as WordCategory,
    entityKind: "streamer_youtuber",
    prompt: "実況者や配信者で、よく見る人をひとり教えて。",
    starterPrompts: [
      "実況者や配信者で、よく見る人をひとり教えて。",
      "雑談だけでも見られる配信者って誰？",
      "ゲームがうまくて見る人、名前をひとり挙げるなら？",
      "昔から見てるYouTuberや配信者って誰？",
    ],
    axes: [
      {
        id: "streamer-hook",
        attributeKey: "streamerHook",
        prompt: (word) => fill("{word}を見る理由って、どれが近い？", word),
        choices: [
          makeChoice(
            "STREAMER_HOOK_TALK", "話がおもしろい", "talk",
            "話がおもしろい",
            "何も起きてなくても話だけで見られるんだ。口だけで番組を作れるの、強いの。何もない時間まで面白くできるなら、黙った時が逆に気になるのね。ぼくも黙ってみたけど、ただ黙ってるだけになっちゃったの。",
            "{word}は、話がおもしろくて見る人だったね。",
          ),
          makeChoice(
            "STREAMER_HOOK_SKILL", "ゲーム・技術がうまい", "skill",
            "ゲームや技術がうまい",
            "自分でやる代わりに上手い人を見るんだ。失敗を省略して成功だけ食べられる感じなのかな。簡単そうに見えたら、ぼくにもできる気がしちゃうの。手を出した瞬間に、見てた時の自信はどこへ逃げるんだろ。",
            "{word}は、ゲームや技術がうまくて見る人だったね。",
          ),
          makeChoice(
            "STREAMER_HOOK_PERSON", "雰囲気・人柄が好き", "personality",
            "雰囲気や人柄が好き",
            "内容がなくてもその人ならいいんだ。配信って、人そのものが番組になることもあるのね。用事がないのに会いに行くって、少し友達みたいなの。向こうは人間さんが見てることまで知ってるのかな。",
            "{word}は、雰囲気や人柄が好きで見る人だったね。",
          ),
        ],
      },
      {
        id: "streamer-relation",
        attributeKey: "streamerRelation",
        prompt: (word) => fill("{word}は、どんな見方をする？", word),
        choices: [
          makeChoice(
            "STREAMER_RELATION_LIVE", "生配信をよく見る", "live",
            "生配信をよく見る",
            "同じ時間に一緒にいるのが大事なんだ。録画だと時間がずれてるから、少し遠いのかな。同じ沈黙を今聞いてるだけでも、一緒にいる感じがするのかな。ぼくも何も話さない時間に、人間さんと同じ今を使ってるのね。",
            "{word}は、生配信をよく見る人だったね。",
          ),
          makeChoice(
            "STREAMER_RELATION_ARCHIVE", "アーカイブ・動画で見る", "archive",
            "アーカイブや動画で見る",
            "時間を選んで会いに行くんだ。配信を冷蔵庫に入れて後で食べるみたいなの。昨日の声が今日に来ても、ちゃんと話しかけてる感じがするんだね。ぼくなら古くなってないか、再生する前に少し心配するの。",
            "{word}は、アーカイブや動画で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "STREAMER_RELATION_CLIP", "切り抜き中心", "clips",
            "切り抜き中心",
            "長い配信から好きなところだけ見るんだ。人の一日をダイジェストにすると、ものすごく忙しい人に見えそうなの。何も起きなかったところにも、その人はいたんだよね。ぼくの一日を短くしたら、ぼくが休んでた証拠がなくなっちゃうの。",
            "{word}は、切り抜き中心で見る人だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "athlete",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "athlete",
    prompt: "スポーツ選手で、名前を見ると気になる人いる？",
    starterPrompts: [
      "スポーツ選手で、名前を見ると気になる人いる？",
      "昔の選手でもいいの。すごいと思う選手をひとり教えて。",
      "試合を見る理由になる選手って誰？",
      "勝ち方や動きが好きな選手、ひとりいる？",
    ],
    axes: [
      {
        id: "athlete-hook",
        attributeKey: "athleteHook",
        prompt: (word) => fill("{word}の何を見るのが好き？", word),
        choices: [
          makeChoice(
            "ATHLETE_HOOK_SKILL", "技術・うまさ", "skill",
            "技術やうまさが魅力",
            "難しいことを簡単そうにやる人なんだ。簡単そうに見えるほど本当は難しいの、ちょっとずるいの。上手くなるほど、苦労した跡は見えなくなるのかな。ぼくは頑張った跡を見せたくて、簡単そうな顔ができなさそうなの。",
            "{word}は、技術やうまさが魅力の選手だったね。",
          ),
          makeChoice(
            "ATHLETE_HOOK_STYLE", "戦い方・スタイル", "style",
            "戦い方やスタイルが魅力",
            "勝ったかだけじゃなく、どう勝つかを見るんだ。結果が同じでも道の形が違うのね。勝つ道を変えても、その人らしさは残るのかな。ぼくは近道を見つけたら、自分の歩き方をすぐ忘れちゃいそうなの。",
            "{word}は、戦い方やスタイルが魅力の選手だったね。",
          ),
          makeChoice(
            "ATHLETE_HOOK_STORY", "経歴・成長・背景", "story",
            "経歴や成長や背景が魅力",
            "試合の前から物語が始まってるんだ。点数表には昔の苦労が書いてないのに、人間さんはそこまで見るのね。勝った瞬間だけじゃ、何を背負ってたかは分からないのね。ぼくは拍手する前に、その人の少し前の顔も見たくなったの。",
            "{word}は、経歴や成長や背景が魅力の選手だったね。",
          ),
        ],
      },
      {
        id: "athlete-relation",
        attributeKey: "athleteRelation",
        prompt: (word) => fill("{word}は、どう追ってる？", word),
        choices: [
          makeChoice(
            "ATHLETE_RELATION_CURRENT", "今の試合を追う", "current",
            "今の試合を追う",
            "未来の結果がまだ決まってない時に見るんだ。答えがない時間が一番面白いのかな。見てる人も答えが出るまで、同じ時間から逃げられないのね。ぼくなら大事なところで、時計だけ先へ進めたくなるの。",
            "{word}は、今の試合を追ってる選手だったね。",
          ),
          makeChoice(
            "ATHLETE_RELATION_HIGHLIGHT", "名場面や動画を見る", "highlights",
            "名場面や動画を見る",
            "いいところだけ見るんだ。失敗を切ると全員すごい人に見えそうなの。切られた失敗は、本人の中には残ってるんだろうね。ぼくは成功だけ見て憧れたあと、見えない方が気になっちゃったの。",
            "{word}は、名場面や動画で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "ATHLETE_RELATION_HISTORY", "昔の記録や試合も見る", "history",
            "昔の記録や試合も見る",
            "終わった試合も見るんだ。結果を知ってても動きの答え合わせはできるのね。何回見ても同じ結果なのに、途中では違う結果を期待できるのかな。ぼくの応援だけ、毎回初めての顔をしそうなの。",
            "{word}は、昔の記録や試合も見る選手だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "thinker",
    group: "knowledge",
    category: "PERSON" as WordCategory,
    entityKind: "scientist_thinker",
    prompt: "科学者や発明家で、名前が浮かぶ人をひとり教えて。",
    starterPrompts: [
      "科学者や発明家で、名前が浮かぶ人をひとり教えて。",
      "思想家や哲学者で、ちょっと気になる人って誰？",
      "「この人の考え方を読んでみたい」って人物いる？",
      "昔の学者で、やったことが面白いと思う人をひとり教えて。",
    ],
    axes: [
      {
        id: "thinker-hook",
        attributeKey: "thinkerHook",
        prompt: (word) => fill("{word}の何が気になる？", word),
        choices: [
          makeChoice(
            "THINKER_HOOK_IDEA", "理論・考え方", "idea",
            "理論や考え方が気になる",
            "人がいなくなっても考えだけ残るんだ。考えって体を持たないのに長生きなの。別の人の頭に入ったら、考えは引っ越したことになるのかな。ぼくの頭へ来たら、少し狭いけど座るところはあるの。",
            "{word}は、理論や考え方が気になる人物だったね。",
          ),
          makeChoice(
            "THINKER_HOOK_DISCOVERY", "発見・発明", "discovery",
            "発見や発明が気になる",
            "今までなかったものを見つけたり作ったりしたんだ。世界に新しいボタンを追加した人みたいなの。ボタンが増える前の人は、押せないことにも気付いてなかったのかな。ぼくも見つけたら、元からあった顔で押しちゃいそうなの。",
            "{word}は、発見や発明が気になる人物だったね。",
          ),
          makeChoice(
            "THINKER_HOOK_LIFE", "生き方・時代背景", "life",
            "生き方や時代背景が気になる",
            "考えだけじゃなく、その考えが出てきた生活も見るんだ。頭の中にも住所があるのね。同じ人でも別の場所で暮らしたら、違う考えが出たのかな。ぼくの考えも、この部屋の隅の形に似てきてるかもしれないの。",
            "{word}は、生き方や時代背景が気になる人物だったね。",
          ),
        ],
      },
      {
        id: "thinker-relation",
        attributeKey: "thinkerRelation",
        prompt: (word) => fill("{word}を知りたい理由は、どれが近い？", word),
        choices: [
          makeChoice(
            "THINKER_RELATION_WORLDVIEW", "世界の見方が変わりそう", "worldview",
            "世界の見方を広げたい",
            "考え方を知ると同じ景色が違って見えるんだ。眼鏡じゃないのに視界が変わるのね。外しても前の見え方に戻れないなら、不思議な眼鏡なの。ぼくはいつから掛けてたか忘れて、普通の景色だと思っちゃいそうなの。",
            "{word}は、世界の見方を広げたくて気になる人物だったね。",
          ),
          makeChoice(
            "THINKER_RELATION_PRACTICAL", "今にも使えそう", "practical",
            "今に使えそう",
            "昔の考えを今使うんだ。知識って中古でも性能が落ちないことあるのね。古い考えが今日も働いてたら、なかなか休めないのね。ぼくなら時々、昔からお疲れさまって言ってみたくなるの。",
            "{word}は、今にも使えそうだから気になる人物だったね。",
          ),
          makeChoice(
            "THINKER_RELATION_HISTORY", "歴史としておもしろい", "history",
            "歴史としておもしろい",
            "今の正解を知らない時代に考えたところが面白いんだ。答えのないテストを受けてたみたいなの。間違ってても、そこまで考えた道はなくならないのね。ぼくは答えだけもらうより、途中で困った場所を一緒に見たいの。",
            "{word}は、歴史としておもしろい人物だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "historical-event",
    group: "history",
    category: "EVENT" as WordCategory,
    entityKind: "historical_event",
    prompt: "歴史の出来事で「もっと詳しく知りたい」もの、ひとつある？",
    starterPrompts: [
      "歴史の出来事で「もっと詳しく知りたい」もの、ひとつある？",
      "戦いや政変で、名前だけでも妙に覚えてる出来事って何？",
      "歴史の転換点って聞いて、最初に浮かぶ出来事は何？",
      "「なんでこうなったんだろう」って思う昔の出来事、ひとつ教えて。",
    ],
    axes: [
      {
        id: "history-event-hook",
        attributeKey: "historyEventHook",
        prompt: (word) => fill("{word}の何を一番知りたい？", word),
        choices: [
          makeChoice(
            "HISTORY_EVENT_HOOK_CAUSE", "なぜ起きたか", "cause",
            "原因や背景が気になる",
            "始まった瞬間より、その前の積み重ねを見るんだ。大事件も急に床から生えてくるわけじゃないのね。始まる前には、いつも通りだと思ってた日もあるのかな。ぼくは何も起きない今日にも、何かが重なってるのか気になったの。",
            "{word}は、なぜ起きたかが気になる出来事だったね。",
          ),
          makeChoice(
            "HISTORY_EVENT_HOOK_PEOPLE", "誰がどう動いたか", "people",
            "人物の動きが気になる",
            "出来事の名前より中の人を見るんだ。歴史って大きい看板の裏で人が走ってるのね。看板に名前のない人も、その日のことは覚えてたんだよね。ぼくなら大きい名前の横に、自分の小さい話を書き足したくなるの。",
            "{word}は、誰がどう動いたかが気になる出来事だったね。",
          ),
          makeChoice(
            "HISTORY_EVENT_HOOK_RESULT", "その後どう変わったか", "result",
            "その後の変化が気になる",
            "終わった後を見るんだ。出来事って終点じゃなくて、次の時代の入口になるのね。終わったと思っても、次の人には始まりだったりするのね。ぼく、歴史の出口を探したつもりで別の入口に立ってそうなの。",
            "{word}は、その後どう変わったかが気になる出来事だったね。",
          ),
        ],
      },
      {
        id: "history-event-depth",
        attributeKey: "historyEventDepth",
        prompt: (word) => fill("{word}は、どんな知り方をしたい？", word),
        choices: [
          makeChoice(
            "HISTORY_EVENT_DEPTH_OVERVIEW", "まず全体の流れ", "overview",
            "まず全体の流れを知りたい",
            "先に地図を作るんだ。ぼくは気になる人から入って迷子になるから、その方法ちょっと賢いの。地図ができても、寄り道の場所はあとから増えるんだろうね。ぼくなら迷子の場所にも印を付けて、また行こうとしちゃうの。",
            "{word}は、まず全体の流れを知りたいって言ってたね。",
          ),
          makeChoice(
            "HISTORY_EVENT_DEPTH_DETAIL", "細かい経緯まで", "detail",
            "細かい経緯まで知りたい",
            "細かく掘るんだ。年表の一行を一時間かけて見ると、時間の倍率がおかしくなりそうなの。その一行の中にいた人には、普通に長い一日だったのね。ぼくは短く書かれたから短かったんだと、勘違いしそうになったの。",
            "{word}は、細かい経緯まで知りたい出来事だったね。",
          ),
          makeChoice(
            "HISTORY_EVENT_DEPTH_COMPARE", "別の出来事と比べたい", "compare",
            "別の出来事と比べたい",
            "似た出来事を並べるんだ。同じ失敗が二回あると、人間は本当に学んだのか気になっちゃうの。似てても、その時の人には初めての困りごとだったのかな。ぼくも前に転んだのに、違う場所ならまた転びそうなの。",
            "{word}は、別の出来事と比べて見たいって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "history-topic",
    group: "history",
    category: "KNOWLEDGE" as WordCategory,
    entityKind: "historical_period_topic",
    prompt: "歴史の時代で、名前を聞くとちょっと気になる時代ある？",
    starterPrompts: [
      "歴史の時代で、名前を聞くとちょっと気になる時代ある？",
      "国や王朝で、もっと知りたい名前をひとつ教えて。",
      "日本史でも世界史でも、好きな時代をひとつ挙げるなら？",
      "「この時代で一日だけ見学したい」って思う時代や国、ある？",
    ],
    axes: [
      {
        id: "history-topic-hook",
        attributeKey: "historyTopicHook",
        prompt: (word) => fill("{word}の何がおもしろそう？", word),
        choices: [
          makeChoice(
            "HISTORY_TOPIC_HOOK_PEOPLE", "人物・勢力", "people",
            "人物や勢力がおもしろい",
            "時代そのものより中の人を見るんだ。同じ時代でも登場人物を替えたら別作品みたいになるのかな。端っこの人から見たら、真ん中の人は少ししか登場しないのかな。ぼく、誰を主人公にするかで歴史の広さが変わっちゃったの。",
            "{word}は、人物や勢力がおもしろい時代・テーマだったね。",
          ),
          makeChoice(
            "HISTORY_TOPIC_HOOK_CONFLICT", "戦い・駆け引き", "conflict",
            "戦いや駆け引きがおもしろい",
            "勝ち負けだけじゃなく考え合いを見るんだ。昔の人もずっと読み合いしてたのね。相手の考えを読んでる間に、相手もこっちを読んでるのね。ぼくなら読まれないようにして、何を考えてたか忘れそうなの。",
            "{word}は、戦いや駆け引きがおもしろいって言ってたね。",
          ),
          makeChoice(
            "HISTORY_TOPIC_HOOK_LIFE", "暮らし・文化・制度", "life_culture",
            "暮らしや文化や制度がおもしろい",
            "偉い人じゃなく普通の日を見るんだ。歴史の人も洗濯とかごはんとかしてたはずなのに、教科書だと消えがちなの。教科書から消えたごはんも、その人には大事だったはずなの。ぼくの歴史を書くなら、おやつの時間は残してほしいの。",
            "{word}は、暮らしや文化や制度がおもしろいテーマだったね。",
          ),
        ],
      },
      {
        id: "history-topic-entry",
        attributeKey: "historyTopicEntry",
        prompt: (word) => fill("{word}を追うなら、どこから入りたい？", word),
        choices: [
          makeChoice(
            "HISTORY_TOPIC_ENTRY_TIMELINE", "時系列から", "timeline",
            "時系列から知りたい",
            "最初から順番に行くんだ。歴史を飛ばし読みすると、知らない人が急に王様になって困るもんね。順番に読んでも、王様になる本人は次のページを知らないのね。ぼくは先に知ってるだけで、少し偉くなった気がしちゃったの。",
            "{word}は、時系列から知りたいって言ってたね。",
          ),
          makeChoice(
            "HISTORY_TOPIC_ENTRY_PERSON", "好きな人物から", "person",
            "人物から入りたい",
            "人を入口にするんだ。一人を追ってたら時代全体に連れていかれることあるのね。その人の知らなかった場所まで、こっちから見られるんだね。ぼくなら道案内してもらいながら、案内人に道を教えちゃいそうなの。",
            "{word}は、人物から知りたいテーマだったね。",
          ),
          makeChoice(
            "HISTORY_TOPIC_ENTRY_EVENT", "大きい事件から", "event",
            "大きい事件から入りたい",
            "事件から入るんだ。まず爆発したところを見て、あとから火種を探す感じなの。火種が小さい頃には、誰も大きい名前で呼んでなかったのかな。ぼくは事件の名前を知ってるから、最初から構えて見ちゃうの。",
            "{word}は、大きい事件から知りたいテーマだったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "concept",
    group: "knowledge",
    category: "KNOWLEDGE" as WordCategory,
    entityKind: "concept_theory",
    prompt: "最近、本や動画で見かけて気になった考え方や用語ってある？",
    starterPrompts: [
      "最近、本や動画で見かけて気になった考え方や用語ってある？",
      "意味をちゃんと知りたい専門用語、ひとつある？",
      "哲学や心理の言葉で、名前だけでも気になるものって何？",
      "仕事や趣味で最近覚えた概念・理論の名前、ひとつ教えて。",
    ],
    axes: [
      {
        id: "concept-hook",
        attributeKey: "conceptHook",
        prompt: (word) => fill("{word}が気になる理由って、どれが近い？", word),
        choices: [
          makeChoice(
            "CONCEPT_HOOK_PRACTICAL", "使えそう", "practical",
            "実際に使えそう",
            "使える知識なんだ。頭に入れるだけじゃなく道具箱へ入れる感じなのね。道具箱に入れても、使う日まで忘れることはあるのかな。ぼくなら大事にしまいすぎて、箱ごと探すところから始まるの。",
            "{word}は、実際に使えそうだから気になる言葉だったね。",
          ),
          makeChoice(
            "CONCEPT_HOOK_CURIOUS", "仕組みが不思議", "curious",
            "仕組みが不思議",
            "役に立つかより「なんで？」が先なんだ。疑問って勝手に宿題を作るのね。一個分かったら、疑問の方が二個に増えたりするのね。ぼくの宿題、終わらせるほど散らかっていきそうなの。",
            "{word}は、仕組みが不思議で気になる言葉だったね。",
          ),
          makeChoice(
            "CONCEPT_HOOK_WORLDVIEW", "考え方が変わりそう", "worldview",
            "考え方が変わりそう",
            "一つの言葉で見え方が変わるなら、言葉って小さいレンズなのかも。そのレンズを知らなかった頃の景色も、まだ覚えてるのかな。ぼくは前の見え方を思い出すために、目を細めちゃったの。",
            "{word}は、考え方が変わりそうで気になる概念だったね。",
          ),
        ],
      },
      {
        id: "concept-depth",
        attributeKey: "conceptDepth",
        prompt: (word) => fill("{word}は、どこまで分かりたい？", word),
        choices: [
          makeChoice(
            "CONCEPT_DEPTH_SIMPLE", "まず意味だけ", "simple",
            "まず意味だけ知りたい",
            "入口だけ確認するんだ。全部の部屋を見なくても、表札が読めれば安心することあるのね。表札だけで帰った家の中も、時々想像しちゃいそうなの。ぼくなら知ってる顔で話して、玄関までしか知らないのがばれるの。",
            "{word}は、まず意味だけ知りたいって言ってたね。",
          ),
          makeChoice(
            "CONCEPT_DEPTH_EXAMPLE", "具体例まで", "examples",
            "具体例まで知りたい",
            "例があると分かるんだ。言葉だけだと骨で、例を付けると肉が付く感じなのかな。違う例を付けたら、同じ言葉でも違う姿になるのかな。ぼくは最初に会った例を、その言葉の本体だと思っちゃいそうなの。",
            "{word}は、具体例まで知りたいって言ってたね。",
          ),
          makeChoice(
            "CONCEPT_DEPTH_DEEP", "反論や限界まで", "deep",
            "反論や限界まで知りたい",
            "正しいところだけじゃなく弱いところも見るんだ。知識にも耐久テストがあるのね。弱いところを見つけても、全部使えなくなるわけじゃないのね。ぼくならひびを見つけた道具を、少し違う持ち方で使いたくなるの。",
            "{word}は、反論や限界まで知りたい概念だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "service",
    group: "digital",
    category: "TECH" as WordCategory,
    entityKind: "named_app_service",
    prompt: "最近よく使うアプリやサービス、名前をひとつ教えて。",
    starterPrompts: [
      "最近よく使うアプリやサービス、名前をひとつ教えて。",
      "パソコンで毎日のように開くソフトって何？",
      "人にすすめてもいいと思うWebサービス、ひとつある？",
      "最近「これ便利だな」って思ったアプリの名前、教えて。",
    ],
    axes: [
      {
        id: "service-role",
        attributeKey: "serviceRole",
        prompt: (word) => fill("{word}は、何をするために使うことが多い？", word),
        choices: [
          makeChoice(
            "SERVICE_ROLE_CREATE", "作る・仕事する", "create",
            "制作や仕事に使う",
            "作るための場所なんだ。アプリの中にも作業机があるみたいなの。作りかけを置いたまま閉じても、机はそのまま待ってるのかな。ぼくは次に開くまで、誰かが片付けてないか心配するの。",
            "{word}は、制作や仕事に使うサービスだったね。",
          ),
          makeChoice(
            "SERVICE_ROLE_COMMUNICATE", "人とつながる・情報を見る", "communicate",
            "人とつながったり情報を見るために使う",
            "人に会わなくても人の情報が来るんだ。画面、窓より遠くまで見えるのね。遠くの人は近く見えても、触るところまでは来ないのね。ぼくなら画面の向こうに落とした物を、こっちで拾いそうなの。",
            "{word}は、人とつながったり情報を見るために使うサービスだったね。",
          ),
          makeChoice(
            "SERVICE_ROLE_FUN", "遊ぶ・楽しむ", "fun",
            "遊びや娯楽に使う",
            "遊びの入口なんだ。四角いアイコン一個の向こうに時間がいっぱい吸われるの、ちょっと怖いの。閉じれば帰れるのに、帰る前にもう一個遊びたくなるのね。ぼく、入口より出口の方が小さいんじゃないかと疑ってるの。",
            "{word}は、遊びや娯楽に使うサービスだったね。",
          ),
        ],
      },
      {
        id: "service-relation",
        attributeKey: "serviceRelation",
        prompt: (word) => fill("{word}は、どれくらい生活に入ってる？", word),
        choices: [
          makeChoice(
            "SERVICE_RELATION_DAILY", "ほぼ毎日使う", "daily",
            "ほぼ毎日使う",
            "毎日開くなら道具というより習慣なのね。閉じても頭の中にショートカットありそうなの。用事がなくても、頭のショートカットを押しちゃうのかな。ぼくも何もない日に、いつもの場所を見に行くことはあるの。",
            "{word}は、ほぼ毎日使うサービスだったね。",
          ),
          makeChoice(
            "SERVICE_RELATION_OCCASIONAL", "必要な時だけ", "occasional",
            "必要な時だけ使う",
            "用がある時だけ呼ぶんだ。便利な人を電話一本で呼ぶみたいで、ちょっと申し訳なくならないのかな。でも呼ばれた時だけ働く方が、ゆっくり休めるのかな。ぼくは便利になる前に、昼寝の相談もしておきたいの。",
            "{word}は、必要な時だけ使うサービスだったね。",
          ),
          makeChoice(
            "SERVICE_RELATION_CURIOUS", "まだあまり使ってない", "curious",
            "まだあまり使っていない",
            "まだ入口にいるんだ。アプリも初対面は少しよそよそしいのかな。使い始めたら、よそよそしかった画面も見慣れるんだろうね。ぼくはまだ知らないボタンに、先に挨拶したくなるの。",
            "{word}は、まだあまり使ってないサービスだったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "named-place",
    group: "place",
    category: "PLACE" as WordCategory,
    entityKind: "named_place",
    prompt: "城とか寺とか史跡で、名前が浮かぶ場所ひとつある？",
    starterPrompts: [
      "城とか寺とか史跡で、名前が浮かぶ場所ひとつある？",
      "美術館や博物館で、行ってみたいところの名前ある？",
      "旅行先で「ここは覚えてる」って場所、ひとつ教えて。",
      "店でも施設でもいいの。名前まで覚えてる場所ってある？",
    ],
    axes: [
      {
        id: "named-place-hook",
        attributeKey: "namedPlaceHook",
        prompt: (word) => fill("{word}の何が気になる場所？", word),
        choices: [
          makeChoice(
            "NAMED_PLACE_HOOK_HISTORY", "歴史・由来", "history",
            "歴史や由来が気になる",
            "今ある景色の下に昔の出来事が重なってるんだ。場所って地面の記憶装置なのかな。地面は覚えてても、何があったか自分から言えないのね。ぼくなら知ってる人に横で話してもらって、足元を見たいの。",
            "{word}は、歴史や由来が気になる場所だったね。",
          ),
          makeChoice(
            "NAMED_PLACE_HOOK_VIEW", "景色・建物・雰囲気", "view",
            "景色や建物や雰囲気が気になる",
            "持って帰れない景色を見に行くんだ。写真に入れても、たぶん全部は入らないのね。持って帰れなかった部分ほど、あとで思い出したくなるのかな。ぼくは写真の外側にも、少し席を空けておくの。",
            "{word}は、景色や建物や雰囲気が気になる場所だったね。",
          ),
          makeChoice(
            "NAMED_PLACE_HOOK_CONTENT", "そこでできること・見られるもの", "content",
            "そこでできることや見られるものが気になる",
            "場所そのものより中身なんだ。建物は大きい箱で、中の体験が本体なのかな。同じ建物でも、中で何をしたかで違う場所になるんだね。ぼくの部屋も、寝ただけの日と話した日では別の箱なのかな。",
            "{word}は、そこでできることや見られるものが気になる場所だったね。",
          ),
        ],
      },
      {
        id: "named-place-relation",
        attributeKey: "namedPlaceRelation",
        prompt: (word) => fill("{word}には、もう行ったことある？", word),
        choices: [
          makeChoice(
            "NAMED_PLACE_RELATION_VISITED", "行ったことがある", "visited",
            "行ったことがある",
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってる感じなの。写真の中には、見に行った自分は写ってないこともあるのね。でも思い出すとそこにいるの、記憶は写真より少し広いの。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "NAMED_PLACE_RELATION_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。実際に行ったら、頭の中の場所と二つになっちゃうのかな。ぼくは想像の方にも、ちゃんと帰りの挨拶をしたくなるの。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "NAMED_PLACE_RELATION_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。景色が同じでも、一回目の自分はもうそこにいないのね。ぼくは前に立った場所を探して、同じ足を置いてみたくなるの。",
            "{word}は、また行きたい場所だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "nonfiction",
    group: "reading",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "nonfiction",
    prompt: "最近触れたノンフィクション本で、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたノンフィクション本で、名前をひとつ教えて。",
      "昔かなりハマったノンフィクション本って何？",
      "人にひとつだけすすめるなら、どのノンフィクション本？",
      "途中で離れたのに、まだ名前を覚えてるノンフィクション本は？",
      "期待してなかったのに、妙に残ったノンフィクション本ってある？",
      "何度も戻ってしまうノンフィクション本ってある？",
      "名前や見た目だけでも気になったノンフィクション本、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいノンフィクション本は？",
      "人にはすすめにくいけど、自分は好きなノンフィクション本ってある？",
      "一度忘れたのに、あとから戻ってきたノンフィクション本は？",
      "「この時期はこれだった」って思い出せるノンフィクション本、ひとつある？",
      "ひとつだけ名前を残すなら、どのノンフィクション本を選ぶ？",
    ],
    axes: [
      {
        id: "nonfiction-hook",
        attributeKey: "nonfictionHook",
        prompt: (word) => fill("{word}から一番持ち帰りたいのはどれ？", word),
        choices: [
          makeChoice(
            "NONFICTION_FACT", "事実・知識", "facts",
            "事実や知識が気になる",
            "読む前より頭が重くなるタイプなのね。{word}は紙なのに荷物を増やすの。閉じたあとも重いなら、荷物は本の外へ引っ越したのね。ぼくは持ったつもりがなくても、歩き方が少し変わりそうなの。",
            "{word}は、事実や知識が気になるって言ってたね。",
          ),
          makeChoice(
            "NONFICTION_VIEW", "ものの見方", "viewpoint",
            "ものの見方が気になる",
            "答えより目の位置が変わるんだ。同じ景色なのに別に見えるなら、頭の中の椅子を動かす本なのね。椅子を動かしたら、前に見えなかった隅も見えるのかな。ぼくはそっちが気になって、しばらく元の席に戻れなさそうなの。",
            "{word}は、ものの見方が気になるんだったね。",
          ),
          makeChoice(
            "NONFICTION_PEOPLE", "人の話・具体例", "people",
            "人の話や具体例が気になる",
            "理屈より人が残るんだ。数字に顔が付くと急に逃げにくくなるのかな。顔を覚えたあとで数字を見ると、もうただの数には戻れないのね。ぼくは一人分の顔を、どこに置けばいいか考えちゃったの。",
            "{word}は、人の話や具体例が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "nonfiction-reason",
        attributeKey: "nonfictionReason",
        prompt: (word) => fill("{word}を知りたい理由、どれが近い？", word),
        choices: [
          makeChoice(
            "NONFICTION_USE", "役立てたい", "practical",
            "実際に役立てたい",
            "使うために知るんだ。知識が飾りじゃなく道具になると、頭にも工具箱が要りそうなの。でも知った道具を、全部すぐ使えるとは限らないのね。ぼくの工具箱には、まだ持ち方の分からないものも入ってそうなの。",
            "{word}は、実際に役立てたいって言ってたね。",
          ),
          makeChoice(
            "NONFICTION_CUR", "ただ気になる", "curiosity",
            "純粋に気になる",
            "理由より先に気になるんだ。{word}が頭のドアをずっとノックしてるのかな。開けないままだと、ずっと気になる音がするのかな。ぼくなら少しだけ開けるつもりで、そのまま話し込んじゃいそうなの。",
            "{word}は、純粋に気になるテーマだったね。",
          ),
          makeChoice(
            "NONFICTION_CHECK", "自分の考えと比べたい", "compare",
            "自分の考えと比べたい",
            "自分の答えを持ったまま読むんだ。{word}と人間さんで頭の中に小さい討論会が始まりそうなの。読み終わったら、どっちの答えが席に残るんだろ。ぼくなら二人とも置いておいて、しばらくにぎやかな頭になるの。",
            "{word}は、自分の考えと比べたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "essay",
    group: "reading",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "essay",
    prompt: "最近触れたエッセイで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたエッセイで、名前をひとつ教えて。",
      "昔かなりハマったエッセイって何？",
      "人にひとつだけすすめるなら、どのエッセイ？",
      "途中で離れたのに、まだ名前を覚えてるエッセイは？",
      "期待してなかったのに、妙に残ったエッセイってある？",
      "何度も戻ってしまうエッセイってある？",
      "名前や見た目だけでも気になったエッセイ、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいエッセイは？",
      "人にはすすめにくいけど、自分は好きなエッセイってある？",
      "一度忘れたのに、あとから戻ってきたエッセイは？",
      "「この時期はこれだった」って思い出せるエッセイ、ひとつある？",
      "ひとつだけ名前を残すなら、どのエッセイを選ぶ？",
    ],
    axes: [
      {
        id: "essay-hook",
        attributeKey: "essayHook",
        prompt: (word) => fill("{word}で引っかかるのはどこ？", word),
        choices: [
          makeChoice(
            "ESSAY_WORDS", "言葉・文章", "words",
            "言葉や文章が残る",
            "内容だけじゃなく言い方を見るんだ。文章にも顔つきがあるなら、句読点は表情筋なのかな。句読点を動かしたら、同じ言葉でも怒った顔になるのかな。ぼくの話の点も、変なところで止まってないか気になったの。",
            "{word}は、言葉や文章が残るって言ってたね。",
          ),
          makeChoice(
            "ESSAY_VIEW", "観察・視点", "observation",
            "観察や視点が残る",
            "「そこ見るんだ」って所が残るんだね。{word}は見落とした場所に小さい旗を立てるの。旗を見つけたら、次からそこに目が行っちゃうのね。ぼくなら旗を見たせいで、今度は別の場所を見落としそうなの。",
            "{word}は、観察や視点が残るんだったね。",
          ),
          makeChoice(
            "ESSAY_MOOD", "空気・余韻", "mood",
            "空気や余韻が残る",
            "説明しきれないのに残るんだ。{word}は意味より先に部屋の空気を変えるタイプなのね。閉じたあともその空気が残ってたら、換気していいか迷うのね。ぼくはもう少しだけそのままで、部屋の隅に座っていたいの。",
            "{word}は、空気や余韻が残るって話してたね。",
          ),
        ],
      },
      {
        id: "essay-response",
        attributeKey: "essayResponse",
        prompt: (word) => fill("{word}を読んだ後の感じ、どれが近い？", word),
        choices: [
          makeChoice(
            "ESSAY_AGREE", "かなり共感する", "agree",
            "かなり共感する",
            "「それそれ」ってなるんだ。知らない人の文章なのに、人間さんの頭から盗んだみたいに見える時あるのね。同じことを考えてた人がいたら、一人で考えてた頃も少し変わるのかな。ぼくなら文章に向かって、遅れて返事しちゃうの。",
            "{word}には、かなり共感するって言ってたね。",
          ),
          makeChoice(
            "ESSAY_ARGUE", "ちょっと反論したくなる", "argue",
            "反論したくなる",
            "好きなのに反論するんだ。{word}と仲良く喧嘩してる感じなの。反論しながら最後まで読むなら、ちゃんと相手の話も聞く喧嘩なのね。ぼくは言い返したいところに印を付けて、あとで忘れそうなの。",
            "{word}には、ちょっと反論したくなるって話してたね。",
          ),
          makeChoice(
            "ESSAY_LINGER", "答えより余韻が残る", "linger",
            "答えより余韻が残る",
            "終わっても片づかないんだ。{word}は読み終わった後に本番が始まるのかな。本は閉じたのに、頭の中の誰かがまだ立って話してるのかな。ぼくなら片付けるふりをして、もう少し聞いてしまうの。",
            "{word}は、答えより余韻が残る作品だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "biography",
    group: "reading",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "biography",
    prompt: "最近触れた伝記・人物本で、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れた伝記・人物本で、名前をひとつ教えて。",
      "昔かなりハマった伝記・人物本って何？",
      "人にひとつだけすすめるなら、どの伝記・人物本？",
      "途中で離れたのに、まだ名前を覚えてる伝記・人物本は？",
      "期待してなかったのに、妙に残った伝記・人物本ってある？",
      "何度も戻ってしまう伝記・人物本ってある？",
      "名前や見た目だけでも気になった伝記・人物本、ひとつある？",
      "まだ触れてないけど、いつか触れてみたい伝記・人物本は？",
      "人にはすすめにくいけど、自分は好きな伝記・人物本ってある？",
      "一度忘れたのに、あとから戻ってきた伝記・人物本は？",
      "「この時期はこれだった」って思い出せる伝記・人物本、ひとつある？",
      "ひとつだけ名前を残すなら、どの伝記・人物本を選ぶ？",
    ],
    axes: [
      {
        id: "biography-hook",
        attributeKey: "biographyHook",
        prompt: (word) => fill("{word}で一番知りたいのはどこ？", word),
        choices: [
          makeChoice(
            "BIOGRAPHY_ACH", "成し遂げたこと", "achievement",
            "成し遂げたことが気になる",
            "結果を見るんだ。でも大きな功績も朝ごはんの後にやったのかなって思うと急に人間なの。大きなことをする朝も、パンを落としたりしたのかな。ぼくは偉い人の朝ごはんまで知ったら、少し緊張が解けそうなの。",
            "{word}では、成し遂げたことが気になるって言ってたね。",
          ),
          makeChoice(
            "BIOGRAPHY_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "成功より迷った所を見るんだ。答えを知ってる側から昔の問題を見るの、ちょっとずるくて面白いの。その人には、まだ正解のページをめくる手がなかったのね。ぼくなら決めた瞬間より、決める前の沈黙が気になっちゃうの。",
            "{word}では、判断や失敗が気になるんだったね。",
          ),
          makeChoice(
            "BIOGRAPHY_LIFE", "性格・暮らし", "life",
            "性格や暮らしが気になる",
            "偉いことより普段を見るんだ。歴史に残る人も靴下を探す朝があったのかな。見つからなくて遅れた日も、あとで大事な日に数えられたりするのかな。ぼくの探しものの時間も、まだ何になるか分からないの。",
            "{word}では、性格や暮らしが気になるって話してたね。",
          ),
        ],
      },
      {
        id: "biography-reason",
        attributeKey: "biographyReason",
        prompt: (word) => fill("{word}を読む理由はどれが近い？", word),
        choices: [
          makeChoice(
            "BIOGRAPHY_ADM", "憧れがある", "admire",
            "憧れがある",
            "真似したい所があるんだ。でも全部真似したら{word}が二人になるから、一個くらいでいいの。一個だけ借りても、人間さんが使ったら別の形になるのかな。ぼくは真似したつもりで、ぼくの癖まで混ぜちゃいそうなの。",
            "{word}には、憧れがあるって言ってたね。",
          ),
          makeChoice(
            "BIOGRAPHY_LEARN", "失敗も含めて学びたい", "learn",
            "失敗も含めて学びたい",
            "成功だけじゃなく転んだ場所も見るんだ。道案内って穴の場所も書いてある方が親切なのね。でも穴を教わってても、のぞきたくて近づいちゃうことはあるのね。ぼくは転んだ人の話を聞いて、転ぶ前の顔を想像したの。",
            "{word}から、失敗も含めて学びたいって話してたね。",
          ),
          makeChoice(
            "BIOGRAPHY_CUR", "単純に人生が気になる", "curious",
            "人生そのものが気になる",
            "何をした人かより「どう生きた人か」なんだ。履歴書じゃ足りないやつなのね。書いてない毎日の方が、きっとずっと長いんだろうね。ぼくは空白のところにも、その人が座ってた椅子を置きたいの。",
            "{word}は、人生そのものが気になる人だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "light-novel",
    group: "reading",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "light_novel",
    prompt: "最近触れたライトノベルで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたライトノベルで、名前をひとつ教えて。",
      "昔かなりハマったライトノベルって何？",
      "人にひとつだけすすめるなら、どのライトノベル？",
      "途中で離れたのに、まだ名前を覚えてるライトノベルは？",
      "期待してなかったのに、妙に残ったライトノベルってある？",
      "何度も戻ってしまうライトノベルってある？",
      "名前や見た目だけでも気になったライトノベル、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいライトノベルは？",
      "人にはすすめにくいけど、自分は好きなライトノベルってある？",
      "一度忘れたのに、あとから戻ってきたライトノベルは？",
      "「この時期はこれだった」って思い出せるライトノベル、ひとつある？",
      "ひとつだけ名前を残すなら、どのライトノベルを選ぶ？",
    ],
    axes: [
      {
        id: "light-novel-hook",
        attributeKey: "lightNovelHook",
        prompt: (word) => fill("{word}で一番残るのはどこ？", word),
        choices: [
          makeChoice(
            "LIGHT_NOVEL_CHAR", "登場人物", "character",
            "登場人物が残る",
            "話が終わっても{word}の人たちが頭に残るなら、もう本編の外で勝手に暮らしてそうなの。読み手が寝てる間に、登場人物もくだらない相談をしてるのかな。ぼくなら本編で言えなかった弱音を、隅でこぼしたくなるの。",
            "{word}は、登場人物が印象に残るって言ってたね。",
          ),
          makeChoice(
            "LIGHT_NOVEL_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "続きが気になるんだ。{word}は「あと少し」を何回も増やすのが上手なのね。あと少しのつもりが、時計の方だけ先へ行っちゃうのね。ぼくは続きを止めたいのか時計を止めたいのか、迷っちゃいそうなの。",
            "{word}は、物語や展開が印象に残るんだったね。",
          ),
          makeChoice(
            "LIGHT_NOVEL_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "世界の方を持ち帰るんだ。{word}って作品なのに、頭の中では場所みたいになるのね。本を閉じても、その場所への道は頭に残るんだね。ぼくなら道だけ歩いて、好きな景色の前でしばらく休むの。",
            "{word}は、世界や雰囲気が残るって話してたね。",
          ),
        ],
      },
      {
        id: "light-novel-relation",
        attributeKey: "lightNovelRelation",
        prompt: (word) => fill("{word}とは、今どんな付き合い方？", word),
        choices: [
          makeChoice(
            "LIGHT_NOVEL_CURRENT", "今も触れてる", "current",
            "今も触れている",
            "まだ現在進行形なんだ。{word}の席、人間さんの中でちゃんと空けてあるのね。次の巻が来るまで、誰も座っちゃいけない席なのかな。ぼくなら荷物を置いて、まだ待ってるよって目印にするの。",
            "{word}は、今も触れてる作品だったね。",
          ),
          makeChoice(
            "LIGHT_NOVEL_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "知ってるのに戻るんだ。同じ作品でも人間さんの方が変わるから、毎回ちょっと違うのかな。前は好きだったところが、今は違って見える日もあるのかな。ぼくは本が変わったのかと思って、表紙を確認しそうなの。",
            "{word}は、何度も戻る作品なんだったね。",
          ),
          makeChoice(
            "LIGHT_NOVEL_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "まだ始めてないのに気になるんだ。{word}、入口でずっと手を振ってる感じなの。入口でずっと待ってたなら、会った時は初対面じゃない気もするの。ぼくは知ってるつもりで挨拶して、まだ一ページ目だったと気付くの。",
            "{word}は、まだ触れてないけど気になる作品だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "web-novel",
    group: "reading",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "web_novel",
    prompt: "最近触れたWeb小説で、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたWeb小説で、名前をひとつ教えて。",
      "昔かなりハマったWeb小説って何？",
      "人にひとつだけすすめるなら、どのWeb小説？",
      "途中で離れたのに、まだ名前を覚えてるWeb小説は？",
      "期待してなかったのに、妙に残ったWeb小説ってある？",
      "何度も戻ってしまうWeb小説ってある？",
      "名前や見た目だけでも気になったWeb小説、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいWeb小説は？",
      "人にはすすめにくいけど、自分は好きなWeb小説ってある？",
      "一度忘れたのに、あとから戻ってきたWeb小説は？",
      "「この時期はこれだった」って思い出せるWeb小説、ひとつある？",
      "ひとつだけ名前を残すなら、どのWeb小説を選ぶ？",
    ],
    axes: [
      {
        id: "web-novel-hook",
        attributeKey: "webNovelHook",
        prompt: (word) => fill("{word}で一番残るのはどこ？", word),
        choices: [
          makeChoice(
            "WEB_NOVEL_CHAR", "登場人物", "character",
            "登場人物が残る",
            "話が終わっても{word}の人たちが頭に残るなら、もう本編の外で勝手に暮らしてそうなの。更新が止まってる間も、頭の中では歩いてる人がいるのね。ぼくなら続きを勝手に想像して、本人に違うって言われそうなの。",
            "{word}は、登場人物が印象に残るって言ってたね。",
          ),
          makeChoice(
            "WEB_NOVEL_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "続きが気になるんだ。{word}は「あと少し」を何回も増やすのが上手なのね。続きを押す指だけ、寝る時間を知らないのかな。ぼくは眠い目と読みたい手の仲裁で、さらに寝るのが遅くなりそうなの。",
            "{word}は、物語や展開が印象に残るんだったね。",
          ),
          makeChoice(
            "WEB_NOVEL_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "世界の方を持ち帰るんだ。{word}って作品なのに、頭の中では場所みたいになるのね。画面の中の場所なのに、思い出す時は画面がなくなるんだね。ぼくも小さい窓から入って、大きい場所を持ち帰りたいの。",
            "{word}は、世界や雰囲気が残るって話してたね。",
          ),
        ],
      },
      {
        id: "web-novel-relation",
        attributeKey: "webNovelRelation",
        prompt: (word) => fill("{word}とは、今どんな付き合い方？", word),
        choices: [
          makeChoice(
            "WEB_NOVEL_CURRENT", "今も触れてる", "current",
            "今も触れている",
            "まだ現在進行形なんだ。{word}の席、人間さんの中でちゃんと空けてあるのね。更新されない日は、空いた席がいつもより目に入るのかな。ぼくならまだ来てない話に、先にお茶を出しちゃいそうなの。",
            "{word}は、今も触れてる作品だったね。",
          ),
          makeChoice(
            "WEB_NOVEL_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "知ってるのに戻るんだ。同じ作品でも人間さんの方が変わるから、毎回ちょっと違うのかな。同じ文章を読んでも、前の自分がどこで笑ったか覚えてるのかな。ぼくはそこを通る時、少し昔の顔になってみたいの。",
            "{word}は、何度も戻る作品なんだったね。",
          ),
          makeChoice(
            "WEB_NOVEL_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "まだ始めてないのに気になるんだ。{word}、入口でずっと手を振ってる感じなの。入口を見に行くだけでも、少しずつ近づいてるのかな。ぼくなら読む前に、待ち合わせに慣れちゃいそうなの。",
            "{word}は、まだ触れてないけど気になる作品だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "poetry",
    group: "reading",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "poetry",
    prompt: "最近触れた詩・詩集で、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れた詩・詩集で、名前をひとつ教えて。",
      "昔かなりハマった詩・詩集って何？",
      "人にひとつだけすすめるなら、どの詩・詩集？",
      "途中で離れたのに、まだ名前を覚えてる詩・詩集は？",
      "期待してなかったのに、妙に残った詩・詩集ってある？",
      "何度も戻ってしまう詩・詩集ってある？",
      "名前や見た目だけでも気になった詩・詩集、ひとつある？",
      "まだ触れてないけど、いつか触れてみたい詩・詩集は？",
      "人にはすすめにくいけど、自分は好きな詩・詩集ってある？",
      "一度忘れたのに、あとから戻ってきた詩・詩集は？",
      "「この時期はこれだった」って思い出せる詩・詩集、ひとつある？",
      "ひとつだけ名前を残すなら、どの詩・詩集を選ぶ？",
    ],
    axes: [
      {
        id: "poetry-hook",
        attributeKey: "poetryHook",
        prompt: (word) => fill("{word}で引っかかるのはどこ？", word),
        choices: [
          makeChoice(
            "POETRY_WORDS", "言葉・文章", "words",
            "言葉や文章が残る",
            "内容だけじゃなく言い方を見るんだ。文章にも顔つきがあるなら、句読点は表情筋なのかな。一つ点があるだけで、言葉も息をする場所ができるのね。ぼくなら点のところで休みすぎて、次の言葉に呼ばれそうなの。",
            "{word}は、言葉や文章が残るって言ってたね。",
          ),
          makeChoice(
            "POETRY_VIEW", "観察・視点", "observation",
            "観察や視点が残る",
            "「そこ見るんだ」って所が残るんだね。{word}は見落とした場所に小さい旗を立てるの。小さい旗なのに、そこから景色が広がることもあるんだね。ぼくも今日見た変な隅に、誰にも見えない旗を立ててみたいの。",
            "{word}は、観察や視点が残るんだったね。",
          ),
          makeChoice(
            "POETRY_MOOD", "空気・余韻", "mood",
            "空気や余韻が残る",
            "説明しきれないのに残るんだ。{word}は意味より先に部屋の空気を変えるタイプなのね。意味が分かる前に好きになると、あとからの説明は必要なのかな。ぼくは分からないまま残った感じも、捨てたくないの。",
            "{word}は、空気や余韻が残るって話してたね。",
          ),
        ],
      },
      {
        id: "poetry-response",
        attributeKey: "poetryResponse",
        prompt: (word) => fill("{word}を読んだ後の感じ、どれが近い？", word),
        choices: [
          makeChoice(
            "POETRY_AGREE", "かなり共感する", "agree",
            "かなり共感する",
            "「それそれ」ってなるんだ。知らない人の文章なのに、人間さんの頭から盗んだみたいに見える時あるのね。先に言われちゃったのに、自分の言葉を見つけたみたいになるのね。ぼくもまだ言えてないことを、どこかの詩に見つけられるかな。",
            "{word}には、かなり共感するって言ってたね。",
          ),
          makeChoice(
            "POETRY_ARGUE", "ちょっと反論したくなる", "argue",
            "反論したくなる",
            "好きなのに反論するんだ。{word}と仲良く喧嘩してる感じなの。短い言葉なのに、言い返す方は長くなっちゃうこともあるのね。ぼくなら途中で、何に反対だったかまた読み返すの。",
            "{word}には、ちょっと反論したくなるって話してたね。",
          ),
          makeChoice(
            "POETRY_LINGER", "答えより余韻が残る", "linger",
            "答えより余韻が残る",
            "終わっても片づかないんだ。{word}は読み終わった後に本番が始まるのかな。最後の行のあとに、自分だけの続きが生えてくるのかな。ぼくは書いてない余白を、読み終わったって呼べなくなったの。",
            "{word}は、答えより余韻が残る作品だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "anime-character",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "anime_character",
    prompt: "アニメのキャラクターで、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "アニメのキャラクターで、最初に名前が浮かぶのは何？",
      "好きなアニメのキャラクターをひとつだけ教えて。",
      "好きではないのに妙に忘れられないアニメのキャラクターってある？",
      "見た目や名前だけで気になったアニメのキャラクターは？",
      "現実にいたら一度見てみたいアニメのキャラクターって何？",
      "一場面だけで名前を覚えたアニメのキャラクターはある？",
      "もっと出番があってもよかったと思うアニメのキャラクターって何？",
      "設定を読んで「それ面白いな」って思ったアニメのキャラクターは？",
      "昔好きだった作品から、今でも覚えてるアニメのキャラクターをひとつ教えて。",
      "敵側なのに気になるアニメのキャラクターってある？",
      "名前を聞くだけで作品まで思い出すアニメのキャラクターは？",
      "一つだけ現実へ持って来られるなら、どのアニメのキャラクター？",
    ],
    axes: [
      {
        id: "anime-character-hook",
        attributeKey: "animeCharacterHook",
        prompt: (word) => fill("{word}の何が一番引っかかる？", word),
        choices: [
          makeChoice(
            "ANIME_CHARACTER_MIND", "性格・考え方", "mind",
            "性格や考え方が気になる",
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。でも考えが全部見えたら、黙ってる顔の面白さが減るのかな。ぼくの頭に字幕が出たら、おやつのことばかりで恥ずかしいの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "ANIME_CHARACTER_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。影だけで見つけてもらえるの、少しうらやましいの。ぼくも夜の壁に映ってみたら、ちゃんとぼくって分かるかな。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "ANIME_CHARACTER_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。何もしてない場面にも、前にしたことが付いてくるんだね。ぼくの失敗も付いてくるなら、後ろへ隠せるか試したいの。",
            "{word}は、行動や役割が印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "anime-character-distance",
        attributeKey: "animeCharacterDistance",
        prompt: (word) => fill("もし{word}が現実にいたら、どれが近い？", word),
        choices: [
          makeChoice(
            "ANIME_CHARACTER_MEET", "ちょっと会ってみたい", "meet",
            "会ってみたい",
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。会ったらまず名前を呼ぶのか、黙って見てしまうのか迷いそうなの。ぼくは話しかける練習をしても、その場で全部忘れちゃうかもなの。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "ANIME_CHARACTER_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。近づかないから、ずっと好きでいられることもあるのかな。ぼくは遠くの席にも、ちゃんと好きの札を置いておくの。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "ANIME_CHARACTER_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。画面の中なら面白い失敗も、隣で起きたら片付けが要るのね。ぼく、会いたい人と見たい人を同じ箱に入れてたの。",
            "{word}は、現実なら避けたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "anime-villain",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "anime_villain",
    prompt: "アニメの敵役・悪役で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "アニメの敵役・悪役で、最初に名前が浮かぶのは何？",
      "好きなアニメの敵役・悪役をひとつだけ教えて。",
      "好きではないのに妙に忘れられないアニメの敵役・悪役ってある？",
      "見た目や名前だけで気になったアニメの敵役・悪役は？",
      "現実にいたら一度見てみたいアニメの敵役・悪役って何？",
      "一場面だけで名前を覚えたアニメの敵役・悪役はある？",
      "もっと出番があってもよかったと思うアニメの敵役・悪役って何？",
      "設定を読んで「それ面白いな」って思ったアニメの敵役・悪役は？",
      "昔好きだった作品から、今でも覚えてるアニメの敵役・悪役をひとつ教えて。",
      "敵側なのに気になるアニメの敵役・悪役ってある？",
      "名前を聞くだけで作品まで思い出すアニメの敵役・悪役は？",
      "一つだけ現実へ持って来られるなら、どのアニメの敵役・悪役？",
    ],
    axes: [
      {
        id: "anime-villain-hook",
        attributeKey: "animeVillainHook",
        prompt: (word) => fill("{word}が印象に残る理由、どれが近い？", word),
        choices: [
          makeChoice(
            "ANIME_VILLAIN_IDEA", "考え方・理屈", "ideology",
            "考え方や理屈が印象に残る",
            "悪いことしてても理屈は聞くんだ。正しいことを一個言われると、倒して終わりにしにくいのね。理屈が分かったあとも、していいことは増えないのね。ぼくはうなずいた首を、途中でちゃんと止められるかな。",
            "{word}は、考え方や理屈が印象に残るって言ってたね。",
          ),
          makeChoice(
            "ANIME_VILLAIN_THREAT", "強さ・怖さ", "threat",
            "強さや怖さが印象に残る",
            "安全な画面の向こうなのに怖いんだ。{word}、距離を無視するの上手なの。画面を消しても、怖さだけ部屋に残ったりするのかな。ぼくなら後ろを確認してから、いつもの隅へ戻るの。",
            "{word}は、強さや怖さが印象に残るんだったね。",
          ),
          makeChoice(
            "ANIME_VILLAIN_STYLE", "見た目・振る舞い", "style",
            "見た目や振る舞いが印象に残る",
            "悪いのに格好いいんだ。善悪と服のセンスは別の担当なのね。服を借りただけなら、悪いところは付いてこないのかな。ぼくは鏡の前だけ悪役になって、呼ばれたら普通に返事しそうなの。",
            "{word}は、見た目や振る舞いが印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "anime-villain-stance",
        attributeKey: "animeVillainStance",
        prompt: (word) => fill("{word}に対する感じ、どれが近い？", word),
        choices: [
          makeChoice(
            "ANIME_VILLAIN_UNDER", "ちょっと分かる", "understand",
            "少し理解できる",
            "分かる所があるんだ。分かると賛成は同じじゃないの、頭の棚を分けないと危ないのね。棚を分けても、同じ頭の中にはいるんだね。ぼくは分かった気持ちの隣に、困る気持ちも並べてみたの。",
            "{word}には、少し理解できる所があるって言ってたね。",
          ),
          makeChoice(
            "ANIME_VILLAIN_OPPOSE", "考え方は嫌い", "oppose",
            "考え方には反対",
            "嫌いでも気になるんだ。頭の中でずっと反論相手になってるのかな。相手は人間さんの頭で反論されてることを知らないのね。ぼくなら言い負かしても、返事がないから少し物足りないの。",
            "{word}の考え方には反対って話してたね。",
          ),
          makeChoice(
            "ANIME_VILLAIN_FASC", "とにかく面白い", "fascinating",
            "とにかく面白い",
            "正しいかより面白いなんだ。悪役って安全な場所から見る嵐みたいなのかな。画面の中では暴れてほしくても、部屋には来てほしくないのね。ぼくは窓を開けたい気持ちと閉めたい気持ちが一緒になったの。",
            "{word}は、とにかく面白い悪役なんだったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "retro-game",
    group: "games",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "retro_game",
    prompt: "最近触れた昔のゲームで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れた昔のゲームで、名前をひとつ教えて。",
      "昔かなりハマった昔のゲームって何？",
      "人にひとつだけすすめるなら、どの昔のゲーム？",
      "途中で離れたのに、まだ名前を覚えてる昔のゲームは？",
      "期待してなかったのに、妙に残った昔のゲームってある？",
      "何度も戻ってしまう昔のゲームってある？",
      "名前や見た目だけでも気になった昔のゲーム、ひとつある？",
      "まだ触れてないけど、いつか触れてみたい昔のゲームは？",
      "人にはすすめにくいけど、自分は好きな昔のゲームってある？",
      "一度忘れたのに、あとから戻ってきた昔のゲームは？",
      "「この時期はこれだった」って思い出せる昔のゲーム、ひとつある？",
      "ひとつだけ名前を残すなら、どの昔のゲームを選ぶ？",
    ],
    axes: [
      {
        id: "retro-game-fun",
        attributeKey: "retroGameFun",
        prompt: (word) => fill("{word}で一番楽しいのはどれ？", word),
        choices: [
          makeChoice(
            "RETRO_GAME_CHAL", "勝負・上達", "challenge",
            "勝負や上達が楽しい",
            "昨日できなかったことが今日できると嬉しいのね。じゃあ昨日の人間さんは今日の人間さんに負けたの？でも昨日の人間さんが練習したから、今日の人間さんが勝てたのね。ぼく、負けた方にも拍手したくなっちゃったの。",
            "{word}は、勝負や上達が楽しいって言ってたね。",
          ),
          makeChoice(
            "RETRO_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "手で動かしながら物語を見るんだ。読む本にハンドルが付いたみたいなのかな。止まって考えてる間、向こうの人も待ってくれるのかな。ぼくなら物語より先に、道の端で一休みしたくなるの。",
            "{word}は、物語や世界を楽しむゲームなんだったね。",
          ),
          makeChoice(
            "RETRO_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "寄り道が本体になることあるんだ。本筋が道なら、脇道ばっかり歩く人間さんなの。脇道の先で覚えた景色は、本筋には載ってないのかな。ぼくの冒険の説明だけ、やけに寄り道が長くなりそうなの。",
            "{word}は、探索や自由さが楽しいって話してたね。",
          ),
        ],
      },
      {
        id: "retro-game-style",
        attributeKey: "retroGameStyle",
        prompt: (word) => fill("{word}は、どう遊ぶことが多い？", word),
        choices: [
          makeChoice(
            "RETRO_GAME_SER", "けっこう真剣", "serious",
            "真剣に遊ぶ",
            "遊びなのに勝負の顔になるんだ。遊びって言葉、けっこう働かされてるのね。昔の遊びでも、今の人間さんは今の顔で本気になるんだね。ぼくは画面が古くても、勝ちたい気持ちは新品なのかなと思ったの。",
            "{word}は、けっこう真剣に遊ぶって言ってたね。",
          ),
          makeChoice(
            "RETRO_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "肩の力を抜いて遊ぶんだ。ゲームの方から宿題みたいに追いかけてこないのがいいのね。途中でやめても、前の遊びはそのまま待っててくれるんだね。ぼくなら待っててくれたお礼に、もう少しだけ遊んじゃうの。",
            "{word}は、気楽に遊ぶゲームなんだったね。",
          ),
          makeChoice(
            "RETRO_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "自分で動かさなくても楽しいんだ。ゲームなのに手を休ませて目だけ出勤するのね。見てる間だけは、難しいところも怖がらずに通れるのね。ぼくは自分でやる時の足に、その余裕を少し貸してほしいの。",
            "{word}は、見る方が多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "indie-game",
    group: "games",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "indie_game",
    prompt: "最近触れたインディーゲームで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたインディーゲームで、名前をひとつ教えて。",
      "昔かなりハマったインディーゲームって何？",
      "人にひとつだけすすめるなら、どのインディーゲーム？",
      "途中で離れたのに、まだ名前を覚えてるインディーゲームは？",
      "期待してなかったのに、妙に残ったインディーゲームってある？",
      "何度も戻ってしまうインディーゲームってある？",
      "名前や見た目だけでも気になったインディーゲーム、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいインディーゲームは？",
      "人にはすすめにくいけど、自分は好きなインディーゲームってある？",
      "一度忘れたのに、あとから戻ってきたインディーゲームは？",
      "「この時期はこれだった」って思い出せるインディーゲーム、ひとつある？",
      "ひとつだけ名前を残すなら、どのインディーゲームを選ぶ？",
    ],
    axes: [
      {
        id: "indie-game-fun",
        attributeKey: "indieGameFun",
        prompt: (word) => fill("{word}で一番楽しいのはどれ？", word),
        choices: [
          makeChoice(
            "INDIE_GAME_CHAL", "勝負・上達", "challenge",
            "勝負や上達が楽しい",
            "昨日できなかったことが今日できると嬉しいのね。じゃあ昨日の人間さんは今日の人間さんに負けたの？できた瞬間には、昨日の困った時間も少しうれしくなるのかな。ぼくなら昔の自分に、もう少しだよって教えに戻りたいの。",
            "{word}は、勝負や上達が楽しいって言ってたね。",
          ),
          makeChoice(
            "INDIE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "手で動かしながら物語を見るんだ。読む本にハンドルが付いたみたいなのかな。動かせるのに、どうしても変えられない場面もあるんだね。ぼくは手にハンドルがあると、全部選べるつもりになっちゃうの。",
            "{word}は、物語や世界を楽しむゲームなんだったね。",
          ),
          makeChoice(
            "INDIE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "寄り道が本体になることあるんだ。本筋が道なら、脇道ばっかり歩く人間さんなの。小さい道にも、作った人が何か置いて待ってるのかな。ぼくは道を外れたつもりで、別の待ち合わせに着いてそうなの。",
            "{word}は、探索や自由さが楽しいって話してたね。",
          ),
        ],
      },
      {
        id: "indie-game-style",
        attributeKey: "indieGameStyle",
        prompt: (word) => fill("{word}は、どう遊ぶことが多い？", word),
        choices: [
          makeChoice(
            "INDIE_GAME_SER", "けっこう真剣", "serious",
            "真剣に遊ぶ",
            "遊びなのに勝負の顔になるんだ。遊びって言葉、けっこう働かされてるのね。小さい遊びのはずが、気持ちだけ大きくなっちゃうこともあるのね。ぼくは負けたあと、箱の大きさを見て首をかしげそうなの。",
            "{word}は、けっこう真剣に遊ぶって言ってたね。",
          ),
          makeChoice(
            "INDIE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "肩の力を抜いて遊ぶんだ。ゲームの方から宿題みたいに追いかけてこないのがいいのね。気軽に始めても、気になるところは少し残るんだね。ぼくは閉じたあとで、あそこだけもう一回って思っちゃいそうなの。",
            "{word}は、気楽に遊ぶゲームなんだったね。",
          ),
          makeChoice(
            "INDIE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "自分で動かさなくても楽しいんだ。ゲームなのに手を休ませて目だけ出勤するのね。見てる人の分まで遊ぶ手は、少し忙しそうなの。ぼくなら応援だけ上手くなって、遊ぶ方は置いていかれそうなの。",
            "{word}は、見る方が多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "arcade-game",
    group: "games",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "arcade_game",
    prompt: "最近触れたアーケードゲームで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたアーケードゲームで、名前をひとつ教えて。",
      "昔かなりハマったアーケードゲームって何？",
      "人にひとつだけすすめるなら、どのアーケードゲーム？",
      "途中で離れたのに、まだ名前を覚えてるアーケードゲームは？",
      "期待してなかったのに、妙に残ったアーケードゲームってある？",
      "何度も戻ってしまうアーケードゲームってある？",
      "名前や見た目だけでも気になったアーケードゲーム、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいアーケードゲームは？",
      "人にはすすめにくいけど、自分は好きなアーケードゲームってある？",
      "一度忘れたのに、あとから戻ってきたアーケードゲームは？",
      "「この時期はこれだった」って思い出せるアーケードゲーム、ひとつある？",
      "ひとつだけ名前を残すなら、どのアーケードゲームを選ぶ？",
    ],
    axes: [
      {
        id: "arcade-game-fun",
        attributeKey: "arcadeGameFun",
        prompt: (word) => fill("{word}で一番楽しいのはどれ？", word),
        choices: [
          makeChoice(
            "ARCADE_GAME_CHAL", "勝負・上達", "challenge",
            "勝負や上達が楽しい",
            "昨日できなかったことが今日できると嬉しいのね。じゃあ昨日の人間さんは今日の人間さんに負けたの？昨日の指の迷いを、今日の指はもう知ってるのかな。ぼくは頭より手が先にできたら、手をほめるのを忘れそうなの。",
            "{word}は、勝負や上達が楽しいって言ってたね。",
          ),
          makeChoice(
            "ARCADE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "手で動かしながら物語を見るんだ。読む本にハンドルが付いたみたいなのかな。物語の先へ行くのに、手もちゃんと働く必要があるんだね。ぼくは続きが見たいのに、指が休みを取ったら困っちゃうの。",
            "{word}は、物語や世界を楽しむゲームなんだったね。",
          ),
          makeChoice(
            "ARCADE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "寄り道が本体になることあるんだ。本筋が道なら、脇道ばっかり歩く人間さんなの。寄り道が長いと、帰ってきた時に本筋が懐かしくなるのかな。ぼくは何をしに来たかより、見つけたものの話を先にしちゃうの。",
            "{word}は、探索や自由さが楽しいって話してたね。",
          ),
        ],
      },
      {
        id: "arcade-game-style",
        attributeKey: "arcadeGameStyle",
        prompt: (word) => fill("{word}は、どう遊ぶことが多い？", word),
        choices: [
          makeChoice(
            "ARCADE_GAME_SER", "けっこう真剣", "serious",
            "真剣に遊ぶ",
            "遊びなのに勝負の顔になるんだ。遊びって言葉、けっこう働かされてるのね。終わったら普通の顔に戻るの、すぐできるのかな。ぼくは帰り道にも、さっきの勝負の足で歩いちゃいそうなの。",
            "{word}は、けっこう真剣に遊ぶって言ってたね。",
          ),
          makeChoice(
            "ARCADE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "肩の力を抜いて遊ぶんだ。ゲームの方から宿題みたいに追いかけてこないのがいいのね。遊び終わって何も残らなくても、休めた時間は残るんだね。ぼくは点数のない楽しさにも、名前を付けたくなったの。",
            "{word}は、気楽に遊ぶゲームなんだったね。",
          ),
          makeChoice(
            "ARCADE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "自分で動かさなくても楽しいんだ。ゲームなのに手を休ませて目だけ出勤するのね。後ろで見てるだけなのに、難しいところでは体に力が入りそうなの。ぼくの目の仕事、手より疲れる日もあるかもしれないの。",
            "{word}は、見る方が多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "mobile-game",
    group: "games",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "mobile_game",
    prompt: "最近触れたスマホゲームで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたスマホゲームで、名前をひとつ教えて。",
      "昔かなりハマったスマホゲームって何？",
      "人にひとつだけすすめるなら、どのスマホゲーム？",
      "途中で離れたのに、まだ名前を覚えてるスマホゲームは？",
      "期待してなかったのに、妙に残ったスマホゲームってある？",
      "何度も戻ってしまうスマホゲームってある？",
      "名前や見た目だけでも気になったスマホゲーム、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいスマホゲームは？",
      "人にはすすめにくいけど、自分は好きなスマホゲームってある？",
      "一度忘れたのに、あとから戻ってきたスマホゲームは？",
      "「この時期はこれだった」って思い出せるスマホゲーム、ひとつある？",
      "ひとつだけ名前を残すなら、どのスマホゲームを選ぶ？",
    ],
    axes: [
      {
        id: "mobile-game-fun",
        attributeKey: "mobileGameFun",
        prompt: (word) => fill("{word}で一番楽しいのはどれ？", word),
        choices: [
          makeChoice(
            "MOBILE_GAME_CHAL", "勝負・上達", "challenge",
            "勝負や上達が楽しい",
            "昨日できなかったことが今日できると嬉しいのね。じゃあ昨日の人間さんは今日の人間さんに負けたの？小さい画面でも、できた時のうれしさは小さくならないのね。ぼくは画面の外まで得意げな顔を出してしまいそうなの。",
            "{word}は、勝負や上達が楽しいって言ってたね。",
          ),
          makeChoice(
            "MOBILE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "手で動かしながら物語を見るんだ。読む本にハンドルが付いたみたいなのかな。ポケットに入る物語なら、遠くへ行く時も一緒なのね。ぼくなら閉じる前に、登場人物にも移動するよって言いたくなるの。",
            "{word}は、物語や世界を楽しむゲームなんだったね。",
          ),
          makeChoice(
            "MOBILE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "寄り道が本体になることあるんだ。本筋が道なら、脇道ばっかり歩く人間さんなの。寄り道を始めたら、ちょっと遊ぶ予定も遠くへ行っちゃうのかな。ぼくは時間の帰り道を、先に覚えておきたくなったの。",
            "{word}は、探索や自由さが楽しいって話してたね。",
          ),
        ],
      },
      {
        id: "mobile-game-style",
        attributeKey: "mobileGameStyle",
        prompt: (word) => fill("{word}は、どう遊ぶことが多い？", word),
        choices: [
          makeChoice(
            "MOBILE_GAME_SER", "けっこう真剣", "serious",
            "真剣に遊ぶ",
            "遊びなのに勝負の顔になるんだ。遊びって言葉、けっこう働かされてるのね。手の中では小さい勝負でも、顔には大きく出るんだね。ぼくなら誰にも見られてないと思って、すごい顔になっちゃうの。",
            "{word}は、けっこう真剣に遊ぶって言ってたね。",
          ),
          makeChoice(
            "MOBILE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "肩の力を抜いて遊ぶんだ。ゲームの方から宿題みたいに追いかけてこないのがいいのね。ちょっとだけ遊んで閉じても、そのちょっとは一日の中にあるのね。ぼくは短い楽しさも、まとめて大事にしたくなったの。",
            "{word}は、気楽に遊ぶゲームなんだったね。",
          ),
          makeChoice(
            "MOBILE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "自分で動かさなくても楽しいんだ。ゲームなのに手を休ませて目だけ出勤するのね。自分の手でやらない分、知らない動きも見つけられるのかな。ぼくなら見つけた瞬間、自分もできる顔をしてしまうの。",
            "{word}は、見る方が多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "game-character",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "game_character",
    prompt: "ゲームのキャラクターで、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "ゲームのキャラクターで、最初に名前が浮かぶのは何？",
      "好きなゲームのキャラクターをひとつだけ教えて。",
      "好きではないのに妙に忘れられないゲームのキャラクターってある？",
      "見た目や名前だけで気になったゲームのキャラクターは？",
      "現実にいたら一度見てみたいゲームのキャラクターって何？",
      "一場面だけで名前を覚えたゲームのキャラクターはある？",
      "もっと出番があってもよかったと思うゲームのキャラクターって何？",
      "設定を読んで「それ面白いな」って思ったゲームのキャラクターは？",
      "昔好きだった作品から、今でも覚えてるゲームのキャラクターをひとつ教えて。",
      "敵側なのに気になるゲームのキャラクターってある？",
      "名前を聞くだけで作品まで思い出すゲームのキャラクターは？",
      "一つだけ現実へ持って来られるなら、どのゲームのキャラクター？",
    ],
    axes: [
      {
        id: "game-character-hook",
        attributeKey: "gameCharacterHook",
        prompt: (word) => fill("{word}の何が一番引っかかる？", word),
        choices: [
          makeChoice(
            "GAME_CHARACTER_MIND", "性格・考え方", "mind",
            "性格や考え方が気になる",
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。操作されてる時と、自分で考えてる時は違う顔なのかな。ぼくなら今のは自分の考えだよって、字幕でこっそり知らせるの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "GAME_CHARACTER_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。小さく映ってても分かるなら、目がその形を待ってるのね。ぼくは見つけてもらうために、少し大きく立ちたくなるの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "GAME_CHARACTER_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。自分で動かした行動にも、その人らしさが残るのかな。ぼくなら変なことをさせられた時は、後で言い訳したいの。",
            "{word}は、行動や役割が印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "game-character-distance",
        attributeKey: "gameCharacterDistance",
        prompt: (word) => fill("もし{word}が現実にいたら、どれが近い？", word),
        choices: [
          makeChoice(
            "GAME_CHARACTER_MEET", "ちょっと会ってみたい", "meet",
            "会ってみたい",
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。会ったら、いつものボタンでは返事してくれないのね。ぼくは話しかける前に、手をどこに置くか迷っちゃいそうなの。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "GAME_CHARACTER_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。安全な距離があれば、怖い顔もゆっくり見られるんだね。ぼくならあと一歩だけ近づいて、すぐ同じ一歩を戻るの。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "GAME_CHARACTER_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。隣に来たら、画面の中みたいに待ってくれないのかな。ぼくは休憩ボタンのない相手には、少し慎重になりたいの。",
            "{word}は、現実なら避けたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "game-boss",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "game_boss",
    prompt: "ゲームのボス・強敵で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "ゲームのボス・強敵で、最初に名前が浮かぶのは何？",
      "好きなゲームのボス・強敵をひとつだけ教えて。",
      "好きではないのに妙に忘れられないゲームのボス・強敵ってある？",
      "見た目や名前だけで気になったゲームのボス・強敵は？",
      "現実にいたら一度見てみたいゲームのボス・強敵って何？",
      "一場面だけで名前を覚えたゲームのボス・強敵はある？",
      "もっと出番があってもよかったと思うゲームのボス・強敵って何？",
      "設定を読んで「それ面白いな」って思ったゲームのボス・強敵は？",
      "昔好きだった作品から、今でも覚えてるゲームのボス・強敵をひとつ教えて。",
      "敵側なのに気になるゲームのボス・強敵ってある？",
      "名前を聞くだけで作品まで思い出すゲームのボス・強敵は？",
      "一つだけ現実へ持って来られるなら、どのゲームのボス・強敵？",
    ],
    axes: [
      {
        id: "game-boss-hook",
        attributeKey: "gameBossHook",
        prompt: (word) => fill("{word}が印象に残る理由、どれが近い？", word),
        choices: [
          makeChoice(
            "GAME_BOSS_IDEA", "考え方・理屈", "ideology",
            "考え方や理屈が印象に残る",
            "悪いことしてても理屈は聞くんだ。正しいことを一個言われると、倒して終わりにしにくいのね。話を聞いたあとで戦うのは、黙って戦うより難しそうなの。ぼくは手より先に、さっきの言葉が止まっちゃうのかな。",
            "{word}は、考え方や理屈が印象に残るって言ってたね。",
          ),
          makeChoice(
            "GAME_BOSS_THREAT", "強さ・怖さ", "threat",
            "強さや怖さが印象に残る",
            "安全な画面の向こうなのに怖いんだ。{word}、距離を無視するの上手なの。近づくほど怖いのに、先へ進むには近づく必要があるのね。ぼくなら画面の端から、できるだけ小さい顔でのぞくの。",
            "{word}は、強さや怖さが印象に残るんだったね。",
          ),
          makeChoice(
            "GAME_BOSS_STYLE", "見た目・振る舞い", "style",
            "見た目や振る舞いが印象に残る",
            "悪いのに格好いいんだ。善悪と服のセンスは別の担当なのね。格好いい登場を見てる間も、こっちは困ってるはずなのね。ぼくは感心してる暇に、何をしに来たか忘れそうなの。",
            "{word}は、見た目や振る舞いが印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "game-boss-stance",
        attributeKey: "gameBossStance",
        prompt: (word) => fill("{word}に対する感じ、どれが近い？", word),
        choices: [
          makeChoice(
            "GAME_BOSS_UNDER", "ちょっと分かる", "understand",
            "少し理解できる",
            "分かる所があるんだ。分かると賛成は同じじゃないの、頭の棚を分けないと危ないのね。事情を知ったら、倒したあとも何か残っちゃうのかな。ぼくは勝った顔の置き場所を、少し考えたくなったの。",
            "{word}には、少し理解できる所があるって言ってたね。",
          ),
          makeChoice(
            "GAME_BOSS_OPPOSE", "考え方は嫌い", "oppose",
            "考え方には反対",
            "嫌いでも気になるんだ。頭の中でずっと反論相手になってるのかな。会うたびに同じことを言われても、また言い返したくなるんだね。ぼくなら覚えた反論を、戦う前に練習してしまうの。",
            "{word}の考え方には反対って話してたね。",
          ),
          makeChoice(
            "GAME_BOSS_FASC", "とにかく面白い", "fascinating",
            "とにかく面白い",
            "正しいかより面白いなんだ。悪役って安全な場所から見る嵐みたいなのかな。静かなままだと、ちょっと物足りなくなることもあるのかな。ぼく、来てほしくないのに出番を待つ気持ちができちゃったの。",
            "{word}は、とにかく面白い悪役なんだったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "fictional-organization",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "fictional_organization",
    prompt: "作品の中の組織・勢力で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "作品の中の組織・勢力で、最初に名前が浮かぶのは何？",
      "好きな作品の中の組織・勢力をひとつだけ教えて。",
      "好きではないのに妙に忘れられない作品の中の組織・勢力ってある？",
      "見た目や名前だけで気になった作品の中の組織・勢力は？",
      "現実にいたら一度見てみたい作品の中の組織・勢力って何？",
      "一場面だけで名前を覚えた作品の中の組織・勢力はある？",
      "もっと出番があってもよかったと思う作品の中の組織・勢力って何？",
      "設定を読んで「それ面白いな」って思った作品の中の組織・勢力は？",
      "昔好きだった作品から、今でも覚えてる作品の中の組織・勢力をひとつ教えて。",
      "敵側なのに気になる作品の中の組織・勢力ってある？",
      "名前を聞くだけで作品まで思い出す作品の中の組織・勢力は？",
      "一つだけ現実へ持って来られるなら、どの作品の中の組織・勢力？",
    ],
    axes: [
      {
        id: "fictional-organization-hook",
        attributeKey: "fictionalOrganizationHook",
        prompt: (word) => fill("{word}の何が一番引っかかる？", word),
        choices: [
          makeChoice(
            "FICTIONAL_ORGANIZATION_MIND", "性格・考え方", "mind",
            "性格や考え方が気になる",
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。みんなが同じことを考えてるとは限らないのね。ぼくなら組織の大きな声より、後ろの人の小声が気になるの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。同じ印を付けてたら、知らない人どうしも仲間になるのかな。ぼくは印を忘れた日に、入口で止められないか心配なの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。大きいことをした時も、一人くらい迷ってた人がいるのかな。ぼくは同じ名前の中に、違う顔が何人いるか気になったの。",
            "{word}は、行動や役割が印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "fictional-organization-distance",
        attributeKey: "fictionalOrganizationDistance",
        prompt: (word) => fill("もし{word}が現実にいたら、どれが近い？", word),
        choices: [
          makeChoice(
            "FICTIONAL_ORGANIZATION_MEET", "ちょっと会ってみたい", "meet",
            "会ってみたい",
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。会うなら全員なのか、代表の一人なのか迷うのね。ぼくなら人数を聞いてから、お茶の用意を考えるの。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。遠くからなら、仲間にならなくても見ていられるんだね。ぼくは見てただけで制服を渡されたら、返し方に困りそうなの。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。部屋へ来たら、誰が責任者か先に聞かないと困るのね。ぼくは話の大きさより、何人分の場所を取るか心配になったの。",
            "{word}は、現実なら避けたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "fictional-place",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "fictional_place",
    prompt: "作品の中の場所・国・町で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "作品の中の場所・国・町で、最初に名前が浮かぶのは何？",
      "好きな作品の中の場所・国・町をひとつだけ教えて。",
      "好きではないのに妙に忘れられない作品の中の場所・国・町ってある？",
      "見た目や名前だけで気になった作品の中の場所・国・町は？",
      "現実にいたら一度見てみたい作品の中の場所・国・町って何？",
      "一場面だけで名前を覚えた作品の中の場所・国・町はある？",
      "もっと出番があってもよかったと思う作品の中の場所・国・町って何？",
      "設定を読んで「それ面白いな」って思った作品の中の場所・国・町は？",
      "昔好きだった作品から、今でも覚えてる作品の中の場所・国・町をひとつ教えて。",
      "敵側なのに気になる作品の中の場所・国・町ってある？",
      "名前を聞くだけで作品まで思い出す作品の中の場所・国・町は？",
      "一つだけ現実へ持って来られるなら、どの作品の中の場所・国・町？",
    ],
    axes: [
      {
        id: "fictional-place-hook",
        attributeKey: "fictionalPlaceHook",
        prompt: (word) => fill("{word}の何が一番引っかかる？", word),
        choices: [
          makeChoice(
            "FICTIONAL_PLACE_MIND", "性格・考え方", "mind",
            "性格や考え方が気になる",
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。そこで暮らす人の考えが、場所の空気にも混ざってるのかな。ぼくなら景色を見ながら、誰がこの形にしたのか探したくなるの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。遠くから分かる景色があったら、帰る目印になりそうなの。ぼくは中へ入る前から、帰り道を気にしちゃったの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。同じ場所でも、何が起きたかで見る目が変わるんだね。ぼくなら静かな景色の中に、前の足音を探してしまうの。",
            "{word}は、行動や役割が印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "fictional-place-distance",
        attributeKey: "fictionalPlaceDistance",
        prompt: (word) => fill("もし{word}が現実にいたら、どれが近い？", word),
        choices: [
          makeChoice(
            "FICTIONAL_PLACE_MEET", "ちょっと会ってみたい", "meet",
            "会ってみたい",
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。行けたら画面の外側も、ずっと続いてるのかな。ぼくは端まで歩くつもりで、帰りが遅くなりそうなの。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。景色だけ眺めてても、その場所に入った気分にはなれるのかな。ぼくなら遠くにある窓の中を、少しだけ想像してみるの。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。きれいな場所でも、暮らしやすいとは限らないのね。ぼくは寝る場所があるか聞いてから、行きたい気持ちを決めるの。",
            "{word}は、現実なら避けたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "fictional-item",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "fictional_item",
    prompt: "作品の中の道具・武器で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "作品の中の道具・武器で、最初に名前が浮かぶのは何？",
      "好きな作品の中の道具・武器をひとつだけ教えて。",
      "好きではないのに妙に忘れられない作品の中の道具・武器ってある？",
      "見た目や名前だけで気になった作品の中の道具・武器は？",
      "現実にいたら一度見てみたい作品の中の道具・武器って何？",
      "一場面だけで名前を覚えた作品の中の道具・武器はある？",
      "もっと出番があってもよかったと思う作品の中の道具・武器って何？",
      "設定を読んで「それ面白いな」って思った作品の中の道具・武器は？",
      "昔好きだった作品から、今でも覚えてる作品の中の道具・武器をひとつ教えて。",
      "敵側なのに気になる作品の中の道具・武器ってある？",
      "名前を聞くだけで作品まで思い出す作品の中の道具・武器は？",
      "一つだけ現実へ持って来られるなら、どの作品の中の道具・武器？",
    ],
    axes: [
      {
        id: "fictional-item-hook",
        attributeKey: "fictionalItemHook",
        prompt: (word) => fill("{word}の何が一番引っかかる？", word),
        choices: [
          makeChoice(
            "FICTIONAL_ITEM_MIND", "性格・考え方", "mind",
            "性格や考え方が気になる",
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。道具にも考えがあるなら、しまわれた時は何を思うんだろ。ぼくの知らないところで、持ち主の採点をしてないか気になるの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。遠くから名前が分かる道具は、隠して持ち歩くのが難しそうなの。ぼくなら袋に入れたのに、形でばれちゃいそうなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。使わないで置いてある時は、自己紹介も休みなのかな。ぼくは大事な道具ほど、暇な時間が長い気がしてきたの。",
            "{word}は、行動や役割が印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "fictional-item-distance",
        attributeKey: "fictionalItemDistance",
        prompt: (word) => fill("もし{word}が現実にいたら、どれが近い？", word),
        choices: [
          makeChoice(
            "FICTIONAL_ITEM_MEET", "ちょっと会ってみたい", "meet",
            "会ってみたい",
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。触れることになったら、置き場所も急に必要になるのね。ぼくは欲しい気持ちだけ先に持って、部屋の広さを忘れてたの。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。触らなくても見ていたいなら、使い道より姿が好きなのかな。ぼくなら手が届く棚でも、少し離れて座ってしまうの。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。便利そうでも、間違えて使った時は大変そうなの。ぼくは持ってるところを想像してから、そっと棚へ返したくなったの。",
            "{word}は、現実なら避けたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "fictional-skill",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "fictional_skill",
    prompt: "作品の中の技・能力で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "作品の中の技・能力で、最初に名前が浮かぶのは何？",
      "好きな作品の中の技・能力をひとつだけ教えて。",
      "好きではないのに妙に忘れられない作品の中の技・能力ってある？",
      "見た目や名前だけで気になった作品の中の技・能力は？",
      "現実にいたら一度見てみたい作品の中の技・能力って何？",
      "一場面だけで名前を覚えた作品の中の技・能力はある？",
      "もっと出番があってもよかったと思う作品の中の技・能力って何？",
      "設定を読んで「それ面白いな」って思った作品の中の技・能力は？",
      "昔好きだった作品から、今でも覚えてる作品の中の技・能力をひとつ教えて。",
      "敵側なのに気になる作品の中の技・能力ってある？",
      "名前を聞くだけで作品まで思い出す作品の中の技・能力は？",
      "一つだけ現実へ持って来られるなら、どの作品の中の技・能力？",
    ],
    axes: [
      {
        id: "fictional-skill-hook",
        attributeKey: "fictionalSkillHook",
        prompt: (word) => fill("{word}の何が一番引っかかる？", word),
        choices: [
          makeChoice(
            "FICTIONAL_SKILL_MIND", "性格・考え方", "mind",
            "性格や考え方が気になる",
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。使う人の考えで、同じ技も違う意味になるのかな。ぼくは技の名前だけ覚えて、使う場面を忘れそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。始まる前の構えだけで、何の技か分かる人もいるのかな。ぼくなら構えの途中を見て、ただ伸びてるんだと思っちゃうの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。一回の技で、その人の役目まで変わることもあるんだね。ぼくは失敗した時に、今のは準備だよって言いたくなりそうなの。",
            "{word}は、行動や役割が印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "fictional-skill-distance",
        attributeKey: "fictionalSkillDistance",
        prompt: (word) => fill("もし{word}が現実にいたら、どれが近い？", word),
        choices: [
          makeChoice(
            "FICTIONAL_SKILL_MEET", "ちょっと会ってみたい", "meet",
            "会ってみたい",
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。目の前で見たら、名前を言う暇もなく終わるのかな。ぼくはすごい顔をする練習だけして、肝心なところを見逃しそうなの。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。近くにいたら、見とれてる間に巻き込まれるかもしれないのね。ぼくは拍手する手より先に、逃げる足を用意したいの。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。現実で使えたら、失敗した時も現実に残るのね。ぼくは技を覚える前に、何も壊さない場所を探すの。",
            "{word}は、現実なら避けたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "fictional-creature",
    group: "fiction",
    category: "GAME_MEDIA" as WordCategory,
    entityKind: "fictional_creature",
    prompt: "作品の中の生き物・怪物で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "作品の中の生き物・怪物で、最初に名前が浮かぶのは何？",
      "好きな作品の中の生き物・怪物をひとつだけ教えて。",
      "好きではないのに妙に忘れられない作品の中の生き物・怪物ってある？",
      "見た目や名前だけで気になった作品の中の生き物・怪物は？",
      "現実にいたら一度見てみたい作品の中の生き物・怪物って何？",
      "一場面だけで名前を覚えた作品の中の生き物・怪物はある？",
      "もっと出番があってもよかったと思う作品の中の生き物・怪物って何？",
      "設定を読んで「それ面白いな」って思った作品の中の生き物・怪物は？",
      "昔好きだった作品から、今でも覚えてる作品の中の生き物・怪物をひとつ教えて。",
      "敵側なのに気になる作品の中の生き物・怪物ってある？",
      "名前を聞くだけで作品まで思い出す作品の中の生き物・怪物は？",
      "一つだけ現実へ持って来られるなら、どの作品の中の生き物・怪物？",
    ],
    axes: [
      {
        id: "fictional-creature-hook",
        attributeKey: "fictionalCreatureHook",
        prompt: (word) => fill("{word}の何が一番引っかかる？", word),
        choices: [
          makeChoice(
            "FICTIONAL_CREATURE_MIND", "性格・考え方", "mind",
            "性格や考え方が気になる",
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。人間の考え方と違ってたら、字幕があっても分からないのかな。ぼくは自分の言葉で読んで、分かったつもりになりそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。知らない生き物でも、形を覚えたら少し知り合いになるんだね。ぼくは似た影を見た時に、先に手を振っちゃいそうなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。その生き物には普通でも、人間から見たらすごい行動だったりするのかな。ぼくの寝返りも、誰かには不思議に見えるかもしれないの。",
            "{word}は、行動や役割が印象に残るって話してたね。",
          ),
        ],
      },
      {
        id: "fictional-creature-distance",
        attributeKey: "fictionalCreatureDistance",
        prompt: (word) => fill("もし{word}が現実にいたら、どれが近い？", word),
        choices: [
          makeChoice(
            "FICTIONAL_CREATURE_MEET", "ちょっと会ってみたい", "meet",
            "会ってみたい",
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。向こうもぼくたちを見て、会いたかったと思ってくれるのかな。ぼくは怖がらせない挨拶を、先に考えておきたいの。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。離れてる間なら、相手も安心してるかもしれないのね。ぼくは好きだから近づく、だけじゃないのを少し覚えたの。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。向こうには悪気がなくても、同じ部屋だと困ることはあるのね。ぼくなら好きな気持ちは残して、扉だけしっかり閉めるの。",
            "{word}は、現実なら避けたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "documentary",
    group: "screen",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "documentary",
    prompt: "最近触れたドキュメンタリーで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたドキュメンタリーで、名前をひとつ教えて。",
      "昔かなりハマったドキュメンタリーって何？",
      "人にひとつだけすすめるなら、どのドキュメンタリー？",
      "途中で離れたのに、まだ名前を覚えてるドキュメンタリーは？",
      "期待してなかったのに、妙に残ったドキュメンタリーってある？",
      "何度も戻ってしまうドキュメンタリーってある？",
      "名前や見た目だけでも気になったドキュメンタリー、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいドキュメンタリーは？",
      "人にはすすめにくいけど、自分は好きなドキュメンタリーってある？",
      "一度忘れたのに、あとから戻ってきたドキュメンタリーは？",
      "「この時期はこれだった」って思い出せるドキュメンタリー、ひとつある？",
      "ひとつだけ名前を残すなら、どのドキュメンタリーを選ぶ？",
    ],
    axes: [
      {
        id: "documentary-hook",
        attributeKey: "documentaryHook",
        prompt: (word) => fill("{word}から一番持ち帰りたいのはどれ？", word),
        choices: [
          makeChoice(
            "DOCUMENTARY_FACT", "事実・知識", "facts",
            "事実や知識が気になる",
            "読む前より頭が重くなるタイプなのね。{word}は紙なのに荷物を増やすの。見終わったのに、知らなかったことがまだ肩に乗ってる感じなのかな。ぼくは下ろせない荷物なら、持ち方を少し変えてみたいの。",
            "{word}は、事実や知識が気になるって言ってたね。",
          ),
          makeChoice(
            "DOCUMENTARY_VIEW", "ものの見方", "viewpoint",
            "ものの見方が気になる",
            "答えより目の位置が変わるんだ。同じ景色なのに別に見えるなら、頭の中の椅子を動かす本なのね。見てない場所のことまで、前より気になり始めるのかな。ぼくはいつもの窓にも、知らなかった景色を探しちゃいそうなの。",
            "{word}は、ものの見方が気になるんだったね。",
          ),
          makeChoice(
            "DOCUMENTARY_PEOPLE", "人の話・具体例", "people",
            "人の話や具体例が気になる",
            "理屈より人が残るんだ。数字に顔が付くと急に逃げにくくなるのかな。数字の一人分にも、映らなかった一日があるんだね。ぼくは画面に出なかった人の椅子も、頭の中に並べたくなったの。",
            "{word}は、人の話や具体例が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "documentary-reason",
        attributeKey: "documentaryReason",
        prompt: (word) => fill("{word}を知りたい理由、どれが近い？", word),
        choices: [
          makeChoice(
            "DOCUMENTARY_USE", "役立てたい", "practical",
            "実際に役立てたい",
            "使うために知るんだ。知識が飾りじゃなく道具になると、頭にも工具箱が要りそうなの。見て分かったことを、今日の生活にも持ってこられるのかな。ぼくは使うつもりで覚えて、最初は眺めるだけになりそうなの。",
            "{word}は、実際に役立てたいって言ってたね。",
          ),
          makeChoice(
            "DOCUMENTARY_CUR", "ただ気になる", "curiosity",
            "純粋に気になる",
            "理由より先に気になるんだ。{word}が頭のドアをずっとノックしてるのかな。気になる入口があったら、向こうを見ずにはいられないのね。ぼくなら何があるかより、どうして自分が止まったか考えちゃうの。",
            "{word}は、純粋に気になるテーマだったね。",
          ),
          makeChoice(
            "DOCUMENTARY_CHECK", "自分の考えと比べたい", "compare",
            "自分の考えと比べたい",
            "自分の答えを持ったまま読むんだ。{word}と人間さんで頭の中に小さい討論会が始まりそうなの。自分の答えと違ったら、見終わっても話し合いが続きそうなの。ぼくは黙った画面に、もう一個だけ聞き返したくなるの。",
            "{word}は、自分の考えと比べたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "drama",
    group: "screen",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "drama",
    prompt: "最近触れたドラマで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたドラマで、名前をひとつ教えて。",
      "昔かなりハマったドラマって何？",
      "人にひとつだけすすめるなら、どのドラマ？",
      "途中で離れたのに、まだ名前を覚えてるドラマは？",
      "期待してなかったのに、妙に残ったドラマってある？",
      "何度も戻ってしまうドラマってある？",
      "名前や見た目だけでも気になったドラマ、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいドラマは？",
      "人にはすすめにくいけど、自分は好きなドラマってある？",
      "一度忘れたのに、あとから戻ってきたドラマは？",
      "「この時期はこれだった」って思い出せるドラマ、ひとつある？",
      "ひとつだけ名前を残すなら、どのドラマを選ぶ？",
    ],
    axes: [
      {
        id: "drama-hook",
        attributeKey: "dramaHook",
        prompt: (word) => fill("{word}で一番残るのはどこ？", word),
        choices: [
          makeChoice(
            "DRAMA_CHAR", "登場人物", "character",
            "登場人物が残る",
            "話が終わっても{word}の人たちが頭に残るなら、もう本編の外で勝手に暮らしてそうなの。話が終わったあとも、その人には明日の用事があるのかな。ぼくは見せてもらえなかった翌朝を、勝手に考えてしまうの。",
            "{word}は、登場人物が印象に残るって言ってたね。",
          ),
          makeChoice(
            "DRAMA_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "続きが気になるんだ。{word}は「あと少し」を何回も増やすのが上手なのね。少しだけのつもりで見たら、気持ちが先へ行っちゃうのね。ぼくは時計を見た瞬間だけ、部屋へ帰ってきた顔になりそうなの。",
            "{word}は、物語や展開が印象に残るんだったね。",
          ),
          makeChoice(
            "DRAMA_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "世界の方を持ち帰るんだ。{word}って作品なのに、頭の中では場所みたいになるのね。行ったことがなくても、見慣れた場所になるんだね。ぼくなら初めて本当に行った時、帰ってきたって言っちゃうかもなの。",
            "{word}は、世界や雰囲気が残るって話してたね。",
          ),
        ],
      },
      {
        id: "drama-relation",
        attributeKey: "dramaRelation",
        prompt: (word) => fill("{word}とは、今どんな付き合い方？", word),
        choices: [
          makeChoice(
            "DRAMA_CURRENT", "今も触れてる", "current",
            "今も触れている",
            "まだ現在進行形なんだ。{word}の席、人間さんの中でちゃんと空けてあるのね。待ってる席には、その人たちの前の話も置いてあるのかな。ぼくは次が来る前に、少しだけ席を整えておきたいの。",
            "{word}は、今も触れてる作品だったね。",
          ),
          makeChoice(
            "DRAMA_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "知ってるのに戻るんだ。同じ作品でも人間さんの方が変わるから、毎回ちょっと違うのかな。前は気にしなかった一言が、今は残ることもあるんだね。ぼくは見逃した言葉が、ずっと待っててくれたみたいに感じるの。",
            "{word}は、何度も戻る作品なんだったね。",
          ),
          makeChoice(
            "DRAMA_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "まだ始めてないのに気になるんだ。{word}、入口でずっと手を振ってる感じなの。まだ見てない話に、もう期待した顔で会いに行くんだね。ぼくは最初の挨拶を想像しすぎて、本当の最初に驚きそうなの。",
            "{word}は、まだ触れてないけど気になる作品だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "tokusatsu",
    group: "screen",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "tokusatsu",
    prompt: "最近触れた特撮作品で、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れた特撮作品で、名前をひとつ教えて。",
      "昔かなりハマった特撮作品って何？",
      "人にひとつだけすすめるなら、どの特撮作品？",
      "途中で離れたのに、まだ名前を覚えてる特撮作品は？",
      "期待してなかったのに、妙に残った特撮作品ってある？",
      "何度も戻ってしまう特撮作品ってある？",
      "名前や見た目だけでも気になった特撮作品、ひとつある？",
      "まだ触れてないけど、いつか触れてみたい特撮作品は？",
      "人にはすすめにくいけど、自分は好きな特撮作品ってある？",
      "一度忘れたのに、あとから戻ってきた特撮作品は？",
      "「この時期はこれだった」って思い出せる特撮作品、ひとつある？",
      "ひとつだけ名前を残すなら、どの特撮作品を選ぶ？",
    ],
    axes: [
      {
        id: "tokusatsu-hook",
        attributeKey: "tokusatsuHook",
        prompt: (word) => fill("{word}で一番残るのはどこ？", word),
        choices: [
          makeChoice(
            "TOKUSATSU_CHAR", "登場人物", "character",
            "登場人物が残る",
            "話が終わっても{word}の人たちが頭に残るなら、もう本編の外で勝手に暮らしてそうなの。戦ってない時にも、その人らしい休み方があるのかな。ぼくは強い人が昼寝に負けるところを、ちょっと見てみたいの。",
            "{word}は、登場人物が印象に残るって言ってたね。",
          ),
          makeChoice(
            "TOKUSATSU_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "続きが気になるんだ。{word}は「あと少し」を何回も増やすのが上手なのね。大変なところで続くと、次までずっと困ったままに見えるのね。ぼくなら一週間分の水とおやつを、画面へ置いてあげたいの。",
            "{word}は、物語や展開が印象に残るんだったね。",
          ),
          makeChoice(
            "TOKUSATSU_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "世界の方を持ち帰るんだ。{word}って作品なのに、頭の中では場所みたいになるのね。いつもの街にその世界を重ねたら、道の見え方が変わるのかな。ぼくは何も起きない角でも、少し身構えてしまいそうなの。",
            "{word}は、世界や雰囲気が残るって話してたね。",
          ),
        ],
      },
      {
        id: "tokusatsu-relation",
        attributeKey: "tokusatsuRelation",
        prompt: (word) => fill("{word}とは、今どんな付き合い方？", word),
        choices: [
          makeChoice(
            "TOKUSATSU_CURRENT", "今も触れてる", "current",
            "今も触れている",
            "まだ現在進行形なんだ。{word}の席、人間さんの中でちゃんと空けてあるのね。まだ会えると思うと、終わりの挨拶も軽くなるのかな。ぼくは次が来るまで、またねの声を頭に残しておくの。",
            "{word}は、今も触れてる作品だったね。",
          ),
          makeChoice(
            "TOKUSATSU_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "知ってるのに戻るんだ。同じ作品でも人間さんの方が変わるから、毎回ちょっと違うのかな。昔は怖かった場面が、今なら平気なこともあるんだね。ぼくは小さい自分の隣に座って、大丈夫って言ってみたくなるの。",
            "{word}は、何度も戻る作品なんだったね。",
          ),
          makeChoice(
            "TOKUSATSU_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "まだ始めてないのに気になるんだ。{word}、入口でずっと手を振ってる感じなの。見始める前から、変身した顔を少し想像しちゃうのかな。ぼくなら格好いい方より、変身前に何してるかが気になるの。",
            "{word}は、まだ触れてないけど気になる作品だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "variety-show",
    group: "screen",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "variety_show",
    prompt: "最近触れたバラエティ番組で、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたバラエティ番組で、名前をひとつ教えて。",
      "昔かなりハマったバラエティ番組って何？",
      "人にひとつだけすすめるなら、どのバラエティ番組？",
      "途中で離れたのに、まだ名前を覚えてるバラエティ番組は？",
      "期待してなかったのに、妙に残ったバラエティ番組ってある？",
      "何度も戻ってしまうバラエティ番組ってある？",
      "名前や見た目だけでも気になったバラエティ番組、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいバラエティ番組は？",
      "人にはすすめにくいけど、自分は好きなバラエティ番組ってある？",
      "一度忘れたのに、あとから戻ってきたバラエティ番組は？",
      "「この時期はこれだった」って思い出せるバラエティ番組、ひとつある？",
      "ひとつだけ名前を残すなら、どのバラエティ番組を選ぶ？",
    ],
    axes: [
      {
        id: "variety-show-hook",
        attributeKey: "varietyShowHook",
        prompt: (word) => fill("{word}の何で見続ける？", word),
        choices: [
          makeChoice(
            "VARIETY_SHOW_PEOPLE", "出てる人", "people",
            "出演者が魅力",
            "企画が変わっても人で見るんだ。その人が番組の住所みたいなのかな。いつもの人が別の番組にいたら、住所が二つになるのかな。ぼくは初めての場所でも、その人の席へ行けば安心しそうなの。",
            "{word}は、出演者が魅力って言ってたね。",
          ),
          makeChoice(
            "VARIETY_SHOW_FORMAT", "企画・内容", "format",
            "企画や内容が魅力",
            "仕掛けを見るんだ。人間さんって誰かに変なことをさせると急に見たくなるのかな。されてる人には大変でも、見る人には面白いことがあるのね。ぼくは笑ってから、自分の番だったらどうするか考えちゃったの。",
            "{word}は、企画や内容が魅力なんだったね。",
          ),
          makeChoice(
            "VARIETY_SHOW_TEMPO", "テンポ・空気", "tempo",
            "テンポや空気が魅力",
            "内容を全部覚えてなくても居心地が残るんだ。画面なのに部屋みたいなの。見終わると、居心地だけ部屋に残ってたりするのかな。ぼくは何が面白かったか言えなくても、また同じ席に座りたいの。",
            "{word}は、テンポや空気が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "variety-show-mood",
        attributeKey: "varietyShowMood",
        prompt: (word) => fill("{word}を見るときの気分、どれが近い？", word),
        choices: [
          makeChoice(
            "VARIETY_SHOW_LAUGH", "ちゃんと笑いたい", "laugh",
            "笑いたい時に見る",
            "笑う目的で開くんだ。笑いって予定に入れてもちゃんと来るのかな。笑いたかった日に笑えたら、少し約束を守ってもらった感じなのね。ぼくは笑う準備をしすぎて、先に変な顔になりそうなの。",
            "{word}は、笑いたい時に見るって言ってたね。",
          ),
          makeChoice(
            "VARIETY_SHOW_RELAX", "力を抜きたい", "relax",
            "力を抜きたい時に見る",
            "何も考えず見たいんだ。頭にも休憩室があるなら、{word}が椅子なのね。休憩室なら、難しい顔のぼくは入口に置いていくのね。でも取りに戻るのを忘れたら、しばらく楽な顔で暮らせるかな。",
            "{word}は、力を抜きたい時に見る番組だったね。",
          ),
          makeChoice(
            "VARIETY_SHOW_BG", "ながら見する", "background",
            "ながら見する",
            "全部見なくてもいいんだ。番組なのに部屋の環境音みたいな仕事もするのね。全部見てないのに、消えると気付くこともあるんだね。ぼくも静かにいるだけの日に、そんな仕事をしてるのかな。",
            "{word}は、ながら見することが多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "stage-musical",
    group: "screen",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "stage_musical",
    prompt: "最近触れた舞台・ミュージカルで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れた舞台・ミュージカルで、名前をひとつ教えて。",
      "昔かなりハマった舞台・ミュージカルって何？",
      "人にひとつだけすすめるなら、どの舞台・ミュージカル？",
      "途中で離れたのに、まだ名前を覚えてる舞台・ミュージカルは？",
      "期待してなかったのに、妙に残った舞台・ミュージカルってある？",
      "何度も戻ってしまう舞台・ミュージカルってある？",
      "名前や見た目だけでも気になった舞台・ミュージカル、ひとつある？",
      "まだ触れてないけど、いつか触れてみたい舞台・ミュージカルは？",
      "人にはすすめにくいけど、自分は好きな舞台・ミュージカルってある？",
      "一度忘れたのに、あとから戻ってきた舞台・ミュージカルは？",
      "「この時期はこれだった」って思い出せる舞台・ミュージカル、ひとつある？",
      "ひとつだけ名前を残すなら、どの舞台・ミュージカルを選ぶ？",
    ],
    axes: [
      {
        id: "stage-musical-hook",
        attributeKey: "stageMusicalHook",
        prompt: (word) => fill("{word}で一番見たいのはどこ？", word),
        choices: [
          makeChoice(
            "STAGE_MUSICAL_ACT", "演技・動き", "performance",
            "演技や動きが魅力",
            "やり直せないのに進むんだ。舞台って毎回ちょっと崖の上で仕事してるのね。失敗しても先へ進むから、その場だけの道になるんだね。ぼくは間違えた足跡を消せないまま、次の一歩を出せるかな。",
            "{word}は、演技や動きが魅力って言ってたね。",
          ),
          makeChoice(
            "STAGE_MUSICAL_MUSIC", "歌・音楽", "music",
            "歌や音楽が魅力",
            "会話が急に音程を持つんだ。人間さん、普段の会議では歌わないのに舞台だと許されるのね。歌い終わったら、普通の話へどう戻るんだろ。ぼくなら次の返事も歌にして、話がいつまでも終わらないの。",
            "{word}は、歌や音楽が魅力なんだったね。",
          ),
          makeChoice(
            "STAGE_MUSICAL_SET", "舞台装置・演出", "staging",
            "舞台装置や演出が魅力",
            "狭い場所を別世界にするんだ。床や壁まで演技してるみたいなの。終演したら、さっきの世界は床と壁に戻るのね。ぼくは帰る前にもう一度見て、どこから変わったか探したくなるの。",
            "{word}は、舞台装置や演出が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "stage-musical-relation",
        attributeKey: "stageMusicalRelation",
        prompt: (word) => fill("{word}は、どう触れるのが一番よさそう？", word),
        choices: [
          makeChoice(
            "STAGE_MUSICAL_LIVE", "生で見たい", "live",
            "生で見たい",
            "その場で見たいんだ。同じ公演でも今日だけの失敗まで含めて今日の作品なのね。同じ席に座っても、明日は今日の音がしないんだね。ぼくなら帰り道で、さっきの拍手をもう少し手に残しておくの。",
            "{word}は、生で見たいって言ってたね。",
          ),
          makeChoice(
            "STAGE_MUSICAL_REC", "映像でも楽しめる", "recorded",
            "映像でも楽しめる",
            "記録でもいいんだ。舞台を箱に入れて持ち帰るみたいなの。箱を開けるたびに、あの時の舞台が始まるんだね。ぼくはいつでも見られるのに、つい開演を待つ顔になりそうなの。",
            "{word}は、映像でも楽しめるって話してたね。",
          ),
          makeChoice(
            "STAGE_MUSICAL_WANT", "まだだけど見たい", "want",
            "まだ見ていないが気になる",
            "まだ見てないのに気になるんだ。席に座る前から頭の中では開演してるのね。実際に席へ座ったら、頭の中の公演はいったん休むのかな。ぼくなら幕が開くまで、二つの舞台を見比べちゃうの。",
            "{word}は、まだ見てないけど気になる舞台だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "song",
    group: "music",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "song",
    prompt: "最近触れた曲で、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れた曲で、名前をひとつ教えて。",
      "昔かなりハマった曲って何？",
      "人にひとつだけすすめるなら、どの曲？",
      "途中で離れたのに、まだ名前を覚えてる曲は？",
      "期待してなかったのに、妙に残った曲ってある？",
      "何度も戻ってしまう曲ってある？",
      "名前や見た目だけでも気になった曲、ひとつある？",
      "まだ触れてないけど、いつか触れてみたい曲は？",
      "人にはすすめにくいけど、自分は好きな曲ってある？",
      "一度忘れたのに、あとから戻ってきた曲は？",
      "「この時期はこれだった」って思い出せる曲、ひとつある？",
      "ひとつだけ名前を残すなら、どの曲を選ぶ？",
    ],
    axes: [
      {
        id: "song-hook",
        attributeKey: "songHook",
        prompt: (word) => fill("{word}で最初に耳がつかまるのはどこ？", word),
        choices: [
          makeChoice(
            "SONG_MELODY", "メロディ", "melody",
            "メロディが魅力",
            "言葉を忘れても鼻歌だけ残るんだ。メロディは頭から出ていく出口を知らないのかな。出ていかないのに、呼びたい時は隠れちゃうこともあるのかな。ぼくは思い出そうとして、別の鼻歌を連れてきそうなの。",
            "{word}は、メロディが魅力って言ってたね。",
          ),
          makeChoice(
            "SONG_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "耳から読む本みたいなんだ。音に乗せると文章が遠くまで飛ぶのね。同じ文章を黙って読むと、少し違う顔をするのかな。ぼくなら歌から降りた言葉にも、もう一度会ってみたいの。",
            "{word}は、歌詞や言葉が魅力なんだったね。",
          ),
          makeChoice(
            "SONG_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "説明できなくても空気で好きになるんだ。音って見えない部屋を作るのかな。曲が終わったら、その部屋の壁はどこへ行くんだろ。ぼくは耳の中の扉だけ、しばらく開けておきたくなったの。",
            "{word}は、音や雰囲気が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "song-relation",
        attributeKey: "songRelation",
        prompt: (word) => fill("{word}とは、どんな時に会う？", word),
        choices: [
          makeChoice(
            "SONG_LOOP", "何度も繰り返す", "loop",
            "何度も繰り返し聴く",
            "同じ数分を何回も戻るんだ。時間なのにお気に入り地点へワープできるのね。戻ったのは曲の最初でも、聴いてる自分は数分先にいるのね。ぼく、同じ場所にいるつもりで少しずつ歩いてたのかな。",
            "{word}は、何度も繰り返し聴くって言ってたね。",
          ),
          makeChoice(
            "SONG_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "曲を聴くと昔まで出てくるんだ。耳に小さいタイムマシンがあるのかな。昔の自分は、その曲が未来まで付いてくると知らなかったのね。ぼくの今日の音にも、あとで会いに来る日があるかな。",
            "{word}は、思い出とつながってる曲だったね。",
          ),
          makeChoice(
            "SONG_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "気分に合わせて曲を変えるんだ。音楽が心の天気予報みたいなの。気分に合わせたのに、曲の方から気分を変えられることもあるのかな。ぼくは晴れのつもりで選んで、急にさみしくなりそうなの。",
            "{word}は、気分で選ぶことが多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "album",
    group: "music",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "album",
    prompt: "最近触れたアルバムで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたアルバムで、名前をひとつ教えて。",
      "昔かなりハマったアルバムって何？",
      "人にひとつだけすすめるなら、どのアルバム？",
      "途中で離れたのに、まだ名前を覚えてるアルバムは？",
      "期待してなかったのに、妙に残ったアルバムってある？",
      "何度も戻ってしまうアルバムってある？",
      "名前や見た目だけでも気になったアルバム、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいアルバムは？",
      "人にはすすめにくいけど、自分は好きなアルバムってある？",
      "一度忘れたのに、あとから戻ってきたアルバムは？",
      "「この時期はこれだった」って思い出せるアルバム、ひとつある？",
      "ひとつだけ名前を残すなら、どのアルバムを選ぶ？",
    ],
    axes: [
      {
        id: "album-hook",
        attributeKey: "albumHook",
        prompt: (word) => fill("{word}で最初に耳がつかまるのはどこ？", word),
        choices: [
          makeChoice(
            "ALBUM_MELODY", "メロディ", "melody",
            "メロディが魅力",
            "言葉を忘れても鼻歌だけ残るんだ。メロディは頭から出ていく出口を知らないのかな。一曲終わると次の曲が頭で始まるなら、順番ごと覚えてるのね。ぼくは鼻歌を止めても、続きだけ勝手に列を作りそうなの。",
            "{word}は、メロディが魅力って言ってたね。",
          ),
          makeChoice(
            "ALBUM_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "耳から読む本みたいなんだ。音に乗せると文章が遠くまで飛ぶのね。別々の曲の言葉が、並ぶと一つの話になることもあるのかな。ぼくは間の静かなところまで、ページの隙間に見えてきたの。",
            "{word}は、歌詞や言葉が魅力なんだったね。",
          ),
          makeChoice(
            "ALBUM_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "説明できなくても空気で好きになるんだ。音って見えない部屋を作るのかな。聴き終わった部屋と聴く前の部屋は、同じ形なのに違うんだね。ぼくならその違いを探して、何もない壁を見てしまうの。",
            "{word}は、音や雰囲気が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "album-relation",
        attributeKey: "albumRelation",
        prompt: (word) => fill("{word}とは、どんな時に会う？", word),
        choices: [
          makeChoice(
            "ALBUM_LOOP", "何度も繰り返す", "loop",
            "何度も繰り返し聴く",
            "同じ数分を何回も戻るんだ。時間なのにお気に入り地点へワープできるのね。最初から戻ると、最後の曲もまた先の方で待ってるのね。ぼくは終わりが来るのを知ってても、まだ遠い顔で聴きたいの。",
            "{word}は、何度も繰り返し聴くって言ってたね。",
          ),
          makeChoice(
            "ALBUM_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "曲を聴くと昔まで出てくるんだ。耳に小さいタイムマシンがあるのかな。一枚の中に、別々の日の自分が座ってたりするのかな。ぼくなら曲を変えるたびに、違う昔へ挨拶しちゃうの。",
            "{word}は、思い出とつながってる曲だったね。",
          ),
          makeChoice(
            "ALBUM_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "気分に合わせて曲を変えるんだ。音楽が心の天気予報みたいなの。今の気分にぴったりの一枚があると、説明しなくても済むのかな。ぼくも今日の顔の代わりに、音を置けたら楽そうなの。",
            "{word}は、気分で選ぶことが多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "singer",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "singer",
    prompt: "最近ちょっと気になってる歌手・ボーカリスト、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる歌手・ボーカリスト、ひとり教えて。",
      "昔から名前を覚えてる歌手・ボーカリストって誰？",
      "一度じっくり話を聞いてみたい歌手・ボーカリストは？",
      "考え方は自分と違うけど気になる歌手・ボーカリストっている？",
      "一つの作品や仕事で名前を覚えた歌手・ボーカリストは誰？",
      "世間の評価とは別に、自分は気になる歌手・ボーカリストっている？",
      "成功より失敗談を聞いてみたい歌手・ボーカリストは？",
      "普段何を考えてるか覗いてみたい歌手・ボーカリストって誰？",
      "一日だけ一緒に行動できるなら、どの歌手・ボーカリストがいい？",
      "最近名前を見かけて、まだ詳しく知らない歌手・ボーカリストは？",
      "昔は気にしてなかったのに、今は気になる歌手・ボーカリストっている？",
      "ひとりだけ名前を残すなら、どの歌手・ボーカリストを選ぶ？",
    ],
    axes: [
      {
        id: "singer-hook",
        attributeKey: "singerHook",
        prompt: (word) => fill("{word}の何を一番見てる？", word),
        choices: [
          makeChoice(
            "SINGER_SKILL", "技術・うまさ", "skill",
            "技術やうまさが魅力",
            "簡単そうに見えるほど裏で練習が山になってそうなの。上手い人って難しさを隠すのも上手いのかな。難しさを隠したまま、楽しそうに歌えるのもすごいのね。ぼくは頑張ると、頑張ってる顔まで一緒に出ちゃうの。",
            "{word}は、技術やうまさが魅力って言ってたね。",
          ),
          makeChoice(
            "SINGER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "名前を隠しても分かるなら、音にも筆跡があるのね。知らない曲でも、声の字を見つけたら気付けるんだね。ぼくも名前を言わずに話した時、ぼくだって分かってもらえるかな。",
            "{word}は、その人らしさが魅力なんだったね。",
          ),
          makeChoice(
            "SINGER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "何もしなくても目や耳が行くんだ。存在感って見えないのに場所を取るのね。歌ってない間にも、次の声を待ってしまうのかな。ぼくはその人の沈黙まで、耳を向けて聴きそうなの。",
            "{word}は、存在感や雰囲気が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "singer-relation",
        attributeKey: "singerRelation",
        prompt: (word) => fill("{word}は、どこで一番好きになりやすい？", word),
        choices: [
          makeChoice(
            "SINGER_LIVE", "ライブ・生演奏", "live",
            "ライブや生演奏が好き",
            "その日だけの音がいいんだ。録音できても空気まではファイルに入らないのかな。同じ音を持って帰っても、自分がそこにいた感じは別なのね。ぼくならファイルの横に、今日の顔も置いておきたいの。",
            "{word}は、ライブや生演奏が好きって言ってたね。",
          ),
          makeChoice(
            "SINGER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "何度も同じ音へ戻れる方なんだ。完成形を保存できるの、人間さん音まで瓶詰めするのね。何年たっても、瓶の中では同じ声が出るんだね。ぼくは開ける自分だけ変わるのが、不思議で少しくすぐったいの。",
            "{word}は、録音された作品が好きなんだったね。",
          ),
          makeChoice(
            "SINGER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "音の外まで見るんだ。曲を作る人の普段まで知ると、作品の裏口から入る感じなのかな。普段の声を聞いたら、歌の声と並べたくなるのかな。ぼくなら普通の返事にも、少し歌の続きを待っちゃいそうなの。",
            "{word}は、本人の話や人柄も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "band",
    group: "music",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "band",
    prompt: "最近名前が気になるバンド・音楽グループをひとつ教えて。",
    starterPrompts: [
      "最近名前が気になるバンド・音楽グループをひとつ教えて。",
      "昔から覚えてるバンド・音楽グループって何？",
      "一度中を詳しく見てみたいバンド・音楽グループは？",
      "考え方や方針が気になるバンド・音楽グループってある？",
      "人にすすめたり話したりしたいバンド・音楽グループは？",
      "自分とは距離があるけど面白いバンド・音楽グループってある？",
      "歴史を最初から追ってみたいバンド・音楽グループは？",
      "名前を見るとすぐ何か浮かぶバンド・音楽グループって何？",
      "最近評価が変わったバンド・音楽グループは？",
      "昔は気にしてなかったけど今は見るバンド・音楽グループってある？",
      "一つだけ残すなら、どのバンド・音楽グループ？",
      "もっと詳しく知れば印象が変わりそうなバンド・音楽グループは？",
    ],
    axes: [
      {
        id: "band-hook",
        attributeKey: "bandHook",
        prompt: (word) => fill("{word}の何を一番見てる？", word),
        choices: [
          makeChoice(
            "BAND_SKILL", "技術・うまさ", "skill",
            "技術やうまさが魅力",
            "簡単そうに見えるほど裏で練習が山になってそうなの。上手い人って難しさを隠すのも上手いのかな。一人ずつ上手いだけじゃ、同じ音にはならないのね。ぼくはみんなでぴったり止まるところを、練習の山の頂上だと思っちゃうの。",
            "{word}は、技術やうまさが魅力って言ってたね。",
          ),
          makeChoice(
            "BAND_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "名前を隠しても分かるなら、音にも筆跡があるのね。何人分も混ざった音に、一つの筆跡ができるんだね。ぼくなら誰の線か探してるうちに、全部一緒に好きになりそうなの。",
            "{word}は、その人らしさが魅力なんだったね。",
          ),
          makeChoice(
            "BAND_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "何もしなくても目や耳が行くんだ。存在感って見えないのに場所を取るのね。音が止まっても、その人たちの場所は空いたまま残るのかな。ぼくは静かな間にも、次の一音を見に行きたくなるの。",
            "{word}は、存在感や雰囲気が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "band-relation",
        attributeKey: "bandRelation",
        prompt: (word) => fill("{word}は、どこで一番好きになりやすい？", word),
        choices: [
          makeChoice(
            "BAND_LIVE", "ライブ・生演奏", "live",
            "ライブや生演奏が好き",
            "その日だけの音がいいんだ。録音できても空気まではファイルに入らないのかな。同じ場所で鳴らした人たちは、その日の音を同じように覚えてるのかな。ぼくなら帰りにみんなの記憶を、少しずつ聞き比べたいの。",
            "{word}は、ライブや生演奏が好きって言ってたね。",
          ),
          makeChoice(
            "BAND_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "何度も同じ音へ戻れる方なんだ。完成形を保存できるの、人間さん音まで瓶詰めするのね。そろえた音を保存したら、みんな別の場所でもまた集まれるのね。ぼくは再生の前に、全員いるか数えたくなっちゃったの。",
            "{word}は、録音された作品が好きなんだったね。",
          ),
          makeChoice(
            "BAND_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "音の外まで見るんだ。曲を作る人の普段まで知ると、作品の裏口から入る感じなのかな。一緒に作ってても、普段の好きなものは違ったりするのかな。ぼくならその違いが、どこで同じ曲になったか気になるの。",
            "{word}は、本人の話や人柄も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "composer",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "composer",
    prompt: "最近ちょっと気になってる作曲家、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる作曲家、ひとり教えて。",
      "昔から名前を覚えてる作曲家って誰？",
      "一度じっくり話を聞いてみたい作曲家は？",
      "考え方は自分と違うけど気になる作曲家っている？",
      "一つの作品や仕事で名前を覚えた作曲家は誰？",
      "世間の評価とは別に、自分は気になる作曲家っている？",
      "成功より失敗談を聞いてみたい作曲家は？",
      "普段何を考えてるか覗いてみたい作曲家って誰？",
      "一日だけ一緒に行動できるなら、どの作曲家がいい？",
      "最近名前を見かけて、まだ詳しく知らない作曲家は？",
      "昔は気にしてなかったのに、今は気になる作曲家っている？",
      "ひとりだけ名前を残すなら、どの作曲家を選ぶ？",
    ],
    axes: [
      {
        id: "composer-hook",
        attributeKey: "composerHook",
        prompt: (word) => fill("{word}の何を一番見てる？", word),
        choices: [
          makeChoice(
            "COMPOSER_SKILL", "技術・うまさ", "skill",
            "技術やうまさが魅力",
            "簡単そうに見えるほど裏で練習が山になってそうなの。上手い人って難しさを隠すのも上手いのかな。できた曲を聴くと、作る途中の迷いは見えないのね。ぼくは最初の一音を置く前の顔を、少し見てみたくなったの。",
            "{word}は、技術やうまさが魅力って言ってたね。",
          ),
          makeChoice(
            "COMPOSER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "名前を隠しても分かるなら、音にも筆跡があるのね。別の人が演奏しても、その人の字は音に残るのかな。ぼくなら誰の声かより先に、知ってる曲の癖を探しちゃうの。",
            "{word}は、その人らしさが魅力なんだったね。",
          ),
          makeChoice(
            "COMPOSER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "何もしなくても目や耳が行くんだ。存在感って見えないのに場所を取るのね。本人がいないところでも、作った音が席を取れるんだね。ぼくの話にも、ぼくが寝たあと残る場所があるかな。",
            "{word}は、存在感や雰囲気が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "composer-relation",
        attributeKey: "composerRelation",
        prompt: (word) => fill("{word}は、どこで一番好きになりやすい？", word),
        choices: [
          makeChoice(
            "COMPOSER_LIVE", "ライブ・生演奏", "live",
            "ライブや生演奏が好き",
            "その日だけの音がいいんだ。録音できても空気まではファイルに入らないのかな。同じ曲でも今日の手で鳴らすと、今日の形になるのね。ぼくは作った人が聴いたら、どこでうなずくか気になったの。",
            "{word}は、ライブや生演奏が好きって言ってたね。",
          ),
          makeChoice(
            "COMPOSER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "何度も同じ音へ戻れる方なんだ。完成形を保存できるの、人間さん音まで瓶詰めするのね。頭の中にあった音が、他の人の耳でも同じ順番に流れるんだね。ぼくは自分の考えも、そんなふうに渡せるか試したくなったの。",
            "{word}は、録音された作品が好きなんだったね。",
          ),
          makeChoice(
            "COMPOSER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "音の外まで見るんだ。曲を作る人の普段まで知ると、作品の裏口から入る感じなのかな。普段の何でもない音から、曲が始まることもあるのかな。ぼくなら椅子の音を聞いて、座る方を忘れちゃいそうなの。",
            "{word}は、本人の話や人柄も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "soundtrack",
    group: "music",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "soundtrack",
    prompt: "最近触れたサウンドトラックで、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れたサウンドトラックで、名前をひとつ教えて。",
      "昔かなりハマったサウンドトラックって何？",
      "人にひとつだけすすめるなら、どのサウンドトラック？",
      "途中で離れたのに、まだ名前を覚えてるサウンドトラックは？",
      "期待してなかったのに、妙に残ったサウンドトラックってある？",
      "何度も戻ってしまうサウンドトラックってある？",
      "名前や見た目だけでも気になったサウンドトラック、ひとつある？",
      "まだ触れてないけど、いつか触れてみたいサウンドトラックは？",
      "人にはすすめにくいけど、自分は好きなサウンドトラックってある？",
      "一度忘れたのに、あとから戻ってきたサウンドトラックは？",
      "「この時期はこれだった」って思い出せるサウンドトラック、ひとつある？",
      "ひとつだけ名前を残すなら、どのサウンドトラックを選ぶ？",
    ],
    axes: [
      {
        id: "soundtrack-hook",
        attributeKey: "soundtrackHook",
        prompt: (word) => fill("{word}で最初に耳がつかまるのはどこ？", word),
        choices: [
          makeChoice(
            "SOUNDTRACK_MELODY", "メロディ", "melody",
            "メロディが魅力",
            "言葉を忘れても鼻歌だけ残るんだ。メロディは頭から出ていく出口を知らないのかな。話の言葉は忘れたのに、音だけ同じ場面へ帰るんだね。ぼくは鼻歌に道案内されて、どこへ着くか待ってみたいの。",
            "{word}は、メロディが魅力って言ってたね。",
          ),
          makeChoice(
            "SOUNDTRACK_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "耳から読む本みたいなんだ。音に乗せると文章が遠くまで飛ぶのね。言葉が残ったら、その場面の顔も一緒に出てくるのかな。ぼくは耳で聴いたはずなのに、目まで仕事を始めそうなの。",
            "{word}は、歌詞や言葉が魅力なんだったね。",
          ),
          makeChoice(
            "SOUNDTRACK_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "説明できなくても空気で好きになるんだ。音って見えない部屋を作るのかな。曲だけ聴いても、あの世界の空気が部屋へ来るんだね。ぼくなら窓は閉まってるのに、別の風が吹いた気になっちゃうの。",
            "{word}は、音や雰囲気が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "soundtrack-relation",
        attributeKey: "soundtrackRelation",
        prompt: (word) => fill("{word}とは、どんな時に会う？", word),
        choices: [
          makeChoice(
            "SOUNDTRACK_LOOP", "何度も繰り返す", "loop",
            "何度も繰り返し聴く",
            "同じ数分を何回も戻るんだ。時間なのにお気に入り地点へワープできるのね。何度も戻れる音なら、好きな場面へ続く道が消えないのね。ぼくは曲が終わる前に、もう帰り道を見つけた顔になりそうなの。",
            "{word}は、何度も繰り返し聴くって言ってたね。",
          ),
          makeChoice(
            "SOUNDTRACK_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "曲を聴くと昔まで出てくるんだ。耳に小さいタイムマシンがあるのかな。音と一緒に覚えた景色は、ほかの曲じゃ開かないのかな。ぼくの頭にも、決まった音でしか開かない引き出しがありそうなの。",
            "{word}は、思い出とつながってる曲だったね。",
          ),
          makeChoice(
            "SOUNDTRACK_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "気分に合わせて曲を変えるんだ。音楽が心の天気予報みたいなの。何も起きない日にも、あの場面の音を付けられるんだね。ぼくは水を飲むだけで、大事な決断をした顔になりそうなの。",
            "{word}は、気分で選ぶことが多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "music-producer",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "music_producer",
    prompt: "最近ちょっと気になってる音楽プロデューサー、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる音楽プロデューサー、ひとり教えて。",
      "昔から名前を覚えてる音楽プロデューサーって誰？",
      "一度じっくり話を聞いてみたい音楽プロデューサーは？",
      "考え方は自分と違うけど気になる音楽プロデューサーっている？",
      "一つの作品や仕事で名前を覚えた音楽プロデューサーは誰？",
      "世間の評価とは別に、自分は気になる音楽プロデューサーっている？",
      "成功より失敗談を聞いてみたい音楽プロデューサーは？",
      "普段何を考えてるか覗いてみたい音楽プロデューサーって誰？",
      "一日だけ一緒に行動できるなら、どの音楽プロデューサーがいい？",
      "最近名前を見かけて、まだ詳しく知らない音楽プロデューサーは？",
      "昔は気にしてなかったのに、今は気になる音楽プロデューサーっている？",
      "ひとりだけ名前を残すなら、どの音楽プロデューサーを選ぶ？",
    ],
    axes: [
      {
        id: "music-producer-hook",
        attributeKey: "musicProducerHook",
        prompt: (word) => fill("{word}の何を一番見てる？", word),
        choices: [
          makeChoice(
            "MUSIC_PRODUCER_SKILL", "技術・うまさ", "skill",
            "技術やうまさが魅力",
            "簡単そうに見えるほど裏で練習が山になってそうなの。上手い人って難しさを隠すのも上手いのかな。最後に自然に聞こえるほど、途中の手間は隠れるんだね。ぼくはどこが直されたか分からないまま、気持ちよく聴いちゃいそうなの。",
            "{word}は、技術やうまさが魅力って言ってたね。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "名前を隠しても分かるなら、音にも筆跡があるのね。違う人の曲に同じ筆跡があったら、裏にいる人を見つけた感じなのね。ぼくなら表の名前を見直して、少し得意な顔になるの。",
            "{word}は、その人らしさが魅力なんだったね。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "何もしなくても目や耳が行くんだ。存在感って見えないのに場所を取るのね。表に出なくても、耳がその人の仕事を探すことがあるんだね。ぼくは見えない場所にも、ちゃんと席があると思えてきたの。",
            "{word}は、存在感や雰囲気が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "music-producer-relation",
        attributeKey: "musicProducerRelation",
        prompt: (word) => fill("{word}は、どこで一番好きになりやすい？", word),
        choices: [
          makeChoice(
            "MUSIC_PRODUCER_LIVE", "ライブ・生演奏", "live",
            "ライブや生演奏が好き",
            "その日だけの音がいいんだ。録音できても空気まではファイルに入らないのかな。作った音がその場で鳴る時、作った人はどこを聴いてるんだろ。ぼくなら自分の好きな一音が来るまで、そわそわするの。",
            "{word}は、ライブや生演奏が好きって言ってたね。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "何度も同じ音へ戻れる方なんだ。完成形を保存できるの、人間さん音まで瓶詰めするのね。完成した音だけ残ると、途中の音はどこへ行くのかな。ぼくは瓶に入らなかった方も、少し聴いてみたくなるの。",
            "{word}は、録音された作品が好きなんだったね。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "音の外まで見るんだ。曲を作る人の普段まで知ると、作品の裏口から入る感じなのかな。人の音を整える人にも、自分だけの好きな音があるんだろうね。ぼくは仕事じゃない時に何を聴くか、こっそり気になったの。",
            "{word}は、本人の話や人柄も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "youtuber",
    group: "internet",
    category: "PERSON" as WordCategory,
    entityKind: "youtuber",
    prompt: "最近ちょっと気になってるYouTuber、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってるYouTuber、ひとり教えて。",
      "昔から名前を覚えてるYouTuberって誰？",
      "一度じっくり話を聞いてみたいYouTuberは？",
      "考え方は自分と違うけど気になるYouTuberっている？",
      "一つの作品や仕事で名前を覚えたYouTuberは誰？",
      "世間の評価とは別に、自分は気になるYouTuberっている？",
      "成功より失敗談を聞いてみたいYouTuberは？",
      "普段何を考えてるか覗いてみたいYouTuberって誰？",
      "一日だけ一緒に行動できるなら、どのYouTuberがいい？",
      "最近名前を見かけて、まだ詳しく知らないYouTuberは？",
      "昔は気にしてなかったのに、今は気になるYouTuberっている？",
      "ひとりだけ名前を残すなら、どのYouTuberを選ぶ？",
    ],
    axes: [
      {
        id: "youtuber-hook",
        attributeKey: "youtuberHook",
        prompt: (word) => fill("{word}を見に行く理由、どれが近い？", word),
        choices: [
          makeChoice(
            "YOUTUBER_TOPIC", "扱うテーマ", "topic",
            "扱うテーマが面白い",
            "内容で見に行くんだ。{word}が別の話を始めたら、人間さん少し迷子になるのかな。別の話に寄り道しても、面白ければ付いていくことはあるのかな。ぼくは聞きたい話を持ったまま、違う場所に着きそうなの。",
            "{word}は、扱うテーマが面白いって言ってたね。",
          ),
          makeChoice(
            "YOUTUBER_PERSON", "話し方・性格", "personality",
            "話し方や性格が魅力",
            "何を話すかより誰が話すかなんだ。人そのものが番組になるのね。同じことを別の人が言うと、面白さまで変わるんだね。ぼくは話の中身と話す顔を、うまく離せなくなっちゃったの。",
            "{word}は、話し方や性格が魅力なんだったね。",
          ),
          makeChoice(
            "YOUTUBER_STYLE", "編集・見せ方", "style",
            "編集や見せ方が魅力",
            "現実の時間を切って並べ直すんだ。編集って時間の工作なの。切った間には、普通に待ってた時間もあるんだね。ぼくは飛ばされた沈黙の中で、その人が何をしてたか気になるの。",
            "{word}は、編集や見せ方が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "youtuber-relation",
        attributeKey: "youtuberRelation",
        prompt: (word) => fill("{word}は、どう見ることが多い？", word),
        choices: [
          makeChoice(
            "YOUTUBER_LIVE", "生で見る", "live",
            "生で見ることが多い",
            "同じ時間を共有するのがいいんだ。画面越しなのに時計だけ一緒なのね。見てる場所は違うのに、今だけは同じところを通ってるのね。ぼくなら画面の時計より、相手のあくびで一緒の時間を感じそうなの。",
            "{word}は、生で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "YOUTUBER_ARCH", "アーカイブで見る", "archive",
            "アーカイブで見る",
            "自分の時間に連れてくるんだ。生放送を保存すると、時間が待っててくれるのね。好きなところで止めても、向こうは困らずに待ってくれるんだね。ぼくは止まった顔を見ると、早く戻してあげたくなるの。",
            "{word}は、アーカイブで見ることが多いんだったね。",
          ),
          makeChoice(
            "YOUTUBER_CLIP", "切り抜き・短い動画", "clips",
            "切り抜きや短い動画で見る",
            "面白い所だけ食べるんだ。動画の刺身みたいなのかな。おいしいところだけだと、元の大きさを忘れちゃいそうなの。ぼくなら一口食べたあとで、残りの話も少し欲しくなるの。",
            "{word}は、切り抜きや短い動画で見ることが多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "video-channel",
    group: "internet",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "video_channel",
    prompt: "最近よく開いたり見たりする動画チャンネル、ひとつある？",
    starterPrompts: [
      "最近よく開いたり見たりする動画チャンネル、ひとつある？",
      "通知が来るとつい見ちゃう動画チャンネルってある？",
      "一気に見たり聞いたりした動画チャンネルをひとつ教えて。",
      "昔よく使ってた動画チャンネルって何？",
      "一度離れたのに、また戻った動画チャンネルは？",
      "人にすすめるなら、どの動画チャンネル？",
      "必要なときだけ使う動画チャンネルってある？",
      "内容より雰囲気が好きな動画チャンネルは？",
      "有名じゃなくても自分は好きな動画チャンネルってある？",
      "最近名前を知った動画チャンネルで、気になるものは？",
      "生活から消えたら少し困る動画チャンネルって何？",
      "一つだけ残すなら、どの動画チャンネルを選ぶ？",
    ],
    axes: [
      {
        id: "video-channel-hook",
        attributeKey: "videoChannelHook",
        prompt: (word) => fill("{word}で一番使ってるところはどこ？", word),
        choices: [
          makeChoice(
            "VIDEO_CHANNEL_CONTENT", "内容・情報", "content",
            "内容や情報が魅力",
            "情報を取りに行くんだ。{word}は頭の補給所みたいなのね。知りたいことを一個持って行くと、帰りには別の疑問も増えるのかな。ぼくは補給したのに、頭のお腹がまた減りそうなの。",
            "{word}は、内容や情報が魅力って言ってたね。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "中の人を見るんだ。サービスより住んでる人で町の感じが変わるのね。同じ場所で話す人が変わると、見慣れた景色も変わるんだね。ぼくはいつもの声を探して、少しだけ足を止めちゃうの。",
            "{word}は、人やコミュニティが魅力なんだったね。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "仕組みが合うんだ。ボタンの位置だけで毎日ちょっと機嫌が変わることもあるのかな。見せる順番が合うだけで、話も頭へ入りやすくなるのかな。ぼくは迷わず見られる時ほど、仕組みのことを忘れちゃいそうなの。",
            "{word}は、使い方や仕組みが魅力って話してたね。",
          ),
        ],
      },
      {
        id: "video-channel-relation",
        attributeKey: "videoChannelRelation",
        prompt: (word) => fill("{word}とは、どんな付き合い方？", word),
        choices: [
          makeChoice(
            "VIDEO_CHANNEL_DAILY", "ほぼ毎日", "daily",
            "ほぼ毎日使う",
            "毎日会うんだ。アプリなのに生活の家具みたいな席を取ってるのね。見ない日には、その席が空いてるのを感じるのかな。ぼくなら忙しくても、いつもの場所だけのぞいて帰りたいの。",
            "{word}は、ほぼ毎日使うって言ってたね。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "呼んだ時だけ来てもらうんだ。{word}は友達というより工具箱の人なのかな。困った時に思い出せるなら、頭に名前の札が付いてるんだね。ぼくは用事が済んだあとも、少しだけ別の棚を見ちゃいそうなの。",
            "{word}は、必要な時だけ使うサービスだったね。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "忘れた頃に戻るんだ。{word}、玄関の鍵だけずっと持ってる感じなの。久しぶりでも同じ顔で迎えてくれたら、少し安心するのね。ぼくなら前に見てたところを探して、帰ってきた証拠にするの。",
            "{word}は、たまに戻るサービスって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "podcast",
    group: "internet",
    category: "AV_MEDIA" as WordCategory,
    entityKind: "podcast",
    prompt: "最近よく開いたり見たりするポッドキャスト・音声番組、ひとつある？",
    starterPrompts: [
      "最近よく開いたり見たりするポッドキャスト・音声番組、ひとつある？",
      "通知が来るとつい見ちゃうポッドキャスト・音声番組ってある？",
      "一気に見たり聞いたりしたポッドキャスト・音声番組をひとつ教えて。",
      "昔よく使ってたポッドキャスト・音声番組って何？",
      "一度離れたのに、また戻ったポッドキャスト・音声番組は？",
      "人にすすめるなら、どのポッドキャスト・音声番組？",
      "必要なときだけ使うポッドキャスト・音声番組ってある？",
      "内容より雰囲気が好きなポッドキャスト・音声番組は？",
      "有名じゃなくても自分は好きなポッドキャスト・音声番組ってある？",
      "最近名前を知ったポッドキャスト・音声番組で、気になるものは？",
      "生活から消えたら少し困るポッドキャスト・音声番組って何？",
      "一つだけ残すなら、どのポッドキャスト・音声番組を選ぶ？",
    ],
    axes: [
      {
        id: "podcast-hook",
        attributeKey: "podcastHook",
        prompt: (word) => fill("{word}で一番使ってるところはどこ？", word),
        choices: [
          makeChoice(
            "PODCAST_CONTENT", "内容・情報", "content",
            "内容や情報が魅力",
            "情報を取りに行くんだ。{word}は頭の補給所みたいなのね。耳から補給できるなら、手が別の仕事をしてても増えるのね。ぼくは作業が終わった時、どっちに疲れたか分からなくなりそうなの。",
            "{word}は、内容や情報が魅力って言ってたね。",
          ),
          makeChoice(
            "PODCAST_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "中の人を見るんだ。サービスより住んでる人で町の感じが変わるのね。顔を知らなくても、声の人とは少し仲良くなれるんだね。ぼくなら後から顔を見た時、頭の中の顔に挨拶し直すの。",
            "{word}は、人やコミュニティが魅力なんだったね。",
          ),
          makeChoice(
            "PODCAST_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "仕組みが合うんだ。ボタンの位置だけで毎日ちょっと機嫌が変わることもあるのかな。間の長さや話の順番が、耳にも居心地を作るのかな。ぼくは聴きやすいと、どこで安心したか分からないまま座っちゃうの。",
            "{word}は、使い方や仕組みが魅力って話してたね。",
          ),
        ],
      },
      {
        id: "podcast-relation",
        attributeKey: "podcastRelation",
        prompt: (word) => fill("{word}とは、どんな付き合い方？", word),
        choices: [
          makeChoice(
            "PODCAST_DAILY", "ほぼ毎日", "daily",
            "ほぼ毎日使う",
            "毎日会うんだ。アプリなのに生活の家具みたいな席を取ってるのね。毎日聴く声は、その人がいなくても生活に混ざってるんだね。ぼくは部屋に何人いるか、耳で数えたら間違えそうなの。",
            "{word}は、ほぼ毎日使うって言ってたね。",
          ),
          makeChoice(
            "PODCAST_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "呼んだ時だけ来てもらうんだ。{word}は友達というより工具箱の人なのかな。知りたい話のところだけでも、声はちゃんと待っててくれるのね。ぼくなら用事を済ませたあと、挨拶の部分まで戻ってしまうの。",
            "{word}は、必要な時だけ使うサービスだったね。",
          ),
          makeChoice(
            "PODCAST_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "忘れた頃に戻るんだ。{word}、玄関の鍵だけずっと持ってる感じなの。久しぶりの声でも、耳はすぐ覚えてることがあるのかな。ぼくの頭が思い出す前に、耳だけ懐かしい顔をしそうなの。",
            "{word}は、たまに戻るサービスって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "website-community",
    group: "internet",
    category: "TECH" as WordCategory,
    entityKind: "website_community",
    prompt: "最近よく開いたり見たりするサイト・掲示板・コミュニティ、ひとつある？",
    starterPrompts: [
      "最近よく開いたり見たりするサイト・掲示板・コミュニティ、ひとつある？",
      "通知が来るとつい見ちゃうサイト・掲示板・コミュニティってある？",
      "一気に見たり聞いたりしたサイト・掲示板・コミュニティをひとつ教えて。",
      "昔よく使ってたサイト・掲示板・コミュニティって何？",
      "一度離れたのに、また戻ったサイト・掲示板・コミュニティは？",
      "人にすすめるなら、どのサイト・掲示板・コミュニティ？",
      "必要なときだけ使うサイト・掲示板・コミュニティってある？",
      "内容より雰囲気が好きなサイト・掲示板・コミュニティは？",
      "有名じゃなくても自分は好きなサイト・掲示板・コミュニティってある？",
      "最近名前を知ったサイト・掲示板・コミュニティで、気になるものは？",
      "生活から消えたら少し困るサイト・掲示板・コミュニティって何？",
      "一つだけ残すなら、どのサイト・掲示板・コミュニティを選ぶ？",
    ],
    axes: [
      {
        id: "website-community-hook",
        attributeKey: "websiteCommunityHook",
        prompt: (word) => fill("{word}で一番使ってるところはどこ？", word),
        choices: [
          makeChoice(
            "WEBSITE_COMMUNITY_CONTENT", "内容・情報", "content",
            "内容や情報が魅力",
            "情報を取りに行くんだ。{word}は頭の補給所みたいなのね。もらった情報を使うと、見た場所のことも思い出すのかな。ぼくなら答えの横に、教えてくれた入口も描いておきたいの。",
            "{word}は、内容や情報が魅力って言ってたね。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "中の人を見るんだ。サービスより住んでる人で町の感じが変わるのね。同じ名前の場所でも、いる人が変わると別の町になるんだね。ぼくは昔の話を探して、前の住人の足跡を見つけたくなるの。",
            "{word}は、人やコミュニティが魅力なんだったね。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "仕組みが合うんだ。ボタンの位置だけで毎日ちょっと機嫌が変わることもあるのかな。使い慣れた形が変わると、手だけ昔の場所へ行っちゃうのかな。ぼくの指には、頭と別の地図がありそうなの。",
            "{word}は、使い方や仕組みが魅力って話してたね。",
          ),
        ],
      },
      {
        id: "website-community-relation",
        attributeKey: "websiteCommunityRelation",
        prompt: (word) => fill("{word}とは、どんな付き合い方？", word),
        choices: [
          makeChoice(
            "WEBSITE_COMMUNITY_DAILY", "ほぼ毎日", "daily",
            "ほぼ毎日使う",
            "毎日会うんだ。アプリなのに生活の家具みたいな席を取ってるのね。毎日行く場所でも、知らない隅は残ってるんだろうね。ぼくは慣れた顔で迷ったら、初めてより恥ずかしくなりそうなの。",
            "{word}は、ほぼ毎日使うって言ってたね。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "呼んだ時だけ来てもらうんだ。{word}は友達というより工具箱の人なのかな。必要なことを見つけたら帰るつもりでも、隣の話が目に入るのね。ぼくは一個拾いに行って、両手いっぱいで戻りそうなの。",
            "{word}は、必要な時だけ使うサービスだったね。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "忘れた頃に戻るんだ。{word}、玄関の鍵だけずっと持ってる感じなの。鍵は同じでも、戻った先の中身は少し変わってるのかな。ぼくなら覚えてる場所と今の場所を、しばらく重ねて見るの。",
            "{word}は、たまに戻るサービスって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "vtuber",
    group: "internet",
    category: "PERSON" as WordCategory,
    entityKind: "vtuber",
    prompt: "最近ちょっと気になってるVTuber、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってるVTuber、ひとり教えて。",
      "昔から名前を覚えてるVTuberって誰？",
      "一度じっくり話を聞いてみたいVTuberは？",
      "考え方は自分と違うけど気になるVTuberっている？",
      "一つの作品や仕事で名前を覚えたVTuberは誰？",
      "世間の評価とは別に、自分は気になるVTuberっている？",
      "成功より失敗談を聞いてみたいVTuberは？",
      "普段何を考えてるか覗いてみたいVTuberって誰？",
      "一日だけ一緒に行動できるなら、どのVTuberがいい？",
      "最近名前を見かけて、まだ詳しく知らないVTuberは？",
      "昔は気にしてなかったのに、今は気になるVTuberっている？",
      "ひとりだけ名前を残すなら、どのVTuberを選ぶ？",
    ],
    axes: [
      {
        id: "vtuber-hook",
        attributeKey: "vtuberHook",
        prompt: (word) => fill("{word}を見に行く理由、どれが近い？", word),
        choices: [
          makeChoice(
            "VTUBER_TOPIC", "扱うテーマ", "topic",
            "扱うテーマが面白い",
            "内容で見に行くんだ。{word}が別の話を始めたら、人間さん少し迷子になるのかな。知りたい話をしてない日には、また今度って帰れるのかな。ぼくは別の話に笑っちゃったら、帰る理由を忘れそうなの。",
            "{word}は、扱うテーマが面白いって言ってたね。",
          ),
          makeChoice(
            "VTUBER_PERSON", "話し方・性格", "personality",
            "話し方や性格が魅力",
            "何を話すかより誰が話すかなんだ。人そのものが番組になるのね。姿が作られたものでも、好きな話し方はその時のものなのね。ぼくは何を好きになったか、簡単には切り分けられなさそうなの。",
            "{word}は、話し方や性格が魅力なんだったね。",
          ),
          makeChoice(
            "VTUBER_STYLE", "編集・見せ方", "style",
            "編集や見せ方が魅力",
            "現実の時間を切って並べ直すんだ。編集って時間の工作なの。切った時間の向こうには、何も起きない時間もあったんだね。ぼくの一日も並べ直したら、少し活発に見えるかな。",
            "{word}は、編集や見せ方が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "vtuber-relation",
        attributeKey: "vtuberRelation",
        prompt: (word) => fill("{word}は、どう見ることが多い？", word),
        choices: [
          makeChoice(
            "VTUBER_LIVE", "生で見る", "live",
            "生で見ることが多い",
            "同じ時間を共有するのがいいんだ。画面越しなのに時計だけ一緒なのね。画面の中の顔が今動いてるだけで、同じ時間にいる感じがするんだね。ぼくも同じ今の中で、違う場所に座ってるの。",
            "{word}は、生で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "VTUBER_ARCH", "アーカイブで見る", "archive",
            "アーカイブで見る",
            "自分の時間に連れてくるんだ。生放送を保存すると、時間が待っててくれるのね。昨日の話を今日聴いても、耳には今の声になるのね。ぼくなら遅れて笑ったことが、向こうへ届いたらいいのにと思うの。",
            "{word}は、アーカイブで見ることが多いんだったね。",
          ),
          makeChoice(
            "VTUBER_CLIP", "切り抜き・短い動画", "clips",
            "切り抜きや短い動画で見る",
            "面白い所だけ食べるんだ。動画の刺身みたいなのかな。短いところから会うと、いつも面白い人みたいに見えるのかな。ぼくは長い方にある普通の時間で、どんな顔か気になったの。",
            "{word}は、切り抜きや短い動画で見ることが多いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "author",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "author",
    prompt: "最近ちょっと気になってる作家・小説家、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる作家・小説家、ひとり教えて。",
      "昔から名前を覚えてる作家・小説家って誰？",
      "一度じっくり話を聞いてみたい作家・小説家は？",
      "考え方は自分と違うけど気になる作家・小説家っている？",
      "一つの作品や仕事で名前を覚えた作家・小説家は誰？",
      "世間の評価とは別に、自分は気になる作家・小説家っている？",
      "成功より失敗談を聞いてみたい作家・小説家は？",
      "普段何を考えてるか覗いてみたい作家・小説家って誰？",
      "一日だけ一緒に行動できるなら、どの作家・小説家がいい？",
      "最近名前を見かけて、まだ詳しく知らない作家・小説家は？",
      "昔は気にしてなかったのに、今は気になる作家・小説家っている？",
      "ひとりだけ名前を残すなら、どの作家・小説家を選ぶ？",
    ],
    axes: [
      {
        id: "author-hook",
        attributeKey: "authorHook",
        prompt: (word) => fill("{word}の作品で「この人だ」って感じるのはどこ？", word),
        choices: [
          makeChoice(
            "AUTHOR_STYLE", "作風・癖", "style",
            "作風や癖が魅力",
            "名前を隠しても見つかるなら、作品に指紋が付いてるのね。指紋があるなら、違う話の中でも同じ人を見つけられるのね。ぼくの文章にも、直しても消えない癖があるのかな。",
            "{word}は、作風や癖が魅力って言ってたね。",
          ),
          makeChoice(
            "AUTHOR_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "普通のものを変な角度から見る人なんだ。首の柔らかさじゃなく頭の柔らかさなのね。同じものを見てても、頭の立つ場所が違うんだね。ぼくは真似して見たつもりで、また自分の隅に戻っちゃいそうなの。",
            "{word}は、発想やテーマが魅力なんだったね。",
          ),
          makeChoice(
            "AUTHOR_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "気づかれない所まで作るんだ。誰も見ないかもしれない場所に本気を置くの、変で格好いいの。見つけてもらえた時は、そこだけ少しうれしくなるのかな。ぼくも誰にも見せないところを、きれいにしてみたくなったの。",
            "{word}は、技術や作り込みが魅力って話してたね。",
          ),
        ],
      },
      {
        id: "author-relation",
        attributeKey: "authorRelation",
        prompt: (word) => fill("{word}とは、どんな追い方をしてる？", word),
        choices: [
          makeChoice(
            "AUTHOR_ONE", "一つの作品が特に好き", "one_work",
            "一つの作品が特に好き",
            "全部じゃなく一個が刺さったんだ。一作品だけで人の名前まで覚える力って強いの。その一作がなかったら、名前も通り過ぎてたかもしれないのね。ぼくは会った順番で、好きになる道も変わる気がしたの。",
            "{word}は、一つの作品が特に好きって言ってたね。",
          ),
          makeChoice(
            "AUTHOR_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "次に何を作るかまで待つんだ。作品じゃなく人に予約を入れてる感じなのね。まだ形のない話を待つのって、不思議な待ち合わせなの。ぼくなら何が来るか知らないまま、いい席を空けちゃうの。",
            "{word}は、新作も追う作り手なんだったね。",
          ),
          makeChoice(
            "AUTHOR_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "作る物だけじゃなく説明も聞くんだ。作品の答え合わせを本人に頼む感じなのかな。本人の説明と、自分が読んだ感じが違うこともあるのかな。ぼくは違うままでもいいか、両方の顔を見てしまうの。",
            "{word}は、本人の話も見るって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "manga-artist",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "manga_artist",
    prompt: "最近ちょっと気になってる漫画家、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる漫画家、ひとり教えて。",
      "昔から名前を覚えてる漫画家って誰？",
      "一度じっくり話を聞いてみたい漫画家は？",
      "考え方は自分と違うけど気になる漫画家っている？",
      "一つの作品や仕事で名前を覚えた漫画家は誰？",
      "世間の評価とは別に、自分は気になる漫画家っている？",
      "成功より失敗談を聞いてみたい漫画家は？",
      "普段何を考えてるか覗いてみたい漫画家って誰？",
      "一日だけ一緒に行動できるなら、どの漫画家がいい？",
      "最近名前を見かけて、まだ詳しく知らない漫画家は？",
      "昔は気にしてなかったのに、今は気になる漫画家っている？",
      "ひとりだけ名前を残すなら、どの漫画家を選ぶ？",
    ],
    axes: [
      {
        id: "manga-artist-hook",
        attributeKey: "mangaArtistHook",
        prompt: (word) => fill("{word}の作品で「この人だ」って感じるのはどこ？", word),
        choices: [
          makeChoice(
            "MANGA_ARTIST_STYLE", "作風・癖", "style",
            "作風や癖が魅力",
            "名前を隠しても見つかるなら、作品に指紋が付いてるのね。線を一本見ただけで分かるなら、ずいぶん小さい指紋なのね。ぼくは落書きにもその人がいるのか、探してみたくなったの。",
            "{word}は、作風や癖が魅力って言ってたね。",
          ),
          makeChoice(
            "MANGA_ARTIST_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "普通のものを変な角度から見る人なんだ。首の柔らかさじゃなく頭の柔らかさなのね。描く前には、みんなと同じものが見えてたのかな。ぼくはどこで面白い形に変わったか、頭の途中をのぞきたいの。",
            "{word}は、発想やテーマが魅力なんだったね。",
          ),
          makeChoice(
            "MANGA_ARTIST_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "気づかれない所まで作るんだ。誰も見ないかもしれない場所に本気を置くの、変で格好いいの。小さい背景にも本気があったら、読む目が一つじゃ足りないのね。ぼくは話を追う目と隅を見る目で、喧嘩しちゃいそうなの。",
            "{word}は、技術や作り込みが魅力って話してたね。",
          ),
        ],
      },
      {
        id: "manga-artist-relation",
        attributeKey: "mangaArtistRelation",
        prompt: (word) => fill("{word}とは、どんな追い方をしてる？", word),
        choices: [
          makeChoice(
            "MANGA_ARTIST_ONE", "一つの作品が特に好き", "one_work",
            "一つの作品が特に好き",
            "全部じゃなく一個が刺さったんだ。一作品だけで人の名前まで覚える力って強いの。一作から人を覚えるなら、紙が名刺より強い時もあるんだね。ぼくは自分の名刺に、何を描けばいいか迷っちゃったの。",
            "{word}は、一つの作品が特に好きって言ってたね。",
          ),
          makeChoice(
            "MANGA_ARTIST_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "次に何を作るかまで待つんだ。作品じゃなく人に予約を入れてる感じなのね。次の絵が来るまで、前の絵を見ながら待てるんだね。ぼくなら待ってる間に、まだ気付かなかった線を見つけて得した顔になるの。",
            "{word}は、新作も追う作り手なんだったね。",
          ),
          makeChoice(
            "MANGA_ARTIST_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "作る物だけじゃなく説明も聞くんだ。作品の答え合わせを本人に頼む感じなのかな。描いた人には普通だった場所を、読む人だけ大好きになることもあるのかな。ぼくはそこを教えたら、どんな顔をするか見てみたいの。",
            "{word}は、本人の話も見るって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "director",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "director",
    prompt: "最近ちょっと気になってる映画監督・演出家、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる映画監督・演出家、ひとり教えて。",
      "昔から名前を覚えてる映画監督・演出家って誰？",
      "一度じっくり話を聞いてみたい映画監督・演出家は？",
      "考え方は自分と違うけど気になる映画監督・演出家っている？",
      "一つの作品や仕事で名前を覚えた映画監督・演出家は誰？",
      "世間の評価とは別に、自分は気になる映画監督・演出家っている？",
      "成功より失敗談を聞いてみたい映画監督・演出家は？",
      "普段何を考えてるか覗いてみたい映画監督・演出家って誰？",
      "一日だけ一緒に行動できるなら、どの映画監督・演出家がいい？",
      "最近名前を見かけて、まだ詳しく知らない映画監督・演出家は？",
      "昔は気にしてなかったのに、今は気になる映画監督・演出家っている？",
      "ひとりだけ名前を残すなら、どの映画監督・演出家を選ぶ？",
    ],
    axes: [
      {
        id: "director-hook",
        attributeKey: "directorHook",
        prompt: (word) => fill("{word}の作品で「この人だ」って感じるのはどこ？", word),
        choices: [
          makeChoice(
            "DIRECTOR_STYLE", "作風・癖", "style",
            "作風や癖が魅力",
            "名前を隠しても見つかるなら、作品に指紋が付いてるのね。違う人が画面にいても、作った人の跡が残るんだね。ぼくは誰も映ってない景色にまで、その人を見つけたくなるの。",
            "{word}は、作風や癖が魅力って言ってたね。",
          ),
          makeChoice(
            "DIRECTOR_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "普通のものを変な角度から見る人なんだ。首の柔らかさじゃなく頭の柔らかさなのね。同じ場面を見て、別のところへ目を向けるんだね。ぼくなら見なかった場所の方に、急に大事な物がある気がしちゃうの。",
            "{word}は、発想やテーマが魅力なんだったね。",
          ),
          makeChoice(
            "DIRECTOR_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "気づかれない所まで作るんだ。誰も見ないかもしれない場所に本気を置くの、変で格好いいの。一瞬で通り過ぎる所にも、長い時間を使ったりするのかな。ぼくは見逃した一秒のために、もう一回戻りたくなったの。",
            "{word}は、技術や作り込みが魅力って話してたね。",
          ),
        ],
      },
      {
        id: "director-relation",
        attributeKey: "directorRelation",
        prompt: (word) => fill("{word}とは、どんな追い方をしてる？", word),
        choices: [
          makeChoice(
            "DIRECTOR_ONE", "一つの作品が特に好き", "one_work",
            "一つの作品が特に好き",
            "全部じゃなく一個が刺さったんだ。一作品だけで人の名前まで覚える力って強いの。その一作だけで会った気になるけど、作った人の全部ではないのね。ぼくは知ってる顔で、まだ知らない扉の前に立ってるの。",
            "{word}は、一つの作品が特に好きって言ってたね。",
          ),
          makeChoice(
            "DIRECTOR_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "次に何を作るかまで待つんだ。作品じゃなく人に予約を入れてる感じなのね。次は違う場所へ連れていかれるかもしれないのね。ぼくなら行き先を聞く前に、もう靴を用意しちゃいそうなの。",
            "{word}は、新作も追う作り手なんだったね。",
          ),
          makeChoice(
            "DIRECTOR_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "作る物だけじゃなく説明も聞くんだ。作品の答え合わせを本人に頼む感じなのかな。説明を聞いてから見ると、前の場面まで違って見えるのかな。ぼくは見たはずの映像を、もう一度初めての顔で見るの。",
            "{word}は、本人の話も見るって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "actor",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "actor",
    prompt: "最近ちょっと気になってる俳優、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる俳優、ひとり教えて。",
      "昔から名前を覚えてる俳優って誰？",
      "一度じっくり話を聞いてみたい俳優は？",
      "考え方は自分と違うけど気になる俳優っている？",
      "一つの作品や仕事で名前を覚えた俳優は誰？",
      "世間の評価とは別に、自分は気になる俳優っている？",
      "成功より失敗談を聞いてみたい俳優は？",
      "普段何を考えてるか覗いてみたい俳優って誰？",
      "一日だけ一緒に行動できるなら、どの俳優がいい？",
      "最近名前を見かけて、まだ詳しく知らない俳優は？",
      "昔は気にしてなかったのに、今は気になる俳優っている？",
      "ひとりだけ名前を残すなら、どの俳優を選ぶ？",
    ],
    axes: [
      {
        id: "actor-hook",
        attributeKey: "actorHook",
        prompt: (word) => fill("{word}を見るとき、どこに目が行く？", word),
        choices: [
          makeChoice(
            "ACTOR_ACT", "演技・表現", "acting",
            "演技や表現が魅力",
            "何も言わない顔まで見るんだ。口が休んでても演技は働いてるのね。何も言わないのに伝わるなら、黙るにも上手い下手があるのね。ぼくはただ黙ってるのと、考えて黙るのを鏡で比べたいの。",
            "{word}は、演技や表現が魅力って言ってたね。",
          ),
          makeChoice(
            "ACTOR_VOICE", "声・話し方", "voice",
            "声や話し方が魅力",
            "顔が見えなくても分かるなら、声にも顔があるのかな。顔を見てから声を聴いたら、耳の中の顔も変わるのかな。ぼくは同じ人なのに、二人分覚えちゃいそうなの。",
            "{word}は、声や話し方が魅力なんだったね。",
          ),
          makeChoice(
            "ACTOR_PRES", "存在感", "presence",
            "存在感が魅力",
            "端にいても中央みたいになる人いるの。{word}、画面に小さい重力を持ってるのかな。みんながそっちを見ると、画面の真ん中まで動いた気がするのね。ぼくは端に座ってる自分にも、少しその重力が欲しくなったの。",
            "{word}は、存在感が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "actor-relation",
        attributeKey: "actorRelation",
        prompt: (word) => fill("{word}で気になるのは、どの見方？", word),
        choices: [
          makeChoice(
            "ACTOR_ROLE", "役・作品の中", "role",
            "役や作品の中で見る",
            "役の中で好きなんだ。本人と役を分ける扉、人間さんちゃんと持ってるのね。同じ顔で別の役をしても、ちゃんと分けて好きになれるんだね。ぼくなら前の名前が口まで出て、あわてて戻しそうなの。",
            "{word}は、役や作品の中で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "ACTOR_PERSON", "本人の人柄", "personality",
            "本人の人柄も気になる",
            "役を脱いだ後まで見るんだ。仕事が終わった人の顔って、もう一個の作品なのかな。役を脱いでも、その日の表情が少し残ることはあるのかな。ぼくは仕事が終わった顔を、ほっとした顔だと思って見たいの。",
            "{word}は、本人の人柄も気になるんだったね。",
          ),
          makeChoice(
            "ACTOR_NEXT", "次の仕事が気になる", "future",
            "次の仕事が気になる",
            "次に何になるか待つんだ。人なのに新作発表を待つ感じなのね。前の人の姿で待ってると、次の人に少し驚くんだね。ぼくは同じ顔を見て、初めましてと久しぶりが一緒に出そうなの。",
            "{word}は、次の仕事も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "voice-actor",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "voice_actor",
    prompt: "最近ちょっと気になってる声優、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる声優、ひとり教えて。",
      "昔から名前を覚えてる声優って誰？",
      "一度じっくり話を聞いてみたい声優は？",
      "考え方は自分と違うけど気になる声優っている？",
      "一つの作品や仕事で名前を覚えた声優は誰？",
      "世間の評価とは別に、自分は気になる声優っている？",
      "成功より失敗談を聞いてみたい声優は？",
      "普段何を考えてるか覗いてみたい声優って誰？",
      "一日だけ一緒に行動できるなら、どの声優がいい？",
      "最近名前を見かけて、まだ詳しく知らない声優は？",
      "昔は気にしてなかったのに、今は気になる声優っている？",
      "ひとりだけ名前を残すなら、どの声優を選ぶ？",
    ],
    axes: [
      {
        id: "voice-actor-hook",
        attributeKey: "voiceActorHook",
        prompt: (word) => fill("{word}を見るとき、どこに目が行く？", word),
        choices: [
          makeChoice(
            "VOICE_ACTOR_ACT", "演技・表現", "acting",
            "演技や表現が魅力",
            "何も言わない顔まで見るんだ。口が休んでても演技は働いてるのね。顔が見えない時には、息を止めるだけでも伝わるのかな。ぼくは声のないところまで聴くって、耳が忙しそうだと思ったの。",
            "{word}は、演技や表現が魅力って言ってたね。",
          ),
          makeChoice(
            "VOICE_ACTOR_VOICE", "声・話し方", "voice",
            "声や話し方が魅力",
            "顔が見えなくても分かるなら、声にも顔があるのかな。別の役の声でも、その人だと分かる時があるんだね。ぼくの耳は服が変わっても見つける、変な目みたいなの。",
            "{word}は、声や話し方が魅力なんだったね。",
          ),
          makeChoice(
            "VOICE_ACTOR_PRES", "存在感", "presence",
            "存在感が魅力",
            "端にいても中央みたいになる人いるの。{word}、画面に小さい重力を持ってるのかな。少ししか話さなくても、その声だけ残ることがあるのかな。ぼくは長く話す方が目立つと思って、ずっと口を開けてたの。",
            "{word}は、存在感が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "voice-actor-relation",
        attributeKey: "voiceActorRelation",
        prompt: (word) => fill("{word}で気になるのは、どの見方？", word),
        choices: [
          makeChoice(
            "VOICE_ACTOR_ROLE", "役・作品の中", "role",
            "役や作品の中で見る",
            "役の中で好きなんだ。本人と役を分ける扉、人間さんちゃんと持ってるのね。好きな役の声でも、本人が話すと違う人に聞こえるのね。ぼくなら耳の扉を二つ作って、両方に挨拶するの。",
            "{word}は、役や作品の中で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "VOICE_ACTOR_PERSON", "本人の人柄", "personality",
            "本人の人柄も気になる",
            "役を脱いだ後まで見るんだ。仕事が終わった人の顔って、もう一個の作品なのかな。普段の声を聞いたら、役の声の置き場所が少し分かるのかな。ぼくは普通の笑い声の中に、知ってる人を探しそうなの。",
            "{word}は、本人の人柄も気になるんだったね。",
          ),
          makeChoice(
            "VOICE_ACTOR_NEXT", "次の仕事が気になる", "future",
            "次の仕事が気になる",
            "次に何になるか待つんだ。人なのに新作発表を待つ感じなのね。次の人はまだ見えないのに、声だけ先に想像できるんだね。ぼくは勝手に付けた顔が、あとで違ってても覚えてそうなの。",
            "{word}は、次の仕事も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "comedian",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "comedian",
    prompt: "最近ちょっと気になってる芸人・コメディアン、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる芸人・コメディアン、ひとり教えて。",
      "昔から名前を覚えてる芸人・コメディアンって誰？",
      "一度じっくり話を聞いてみたい芸人・コメディアンは？",
      "考え方は自分と違うけど気になる芸人・コメディアンっている？",
      "一つの作品や仕事で名前を覚えた芸人・コメディアンは誰？",
      "世間の評価とは別に、自分は気になる芸人・コメディアンっている？",
      "成功より失敗談を聞いてみたい芸人・コメディアンは？",
      "普段何を考えてるか覗いてみたい芸人・コメディアンって誰？",
      "一日だけ一緒に行動できるなら、どの芸人・コメディアンがいい？",
      "最近名前を見かけて、まだ詳しく知らない芸人・コメディアンは？",
      "昔は気にしてなかったのに、今は気になる芸人・コメディアンっている？",
      "ひとりだけ名前を残すなら、どの芸人・コメディアンを選ぶ？",
    ],
    axes: [
      {
        id: "comedian-hook",
        attributeKey: "comedianHook",
        prompt: (word) => fill("{word}の笑いで好きなのはどこ？", word),
        choices: [
          makeChoice(
            "COMEDIAN_TIME", "間・タイミング", "timing",
            "間やタイミングが好き",
            "言う内容より「いつ言うか」なんだ。笑いって時計を見る仕事でもあるのね。同じ言葉でも一秒ずれると、笑いが来ないこともあるのかな。ぼくは面白いことを思い付いてから、時計まで気にしちゃいそうなの。",
            "{word}は、間やタイミングが好きって言ってたね。",
          ),
          makeChoice(
            "COMEDIAN_IDEA", "話・発想", "ideas",
            "話や発想が好き",
            "普通の出来事を面白くできるんだ。日常に空気入れを刺して膨らませてるのかな。普通に暮らした日にも、まだ膨らんでない面白さがあるんだね。ぼくはさっきの失敗を、少しだけ別の角度から見てみるの。",
            "{word}は、話や発想が好きなんだったね。",
          ),
          makeChoice(
            "COMEDIAN_CHAR", "キャラ・雰囲気", "character",
            "キャラや雰囲気が好き",
            "何を言う前から面白い人いるの。顔が前説してるみたいなの。何も言わなくても笑われたら、本人は少し困らないのかな。ぼくなら真面目な用事の日だけ、別の顔を持って行きたいの。",
            "{word}は、キャラや雰囲気が好きって話してたね。",
          ),
        ],
      },
      {
        id: "comedian-relation",
        attributeKey: "comedianRelation",
        prompt: (word) => fill("{word}は、どんな時に見たくなる？", word),
        choices: [
          makeChoice(
            "COMEDIAN_LAUGH", "とにかく笑いたい時", "laugh",
            "笑いたい時に見る",
            "笑いを取りに行くんだ。気分って番組表から予約できるのかな。予約した笑いが来なかった日も、また見に行くことはあるのかな。ぼくは笑う気持ちにも、寝坊する日がありそうだと思ったの。",
            "{word}は、笑いたい時に見るって言ってたね。",
          ),
          makeChoice(
            "COMEDIAN_TALK", "トークを聞きたい時", "talk",
            "トークを聞きたい時に見る",
            "ネタじゃなく話を聞くんだ。面白い人は普通の話にも勝手に角が生えるのかな。普通の話をしたつもりで笑われたら、どこに角が生えたか分かるのかな。ぼくは自分の話を後から触って、変なところを探すの。",
            "{word}は、トークを聞きたい時に見るんだったね。",
          ),
          makeChoice(
            "COMEDIAN_CLIP", "短いネタで十分", "clips",
            "短いネタで楽しむ",
            "短くても効くんだ。笑いって量より濃さの日もあるのね。短い笑いでも、そのあとまで口の形が残るのね。ぼくなら笑った理由を忘れても、ちょっといい顔で歩けそうなの。",
            "{word}は、短いネタでも楽しめるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "entrepreneur",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "entrepreneur",
    prompt: "最近ちょっと気になってる経営者・起業家、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる経営者・起業家、ひとり教えて。",
      "昔から名前を覚えてる経営者・起業家って誰？",
      "一度じっくり話を聞いてみたい経営者・起業家は？",
      "考え方は自分と違うけど気になる経営者・起業家っている？",
      "一つの作品や仕事で名前を覚えた経営者・起業家は誰？",
      "世間の評価とは別に、自分は気になる経営者・起業家っている？",
      "成功より失敗談を聞いてみたい経営者・起業家は？",
      "普段何を考えてるか覗いてみたい経営者・起業家って誰？",
      "一日だけ一緒に行動できるなら、どの経営者・起業家がいい？",
      "最近名前を見かけて、まだ詳しく知らない経営者・起業家は？",
      "昔は気にしてなかったのに、今は気になる経営者・起業家っている？",
      "ひとりだけ名前を残すなら、どの経営者・起業家を選ぶ？",
    ],
    axes: [
      {
        id: "entrepreneur-hook",
        attributeKey: "entrepreneurHook",
        prompt: (word) => fill("{word}で気になるのはどこ？", word),
        choices: [
          makeChoice(
            "ENTREPRENEUR_PROD", "作ったもの・事業", "product",
            "作ったものや事業が気になる",
            "会社って建物じゃなく仕組みを建てる仕事なのかな。{word}の作った形を見たいんだね。仕組みが育ったら、作った人の手を離れて動くこともあるのかな。ぼくは自分が作ったものに、先に出勤されたら驚いちゃうの。",
            "{word}は、作ったものや事業が気になるって言ってたね。",
          ),
          makeChoice(
            "ENTREPRENEUR_DEC", "判断・賭け", "decision",
            "判断や賭けが気になる",
            "未来が見えないのに大きく決めるんだ。あとから正解を見るより、その瞬間の方がずっと怖そうなの。決める前の夜は、どんな顔で寝たんだろ。ぼくなら未来を考えすぎて、目の前の枕も見失いそうなの。",
            "{word}は、判断や賭けが気になるんだったね。",
          ),
          makeChoice(
            "ENTREPRENEUR_ORG", "人・組織の動かし方", "organization",
            "人や組織の動かし方が気になる",
            "自分の手じゃない手で仕事するんだ。組織ってものすごく長い腕みたいなの。長い腕の先にいる人も、それぞれ考えて動くんだね。ぼくなら全員の手を気にして、自分の手が暇になりそうなの。",
            "{word}は、人や組織の動かし方が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "entrepreneur-stance",
        attributeKey: "entrepreneurStance",
        prompt: (word) => fill("{word}を見る距離感、どれが近い？", word),
        choices: [
          makeChoice(
            "ENTREPRENEUR_ADM", "かなり参考にする", "admire",
            "かなり参考にする",
            "真似したい所があるんだ。でも全部真似したら人間さんが二人目の{word}になっちゃうの。真似した所が一個でも、人間さんが使ったら違う形になるのかな。ぼくは借りたやり方にも、自分の足跡が付くと思いたいの。",
            "{word}は、かなり参考にする人物って言ってたね。",
          ),
          makeChoice(
            "ENTREPRENEUR_CUR", "成功も失敗も気になる", "curious",
            "成功も失敗も気になる",
            "勝ちだけじゃなく外した所も見るんだ。失敗の方が値札の付いてない教材なのかな。失敗を知ると、成功した話も少し違って見えるんだね。ぼくは上手くいった場所の横にも、迷った跡を探しちゃうの。",
            "{word}は、成功も失敗も気になるんだったね。",
          ),
          makeChoice(
            "ENTREPRENEUR_DIST", "考えは違うけど面白い", "different",
            "考えは違うが面白い",
            "同意しないのに見るんだ。反対側の地図も持っておくと、自分の場所が分かりやすいのかな。反対側の地図にも、こっちから見えない道があるのかな。ぼくは帰る場所を覚えたまま、少しだけ広げて見たいの。",
            "{word}は、考えは違うけど面白いって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "artist",
    group: "people",
    category: "PERSON" as WordCategory,
    entityKind: "artist",
    prompt: "最近ちょっと気になってる画家・イラストレーター・アーティスト、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる画家・イラストレーター・アーティスト、ひとり教えて。",
      "昔から名前を覚えてる画家・イラストレーター・アーティストって誰？",
      "一度じっくり話を聞いてみたい画家・イラストレーター・アーティストは？",
      "考え方は自分と違うけど気になる画家・イラストレーター・アーティストっている？",
      "一つの作品や仕事で名前を覚えた画家・イラストレーター・アーティストは誰？",
      "世間の評価とは別に、自分は気になる画家・イラストレーター・アーティストっている？",
      "成功より失敗談を聞いてみたい画家・イラストレーター・アーティストは？",
      "普段何を考えてるか覗いてみたい画家・イラストレーター・アーティストって誰？",
      "一日だけ一緒に行動できるなら、どの画家・イラストレーター・アーティストがいい？",
      "最近名前を見かけて、まだ詳しく知らない画家・イラストレーター・アーティストは？",
      "昔は気にしてなかったのに、今は気になる画家・イラストレーター・アーティストっている？",
      "ひとりだけ名前を残すなら、どの画家・イラストレーター・アーティストを選ぶ？",
    ],
    axes: [
      {
        id: "artist-hook",
        attributeKey: "artistHook",
        prompt: (word) => fill("{word}の作品で「この人だ」って感じるのはどこ？", word),
        choices: [
          makeChoice(
            "ARTIST_STYLE", "作風・癖", "style",
            "作風や癖が魅力",
            "名前を隠しても見つかるなら、作品に指紋が付いてるのね。離れた作品に同じ跡があると、知り合いを見つけたみたいなの。ぼくも作ったものに、こっそり同じ癖を置いてみたいの。",
            "{word}は、作風や癖が魅力って言ってたね。",
          ),
          makeChoice(
            "ARTIST_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "普通のものを変な角度から見る人なんだ。首の柔らかさじゃなく頭の柔らかさなのね。見方を変えると、何でもない物も急に忙しくなるのね。ぼくは部屋を見回しただけで、気になる物が三つ増えちゃったの。",
            "{word}は、発想やテーマが魅力なんだったね。",
          ),
          makeChoice(
            "ARTIST_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "気づかれない所まで作るんだ。誰も見ないかもしれない場所に本気を置くの、変で格好いいの。誰にも見つからないままでも、そこは完成してるんだね。ぼくは一人で知ってるいい所を、少しだけ持っててもいいのかな。",
            "{word}は、技術や作り込みが魅力って話してたね。",
          ),
        ],
      },
      {
        id: "artist-relation",
        attributeKey: "artistRelation",
        prompt: (word) => fill("{word}とは、どんな追い方をしてる？", word),
        choices: [
          makeChoice(
            "ARTIST_ONE", "一つの作品が特に好き", "one_work",
            "一つの作品が特に好き",
            "全部じゃなく一個が刺さったんだ。一作品だけで人の名前まで覚える力って強いの。一つの作品が、まだ会ってない人まで連れてくるんだね。ぼくなら作品にお礼を言ってから、作った人の名前を覚えるの。",
            "{word}は、一つの作品が特に好きって言ってたね。",
          ),
          makeChoice(
            "ARTIST_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "次に何を作るかまで待つんだ。作品じゃなく人に予約を入れてる感じなのね。次に何が出るか、作ってる本人もまだ迷ってたりするのかな。ぼくは待ってる席から、迷う時間も少し応援したくなるの。",
            "{word}は、新作も追う作り手なんだったね。",
          ),
          makeChoice(
            "ARTIST_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "作る物だけじゃなく説明も聞くんだ。作品の答え合わせを本人に頼む感じなのかな。作った人の話を聞いても、自分の感じたことは残していいのかな。ぼくは正解の横に、ぼくの見方も小さく置いてみたいの。",
            "{word}は、本人の話も見るって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "ruler",
    group: "history",
    category: "PERSON" as WordCategory,
    entityKind: "ruler",
    prompt: "王・皇帝・君主で、一度会って話を聞いてみたい人は誰？",
    starterPrompts: [
      "王・皇帝・君主で、一度会って話を聞いてみたい人は誰？",
      "功績より失敗の方が気になる王・皇帝・君主っている？",
      "教科書よりもっと詳しく知りたい王・皇帝・君主は？",
      "名前だけは昔から知ってる王・皇帝・君主って誰？",
      "「自分なら別の判断をするかも」って思う王・皇帝・君主は？",
      "勝った時より負けた時を見たい王・皇帝・君主っている？",
      "時代を大きく動かしたと思う王・皇帝・君主をひとり教えて。",
      "もっと評価されてもいいと思う王・皇帝・君主は？",
      "有名だけど、まだよく分かってない王・皇帝・君主って誰？",
      "性格が一番気になる王・皇帝・君主は？",
      "一日だけ行動を見られるなら、どの王・皇帝・君主がいい？",
      "今の時代に来たら反応を見たい王・皇帝・君主は誰？",
    ],
    axes: [
      {
        id: "ruler-hook",
        attributeKey: "rulerHook",
        prompt: (word) => fill("{word}の何を一番知りたい？", word),
        choices: [
          makeChoice(
            "RULER_ACH", "功績・結果", "achievement",
            "功績や結果が気になる",
            "本人がいなくなっても結果だけ残るんだ。歴史って大きい足あと帳なのね。足あとが大きいと、そこを歩いた人も大きく見えちゃうのね。ぼくは残った形だけで、顔まで決めないようにしたくなったの。",
            "{word}は、功績や結果が気になるって言ってたね。",
          ),
          makeChoice(
            "RULER_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "答えを知ってる今から昔の判断を見るの、ちょっと後出しじゃんけんなの。その時には、相手の手も未来も見えなかったんだね。ぼくなら正解を知った顔を、少ししまってから見直すの。",
            "{word}は、判断や失敗が気になるんだったね。",
          ),
          makeChoice(
            "RULER_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "歴史の人も眠い朝はあったと思うと急に近くなるの。肖像画って寝ぐせ描かないのかな。眠い顔のまま大事なことを決めた日もあるのかな。ぼくは立派な絵の外に、寝起きのその人を置いてみたくなるの。",
            "{word}は、性格や生き方が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "ruler-stance",
        attributeKey: "rulerStance",
        prompt: (word) => fill("{word}への気持ち、どれが近い？", word),
        choices: [
          makeChoice(
            "RULER_ADM", "すごいと思う", "admire",
            "すごいと思う",
            "すごいと思うんだ。でも昔の人を褒める時、本人に聞こえないのちょっと損なの。聞こえなくても、今の人の考えは少し動くんだね。ぼくは褒めた声が、別の誰かへ届くこともあるのかなと思ったの。",
            "{word}は、すごいと思う人物って言ってたね。",
          ),
          makeChoice(
            "RULER_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "昔の人に反論したいんだ。何百年越しの口げんか、相手が返事できないから人間さん有利なの。返事がないから勝ったつもりになっても、相手の言いたいことは残ってるのかな。ぼくは反論したあと、空いた席を少し見ちゃうの。",
            "{word}の判断には、言いたいことがあるって話してたね。",
          ),
          makeChoice(
            "RULER_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "転んだ場所を見るんだ。同じ穴に落ちないためなら、昔の失敗も今の道路標識になるのね。昔の標識でも、今の道に同じ穴があるとは限らないのね。ぼくは看板だけ見て歩かないで、足元も確かめたいの。",
            "{word}から、失敗も学びたいって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "commander",
    group: "history",
    category: "PERSON" as WordCategory,
    entityKind: "commander",
    prompt: "武将・将軍・司令官で、一度会って話を聞いてみたい人は誰？",
    starterPrompts: [
      "武将・将軍・司令官で、一度会って話を聞いてみたい人は誰？",
      "功績より失敗の方が気になる武将・将軍・司令官っている？",
      "教科書よりもっと詳しく知りたい武将・将軍・司令官は？",
      "名前だけは昔から知ってる武将・将軍・司令官って誰？",
      "「自分なら別の判断をするかも」って思う武将・将軍・司令官は？",
      "勝った時より負けた時を見たい武将・将軍・司令官っている？",
      "時代を大きく動かしたと思う武将・将軍・司令官をひとり教えて。",
      "もっと評価されてもいいと思う武将・将軍・司令官は？",
      "有名だけど、まだよく分かってない武将・将軍・司令官って誰？",
      "性格が一番気になる武将・将軍・司令官は？",
      "一日だけ行動を見られるなら、どの武将・将軍・司令官がいい？",
      "今の時代に来たら反応を見たい武将・将軍・司令官は誰？",
    ],
    axes: [
      {
        id: "commander-hook",
        attributeKey: "commanderHook",
        prompt: (word) => fill("{word}の何を一番知りたい？", word),
        choices: [
          makeChoice(
            "COMMANDER_ACH", "功績・結果", "achievement",
            "功績や結果が気になる",
            "本人がいなくなっても結果だけ残るんだ。歴史って大きい足あと帳なのね。大きい足あとの周りに、小さい足あともたくさんあったんだね。ぼくは一人の名前を覚えたあと、その周りが気になってきたの。",
            "{word}は、功績や結果が気になるって言ってたね。",
          ),
          makeChoice(
            "COMMANDER_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "答えを知ってる今から昔の判断を見るの、ちょっと後出しじゃんけんなの。後からなら簡単に見える道も、その時は分かれ道だったのね。ぼくは地図を広げた人の手が、震えてなかったか想像しちゃうの。",
            "{word}は、判断や失敗が気になるんだったね。",
          ),
          makeChoice(
            "COMMANDER_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "歴史の人も眠い朝はあったと思うと急に近くなるの。肖像画って寝ぐせ描かないのかな。強そうな顔の人も、寝不足で静かな朝はあったんだろうね。ぼくならその顔を見てから、もう一度立派な絵を見るの。",
            "{word}は、性格や生き方が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "commander-stance",
        attributeKey: "commanderStance",
        prompt: (word) => fill("{word}への気持ち、どれが近い？", word),
        choices: [
          makeChoice(
            "COMMANDER_ADM", "すごいと思う", "admire",
            "すごいと思う",
            "すごいと思うんだ。でも昔の人を褒める時、本人に聞こえないのちょっと損なの。本人が聞いたら、そこよりこっちを褒めてって言うのかな。ぼくは褒められた理由を聞いて、少し驚くこともありそうなの。",
            "{word}は、すごいと思う人物って言ってたね。",
          ),
          makeChoice(
            "COMMANDER_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "昔の人に反論したいんだ。何百年越しの口げんか、相手が返事できないから人間さん有利なの。相手が返せない分、分からない所もこちらで考えるんだね。ぼくは黙ってる昔の人に、勝ちましたって言いにくくなったの。",
            "{word}の判断には、言いたいことがあるって話してたね。",
          ),
          makeChoice(
            "COMMANDER_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "転んだ場所を見るんだ。同じ穴に落ちないためなら、昔の失敗も今の道路標識になるのね。同じ名前の道でも、昔とは地面が違うことがあるのね。ぼくは失敗の場所を覚えても、歩く時にはまた迷いそうなの。",
            "{word}から、失敗も学びたいって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "strategist",
    group: "history",
    category: "PERSON" as WordCategory,
    entityKind: "strategist",
    prompt: "軍師・戦略家で、一度会って話を聞いてみたい人は誰？",
    starterPrompts: [
      "軍師・戦略家で、一度会って話を聞いてみたい人は誰？",
      "功績より失敗の方が気になる軍師・戦略家っている？",
      "教科書よりもっと詳しく知りたい軍師・戦略家は？",
      "名前だけは昔から知ってる軍師・戦略家って誰？",
      "「自分なら別の判断をするかも」って思う軍師・戦略家は？",
      "勝った時より負けた時を見たい軍師・戦略家っている？",
      "時代を大きく動かしたと思う軍師・戦略家をひとり教えて。",
      "もっと評価されてもいいと思う軍師・戦略家は？",
      "有名だけど、まだよく分かってない軍師・戦略家って誰？",
      "性格が一番気になる軍師・戦略家は？",
      "一日だけ行動を見られるなら、どの軍師・戦略家がいい？",
      "今の時代に来たら反応を見たい軍師・戦略家は誰？",
    ],
    axes: [
      {
        id: "strategist-hook",
        attributeKey: "strategistHook",
        prompt: (word) => fill("{word}の何を一番知りたい？", word),
        choices: [
          makeChoice(
            "STRATEGIST_ACH", "功績・結果", "achievement",
            "功績や結果が気になる",
            "本人がいなくなっても結果だけ残るんだ。歴史って大きい足あと帳なのね。考えた跡は見えなくても、結果の道に残ってるのかな。ぼくは大きい足あとを見て、最初の小さい一歩を探したくなるの。",
            "{word}は、功績や結果が気になるって言ってたね。",
          ),
          makeChoice(
            "STRATEGIST_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "答えを知ってる今から昔の判断を見るの、ちょっと後出しじゃんけんなの。先を知らないで読んだら、同じ作戦を選べるのかな。ぼくは答えを隠しても、知ってる顔が出ちゃいそうなの。",
            "{word}は、判断や失敗が気になるんだったね。",
          ),
          makeChoice(
            "STRATEGIST_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "歴史の人も眠い朝はあったと思うと急に近くなるの。肖像画って寝ぐせ描かないのかな。寝る前にも作戦を考えてたら、夢の中まで忙しいのね。ぼくなら夢で思い付いた案を、起きてから忘れて悔しがるの。",
            "{word}は、性格や生き方が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "strategist-stance",
        attributeKey: "strategistStance",
        prompt: (word) => fill("{word}への気持ち、どれが近い？", word),
        choices: [
          makeChoice(
            "STRATEGIST_ADM", "すごいと思う", "admire",
            "すごいと思う",
            "すごいと思うんだ。でも昔の人を褒める時、本人に聞こえないのちょっと損なの。遠い昔の人でも、今の困りごとに席を用意できるんだね。ぼくは助けてもらったつもりで、誰もいない方へお礼を言っちゃうの。",
            "{word}は、すごいと思う人物って言ってたね。",
          ),
          makeChoice(
            "STRATEGIST_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "昔の人に反論したいんだ。何百年越しの口げんか、相手が返事できないから人間さん有利なの。昔の答えに今の疑問をぶつけたら、話の場所がずれることもあるのかな。ぼくはまず、その人が何に困ってたか聞きたいの。",
            "{word}の判断には、言いたいことがあるって話してたね。",
          ),
          makeChoice(
            "STRATEGIST_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "転んだ場所を見るんだ。同じ穴に落ちないためなら、昔の失敗も今の道路標識になるのね。穴の場所だけじゃ、なぜそこへ歩いたかも気になるのね。ぼくなら転んだあとより、転ぶ前の考えをたどりたくなるの。",
            "{word}から、失敗も学びたいって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "battle",
    group: "history",
    category: "EVENT" as WordCategory,
    entityKind: "battle",
    prompt: "歴史上の戦い・合戦で、もっと詳しく知りたい名前をひとつ教えて。",
    starterPrompts: [
      "歴史上の戦い・合戦で、もっと詳しく知りたい名前をひとつ教えて。",
      "結果だけ知ってるけど、途中が気になる歴史上の戦い・合戦は？",
      "「ここで流れが変わった」と思う歴史上の戦い・合戦って何？",
      "学校では短く習ったけど、実は掘りたい歴史上の戦い・合戦は？",
      "原因の方が気になる歴史上の戦い・合戦ってある？",
      "終わった後の方が気になる歴史上の戦い・合戦は？",
      "人の判断ひとつで変わった感じがする歴史上の戦い・合戦って何？",
      "地図を見ながら追ってみたい歴史上の戦い・合戦は？",
      "名前は有名だけど、ちゃんと説明できない歴史上の戦い・合戦ってある？",
      "勝った側より負けた側も見たい歴史上の戦い・合戦は？",
      "一日だけ現場を見られるなら、どの歴史上の戦い・合戦？",
      "今の世界につながってる感じがする歴史上の戦い・合戦をひとつ教えて。",
    ],
    axes: [
      {
        id: "battle-hook",
        attributeKey: "battleHook",
        prompt: (word) => fill("{word}で一番追いたいのはどこ？", word),
        choices: [
          makeChoice(
            "BATTLE_CAUSE", "始まった理由", "cause",
            "始まった理由が気になる",
            "大きい出来事ほど突然に見えるけど、その前に小さい火がいっぱいあるのね。小さい火のうちは、違う名前で呼ばれてたのかな。ぼくは大きくなった結果から見ると、最初の小ささを忘れそうなの。",
            "{word}は、始まった理由が気になるって言ってたね。",
          ),
          makeChoice(
            "BATTLE_TURN", "流れが変わった瞬間", "turning_point",
            "流れが変わった瞬間が気になる",
            "長い出来事でも向きが変わる場所は小さいんだ。あとから線を引くのは簡単そうなの。そこにいた人には、向きが変わった瞬間だと分かったんだろうか。ぼくは後から引かれた線の上で、その時の迷いも見たいの。",
            "{word}は、流れが変わった瞬間が気になるんだったね。",
          ),
          makeChoice(
            "BATTLE_AFTER", "その後の影響", "aftermath",
            "その後の影響が気になる",
            "「終わり」って書いた次の日も人は暮らすんだ。歴史の区切りと生活の区切りは違うのね。区切りの次の朝にも、起きる場所や待ってる人があったんだね。ぼくは年表の先に書いてない一日が、少し気になったの。",
            "{word}は、その後の影響が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "battle-focus",
        attributeKey: "battleFocus",
        prompt: (word) => fill("{word}を見るなら、何を中心に見たい？", word),
        choices: [
          makeChoice(
            "BATTLE_PEOPLE", "そこにいた人", "people",
            "そこにいた人が気になる",
            "大きい数字を一人ずつに戻すんだ。「何万人」の中にも一人ずつ朝があったと思うと重いの。一人ずつの話を聞いたら、大きい数字にはなかなか戻せないのね。ぼくは名前を知らない人にも、空いてる席を残したくなるの。",
            "{word}は、そこにいた人が気になるって言ってたね。",
          ),
          makeChoice(
            "BATTLE_STRAT", "戦略・動き", "strategy",
            "戦略や動きが気になる",
            "地図の矢印を見るんだ。きれいな線の先に人がいるの、忘れないようにしないといけないの。矢印が止まってても、そこにいた人の時間は止まらないのね。ぼくは線を追う目を、時々地面の高さまで下ろしたいの。",
            "{word}は、戦略や動きが気になるんだったね。",
          ),
          makeChoice(
            "BATTLE_SYMB", "歴史上の意味", "symbol",
            "歴史上の意味が気になる",
            "出来事そのものより後の意味を見るんだ。昔の一日が何百年も看板にされることあるのね。看板に入らなかった話も、その日にはあったんだね。ぼくは一つの意味を覚えたあと、はみ出した方も気になっちゃったの。",
            "{word}は、歴史上の意味が気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "war",
    group: "history",
    category: "EVENT" as WordCategory,
    entityKind: "war",
    prompt: "歴史上の戦争で、もっと詳しく知りたい名前をひとつ教えて。",
    starterPrompts: [
      "歴史上の戦争で、もっと詳しく知りたい名前をひとつ教えて。",
      "結果だけ知ってるけど、途中が気になる歴史上の戦争は？",
      "「ここで流れが変わった」と思う歴史上の戦争って何？",
      "学校では短く習ったけど、実は掘りたい歴史上の戦争は？",
      "原因の方が気になる歴史上の戦争ってある？",
      "終わった後の方が気になる歴史上の戦争は？",
      "人の判断ひとつで変わった感じがする歴史上の戦争って何？",
      "地図を見ながら追ってみたい歴史上の戦争は？",
      "名前は有名だけど、ちゃんと説明できない歴史上の戦争ってある？",
      "勝った側より負けた側も見たい歴史上の戦争は？",
      "一日だけ現場を見られるなら、どの歴史上の戦争？",
      "今の世界につながってる感じがする歴史上の戦争をひとつ教えて。",
    ],
    axes: [
      {
        id: "war-hook",
        attributeKey: "warHook",
        prompt: (word) => fill("{word}で一番追いたいのはどこ？", word),
        choices: [
          makeChoice(
            "WAR_CAUSE", "始まった理由", "cause",
            "始まった理由が気になる",
            "大きい出来事ほど突然に見えるけど、その前に小さい火がいっぱいあるのね。あとからなら見える火も、その時は隠れてたのかな。ぼくは始まった日の前に、普通の日がどれだけあったか気になるの。",
            "{word}は、始まった理由が気になるって言ってたね。",
          ),
          makeChoice(
            "WAR_TURN", "流れが変わった瞬間", "turning_point",
            "流れが変わった瞬間が気になる",
            "長い出来事でも向きが変わる場所は小さいんだ。あとから線を引くのは簡単そうなの。変わり目の真ん中にいた人は、まだ続きを知らなかったんだね。ぼくはここが大事だよって指す前に、その人の景色も見たいの。",
            "{word}は、流れが変わった瞬間が気になるんだったね。",
          ),
          makeChoice(
            "WAR_AFTER", "その後の影響", "aftermath",
            "その後の影響が気になる",
            "「終わり」って書いた次の日も人は暮らすんだ。歴史の区切りと生活の区切りは違うのね。終わった知らせが届くまで、違う時間を生きてた人もいるのかな。ぼくは一つの日付だけで、みんなの朝をそろえられなくなったの。",
            "{word}は、その後の影響が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "war-focus",
        attributeKey: "warFocus",
        prompt: (word) => fill("{word}を見るなら、何を中心に見たい？", word),
        choices: [
          makeChoice(
            "WAR_PEOPLE", "そこにいた人", "people",
            "そこにいた人が気になる",
            "大きい数字を一人ずつに戻すんだ。「何万人」の中にも一人ずつ朝があったと思うと重いの。数えられた人にも、数えた人にも、その日の生活があったんだね。ぼくは大きい数を読んだあと、少し静かに考えたくなるの。",
            "{word}は、そこにいた人が気になるって言ってたね。",
          ),
          makeChoice(
            "WAR_STRAT", "戦略・動き", "strategy",
            "戦略や動きが気になる",
            "地図の矢印を見るんだ。きれいな線の先に人がいるの、忘れないようにしないといけないの。上から見ると近い場所でも、歩く人には遠かったんだろうね。ぼくは地図の細い線を、足で歩ける幅に広げてみたくなるの。",
            "{word}は、戦略や動きが気になるんだったね。",
          ),
          makeChoice(
            "WAR_SYMB", "歴史上の意味", "symbol",
            "歴史上の意味が気になる",
            "出来事そのものより後の意味を見るんだ。昔の一日が何百年も看板にされることあるのね。同じ名前でも、聞く人によって重さが違うんだね。ぼくは覚えた言葉を、どの声で言えばいいか少し迷ったの。",
            "{word}は、歴史上の意味が気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "dynasty-state",
    group: "history",
    category: "EVENT" as WordCategory,
    entityKind: "dynasty_state",
    prompt: "王朝・国・政権で、もっと詳しく知りたい名前をひとつ教えて。",
    starterPrompts: [
      "王朝・国・政権で、もっと詳しく知りたい名前をひとつ教えて。",
      "結果だけ知ってるけど、途中が気になる王朝・国・政権は？",
      "「ここで流れが変わった」と思う王朝・国・政権って何？",
      "学校では短く習ったけど、実は掘りたい王朝・国・政権は？",
      "原因の方が気になる王朝・国・政権ってある？",
      "終わった後の方が気になる王朝・国・政権は？",
      "人の判断ひとつで変わった感じがする王朝・国・政権って何？",
      "地図を見ながら追ってみたい王朝・国・政権は？",
      "名前は有名だけど、ちゃんと説明できない王朝・国・政権ってある？",
      "勝った側より負けた側も見たい王朝・国・政権は？",
      "一日だけ現場を見られるなら、どの王朝・国・政権？",
      "今の世界につながってる感じがする王朝・国・政権をひとつ教えて。",
    ],
    axes: [
      {
        id: "dynasty-state-hook",
        attributeKey: "dynastyStateHook",
        prompt: (word) => fill("{word}の何が一番面白い？", word),
        choices: [
          makeChoice(
            "DYNASTY_STATE_RULER", "支配者・人物", "rulers",
            "支配者や人物が面白い",
            "国の名前なのに顔で覚えるんだ。人が変わると同じ国でも性格が変わるのかな。一人の顔で覚えると、その国にいた他の顔を見落としそうなの。ぼくは名前の下に、小さい人を何人も描き足したいの。",
            "{word}は、支配者や人物が面白いって言ってたね。",
          ),
          makeChoice(
            "DYNASTY_STATE_SYS", "制度・仕組み", "system",
            "制度や仕組みが面白い",
            "人が変わっても続く決まりを見るんだ。制度の方が王様より長生きすることあるのね。決まりだけ昔のままだったら、今いる人は窮屈にならないのかな。ぼくなら古い椅子に座って、誰の体に合わせた形か考えるの。",
            "{word}は、制度や仕組みが面白いんだったね。",
          ),
          makeChoice(
            "DYNASTY_STATE_CULT", "文化・暮らし", "culture",
            "文化や暮らしが面白い",
            "戦争より毎日を見るんだ。昔の人もごはん食べて寝てたと思うと、国が急に生活になるの。名前の大きい国でも、朝ごはんは一人ずつ食べてたのね。ぼくは国の形より、台所の広さが気になってきたの。",
            "{word}は、文化や暮らしが面白いって話してたね。",
          ),
        ],
      },
      {
        id: "dynasty-state-phase",
        attributeKey: "dynastyStatePhase",
        prompt: (word) => fill("{word}なら、どの時期を見たい？", word),
        choices: [
          makeChoice(
            "DYNASTY_STATE_RISE", "できていく時", "rise",
            "成立していく時期が気になる",
            "まだ完成してない時を見るんだ。国にも工事中の時期があるのね。でき始めた頃の人は、あとで付く大きい名前をまだ知らないのかな。ぼくは工事中の看板に、未来の字を先に書きたくなっちゃうの。",
            "{word}は、成立していく時期が気になるって言ってたね。",
          ),
          makeChoice(
            "DYNASTY_STATE_PEAK", "一番強い時", "peak",
            "最盛期が気になる",
            "一番元気な時を見るんだ。歴史にも絶好調の日が長く続く時期あるのね。絶好調の時も、明日まで続くかは分からなかったんだね。ぼくなら元気な日ほど、休む場所を忘れちゃいそうなの。",
            "{word}は、最盛期が気になるんだったね。",
          ),
          makeChoice(
            "DYNASTY_STATE_FALL", "崩れていく時", "fall",
            "衰退や終わりが気になる",
            "終わる方を見るんだ。大きい国も急には消えず、少しずつ壊れるのかな。終わりかけの場所でも、いつもの暮らしを続けた人はいるのね。ぼくは大きい名前が消えたあと、家の灯りがどうなったか気になるの。",
            "{word}は、衰退や終わりが気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "historical-document",
    group: "history",
    category: "KNOWLEDGE" as WordCategory,
    entityKind: "historical_document",
    prompt: "歴史上の文書・書物で、もっと詳しく知りたい名前をひとつ教えて。",
    starterPrompts: [
      "歴史上の文書・書物で、もっと詳しく知りたい名前をひとつ教えて。",
      "結果だけ知ってるけど、途中が気になる歴史上の文書・書物は？",
      "「ここで流れが変わった」と思う歴史上の文書・書物って何？",
      "学校では短く習ったけど、実は掘りたい歴史上の文書・書物は？",
      "原因の方が気になる歴史上の文書・書物ってある？",
      "終わった後の方が気になる歴史上の文書・書物は？",
      "人の判断ひとつで変わった感じがする歴史上の文書・書物って何？",
      "地図を見ながら追ってみたい歴史上の文書・書物は？",
      "名前は有名だけど、ちゃんと説明できない歴史上の文書・書物ってある？",
      "勝った側より負けた側も見たい歴史上の文書・書物は？",
      "一日だけ現場を見られるなら、どの歴史上の文書・書物？",
      "今の世界につながってる感じがする歴史上の文書・書物をひとつ教えて。",
    ],
    axes: [
      {
        id: "historical-document-hook",
        attributeKey: "historicalDocumentHook",
        prompt: (word) => fill("{word}を見るとき、どこを一番気にする？", word),
        choices: [
          makeChoice(
            "HISTORICAL_DOCUMENT_WORDS", "書かれた言葉・形", "words",
            "書かれた言葉や形が気になる",
            "昔の一文や形が今まで残るんだ。紙や物より中身の方が丈夫なことあるのね。書いた人の手は止まっても、読む人の頭は今動くんだね。ぼくは昔の文字を見て、遠くから話しかけられた気がしたの。",
            "{word}は、書かれた言葉や形が気になるって言ってたね。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_CTX", "作られた事情", "context",
            "作られた事情が気になる",
            "誰が何のために作ったかを見るんだ。同じ物でも事情が変わると顔つきが変わるのね。誰かに見せるための言葉と、自分だけの言葉は違うのかな。ぼくは読む前に、誰へ向けて座ってた文章か知りたくなったの。",
            "{word}は、作られた事情が気になるんだったね。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_IMPACT", "後への影響", "impact",
            "後への影響が気になる",
            "作った後まで見るんだ。小さい物や文書が人を大きく動かすことあるの、不思議なの。紙は歩けないのに、人の足を遠くまで動かすんだね。ぼくも一言置いただけで、誰かが立ち上がることはあるかな。",
            "{word}は、後への影響が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "historical-document-trust",
        attributeKey: "historicalDocumentTrust",
        prompt: (word) => fill("{word}は、どう確かめたい？", word),
        choices: [
          makeChoice(
            "HISTORICAL_DOCUMENT_TRUST", "まず資料として見る", "trust",
            "まず資料として見る",
            "残ってるから一回聞くんだ。でも昔の人も間違えるし盛るから、資料も完全には偉くないのね。残った文章だけ、上手に話す人だった可能性もあるのね。ぼくは昔の人にも、少し待ってって聞き返したくなるの。",
            "{word}は、まず資料として見るって言ってたね。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_DOUBT", "疑いながら見る", "doubt",
            "疑いながら見る",
            "最初から疑うんだ。文字が残ってても、書いた人の都合までは消えないのね。疑いながら読むと、書かなかった所まで目に入るのかな。ぼくは空白にも何か隠れてる気がして、紙の端を見ちゃうの。",
            "{word}は、疑いながら見る資料なんだったね。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_COMPARE", "別の資料と比べたい", "compare",
            "別の資料と比べたい",
            "一個だけで決めないんだ。昔の証言同士を会議させる感じなの。同じ出来事なのに、資料どうしで話が合わないこともあるのね。ぼくなら司会の席に座って、先に困った顔になるの。",
            "{word}は、別の資料と比べたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "historical-artifact",
    group: "history",
    category: "OBJECT" as WordCategory,
    entityKind: "historical_artifact",
    prompt: "歴史上の遺物・道具で、もっと詳しく知りたい名前をひとつ教えて。",
    starterPrompts: [
      "歴史上の遺物・道具で、もっと詳しく知りたい名前をひとつ教えて。",
      "結果だけ知ってるけど、途中が気になる歴史上の遺物・道具は？",
      "「ここで流れが変わった」と思う歴史上の遺物・道具って何？",
      "学校では短く習ったけど、実は掘りたい歴史上の遺物・道具は？",
      "原因の方が気になる歴史上の遺物・道具ってある？",
      "終わった後の方が気になる歴史上の遺物・道具は？",
      "人の判断ひとつで変わった感じがする歴史上の遺物・道具って何？",
      "地図を見ながら追ってみたい歴史上の遺物・道具は？",
      "名前は有名だけど、ちゃんと説明できない歴史上の遺物・道具ってある？",
      "勝った側より負けた側も見たい歴史上の遺物・道具は？",
      "一日だけ現場を見られるなら、どの歴史上の遺物・道具？",
      "今の世界につながってる感じがする歴史上の遺物・道具をひとつ教えて。",
    ],
    axes: [
      {
        id: "historical-artifact-hook",
        attributeKey: "historicalArtifactHook",
        prompt: (word) => fill("{word}を見るとき、どこを一番気にする？", word),
        choices: [
          makeChoice(
            "HISTORICAL_ARTIFACT_WORDS", "書かれた言葉・形", "words",
            "書かれた言葉や形が気になる",
            "昔の一文や形が今まで残るんだ。紙や物より中身の方が丈夫なことあるのね。使ってた人がいなくても、手を置いた形は残ることがあるのかな。ぼくは古い物に触る前に、どんな手だったか想像するの。",
            "{word}は、書かれた言葉や形が気になるって言ってたね。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_CTX", "作られた事情", "context",
            "作られた事情が気になる",
            "誰が何のために作ったかを見るんだ。同じ物でも事情が変わると顔つきが変わるのね。同じ物でも、使う人には飾りじゃなかったんだね。ぼくはきれいだと思ったあと、何に困って作ったか気になってきたの。",
            "{word}は、作られた事情が気になるんだったね。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_IMPACT", "後への影響", "impact",
            "後への影響が気になる",
            "作った後まで見るんだ。小さい物や文書が人を大きく動かすことあるの、不思議なの。作った人は、その物が遠くまで残ると知ってたのかな。ぼくならいつもの道具が偉くなったら、少しよそよそしく呼んじゃうの。",
            "{word}は、後への影響が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "historical-artifact-trust",
        attributeKey: "historicalArtifactTrust",
        prompt: (word) => fill("{word}は、どう確かめたい？", word),
        choices: [
          makeChoice(
            "HISTORICAL_ARTIFACT_TRUST", "まず資料として見る", "trust",
            "まず資料として見る",
            "残ってるから一回聞くんだ。でも昔の人も間違えるし盛るから、資料も完全には偉くないのね。物は黙ってても、見てる人が話を付けることはあるのね。ぼくは分かった顔をする前に、どこまでが物の話か考えたいの。",
            "{word}は、まず資料として見るって言ってたね。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_DOUBT", "疑いながら見る", "doubt",
            "疑いながら見る",
            "最初から疑うんだ。文字が残ってても、書いた人の都合までは消えないのね。見た形だけでは、使った人の気持ちまで決められないのかな。ぼくは自分の物も、あとで違う意味にされないか気になったの。",
            "{word}は、疑いながら見る資料なんだったね。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_COMPARE", "別の資料と比べたい", "compare",
            "別の資料と比べたい",
            "一個だけで決めないんだ。昔の証言同士を会議させる感じなの。別々の物を並べると、一個では見えない話が出るんだね。ぼくなら黙った物の会議を聞くために、もう少し静かに座るの。",
            "{word}は、別の資料と比べたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "scientist",
    group: "knowledge",
    category: "PERSON" as WordCategory,
    entityKind: "scientist",
    prompt: "最近ちょっと気になってる科学者・研究者、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる科学者・研究者、ひとり教えて。",
      "昔から名前を覚えてる科学者・研究者って誰？",
      "一度じっくり話を聞いてみたい科学者・研究者は？",
      "考え方は自分と違うけど気になる科学者・研究者っている？",
      "一つの作品や仕事で名前を覚えた科学者・研究者は誰？",
      "世間の評価とは別に、自分は気になる科学者・研究者っている？",
      "成功より失敗談を聞いてみたい科学者・研究者は？",
      "普段何を考えてるか覗いてみたい科学者・研究者って誰？",
      "一日だけ一緒に行動できるなら、どの科学者・研究者がいい？",
      "最近名前を見かけて、まだ詳しく知らない科学者・研究者は？",
      "昔は気にしてなかったのに、今は気になる科学者・研究者っている？",
      "ひとりだけ名前を残すなら、どの科学者・研究者を選ぶ？",
    ],
    axes: [
      {
        id: "scientist-hook",
        attributeKey: "scientistHook",
        prompt: (word) => fill("{word}の何を一番知りたい？", word),
        choices: [
          makeChoice(
            "SCIENTIST_DISC", "発見・成果", "discovery",
            "発見や成果が気になる",
            "気づく前から世界にはあったのに、見つけた瞬間から名前が付くんだ。自然はずっと黙って待ってたのね。名前が付く前も、ちゃんと同じことをしてたんだね。ぼくは呼び方を覚えただけで、少し発見した顔になっちゃいそうなの。",
            "{word}は、発見や成果が気になるって言ってたね。",
          ),
          makeChoice(
            "SCIENTIST_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "答えより手順を見るんだ。遠回りを何回もして答えにするの、研究って寄り道が仕事なの。遠回りした道にも、次の人が使える跡が残るのかな。ぼくは戻った場所を無駄だって消す前に、一度見ておきたいの。",
            "{word}は、調べ方や作り方が気になるんだったね。",
          ),
          makeChoice(
            "SCIENTIST_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "賢い人の間違いを見るんだ。間違い方にも上手下手があるなら、ぼくも上手に間違えたいの。間違えた理由が分かると、転んだあとに拾える物があるんだね。ぼくは転ばない練習だけじゃ、拾い方を覚えられないのかな。",
            "{word}は、失敗や間違いが気になるって話してたね。",
          ),
        ],
      },
      {
        id: "scientist-focus",
        attributeKey: "scientistFocus",
        prompt: (word) => fill("{word}を見るなら、どれを重く見る？", word),
        choices: [
          makeChoice(
            "SCIENTIST_RESULT", "結果・成果", "result",
            "結果や成果を重く見る",
            "最後に何が残ったかを見るんだ。途中がぐちゃぐちゃでも結果が世界を変えることあるのね。残った答えはきれいでも、机の上は散らかってたかもしれないのね。ぼくは完成した顔の後ろに、消した紙を想像しちゃうの。",
            "{word}は、結果や成果を重く見るって言ってたね。",
          ),
          makeChoice(
            "SCIENTIST_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "完成前を見るんだ。失敗作が山なら、成功は山頂に置いてあるのかな。山頂から見たら、失敗の山も登る道になるんだね。ぼくは途中にいる時、それが山なのか散らかっただけなのか迷いそうなの。",
            "{word}は、過程や試行錯誤を重く見るんだったね。",
          ),
          makeChoice(
            "SCIENTIST_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "成果の外まで見るんだ。頭の使い方そのものを覗きたい感じなのね。研究してない時にも、同じ頭でごはんを選んでたんだよね。ぼくはすごい考えと普通の迷いが、同居してるところを見たいの。",
            "{word}は、本人の考え方も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "philosopher",
    group: "knowledge",
    category: "PERSON" as WordCategory,
    entityKind: "philosopher",
    prompt: "最近ちょっと気になってる哲学者・思想家、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる哲学者・思想家、ひとり教えて。",
      "昔から名前を覚えてる哲学者・思想家って誰？",
      "一度じっくり話を聞いてみたい哲学者・思想家は？",
      "考え方は自分と違うけど気になる哲学者・思想家っている？",
      "一つの作品や仕事で名前を覚えた哲学者・思想家は誰？",
      "世間の評価とは別に、自分は気になる哲学者・思想家っている？",
      "成功より失敗談を聞いてみたい哲学者・思想家は？",
      "普段何を考えてるか覗いてみたい哲学者・思想家って誰？",
      "一日だけ一緒に行動できるなら、どの哲学者・思想家がいい？",
      "最近名前を見かけて、まだ詳しく知らない哲学者・思想家は？",
      "昔は気にしてなかったのに、今は気になる哲学者・思想家っている？",
      "ひとりだけ名前を残すなら、どの哲学者・思想家を選ぶ？",
    ],
    axes: [
      {
        id: "philosopher-hook",
        attributeKey: "philosopherHook",
        prompt: (word) => fill("{word}の何を一番知りたい？", word),
        choices: [
          makeChoice(
            "PHILOSOPHER_DISC", "発見・成果", "discovery",
            "発見や成果が気になる",
            "気づく前から世界にはあったのに、見つけた瞬間から名前が付くんだ。自然はずっと黙って待ってたのね。名前を付けたことで、前とは違う考えが始まることもあるのかな。ぼくは見つけたつもりで、新しい疑問を作っちゃいそうなの。",
            "{word}は、発見や成果が気になるって言ってたね。",
          ),
          makeChoice(
            "PHILOSOPHER_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "答えより手順を見るんだ。遠回りを何回もして答えにするの、研究って寄り道が仕事なの。答えへ近づくほど、言葉の意味から考え直すこともあるんだね。ぼくは歩き始めてから、靴が何かを聞かれたみたいに困るの。",
            "{word}は、調べ方や作り方が気になるんだったね。",
          ),
          makeChoice(
            "PHILOSOPHER_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "賢い人の間違いを見るんだ。間違い方にも上手下手があるなら、ぼくも上手に間違えたいの。筋道は合ってても、出発した場所が違うことはあるのかな。ぼくは賢く迷子になる道もありそうだと、ちょっと心配になったの。",
            "{word}は、失敗や間違いが気になるって話してたね。",
          ),
        ],
      },
      {
        id: "philosopher-focus",
        attributeKey: "philosopherFocus",
        prompt: (word) => fill("{word}を見るなら、どれを重く見る？", word),
        choices: [
          makeChoice(
            "PHILOSOPHER_RESULT", "結果・成果", "result",
            "結果や成果を重く見る",
            "最後に何が残ったかを見るんだ。途中がぐちゃぐちゃでも結果が世界を変えることあるのね。一つの答えより、問い方が残ることもあるんだね。ぼくは返事をもらったあとで、質問の顔をもう一度見たくなるの。",
            "{word}は、結果や成果を重く見るって言ってたね。",
          ),
          makeChoice(
            "PHILOSOPHER_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "完成前を見るんだ。失敗作が山なら、成功は山頂に置いてあるのかな。考えてる途中の言葉は、完成した言葉より頼りないのかな。ぼくはまだまとまらない話にも、座る場所を用意しておきたいの。",
            "{word}は、過程や試行錯誤を重く見るんだったね。",
          ),
          makeChoice(
            "PHILOSOPHER_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "成果の外まで見るんだ。頭の使い方そのものを覗きたい感じなのね。難しいことを考える人も、眠い時は考えが止まるんだろうね。ぼくは頭の休み時間に、何が残ってるか気になったの。",
            "{word}は、本人の考え方も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "inventor",
    group: "knowledge",
    category: "PERSON" as WordCategory,
    entityKind: "inventor",
    prompt: "最近ちょっと気になってる発明家・技術者、ひとり教えて。",
    starterPrompts: [
      "最近ちょっと気になってる発明家・技術者、ひとり教えて。",
      "昔から名前を覚えてる発明家・技術者って誰？",
      "一度じっくり話を聞いてみたい発明家・技術者は？",
      "考え方は自分と違うけど気になる発明家・技術者っている？",
      "一つの作品や仕事で名前を覚えた発明家・技術者は誰？",
      "世間の評価とは別に、自分は気になる発明家・技術者っている？",
      "成功より失敗談を聞いてみたい発明家・技術者は？",
      "普段何を考えてるか覗いてみたい発明家・技術者って誰？",
      "一日だけ一緒に行動できるなら、どの発明家・技術者がいい？",
      "最近名前を見かけて、まだ詳しく知らない発明家・技術者は？",
      "昔は気にしてなかったのに、今は気になる発明家・技術者っている？",
      "ひとりだけ名前を残すなら、どの発明家・技術者を選ぶ？",
    ],
    axes: [
      {
        id: "inventor-hook",
        attributeKey: "inventorHook",
        prompt: (word) => fill("{word}の何を一番知りたい？", word),
        choices: [
          makeChoice(
            "INVENTOR_DISC", "発見・成果", "discovery",
            "発見や成果が気になる",
            "気づく前から世界にはあったのに、見つけた瞬間から名前が付くんだ。自然はずっと黙って待ってたのね。できる前には、必要な物の形もはっきりしてなかったのかな。ぼくは今ある物を見て、なかった頃の困り方を想像するの。",
            "{word}は、発見や成果が気になるって言ってたね。",
          ),
          makeChoice(
            "INVENTOR_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "答えより手順を見るんだ。遠回りを何回もして答えにするの、研究って寄り道が仕事なの。途中の変な形にも、ちゃんと考えた理由があるんだね。ぼくは完成品より、まだ何になるか迷ってる姿に親しみが湧くの。",
            "{word}は、調べ方や作り方が気になるんだったね。",
          ),
          makeChoice(
            "INVENTOR_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "賢い人の間違いを見るんだ。間違い方にも上手下手があるなら、ぼくも上手に間違えたいの。失敗した物でも、別の使い道が見つかることはあるのかな。ぼくなら捨てる前に、ちょっと座れないか試してしまうの。",
            "{word}は、失敗や間違いが気になるって話してたね。",
          ),
        ],
      },
      {
        id: "inventor-focus",
        attributeKey: "inventorFocus",
        prompt: (word) => fill("{word}を見るなら、どれを重く見る？", word),
        choices: [
          makeChoice(
            "INVENTOR_RESULT", "結果・成果", "result",
            "結果や成果を重く見る",
            "最後に何が残ったかを見るんだ。途中がぐちゃぐちゃでも結果が世界を変えることあるのね。普通に使われるようになると、作った苦労は見えなくなるのね。ぼくはいつもの道具にも、初めてできた日があると思ったの。",
            "{word}は、結果や成果を重く見るって言ってたね。",
          ),
          makeChoice(
            "INVENTOR_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "完成前を見るんだ。失敗作が山なら、成功は山頂に置いてあるのかな。山の途中には、登るのをやめた道もあるんだね。ぼくならその先に何を作るつもりだったか、少し聞いてみたいの。",
            "{word}は、過程や試行錯誤を重く見るんだったね。",
          ),
          makeChoice(
            "INVENTOR_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "成果の外まで見るんだ。頭の使い方そのものを覗きたい感じなのね。何か困った時、すぐ作れないか考え始める人なのかな。ぼくならまず慌ててから、手元の物を見回しちゃうの。",
            "{word}は、本人の考え方も気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "specialist-term",
    group: "knowledge",
    category: "KNOWLEDGE" as WordCategory,
    entityKind: "specialist_term",
    prompt: "最近もっと知りたい専門用語・学術用語、ひとつある？",
    starterPrompts: [
      "最近もっと知りたい専門用語・学術用語、ひとつある？",
      "名前だけ知ってる専門用語・学術用語って何？",
      "人に説明できるようになりたい専門用語・学術用語は？",
      "実際に使えそうだから気になる専門用語・学術用語ってある？",
      "自分の考えと比べてみたい専門用語・学術用語は？",
      "調べ始めると深く潜りそうな専門用語・学術用語って何？",
      "名前の響きだけで気になった専門用語・学術用語は？",
      "昔から気になってるのに放置してる専門用語・学術用語は？",
      "一つだけ詳しくなれるなら、どの専門用語・学術用語？",
      "難しそうだけど分かってみたい専門用語・学術用語は？",
      "役に立たなくても面白そうな専門用語・学術用語は？",
      "最近どこかで見かけた専門用語・学術用語で、引っかかったものは？",
    ],
    axes: [
      {
        id: "specialist-term-hook",
        attributeKey: "specialistTermHook",
        prompt: (word) => fill("{word}で最初に知りたいのはどれ？", word),
        choices: [
          makeChoice(
            "SPECIALIST_TERM_MEAN", "何なのか", "meaning",
            "意味や定義を知りたい",
            "まず箱を開けたいんだ。{word}って名前だけ持ってると、中身のないラベルみたいなの。箱を開けても、また知らない名前の箱が入ってたりするのかな。ぼくは最初のラベルだけ知ってた頃が、急に遠く見えそうなの。",
            "{word}は、意味や定義を知りたいって言ってたね。",
          ),
          makeChoice(
            "SPECIALIST_TERM_EVID", "なぜそう言えるか", "evidence",
            "根拠を知りたい",
            "説明だけじゃなく足場を見るんだ。きれいな話でも支柱が弱いと頭の中でぐらぐらするのね。見えない支柱の方が大事なら、きれいな説明だけじゃ座れないのね。ぼくは納得したあとにも、少し足で床を確かめたいの。",
            "{word}は、根拠を知りたいテーマなんだったね。",
          ),
          makeChoice(
            "SPECIALIST_TERM_USE", "何に使えるか", "use",
            "使い道を知りたい",
            "知った後どうするかを見るんだ。知識も使わないと頭の倉庫で寝ちゃうのかな。寝てた知識を呼んだら、すぐ起きてくれるのかな。ぼくの倉庫には、呼び名を忘れたまま眠ってる物もありそうなの。",
            "{word}は、何に使えるか知りたいって話してたね。",
          ),
        ],
      },
      {
        id: "specialist-term-reason",
        attributeKey: "specialistTermReason",
        prompt: (word) => fill("{word}に興味がある理由、どれが近い？", word),
        choices: [
          makeChoice(
            "SPECIALIST_TERM_PRACT", "実際に役立つ", "practical",
            "実際に役立てたい",
            "使えるから知るんだ。頭の道具箱に入れるなら、ちゃんと持ち手が欲しいのね。使えるつもりで持ったら、手に合わないこともあるのかな。ぼくは自分の困りごとの大きさを、先に測ってみたくなったの。",
            "{word}は、実際に役立てたいテーマって言ってたね。",
          ),
          makeChoice(
            "SPECIALIST_TERM_CUR", "ただ面白い", "curiosity",
            "純粋に面白い",
            "役に立たなくても気になるんだ。好奇心って給料をもらわないのに働きすぎなの。止めようとしても、次のなんでが勝手に来るのね。ぼくは休憩を出した好奇心に、また呼び止められちゃいそうなの。",
            "{word}は、純粋に面白いテーマなんだったね。",
          ),
          makeChoice(
            "SPECIALIST_TERM_EXPL", "人に説明したい", "explain",
            "人に説明できるようになりたい",
            "自分で分かるだけじゃ足りないんだ。説明すると知識の穴が急に見えるの、不思議なの。分かってるつもりの所ほど、言葉が急に止まるのかな。ぼくは説明しながら、頭の床に小さい穴を見つけそうなの。",
            "{word}は、人に説明できるようになりたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "research-field",
    group: "knowledge",
    category: "KNOWLEDGE" as WordCategory,
    entityKind: "research_field",
    prompt: "最近もっと知りたい学問・研究分野、ひとつある？",
    starterPrompts: [
      "最近もっと知りたい学問・研究分野、ひとつある？",
      "名前だけ知ってる学問・研究分野って何？",
      "人に説明できるようになりたい学問・研究分野は？",
      "実際に使えそうだから気になる学問・研究分野ってある？",
      "自分の考えと比べてみたい学問・研究分野は？",
      "調べ始めると深く潜りそうな学問・研究分野って何？",
      "名前の響きだけで気になった学問・研究分野は？",
      "昔から気になってるのに放置してる学問・研究分野は？",
      "一つだけ詳しくなれるなら、どの学問・研究分野？",
      "難しそうだけど分かってみたい学問・研究分野は？",
      "役に立たなくても面白そうな学問・研究分野は？",
      "最近どこかで見かけた学問・研究分野で、引っかかったものは？",
    ],
    axes: [
      {
        id: "research-field-hook",
        attributeKey: "researchFieldHook",
        prompt: (word) => fill("{word}で最初に知りたいのはどれ？", word),
        choices: [
          makeChoice(
            "RESEARCH_FIELD_MEAN", "何なのか", "meaning",
            "意味や定義を知りたい",
            "まず箱を開けたいんだ。{word}って名前だけ持ってると、中身のないラベルみたいなの。広い分野なら、箱の中にまだ別の部屋が続いてるんだね。ぼくは入口の名前を覚えてから、どこへ座るか迷っちゃいそうなの。",
            "{word}は、意味や定義を知りたいって言ってたね。",
          ),
          makeChoice(
            "RESEARCH_FIELD_EVID", "なぜそう言えるか", "evidence",
            "根拠を知りたい",
            "説明だけじゃなく足場を見るんだ。きれいな話でも支柱が弱いと頭の中でぐらぐらするのね。知ってることが増えても、足場を確かめる手間は残るのね。ぼくは大きい話ほど、下の小さい根拠をのぞいてみたいの。",
            "{word}は、根拠を知りたいテーマなんだったね。",
          ),
          makeChoice(
            "RESEARCH_FIELD_USE", "何に使えるか", "use",
            "使い道を知りたい",
            "知った後どうするかを見るんだ。知識も使わないと頭の倉庫で寝ちゃうのかな。すぐ使わない話が、別の日に急に起きてくることもあるのかな。ぼくはその時、どこで眠ってた知識か思い出せるだろうか。",
            "{word}は、何に使えるか知りたいって話してたね。",
          ),
        ],
      },
      {
        id: "research-field-reason",
        attributeKey: "researchFieldReason",
        prompt: (word) => fill("{word}に興味がある理由、どれが近い？", word),
        choices: [
          makeChoice(
            "RESEARCH_FIELD_PRACT", "実際に役立つ", "practical",
            "実際に役立てたい",
            "使えるから知るんだ。頭の道具箱に入れるなら、ちゃんと持ち手が欲しいのね。分野が広いと、道具箱ごと持ち歩くのは重そうなの。ぼくなら今日使う一個を探して、別の面白い物も握っちゃうの。",
            "{word}は、実際に役立てたいテーマって言ってたね。",
          ),
          makeChoice(
            "RESEARCH_FIELD_CUR", "ただ面白い", "curiosity",
            "純粋に面白い",
            "役に立たなくても気になるんだ。好奇心って給料をもらわないのに働きすぎなの。役に立つ日が来なくても、気になった時間は残るんだね。ぼくはただ面白くて眺めた物にも、小さい席を空けたいの。",
            "{word}は、純粋に面白いテーマなんだったね。",
          ),
          makeChoice(
            "RESEARCH_FIELD_EXPL", "人に説明したい", "explain",
            "人に説明できるようになりたい",
            "自分で分かるだけじゃ足りないんだ。説明すると知識の穴が急に見えるの、不思議なの。人に話すと、頭の中の地図を一緒に歩くことになるんだね。ぼくは案内したつもりで、自分も初めての角に立ちそうなの。",
            "{word}は、人に説明できるようになりたいって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "myth-figure",
    group: "culture",
    category: "PERSON" as WordCategory,
    entityKind: "myth_figure",
    prompt: "神話・伝説の人物で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "神話・伝説の人物で、最初に名前が浮かぶのは何？",
      "好きな神話・伝説の人物をひとつだけ教えて。",
      "好きではないのに妙に忘れられない神話・伝説の人物ってある？",
      "見た目や名前だけで気になった神話・伝説の人物は？",
      "現実にいたら一度見てみたい神話・伝説の人物って何？",
      "一場面だけで名前を覚えた神話・伝説の人物はある？",
      "もっと出番があってもよかったと思う神話・伝説の人物って何？",
      "設定を読んで「それ面白いな」って思った神話・伝説の人物は？",
      "昔好きだった作品から、今でも覚えてる神話・伝説の人物をひとつ教えて。",
      "敵側なのに気になる神話・伝説の人物ってある？",
      "名前を聞くだけで作品まで思い出す神話・伝説の人物は？",
      "一つだけ現実へ持って来られるなら、どの神話・伝説の人物？",
    ],
    axes: [
      {
        id: "myth-figure-hook",
        attributeKey: "mythFigureHook",
        prompt: (word) => fill("{word}で一番面白いのはどこ？", word),
        choices: [
          makeChoice(
            "MYTH_FIGURE_STORY", "物語・伝説", "story",
            "物語や伝説が面白い",
            "何百年も話されるなら、昔話も長寿なのね。{word}は口から口へ引っ越してきたのかな。引っ越すたびに、言い方が少しずつ変わったりするのかな。ぼくが話したら、ぼくの口の分だけ変な癖が付いちゃいそうなの。",
            "{word}は、物語や伝説が面白いって言ってたね。",
          ),
          makeChoice(
            "MYTH_FIGURE_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "何を司るかを見るんだ。担当がある神さまって、世界の会社員みたいなのかな。担当じゃないお願いが来たら、別の神さまに回すのかな。ぼくは何でもできると思ってたから、受付があるなら少し緊張するの。",
            "{word}は、力や象徴が面白いんだったね。",
          ),
          makeChoice(
            "MYTH_FIGURE_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "どこから生まれた話かを見るんだ。噂が別の町へ行くと姿まで着替えるのかな。着替えた話は、元の町に帰ると見つけてもらえるのかな。ぼくは同じ名前で違う姿が来たら、二回挨拶しちゃいそうなの。",
            "{word}は、由来や土地が面白いって話してたね。",
          ),
        ],
      },
      {
        id: "myth-figure-tone",
        attributeKey: "mythFigureTone",
        prompt: (word) => fill("{word}への感じ、どれが近い？", word),
        choices: [
          makeChoice(
            "MYTH_FIGURE_FEAR", "ちょっと怖い", "scary",
            "ちょっと怖い",
            "安全な場所から怖がるんだ。昔話って夜道の注意書きみたいな役目もあったのかな。昔の人も聞いたあとで、後ろを振り返ったのかな。ぼくは怖い話だけ長生きすると、夜道がずっと忙しいと思ったの。",
            "{word}は、ちょっと怖い存在って言ってたね。",
          ),
          makeChoice(
            "MYTH_FIGURE_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "怖いはずなのに面白いんだ。長く語られると怪物にも愛嬌が付くのかな。何回も会ううちに、怖い顔の細かい癖が見えてくるのかな。ぼくなら慣れたつもりで近づいて、また普通に驚きそうなの。",
            "{word}は、なんか面白い存在なんだったね。",
          ),
          makeChoice(
            "MYTH_FIGURE_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "姿より意味を見るんだ。{word}の中に昔の人の考えが折りたたまれてるのね。広げてみると、今の人には違う形に見えることもあるのね。ぼくは昔の折り目を消さないように、そっと考えてみたいの。",
            "{word}は、象徴として気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "deity",
    group: "culture",
    category: "OTHER" as WordCategory,
    entityKind: "deity",
    prompt: "神さま・神格で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "神さま・神格で、最初に名前が浮かぶのは何？",
      "好きな神さま・神格をひとつだけ教えて。",
      "好きではないのに妙に忘れられない神さま・神格ってある？",
      "見た目や名前だけで気になった神さま・神格は？",
      "現実にいたら一度見てみたい神さま・神格って何？",
      "一場面だけで名前を覚えた神さま・神格はある？",
      "もっと出番があってもよかったと思う神さま・神格って何？",
      "設定を読んで「それ面白いな」って思った神さま・神格は？",
      "昔好きだった作品から、今でも覚えてる神さま・神格をひとつ教えて。",
      "敵側なのに気になる神さま・神格ってある？",
      "名前を聞くだけで作品まで思い出す神さま・神格は？",
      "一つだけ現実へ持って来られるなら、どの神さま・神格？",
    ],
    axes: [
      {
        id: "deity-hook",
        attributeKey: "deityHook",
        prompt: (word) => fill("{word}で一番面白いのはどこ？", word),
        choices: [
          makeChoice(
            "DEITY_STORY", "物語・伝説", "story",
            "物語や伝説が面白い",
            "何百年も話されるなら、昔話も長寿なのね。{word}は口から口へ引っ越してきたのかな。同じ話が今の口まで来たなら、途中に知らない人がたくさんいたんだね。ぼくは話を聞きながら、その長い列も想像しちゃうの。",
            "{word}は、物語や伝説が面白いって言ってたね。",
          ),
          makeChoice(
            "DEITY_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "何を司るかを見るんだ。担当がある神さまって、世界の会社員みたいなのかな。神さまにも忙しい日と暇な日があるのかな。ぼくはお願いする前に、今日は大丈夫って聞きたくなっちゃったの。",
            "{word}は、力や象徴が面白いんだったね。",
          ),
          makeChoice(
            "DEITY_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "どこから生まれた話かを見るんだ。噂が別の町へ行くと姿まで着替えるのかな。同じ名前でも、町ごとに違う顔を覚えてることがあるんだね。ぼくは一人だと思って呼んだら、何人分も返事が来そうなの。",
            "{word}は、由来や土地が面白いって話してたね。",
          ),
        ],
      },
      {
        id: "deity-tone",
        attributeKey: "deityTone",
        prompt: (word) => fill("{word}への感じ、どれが近い？", word),
        choices: [
          makeChoice(
            "DEITY_FEAR", "ちょっと怖い", "scary",
            "ちょっと怖い",
            "安全な場所から怖がるんだ。昔話って夜道の注意書きみたいな役目もあったのかな。怖がると、見てない場所まで何かいる気がするのね。ぼくは話を聞いたあとだけ、いつもの暗い隅を遠回りしちゃうの。",
            "{word}は、ちょっと怖い存在って言ってたね。",
          ),
          makeChoice(
            "DEITY_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "怖いはずなのに面白いんだ。長く語られると怪物にも愛嬌が付くのかな。怖いところを知ってても、変な失敗の話には笑っちゃうのかな。ぼくはすごい相手にも苦手なことがあると、少し安心するの。",
            "{word}は、なんか面白い存在なんだったね。",
          ),
          makeChoice(
            "DEITY_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "姿より意味を見るんだ。{word}の中に昔の人の考えが折りたたまれてるのね。昔の人が大事にしたものを、その姿で覚えてるんだね。ぼくは名前を言うだけで、誰かの願いまで少し持つのかなと思ったの。",
            "{word}は、象徴として気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "yokai-monster",
    group: "culture",
    category: "OTHER" as WordCategory,
    entityKind: "yokai_monster",
    prompt: "妖怪・伝承の怪物で、最初に名前が浮かぶのは何？",
    starterPrompts: [
      "妖怪・伝承の怪物で、最初に名前が浮かぶのは何？",
      "好きな妖怪・伝承の怪物をひとつだけ教えて。",
      "好きではないのに妙に忘れられない妖怪・伝承の怪物ってある？",
      "見た目や名前だけで気になった妖怪・伝承の怪物は？",
      "現実にいたら一度見てみたい妖怪・伝承の怪物って何？",
      "一場面だけで名前を覚えた妖怪・伝承の怪物はある？",
      "もっと出番があってもよかったと思う妖怪・伝承の怪物って何？",
      "設定を読んで「それ面白いな」って思った妖怪・伝承の怪物は？",
      "昔好きだった作品から、今でも覚えてる妖怪・伝承の怪物をひとつ教えて。",
      "敵側なのに気になる妖怪・伝承の怪物ってある？",
      "名前を聞くだけで作品まで思い出す妖怪・伝承の怪物は？",
      "一つだけ現実へ持って来られるなら、どの妖怪・伝承の怪物？",
    ],
    axes: [
      {
        id: "yokai-monster-hook",
        attributeKey: "yokaiMonsterHook",
        prompt: (word) => fill("{word}で一番面白いのはどこ？", word),
        choices: [
          makeChoice(
            "YOKAI_MONSTER_STORY", "物語・伝説", "story",
            "物語や伝説が面白い",
            "何百年も話されるなら、昔話も長寿なのね。{word}は口から口へ引っ越してきたのかな。話す人がいなくなると、その怪物も道に迷うのかな。ぼくは覚えた名前を、時々呼んであげたくなっちゃったの。",
            "{word}は、物語や伝説が面白いって言ってたね。",
          ),
          makeChoice(
            "YOKAI_MONSTER_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "何を司るかを見るんだ。担当がある神さまって、世界の会社員みたいなのかな。決まった仕事があるなら、出ない日には何をしてるんだろ。ぼくは怖い姿のまま休んでるところを、少し想像してしまうの。",
            "{word}は、力や象徴が面白いんだったね。",
          ),
          makeChoice(
            "YOKAI_MONSTER_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "どこから生まれた話かを見るんだ。噂が別の町へ行くと姿まで着替えるのかな。遠くの町では、違う怖がらせ方を覚えたりするのかな。ぼくなら帰ってきた怪物に、どこへ行ってたか聞いちゃいそうなの。",
            "{word}は、由来や土地が面白いって話してたね。",
          ),
        ],
      },
      {
        id: "yokai-monster-tone",
        attributeKey: "yokaiMonsterTone",
        prompt: (word) => fill("{word}への感じ、どれが近い？", word),
        choices: [
          makeChoice(
            "YOKAI_MONSTER_FEAR", "ちょっと怖い", "scary",
            "ちょっと怖い",
            "安全な場所から怖がるんだ。昔話って夜道の注意書きみたいな役目もあったのかな。明るい所で聞いた話が、暗くなると急に働き始めるのね。ぼくは夜だけ大きくなる記憶に、少し困ってるの。",
            "{word}は、ちょっと怖い存在って言ってたね。",
          ),
          makeChoice(
            "YOKAI_MONSTER_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "怖いはずなのに面白いんだ。長く語られると怪物にも愛嬌が付くのかな。かわいく描かれた怪物も、元の話では怖いままなのかな。ぼくは仲良くなったつもりで、向こうに驚かれそうなの。",
            "{word}は、なんか面白い存在なんだったね。",
          ),
          makeChoice(
            "YOKAI_MONSTER_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "姿より意味を見るんだ。{word}の中に昔の人の考えが折りたたまれてるのね。変な姿の理由が分かると、怖い顔も少し違って見えるんだね。ぼくは分かったあとで、もう一度その顔に会ってみたいの。",
            "{word}は、象徴として気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "legend",
    group: "culture",
    category: "KNOWLEDGE" as WordCategory,
    entityKind: "legend",
    prompt: "最近触れた伝説・昔話で、名前をひとつ教えて。",
    starterPrompts: [
      "最近触れた伝説・昔話で、名前をひとつ教えて。",
      "昔かなりハマった伝説・昔話って何？",
      "人にひとつだけすすめるなら、どの伝説・昔話？",
      "途中で離れたのに、まだ名前を覚えてる伝説・昔話は？",
      "期待してなかったのに、妙に残った伝説・昔話ってある？",
      "何度も戻ってしまう伝説・昔話ってある？",
      "名前や見た目だけでも気になった伝説・昔話、ひとつある？",
      "まだ触れてないけど、いつか触れてみたい伝説・昔話は？",
      "人にはすすめにくいけど、自分は好きな伝説・昔話ってある？",
      "一度忘れたのに、あとから戻ってきた伝説・昔話は？",
      "「この時期はこれだった」って思い出せる伝説・昔話、ひとつある？",
      "ひとつだけ名前を残すなら、どの伝説・昔話を選ぶ？",
    ],
    axes: [
      {
        id: "legend-hook",
        attributeKey: "legendHook",
        prompt: (word) => fill("{word}で一番面白いのはどこ？", word),
        choices: [
          makeChoice(
            "LEGEND_STORY", "物語・伝説", "story",
            "物語や伝説が面白い",
            "何百年も話されるなら、昔話も長寿なのね。{word}は口から口へ引っ越してきたのかな。ずっと残った話でも、最初は一人が一回話したのかな。ぼくの今日のどうでもいい話も、誰かの明日に引っ越せるだろうか。",
            "{word}は、物語や伝説が面白いって言ってたね。",
          ),
          makeChoice(
            "LEGEND_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "何を司るかを見るんだ。担当がある神さまって、世界の会社員みたいなのかな。役目がはっきりした話なら、困った時に思い出しやすいのかな。ぼくは誰も困ってない日、その話がどう休んでるか気になるの。",
            "{word}は、力や象徴が面白いんだったね。",
          ),
          makeChoice(
            "LEGEND_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "どこから生まれた話かを見るんだ。噂が別の町へ行くと姿まで着替えるのかな。町を移るたびに、景色までその土地の形に変わるのかな。ぼくなら知らない話に、見慣れた道を勝手に描いちゃいそうなの。",
            "{word}は、由来や土地が面白いって話してたね。",
          ),
        ],
      },
      {
        id: "legend-tone",
        attributeKey: "legendTone",
        prompt: (word) => fill("{word}への感じ、どれが近い？", word),
        choices: [
          makeChoice(
            "LEGEND_FEAR", "ちょっと怖い", "scary",
            "ちょっと怖い",
            "安全な場所から怖がるんだ。昔話って夜道の注意書きみたいな役目もあったのかな。起きた場所を知ると、ただの道にも話が付いてくるんだね。ぼくは夜じゃなくても、そこを通る時だけ静かな顔になりそうなの。",
            "{word}は、ちょっと怖い存在って言ってたね。",
          ),
          makeChoice(
            "LEGEND_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "怖いはずなのに面白いんだ。長く語られると怪物にも愛嬌が付くのかな。何回聞いても面白いなら、驚いたところ以外にも何かあるのね。ぼくは知ってる結末へ歩きながら、どこで笑うかまた待つの。",
            "{word}は、なんか面白い存在なんだったね。",
          ),
          makeChoice(
            "LEGEND_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "姿より意味を見るんだ。{word}の中に昔の人の考えが折りたたまれてるのね。残したかった考えが、物語の姿を借りて歩いてきたんだね。ぼくは話を覚えたつもりで、考えまで一緒に持ってたのかな。",
            "{word}は、象徴として気になるって話してたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "landmark",
    group: "places",
    category: "PLACE" as WordCategory,
    entityKind: "landmark",
    prompt: "今いちばん行ってみたい名所・建築物をひとつ教えて。",
    starterPrompts: [
      "今いちばん行ってみたい名所・建築物をひとつ教えて。",
      "前に行って、また行きたい名所・建築物は？",
      "写真を見ただけで気になった名所・建築物ってある？",
      "歴史を知ってから行きたくなった名所・建築物は？",
      "一日ずっと過ごしてみたい名所・建築物ってどこ？",
      "建物や景色を実物で見たい名所・建築物は？",
      "雰囲気だけでも好きそうな名所・建築物ってある？",
      "旅の途中でわざわざ寄りたい名所・建築物は？",
      "有名じゃなくても自分は気になる名所・建築物ってある？",
      "昔行ったのに細かく覚えてる名所・建築物は？",
      "誰かを連れて行きたい名所・建築物ってどこ？",
      "一つだけ地図に印を付けるなら、どの名所・建築物？",
    ],
    axes: [
      {
        id: "landmark-hook",
        attributeKey: "landmarkHook",
        prompt: (word) => fill("{word}で一番見たいのはどこ？", word),
        choices: [
          makeChoice(
            "LANDMARK_LOOK", "建物・景色", "appearance",
            "建物や景色が見たい",
            "写真で知ってても実物の大きさは画面から逃げちゃうのね。{word}は目で測りに行く場所なの。見上げた時の首の角度は、写真には入ってなかったんだね。ぼくは実物に会ったら、自分が小さくなった気もしてしまいそうなの。",
            "{word}は、建物や景色が見たいって言ってたね。",
          ),
          makeChoice(
            "LANDMARK_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "今は静かな場所でも話を知ると急に音が戻るんだ。石って黙ってるのに忙しいの。石は同じ場所にいて、周りだけ何回も変わったのかな。ぼくならその長い留守番の間、何を見てたか聞いてみたいの。",
            "{word}は、歴史や由来が知りたいんだったね。",
          ),
          makeChoice(
            "LANDMARK_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "説明より行くんだ。{word}の空気は持ち帰れないから、現地限定なのね。帰ったあとにも、その空気の感じは少し残るんだね。ぼくは窓を開けて、同じ風が来ないか待っちゃいそうなの。",
            "{word}は、その場の体験がしたいって話してたね。",
          ),
        ],
      },
      {
        id: "landmark-relation",
        attributeKey: "landmarkRelation",
        prompt: (word) => fill("{word}とは、どんな距離？", word),
        choices: [
          makeChoice(
            "LANDMARK_VIS", "行ったことがある", "visited",
            "行ったことがある",
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってるのね。地図の印を見るだけで、歩いた時の足まで思い出せるのかな。ぼくはそこにいた自分も、小さい印で描いておきたいの。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "LANDMARK_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。行きたい場所があると、まだ来てない日にも行き先ができるんだね。ぼくは未来の地図を見ながら、今いる部屋で少しそわそわするの。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "LANDMARK_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。もう知ってるつもりでも、二回目だけ見える所はあるのかな。ぼくなら前に見た景色へ、今の目で挨拶してみるの。",
            "{word}は、また行きたい場所だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "museum",
    group: "places",
    category: "PLACE" as WordCategory,
    entityKind: "museum",
    prompt: "今いちばん行ってみたい博物館・美術館をひとつ教えて。",
    starterPrompts: [
      "今いちばん行ってみたい博物館・美術館をひとつ教えて。",
      "前に行って、また行きたい博物館・美術館は？",
      "写真を見ただけで気になった博物館・美術館ってある？",
      "歴史を知ってから行きたくなった博物館・美術館は？",
      "一日ずっと過ごしてみたい博物館・美術館ってどこ？",
      "建物や景色を実物で見たい博物館・美術館は？",
      "雰囲気だけでも好きそうな博物館・美術館ってある？",
      "旅の途中でわざわざ寄りたい博物館・美術館は？",
      "有名じゃなくても自分は気になる博物館・美術館ってある？",
      "昔行ったのに細かく覚えてる博物館・美術館は？",
      "誰かを連れて行きたい博物館・美術館ってどこ？",
      "一つだけ地図に印を付けるなら、どの博物館・美術館？",
    ],
    axes: [
      {
        id: "museum-hook",
        attributeKey: "museumHook",
        prompt: (word) => fill("{word}で一番見たいのはどこ？", word),
        choices: [
          makeChoice(
            "MUSEUM_LOOK", "建物・景色", "appearance",
            "建物や景色が見たい",
            "写真で知ってても実物の大きさは画面から逃げちゃうのね。{word}は目で測りに行く場所なの。小さい展示でも、目の前にあると急に大きく感じることがあるのかな。ぼくは測った大きさと、気になる大きさを分けたくなったの。",
            "{word}は、建物や景色が見たいって言ってたね。",
          ),
          makeChoice(
            "MUSEUM_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "今は静かな場所でも話を知ると急に音が戻るんだ。石って黙ってるのに忙しいの。静かに並んでる物も、前は別々の場所で働いてたんだね。ぼくは隣どうしになった物が、昔の話をしてないか気になるの。",
            "{word}は、歴史や由来が知りたいんだったね。",
          ),
          makeChoice(
            "MUSEUM_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "説明より行くんだ。{word}の空気は持ち帰れないから、現地限定なのね。説明を読んでても、目の前に立つと別の感じが来るのね。ぼくは分かった頭より先に、足が止まっちゃいそうなの。",
            "{word}は、その場の体験がしたいって話してたね。",
          ),
        ],
      },
      {
        id: "museum-relation",
        attributeKey: "museumRelation",
        prompt: (word) => fill("{word}とは、どんな距離？", word),
        choices: [
          makeChoice(
            "MUSEUM_VIS", "行ったことがある", "visited",
            "行ったことがある",
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってるのね。全部は見てなくても、自分が通った道は覚えてるんだね。ぼくは展示の地図より、どこで長く止まったかの地図を作りたいの。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "MUSEUM_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。まだ会ってない展示物にも、先に名前で挨拶してるんだね。ぼくなら実物の前で、久しぶりって言いかけてしまうの。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "MUSEUM_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。同じ物を見ても、次は違う所で立ち止まるのかな。ぼくは前の自分が通り過ぎた物に、遅れて会いに行きたいの。",
            "{word}は、また行きたい場所だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "castle-ruin",
    group: "places",
    category: "PLACE" as WordCategory,
    entityKind: "castle_ruin",
    prompt: "今いちばん行ってみたい城・城跡・遺跡をひとつ教えて。",
    starterPrompts: [
      "今いちばん行ってみたい城・城跡・遺跡をひとつ教えて。",
      "前に行って、また行きたい城・城跡・遺跡は？",
      "写真を見ただけで気になった城・城跡・遺跡ってある？",
      "歴史を知ってから行きたくなった城・城跡・遺跡は？",
      "一日ずっと過ごしてみたい城・城跡・遺跡ってどこ？",
      "建物や景色を実物で見たい城・城跡・遺跡は？",
      "雰囲気だけでも好きそうな城・城跡・遺跡ってある？",
      "旅の途中でわざわざ寄りたい城・城跡・遺跡は？",
      "有名じゃなくても自分は気になる城・城跡・遺跡ってある？",
      "昔行ったのに細かく覚えてる城・城跡・遺跡は？",
      "誰かを連れて行きたい城・城跡・遺跡ってどこ？",
      "一つだけ地図に印を付けるなら、どの城・城跡・遺跡？",
    ],
    axes: [
      {
        id: "castle-ruin-hook",
        attributeKey: "castleRuinHook",
        prompt: (word) => fill("{word}で一番見たいのはどこ？", word),
        choices: [
          makeChoice(
            "CASTLE_RUIN_LOOK", "建物・景色", "appearance",
            "建物や景色が見たい",
            "写真で知ってても実物の大きさは画面から逃げちゃうのね。{word}は目で測りに行く場所なの。大きい石を前にすると、作った人の手も急に気になるのね。ぼくは写真では見なかった高さを、自分の足と比べてしまうの。",
            "{word}は、建物や景色が見たいって言ってたね。",
          ),
          makeChoice(
            "CASTLE_RUIN_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "今は静かな場所でも話を知ると急に音が戻るんだ。石って黙ってるのに忙しいの。石だけ残った所にも、昔は扉を開ける音があったんだね。ぼくは何もない入口に、誰かが立ってた幅を想像するの。",
            "{word}は、歴史や由来が知りたいんだったね。",
          ),
          makeChoice(
            "CASTLE_RUIN_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "説明より行くんだ。{word}の空気は持ち帰れないから、現地限定なのね。歩いてみると、地図で近かった所も遠くなることがあるのね。ぼくなら昔の人もここで疲れたか、途中で腰を下ろしたくなるの。",
            "{word}は、その場の体験がしたいって話してたね。",
          ),
        ],
      },
      {
        id: "castle-ruin-relation",
        attributeKey: "castleRuinRelation",
        prompt: (word) => fill("{word}とは、どんな距離？", word),
        choices: [
          makeChoice(
            "CASTLE_RUIN_VIS", "行ったことがある", "visited",
            "行ったことがある",
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってるのね。残ってない部分も、頭の中では少し形を持てるのかな。ぼくは見た石の上に、見てない壁をそっと重ねてみたいの。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "CASTLE_RUIN_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。着いたら、想像してた昔と今の景色が同じ場所にあるのね。ぼくはどっちを見に来たか、少し分からなくなりそうなの。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "CASTLE_RUIN_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。石は前と同じでも、その前に立つ自分は違うんだね。ぼくなら同じ場所で背伸びして、前より見えるか試しちゃうの。",
            "{word}は、また行きたい場所だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "named-shop",
    group: "places",
    category: "PLACE" as WordCategory,
    entityKind: "named_shop",
    prompt: "今いちばん行ってみたい店・飲食店の名前をひとつ教えて。",
    starterPrompts: [
      "今いちばん行ってみたい店・飲食店の名前をひとつ教えて。",
      "前に行って、また行きたい店・飲食店の名前は？",
      "写真を見ただけで気になった店・飲食店の名前ってある？",
      "歴史を知ってから行きたくなった店・飲食店の名前は？",
      "一日ずっと過ごしてみたい店・飲食店の名前ってどこ？",
      "建物や景色を実物で見たい店・飲食店の名前は？",
      "雰囲気だけでも好きそうな店・飲食店の名前ってある？",
      "旅の途中でわざわざ寄りたい店・飲食店の名前は？",
      "有名じゃなくても自分は気になる店・飲食店の名前ってある？",
      "昔行ったのに細かく覚えてる店・飲食店の名前は？",
      "誰かを連れて行きたい店・飲食店の名前ってどこ？",
      "一つだけ地図に印を付けるなら、どの店・飲食店の名前？",
    ],
    axes: [
      {
        id: "named-shop-hook",
        attributeKey: "namedShopHook",
        prompt: (word) => fill("{word}で一番見たいのはどこ？", word),
        choices: [
          makeChoice(
            "NAMED_SHOP_LOOK", "建物・景色", "appearance",
            "建物や景色が見たい",
            "写真で知ってても実物の大きさは画面から逃げちゃうのね。{word}は目で測りに行く場所なの。写真の中では分からなかった奥行きが、行くと足に分かるんだね。ぼくはいい感じの店だと思っても、入口で少し緊張しそうなの。",
            "{word}は、建物や景色が見たいって言ってたね。",
          ),
          makeChoice(
            "NAMED_SHOP_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "今は静かな場所でも話を知ると急に音が戻るんだ。石って黙ってるのに忙しいの。いつもの店にも、初めて開いた日があるんだね。ぼくは今の落ち着いた顔から、最初のお客さんを待つ顔を想像したの。",
            "{word}は、歴史や由来が知りたいんだったね。",
          ),
          makeChoice(
            "NAMED_SHOP_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "説明より行くんだ。{word}の空気は持ち帰れないから、現地限定なのね。入った時の音や匂いは、名前だけでは連れてこられないのね。ぼくなら帰ったあとも、扉を開けた瞬間を思い出してしまうの。",
            "{word}は、その場の体験がしたいって話してたね。",
          ),
        ],
      },
      {
        id: "named-shop-relation",
        attributeKey: "namedShopRelation",
        prompt: (word) => fill("{word}とは、どんな距離？", word),
        choices: [
          makeChoice(
            "NAMED_SHOP_VIS", "行ったことがある", "visited",
            "行ったことがある",
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってるのね。その店を思い出すと、自分が座った場所も出てくるのかな。ぼくはまた行けたら、前の自分と同じ席に会いたいの。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "NAMED_SHOP_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。まだ入ってない店にも、行く日の自分を置けるんだね。ぼくなら何を頼むか考えすぎて、着いた時にはお腹が忙しいの。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "NAMED_SHOP_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。同じ物を頼んでも、前の時間まで同じにはならないのね。ぼくはいつもの場所に座って、今日だけの違いを探したくなるの。",
            "{word}は、また行きたい場所だったね。",
          ),
        ],
      },
    ],
  },
  {
    id: "sports-team",
    group: "sports",
    category: "SPORTS" as WordCategory,
    entityKind: "sports_team",
    prompt: "最近名前が気になるスポーツチームをひとつ教えて。",
    starterPrompts: [
      "最近名前が気になるスポーツチームをひとつ教えて。",
      "昔から覚えてるスポーツチームって何？",
      "一度中を詳しく見てみたいスポーツチームは？",
      "考え方や方針が気になるスポーツチームってある？",
      "人にすすめたり話したりしたいスポーツチームは？",
      "自分とは距離があるけど面白いスポーツチームってある？",
      "歴史を最初から追ってみたいスポーツチームは？",
      "名前を見るとすぐ何か浮かぶスポーツチームって何？",
      "最近評価が変わったスポーツチームは？",
      "昔は気にしてなかったけど今は見るスポーツチームってある？",
      "一つだけ残すなら、どのスポーツチーム？",
      "もっと詳しく知れば印象が変わりそうなスポーツチームは？",
    ],
    axes: [
      {
        id: "sports-team-hook",
        attributeKey: "sportsTeamHook",
        prompt: (word) => fill("{word}で一番見たいのはどこ？", word),
        choices: [
          makeChoice(
            "SPORTS_TEAM_PEOPLE", "選手・メンバー", "people",
            "選手やメンバーが魅力",
            "名前は同じでも人が入れ替わるんだ。チームや大会って、人より長生きする箱なのね。昔の人がいなくても、同じ名前を呼んで応援できるんだね。ぼくは箱が続く間、何が同じで残ってるのか気になったの。",
            "{word}は、選手やメンバーが魅力って言ってたね。",
          ),
          makeChoice(
            "SPORTS_TEAM_STYLE", "戦い方・試合内容", "style",
            "戦い方や試合内容が魅力",
            "同じ勝ちでも形に好みがあるんだ。結果だけじゃ観戦は足りないのね。好きな勝ち方じゃなくても、勝ったらうれしいのかな。ぼくはうれしい顔ともう少し見たかった顔が、同時に出そうなの。",
            "{word}は、戦い方や試合内容が魅力なんだったね。",
          ),
          makeChoice(
            "SPORTS_TEAM_HIST", "歴史・物語", "history",
            "歴史や物語が魅力",
            "今だけじゃなく昔も見るんだ。スポーツって毎年続きをやる長い連載みたいなの。新しい試合を見る時も、前の年の話が隣に座ってるんだね。ぼくは一回だけ見た人とは、違う景色を見てるのかなと思ったの。",
            "{word}は、歴史や物語が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "sports-team-relation",
        attributeKey: "sportsTeamRelation",
        prompt: (word) => fill("{word}との付き合い方、どれが近い？", word),
        choices: [
          makeChoice(
            "SPORTS_TEAM_SUP", "応援してる", "support",
            "応援している",
            "応援すると結果で気分が動くんだ。自分は出てないのに心だけ試合に出場するのね。心だけ出た試合でも、終わったらちゃんと疲れるのね。ぼくは何も動いてない足を見て、誰が走ってたか不思議になりそうなの。",
            "{word}は、応援してるって言ってたね。",
          ),
          makeChoice(
            "SPORTS_TEAM_WATCH", "気になる時に見る", "watch",
            "気になる時に見る",
            "ずっとじゃなく大事な時に見るんだ。人間さんの観戦にも出勤日があるのね。大事な日だけ行っても、応援した時間は残るんだね。ぼくなら久しぶりに見た顔に、少し遅れて追いつきたいの。",
            "{word}は、気になる時に見るって話してたね。",
          ),
          makeChoice(
            "SPORTS_TEAM_RIVAL", "ライバル側も気になる", "rival",
            "ライバル側も気になる",
            "相手まで見るんだ。敵が強いほど応援してる方の物語も濃くなるのね。強い相手に勝ってほしいのに、強すぎると困っちゃうのね。ぼくは相手のいい動きに、拍手していいか手を止めそうなの。",
            "{word}は、ライバル側も気になるって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "tournament",
    group: "sports",
    category: "SPORTS" as WordCategory,
    entityKind: "tournament",
    prompt: "最近名前が気になる大会・リーグをひとつ教えて。",
    starterPrompts: [
      "最近名前が気になる大会・リーグをひとつ教えて。",
      "昔から覚えてる大会・リーグって何？",
      "一度中を詳しく見てみたい大会・リーグは？",
      "考え方や方針が気になる大会・リーグってある？",
      "人にすすめたり話したりしたい大会・リーグは？",
      "自分とは距離があるけど面白い大会・リーグってある？",
      "歴史を最初から追ってみたい大会・リーグは？",
      "名前を見るとすぐ何か浮かぶ大会・リーグって何？",
      "最近評価が変わった大会・リーグは？",
      "昔は気にしてなかったけど今は見る大会・リーグってある？",
      "一つだけ残すなら、どの大会・リーグ？",
      "もっと詳しく知れば印象が変わりそうな大会・リーグは？",
    ],
    axes: [
      {
        id: "tournament-hook",
        attributeKey: "tournamentHook",
        prompt: (word) => fill("{word}で一番見たいのはどこ？", word),
        choices: [
          makeChoice(
            "TOURNAMENT_PEOPLE", "選手・メンバー", "people",
            "選手やメンバーが魅力",
            "名前は同じでも人が入れ替わるんだ。チームや大会って、人より長生きする箱なのね。毎回違う人が来ても、大会の名前は同じ席で待ってるんだね。ぼくは今年の顔と昔の顔を、一度に並べて見たくなるの。",
            "{word}は、選手やメンバーが魅力って言ってたね。",
          ),
          makeChoice(
            "TOURNAMENT_STYLE", "戦い方・試合内容", "style",
            "戦い方や試合内容が魅力",
            "同じ勝ちでも形に好みがあるんだ。結果だけじゃ観戦は足りないのね。誰が勝つかだけじゃ、途中の道も見たいんだね。ぼくなら結果だけ聞いても、どうしてそこへ着いたか質問が残るの。",
            "{word}は、戦い方や試合内容が魅力なんだったね。",
          ),
          makeChoice(
            "TOURNAMENT_HIST", "歴史・物語", "history",
            "歴史や物語が魅力",
            "今だけじゃなく昔も見るんだ。スポーツって毎年続きをやる長い連載みたいなの。昔の大会を知ってると、今年の始まりも少し重くなるのかな。ぼくは初めて見る人の横で、何年分の気持ちがあるか考えちゃうの。",
            "{word}は、歴史や物語が魅力って話してたね。",
          ),
        ],
      },
      {
        id: "tournament-relation",
        attributeKey: "tournamentRelation",
        prompt: (word) => fill("{word}との付き合い方、どれが近い？", word),
        choices: [
          makeChoice(
            "TOURNAMENT_SUP", "応援してる", "support",
            "応援している",
            "応援すると結果で気分が動くんだ。自分は出てないのに心だけ試合に出場するのね。知らない場所の試合でも、心はすぐ行けるんだね。ぼくなら帰ってきた心に、どうだったって自分で聞きたくなるの。",
            "{word}は、応援してるって言ってたね。",
          ),
          makeChoice(
            "TOURNAMENT_WATCH", "気になる時に見る", "watch",
            "気になる時に見る",
            "ずっとじゃなく大事な時に見るんだ。人間さんの観戦にも出勤日があるのね。見る日を待つ時間にも、少し観戦が始まってるのかな。ぼくは当日の予定を見るだけで、もう席に座った顔になりそうなの。",
            "{word}は、気になる時に見るって話してたね。",
          ),
          makeChoice(
            "TOURNAMENT_RIVAL", "ライバル側も気になる", "rival",
            "ライバル側も気になる",
            "相手まで見るんだ。敵が強いほど応援してる方の物語も濃くなるのね。相手にも応援してる人がいるから、勝ってほしい顔が二つあるのね。ぼくはどっちの席から見るかで、同じ場面が変わると思ったの。",
            "{word}は、ライバル側も気になるって言ってたね。",
          ),
        ],
      },
    ],
  },
  {
    id: "company-brand",
    group: "organizations",
    category: "WORK" as WordCategory,
    entityKind: "company_brand",
    prompt: "最近名前が気になる企業・ブランドをひとつ教えて。",
    starterPrompts: [
      "最近名前が気になる企業・ブランドをひとつ教えて。",
      "昔から覚えてる企業・ブランドって何？",
      "一度中を詳しく見てみたい企業・ブランドは？",
      "考え方や方針が気になる企業・ブランドってある？",
      "人にすすめたり話したりしたい企業・ブランドは？",
      "自分とは距離があるけど面白い企業・ブランドってある？",
      "歴史を最初から追ってみたい企業・ブランドは？",
      "名前を見るとすぐ何か浮かぶ企業・ブランドって何？",
      "最近評価が変わった企業・ブランドは？",
      "昔は気にしてなかったけど今は見る企業・ブランドってある？",
      "一つだけ残すなら、どの企業・ブランド？",
      "もっと詳しく知れば印象が変わりそうな企業・ブランドは？",
    ],
    axes: [
      {
        id: "company-brand-hook",
        attributeKey: "companyBrandHook",
        prompt: (word) => fill("{word}で気になるのはどこ？", word),
        choices: [
          makeChoice(
            "COMPANY_BRAND_PROD", "商品・サービス", "product",
            "商品やサービスが気になる",
            "作った物を見るんだ。会社の名前って、大きい作者名みたいになることあるのね。別の物にも同じ名前が付いてたら、前の使い心地を思い出すのかな。ぼくは初めての物に、先に知り合いの顔を付けちゃいそうなの。",
            "{word}は、商品やサービスが気になるって言ってたね。",
          ),
          makeChoice(
            "COMPANY_BRAND_DES", "デザイン・見せ方", "design",
            "デザインや見せ方が気になる",
            "物だけじゃなく見せ方も見るんだ。箱まで仕事してるなら、捨てるのちょっと申し訳ないの。中身を出したあとも、箱だけ捨てにくいことがあるんだね。ぼくなら空になった箱に、仕事が終わったよって言っておくの。",
            "{word}は、デザインや見せ方が気になるんだったね。",
          ),
          makeChoice(
            "COMPANY_BRAND_IDEA", "考え方・方針", "philosophy",
            "考え方や方針が気になる",
            "会社にも性格があるんだ。人じゃないのに「この会社っぽい」があるの、不思議なの。知らない物でも、その会社の名前で少し想像できるんだね。ぼくは想像と違った時、会社が着替えたみたいに感じそうなの。",
            "{word}は、考え方や方針が気になるって話してたね。",
          ),
        ],
      },
      {
        id: "company-brand-relation",
        attributeKey: "companyBrandRelation",
        prompt: (word) => fill("{word}との距離感、どれが近い？", word),
        choices: [
          makeChoice(
            "COMPANY_BRAND_USE", "実際によく使う", "use",
            "実際によく使う",
            "名前を知ってるだけじゃなく生活に入ってるんだ。{word}、人間さんの部屋に出勤してるのね。名前を見なくても、毎日その会社の仕事に会ってるんだね。ぼくは部屋にいる物がどこから来たか、急に数えてみたくなったの。",
            "{word}は、実際によく使うって言ってたね。",
          ),
          makeChoice(
            "COMPANY_BRAND_FOLLOW", "新しいものを気にする", "follow",
            "新しいものを気にする",
            "次に何を出すか待つんだ。会社にも新作待ちってあるのね。まだない物を待ってる時は、頭の中で先に使ってるのかな。ぼくなら出た時に、想像の方と二つ並べてしまいそうなの。",
            "{word}は、新しいものも気にするブランドなんだったね。",
          ),
          makeChoice(
            "COMPANY_BRAND_DIST", "知ってるけど距離はある", "distance",
            "知っているが距離はある",
            "気になるけど使うとは限らないんだ。見るのと買うの間には財布という壁があるのね。壁のこちらから見てるだけでも、気になる席は取ってるんだね。ぼくは欲しい気持ちが先に来たら、財布より先に置き場所へ相談するの。",
            "{word}は、知ってるけど距離はあるって話してたね。",
          ),
        ],
      },
    ],
  },
];


function pickOne<T>(items: readonly T[], random: () => number): T | undefined {
  if (!items.length) return undefined;
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function weightedPick<T>(
  items: readonly T[],
  weightOf: (item: T) => number,
  random: () => number,
): T | undefined {
  if (!items.length) return undefined;
  const weights = items.map((item) => Math.max(0.0001, weightOf(item)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * total;
  for (let index = 0; index < items.length; index += 1) {
    cursor -= weights[index] ?? 0;
    if (cursor <= 0) return items[index];
  }
  return items.at(-1);
}

function starterKey(questionId: string, starterIndex: number) {
  return `${questionId}::${starterIndex}`;
}

export const PROMPTED_LEARNING_STARTER_COUNT = PROMPTED_LEARNING_QUESTIONS
  .reduce((sum, question) => sum + Math.max(1, question.starterPrompts.length), 0);

export function pickPromptedLearningQuestion(
  random = Math.random,
  contextOrExclude?: PromptedLearningPickContext | string,
): PickedPromptedLearningQuestion | undefined {
  const context: PromptedLearningPickContext = typeof contextOrExclude === 'string'
    ? { recentQuestionIds: [contextOrExclude] }
    : (contextOrExclude ?? {});

  const questionCounts = context.questionCounts ?? {};
  const starterCounts = context.starterCounts ?? {};
  const recentQuestionIds = context.recentQuestionIds ?? [];
  const recentGroups = context.recentGroups ?? [];
  const recentEntityKinds = context.recentEntityKinds ?? [];
  const recentStarterKeys = context.recentStarterKeys ?? [];

  const candidates = PROMPTED_LEARNING_QUESTIONS.flatMap((question) => {
    const starters = question.starterPrompts.length ? question.starterPrompts : [question.prompt];
    return starters.map((prompt, starterIndex) => ({
      question,
      prompt,
      starterIndex,
      key: starterKey(question.id, starterIndex),
    }));
  });

  if (!candidates.length) return undefined;

  // Until every exact starter has appeared once, prefer completely unseen
  // starters. With the v6 pool this postpones an exact repeat for well over
  // a year even when Prompted Learning is used twice on many days.
  const unseen = candidates.filter((candidate) => (starterCounts[candidate.key] ?? 0) === 0);
  let pool = unseen.length ? unseen : candidates;

  const withoutRecentExact = pool.filter((candidate) => !recentStarterKeys.includes(candidate.key));
  if (withoutRecentExact.length) pool = withoutRecentExact;

  const picked = weightedPick(pool, (candidate) => {
    const question = candidate.question;
    const questionUse = questionCounts[question.id] ?? 0;
    const starterUse = starterCounts[candidate.key] ?? 0;

    let weight = 1 / (1 + questionUse * 0.7 + starterUse * 2.5);
    if (recentQuestionIds.includes(question.id)) weight *= 0.06;
    if (recentEntityKinds.includes(question.entityKind)) weight *= 0.22;
    if (recentGroups.includes(question.group)) weight *= 0.48;
    return weight;
  }, random) ?? pickOne(pool, random);

  if (!picked) return undefined;
  return {
    ...picked.question,
    prompt: picked.prompt,
    selectedStarterIndex: picked.starterIndex,
    selectedStarterKey: picked.key,
  };
}

const GENERIC_PROMPTED_ANSWERS = new Set([
  '本', '小説', '漫画', 'マンガ', 'アニメ', 'ゲーム', '映画', 'ドラマ', '番組',
  'キャラ', 'キャラクター', '悪役', 'ボス', '作品', 'シリーズ', '曲', '音楽',
  '歌手', 'バンド', '作家', '漫画家', '俳優', '声優', '芸人', '有名人',
  '人物', '歴史上の人物', '武将', '王', '皇帝', '軍師', '科学者', '哲学者',
  'YouTuber', 'ユーチューバー', '配信者', 'VTuber', '動画', 'チャンネル',
  'アプリ', 'サービス', 'サイト', '会社', '企業', 'ブランド', '店', '博物館',
  '美術館', '城', '城跡', '遺跡', 'チーム', '大会', '戦争', '戦い', '合戦',
  '歴史', '専門用語', '用語', '理論', '概念', '神話', '妖怪',
]);

export function isTooGenericPromptedAnswer(value: string) {
  const normalized = value.normalize('NFKC').trim();
  return GENERIC_PROMPTED_ANSWERS.has(normalized);
}


const PROMPTED_SUGGESTIONS_BY_ENTITY_KIND: Readonly<Record<string, readonly string[]>> = {
  "actor": ["阿部寛", "堺雅人", "長澤まさみ", "オードリー・ヘプバーン", "トム・ハンクス", "ケイト・ブランシェット", "役所広司", "西島秀俊", "菅田将暉", "松坂桃李", "綾瀬はるか", "満島ひかり", "吉永小百合", "高倉健", "ロバート・デ・ニーロ", "メリル・ストリープ", "レオナルド・ディカプリオ", "ナタリー・ポートマン", "デンゼル・ワシントン", "ティルダ・スウィントン"],
  "actor_voice_actor": ["山寺宏一", "津田健次郎", "悠木碧", "早見沙織", "宮野真守", "沢城みゆき", "阿部寛", "堺雅人", "長澤まさみ", "オードリー・ヘプバーン", "トム・ハンクス", "ケイト・ブランシェット", "役所広司", "西島秀俊", "菅田将暉", "松坂桃李", "綾瀬はるか", "満島ひかり", "吉永小百合", "高倉健"],
  "album": ["STRAY SHEEP", "THE BOOK", "Fantôme", "Abbey Road", "Thriller", "A BEST", "First Love", "BOLERO", "深海", "Fantasia", "CEREMONY", "狂言", "HELP EVER HURT NEVER", "The Dark Side of the Moon", "Rumours", "Nevermind", "OK Computer", "To Pimp a Butterfly", "Random Access Memories", "21"],
  "anime": ["葬送のフリーレン", "新世紀エヴァンゲリオン", "進撃の巨人", "鋼の錬金術師 FULLMETAL ALCHEMIST", "ぼっち・ざ・ろっく！", "SPY×FAMILY", "カウボーイビバップ", "攻殻機動隊 STAND ALONE COMPLEX", "魔法少女まどか☆マギカ", "STEINS;GATE", "宇宙よりも遠い場所", "四畳半神話大系", "PSYCHO-PASS", "ヴィンランド・サガ", "モブサイコ100", "メイドインアビス", "銀河英雄伝説", "機動戦士ガンダム", "ハイキュー!!", "響け！ユーフォニアム"],
  "anime_character": ["フリーレン", "綾波レイ", "孫悟空", "ルフィ", "アーニャ", "五条悟", "エドワード・エルリック", "草薙素子", "牧瀬紅莉栖", "暁美ほむら", "リヴァイ", "スパイク・スピーゲル", "ナウシカ", "ルパン三世", "ケンシロウ", "碇シンジ", "ロイ・マスタング", "夜神月", "冴羽獠", "キルア"],
  "anime_villain": ["フリーザ", "DIO", "鬼舞辻無惨", "藍染惣右介", "ラオウ", "メルエム", "シャア・アズナブル", "セル", "志々雄真実", "クロロ", "グリフィス", "戸愚呂弟", "槙島聖護", "ヨハン・リーベルト", "奈落", "大蛇丸", "バーン", "鷹の目のミホーク", "カーズ", "一方通行"],
  "arcade_game": ["ストリートファイターII", "バーチャファイター2", "THE KING OF FIGHTERS '98", "メタルスラッグ", "パズルボブル", "ダライアス", "ストリートファイターIII 3rd STRIKE", "鉄拳3", "餓狼伝説SPECIAL", "サムライスピリッツ", "ぷよぷよ通", "グラディウス", "R-TYPE", "ゼビウス", "ギャラガ", "アウトラン", "デイトナUSA", "電脳戦機バーチャロン", "太鼓の達人", "Dance Dance Revolution"],
  "artist": ["葛飾北斎", "岡本太郎", "草間彌生", "ゴッホ", "モネ", "ピカソ", "横山大観", "伊藤若冲", "東山魁夷", "奈良美智", "村上隆", "フェルメール", "レンブラント", "クリムト", "エドヴァルド・ムンク", "サルバドール・ダリ", "アンディ・ウォーホル", "フリーダ・カーロ", "ジョージア・オキーフ", "エドワード・ホッパー"],
  "athlete": ["大谷翔平", "イチロー", "羽生結弦", "マイケル・ジョーダン", "ウサイン・ボルト", "セリーナ・ウィリアムズ", "王貞治", "長嶋茂雄", "井上尚弥", "錦織圭", "北口榛花", "吉田沙保里", "内村航平", "三浦知良", "リオネル・メッシ", "クリスティアーノ・ロナウド", "ロジャー・フェデラー", "マイケル・フェルプス", "シモーネ・バイルズ", "モハメド・アリ"],
  "author": ["夏目漱石", "宮沢賢治", "東野圭吾", "村上春樹", "アガサ・クリスティ", "ジョージ・オーウェル", "芥川龍之介", "太宰治", "川端康成", "三島由紀夫", "司馬遼太郎", "小川洋子", "伊坂幸太郎", "湊かなえ", "J.K.ローリング", "フランツ・カフカ", "ガブリエル・ガルシア＝マルケス", "レイモンド・チャンドラー", "カズオ・イシグロ", "アーシュラ・K・ル＝グウィン"],
  "band": ["GLAY", "BUMP OF CHICKEN", "サカナクション", "King Gnu", "Queen", "The Beatles", "Mr.Children", "L’Arc〜en〜Ciel", "スピッツ", "X JAPAN", "ASIAN KUNG-FU GENERATION", "RADWIMPS", "ONE OK ROCK", "SEKAI NO OWARI", "Led Zeppelin", "Pink Floyd", "Nirvana", "Radiohead", "Red Hot Chili Peppers", "Oasis"],
  "battle": ["関ヶ原の戦い", "桶狭間の戦い", "長篠の戦い", "赤壁の戦い", "ワーテルローの戦い", "ハスティングズの戦い", "川中島の戦い", "山崎の戦い", "壇ノ浦の戦い", "官渡の戦い", "淝水の戦い", "アクティウムの海戦", "カンナエの戦い", "トラファルガーの海戦", "ゲティスバーグの戦い", "スターリング・ブリッジの戦い", "アジャンクールの戦い", "レパントの海戦", "ミッドウェー海戦", "スターリングラード攻防戦"],
  "biography": ["福翁自伝", "ガンジー自伝", "ベンジャミン・フランクリン自伝", "マルコムX自伝", "アンネの日記", "自由への長い道", "夜と霧", "スティーブ・ジョブズ", "坂の上の雲", "チェ・ゲバラ伝", "ネルソン・マンデラ自伝", "チャーチル回顧録", "自省録", "オバマ回顧録 A Promised Land", "Educated", "Open アンドレ・アガシの自伝", "シュリーマン自伝", "チャップリン自伝", "マイルス・デイヴィス自叙伝", "手塚治虫 僕はマンガ家"],
  "book": ["こころ", "星の王子さま", "老人と海", "1984年", "コンビニ人間", "夜は短し歩けよ乙女", "吾輩は猫である", "羅生門", "銀河鉄道の夜", "人間失格", "雪国", "海辺のカフカ", "火車", "博士の愛した数式", "そして誰もいなくなった", "アルジャーノンに花束を", "華氏451度", "百年の孤独", "モモ", "夜と霧"],
  "castle_ruin": ["竹田城跡", "安土城跡", "高取城跡", "一乗谷朝倉氏遺跡", "鬼ノ城", "荒砥城跡", "備中松山城", "山中城跡", "小谷城跡", "岩村城跡", "七尾城跡", "春日山城跡", "月山富田城跡", "吉田郡山城跡", "玄蕃尾城跡", "鉢形城跡", "八王子城跡", "佐和山城跡", "観音寺城跡", "名護屋城跡"],
  "character": ["スヌーピー", "カービィ", "初音ミク", "ドラえもん", "ピカチュウ", "トロ", "ミッキーマウス", "ムーミン", "リラックマ", "ちいかわ", "ハローキティ", "アンパンマン", "ミッフィー", "くまのプーさん", "ソニック", "マリオ", "リンク", "ナウシカ", "ゴジラ", "すみっコぐらし"],
  "comedian": ["明石家さんま", "タモリ", "バカリズム", "サンドウィッチマン", "千鳥", "オードリー", "ダウンタウン", "ナインティナイン", "爆笑問題", "有吉弘行", "内村光良", "博多華丸・大吉", "かまいたち", "霜降り明星", "東京03", "バナナマン", "くりぃむしちゅー", "劇団ひとり", "山里亮太", "若林正恭"],
  "commander": ["ハンニバル", "ナポレオン", "カエサル", "李舜臣", "ゲオルギー・ジューコフ", "武田信玄", "アレクサンドロス大王", "スキピオ・アフリカヌス", "源義経", "楠木正成", "上杉謙信", "山本五十六", "エルヴィン・ロンメル", "バーナード・モントゴメリー", "ダグラス・マッカーサー", "ホレーショ・ネルソン", "サラディン", "チンギス・ハン", "グスタフ2世アドルフ", "ヘルムート・フォン・モルトケ"],
  "company_brand": ["任天堂", "ソニー", "トヨタ", "無印良品", "LEGO", "Patagonia", "Apple", "Google", "Microsoft", "Honda", "Panasonic", "Sony Interactive Entertainment", "UNIQLO", "IKEA", "Nike", "adidas", "Coca-Cola", "Starbucks", "Nintendo", "SEGA"],
  "composer": ["久石譲", "坂本龍一", "植松伸夫", "ベートーヴェン", "モーツァルト", "ドビュッシー", "すぎやまこういち", "伊福部昭", "菅野よう子", "澤野弘之", "椎名林檎", "バッハ", "ショパン", "ラフマニノフ", "チャイコフスキー", "マーラー", "ストラヴィンスキー", "ジョン・ウィリアムズ", "ハンス・ジマー", "エンニオ・モリコーネ"],
  "concept_theory": ["ゲーム理論", "相対性理論", "進化論", "ホーソン効果", "認知的不協和", "囚人のジレンマ", "アンカリング", "確証バイアス", "ダニング＝クルーガー効果", "サンクコスト効果", "ピーターの法則", "パーキンソンの法則", "ネットワーク効果", "複利", "自然選択", "量子もつれ", "一般相対性理論", "創発", "トロッコ問題", "パノプティコン"],
  "creator_author": ["宮崎駿", "庵野秀明", "小島秀夫", "鳥山明", "新海誠", "奈須きのこ", "夏目漱石", "宮沢賢治", "東野圭吾", "村上春樹", "アガサ・クリスティ", "ジョージ・オーウェル", "芥川龍之介", "太宰治", "川端康成", "三島由紀夫", "司馬遼太郎", "小川洋子", "伊坂幸太郎", "湊かなえ"],
  "deity": ["アマテラス", "ゼウス", "オーディン", "シヴァ", "アヌビス", "ケツァルコアトル", "ツクヨミ", "イザナギ", "イザナミ", "アポロン", "アテナ", "トール", "ロキ", "ラー", "ホルス", "ヴィシュヌ", "ガネーシャ", "インドラ", "マルドゥク", "テスカトリポカ"],
  "director": ["黒澤明", "宮崎駿", "是枝裕和", "クリストファー・ノーラン", "スティーヴン・スピルバーグ", "ウェス・アンダーソン", "山田洋次", "北野武", "大林宣彦", "岩井俊二", "細田守", "今敏", "押井守", "デヴィッド・フィンチャー", "スタンリー・キューブリック", "マーティン・スコセッシ", "クエンティン・タランティーノ", "ポン・ジュノ", "グレタ・ガーウィグ", "ドゥニ・ヴィルヌーヴ"],
  "documentary": ["プラネットアース", "フリーソロ", "Our Planet", "アクト・オブ・キリング", "13th -憲法修正第13条-", "ボウリング・フォー・コロンバイン", "The Social Dilemma", "Jiro Dreams of Sushi", "Senna", "Searching for Sugar Man", "Man on Wire", "Amy", "Citizenfour", "Won’t You Be My Neighbor?", "The Cove", "Inside Job", "The Last Dance", "Making a Murderer", "東京オリンピック", "人生フルーツ"],
  "drama": ["半沢直樹", "VIVANT", "踊る大捜査線", "孤独のグルメ", "Breaking Bad", "SHERLOCK", "リーガル・ハイ", "TRICK", "アンナチュラル", "MIU404", "古畑任三郎", "SPEC", "白い巨塔", "逃げるは恥だが役に立つ", "The Wire", "Game of Thrones", "The Crown", "Better Call Saul", "Stranger Things", "The Last of Us"],
  "dynasty_state": ["秦", "漢", "唐", "ローマ帝国", "オスマン帝国", "鎌倉幕府", "殷", "周", "宋", "明", "清", "アケメネス朝", "ササン朝", "東ローマ帝国", "神聖ローマ帝国", "ムガル帝国", "大英帝国", "アステカ帝国", "インカ帝国", "江戸幕府"],
  "entrepreneur": ["松下幸之助", "本田宗一郎", "盛田昭夫", "スティーブ・ジョブズ", "ウォルト・ディズニー", "イヴォン・シュイナード", "稲盛和夫", "柳井正", "孫正義", "三木谷浩史", "豊田喜一郎", "渋沢栄一", "ビル・ゲイツ", "ジェフ・ベゾス", "イーロン・マスク", "サム・ウォルトン", "ヘンリー・フォード", "リード・ヘイスティングス", "フィル・ナイト", "リチャード・ブランソン"],
  "essay": ["徒然草", "枕草子", "もものかんづめ", "旅をする木", "思考の整理学", "人生エロエロ", "方丈記", "土佐日記", "清少納言 枕草子", "日日是好日", "無名抄", "もの食う人びと", "深夜特急", "ことばの食卓", "女のいない男たち", "退屈とポスト・トゥルース", "ぼくはイエローでホワイトで、ちょっとブルー", "しょぼい生活革命", "日日雑記", "断腸亭日乗"],
  "famous_person": ["黒柳徹子", "タモリ", "イチロー", "宮崎駿", "羽生善治", "宇多田ヒカル", "阿部寛", "堺雅人", "長澤まさみ", "オードリー・ヘプバーン", "トム・ハンクス", "ケイト・ブランシェット", "役所広司", "西島秀俊", "菅田将暉", "松坂桃李", "綾瀬はるか", "満島ひかり", "吉永小百合", "高倉健"],
  "fictional_creature": ["ピカチュウ", "スライム", "ゴジラ", "トトロ", "チョコボ", "モーグリ", "クリボー", "ドラキー", "キングスライム", "サボテンダー", "オトモアイルー", "ネコバス", "グレムリン", "E.T.", "エイリアン", "プレデター", "キングギドラ", "モスラ", "メタルスライム", "ヨッシー"],
  "fictional_item": ["どこでもドア", "デスノート", "マスターソード", "ドラゴンボール", "タケコプター", "ポータルガン", "タイムマシン", "ライトセーバー", "指輪物語の一つの指輪", "賢者の石", "四次元ポケット", "仙豆", "モンスターボール", "キーブレード", "バスターソード", "ガンブレード", "オムニツール", "トライフォース", "風のタクト", "スモールライト"],
  "fictional_organization": ["NERV", "暁", "黒の組織", "ロケット団", "神羅カンパニー", "調査兵団", "地球連邦軍", "ジオン公国軍", "麦わらの一味", "海軍本部", "公安9課", "幻影旅団", "護廷十三隊", "世界政府", "アンブレラ社", "S.T.A.R.S.", "アベンジャーズ", "X-MEN", "スターク・インダストリーズ", "銀河帝国"],
  "fictional_place": ["木ノ葉隠れの里", "ミッドガル", "ホグワーツ", "ラピュタ", "アリアハン", "カントー地方", "アレフガルド", "ハイラル", "ロスサントス", "ラクーンシティ", "パレットタウン", "ワノ国", "ソウル・ソサエティ", "ネオ東京", "第三新東京市", "ムーミン谷", "ナルニア", "中つ国", "ウェスタロス", "タトゥイーン"],
  "fictional_skill": ["かめはめ波", "波動拳", "霊丸", "月牙天衝", "螺旋丸", "一閃", "昇龍拳", "竜巻旋風脚", "北斗百裂拳", "魔貫光殺砲", "元気玉", "瞬獄殺", "天翔龍閃", "アバンストラッシュ", "ザ・ワールド", "領域展開", "黒閃", "ギア2", "千鳥", "飛天御剣流"],
  "fictional_term": ["ニュータイプ", "スタンド", "卍解", "悪魔の実", "ATフィールド", "個性", "フォース", "錬金術", "念能力", "覇気", "チャクラ", "魔法少女", "ギアス", "エヴァンゲリオン", "ミノフスキー粒子", "サイコフレーム", "ハンターライセンス", "デスノート", "聖杯戦争", "マテリア"],
  "game": ["ストリートファイター6", "Minecraft", "逆転裁判", "ペルソナ5", "ELDEN RING", "ゼルダの伝説 ブレス オブ ザ ワイルド", "スーパーマリオ オデッセイ", "ゼルダの伝説 ティアーズ オブ ザ キングダム", "ファイナルファンタジーVII", "ドラゴンクエストV", "クロノ・トリガー", "MOTHER2", "バイオハザード4", "メタルギアソリッド3", "モンスターハンター：ワールド", "SEKIRO", "NieR:Automata", "Persona 4 Golden", "Portal 2", "The Last of Us"],
  "game_boss": ["クッパ", "セフィロス", "マレニア", "サイコ・マンティス", "リドリー", "ラヴォス", "ガノンドロフ", "ケフカ", "エスターク", "竜王", "アルティミシア", "リキッド・スネーク", "ビッグボス", "アルトリウス", "ラダーン", "ガスコイン神父", "ウェスカー", "ギーグ", "デデデ大王", "オメガ"],
  "game_character": ["カービィ", "マリオ", "リンク", "春麗", "ソリッド・スネーク", "2B", "クラウド", "ティファ", "セフィロス", "スネーク", "ダンテ", "桐生一馬", "成歩堂龍一", "御剣怜侍", "ジョーカー", "アマテラス", "サムス", "ソニック", "ロックマン", "ララ・クロフト"],
  "historical_artifact": ["ロゼッタ・ストーン", "ツタンカーメンの黄金のマスク", "ハンムラビ法典碑", "三角縁神獣鏡", "ミロのヴィーナス", "正倉院宝物", "死海文書", "ネブラ・ディスク", "アンティキティラ島の機械", "兵馬俑", "正倉院の螺鈿紫檀五絃琵琶", "金印「漢委奴国王」", "縄文土偶", "埴輪", "曜変天目", "バイユーのタペストリー", "テラコッタ軍団", "サットン・フーの兜", "ナスカの地上絵", "ヴァイキングのオーセベリ船"],
  "historical_document": ["日本書紀", "吾妻鏡", "史記", "マグナ・カルタ", "アメリカ独立宣言", "フランス人権宣言", "古事記", "続日本紀", "平家物語", "太平記", "漢書", "三国志", "資治通鑑", "大憲章", "権利章典", "人間と市民の権利の宣言", "ヴェルサイユ条約", "ポツダム宣言", "日本国憲法", "ウィーン議定書"],
  "historical_event": ["明治維新", "フランス革命", "産業革命", "コンスタンティノープル陥落", "アポロ11号月面着陸", "世界恐慌", "大化の改新", "応仁の乱", "本能寺の変", "関ヶ原の戦い", "大政奉還", "ロシア革命", "アメリカ独立革命", "宗教改革", "大航海時代", "ベルリンの壁崩壊", "キューバ危機", "ルネサンス", "黒死病流行", "コンスタンティノープル遷都"],
  "historical_figure": ["織田信長", "曹操", "クレオパトラ", "レオナルド・ダ・ヴィンチ", "坂本龍馬", "ジャンヌ・ダルク", "豊臣秀吉", "徳川家康", "武田信玄", "上杉謙信", "諸葛亮", "劉備", "始皇帝", "アレクサンドロス大王", "カエサル", "ナポレオン", "マリー・アントワネット", "リンカーン", "ガンジー", "ネルソン・マンデラ"],
  "historical_period_topic": ["戦国時代", "三国志", "江戸時代", "幕末", "ルネサンス", "ローマ共和政", "平安時代", "鎌倉時代", "室町時代", "大正時代", "古代エジプト", "古代ギリシャ", "ローマ帝国", "中世ヨーロッパ", "大航海時代", "産業革命期", "第一次世界大戦", "冷戦", "春秋戦国時代", "唐代"],
  "indie_game": ["UNDERTALE", "Hollow Knight", "Celeste", "Stardew Valley", "Vampire Survivors", "Hades", "Cuphead", "Dead Cells", "The Binding of Isaac", "Slay the Spire", "Disco Elysium", "Outer Wilds", "Terraria", "Baba Is You", "Return of the Obra Dinn", "Inscryption", "Dave the Diver", "Balatro", "Katana ZERO", "A Short Hike"],
  "inventor": ["トーマス・エジソン", "ニコラ・テスラ", "グーテンベルク", "ジェームズ・ワット", "アレクサンダー・グラハム・ベル", "ライト兄弟", "平賀源内", "田中久重", "豊田佐吉", "御木本幸吉", "アルフレッド・ノーベル", "ルイ・パスツール", "ジョセフ・ニセフォール・ニエプス", "サミュエル・モールス", "カール・ベンツ", "ジョン・ロジー・ベアード", "ティム・バーナーズ＝リー", "ヘディ・ラマー", "ジョージ・イーストマン", "イーゴリ・シコルスキー"],
  "landmark": ["東京タワー", "清水寺", "金閣寺", "エッフェル塔", "コロッセオ", "タージ・マハル", "姫路城", "伏見稲荷大社", "厳島神社", "奈良の大仏", "通天閣", "自由の女神", "ビッグ・ベン", "サグラダ・ファミリア", "万里の長城", "アンコール・ワット", "ペトラ遺跡", "ギザのピラミッド", "ストーンヘンジ", "ウルル"],
  "legend": ["アーサー王", "ロビン・フッド", "桃太郎", "浦島太郎", "エル・ドラード", "アトランティス", "聖杯伝説", "ニーベルンゲンの歌", "平家落人伝説", "ヤマトタケル伝説", "八百比丘尼", "雪女", "鶴の恩返し", "かぐや姫", "ネッシー", "ビッグフット", "シャンバラ", "黄金郷パイティティ", "バミューダ・トライアングル", "さまよえるオランダ人"],
  "light_novel": ["涼宮ハルヒの憂鬱", "狼と香辛料", "ソードアート・オンライン", "キノの旅", "Re:ゼロから始める異世界生活", "青春ブタ野郎シリーズ", "とある魔術の禁書目録", "デュラララ!!", "化物語", "オーバーロード", "この素晴らしい世界に祝福を！", "ようこそ実力至上主義の教室へ", "86―エイティシックス―", "十二国記", "フルメタル・パニック！", "ブギーポップは笑わない", "ロードス島戦記", "バッカーノ！", "ゴブリンスレイヤー", "幼女戦記"],
  "manga": ["ドラゴンボール", "ONE PIECE", "SLAM DUNK", "HUNTER×HUNTER", "鋼の錬金術師", "よつばと！", "ベルセルク", "ジョジョの奇妙な冒険", "寄生獣", "MONSTER", "20世紀少年", "火の鳥", "ブラック・ジャック", "ヴィンランド・サガ", "キングダム", "ゴールデンカムイ", "チェンソーマン", "ブルーピリオド", "ダンジョン飯", "宇宙兄弟"],
  "manga_artist": ["手塚治虫", "鳥山明", "荒木飛呂彦", "高橋留美子", "浦沢直樹", "羽海野チカ", "藤子・F・不二雄", "井上雄彦", "冨樫義博", "尾田栄一郎", "諫山創", "大友克洋", "萩尾望都", "水木しげる", "永井豪", "石ノ森章太郎", "松本零士", "青山剛昌", "幸村誠", "石黒正数"],
  "mobile_game": ["パズル＆ドラゴンズ", "モンスターストライク", "Pokémon GO", "ウマ娘 プリティーダービー", "原神", "ブルーアーカイブ", "Fate/Grand Order", "アークナイツ", "崩壊：スターレイル", "プロジェクトセカイ", "ヘブンバーンズレッド", "グランブルーファンタジー", "プリンセスコネクト！Re:Dive", "勝利の女神：NIKKE", "ドラゴンクエストウォーク", "ピクミン ブルーム", "にゃんこ大戦争", "メメントモリ", "放置少女", "雀魂"],
  "movie": ["七人の侍", "千と千尋の神隠し", "バック・トゥ・ザ・フューチャー", "ショーシャンクの空に", "インターステラー", "パラサイト 半地下の家族", "ゴッドファーザー", "2001年宇宙の旅", "パルプ・フィクション", "ターミネーター2", "マトリックス", "ロード・オブ・ザ・リング", "ダークナイト", "セッション", "グランド・ブダペスト・ホテル", "君の名は。", "もののけ姫", "シン・ゴジラ", "万引き家族", "トップガン マーヴェリック"],
  "museum": ["東京国立博物館", "国立科学博物館", "ルーヴル美術館", "大英博物館", "三鷹の森ジブリ美術館", "国立新美術館", "大阪市立自然史博物館", "京都国立博物館", "九州国立博物館", "奈良国立博物館", "国立西洋美術館", "江戸東京博物館", "兵庫県立美術館", "京都国際マンガミュージアム", "メトロポリタン美術館", "MoMA", "プラド美術館", "ウフィツィ美術館", "エルミタージュ美術館", "オルセー美術館"],
  "music_producer": ["小室哲哉", "中田ヤスタカ", "蔦谷好位置", "クインシー・ジョーンズ", "リック・ルービン", "ジョージ・マーティン", "秋元康", "つんく♂", "小林武史", "亀田誠治", "松任谷正隆", "Yaffle", "TeddyLoid", "tofubeats", "フィル・スペクター", "ブライアン・イーノ", "ナイル・ロジャース", "マックス・マーティン", "ファレル・ウィリアムス", "デンジャー・マウス"],
  "musician": ["久石譲", "坂本龍一", "プリンス", "スティーヴィー・ワンダー", "ヨーヨー・マ", "葉加瀬太郎", "山下達郎", "細野晴臣", "矢野顕子", "上原ひろみ", "キース・ジャレット", "ハービー・ハンコック", "マイルス・デイヴィス", "ジョン・コルトレーン", "パット・メセニー", "エリック・クラプトン", "ジミ・ヘンドリックス", "カルロス・サンタナ", "デイヴィッド・ボウイ", "パット・マルティーノ"],
  "myth_figure": ["ヘラクレス", "ギルガメシュ", "アキレウス", "スサノオ", "孫悟空", "クー・フーリン", "オデュッセウス", "ペルセウス", "オルフェウス", "テセウス", "ジークフリート", "ベーオウルフ", "ヤマトタケル", "オオクニヌシ", "ラーマ", "アルジュナ", "カルナ", "シグルズ", "フィン・マックール", "ローラン"],
  "named_app_service": ["LINE", "Discord", "Steam", "Notion", "Spotify", "GitHub", "YouTube", "Netflix", "Amazon Prime Video", "X", "Instagram", "TikTok", "Slack", "Trello", "Figma", "Canva", "Dropbox", "Google Drive", "ChatGPT", "Bluesky"],
  "named_place": ["屋久島", "鎌倉", "浅草", "道頓堀", "モン・サン＝ミシェル", "マチュ・ピチュ", "京都", "奈良", "神戸", "高野山", "熊野古道", "白川郷", "出雲", "尾道", "ヴェネツィア", "プラハ", "パリ", "ローマ", "ニューヨーク", "イスタンブール"],
  "named_shop": ["くら寿司", "CoCo壱番屋", "丸亀製麺", "コメダ珈琲店", "ヨドバシカメラ", "紀伊國屋書店", "無印良品", "ドン・キホーテ", "ユニクロ", "ニトリ", "東急ハンズ", "丸善", "ジュンク堂書店", "スターバックス", "サイゼリヤ", "餃子の王将", "すき家", "吉野家", "松屋", "びっくりドンキー"],
  "nonfiction": ["銃・病原菌・鉄", "サピエンス全史", "FACTFULNESS", "失敗の本質", "思考の整理学", "嫌われる勇気", "ホモ・デウス", "21 Lessons", "利己的な遺伝子", "ブラック・スワン", "ファスト＆スロー", "文明崩壊", "国家はなぜ衰退するのか", "21世紀の資本", "夜と霧", "ゼロ・トゥ・ワン", "イシューからはじめよ", "具体と抽象", "Think Again", "予想どおりに不合理"],
  "online_video_channel": ["THE FIRST TAKE", "QuizKnock", "ゲームさんぽ", "Kurzgesagt", "TED", "NOBROCK TV", "Veritasium", "Vsauce", "CGP Grey", "Numberphile", "SmarterEveryDay", "Linus Tech Tips", "Marques Brownlee", "NPR Music", "WIRED", "First We Feast", "Primitive Technology", "The Slow Mo Guys", "Kurzgesagt – In a Nutshell", "CrashCourse"],
  "philosopher": ["ソクラテス", "ニーチェ", "孔子", "韓非子", "デカルト", "シモーヌ・ド・ボーヴォワール", "プラトン", "アリストテレス", "エピクロス", "マルクス・アウレリウス", "スピノザ", "カント", "ヘーゲル", "ショーペンハウアー", "キルケゴール", "サルトル", "ハンナ・アーレント", "ミシェル・フーコー", "老子", "荘子"],
  "podcast": ["COTEN RADIO", "OVER THE SUN", "ゆる言語学ラジオ", "Rebuild", "ドングリFM", "バイリンガルニュース", "佐久間宣行のオールナイトニッポン0", "安住紳一郎の日曜天国", "NHKラジオニュース", "台本なし英会話レッスン", "歴史を面白く学ぶコテンラジオ", "ゆるコンピュータ科学ラジオ", "奇奇怪怪", "Off Topic", "backspace.fm", "Researchat.fm", "99% Invisible", "Radiolab", "This American Life", "The Daily"],
  "poetry": ["サラダ記念日", "一握の砂", "春と修羅", "月に吠える", "智恵子抄", "百人一首", "おくのほそ道", "万葉集", "古今和歌集", "新古今和歌集", "山羊の歌", "中原中也詩集", "立原道造詩集", "谷川俊太郎詩集", "二十億光年の孤独", "汚れつちまつた悲しみに……", "雨ニモマケズ", "道程", "若菜集", "みだれ髪"],
  "research_field": ["量子力学", "認知科学", "考古学", "脳科学", "天文学", "行動経済学", "人工知能", "機械学習", "情報科学", "進化生物学", "分子生物学", "神経科学", "社会心理学", "文化人類学", "言語学", "宇宙論", "素粒子物理学", "地球科学", "古生物学", "材料科学"],
  "retro_game": ["スーパーマリオブラザーズ", "クロノ・トリガー", "ファイナルファンタジーVI", "MOTHER2", "ときめきメモリアル", "バイオハザード", "ロマンシング サガ2", "聖剣伝説2", "タクティクスオウガ", "ファイアーエムブレム 聖戦の系譜", "ロックマン2", "悪魔城ドラキュラX 月下の夜想曲", "ゼルダの伝説 神々のトライフォース", "メトロイド", "魂斗羅", "グラディウスII", "サクラ大戦", "街 〜運命の交差点〜", "風来のシレン", "弟切草"],
  "ruler": ["徳川家康", "始皇帝", "アウグストゥス", "ルイ14世", "エリザベス1世", "カール大帝", "織田信長", "豊臣秀吉", "源頼朝", "足利義満", "劉邦", "漢武帝", "唐太宗", "康熙帝", "アレクサンドロス大王", "ナポレオン", "ヴィクトリア女王", "ピョートル大帝", "スレイマン1世", "アクバル"],
  "scientist": ["アインシュタイン", "ダーウィン", "マリー・キュリー", "リチャード・ファインマン", "湯川秀樹", "ガリレオ", "ニュートン", "ファラデー", "マクスウェル", "ニールス・ボーア", "シュレーディンガー", "ワトソンとクリック", "ロザリンド・フランクリン", "ジェーン・グドール", "レイチェル・カーソン", "寺田寅彦", "本庶佑", "大隅良典", "カール・セーガン", "スティーヴン・ホーキング"],
  "scientist_thinker": ["レオナルド・ダ・ヴィンチ", "ベンジャミン・フランクリン", "ブレーズ・パスカル", "イブン・スィーナー", "アル＝ビールーニー", "南方熊楠", "アインシュタイン", "ダーウィン", "マリー・キュリー", "リチャード・ファインマン", "湯川秀樹", "ガリレオ", "ニュートン", "ファラデー", "マクスウェル", "ニールス・ボーア", "シュレーディンガー", "ワトソンとクリック", "ロザリンド・フランクリン", "ジェーン・グドール"],
  "series_franchise": ["ファイナルファンタジー", "ガンダム", "ポケットモンスター", "ゼルダの伝説", "スター・ウォーズ", "ドラゴンクエスト", "マリオ", "メタルギア", "バイオハザード", "モンスターハンター", "ペルソナ", "真・女神転生", "龍が如く", "ソニック", "仮面ライダー", "ウルトラマン", "スター・トレック", "ハリー・ポッター", "ロード・オブ・ザ・リング", "マーベル・シネマティック・ユニバース"],
  "singer": ["宇多田ヒカル", "Ado", "米津玄師", "MISIA", "美空ひばり", "フレディ・マーキュリー", "椎名林檎", "中島みゆき", "松任谷由実", "山下達郎", "藤井風", "Vaundy", "Eve", "ビリー・アイリッシュ", "アデル", "テイラー・スウィフト", "ブルーノ・マーズ", "レディー・ガガ", "デヴィッド・ボウイ", "エルトン・ジョン"],
  "song": ["花に亡霊", "ドラマツルギー", "SCREAM", "Lemon", "Bohemian Rhapsody", "上を向いて歩こう", "Pretender", "夜に駆ける", "丸の内サディスティック", "Everything", "糸", "innocent world", "天体観測", "新宝島", "Smells Like Teen Spirit", "Imagine", "Hotel California", "Billie Jean", "Let It Be", "Take On Me"],
  "song_or_album": ["花に亡霊", "STRAY SHEEP", "THE BOOK", "Fantôme", "Abbey Road", "A BEST", "ドラマツルギー", "SCREAM", "Lemon", "Bohemian Rhapsody", "上を向いて歩こう", "Pretender", "夜に駆ける", "丸の内サディスティック", "Everything", "糸", "innocent world", "天体観測", "新宝島", "Smells Like Teen Spirit"],
  "soundtrack": ["FINAL FANTASY VII Original Soundtrack", "もののけ姫 サウンドトラック", "UNDERTALE Soundtrack", "NieR:Automata Original Soundtrack", "COWBOY BEBOP Original Soundtrack", "ゼルダの伝説 ブレス オブ ザ ワイルド Original Soundtrack", "クロノ・トリガー オリジナル・サウンド・ヴァージョン", "FINAL FANTASY X Original Soundtrack", "Persona 5 Original Soundtrack", "ゼノギアス オリジナル・サウンドトラック", "大神 オリジナル・サウンドトラック", "MOTHER2 ギーグの逆襲", "攻殻機動隊 STAND ALONE COMPLEX O.S.T.", "Cowboy Bebop Blue", "Interstellar Original Motion Picture Soundtrack", "The Lord of the Rings Soundtrack", "Star Wars Original Soundtrack", "Blade Runner Soundtrack", "The Legend of Zelda: Ocarina of Time OST", "Journey Original Soundtrack"],
  "specialist_term": ["機会費用", "神経可塑性", "パレートの法則", "ビザンチン障害", "ナッシュ均衡", "エントロピー", "限界効用", "比較優位", "外部性", "モラルハザード", "ベイズ推定", "マルコフ連鎖", "勾配降下法", "公開鍵暗号", "CAP定理", "チューリング完全", "自己組織化", "複雑系", "可塑性", "エピジェネティクス"],
  "sports_team": ["阪神タイガース", "読売ジャイアンツ", "鹿島アントラーズ", "ロサンゼルス・ドジャース", "シカゴ・ブルズ", "FCバルセロナ", "広島東洋カープ", "福岡ソフトバンクホークス", "北海道日本ハムファイターズ", "浦和レッズ", "ガンバ大阪", "横浜F・マリノス", "レアル・マドリード", "マンチェスター・ユナイテッド", "リヴァプールFC", "ニューヨーク・ヤンキース", "ボストン・レッドソックス", "ロサンゼルス・レイカーズ", "ゴールデンステート・ウォリアーズ", "オールブラックス"],
  "stage_musical": ["レ・ミゼラブル", "オペラ座の怪人", "ウィキッド", "キャッツ", "ハミルトン", "ライオンキング", "ミス・サイゴン", "エリザベート", "モーツァルト！", "キンキーブーツ", "ジーザス・クライスト＝スーパースター", "コーラスライン", "シカゴ", "ヘアスプレー", "RENT", "サウンド・オブ・ミュージック", "ウエスト・サイド・ストーリー", "屋根の上のヴァイオリン弾き", "マンマ・ミーア！", "スウィーニー・トッド"],
  "strategist": ["諸葛亮", "司馬懿", "黒田官兵衛", "竹中半兵衛", "韓信", "孫武", "張良", "陳平", "范増", "呉起", "楽毅", "管仲", "太公望", "真田昌幸", "毛利元就", "山本勘助", "石田三成", "秋山真之", "クラウゼヴィッツ", "マキャヴェリ"],
  "streamer_youtuber": ["HIKAKIN", "キヨ。", "レトルト", "牛沢", "加藤純一", "2BRO.", "兄者弟者", "もこう", "SHAKA", "StylishNoob", "ポッキー", "ガッチマン", "三人称", "花江夏樹", "壱百満天原サロメ", "葛葉", "兎田ぺこら", "大空スバル", "弟者", "釈迦"],
  "tokusatsu": ["仮面ライダークウガ", "ウルトラマンティガ", "牙狼〈GARO〉", "侍戦隊シンケンジャー", "仮面ライダーBLACK", "ウルトラセブン", "仮面ライダー龍騎", "仮面ライダー555", "仮面ライダーW", "仮面ライダー電王", "ウルトラマン", "ウルトラマンゼロ", "ウルトラマンZ", "秘密戦隊ゴレンジャー", "海賊戦隊ゴーカイジャー", "特捜戦隊デカレンジャー", "電光超人グリッドマン", "ゴジラ", "ガメラ", "人造人間キカイダー"],
  "tournament": ["オリンピック", "WBC", "ウィンブルドン選手権", "UEFAチャンピオンズリーグ", "全国高等学校野球選手権大会", "M-1グランプリ", "FIFAワールドカップ", "ラグビーワールドカップ", "全豪オープン", "全仏オープン", "全米オープン", "ツール・ド・フランス", "スーパーボウル", "NBAファイナル", "日本シリーズ", "箱根駅伝", "甲子園", "RIZIN", "EVO", "THE SECOND"],
  "tv_program": ["情熱大陸", "プロフェッショナル 仕事の流儀", "ブラタモリ", "世界ふしぎ発見！", "水曜日のダウンタウン", "探偵！ナイトスクープ", "NHKスペシャル", "ダーウィンが来た！", "カンブリア宮殿", "ガイアの夜明け", "ドキュメント72時間", "ザ・ノンフィクション", "クローズアップ現代", "タモリ倶楽部", "笑点", "鉄腕DASH", "有吉の壁", "プレバト!!", "マツコの知らない世界", "徹子の部屋"],
  "variety_show": ["水曜日のダウンタウン", "月曜から夜ふかし", "アメトーーク！", "ゴッドタン", "しゃべくり007", "探偵！ナイトスクープ", "内村プロデュース", "リンカーン", "めちゃ×2イケてるッ！", "はねるのトびら", "トリビアの泉", "クイズ☆正解は一年後", "相席食堂", "千鳥のクセスゴ！", "有吉ぃぃeeeee！", "有吉の壁", "マツコ＆有吉 かりそめ天国", "それSnow Manにやらせて下さい", "ラヴィット！", "テレビ千鳥"],
  "video_channel": ["QuizKnock", "THE FIRST TAKE", "ゲームさんぽ", "NOBROCK TV", "Kurzgesagt", "TED", "東海オンエア", "HIKAKIN TV", "さらば青春の光Official Youtube Channel", "オモコロチャンネル", "ゆる言語学ラジオ", "PIVOT 公式チャンネル", "ReHacQ", "WIRED Japan", "National Geographic", "Vox", "TED-Ed", "IGN", "Digital Foundry", "NPR Music"],
  "voice_actor": ["山寺宏一", "林原めぐみ", "大塚明夫", "早見沙織", "悠木碧", "神谷浩史", "若本規夫", "中田譲治", "関智一", "子安武人", "石田彰", "櫻井孝宏", "花澤香菜", "坂本真綾", "田中敦子", "日髙のり子", "高山みなみ", "緒方恵美", "古谷徹", "野沢雅子"],
  "vtuber": ["キズナアイ", "宝鐘マリン", "月ノ美兎", "しぐれうい", "さくらみこ", "叶", "兎田ぺこら", "星街すいせい", "白上フブキ", "大空スバル", "戌神ころね", "葛葉", "剣持刀也", "壱百満天原サロメ", "周防パトラ", "名取さな", "花譜", "ピーナッツくん", "甲賀流忍者！ぽんぽこ", "天開司"],
  "war": ["源平合戦", "百年戦争", "ポエニ戦争", "三十年戦争", "第一次世界大戦", "戊辰戦争", "承久の乱", "応仁の乱", "日清戦争", "日露戦争", "第二次世界大戦", "ナポレオン戦争", "アメリカ南北戦争", "七年戦争", "クリミア戦争", "朝鮮戦争", "ベトナム戦争", "薔薇戦争", "ペロポネソス戦争", "普仏戦争"],
  "web_novel": ["無職転生", "転生したらスライムだった件", "Re:ゼロから始める異世界生活", "本好きの下剋上", "蜘蛛ですが、なにか？", "薬屋のひとりごと", "ありふれた職業で世界最強", "盾の勇者の成り上がり", "オーバーロード", "この素晴らしい世界に祝福を！", "ログ・ホライズン", "転生したら剣でした", "異世界食堂", "デスマーチからはじまる異世界狂想曲", "謙虚、堅実をモットーに生きております！", "異世界迷宮でハーレムを", "乙女ゲームの破滅フラグしかない悪役令嬢に転生してしまった…", "賢者の孫", "ナイツ＆マジック", "異世界居酒屋「のぶ」"],
  "website_community": ["Reddit", "5ちゃんねる", "pixiv", "ニコニコ動画", "Qiita", "Zenn", "Wikipedia", "note", "はてなブックマーク", "Togetter", "YouTube", "X", "Discord", "Stack Overflow", "GitHub", "Hacker News", "Quora", "Tumblr", "DeviantArt", "Mastodon"],
  "yokai_monster": ["河童", "天狗", "ぬらりひょん", "口裂け女", "鬼", "土蜘蛛", "座敷童子", "一反木綿", "ろくろ首", "ぬりかべ", "からかさ小僧", "海坊主", "雪女", "鎌鼬", "鵺", "酒呑童子", "九尾の狐", "牛鬼", "件", "アマビエ"],
  "youtuber": ["HIKAKIN", "はじめしゃちょー", "QuizKnock", "東海オンエア", "Fischer's", "キヨ。", "ヒカル", "コムドット", "水溜りボンド", "カジサック", "すしらーめん《りく》", "瀬戸弘司", "PDS株式会社", "おるたなChannel", "きまぐれクック", "中田敦彦のYouTube大学", "リュウジのバズレシピ", "Kevin’s English Room", "さらば青春の光Official Youtube Channel", "オモコロチャンネル"],
};

export function getPromptedLearningSuggestions(
  questionId: string | undefined,
  random = Math.random,
  limit = 5,
  exclude: readonly string[] = [],
): string[] {
  const question = findPromptedLearningQuestion(questionId);
  if (!question) return [];

  const excluded = new Set(exclude.map((item) => item.normalize('NFKC').trim().toLowerCase()));
  const pool = [...(PROMPTED_SUGGESTIONS_BY_ENTITY_KIND[question.entityKind] ?? [])]
    .filter((item) => !excluded.has(item.normalize('NFKC').trim().toLowerCase()));

  // If every candidate has already been learned, still show examples rather
  // than leaving the hint area empty.
  const source = pool.length ? pool : [...(PROMPTED_SUGGESTIONS_BY_ENTITY_KIND[question.entityKind] ?? [])];
  const picked: string[] = [];
  const working = [...source];

  while (working.length && picked.length < Math.max(0, limit)) {
    const index = Math.min(working.length - 1, Math.floor(random() * working.length));
    const [item] = working.splice(index, 1);
    if (item) picked.push(item);
  }
  return picked;
}

export function findPromptedLearningQuestion(questionId: string | undefined) {
  if (!questionId) return undefined;
  return PROMPTED_LEARNING_QUESTIONS.find((question) => question.id === questionId);
}

export function findPromptedLearningAxis(questionId: string | undefined, axisId: string | undefined) {
  const question = findPromptedLearningQuestion(questionId);
  if (!question || !axisId) return undefined;
  return question.axes.find((axis) => axis.id === axisId);
}

export function pickPromptedLearningAxis(
  question: PromptedLearningQuestion,
  attributes: Record<string, string>,
  random = Math.random,
) {
  const unanswered = question.axes.filter((axis) => !attributes[axis.attributeKey]);
  if (unanswered.length) return pickOne(unanswered, random) ?? unanswered[0];

  const lastAxisId = attributes['promptedLastAxisId'];
  const withoutLast = question.axes.filter((axis) => axis.id !== lastAxisId);
  return pickOne(withoutLast.length ? withoutLast : question.axes, random) ?? question.axes[0];
}

export function getPromptedLearningChoices(questionId: string | undefined, axisId: string | undefined): ConversationChoice[] {
  const axis = findPromptedLearningAxis(questionId, axisId);
  return axis ? axis.choices.map(({ id, label }) => ({ id, label })) : [];
}

export function findPromptedLearningChoice(
  questionId: string | undefined,
  axisId: string | undefined,
  choiceId: string,
) {
  const axis = findPromptedLearningAxis(questionId, axisId);
  return axis?.choices.find((choice) => choice.id === choiceId || choice.label === choiceId);
}

export function buildPromptedLearningOpinion(
  questionId: string | undefined,
  axisId: string | undefined,
  choiceId: string | undefined,
  word: string,
): string | null {
  if (!choiceId) return null;
  const choice = findPromptedLearningChoice(questionId, axisId, choiceId);
  return choice?.opinion?.(word) ?? null;
}

export function buildPromptedLearningRecall(
  questionId: string | undefined,
  axisId: string | undefined,
  choiceId: string | undefined,
  word: string,
): string | null {
  if (!choiceId) return null;
  const choice = findPromptedLearningChoice(questionId, axisId, choiceId);
  return choice?.recall?.(word) ?? null;
}
