import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom' });
let failed = 0;
let passed = 0;

try {
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { COMMON_KNOWLEDGE_CATEGORIES, findCommonKnowledge } = await vite.ssrLoadModule('/lib/commonKnowledgeData.ts');
  const { pickSleepDialogue } = await vite.ssrLoadModule('/lib/sleepDialogueData.ts');
  const memory = () => {
    const values = new Map();
    return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  };
  const create = (storage = memory(), date = '2026-09-08T20:00:00+09:00', random = 0.9) => new SuuhimochiConversation({ storage, random: () => random, now: () => new Date(date) });
  const say = (conversation, text) => {
    const response = conversation.submit(text);
    assert.deepEqual(response.lines, response.debug.output, '表示とデバッグの台詞が一致する');
    const logs = conversation.getConversationLogs();
    const actual = logs.filter((entry) => entry.speaker === 'SUUHIMOCHI').slice(-response.lines.length).map((entry) => entry.text);
    assert.deepEqual(actual, response.lines, '表示した台詞がログに残る');
    return response;
  };
  const prepare = (conversation, goal = '毎日少し歩く') => { conversation.startSession(); say(conversation, goal); return conversation.startSession(); };
  const run = (name, fn) => { try { fn(); passed += 1; console.log('PASS', name); } catch (error) { failed += 1; console.error('FAIL', name, error.message); } };

  run('初回は30日の目標を自分の言葉で受け取る', () => {
    const c = create(); assert.equal(c.startSession().stage, 'goal');
    const saved = say(c, '毎日映画を見る');
    assert.equal(saved.stage, 'complete'); assert.equal(c.getGoal(), '毎日映画を見る'); assert.equal(c.getGoalChecks().length, 0);
  });

  run('睡眠中の寝言は重みどおり覚えた言葉を差し込める', () => {
    assert.match(pickSleepDialogue('犬', () => 0.9), /犬/);
    assert.ok(!pickSleepDialogue(null, () => 0.9).includes('{word}'));
    assert.match(pickSleepDialogue(null, () => 0.98), /夢|飛|雲|剣|勝負|忘れ|右|先頭|道|明日|今日/);
  });

  run('ことばを教えるから新語入力を直接開始できる', () => {
    const c = create(); prepare(c);
    const teaching = c.startWordTeaching();
    assert.equal(teaching.stage, 'topic'); assert.equal(teaching.inputMode, 'text'); assert.match(teaching.lines.join(''), /新しいコトバ/);
    const learned = say(c, 'あおいビー玉');
    assert.equal(learned.stage, 'unknown'); assert.equal(learned.inputMode, 'category');
  });

  run('すうひもちの質問はカテゴリ別の意味3択を覚えて後日再利用できる', () => {
    const storage = memory();
    const c = create(storage, '2026-09-08T20:00:00+09:00', 0);
    prepare(c);
    const question = c.startPromptedLearning();
    assert.equal(question.inputMode, 'text');
    assert.equal(question.debug.startType, 'QUESTION');
    assert.ok(question.lines[0].length > 0);
    const promptedCategory = question.debug.attributes.askedCategory;

    const provisional = say(c, '月見カレー');
    assert.equal(provisional.inputMode, 'choice');
    assert.equal(provisional.choices.length, 3);
    assert.match(provisional.lines.join(''), /月見カレー/);
    const selectedChoice = provisional.choices[0];
    const adjusted = c.choose(selectedChoice.id);
    assert.equal(adjusted.stage, 'complete');
    const word = c.getWordEntries().find((entry) => entry.surface === '月見カレー');
    assert.equal(word?.category, promptedCategory);
    assert.equal(word?.attributes.learnedBy, 'prompted_conversation');
    assert.equal(word?.attributes.promptedLastChoiceId, selectedChoice.id);

    const later = create(storage, '2026-09-08T20:00:00+09:00', 0.9);
    const reuse = later.startSession();
    assert.match(reuse.lines.join(''), /月見カレー/);
  });

  run('すうひもちの質問でわかんないを3回まで別方向に切り替える', () => {
    const c = create(); prepare(c);
    const first = c.startPromptedLearning();
    const firstQuestionId = first.debug.attributes.promptedQuestionId;
    const second = c.skipPromptedQuestion();
    assert.equal(second.inputMode, 'text');
    assert.match(second.lines[0], /別のところから聞いてみる/);
    assert.notEqual(second.debug.attributes.promptedQuestionId, firstQuestionId);
    const secondQuestionId = second.debug.attributes.promptedQuestionId;
    const third = c.skipPromptedQuestion();
    assert.equal(third.inputMode, 'text');
    assert.match(third.lines[0], /別のところから|違う方向/);
    assert.notEqual(third.debug.attributes.promptedQuestionId, secondQuestionId);
    const finished = c.skipPromptedQuestion();
    assert.equal(finished.stage, 'complete');
    assert.match(finished.lines[0], /質問が空振りの日/);
    assert.ok(!c.getWordEntries().some((entry) => entry.surface === 'わかんない'));
  });

  run('すうひもちの質問に既存語を入れても登録せず別のコトバを求める', () => {
    const c = create(); prepare(c);
    c.startPromptedLearning();
    const known = say(c, '犬');
    assert.equal(known.stage, 'topic');
    assert.equal(known.inputMode, 'text');
    assert.match(known.lines.join(''), /犬.*知って|動物/);
    assert.match(known.lines.join(''), /別のコトバ/);
    assert.ok(!c.getWordEntries().some((entry) => entry.surface === '犬'));
  });

  run('常識語は表記を正規化して知っていると答え、教えた単語にはしない', () => {
    assert.equal(COMMON_KNOWLEDGE_CATEGORIES.length, 14);
    assert.equal(findCommonKnowledge(' ＰＣ ')?.word, 'PC');
    assert.equal(findCommonKnowledge('ねこ')?.category, 'ANIMAL');
    assert.equal(findCommonKnowledge('大阪')?.commonType, 'prefecture');
    assert.equal(findCommonKnowledge('スウヒモチ')?.commonType, 'suuhimochi');

    const c = create(); prepare(c);
    c.startWordTeaching();
    const dog = say(c, ' 犬 ');
    assert.equal(dog.stage, 'complete'); assert.match(dog.lines[0], /犬.*動物/);
    assert.ok(!c.getWordEntries().some((entry) => entry.surface === '犬'));

    c.startWordTeaching();
    const pc = say(c, 'ＰＣ');
    assert.match(pc.lines[0], /ＰＣ.*機械/);

    c.startWordTeaching();
    const osaka = say(c, '大阪');
    assert.match(osaka.lines[0], /大阪.*都道府県/);

    c.startWordTeaching();
    const rain = say(c, '雨');
    assert.match(rain.lines[0], /雨.*天気/);

    c.startWordTeaching();
    const self = say(c, 'すうひもち');
    assert.match(self.lines[0], /ぼく|名前/);
  });

  run('新しいコトバを種類と気持ちに分けて覚える', () => {
    const c = create(); prepare(c);
    const learned = say(c, '酸っぱいんだマン');
    assert.equal(learned.stage, 'unknown'); assert.equal(learned.inputMode, 'category'); assert.equal(learned.categoryChoices.length, 21);
    const subCategories = c.chooseCategory('AV_MEDIA');
    assert.equal(subCategories.stage, 'unknown'); assert.equal(subCategories.inputMode, 'category'); assert.equal(subCategories.subCategoryChoices.length, 7);
    const categorized = c.chooseSubCategory('AV_MEDIA_2');
    assert.equal(categorized.stage, 'followup'); assert.equal(categorized.choices[0].id, 'WORD_LOVE'); assert.equal(categorized.choices.length, 5);
    assert.equal(categorized.lines[1], 'ぼく、酸っぱいんだマンのこと気になるの。人間さんはどう思ってる？');
    const finished = c.choose('WORD_NEUTRAL');
    assert.equal(finished.stage, 'complete');
    const word = c.getWordEntries().find((entry) => entry.surface === '酸っぱいんだマン');
    assert.equal(word?.category, 'AV_MEDIA'); assert.equal(word?.attributes.categoryLabel, '音楽・映画・動画'); assert.equal(word?.attributes.subCategoryLabel, '映画'); assert.equal(word?.attributes.feeling, 'ふつう');
    assert.ok(c.getRelations().some((item) => item.relation === 'LEARN' && item.object === '酸っぱいんだマン'));
    assert.ok(c.getRelations().some((item) => item.relation === 'RECALL' && item.object === '酸っぱいんだマン'));
  });

  run('同じ日に何度でも会話を開始できる', () => {
    const c = create(); prepare(c);
    say(c, '映画'); c.chooseCategory('MEDIA'); c.choose('WORD_LIKE');
    const first = c.getMemories().length;
    c.startSession(); say(c, 'ボードゲーム会'); c.chooseCategory('MEDIA'); c.choose('WORD_INTERESTED');
    assert.equal(c.getMemories().length, first + 1);
    assert.ok(new Set(c.getConversationLogs().map((entry) => entry.sessionId)).size >= 3);
  });

  run('過去の言葉を再会話で使う', () => {
    const storage = memory(); const c = create(storage); prepare(c); say(c, '映画'); c.chooseCategory('MEDIA'); c.choose('WORD_LIKE');
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices')); saved.lastGoalCheckDate = '2026-09-16'; saved.conversationCount = 1; storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved));
    const later = create(storage, '2026-09-16T20:00:00+09:00');
    const recall = later.startSession();
    assert.equal(recall.stage, 'followup'); assert.equal(recall.inputMode, 'choice'); assert.match(recall.lines.join(''), /映画/); assert.match(recall.lines.join(''), /覚えて/);
  });

  run('目標チェックは遅れた時だけ次の行動を尋ねる', () => {
    const storage = memory(); const c = create(storage); c.startSession(); say(c, '毎日歩く');
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    saved.startDate = '2026-09-01'; saved.conversationCount = 20; saved.lastGoalCheckDate = null;
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved));
    const later = create(storage, '2026-09-08T20:00:00+09:00');
    const check = later.startSession();
    assert.equal(check.inputMode, 'choice'); assert.match(check.lines.join(''), /毎日歩く/); assert.match(check.lines.join(''), /順調/);
    const action = later.choose('GOAL_BEHIND'); assert.equal(action.inputMode, 'choice'); assert.match(action.lines.join(''), /次はどうする/);
    assert.equal(later.choose('GOAL_RETRY').stage, 'complete');
  });

  run('30日目の別れと手紙を維持する', () => {
    const c = create(); prepare(c, '30日で本を読む');
    const farewell = c.jumpFarewell(); assert.equal(farewell.stage, 'farewell');
    let next = farewell; for (let index = 0; index < 20 && next.stage === 'farewell'; index += 1) next = c.continueFarewell();
    assert.equal(next.stage, 'ended'); assert.equal(c.isEnded(), true); assert.match(c.getLetter(), /30日間/); assert.match(c.getLetter(), /30日で本を読む/);
  });

  run('保存後も v6 の単語とログが残る', () => {
    const storage = memory(); const c = create(storage); prepare(c); say(c, '映画'); c.chooseCategory('MEDIA'); c.choose('WORD_LIKE');
    const reloaded = create(storage);
    assert.ok(reloaded.getWordEntries().some((entry) => entry.surface === '映画')); assert.ok(reloaded.getConversationLogs().length > 0);
  });

  run('推し判定を保存し、同じ単語へ再質問しない', () => {
    const c = create(memory(), '2026-09-08T20:00:00+09:00', 0.1); prepare(c);
    c.startWordTeaching(); say(c, '推しキャラ'); c.chooseCategory('GAME_MEDIA'); c.chooseSubCategory('GAME_MEDIA_4');
    const confirmation = c.choose('WORD_LOVE');
    assert.equal(confirmation.choices[0].id, 'OSHI_YES'); assert.equal(confirmation.choices[1].id, 'OSHI_NO');
    c.choose('OSHI_YES');
    const saved = c.getWordEntries().find((entry) => entry.surface === '推しキャラ');
    assert.equal(saved?.userSentiment, 'LOVE'); assert.equal(saved?.oshiStatus, 'YES'); assert.equal(typeof saved?.oshiConfirmedAt, 'number');
    c.startWordTeaching(); say(c, '推しキャラ'); c.chooseCategory('GAME_MEDIA'); c.chooseSubCategory('GAME_MEDIA_4');
    const noRepeat = c.choose('WORD_LOVE');
    assert.equal(noRepeat.stage, 'complete'); assert.equal(noRepeat.choices.length, 0);
  });

  console.log('\\nChoice conversation scenarios: ' + passed + ' passed, ' + failed + ' failed');
} finally { await vite.close(); }
if (failed) process.exitCode = 1;
