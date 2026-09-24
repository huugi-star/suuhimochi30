import type { SlotClass } from './miniDialogueTypes';

/** Categories that can be recognised before the player teaches a new word. */
export const COMMON_KNOWLEDGE_CATEGORIES = [
  'ANIMAL',
  'FOOD',
  'BODY',
  'EMOTION',
  'NATURE_TIME',
  'VEHICLE',
  'CLOTHING',
  'PLACE',
  'ACTIVITY',
  'SPORTS',
  'SCHOOL',
  'WORK',
  'MONEY',
  'TECH',
] as const;

export type CommonKnowledgeCategory = (typeof COMMON_KNOWLEDGE_CATEGORIES)[number];

export interface CommonKnowledgeEntry {
  word: string;
  category: SlotClass;
  categories?: SlotClass[];
  commonType?: string;
  /** Alternative spellings share one entry instead of duplicating its data. */
  aliases?: string[];
}

export const COMMON_KNOWLEDGE_CATEGORY_LABELS: Record<CommonKnowledgeCategory, string> = {
  ANIMAL: '動物',
  FOOD: '食べもの',
  BODY: '体のこと',
  EMOTION: '気持ち',
  NATURE_TIME: '自然や時間のこと',
  VEHICLE: '乗りもの',
  CLOTHING: '身につけるもの',
  PLACE: '場所',
  ACTIVITY: 'やること',
  SPORTS: 'スポーツ',
  SCHOOL: '学校や勉強のこと',
  WORK: '仕事のこと',
  MONEY: 'お金に関係すること',
  TECH: '機械や技術に関係するもの',
};

const words = (category: CommonKnowledgeCategory, text: string, commonType?: string): CommonKnowledgeEntry[] => text
  .trim()
  .split('\n')
  .map((word) => ({ word, category, commonType }));

const place = (word: string, aliases: string[] = [], commonType = 'prefecture'): CommonKnowledgeEntry => ({
  word, category: 'PLACE', aliases, commonType,
});

