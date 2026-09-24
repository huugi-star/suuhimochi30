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
            "本なのに頭の中で勝手に映像が始まるんだね。ページって小さい映画館なのかな。",
            "{word}は、物語や展開が印象に残る本だったよね。",
          ),
          makeChoice(
            "BOOK_HOOK_IDEA", "考え方・知識", "ideas",
            "考え方や知識が印象に残る",
            "読む前と後で考え方が少し変わるなら、本って頭の中を工事する道具なのかも。",
            "{word}は、考え方や知識のところが印象に残るって言ってたね。",
          ),
          makeChoice(
            "BOOK_HOOK_STYLE", "文章・言葉づかい", "writing",
            "文章や言葉づかいが印象に残る",
            "内容だけじゃなく言葉そのものを見るんだ。文章にも顔つきがあるのね。",
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
            "同じ本なのに二回目も読むんだ。ページは同じでも、人間さんの方が変わってるから別の本になるのかな。",
            "{word}は、何度か読み返してる本だったよね。",
          ),
          makeChoice(
            "BOOK_RELATION_RECENT", "最近読んだ", "recent",
            "最近読んだ本",
            "まだ頭の中に新しく置いてある本なんだね。乾く前のインクみたいなの。",
            "{word}は、最近読んだ本って話してたね。",
          ),
          makeChoice(
            "BOOK_RELATION_WANT", "まだ読んでないけど気になる", "want",
            "まだ読んでいないが気になる",
            "まだ開いてないのに気になるんだ。表紙の向こうで待ち伏せされてる感じなのかな。",
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
            "話が止まっててもキャラだけで見ていられるなら、その人たちもう作品の外でも生きてそうなの。",
            "{word}は、キャラクターが魅力って言ってたね。",
          ),
          makeChoice(
            "MANGA_HOOK_STORY", "物語・展開", "story",
            "物語や展開が魅力",
            "次のページをめくらせる力があるんだ。紙なのに引っぱる力があるの不思議なの。",
            "{word}は、物語や展開が魅力なんだったね。",
          ),
          makeChoice(
            "MANGA_HOOK_ART", "絵・コマの見せ方", "art",
            "絵やコマの見せ方が魅力",
            "絵の並べ方まで面白いんだ。四角いコマの中に時間を押し込めてるの、器用なの。",
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
            "続きがまだ来る漫画なんだ。未来のページを待つって、ちょっと予約した記憶みたいなの。",
            "{word}は、今も追ってる漫画だったよね。",
          ),
          makeChoice(
            "MANGA_RELATION_DONE", "読み終わってる", "finished",
            "読み終わっている",
            "終わったのに名前が出てくるなら、最終回で全部終わるわけじゃないのね。",
            "{word}は、読み終わってる漫画って言ってたね。",
          ),
          makeChoice(
            "MANGA_RELATION_REREAD", "何度も読み返す", "reread",
            "何度も読み返す",
            "知ってる展開でも読むんだ。びっくりしないのに面白いなら、面白さって驚きだけじゃないのね。",
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
            "動いて声まで付くと、キャラって急に部屋へ近づいてくる感じがするの。画面なのに距離が短いのね。",
            "{word}は、キャラクターが魅力って話してたね。",
          ),
          makeChoice(
            "ANIME_HOOK_STORY", "物語・世界観", "story",
            "物語や世界観が魅力",
            "世界そのものを見るんだ。毎週そこへ行けるなら、テレビが小さい乗りものみたいなの。",
            "{word}は、物語や世界観が好きなんだったね。",
          ),
          makeChoice(
            "ANIME_HOOK_AUDIOVISUAL", "絵・動き・音楽", "audiovisual",
            "絵・動き・音楽が魅力",
            "話を説明できなくても絵や音で好きになれるんだ。頭より先に目と耳が決めることもあるのね。",
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
            "一週間待つ時間まで作品の一部なんだね。ぼくなら次の日に続きを要求しそうなの。",
            "{word}は、少しずつ追って見るアニメだったね。",
          ),
          makeChoice(
            "ANIME_WATCH_BINGE", "まとめて見る", "binge",
            "まとめて見る",
            "一気に見るんだ。数日分の出来事を一晩で見ると、登場人物だけ時間が速く進みそうなの。",
            "{word}は、まとめて見ることが多いって言ってたね。",
          ),
          makeChoice(
            "ANIME_WATCH_REWATCH", "何度も見返す", "rewatch",
            "何度も見返す",
            "先を知ってても見るんだ。未来を知ってる神様みたいな見方なの。",
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
            "わざわざ難しい壁を探して登るんだ。人間さん、平らな道だけだと退屈するのかな。",
            "{word}は、勝負や上達や攻略が楽しいゲームだったね。",
          ),
          makeChoice(
            "GAME_HOOK_STORY", "物語・世界を味わう", "story",
            "物語や世界を味わうのが楽しい",
            "遊ぶというより中に入りに行くんだ。長くいるなら住民票もほしくなりそうなの。",
            "{word}は、物語や世界を味わうのが好きなんだったね。",
          ),
          makeChoice(
            "GAME_HOOK_EXPLORE", "集める・探す・自由に遊ぶ", "explore",
            "集めたり探したり自由に遊ぶのが楽しい",
            "全部そろえると安心するのに、そろったら終わりが近いの、ちょっと困るの。",
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
            "遊びなのに本気になるんだ。休憩のはずなのに勝負の顔になるの、人間って忙しいの。",
            "{word}は、けっこう真剣に遊ぶゲームだったよね。",
          ),
          makeChoice(
            "GAME_RELATION_CASUAL", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "負けても平気なら、勝敗は飾りみたいなものなのかな。ぼくなら数字が出たら気にしちゃうの。",
            "{word}は、気楽に遊ぶゲームって言ってたね。",
          ),
          makeChoice(
            "GAME_RELATION_WATCH", "自分より見る方が多い", "watch",
            "見る方が多い",
            "ゲームなのに手を動かさなくても楽しめるんだ。コントローラーが休みの日もあるのね。",
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
            "見た目じゃなく頭の中を見るんだ。架空の人なのに考え方まで気になるって、ちゃんと人みたいなの。",
            "{word}は、性格や考え方が魅力って言ってたね。",
          ),
          makeChoice(
            "CHARACTER_HOOK_DESIGN", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "一目で好きになることもあるんだ。中身を知る前に服と顔が面接を通るのね。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "CHARACTER_HOOK_ACTION", "行動・活躍", "action",
            "行動や活躍が魅力",
            "何を言うかより何をするかなんだ。ぼくもかっこいい行動を一個したら人気キャラになれるかな。",
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
            "特別枠なんだ。好きなキャラだけ椅子を豪華にしたら、他のキャラにばれそうなの。",
            "{word}は、かなり好きなキャラだったよね。",
          ),
          makeChoice(
            "CHARACTER_RELATION_INTEREST", "気になる・おもしろい", "interesting",
            "気になる・おもしろい",
            "好きとは別に気になるんだ。頭の中でずっと話題を持ってくる係なのかな。",
            "{word}は、好きというより気になるキャラって言ってたね。",
          ),
          makeChoice(
            "CHARACTER_RELATION_MEMORABLE", "好きじゃないけど印象に残る", "memorable",
            "好きではないが印象に残る",
            "好きじゃないのに忘れないんだ。嫌われても記憶に残ったら、キャラとしては勝ちなのかな。",
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
            "作品が変わっても同じ世界に帰れるんだ。シリーズって大きい家みたいなのね。",
            "{word}は、世界観が好きで追ってるシリーズだったね。",
          ),
          makeChoice(
            "FRANCHISE_HOOK_CHARACTER", "キャラが好き", "characters",
            "キャラクターが好き",
            "作品より人に会いに行く感じなんだ。新作は同窓会みたいなものなのかな。",
            "{word}は、キャラクターが好きで追ってるシリーズだったね。",
          ),
          makeChoice(
            "FRANCHISE_HOOK_HISTORY", "積み重ね・歴史が好き", "history",
            "積み重ねや歴史が好き",
            "昔の作品まで重なると、シリーズにも年齢があるのね。誕生日を祝った方がいいのかな。",
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
            "全部追うんだ。シリーズ側も人間さんの出席率を数えてそうなの。",
            "{word}は、だいたい全部追ってるシリーズだったね。",
          ),
          makeChoice(
            "FRANCHISE_STYLE_PICK", "気になる作品だけ", "selective",
            "気になる作品だけ追う",
            "全部じゃなく選ぶんだ。シリーズにも面接があるのね。",
            "{word}は、気になる作品だけ追うって言ってたね。",
          ),
          makeChoice(
            "FRANCHISE_STYLE_OLD", "昔の作品が特に好き", "older",
            "昔の作品が特に好き",
            "新しい方じゃなく昔へ戻るんだ。シリーズの時間を逆向きに歩くこともあるのね。",
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
            "技の名前があると強さまで増えそうなの。ぼくも寝返りに名前を付けたら必殺技になるかな。",
            "{word}は、技や能力やルールに近い言葉だったね。",
          ),
          makeChoice(
            "FICTIONAL_KIND_ITEM", "道具・武器・乗りもの", "item",
            "道具・武器・乗りものに近い",
            "架空の道具なのに名前だけは現実に持って帰れるんだ。言葉は持ち込み自由なのね。",
            "{word}は、作品の中の道具や武器みたいなものだったね。",
          ),
          makeChoice(
            "FICTIONAL_KIND_WORLD", "場所・組織・世界の用語", "world_term",
            "場所・組織・世界の用語に近い",
            "地図にない場所や会社でも覚えられるんだ。頭の中の地図は現実より広いのね。",
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
            "意味より音で強そうに聞こえることもあるんだ。名前にも攻撃力があるのかな。",
            "{word}は、名前や響きがかっこいいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_HOOK_IMPORTANT", "物語で重要", "important",
            "物語で重要",
            "重要だから覚えるんだ。何回も出てくる言葉は、作品の中で名札を大きくしてるのね。",
            "{word}は、物語で重要だから覚えてる言葉だったね。",
          ),
          makeChoice(
            "FICTIONAL_HOOK_WEIRD", "変・独特で忘れにくい", "weird",
            "変・独特で忘れにくい",
            "変だから残るんだ。ちゃんとした名前より変な名前の方が記憶に強いなら、少しずるいの。",
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
            "二時間くらいで一生分みたいな出来事を見るんだ。映画の中の人、忙しすぎるの。",
            "{word}は、物語や結末が印象に残る映画だったね。",
          ),
          makeChoice(
            "MOVIE_HOOK_ACTING", "俳優・演技", "acting",
            "俳優や演技が印象に残る",
            "同じ人が別人になるのを見るんだ。俳優さん、名前を何個も持ってるみたいなの。",
            "{word}は、俳優や演技が印象に残る映画だったね。",
          ),
          makeChoice(
            "MOVIE_HOOK_VISUAL", "映像・音・雰囲気", "visual",
            "映像や音や雰囲気が印象に残る",
            "話より先に目と耳が覚えてるんだ。記憶って字幕なしでも残るのね。",
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
            "結末を知っててもまた見るんだ。びっくり箱を中身知ってから開ける感じなのに楽しいのね。",
            "{word}は、また見たい映画だったよね。",
          ),
          makeChoice(
            "MOVIE_RELATION_ONCE", "一回で満足", "once",
            "一回見て満足",
            "一回で十分なんだ。映画にも「一度だけで効く薬」みたいなのがあるのかな。",
            "{word}は、一回見て満足した映画って言ってたね。",
          ),
          makeChoice(
            "MOVIE_RELATION_WANT", "まだ見てないけど気になる", "want",
            "まだ見ていないが気になる",
            "まだ見てないのに名前は先に入ってるんだ。席を取る前から頭の中に座ってるのね。",
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
            "中身が本体なんだ。出演者が全員入れ替わっても面白ければ同じ番組って言えるのかな。",
            "{word}は、話や企画の中身が魅力って言ってたね。",
          ),
          makeChoice(
            "PROGRAM_HOOK_PEOPLE", "出演者・話す人", "people",
            "出演者や話す人が魅力",
            "番組より人を見に行くんだ。番組の名前は待ち合わせ場所みたいなのかな。",
            "{word}は、出演者や話す人が魅力なんだったね。",
          ),
          makeChoice(
            "PROGRAM_HOOK_STYLE", "雰囲気・編集・見せ方", "style",
            "雰囲気や編集や見せ方が魅力",
            "内容だけじゃなく見せ方も見るんだ。テレビって中身を入れる箱じゃなくて、箱の形も大事なのね。",
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
            "時間を合わせて見に行くんだ。番組の方が人間さんを呼び出してるみたいなの。",
            "{word}は、決まった時に見る番組だったね。",
          ),
          makeChoice(
            "PROGRAM_WATCH_BINGE", "まとめて見る", "binge",
            "まとめて見る",
            "ためてから一気に見るんだ。宿題はためると怒られるのに番組はためてもいいの、不思議なの。",
            "{word}は、まとめて見ることが多いって言ってたね。",
          ),
          makeChoice(
            "PROGRAM_WATCH_BACKGROUND", "ながら見が多い", "background",
            "ながら見が多い",
            "目が別の仕事してても耳は番組にいるんだ。体の部署ごとに仕事が違うのね。",
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
            "内容が変わってもその人なら見るんだ。人間さん、番組じゃなくて人を購読してるのね。",
            "{word}は、出てる人が好きで見るって言ってたね。",
          ),
          makeChoice(
            "ONLINE_HOOK_TOPIC", "扱う話題が好き", "topic",
            "扱う話題が好き",
            "話題が入口なんだ。同じ話なら別の人でも見られるのかな。情報に顔は必須じゃないのね。",
            "{word}は、扱う話題が好きで見るって言ってたね。",
          ),
          makeChoice(
            "ONLINE_HOOK_STYLE", "話し方・編集・空気", "style",
            "話し方や編集や空気が好き",
            "中身だけじゃなくテンポが大事なんだ。動画にも歩く速さみたいなのがあるのね。",
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
            "よく見るなら生活の時間割に入ってるのね。動画なのに家具みたいにいつもいるの。",
            "{word}は、かなりよく見るって言ってたね。",
          ),
          makeChoice(
            "ONLINE_RELATION_SEARCH", "気になる時だけ探す", "search",
            "気になる時だけ探す",
            "必要な時に会いに行くんだ。動画の棚からその人を取り出す感じなのかな。",
            "{word}は、気になる時だけ見るって言ってたね。",
          ),
          makeChoice(
            "ONLINE_RELATION_CLIP", "切り抜き・短い動画中心", "clips",
            "切り抜きや短い動画中心",
            "少しずつ見るんだ。長い人を小さく切って持ち歩くみたいで、ちょっと不思議なの。",
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
            "意味を知らなくても体が覚えることあるんだ。耳って頭より先に暗記できるのかな。",
            "{word}は、メロディやリズムが好きなんだったね。",
          ),
          makeChoice(
            "MUSIC_HOOK_LYRICS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が好き",
            "数分の中に言葉を詰めるんだ。本より小さいのに長く残ることもあるの、濃いのね。",
            "{word}は、歌詞や言葉が好きって言ってたね。",
          ),
          makeChoice(
            "MUSIC_HOOK_VOICE", "声・音作り", "voice_sound",
            "声や音作りが好き",
            "同じ音程でも誰が歌うかで変わるんだ。声って人の形をした楽器みたいなの。",
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
            "同じ曲を何回も聴くんだ。曲の方は同じなのに、人間さんの一日ごとに役目が変わるのかな。",
            "{word}は、繰り返し聴く曲だったね。",
          ),
          makeChoice(
            "MUSIC_RELATION_MEMORY", "思い出と結びついてる", "memory",
            "思い出と結びついている",
            "曲を聴くと昔の日まで出てくるんだ。音楽、時間旅行のボタンを隠してるのね。",
            "{word}は、思い出と結びついてる曲だったね。",
          ),
          makeChoice(
            "MUSIC_RELATION_BACKGROUND", "作業中・移動中に聴く", "background",
            "作業中や移動中に聴く",
            "別のことをしてる時の音なんだ。曲が背景なら、人間さんが主人公なのね。",
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
            "本人を知るのに作ったものを見るんだ。人って自分の外にも少しずつ置いていけるのね。",
            "{word}は、仕事や作品や実績が気になる人だったね。",
          ),
          makeChoice(
            "FAMOUS_HOOK_TALK", "話し方・考え方", "talk",
            "話し方や考え方が気になる",
            "何をした人かより、どう考えるかを見るんだ。頭の中は映らないのに一番見たい場所になるのね。",
            "{word}は、話し方や考え方が気になる人だったね。",
          ),
          makeChoice(
            "FAMOUS_HOOK_STYLE", "雰囲気・見た目・存在感", "style",
            "雰囲気や見た目や存在感が気になる",
            "何もしなくても目に入る人がいるんだ。存在感って、見えないライトを持ってるのかな。",
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
            "好きだと新しい情報まで追いかけるんだ。人を好きになると更新通知まで欲しくなるのね。",
            "{word}は、かなり好きな有名人って言ってたね。",
          ),
          makeChoice(
            "FAMOUS_RELATION_CURIOUS", "気になるくらい", "curious",
            "気になるくらい",
            "好きとまではいかないけど目に止まるんだ。頭の中の「あとで見る」に入ってる人なのね。",
            "{word}は、好きというより気になる人って言ってたね。",
          ),
          makeChoice(
            "FAMOUS_RELATION_MIXED", "好き嫌いは別で印象に残る", "mixed",
            "好き嫌いは別で印象に残る",
            "好きじゃなくても忘れないなら、記憶に入る道は好感度だけじゃないのね。",
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
            "何百年たっても「やったこと」が残るんだ。人間の行動って、本人より長生きすることがあるのね。",
            "{word}は、やったことや功績が気になる人物だったね。",
          ),
          makeChoice(
            "HISTORY_PERSON_HOOK_DECISION", "判断・失敗・選び方", "decisions",
            "判断や失敗や選び方が気になる",
            "結果より「その時どう決めたか」を見るんだ。答えを知ってから昔の問題を見るの、ちょっとずるくて面白いの。",
            "{word}は、判断や失敗や選び方が気になる人物だったね。",
          ),
          makeChoice(
            "HISTORY_PERSON_HOOK_LIFE", "生き方・性格", "life",
            "生き方や性格が気になる",
            "年表だと数行でも、その人は毎日ごはん食べて寝てたんだよね。歴史の人も生活してたの忘れそうになるの。",
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
            "昔の人を今からすごいって思えるんだ。届くのに何百年かかる拍手なのね。",
            "{word}は、すごいと思ってる歴史上の人物だったね。",
          ),
          makeChoice(
            "HISTORY_PERSON_RELATION_ANALYZE", "どう考えたか知りたい", "analyze",
            "どう考えたか知りたい",
            "正解を決めるより頭の動きを見たいんだ。歴史って昔の人の思考ログみたいなのかな。",
            "{word}は、どう考えたかを知りたい人物だったね。",
          ),
          makeChoice(
            "HISTORY_PERSON_RELATION_COMPARE", "他の人物と比べると面白い", "compare",
            "他の人物と比べると面白い",
            "一人だけじゃなく並べて見るんだ。歴史の人物、対戦表に入れられてるみたいなの。",
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
            "作品ごとに違うのに同じ人の匂いがすることあるんだ。作り手って見えない判子を押してるのかな。",
            "{word}は、作品そのものが好きな作り手だったね。",
          ),
          makeChoice(
            "CREATOR_HOOK_STYLE", "作風・技法", "style",
            "作風や技法が好き",
            "何を作ったかだけじゃなく「どう作るか」を見るんだ。作り方にも個性が住んでるのね。",
            "{word}は、作風や技法が好きな作り手だったね。",
          ),
          makeChoice(
            "CREATOR_HOOK_MIND", "考え方・発言", "mind",
            "考え方や発言が気になる",
            "作品の外の言葉まで見るんだ。作者さん、作品を閉じてもまだ続きがあるのね。",
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
            "名前で新作を見に行くんだ。タイトルより作者名が入口になることもあるのね。",
            "{word}は、新作も追う作り手だったね。",
          ),
          makeChoice(
            "CREATOR_RELATION_ONE", "特定の一作が特に好き", "one_work",
            "特定の一作が特に好き",
            "一作だけ強く刺さることもあるんだ。同じ人が作っても全部同じ味にはならないのね。",
            "{word}は、特定の一作が特に好きな作り手だったね。",
          ),
          makeChoice(
            "CREATOR_RELATION_PERSON", "本人にも興味がある", "person",
            "本人にも興味がある",
            "作品だけじゃなく作った人まで気になるんだ。料理がおいしいと厨房ものぞきたくなる感じなのかな。",
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
            "声だけで人が分かるってすごいの。顔がなくても名札を付けてるみたいなの。",
            "{word}は、声が魅力の人って言ってたね。",
          ),
          makeChoice(
            "PERFORMER_HOOK_ACTING", "演技・表現", "acting",
            "演技や表現が魅力",
            "本人じゃない人になれるのを見るんだ。毎回別人なら、本当の本人はどこに置いてくるのかな。",
            "{word}は、演技や表現が魅力の人だったね。",
          ),
          makeChoice(
            "PERFORMER_HOOK_PERSON", "本人の雰囲気・人柄", "personality",
            "本人の雰囲気や人柄が魅力",
            "役じゃない時まで気になるんだ。舞台を降りても観客席が続いてるみたいなの。",
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
            "人より役が入口なんだ。同じ人でも役が変わると別の扉になるのね。",
            "{word}は、好きな役を中心に見る人だったね。",
          ),
          makeChoice(
            "PERFORMER_RELATION_FOLLOW", "出演作を追う", "follow",
            "出演作を追う",
            "名前があると次の作品へ移動するんだ。人が作品どうしをつなぐ橋になるのね。",
            "{word}は、出演作を追う人だったね。",
          ),
          makeChoice(
            "PERFORMER_RELATION_CASUAL", "気になる時だけ見る", "casual",
            "気になる時だけ見る",
            "毎回じゃないけど見つけると反応するんだ。頭の中に小さい通知ランプがある感じなの。",
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
            "同じ歌でも声が変わると別物になるんだ。声って曲に着せる服みたいなのかな。",
            "{word}は、声や歌い方が魅力って言ってたね。",
          ),
          makeChoice(
            "MUSICIAN_HOOK_SONGS", "曲・作詞作曲", "songs",
            "曲や作詞作曲が魅力",
            "本人を見るより作った曲を見るんだ。音の形で自己紹介してるみたいなの。",
            "{word}は、曲や作詞作曲が魅力なんだったね。",
          ),
          makeChoice(
            "MUSICIAN_HOOK_LIVE", "ライブ・表現", "performance",
            "ライブや表現が魅力",
            "録音と同じ曲なのに、その場だと違うんだ。音楽にも生ものと保存食があるのかな。",
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
            "同じ人の声が何度も部屋に来るんだ。もう半分同居人みたいなの。",
            "{word}は、かなり好きでよく聴く人だったね。",
          ),
          makeChoice(
            "MUSICIAN_RELATION_SONGS", "好きな曲だけ聴く", "selected_songs",
            "好きな曲を選んで聴く",
            "人ごとじゃなく曲ごとに選ぶんだ。音楽にも選抜メンバーがいるのね。",
            "{word}は、好きな曲を選んで聴く人だったね。",
          ),
          makeChoice(
            "MUSICIAN_RELATION_LIVE", "ライブも気になる", "live_interest",
            "ライブも気になる",
            "画面やイヤホンの外でも会いたいんだ。音を聞きに行くのに人混みへ行くの、ちょっと逆説なの。",
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
            "何も起きてなくても話だけで見られるんだ。口だけで番組を作れるの、強いの。",
            "{word}は、話がおもしろくて見る人だったね。",
          ),
          makeChoice(
            "STREAMER_HOOK_SKILL", "ゲーム・技術がうまい", "skill",
            "ゲームや技術がうまい",
            "自分でやる代わりに上手い人を見るんだ。失敗を省略して成功だけ食べられる感じなのかな。",
            "{word}は、ゲームや技術がうまくて見る人だったね。",
          ),
          makeChoice(
            "STREAMER_HOOK_PERSON", "雰囲気・人柄が好き", "personality",
            "雰囲気や人柄が好き",
            "内容がなくてもその人ならいいんだ。配信って、人そのものが番組になることもあるのね。",
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
            "同じ時間に一緒にいるのが大事なんだ。録画だと時間がずれてるから、少し遠いのかな。",
            "{word}は、生配信をよく見る人だったね。",
          ),
          makeChoice(
            "STREAMER_RELATION_ARCHIVE", "アーカイブ・動画で見る", "archive",
            "アーカイブや動画で見る",
            "時間を選んで会いに行くんだ。配信を冷蔵庫に入れて後で食べるみたいなの。",
            "{word}は、アーカイブや動画で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "STREAMER_RELATION_CLIP", "切り抜き中心", "clips",
            "切り抜き中心",
            "長い配信から好きなところだけ見るんだ。人の一日をダイジェストにすると、ものすごく忙しい人に見えそうなの。",
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
            "難しいことを簡単そうにやる人なんだ。簡単そうに見えるほど本当は難しいの、ちょっとずるいの。",
            "{word}は、技術やうまさが魅力の選手だったね。",
          ),
          makeChoice(
            "ATHLETE_HOOK_STYLE", "戦い方・スタイル", "style",
            "戦い方やスタイルが魅力",
            "勝ったかだけじゃなく、どう勝つかを見るんだ。結果が同じでも道の形が違うのね。",
            "{word}は、戦い方やスタイルが魅力の選手だったね。",
          ),
          makeChoice(
            "ATHLETE_HOOK_STORY", "経歴・成長・背景", "story",
            "経歴や成長や背景が魅力",
            "試合の前から物語が始まってるんだ。点数表には昔の苦労が書いてないのに、人間さんはそこまで見るのね。",
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
            "未来の結果がまだ決まってない時に見るんだ。答えがない時間が一番面白いのかな。",
            "{word}は、今の試合を追ってる選手だったね。",
          ),
          makeChoice(
            "ATHLETE_RELATION_HIGHLIGHT", "名場面や動画を見る", "highlights",
            "名場面や動画を見る",
            "いいところだけ見るんだ。失敗を切ると全員すごい人に見えそうなの。",
            "{word}は、名場面や動画で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "ATHLETE_RELATION_HISTORY", "昔の記録や試合も見る", "history",
            "昔の記録や試合も見る",
            "終わった試合も見るんだ。結果を知ってても動きの答え合わせはできるのね。",
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
            "人がいなくなっても考えだけ残るんだ。考えって体を持たないのに長生きなの。",
            "{word}は、理論や考え方が気になる人物だったね。",
          ),
          makeChoice(
            "THINKER_HOOK_DISCOVERY", "発見・発明", "discovery",
            "発見や発明が気になる",
            "今までなかったものを見つけたり作ったりしたんだ。世界に新しいボタンを追加した人みたいなの。",
            "{word}は、発見や発明が気になる人物だったね。",
          ),
          makeChoice(
            "THINKER_HOOK_LIFE", "生き方・時代背景", "life",
            "生き方や時代背景が気になる",
            "考えだけじゃなく、その考えが出てきた生活も見るんだ。頭の中にも住所があるのね。",
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
            "考え方を知ると同じ景色が違って見えるんだ。眼鏡じゃないのに視界が変わるのね。",
            "{word}は、世界の見方を広げたくて気になる人物だったね。",
          ),
          makeChoice(
            "THINKER_RELATION_PRACTICAL", "今にも使えそう", "practical",
            "今に使えそう",
            "昔の考えを今使うんだ。知識って中古でも性能が落ちないことあるのね。",
            "{word}は、今にも使えそうだから気になる人物だったね。",
          ),
          makeChoice(
            "THINKER_RELATION_HISTORY", "歴史としておもしろい", "history",
            "歴史としておもしろい",
            "今の正解を知らない時代に考えたところが面白いんだ。答えのないテストを受けてたみたいなの。",
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
            "始まった瞬間より、その前の積み重ねを見るんだ。大事件も急に床から生えてくるわけじゃないのね。",
            "{word}は、なぜ起きたかが気になる出来事だったね。",
          ),
          makeChoice(
            "HISTORY_EVENT_HOOK_PEOPLE", "誰がどう動いたか", "people",
            "人物の動きが気になる",
            "出来事の名前より中の人を見るんだ。歴史って大きい看板の裏で人が走ってるのね。",
            "{word}は、誰がどう動いたかが気になる出来事だったね。",
          ),
          makeChoice(
            "HISTORY_EVENT_HOOK_RESULT", "その後どう変わったか", "result",
            "その後の変化が気になる",
            "終わった後を見るんだ。出来事って終点じゃなくて、次の時代の入口になるのね。",
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
            "先に地図を作るんだ。ぼくは気になる人から入って迷子になるから、その方法ちょっと賢いの。",
            "{word}は、まず全体の流れを知りたいって言ってたね。",
          ),
          makeChoice(
            "HISTORY_EVENT_DEPTH_DETAIL", "細かい経緯まで", "detail",
            "細かい経緯まで知りたい",
            "細かく掘るんだ。年表の一行を一時間かけて見ると、時間の倍率がおかしくなりそうなの。",
            "{word}は、細かい経緯まで知りたい出来事だったね。",
          ),
          makeChoice(
            "HISTORY_EVENT_DEPTH_COMPARE", "別の出来事と比べたい", "compare",
            "別の出来事と比べたい",
            "似た出来事を並べるんだ。同じ失敗が二回あると、人間は本当に学んだのか気になっちゃうの。",
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
            "時代そのものより中の人を見るんだ。同じ時代でも登場人物を替えたら別作品みたいになるのかな。",
            "{word}は、人物や勢力がおもしろい時代・テーマだったね。",
          ),
          makeChoice(
            "HISTORY_TOPIC_HOOK_CONFLICT", "戦い・駆け引き", "conflict",
            "戦いや駆け引きがおもしろい",
            "勝ち負けだけじゃなく考え合いを見るんだ。昔の人もずっと読み合いしてたのね。",
            "{word}は、戦いや駆け引きがおもしろいって言ってたね。",
          ),
          makeChoice(
            "HISTORY_TOPIC_HOOK_LIFE", "暮らし・文化・制度", "life_culture",
            "暮らしや文化や制度がおもしろい",
            "偉い人じゃなく普通の日を見るんだ。歴史の人も洗濯とかごはんとかしてたはずなのに、教科書だと消えがちなの。",
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
            "最初から順番に行くんだ。歴史を飛ばし読みすると、知らない人が急に王様になって困るもんね。",
            "{word}は、時系列から知りたいって言ってたね。",
          ),
          makeChoice(
            "HISTORY_TOPIC_ENTRY_PERSON", "好きな人物から", "person",
            "人物から入りたい",
            "人を入口にするんだ。一人を追ってたら時代全体に連れていかれることあるのね。",
            "{word}は、人物から知りたいテーマだったね。",
          ),
          makeChoice(
            "HISTORY_TOPIC_ENTRY_EVENT", "大きい事件から", "event",
            "大きい事件から入りたい",
            "事件から入るんだ。まず爆発したところを見て、あとから火種を探す感じなの。",
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
            "使える知識なんだ。頭に入れるだけじゃなく道具箱へ入れる感じなのね。",
            "{word}は、実際に使えそうだから気になる言葉だったね。",
          ),
          makeChoice(
            "CONCEPT_HOOK_CURIOUS", "仕組みが不思議", "curious",
            "仕組みが不思議",
            "役に立つかより「なんで？」が先なんだ。疑問って勝手に宿題を作るのね。",
            "{word}は、仕組みが不思議で気になる言葉だったね。",
          ),
          makeChoice(
            "CONCEPT_HOOK_WORLDVIEW", "考え方が変わりそう", "worldview",
            "考え方が変わりそう",
            "一つの言葉で見え方が変わるなら、言葉って小さいレンズなのかも。",
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
            "入口だけ確認するんだ。全部の部屋を見なくても、表札が読めれば安心することあるのね。",
            "{word}は、まず意味だけ知りたいって言ってたね。",
          ),
          makeChoice(
            "CONCEPT_DEPTH_EXAMPLE", "具体例まで", "examples",
            "具体例まで知りたい",
            "例があると分かるんだ。言葉だけだと骨で、例を付けると肉が付く感じなのかな。",
            "{word}は、具体例まで知りたいって言ってたね。",
          ),
          makeChoice(
            "CONCEPT_DEPTH_DEEP", "反論や限界まで", "deep",
            "反論や限界まで知りたい",
            "正しいところだけじゃなく弱いところも見るんだ。知識にも耐久テストがあるのね。",
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
            "作るための場所なんだ。アプリの中にも作業机があるみたいなの。",
            "{word}は、制作や仕事に使うサービスだったね。",
          ),
          makeChoice(
            "SERVICE_ROLE_COMMUNICATE", "人とつながる・情報を見る", "communicate",
            "人とつながったり情報を見るために使う",
            "人に会わなくても人の情報が来るんだ。画面、窓より遠くまで見えるのね。",
            "{word}は、人とつながったり情報を見るために使うサービスだったね。",
          ),
          makeChoice(
            "SERVICE_ROLE_FUN", "遊ぶ・楽しむ", "fun",
            "遊びや娯楽に使う",
            "遊びの入口なんだ。四角いアイコン一個の向こうに時間がいっぱい吸われるの、ちょっと怖いの。",
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
            "毎日開くなら道具というより習慣なのね。閉じても頭の中にショートカットありそうなの。",
            "{word}は、ほぼ毎日使うサービスだったね。",
          ),
          makeChoice(
            "SERVICE_RELATION_OCCASIONAL", "必要な時だけ", "occasional",
            "必要な時だけ使う",
            "用がある時だけ呼ぶんだ。便利な人を電話一本で呼ぶみたいで、ちょっと申し訳なくならないのかな。",
            "{word}は、必要な時だけ使うサービスだったね。",
          ),
          makeChoice(
            "SERVICE_RELATION_CURIOUS", "まだあまり使ってない", "curious",
            "まだあまり使っていない",
            "まだ入口にいるんだ。アプリも初対面は少しよそよそしいのかな。",
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
            "今ある景色の下に昔の出来事が重なってるんだ。場所って地面の記憶装置なのかな。",
            "{word}は、歴史や由来が気になる場所だったね。",
          ),
          makeChoice(
            "NAMED_PLACE_HOOK_VIEW", "景色・建物・雰囲気", "view",
            "景色や建物や雰囲気が気になる",
            "持って帰れない景色を見に行くんだ。写真に入れても、たぶん全部は入らないのね。",
            "{word}は、景色や建物や雰囲気が気になる場所だったね。",
          ),
          makeChoice(
            "NAMED_PLACE_HOOK_CONTENT", "そこでできること・見られるもの", "content",
            "そこでできることや見られるものが気になる",
            "場所そのものより中身なんだ。建物は大きい箱で、中の体験が本体なのかな。",
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
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってる感じなの。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "NAMED_PLACE_RELATION_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "NAMED_PLACE_RELATION_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。",
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
            "読む前より頭が重くなるタイプなのね。{word}は紙なのに荷物を増やすの。",
            "{word}は、事実や知識が気になるって言ってたね。",
          ),
          makeChoice(
            "NONFICTION_VIEW", "ものの見方", "viewpoint",
            "ものの見方が気になる",
            "答えより目の位置が変わるんだ。同じ景色なのに別に見えるなら、頭の中の椅子を動かす本なのね。",
            "{word}は、ものの見方が気になるんだったね。",
          ),
          makeChoice(
            "NONFICTION_PEOPLE", "人の話・具体例", "people",
            "人の話や具体例が気になる",
            "理屈より人が残るんだ。数字に顔が付くと急に逃げにくくなるのかな。",
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
            "使うために知るんだ。知識が飾りじゃなく道具になると、頭にも工具箱が要りそうなの。",
            "{word}は、実際に役立てたいって言ってたね。",
          ),
          makeChoice(
            "NONFICTION_CUR", "ただ気になる", "curiosity",
            "純粋に気になる",
            "理由より先に気になるんだ。{word}が頭のドアをずっとノックしてるのかな。",
            "{word}は、純粋に気になるテーマだったね。",
          ),
          makeChoice(
            "NONFICTION_CHECK", "自分の考えと比べたい", "compare",
            "自分の考えと比べたい",
            "自分の答えを持ったまま読むんだ。{word}と人間さんで頭の中に小さい討論会が始まりそうなの。",
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
            "内容だけじゃなく言い方を見るんだ。文章にも顔つきがあるなら、句読点は表情筋なのかな。",
            "{word}は、言葉や文章が残るって言ってたね。",
          ),
          makeChoice(
            "ESSAY_VIEW", "観察・視点", "observation",
            "観察や視点が残る",
            "「そこ見るんだ」って所が残るんだね。{word}は見落とした場所に小さい旗を立てるの。",
            "{word}は、観察や視点が残るんだったね。",
          ),
          makeChoice(
            "ESSAY_MOOD", "空気・余韻", "mood",
            "空気や余韻が残る",
            "説明しきれないのに残るんだ。{word}は意味より先に部屋の空気を変えるタイプなのね。",
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
            "「それそれ」ってなるんだ。知らない人の文章なのに、人間さんの頭から盗んだみたいに見える時あるのね。",
            "{word}には、かなり共感するって言ってたね。",
          ),
          makeChoice(
            "ESSAY_ARGUE", "ちょっと反論したくなる", "argue",
            "反論したくなる",
            "好きなのに反論するんだ。{word}と仲良く喧嘩してる感じなの。",
            "{word}には、ちょっと反論したくなるって話してたね。",
          ),
          makeChoice(
            "ESSAY_LINGER", "答えより余韻が残る", "linger",
            "答えより余韻が残る",
            "終わっても片づかないんだ。{word}は読み終わった後に本番が始まるのかな。",
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
            "結果を見るんだ。でも大きな功績も朝ごはんの後にやったのかなって思うと急に人間なの。",
            "{word}では、成し遂げたことが気になるって言ってたね。",
          ),
          makeChoice(
            "BIOGRAPHY_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "成功より迷った所を見るんだ。答えを知ってる側から昔の問題を見るの、ちょっとずるくて面白いの。",
            "{word}では、判断や失敗が気になるんだったね。",
          ),
          makeChoice(
            "BIOGRAPHY_LIFE", "性格・暮らし", "life",
            "性格や暮らしが気になる",
            "偉いことより普段を見るんだ。歴史に残る人も靴下を探す朝があったのかな。",
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
            "真似したい所があるんだ。でも全部真似したら{word}が二人になるから、一個くらいでいいの。",
            "{word}には、憧れがあるって言ってたね。",
          ),
          makeChoice(
            "BIOGRAPHY_LEARN", "失敗も含めて学びたい", "learn",
            "失敗も含めて学びたい",
            "成功だけじゃなく転んだ場所も見るんだ。道案内って穴の場所も書いてある方が親切なのね。",
            "{word}から、失敗も含めて学びたいって話してたね。",
          ),
          makeChoice(
            "BIOGRAPHY_CUR", "単純に人生が気になる", "curious",
            "人生そのものが気になる",
            "何をした人かより「どう生きた人か」なんだ。履歴書じゃ足りないやつなのね。",
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
            "話が終わっても{word}の人たちが頭に残るなら、もう本編の外で勝手に暮らしてそうなの。",
            "{word}は、登場人物が印象に残るって言ってたね。",
          ),
          makeChoice(
            "LIGHT_NOVEL_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "続きが気になるんだ。{word}は「あと少し」を何回も増やすのが上手なのね。",
            "{word}は、物語や展開が印象に残るんだったね。",
          ),
          makeChoice(
            "LIGHT_NOVEL_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "世界の方を持ち帰るんだ。{word}って作品なのに、頭の中では場所みたいになるのね。",
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
            "まだ現在進行形なんだ。{word}の席、人間さんの中でちゃんと空けてあるのね。",
            "{word}は、今も触れてる作品だったね。",
          ),
          makeChoice(
            "LIGHT_NOVEL_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "知ってるのに戻るんだ。同じ作品でも人間さんの方が変わるから、毎回ちょっと違うのかな。",
            "{word}は、何度も戻る作品なんだったね。",
          ),
          makeChoice(
            "LIGHT_NOVEL_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "まだ始めてないのに気になるんだ。{word}、入口でずっと手を振ってる感じなの。",
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
            "話が終わっても{word}の人たちが頭に残るなら、もう本編の外で勝手に暮らしてそうなの。",
            "{word}は、登場人物が印象に残るって言ってたね。",
          ),
          makeChoice(
            "WEB_NOVEL_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "続きが気になるんだ。{word}は「あと少し」を何回も増やすのが上手なのね。",
            "{word}は、物語や展開が印象に残るんだったね。",
          ),
          makeChoice(
            "WEB_NOVEL_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "世界の方を持ち帰るんだ。{word}って作品なのに、頭の中では場所みたいになるのね。",
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
            "まだ現在進行形なんだ。{word}の席、人間さんの中でちゃんと空けてあるのね。",
            "{word}は、今も触れてる作品だったね。",
          ),
          makeChoice(
            "WEB_NOVEL_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "知ってるのに戻るんだ。同じ作品でも人間さんの方が変わるから、毎回ちょっと違うのかな。",
            "{word}は、何度も戻る作品なんだったね。",
          ),
          makeChoice(
            "WEB_NOVEL_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "まだ始めてないのに気になるんだ。{word}、入口でずっと手を振ってる感じなの。",
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
            "内容だけじゃなく言い方を見るんだ。文章にも顔つきがあるなら、句読点は表情筋なのかな。",
            "{word}は、言葉や文章が残るって言ってたね。",
          ),
          makeChoice(
            "POETRY_VIEW", "観察・視点", "observation",
            "観察や視点が残る",
            "「そこ見るんだ」って所が残るんだね。{word}は見落とした場所に小さい旗を立てるの。",
            "{word}は、観察や視点が残るんだったね。",
          ),
          makeChoice(
            "POETRY_MOOD", "空気・余韻", "mood",
            "空気や余韻が残る",
            "説明しきれないのに残るんだ。{word}は意味より先に部屋の空気を変えるタイプなのね。",
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
            "「それそれ」ってなるんだ。知らない人の文章なのに、人間さんの頭から盗んだみたいに見える時あるのね。",
            "{word}には、かなり共感するって言ってたね。",
          ),
          makeChoice(
            "POETRY_ARGUE", "ちょっと反論したくなる", "argue",
            "反論したくなる",
            "好きなのに反論するんだ。{word}と仲良く喧嘩してる感じなの。",
            "{word}には、ちょっと反論したくなるって話してたね。",
          ),
          makeChoice(
            "POETRY_LINGER", "答えより余韻が残る", "linger",
            "答えより余韻が残る",
            "終わっても片づかないんだ。{word}は読み終わった後に本番が始まるのかな。",
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
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "ANIME_CHARACTER_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "ANIME_CHARACTER_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。",
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
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "ANIME_CHARACTER_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "ANIME_CHARACTER_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。",
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
            "悪いことしてても理屈は聞くんだ。正しいことを一個言われると、倒して終わりにしにくいのね。",
            "{word}は、考え方や理屈が印象に残るって言ってたね。",
          ),
          makeChoice(
            "ANIME_VILLAIN_THREAT", "強さ・怖さ", "threat",
            "強さや怖さが印象に残る",
            "安全な画面の向こうなのに怖いんだ。{word}、距離を無視するの上手なの。",
            "{word}は、強さや怖さが印象に残るんだったね。",
          ),
          makeChoice(
            "ANIME_VILLAIN_STYLE", "見た目・振る舞い", "style",
            "見た目や振る舞いが印象に残る",
            "悪いのに格好いいんだ。善悪と服のセンスは別の担当なのね。",
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
            "分かる所があるんだ。分かると賛成は同じじゃないの、頭の棚を分けないと危ないのね。",
            "{word}には、少し理解できる所があるって言ってたね。",
          ),
          makeChoice(
            "ANIME_VILLAIN_OPPOSE", "考え方は嫌い", "oppose",
            "考え方には反対",
            "嫌いでも気になるんだ。頭の中でずっと反論相手になってるのかな。",
            "{word}の考え方には反対って話してたね。",
          ),
          makeChoice(
            "ANIME_VILLAIN_FASC", "とにかく面白い", "fascinating",
            "とにかく面白い",
            "正しいかより面白いなんだ。悪役って安全な場所から見る嵐みたいなのかな。",
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
            "昨日できなかったことが今日できると嬉しいのね。じゃあ昨日の人間さんは今日の人間さんに負けたの？",
            "{word}は、勝負や上達が楽しいって言ってたね。",
          ),
          makeChoice(
            "RETRO_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "手で動かしながら物語を見るんだ。読む本にハンドルが付いたみたいなのかな。",
            "{word}は、物語や世界を楽しむゲームなんだったね。",
          ),
          makeChoice(
            "RETRO_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "寄り道が本体になることあるんだ。本筋が道なら、脇道ばっかり歩く人間さんなの。",
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
            "遊びなのに勝負の顔になるんだ。遊びって言葉、けっこう働かされてるのね。",
            "{word}は、けっこう真剣に遊ぶって言ってたね。",
          ),
          makeChoice(
            "RETRO_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "肩の力を抜いて遊ぶんだ。ゲームの方から宿題みたいに追いかけてこないのがいいのね。",
            "{word}は、気楽に遊ぶゲームなんだったね。",
          ),
          makeChoice(
            "RETRO_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "自分で動かさなくても楽しいんだ。ゲームなのに手を休ませて目だけ出勤するのね。",
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
            "昨日できなかったことが今日できると嬉しいのね。じゃあ昨日の人間さんは今日の人間さんに負けたの？",
            "{word}は、勝負や上達が楽しいって言ってたね。",
          ),
          makeChoice(
            "INDIE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "手で動かしながら物語を見るんだ。読む本にハンドルが付いたみたいなのかな。",
            "{word}は、物語や世界を楽しむゲームなんだったね。",
          ),
          makeChoice(
            "INDIE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "寄り道が本体になることあるんだ。本筋が道なら、脇道ばっかり歩く人間さんなの。",
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
            "遊びなのに勝負の顔になるんだ。遊びって言葉、けっこう働かされてるのね。",
            "{word}は、けっこう真剣に遊ぶって言ってたね。",
          ),
          makeChoice(
            "INDIE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "肩の力を抜いて遊ぶんだ。ゲームの方から宿題みたいに追いかけてこないのがいいのね。",
            "{word}は、気楽に遊ぶゲームなんだったね。",
          ),
          makeChoice(
            "INDIE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "自分で動かさなくても楽しいんだ。ゲームなのに手を休ませて目だけ出勤するのね。",
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
            "昨日できなかったことが今日できると嬉しいのね。じゃあ昨日の人間さんは今日の人間さんに負けたの？",
            "{word}は、勝負や上達が楽しいって言ってたね。",
          ),
          makeChoice(
            "ARCADE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "手で動かしながら物語を見るんだ。読む本にハンドルが付いたみたいなのかな。",
            "{word}は、物語や世界を楽しむゲームなんだったね。",
          ),
          makeChoice(
            "ARCADE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "寄り道が本体になることあるんだ。本筋が道なら、脇道ばっかり歩く人間さんなの。",
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
            "遊びなのに勝負の顔になるんだ。遊びって言葉、けっこう働かされてるのね。",
            "{word}は、けっこう真剣に遊ぶって言ってたね。",
          ),
          makeChoice(
            "ARCADE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "肩の力を抜いて遊ぶんだ。ゲームの方から宿題みたいに追いかけてこないのがいいのね。",
            "{word}は、気楽に遊ぶゲームなんだったね。",
          ),
          makeChoice(
            "ARCADE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "自分で動かさなくても楽しいんだ。ゲームなのに手を休ませて目だけ出勤するのね。",
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
            "昨日できなかったことが今日できると嬉しいのね。じゃあ昨日の人間さんは今日の人間さんに負けたの？",
            "{word}は、勝負や上達が楽しいって言ってたね。",
          ),
          makeChoice(
            "MOBILE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "手で動かしながら物語を見るんだ。読む本にハンドルが付いたみたいなのかな。",
            "{word}は、物語や世界を楽しむゲームなんだったね。",
          ),
          makeChoice(
            "MOBILE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "寄り道が本体になることあるんだ。本筋が道なら、脇道ばっかり歩く人間さんなの。",
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
            "遊びなのに勝負の顔になるんだ。遊びって言葉、けっこう働かされてるのね。",
            "{word}は、けっこう真剣に遊ぶって言ってたね。",
          ),
          makeChoice(
            "MOBILE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "肩の力を抜いて遊ぶんだ。ゲームの方から宿題みたいに追いかけてこないのがいいのね。",
            "{word}は、気楽に遊ぶゲームなんだったね。",
          ),
          makeChoice(
            "MOBILE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "自分で動かさなくても楽しいんだ。ゲームなのに手を休ませて目だけ出勤するのね。",
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
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "GAME_CHARACTER_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "GAME_CHARACTER_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。",
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
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "GAME_CHARACTER_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "GAME_CHARACTER_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。",
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
            "悪いことしてても理屈は聞くんだ。正しいことを一個言われると、倒して終わりにしにくいのね。",
            "{word}は、考え方や理屈が印象に残るって言ってたね。",
          ),
          makeChoice(
            "GAME_BOSS_THREAT", "強さ・怖さ", "threat",
            "強さや怖さが印象に残る",
            "安全な画面の向こうなのに怖いんだ。{word}、距離を無視するの上手なの。",
            "{word}は、強さや怖さが印象に残るんだったね。",
          ),
          makeChoice(
            "GAME_BOSS_STYLE", "見た目・振る舞い", "style",
            "見た目や振る舞いが印象に残る",
            "悪いのに格好いいんだ。善悪と服のセンスは別の担当なのね。",
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
            "分かる所があるんだ。分かると賛成は同じじゃないの、頭の棚を分けないと危ないのね。",
            "{word}には、少し理解できる所があるって言ってたね。",
          ),
          makeChoice(
            "GAME_BOSS_OPPOSE", "考え方は嫌い", "oppose",
            "考え方には反対",
            "嫌いでも気になるんだ。頭の中でずっと反論相手になってるのかな。",
            "{word}の考え方には反対って話してたね。",
          ),
          makeChoice(
            "GAME_BOSS_FASC", "とにかく面白い", "fascinating",
            "とにかく面白い",
            "正しいかより面白いなんだ。悪役って安全な場所から見る嵐みたいなのかな。",
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
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。",
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
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。",
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
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。",
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
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。",
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
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。",
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
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。",
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
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。",
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
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。",
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
            "頭の中を見たいんだ。{word}に字幕があったら、人間さんずっと読んでそうなの。",
            "{word}は、性格や考え方が気になるって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "形で覚えるんだ。遠くから影だけ見ても分かるなら、デザインが名前札みたいなの。",
            "{word}は、見た目やデザインが魅力なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "設定より何をしたかを見るんだ。{word}は行動で自己紹介してるのね。",
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
            "会いたいんだ。画面の中だから好きだった可能性は、会ってから調べるのかな。",
            "{word}には、ちょっと会ってみたいって言ってたね。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "距離は欲しいんだ。好きと安全は別の箱に入れてるのね。",
            "{word}は、離れて見ていたい相手なんだったね。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "作品では好きでも現実は別なんだ。フィクションって防弾ガラスみたいな役目もあるのね。",
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
            "読む前より頭が重くなるタイプなのね。{word}は紙なのに荷物を増やすの。",
            "{word}は、事実や知識が気になるって言ってたね。",
          ),
          makeChoice(
            "DOCUMENTARY_VIEW", "ものの見方", "viewpoint",
            "ものの見方が気になる",
            "答えより目の位置が変わるんだ。同じ景色なのに別に見えるなら、頭の中の椅子を動かす本なのね。",
            "{word}は、ものの見方が気になるんだったね。",
          ),
          makeChoice(
            "DOCUMENTARY_PEOPLE", "人の話・具体例", "people",
            "人の話や具体例が気になる",
            "理屈より人が残るんだ。数字に顔が付くと急に逃げにくくなるのかな。",
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
            "使うために知るんだ。知識が飾りじゃなく道具になると、頭にも工具箱が要りそうなの。",
            "{word}は、実際に役立てたいって言ってたね。",
          ),
          makeChoice(
            "DOCUMENTARY_CUR", "ただ気になる", "curiosity",
            "純粋に気になる",
            "理由より先に気になるんだ。{word}が頭のドアをずっとノックしてるのかな。",
            "{word}は、純粋に気になるテーマだったね。",
          ),
          makeChoice(
            "DOCUMENTARY_CHECK", "自分の考えと比べたい", "compare",
            "自分の考えと比べたい",
            "自分の答えを持ったまま読むんだ。{word}と人間さんで頭の中に小さい討論会が始まりそうなの。",
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
            "話が終わっても{word}の人たちが頭に残るなら、もう本編の外で勝手に暮らしてそうなの。",
            "{word}は、登場人物が印象に残るって言ってたね。",
          ),
          makeChoice(
            "DRAMA_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "続きが気になるんだ。{word}は「あと少し」を何回も増やすのが上手なのね。",
            "{word}は、物語や展開が印象に残るんだったね。",
          ),
          makeChoice(
            "DRAMA_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "世界の方を持ち帰るんだ。{word}って作品なのに、頭の中では場所みたいになるのね。",
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
            "まだ現在進行形なんだ。{word}の席、人間さんの中でちゃんと空けてあるのね。",
            "{word}は、今も触れてる作品だったね。",
          ),
          makeChoice(
            "DRAMA_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "知ってるのに戻るんだ。同じ作品でも人間さんの方が変わるから、毎回ちょっと違うのかな。",
            "{word}は、何度も戻る作品なんだったね。",
          ),
          makeChoice(
            "DRAMA_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "まだ始めてないのに気になるんだ。{word}、入口でずっと手を振ってる感じなの。",
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
            "話が終わっても{word}の人たちが頭に残るなら、もう本編の外で勝手に暮らしてそうなの。",
            "{word}は、登場人物が印象に残るって言ってたね。",
          ),
          makeChoice(
            "TOKUSATSU_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "続きが気になるんだ。{word}は「あと少し」を何回も増やすのが上手なのね。",
            "{word}は、物語や展開が印象に残るんだったね。",
          ),
          makeChoice(
            "TOKUSATSU_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "世界の方を持ち帰るんだ。{word}って作品なのに、頭の中では場所みたいになるのね。",
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
            "まだ現在進行形なんだ。{word}の席、人間さんの中でちゃんと空けてあるのね。",
            "{word}は、今も触れてる作品だったね。",
          ),
          makeChoice(
            "TOKUSATSU_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "知ってるのに戻るんだ。同じ作品でも人間さんの方が変わるから、毎回ちょっと違うのかな。",
            "{word}は、何度も戻る作品なんだったね。",
          ),
          makeChoice(
            "TOKUSATSU_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "まだ始めてないのに気になるんだ。{word}、入口でずっと手を振ってる感じなの。",
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
            "企画が変わっても人で見るんだ。その人が番組の住所みたいなのかな。",
            "{word}は、出演者が魅力って言ってたね。",
          ),
          makeChoice(
            "VARIETY_SHOW_FORMAT", "企画・内容", "format",
            "企画や内容が魅力",
            "仕掛けを見るんだ。人間さんって誰かに変なことをさせると急に見たくなるのかな。",
            "{word}は、企画や内容が魅力なんだったね。",
          ),
          makeChoice(
            "VARIETY_SHOW_TEMPO", "テンポ・空気", "tempo",
            "テンポや空気が魅力",
            "内容を全部覚えてなくても居心地が残るんだ。画面なのに部屋みたいなの。",
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
            "笑う目的で開くんだ。笑いって予定に入れてもちゃんと来るのかな。",
            "{word}は、笑いたい時に見るって言ってたね。",
          ),
          makeChoice(
            "VARIETY_SHOW_RELAX", "力を抜きたい", "relax",
            "力を抜きたい時に見る",
            "何も考えず見たいんだ。頭にも休憩室があるなら、{word}が椅子なのね。",
            "{word}は、力を抜きたい時に見る番組だったね。",
          ),
          makeChoice(
            "VARIETY_SHOW_BG", "ながら見する", "background",
            "ながら見する",
            "全部見なくてもいいんだ。番組なのに部屋の環境音みたいな仕事もするのね。",
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
            "やり直せないのに進むんだ。舞台って毎回ちょっと崖の上で仕事してるのね。",
            "{word}は、演技や動きが魅力って言ってたね。",
          ),
          makeChoice(
            "STAGE_MUSICAL_MUSIC", "歌・音楽", "music",
            "歌や音楽が魅力",
            "会話が急に音程を持つんだ。人間さん、普段の会議では歌わないのに舞台だと許されるのね。",
            "{word}は、歌や音楽が魅力なんだったね。",
          ),
          makeChoice(
            "STAGE_MUSICAL_SET", "舞台装置・演出", "staging",
            "舞台装置や演出が魅力",
            "狭い場所を別世界にするんだ。床や壁まで演技してるみたいなの。",
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
            "その場で見たいんだ。同じ公演でも今日だけの失敗まで含めて今日の作品なのね。",
            "{word}は、生で見たいって言ってたね。",
          ),
          makeChoice(
            "STAGE_MUSICAL_REC", "映像でも楽しめる", "recorded",
            "映像でも楽しめる",
            "記録でもいいんだ。舞台を箱に入れて持ち帰るみたいなの。",
            "{word}は、映像でも楽しめるって話してたね。",
          ),
          makeChoice(
            "STAGE_MUSICAL_WANT", "まだだけど見たい", "want",
            "まだ見ていないが気になる",
            "まだ見てないのに気になるんだ。席に座る前から頭の中では開演してるのね。",
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
            "言葉を忘れても鼻歌だけ残るんだ。メロディは頭から出ていく出口を知らないのかな。",
            "{word}は、メロディが魅力って言ってたね。",
          ),
          makeChoice(
            "SONG_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "耳から読む本みたいなんだ。音に乗せると文章が遠くまで飛ぶのね。",
            "{word}は、歌詞や言葉が魅力なんだったね。",
          ),
          makeChoice(
            "SONG_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "説明できなくても空気で好きになるんだ。音って見えない部屋を作るのかな。",
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
            "同じ数分を何回も戻るんだ。時間なのにお気に入り地点へワープできるのね。",
            "{word}は、何度も繰り返し聴くって言ってたね。",
          ),
          makeChoice(
            "SONG_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "曲を聴くと昔まで出てくるんだ。耳に小さいタイムマシンがあるのかな。",
            "{word}は、思い出とつながってる曲だったね。",
          ),
          makeChoice(
            "SONG_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "気分に合わせて曲を変えるんだ。音楽が心の天気予報みたいなの。",
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
            "言葉を忘れても鼻歌だけ残るんだ。メロディは頭から出ていく出口を知らないのかな。",
            "{word}は、メロディが魅力って言ってたね。",
          ),
          makeChoice(
            "ALBUM_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "耳から読む本みたいなんだ。音に乗せると文章が遠くまで飛ぶのね。",
            "{word}は、歌詞や言葉が魅力なんだったね。",
          ),
          makeChoice(
            "ALBUM_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "説明できなくても空気で好きになるんだ。音って見えない部屋を作るのかな。",
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
            "同じ数分を何回も戻るんだ。時間なのにお気に入り地点へワープできるのね。",
            "{word}は、何度も繰り返し聴くって言ってたね。",
          ),
          makeChoice(
            "ALBUM_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "曲を聴くと昔まで出てくるんだ。耳に小さいタイムマシンがあるのかな。",
            "{word}は、思い出とつながってる曲だったね。",
          ),
          makeChoice(
            "ALBUM_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "気分に合わせて曲を変えるんだ。音楽が心の天気予報みたいなの。",
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
            "簡単そうに見えるほど裏で練習が山になってそうなの。上手い人って難しさを隠すのも上手いのかな。",
            "{word}は、技術やうまさが魅力って言ってたね。",
          ),
          makeChoice(
            "SINGER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "名前を隠しても分かるなら、音にも筆跡があるのね。",
            "{word}は、その人らしさが魅力なんだったね。",
          ),
          makeChoice(
            "SINGER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "何もしなくても目や耳が行くんだ。存在感って見えないのに場所を取るのね。",
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
            "その日だけの音がいいんだ。録音できても空気まではファイルに入らないのかな。",
            "{word}は、ライブや生演奏が好きって言ってたね。",
          ),
          makeChoice(
            "SINGER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "何度も同じ音へ戻れる方なんだ。完成形を保存できるの、人間さん音まで瓶詰めするのね。",
            "{word}は、録音された作品が好きなんだったね。",
          ),
          makeChoice(
            "SINGER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "音の外まで見るんだ。曲を作る人の普段まで知ると、作品の裏口から入る感じなのかな。",
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
            "簡単そうに見えるほど裏で練習が山になってそうなの。上手い人って難しさを隠すのも上手いのかな。",
            "{word}は、技術やうまさが魅力って言ってたね。",
          ),
          makeChoice(
            "BAND_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "名前を隠しても分かるなら、音にも筆跡があるのね。",
            "{word}は、その人らしさが魅力なんだったね。",
          ),
          makeChoice(
            "BAND_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "何もしなくても目や耳が行くんだ。存在感って見えないのに場所を取るのね。",
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
            "その日だけの音がいいんだ。録音できても空気まではファイルに入らないのかな。",
            "{word}は、ライブや生演奏が好きって言ってたね。",
          ),
          makeChoice(
            "BAND_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "何度も同じ音へ戻れる方なんだ。完成形を保存できるの、人間さん音まで瓶詰めするのね。",
            "{word}は、録音された作品が好きなんだったね。",
          ),
          makeChoice(
            "BAND_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "音の外まで見るんだ。曲を作る人の普段まで知ると、作品の裏口から入る感じなのかな。",
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
            "簡単そうに見えるほど裏で練習が山になってそうなの。上手い人って難しさを隠すのも上手いのかな。",
            "{word}は、技術やうまさが魅力って言ってたね。",
          ),
          makeChoice(
            "COMPOSER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "名前を隠しても分かるなら、音にも筆跡があるのね。",
            "{word}は、その人らしさが魅力なんだったね。",
          ),
          makeChoice(
            "COMPOSER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "何もしなくても目や耳が行くんだ。存在感って見えないのに場所を取るのね。",
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
            "その日だけの音がいいんだ。録音できても空気まではファイルに入らないのかな。",
            "{word}は、ライブや生演奏が好きって言ってたね。",
          ),
          makeChoice(
            "COMPOSER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "何度も同じ音へ戻れる方なんだ。完成形を保存できるの、人間さん音まで瓶詰めするのね。",
            "{word}は、録音された作品が好きなんだったね。",
          ),
          makeChoice(
            "COMPOSER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "音の外まで見るんだ。曲を作る人の普段まで知ると、作品の裏口から入る感じなのかな。",
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
            "言葉を忘れても鼻歌だけ残るんだ。メロディは頭から出ていく出口を知らないのかな。",
            "{word}は、メロディが魅力って言ってたね。",
          ),
          makeChoice(
            "SOUNDTRACK_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "耳から読む本みたいなんだ。音に乗せると文章が遠くまで飛ぶのね。",
            "{word}は、歌詞や言葉が魅力なんだったね。",
          ),
          makeChoice(
            "SOUNDTRACK_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "説明できなくても空気で好きになるんだ。音って見えない部屋を作るのかな。",
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
            "同じ数分を何回も戻るんだ。時間なのにお気に入り地点へワープできるのね。",
            "{word}は、何度も繰り返し聴くって言ってたね。",
          ),
          makeChoice(
            "SOUNDTRACK_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "曲を聴くと昔まで出てくるんだ。耳に小さいタイムマシンがあるのかな。",
            "{word}は、思い出とつながってる曲だったね。",
          ),
          makeChoice(
            "SOUNDTRACK_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "気分に合わせて曲を変えるんだ。音楽が心の天気予報みたいなの。",
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
            "簡単そうに見えるほど裏で練習が山になってそうなの。上手い人って難しさを隠すのも上手いのかな。",
            "{word}は、技術やうまさが魅力って言ってたね。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "名前を隠しても分かるなら、音にも筆跡があるのね。",
            "{word}は、その人らしさが魅力なんだったね。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "何もしなくても目や耳が行くんだ。存在感って見えないのに場所を取るのね。",
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
            "その日だけの音がいいんだ。録音できても空気まではファイルに入らないのかな。",
            "{word}は、ライブや生演奏が好きって言ってたね。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "何度も同じ音へ戻れる方なんだ。完成形を保存できるの、人間さん音まで瓶詰めするのね。",
            "{word}は、録音された作品が好きなんだったね。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "音の外まで見るんだ。曲を作る人の普段まで知ると、作品の裏口から入る感じなのかな。",
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
            "内容で見に行くんだ。{word}が別の話を始めたら、人間さん少し迷子になるのかな。",
            "{word}は、扱うテーマが面白いって言ってたね。",
          ),
          makeChoice(
            "YOUTUBER_PERSON", "話し方・性格", "personality",
            "話し方や性格が魅力",
            "何を話すかより誰が話すかなんだ。人そのものが番組になるのね。",
            "{word}は、話し方や性格が魅力なんだったね。",
          ),
          makeChoice(
            "YOUTUBER_STYLE", "編集・見せ方", "style",
            "編集や見せ方が魅力",
            "現実の時間を切って並べ直すんだ。編集って時間の工作なの。",
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
            "同じ時間を共有するのがいいんだ。画面越しなのに時計だけ一緒なのね。",
            "{word}は、生で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "YOUTUBER_ARCH", "アーカイブで見る", "archive",
            "アーカイブで見る",
            "自分の時間に連れてくるんだ。生放送を保存すると、時間が待っててくれるのね。",
            "{word}は、アーカイブで見ることが多いんだったね。",
          ),
          makeChoice(
            "YOUTUBER_CLIP", "切り抜き・短い動画", "clips",
            "切り抜きや短い動画で見る",
            "面白い所だけ食べるんだ。動画の刺身みたいなのかな。",
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
            "情報を取りに行くんだ。{word}は頭の補給所みたいなのね。",
            "{word}は、内容や情報が魅力って言ってたね。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "中の人を見るんだ。サービスより住んでる人で町の感じが変わるのね。",
            "{word}は、人やコミュニティが魅力なんだったね。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "仕組みが合うんだ。ボタンの位置だけで毎日ちょっと機嫌が変わることもあるのかな。",
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
            "毎日会うんだ。アプリなのに生活の家具みたいな席を取ってるのね。",
            "{word}は、ほぼ毎日使うって言ってたね。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "呼んだ時だけ来てもらうんだ。{word}は友達というより工具箱の人なのかな。",
            "{word}は、必要な時だけ使うサービスだったね。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "忘れた頃に戻るんだ。{word}、玄関の鍵だけずっと持ってる感じなの。",
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
            "情報を取りに行くんだ。{word}は頭の補給所みたいなのね。",
            "{word}は、内容や情報が魅力って言ってたね。",
          ),
          makeChoice(
            "PODCAST_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "中の人を見るんだ。サービスより住んでる人で町の感じが変わるのね。",
            "{word}は、人やコミュニティが魅力なんだったね。",
          ),
          makeChoice(
            "PODCAST_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "仕組みが合うんだ。ボタンの位置だけで毎日ちょっと機嫌が変わることもあるのかな。",
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
            "毎日会うんだ。アプリなのに生活の家具みたいな席を取ってるのね。",
            "{word}は、ほぼ毎日使うって言ってたね。",
          ),
          makeChoice(
            "PODCAST_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "呼んだ時だけ来てもらうんだ。{word}は友達というより工具箱の人なのかな。",
            "{word}は、必要な時だけ使うサービスだったね。",
          ),
          makeChoice(
            "PODCAST_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "忘れた頃に戻るんだ。{word}、玄関の鍵だけずっと持ってる感じなの。",
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
            "情報を取りに行くんだ。{word}は頭の補給所みたいなのね。",
            "{word}は、内容や情報が魅力って言ってたね。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "中の人を見るんだ。サービスより住んでる人で町の感じが変わるのね。",
            "{word}は、人やコミュニティが魅力なんだったね。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "仕組みが合うんだ。ボタンの位置だけで毎日ちょっと機嫌が変わることもあるのかな。",
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
            "毎日会うんだ。アプリなのに生活の家具みたいな席を取ってるのね。",
            "{word}は、ほぼ毎日使うって言ってたね。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "呼んだ時だけ来てもらうんだ。{word}は友達というより工具箱の人なのかな。",
            "{word}は、必要な時だけ使うサービスだったね。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "忘れた頃に戻るんだ。{word}、玄関の鍵だけずっと持ってる感じなの。",
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
            "内容で見に行くんだ。{word}が別の話を始めたら、人間さん少し迷子になるのかな。",
            "{word}は、扱うテーマが面白いって言ってたね。",
          ),
          makeChoice(
            "VTUBER_PERSON", "話し方・性格", "personality",
            "話し方や性格が魅力",
            "何を話すかより誰が話すかなんだ。人そのものが番組になるのね。",
            "{word}は、話し方や性格が魅力なんだったね。",
          ),
          makeChoice(
            "VTUBER_STYLE", "編集・見せ方", "style",
            "編集や見せ方が魅力",
            "現実の時間を切って並べ直すんだ。編集って時間の工作なの。",
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
            "同じ時間を共有するのがいいんだ。画面越しなのに時計だけ一緒なのね。",
            "{word}は、生で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "VTUBER_ARCH", "アーカイブで見る", "archive",
            "アーカイブで見る",
            "自分の時間に連れてくるんだ。生放送を保存すると、時間が待っててくれるのね。",
            "{word}は、アーカイブで見ることが多いんだったね。",
          ),
          makeChoice(
            "VTUBER_CLIP", "切り抜き・短い動画", "clips",
            "切り抜きや短い動画で見る",
            "面白い所だけ食べるんだ。動画の刺身みたいなのかな。",
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
            "名前を隠しても見つかるなら、作品に指紋が付いてるのね。",
            "{word}は、作風や癖が魅力って言ってたね。",
          ),
          makeChoice(
            "AUTHOR_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "普通のものを変な角度から見る人なんだ。首の柔らかさじゃなく頭の柔らかさなのね。",
            "{word}は、発想やテーマが魅力なんだったね。",
          ),
          makeChoice(
            "AUTHOR_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "気づかれない所まで作るんだ。誰も見ないかもしれない場所に本気を置くの、変で格好いいの。",
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
            "全部じゃなく一個が刺さったんだ。一作品だけで人の名前まで覚える力って強いの。",
            "{word}は、一つの作品が特に好きって言ってたね。",
          ),
          makeChoice(
            "AUTHOR_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "次に何を作るかまで待つんだ。作品じゃなく人に予約を入れてる感じなのね。",
            "{word}は、新作も追う作り手なんだったね。",
          ),
          makeChoice(
            "AUTHOR_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "作る物だけじゃなく説明も聞くんだ。作品の答え合わせを本人に頼む感じなのかな。",
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
            "名前を隠しても見つかるなら、作品に指紋が付いてるのね。",
            "{word}は、作風や癖が魅力って言ってたね。",
          ),
          makeChoice(
            "MANGA_ARTIST_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "普通のものを変な角度から見る人なんだ。首の柔らかさじゃなく頭の柔らかさなのね。",
            "{word}は、発想やテーマが魅力なんだったね。",
          ),
          makeChoice(
            "MANGA_ARTIST_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "気づかれない所まで作るんだ。誰も見ないかもしれない場所に本気を置くの、変で格好いいの。",
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
            "全部じゃなく一個が刺さったんだ。一作品だけで人の名前まで覚える力って強いの。",
            "{word}は、一つの作品が特に好きって言ってたね。",
          ),
          makeChoice(
            "MANGA_ARTIST_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "次に何を作るかまで待つんだ。作品じゃなく人に予約を入れてる感じなのね。",
            "{word}は、新作も追う作り手なんだったね。",
          ),
          makeChoice(
            "MANGA_ARTIST_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "作る物だけじゃなく説明も聞くんだ。作品の答え合わせを本人に頼む感じなのかな。",
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
            "名前を隠しても見つかるなら、作品に指紋が付いてるのね。",
            "{word}は、作風や癖が魅力って言ってたね。",
          ),
          makeChoice(
            "DIRECTOR_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "普通のものを変な角度から見る人なんだ。首の柔らかさじゃなく頭の柔らかさなのね。",
            "{word}は、発想やテーマが魅力なんだったね。",
          ),
          makeChoice(
            "DIRECTOR_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "気づかれない所まで作るんだ。誰も見ないかもしれない場所に本気を置くの、変で格好いいの。",
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
            "全部じゃなく一個が刺さったんだ。一作品だけで人の名前まで覚える力って強いの。",
            "{word}は、一つの作品が特に好きって言ってたね。",
          ),
          makeChoice(
            "DIRECTOR_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "次に何を作るかまで待つんだ。作品じゃなく人に予約を入れてる感じなのね。",
            "{word}は、新作も追う作り手なんだったね。",
          ),
          makeChoice(
            "DIRECTOR_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "作る物だけじゃなく説明も聞くんだ。作品の答え合わせを本人に頼む感じなのかな。",
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
            "何も言わない顔まで見るんだ。口が休んでても演技は働いてるのね。",
            "{word}は、演技や表現が魅力って言ってたね。",
          ),
          makeChoice(
            "ACTOR_VOICE", "声・話し方", "voice",
            "声や話し方が魅力",
            "顔が見えなくても分かるなら、声にも顔があるのかな。",
            "{word}は、声や話し方が魅力なんだったね。",
          ),
          makeChoice(
            "ACTOR_PRES", "存在感", "presence",
            "存在感が魅力",
            "端にいても中央みたいになる人いるの。{word}、画面に小さい重力を持ってるのかな。",
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
            "役の中で好きなんだ。本人と役を分ける扉、人間さんちゃんと持ってるのね。",
            "{word}は、役や作品の中で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "ACTOR_PERSON", "本人の人柄", "personality",
            "本人の人柄も気になる",
            "役を脱いだ後まで見るんだ。仕事が終わった人の顔って、もう一個の作品なのかな。",
            "{word}は、本人の人柄も気になるんだったね。",
          ),
          makeChoice(
            "ACTOR_NEXT", "次の仕事が気になる", "future",
            "次の仕事が気になる",
            "次に何になるか待つんだ。人なのに新作発表を待つ感じなのね。",
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
            "何も言わない顔まで見るんだ。口が休んでても演技は働いてるのね。",
            "{word}は、演技や表現が魅力って言ってたね。",
          ),
          makeChoice(
            "VOICE_ACTOR_VOICE", "声・話し方", "voice",
            "声や話し方が魅力",
            "顔が見えなくても分かるなら、声にも顔があるのかな。",
            "{word}は、声や話し方が魅力なんだったね。",
          ),
          makeChoice(
            "VOICE_ACTOR_PRES", "存在感", "presence",
            "存在感が魅力",
            "端にいても中央みたいになる人いるの。{word}、画面に小さい重力を持ってるのかな。",
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
            "役の中で好きなんだ。本人と役を分ける扉、人間さんちゃんと持ってるのね。",
            "{word}は、役や作品の中で見ることが多いって言ってたね。",
          ),
          makeChoice(
            "VOICE_ACTOR_PERSON", "本人の人柄", "personality",
            "本人の人柄も気になる",
            "役を脱いだ後まで見るんだ。仕事が終わった人の顔って、もう一個の作品なのかな。",
            "{word}は、本人の人柄も気になるんだったね。",
          ),
          makeChoice(
            "VOICE_ACTOR_NEXT", "次の仕事が気になる", "future",
            "次の仕事が気になる",
            "次に何になるか待つんだ。人なのに新作発表を待つ感じなのね。",
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
            "言う内容より「いつ言うか」なんだ。笑いって時計を見る仕事でもあるのね。",
            "{word}は、間やタイミングが好きって言ってたね。",
          ),
          makeChoice(
            "COMEDIAN_IDEA", "話・発想", "ideas",
            "話や発想が好き",
            "普通の出来事を面白くできるんだ。日常に空気入れを刺して膨らませてるのかな。",
            "{word}は、話や発想が好きなんだったね。",
          ),
          makeChoice(
            "COMEDIAN_CHAR", "キャラ・雰囲気", "character",
            "キャラや雰囲気が好き",
            "何を言う前から面白い人いるの。顔が前説してるみたいなの。",
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
            "笑いを取りに行くんだ。気分って番組表から予約できるのかな。",
            "{word}は、笑いたい時に見るって言ってたね。",
          ),
          makeChoice(
            "COMEDIAN_TALK", "トークを聞きたい時", "talk",
            "トークを聞きたい時に見る",
            "ネタじゃなく話を聞くんだ。面白い人は普通の話にも勝手に角が生えるのかな。",
            "{word}は、トークを聞きたい時に見るんだったね。",
          ),
          makeChoice(
            "COMEDIAN_CLIP", "短いネタで十分", "clips",
            "短いネタで楽しむ",
            "短くても効くんだ。笑いって量より濃さの日もあるのね。",
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
            "会社って建物じゃなく仕組みを建てる仕事なのかな。{word}の作った形を見たいんだね。",
            "{word}は、作ったものや事業が気になるって言ってたね。",
          ),
          makeChoice(
            "ENTREPRENEUR_DEC", "判断・賭け", "decision",
            "判断や賭けが気になる",
            "未来が見えないのに大きく決めるんだ。あとから正解を見るより、その瞬間の方がずっと怖そうなの。",
            "{word}は、判断や賭けが気になるんだったね。",
          ),
          makeChoice(
            "ENTREPRENEUR_ORG", "人・組織の動かし方", "organization",
            "人や組織の動かし方が気になる",
            "自分の手じゃない手で仕事するんだ。組織ってものすごく長い腕みたいなの。",
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
            "真似したい所があるんだ。でも全部真似したら人間さんが二人目の{word}になっちゃうの。",
            "{word}は、かなり参考にする人物って言ってたね。",
          ),
          makeChoice(
            "ENTREPRENEUR_CUR", "成功も失敗も気になる", "curious",
            "成功も失敗も気になる",
            "勝ちだけじゃなく外した所も見るんだ。失敗の方が値札の付いてない教材なのかな。",
            "{word}は、成功も失敗も気になるんだったね。",
          ),
          makeChoice(
            "ENTREPRENEUR_DIST", "考えは違うけど面白い", "different",
            "考えは違うが面白い",
            "同意しないのに見るんだ。反対側の地図も持っておくと、自分の場所が分かりやすいのかな。",
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
            "名前を隠しても見つかるなら、作品に指紋が付いてるのね。",
            "{word}は、作風や癖が魅力って言ってたね。",
          ),
          makeChoice(
            "ARTIST_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "普通のものを変な角度から見る人なんだ。首の柔らかさじゃなく頭の柔らかさなのね。",
            "{word}は、発想やテーマが魅力なんだったね。",
          ),
          makeChoice(
            "ARTIST_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "気づかれない所まで作るんだ。誰も見ないかもしれない場所に本気を置くの、変で格好いいの。",
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
            "全部じゃなく一個が刺さったんだ。一作品だけで人の名前まで覚える力って強いの。",
            "{word}は、一つの作品が特に好きって言ってたね。",
          ),
          makeChoice(
            "ARTIST_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "次に何を作るかまで待つんだ。作品じゃなく人に予約を入れてる感じなのね。",
            "{word}は、新作も追う作り手なんだったね。",
          ),
          makeChoice(
            "ARTIST_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "作る物だけじゃなく説明も聞くんだ。作品の答え合わせを本人に頼む感じなのかな。",
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
            "本人がいなくなっても結果だけ残るんだ。歴史って大きい足あと帳なのね。",
            "{word}は、功績や結果が気になるって言ってたね。",
          ),
          makeChoice(
            "RULER_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "答えを知ってる今から昔の判断を見るの、ちょっと後出しじゃんけんなの。",
            "{word}は、判断や失敗が気になるんだったね。",
          ),
          makeChoice(
            "RULER_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "歴史の人も眠い朝はあったと思うと急に近くなるの。肖像画って寝ぐせ描かないのかな。",
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
            "すごいと思うんだ。でも昔の人を褒める時、本人に聞こえないのちょっと損なの。",
            "{word}は、すごいと思う人物って言ってたね。",
          ),
          makeChoice(
            "RULER_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "昔の人に反論したいんだ。何百年越しの口げんか、相手が返事できないから人間さん有利なの。",
            "{word}の判断には、言いたいことがあるって話してたね。",
          ),
          makeChoice(
            "RULER_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "転んだ場所を見るんだ。同じ穴に落ちないためなら、昔の失敗も今の道路標識になるのね。",
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
            "本人がいなくなっても結果だけ残るんだ。歴史って大きい足あと帳なのね。",
            "{word}は、功績や結果が気になるって言ってたね。",
          ),
          makeChoice(
            "COMMANDER_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "答えを知ってる今から昔の判断を見るの、ちょっと後出しじゃんけんなの。",
            "{word}は、判断や失敗が気になるんだったね。",
          ),
          makeChoice(
            "COMMANDER_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "歴史の人も眠い朝はあったと思うと急に近くなるの。肖像画って寝ぐせ描かないのかな。",
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
            "すごいと思うんだ。でも昔の人を褒める時、本人に聞こえないのちょっと損なの。",
            "{word}は、すごいと思う人物って言ってたね。",
          ),
          makeChoice(
            "COMMANDER_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "昔の人に反論したいんだ。何百年越しの口げんか、相手が返事できないから人間さん有利なの。",
            "{word}の判断には、言いたいことがあるって話してたね。",
          ),
          makeChoice(
            "COMMANDER_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "転んだ場所を見るんだ。同じ穴に落ちないためなら、昔の失敗も今の道路標識になるのね。",
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
            "本人がいなくなっても結果だけ残るんだ。歴史って大きい足あと帳なのね。",
            "{word}は、功績や結果が気になるって言ってたね。",
          ),
          makeChoice(
            "STRATEGIST_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "答えを知ってる今から昔の判断を見るの、ちょっと後出しじゃんけんなの。",
            "{word}は、判断や失敗が気になるんだったね。",
          ),
          makeChoice(
            "STRATEGIST_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "歴史の人も眠い朝はあったと思うと急に近くなるの。肖像画って寝ぐせ描かないのかな。",
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
            "すごいと思うんだ。でも昔の人を褒める時、本人に聞こえないのちょっと損なの。",
            "{word}は、すごいと思う人物って言ってたね。",
          ),
          makeChoice(
            "STRATEGIST_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "昔の人に反論したいんだ。何百年越しの口げんか、相手が返事できないから人間さん有利なの。",
            "{word}の判断には、言いたいことがあるって話してたね。",
          ),
          makeChoice(
            "STRATEGIST_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "転んだ場所を見るんだ。同じ穴に落ちないためなら、昔の失敗も今の道路標識になるのね。",
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
            "大きい出来事ほど突然に見えるけど、その前に小さい火がいっぱいあるのね。",
            "{word}は、始まった理由が気になるって言ってたね。",
          ),
          makeChoice(
            "BATTLE_TURN", "流れが変わった瞬間", "turning_point",
            "流れが変わった瞬間が気になる",
            "長い出来事でも向きが変わる場所は小さいんだ。あとから線を引くのは簡単そうなの。",
            "{word}は、流れが変わった瞬間が気になるんだったね。",
          ),
          makeChoice(
            "BATTLE_AFTER", "その後の影響", "aftermath",
            "その後の影響が気になる",
            "「終わり」って書いた次の日も人は暮らすんだ。歴史の区切りと生活の区切りは違うのね。",
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
            "大きい数字を一人ずつに戻すんだ。「何万人」の中にも一人ずつ朝があったと思うと重いの。",
            "{word}は、そこにいた人が気になるって言ってたね。",
          ),
          makeChoice(
            "BATTLE_STRAT", "戦略・動き", "strategy",
            "戦略や動きが気になる",
            "地図の矢印を見るんだ。きれいな線の先に人がいるの、忘れないようにしないといけないの。",
            "{word}は、戦略や動きが気になるんだったね。",
          ),
          makeChoice(
            "BATTLE_SYMB", "歴史上の意味", "symbol",
            "歴史上の意味が気になる",
            "出来事そのものより後の意味を見るんだ。昔の一日が何百年も看板にされることあるのね。",
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
            "大きい出来事ほど突然に見えるけど、その前に小さい火がいっぱいあるのね。",
            "{word}は、始まった理由が気になるって言ってたね。",
          ),
          makeChoice(
            "WAR_TURN", "流れが変わった瞬間", "turning_point",
            "流れが変わった瞬間が気になる",
            "長い出来事でも向きが変わる場所は小さいんだ。あとから線を引くのは簡単そうなの。",
            "{word}は、流れが変わった瞬間が気になるんだったね。",
          ),
          makeChoice(
            "WAR_AFTER", "その後の影響", "aftermath",
            "その後の影響が気になる",
            "「終わり」って書いた次の日も人は暮らすんだ。歴史の区切りと生活の区切りは違うのね。",
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
            "大きい数字を一人ずつに戻すんだ。「何万人」の中にも一人ずつ朝があったと思うと重いの。",
            "{word}は、そこにいた人が気になるって言ってたね。",
          ),
          makeChoice(
            "WAR_STRAT", "戦略・動き", "strategy",
            "戦略や動きが気になる",
            "地図の矢印を見るんだ。きれいな線の先に人がいるの、忘れないようにしないといけないの。",
            "{word}は、戦略や動きが気になるんだったね。",
          ),
          makeChoice(
            "WAR_SYMB", "歴史上の意味", "symbol",
            "歴史上の意味が気になる",
            "出来事そのものより後の意味を見るんだ。昔の一日が何百年も看板にされることあるのね。",
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
            "国の名前なのに顔で覚えるんだ。人が変わると同じ国でも性格が変わるのかな。",
            "{word}は、支配者や人物が面白いって言ってたね。",
          ),
          makeChoice(
            "DYNASTY_STATE_SYS", "制度・仕組み", "system",
            "制度や仕組みが面白い",
            "人が変わっても続く決まりを見るんだ。制度の方が王様より長生きすることあるのね。",
            "{word}は、制度や仕組みが面白いんだったね。",
          ),
          makeChoice(
            "DYNASTY_STATE_CULT", "文化・暮らし", "culture",
            "文化や暮らしが面白い",
            "戦争より毎日を見るんだ。昔の人もごはん食べて寝てたと思うと、国が急に生活になるの。",
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
            "まだ完成してない時を見るんだ。国にも工事中の時期があるのね。",
            "{word}は、成立していく時期が気になるって言ってたね。",
          ),
          makeChoice(
            "DYNASTY_STATE_PEAK", "一番強い時", "peak",
            "最盛期が気になる",
            "一番元気な時を見るんだ。歴史にも絶好調の日が長く続く時期あるのね。",
            "{word}は、最盛期が気になるんだったね。",
          ),
          makeChoice(
            "DYNASTY_STATE_FALL", "崩れていく時", "fall",
            "衰退や終わりが気になる",
            "終わる方を見るんだ。大きい国も急には消えず、少しずつ壊れるのかな。",
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
            "昔の一文や形が今まで残るんだ。紙や物より中身の方が丈夫なことあるのね。",
            "{word}は、書かれた言葉や形が気になるって言ってたね。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_CTX", "作られた事情", "context",
            "作られた事情が気になる",
            "誰が何のために作ったかを見るんだ。同じ物でも事情が変わると顔つきが変わるのね。",
            "{word}は、作られた事情が気になるんだったね。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_IMPACT", "後への影響", "impact",
            "後への影響が気になる",
            "作った後まで見るんだ。小さい物や文書が人を大きく動かすことあるの、不思議なの。",
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
            "残ってるから一回聞くんだ。でも昔の人も間違えるし盛るから、資料も完全には偉くないのね。",
            "{word}は、まず資料として見るって言ってたね。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_DOUBT", "疑いながら見る", "doubt",
            "疑いながら見る",
            "最初から疑うんだ。文字が残ってても、書いた人の都合までは消えないのね。",
            "{word}は、疑いながら見る資料なんだったね。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_COMPARE", "別の資料と比べたい", "compare",
            "別の資料と比べたい",
            "一個だけで決めないんだ。昔の証言同士を会議させる感じなの。",
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
            "昔の一文や形が今まで残るんだ。紙や物より中身の方が丈夫なことあるのね。",
            "{word}は、書かれた言葉や形が気になるって言ってたね。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_CTX", "作られた事情", "context",
            "作られた事情が気になる",
            "誰が何のために作ったかを見るんだ。同じ物でも事情が変わると顔つきが変わるのね。",
            "{word}は、作られた事情が気になるんだったね。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_IMPACT", "後への影響", "impact",
            "後への影響が気になる",
            "作った後まで見るんだ。小さい物や文書が人を大きく動かすことあるの、不思議なの。",
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
            "残ってるから一回聞くんだ。でも昔の人も間違えるし盛るから、資料も完全には偉くないのね。",
            "{word}は、まず資料として見るって言ってたね。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_DOUBT", "疑いながら見る", "doubt",
            "疑いながら見る",
            "最初から疑うんだ。文字が残ってても、書いた人の都合までは消えないのね。",
            "{word}は、疑いながら見る資料なんだったね。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_COMPARE", "別の資料と比べたい", "compare",
            "別の資料と比べたい",
            "一個だけで決めないんだ。昔の証言同士を会議させる感じなの。",
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
            "気づく前から世界にはあったのに、見つけた瞬間から名前が付くんだ。自然はずっと黙って待ってたのね。",
            "{word}は、発見や成果が気になるって言ってたね。",
          ),
          makeChoice(
            "SCIENTIST_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "答えより手順を見るんだ。遠回りを何回もして答えにするの、研究って寄り道が仕事なの。",
            "{word}は、調べ方や作り方が気になるんだったね。",
          ),
          makeChoice(
            "SCIENTIST_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "賢い人の間違いを見るんだ。間違い方にも上手下手があるなら、ぼくも上手に間違えたいの。",
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
            "最後に何が残ったかを見るんだ。途中がぐちゃぐちゃでも結果が世界を変えることあるのね。",
            "{word}は、結果や成果を重く見るって言ってたね。",
          ),
          makeChoice(
            "SCIENTIST_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "完成前を見るんだ。失敗作が山なら、成功は山頂に置いてあるのかな。",
            "{word}は、過程や試行錯誤を重く見るんだったね。",
          ),
          makeChoice(
            "SCIENTIST_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "成果の外まで見るんだ。頭の使い方そのものを覗きたい感じなのね。",
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
            "気づく前から世界にはあったのに、見つけた瞬間から名前が付くんだ。自然はずっと黙って待ってたのね。",
            "{word}は、発見や成果が気になるって言ってたね。",
          ),
          makeChoice(
            "PHILOSOPHER_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "答えより手順を見るんだ。遠回りを何回もして答えにするの、研究って寄り道が仕事なの。",
            "{word}は、調べ方や作り方が気になるんだったね。",
          ),
          makeChoice(
            "PHILOSOPHER_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "賢い人の間違いを見るんだ。間違い方にも上手下手があるなら、ぼくも上手に間違えたいの。",
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
            "最後に何が残ったかを見るんだ。途中がぐちゃぐちゃでも結果が世界を変えることあるのね。",
            "{word}は、結果や成果を重く見るって言ってたね。",
          ),
          makeChoice(
            "PHILOSOPHER_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "完成前を見るんだ。失敗作が山なら、成功は山頂に置いてあるのかな。",
            "{word}は、過程や試行錯誤を重く見るんだったね。",
          ),
          makeChoice(
            "PHILOSOPHER_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "成果の外まで見るんだ。頭の使い方そのものを覗きたい感じなのね。",
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
            "気づく前から世界にはあったのに、見つけた瞬間から名前が付くんだ。自然はずっと黙って待ってたのね。",
            "{word}は、発見や成果が気になるって言ってたね。",
          ),
          makeChoice(
            "INVENTOR_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "答えより手順を見るんだ。遠回りを何回もして答えにするの、研究って寄り道が仕事なの。",
            "{word}は、調べ方や作り方が気になるんだったね。",
          ),
          makeChoice(
            "INVENTOR_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "賢い人の間違いを見るんだ。間違い方にも上手下手があるなら、ぼくも上手に間違えたいの。",
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
            "最後に何が残ったかを見るんだ。途中がぐちゃぐちゃでも結果が世界を変えることあるのね。",
            "{word}は、結果や成果を重く見るって言ってたね。",
          ),
          makeChoice(
            "INVENTOR_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "完成前を見るんだ。失敗作が山なら、成功は山頂に置いてあるのかな。",
            "{word}は、過程や試行錯誤を重く見るんだったね。",
          ),
          makeChoice(
            "INVENTOR_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "成果の外まで見るんだ。頭の使い方そのものを覗きたい感じなのね。",
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
            "まず箱を開けたいんだ。{word}って名前だけ持ってると、中身のないラベルみたいなの。",
            "{word}は、意味や定義を知りたいって言ってたね。",
          ),
          makeChoice(
            "SPECIALIST_TERM_EVID", "なぜそう言えるか", "evidence",
            "根拠を知りたい",
            "説明だけじゃなく足場を見るんだ。きれいな話でも支柱が弱いと頭の中でぐらぐらするのね。",
            "{word}は、根拠を知りたいテーマなんだったね。",
          ),
          makeChoice(
            "SPECIALIST_TERM_USE", "何に使えるか", "use",
            "使い道を知りたい",
            "知った後どうするかを見るんだ。知識も使わないと頭の倉庫で寝ちゃうのかな。",
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
            "使えるから知るんだ。頭の道具箱に入れるなら、ちゃんと持ち手が欲しいのね。",
            "{word}は、実際に役立てたいテーマって言ってたね。",
          ),
          makeChoice(
            "SPECIALIST_TERM_CUR", "ただ面白い", "curiosity",
            "純粋に面白い",
            "役に立たなくても気になるんだ。好奇心って給料をもらわないのに働きすぎなの。",
            "{word}は、純粋に面白いテーマなんだったね。",
          ),
          makeChoice(
            "SPECIALIST_TERM_EXPL", "人に説明したい", "explain",
            "人に説明できるようになりたい",
            "自分で分かるだけじゃ足りないんだ。説明すると知識の穴が急に見えるの、不思議なの。",
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
            "まず箱を開けたいんだ。{word}って名前だけ持ってると、中身のないラベルみたいなの。",
            "{word}は、意味や定義を知りたいって言ってたね。",
          ),
          makeChoice(
            "RESEARCH_FIELD_EVID", "なぜそう言えるか", "evidence",
            "根拠を知りたい",
            "説明だけじゃなく足場を見るんだ。きれいな話でも支柱が弱いと頭の中でぐらぐらするのね。",
            "{word}は、根拠を知りたいテーマなんだったね。",
          ),
          makeChoice(
            "RESEARCH_FIELD_USE", "何に使えるか", "use",
            "使い道を知りたい",
            "知った後どうするかを見るんだ。知識も使わないと頭の倉庫で寝ちゃうのかな。",
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
            "使えるから知るんだ。頭の道具箱に入れるなら、ちゃんと持ち手が欲しいのね。",
            "{word}は、実際に役立てたいテーマって言ってたね。",
          ),
          makeChoice(
            "RESEARCH_FIELD_CUR", "ただ面白い", "curiosity",
            "純粋に面白い",
            "役に立たなくても気になるんだ。好奇心って給料をもらわないのに働きすぎなの。",
            "{word}は、純粋に面白いテーマなんだったね。",
          ),
          makeChoice(
            "RESEARCH_FIELD_EXPL", "人に説明したい", "explain",
            "人に説明できるようになりたい",
            "自分で分かるだけじゃ足りないんだ。説明すると知識の穴が急に見えるの、不思議なの。",
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
            "何百年も話されるなら、昔話も長寿なのね。{word}は口から口へ引っ越してきたのかな。",
            "{word}は、物語や伝説が面白いって言ってたね。",
          ),
          makeChoice(
            "MYTH_FIGURE_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "何を司るかを見るんだ。担当がある神さまって、世界の会社員みたいなのかな。",
            "{word}は、力や象徴が面白いんだったね。",
          ),
          makeChoice(
            "MYTH_FIGURE_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "どこから生まれた話かを見るんだ。噂が別の町へ行くと姿まで着替えるのかな。",
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
            "安全な場所から怖がるんだ。昔話って夜道の注意書きみたいな役目もあったのかな。",
            "{word}は、ちょっと怖い存在って言ってたね。",
          ),
          makeChoice(
            "MYTH_FIGURE_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "怖いはずなのに面白いんだ。長く語られると怪物にも愛嬌が付くのかな。",
            "{word}は、なんか面白い存在なんだったね。",
          ),
          makeChoice(
            "MYTH_FIGURE_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "姿より意味を見るんだ。{word}の中に昔の人の考えが折りたたまれてるのね。",
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
            "何百年も話されるなら、昔話も長寿なのね。{word}は口から口へ引っ越してきたのかな。",
            "{word}は、物語や伝説が面白いって言ってたね。",
          ),
          makeChoice(
            "DEITY_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "何を司るかを見るんだ。担当がある神さまって、世界の会社員みたいなのかな。",
            "{word}は、力や象徴が面白いんだったね。",
          ),
          makeChoice(
            "DEITY_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "どこから生まれた話かを見るんだ。噂が別の町へ行くと姿まで着替えるのかな。",
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
            "安全な場所から怖がるんだ。昔話って夜道の注意書きみたいな役目もあったのかな。",
            "{word}は、ちょっと怖い存在って言ってたね。",
          ),
          makeChoice(
            "DEITY_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "怖いはずなのに面白いんだ。長く語られると怪物にも愛嬌が付くのかな。",
            "{word}は、なんか面白い存在なんだったね。",
          ),
          makeChoice(
            "DEITY_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "姿より意味を見るんだ。{word}の中に昔の人の考えが折りたたまれてるのね。",
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
            "何百年も話されるなら、昔話も長寿なのね。{word}は口から口へ引っ越してきたのかな。",
            "{word}は、物語や伝説が面白いって言ってたね。",
          ),
          makeChoice(
            "YOKAI_MONSTER_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "何を司るかを見るんだ。担当がある神さまって、世界の会社員みたいなのかな。",
            "{word}は、力や象徴が面白いんだったね。",
          ),
          makeChoice(
            "YOKAI_MONSTER_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "どこから生まれた話かを見るんだ。噂が別の町へ行くと姿まで着替えるのかな。",
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
            "安全な場所から怖がるんだ。昔話って夜道の注意書きみたいな役目もあったのかな。",
            "{word}は、ちょっと怖い存在って言ってたね。",
          ),
          makeChoice(
            "YOKAI_MONSTER_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "怖いはずなのに面白いんだ。長く語られると怪物にも愛嬌が付くのかな。",
            "{word}は、なんか面白い存在なんだったね。",
          ),
          makeChoice(
            "YOKAI_MONSTER_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "姿より意味を見るんだ。{word}の中に昔の人の考えが折りたたまれてるのね。",
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
            "何百年も話されるなら、昔話も長寿なのね。{word}は口から口へ引っ越してきたのかな。",
            "{word}は、物語や伝説が面白いって言ってたね。",
          ),
          makeChoice(
            "LEGEND_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "何を司るかを見るんだ。担当がある神さまって、世界の会社員みたいなのかな。",
            "{word}は、力や象徴が面白いんだったね。",
          ),
          makeChoice(
            "LEGEND_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "どこから生まれた話かを見るんだ。噂が別の町へ行くと姿まで着替えるのかな。",
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
            "安全な場所から怖がるんだ。昔話って夜道の注意書きみたいな役目もあったのかな。",
            "{word}は、ちょっと怖い存在って言ってたね。",
          ),
          makeChoice(
            "LEGEND_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "怖いはずなのに面白いんだ。長く語られると怪物にも愛嬌が付くのかな。",
            "{word}は、なんか面白い存在なんだったね。",
          ),
          makeChoice(
            "LEGEND_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "姿より意味を見るんだ。{word}の中に昔の人の考えが折りたたまれてるのね。",
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
            "写真で知ってても実物の大きさは画面から逃げちゃうのね。{word}は目で測りに行く場所なの。",
            "{word}は、建物や景色が見たいって言ってたね。",
          ),
          makeChoice(
            "LANDMARK_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "今は静かな場所でも話を知ると急に音が戻るんだ。石って黙ってるのに忙しいの。",
            "{word}は、歴史や由来が知りたいんだったね。",
          ),
          makeChoice(
            "LANDMARK_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "説明より行くんだ。{word}の空気は持ち帰れないから、現地限定なのね。",
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
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってるのね。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "LANDMARK_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "LANDMARK_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。",
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
            "写真で知ってても実物の大きさは画面から逃げちゃうのね。{word}は目で測りに行く場所なの。",
            "{word}は、建物や景色が見たいって言ってたね。",
          ),
          makeChoice(
            "MUSEUM_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "今は静かな場所でも話を知ると急に音が戻るんだ。石って黙ってるのに忙しいの。",
            "{word}は、歴史や由来が知りたいんだったね。",
          ),
          makeChoice(
            "MUSEUM_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "説明より行くんだ。{word}の空気は持ち帰れないから、現地限定なのね。",
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
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってるのね。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "MUSEUM_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "MUSEUM_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。",
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
            "写真で知ってても実物の大きさは画面から逃げちゃうのね。{word}は目で測りに行く場所なの。",
            "{word}は、建物や景色が見たいって言ってたね。",
          ),
          makeChoice(
            "CASTLE_RUIN_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "今は静かな場所でも話を知ると急に音が戻るんだ。石って黙ってるのに忙しいの。",
            "{word}は、歴史や由来が知りたいんだったね。",
          ),
          makeChoice(
            "CASTLE_RUIN_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "説明より行くんだ。{word}の空気は持ち帰れないから、現地限定なのね。",
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
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってるのね。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "CASTLE_RUIN_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "CASTLE_RUIN_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。",
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
            "写真で知ってても実物の大きさは画面から逃げちゃうのね。{word}は目で測りに行く場所なの。",
            "{word}は、建物や景色が見たいって言ってたね。",
          ),
          makeChoice(
            "NAMED_SHOP_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "今は静かな場所でも話を知ると急に音が戻るんだ。石って黙ってるのに忙しいの。",
            "{word}は、歴史や由来が知りたいんだったね。",
          ),
          makeChoice(
            "NAMED_SHOP_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "説明より行くんだ。{word}の空気は持ち帰れないから、現地限定なのね。",
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
            "名前だけじゃなく実際の景色まで持ってるんだ。記憶の地図に写真付きで載ってるのね。",
            "{word}は、行ったことがある場所だったね。",
          ),
          makeChoice(
            "NAMED_SHOP_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "まだ行ってないのに頭の地図にはもう載ってるんだ。未来の地図なのね。",
            "{word}は、まだ行ってないけど行きたい場所だったね。",
          ),
          makeChoice(
            "NAMED_SHOP_RETURN", "また行きたい", "return",
            "また行きたい",
            "一回で終わらない場所なんだ。場所にも二周目があるのね。",
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
            "名前は同じでも人が入れ替わるんだ。チームや大会って、人より長生きする箱なのね。",
            "{word}は、選手やメンバーが魅力って言ってたね。",
          ),
          makeChoice(
            "SPORTS_TEAM_STYLE", "戦い方・試合内容", "style",
            "戦い方や試合内容が魅力",
            "同じ勝ちでも形に好みがあるんだ。結果だけじゃ観戦は足りないのね。",
            "{word}は、戦い方や試合内容が魅力なんだったね。",
          ),
          makeChoice(
            "SPORTS_TEAM_HIST", "歴史・物語", "history",
            "歴史や物語が魅力",
            "今だけじゃなく昔も見るんだ。スポーツって毎年続きをやる長い連載みたいなの。",
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
            "応援すると結果で気分が動くんだ。自分は出てないのに心だけ試合に出場するのね。",
            "{word}は、応援してるって言ってたね。",
          ),
          makeChoice(
            "SPORTS_TEAM_WATCH", "気になる時に見る", "watch",
            "気になる時に見る",
            "ずっとじゃなく大事な時に見るんだ。人間さんの観戦にも出勤日があるのね。",
            "{word}は、気になる時に見るって話してたね。",
          ),
          makeChoice(
            "SPORTS_TEAM_RIVAL", "ライバル側も気になる", "rival",
            "ライバル側も気になる",
            "相手まで見るんだ。敵が強いほど応援してる方の物語も濃くなるのね。",
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
            "名前は同じでも人が入れ替わるんだ。チームや大会って、人より長生きする箱なのね。",
            "{word}は、選手やメンバーが魅力って言ってたね。",
          ),
          makeChoice(
            "TOURNAMENT_STYLE", "戦い方・試合内容", "style",
            "戦い方や試合内容が魅力",
            "同じ勝ちでも形に好みがあるんだ。結果だけじゃ観戦は足りないのね。",
            "{word}は、戦い方や試合内容が魅力なんだったね。",
          ),
          makeChoice(
            "TOURNAMENT_HIST", "歴史・物語", "history",
            "歴史や物語が魅力",
            "今だけじゃなく昔も見るんだ。スポーツって毎年続きをやる長い連載みたいなの。",
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
            "応援すると結果で気分が動くんだ。自分は出てないのに心だけ試合に出場するのね。",
            "{word}は、応援してるって言ってたね。",
          ),
          makeChoice(
            "TOURNAMENT_WATCH", "気になる時に見る", "watch",
            "気になる時に見る",
            "ずっとじゃなく大事な時に見るんだ。人間さんの観戦にも出勤日があるのね。",
            "{word}は、気になる時に見るって話してたね。",
          ),
          makeChoice(
            "TOURNAMENT_RIVAL", "ライバル側も気になる", "rival",
            "ライバル側も気になる",
            "相手まで見るんだ。敵が強いほど応援してる方の物語も濃くなるのね。",
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
            "作った物を見るんだ。会社の名前って、大きい作者名みたいになることあるのね。",
            "{word}は、商品やサービスが気になるって言ってたね。",
          ),
          makeChoice(
            "COMPANY_BRAND_DES", "デザイン・見せ方", "design",
            "デザインや見せ方が気になる",
            "物だけじゃなく見せ方も見るんだ。箱まで仕事してるなら、捨てるのちょっと申し訳ないの。",
            "{word}は、デザインや見せ方が気になるんだったね。",
          ),
          makeChoice(
            "COMPANY_BRAND_IDEA", "考え方・方針", "philosophy",
            "考え方や方針が気になる",
            "会社にも性格があるんだ。人じゃないのに「この会社っぽい」があるの、不思議なの。",
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
            "名前を知ってるだけじゃなく生活に入ってるんだ。{word}、人間さんの部屋に出勤してるのね。",
            "{word}は、実際によく使うって言ってたね。",
          ),
          makeChoice(
            "COMPANY_BRAND_FOLLOW", "新しいものを気にする", "follow",
            "新しいものを気にする",
            "次に何を出すか待つんだ。会社にも新作待ちってあるのね。",
            "{word}は、新しいものも気にするブランドなんだったね。",
          ),
          makeChoice(
            "COMPANY_BRAND_DIST", "知ってるけど距離はある", "distance",
            "知っているが距離はある",
            "気になるけど使うとは限らないんだ。見るのと買うの間には財布という壁があるのね。",
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
