import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
});
let failed = 0;
let passed = 0;

try {
  const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { findCommonKnowledge } = await vite.ssrLoadModule('/lib/commonKnowledgeData.ts');
  const { runConversationEngine } = await vite.ssrLoadModule('/lib/conversation/conversationEngine.ts');
  const memory = () => {
    const values = new Map();
    return {
      values,
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    };
  };
  const create = (storage = memory(), date = '2026-09-08T20:00:00+09:00', random = () => 0.5) => new SuuhimochiConversation({
    storage,
    random,
    now: () => new Date(date),
  });
  const run = (name, fn) => {
    try {
      fn();
      passed += 1;
      console.log('PASS', name);
    } catch (error) {
      failed += 1;
      console.error('FAIL', name, error.message);
    }
  };
  const prepare = (conversation, goal = '毎日少し歩く') => {
    assert.equal(conversation.startSession().stage, 'goal');
    conversation.submit(goal);
  };
  const assertPagedResponse = (response) => {
    assert.ok(response.pages.length > 0);
    assert.ok(response.pages.every((page) => page.lines.length >= 1 && page.lines.length <= 4));
    assert.deepEqual(response.pages.flatMap((page) => page.lines), response.lines);
    if (response.lines.length > 1) assert.ok(response.pages.length < response.lines.length);
  };

  run('Day1・Day2会話エンジンは未閲覧の完成台本を返す', () => {
    const result = runConversationEngine({ intent: 'CHAT', day: 1, seenConversationIds: [], random: () => 0 });
    assert.equal(result.conversation?.id, 'DAY01_SELF_01');
    assert.equal(result.conversation?.choices.length, 3);
    assert.equal(result.conversation?.opening[0]?.text, '人間さん。');
    const day2 = runConversationEngine({ intent: 'CHAT', day: 2, seenConversationIds: [], random: () => 0 }).conversation;
    assert.equal(day2?.id, 'DAY02_SELF_01');
    assert.equal(day2?.choices.length, 3);
  });

  run('Day1前半6会話は未閲覧優先で進め、選択と終点を保存する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    for (let index = 0; index < 6; index += 1) {
      const opening = conversation.startSession();
      assert.equal(opening.stage, 'followup');
      assert.equal(opening.inputMode, 'choice');
      assert.equal(opening.choices.length, 3);
      assertPagedResponse(opening);
      const ending = conversation.choose(opening.choices[0].id);
      assert.equal(ending.stage, 'complete');
      assert.ok(ending.lines.length > 1);
      assertPagedResponse(ending);
      assert.ok(!ending.lines.includes('また話そうね。'));
    }
    assert.deepEqual(conversation.getSeenConversationIds().sort(), [
      'DAY01_SELF_01', 'DAY01_SELF_02', 'DAY01_SELF_03',
      'DAY01_SELF_04', 'DAY01_SELF_05', 'DAY01_SELF_06',
    ]);
    const records = conversation.getConversationChoiceRecords();
    assert.equal(records.length, 6);
    assert.ok(records.every((record) => record.choiceId.endsWith('_CHOICE_01') && record.day === 1));
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    assert.equal(saved.version, 9);
    assert.equal(saved.seenConversationIds.length, 6);
    assert.equal(saved.conversationChoiceRecords.length, 6);
  });

  run('Day1後半6会話は自由入力から未知語を一段だけ学び、自然に終了する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    for (let index = 0; index < 6; index += 1) {
      const opening = conversation.startSession();
      conversation.choose(opening.choices[0].id);
    }

    const cases = [
      ['ビリヤニ', 'DAY01_CURIOUS_01_UNKNOWN_RICE'],
      ['ぼんやりタイム', 'DAY01_CURIOUS_02_UNKNOWN_NOTHING'],
      ['ガンプラ', 'DAY01_CURIOUS_03_UNKNOWN_OBJECT'],
      ['大きな音', 'DAY01_CURIOUS_04_UNKNOWN_EVENT'],
      ['秘密基地', 'DAY01_CURIOUS_05_UNKNOWN_WORK'],
      ['明日の予定', 'DAY01_CURIOUS_06_UNKNOWN_EVENT'],
    ];
    for (const [word, choiceId] of cases) {
      const opening = conversation.startSession();
      assert.equal(opening.inputMode, 'text');
      assertPagedResponse(opening);
      const followup = conversation.submit(word);
      assert.equal(followup.inputMode, 'choice');
      assert.ok(followup.choices.some((choice) => choice.id === choiceId));
      assertPagedResponse(followup);
      const ending = conversation.choose(choiceId);
      assert.equal(ending.stage, 'complete');
      assert.ok(ending.lines.length > 0);
      assertPagedResponse(ending);
      assert.ok(!ending.lines.includes('また話そうね。'));
    }

    assert.equal(conversation.getSeenConversationIds().length, 12);
    assert.equal(conversation.getConversationChoiceRecords().length, 12);
    assert.equal(conversation.getMemoryEpisodes().length, 6);
    const biriyani = conversation.getWordEntries().find((entry) => entry.surface === 'ビリヤニ');
    assert.equal(biriyani?.category, 'FOOD');
    assert.equal(biriyani?.subcategory, 'RICE');
    assert.equal(biriyani?.knowledgeLevel, 'PARTIAL');
    assert.ok(conversation.getMemoryRelations().some((relation) => relation.type === 'LIKES' && relation.objectId === biriyani?.id));
    assert.ok(conversation.getMemoryRelations().some((relation) => relation.type === 'MAKES_HAPPY' && relation.objectId === biriyani?.id));
    assert.ok(conversation.getOpenQuestions().some((question) => question.wordId === biriyani?.id && question.status === 'OPEN'));

    const nothing = conversation.getWordEntries().find((entry) => entry.surface === 'ぼんやりタイム');
    const nothingRelations = conversation.getMemoryRelations().filter((relation) => relation.objectId === nothing?.id);
    assert.ok(nothingRelations.some((relation) => relation.type === 'FREQUENTLY_DOES'));
    assert.ok(!nothingRelations.some((relation) => relation.type === 'LIKES'));
    assert.ok(!conversation.getMemoryRelations().some((relation) => relation.subjectId === nothing?.id && relation.objectId === 'concept:rest_adjust'));

    const thought = conversation.getWordEntries().find((entry) => entry.surface === '明日の予定');
    const thoughtRelations = conversation.getMemoryRelations().filter((relation) => relation.objectId === thought?.id);
    assert.ok(thoughtRelations.some((relation) => relation.type === 'THINKS_ABOUT'));
    assert.ok(!thoughtRelations.some((relation) => relation.type === 'LIKES'));

    const reloaded = create(storage, undefined, () => 0);
    assert.equal(reloaded.getMemoryEpisodes().length, 6);
    assert.equal(reloaded.getWordEntries().find((entry) => entry.surface === 'ビリヤニ')?.subcategory, 'RICE');
    assert.ok(reloaded.getOpenQuestions().some((question) => question.wordId === biriyani?.id));
  });

  run('Day2の前半6会話の後に共通分岐の後半6会話が続き、意味記憶を保存する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    let opening = conversation.advanceDay();
    for (let index = 0; index < 6; index += 1) {
      if (index > 0) opening = conversation.startSession();
      assert.equal(opening.stage, 'followup');
      assert.equal(opening.inputMode, 'choice');
      assert.equal(opening.choices.length, 3);
      assert.match(opening.debug.selectedTemplate, /^DAY02_SELF_0[1-6]$/);
      assertPagedResponse(opening);
      const ending = conversation.choose(opening.choices[0].id);
      assert.equal(ending.stage, 'complete');
      assertPagedResponse(ending);
    }
    assert.deepEqual(conversation.getSeenConversationIds().filter((id) => id.startsWith('DAY02_')).sort(), [
      'DAY02_SELF_01', 'DAY02_SELF_02', 'DAY02_SELF_03',
      'DAY02_SELF_04', 'DAY02_SELF_05', 'DAY02_SELF_06',
    ]);

    const cases = [
      ['カレー', 'DAY02_CURIOUS_01_EVERY_MORNING'],
      ['音楽を聴く', 'DAY02_CURIOUS_02_CALM'],
      ['空', 'DAY02_CURIOUS_03_CHANGE'],
      ['片付け', 'DAY02_CURIOUS_04_TEDIOUS'],
      ['料理', 'DAY02_CURIOUS_05_PRACTICE'],
      ['映画を見る', 'DAY02_CURIOUS_06_UNCERTAIN'],
    ];
    for (const [word, choiceId] of cases) {
      const curiousOpening = conversation.startSession();
      assert.equal(curiousOpening.inputMode, 'text');
      assert.match(curiousOpening.debug.selectedTemplate, /^DAY02_CURIOUS_0[1-6]$/);
      const followup = conversation.submit(word);
      assert.equal(followup.inputMode, 'choice');
      assert.ok(followup.choices.some((choice) => choice.id === choiceId));
      const ending = conversation.choose(choiceId);
      assert.equal(ending.stage, 'complete');
      assertPagedResponse(ending);
    }

    const relations = conversation.getMemoryRelations();
    const entry = (surface) => conversation.getWordEntries().find((word) => word.surface === surface);
    assert.ok(relations.some((relation) => relation.type === 'FREQUENTLY_DOES' && relation.objectId === entry('カレー')?.id));
    assert.ok(relations.some((relation) => relation.type === 'USED_FOR' && relation.objectId === entry('音楽を聴く')?.id));
    assert.ok(relations.some((relation) => relation.type === 'STRUGGLES_WITH' && relation.objectId === entry('片付け')?.id));
    assert.ok(relations.some((relation) => relation.type === 'IS_GOOD_AT' && relation.objectId === entry('料理')?.id));
    assert.ok(relations.some((relation) => relation.type === 'LOOKS_FORWARD_TO' && relation.objectId === entry('映画を見る')?.id));
    assert.ok(!relations.some((relation) => relation.type === 'LIKES' && relation.objectId === entry('料理')?.id));
    assert.ok(!relations.some((relation) => relation.type === 'DISLIKES' && relation.objectId === entry('片付け')?.id));
    assert.equal(entry('カレー')?.knowledgeLevel, 'KNOWN');
    assert.equal(conversation.getMemoryEpisodes().filter((episode) => episode.conversationId.startsWith('DAY02_CURIOUS_')).length, 6);
    assert.equal(conversation.getOpenQuestions().filter((question) => question.status === 'OPEN').length, 6);

    const reloaded = create(storage, undefined, () => 0);
    assert.equal(reloaded.getMemoryEpisodes().filter((episode) => episode.conversationId.startsWith('DAY02_CURIOUS_')).length, 6);
    assert.ok(reloaded.getMemoryRelations().some((relation) => relation.type === 'LOOKS_FORWARD_TO' && relation.objectId === entry('映画を見る')?.id));
  });

  run('同じ正規化文字列は同じWordEntryを更新する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    for (let index = 0; index < 6; index += 1) {
      const opening = conversation.startSession();
      conversation.choose(opening.choices[0].id);
    }
    conversation.startSession();
    conversation.submit('ＡＢＣ');
    conversation.choose('DAY01_CURIOUS_01_UNKNOWN_RICE');
    conversation.startSession();
    conversation.submit('ABC');
    conversation.choose('DAY01_CURIOUS_02_UNKNOWN_OTHER');
    const entries = conversation.getWordEntries().filter((entry) => entry.surface.normalize('NFKC').toLowerCase() === 'abc');
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.mentionCount, 2);
    assert.equal(entries[0]?.lastSeenDay, 1);
  });

  run('既知語は既知語分岐へ進み、同じ正規化語を重複登録しない', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    for (let index = 0; index < 6; index += 1) {
      const opening = conversation.startSession();
      conversation.choose(opening.choices[0].id);
    }
    const opening = conversation.startSession();
    assert.equal(opening.debug.selectedTemplate, 'DAY01_CURIOUS_01');
    const known = conversation.submit('カレー');
    assert.ok(known.choices.some((choice) => choice.id === 'DAY01_CURIOUS_01_KNOWN_HAPPY'));
    conversation.choose('DAY01_CURIOUS_01_KNOWN_HAPPY');
    assert.equal(conversation.getWordEntries().filter((entry) => entry.surface === 'カレー').length, 1);
    assert.equal(conversation.getWordEntries().find((entry) => entry.surface === 'カレー')?.knowledgeLevel, 'KNOWN');
  });

  run('単語記憶とcommonKnowledge辞書を維持する', () => {
    const conversation = create();
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('星の本');
    conversation.chooseCategory('MEDIA');
    conversation.choose('WORD_LIKE');
    assert.ok(conversation.getWordEntries().some((entry) => entry.surface === '星の本'));
    assert.ok(findCommonKnowledge('犬'));
  });

  run('旧v6保存から必要情報だけv9へ移行する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 6,
      words: {
        映画: {
          id: 'word_movie', surface: '映画', category: 'MEDIA',
          firstSeen: '2026-09-01T00:00:00.000Z', lastSeen: '2026-09-02T00:00:00.000Z',
          mentionCount: 2, attributes: { feeling: '好き' }, userSentiment: 'LIKE',
          oshiStatus: 'UNKNOWN', importance: 0.5,
        },
      },
      memories: [], relations: [], events: [],
      conversations: [{ timestamp: '2026-09-01T00:00:00.000Z', speaker: 'USER', text: '映画', sessionId: 'old', topic: '映画' }],
      startDate: '2026-09-08', dayOverride: null, ended: false, conversationCount: 1,
      goalText: '映画を見る', goalSetAt: '2026-09-08', lastGoalCheckDate: '2026-09-08', goalChecks: [],
      lastWordSurface: '映画', oshiLoveCounts: {},
      memoryConversationRecords: [{ id: 'legacy' }],
      memoryConversationRecentTemplateIds: ['legacy'],
      promptedRecentQuestionIds: ['legacy'],
      normalConversationDeck: ['MEMORY'],
    }));
    const conversation = create(storage);
    assert.equal(conversation.getGoal(), '映画を見る');
    assert.equal(conversation.getWordEntries()[0]?.surface, '映画');
    assert.equal(conversation.getConversationLogs()[0]?.text, '映画');
    conversation.startSession();
    const migrated = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    assert.equal(migrated.version, 9);
    assert.equal(migrated.memoryConversationRecords, undefined);
    assert.equal(migrated.promptedRecentQuestionIds, undefined);
    assert.equal(migrated.normalConversationDeck, undefined);
    assert.equal(migrated.seenConversationIds.length, 1);
    assert.deepEqual(migrated.conversationChoiceRecords, []);
    assert.deepEqual(migrated.memoryRelations, []);
    assert.deepEqual(migrated.openQuestions, []);
    assert.deepEqual(migrated.memoryEpisodes, []);
    assert.equal(conversation.getWordEntries()[0]?.knowledgeLevel, 'KNOWN');
    assert.equal(conversation.getWordEntries()[0]?.firstSeenDay, 1);
  });

  run('30日目のお別れ処理を維持する', () => {
    const conversation = create();
    prepare(conversation, '30日で本を読む');
    let response = conversation.jumpFarewell();
    assert.equal(response.stage, 'farewell');
    for (let index = 0; index < 20 && response.stage === 'farewell'; index += 1) {
      response = conversation.continueFarewell();
    }
    assert.equal(response.stage, 'ended');
    assert.equal(conversation.isEnded(), true);
    assert.match(conversation.getLetter(), /30日間/);
  });

  assert.equal(typeof SuuhimochiConversation.prototype.startPromptedLearning, 'undefined');
  assert.equal(typeof SuuhimochiConversation.prototype.prepareAmbientMemoryConversation, 'undefined');
  console.log(`\nConversation foundation: ${passed} passed, ${failed} failed`);
} finally {
  await vite.close();
}

if (failed) process.exitCode = 1;