export const COMMON_KNOWLEDGE_ENTRIES: CommonKnowledgeEntry[] = [
  // PERSON is intentionally not a broad common-knowledge category. These are the
  // two relationship words Suuhimochi should always understand from the start.
  { word: '人間', category: 'PERSON', commonType: 'person' },
  { word: 'すうひもち', category: 'PERSON', commonType: 'suuhimochi', aliases: ['スウヒモチ'] },

  ...words('ANIMAL', `鳥
馬
牛
豚
羊
うさぎ
ねずみ
ハムスター
リス
猿
ゴリラ
ライオン
トラ
象
キリン
熊
鹿
狐
狸
亀
蛇
蛙
ペンギン
イルカ
クジラ
サメ
蝶
蜂
蟻`),
  { word: '犬', category: 'ANIMAL', aliases: ['いぬ', 'イヌ'] },
  { word: '猫', category: 'ANIMAL', aliases: ['ねこ', 'ネコ'] },
  { word: '魚', category: 'ANIMAL', categories: ['ANIMAL', 'FOOD'] },

  ...words('FOOD', `ご飯
米
パン
麺
うどん
そば
ラーメン
カレー
寿司
おにぎり
弁当
肉
卵
野菜
果物
りんご
みかん
バナナ
いちご
ぶどう
キャベツ
トマト
玉ねぎ
にんじん
じゃがいも
きのこ
鶏肉
豚肉
牛肉
唐揚げ
天ぷら
焼肉
ハンバーグ
ケーキ
アイス
チョコ
水
お茶
コーヒー
ジュース`),

  ...words('BODY', `頭
顔
髪
目
耳
鼻
口
歯
舌
首
肩
胸
背中
お腹
腰
腕
肘
手
指
足
膝
心臓
胃
腸
骨
筋肉
血
皮膚
爪
頭痛
腹痛
熱
咳
風邪`),

  ...words('EMOTION', `嬉しい
楽しい
悲しい
寂しい
怒り
怖い
不安
心配
緊張
安心
驚き
期待
喜び
悲しみ
恥ずかしい
悔しい
羨ましい
退屈
面倒
好き
嫌い
やる気
自信
焦り`),

  ...words('NATURE_TIME', `朝
昼
夕方
夜
深夜
今日
明日
昨日
春
夏
秋
冬
風
空
雲
太陽
月
星
海
川
山
森
花
木
草
暑い
寒い
暖かい
涼しい
季節
天気
時間`),
  ...words('NATURE_TIME', '雨\n晴れ\n曇り\n雪\n台風\n雷\n嵐', 'weather'),

  ...words('VEHICLE', `車
自動車
自転車
バイク
電車
地下鉄
新幹線
バス
タクシー
飛行機
ヘリコプター
船
ボート
トラック
救急車
消防車
パトカー
スクーター`),

  ...words('CLOTHING', `服
シャツ
Tシャツ
ズボン
パンツ
スカート
ワンピース
上着
コート
ジャケット
パーカー
セーター
下着
靴下
靴
スニーカー
サンダル
ブーツ
帽子
手袋
マフラー
ベルト
ネクタイ
眼鏡
メガネ
鞄
バッグ
リュック`),

  ...words('ACTIVITY', `散歩
買い物
料理
掃除
洗濯
睡眠
昼寝
休憩
読書
勉強
練習
旅行
ドライブ
映画鑑賞
音楽鑑賞
ゲーム
写真
絵を描く
歌う
踊る
走る
歩く
泳ぐ
食べる
飲む
寝る
起きる
話す
調べる
考える
作る
遊ぶ`),

  ...words('SPORTS', `野球
サッカー
バスケットボール
バスケ
バレーボール
バレー
テニス
卓球
ゴルフ
ラグビー
水泳
陸上
マラソン
柔道
剣道
空手
ボクシング
レスリング
相撲
スキー
スノーボード
スケート
体操
筋トレ`),

  ...words('SCHOOL', `小学校
中学校
高校
大学
先生
教師
生徒
学生
授業
勉強
宿題
課題
テスト
試験
教科書
ノート
国語
数学
英語
理科
社会
体育
音楽
美術
教室
体育館
部活
夏休み
冬休み
入学
卒業`),
  { word: '学校', category: 'SCHOOL', categories: ['SCHOOL', 'PLACE'] },

  ...words('WORK', `仕事
会社
職場
上司
部下
同僚
先輩
後輩
店員
社員
出勤
退勤
通勤
残業
休憩
休日
会議
メール
電話
作業
転職
就職
退職
面接
履歴書
アルバイト
バイト
シフト`),

  ...words('MONEY', `お金
現金
財布
円
千円
万円
値段
価格
貯金
預金
支払い
会計
銀行
ATM
税金
家賃
電気代
水道代
借金
ローン
節約
収入
支出
無料
有料`),
  { word: '給料', category: 'MONEY', categories: ['MONEY', 'WORK'] },
  { word: '時給', category: 'MONEY', categories: ['MONEY', 'WORK'] },

  ...words('TECH', `パソコン
PC
コンピューター
スマホ
スマートフォン
携帯電話
タブレット
テレビ
カメラ
イヤホン
ヘッドホン
マイク
スピーカー
キーボード
マウス
モニター
プリンター
インターネット
Wi-Fi
ルーター
アプリ
ソフト
AI
人工知能
ロボット
USB
充電器
バッテリー
電池`),
  ...words('TECH', `冷蔵庫
冷凍庫
電子レンジ
オーブン
トースター
炊飯器
電気ケトル
ポット
掃除機
洗濯機
乾燥機
エアコン
扇風機
サーキュレーター
空気清浄機
加湿器
除湿機
ドライヤー
アイロン
電気毛布
こたつ
ストーブ
ヒーター
照明
電球
時計
目覚まし時計
体重計
電動歯ブラシ
シェーバー
ホットプレート
電気鍋
ミキサー
ブレンダー
コーヒーメーカー
食洗機
ゲーム機
コントローラー
リモコン
レコーダー
プロジェクター`, 'home_appliance'),

  { word: '家', category: 'PLACE', commonType: 'place' },
  { word: '店', category: 'PLACE', commonType: 'place' },
  { word: '駅', category: 'PLACE', commonType: 'place' },
  { word: '病院', category: 'PLACE', commonType: 'place' },
  { word: '公園', category: 'PLACE', commonType: 'place' },
  { word: '学校', category: 'SCHOOL', categories: ['SCHOOL', 'PLACE'] },

  place('北海道'),
  place('青森県', ['青森']), place('岩手県', ['岩手']), place('宮城県', ['宮城']), place('秋田県', ['秋田']), place('山形県', ['山形']), place('福島県', ['福島']),
  place('茨城県', ['茨城']), place('栃木県', ['栃木']), place('群馬県', ['群馬']), place('埼玉県', ['埼玉']), place('千葉県', ['千葉']), place('東京都', ['東京']), place('神奈川県', ['神奈川']),
  place('新潟県', ['新潟']), place('富山県', ['富山']), place('石川県', ['石川']), place('福井県', ['福井']), place('山梨県', ['山梨']), place('長野県', ['長野']), place('岐阜県', ['岐阜']), place('静岡県', ['静岡']), place('愛知県', ['愛知']),
  place('三重県', ['三重']), place('滋賀県', ['滋賀']), place('京都府', ['京都']), place('大阪府', ['大阪']), place('兵庫県', ['兵庫']), place('奈良県', ['奈良']), place('和歌山県', ['和歌山']),
  place('鳥取県', ['鳥取']), place('島根県', ['島根']), place('岡山県', ['岡山']), place('広島県', ['広島']), place('山口県', ['山口']),
  place('徳島県', ['徳島']), place('香川県', ['香川']), place('愛媛県', ['愛媛']), place('高知県', ['高知']),
  place('福岡県', ['福岡']), place('佐賀県', ['佐賀']), place('長崎県', ['長崎']), place('熊本県', ['熊本']), place('大分県', ['大分']), place('宮崎県', ['宮崎']), place('鹿児島県', ['鹿児島']), place('沖縄県', ['沖縄']),

  place('日本', [], 'country'), place('アメリカ', ['アメリカ合衆国'], 'country'), place('カナダ', [], 'country'), place('メキシコ', [], 'country'), place('ブラジル', [], 'country'), place('アルゼンチン', [], 'country'),
  place('イギリス', ['英国'], 'country'), place('フランス', [], 'country'), place('ドイツ', [], 'country'), place('イタリア', [], 'country'), place('スペイン', [], 'country'), place('ポルトガル', [], 'country'), place('オランダ', [], 'country'), place('ベルギー', [], 'country'), place('スイス', [], 'country'), place('オーストリア', [], 'country'), place('ギリシャ', [], 'country'), place('ロシア', [], 'country'), place('ウクライナ', [], 'country'), place('ポーランド', [], 'country'), place('スウェーデン', [], 'country'), place('ノルウェー', [], 'country'), place('フィンランド', [], 'country'), place('デンマーク', [], 'country'),
  place('中国', [], 'country'), place('韓国', [], 'country'), place('北朝鮮', [], 'country'), place('台湾', [], 'country'), place('インド', [], 'country'), place('インドネシア', [], 'country'), place('タイ', [], 'country'), place('ベトナム', [], 'country'), place('フィリピン', [], 'country'), place('シンガポール', [], 'country'), place('マレーシア', [], 'country'),
  place('オーストラリア', [], 'country'), place('ニュージーランド', [], 'country'), place('トルコ', [], 'country'), place('イスラエル', [], 'country'), place('サウジアラビア', [], 'country'), place('アラブ首長国連邦', [], 'country'), place('エジプト', [], 'country'), place('南アフリカ', [], 'country'),
];

