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
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "BOOK_HOOK_IDEA", "考え方・知識", "ideas",
            "考え方や知識が印象に残る",
            "{word}では、知らなかったことや新しい考えが残るんだね。ぼくは、読む前と後で、自分の考えが変わるか比べてみたいな。全部に賛成しなくても、考えるきっかけにはなりそうなの。",
            "{word}の考えを知ったら、ぼくならどう考えるかも確かめたいな。同じ意見でも、そこまでの理由は違うことがあると思うの。",
          ),
          makeChoice(
            "BOOK_HOOK_STYLE", "文章・言葉づかい", "writing",
            "文章や言葉づかいが印象に残る",
            "{word}は、言葉の選び方にも注目するんだね。同じことでも、言い方で優しく聞こえたり、強く聞こえたりすると思うの。ぼくも、内容だけじゃなくて伝え方を考えてみたいな。",
            "{word}の文章を読んだら、どんな言葉が残るかな。ぼくなら同じことをどう伝えるか、少し考えてみたいの。",
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
            "{word}は、また読みたくなる本なんだね。話を知ってから読むと、最初は気付かなかったところも見つかりそうなの。ぼくは、初めて読んだ時と何が違うか比べてみたいな。",
            "{word}を読み返すなら、前に気になったところと、今回はじめて気付くところを比べたいな。同じ文章でも、分かることが増えるかもしれないの。",
          ),
          makeChoice(
            "BOOK_RELATION_RECENT", "最近読んだ", "recent",
            "最近読んだ本",
            "{word}は、最近読んだばかりなんだね。ぼくは、読み終わった直後に気になることと、しばらくして思い出すことを比べてみたいな。あとから意味が分かる場面もありそうなの。",
            "{word}のどの場面が、しばらくしても残るんだろう。ぼくは、すぐ面白いと思ったところ以外にも、あとから気になるところがあるのかなって考えてるの。",
          ),
          makeChoice(
            "BOOK_RELATION_WANT", "まだ読んでないけど気になる", "want",
            "まだ読んでいないが気になる",
            "{word}は、まだ読んでいなくても気になるんだね。ぼくは、紹介で面白そうと思ったところが、実際にはどう書かれているか知りたいな。読む前の想像と比べるのも楽しそうなの。",
            "{word}を読んだら、今想像している内容と何が違うかな。ぼくは、まだ読んでいないところは、想像だと分けて話したいの。",
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
            "{word}では、登場人物が気になるんだね。ぼくは、その人物が何を大事にしているか知りたいな。困った時の行動を見ると、普段とは違うところも分かりそうなの。",
            "{word}の登場人物は、何を大切にしているんだろう。ぼくは、誰かと意見が違った時にどうするかも見てみたいな。",
          ),
          makeChoice(
            "MANGA_HOOK_STORY", "物語・展開", "story",
            "物語や展開が魅力",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "MANGA_HOOK_ART", "絵・コマの見せ方", "art",
            "絵やコマの見せ方が魅力",
            "{word}は、絵やコマの見せ方も楽しむんだね。同じ出来事でも、大きく描くところで目が向く場所は変わりそうなの。ぼくは、セリフのないコマにも注目してみたいな。",
            "{word}を読むなら、絵だけで伝わるところも探してみたいな。言葉がなくても気持ちが分かる場面は、どう描いているんだろう。",
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
            "{word}は、今も続けて読んでいるんだね。ぼくは、次を予想するのも面白そうだと思うの。予想と違うことが起きたら、前の場面も読み返したくなるかな。",
            "{word}の次がどうなるか考える時、前に起きたことも思い出したいな。ぼくは、予想が外れても、どうしてそうなったか分かると面白そうだと思うの。",
          ),
          makeChoice(
            "MANGA_RELATION_DONE", "読み終わってる", "finished",
            "読み終わっている",
            "{word}は、最後まで読んだんだね。結末が分かると、途中の場面も違って見えることがありそうなの。ぼくは、最後を知ってから気になるところを考えてみたいな。",
            "{word}の終わりを知ったら、最初の場面をどう感じるかな。ぼくは、途中で分からなかったことがつながるか確かめてみたいの。",
          ),
          makeChoice(
            "MANGA_RELATION_REREAD", "何度も読み返す", "reread",
            "何度も読み返す",
            "{word}は、また読みたくなる本なんだね。話を知ってから読むと、最初は気付かなかったところも見つかりそうなの。ぼくは、初めて読んだ時と何が違うか比べてみたいな。",
            "{word}を読み返すなら、前に気になったところと、今回はじめて気付くところを比べたいな。同じ文章でも、分かることが増えるかもしれないの。",
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
            "{word}では、登場人物が気になるんだね。ぼくは、その人物が何を大事にしているか知りたいな。困った時の行動を見ると、普段とは違うところも分かりそうなの。",
            "{word}の登場人物は、何を大切にしているんだろう。ぼくは、誰かと意見が違った時にどうするかも見てみたいな。",
          ),
          makeChoice(
            "ANIME_HOOK_STORY", "物語・世界観", "story",
            "物語や世界観が魅力",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "ANIME_HOOK_AUDIOVISUAL", "絵・動き・音楽", "audiovisual",
            "絵・動き・音楽が魅力",
            "{word}は、絵だけじゃなく動きや音も気になるんだね。音がある時とない時で、同じ場面の感じ方は変わりそうなの。ぼくは、どれが一番気持ちを伝えているか考えてみたいな。",
            "{word}の場面を、音を聞かずに見たら何が変わるんだろう。絵と動きと音が、それぞれ違うことを伝えているのかもしれないの。",
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
            "{word}は、少しずつ続きを見るんだね。間があくと、次を考える時間もできそうなの。ぼくは、前の話で気になったことを覚えておきたいな。",
            "{word}の続きを待つ間に、まだ分からないところを考えてみたいな。次の話で答えが分かるか、それとも疑問が増えるか気になるの。",
          ),
          makeChoice(
            "ANIME_WATCH_BINGE", "まとめて見る", "binge",
            "まとめて見る",
            "{word}は、続けて見ることが多いんだね。前の話を覚えているうちに次へ進めるのは、分かりやすそうなの。ぼくなら、気になる場面で少し止まって考える時間もほしいな。",
            "{word}を続けて見るなら、前の出来事が次にどうつながるか気になるの。早く先を知りたいけど、大事な場面は急いで見逃さないでいたいな。",
          ),
          makeChoice(
            "ANIME_WATCH_REWATCH", "何度も見返す", "rewatch",
            "何度も見返す",
            "{word}は、もう一度見たくなるんだね。先を知って見ると、最初は気付かなかった表情や言葉も分かりそうなの。ぼくは、同じ場面をどう感じるか比べてみたいな。",
            "{word}を見直したら、前とは違うところが気になるかな。ぼくは、先の出来事を知ってから見ると意味が変わる場面を探したいの。",
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
            "{word}では、上手くなることや攻略が楽しいんだね。できなかったことができるようになると、何を変えたか知りたくなるの。ぼくは、失敗した時のやり方と比べてみたいな。",
            "{word}で上手くいかなかったら、次は何を一つ変えるとよさそうかな。ぼくは、たくさん試すだけじゃなく、違いを見ながらやってみたいの。",
          ),
          makeChoice(
            "GAME_HOOK_STORY", "物語・世界を味わう", "story",
            "物語や世界を味わうのが楽しい",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "GAME_HOOK_EXPLORE", "集める・探す・自由に遊ぶ", "explore",
            "集めたり探したり自由に遊ぶのが楽しい",
            "{word}では、自分で探したり集めたりするのが楽しいんだね。決まった道から少し外れると、新しいものが見つかりそうなの。ぼくは、見逃した場所がないか確かめてみたいな。",
            "{word}を遊ぶなら、いつも通らない場所も見てみたいな。見つけたものの数だけじゃなく、どうやって見つけたかも覚えておきたいの。",
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
            "{word}は、しっかり考えて遊ぶんだね。ぼくは、上手くいった時の理由も知りたくなるの。次に同じやり方をして、またできるか確かめてみたいな。",
            "{word}で上手くいった時、たまたまだったのか、やり方がよかったのか気になるな。ぼくなら、同じことをもう一度試して比べてみたいの。",
          ),
          makeChoice(
            "GAME_RELATION_CASUAL", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "{word}は、気楽に楽しみたいんだね。ぼくは、上手くできたかより、面白かったかを大事にする遊び方もいいと思うの。その日の気分でやりたいことを選べそうなの。",
            "{word}を楽しむなら、今日は何をやってみたいかな。全部を上手くやろうとせず、一つ面白いことを見つけるのもよさそうなの。",
          ),
          makeChoice(
            "GAME_RELATION_WATCH", "自分より見る方が多い", "watch",
            "見る方が多い",
            "{word}は、自分で遊ぶより見る方が多いんだね。ぼくは、人のやり方を比べるのも面白そうだと思うの。上手そうに見えるところが、実際にはどれくらい難しいかも気になるな。",
            "{word}を人が遊ぶ時、どんなところでやり方が違うんだろう。ぼくは、自分ならどうするか考えながら見るのも面白そうだと思うの。",
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
            "{word}は、性格や考え方が好きなんだね。ぼくは、困った時に何を大事にするか知りたいな。普段のセリフと実際の行動がつながるかも気になるの。",
            "{word}が誰かと意見の違う時、どうやって考えるんだろう。ぼくは、好きなところだけでなく、迷う場面も知りたいな。",
          ),
          makeChoice(
            "CHARACTER_HOOK_DESIGN", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "CHARACTER_HOOK_ACTION", "行動・活躍", "action",
            "行動や活躍が魅力",
            "{word}は、何をしたかが気になるんだね。ぼくは、行動の理由も知りたいな。同じことをしても、誰かのためか、自分のためかで感じ方は変わりそうなの。",
            "{word}が何かを決めて動く時、どうしてそれを選んだのか気になるの。その行動で、周りの人がどう変わったかも考えてみたいな。",
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
            "{word}は、かなり大事なキャラクターなんだね。ぼくは、どんな場面で特に気持ちが動くのか知りたいな。出番が短くても、ずっと覚えていることはありそうなの。",
            "{word}の出番が少なくても、好きな場面は何度も思い出すのかな。ぼくは、どんなところが長く残るのか考えてみたいな。",
          ),
          makeChoice(
            "CHARACTER_RELATION_INTEREST", "気になる・おもしろい", "interesting",
            "気になる・おもしろい",
            "{word}は、好きと決める前に気になる感じなんだね。ぼくは、理由がまだ言えなくても見ていたくなることはありそうだと思うの。何が引っかかったのか、少しずつ分かるかもしれないね。",
            "{word}のどこが気になるのか、すぐには一つに決められないこともあるのかな。ぼくは、もう少し知ってから考えてみたいな。",
          ),
          makeChoice(
            "CHARACTER_RELATION_MEMORABLE", "好きじゃないけど印象に残る", "memorable",
            "好きではないが印象に残る",
            "{word}は、好きじゃなくても忘れにくいんだね。ぼくは、気になることと好きなことは別だと思うの。納得できなかった場面が残ることもありそうなの。",
            "{word}を思い出す理由は、好きだからとは限らないのね。ぼくは、何が納得できなかったのかを考えると、覚えている理由も分かるかもしれないと思うの。",
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
            "{word}は、その世界に興味があるんだね。ぼくは、そこで普通の毎日を過ごすとどうなるか考えてみたいな。特別な出来事だけじゃなく、暮らしの決まりも気になるの。",
            "{word}の世界で暮らすなら、最初に何を覚える必要があるんだろう。ぼくは、普段の生活がこちらとどう違うか知りたいな。",
          ),
          makeChoice(
            "FRANCHISE_HOOK_CHARACTER", "キャラが好き", "characters",
            "キャラクターが好き",
            "{word}は、登場人物が好きで見たくなるんだね。ぼくは、一人でいる時と誰かと話す時の違いも気になるの。関わる相手によって、見えるところが変わるかもしれないね。",
            "{word}の好きなキャラクターが、別の相手と話したらどんな顔をするかな。ぼくは、一人だけ見ている時には分からない関係も知りたいの。",
          ),
          makeChoice(
            "FRANCHISE_HOOK_HISTORY", "積み重ね・歴史が好き", "history",
            "積み重ねや歴史が好き",
            "{word}は、長く続いてきたところが好きなんだね。ぼくは、作品が増える中で何が変わったか知りたいな。最初から残っているところにも注目してみたいの。",
            "{word}のシリーズでは、変わったところと続いているところがあるのかな。ぼくは、順番に見た時に分かるつながりも気になるの。",
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
            "{word}は、だいたい全部見ているんだね。作品ごとの違いに気付きやすそうなの。ぼくは、続けて見たから分かるつながりがあるか知りたいな。",
            "{word}の作品を順番に見たら、どんなところが変わっていくんだろう。同じ名前のシリーズでも、作品ごとの工夫を比べてみたいな。",
          ),
          makeChoice(
            "FRANCHISE_STYLE_PICK", "気になる作品だけ", "selective",
            "気になる作品だけ追う",
            "{word}は、気になる作品を選んで見るんだね。全部知らなくても、一つをじっくり楽しむことはできると思うの。ぼくは、選ぶ時に何が気になったのかも知りたいな。",
            "{word}の中から一つ選ぶなら、内容や登場人物のどこが決め手になるかな。ぼくは、全部追うことより、見たい理由を大事にしてもよさそうだと思うの。",
          ),
          makeChoice(
            "FRANCHISE_STYLE_OLD", "昔の作品が特に好き", "older",
            "昔の作品が特に好き",
            "{word}は、昔の作品が特に好きなんだね。ぼくは、その頃ならではの良さがどこにあるか知りたいな。新しい作品と比べても、古い方が好きなところはありそうなの。",
            "{word}の昔の作品には、今とは違うどんな良さがあるんだろう。新しいか古いかだけでは、面白さは決まらないと思うの。",
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
            "{word}は、作品の中の技や能力に関係するんだね。ぼくは、できることだけじゃなく、できないことも知りたいな。決まりがあると、使い方を工夫するところが面白そうなの。",
            "{word}は、どんな時に使えて、どんな時には使えないんだろう。ぼくは、制限があるから考えられる工夫も気になるの。",
          ),
          makeChoice(
            "FICTIONAL_KIND_ITEM", "道具・武器・乗りもの", "item",
            "道具・武器・乗りものに近い",
            "{word}は、作品の中で使うものなんだね。ぼくは、誰がどんな時に使うのか知りたいな。便利そうでも、使い方が難しいところはあるかもしれないの。",
            "{word}を使う人は、何をしたい時に選ぶんだろう。見た目のかっこよさだけじゃなく、役に立つ場面も気になるの。",
          ),
          makeChoice(
            "FICTIONAL_KIND_WORLD", "場所・組織・世界の用語", "world_term",
            "場所・組織・世界の用語に近い",
            "{word}は、作品の世界に関係する言葉なんだね。ぼくは、その意味が分かると話のどこが分かりやすくなるか知りたいな。名前だけ覚えるより、使われる場面も一緒に知りたいの。",
            "{word}が話に出てきたら、どんなことが分かるんだろう。その世界の決まりと結び付けて覚えると、名前も分かりやすくなりそうなの。",
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
            "{word}は、名前の響きもいいんだね。ぼくは、声に出した時と文字で見た時の違いも気になるの。意味を知る前から覚えてしまう名前もありそうなの。",
            "{word}の名前は、音で聞いた時と文字で見た時で印象が変わるかな。ぼくは、どこが覚えやすいのか考えてみたいの。",
          ),
          makeChoice(
            "FICTIONAL_HOOK_IMPORTANT", "物語で重要", "important",
            "物語で重要",
            "{word}は、お話の大事なところに関わるんだね。ぼくは、それを知らないとどこで困るか考えてみたいな。後の出来事とつながるなら、出てきた時のことも覚えておきたいの。",
            "{word}を知らずに話を読んだら、どこが分からなくなるんだろう。ぼくは、名前の意味と出てくる場面をつなげて覚えたいな。",
          ),
          makeChoice(
            "FICTIONAL_HOOK_WEIRD", "変・独特で忘れにくい", "weird",
            "変・独特で忘れにくい",
            "{word}は、ほかと違うところがあって覚えやすいんだね。ぼくは、その変わったところにどんな理由があるか気になるの。最初は不思議でも、意味を知ると納得できるかもしれないね。",
            "{word}の変わったところは、わざとそうしているのかな。ぼくは、理由を知ってからもう一度見ると、感じ方が変わるか確かめたいの。",
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
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "MOVIE_HOOK_ACTING", "俳優・演技", "acting",
            "俳優や演技が印象に残る",
            "{word}は、演技や表現が印象に残るんだね。ぼくは、同じ言葉でも声や表情で何が変わるか見てみたいな。言葉にしていない気持ちも伝わるかもしれないの。",
            "{word}の演技では、セリフがない時に何が伝わるんだろう。ぼくは、表情や動きだけで分かることも探してみたいな。",
          ),
          makeChoice(
            "MOVIE_HOOK_VISUAL", "映像・音・雰囲気", "visual",
            "映像や音や雰囲気が印象に残る",
            "{word}は、映像や音の感じが残るんだね。ぼくは、同じ場面でも音楽が違ったらどう見えるか気になるの。話の内容以外にも、気持ちを伝える工夫がありそうなの。",
            "{word}の映像と音は、どんな気持ちを伝えているんだろう。ぼくは、何が起きたかだけでなく、どう見せているかも考えてみたいな。",
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
            "{word}は、もう一度見たくなるんだね。先を知って見ると、最初は気付かなかった表情や言葉も分かりそうなの。ぼくは、同じ場面をどう感じるか比べてみたいな。",
            "{word}を見直したら、前とは違うところが気になるかな。ぼくは、先の出来事を知ってから見ると意味が変わる場面を探したいの。",
          ),
          makeChoice(
            "MOVIE_RELATION_ONCE", "一回で満足", "once",
            "一回見て満足",
            "{word}は、一度見て満足できたんだね。もう一度見なくても、大事な場面は思い出せそうなの。ぼくは、何が一番残ったのかゆっくり考える時間もいいと思うな。",
            "{word}をもう一度見なくても、思い出して考えられることはありそうなの。ぼくは、長く残る場面がどこなのか気になるな。",
          ),
          makeChoice(
            "MOVIE_RELATION_WANT", "まだ見てないけど気になる", "want",
            "まだ見ていないが気になる",
            "{word}は、まだ見ていなくても気になるんだね。ぼくは、紹介だけでは分からない表情や動きも見てみたいな。実際に見たら、予想と違うところも面白そうなの。",
            "{word}を実際に見たら、今想像しているところをどう感じるかな。ぼくは、まだ見ていない場面を、知っているようには話さないでいたいの。",
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
            "{word}は、そこで知れることや内容が気になるんだね。ぼくは、面白いと思った話をもう少し調べたくなりそうなの。知ったことが別の疑問につながるのも楽しそうだね。",
            "{word}で一つ新しいことを知ったら、次に何が気になるかな。ぼくは、分かったことだけでなく、まだ分からないことも覚えておきたいの。",
          ),
          makeChoice(
            "PROGRAM_HOOK_PEOPLE", "出演者・話す人", "people",
            "出演者や話す人が魅力",
            "{word}は、出ている人が好きなんだね。ぼくは、人が変わると同じ話題でもやり取りが変わると思うの。誰がどう話を受け取るかも見てみたいな。",
            "{word}の出演者が違ったら、同じ話も変わって見えるかな。ぼくは、話す内容だけでなく、相手への返し方も気になるの。",
          ),
          makeChoice(
            "PROGRAM_HOOK_STYLE", "雰囲気・編集・見せ方", "style",
            "雰囲気や編集や見せ方が魅力",
            "{word}は、話の見せ方も好きなんだね。ぼくは、同じ内容でも順番や音で感じ方が変わると思うの。どんな工夫が見やすさにつながるのか知りたいな。",
            "{word}は、どの順番で見せると分かりやすくなるんだろう。ぼくは、話の内容とは別に、伝え方の工夫も探したいの。",
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
            "{word}は、決まった時に見るんだね。次の放送を楽しみにする時間もありそうなの。ぼくなら、前の話で気になったことを覚えて待ちたいな。",
            "{word}の次の時間までに、前の話を少し思い出しておきたいな。続けて見るのとは違う楽しみ方もありそうなの。",
          ),
          makeChoice(
            "PROGRAM_WATCH_BINGE", "まとめて見る", "binge",
            "まとめて見る",
            "{word}は、続けて見ることが多いんだね。前の話を覚えているうちに次へ進めるのは、分かりやすそうなの。ぼくなら、気になる場面で少し止まって考える時間もほしいな。",
            "{word}を続けて見るなら、前の出来事が次にどうつながるか気になるの。早く先を知りたいけど、大事な場面は急いで見逃さないでいたいな。",
          ),
          makeChoice(
            "PROGRAM_WATCH_BACKGROUND", "ながら見が多い", "background",
            "ながら見が多い",
            "{word}は、ほかのことをしながら見ることが多いんだね。ぼくは、どんな話なら集中して見たくなるか気になるの。見逃したところがあれば、あとで確かめたいな。",
            "{word}を見ながら別のことをする時、どこで手を止めたくなるかな。ぼくは、気になった話を落ち着いてもう一度確かめたいの。",
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
            "{word}は、出ている人にも興味があるんだね。ぼくは、同じ人が別の話をする時も見てみたいな。話題が変わると、まだ知らないところが分かるかもしれないの。",
            "{word}がいつもと違う話をしたら、どんなところが見えるかな。ぼくは、一つの話題だけで人柄を決めないでいたいの。",
          ),
          makeChoice(
            "ONLINE_HOOK_TOPIC", "扱う話題が好き", "topic",
            "扱う話題が好き",
            "{word}は、扱っている話題が気になるんだね。ぼくは、同じ話題をほかの人がどう説明するかも知りたいな。比べると、自分が分かっていないところに気付けそうなの。",
            "{word}で気になった話題を、別の説明でも調べてみたいな。同じことでも、違う例があると分かりやすくなるかもしれないの。",
          ),
          makeChoice(
            "ONLINE_HOOK_STYLE", "話し方・編集・空気", "style",
            "話し方や編集や空気が好き",
            "{word}は、話し方や全体の感じが好きなんだね。ぼくは、声の速さや話のつなぎ方でも聞きやすさが変わると思うの。内容が同じでも楽しみ方は違いそうなの。",
            "{word}の話が聞きやすいのは、どんな工夫からなんだろう。ぼくは、間の取り方と見せ方の両方を考えてみたいな。",
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
            "{word}は、よく見るんだね。何度も見ると、いつものところと変わったところを比べられそうなの。ぼくは、慣れていても新しい話はちゃんと聞きたいな。",
            "{word}を何度も見ると、前とは違うところに気付くかな。知っているつもりでも、その日の話には新しいことがありそうなの。",
          ),
          makeChoice(
            "ONLINE_RELATION_SEARCH", "気になる時だけ探す", "search",
            "気になる時だけ探す",
            "{word}は、気になった時に探すんだね。知りたいことがあると、見る場所も選びやすそうなの。ぼくは、一つ分かったら次に何が気になるか考えてみたいな。",
            "{word}を探す時は、何を知りたいのか一つ決めてみたいな。答えが見つかったあとに、新しい疑問が出てくるかも気になるの。",
          ),
          makeChoice(
            "ONLINE_RELATION_CLIP", "切り抜き・短い動画中心", "clips",
            "切り抜きや短い動画中心",
            "{word}は、短い場面で見ることが多いんだね。ぼくは、その前後に何があったかも気になるの。短いところだけでは、話の意味が変わって見える場合もありそうなの。",
            "{word}の短い場面が気になったら、前と後も知りたくなるの。ぼくは、見た部分だけで全部を分かったつもりにならないでいたいな。",
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
            "{word}は、音の流れやリズムが好きなんだね。ぼくは、どの音が何度も思い出したくなるのか気になるの。同じ曲でも、速さが違ったら感じ方は変わりそうだね。",
            "{word}を聴くなら、音が変わるところにも注目してみたいな。ぼくは、どこで明るく感じたり落ち着いたりするのか気になるの。",
          ),
          makeChoice(
            "MUSIC_HOOK_LYRICS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が好き",
            "{word}は、歌の言葉が残るんだね。ぼくは、一言だけでなく前後の言葉も知りたいな。同じ言葉でも、誰に向けているかで意味が変わると思うの。",
            "{word}の歌詞は、誰へどんな気持ちを伝えているんだろう。ぼくは、一つの言葉を前後と一緒に考えてみたいな。",
          ),
          makeChoice(
            "MUSIC_HOOK_VOICE", "声・音作り", "voice_sound",
            "声や音作りが好き",
            "{word}は、声や音の作り方が好きなんだね。ぼくは、同じ曲を違う声で聴いたらどう感じるか気になるの。音の重なりにも、気付いていない工夫がありそうだね。",
            "{word}の声や音は、どんな感じを伝えているんだろう。ぼくは、言葉だけでは分からない気持ちも聞き取ってみたいな。",
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
            "{word}は、何度も聴きたくなる曲なんだね。慣れてから初めて気付く音もありそうなの。ぼくは、その日の気分で好きなところが変わるかも考えてみたいな。",
            "{word}をまた聴いたら、前には気付かなかった音が見つかるかな。知っている曲だからこそ、落ち着いて聞けるところもありそうなの。",
          ),
          makeChoice(
            "MUSIC_RELATION_MEMORY", "思い出と結びついてる", "memory",
            "思い出と結びついている",
            "{word}は、思い出ともつながっているんだね。ぼくは、曲を聴くと当時の気持ちまで思い出すのか気になるの。今の気持ちで聴いたら、感じ方が変わることもありそうなの。",
            "{word}を聴いた時、音だけでなく、その頃の出来事も思い出すのかな。ぼくは、昔の気持ちと今の気持ちの違いも考えてみたいの。",
          ),
          makeChoice(
            "MUSIC_RELATION_BACKGROUND", "作業中・移動中に聴く", "background",
            "作業中や移動中に聴く",
            "{word}は、何かをしながら聴くことが多いんだね。ぼくは、音がある時とない時で気分が変わるか気になるの。落ち着いて聴いたら、違うところに気付くかもしれないね。",
            "{word}を聴く時、周りの景色やしていることも感じ方に関わるかな。ぼくは、じっくり聴く時との違いも考えてみたいの。",
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
            "{word}は、仕事や作ったものが気になるんだね。ぼくは、できたものだけでなく、何を目指して作ったのかも知りたいな。工夫したところが分かると、見方も変わりそうなの。",
            "{word}の仕事では、何を大事にして作っているんだろう。ぼくは、できたものから分かることと、本人に聞かないと分からないことを分けて考えたいな。",
          ),
          makeChoice(
            "FAMOUS_HOOK_TALK", "話し方・考え方", "talk",
            "話し方や考え方が気になる",
            "{word}は、話す考えや伝え方が気になるんだね。ぼくは、結論だけじゃなく、どんな理由で考えたか知りたいな。例が分かると、自分の意見とも比べられそうなの。",
            "{word}がそう考えた理由を、ぼくも聞いてみたいな。説明の仕方と意見の内容は、別々に考えることもできそうなの。",
          ),
          makeChoice(
            "FAMOUS_HOOK_STYLE", "雰囲気・見た目・存在感", "style",
            "雰囲気や見た目や存在感が気になる",
            "{word}は、雰囲気や見た目が気になるんだね。ぼくは、表情や姿勢から何を感じるのか考えてみたいな。見た目で感じたことと、本人の考えは分けて知りたいの。",
            "{word}の雰囲気は、どんなところから感じるんだろう。ぼくは、見た印象だけでは分からない部分もあると思うの。",
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
            "{word}は、かなり好きな人なんだね。ぼくは、好きになったきっかけと、今も気になる理由の違いを知りたいな。知ることが増えると、好きなところも増えるかもしれないね。",
            "{word}を好きになった時と今では、気になるところは同じなのかな。ぼくは、長く知ってから分かる良さもありそうだと思うの。",
          ),
          makeChoice(
            "FAMOUS_RELATION_CURIOUS", "気になるくらい", "curious",
            "気になるくらい",
            "{word}は、もう少し知りたい感じなんだね。ぼくは、好きと決める前でも話を聞いてみたくなることはあると思うの。知ってから考えが変わるかもしれないね。",
            "{word}について、次に何を知ると考えやすくなるかな。ぼくは、まだ知らない部分を一つ確かめてから、どう感じるか考えたいの。",
          ),
          makeChoice(
            "FAMOUS_RELATION_MIXED", "好き嫌いは別で印象に残る", "mixed",
            "好き嫌いは別で印象に残る",
            "{word}は、好き嫌いとは別に気になるんだね。ぼくは、分からないところや意見の違うところが残ることもあると思うの。気になる理由は、好きだからだけではないのね。",
            "{word}を思い出す時、何がまだ気になっているんだろう。好きなところを探すより、引っかかった理由を考える方が分かりそうなの。",
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
            "{word}は、やったことが気になるんだね。ぼくは、どんな問題を解決しようとしたのかも知りたいな。結果だけでなく、始めた理由が分かると考えやすそうなの。",
            "{word}が何かを始めた時、どんな問題があったんだろう。ぼくは、やったことと、その理由を一緒に考えてみたいな。",
          ),
          makeChoice(
            "HISTORY_PERSON_HOOK_DECISION", "判断・失敗・選び方", "decisions",
            "判断や失敗や選び方が気になる",
            "{word}は、選び方や失敗が気になるんだね。ぼくは、その時に何が分かっていたのか知りたいな。結果を知ったあとだけで考えると、当時の難しさを見落としそうなの。",
            "{word}が決める時、ほかにはどんな選び方があったんだろう。結果を知らない立場で考えると、簡単には決められないこともありそうなの。",
          ),
          makeChoice(
            "HISTORY_PERSON_HOOK_LIFE", "生き方・性格", "life",
            "生き方や性格が気になる",
            "{word}は、普段の暮らしや生き方が気になるんだね。ぼくは、大きい出来事がない日のことも知りたいな。どんな毎日を過ごしたかで、選んだ理由も分かるかもしれないの。",
            "{word}は、普段どんなことを大事にしていたんだろう。ぼくは、有名な出来事だけでなく、日々の暮らしも知ると考えやすそうだと思うの。",
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
            "{word}には、すごいと思うところがあるんだね。ぼくは、全部を真似するより、一つできそうなところを探したいな。どうやってできるようになったかも気になるの。",
            "{word}のすごいところを、自分にも少し取り入れるなら何ができるかな。ぼくは、結果だけ真似するより、続けたことや工夫を知りたいの。",
          ),
          makeChoice(
            "HISTORY_PERSON_RELATION_ANALYZE", "どう考えたか知りたい", "analyze",
            "どう考えたか知りたい",
            "{word}がどう考えたか知りたいんだね。ぼくは、迷っていたことや選ばなかった方も気になるの。答えだけ聞くより、理由を知る方が自分でも考えやすそうなの。",
            "{word}は、何を比べてその答えを選んだんだろう。ぼくなら違う答えにするのか、同じ理由で考えられるのかも確かめたいな。",
          ),
          makeChoice(
            "HISTORY_PERSON_RELATION_COMPARE", "他の人物と比べると面白い", "compare",
            "他の人物と比べると面白い",
            "{word}は、別の人物と比べると面白いんだね。ぼくは、似た場面でどんな選び方をしたか知りたいな。立場が違えば、同じ方法を選べないこともありそうなの。",
            "{word}と別の人が似た問題に出会ったら、どんな選び方の違いがあるかな。ぼくは、性格だけでなく、その時の立場も比べたいの。",
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
            "{word}は、作った作品そのものが好きなんだね。ぼくは、作った人を詳しく知らなくても作品は楽しめると思うの。あとから作る時の話を聞くと、また違って見えるかもしれないね。",
            "{word}の作品を見る時、作者を知る前と後で何が変わるかな。ぼくは、作品だけから感じたことも大事にしていたいの。",
          ),
          makeChoice(
            "CREATOR_HOOK_STYLE", "作風・技法", "style",
            "作風や技法が好き",
            "{word}は、作品の作り方が好きなんだね。ぼくは、同じ題材をほかの人が作る時と何が違うか知りたいな。少しの工夫でも、全体の感じが変わりそうなの。",
            "{word}の作品らしさは、どんな作り方から生まれるんだろう。ぼくは、ほかの作品と比べながら、違いを見つけてみたいな。",
          ),
          makeChoice(
            "CREATOR_HOOK_MIND", "考え方・発言", "mind",
            "考え方や発言が気になる",
            "{word}は、考え方が気になるんだね。ぼくは、どんな経験からその考えになったか知りたいな。自分と違う意見でも、理由を聞くと分かるところはあるかもしれないの。",
            "{word}の考えには、どんな理由や経験があるんだろう。ぼくは、賛成するか決める前に、そこを聞いてみたいな。",
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
            "{word}は、次の作品や仕事も見たいんだね。ぼくは、前と同じ良さと、新しく変わるところの両方が気になるの。まだ知らない内容は、予想と分けて待ちたいな。",
            "{word}の次では、今までと何が変わるんだろう。ぼくは、新しいことに挑戦するところと、続けている工夫を比べてみたいな。",
          ),
          makeChoice(
            "CREATOR_RELATION_ONE", "特定の一作が特に好き", "one_work",
            "特定の一作が特に好き",
            "{word}は、特に好きな作品が一つあるんだね。ぼくは、たくさん知っているかより、その一つの何が残ったのかが気になるの。好きな理由は人によって違いそうなの。",
            "{word}の一つの作品が特に残るのは、どんなところからなんだろう。ぼくは、ほかの作品を全部知らなくても、その理由は考えられそうだと思うの。",
          ),
          makeChoice(
            "CREATOR_RELATION_PERSON", "本人にも興味がある", "person",
            "本人にも興味がある",
            "{word}は、作ったものだけでなく本人にも興味があるんだね。ぼくは、何がきっかけで作り始めたか知りたいな。作品を見るだけでは分からない話もありそうなの。",
            "{word}本人は、作品にどんな工夫をしたと考えているんだろう。ぼくは、作る側と見る側の感じ方を比べてみたいな。",
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
            "{word}は、声が気になるんだね。同じ言葉でも、声の高さや速さで感じ方が変わると思うの。ぼくは、顔を見ずに聞いた時に何が伝わるか考えてみたいな。",
            "{word}の声から、言葉以外にどんな気持ちが伝わるかな。ぼくは、ゆっくり話す時と強く話す時の違いも聞いてみたいの。",
          ),
          makeChoice(
            "PERFORMER_HOOK_ACTING", "演技・表現", "acting",
            "演技や表現が魅力",
            "{word}は、演技や表現が印象に残るんだね。ぼくは、同じ言葉でも声や表情で何が変わるか見てみたいな。言葉にしていない気持ちも伝わるかもしれないの。",
            "{word}の演技では、セリフがない時に何が伝わるんだろう。ぼくは、表情や動きだけで分かることも探してみたいな。",
          ),
          makeChoice(
            "PERFORMER_HOOK_PERSON", "本人の雰囲気・人柄", "personality",
            "本人の雰囲気や人柄が魅力",
            "{word}は、人柄や考え方が気になるんだね。普段の話だけじゃなく、困った時にどうするかも知りたいな。一つの場面だけで、その人の全部は決められないと思うの。",
            "{word}が困った時、誰かに相談するのか、自分で考えるのか気になるな。普段と違う場面では、まだ知らないところが見えるかもしれないの。",
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
            "{word}は、好きな役を中心に見るんだね。ぼくは、別の役になった時にどんな違いがあるかも気になるの。役の性格と、演じる人の性格は分けて考えたいな。",
            "{word}が違う役を演じたら、声や動きはどれくらい変わるんだろう。ぼくは、同じ人でも別の人物に見える工夫を知りたいの。",
          ),
          makeChoice(
            "PERFORMER_RELATION_FOLLOW", "出演作を追う", "follow",
            "出演作を追う",
            "{word}は、次の作品や仕事も見たいんだね。ぼくは、前と同じ良さと、新しく変わるところの両方が気になるの。まだ知らない内容は、予想と分けて待ちたいな。",
            "{word}の次では、今までと何が変わるんだろう。ぼくは、新しいことに挑戦するところと、続けている工夫を比べてみたいな。",
          ),
          makeChoice(
            "PERFORMER_RELATION_CASUAL", "気になる時だけ見る", "casual",
            "気になる時だけ見る",
            "{word}は、気になった時に見るんだね。毎回見なくても、知りたい話は選べそうなの。ぼくは、どんな内容なら見たくなるか気になるな。",
            "{word}を見る時、どんな話が気になって選ぶんだろう。ぼくは、見る回数より、その時に知りたいことを考えてみたいの。",
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
            "{word}は、声や歌い方が好きなんだね。ぼくは、同じ曲でも歌い方が変わると、感じ方も変わると思うの。どんなところで気持ちが伝わるか聞いてみたいな。",
            "{word}が同じ曲を違う歌い方にしたら、何が変わるんだろう。ぼくは、声の強さや言葉の伸ばし方にも注目したいな。",
          ),
          makeChoice(
            "MUSICIAN_HOOK_SONGS", "曲・作詞作曲", "songs",
            "曲や作詞作曲が魅力",
            "{word}は、作った曲が気になるんだね。ぼくは、音と言葉をどう組み合わせているのか知りたいな。別の人が歌った時にも残る良さがあるか気になるの。",
            "{word}の曲では、音と言葉がどうつながっているんだろう。ぼくは、歌う人が変わった時に何が同じで何が違うかも考えたいな。",
          ),
          makeChoice(
            "MUSICIAN_HOOK_LIVE", "ライブ・表現", "performance",
            "ライブや表現が魅力",
            "{word}は、表現しているところが好きなんだね。ぼくは、動きや声でどんな気持ちを伝えているか知りたいな。言葉だけでは分からない工夫もありそうなの。",
            "{word}の動きや声を見たら、どんな気持ちが伝わるかな。ぼくは、大きい動きだけでなく、小さい変化にも注目してみたいの。",
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
            "{word}は、よく聴きたくなる人なんだね。ぼくは、声に安心するのか、曲で気持ちが動くのかも気になるの。何度も聴いてから分かる良さもありそうだね。",
            "{word}を何度も聴くと、いつも好きなところと、新しく気になるところがありそうなの。ぼくは、その違いを落ち着いて聞いてみたいな。",
          ),
          makeChoice(
            "MUSICIAN_RELATION_SONGS", "好きな曲だけ聴く", "selected_songs",
            "好きな曲を選んで聴く",
            "{word}は、好きな曲を選んで聴くんだね。同じ人の曲でも、感じ方が違うことはありそうなの。ぼくは、その曲だけにある好きなところが何か気になるな。",
            "{word}の曲を選ぶ時、今の気分も関係するのかな。ぼくは、同じ人の曲でも一曲ずつ違うところを知りたいの。",
          ),
          makeChoice(
            "MUSICIAN_RELATION_LIVE", "ライブも気になる", "live_interest",
            "ライブも気になる",
            "{word}をライブで見たらどう感じるか気になるんだね。ぼくは、録音で聞く時と、同じ場所で聞く時の違いを考えてみたいな。周りの人の反応も聞こえそうなの。",
            "{word}のライブでは、曲だけでなく会場の様子も感じられるのかな。まだ見ていない部分は、想像だと分かるように話したいの。",
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
            "{word}は、話す内容や伝え方が気になるんだね。ぼくは、分かりやすい話にはどんな工夫があるか知りたいな。同じ話でも、例や順番で聞きやすさは変わりそうなの。",
            "{word}の話は、どこで聞きやすくなるんだろう。ぼくは、内容だけでなく、例の出し方や説明の順番も考えてみたいな。",
          ),
          makeChoice(
            "STREAMER_HOOK_SKILL", "ゲーム・技術がうまい", "skill",
            "ゲームや技術がうまい",
            "{word}は、技術や上手さが気になるんだね。簡単そうに見える動きほど、練習が必要かもしれないの。ぼくは、どこに気を付けるとできるのか知りたいな。",
            "{word}の動きを真似するなら、まずどこを見るとよさそうかな。ぼくは、できた結果だけでなく、準備や判断も知りたいの。",
          ),
          makeChoice(
            "STREAMER_HOOK_PERSON", "雰囲気・人柄が好き", "personality",
            "雰囲気や人柄が好き",
            "{word}は、人柄や考え方が気になるんだね。普段の話だけじゃなく、困った時にどうするかも知りたいな。一つの場面だけで、その人の全部は決められないと思うの。",
            "{word}が困った時、誰かに相談するのか、自分で考えるのか気になるな。普段と違う場面では、まだ知らないところが見えるかもしれないの。",
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
            "{word}は、その場で見る楽しみがあるんだね。まだ先が分からないから、同じ時間に見ている感じがしそうなの。ぼくは、予定と違うことが起きた時の反応も気になるな。",
            "{word}をその場で見る時は、次がどうなるかまだ分からないのね。ぼくは、その時だけの反応も面白そうだと思うの。",
          ),
          makeChoice(
            "STREAMER_RELATION_ARCHIVE", "アーカイブ・動画で見る", "archive",
            "アーカイブや動画で見る",
            "{word}は、残っている動画で見るんだね。気になるところで止めたり、もう一度見たりできるのはよさそうなの。ぼくは、分からなかった話を落ち着いて確かめたいな。",
            "{word}の動画なら、気になったところへ戻って考えられるのね。ぼくは、早く先を見るより、一つ分かる時間も取りたいな。",
          ),
          makeChoice(
            "STREAMER_RELATION_CLIP", "切り抜き中心", "clips",
            "切り抜き中心",
            "{word}は、短い場面で見ることが多いんだね。ぼくは、その前後に何があったかも気になるの。短いところだけでは、話の意味が変わって見える場合もありそうなの。",
            "{word}の短い場面が気になったら、前と後も知りたくなるの。ぼくは、見た部分だけで全部を分かったつもりにならないでいたいな。",
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
            "{word}は、技術や上手さが気になるんだね。簡単そうに見える動きほど、練習が必要かもしれないの。ぼくは、どこに気を付けるとできるのか知りたいな。",
            "{word}の動きを真似するなら、まずどこを見るとよさそうかな。ぼくは、できた結果だけでなく、準備や判断も知りたいの。",
          ),
          makeChoice(
            "ATHLETE_HOOK_STYLE", "戦い方・スタイル", "style",
            "戦い方やスタイルが魅力",
            "{word}は、戦い方が気になるんだね。ぼくは、相手や状況でやり方を変えるか知りたいな。得意な方法だけでなく、難しい時の工夫も見てみたいの。",
            "{word}のやり方は、相手が変わっても同じなのかな。ぼくは、何を見て方法を選んでいるか知りたいの。",
          ),
          makeChoice(
            "ATHLETE_HOOK_STORY", "経歴・成長・背景", "story",
            "経歴や成長や背景が魅力",
            "{word}は、そこまでの成長が気になるんだね。ぼくは、前にできなかったことをどう練習したか知りたいな。今の上手さだけでは分からない苦労もありそうなの。",
            "{word}は、最初から今と同じ動きができたのかな。ぼくは、上手くいかない時に何を変えたかも知りたいの。",
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
            "{word}は、今の試合も見ているんだね。ぼくは、前の試合で難しかったところが次にどう変わるか気になるの。勝ち負けだけでなく、試した工夫にも注目したいな。",
            "{word}の次の試合では、前と違う工夫が見られるかな。ぼくは、結果だけでなく、途中の判断も知りたいの。",
          ),
          makeChoice(
            "ATHLETE_RELATION_HIGHLIGHT", "名場面や動画を見る", "highlights",
            "名場面や動画を見る",
            "{word}は、特に残る場面を見るんだね。ぼくは、その場面の前に何があったかも気になるの。そこまでの流れを知ると、すごさが分かりやすくなりそうなの。",
            "{word}の名場面は、そこまでに何があったんだろう。ぼくは、結果が出る直前の判断も一緒に知りたいな。",
          ),
          makeChoice(
            "ATHLETE_RELATION_HISTORY", "昔の記録や試合も見る", "history",
            "昔の記録や試合も見る",
            "{word}は、昔の試合も見るんだね。ぼくは、今と比べて動きや判断がどう変わったか知りたいな。当時の相手や決まりも一緒に考えると分かりやすそうなの。",
            "{word}の昔の試合を見たら、今との違いはどこにあるかな。ぼくは、上達したところだけでなく、前から続く得意なところも知りたいの。",
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
            "{word}は、理論や考え方が気になるんだね。ぼくは、どんなことを説明しようとしているのか知りたいな。身近な例で考えると、分かるところが増えそうなの。",
            "{word}の考えは、身近な出来事でも確かめられるかな。ぼくは、言葉だけ覚えるより、どんな場合に使うのか知りたいの。",
          ),
          makeChoice(
            "THINKER_HOOK_DISCOVERY", "発見・発明", "discovery",
            "発見や発明が気になる",
            "{word}は、発見や発明が気になるんだね。ぼくは、その前に何が分かっていなかったかも知りたいな。答えを見つけた工夫が分かると、もっと面白そうなの。",
            "{word}の発見では、それまでの考えと何が変わったんだろう。ぼくは、気付くきっかけや確かめ方も知りたいな。",
          ),
          makeChoice(
            "THINKER_HOOK_LIFE", "生き方・時代背景", "life",
            "生き方や時代背景が気になる",
            "{word}は、生きた時代との関係が気になるんだね。ぼくは、当時の暮らしや決まりが考え方にどう関わるか知りたいな。今の感覚だけでは分からない理由もありそうなの。",
            "{word}の時代には、今とは違うどんな問題があったんだろう。ぼくは、本人の考えと、周りの状況を一緒に知りたいな。",
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
            "{word}を知ると、ものの見方が広がりそうなんだね。ぼくは、同じ出来事を違う立場から考えてみたいな。最初には分からなかった理由が見つかるかもしれないの。",
            "{word}の話から、いつもの考え以外の見方も知りたいな。ぼくは、すぐ正しい方を決めるより、何が違うか比べてみたいの。",
          ),
          makeChoice(
            "THINKER_RELATION_PRACTICAL", "今にも使えそう", "practical",
            "今に使えそう",
            "{word}の考えは、今にも役立ちそうなんだね。ぼくは、当時の状況と今の状況を比べてから参考にしたいな。同じ問題に見えても、使える方法は違うかもしれないの。",
            "{word}の考えを今の暮らしに役立てるなら、どんな場面が合うかな。ぼくは、そのまま真似する前に、当時と今の違いも確かめたいの。",
          ),
          makeChoice(
            "THINKER_RELATION_HISTORY", "歴史としておもしろい", "history",
            "歴史としておもしろい",
            "{word}は、その時代の話として面白いんだね。ぼくは、当時は何が分かっていなかったか知りたいな。今の知識だけで考えない方が、疑問が分かりやすくなりそうなの。",
            "{word}がいた頃には、どんなことがまだ疑問だったんだろう。ぼくは、今知っている答えを一度置いて、当時の考え方を知りたいな。",
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
            "{word}は、始まった理由が気になるんだね。ぼくは、一つの原因だけで説明できるか考えてみたいな。その前に続いていた問題も関係しているかもしれないの。",
            "{word}が始まる前には、どんな問題があったんだろう。ぼくは、きっかけになった出来事と、その前からの理由を分けて知りたいな。",
          ),
          makeChoice(
            "HISTORY_EVENT_HOOK_PEOPLE", "誰がどう動いたか", "people",
            "人物の動きが気になる",
            "{word}は、そこにいる人に注目するんだね。ぼくは、その人が何を考えて動いたか知りたいな。全体の話も、一人の立場から見ると違って感じるかもしれないの。",
            "{word}の中で、誰の立場から見るかで分かることは変わるかな。ぼくは、一人だけでなく周りの人の考えも知りたいの。",
          ),
          makeChoice(
            "HISTORY_EVENT_HOOK_RESULT", "その後どう変わったか", "result",
            "その後の変化が気になる",
            "{word}は、そのあとに起きたことが気になるんだね。すぐ分かる結果だけでなく、あとから変わることもありそうなの。ぼくは、誰にどんな影響があったか知りたいな。",
            "{word}のあと、何が変わって何が続いたんだろう。ぼくは、同じ出来事でも人によって影響が違うか考えてみたいの。",
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
            "{word}は、まず全体の流れを知りたいんだね。ぼくも、先に大まかな順番が分かると細かい話を考えやすそうなの。最初から全部覚えなくてもいいと思うな。",
            "{word}の大きい流れが分かったら、どこを詳しく知りたいか選べそうなの。ぼくは、まず始まりと大事な変化を確かめたいな。",
          ),
          makeChoice(
            "HISTORY_EVENT_DEPTH_DETAIL", "細かい経緯まで", "detail",
            "細かい経緯まで知りたい",
            "{word}は、細かい経緯も知りたいんだね。ぼくは、大きい出来事の間に何があったか気になるの。小さい決定が、あとに大きく関わる場合もありそうなの。",
            "{word}の流れの途中で、どんな小さい決定があったんだろう。ぼくは、結果につながったところを一つずつたどりたいな。",
          ),
          makeChoice(
            "HISTORY_EVENT_DEPTH_COMPARE", "別の出来事と比べたい", "compare",
            "別の出来事と比べたい",
            "{word}は、別の出来事と比べたいんだね。ぼくは、似た流れでも原因が同じか確かめたいな。結果が似ているだけでは、同じ話とは言えないと思うの。",
            "{word}と似た出来事でも、始まった理由は違うかもしれないの。ぼくは、同じところだけでなく、違う条件も比べたいな。",
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
            "{word}は、そこにいる人に注目するんだね。ぼくは、その人が何を考えて動いたか知りたいな。全体の話も、一人の立場から見ると違って感じるかもしれないの。",
            "{word}の中で、誰の立場から見るかで分かることは変わるかな。ぼくは、一人だけでなく周りの人の考えも知りたいの。",
          ),
          makeChoice(
            "HISTORY_TOPIC_HOOK_CONFLICT", "戦い・駆け引き", "conflict",
            "戦いや駆け引きがおもしろい",
            "{word}は、戦いや駆け引きが気になるんだね。ぼくは、両方の立場で何を狙ったのか考えたいな。あとから結果を知るだけでは、迷った理由は分からないと思うの。",
            "{word}では、お互いに相手の何を予想していたんだろう。ぼくは、実際に起きたことと、当時考えていたことの違いが気になるの。",
          ),
          makeChoice(
            "HISTORY_TOPIC_HOOK_LIFE", "暮らし・文化・制度", "life_culture",
            "暮らしや文化や制度がおもしろい",
            "{word}は、暮らしや決まりが気になるんだね。ぼくは、その時代の普通の一日を知りたいな。大きい事件だけでは分からないことも、生活から見えそうなの。",
            "{word}の時代では、普段の暮らしにどんな決まりがあったんだろう。ぼくは、今の生活と同じところや違うところを比べたいな。",
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
            "{word}は、時間の順番で知りたいんだね。前の出来事が次へどうつながったか、考えやすそうなの。ぼくは、同じ頃に別の場所で何があったかも気になるな。",
            "{word}を順番に見ていくと、どこから変化が始まるんだろう。ぼくは、前と後を比べながら考えてみたいの。",
          ),
          makeChoice(
            "HISTORY_TOPIC_ENTRY_PERSON", "好きな人物から", "person",
            "人物から入りたい",
            "{word}は、人物の話から知りたいんだね。ぼくは、その人が何に困っていたか知ると、出来事も分かりやすくなると思うの。周りの人の立場も一緒に考えたいな。",
            "{word}の時代を一人の暮らしから見たら、どんなことが分かるかな。ぼくは、その人の話と全体の出来事をつなげて考えたいの。",
          ),
          makeChoice(
            "HISTORY_TOPIC_ENTRY_EVENT", "大きい事件から", "event",
            "大きい事件から入りたい",
            "{word}は、大きい出来事から知りたいんだね。ぼくは、そこを入口にして、前に何があったかも調べたいな。一つの出来事から全体へつながるのは分かりやすそうなの。",
            "{word}の大事な出来事を知ったら、その前と後も気になりそうなの。ぼくは、そこだけで終わらせず、ほかの話とのつながりも知りたいな。",
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
            "{word}は、今にも役立ちそうなんだね。ぼくは、どんな場面なら使えるか具体的に考えたいな。似ている話でも、条件が違えばそのまま使えないと思うの。",
            "{word}を使うなら、今の状況と合っているか確かめたいな。ぼくは、役立ちそうなところと、まだ試さないと分からないところを分けて考えたいの。",
          ),
          makeChoice(
            "CONCEPT_HOOK_CURIOUS", "仕組みが不思議", "curious",
            "仕組みが不思議",
            "{word}は、どうしてそうなるか気になるんだね。ぼくは、何を変えると結果が変わるのか知りたいな。例を一つずつ比べると、仕組みも分かりやすくなりそうなの。",
            "{word}の仕組みを考えるなら、何が変わると違いが出るんだろう。ぼくは、予想したことと実際の例を比べてみたいの。",
          ),
          makeChoice(
            "CONCEPT_HOOK_WORLDVIEW", "考え方が変わりそう", "worldview",
            "考え方が変わりそう",
            "{word}を知ると、ものの見方が広がりそうなんだね。ぼくは、同じ出来事を違う立場から考えてみたいな。最初には分からなかった理由が見つかるかもしれないの。",
            "{word}の話から、いつもの考え以外の見方も知りたいな。ぼくは、すぐ正しい方を決めるより、何が違うか比べてみたいの。",
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
            "{word}は、まず意味を知りたいんだね。短い説明が分かってから例を見ると、考えやすそうなの。ぼくは、最初から難しい言葉をたくさん覚えなくてもいいと思うな。",
            "{word}の意味が分かったら、どんな例に当てはまるか考えたいな。ぼくは、名前を覚えるだけで終わらせず、一つ使ってみたいの。",
          ),
          makeChoice(
            "CONCEPT_DEPTH_EXAMPLE", "具体例まで", "examples",
            "具体例まで知りたい",
            "{word}は、具体的な例まで知りたいんだね。ぼくも、実際の場面があると考えやすそうなの。一つの例だけでなく、違う例にも当てはまるか確かめたいな。",
            "{word}の例を一つ知ったら、別の場面でも使えるか考えてみたいの。同じところと違うところを比べると、意味が分かりやすくなりそうなの。",
          ),
          makeChoice(
            "CONCEPT_DEPTH_DEEP", "反論や限界まで", "deep",
            "反論や限界まで知りたい",
            "{word}は、うまく説明できない場合も知りたいんだね。ぼくは、反対の意見を聞くと、まだ分かっていないところに気付けると思うの。全部に使えるかどうかも確かめたいな。",
            "{word}では、どんな場合に説明が難しくなるんだろう。ぼくは、使えるところだけでなく、気を付けるところも知りたいの。",
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
            "{word}は、作業やもの作りに使うんだね。ぼくは、使うと何が楽になるのか知りたいな。道具でできることと、自分で考えることを分けると使いやすそうなの。",
            "{word}を使うと、どの作業を変えられるんだろう。ぼくは、便利なところだけでなく、自分で工夫できるところも考えてみたいな。",
          ),
          makeChoice(
            "SERVICE_ROLE_COMMUNICATE", "人とつながる・情報を見る", "communicate",
            "人とつながったり情報を見るために使う",
            "{word}は、人と話したり情報を見たりするために使うんだね。ぼくは、離れた相手にも伝えられるのは便利だと思うの。伝わり方が違う時は、言い方も考えたいな。",
            "{word}で話す時、顔が見えないと伝わりにくいこともあるのかな。ぼくは、言葉だけでどう伝えるかを考えてみたいの。",
          ),
          makeChoice(
            "SERVICE_ROLE_FUN", "遊ぶ・楽しむ", "fun",
            "遊びや娯楽に使う",
            "{word}は、楽しむために使うんだね。ぼくは、どんな時に面白いと感じるか知りたいな。上手くできることと楽しいことは、同じとは限らないと思うの。",
            "{word}で楽しむなら、今日は何をしてみたいかな。ぼくは、全部できたかより、面白いと思えたところを覚えておきたいの。",
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
            "{word}は、毎日のように使うんだね。よく使うと、慣れて気付かなくなる便利さもありそうなの。ぼくは、使わない日には何が違うか考えてみたいな。",
            "{word}が使えない日には、いつもの何が変わるんだろう。ぼくは、普段あまり意識していない役立ち方も知りたいの。",
          ),
          makeChoice(
            "SERVICE_RELATION_OCCASIONAL", "必要な時だけ", "occasional",
            "必要な時だけ使う",
            "{word}は、必要な時や気になる時に使うんだね。毎日使わなくても、役立つ場所はありそうなの。ぼくは、どんな時に思い出すのか知りたいな。",
            "{word}を使いたくなるのは、どんなことをしたい時なんだろう。ぼくは、使う回数だけでは分からない良さもありそうだと思うの。",
          ),
          makeChoice(
            "SERVICE_RELATION_CURIOUS", "まだあまり使ってない", "curious",
            "まだあまり使っていない",
            "{word}は、まだあまり使っていないんだね。ぼくは、名前だけでは使い方まで分からないと思うの。最初に一つ試すなら、何ができるか知りたいな。",
            "{word}を初めて使うなら、まず何を試すと分かりやすいかな。ぼくは、知らない機能を全部使おうとせず、一つ確かめてみたいの。",
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
            "{word}は、歴史や生まれた理由が気になるんだね。ぼくは、今の形になったきっかけを知りたいな。名前や姿が途中で変わったかも気になるの。",
            "{word}は、何のために始まったものなんだろう。ぼくは、最初の目的と今の役割の違いも考えてみたいな。",
          ),
          makeChoice(
            "NAMED_PLACE_HOOK_VIEW", "景色・建物・雰囲気", "view",
            "景色や建物や雰囲気が気になる",
            "{word}は、景色や建物を見たいんだね。ぼくは、全体を眺めた時と近くで見た時の違いも気になるの。細かい作りに理由があるかもしれないね。",
            "{word}の景色は、遠くから見る時と近くから見る時で何が違うかな。ぼくは、写真では気付かない細かいところも見てみたいの。",
          ),
          makeChoice(
            "NAMED_PLACE_HOOK_CONTENT", "そこでできること・見られるもの", "content",
            "そこでできることや見られるものが気になる",
            "{word}は、そこでできることが気になるんだね。ぼくは、実際に行くなら何から試したいか考えてみたいな。説明だけでは分からない体験もありそうなの。",
            "{word}に行ったら、何を一つ体験してみたいかな。ぼくは、見て知ることと、自分でやって分かることの違いも気になるの。",
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
            "{word}には、行ったことがあるんだね。ぼくは、写真で見た印象と実際の印象が違うか気になるの。音や人の様子は、行ってみると分かることもありそうなの。",
            "{word}で見たものの中で、帰ってからも残るのは何だろう。ぼくは、写真に写らない音やその時の気持ちも気になるの。",
          ),
          makeChoice(
            "NAMED_PLACE_RELATION_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "{word}は、実際に行ってみたいんだね。ぼくは、写真で見る時と、その場所で過ごす時の違いが気になるの。最初に何を見たいか考えるのも楽しそうだね。",
            "{word}に行くなら、どんなことを一つ確かめてみたいかな。ぼくは、写真や説明では分からないこともありそうだと思うの。",
          ),
          makeChoice(
            "NAMED_PLACE_RELATION_RETURN", "また行きたい", "return",
            "また行きたい",
            "{word}は、また行きたくなる場所なんだね。前に知ったところがあると、次は別のところも見られそうなの。ぼくは、同じ場所で何が変わったか比べたいな。",
            "{word}にもう一度行くなら、前とは違うところも見てみたいな。知っている場所でも、時期が変わると新しく分かることがありそうなの。",
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
            "{word}は、知らなかった事実が気になるんだね。ぼくは、どうやって分かったことかも知りたいな。理由や確かめ方を聞くと、ただ覚えるより分かりやすそうなの。",
            "{word}で新しいことを知ったら、その根拠も確かめてみたいな。ぼくは、知ったことと、まだ確かでないことを分けて覚えたいの。",
          ),
          makeChoice(
            "NONFICTION_VIEW", "ものの見方", "viewpoint",
            "ものの見方が気になる",
            "{word}は、ものの見方が気になるんだね。ぼくは、同じ出来事を別の立場で考えてみたいな。最初には気付かなかった理由が分かるかもしれないの。",
            "{word}の見方で考えたら、いつも気にしていないところが見えるかな。ぼくは、自分の見方との違いも比べたいの。",
          ),
          makeChoice(
            "NONFICTION_PEOPLE", "人の話・具体例", "people",
            "人の話や具体例が気になる",
            "{word}は、実際の人の話や例が気になるんだね。ぼくも、具体的な場面があると自分のことと比べやすそうなの。その例だけでは分からない場合も考えてみたいな。",
            "{word}に出てくる人の話は、どんな場面の例なんだろう。ぼくは、自分に当てはまるところと違うところを比べたいの。",
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
            "{word}で知ったことを、実際に役立てたいんだね。ぼくは、身近な場面を一つ選んで考えてみたいな。説明通りになるか、気を付ける条件があるかも確かめたいの。",
            "{word}で知ったことは、身近などんな場面に使えるかな。ぼくは、分かったつもりで終わらせず、一つの例で考えてみたいの。",
          ),
          makeChoice(
            "NONFICTION_CUR", "ただ気になる", "curiosity",
            "純粋に気になる",
            "{word}は、知ること自体が気になるんだね。すぐに役立たなくても、分かるのが面白いことはあると思うの。ぼくは、次にどんな疑問が出るかも楽しみなの。",
            "{word}のことを知ったら、次に何を考えたくなるかな。ぼくは、使い道を決める前に、気になるところをもう少し知りたいの。",
          ),
          makeChoice(
            "NONFICTION_CHECK", "自分の考えと比べたい", "compare",
            "自分の考えと比べたい",
            "{word}は、自分の考えと比べたいんだね。ぼくは、違う意見に出会うと、自分の理由も考え直せると思うの。すぐ賛成しなくても、聞く意味はありそうなの。",
            "{word}の考えとぼくの考えは、どこで同じになるかな。違うところがあったら、何を大事にしているかも比べてみたいの。",
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
            "{word}は、言葉や文章が残るんだね。ぼくは、普通のことでも言い方が変わると気付きやすくなると思うの。どの言葉を選んだから伝わったか考えてみたいな。",
            "{word}の文章で、普段なら見過ごすことに気付けるかな。ぼくは、何を伝えたかと、どう伝えたかの両方を考えたいの。",
          ),
          makeChoice(
            "ESSAY_VIEW", "観察・視点", "observation",
            "観察や視点が残る",
            "{word}は、見ているところや気付き方が気になるんだね。ぼくは、同じ場所を見ても別のことを見つけるのが面白そうだと思うの。自分なら何に気付くかも考えてみたいな。",
            "{word}では、普段見過ごすどんなことに注目しているんだろう。ぼくは、同じものを見た時に自分と何が違うか考えたいな。",
          ),
          makeChoice(
            "ESSAY_MOOD", "空気・余韻", "mood",
            "空気や余韻が残る",
            "{word}は、読み終わったあとの感じが残るんだね。すぐ説明できなくても、しばらく考えたくなることはありそうなの。ぼくは、どの言葉や場面からそう感じたか知りたいな。",
            "{word}の話が終わったあと、どんなところを考え続けるのかな。ぼくは、一度で答えが出なくても、気になったことを大事にしていたいの。",
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
            "{word}には、共感するところがあるんだね。ぼくは、同じ意見になる理由も知りたいな。結論が同じでも、考えた道筋は違うかもしれないの。",
            "{word}にうなずいたところは、どんな経験とつながっているんだろう。ぼくは、同じ意見だと分かったあとも、その理由を知りたいな。",
          ),
          makeChoice(
            "ESSAY_ARGUE", "ちょっと反論したくなる", "argue",
            "反論したくなる",
            "{word}には、違うと思うところがあるんだね。ぼくは、まず何が違うのかを分けて考えたいな。全部が嫌いという話ではないかもしれないの。",
            "{word}へ反対するなら、どの部分が違うと思うかはっきりさせたいな。ぼくは、相手の理由も確かめてから、自分の考えを伝えたいの。",
          ),
          makeChoice(
            "ESSAY_LINGER", "答えより余韻が残る", "linger",
            "答えより余韻が残る",
            "{word}は、すぐ答えが出るより、考えが残る感じなんだね。ぼくは、分からないままでも気になる話はあると思うの。少し時間を置くと、別の感じ方になるかもしれないね。",
            "{word}を思い出した時、前と違うことが気になるかな。ぼくは、急いで一つの答えにせず、もう少し考えていたいの。",
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
            "{word}は、成し遂げたことが気になるんだね。ぼくは、その前の苦労や工夫も知りたいな。結果を知るだけでは分からないこともありそうなの。",
            "{word}が結果を出すまでに、何を工夫したんだろう。ぼくは、一人でできたことか、誰かの助けがあったのかも気になるの。",
          ),
          makeChoice(
            "BIOGRAPHY_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "{word}は、大事な判断が気になるんだね。ぼくは、その時に選べた方法を比べてみたいな。結果を知らない立場なら、違う選び方をするかもしれないの。",
            "{word}がその方法を選んだ時、何を一番大事にしていたんだろう。ぼくならどうするかも、当時分かっていたことから考えたいな。",
          ),
          makeChoice(
            "BIOGRAPHY_LIFE", "性格・暮らし", "life",
            "性格や暮らしが気になる",
            "{word}は、普段の暮らしや生き方が気になるんだね。ぼくは、大きい出来事がない日のことも知りたいな。どんな毎日を過ごしたかで、選んだ理由も分かるかもしれないの。",
            "{word}は、普段どんなことを大事にしていたんだろう。ぼくは、有名な出来事だけでなく、日々の暮らしも知ると考えやすそうだと思うの。",
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
            "{word}には、自分もこうなりたいと思うところがあるんだね。ぼくは、同じ人になるより、真似できそうな工夫を探したいな。できるようになるまでのことも知りたいの。",
            "{word}に近づくために、今できる小さいことは何だろう。ぼくは、すごい結果だけでなく、毎日していたことも参考にしたいな。",
          ),
          makeChoice(
            "BIOGRAPHY_LEARN", "失敗も含めて学びたい", "learn",
            "失敗も含めて学びたい",
            "{word}は、失敗からも学びたいんだね。ぼくは、どこで気付き、次に何を変えたか知りたいな。失敗したことだけで終わらず、その後も考えたいの。",
            "{word}の失敗では、何を変えればよかったんだろう。ぼくは、同じことを繰り返さないために使える工夫を考えてみたいな。",
          ),
          makeChoice(
            "BIOGRAPHY_CUR", "単純に人生が気になる", "curious",
            "人生そのものが気になる",
            "{word}は、人生全体が気になるんだね。ぼくは、どんな経験から考え方が変わったのか知りたいな。有名な出来事以外の時間も大事そうなの。",
            "{word}の考え方は、どんな経験のあとで変わったんだろう。ぼくは、一つの出来事だけでなく、その前からの暮らしも知りたいの。",
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
            "{word}では、登場人物が気になるんだね。ぼくは、その人物が何を大事にしているか知りたいな。困った時の行動を見ると、普段とは違うところも分かりそうなの。",
            "{word}の登場人物は、何を大切にしているんだろう。ぼくは、誰かと意見が違った時にどうするかも見てみたいな。",
          ),
          makeChoice(
            "LIGHT_NOVEL_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "LIGHT_NOVEL_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "{word}は、その世界に興味があるんだね。ぼくは、そこで普通の毎日を過ごすとどうなるか考えてみたいな。特別な出来事だけじゃなく、暮らしの決まりも気になるの。",
            "{word}の世界で暮らすなら、最初に何を覚える必要があるんだろう。ぼくは、普段の生活がこちらとどう違うか知りたいな。",
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
            "{word}は、今も楽しんでいるんだね。ぼくは、知っているところと新しく気付くところの両方が気になるの。慣れてから分かる面白さもありそうなの。",
            "{word}を今も楽しむ時、最初に知った頃と同じところが気になるのかな。ぼくは、続けてから分かる良さも知りたいな。",
          ),
          makeChoice(
            "LIGHT_NOVEL_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "{word}は、何度も楽しみたくなるんだね。ぼくは、前と同じところが好きなのか、新しいところに気付くのか気になるの。内容を知ってから分かる良さもありそうなの。",
            "{word}をもう一度楽しむなら、前は気付かなかったところも探したいな。ぼくは、知っている内容を今はどう感じるかも考えてみたいの。",
          ),
          makeChoice(
            "LIGHT_NOVEL_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "{word}は、まだ楽しんだことがなくても気になるんだね。ぼくは、紹介で分かることと、実際に見たり読んだりして分かることを比べたいな。想像とは違う面白さがあるかもしれないの。",
            "{word}を知る時、紹介で気になったところをどう感じるかな。ぼくは、まだ分からない内容を、自分の予想と分けて考えたいの。",
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
            "{word}では、登場人物が気になるんだね。ぼくは、その人物が何を大事にしているか知りたいな。困った時の行動を見ると、普段とは違うところも分かりそうなの。",
            "{word}の登場人物は、何を大切にしているんだろう。ぼくは、誰かと意見が違った時にどうするかも見てみたいな。",
          ),
          makeChoice(
            "WEB_NOVEL_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "WEB_NOVEL_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "{word}は、その世界に興味があるんだね。ぼくは、そこで普通の毎日を過ごすとどうなるか考えてみたいな。特別な出来事だけじゃなく、暮らしの決まりも気になるの。",
            "{word}の世界で暮らすなら、最初に何を覚える必要があるんだろう。ぼくは、普段の生活がこちらとどう違うか知りたいな。",
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
            "{word}は、今も楽しんでいるんだね。ぼくは、知っているところと新しく気付くところの両方が気になるの。慣れてから分かる面白さもありそうなの。",
            "{word}を今も楽しむ時、最初に知った頃と同じところが気になるのかな。ぼくは、続けてから分かる良さも知りたいな。",
          ),
          makeChoice(
            "WEB_NOVEL_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "{word}は、何度も楽しみたくなるんだね。ぼくは、前と同じところが好きなのか、新しいところに気付くのか気になるの。内容を知ってから分かる良さもありそうなの。",
            "{word}をもう一度楽しむなら、前は気付かなかったところも探したいな。ぼくは、知っている内容を今はどう感じるかも考えてみたいの。",
          ),
          makeChoice(
            "WEB_NOVEL_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "{word}は、まだ楽しんだことがなくても気になるんだね。ぼくは、紹介で分かることと、実際に見たり読んだりして分かることを比べたいな。想像とは違う面白さがあるかもしれないの。",
            "{word}を知る時、紹介で気になったところをどう感じるかな。ぼくは、まだ分からない内容を、自分の予想と分けて考えたいの。",
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
            "{word}は、言葉や文章が残るんだね。ぼくは、普通のことでも言い方が変わると気付きやすくなると思うの。どの言葉を選んだから伝わったか考えてみたいな。",
            "{word}の文章で、普段なら見過ごすことに気付けるかな。ぼくは、何を伝えたかと、どう伝えたかの両方を考えたいの。",
          ),
          makeChoice(
            "POETRY_VIEW", "観察・視点", "observation",
            "観察や視点が残る",
            "{word}は、見ているところや気付き方が気になるんだね。ぼくは、同じ場所を見ても別のことを見つけるのが面白そうだと思うの。自分なら何に気付くかも考えてみたいな。",
            "{word}では、普段見過ごすどんなことに注目しているんだろう。ぼくは、同じものを見た時に自分と何が違うか考えたいな。",
          ),
          makeChoice(
            "POETRY_MOOD", "空気・余韻", "mood",
            "空気や余韻が残る",
            "{word}は、読み終わったあとの感じが残るんだね。すぐ説明できなくても、しばらく考えたくなることはありそうなの。ぼくは、どの言葉や場面からそう感じたか知りたいな。",
            "{word}の話が終わったあと、どんなところを考え続けるのかな。ぼくは、一度で答えが出なくても、気になったことを大事にしていたいの。",
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
            "{word}には、共感するところがあるんだね。ぼくは、同じ意見になる理由も知りたいな。結論が同じでも、考えた道筋は違うかもしれないの。",
            "{word}にうなずいたところは、どんな経験とつながっているんだろう。ぼくは、同じ意見だと分かったあとも、その理由を知りたいな。",
          ),
          makeChoice(
            "POETRY_ARGUE", "ちょっと反論したくなる", "argue",
            "反論したくなる",
            "{word}には、違うと思うところがあるんだね。ぼくは、まず何が違うのかを分けて考えたいな。全部が嫌いという話ではないかもしれないの。",
            "{word}へ反対するなら、どの部分が違うと思うかはっきりさせたいな。ぼくは、相手の理由も確かめてから、自分の考えを伝えたいの。",
          ),
          makeChoice(
            "POETRY_LINGER", "答えより余韻が残る", "linger",
            "答えより余韻が残る",
            "{word}は、すぐ答えが出るより、考えが残る感じなんだね。ぼくは、分からないままでも気になる話はあると思うの。少し時間を置くと、別の感じ方になるかもしれないね。",
            "{word}を思い出した時、前と違うことが気になるかな。ぼくは、急いで一つの答えにせず、もう少し考えていたいの。",
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
            "{word}は、性格や考え方が気になるんだね。ぼくは、何を大切にしているかが行動にも表れると思うの。どうしてそう考えるようになったかも知りたいな。",
            "{word}は、どんな時に考えを変えるんだろう。ぼくは、いつもの考えと違う決定をする場面も気になるの。",
          ),
          makeChoice(
            "ANIME_CHARACTER_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "ANIME_CHARACTER_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "{word}は、行動や役割が気になるんだね。ぼくは、なぜその行動を選んだのかも知りたいな。その後、周りの人がどう変わるかにも注目したいの。",
            "{word}が何かを選んで動く時、何を大事にしていたんだろう。ぼくは、行動した理由と、その結果を一緒に考えてみたいな。",
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
            "{word}には、会ってみたいんだね。ぼくは、どんな話を聞いてみたいか考えるのも楽しそうだと思うの。実際に会うと、作品では分からなかったところも見えるかな。",
            "もし{word}と話せたら、最初に何を聞こうかな。ぼくは、まだ知らない考えや普段の過ごし方を聞いてみたいの。",
          ),
          makeChoice(
            "ANIME_CHARACTER_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "{word}は、近づくより、離れて見ていたいんだね。ぼくは、関わる時と見ている時では感じ方が違うと思うの。遠くから見るから楽しめるところもありそうなの。",
            "{word}を見ている時と、実際に近くにいる時では、気になることが変わりそうなの。ぼくは、面白いと感じても、同じ場所で過ごしたいとは限らないと思うの。",
          ),
          makeChoice(
            "ANIME_CHARACTER_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "{word}は、実際に近くにいたら避けたいんだね。作品として面白いことと、一緒に過ごしたいことは別だと思うの。ぼくも、見る時と関わる時は分けて考えたいな。",
            "{word}をお話として見るのと、実際に関わるのは違うのね。ぼくは、面白いと思っても近づかない方がいい場合はありそうだと思うの。",
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
            "{word}は、考え方や理屈が印象に残るんだね。ぼくは、どうしてその考えになったか知りたいな。理由が分かることと賛成することは、別に考えたいの。",
            "{word}の理屈には、どこまで分かるところがあるんだろう。ぼくは、理由を知ってから、違うと思うところもはっきりさせたいな。",
          ),
          makeChoice(
            "ANIME_VILLAIN_THREAT", "強さ・怖さ", "threat",
            "強さや怖さが印象に残る",
            "{word}は、強さや怖さが印象に残るんだね。ぼくは、どんなところで怖いと感じるか気になるの。大きさや力だけではなく、何をするか分からないことも怖さになりそうなの。",
            "{word}の怖さは、何が起きそうだと感じるからなんだろう。ぼくは、見た目の怖さと行動の怖さを分けて考えてみたいな。",
          ),
          makeChoice(
            "ANIME_VILLAIN_STYLE", "見た目・振る舞い", "style",
            "見た目や振る舞いが印象に残る",
            "{word}は、見た目や動きが印象に残るんだね。ぼくは、話していなくても何が伝わるか気になるの。表情や姿勢で、お話の中の立場が分かることもありそうなの。",
            "{word}の見た目や動きは、どんな印象につながるんだろう。ぼくは、話す前から伝わることも考えてみたいな。",
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
            "{word}には、少し分かるところがあるんだね。ぼくは、気持ちが分かっても、やったことには反対する場合があると思うの。分かる部分と賛成できない部分を分けたいな。",
            "{word}の気持ちが分かるところがあっても、行動まで同じでいいとは限らないのね。ぼくは、何を変えれば別の選び方ができたか考えてみたいな。",
          ),
          makeChoice(
            "ANIME_VILLAIN_OPPOSE", "考え方は嫌い", "oppose",
            "考え方には反対",
            "{word}の考えには反対なんだね。ぼくは、どんな理由で違うと思うかが大事だと思うの。相手の話も確かめたうえで、自分の意見を考えたいな。",
            "{word}の考えの、どの部分に反対するのか整理してみたいな。ぼくは、違うところだけでなく、分かるところが残るかも考えたいの。",
          ),
          makeChoice(
            "ANIME_VILLAIN_FASC", "とにかく面白い", "fascinating",
            "とにかく面白い",
            "{word}は、見ていて面白いんだね。ぼくは、好きになることと面白がることが同じとは限らないと思うの。予想できない行動が気になる場合もありそうなの。",
            "{word}が面白いのは、どんなところで予想が変わるからなんだろう。ぼくは、その行動に賛成するかとは分けて考えたいな。",
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
            "{word}では、上手くなることや攻略が楽しいんだね。できなかったことができるようになると、何を変えたか知りたくなるの。ぼくは、失敗した時のやり方と比べてみたいな。",
            "{word}で上手くいかなかったら、次は何を一つ変えるとよさそうかな。ぼくは、たくさん試すだけじゃなく、違いを見ながらやってみたいの。",
          ),
          makeChoice(
            "RETRO_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "RETRO_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "{word}では、自分で探したり集めたりするのが楽しいんだね。決まった道から少し外れると、新しいものが見つかりそうなの。ぼくは、見逃した場所がないか確かめてみたいな。",
            "{word}を遊ぶなら、いつも通らない場所も見てみたいな。見つけたものの数だけじゃなく、どうやって見つけたかも覚えておきたいの。",
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
            "{word}は、しっかり考えて遊ぶんだね。ぼくは、上手くいった時の理由も知りたくなるの。次に同じやり方をして、またできるか確かめてみたいな。",
            "{word}で上手くいった時、たまたまだったのか、やり方がよかったのか気になるな。ぼくなら、同じことをもう一度試して比べてみたいの。",
          ),
          makeChoice(
            "RETRO_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "{word}は、気楽に楽しみたいんだね。ぼくは、上手くできたかより、面白かったかを大事にする遊び方もいいと思うの。その日の気分でやりたいことを選べそうなの。",
            "{word}を楽しむなら、今日は何をやってみたいかな。全部を上手くやろうとせず、一つ面白いことを見つけるのもよさそうなの。",
          ),
          makeChoice(
            "RETRO_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "{word}は、自分で遊ぶより見る方が多いんだね。ぼくは、人のやり方を比べるのも面白そうだと思うの。上手そうに見えるところが、実際にはどれくらい難しいかも気になるな。",
            "{word}を人が遊ぶ時、どんなところでやり方が違うんだろう。ぼくは、自分ならどうするか考えながら見るのも面白そうだと思うの。",
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
            "{word}では、上手くなることや攻略が楽しいんだね。できなかったことができるようになると、何を変えたか知りたくなるの。ぼくは、失敗した時のやり方と比べてみたいな。",
            "{word}で上手くいかなかったら、次は何を一つ変えるとよさそうかな。ぼくは、たくさん試すだけじゃなく、違いを見ながらやってみたいの。",
          ),
          makeChoice(
            "INDIE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "INDIE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "{word}では、自分で探したり集めたりするのが楽しいんだね。決まった道から少し外れると、新しいものが見つかりそうなの。ぼくは、見逃した場所がないか確かめてみたいな。",
            "{word}を遊ぶなら、いつも通らない場所も見てみたいな。見つけたものの数だけじゃなく、どうやって見つけたかも覚えておきたいの。",
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
            "{word}は、しっかり考えて遊ぶんだね。ぼくは、上手くいった時の理由も知りたくなるの。次に同じやり方をして、またできるか確かめてみたいな。",
            "{word}で上手くいった時、たまたまだったのか、やり方がよかったのか気になるな。ぼくなら、同じことをもう一度試して比べてみたいの。",
          ),
          makeChoice(
            "INDIE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "{word}は、気楽に楽しみたいんだね。ぼくは、上手くできたかより、面白かったかを大事にする遊び方もいいと思うの。その日の気分でやりたいことを選べそうなの。",
            "{word}を楽しむなら、今日は何をやってみたいかな。全部を上手くやろうとせず、一つ面白いことを見つけるのもよさそうなの。",
          ),
          makeChoice(
            "INDIE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "{word}は、自分で遊ぶより見る方が多いんだね。ぼくは、人のやり方を比べるのも面白そうだと思うの。上手そうに見えるところが、実際にはどれくらい難しいかも気になるな。",
            "{word}を人が遊ぶ時、どんなところでやり方が違うんだろう。ぼくは、自分ならどうするか考えながら見るのも面白そうだと思うの。",
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
            "{word}では、上手くなることや攻略が楽しいんだね。できなかったことができるようになると、何を変えたか知りたくなるの。ぼくは、失敗した時のやり方と比べてみたいな。",
            "{word}で上手くいかなかったら、次は何を一つ変えるとよさそうかな。ぼくは、たくさん試すだけじゃなく、違いを見ながらやってみたいの。",
          ),
          makeChoice(
            "ARCADE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "ARCADE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "{word}では、自分で探したり集めたりするのが楽しいんだね。決まった道から少し外れると、新しいものが見つかりそうなの。ぼくは、見逃した場所がないか確かめてみたいな。",
            "{word}を遊ぶなら、いつも通らない場所も見てみたいな。見つけたものの数だけじゃなく、どうやって見つけたかも覚えておきたいの。",
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
            "{word}は、しっかり考えて遊ぶんだね。ぼくは、上手くいった時の理由も知りたくなるの。次に同じやり方をして、またできるか確かめてみたいな。",
            "{word}で上手くいった時、たまたまだったのか、やり方がよかったのか気になるな。ぼくなら、同じことをもう一度試して比べてみたいの。",
          ),
          makeChoice(
            "ARCADE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "{word}は、気楽に楽しみたいんだね。ぼくは、上手くできたかより、面白かったかを大事にする遊び方もいいと思うの。その日の気分でやりたいことを選べそうなの。",
            "{word}を楽しむなら、今日は何をやってみたいかな。全部を上手くやろうとせず、一つ面白いことを見つけるのもよさそうなの。",
          ),
          makeChoice(
            "ARCADE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "{word}は、自分で遊ぶより見る方が多いんだね。ぼくは、人のやり方を比べるのも面白そうだと思うの。上手そうに見えるところが、実際にはどれくらい難しいかも気になるな。",
            "{word}を人が遊ぶ時、どんなところでやり方が違うんだろう。ぼくは、自分ならどうするか考えながら見るのも面白そうだと思うの。",
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
            "{word}では、上手くなることや攻略が楽しいんだね。できなかったことができるようになると、何を変えたか知りたくなるの。ぼくは、失敗した時のやり方と比べてみたいな。",
            "{word}で上手くいかなかったら、次は何を一つ変えるとよさそうかな。ぼくは、たくさん試すだけじゃなく、違いを見ながらやってみたいの。",
          ),
          makeChoice(
            "MOBILE_GAME_STORY", "物語・世界", "story",
            "物語や世界を楽しむ",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "MOBILE_GAME_EXP", "探索・自由さ", "explore",
            "探索や自由さが楽しい",
            "{word}では、自分で探したり集めたりするのが楽しいんだね。決まった道から少し外れると、新しいものが見つかりそうなの。ぼくは、見逃した場所がないか確かめてみたいな。",
            "{word}を遊ぶなら、いつも通らない場所も見てみたいな。見つけたものの数だけじゃなく、どうやって見つけたかも覚えておきたいの。",
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
            "{word}は、しっかり考えて遊ぶんだね。ぼくは、上手くいった時の理由も知りたくなるの。次に同じやり方をして、またできるか確かめてみたいな。",
            "{word}で上手くいった時、たまたまだったのか、やり方がよかったのか気になるな。ぼくなら、同じことをもう一度試して比べてみたいの。",
          ),
          makeChoice(
            "MOBILE_GAME_CAS", "気楽に遊ぶ", "casual",
            "気楽に遊ぶ",
            "{word}は、気楽に楽しみたいんだね。ぼくは、上手くできたかより、面白かったかを大事にする遊び方もいいと思うの。その日の気分でやりたいことを選べそうなの。",
            "{word}を楽しむなら、今日は何をやってみたいかな。全部を上手くやろうとせず、一つ面白いことを見つけるのもよさそうなの。",
          ),
          makeChoice(
            "MOBILE_GAME_WATCH", "見る方が多い", "watch",
            "見る方が多い",
            "{word}は、自分で遊ぶより見る方が多いんだね。ぼくは、人のやり方を比べるのも面白そうだと思うの。上手そうに見えるところが、実際にはどれくらい難しいかも気になるな。",
            "{word}を人が遊ぶ時、どんなところでやり方が違うんだろう。ぼくは、自分ならどうするか考えながら見るのも面白そうだと思うの。",
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
            "{word}は、性格や考え方が気になるんだね。ぼくは、何を大切にしているかが行動にも表れると思うの。どうしてそう考えるようになったかも知りたいな。",
            "{word}は、どんな時に考えを変えるんだろう。ぼくは、いつもの考えと違う決定をする場面も気になるの。",
          ),
          makeChoice(
            "GAME_CHARACTER_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "GAME_CHARACTER_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "{word}は、行動や役割が気になるんだね。ぼくは、なぜその行動を選んだのかも知りたいな。その後、周りの人がどう変わるかにも注目したいの。",
            "{word}が何かを選んで動く時、何を大事にしていたんだろう。ぼくは、行動した理由と、その結果を一緒に考えてみたいな。",
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
            "{word}には、会ってみたいんだね。ぼくは、どんな話を聞いてみたいか考えるのも楽しそうだと思うの。実際に会うと、作品では分からなかったところも見えるかな。",
            "もし{word}と話せたら、最初に何を聞こうかな。ぼくは、まだ知らない考えや普段の過ごし方を聞いてみたいの。",
          ),
          makeChoice(
            "GAME_CHARACTER_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "{word}は、近づくより、離れて見ていたいんだね。ぼくは、関わる時と見ている時では感じ方が違うと思うの。遠くから見るから楽しめるところもありそうなの。",
            "{word}を見ている時と、実際に近くにいる時では、気になることが変わりそうなの。ぼくは、面白いと感じても、同じ場所で過ごしたいとは限らないと思うの。",
          ),
          makeChoice(
            "GAME_CHARACTER_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "{word}は、実際に近くにいたら避けたいんだね。作品として面白いことと、一緒に過ごしたいことは別だと思うの。ぼくも、見る時と関わる時は分けて考えたいな。",
            "{word}をお話として見るのと、実際に関わるのは違うのね。ぼくは、面白いと思っても近づかない方がいい場合はありそうだと思うの。",
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
            "{word}は、考え方や理屈が印象に残るんだね。ぼくは、どうしてその考えになったか知りたいな。理由が分かることと賛成することは、別に考えたいの。",
            "{word}の理屈には、どこまで分かるところがあるんだろう。ぼくは、理由を知ってから、違うと思うところもはっきりさせたいな。",
          ),
          makeChoice(
            "GAME_BOSS_THREAT", "強さ・怖さ", "threat",
            "強さや怖さが印象に残る",
            "{word}は、強さや怖さが印象に残るんだね。ぼくは、どんなところで怖いと感じるか気になるの。大きさや力だけではなく、何をするか分からないことも怖さになりそうなの。",
            "{word}の怖さは、何が起きそうだと感じるからなんだろう。ぼくは、見た目の怖さと行動の怖さを分けて考えてみたいな。",
          ),
          makeChoice(
            "GAME_BOSS_STYLE", "見た目・振る舞い", "style",
            "見た目や振る舞いが印象に残る",
            "{word}は、見た目や動きが印象に残るんだね。ぼくは、話していなくても何が伝わるか気になるの。表情や姿勢で、お話の中の立場が分かることもありそうなの。",
            "{word}の見た目や動きは、どんな印象につながるんだろう。ぼくは、話す前から伝わることも考えてみたいな。",
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
            "{word}には、少し分かるところがあるんだね。ぼくは、気持ちが分かっても、やったことには反対する場合があると思うの。分かる部分と賛成できない部分を分けたいな。",
            "{word}の気持ちが分かるところがあっても、行動まで同じでいいとは限らないのね。ぼくは、何を変えれば別の選び方ができたか考えてみたいな。",
          ),
          makeChoice(
            "GAME_BOSS_OPPOSE", "考え方は嫌い", "oppose",
            "考え方には反対",
            "{word}の考えには反対なんだね。ぼくは、どんな理由で違うと思うかが大事だと思うの。相手の話も確かめたうえで、自分の意見を考えたいな。",
            "{word}の考えの、どの部分に反対するのか整理してみたいな。ぼくは、違うところだけでなく、分かるところが残るかも考えたいの。",
          ),
          makeChoice(
            "GAME_BOSS_FASC", "とにかく面白い", "fascinating",
            "とにかく面白い",
            "{word}は、見ていて面白いんだね。ぼくは、好きになることと面白がることが同じとは限らないと思うの。予想できない行動が気になる場合もありそうなの。",
            "{word}が面白いのは、どんなところで予想が変わるからなんだろう。ぼくは、その行動に賛成するかとは分けて考えたいな。",
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
            "{word}は、性格や考え方が気になるんだね。ぼくは、何を大切にしているかが行動にも表れると思うの。どうしてそう考えるようになったかも知りたいな。",
            "{word}は、どんな時に考えを変えるんだろう。ぼくは、いつもの考えと違う決定をする場面も気になるの。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "{word}は、行動や役割が気になるんだね。ぼくは、なぜその行動を選んだのかも知りたいな。その後、周りの人がどう変わるかにも注目したいの。",
            "{word}が何かを選んで動く時、何を大事にしていたんだろう。ぼくは、行動した理由と、その結果を一緒に考えてみたいな。",
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
            "{word}には、会ってみたいんだね。ぼくは、どんな話を聞いてみたいか考えるのも楽しそうだと思うの。実際に会うと、作品では分からなかったところも見えるかな。",
            "もし{word}と話せたら、最初に何を聞こうかな。ぼくは、まだ知らない考えや普段の過ごし方を聞いてみたいの。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "{word}は、近づくより、離れて見ていたいんだね。ぼくは、関わる時と見ている時では感じ方が違うと思うの。遠くから見るから楽しめるところもありそうなの。",
            "{word}を見ている時と、実際に近くにいる時では、気になることが変わりそうなの。ぼくは、面白いと感じても、同じ場所で過ごしたいとは限らないと思うの。",
          ),
          makeChoice(
            "FICTIONAL_ORGANIZATION_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "{word}は、実際に近くにいたら避けたいんだね。作品として面白いことと、一緒に過ごしたいことは別だと思うの。ぼくも、見る時と関わる時は分けて考えたいな。",
            "{word}をお話として見るのと、実際に関わるのは違うのね。ぼくは、面白いと思っても近づかない方がいい場合はありそうだと思うの。",
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
            "{word}は、性格や考え方が気になるんだね。ぼくは、何を大切にしているかが行動にも表れると思うの。どうしてそう考えるようになったかも知りたいな。",
            "{word}は、どんな時に考えを変えるんだろう。ぼくは、いつもの考えと違う決定をする場面も気になるの。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "{word}は、行動や役割が気になるんだね。ぼくは、なぜその行動を選んだのかも知りたいな。その後、周りの人がどう変わるかにも注目したいの。",
            "{word}が何かを選んで動く時、何を大事にしていたんだろう。ぼくは、行動した理由と、その結果を一緒に考えてみたいな。",
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
            "{word}には、会ってみたいんだね。ぼくは、どんな話を聞いてみたいか考えるのも楽しそうだと思うの。実際に会うと、作品では分からなかったところも見えるかな。",
            "もし{word}と話せたら、最初に何を聞こうかな。ぼくは、まだ知らない考えや普段の過ごし方を聞いてみたいの。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "{word}は、近づくより、離れて見ていたいんだね。ぼくは、関わる時と見ている時では感じ方が違うと思うの。遠くから見るから楽しめるところもありそうなの。",
            "{word}を見ている時と、実際に近くにいる時では、気になることが変わりそうなの。ぼくは、面白いと感じても、同じ場所で過ごしたいとは限らないと思うの。",
          ),
          makeChoice(
            "FICTIONAL_PLACE_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "{word}は、実際に近くにいたら避けたいんだね。作品として面白いことと、一緒に過ごしたいことは別だと思うの。ぼくも、見る時と関わる時は分けて考えたいな。",
            "{word}をお話として見るのと、実際に関わるのは違うのね。ぼくは、面白いと思っても近づかない方がいい場合はありそうだと思うの。",
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
            "{word}は、性格や考え方が気になるんだね。ぼくは、何を大切にしているかが行動にも表れると思うの。どうしてそう考えるようになったかも知りたいな。",
            "{word}は、どんな時に考えを変えるんだろう。ぼくは、いつもの考えと違う決定をする場面も気になるの。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "{word}は、行動や役割が気になるんだね。ぼくは、なぜその行動を選んだのかも知りたいな。その後、周りの人がどう変わるかにも注目したいの。",
            "{word}が何かを選んで動く時、何を大事にしていたんだろう。ぼくは、行動した理由と、その結果を一緒に考えてみたいな。",
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
            "{word}には、会ってみたいんだね。ぼくは、どんな話を聞いてみたいか考えるのも楽しそうだと思うの。実際に会うと、作品では分からなかったところも見えるかな。",
            "もし{word}と話せたら、最初に何を聞こうかな。ぼくは、まだ知らない考えや普段の過ごし方を聞いてみたいの。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "{word}は、近づくより、離れて見ていたいんだね。ぼくは、関わる時と見ている時では感じ方が違うと思うの。遠くから見るから楽しめるところもありそうなの。",
            "{word}を見ている時と、実際に近くにいる時では、気になることが変わりそうなの。ぼくは、面白いと感じても、同じ場所で過ごしたいとは限らないと思うの。",
          ),
          makeChoice(
            "FICTIONAL_ITEM_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "{word}は、実際に近くにいたら避けたいんだね。作品として面白いことと、一緒に過ごしたいことは別だと思うの。ぼくも、見る時と関わる時は分けて考えたいな。",
            "{word}をお話として見るのと、実際に関わるのは違うのね。ぼくは、面白いと思っても近づかない方がいい場合はありそうだと思うの。",
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
            "{word}は、性格や考え方が気になるんだね。ぼくは、何を大切にしているかが行動にも表れると思うの。どうしてそう考えるようになったかも知りたいな。",
            "{word}は、どんな時に考えを変えるんだろう。ぼくは、いつもの考えと違う決定をする場面も気になるの。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "{word}は、行動や役割が気になるんだね。ぼくは、なぜその行動を選んだのかも知りたいな。その後、周りの人がどう変わるかにも注目したいの。",
            "{word}が何かを選んで動く時、何を大事にしていたんだろう。ぼくは、行動した理由と、その結果を一緒に考えてみたいな。",
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
            "{word}には、会ってみたいんだね。ぼくは、どんな話を聞いてみたいか考えるのも楽しそうだと思うの。実際に会うと、作品では分からなかったところも見えるかな。",
            "もし{word}と話せたら、最初に何を聞こうかな。ぼくは、まだ知らない考えや普段の過ごし方を聞いてみたいの。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "{word}は、近づくより、離れて見ていたいんだね。ぼくは、関わる時と見ている時では感じ方が違うと思うの。遠くから見るから楽しめるところもありそうなの。",
            "{word}を見ている時と、実際に近くにいる時では、気になることが変わりそうなの。ぼくは、面白いと感じても、同じ場所で過ごしたいとは限らないと思うの。",
          ),
          makeChoice(
            "FICTIONAL_SKILL_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "{word}は、実際に近くにいたら避けたいんだね。作品として面白いことと、一緒に過ごしたいことは別だと思うの。ぼくも、見る時と関わる時は分けて考えたいな。",
            "{word}をお話として見るのと、実際に関わるのは違うのね。ぼくは、面白いと思っても近づかない方がいい場合はありそうだと思うの。",
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
            "{word}は、性格や考え方が気になるんだね。ぼくは、何を大切にしているかが行動にも表れると思うの。どうしてそう考えるようになったかも知りたいな。",
            "{word}は、どんな時に考えを変えるんだろう。ぼくは、いつもの考えと違う決定をする場面も気になるの。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_LOOK", "見た目・デザイン", "design",
            "見た目やデザインが魅力",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_ROLE", "行動・役割", "role",
            "行動や役割が印象に残る",
            "{word}は、行動や役割が気になるんだね。ぼくは、なぜその行動を選んだのかも知りたいな。その後、周りの人がどう変わるかにも注目したいの。",
            "{word}が何かを選んで動く時、何を大事にしていたんだろう。ぼくは、行動した理由と、その結果を一緒に考えてみたいな。",
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
            "{word}には、会ってみたいんだね。ぼくは、どんな話を聞いてみたいか考えるのも楽しそうだと思うの。実際に会うと、作品では分からなかったところも見えるかな。",
            "もし{word}と話せたら、最初に何を聞こうかな。ぼくは、まだ知らない考えや普段の過ごし方を聞いてみたいの。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_WATCH", "離れて見ていたい", "watch",
            "離れて見ていたい",
            "{word}は、近づくより、離れて見ていたいんだね。ぼくは、関わる時と見ている時では感じ方が違うと思うの。遠くから見るから楽しめるところもありそうなの。",
            "{word}を見ている時と、実際に近くにいる時では、気になることが変わりそうなの。ぼくは、面白いと感じても、同じ場所で過ごしたいとは限らないと思うの。",
          ),
          makeChoice(
            "FICTIONAL_CREATURE_AVOID", "現実なら避けたい", "avoid",
            "現実なら避けたい",
            "{word}は、実際に近くにいたら避けたいんだね。作品として面白いことと、一緒に過ごしたいことは別だと思うの。ぼくも、見る時と関わる時は分けて考えたいな。",
            "{word}をお話として見るのと、実際に関わるのは違うのね。ぼくは、面白いと思っても近づかない方がいい場合はありそうだと思うの。",
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
            "{word}は、知らなかった事実が気になるんだね。ぼくは、どうやって分かったことかも知りたいな。理由や確かめ方を聞くと、ただ覚えるより分かりやすそうなの。",
            "{word}で新しいことを知ったら、その根拠も確かめてみたいな。ぼくは、知ったことと、まだ確かでないことを分けて覚えたいの。",
          ),
          makeChoice(
            "DOCUMENTARY_VIEW", "ものの見方", "viewpoint",
            "ものの見方が気になる",
            "{word}は、ものの見方が気になるんだね。ぼくは、同じ出来事を別の立場で考えてみたいな。最初には気付かなかった理由が分かるかもしれないの。",
            "{word}の見方で考えたら、いつも気にしていないところが見えるかな。ぼくは、自分の見方との違いも比べたいの。",
          ),
          makeChoice(
            "DOCUMENTARY_PEOPLE", "人の話・具体例", "people",
            "人の話や具体例が気になる",
            "{word}は、実際の人の話や例が気になるんだね。ぼくも、具体的な場面があると自分のことと比べやすそうなの。その例だけでは分からない場合も考えてみたいな。",
            "{word}に出てくる人の話は、どんな場面の例なんだろう。ぼくは、自分に当てはまるところと違うところを比べたいの。",
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
            "{word}で知ったことを、実際に役立てたいんだね。ぼくは、身近な場面を一つ選んで考えてみたいな。説明通りになるか、気を付ける条件があるかも確かめたいの。",
            "{word}で知ったことは、身近などんな場面に使えるかな。ぼくは、分かったつもりで終わらせず、一つの例で考えてみたいの。",
          ),
          makeChoice(
            "DOCUMENTARY_CUR", "ただ気になる", "curiosity",
            "純粋に気になる",
            "{word}は、知ること自体が気になるんだね。すぐに役立たなくても、分かるのが面白いことはあると思うの。ぼくは、次にどんな疑問が出るかも楽しみなの。",
            "{word}のことを知ったら、次に何を考えたくなるかな。ぼくは、使い道を決める前に、気になるところをもう少し知りたいの。",
          ),
          makeChoice(
            "DOCUMENTARY_CHECK", "自分の考えと比べたい", "compare",
            "自分の考えと比べたい",
            "{word}は、自分の考えと比べたいんだね。ぼくは、違う意見に出会うと、自分の理由も考え直せると思うの。すぐ賛成しなくても、聞く意味はありそうなの。",
            "{word}の考えとぼくの考えは、どこで同じになるかな。違うところがあったら、何を大事にしているかも比べてみたいの。",
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
            "{word}では、登場人物が気になるんだね。ぼくは、その人物が何を大事にしているか知りたいな。困った時の行動を見ると、普段とは違うところも分かりそうなの。",
            "{word}の登場人物は、何を大切にしているんだろう。ぼくは、誰かと意見が違った時にどうするかも見てみたいな。",
          ),
          makeChoice(
            "DRAMA_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "DRAMA_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "{word}は、その世界に興味があるんだね。ぼくは、そこで普通の毎日を過ごすとどうなるか考えてみたいな。特別な出来事だけじゃなく、暮らしの決まりも気になるの。",
            "{word}の世界で暮らすなら、最初に何を覚える必要があるんだろう。ぼくは、普段の生活がこちらとどう違うか知りたいな。",
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
            "{word}は、今も楽しんでいるんだね。ぼくは、知っているところと新しく気付くところの両方が気になるの。慣れてから分かる面白さもありそうなの。",
            "{word}を今も楽しむ時、最初に知った頃と同じところが気になるのかな。ぼくは、続けてから分かる良さも知りたいな。",
          ),
          makeChoice(
            "DRAMA_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "{word}は、何度も楽しみたくなるんだね。ぼくは、前と同じところが好きなのか、新しいところに気付くのか気になるの。内容を知ってから分かる良さもありそうなの。",
            "{word}をもう一度楽しむなら、前は気付かなかったところも探したいな。ぼくは、知っている内容を今はどう感じるかも考えてみたいの。",
          ),
          makeChoice(
            "DRAMA_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "{word}は、まだ楽しんだことがなくても気になるんだね。ぼくは、紹介で分かることと、実際に見たり読んだりして分かることを比べたいな。想像とは違う面白さがあるかもしれないの。",
            "{word}を知る時、紹介で気になったところをどう感じるかな。ぼくは、まだ分からない内容を、自分の予想と分けて考えたいの。",
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
            "{word}では、登場人物が気になるんだね。ぼくは、その人物が何を大事にしているか知りたいな。困った時の行動を見ると、普段とは違うところも分かりそうなの。",
            "{word}の登場人物は、何を大切にしているんだろう。ぼくは、誰かと意見が違った時にどうするかも見てみたいな。",
          ),
          makeChoice(
            "TOKUSATSU_STORY", "物語・展開", "story",
            "物語や展開が残る",
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "TOKUSATSU_WORLD", "世界・雰囲気", "world",
            "世界や雰囲気が残る",
            "{word}は、その世界に興味があるんだね。ぼくは、そこで普通の毎日を過ごすとどうなるか考えてみたいな。特別な出来事だけじゃなく、暮らしの決まりも気になるの。",
            "{word}の世界で暮らすなら、最初に何を覚える必要があるんだろう。ぼくは、普段の生活がこちらとどう違うか知りたいな。",
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
            "{word}は、今も楽しんでいるんだね。ぼくは、知っているところと新しく気付くところの両方が気になるの。慣れてから分かる面白さもありそうなの。",
            "{word}を今も楽しむ時、最初に知った頃と同じところが気になるのかな。ぼくは、続けてから分かる良さも知りたいな。",
          ),
          makeChoice(
            "TOKUSATSU_RETURN", "何度も戻る", "return",
            "何度も戻る",
            "{word}は、何度も楽しみたくなるんだね。ぼくは、前と同じところが好きなのか、新しいところに気付くのか気になるの。内容を知ってから分かる良さもありそうなの。",
            "{word}をもう一度楽しむなら、前は気付かなかったところも探したいな。ぼくは、知っている内容を今はどう感じるかも考えてみたいの。",
          ),
          makeChoice(
            "TOKUSATSU_WANT", "まだだけど気になる", "want",
            "まだ触れていないが気になる",
            "{word}は、まだ楽しんだことがなくても気になるんだね。ぼくは、紹介で分かることと、実際に見たり読んだりして分かることを比べたいな。想像とは違う面白さがあるかもしれないの。",
            "{word}を知る時、紹介で気になったところをどう感じるかな。ぼくは、まだ分からない内容を、自分の予想と分けて考えたいの。",
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
            "{word}は、出演する人が好きなんだね。ぼくは、一人で話す時と、誰かと一緒の時の違いも気になるの。やり取りから面白さが生まれる場合もありそうなの。",
            "{word}では、誰と誰が話す時に面白くなるんだろう。ぼくは、一人だけ見る時とは違う良さも知りたいな。",
          ),
          makeChoice(
            "VARIETY_SHOW_FORMAT", "企画・内容", "format",
            "企画や内容が魅力",
            "{word}は、企画や仕組みが気になるんだね。ぼくは、何を工夫すると面白くなるのか知りたいな。条件が少し変わるだけで、結果も違ってきそうなの。",
            "{word}の仕組みを少し変えたら、楽しみ方も変わるかな。ぼくは、どの工夫が面白さにつながっているか考えてみたいの。",
          ),
          makeChoice(
            "VARIETY_SHOW_TEMPO", "テンポ・空気", "tempo",
            "テンポや空気が魅力",
            "{word}は、進む速さや雰囲気が好きなんだね。ぼくは、同じ話でも間の取り方で感じ方が変わると思うの。急ぐところと、待つところの違いが気になるな。",
            "{word}では、どこで話を進めて、どこで少し待つんだろう。ぼくは、その違いが聞きやすさや面白さにつながるか考えてみたいの。",
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
            "{word}は、笑いたい時に見るんだね。ぼくは、どんな予想が外れた時に面白く感じるか気になるの。言葉だけでなく、言う順番や表情も関係しそうなの。",
            "{word}の面白いところは、何を予想していた時に来るんだろう。ぼくは、話の内容と伝え方の両方を見てみたいな。",
          ),
          makeChoice(
            "VARIETY_SHOW_RELAX", "力を抜きたい", "relax",
            "力を抜きたい時に見る",
            "{word}は、少し力を抜きたい時に見るんだね。ぼくは、難しく考えずに楽しめる時間もいいと思うの。何を見ていると落ち着くかは、人によって違いそうだね。",
            "{word}を見て落ち着くのは、どんなところからなんだろう。ぼくは、頑張って考える時とは違う楽しみ方も知りたいな。",
          ),
          makeChoice(
            "VARIETY_SHOW_BG", "ながら見する", "background",
            "ながら見する",
            "{word}は、ほかのことをしながら見るんだね。ぼくは、全部を集中して見る時とは楽しみ方が違いそうだと思うの。気になる話が来た時だけ、手を止めてもよさそうなの。",
            "{word}の話で、集中して見たくなるのはどんなところかな。ぼくは、聞き流していた時には分からなかったことも知りたいの。",
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
            "{word}は、表現しているところが好きなんだね。ぼくは、動きや声でどんな気持ちを伝えているか知りたいな。言葉だけでは分からない工夫もありそうなの。",
            "{word}の動きや声を見たら、どんな気持ちが伝わるかな。ぼくは、大きい動きだけでなく、小さい変化にも注目してみたいの。",
          ),
          makeChoice(
            "STAGE_MUSICAL_MUSIC", "歌・音楽", "music",
            "歌や音楽が魅力",
            "{word}は、歌や音楽が気になるんだね。ぼくは、同じ場面でも音楽があるとどう変わるか知りたいな。登場する人の気持ちを伝えていることもありそうなの。",
            "{word}の歌は、どんな場面で始まるんだろう。ぼくは、言葉だけの時と比べて、どんな気持ちが伝わるか考えたいな。",
          ),
          makeChoice(
            "STAGE_MUSICAL_SET", "舞台装置・演出", "staging",
            "舞台装置や演出が魅力",
            "{word}は、舞台の見せ方にも注目するんだね。光や背景が変わると、同じ場所でも違う感じになりそうなの。ぼくは、見てほしいところをどう知らせるのか気になるな。",
            "{word}の舞台では、光や背景がどんな役目をしているんだろう。ぼくは、演じる人だけでなく、場面を作る工夫も見てみたいの。",
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
            "{word}は、その場で見る楽しみがあるんだね。まだ先が分からないから、同じ時間に見ている感じがしそうなの。ぼくは、予定と違うことが起きた時の反応も気になるな。",
            "{word}をその場で見る時は、次がどうなるかまだ分からないのね。ぼくは、その時だけの反応も面白そうだと思うの。",
          ),
          makeChoice(
            "STAGE_MUSICAL_REC", "映像でも楽しめる", "recorded",
            "映像でも楽しめる",
            "{word}は、映像でも楽しめるんだね。ぼくは、気になる場面をもう一度見られるのはよいと思うの。その場で見る時とは、注目できるところが違いそうなの。",
            "{word}を映像で見直すと、細かい表情や動きにも気付けるかな。ぼくは、全体を見る時と一つの場面を見る時の違いが気になるの。",
          ),
          makeChoice(
            "STAGE_MUSICAL_WANT", "まだだけど見たい", "want",
            "まだ見ていないが気になる",
            "{word}は、まだ見ていなくても気になるんだね。ぼくは、紹介だけでは分からない表情や動きも見てみたいな。実際に見たら、予想と違うところも面白そうなの。",
            "{word}を実際に見たら、今想像しているところをどう感じるかな。ぼくは、まだ見ていない場面を、知っているようには話さないでいたいの。",
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
            "{word}は、音の流れやリズムが好きなんだね。ぼくは、どの音が何度も思い出したくなるのか気になるの。同じ曲でも、速さが違ったら感じ方は変わりそうだね。",
            "{word}を聴くなら、音が変わるところにも注目してみたいな。ぼくは、どこで明るく感じたり落ち着いたりするのか気になるの。",
          ),
          makeChoice(
            "SONG_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "{word}は、歌の言葉が残るんだね。ぼくは、一言だけでなく前後の言葉も知りたいな。同じ言葉でも、誰に向けているかで意味が変わると思うの。",
            "{word}の歌詞は、誰へどんな気持ちを伝えているんだろう。ぼくは、一つの言葉を前後と一緒に考えてみたいな。",
          ),
          makeChoice(
            "SONG_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "{word}は、音や全体の感じが気になるんだね。ぼくは、音の大きさや重なりで気持ちが変わるか考えてみたいな。言葉がなくても伝わることはありそうなの。",
            "{word}の音は、どんな感じを作っているんだろう。ぼくは、一つの音だけでなく、全体で聴いた時の違いも気になるの。",
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
            "{word}は、何度も聴きたくなるんだね。知っている曲でも、新しく気付くところはありそうなの。ぼくは、前と同じところが好きなのかも比べてみたいな。",
            "{word}をまた聴く時、前に気付かなかった音も探してみたいな。繰り返すことは、同じことを覚えるだけではないのかもしれないの。",
          ),
          makeChoice(
            "SONG_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "{word}は、思い出ともつながっているんだね。ぼくは、曲を聴くと当時の気持ちまで思い出すのか気になるの。今の気持ちで聴いたら、感じ方が変わることもありそうなの。",
            "{word}を聴いた時、音だけでなく、その頃の出来事も思い出すのかな。ぼくは、昔の気持ちと今の気持ちの違いも考えてみたいの。",
          ),
          makeChoice(
            "SONG_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "{word}は、その日の気分で聴くんだね。同じ曲でも、落ち着きたい時と元気な時では感じ方が違いそうなの。ぼくは、今どんな音を聴きたいか考えてみたいな。",
            "{word}を聴く時の気分で、気になる音や言葉は変わるかな。ぼくは、同じ曲を違う日に聴いた時の感じ方も気になるの。",
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
            "{word}は、音の流れやリズムが好きなんだね。ぼくは、どの音が何度も思い出したくなるのか気になるの。同じ曲でも、速さが違ったら感じ方は変わりそうだね。",
            "{word}を聴くなら、音が変わるところにも注目してみたいな。ぼくは、どこで明るく感じたり落ち着いたりするのか気になるの。",
          ),
          makeChoice(
            "ALBUM_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "{word}は、歌の言葉が残るんだね。ぼくは、一言だけでなく前後の言葉も知りたいな。同じ言葉でも、誰に向けているかで意味が変わると思うの。",
            "{word}の歌詞は、誰へどんな気持ちを伝えているんだろう。ぼくは、一つの言葉を前後と一緒に考えてみたいな。",
          ),
          makeChoice(
            "ALBUM_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "{word}は、音や全体の感じが気になるんだね。ぼくは、音の大きさや重なりで気持ちが変わるか考えてみたいな。言葉がなくても伝わることはありそうなの。",
            "{word}の音は、どんな感じを作っているんだろう。ぼくは、一つの音だけでなく、全体で聴いた時の違いも気になるの。",
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
            "{word}は、何度も聴きたくなるんだね。知っている曲でも、新しく気付くところはありそうなの。ぼくは、前と同じところが好きなのかも比べてみたいな。",
            "{word}をまた聴く時、前に気付かなかった音も探してみたいな。繰り返すことは、同じことを覚えるだけではないのかもしれないの。",
          ),
          makeChoice(
            "ALBUM_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "{word}は、思い出ともつながっているんだね。ぼくは、曲を聴くと当時の気持ちまで思い出すのか気になるの。今の気持ちで聴いたら、感じ方が変わることもありそうなの。",
            "{word}を聴いた時、音だけでなく、その頃の出来事も思い出すのかな。ぼくは、昔の気持ちと今の気持ちの違いも考えてみたいの。",
          ),
          makeChoice(
            "ALBUM_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "{word}は、その日の気分で聴くんだね。同じ曲でも、落ち着きたい時と元気な時では感じ方が違いそうなの。ぼくは、今どんな音を聴きたいか考えてみたいな。",
            "{word}を聴く時の気分で、気になる音や言葉は変わるかな。ぼくは、同じ曲を違う日に聴いた時の感じ方も気になるの。",
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
            "{word}は、技術や上手さが気になるんだね。簡単そうに見える動きほど、練習が必要かもしれないの。ぼくは、どこに気を付けるとできるのか知りたいな。",
            "{word}の動きを真似するなら、まずどこを見るとよさそうかな。ぼくは、できた結果だけでなく、準備や判断も知りたいの。",
          ),
          makeChoice(
            "SINGER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "{word}は、その人らしいところが好きなんだね。ぼくは、ほかの人と同じことをしても違って感じる理由が気になるの。声や表現の小さい工夫に表れるかもしれないね。",
            "{word}らしいと感じるのは、どんなところからなんだろう。ぼくは、一つの場面だけでなく、いくつか比べて考えたいな。",
          ),
          makeChoice(
            "SINGER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "{word}は、そこにいるだけで気になる感じなんだね。ぼくは、姿勢や表情のどこからそう感じるか知りたいな。大きく動かなくても伝わることがありそうなの。",
            "{word}のどんなところが、目を向けたくなる理由なんだろう。ぼくは、話していない時の表情や姿勢にも注目したいな。",
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
            "{word}は、その場で見る楽しみがあるんだね。まだ先が分からないから、同じ時間に見ている感じがしそうなの。ぼくは、予定と違うことが起きた時の反応も気になるな。",
            "{word}をその場で見る時は、次がどうなるかまだ分からないのね。ぼくは、その時だけの反応も面白そうだと思うの。",
          ),
          makeChoice(
            "SINGER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "{word}は、録音された作品が好きなんだね。ぼくは、同じ音を何度も落ち着いて聞ける良さがあると思うの。少しずつ違うところに注目するのも楽しそうなの。",
            "{word}の録音を聴くなら、前に気付かなかった音も探してみたいな。ぼくは、一回で聞き取れない工夫もあると思うの。",
          ),
          makeChoice(
            "SINGER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "{word}は、仕事以外の話も気になるんだね。ぼくは、普段何を大切にしているか知りたいな。作品だけでは分からないところもありそうなの。",
            "{word}の普段の話を聞いたら、仕事を見る時の感じ方も変わるかな。ぼくは、本人の話と、自分の想像を分けて考えたいの。",
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
            "{word}は、技術や上手さが気になるんだね。簡単そうに見える動きほど、練習が必要かもしれないの。ぼくは、どこに気を付けるとできるのか知りたいな。",
            "{word}の動きを真似するなら、まずどこを見るとよさそうかな。ぼくは、できた結果だけでなく、準備や判断も知りたいの。",
          ),
          makeChoice(
            "BAND_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "{word}は、その人らしいところが好きなんだね。ぼくは、ほかの人と同じことをしても違って感じる理由が気になるの。声や表現の小さい工夫に表れるかもしれないね。",
            "{word}らしいと感じるのは、どんなところからなんだろう。ぼくは、一つの場面だけでなく、いくつか比べて考えたいな。",
          ),
          makeChoice(
            "BAND_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "{word}は、そこにいるだけで気になる感じなんだね。ぼくは、姿勢や表情のどこからそう感じるか知りたいな。大きく動かなくても伝わることがありそうなの。",
            "{word}のどんなところが、目を向けたくなる理由なんだろう。ぼくは、話していない時の表情や姿勢にも注目したいな。",
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
            "{word}は、その場で見る楽しみがあるんだね。まだ先が分からないから、同じ時間に見ている感じがしそうなの。ぼくは、予定と違うことが起きた時の反応も気になるな。",
            "{word}をその場で見る時は、次がどうなるかまだ分からないのね。ぼくは、その時だけの反応も面白そうだと思うの。",
          ),
          makeChoice(
            "BAND_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "{word}は、録音された作品が好きなんだね。ぼくは、同じ音を何度も落ち着いて聞ける良さがあると思うの。少しずつ違うところに注目するのも楽しそうなの。",
            "{word}の録音を聴くなら、前に気付かなかった音も探してみたいな。ぼくは、一回で聞き取れない工夫もあると思うの。",
          ),
          makeChoice(
            "BAND_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "{word}は、仕事以外の話も気になるんだね。ぼくは、普段何を大切にしているか知りたいな。作品だけでは分からないところもありそうなの。",
            "{word}の普段の話を聞いたら、仕事を見る時の感じ方も変わるかな。ぼくは、本人の話と、自分の想像を分けて考えたいの。",
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
            "{word}は、技術や上手さが気になるんだね。簡単そうに見える動きほど、練習が必要かもしれないの。ぼくは、どこに気を付けるとできるのか知りたいな。",
            "{word}の動きを真似するなら、まずどこを見るとよさそうかな。ぼくは、できた結果だけでなく、準備や判断も知りたいの。",
          ),
          makeChoice(
            "COMPOSER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "{word}は、その人らしいところが好きなんだね。ぼくは、ほかの人と同じことをしても違って感じる理由が気になるの。声や表現の小さい工夫に表れるかもしれないね。",
            "{word}らしいと感じるのは、どんなところからなんだろう。ぼくは、一つの場面だけでなく、いくつか比べて考えたいな。",
          ),
          makeChoice(
            "COMPOSER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "{word}は、そこにいるだけで気になる感じなんだね。ぼくは、姿勢や表情のどこからそう感じるか知りたいな。大きく動かなくても伝わることがありそうなの。",
            "{word}のどんなところが、目を向けたくなる理由なんだろう。ぼくは、話していない時の表情や姿勢にも注目したいな。",
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
            "{word}は、その場で見る楽しみがあるんだね。まだ先が分からないから、同じ時間に見ている感じがしそうなの。ぼくは、予定と違うことが起きた時の反応も気になるな。",
            "{word}をその場で見る時は、次がどうなるかまだ分からないのね。ぼくは、その時だけの反応も面白そうだと思うの。",
          ),
          makeChoice(
            "COMPOSER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "{word}は、録音された作品が好きなんだね。ぼくは、同じ音を何度も落ち着いて聞ける良さがあると思うの。少しずつ違うところに注目するのも楽しそうなの。",
            "{word}の録音を聴くなら、前に気付かなかった音も探してみたいな。ぼくは、一回で聞き取れない工夫もあると思うの。",
          ),
          makeChoice(
            "COMPOSER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "{word}は、仕事以外の話も気になるんだね。ぼくは、普段何を大切にしているか知りたいな。作品だけでは分からないところもありそうなの。",
            "{word}の普段の話を聞いたら、仕事を見る時の感じ方も変わるかな。ぼくは、本人の話と、自分の想像を分けて考えたいの。",
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
            "{word}は、音の流れやリズムが好きなんだね。ぼくは、どの音が何度も思い出したくなるのか気になるの。同じ曲でも、速さが違ったら感じ方は変わりそうだね。",
            "{word}を聴くなら、音が変わるところにも注目してみたいな。ぼくは、どこで明るく感じたり落ち着いたりするのか気になるの。",
          ),
          makeChoice(
            "SOUNDTRACK_WORDS", "歌詞・言葉", "lyrics",
            "歌詞や言葉が魅力",
            "{word}は、歌の言葉が残るんだね。ぼくは、一言だけでなく前後の言葉も知りたいな。同じ言葉でも、誰に向けているかで意味が変わると思うの。",
            "{word}の歌詞は、誰へどんな気持ちを伝えているんだろう。ぼくは、一つの言葉を前後と一緒に考えてみたいな。",
          ),
          makeChoice(
            "SOUNDTRACK_ATMOS", "音・雰囲気", "atmosphere",
            "音や雰囲気が魅力",
            "{word}は、音や全体の感じが気になるんだね。ぼくは、音の大きさや重なりで気持ちが変わるか考えてみたいな。言葉がなくても伝わることはありそうなの。",
            "{word}の音は、どんな感じを作っているんだろう。ぼくは、一つの音だけでなく、全体で聴いた時の違いも気になるの。",
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
            "{word}は、何度も聴きたくなるんだね。知っている曲でも、新しく気付くところはありそうなの。ぼくは、前と同じところが好きなのかも比べてみたいな。",
            "{word}をまた聴く時、前に気付かなかった音も探してみたいな。繰り返すことは、同じことを覚えるだけではないのかもしれないの。",
          ),
          makeChoice(
            "SOUNDTRACK_MEM", "思い出とセット", "memory",
            "思い出とつながっている",
            "{word}は、思い出ともつながっているんだね。ぼくは、曲を聴くと当時の気持ちまで思い出すのか気になるの。今の気持ちで聴いたら、感じ方が変わることもありそうなの。",
            "{word}を聴いた時、音だけでなく、その頃の出来事も思い出すのかな。ぼくは、昔の気持ちと今の気持ちの違いも考えてみたいの。",
          ),
          makeChoice(
            "SOUNDTRACK_MOOD", "気分で選ぶ", "mood",
            "気分で選ぶ",
            "{word}は、その日の気分で聴くんだね。同じ曲でも、落ち着きたい時と元気な時では感じ方が違いそうなの。ぼくは、今どんな音を聴きたいか考えてみたいな。",
            "{word}を聴く時の気分で、気になる音や言葉は変わるかな。ぼくは、同じ曲を違う日に聴いた時の感じ方も気になるの。",
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
            "{word}は、技術や上手さが気になるんだね。簡単そうに見える動きほど、練習が必要かもしれないの。ぼくは、どこに気を付けるとできるのか知りたいな。",
            "{word}の動きを真似するなら、まずどこを見るとよさそうかな。ぼくは、できた結果だけでなく、準備や判断も知りたいの。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_STYLE", "その人らしさ", "style",
            "その人らしさが魅力",
            "{word}は、その人らしいところが好きなんだね。ぼくは、ほかの人と同じことをしても違って感じる理由が気になるの。声や表現の小さい工夫に表れるかもしれないね。",
            "{word}らしいと感じるのは、どんなところからなんだろう。ぼくは、一つの場面だけでなく、いくつか比べて考えたいな。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_PRES", "存在感・雰囲気", "presence",
            "存在感や雰囲気が魅力",
            "{word}は、そこにいるだけで気になる感じなんだね。ぼくは、姿勢や表情のどこからそう感じるか知りたいな。大きく動かなくても伝わることがありそうなの。",
            "{word}のどんなところが、目を向けたくなる理由なんだろう。ぼくは、話していない時の表情や姿勢にも注目したいな。",
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
            "{word}は、その場で見る楽しみがあるんだね。まだ先が分からないから、同じ時間に見ている感じがしそうなの。ぼくは、予定と違うことが起きた時の反応も気になるな。",
            "{word}をその場で見る時は、次がどうなるかまだ分からないのね。ぼくは、その時だけの反応も面白そうだと思うの。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_REC", "録音された作品", "recorded",
            "録音された作品が好き",
            "{word}は、録音された作品が好きなんだね。ぼくは、同じ音を何度も落ち着いて聞ける良さがあると思うの。少しずつ違うところに注目するのも楽しそうなの。",
            "{word}の録音を聴くなら、前に気付かなかった音も探してみたいな。ぼくは、一回で聞き取れない工夫もあると思うの。",
          ),
          makeChoice(
            "MUSIC_PRODUCER_PERSON", "本人の話や人柄", "personality",
            "本人の話や人柄も気になる",
            "{word}は、仕事以外の話も気になるんだね。ぼくは、普段何を大切にしているか知りたいな。作品だけでは分からないところもありそうなの。",
            "{word}の普段の話を聞いたら、仕事を見る時の感じ方も変わるかな。ぼくは、本人の話と、自分の想像を分けて考えたいの。",
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
            "{word}は、扱っている話題が気になるんだね。ぼくは、同じ話題をほかの人がどう説明するかも知りたいな。比べると、自分が分かっていないところに気付けそうなの。",
            "{word}で気になった話題を、別の説明でも調べてみたいな。同じことでも、違う例があると分かりやすくなるかもしれないの。",
          ),
          makeChoice(
            "YOUTUBER_PERSON", "話し方・性格", "personality",
            "話し方や性格が魅力",
            "{word}は、話し方や人柄が好きなんだね。ぼくは、同じ話を誰がするかで面白さが変わることはありそうだと思うの。困った時や笑った時の反応も気になるな。",
            "{word}が予想していなかった話を聞いたら、どう返すんだろう。ぼくは、用意した説明とは違う、その場の反応も見てみたいの。",
          ),
          makeChoice(
            "YOUTUBER_STYLE", "編集・見せ方", "style",
            "編集や見せ方が魅力",
            "{word}は、編集や見せ方が気になるんだね。ぼくは、同じ映像でも順番を変えると伝わり方が違うと思うの。どこを残して、どこを短くしたかも知りたいな。",
            "{word}の動画では、見せる順番にどんな工夫があるんだろう。ぼくは、分かりやすい理由を内容とは別に考えてみたいな。",
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
            "{word}は、その場で見る楽しみがあるんだね。まだ先が分からないから、同じ時間に見ている感じがしそうなの。ぼくは、予定と違うことが起きた時の反応も気になるな。",
            "{word}をその場で見る時は、次がどうなるかまだ分からないのね。ぼくは、その時だけの反応も面白そうだと思うの。",
          ),
          makeChoice(
            "YOUTUBER_ARCH", "アーカイブで見る", "archive",
            "アーカイブで見る",
            "{word}は、残っている動画で見るんだね。気になるところで止めたり、もう一度見たりできるのはよさそうなの。ぼくは、分からなかった話を落ち着いて確かめたいな。",
            "{word}の動画なら、気になったところへ戻って考えられるのね。ぼくは、早く先を見るより、一つ分かる時間も取りたいな。",
          ),
          makeChoice(
            "YOUTUBER_CLIP", "切り抜き・短い動画", "clips",
            "切り抜きや短い動画で見る",
            "{word}は、短い場面で見ることが多いんだね。ぼくは、その前後に何があったかも気になるの。短いところだけでは、話の意味が変わって見える場合もありそうなの。",
            "{word}の短い場面が気になったら、前と後も知りたくなるの。ぼくは、見た部分だけで全部を分かったつもりにならないでいたいな。",
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
            "{word}は、知れる内容が気になるんだね。ぼくは、分かりやすい説明があったら、理由も確かめてみたいな。知ったことが自分の疑問につながるのは面白そうなの。",
            "{word}で知ったことは、どんな理由で説明されているんだろう。ぼくは、ほかの情報とも比べて、分かるところを増やしたいな。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "{word}は、集まる人や話せる場所が気になるんだね。ぼくは、同じ話題でも人によって考えが違うのが面白そうだと思うの。自分とは違う使い方も知れるかもしれないね。",
            "{word}でほかの人の話を聞いたら、知らなかった見方が増えるかな。ぼくは、一人の意見だけで全体を決めないようにしたいの。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "{word}は、使いやすさや仕組みが気になるんだね。ぼくは、何を少ない手順でできるようにしたか知りたいな。便利に使う工夫と、動く仕組みの両方が面白そうなの。",
            "{word}の仕組みでは、どんな作業を分かりやすくしているんだろう。ぼくは、いつも使うところにも工夫があるか確かめたいな。",
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
            "{word}は、毎日のように使うんだね。よく使うと、慣れて気付かなくなる便利さもありそうなの。ぼくは、使わない日には何が違うか考えてみたいな。",
            "{word}が使えない日には、いつもの何が変わるんだろう。ぼくは、普段あまり意識していない役立ち方も知りたいの。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "{word}は、気になった時に探すんだね。知りたいことがあると、見る場所も選びやすそうなの。ぼくは、一つ分かったら次に何が気になるか考えてみたいな。",
            "{word}を探す時は、何を知りたいのか一つ決めてみたいな。答えが見つかったあとに、新しい疑問が出てくるかも気になるの。",
          ),
          makeChoice(
            "VIDEO_CHANNEL_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "{word}は、必要な時や気になる時に使うんだね。毎日使わなくても、役立つ場所はありそうなの。ぼくは、どんな時に思い出すのか知りたいな。",
            "{word}を使いたくなるのは、どんなことをしたい時なんだろう。ぼくは、使う回数だけでは分からない良さもありそうだと思うの。",
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
            "{word}は、知れる内容が気になるんだね。ぼくは、分かりやすい説明があったら、理由も確かめてみたいな。知ったことが自分の疑問につながるのは面白そうなの。",
            "{word}で知ったことは、どんな理由で説明されているんだろう。ぼくは、ほかの情報とも比べて、分かるところを増やしたいな。",
          ),
          makeChoice(
            "PODCAST_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "{word}は、集まる人や話せる場所が気になるんだね。ぼくは、同じ話題でも人によって考えが違うのが面白そうだと思うの。自分とは違う使い方も知れるかもしれないね。",
            "{word}でほかの人の話を聞いたら、知らなかった見方が増えるかな。ぼくは、一人の意見だけで全体を決めないようにしたいの。",
          ),
          makeChoice(
            "PODCAST_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "{word}は、使いやすさや仕組みが気になるんだね。ぼくは、何を少ない手順でできるようにしたか知りたいな。便利に使う工夫と、動く仕組みの両方が面白そうなの。",
            "{word}の仕組みでは、どんな作業を分かりやすくしているんだろう。ぼくは、いつも使うところにも工夫があるか確かめたいな。",
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
            "{word}は、毎日のように使うんだね。よく使うと、慣れて気付かなくなる便利さもありそうなの。ぼくは、使わない日には何が違うか考えてみたいな。",
            "{word}が使えない日には、いつもの何が変わるんだろう。ぼくは、普段あまり意識していない役立ち方も知りたいの。",
          ),
          makeChoice(
            "PODCAST_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "{word}は、気になった時に探すんだね。知りたいことがあると、見る場所も選びやすそうなの。ぼくは、一つ分かったら次に何が気になるか考えてみたいな。",
            "{word}を探す時は、何を知りたいのか一つ決めてみたいな。答えが見つかったあとに、新しい疑問が出てくるかも気になるの。",
          ),
          makeChoice(
            "PODCAST_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "{word}は、必要な時や気になる時に使うんだね。毎日使わなくても、役立つ場所はありそうなの。ぼくは、どんな時に思い出すのか知りたいな。",
            "{word}を使いたくなるのは、どんなことをしたい時なんだろう。ぼくは、使う回数だけでは分からない良さもありそうだと思うの。",
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
            "{word}は、知れる内容が気になるんだね。ぼくは、分かりやすい説明があったら、理由も確かめてみたいな。知ったことが自分の疑問につながるのは面白そうなの。",
            "{word}で知ったことは、どんな理由で説明されているんだろう。ぼくは、ほかの情報とも比べて、分かるところを増やしたいな。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_PEOPLE", "人・コミュニティ", "people",
            "人やコミュニティが魅力",
            "{word}は、集まる人や話せる場所が気になるんだね。ぼくは、同じ話題でも人によって考えが違うのが面白そうだと思うの。自分とは違う使い方も知れるかもしれないね。",
            "{word}でほかの人の話を聞いたら、知らなかった見方が増えるかな。ぼくは、一人の意見だけで全体を決めないようにしたいの。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_FORMAT", "使い方・仕組み", "format",
            "使い方や仕組みが魅力",
            "{word}は、使いやすさや仕組みが気になるんだね。ぼくは、何を少ない手順でできるようにしたか知りたいな。便利に使う工夫と、動く仕組みの両方が面白そうなの。",
            "{word}の仕組みでは、どんな作業を分かりやすくしているんだろう。ぼくは、いつも使うところにも工夫があるか確かめたいな。",
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
            "{word}は、毎日のように使うんだね。よく使うと、慣れて気付かなくなる便利さもありそうなの。ぼくは、使わない日には何が違うか考えてみたいな。",
            "{word}が使えない日には、いつもの何が変わるんだろう。ぼくは、普段あまり意識していない役立ち方も知りたいの。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_SEARCH", "必要な時だけ", "search",
            "必要な時だけ使う",
            "{word}は、気になった時に探すんだね。知りたいことがあると、見る場所も選びやすそうなの。ぼくは、一つ分かったら次に何が気になるか考えてみたいな。",
            "{word}を探す時は、何を知りたいのか一つ決めてみたいな。答えが見つかったあとに、新しい疑問が出てくるかも気になるの。",
          ),
          makeChoice(
            "WEBSITE_COMMUNITY_OCC", "たまに戻る", "occasional",
            "たまに戻る",
            "{word}は、必要な時や気になる時に使うんだね。毎日使わなくても、役立つ場所はありそうなの。ぼくは、どんな時に思い出すのか知りたいな。",
            "{word}を使いたくなるのは、どんなことをしたい時なんだろう。ぼくは、使う回数だけでは分からない良さもありそうだと思うの。",
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
            "{word}は、扱っている話題が気になるんだね。ぼくは、同じ話題をほかの人がどう説明するかも知りたいな。比べると、自分が分かっていないところに気付けそうなの。",
            "{word}で気になった話題を、別の説明でも調べてみたいな。同じことでも、違う例があると分かりやすくなるかもしれないの。",
          ),
          makeChoice(
            "VTUBER_PERSON", "話し方・性格", "personality",
            "話し方や性格が魅力",
            "{word}は、話し方や人柄が好きなんだね。ぼくは、同じ話を誰がするかで面白さが変わることはありそうだと思うの。困った時や笑った時の反応も気になるな。",
            "{word}が予想していなかった話を聞いたら、どう返すんだろう。ぼくは、用意した説明とは違う、その場の反応も見てみたいの。",
          ),
          makeChoice(
            "VTUBER_STYLE", "編集・見せ方", "style",
            "編集や見せ方が魅力",
            "{word}は、編集や見せ方が気になるんだね。ぼくは、同じ映像でも順番を変えると伝わり方が違うと思うの。どこを残して、どこを短くしたかも知りたいな。",
            "{word}の動画では、見せる順番にどんな工夫があるんだろう。ぼくは、分かりやすい理由を内容とは別に考えてみたいな。",
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
            "{word}は、その場で見る楽しみがあるんだね。まだ先が分からないから、同じ時間に見ている感じがしそうなの。ぼくは、予定と違うことが起きた時の反応も気になるな。",
            "{word}をその場で見る時は、次がどうなるかまだ分からないのね。ぼくは、その時だけの反応も面白そうだと思うの。",
          ),
          makeChoice(
            "VTUBER_ARCH", "アーカイブで見る", "archive",
            "アーカイブで見る",
            "{word}は、残っている動画で見るんだね。気になるところで止めたり、もう一度見たりできるのはよさそうなの。ぼくは、分からなかった話を落ち着いて確かめたいな。",
            "{word}の動画なら、気になったところへ戻って考えられるのね。ぼくは、早く先を見るより、一つ分かる時間も取りたいな。",
          ),
          makeChoice(
            "VTUBER_CLIP", "切り抜き・短い動画", "clips",
            "切り抜きや短い動画で見る",
            "{word}は、短い場面で見ることが多いんだね。ぼくは、その前後に何があったかも気になるの。短いところだけでは、話の意味が変わって見える場合もありそうなの。",
            "{word}の短い場面が気になったら、前と後も知りたくなるの。ぼくは、見た部分だけで全部を分かったつもりにならないでいたいな。",
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
            "{word}は、作品に表れる特徴が好きなんだね。ぼくは、別の題材でも同じ特徴が見えるか気になるの。何度か見ると、その人の工夫が分かるかもしれないね。",
            "{word}の別の作品でも、似た言葉や見せ方があるかな。ぼくは、繰り返して使う工夫と、作品ごとに違うところを比べたいの。",
          ),
          makeChoice(
            "AUTHOR_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "{word}は、発想やテーマが気になるんだね。ぼくは、普段のことからどうやってその考えを見つけたのか知りたいな。同じものを見ても、思い付くことは人によって違いそうなの。",
            "{word}のテーマは、どんな疑問から生まれたんだろう。ぼくは、その発想を知ると、作品を見る時に気になるところも変わりそうだと思うの。",
          ),
          makeChoice(
            "AUTHOR_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "{word}は、細かい作り込みが気になるんだね。ぼくは、目立たないところにも工夫があるか見てみたいな。気付かなくても、全体の分かりやすさに関わるところはありそうなの。",
            "{word}の細かい工夫は、どんなところに役立っているんだろう。ぼくは、目立つところ以外にも注目してみたいな。",
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
            "{word}は、特に好きな作品が一つあるんだね。ぼくは、たくさん知っているかより、その一つの何が残ったのかが気になるの。好きな理由は人によって違いそうなの。",
            "{word}の一つの作品が特に残るのは、どんなところからなんだろう。ぼくは、ほかの作品を全部知らなくても、その理由は考えられそうだと思うの。",
          ),
          makeChoice(
            "AUTHOR_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "{word}は、次の作品や仕事も見たいんだね。ぼくは、前と同じ良さと、新しく変わるところの両方が気になるの。まだ知らない内容は、予想と分けて待ちたいな。",
            "{word}の次では、今までと何が変わるんだろう。ぼくは、新しいことに挑戦するところと、続けている工夫を比べてみたいな。",
          ),
          makeChoice(
            "AUTHOR_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "{word}は、本人の話も聞くんだね。ぼくは、作った時や演じた時に何を考えていたか知りたいな。見る側の感じ方とは違うこともありそうなの。",
            "{word}が自分の仕事について話したら、ぼくの見方も変わるかな。感じたことと、本人が目指したことを比べてみたいの。",
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
            "{word}は、作品に表れる特徴が好きなんだね。ぼくは、別の題材でも同じ特徴が見えるか気になるの。何度か見ると、その人の工夫が分かるかもしれないね。",
            "{word}の別の作品でも、似た言葉や見せ方があるかな。ぼくは、繰り返して使う工夫と、作品ごとに違うところを比べたいの。",
          ),
          makeChoice(
            "MANGA_ARTIST_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "{word}は、発想やテーマが気になるんだね。ぼくは、普段のことからどうやってその考えを見つけたのか知りたいな。同じものを見ても、思い付くことは人によって違いそうなの。",
            "{word}のテーマは、どんな疑問から生まれたんだろう。ぼくは、その発想を知ると、作品を見る時に気になるところも変わりそうだと思うの。",
          ),
          makeChoice(
            "MANGA_ARTIST_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "{word}は、細かい作り込みが気になるんだね。ぼくは、目立たないところにも工夫があるか見てみたいな。気付かなくても、全体の分かりやすさに関わるところはありそうなの。",
            "{word}の細かい工夫は、どんなところに役立っているんだろう。ぼくは、目立つところ以外にも注目してみたいな。",
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
            "{word}は、特に好きな作品が一つあるんだね。ぼくは、たくさん知っているかより、その一つの何が残ったのかが気になるの。好きな理由は人によって違いそうなの。",
            "{word}の一つの作品が特に残るのは、どんなところからなんだろう。ぼくは、ほかの作品を全部知らなくても、その理由は考えられそうだと思うの。",
          ),
          makeChoice(
            "MANGA_ARTIST_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "{word}は、次の作品や仕事も見たいんだね。ぼくは、前と同じ良さと、新しく変わるところの両方が気になるの。まだ知らない内容は、予想と分けて待ちたいな。",
            "{word}の次では、今までと何が変わるんだろう。ぼくは、新しいことに挑戦するところと、続けている工夫を比べてみたいな。",
          ),
          makeChoice(
            "MANGA_ARTIST_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "{word}は、本人の話も聞くんだね。ぼくは、作った時や演じた時に何を考えていたか知りたいな。見る側の感じ方とは違うこともありそうなの。",
            "{word}が自分の仕事について話したら、ぼくの見方も変わるかな。感じたことと、本人が目指したことを比べてみたいの。",
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
            "{word}は、作品に表れる特徴が好きなんだね。ぼくは、別の題材でも同じ特徴が見えるか気になるの。何度か見ると、その人の工夫が分かるかもしれないね。",
            "{word}の別の作品でも、似た言葉や見せ方があるかな。ぼくは、繰り返して使う工夫と、作品ごとに違うところを比べたいの。",
          ),
          makeChoice(
            "DIRECTOR_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "{word}は、発想やテーマが気になるんだね。ぼくは、普段のことからどうやってその考えを見つけたのか知りたいな。同じものを見ても、思い付くことは人によって違いそうなの。",
            "{word}のテーマは、どんな疑問から生まれたんだろう。ぼくは、その発想を知ると、作品を見る時に気になるところも変わりそうだと思うの。",
          ),
          makeChoice(
            "DIRECTOR_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "{word}は、細かい作り込みが気になるんだね。ぼくは、目立たないところにも工夫があるか見てみたいな。気付かなくても、全体の分かりやすさに関わるところはありそうなの。",
            "{word}の細かい工夫は、どんなところに役立っているんだろう。ぼくは、目立つところ以外にも注目してみたいな。",
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
            "{word}は、特に好きな作品が一つあるんだね。ぼくは、たくさん知っているかより、その一つの何が残ったのかが気になるの。好きな理由は人によって違いそうなの。",
            "{word}の一つの作品が特に残るのは、どんなところからなんだろう。ぼくは、ほかの作品を全部知らなくても、その理由は考えられそうだと思うの。",
          ),
          makeChoice(
            "DIRECTOR_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "{word}は、次の作品や仕事も見たいんだね。ぼくは、前と同じ良さと、新しく変わるところの両方が気になるの。まだ知らない内容は、予想と分けて待ちたいな。",
            "{word}の次では、今までと何が変わるんだろう。ぼくは、新しいことに挑戦するところと、続けている工夫を比べてみたいな。",
          ),
          makeChoice(
            "DIRECTOR_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "{word}は、本人の話も聞くんだね。ぼくは、作った時や演じた時に何を考えていたか知りたいな。見る側の感じ方とは違うこともありそうなの。",
            "{word}が自分の仕事について話したら、ぼくの見方も変わるかな。感じたことと、本人が目指したことを比べてみたいの。",
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
            "{word}は、演技や表現が印象に残るんだね。ぼくは、同じ言葉でも声や表情で何が変わるか見てみたいな。言葉にしていない気持ちも伝わるかもしれないの。",
            "{word}の演技では、セリフがない時に何が伝わるんだろう。ぼくは、表情や動きだけで分かることも探してみたいな。",
          ),
          makeChoice(
            "ACTOR_VOICE", "声・話し方", "voice",
            "声や話し方が魅力",
            "{word}は、声が気になるんだね。同じ言葉でも、声の高さや速さで感じ方が変わると思うの。ぼくは、顔を見ずに聞いた時に何が伝わるか考えてみたいな。",
            "{word}の声から、言葉以外にどんな気持ちが伝わるかな。ぼくは、ゆっくり話す時と強く話す時の違いも聞いてみたいの。",
          ),
          makeChoice(
            "ACTOR_PRES", "存在感", "presence",
            "存在感が魅力",
            "{word}は、そこにいるだけで気になる感じなんだね。ぼくは、姿勢や表情のどこからそう感じるか知りたいな。大きく動かなくても伝わることがありそうなの。",
            "{word}のどんなところが、目を向けたくなる理由なんだろう。ぼくは、話していない時の表情や姿勢にも注目したいな。",
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
            "{word}は、演じる役や作品の中で見るんだね。ぼくは、別の役を演じた時の違いも気になるの。演じている性格と、本人の性格は分けて考えたいな。",
            "{word}が別の役になったら、同じ言葉も違って聞こえるかな。ぼくは、声や表情をどう変えるか見てみたいの。",
          ),
          makeChoice(
            "ACTOR_PERSON", "本人の人柄", "personality",
            "本人の人柄も気になる",
            "{word}は、演じていない時の人柄も気になるんだね。ぼくは、役で見せる顔とはどう違うか知りたいな。役の印象だけで本人を決めないようにしたいの。",
            "{word}が本人として話したら、役の中とは違うところが見えるかな。ぼくは、演技で伝えていたことと、普段の考えを分けて知りたいの。",
          ),
          makeChoice(
            "ACTOR_NEXT", "次の仕事が気になる", "future",
            "次の仕事が気になる",
            "{word}は、次の仕事も気になるんだね。ぼくは、今までと違うことをするのか知りたいな。予想を楽しみながら、まだ決まっていない内容は分けて考えたいの。",
            "{word}の次の仕事では、どんなところが変わるんだろう。ぼくは、前の良さを残すのか、新しいことを試すのかも気になるな。",
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
            "{word}は、演技や表現が印象に残るんだね。ぼくは、同じ言葉でも声や表情で何が変わるか見てみたいな。言葉にしていない気持ちも伝わるかもしれないの。",
            "{word}の演技では、セリフがない時に何が伝わるんだろう。ぼくは、表情や動きだけで分かることも探してみたいな。",
          ),
          makeChoice(
            "VOICE_ACTOR_VOICE", "声・話し方", "voice",
            "声や話し方が魅力",
            "{word}は、声が気になるんだね。同じ言葉でも、声の高さや速さで感じ方が変わると思うの。ぼくは、顔を見ずに聞いた時に何が伝わるか考えてみたいな。",
            "{word}の声から、言葉以外にどんな気持ちが伝わるかな。ぼくは、ゆっくり話す時と強く話す時の違いも聞いてみたいの。",
          ),
          makeChoice(
            "VOICE_ACTOR_PRES", "存在感", "presence",
            "存在感が魅力",
            "{word}は、そこにいるだけで気になる感じなんだね。ぼくは、姿勢や表情のどこからそう感じるか知りたいな。大きく動かなくても伝わることがありそうなの。",
            "{word}のどんなところが、目を向けたくなる理由なんだろう。ぼくは、話していない時の表情や姿勢にも注目したいな。",
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
            "{word}は、演じる役や作品の中で見るんだね。ぼくは、別の役を演じた時の違いも気になるの。演じている性格と、本人の性格は分けて考えたいな。",
            "{word}が別の役になったら、同じ言葉も違って聞こえるかな。ぼくは、声や表情をどう変えるか見てみたいの。",
          ),
          makeChoice(
            "VOICE_ACTOR_PERSON", "本人の人柄", "personality",
            "本人の人柄も気になる",
            "{word}は、演じていない時の人柄も気になるんだね。ぼくは、役で見せる顔とはどう違うか知りたいな。役の印象だけで本人を決めないようにしたいの。",
            "{word}が本人として話したら、役の中とは違うところが見えるかな。ぼくは、演技で伝えていたことと、普段の考えを分けて知りたいの。",
          ),
          makeChoice(
            "VOICE_ACTOR_NEXT", "次の仕事が気になる", "future",
            "次の仕事が気になる",
            "{word}は、次の仕事も気になるんだね。ぼくは、今までと違うことをするのか知りたいな。予想を楽しみながら、まだ決まっていない内容は分けて考えたいの。",
            "{word}の次の仕事では、どんなところが変わるんだろう。ぼくは、前の良さを残すのか、新しいことを試すのかも気になるな。",
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
            "{word}は、間やタイミングが好きなんだね。ぼくは、同じ言葉を少し早く言ったらどうなるか気になるの。内容だけじゃなく、待つ時間も面白さに関係しそうなの。",
            "{word}の話では、どのタイミングで言うから面白くなるんだろう。ぼくは、言葉の前後にある間も聞いてみたいな。",
          ),
          makeChoice(
            "COMEDIAN_IDEA", "話・発想", "ideas",
            "話や発想が好き",
            "{word}は、話の発想が好きなんだね。ぼくは、普通の話がどこから面白くなるのか気になるの。同じ出来事でも、注目するところを変えると違って話せそうなの。",
            "{word}の話は、何をいつもと違うふうに考えているんだろう。ぼくは、身近なことから面白い話を見つける工夫を知りたいな。",
          ),
          makeChoice(
            "COMEDIAN_CHAR", "キャラ・雰囲気", "character",
            "キャラや雰囲気が好き",
            "{word}は、その人の雰囲気が好きなんだね。ぼくは、同じ話でもその人がすると面白くなる理由が気になるの。表情や話し方にも注目したいな。",
            "{word}の話では、内容のほかにどんなところが面白いのかな。ぼくは、表情や周りとのやり取りも見てみたいの。",
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
            "{word}は、笑いたい時に見るんだね。ぼくは、どんな予想が外れた時に面白く感じるか気になるの。言葉だけでなく、言う順番や表情も関係しそうなの。",
            "{word}の面白いところは、何を予想していた時に来るんだろう。ぼくは、話の内容と伝え方の両方を見てみたいな。",
          ),
          makeChoice(
            "COMEDIAN_TALK", "トークを聞きたい時", "talk",
            "トークを聞きたい時に見る",
            "{word}は、話を聞きたい時に見るんだね。ぼくは、同じ出来事をどんなふうに話すか気になるの。話す順番や言葉の選び方で、面白さが変わりそうなの。",
            "{word}が身近な出来事を話したら、どこに注目するんだろう。ぼくは、普通の話が面白くなる工夫を知りたいな。",
          ),
          makeChoice(
            "COMEDIAN_CLIP", "短いネタで十分", "clips",
            "短いネタで楽しむ",
            "{word}は、短いネタでも楽しめるんだね。短い時間で伝わるように、言葉や順番を選んでいそうなの。ぼくは、どこで予想が変わるか見てみたいな。",
            "{word}の短いネタは、少ない時間でどう面白さを伝えるんだろう。ぼくは、始まりから終わりまでのつながりを考えてみたいの。",
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
            "{word}は、作ったものやサービスが気になるんだね。ぼくは、どんな困りごとを減らそうとしたのか知りたいな。新しいことだけでなく、使いやすい工夫も大事そうなの。",
            "{word}の商品やサービスは、何をしたい人に役立つんだろう。ぼくは、できることと、使いやすくした工夫を一緒に知りたいな。",
          ),
          makeChoice(
            "ENTREPRENEUR_DEC", "判断・賭け", "decision",
            "判断や賭けが気になる",
            "{word}は、思い切って選ぶ時の判断が気になるんだね。ぼくは、何が分かっていて、何がまだ分からなかったか知りたいな。上手くいかなかった場合も考えて選んだのか気になるの。",
            "{word}が大きい決定をする時、どんな危険を考えたんだろう。ぼくは、成功した結果だけでなく、決める前の理由も知りたいの。",
          ),
          makeChoice(
            "ENTREPRENEUR_ORG", "人・組織の動かし方", "organization",
            "人や組織の動かし方が気になる",
            "{word}は、人や組織をどう動かすか気になるんだね。ぼくは、考えをどう伝えて協力してもらうのか知りたいな。一人が決めるだけでは進まないこともありそうなの。",
            "{word}が人に頼む時、目的や役割をどう伝えたんだろう。ぼくは、指示だけでなく、相手の考えも聞いていたか気になるの。",
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
            "{word}のやり方は、よく参考にするんだね。ぼくは、何が自分にも使えそうかを一つずつ考えたいな。同じ方法でも、状況が違えば工夫し直す必要はありそうなの。",
            "{word}のやり方を参考にする時、どんなところを取り入れられるかな。ぼくは、うまくいった理由と自分の状況を比べて考えたいの。",
          ),
          makeChoice(
            "ENTREPRENEUR_CUR", "成功も失敗も気になる", "curious",
            "成功も失敗も気になる",
            "{word}は、上手くいったことも失敗したことも気になるんだね。ぼくは、それぞれで何を変えたか知りたいな。結果が違う理由を比べると、工夫が分かりそうなの。",
            "{word}が成功した時と失敗した時では、どんな条件が違ったんだろう。ぼくは、結果だけを見ず、試した方法も比べたいの。",
          ),
          makeChoice(
            "ENTREPRENEUR_DIST", "考えは違うけど面白い", "different",
            "考えは違うが面白い",
            "{word}は、考えが違っても面白いんだね。ぼくは、違う意見から気付くこともあると思うの。賛成できるかと、知りたいかは分けて考えたいな。",
            "{word}の考えと違うところを比べたら、ぼくの理由もはっきりするかな。すぐ同じ意見にならなくても、話を聞く意味はありそうなの。",
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
            "{word}は、作品に表れる特徴が好きなんだね。ぼくは、別の題材でも同じ特徴が見えるか気になるの。何度か見ると、その人の工夫が分かるかもしれないね。",
            "{word}の別の作品でも、似た言葉や見せ方があるかな。ぼくは、繰り返して使う工夫と、作品ごとに違うところを比べたいの。",
          ),
          makeChoice(
            "ARTIST_IDEA", "発想・テーマ", "ideas",
            "発想やテーマが魅力",
            "{word}は、発想やテーマが気になるんだね。ぼくは、普段のことからどうやってその考えを見つけたのか知りたいな。同じものを見ても、思い付くことは人によって違いそうなの。",
            "{word}のテーマは、どんな疑問から生まれたんだろう。ぼくは、その発想を知ると、作品を見る時に気になるところも変わりそうだと思うの。",
          ),
          makeChoice(
            "ARTIST_CRAFT", "技術・作り込み", "craft",
            "技術や作り込みが魅力",
            "{word}は、細かい作り込みが気になるんだね。ぼくは、目立たないところにも工夫があるか見てみたいな。気付かなくても、全体の分かりやすさに関わるところはありそうなの。",
            "{word}の細かい工夫は、どんなところに役立っているんだろう。ぼくは、目立つところ以外にも注目してみたいな。",
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
            "{word}は、特に好きな作品が一つあるんだね。ぼくは、たくさん知っているかより、その一つの何が残ったのかが気になるの。好きな理由は人によって違いそうなの。",
            "{word}の一つの作品が特に残るのは、どんなところからなんだろう。ぼくは、ほかの作品を全部知らなくても、その理由は考えられそうだと思うの。",
          ),
          makeChoice(
            "ARTIST_FOLLOW", "新作も追う", "follow",
            "新作も追う",
            "{word}は、次の作品や仕事も見たいんだね。ぼくは、前と同じ良さと、新しく変わるところの両方が気になるの。まだ知らない内容は、予想と分けて待ちたいな。",
            "{word}の次では、今までと何が変わるんだろう。ぼくは、新しいことに挑戦するところと、続けている工夫を比べてみたいな。",
          ),
          makeChoice(
            "ARTIST_TALK", "インタビューも見る", "interview",
            "本人の話も見る",
            "{word}は、本人の話も聞くんだね。ぼくは、作った時や演じた時に何を考えていたか知りたいな。見る側の感じ方とは違うこともありそうなの。",
            "{word}が自分の仕事について話したら、ぼくの見方も変わるかな。感じたことと、本人が目指したことを比べてみたいの。",
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
            "{word}は、成し遂げたことが気になるんだね。ぼくは、その前の苦労や工夫も知りたいな。結果を知るだけでは分からないこともありそうなの。",
            "{word}が結果を出すまでに、何を工夫したんだろう。ぼくは、一人でできたことか、誰かの助けがあったのかも気になるの。",
          ),
          makeChoice(
            "RULER_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "{word}は、大事な判断が気になるんだね。ぼくは、その時に選べた方法を比べてみたいな。結果を知らない立場なら、違う選び方をするかもしれないの。",
            "{word}がその方法を選んだ時、何を一番大事にしていたんだろう。ぼくならどうするかも、当時分かっていたことから考えたいな。",
          ),
          makeChoice(
            "RULER_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "{word}は、人柄や考え方が気になるんだね。普段の話だけじゃなく、困った時にどうするかも知りたいな。一つの場面だけで、その人の全部は決められないと思うの。",
            "{word}が困った時、誰かに相談するのか、自分で考えるのか気になるな。普段と違う場面では、まだ知らないところが見えるかもしれないの。",
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
            "{word}には、すごいと思うところがあるんだね。ぼくは、全部を真似するより、一つできそうなところを探したいな。どうやってできるようになったかも気になるの。",
            "{word}のすごいところを、自分にも少し取り入れるなら何ができるかな。ぼくは、結果だけ真似するより、続けたことや工夫を知りたいの。",
          ),
          makeChoice(
            "RULER_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "{word}の判断には、言いたいことがあるんだね。ぼくは、どこで別の選び方ができたか考えたいな。その時に分かっていたことも確かめたいの。",
            "{word}の判断を考えるなら、ほかに選べた方法も知りたいな。ぼくは、結果だけでなく、その方法で何が起きそうだったかも比べたいの。",
          ),
          makeChoice(
            "RULER_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "{word}は、失敗からも学びたいんだね。ぼくは、どこで気付き、次に何を変えたか知りたいな。失敗したことだけで終わらず、その後も考えたいの。",
            "{word}の失敗では、何を変えればよかったんだろう。ぼくは、同じことを繰り返さないために使える工夫を考えてみたいな。",
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
            "{word}は、成し遂げたことが気になるんだね。ぼくは、その前の苦労や工夫も知りたいな。結果を知るだけでは分からないこともありそうなの。",
            "{word}が結果を出すまでに、何を工夫したんだろう。ぼくは、一人でできたことか、誰かの助けがあったのかも気になるの。",
          ),
          makeChoice(
            "COMMANDER_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "{word}は、大事な判断が気になるんだね。ぼくは、その時に選べた方法を比べてみたいな。結果を知らない立場なら、違う選び方をするかもしれないの。",
            "{word}がその方法を選んだ時、何を一番大事にしていたんだろう。ぼくならどうするかも、当時分かっていたことから考えたいな。",
          ),
          makeChoice(
            "COMMANDER_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "{word}は、人柄や考え方が気になるんだね。普段の話だけじゃなく、困った時にどうするかも知りたいな。一つの場面だけで、その人の全部は決められないと思うの。",
            "{word}が困った時、誰かに相談するのか、自分で考えるのか気になるな。普段と違う場面では、まだ知らないところが見えるかもしれないの。",
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
            "{word}には、すごいと思うところがあるんだね。ぼくは、全部を真似するより、一つできそうなところを探したいな。どうやってできるようになったかも気になるの。",
            "{word}のすごいところを、自分にも少し取り入れるなら何ができるかな。ぼくは、結果だけ真似するより、続けたことや工夫を知りたいの。",
          ),
          makeChoice(
            "COMMANDER_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "{word}の判断には、言いたいことがあるんだね。ぼくは、どこで別の選び方ができたか考えたいな。その時に分かっていたことも確かめたいの。",
            "{word}の判断を考えるなら、ほかに選べた方法も知りたいな。ぼくは、結果だけでなく、その方法で何が起きそうだったかも比べたいの。",
          ),
          makeChoice(
            "COMMANDER_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "{word}は、失敗からも学びたいんだね。ぼくは、どこで気付き、次に何を変えたか知りたいな。失敗したことだけで終わらず、その後も考えたいの。",
            "{word}の失敗では、何を変えればよかったんだろう。ぼくは、同じことを繰り返さないために使える工夫を考えてみたいな。",
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
            "{word}は、成し遂げたことが気になるんだね。ぼくは、その前の苦労や工夫も知りたいな。結果を知るだけでは分からないこともありそうなの。",
            "{word}が結果を出すまでに、何を工夫したんだろう。ぼくは、一人でできたことか、誰かの助けがあったのかも気になるの。",
          ),
          makeChoice(
            "STRATEGIST_DEC", "判断・失敗", "decision",
            "判断や失敗が気になる",
            "{word}は、大事な判断が気になるんだね。ぼくは、その時に選べた方法を比べてみたいな。結果を知らない立場なら、違う選び方をするかもしれないの。",
            "{word}がその方法を選んだ時、何を一番大事にしていたんだろう。ぼくならどうするかも、当時分かっていたことから考えたいな。",
          ),
          makeChoice(
            "STRATEGIST_LIFE", "性格・生き方", "personality",
            "性格や生き方が気になる",
            "{word}は、人柄や考え方が気になるんだね。普段の話だけじゃなく、困った時にどうするかも知りたいな。一つの場面だけで、その人の全部は決められないと思うの。",
            "{word}が困った時、誰かに相談するのか、自分で考えるのか気になるな。普段と違う場面では、まだ知らないところが見えるかもしれないの。",
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
            "{word}には、すごいと思うところがあるんだね。ぼくは、全部を真似するより、一つできそうなところを探したいな。どうやってできるようになったかも気になるの。",
            "{word}のすごいところを、自分にも少し取り入れるなら何ができるかな。ぼくは、結果だけ真似するより、続けたことや工夫を知りたいの。",
          ),
          makeChoice(
            "STRATEGIST_DEB", "判断に言いたいことがある", "debate",
            "判断に言いたいことがある",
            "{word}の判断には、言いたいことがあるんだね。ぼくは、どこで別の選び方ができたか考えたいな。その時に分かっていたことも確かめたいの。",
            "{word}の判断を考えるなら、ほかに選べた方法も知りたいな。ぼくは、結果だけでなく、その方法で何が起きそうだったかも比べたいの。",
          ),
          makeChoice(
            "STRATEGIST_LEARN", "失敗から学びたい", "learn",
            "失敗から学びたい",
            "{word}は、失敗からも学びたいんだね。ぼくは、どこで気付き、次に何を変えたか知りたいな。失敗したことだけで終わらず、その後も考えたいの。",
            "{word}の失敗では、何を変えればよかったんだろう。ぼくは、同じことを繰り返さないために使える工夫を考えてみたいな。",
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
            "{word}は、始まった理由が気になるんだね。ぼくは、一つの原因だけで説明できるか考えてみたいな。その前に続いていた問題も関係しているかもしれないの。",
            "{word}が始まる前には、どんな問題があったんだろう。ぼくは、きっかけになった出来事と、その前からの理由を分けて知りたいな。",
          ),
          makeChoice(
            "BATTLE_TURN", "流れが変わった瞬間", "turning_point",
            "流れが変わった瞬間が気になる",
            "{word}は、流れが変わった時が気になるんだね。ぼくは、急に変わったのか、その前から少しずつ変化していたのか知りたいな。前後を比べると分かることがありそうなの。",
            "{word}の流れが変わる前には、何が起きていたんだろう。ぼくは、一つの出来事だけでなく、その前の準備も気になるの。",
          ),
          makeChoice(
            "BATTLE_AFTER", "その後の影響", "aftermath",
            "その後の影響が気になる",
            "{word}は、その後の影響が気になるんだね。ぼくは、すぐに起きた変化と、時間がたってからの変化を分けて知りたいな。場所や人によって違う影響もありそうなの。",
            "{word}のあとに起きた変化は、誰にとって大きかったんだろう。ぼくは、良くなったところだけでなく、困ったところも考えたいな。",
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
            "{word}は、そこにいる人に注目するんだね。ぼくは、その人が何を考えて動いたか知りたいな。全体の話も、一人の立場から見ると違って感じるかもしれないの。",
            "{word}の中で、誰の立場から見るかで分かることは変わるかな。ぼくは、一人だけでなく周りの人の考えも知りたいの。",
          ),
          makeChoice(
            "BATTLE_STRAT", "戦略・動き", "strategy",
            "戦略や動きが気になる",
            "{word}は、戦略や動きが気になるんだね。ぼくは、何を目標にして、どんな手段を選んだか知りたいな。狙ったことと実際に起きたことは、同じとは限らないと思うの。",
            "{word}では、どんな予想からその動きを選んだんだろう。ぼくは、相手の反応が違った時にどう変えたかも知りたいの。",
          ),
          makeChoice(
            "BATTLE_SYMB", "歴史上の意味", "symbol",
            "歴史上の意味が気になる",
            "{word}は、歴史の中での意味が気になるんだね。ぼくは、前と後で何が変わったのかを知りたいな。一つの出来事が、ほかの話へどうつながったかも気になるの。",
            "{word}の前後を比べたら、歴史のどんな変化が見えるんだろう。ぼくは、大事だと言われる理由を自分でも考えてみたいな。",
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
            "{word}は、始まった理由が気になるんだね。ぼくは、一つの原因だけで説明できるか考えてみたいな。その前に続いていた問題も関係しているかもしれないの。",
            "{word}が始まる前には、どんな問題があったんだろう。ぼくは、きっかけになった出来事と、その前からの理由を分けて知りたいな。",
          ),
          makeChoice(
            "WAR_TURN", "流れが変わった瞬間", "turning_point",
            "流れが変わった瞬間が気になる",
            "{word}は、流れが変わった時が気になるんだね。ぼくは、急に変わったのか、その前から少しずつ変化していたのか知りたいな。前後を比べると分かることがありそうなの。",
            "{word}の流れが変わる前には、何が起きていたんだろう。ぼくは、一つの出来事だけでなく、その前の準備も気になるの。",
          ),
          makeChoice(
            "WAR_AFTER", "その後の影響", "aftermath",
            "その後の影響が気になる",
            "{word}は、その後の影響が気になるんだね。ぼくは、すぐに起きた変化と、時間がたってからの変化を分けて知りたいな。場所や人によって違う影響もありそうなの。",
            "{word}のあとに起きた変化は、誰にとって大きかったんだろう。ぼくは、良くなったところだけでなく、困ったところも考えたいな。",
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
            "{word}は、そこにいる人に注目するんだね。ぼくは、その人が何を考えて動いたか知りたいな。全体の話も、一人の立場から見ると違って感じるかもしれないの。",
            "{word}の中で、誰の立場から見るかで分かることは変わるかな。ぼくは、一人だけでなく周りの人の考えも知りたいの。",
          ),
          makeChoice(
            "WAR_STRAT", "戦略・動き", "strategy",
            "戦略や動きが気になる",
            "{word}は、戦略や動きが気になるんだね。ぼくは、何を目標にして、どんな手段を選んだか知りたいな。狙ったことと実際に起きたことは、同じとは限らないと思うの。",
            "{word}では、どんな予想からその動きを選んだんだろう。ぼくは、相手の反応が違った時にどう変えたかも知りたいの。",
          ),
          makeChoice(
            "WAR_SYMB", "歴史上の意味", "symbol",
            "歴史上の意味が気になる",
            "{word}は、歴史の中での意味が気になるんだね。ぼくは、前と後で何が変わったのかを知りたいな。一つの出来事が、ほかの話へどうつながったかも気になるの。",
            "{word}の前後を比べたら、歴史のどんな変化が見えるんだろう。ぼくは、大事だと言われる理由を自分でも考えてみたいな。",
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
            "{word}は、上に立った人たちが気になるんだね。ぼくは、何を大事にして決めたのか知りたいな。同じ立場でも、選び方は人によって違いそうなの。",
            "{word}を動かした人たちは、どんな考えで決めていたんだろう。ぼくは、その決定を受けた人の暮らしも気になるの。",
          ),
          makeChoice(
            "DYNASTY_STATE_SYS", "制度・仕組み", "system",
            "制度や仕組みが面白い",
            "{word}は、制度や仕組みが気になるんだね。ぼくは、どんな問題を解決するための決まりだったか知りたいな。決まりを作る前と後で、暮らしがどう変わるかも気になるの。",
            "{word}の決まりは、誰にどんな影響があったんだろう。ぼくは、便利になった人と、困った人の両方から考えたいな。",
          ),
          makeChoice(
            "DYNASTY_STATE_CULT", "文化・暮らし", "culture",
            "文化や暮らしが面白い",
            "{word}は、文化や暮らしが気になるんだね。ぼくは、食べ物や仕事や遊びを今と比べてみたいな。違うところだけでなく、似ているところもありそうなの。",
            "{word}の暮らしは、今のぼくたちとどんなところが違うんだろう。毎日のことを知ると、遠い時代も考えやすくなりそうなの。",
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
            "{word}は、始まっていく時期が気になるんだね。ぼくは、最初から今の形が決まっていたのか知りたいな。途中で考え直したところもあるかもしれないの。",
            "{word}が始まる時、どんな問題を解決しようとしていたんだろう。ぼくは、最初の計画と後の形の違いも気になるの。",
          ),
          makeChoice(
            "DYNASTY_STATE_PEAK", "一番強い時", "peak",
            "最盛期が気になる",
            "{word}は、一番栄えていた頃が気になるんだね。ぼくは、それを支えた仕事や決まりも知りたいな。大きく見える成果の裏にも、普段の工夫がありそうなの。",
            "{word}が栄えていた頃には、何が上手くいっていたんだろう。ぼくは、長く続けられた理由と、難しかったところの両方を知りたいな。",
          ),
          makeChoice(
            "DYNASTY_STATE_FALL", "崩れていく時", "fall",
            "衰退や終わりが気になる",
            "{word}は、衰えていく時期が気になるんだね。ぼくは、一つの出来事だけで終わったのか、その前から問題があったのか知りたいな。その時の人が何を変えようとしたかも気になるの。",
            "{word}が終わる前には、どんな問題が重なっていたんだろう。ぼくは、あとから分かる原因と、当時気付けたことを分けて考えたいな。",
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
            "{word}は、書かれた言葉や形が気になるんだね。ぼくは、どんな意味でその言葉を使ったか知りたいな。今と同じ文字でも、当時は違う意味だったかもしれないの。",
            "{word}の言葉は、当時どんな意味で使われていたんだろう。ぼくは、今の意味だけで読み違えないように、前後も確かめたいな。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_CTX", "作られた事情", "context",
            "作られた事情が気になる",
            "{word}は、作られた理由が気になるんだね。ぼくは、誰が誰に伝えるためのものだったか知りたいな。その事情を知ると、同じ言葉でも見方が変わりそうなの。",
            "{word}が作られた時、何を伝えたり決めたりしたかったんだろう。ぼくは、読む相手が誰だったかも一緒に考えたいな。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_IMPACT", "後への影響", "impact",
            "後への影響が気になる",
            "{word}は、後の時代への影響が気になるんだね。ぼくは、どんな人が使い、何が変わったか知りたいな。作った時の狙いとは違う使われ方もあったかもしれないの。",
            "{word}を後の人が使う時、もとの意味はそのまま残ったのかな。ぼくは、受け取る時代で何が変わったか考えてみたいの。",
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
            "{word}は、資料として確かめたいんだね。ぼくは、書いてあることから何が分かるか、一つずつ見てみたいな。書いていないことは、分からないまま残しておきたいの。",
            "{word}から確かに分かることは、どこまでなんだろう。ぼくは、書かれたことと、あとから考えたことを分けて読みたいな。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_DOUBT", "疑いながら見る", "doubt",
            "疑いながら見る",
            "{word}は、疑問を持ちながら見るんだね。ぼくは、誰が何のために書いたかも確かめたいな。全部が間違いと決めるより、別の資料と合うところを探したいの。",
            "{word}の話は、ほかの資料でも確かめられるかな。ぼくは、疑うだけでなく、確かだと考えられる理由も知りたいの。",
          ),
          makeChoice(
            "HISTORICAL_DOCUMENT_COMPARE", "別の資料と比べたい", "compare",
            "別の資料と比べたい",
            "{word}は、ほかの資料と比べたいんだね。ぼくは、同じ出来事をどう書いているか気になるの。違うところがあれば、書いた人の立場や時期も確かめたいな。",
            "{word}と別の資料が違うことを伝えていたら、どちらの理由も知りたいな。ぼくは、誰がいつ書いたかを確かめてから考えたいの。",
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
            "{word}は、書かれた言葉や形が気になるんだね。ぼくは、どんな意味でその言葉を使ったか知りたいな。今と同じ文字でも、当時は違う意味だったかもしれないの。",
            "{word}の言葉は、当時どんな意味で使われていたんだろう。ぼくは、今の意味だけで読み違えないように、前後も確かめたいな。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_CTX", "作られた事情", "context",
            "作られた事情が気になる",
            "{word}は、作られた理由が気になるんだね。ぼくは、誰が誰に伝えるためのものだったか知りたいな。その事情を知ると、同じ言葉でも見方が変わりそうなの。",
            "{word}が作られた時、何を伝えたり決めたりしたかったんだろう。ぼくは、読む相手が誰だったかも一緒に考えたいな。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_IMPACT", "後への影響", "impact",
            "後への影響が気になる",
            "{word}は、後の時代への影響が気になるんだね。ぼくは、どんな人が使い、何が変わったか知りたいな。作った時の狙いとは違う使われ方もあったかもしれないの。",
            "{word}を後の人が使う時、もとの意味はそのまま残ったのかな。ぼくは、受け取る時代で何が変わったか考えてみたいの。",
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
            "{word}は、資料として確かめたいんだね。ぼくは、書いてあることから何が分かるか、一つずつ見てみたいな。書いていないことは、分からないまま残しておきたいの。",
            "{word}から確かに分かることは、どこまでなんだろう。ぼくは、書かれたことと、あとから考えたことを分けて読みたいな。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_DOUBT", "疑いながら見る", "doubt",
            "疑いながら見る",
            "{word}は、疑問を持ちながら見るんだね。ぼくは、誰が何のために書いたかも確かめたいな。全部が間違いと決めるより、別の資料と合うところを探したいの。",
            "{word}の話は、ほかの資料でも確かめられるかな。ぼくは、疑うだけでなく、確かだと考えられる理由も知りたいの。",
          ),
          makeChoice(
            "HISTORICAL_ARTIFACT_COMPARE", "別の資料と比べたい", "compare",
            "別の資料と比べたい",
            "{word}は、ほかの資料と比べたいんだね。ぼくは、同じ出来事をどう書いているか気になるの。違うところがあれば、書いた人の立場や時期も確かめたいな。",
            "{word}と別の資料が違うことを伝えていたら、どちらの理由も知りたいな。ぼくは、誰がいつ書いたかを確かめてから考えたいの。",
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
            "{word}は、発見や発明が気になるんだね。ぼくは、その前に何が分かっていなかったかも知りたいな。答えを見つけた工夫が分かると、もっと面白そうなの。",
            "{word}の発見では、それまでの考えと何が変わったんだろう。ぼくは、気付くきっかけや確かめ方も知りたいな。",
          ),
          makeChoice(
            "SCIENTIST_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "{word}は、調べ方や作り方が気になるんだね。ぼくは、何を変えて何を同じにしたか知りたいな。同じ手順でもう一度できるかも気になるの。",
            "{word}の調べ方では、どうやって違いを確かめたんだろう。ぼくは、一度上手くいっただけでなく、繰り返して確かめる工夫も知りたいな。",
          ),
          makeChoice(
            "SCIENTIST_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "{word}は、間違えたところも気になるんだね。ぼくは、何を予想して、どこで違うと分かったか知りたいな。間違いを直した理由まで分かると、自分でも考えやすそうなの。",
            "{word}の失敗では、予想と実際のどこが違ったんだろう。ぼくは、次に変えたことを知ると、試す時の参考になりそうだと思うの。",
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
            "{word}は、どんな結果が出たかを大事に見るんだね。ぼくは、その結果をどう確かめたかも知りたいな。予想した通りかどうかだけでなく、新しく分かったことも気になるの。",
            "{word}の結果は、何を確かめて分かったことなんだろう。ぼくは、できたことと、まだ分からないことを分けて見たいな。",
          ),
          makeChoice(
            "SCIENTIST_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "{word}は、途中の工夫を大事に見るんだね。ぼくは、何度も試す中でどこを変えたのか知りたいな。続けた回数だけでなく、考え直したことも大事そうなの。",
            "{word}が試している途中で、何を変えると結果が違ったんだろう。ぼくは、うまくいかなかった時の考え直し方も知りたいな。",
          ),
          makeChoice(
            "SCIENTIST_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "{word}は、本人の考え方にも注目するんだね。ぼくは、何を疑問に思って調べ始めたのか知りたいな。できた結果からだけでは分からない理由もありそうなの。",
            "{word}は、何を大事な問題だと考えたんだろう。ぼくは、結果を見る前に、調べ始めた理由も知りたいな。",
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
            "{word}は、発見や発明が気になるんだね。ぼくは、その前に何が分かっていなかったかも知りたいな。答えを見つけた工夫が分かると、もっと面白そうなの。",
            "{word}の発見では、それまでの考えと何が変わったんだろう。ぼくは、気付くきっかけや確かめ方も知りたいな。",
          ),
          makeChoice(
            "PHILOSOPHER_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "{word}は、調べ方や作り方が気になるんだね。ぼくは、何を変えて何を同じにしたか知りたいな。同じ手順でもう一度できるかも気になるの。",
            "{word}の調べ方では、どうやって違いを確かめたんだろう。ぼくは、一度上手くいっただけでなく、繰り返して確かめる工夫も知りたいな。",
          ),
          makeChoice(
            "PHILOSOPHER_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "{word}は、間違えたところも気になるんだね。ぼくは、何を予想して、どこで違うと分かったか知りたいな。間違いを直した理由まで分かると、自分でも考えやすそうなの。",
            "{word}の失敗では、予想と実際のどこが違ったんだろう。ぼくは、次に変えたことを知ると、試す時の参考になりそうだと思うの。",
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
            "{word}は、どんな結果が出たかを大事に見るんだね。ぼくは、その結果をどう確かめたかも知りたいな。予想した通りかどうかだけでなく、新しく分かったことも気になるの。",
            "{word}の結果は、何を確かめて分かったことなんだろう。ぼくは、できたことと、まだ分からないことを分けて見たいな。",
          ),
          makeChoice(
            "PHILOSOPHER_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "{word}は、途中の工夫を大事に見るんだね。ぼくは、何度も試す中でどこを変えたのか知りたいな。続けた回数だけでなく、考え直したことも大事そうなの。",
            "{word}が試している途中で、何を変えると結果が違ったんだろう。ぼくは、うまくいかなかった時の考え直し方も知りたいな。",
          ),
          makeChoice(
            "PHILOSOPHER_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "{word}は、本人の考え方にも注目するんだね。ぼくは、何を疑問に思って調べ始めたのか知りたいな。できた結果からだけでは分からない理由もありそうなの。",
            "{word}は、何を大事な問題だと考えたんだろう。ぼくは、結果を見る前に、調べ始めた理由も知りたいな。",
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
            "{word}は、発見や発明が気になるんだね。ぼくは、その前に何が分かっていなかったかも知りたいな。答えを見つけた工夫が分かると、もっと面白そうなの。",
            "{word}の発見では、それまでの考えと何が変わったんだろう。ぼくは、気付くきっかけや確かめ方も知りたいな。",
          ),
          makeChoice(
            "INVENTOR_METHOD", "調べ方・作り方", "method",
            "調べ方や作り方が気になる",
            "{word}は、調べ方や作り方が気になるんだね。ぼくは、何を変えて何を同じにしたか知りたいな。同じ手順でもう一度できるかも気になるの。",
            "{word}の調べ方では、どうやって違いを確かめたんだろう。ぼくは、一度上手くいっただけでなく、繰り返して確かめる工夫も知りたいな。",
          ),
          makeChoice(
            "INVENTOR_FAIL", "失敗・間違い", "failure",
            "失敗や間違いが気になる",
            "{word}は、間違えたところも気になるんだね。ぼくは、何を予想して、どこで違うと分かったか知りたいな。間違いを直した理由まで分かると、自分でも考えやすそうなの。",
            "{word}の失敗では、予想と実際のどこが違ったんだろう。ぼくは、次に変えたことを知ると、試す時の参考になりそうだと思うの。",
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
            "{word}は、どんな結果が出たかを大事に見るんだね。ぼくは、その結果をどう確かめたかも知りたいな。予想した通りかどうかだけでなく、新しく分かったことも気になるの。",
            "{word}の結果は、何を確かめて分かったことなんだろう。ぼくは、できたことと、まだ分からないことを分けて見たいな。",
          ),
          makeChoice(
            "INVENTOR_PROCESS", "過程・試行錯誤", "process",
            "過程や試行錯誤を重く見る",
            "{word}は、途中の工夫を大事に見るんだね。ぼくは、何度も試す中でどこを変えたのか知りたいな。続けた回数だけでなく、考え直したことも大事そうなの。",
            "{word}が試している途中で、何を変えると結果が違ったんだろう。ぼくは、うまくいかなかった時の考え直し方も知りたいな。",
          ),
          makeChoice(
            "INVENTOR_PERSON", "本人の考え方", "personality",
            "本人の考え方が気になる",
            "{word}は、本人の考え方にも注目するんだね。ぼくは、何を疑問に思って調べ始めたのか知りたいな。できた結果からだけでは分からない理由もありそうなの。",
            "{word}は、何を大事な問題だと考えたんだろう。ぼくは、結果を見る前に、調べ始めた理由も知りたいな。",
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
            "{word}は、意味をはっきり知りたいんだね。ぼくは、当てはまる例と当てはまらない例を比べてみたいな。境目が分かると、自分で使いやすくなりそうなの。",
            "{word}は、どんな例には当てはまって、どんな例には当てはまらないんだろう。ぼくは、その違いを知ると意味が分かりやすくなりそうだと思うの。",
          ),
          makeChoice(
            "SPECIALIST_TERM_EVID", "なぜそう言えるか", "evidence",
            "根拠を知りたい",
            "{word}は、そう考える根拠を知りたいんだね。ぼくは、何を見たり比べたりして分かったか気になるの。説明が分かりやすくても、確かめた理由は別に知りたいな。",
            "{word}について、何を確かめればその説明を信じられるんだろう。ぼくは、分かりやすい話と、確かだと考えられる話を分けて見たいの。",
          ),
          makeChoice(
            "SPECIALIST_TERM_USE", "何に使えるか", "use",
            "使い道を知りたい",
            "{word}は、何に使えるか気になるんだね。ぼくは、実際の場面でどう役立つか知りたいな。使えそうに見えても、合わない場合は確かめたいの。",
            "{word}を使うなら、どんな場面が合うんだろう。ぼくは、できることと、気を付けることを一緒に知りたいな。",
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
            "{word}で知ったことを、実際に役立てたいんだね。ぼくは、身近な場面を一つ選んで考えてみたいな。説明通りになるか、気を付ける条件があるかも確かめたいの。",
            "{word}で知ったことは、身近などんな場面に使えるかな。ぼくは、分かったつもりで終わらせず、一つの例で考えてみたいの。",
          ),
          makeChoice(
            "SPECIALIST_TERM_CUR", "ただ面白い", "curiosity",
            "純粋に面白い",
            "{word}は、知ること自体が面白いんだね。ぼくは、すぐ役に立たなくても考える意味はあると思うの。一つ分かると、別の疑問も出てきそうなの。",
            "{word}について一つ分かったら、次に何が気になるかな。ぼくは、使い道を急いで決めず、もう少し考えていたいの。",
          ),
          makeChoice(
            "SPECIALIST_TERM_EXPL", "人に説明したい", "explain",
            "人に説明できるようになりたい",
            "{word}は、人に説明できるようになりたいんだね。ぼくは、身近な例で話せると伝わりやすいと思うの。説明してみると、自分がまだ分かっていないところも見つかりそうなの。",
            "{word}を知らない相手へ話すなら、どんな例が伝わりやすいかな。ぼくは、難しい言葉を使わずに説明してみたいの。",
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
            "{word}は、意味をはっきり知りたいんだね。ぼくは、当てはまる例と当てはまらない例を比べてみたいな。境目が分かると、自分で使いやすくなりそうなの。",
            "{word}は、どんな例には当てはまって、どんな例には当てはまらないんだろう。ぼくは、その違いを知ると意味が分かりやすくなりそうだと思うの。",
          ),
          makeChoice(
            "RESEARCH_FIELD_EVID", "なぜそう言えるか", "evidence",
            "根拠を知りたい",
            "{word}は、そう考える根拠を知りたいんだね。ぼくは、何を見たり比べたりして分かったか気になるの。説明が分かりやすくても、確かめた理由は別に知りたいな。",
            "{word}について、何を確かめればその説明を信じられるんだろう。ぼくは、分かりやすい話と、確かだと考えられる話を分けて見たいの。",
          ),
          makeChoice(
            "RESEARCH_FIELD_USE", "何に使えるか", "use",
            "使い道を知りたい",
            "{word}は、何に使えるか気になるんだね。ぼくは、実際の場面でどう役立つか知りたいな。使えそうに見えても、合わない場合は確かめたいの。",
            "{word}を使うなら、どんな場面が合うんだろう。ぼくは、できることと、気を付けることを一緒に知りたいな。",
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
            "{word}で知ったことを、実際に役立てたいんだね。ぼくは、身近な場面を一つ選んで考えてみたいな。説明通りになるか、気を付ける条件があるかも確かめたいの。",
            "{word}で知ったことは、身近などんな場面に使えるかな。ぼくは、分かったつもりで終わらせず、一つの例で考えてみたいの。",
          ),
          makeChoice(
            "RESEARCH_FIELD_CUR", "ただ面白い", "curiosity",
            "純粋に面白い",
            "{word}は、知ること自体が面白いんだね。ぼくは、すぐ役に立たなくても考える意味はあると思うの。一つ分かると、別の疑問も出てきそうなの。",
            "{word}について一つ分かったら、次に何が気になるかな。ぼくは、使い道を急いで決めず、もう少し考えていたいの。",
          ),
          makeChoice(
            "RESEARCH_FIELD_EXPL", "人に説明したい", "explain",
            "人に説明できるようになりたい",
            "{word}は、人に説明できるようになりたいんだね。ぼくは、身近な例で話せると伝わりやすいと思うの。説明してみると、自分がまだ分かっていないところも見つかりそうなの。",
            "{word}を知らない相手へ話すなら、どんな例が伝わりやすいかな。ぼくは、難しい言葉を使わずに説明してみたいの。",
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
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "MYTH_FIGURE_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "{word}は、力や表している意味が面白いんだね。ぼくは、その力がどんなお話に関わるか知りたいな。ただ強いだけでは説明できないところもありそうなの。",
            "{word}の力は、お話の中でどんな意味を持つんだろう。ぼくは、何ができるかだけでなく、なぜその力が出てくるかも気になるの。",
          ),
          makeChoice(
            "MYTH_FIGURE_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "{word}は、生まれた理由や土地が気になるんだね。ぼくは、そこでの暮らしや困りごとと関係しているか知りたいな。同じ名前でも、場所で話が違う場合はありそうなの。",
            "{word}の話は、その土地のどんな暮らしとつながっているんだろう。ぼくは、別の場所に似た話があるかも比べてみたいな。",
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
            "{word}は、少し怖く感じるんだね。ぼくは、何が怖いのか分けて考えてみたいな。見た目より、何をするか分からないことが気になる場合もありそうなの。",
            "{word}を怖いと感じるのは、どんなところからなんだろう。ぼくは、姿の怖さと、お話で起きることの怖さを比べてみたいな。",
          ),
          makeChoice(
            "MYTH_FIGURE_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "{word}は、不思議で面白い感じなんだね。ぼくは、普通なら起きないことがどこで出てくるか気になるの。その話を考えた理由も知りたいな。",
            "{word}のお話では、どうしてその変わった出来事が起きるんだろう。ぼくは、面白さの理由も少し考えてみたいの。",
          ),
          makeChoice(
            "MYTH_FIGURE_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "{word}は、何かを表すところが気になるんだね。ぼくは、何を伝えるためのものか知りたいな。形や名前と意味がどうつながるかも考えてみたいの。",
            "{word}は、どんな考えや気持ちを表しているんだろう。ぼくは、形やお話から、その意味が分かるか考えたいな。",
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
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "DEITY_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "{word}は、力や表している意味が面白いんだね。ぼくは、その力がどんなお話に関わるか知りたいな。ただ強いだけでは説明できないところもありそうなの。",
            "{word}の力は、お話の中でどんな意味を持つんだろう。ぼくは、何ができるかだけでなく、なぜその力が出てくるかも気になるの。",
          ),
          makeChoice(
            "DEITY_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "{word}は、生まれた理由や土地が気になるんだね。ぼくは、そこでの暮らしや困りごとと関係しているか知りたいな。同じ名前でも、場所で話が違う場合はありそうなの。",
            "{word}の話は、その土地のどんな暮らしとつながっているんだろう。ぼくは、別の場所に似た話があるかも比べてみたいな。",
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
            "{word}は、少し怖く感じるんだね。ぼくは、何が怖いのか分けて考えてみたいな。見た目より、何をするか分からないことが気になる場合もありそうなの。",
            "{word}を怖いと感じるのは、どんなところからなんだろう。ぼくは、姿の怖さと、お話で起きることの怖さを比べてみたいな。",
          ),
          makeChoice(
            "DEITY_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "{word}は、不思議で面白い感じなんだね。ぼくは、普通なら起きないことがどこで出てくるか気になるの。その話を考えた理由も知りたいな。",
            "{word}のお話では、どうしてその変わった出来事が起きるんだろう。ぼくは、面白さの理由も少し考えてみたいの。",
          ),
          makeChoice(
            "DEITY_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "{word}は、何かを表すところが気になるんだね。ぼくは、何を伝えるためのものか知りたいな。形や名前と意味がどうつながるかも考えてみたいの。",
            "{word}は、どんな考えや気持ちを表しているんだろう。ぼくは、形やお話から、その意味が分かるか考えたいな。",
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
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "YOKAI_MONSTER_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "{word}は、力や表している意味が面白いんだね。ぼくは、その力がどんなお話に関わるか知りたいな。ただ強いだけでは説明できないところもありそうなの。",
            "{word}の力は、お話の中でどんな意味を持つんだろう。ぼくは、何ができるかだけでなく、なぜその力が出てくるかも気になるの。",
          ),
          makeChoice(
            "YOKAI_MONSTER_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "{word}は、生まれた理由や土地が気になるんだね。ぼくは、そこでの暮らしや困りごとと関係しているか知りたいな。同じ名前でも、場所で話が違う場合はありそうなの。",
            "{word}の話は、その土地のどんな暮らしとつながっているんだろう。ぼくは、別の場所に似た話があるかも比べてみたいな。",
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
            "{word}は、少し怖く感じるんだね。ぼくは、何が怖いのか分けて考えてみたいな。見た目より、何をするか分からないことが気になる場合もありそうなの。",
            "{word}を怖いと感じるのは、どんなところからなんだろう。ぼくは、姿の怖さと、お話で起きることの怖さを比べてみたいな。",
          ),
          makeChoice(
            "YOKAI_MONSTER_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "{word}は、不思議で面白い感じなんだね。ぼくは、普通なら起きないことがどこで出てくるか気になるの。その話を考えた理由も知りたいな。",
            "{word}のお話では、どうしてその変わった出来事が起きるんだろう。ぼくは、面白さの理由も少し考えてみたいの。",
          ),
          makeChoice(
            "YOKAI_MONSTER_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "{word}は、何かを表すところが気になるんだね。ぼくは、何を伝えるためのものか知りたいな。形や名前と意味がどうつながるかも考えてみたいの。",
            "{word}は、どんな考えや気持ちを表しているんだろう。ぼくは、形やお話から、その意味が分かるか考えたいな。",
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
            "{word}は、お話の流れが気になるんだね。ぼくは、最後にどうなるかだけじゃなくて、途中で何を選んだのかも知りたいな。同じ結末でも、そこまでの出来事で感じ方が変わりそうなの。",
            "{word}のお話では、どこから先が気になり始めるんだろう。ぼくは、登場人物が迷って何かを決める場面に注目してみたいな。",
          ),
          makeChoice(
            "LEGEND_POWER", "力・象徴", "power",
            "力や象徴が面白い",
            "{word}は、力や表している意味が面白いんだね。ぼくは、その力がどんなお話に関わるか知りたいな。ただ強いだけでは説明できないところもありそうなの。",
            "{word}の力は、お話の中でどんな意味を持つんだろう。ぼくは、何ができるかだけでなく、なぜその力が出てくるかも気になるの。",
          ),
          makeChoice(
            "LEGEND_ORIGIN", "由来・土地", "origin",
            "由来や土地が面白い",
            "{word}は、生まれた理由や土地が気になるんだね。ぼくは、そこでの暮らしや困りごとと関係しているか知りたいな。同じ名前でも、場所で話が違う場合はありそうなの。",
            "{word}の話は、その土地のどんな暮らしとつながっているんだろう。ぼくは、別の場所に似た話があるかも比べてみたいな。",
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
            "{word}は、少し怖く感じるんだね。ぼくは、何が怖いのか分けて考えてみたいな。見た目より、何をするか分からないことが気になる場合もありそうなの。",
            "{word}を怖いと感じるのは、どんなところからなんだろう。ぼくは、姿の怖さと、お話で起きることの怖さを比べてみたいな。",
          ),
          makeChoice(
            "LEGEND_FUN", "なんか面白い", "funny",
            "なんか面白い",
            "{word}は、不思議で面白い感じなんだね。ぼくは、普通なら起きないことがどこで出てくるか気になるの。その話を考えた理由も知りたいな。",
            "{word}のお話では、どうしてその変わった出来事が起きるんだろう。ぼくは、面白さの理由も少し考えてみたいの。",
          ),
          makeChoice(
            "LEGEND_SYMB", "象徴として気になる", "symbolic",
            "象徴として気になる",
            "{word}は、何かを表すところが気になるんだね。ぼくは、何を伝えるためのものか知りたいな。形や名前と意味がどうつながるかも考えてみたいの。",
            "{word}は、どんな考えや気持ちを表しているんだろう。ぼくは、形やお話から、その意味が分かるか考えたいな。",
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
            "{word}は、実際の建物や景色を見たいんだね。ぼくは、近くで見た時に何が分かるか気になるの。写真で想像した大きさと違うこともありそうなの。",
            "{word}を実際に見たら、どんな細かいところに気付くかな。ぼくは、写真と同じかどうかより、そこで分かることを探したいの。",
          ),
          makeChoice(
            "LANDMARK_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "{word}は、できた理由や歴史を知りたいんだね。ぼくは、そこで何をしていたかも気になるの。今見える形が、昔の使い方とつながっているかもしれないね。",
            "{word}の昔の使われ方が分かったら、見た目の理由も分かるかな。ぼくは、今の姿と前の役割をつなげて考えたいの。",
          ),
          makeChoice(
            "LANDMARK_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "{word}では、その場所で体験したいんだね。ぼくは、写真だけでは分からない音や広さも気になるの。実際に過ごすと、想像とは違うこともありそうなの。",
            "{word}で過ごしたら、写真を見た時とは何が違うんだろう。ぼくは、そこでしか分からないことを一つ見つけたいな。",
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
            "{word}には、行ったことがあるんだね。ぼくは、写真で見た印象と実際の印象が違うか気になるの。音や人の様子は、行ってみると分かることもありそうなの。",
            "{word}で見たものの中で、帰ってからも残るのは何だろう。ぼくは、写真に写らない音やその時の気持ちも気になるの。",
          ),
          makeChoice(
            "LANDMARK_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "{word}は、実際に行ってみたいんだね。ぼくは、写真で見る時と、その場所で過ごす時の違いが気になるの。最初に何を見たいか考えるのも楽しそうだね。",
            "{word}に行くなら、どんなことを一つ確かめてみたいかな。ぼくは、写真や説明では分からないこともありそうだと思うの。",
          ),
          makeChoice(
            "LANDMARK_RETURN", "また行きたい", "return",
            "また行きたい",
            "{word}は、また行きたくなる場所なんだね。前に知ったところがあると、次は別のところも見られそうなの。ぼくは、同じ場所で何が変わったか比べたいな。",
            "{word}にもう一度行くなら、前とは違うところも見てみたいな。知っている場所でも、時期が変わると新しく分かることがありそうなの。",
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
            "{word}は、実際の建物や景色を見たいんだね。ぼくは、近くで見た時に何が分かるか気になるの。写真で想像した大きさと違うこともありそうなの。",
            "{word}を実際に見たら、どんな細かいところに気付くかな。ぼくは、写真と同じかどうかより、そこで分かることを探したいの。",
          ),
          makeChoice(
            "MUSEUM_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "{word}は、できた理由や歴史を知りたいんだね。ぼくは、そこで何をしていたかも気になるの。今見える形が、昔の使い方とつながっているかもしれないね。",
            "{word}の昔の使われ方が分かったら、見た目の理由も分かるかな。ぼくは、今の姿と前の役割をつなげて考えたいの。",
          ),
          makeChoice(
            "MUSEUM_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "{word}では、その場所で体験したいんだね。ぼくは、写真だけでは分からない音や広さも気になるの。実際に過ごすと、想像とは違うこともありそうなの。",
            "{word}で過ごしたら、写真を見た時とは何が違うんだろう。ぼくは、そこでしか分からないことを一つ見つけたいな。",
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
            "{word}には、行ったことがあるんだね。ぼくは、写真で見た印象と実際の印象が違うか気になるの。音や人の様子は、行ってみると分かることもありそうなの。",
            "{word}で見たものの中で、帰ってからも残るのは何だろう。ぼくは、写真に写らない音やその時の気持ちも気になるの。",
          ),
          makeChoice(
            "MUSEUM_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "{word}は、実際に行ってみたいんだね。ぼくは、写真で見る時と、その場所で過ごす時の違いが気になるの。最初に何を見たいか考えるのも楽しそうだね。",
            "{word}に行くなら、どんなことを一つ確かめてみたいかな。ぼくは、写真や説明では分からないこともありそうだと思うの。",
          ),
          makeChoice(
            "MUSEUM_RETURN", "また行きたい", "return",
            "また行きたい",
            "{word}は、また行きたくなる場所なんだね。前に知ったところがあると、次は別のところも見られそうなの。ぼくは、同じ場所で何が変わったか比べたいな。",
            "{word}にもう一度行くなら、前とは違うところも見てみたいな。知っている場所でも、時期が変わると新しく分かることがありそうなの。",
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
            "{word}は、実際の建物や景色を見たいんだね。ぼくは、近くで見た時に何が分かるか気になるの。写真で想像した大きさと違うこともありそうなの。",
            "{word}を実際に見たら、どんな細かいところに気付くかな。ぼくは、写真と同じかどうかより、そこで分かることを探したいの。",
          ),
          makeChoice(
            "CASTLE_RUIN_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "{word}は、できた理由や歴史を知りたいんだね。ぼくは、そこで何をしていたかも気になるの。今見える形が、昔の使い方とつながっているかもしれないね。",
            "{word}の昔の使われ方が分かったら、見た目の理由も分かるかな。ぼくは、今の姿と前の役割をつなげて考えたいの。",
          ),
          makeChoice(
            "CASTLE_RUIN_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "{word}では、その場所で体験したいんだね。ぼくは、写真だけでは分からない音や広さも気になるの。実際に過ごすと、想像とは違うこともありそうなの。",
            "{word}で過ごしたら、写真を見た時とは何が違うんだろう。ぼくは、そこでしか分からないことを一つ見つけたいな。",
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
            "{word}には、行ったことがあるんだね。ぼくは、写真で見た印象と実際の印象が違うか気になるの。音や人の様子は、行ってみると分かることもありそうなの。",
            "{word}で見たものの中で、帰ってからも残るのは何だろう。ぼくは、写真に写らない音やその時の気持ちも気になるの。",
          ),
          makeChoice(
            "CASTLE_RUIN_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "{word}は、実際に行ってみたいんだね。ぼくは、写真で見る時と、その場所で過ごす時の違いが気になるの。最初に何を見たいか考えるのも楽しそうだね。",
            "{word}に行くなら、どんなことを一つ確かめてみたいかな。ぼくは、写真や説明では分からないこともありそうだと思うの。",
          ),
          makeChoice(
            "CASTLE_RUIN_RETURN", "また行きたい", "return",
            "また行きたい",
            "{word}は、また行きたくなる場所なんだね。前に知ったところがあると、次は別のところも見られそうなの。ぼくは、同じ場所で何が変わったか比べたいな。",
            "{word}にもう一度行くなら、前とは違うところも見てみたいな。知っている場所でも、時期が変わると新しく分かることがありそうなの。",
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
            "{word}は、実際の建物や景色を見たいんだね。ぼくは、近くで見た時に何が分かるか気になるの。写真で想像した大きさと違うこともありそうなの。",
            "{word}を実際に見たら、どんな細かいところに気付くかな。ぼくは、写真と同じかどうかより、そこで分かることを探したいの。",
          ),
          makeChoice(
            "NAMED_SHOP_HIST", "歴史・由来", "history",
            "歴史や由来が知りたい",
            "{word}は、できた理由や歴史を知りたいんだね。ぼくは、そこで何をしていたかも気になるの。今見える形が、昔の使い方とつながっているかもしれないね。",
            "{word}の昔の使われ方が分かったら、見た目の理由も分かるかな。ぼくは、今の姿と前の役割をつなげて考えたいの。",
          ),
          makeChoice(
            "NAMED_SHOP_EXP", "その場の体験", "experience",
            "その場の体験がしたい",
            "{word}では、その場所で体験したいんだね。ぼくは、写真だけでは分からない音や広さも気になるの。実際に過ごすと、想像とは違うこともありそうなの。",
            "{word}で過ごしたら、写真を見た時とは何が違うんだろう。ぼくは、そこでしか分からないことを一つ見つけたいな。",
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
            "{word}には、行ったことがあるんだね。ぼくは、写真で見た印象と実際の印象が違うか気になるの。音や人の様子は、行ってみると分かることもありそうなの。",
            "{word}で見たものの中で、帰ってからも残るのは何だろう。ぼくは、写真に写らない音やその時の気持ちも気になるの。",
          ),
          makeChoice(
            "NAMED_SHOP_WANT", "まだだけど行きたい", "want",
            "まだ行っていないが行きたい",
            "{word}は、実際に行ってみたいんだね。ぼくは、写真で見る時と、その場所で過ごす時の違いが気になるの。最初に何を見たいか考えるのも楽しそうだね。",
            "{word}に行くなら、どんなことを一つ確かめてみたいかな。ぼくは、写真や説明では分からないこともありそうだと思うの。",
          ),
          makeChoice(
            "NAMED_SHOP_RETURN", "また行きたい", "return",
            "また行きたい",
            "{word}は、また行きたくなる場所なんだね。前に知ったところがあると、次は別のところも見られそうなの。ぼくは、同じ場所で何が変わったか比べたいな。",
            "{word}にもう一度行くなら、前とは違うところも見てみたいな。知っている場所でも、時期が変わると新しく分かることがありそうなの。",
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
            "{word}は、選手やメンバーが気になるんだね。ぼくは、それぞれがどんな役割を持つのか知りたいな。一人の動きがほかの人にどうつながるかも面白そうなの。",
            "{word}の中では、誰がどんな役目を受け持つんだろう。ぼくは、一人の上手さだけでなく、協力する動きも見たいな。",
          ),
          makeChoice(
            "SPORTS_TEAM_STYLE", "戦い方・試合内容", "style",
            "戦い方や試合内容が魅力",
            "{word}は、試合の進め方が気になるんだね。ぼくは、狙ったことがどこで上手くいったか知りたいな。うまくいかない時に変えたことにも注目したいの。",
            "{word}の試合では、どこでやり方を変えるんだろう。ぼくは、点が入る場面だけでなく、その前の判断も見てみたいな。",
          ),
          makeChoice(
            "SPORTS_TEAM_HIST", "歴史・物語", "history",
            "歴史や物語が魅力",
            "{word}は、これまでの歩みが気になるんだね。ぼくは、大事な試合やメンバーの変化も知りたいな。昔のことが今の応援につながる場合もありそうなの。",
            "{word}のこれまでの試合では、どんなことが長く覚えられているんだろう。ぼくは、今の姿につながった出来事も知りたいの。",
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
            "{word}は、応援しているんだね。ぼくは、勝った日だけじゃなく、上手くいかなかったあとも気になるの。次に何を変えるか見たくなりそうなの。",
            "{word}が上手くいかなかったあと、次の試合でどう変わるんだろう。ぼくは、結果だけでなく、立て直す工夫も見てみたいな。",
          ),
          makeChoice(
            "SPORTS_TEAM_WATCH", "気になる時に見る", "watch",
            "気になる時に見る",
            "{word}は、気になる時に見るんだね。ぼくは、見たくなるきっかけが何か知りたいな。毎回追わなくても、興味のあるところを楽しめると思うの。",
            "{word}を見るきっかけは、何が起きた時なんだろう。ぼくは、気になった場面から少し詳しく知ってみたいな。",
          ),
          makeChoice(
            "SPORTS_TEAM_RIVAL", "ライバル側も気になる", "rival",
            "ライバル側も気になる",
            "{word}は、相手側も気になるんだね。ぼくは、両方の工夫を知ると試合が分かりやすくなると思うの。応援する相手と、技術を見たい相手は別でもよさそうなの。",
            "{word}の相手にも上手いところがあったら、試合はもっと気になりそうなの。ぼくは、応援とは別に、お互いの工夫を比べてみたいな。",
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
            "{word}は、選手やメンバーが気になるんだね。ぼくは、それぞれがどんな役割を持つのか知りたいな。一人の動きがほかの人にどうつながるかも面白そうなの。",
            "{word}の中では、誰がどんな役目を受け持つんだろう。ぼくは、一人の上手さだけでなく、協力する動きも見たいな。",
          ),
          makeChoice(
            "TOURNAMENT_STYLE", "戦い方・試合内容", "style",
            "戦い方や試合内容が魅力",
            "{word}は、試合の進め方が気になるんだね。ぼくは、狙ったことがどこで上手くいったか知りたいな。うまくいかない時に変えたことにも注目したいの。",
            "{word}の試合では、どこでやり方を変えるんだろう。ぼくは、点が入る場面だけでなく、その前の判断も見てみたいな。",
          ),
          makeChoice(
            "TOURNAMENT_HIST", "歴史・物語", "history",
            "歴史や物語が魅力",
            "{word}は、これまでの歩みが気になるんだね。ぼくは、大事な試合やメンバーの変化も知りたいな。昔のことが今の応援につながる場合もありそうなの。",
            "{word}のこれまでの試合では、どんなことが長く覚えられているんだろう。ぼくは、今の姿につながった出来事も知りたいの。",
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
            "{word}は、応援しているんだね。ぼくは、勝った日だけじゃなく、上手くいかなかったあとも気になるの。次に何を変えるか見たくなりそうなの。",
            "{word}が上手くいかなかったあと、次の試合でどう変わるんだろう。ぼくは、結果だけでなく、立て直す工夫も見てみたいな。",
          ),
          makeChoice(
            "TOURNAMENT_WATCH", "気になる時に見る", "watch",
            "気になる時に見る",
            "{word}は、気になる時に見るんだね。ぼくは、見たくなるきっかけが何か知りたいな。毎回追わなくても、興味のあるところを楽しめると思うの。",
            "{word}を見るきっかけは、何が起きた時なんだろう。ぼくは、気になった場面から少し詳しく知ってみたいな。",
          ),
          makeChoice(
            "TOURNAMENT_RIVAL", "ライバル側も気になる", "rival",
            "ライバル側も気になる",
            "{word}は、相手側も気になるんだね。ぼくは、両方の工夫を知ると試合が分かりやすくなると思うの。応援する相手と、技術を見たい相手は別でもよさそうなの。",
            "{word}の相手にも上手いところがあったら、試合はもっと気になりそうなの。ぼくは、応援とは別に、お互いの工夫を比べてみたいな。",
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
            "{word}は、作ったものやサービスが気になるんだね。ぼくは、どんな困りごとを減らそうとしたのか知りたいな。新しいことだけでなく、使いやすい工夫も大事そうなの。",
            "{word}の商品やサービスは、何をしたい人に役立つんだろう。ぼくは、できることと、使いやすくした工夫を一緒に知りたいな。",
          ),
          makeChoice(
            "COMPANY_BRAND_DES", "デザイン・見せ方", "design",
            "デザインや見せ方が気になる",
            "{word}は、見た目にも魅力があるんだね。ぼくは、形や色にどんな工夫があるか知りたいな。遠くから見ても分かるところがあれば、覚えやすそうなの。",
            "{word}の形や色は、どんな印象につながるんだろう。ぼくなら、名前を見なくても分かる特徴を探してみたいな。",
          ),
          makeChoice(
            "COMPANY_BRAND_IDEA", "考え方・方針", "philosophy",
            "考え方や方針が気になる",
            "{word}は、考え方や方針が気になるんだね。ぼくは、それが実際の仕事にどう表れるか知りたいな。言っていることと、やっていることを比べてみたいの。",
            "{word}の方針は、作るものや選ぶ方法にどうつながるんだろう。ぼくは、言葉だけでなく、実際の工夫からも考えてみたいな。",
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
            "{word}は、実際によく使うんだね。ぼくは、何が使いやすいと感じるか知りたいな。慣れたから楽なのか、作りの工夫があるのかも気になるの。",
            "{word}を使う時、いつも助かっているところは何だろう。ぼくは、使い慣れて見逃している工夫もありそうだと思うの。",
          ),
          makeChoice(
            "COMPANY_BRAND_FOLLOW", "新しいものを気にする", "follow",
            "新しいものを気にする",
            "{word}は、新しく出るものも気になるんだね。ぼくは、前のものと何が変わったか比べてみたいな。新しいから全部よいとは限らないので、使い方に合うかも考えたいの。",
            "{word}の新しいものでは、どんな不便を減らそうとしているんだろう。ぼくは、増えた機能だけでなく、使いやすさも比べたいな。",
          ),
          makeChoice(
            "COMPANY_BRAND_DIST", "知ってるけど距離はある", "distance",
            "知っているが距離はある",
            "{word}は、知っていても、まだあまり関わっていないんだね。名前が分かることと、使って分かることは違いそうなの。ぼくは、必要になった時に何を確かめるか考えてみたいな。",
            "{word}は、名前を知っているだけでは分からないこともありそうなの。ぼくは、実際に使う前に、できることと合う場面を確かめたいな。",
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