/** Trim, fold full/half-width forms, lower ASCII, then use a kana-neutral key. */
export function normalizeCommonKnowledge(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ja-JP')
    .replace(/[ァ-ヶ]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0x60));
}

const COMMON_KNOWLEDGE_INDEX = new Map<string, CommonKnowledgeEntry>();
for (const entry of COMMON_KNOWLEDGE_ENTRIES) {
  for (const form of [entry.word, ...(entry.aliases ?? [])]) {
    COMMON_KNOWLEDGE_INDEX.set(normalizeCommonKnowledge(form), entry);
  }
}

export function findCommonKnowledge(value: string) {
  return COMMON_KNOWLEDGE_INDEX.get(normalizeCommonKnowledge(value));
}

function naturalCategory(entry: CommonKnowledgeEntry) {
  switch (entry.commonType) {
    case 'weather': return '天気';
    case 'country': return '国';
    case 'prefecture': return '都道府県の名前';
    case 'home_appliance': return '家で使う機械';
    case 'place': return '場所';
    default: return COMMON_KNOWLEDGE_CATEGORY_LABELS[entry.category as CommonKnowledgeCategory] ?? '人間さんの世界のこと';
  }
}

const CATEGORY_REACTION_TEMPLATES: Record<CommonKnowledgeCategory, (surface: string) => string[]> = {
  ANIMAL: (word) => [
    `あ、${word}は知ってるの。動物だよね。`,
    `${word}なら分かるの。生きものの仲間なんだよね。`,
    `うん、${word}は知ってるの。どこかで暮らしてる動物なんだよね。`,
  ],
  FOOD: (word) => [
    `${word}なら知ってるの。食べものだよね。`,
    `あ、${word}は分かるの。人間さんが食べたり飲んだりするものだよね。`,
    `うん、${word}は知ってるの。どんな味か気になるの。`,
  ],
  BODY: (word) => [
    `あ、${word}は知ってるの。体のことだよね。`,
    `${word}なら分かるの。人間さんの体に関係するものだよね。`,
    `うん、${word}は知ってるの。体っていろんなところが働いてるの。`,
  ],
  EMOTION: (word) => [
    `${word}は知ってるの。気持ちの名前だよね。`,
    `あ、${word}なら分かるの。心の中に出てくるものだよね。`,
    `うん、${word}は知ってるの。人によって感じ方が違うの。`,
  ],
  NATURE_TIME: (word) => [
    `${word}は知ってるの。自然や時間のことだよね。`,
    `あ、${word}なら分かるの。毎日の景色にも関係するものだよね。`,
    `うん、${word}は知ってるの。世界はずっと変わっていくの。`,
  ],
  VEHICLE: (word) => [
    `${word}なら知ってるの。乗りものだよね。`,
    `あ、${word}は分かるの。人間さんを遠くまで運んでくれるものだよね。`,
    `うん、${word}は知ってるの。いろんな場所へ行けるのってすごいの。`,
  ],
  CLOTHING: (word) => [
    `${word}は知ってるの。身につけるものだよね。`,
    `あ、${word}なら分かるの。人間さんがおしゃれしたり守ったりするものだよね。`,
    `うん、${word}は知ってるの。気分や季節でも変わるのかな。`,
  ],
  PLACE: (word) => [
    `${word}は知ってるの。場所の名前だよね。`,
    `あ、${word}なら分かるの。人間さんが行ったり過ごしたりするところだよね。`,
    `うん、${word}は知ってるの。いろんな場所があるの。`,
  ],
  ACTIVITY: (word) => [
    `${word}は知ってるの。人間さんがすることだよね。`,
    `あ、${word}なら分かるの。毎日の中でやることのひとつだよね。`,
    `うん、${word}は知ってるの。やるときの気分もありそうなの。`,
  ],
  SPORTS: (word) => [
    `${word}なら知ってるの。スポーツだよね。`,
    `あ、${word}は分かるの。体をいっぱい動かすものだよね。`,
    `うん、${word}は知ってるの。練習すると少しずつ上手になるのかな。`,
  ],
  SCHOOL: (word) => [
    `${word}は知ってるの。学校や勉強のことだよね。`,
    `あ、${word}なら分かるの。人間さんが学ぶときに関係するものだよね。`,
    `うん、${word}は知ってるの。覚えることっていっぱいあるの。`,
  ],
  WORK: (word) => [
    `${word}は知ってるの。仕事のことだよね。`,
    `あ、${word}なら分かるの。人間さんが働くときに出てくるものだよね。`,
    `うん、${word}は知ってるの。お仕事にもいろんな形があるの。`,
  ],
  MONEY: (word) => [
    `${word}は知ってるの。お金に関係することだよね。`,
    `あ、${word}なら分かるの。人間さんの暮らしで使うものだよね。`,
    `うん、${word}は知ってるの。お金の仕組みってたくさんあるの。`,
  ],
  TECH: (word) => [
    `${word}は知ってるの。機械や技術に関係するものだよね。`,
    `あ、${word}なら分かるの。人間さんの暮らしを手伝うものだよね。`,
    `うん、${word}は知ってるの。機械や技術には見えない仕組みもいっぱいありそうなの。`,
  ],
};

const COMMON_TYPE_REACTION_TEMPLATES: Record<string, (surface: string) => string[]> = {
  person: (word) => [`${word}は知ってるの。ぼくが話してる人たちのことだよね。`, `あ、${word}なら分かるの。ぼくも人間さんとお話しするの。`, `うん、${word}は知ってるの。いろんな気持ちを持ってるんだよね。`],
  suuhimochi: () => ['すうひもちは知ってるの。ぼくのことだよね。', 'あ、すうひもちなら分かるの。ぼくの名前なの。', 'うん、すうひもちはぼくなの。覚えていてくれてうれしいの。'],
  weather: (word) => [`${word}は知ってるの。天気だよね。`, `あ、${word}なら分かるの。天気のひとつ、空のようすだよね。`, `うん、${word}は知ってるの。天気が変わると一日も変わるの。`],
  country: (word) => [`${word}は知ってるの。国だよね。`, `あ、${word}なら分かるの。人間さんの世界にある国の名前だよね。`, `うん、${word}は知ってるの。国ごとにいろんな違いがあるの。`],
  prefecture: (word) => [`${word}は知ってるの。都道府県の名前だよね。`, `あ、${word}なら分かるの。日本にある都道府県の名前だよね。`, `うん、${word}は知ってるの。都道府県にも人間さんの毎日があるの。`],
  home_appliance: (word) => [`${word}は知ってるの。家で使う機械だよね。`, `あ、${word}なら分かるの。おうちの暮らしを手伝う機械だよね。`, `うん、${word}は知ってるの。人間さんの代わりに動く機械なんだよね。`],
  place: (word) => [`${word}は知ってるの。場所の名前だよね。`, `あ、${word}なら分かるの。人間さんが行ったり過ごしたりするところだよね。`, `うん、${word}は知ってるの。いろんな場所があるの。`],
};

/** A short, category-aware response for words Suuhimochi already knows. */
export function commonKnowledgeReaction(surface: string, entry: CommonKnowledgeEntry, random = Math.random) {
  const templates = (entry.commonType && COMMON_TYPE_REACTION_TEMPLATES[entry.commonType])
    ? COMMON_TYPE_REACTION_TEMPLATES[entry.commonType](surface)
    : CATEGORY_REACTION_TEMPLATES[entry.category as CommonKnowledgeCategory]?.(surface)
      ?? [`あ、${surface}は知ってるの。${naturalCategory(entry)}だよね。`];
  return templates[Math.min(templates.length - 1, Math.floor(random() * templates.length))] ?? templates[0];
}
