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
  const { SuuhimochiConversation } =
    await vite.ssrLoadModule('/lib/wordMemory.ts');
  const { findCommonKnowledge } = await vite.ssrLoadModule(
    '/lib/commonKnowledgeData.ts',
  );
  const { runConversationEngine } = await vite.ssrLoadModule(
    '/lib/conversation/conversationEngine.ts',
  );
  const { PERSON_DERIVED_CONVERSATIONS, PERSON_DEEP_DIVE_CONVERSATIONS } =
    await vite.ssrLoadModule('/lib/conversation/personDerivedConversations.ts');
  const {
    CATEGORY_CHOICES,
    CATEGORY_LABELS,
    PERSON_SUBCATEGORY_CHOICES,
    SUBCATEGORY_CHOICES,
    subcategoryLabel,
  } =
    await vite.ssrLoadModule('/lib/conversationData.ts');
  const { awardWordComboAnswer } = await vite.ssrLoadModule(
    '/lib/personWordCombo.ts',
  );
  const {
    getNewlyCommittedKana,
    getWordComboConfirmedDanceFrames,
    getWordComboDanceFrames,
    getWordComboDanceCycleMs,
    getWordComboDancePoseForKana,
    getWordComboInputDanceFrames,
    WORD_COMBO_DANCE_CYCLE_MS,
    WORD_COMBO_DANCE_FRAME_DURATIONS,
    WORD_COMBO_FINISH_POSE_MS,
    WORD_COMBO_INPUT_IDLE_MS,
    WORD_COMBO_INPUT_POSE_MS,
  } = await vite.ssrLoadModule('/lib/wordComboDance.ts');
  const memory = () => {
    const values = new Map();
    return {
      values,
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    };
  };
  const create = (
    storage = memory(),
    date = '2026-09-08T20:00:00+09:00',
    random = () => 0.5,
  ) =>
    new SuuhimochiConversation({
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
    assert.ok(
      response.pages.every(
        (page) => page.lines.length >= 1 && page.lines.length <= 4,
      ),
    );
    assert.deepEqual(
      response.pages.flatMap((page) => page.lines),
      response.lines,
    );
    if (response.lines.length > 1)
      assert.ok(response.pages.length < response.lines.length);
  };
  const teachPerson = (conversation, surface, subcategory) => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('PERSON');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachPet = (conversation, surface, status = 'PET_CURRENT') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('ANIMAL');
    conversation.chooseSubCategory('ANIMAL_PET');
    conversation.choose(status);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachAnimal = (conversation, surface, subcategory = 'ANIMAL_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('ANIMAL');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachFood = (conversation, surface, subcategory = 'FOOD_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('FOOD');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachPlace = (conversation, surface, subcategory = 'PLACE_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('PLACE');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachNatureTime = (conversation, surface, subcategory = 'NATURE_TIME_2') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('NATURE_TIME');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachObject = (conversation, surface, subcategory = 'OBJECT_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('OBJECT');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachClothing = (conversation, surface, subcategory = 'CLOTHING_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('CLOTHING');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachTech = (conversation, surface, subcategory = 'TECH_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('TECH');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachVehicle = (conversation, surface, subcategory = 'VEHICLE_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('VEHICLE');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachActivity = (conversation, surface, subcategory = 'ACTIVITY_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('ACTIVITY');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachSports = (conversation, surface, subcategory = 'SPORTS_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('SPORTS');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachWork = (conversation, surface, subcategory = 'WORK_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('WORK');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const teachSchool = (conversation, surface, subcategory = 'SCHOOL_1') => {
    conversation.startWordTeaching();
    conversation.submit(surface);
    conversation.chooseCategory('SCHOOL');
    conversation.chooseSubCategory(subcategory);
    conversation.choose('WORD_NEUTRAL');
    return conversation
      .getWordEntries()
      .find((word) => word.surface === surface);
  };
  const openPersonDerivedTest = (conversation) => {
    // 日別台本と衝突しない日にPERSON派生会話を隔離して検証する。
    conversation.state.dayOverride = 29;
    conversation.state.seenConversationIds.push(
      'DAY29_SELF_01', 'DAY29_SELF_02', 'DAY29_SELF_03',
      'DAY29_SELF_04', 'DAY29_SELF_05', 'DAY29_SELF_06',
      'DAY29_CURIOUS_07', 'DAY29_CURIOUS_08', 'DAY29_CURIOUS_09',
      'DAY29_CURIOUS_10', 'DAY29_CURIOUS_11', 'DAY29_CURIOUS_12',
    );
    conversation.state.lastGoalCheckDate = '2026-09-08';
    conversation.save();
    return conversation.startSession();
  };

  run('Day1・Day2会話エンジンは未閲覧の完成台本を返す', () => {
    const result = runConversationEngine({
      intent: 'CHAT',
      day: 1,
      seenConversationIds: [],
      random: () => 0,
    });
    assert.equal(result.conversation?.id, 'DAY01_SELF_01');
    assert.equal(result.conversation?.choices.length, 3);
    assert.equal(result.conversation?.opening[0]?.text, '人間さん。');
    const day2 = runConversationEngine({
      intent: 'CHAT',
      day: 2,
      seenConversationIds: [],
      random: () => 0,
    }).conversation;
    assert.equal(day2?.id, 'DAY02_SELF_01');
    assert.equal(day2?.choices.length, 3);
  });

  run('Day3はSELF6本の後にCURIOUS6本を順番に出す', () => {
    const seenConversationIds = [];
    const categories = [];
    const ids = [];
    for (let index = 0; index < 12; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 3, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      ids.push(conversation.id);
      categories.push(conversation.category);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(categories, [...Array(6).fill('SELF'), ...Array(6).fill('CURIOUS')]);
    assert.equal(new Set(ids).size, 12);
    assert.equal(ids[0], 'DAY03_SELF_01');
    assert.equal(ids[6], 'DAY03_CURIOUS_07');
  });

  run('Day4の添付台本6本を未閲覧順に出題する', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 4, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, ['DAY04_SELF_01', 'DAY04_SELF_02', 'DAY04_SELF_03', 'DAY04_SELF_04', 'DAY04_SELF_05', 'DAY04_SELF_06']);
  });

  run('Day4のCURIOUS6本は添付原稿の順に指定カテゴリーへ進む', () => {
    const seenConversationIds = ['DAY04_SELF_01', 'DAY04_SELF_02', 'DAY04_SELF_03', 'DAY04_SELF_04', 'DAY04_SELF_05', 'DAY04_SELF_06'];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 4, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, ['DAY04_CURIOUS_07', 'DAY04_CURIOUS_08', 'DAY04_CURIOUS_09', 'DAY04_CURIOUS_10', 'DAY04_CURIOUS_11', 'DAY04_CURIOUS_12']);
  });

  run('Day4会話はカテゴリ外の入力を登録せず聞き直し、対象カテゴリーへ保存する', () => {
    const conversation = create(memory(), '2026-09-08T20:00:00+09:00', () => 0);
    prepare(conversation);
    conversation.state.dayOverride = 4;
    conversation.state.lastGoalCheckDate = '2026-09-08';
    conversation.state.seenConversationIds = ['DAY04_SELF_01', 'DAY04_SELF_02', 'DAY04_SELF_03', 'DAY04_SELF_04', 'DAY04_SELF_05', 'DAY04_SELF_06'];
    conversation.save();
    const opening = conversation.startSession();
    assert.equal(opening.debug.selectedTemplate, 'DAY04_CURIOUS_07');
    const retry = conversation.submit('りんご');
    assert.equal(retry.inputMode, 'text');
    assert.match(retry.lines.join(' '), /天気の言葉を一つ教えて/);
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'りんご'), false);
    conversation.submit('晴れ');
    assert.equal(conversation.getWordEntries().find((word) => word.surface === '晴れ')?.category, 'NATURE_TIME');
    conversation.choose('DAY04_CURIOUS_07_KNOWN_NEUTRAL');
    assert.equal(conversation.getWordEntries().find((word) => word.surface === '晴れ')?.subcategory, 'NATURE_TIME_1');
    assert.ok(conversation.getConversationChoiceRecords().some((record) => record.choiceId === 'DAY04_CURIOUS_07_KNOWN_NEUTRAL'));
  });
  run('Day5は添付原稿の前半SELF6の後に後半CURIOUS6を出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 12; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 5, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, index < 6 ? 'SELF' : 'CURIOUS');
      if (index < 6) assert.equal(conversation.choices.length, 3);
      else assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY05_SELF_01', 'DAY05_SELF_02', 'DAY05_SELF_03', 'DAY05_SELF_04', 'DAY05_SELF_05', 'DAY05_SELF_06',
      'DAY05_CURIOUS_07', 'DAY05_CURIOUS_08', 'DAY05_CURIOUS_09', 'DAY05_CURIOUS_10', 'DAY05_CURIOUS_11', 'DAY05_CURIOUS_12',
    ]);
  });
  run('Day6前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 6, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY06_SELF_01', 'DAY06_SELF_02', 'DAY06_SELF_03',
      'DAY06_SELF_04', 'DAY06_SELF_05', 'DAY06_SELF_06',
    ]);
  });
  run('Day6は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY06_SELF_01', 'DAY06_SELF_02', 'DAY06_SELF_03',
      'DAY06_SELF_04', 'DAY06_SELF_05', 'DAY06_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 6, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY06_CURIOUS_07', 'DAY06_CURIOUS_08', 'DAY06_CURIOUS_09',
      'DAY06_CURIOUS_10', 'DAY06_CURIOUS_11', 'DAY06_CURIOUS_12',
    ]);
  });
  run('Day7前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 7, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY07_SELF_01', 'DAY07_SELF_02', 'DAY07_SELF_03',
      'DAY07_SELF_04', 'DAY07_SELF_05', 'DAY07_SELF_06',
    ]);
  });
  run('Day7は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY07_SELF_01', 'DAY07_SELF_02', 'DAY07_SELF_03',
      'DAY07_SELF_04', 'DAY07_SELF_05', 'DAY07_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 7, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY07_CURIOUS_07', 'DAY07_CURIOUS_08', 'DAY07_CURIOUS_09',
      'DAY07_CURIOUS_10', 'DAY07_CURIOUS_11', 'DAY07_CURIOUS_12',
    ]);
  });
  run('Day8前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 8, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY08_SELF_01', 'DAY08_SELF_02', 'DAY08_SELF_03',
      'DAY08_SELF_04', 'DAY08_SELF_05', 'DAY08_SELF_06',
    ]);
  });
  run('Day8は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY08_SELF_01', 'DAY08_SELF_02', 'DAY08_SELF_03',
      'DAY08_SELF_04', 'DAY08_SELF_05', 'DAY08_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 8, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY08_CURIOUS_07', 'DAY08_CURIOUS_08', 'DAY08_CURIOUS_09',
      'DAY08_CURIOUS_10', 'DAY08_CURIOUS_11', 'DAY08_CURIOUS_12',
    ]);
  });  run('Day9前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 9, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY09_SELF_01', 'DAY09_SELF_02', 'DAY09_SELF_03',
      'DAY09_SELF_04', 'DAY09_SELF_05', 'DAY09_SELF_06',
    ]);
  });  run('Day9は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY09_SELF_01', 'DAY09_SELF_02', 'DAY09_SELF_03',
      'DAY09_SELF_04', 'DAY09_SELF_05', 'DAY09_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 9, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY09_CURIOUS_07', 'DAY09_CURIOUS_08', 'DAY09_CURIOUS_09',
      'DAY09_CURIOUS_10', 'DAY09_CURIOUS_11', 'DAY09_CURIOUS_12',
    ]);
  });  run('Day10前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 10, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY10_SELF_01', 'DAY10_SELF_02', 'DAY10_SELF_03',
      'DAY10_SELF_04', 'DAY10_SELF_05', 'DAY10_SELF_06',
    ]);
  });  run('Day10は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY10_SELF_01', 'DAY10_SELF_02', 'DAY10_SELF_03',
      'DAY10_SELF_04', 'DAY10_SELF_05', 'DAY10_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 10, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY10_CURIOUS_07', 'DAY10_CURIOUS_08', 'DAY10_CURIOUS_09',
      'DAY10_CURIOUS_10', 'DAY10_CURIOUS_11', 'DAY10_CURIOUS_12',
    ]);
  });  run('Day11前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 11, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY11_SELF_01', 'DAY11_SELF_02', 'DAY11_SELF_03',
      'DAY11_SELF_04', 'DAY11_SELF_05', 'DAY11_SELF_06',
    ]);
  });  run('Day11は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY11_SELF_01', 'DAY11_SELF_02', 'DAY11_SELF_03',
      'DAY11_SELF_04', 'DAY11_SELF_05', 'DAY11_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 11, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY11_CURIOUS_07', 'DAY11_CURIOUS_08', 'DAY11_CURIOUS_09',
      'DAY11_CURIOUS_10', 'DAY11_CURIOUS_11', 'DAY11_CURIOUS_12',
    ]);
  });
  run('Day12前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 12, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY12_SELF_01', 'DAY12_SELF_02', 'DAY12_SELF_03',
      'DAY12_SELF_04', 'DAY12_SELF_05', 'DAY12_SELF_06',
    ]);
  });
  run('Day12は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY12_SELF_01', 'DAY12_SELF_02', 'DAY12_SELF_03',
      'DAY12_SELF_04', 'DAY12_SELF_05', 'DAY12_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 12, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY12_CURIOUS_07', 'DAY12_CURIOUS_08', 'DAY12_CURIOUS_09',
      'DAY12_CURIOUS_10', 'DAY12_CURIOUS_11', 'DAY12_CURIOUS_12',
    ]);
  });
  run('Day13前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 13, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY13_SELF_01', 'DAY13_SELF_02', 'DAY13_SELF_03',
      'DAY13_SELF_04', 'DAY13_SELF_05', 'DAY13_SELF_06',
    ]);
  });
  run('Day13は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY13_SELF_01', 'DAY13_SELF_02', 'DAY13_SELF_03',
      'DAY13_SELF_04', 'DAY13_SELF_05', 'DAY13_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 13, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY13_CURIOUS_07', 'DAY13_CURIOUS_08', 'DAY13_CURIOUS_09',
      'DAY13_CURIOUS_10', 'DAY13_CURIOUS_11', 'DAY13_CURIOUS_12',
    ]);
  });
  run('Day14前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 14, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY14_SELF_01', 'DAY14_SELF_02', 'DAY14_SELF_03',
      'DAY14_SELF_04', 'DAY14_SELF_05', 'DAY14_SELF_06',
    ]);
  });
  run('Day14は前半SELF6の後に添付原稿のCURIOUS6を続ける', () => {
    const seenConversationIds = [
      'DAY14_SELF_01', 'DAY14_SELF_02', 'DAY14_SELF_03',
      'DAY14_SELF_04', 'DAY14_SELF_05', 'DAY14_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 14, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY14_CURIOUS_07', 'DAY14_CURIOUS_08', 'DAY14_CURIOUS_09',
      'DAY14_CURIOUS_10', 'DAY14_CURIOUS_11', 'DAY14_CURIOUS_12',
    ]);
  });
  run('Day15前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 15, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY15_SELF_01', 'DAY15_SELF_02', 'DAY15_SELF_03',
      'DAY15_SELF_04', 'DAY15_SELF_05', 'DAY15_SELF_06',
    ]);
  });
  run('Day15後半は添付原稿のCURIOUS6会話を順番に出す', () => {
    const seenConversationIds = [
      'DAY15_SELF_01', 'DAY15_SELF_02', 'DAY15_SELF_03',
      'DAY15_SELF_04', 'DAY15_SELF_05', 'DAY15_SELF_06',
    ];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 15, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY15_CURIOUS_07', 'DAY15_CURIOUS_08', 'DAY15_CURIOUS_09',
      'DAY15_CURIOUS_10', 'DAY15_CURIOUS_11', 'DAY15_CURIOUS_12',
    ]);
  });
  run('Day16前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 16, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY16_SELF_01', 'DAY16_SELF_02', 'DAY16_SELF_03',
      'DAY16_SELF_04', 'DAY16_SELF_05', 'DAY16_SELF_06',
    ]);
  });
  run('Day16後半は添付原稿のCURIOUS6会話を指定カテゴリーへ順番に出す', () => {
    const seenConversationIds = [
      'DAY16_SELF_01', 'DAY16_SELF_02', 'DAY16_SELF_03',
      'DAY16_SELF_04', 'DAY16_SELF_05', 'DAY16_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 16, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY16_CURIOUS_07', 'DAY16_CURIOUS_08', 'DAY16_CURIOUS_09',
      'DAY16_CURIOUS_10', 'DAY16_CURIOUS_11', 'DAY16_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['ACTIVITY', 'ACTIVITY_5'], ['PERSON', 'PERSON_1'], ['EVENT', 'EVENT_5'],
      ['TECH', 'TECH_6'], ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['MONEY', 'MONEY_3'],
    ]);
  });
  run('Day17前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 17, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY17_SELF_01', 'DAY17_SELF_02', 'DAY17_SELF_03',
      'DAY17_SELF_04', 'DAY17_SELF_05', 'DAY17_SELF_06',
    ]);
  });
  run('Day17後半は添付原稿のCURIOUS6会話を指定カテゴリーへ順番に出す', () => {
    const seenConversationIds = [
      'DAY17_SELF_01', 'DAY17_SELF_02', 'DAY17_SELF_03',
      'DAY17_SELF_04', 'DAY17_SELF_05', 'DAY17_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 17, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY17_CURIOUS_07', 'DAY17_CURIOUS_08', 'DAY17_CURIOUS_09',
      'DAY17_CURIOUS_10', 'DAY17_CURIOUS_11', 'DAY17_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['ANIMAL', 'ANIMAL_2'], ['FOOD', 'FOOD_3'], ['OBJECT', 'OBJECT_2'],
      ['VEHICLE', 'VEHICLE_1'], ['GAME_MEDIA', 'GAME_MEDIA_3'], ['PLACE', 'PLACE_3'],
    ]);
  });
  run('Day18前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 18, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY18_SELF_01', 'DAY18_SELF_02', 'DAY18_SELF_03',
      'DAY18_SELF_04', 'DAY18_SELF_05', 'DAY18_SELF_06',
    ]);
  });
  run('Day19前半は添付原稿のSELF6会話と選択肢を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 19, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY19_SELF_01', 'DAY19_SELF_02', 'DAY19_SELF_03',
      'DAY19_SELF_04', 'DAY19_SELF_05', 'DAY19_SELF_06',
    ]);
  });
  run('Day20前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 20, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY20_SELF_01', 'DAY20_SELF_02', 'DAY20_SELF_03',
      'DAY20_SELF_04', 'DAY20_SELF_05', 'DAY20_SELF_06',
    ]);
  });
  run('Day21前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 21, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY21_SELF_01', 'DAY21_SELF_02', 'DAY21_SELF_03',
      'DAY21_SELF_04', 'DAY21_SELF_05', 'DAY21_SELF_06',
    ]);
  });
  run('Day22前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 22, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY22_SELF_01', 'DAY22_SELF_02', 'DAY22_SELF_03',
      'DAY22_SELF_04', 'DAY22_SELF_05', 'DAY22_SELF_06',
    ]);
  });
  run('Day24後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY24_SELF_01', 'DAY24_SELF_02', 'DAY24_SELF_03',
      'DAY24_SELF_04', 'DAY24_SELF_05', 'DAY24_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 24, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY24_CURIOUS_07', 'DAY24_CURIOUS_08', 'DAY24_CURIOUS_09',
      'DAY24_CURIOUS_10', 'DAY24_CURIOUS_11', 'DAY24_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['ANIMAL', 'ANIMAL_1'], ['OBJECT', 'OBJECT_2'], ['PLACE', 'PLACE_2'],
      ['SPORTS', 'SPORTS_1'], ['ACTIVITY', 'ACTIVITY_3'], ['FOOD', 'FOOD_3'],
    ]);
  });
  run('Day25後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY25_SELF_01', 'DAY25_SELF_02', 'DAY25_SELF_03',
      'DAY25_SELF_04', 'DAY25_SELF_05', 'DAY25_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 25, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY25_CURIOUS_07', 'DAY25_CURIOUS_08', 'DAY25_CURIOUS_09',
      'DAY25_CURIOUS_10', 'DAY25_CURIOUS_11', 'DAY25_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['ANIMAL', 'ANIMAL_5'], ['FOOD', 'FOOD_1'], ['VEHICLE', 'VEHICLE_1'],
      ['NATURE_TIME', 'NATURE_TIME_4'], ['AV_MEDIA', 'AV_MEDIA_3'], ['BODY', 'BODY_4'],
    ]);
  });
  run('Day26後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY26_SELF_01', 'DAY26_SELF_02', 'DAY26_SELF_03',
      'DAY26_SELF_04', 'DAY26_SELF_05', 'DAY26_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 26, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY26_CURIOUS_07', 'DAY26_CURIOUS_08', 'DAY26_CURIOUS_09',
      'DAY26_CURIOUS_10', 'DAY26_CURIOUS_11', 'DAY26_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['PLACE', 'PLACE_5'], ['OBJECT', 'OBJECT_5'], ['CLOTHING', 'CLOTHING_5'],
      ['SPORTS', 'SPORTS_4'], ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['NATURE_TIME', 'NATURE_TIME_6'],
    ]);
  });
  run('Day30前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 30, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY30_SELF_01', 'DAY30_SELF_02', 'DAY30_SELF_03',
      'DAY30_SELF_04', 'DAY30_SELF_05', 'DAY30_SELF_06',
    ]);
  });
  run('Day30後半は添付原稿のPERSON6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY30_SELF_01', 'DAY30_SELF_02', 'DAY30_SELF_03',
      'DAY30_SELF_04', 'DAY30_SELF_05', 'DAY30_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 30, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      assert.equal(conversation.known.choices.length, 3);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY30_CURIOUS_07', 'DAY30_CURIOUS_08', 'DAY30_CURIOUS_09',
      'DAY30_CURIOUS_10', 'DAY30_CURIOUS_11', 'DAY30_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['FOOD', 'FOOD_3'], ['CLOTHING', 'CLOTHING_4'], ['VEHICLE', 'VEHICLE_5'],
      ['GAME_MEDIA', 'GAME_MEDIA_3'], ['ANIMAL', 'ANIMAL_4'], ['PLACE', 'PLACE_7'],
    ]);
  });
  run('Day30のSELF6完了後は通常起動でPERSON6が始まり、全12会話後に卒業へ進む', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.state.dayOverride = 30;
    conversation.state.lastGoalCheckDate = '2026-09-08';
    conversation.state.seenConversationIds = [
      'DAY30_SELF_01', 'DAY30_SELF_02', 'DAY30_SELF_03',
      'DAY30_SELF_04', 'DAY30_SELF_05', 'DAY30_SELF_06',
    ];
    conversation.save();
    const response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'DAY30_CURIOUS_07');
    assert.equal(response.inputMode, 'text');
    conversation.state.seenConversationIds.push(
      'DAY30_CURIOUS_07', 'DAY30_CURIOUS_08', 'DAY30_CURIOUS_09',
      'DAY30_CURIOUS_10', 'DAY30_CURIOUS_11', 'DAY30_CURIOUS_12',
    );
    conversation.save();
    const farewell = conversation.startSession();
    assert.equal(farewell.stage, 'farewell');
  });
  run('Day30の通常起動は未読SELF会話を先に出し、明示的な卒業処理は維持する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.state.dayOverride = 30;
    conversation.state.lastGoalCheckDate = '2026-09-08';
    conversation.save();
    const response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'DAY30_SELF_01');
    assert.equal(response.stage, 'followup');
  });  run('Day29後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY29_SELF_01', 'DAY29_SELF_02', 'DAY29_SELF_03',
      'DAY29_SELF_04', 'DAY29_SELF_05', 'DAY29_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 29, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      assert.equal(conversation.known.choices.length, 3);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY29_CURIOUS_07', 'DAY29_CURIOUS_08', 'DAY29_CURIOUS_09',
      'DAY29_CURIOUS_10', 'DAY29_CURIOUS_11', 'DAY29_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['FOOD', 'FOOD_5'], ['CLOTHING', 'CLOTHING_3'], ['TECH', 'TECH_2'],
      ['ACTIVITY', 'ACTIVITY_1'], ['AV_MEDIA', 'AV_MEDIA_2'], ['EVENT', 'EVENT_2'],
    ]);
  });  run('Day29前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 29, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY29_SELF_01', 'DAY29_SELF_02', 'DAY29_SELF_03',
      'DAY29_SELF_04', 'DAY29_SELF_05', 'DAY29_SELF_06',
    ]);
  });  run('Day28前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 28, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY28_SELF_01', 'DAY28_SELF_02', 'DAY28_SELF_03',
      'DAY28_SELF_04', 'DAY28_SELF_05', 'DAY28_SELF_06',
    ]);
  });
  run('Day28後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY28_SELF_01', 'DAY28_SELF_02', 'DAY28_SELF_03',
      'DAY28_SELF_04', 'DAY28_SELF_05', 'DAY28_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 28, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      assert.equal(conversation.known.choices.length, 3);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY28_CURIOUS_07', 'DAY28_CURIOUS_08', 'DAY28_CURIOUS_09',
      'DAY28_CURIOUS_10', 'DAY28_CURIOUS_11', 'DAY28_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['ANIMAL', 'ANIMAL_2'], ['OBJECT', 'OBJECT_3'], ['CLOTHING', 'CLOTHING_2'],
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['NATURE_TIME', 'NATURE_TIME_2'], ['TECH', 'TECH_4'],
    ]);
  });
  run('Day28のSELF6完了後は通常起動でCURIOUS6が始まる', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.state.dayOverride = 28;
    conversation.state.lastGoalCheckDate = '2026-09-08';
    conversation.state.seenConversationIds = [
      'DAY28_SELF_01', 'DAY28_SELF_02', 'DAY28_SELF_03',
      'DAY28_SELF_04', 'DAY28_SELF_05', 'DAY28_SELF_06',
    ];
    conversation.save();
    const response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'DAY28_CURIOUS_07');
    assert.equal(response.inputMode, 'text');
  });
  run('Day27後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY27_SELF_01', 'DAY27_SELF_02', 'DAY27_SELF_03',
      'DAY27_SELF_04', 'DAY27_SELF_05', 'DAY27_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 27, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      assert.equal(conversation.known.choices.length, 3);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY27_CURIOUS_07', 'DAY27_CURIOUS_08', 'DAY27_CURIOUS_09',
      'DAY27_CURIOUS_10', 'DAY27_CURIOUS_11', 'DAY27_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['PLACE', 'PLACE_3'],
      ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'], ['NATURE_TIME', 'NATURE_TIME_6'],
      ['MONEY', 'MONEY_2'], ['SPORTS', 'SPORTS_3'],
    ]);
  });
  run('Day27前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 27, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY27_SELF_01', 'DAY27_SELF_02', 'DAY27_SELF_03',
      'DAY27_SELF_04', 'DAY27_SELF_05', 'DAY27_SELF_06',
    ]);
  });
  run('Day26前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 26, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY26_SELF_01', 'DAY26_SELF_02', 'DAY26_SELF_03',
      'DAY26_SELF_04', 'DAY26_SELF_05', 'DAY26_SELF_06',
    ]);
  });
  run('Day25前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 25, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY25_SELF_01', 'DAY25_SELF_02', 'DAY25_SELF_03',
      'DAY25_SELF_04', 'DAY25_SELF_05', 'DAY25_SELF_06',
    ]);
  });
  run('Day24前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 24, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY24_SELF_01', 'DAY24_SELF_02', 'DAY24_SELF_03',
      'DAY24_SELF_04', 'DAY24_SELF_05', 'DAY24_SELF_06',
    ]);
  });
  run('Day23前半は添付原稿のSELF6会話を順番に出す', () => {
    const seenConversationIds = [];
    const ids = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 23, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'SELF');
      assert.equal(conversation.choices.length, 3);
      ids.push(conversation.id);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY23_SELF_01', 'DAY23_SELF_02', 'DAY23_SELF_03',
      'DAY23_SELF_04', 'DAY23_SELF_05', 'DAY23_SELF_06',
    ]);
  });
  run('Day23後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY23_SELF_01', 'DAY23_SELF_02', 'DAY23_SELF_03',
      'DAY23_SELF_04', 'DAY23_SELF_05', 'DAY23_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 23, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY23_CURIOUS_07', 'DAY23_CURIOUS_08', 'DAY23_CURIOUS_09',
      'DAY23_CURIOUS_10', 'DAY23_CURIOUS_11', 'DAY23_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['OBJECT', 'OBJECT_3'], ['NATURE_TIME', 'NATURE_TIME_1'], ['PLACE', 'PLACE_1'],
      ['GAME_MEDIA', 'GAME_MEDIA_4'], ['FOOD', 'FOOD_2'], ['VEHICLE', 'VEHICLE_2'],
    ]);
  });
  run('Day22後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY22_SELF_01', 'DAY22_SELF_02', 'DAY22_SELF_03',
      'DAY22_SELF_04', 'DAY22_SELF_05', 'DAY22_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 22, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY22_CURIOUS_07', 'DAY22_CURIOUS_08', 'DAY22_CURIOUS_09',
      'DAY22_CURIOUS_10', 'DAY22_CURIOUS_11', 'DAY22_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['ANIMAL', 'ANIMAL_3'], ['FOOD', 'FOOD_4'], ['OBJECT', 'OBJECT_1'],
      ['NATURE_TIME', 'NATURE_TIME_3'], ['AV_MEDIA', 'AV_MEDIA_1'], ['ACTIVITY', 'ACTIVITY_4'],
    ]);
  });
  run('Day21後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY21_SELF_01', 'DAY21_SELF_02', 'DAY21_SELF_03',
      'DAY21_SELF_04', 'DAY21_SELF_05', 'DAY21_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 21, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY21_CURIOUS_07', 'DAY21_CURIOUS_08', 'DAY21_CURIOUS_09',
      'DAY21_CURIOUS_10', 'DAY21_CURIOUS_11', 'DAY21_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['FOOD', 'FOOD_5'], ['CLOTHING', 'CLOTHING_4'], ['SCHOOL', 'SCHOOL_2'],
      ['VEHICLE', 'VEHICLE_4'], ['GAME_MEDIA', 'GAME_MEDIA_2'], ['EVENT', 'EVENT_2'],
    ]);
  });
  run('Day20後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY20_SELF_01', 'DAY20_SELF_02', 'DAY20_SELF_03',
      'DAY20_SELF_04', 'DAY20_SELF_05', 'DAY20_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 20, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY20_CURIOUS_07', 'DAY20_CURIOUS_08', 'DAY20_CURIOUS_09',
      'DAY20_CURIOUS_10', 'DAY20_CURIOUS_11', 'DAY20_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['OBJECT', 'OBJECT_4'], ['CLOTHING', 'CLOTHING_3'], ['VEHICLE', 'VEHICLE_3'],
      ['SCHOOL', 'SCHOOL_1'], ['EMOTION', 'EMOTION_2'], ['TECH', 'TECH_1'],
    ]);
  });
  run('Day19後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ進む', () => {
    const seenConversationIds = [
      'DAY19_SELF_01', 'DAY19_SELF_02', 'DAY19_SELF_03',
      'DAY19_SELF_04', 'DAY19_SELF_05', 'DAY19_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 19, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY19_CURIOUS_07', 'DAY19_CURIOUS_08', 'DAY19_CURIOUS_09',
      'DAY19_CURIOUS_10', 'DAY19_CURIOUS_11', 'DAY19_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['CLOTHING', 'CLOTHING_1'], ['TECH', 'TECH_2'], ['AV_MEDIA', 'AV_MEDIA_2'],
      ['ACTIVITY', 'ACTIVITY_1'], ['EVENT', 'EVENT_3'], ['BODY', 'BODY_1'],
    ]);
  });
  run('Day18後半は添付原稿のCURIOUS6会話を順番に出し、指定カテゴリーへ記録する', () => {
    const seenConversationIds = [
      'DAY18_SELF_01', 'DAY18_SELF_02', 'DAY18_SELF_03',
      'DAY18_SELF_04', 'DAY18_SELF_05', 'DAY18_SELF_06',
    ];
    const ids = [];
    const categories = [];
    for (let index = 0; index < 6; index += 1) {
      const conversation = runConversationEngine({ intent: 'CHAT', day: 18, seenConversationIds, random: () => 0 }).conversation;
      assert.ok(conversation);
      assert.equal(conversation.category, 'CURIOUS');
      assert.ok(conversation.known && conversation.unknown);
      ids.push(conversation.id);
      categories.push([conversation.context.category, conversation.context.subcategory]);
      seenConversationIds.push(conversation.id);
    }
    assert.deepEqual(ids, [
      'DAY18_CURIOUS_07', 'DAY18_CURIOUS_08', 'DAY18_CURIOUS_09',
      'DAY18_CURIOUS_10', 'DAY18_CURIOUS_11', 'DAY18_CURIOUS_12',
    ]);
    assert.deepEqual(categories, [
      ['FOOD', 'FOOD_1'], ['CLOTHING', 'CLOTHING_2'], ['PLACE', 'PLACE_7'],
      ['WORK', 'WORK_1'], ['NATURE_TIME', 'NATURE_TIME_2'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
    ]);
  });
  const finishDay1SelfAndInterest = (conversation) => {    const openings = [];
    for (let index = 0; index < 7; index += 1) {
      const opening = conversation.startSession();
      openings.push(opening);
      if (opening.inputMode === 'text') {
        assert.equal(index, 1);
        conversation.submit('ガンプラ');
        conversation.chooseCategory('OBJECT');
        conversation.chooseSubCategory('OBJECT_1');
        conversation.choose('EARLY_COMBO_LATER');
      } else {
        assert.equal(opening.choices.length, 3);
        const ending = conversation.choose(opening.choices[0].id);
        assert.equal(ending.stage, 'complete');
        assertPagedResponse(ending);
      }
    }
    return openings;
  };

  run('Day1は2会話目で興味を聞き、SELF6会話の選択と終点も保存する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const openings = finishDay1SelfAndInterest(conversation);
    assert.equal(openings[1].debug.selectedTemplate, 'DAY01_CURIOUS_03');
    assert.equal(openings.filter((opening) => opening.debug.selectedTemplate.includes('_SELF_')).length, 6);
    assert.deepEqual(conversation.getSeenConversationIds().sort(), [
      'DAY01_CURIOUS_03',
      'DAY01_SELF_01',
      'DAY01_SELF_02',
      'DAY01_SELF_03',
      'DAY01_SELF_04',
      'DAY01_SELF_05',
      'DAY01_SELF_06',
    ]);
    const records = conversation.getConversationChoiceRecords();
    assert.equal(records.length, 7);
    assert.ok(
      records.every(
        (record) => (record.choiceId.endsWith('_CHOICE_01') || record.choiceId === 'EARLY_COMBO_LATER') && record.day === 1,
      ),
    );
    const saved = JSON.parse(
      storage.getItem('suuhimochi_conversation_v6_choices'),
    );
    assert.equal(saved.version, 16);
    assert.equal(saved.seenConversationIds.length, 7);
    assert.equal(saved.conversationChoiceRecords.length, 7);
  });

  run('Day1は初回の興味と残り5つのLEARNで6会話を保ち、自然に終了する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    finishDay1SelfAndInterest(conversation);

    const cases = [
      ['ビリヤニ', 'DAY01_CURIOUS_01_UNKNOWN_RICE'],
      ['ぼんやりタイム', 'DAY01_CURIOUS_02_UNKNOWN_NOTHING'],
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
    const biriyani = conversation
      .getWordEntries()
      .find((entry) => entry.surface === 'ビリヤニ');
    assert.equal(biriyani?.category, 'FOOD');
    assert.equal(biriyani?.subcategory, 'RICE');
    assert.equal(biriyani?.rootWordId, biriyani?.id);
    assert.ok((biriyani?.learnedOrder ?? 0) > 0);
    assert.ok(
      conversation
        .getMemoryRelations()
        .some(
          (relation) =>
            relation.type === 'LIKES' && relation.objectId === biriyani?.id,
        ),
    );
    assert.ok(
      conversation
        .getMemoryRelations()
        .some(
          (relation) =>
            relation.type === 'MAKES_HAPPY' &&
            relation.objectId === biriyani?.id,
        ),
    );
    assert.ok(
      conversation
        .getOpenQuestions()
        .some(
          (question) =>
            question.wordId === biriyani?.id && question.status === 'OPEN',
        ),
    );

    const nothing = conversation
      .getWordEntries()
      .find((entry) => entry.surface === 'ぼんやりタイム');
    const nothingRelations = conversation
      .getMemoryRelations()
      .filter((relation) => relation.objectId === nothing?.id);
    assert.ok(
      nothingRelations.some((relation) => relation.type === 'FREQUENTLY_DOES'),
    );
    assert.ok(!nothingRelations.some((relation) => relation.type === 'LIKES'));
    assert.ok(
      !conversation
        .getMemoryRelations()
        .some(
          (relation) =>
            relation.subjectId === nothing?.id &&
            relation.objectId === 'concept:rest_adjust',
        ),
    );

    const thought = conversation
      .getWordEntries()
      .find((entry) => entry.surface === '明日の予定');
    const thoughtRelations = conversation
      .getMemoryRelations()
      .filter((relation) => relation.objectId === thought?.id);
    assert.ok(
      thoughtRelations.some((relation) => relation.type === 'THINKS_ABOUT'),
    );
    assert.ok(!thoughtRelations.some((relation) => relation.type === 'LIKES'));

    const reloaded = create(storage, undefined, () => 0);
    assert.equal(reloaded.getMemoryEpisodes().length, 6);
    assert.equal(
      reloaded.getWordEntries().find((entry) => entry.surface === 'ビリヤニ')
        ?.subcategory,
      'RICE',
    );
    assert.ok(
      reloaded
        .getOpenQuestions()
        .some((question) => question.wordId === biriyani?.id),
    );
  });

  run('PERSONの13分類は表示順と保存IDを分離し、旧PERSON_5〜6を安全に移行する', () => {
    assert.deepEqual(
      PERSON_SUBCATEGORY_CHOICES.map(({ id, label }) => [id, label]),
      [
        ['PERSON_1', '家族・親戚'],
        ['PERSON_2', '友達・知り合い'],
        ['PERSON_3', '好きな人・大切な人'],
        ['PERSON_4', '仕事・学校の人'],
        ['PERSON_ENTERTAINER', '芸能人・音楽家'],
        ['PERSON_MANGA_ARTIST', '漫画家'],
        ['PERSON_AUTHOR_WRITER', '小説家・作家'],
        ['PERSON_ATHLETE', 'スポーツ選手'],
        ['PERSON_SCIENTIST', '科学者・研究者'],
        ['PERSON_HISTORICAL_MILITARY', '歴史の軍事的人物'],
        ['PERSON_HISTORICAL_CULTURAL', '歴史の文化的人物'],
        ['PERSON_STREAMER', '配信者'],
        ['PERSON_OTHER', 'その他の人'],
      ],
    );
    assert.equal(subcategoryLabel('PERSON', 'PERSON_LEGACY_FAMOUS'), '有名人・歴史の人物');

    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 10,
      words: {
        歴史人物: {
          id: 'legacy_famous', surface: '歴史人物', category: 'PERSON', subcategory: 'PERSON_5',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'legacy_famous', mentionCount: 1,
        },
        知人: {
          id: 'legacy_other', surface: '知人', category: 'PERSON', subcategory: 'PERSON_6',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'legacy_other', mentionCount: 1,
        },
      },
      personWordDeepDives: {
        legacy_famous: {
          slot1: { key: 'known_for', value: '国を治めた' },
          slot2: { key: 'impression', value: '強そう' },
        },
        legacy_other: {
          slot1: { key: 'person_relation', value: '近所の人' },
          slot2: { key: 'key_feature', value: '犬を連れている' },
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0);
    const entries = conversation.getWordEntries();
    assert.equal(entries.find((word) => word.id === 'legacy_famous')?.subcategory, 'PERSON_LEGACY_FAMOUS');
    assert.equal(entries.find((word) => word.id === 'legacy_other')?.subcategory, 'PERSON_OTHER');
    assert.deepEqual(conversation.getPersonWordDeepDive('legacy_famous'), {
      slot1: { key: 'known_for', value: '国を治めた' },
      slot2: { key: 'impression', value: '強そう' },
    });
    assert.deepEqual(conversation.getPersonWordDeepDive('legacy_other'), {
      slot1: { key: 'person_relation', value: '近所の人' },
      slot2: { key: 'key_feature', value: '犬を連れている' },
    });
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === 'legacy_famous'),
      true,
    );
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === 'legacy_other'),
      true,
    );

    prepare(conversation);
    const entertainer = teachPerson(conversation, '歌手A', 'PERSON_ENTERTAINER');
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === entertainer.id),
      true,
    );
    const mangaArtist = teachPerson(conversation, '漫画家A', 'PERSON_MANGA_ARTIST');
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === mangaArtist.id),
      true,
    );
    assert.equal(
      conversation.getNextPersonComboQuestion(mangaArtist.id)?.id,
      'PERSON_MANGA_ARTIST_V2_01',
    );
    const author = teachPerson(conversation, '作家A', 'PERSON_AUTHOR_WRITER');
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === author.id),
      true,
    );
    assert.equal(
      conversation.getNextPersonComboQuestion(author.id)?.id,
      'PERSON_AUTHOR_WRITER_V2_01',
    );
    const athlete = teachPerson(conversation, '選手A', 'PERSON_ATHLETE');
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === athlete.id),
      true,
    );
    assert.equal(
      conversation.getNextPersonComboQuestion(athlete.id)?.id,
      'PERSON_ATHLETE_V2_01',
    );
    const scientist = teachPerson(conversation, '科学者A', 'PERSON_SCIENTIST');
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === scientist.id),
      true,
    );
    assert.equal(
      conversation.getNextPersonComboQuestion(scientist.id)?.id,
      'PERSON_SCIENTIST_V2_01',
    );
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    assert.equal(saved.version, 16);
  });

  run('v12の政治家・実業家は単語IDと関連記憶を保ったままその他の人へ移行する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 12,
      words: {
        政治家A: {
          id: 'politician_a', surface: '政治家A', category: 'PERSON', subcategory: 'PERSON_POLITICIAN_BUSINESS',
          firstSeenDay: 2, learnedOrder: 1, rootWordId: 'politician_a', mentionCount: 3,
        },
      },
      memoryRelations: [{
        id: 'relation_politician_a', subjectId: 'human', type: 'RELATED_TO', objectId: 'politician_a',
        source: 'USER_EXPLICIT', status: 'ACTIVE', firstSeenDay: 2, lastSeenDay: 2, mentionCount: 1,
      }],
    }));
    const conversation = create(storage, undefined, () => 0);
    assert.deepEqual(conversation.getWordEntries(), [{
      id: 'politician_a', surface: '政治家A', category: 'PERSON', subcategory: 'PERSON_OTHER',
      firstSeenDay: 2, learnedOrder: 1, rootWordId: 'politician_a', mentionCount: 3,
    }]);
    assert.equal(conversation.getMemoryRelations()[0]?.objectId, 'politician_a');
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    assert.equal(saved.version, 16);
    assert.equal(saved.words.政治家A.subcategory, 'PERSON_OTHER');
  });

  run('漫画・アニメ・ゲーム・小説は既存IDを維持して小説だけを追加する', () => {
    assert.equal(CATEGORY_LABELS.GAME_MEDIA, '漫画・アニメ・ゲーム・小説');
    assert.equal(
      CATEGORY_CHOICES.find((choice) => choice.category === 'GAME_MEDIA')?.label,
      '漫画・アニメ・ゲーム・小説',
    );
    assert.deepEqual(
      SUBCATEGORY_CHOICES.GAME_MEDIA?.map(({ id, label }) => [id, label]),
      [
        ['GAME_MEDIA_1', '漫画'],
        ['GAME_MEDIA_2', 'アニメ'],
        ['GAME_MEDIA_3', 'ゲーム'],
        ['GAME_MEDIA_NOVEL', '小説'],
        ['GAME_MEDIA_4', 'キャラクター'],
        ['GAME_MEDIA_5', '作品・シリーズ'],
        ['GAME_MEDIA_6', '作中のもの・用語'],
        ['GAME_MEDIA_7', 'その他'],
      ],
    );
    assert.equal(subcategoryLabel('GAME_MEDIA', 'GAME_MEDIA_4'), 'キャラクター');
    assert.equal(subcategoryLabel('GAME_MEDIA', 'GAME_MEDIA_NOVEL'), '小説');
  });

  run('スポーツ・運動は既存IDを維持して競技・チーム・大会を追加する', () => {
    assert.deepEqual(
      SUBCATEGORY_CHOICES.SPORTS?.map(({ id, label }) => [id, label]),
      [
        ['SPORTS_DISCIPLINE', '競技・種目'],
        ['SPORTS_TEAM_CLUB', 'チーム・クラブ'],
        ['SPORTS_EVENT_MATCH', '大会・試合'],
        ['SPORTS_1', '球技'], ['SPORTS_2', '武道・格闘技'], ['SPORTS_3', '陸上・体操'],
        ['SPORTS_4', '水のスポーツ'], ['SPORTS_5', '雪・氷のスポーツ'], ['SPORTS_6', 'その他'],
      ],
    );
    assert.equal(subcategoryLabel('SPORTS', 'SPORTS_1'), '球技');
    assert.equal(subcategoryLabel('SPORTS', 'SPORTS_EVENT_MATCH'), '大会・試合');
  });

  run('生き物は既存IDを保ったままペット個体を先頭へ追加し、現在・過去を保存する', () => {
    assert.deepEqual(
      SUBCATEGORY_CHOICES.ANIMAL?.map(({ id, label }) => [id, label]),
      [
        ['ANIMAL_PET', '飼っている・飼っていた動物'],
        ['ANIMAL_1', '犬・猫などの動物'],
        ['ANIMAL_2', '鳥'],
        ['ANIMAL_3', '魚・水の生き物'],
        ['ANIMAL_4', '虫・小さな生き物'],
        ['ANIMAL_5', '植物'],
        ['ANIMAL_6', 'その他'],
      ],
    );
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('ポチ');
    conversation.chooseCategory('ANIMAL');
    const statusPrompt = conversation.chooseSubCategory('ANIMAL_PET');
    assert.equal(statusPrompt.inputMode, 'choice');
    assert.deepEqual(statusPrompt.choices.map((choice) => choice.id), ['PET_CURRENT', 'PET_FORMER']);
    conversation.choose('PET_CURRENT');
    const pet = conversation.getWordEntries().find((word) => word.surface === 'ポチ');
    assert.equal(pet?.subcategory, 'ANIMAL_PET');
    assert.equal(conversation.getPetStatus(pet?.id ?? ''), 'CURRENT');
    assert.equal(conversation.setPetStatus(pet?.id ?? '', 'FORMER'), true);
    assert.equal(create(storage, undefined, () => 0).getPetStatus(pet?.id ?? ''), 'FORMER');

    // 既存の一般動物はペット個体へ推測し直さない。
    const legacyStorage = memory();
    legacyStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 14,
      words: {
        犬: { id: 'legacy_dog', surface: '犬', category: 'ANIMAL', subcategory: 'ANIMAL_1', firstSeenDay: 1, learnedOrder: 1, rootWordId: 'legacy_dog', mentionCount: 1 },
      },
    }));
    const legacy = create(legacyStorage, undefined, () => 0);
    assert.equal(legacy.getWordEntries()[0]?.subcategory, 'ANIMAL_1');
    assert.equal(legacy.getPetStatus('legacy_dog'), null);
  });

  run('ペット個体は20派生問・5掘り下げ問を個別に保存し、現在・過去で質問文を切り替える', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const pet = teachPet(conversation, 'ポチ');
    assert.equal(pet?.subcategory, 'ANIMAL_PET');
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === pet.id), true);

    const first = conversation.getNextPersonComboQuestion(pet.id);
    assert.equal(first?.id, 'ANIMAL_PET_V2_01');
    assert.equal(first?.kind, 'derived');
    assert.equal(conversation.submitPersonComboAnswer(pet.id, first.id, 'タマ')?.ok, true);
    const derivedPet = conversation.getWordEntries().find((word) => word.surface === 'タマ');
    assert.equal(derivedPet?.category, 'ANIMAL');
    assert.equal(derivedPet?.subcategory, 'ANIMAL_PET');
    assert.equal(derivedPet?.firstDerivedFromWordId, pet.id);
    // コンボ中には派生ペットの現在・過去を質問しない。あとから辞書で設定できる。
    assert.equal(conversation.getPetStatus(derivedPet?.id ?? ''), null);
    assert.equal(conversation.setPetStatus(derivedPet?.id ?? '', 'FORMER'), true);

    const fiveDeep = create(memory(), undefined, () => 0.99);
    prepare(fiveDeep);
    const current = teachPet(fiveDeep, 'ミケ', 'PET_CURRENT');
    const currentQuestion = fiveDeep.getNextPersonComboQuestion(current.id);
    assert.equal(currentQuestion?.id, 'ANIMAL_PET_DEEP_05');
    assert.ok(currentQuestion?.lines.includes('一番印象に残っている出来事は？'));
    fiveDeep.setPetStatus(current.id, 'FORMER');
    const formerQuestion = fiveDeep.getNextPersonComboQuestion(current.id);
    assert.equal(formerQuestion?.id, 'ANIMAL_PET_DEEP_05');
    assert.ok(formerQuestion?.lines.includes('一番忘れられない思い出は？'));

    const complete = create(memory(), undefined, () => 0.5);
    prepare(complete);
    const completePet = teachPet(complete, 'ハナ');
    let deep = 0;
    let derived = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = complete.getNextPersonComboQuestion(completePet.id);
      assert.ok(question);
      const before = complete.getWordEntries().length;
      assert.equal(complete.submitPersonComboAnswer(completePet.id, question.id, `ペット回答${index + 1}`)?.ok, true);
      if (question.kind === 'deepDive') {
        deep += 1;
        assert.equal(complete.getWordEntries().length, before);
      } else {
        derived += 1;
      }
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);
    for (let index = 6; index < 25; index += 1) {
      const question = complete.getNextPersonComboQuestion(completePet.id);
      assert.ok(question);
      assert.equal(complete.submitPersonComboAnswer(completePet.id, question.id, `ペット回答${index + 1}`)?.ok, true);
    }
    assert.equal(complete.getNextPersonComboQuestion(completePet.id), null);
    assert.equal(
      complete.getPersonWordComboCandidates().some((word) => word.id === completePet.id),
      false,
    );
    assert.deepEqual(complete.getPersonWordDeepDive(completePet.id), {
      slot1: { key: 'first_meeting', value: 'ペット回答12' },
      slot2: { key: 'personality', value: 'ペット回答8' },
      slot3: { key: 'favorite_food', value: 'ペット回答3' },
      slot4: { key: 'habit', value: 'ペット回答6' },
      slot5: { key: 'memorable_experience', value: 'ペット回答10' },
    });
  });

  run('犬・猫などの動物はペット個体と区別して20派生問・2掘り下げ問を消化する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const firstAnimal = teachAnimal(firstCombo, 'わんこ');
    let firstDerived = 0;
    let firstDeep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(firstAnimal.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(firstAnimal.id, question.id, `初回動物回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') firstDerived += 1;
      else firstDeep += 1;
    }
    assert.equal(firstDerived, 4);
    assert.equal(firstDeep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const cat = teachAnimal(conversation, 'ねこさん');
    assert.equal(cat?.subcategory, 'ANIMAL_1');
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === cat.id), true);

    assert.equal(
      conversation.submitPersonComboAnswer(cat.id, 'ANIMAL_DOGCAT_V2_03', 'タマ')?.ok,
      true,
    );
    const namedPet = conversation.getWordEntries().find((word) => word.surface === 'タマ');
    assert.equal(namedPet?.subcategory, 'ANIMAL_PET');
    assert.equal(namedPet?.firstDerivedFromWordId, cat.id);
    assert.equal(conversation.getPetStatus(namedPet?.id ?? ''), null);
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === namedPet?.id), true);

    let derived = 0;
    let deep = 0;
    while (true) {
      const question = conversation.getNextPersonComboQuestion(cat.id);
      if (!question) break;
      const before = conversation.getWordEntries().length;
      assert.equal(conversation.submitPersonComboAnswer(cat.id, question.id, `動物回答${derived + deep + 1}`)?.ok, true);
      if (question.kind === 'derived') {
        derived += 1;
      } else {
        deep += 1;
        assert.equal(conversation.getWordEntries().length, before);
      }
    }
    // 03番は先に消化済みなので、残り19派生＋掘り下げ2問で全22枠を完了する。
    assert.equal(derived, 19);
    assert.equal(deep, 2);
    assert.equal(conversation.getNextPersonComboQuestion(cat.id), null);
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === cat.id), false);
    const deepDive = conversation.getPersonWordDeepDive(cat.id);
    assert.equal(deepDive?.slot1?.key, 'favorite_trait');
    assert.equal(deepDive?.slot2?.key, 'memorable_experience');
  });

  run('鳥は20派生問・2掘り下げ問を持ち、鳥から派生した個体をペットへつなぐ', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const bird = teachAnimal(firstCombo, 'すずめ', 'ANIMAL_2');
    assert.equal(bird?.subcategory, 'ANIMAL_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(bird.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(bird.id, question.id, `鳥回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachAnimal(conversation, 'インコ', 'ANIMAL_2');
    assert.equal(conversation.submitPersonComboAnswer(parent.id, 'ANIMAL_BIRD_V2_03', 'ピーちゃん')?.ok, true);
    const pet = conversation.getWordEntries().find((word) => word.surface === 'ピーちゃん');
    assert.equal(pet?.category, 'ANIMAL');
    assert.equal(pet?.subcategory, 'ANIMAL_PET');
    assert.equal(pet?.firstDerivedFromWordId, parent.id);
    assert.equal(conversation.getPetStatus(pet?.id ?? ''), null);
    assert.equal(conversation.getPersonWordDeepDive(parent.id)?.slot1?.key, undefined);
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === pet?.id), true);
  });

  run('魚・水の生き物は20派生問・2掘り下げ問を持ち、飼育個体をペットへつなぐ', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const fish = teachAnimal(firstCombo, 'イルカさん', 'ANIMAL_3');
    assert.equal(fish?.subcategory, 'ANIMAL_3');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(fish.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(fish.id, question.id, `水の生き物回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachAnimal(conversation, '金魚さん', 'ANIMAL_3');
    assert.equal(conversation.submitPersonComboAnswer(parent.id, 'ANIMAL_FISH_V2_04', 'きんちゃん')?.ok, true);
    const pet = conversation.getWordEntries().find((word) => word.surface === 'きんちゃん');
    assert.equal(pet?.category, 'ANIMAL');
    assert.equal(pet?.subcategory, 'ANIMAL_PET');
    assert.equal(pet?.firstDerivedFromWordId, parent.id);
    assert.equal(conversation.getPetStatus(pet?.id ?? ''), null);
    assert.equal(conversation.getPersonWordDeepDive(parent.id)?.slot1?.key, undefined);
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === pet?.id), true);
  });

  run('虫・小さな生き物は20派生問・2掘り下げ問を持ち、好き・苦手を属性保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const insect = teachAnimal(firstCombo, 'カブトムシさん', 'ANIMAL_4');
    assert.equal(insect?.subcategory, 'ANIMAL_4');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(insect.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(insect.id, question.id, `虫回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachAnimal(conversation, 'ちいさな虫さん', 'ANIMAL_4');
    assert.equal(conversation.submitPersonComboAnswer(parent.id, 'ANIMAL_INSECT_V2_03', 'むしちゃん')?.ok, true);
    const pet = conversation.getWordEntries().find((word) => word.surface === 'むしちゃん');
    assert.equal(pet?.subcategory, 'ANIMAL_PET');
    assert.equal(pet?.firstDerivedFromWordId, parent.id);
    assert.equal(conversation.getPetStatus(pet?.id ?? ''), null);
    assert.equal(conversation.getPersonWordDeepDive(parent.id)?.slot1?.key, undefined);
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === pet?.id), true);
  });

  run('植物は20派生問・2掘り下げ問を持ち、植物から派生した語を分類保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const plant = teachAnimal(firstCombo, '花さん', 'ANIMAL_5');
    assert.equal(plant?.subcategory, 'ANIMAL_5');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(plant.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(plant.id, question.id, `植物回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachAnimal(conversation, '観葉植物さん', 'ANIMAL_5');
    assert.equal(conversation.submitPersonComboAnswer(parent.id, 'ANIMAL_PLANT_V2_04', 'てんとうむし')?.ok, true);
    const insect = conversation.getWordEntries().find((word) => word.surface === 'てんとうむし');
    assert.equal(insect?.category, 'ANIMAL');
    assert.equal(insect?.subcategory, 'ANIMAL_4');
    assert.equal(insect?.firstDerivedFromWordId, parent.id);
    assert.equal(conversation.getPersonWordDeepDive(parent.id)?.slot1?.key, undefined);
  });

  run('生き物・その他は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const other = teachAnimal(firstCombo, '分類外のいきものさん', 'ANIMAL_6');
    assert.equal(other?.subcategory, 'ANIMAL_6');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(other.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(other.id, question.id, `その他回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachAnimal(conversation, '不思議ないきものさん', 'ANIMAL_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ANIMAL_OTHER_V2_03', 'ねこさん')?.ok,
      true,
    );
    const derivedAnimal = conversation.getWordEntries().find((word) => word.surface === 'ねこさん');
    assert.equal(derivedAnimal?.subcategory, 'ANIMAL_1');
    assert.equal(derivedAnimal?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ANIMAL_OTHER_DEEP_01', '見た目が不思議')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '見た目が不思議'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_feature',
      value: '見た目が不思議',
    });
  });

  run('料理・食べ物は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const dish = teachFood(firstCombo, '思い出の料理さん');
    assert.equal(dish?.subcategory, 'FOOD_1');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(dish.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(dish.id, question.id, `料理回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachFood(conversation, '好きな料理さん');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_DISH_V2_03', 'トマト')?.ok,
      true,
    );
    const ingredient = conversation.getWordEntries().find((word) => word.surface === 'トマト');
    assert.equal(ingredient?.subcategory, 'FOOD_4');
    assert.equal(ingredient?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_DISH_DEEP_01', 'もちもち')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'もちもち'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'taste_texture',
      value: 'もちもち',
    });
  });

  run('お菓子・甘いものは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const sweet = teachFood(firstCombo, '思い出のお菓子さん', 'FOOD_2');
    assert.equal(sweet?.subcategory, 'FOOD_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(sweet.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(sweet.id, question.id, `お菓子回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachFood(conversation, '好きなお菓子さん', 'FOOD_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_SWEET_V2_05', 'いちご')?.ok,
      true,
    );
    const ingredient = conversation.getWordEntries().find((word) => word.surface === 'いちご');
    assert.equal(ingredient?.subcategory, 'FOOD_4');
    assert.equal(ingredient?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_SWEET_DEEP_02', '祭りでもらった')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '祭りでもらった'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot2, {
      key: 'memorable_experience',
      value: '祭りでもらった',
    });
  });

  run('飲み物は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const drink = teachFood(firstCombo, '思い出の飲み物さん', 'FOOD_3');
    assert.equal(drink?.subcategory, 'FOOD_3');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(drink.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(drink.id, question.id, `飲み物回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachFood(conversation, '好きな飲み物さん', 'FOOD_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_DRINK_V2_03', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_DRINK_DEEP_01', 'すっきり')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'すっきり'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'taste_texture',
      value: 'すっきり',
    });
  });

  run('食材は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const ingredient = teachFood(firstCombo, '思い出の食材さん', 'FOOD_4');
    assert.equal(ingredient?.subcategory, 'FOOD_4');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(ingredient.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(ingredient.id, question.id, `食材回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachFood(conversation, '好きな食材さん', 'FOOD_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_INGREDIENT_V2_03', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_INGREDIENT_DEEP_01', '香りが好き')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '香りが好き'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'preference_reason',
      value: '香りが好き',
    });
  });

  run('調味料は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const seasoning = teachFood(firstCombo, '思い出の調味料さん', 'FOOD_5');
    assert.equal(seasoning?.subcategory, 'FOOD_5');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(seasoning.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(seasoning.id, question.id, `調味料回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachFood(conversation, '好きな調味料さん', 'FOOD_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_SEASONING_V2_03', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_SEASONING_DEEP_02', '少しだけ使う')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '少しだけ使う'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot2, {
      key: 'usage_preference',
      value: '少しだけ使う',
    });
  });

  run('食べ物・飲み物・その他は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const other = teachFood(firstCombo, '思い出の食事習慣さん', 'FOOD_6');
    assert.equal(other?.subcategory, 'FOOD_6');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(other.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(other.id, question.id, `食事習慣回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachFood(conversation, '給食の習慣さん', 'FOOD_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_OTHER_V2_03', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'FOOD_OTHER_DEEP_01', 'みんなで食べること')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'みんなで食べること'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'description',
      value: 'みんなで食べること',
    });
  });

  run('家・住む場所は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const home = teachPlace(firstCombo, '思い出の家さん');
    assert.equal(home?.subcategory, 'PLACE_1');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(home.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(home.id, question.id, `家回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPlace(conversation, '実家さん');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_HOME_V2_06', '母親')?.ok,
      true,
    );
    const family = conversation.getWordEntries().find((word) => word.surface === '母親');
    assert.equal(family?.subcategory, 'PERSON_1');
    assert.equal(family?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_HOME_DEEP_01', '窓辺')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '窓辺'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_spot',
      value: '窓辺',
    });
  });

  run('店は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const shop = teachPlace(firstCombo, '思い出のお店さん', 'PLACE_2');
    assert.equal(shop?.subcategory, 'PLACE_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(shop.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(shop.id, question.id, `お店回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPlace(conversation, '好きなお店さん', 'PLACE_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_SHOP_V2_09', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_SHOP_DEEP_01', 'におい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'におい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_feature',
      value: 'におい',
    });
  });

  run('町・地域は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const town = teachPlace(firstCombo, '思い出の町さん', 'PLACE_5');
    assert.equal(town?.subcategory, 'PLACE_5');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(town.id);
      assert.ok(question);
      assert.equal(firstCombo.submitPersonComboAnswer(town.id, question.id, `町回答${index + 1}`)?.ok, true);
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPlace(conversation, '故郷さん', 'PLACE_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_TOWN_V2_12', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_TOWN_DEEP_01', '夕焼け')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '夕焼け'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_scenery',
      value: '夕焼け',
    });
  });

  run('建物・施設は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const facility = teachPlace(firstCombo, '思い出の施設さん', 'PLACE_3');
    assert.equal(facility?.subcategory, 'PLACE_3');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(facility.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(facility.id, question.id, `施設回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPlace(conversation, '学校さん', 'PLACE_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_FACILITY_V2_12', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_FACILITY_DEEP_01', '広い窓')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '広い窓'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_feature',
      value: '広い窓',
    });
  });

  run('自然の場所は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const nature = teachPlace(firstCombo, '思い出の自然さん', 'PLACE_7');
    assert.equal(nature?.subcategory, 'PLACE_7');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(nature.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(nature.id, question.id, `自然回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPlace(conversation, '思い出の海さん', 'PLACE_7');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_NATURE_V2_13', 'おにぎり')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'おにぎり');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_NATURE_DEEP_01', '夕焼け')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '夕焼け'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_scenery',
      value: '夕焼け',
    });
  });

  run('国は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const country = teachPlace(firstCombo, '思い出の国さん', 'PLACE_6');
    assert.equal(country?.subcategory, 'PLACE_6');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(country.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(country.id, question.id, `国回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPlace(conversation, '日本さん', 'PLACE_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_COUNTRY_V2_05', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_COUNTRY_DEEP_01', '遠い')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '遠い'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'impression',
      value: '遠い',
    });
  });

  run('場所・その他は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const otherPlace = teachPlace(firstCombo, '思い出の道さん', 'PLACE_8');
    assert.equal(otherPlace?.subcategory, 'PLACE_8');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(otherPlace.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(otherPlace.id, question.id, `その他回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPlace(conversation, '通学路さん', 'PLACE_8');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_OTHER_V2_13', 'おにぎり')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'おにぎり');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_OTHER_DEEP_01', '夕焼け')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '夕焼け'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_scenery',
      value: '夕焼け',
    });
  });

  run('季節は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const season = teachNatureTime(firstCombo, '思い出の季節さん', 'NATURE_TIME_2');
    assert.equal(season?.subcategory, 'NATURE_TIME_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(season.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(season.id, question.id, `季節回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachNatureTime(conversation, '夏さん', 'NATURE_TIME_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'NATURE_SEASON_V2_10', 'かき氷')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'かき氷');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'NATURE_SEASON_DEEP_01', '暑さ')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '暑さ'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'preference_reason',
      value: '暑さ',
    });
  });

  run('学校・職場は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const schoolWork = teachPlace(firstCombo, '思い出の学校さん', 'PLACE_4');
    assert.equal(schoolWork?.subcategory, 'PLACE_4');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(schoolWork.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(schoolWork.id, question.id, `学校職場回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPlace(conversation, 'アルバイト先さん', 'PLACE_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_SCHOOL_WORK_V2_15', '文化祭')?.ok,
      true,
    );
    const event = conversation.getWordEntries().find((word) => word.surface === '文化祭');
    assert.equal(event?.subcategory, 'EVENT_7');
    assert.equal(event?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PLACE_SCHOOL_WORK_DEEP_01', 'にぎやか')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'にぎやか'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'atmosphere',
      value: 'にぎやか',
    });
  });

  run('家具は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const furniture = teachObject(firstCombo, '思い出の家具さん', 'OBJECT_1');
    assert.equal(furniture?.subcategory, 'OBJECT_1');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(furniture.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(furniture.id, question.id, `家具回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachObject(conversation, '机さん', 'OBJECT_1');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_FURNITURE_V2_17', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_FURNITURE_DEEP_01', '木製で快適')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '木製で快適'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'appearance_comfort',
      value: '木製で快適',
    });
  });

  run('日用品は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const daily = teachObject(firstCombo, '思い出の日用品さん', 'OBJECT_2');
    assert.equal(daily?.subcategory, 'OBJECT_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(daily.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(daily.id, question.id, `日用品回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachObject(conversation, '傘さん', 'OBJECT_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_DAILY_V2_10', 'コンビニ')?.ok,
      true,
    );
    const shop = conversation.getWordEntries().find((word) => word.surface === 'コンビニ');
    assert.equal(shop?.subcategory, 'PLACE_2');
    assert.equal(shop?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_DAILY_DEEP_01', '持ちやすい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '持ちやすい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '持ちやすい',
    });
  });

  run('文房具は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const stationery = teachObject(firstCombo, '思い出の文房具さん', 'OBJECT_3');
    assert.equal(stationery?.subcategory, 'OBJECT_3');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(stationery.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(stationery.id, question.id, `文房具回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachObject(conversation, '鉛筆さん', 'OBJECT_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_STATIONERY_V2_11', '国語')?.ok,
      true,
    );
    const subject = conversation.getWordEntries().find((word) => word.surface === '国語');
    assert.equal(subject?.subcategory, 'SCHOOL_2');
    assert.equal(subject?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_STATIONERY_DEEP_01', '書きやすい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '書きやすい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '書きやすい',
    });
  });

  run('料理・食事の道具は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const cookingTool = teachObject(firstCombo, '思い出の料理道具さん', 'OBJECT_4');
    assert.equal(cookingTool?.subcategory, 'OBJECT_4');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(cookingTool.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(cookingTool.id, question.id, `料理道具回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachObject(conversation, '包丁さん', 'OBJECT_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_COOKING_V2_07', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_COOKING_DEEP_01', '握りやすい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '握りやすい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '握りやすい',
    });
  });

  run('趣味・作業の道具は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const hobbyTool = teachObject(firstCombo, '思い出の作業道具さん', 'OBJECT_5');
    assert.equal(hobbyTool?.subcategory, 'OBJECT_5');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(hobbyTool.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(hobbyTool.id, question.id, `作業道具回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachObject(conversation, '釣り竿さん', 'OBJECT_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_HOBBY_V2_14', '絵を描くこと')?.ok,
      true,
    );
    const creation = conversation.getWordEntries().find((word) => word.surface === '絵を描くこと');
    assert.equal(creation?.subcategory, 'ACTIVITY_3');
    assert.equal(creation?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_HOBBY_DEEP_01', '持ちやすい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '持ちやすい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '持ちやすい',
    });
  });

  run('もの・道具・その他は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const otherObject = teachObject(firstCombo, '思い出の品さん', 'OBJECT_6');
    assert.equal(otherObject?.subcategory, 'OBJECT_6');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(otherObject.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(otherObject.id, question.id, `思い出の品回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachObject(conversation, 'お守りさん', 'OBJECT_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_OTHER_V2_16', '誕生日')?.ok,
      true,
    );
    const anniversary = conversation.getWordEntries().find((word) => word.surface === '誕生日');
    assert.equal(anniversary?.subcategory, 'EVENT_1');
    assert.equal(anniversary?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'OBJECT_OTHER_DEEP_01', '大切な思い出の品')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '大切な思い出の品'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'personal_significance',
      value: '大切な思い出の品',
    });
  });

  run('服は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const clothes = teachClothing(firstCombo, '思い出の服さん', 'CLOTHING_1');
    assert.equal(clothes?.subcategory, 'CLOTHING_1');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(clothes.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(clothes.id, question.id, `服回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachClothing(conversation, '制服さん', 'CLOTHING_1');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_CLOTHES_V2_17', 'サッカー')?.ok,
      true,
    );
    const sport = conversation.getWordEntries().find((word) => word.surface === 'サッカー');
    assert.equal(sport?.subcategory, 'SPORTS_DISCIPLINE');
    assert.equal(sport?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_CLOTHES_DEEP_01', 'やわらかい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'やわらかい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'appearance_comfort',
      value: 'やわらかい',
    });
  });

  run('靴は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const shoes = teachClothing(firstCombo, '思い出の靴さん', 'CLOTHING_2');
    assert.equal(shoes?.subcategory, 'CLOTHING_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(shoes.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(shoes.id, question.id, `靴回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachClothing(conversation, '長靴さん', 'CLOTHING_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_SHOES_V2_16', '雨')?.ok,
      true,
    );
    const weather = conversation.getWordEntries().find((word) => word.surface === '雨');
    assert.equal(weather?.subcategory, 'NATURE_TIME_1');
    assert.equal(weather?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_SHOES_DEEP_01', '歩きやすい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '歩きやすい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'fit_comfort',
      value: '歩きやすい',
    });
  });

  run('帽子は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const hat = teachClothing(firstCombo, '思い出の帽子さん', 'CLOTHING_3');
    assert.equal(hat?.subcategory, 'CLOTHING_3');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(hat.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(hat.id, question.id, `帽子回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachClothing(conversation, '麦わら帽子さん', 'CLOTHING_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_HAT_V2_19', '農家')?.ok,
      true,
    );
    const occupation = conversation.getWordEntries().find((word) => word.surface === '農家');
    assert.equal(occupation?.subcategory, 'WORK_1');
    assert.equal(occupation?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_HAT_DEEP_01', '軽くて涼しい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '軽くて涼しい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'appearance_comfort',
      value: '軽くて涼しい',
    });
  });

  run('バッグは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const bag = teachClothing(firstCombo, '思い出のバッグさん', 'CLOTHING_4');
    assert.equal(bag?.subcategory, 'CLOTHING_4');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(bag.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(bag.id, question.id, `バッグ回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachClothing(conversation, 'ランドセルさん', 'CLOTHING_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_BAG_V2_12', '商店街')?.ok,
      true,
    );
    const shop = conversation.getWordEntries().find((word) => word.surface === '商店街');
    assert.equal(shop?.subcategory, 'PLACE_2');
    assert.equal(shop?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_BAG_DEEP_01', 'ポケットが多い')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'ポケットが多い'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: 'ポケットが多い',
    });
  });

  run('アクセサリーは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const accessory = teachClothing(firstCombo, '思い出のアクセサリーさん', 'CLOTHING_5');
    assert.equal(accessory?.subcategory, 'CLOTHING_5');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(accessory.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(accessory.id, question.id, `アクセサリー回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachClothing(conversation, '指輪さん', 'CLOTHING_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_ACCESSORY_V2_16', '結婚式')?.ok,
      true,
    );
    const ceremony = conversation.getWordEntries().find((word) => word.surface === '結婚式');
    assert.equal(ceremony?.subcategory, 'EVENT_4');
    assert.equal(ceremony?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_ACCESSORY_DEEP_01', 'きれいで軽い')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'きれいで軽い'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'appearance_comfort',
      value: 'きれいで軽い',
    });
  });

  run('服・身につけるもの・その他は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const otherWear = teachClothing(firstCombo, '思い出の身につけるものさん', 'CLOTHING_6');
    assert.equal(otherWear?.subcategory, 'CLOTHING_6');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(otherWear.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(otherWear.id, question.id, `その他回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachClothing(conversation, '思い出の眼鏡さん', 'CLOTHING_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_OTHERWEAR_V2_18', '水泳')?.ok,
      true,
    );
    const sport = conversation.getWordEntries().find((word) => word.surface === '水泳');
    assert.equal(sport?.subcategory, 'SPORTS_DISCIPLINE');
    assert.equal(sport?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'CLOTHING_OTHERWEAR_DEEP_01', '両手が使いやすい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '両手が使いやすい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '両手が使いやすい',
    });
  });

  run('パソコン・スマホは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const device = teachTech(firstCombo, '思い出のスマホさん');
    assert.equal(device?.subcategory, 'TECH_1');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(device.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(device.id, question.id, `端末回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachTech(conversation, '昔の携帯電話さん');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_COMPUTER_SMARTPHONE_V2_06', 'メール')?.ok,
      true,
    );
    const site = conversation.getWordEntries().find((word) => word.surface === 'メール');
    assert.equal(site?.subcategory, 'TECH_6');
    assert.equal(site?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_COMPUTER_SMARTPHONE_DEEP_01', 'すぐ連絡できる')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'すぐ連絡できる'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: 'すぐ連絡できる',
    });
  });

  run('家電は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const appliance = teachTech(firstCombo, '思い出の冷蔵庫さん', 'TECH_2');
    assert.equal(appliance?.subcategory, 'TECH_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(appliance.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(appliance.id, question.id, `家電回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachTech(conversation, '電子レンジさん', 'TECH_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_HOME_APPLIANCE_V2_12', 'カレー')?.ok,
      true,
    );
    const dish = conversation.getWordEntries().find((word) => word.surface === 'カレー');
    assert.equal(dish?.subcategory, 'FOOD_1');
    assert.equal(dish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_HOME_APPLIANCE_DEEP_01', 'すぐ温められる')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'すぐ温められる'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: 'すぐ温められる',
    });
  });

  run('ゲーム機は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const consoleWord = teachTech(firstCombo, '思い出のゲーム機さん', 'TECH_3');
    assert.equal(consoleWord?.subcategory, 'TECH_3');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(consoleWord.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(consoleWord.id, question.id, `ゲーム機回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachTech(conversation, '昔の携帯ゲーム機さん', 'TECH_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_GAME_CONSOLE_V2_03', 'マリオ')?.ok,
      true,
    );
    const game = conversation.getWordEntries().find((word) => word.surface === 'マリオ');
    assert.equal(game?.subcategory, 'GAME_MEDIA_3');
    assert.equal(game?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_GAME_CONSOLE_DEEP_01', '操作感が好き')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '操作感が好き'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'preference_reason',
      value: '操作感が好き',
    });
  });

  run('カメラ・音響などは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const cameraAudio = teachTech(firstCombo, '思い出のカメラさん', 'TECH_4');
    assert.equal(cameraAudio?.subcategory, 'TECH_4');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(cameraAudio.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(cameraAudio.id, question.id, `機器回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachTech(conversation, '昔のラジカセさん', 'TECH_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_CAMERA_AUDIO_V2_15', 'ラジオ体操')?.ok,
      true,
    );
    const song = conversation.getWordEntries().find((word) => word.surface === 'ラジオ体操');
    assert.equal(song?.subcategory, 'AV_MEDIA_1');
    assert.equal(song?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_CAMERA_AUDIO_DEEP_01', '音が大きく聞こえる')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '音が大きく聞こえる'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '音が大きく聞こえる',
    });
  });

  run('アプリ・ソフトは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const app = teachTech(firstCombo, '思い出のアプリさん', 'TECH_5');
    assert.equal(app?.subcategory, 'TECH_5');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(app.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(app.id, question.id, `アプリ回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachTech(conversation, '昔の編集ソフトさん', 'TECH_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_APP_SOFTWARE_V2_17', '資料作成')?.ok,
      true,
    );
    const work = conversation.getWordEntries().find((word) => word.surface === '資料作成');
    assert.equal(work?.subcategory, 'WORK_2');
    assert.equal(work?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_APP_SOFTWARE_DEEP_01', '作業が早くなる')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '作業が早くなる'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '作業が早くなる',
    });
  });

  run('インターネット・AIは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const internet = teachTech(firstCombo, '思い出のネットサービスさん', 'TECH_6');
    assert.equal(internet?.subcategory, 'TECH_6');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(internet.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(internet.id, question.id, `ネット回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachTech(conversation, '昔の検索サービスさん', 'TECH_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_INTERNET_AI_V2_15', '資料調査')?.ok,
      true,
    );
    const work = conversation.getWordEntries().find((word) => word.surface === '資料調査');
    assert.equal(work?.subcategory, 'WORK_2');
    assert.equal(work?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_INTERNET_AI_DEEP_01', '調べものが早い')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '調べものが早い'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '調べものが早い',
    });
  });

  run('機械・デジタル・その他は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const otherTech = teachTech(firstCombo, '思い出の周辺機器さん', 'TECH_7');
    assert.equal(otherTech?.subcategory, 'TECH_7');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(otherTech.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(otherTech.id, question.id, `その他機器回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachTech(conversation, 'モバイルバッテリーさん', 'TECH_7');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_OTHER_V2_17', '自由研究')?.ok,
      true,
    );
    const assignment = conversation.getWordEntries().find((word) => word.surface === '自由研究');
    assert.equal(assignment?.subcategory, 'SCHOOL_3');
    assert.equal(assignment?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'TECH_OTHER_DEEP_01', '持ち運べて便利')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '持ち運べて便利'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'usability',
      value: '持ち運べて便利',
    });
  });

  run('電車・鉄道は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const train = teachVehicle(firstCombo, '思い出の電車さん');
    assert.equal(train?.subcategory, 'VEHICLE_1');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(train.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(train.id, question.id, `電車回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachVehicle(conversation, '新幹線さん');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_TRAIN_RAIL_V2_03', '東京駅')?.ok,
      true,
    );
    const station = conversation.getWordEntries().find((word) => word.surface === '東京駅');
    assert.equal(station?.subcategory, 'PLACE_3');
    assert.equal(station?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_TRAIN_RAIL_DEEP_01', '車窓がきれい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '車窓がきれい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_feature',
      value: '車窓がきれい',
    });
  });

  run('車・バイクは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const car = teachVehicle(firstCombo, '思い出の車さん', 'VEHICLE_2');
    assert.equal(car?.subcategory, 'VEHICLE_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(car.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(car.id, question.id, `車回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachVehicle(conversation, 'スポーツカーさん', 'VEHICLE_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_CAR_BIKE_V2_13', '普通自動車免許')?.ok,
      true,
    );
    const license = conversation.getWordEntries().find((word) => word.surface === '普通自動車免許');
    assert.equal(license?.subcategory, 'SCHOOL_5');
    assert.equal(license?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_CAR_BIKE_DEEP_01', '乗り心地が軽快')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '乗り心地が軽快'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'ride_impression',
      value: '乗り心地が軽快',
    });
  });

  run('自転車は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const bicycle = teachVehicle(firstCombo, '思い出の自転車さん', 'VEHICLE_3');
    assert.equal(bicycle?.subcategory, 'VEHICLE_3');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(bicycle.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(bicycle.id, question.id, `自転車回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachVehicle(conversation, 'ママチャリさん', 'VEHICLE_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_BICYCLE_V2_15', '空気入れ')?.ok,
      true,
    );
    const tool = conversation.getWordEntries().find((word) => word.surface === '空気入れ');
    assert.equal(tool?.subcategory, 'OBJECT_5');
    assert.equal(tool?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_BICYCLE_DEEP_01', '軽くて乗りやすい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '軽くて乗りやすい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'ride_impression',
      value: '軽くて乗りやすい',
    });
  });

  run('飛行機は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const airplane = teachVehicle(firstCombo, '思い出の飛行機さん', 'VEHICLE_4');
    assert.equal(airplane?.subcategory, 'VEHICLE_4');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(airplane.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(airplane.id, question.id, `飛行機回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachVehicle(conversation, '旅客機さん', 'VEHICLE_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_AIRPLANE_V2_04', 'フランス')?.ok,
      true,
    );
    const country = conversation.getWordEntries().find((word) => word.surface === 'フランス');
    assert.equal(country?.subcategory, 'PLACE_6');
    assert.equal(country?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_AIRPLANE_DEEP_01', '雲の上から見える景色')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '雲の上から見える景色'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_feature',
      value: '雲の上から見える景色',
    });
  });

  run('船は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const ship = teachVehicle(firstCombo, '思い出の船さん', 'VEHICLE_5');
    assert.equal(ship?.subcategory, 'VEHICLE_5');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(ship.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(ship.id, question.id, `船回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachVehicle(conversation, 'フェリーさん', 'VEHICLE_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_SHIP_V2_17', '大航海時代')?.ok,
      true,
    );
    const history = conversation.getWordEntries().find((word) => word.surface === '大航海時代');
    assert.equal(history?.subcategory, 'KNOWLEDGE_2');
    assert.equal(history?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_SHIP_DEEP_01', '大きくて頼もしい')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '大きくて頼もしい'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_feature',
      value: '大きくて頼もしい',
    });
  });

  run('乗り物・その他は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const otherVehicle = teachVehicle(firstCombo, '思い出のバスさん', 'VEHICLE_6');
    assert.equal(otherVehicle?.subcategory, 'VEHICLE_6');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(otherVehicle.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(otherVehicle.id, question.id, `その他乗り物回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachVehicle(conversation, 'ロープウェイさん', 'VEHICLE_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_OTHER_V2_15', 'ICカード')?.ok,
      true,
    );
    const payment = conversation.getWordEntries().find((word) => word.surface === 'ICカード');
    assert.equal(payment?.subcategory, 'MONEY_6');
    assert.equal(payment?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'VEHICLE_OTHER_DEEP_01', '空を進むところ')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '空を進むところ'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_feature',
      value: '空を進むところ',
    });
  });

  run('遊びは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const play = teachActivity(firstCombo, '思い出の鬼ごっこ', 'ACTIVITY_1');
    assert.equal(play?.subcategory, 'ACTIVITY_1');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(play.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(play.id, question.id, `遊び回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachActivity(conversation, '将棋さん', 'ACTIVITY_1');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_PLAY_V2_03', '将棋盤')?.ok,
      true,
    );
    const tool = conversation.getWordEntries().find((word) => word.surface === '将棋盤');
    assert.equal(tool?.subcategory, 'OBJECT_5');
    assert.equal(tool?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_PLAY_DEEP_01', 'みんなで順番に遊ぶところ')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === 'みんなで順番に遊ぶところ'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'favorite_play_style',
      value: 'みんなで順番に遊ぶところ',
    });
  });

  run('お出かけ・旅行は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const travel = teachActivity(firstCombo, '思い出の日帰り旅行', 'ACTIVITY_2');
    assert.equal(travel?.subcategory, 'ACTIVITY_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(travel.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(travel.id, question.id, `旅行回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachActivity(conversation, '家族旅行さん', 'ACTIVITY_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_TRAVEL_V2_11', '旅客機')?.ok,
      true,
    );
    const airplane = conversation.getWordEntries().find((word) => word.surface === '旅客機');
    assert.equal(airplane?.subcategory, 'VEHICLE_4');
    assert.equal(airplane?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_TRAVEL_DEEP_01', '景色を見ること')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '景色を見ること'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'favorite_part',
      value: '景色を見ること',
    });
  });

  run('作ることは20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const creating = teachActivity(firstCombo, '思い出の工作', 'ACTIVITY_3');
    assert.equal(creating?.subcategory, 'ACTIVITY_3');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(creating.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(creating.id, question.id, `制作回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachActivity(conversation, '動画制作さん', 'ACTIVITY_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_CREATE_V2_06', '動画編集ソフト')?.ok,
      true,
    );
    const software = conversation.getWordEntries().find((word) => word.surface === '動画編集ソフト');
    assert.equal(software?.subcategory, 'TECH_5');
    assert.equal(software?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_CREATE_DEEP_01', '色にこだわる')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '色にこだわる'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'creative_focus',
      value: '色にこだわる',
    });
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_CREATE_V2_02', 'ゲーム制作')?.ok,
      true,
    );
    const futureWord = conversation.getWordEntries().find((word) => word.surface === 'ゲーム制作');
    assert.ok(conversation.getMemoryRelations().some((relation) => (
      relation.subjectId === parent.id
      && relation.objectId === futureWord?.id
      && relation.type === 'LOOKS_FORWARD_TO'
      && relation.qualifier === 'ACTIVITY_CREATE_V2_02'
    )));
  });

  run('集めることは20派生問・2掘り下げ問を持ち、未来の希望を分離して保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const collecting = teachActivity(firstCombo, '思い出の切手集め', 'ACTIVITY_4');
    assert.equal(collecting?.subcategory, 'ACTIVITY_4');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(collecting.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(collecting.id, question.id, `収集回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachActivity(conversation, 'カード集めさん', 'ACTIVITY_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_COLLECT_V2_05', '保管ケース')?.ok,
      true,
    );
    const tool = conversation.getWordEntries().find((word) => word.surface === '保管ケース');
    assert.equal(tool?.subcategory, 'OBJECT_5');
    assert.equal(tool?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_COLLECT_DEEP_01', '限定品にこだわる')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '限定品にこだわる'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'collection_criteria',
      value: '限定品にこだわる',
    });
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_COLLECT_V2_02', '鉱石集め')?.ok,
      true,
    );
    const futureWord = conversation.getWordEntries().find((word) => word.surface === '鉱石集め');
    assert.ok(conversation.getMemoryRelations().some((relation) => (
      relation.subjectId === parent.id
      && relation.objectId === futureWord?.id
      && relation.type === 'LOOKS_FORWARD_TO'
      && relation.qualifier === 'ACTIVITY_COLLECT_V2_02'
    )));
  });

  run('料理・手作りは20派生問・2掘り下げ問を持ち、活動と完成品を分けて保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const cooking = teachActivity(firstCombo, '思い出のお菓子作り', 'ACTIVITY_5');
    assert.equal(cooking?.subcategory, 'ACTIVITY_5');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(cooking.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(cooking.id, question.id, `料理回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachActivity(conversation, 'パン作りさん', 'ACTIVITY_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_COOK_HAND_V2_03', '小麦粉')?.ok,
      true,
    );
    const ingredient = conversation.getWordEntries().find((word) => word.surface === '小麦粉');
    assert.equal(ingredient?.subcategory, 'FOOD_4');
    assert.equal(ingredient?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_COOK_HAND_V2_09', 'ブレスレット')?.ok,
      true,
    );
    const accessory = conversation.getWordEntries().find((word) => word.surface === 'ブレスレット');
    assert.equal(accessory?.subcategory, 'CLOTHING_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_COOK_HAND_DEEP_01', '盛り付けにこだわる')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '盛り付けにこだわる'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'creative_focus',
      value: '盛り付けにこだわる',
    });
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_COOK_HAND_V2_02', '編み物')?.ok,
      true,
    );
    const futureWord = conversation.getWordEntries().find((word) => word.surface === '編み物');
    assert.ok(conversation.getMemoryRelations().some((relation) => (
      relation.subjectId === parent.id
      && relation.objectId === futureWord?.id
      && relation.type === 'LOOKS_FORWARD_TO'
      && relation.qualifier === 'ACTIVITY_COOK_HAND_V2_02'
    )));
  });

  run('その他の趣味は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const hobby = teachActivity(firstCombo, '思い出の天体観測', 'ACTIVITY_6');
    assert.equal(hobby?.subcategory, 'ACTIVITY_6');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(hobby.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(hobby.id, question.id, `趣味回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachActivity(conversation, '釣りさん', 'ACTIVITY_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_OTHER_HOBBY_V2_13', '金魚')?.ok,
      true,
    );
    const fish = conversation.getWordEntries().find((word) => word.surface === '金魚');
    assert.equal(fish?.subcategory, 'ANIMAL_3');
    assert.equal(fish?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'ACTIVITY_OTHER_HOBBY_DEEP_01', '自然をじっくり見るところ')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '自然をじっくり見るところ'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'favorite_aspect',
      value: '自然をじっくり見るところ',
    });
  });

  run('球技は20派生問・2掘り下げ問を持ち、指定分類と属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const ball = teachSports(firstCombo, '思い出の野球', 'SPORTS_1');
    assert.equal(ball?.subcategory, 'SPORTS_1');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(ball.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(ball.id, question.id, `球技回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, 'サッカーさん', 'SPORTS_1');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_BALL_V2_11', '大谷選手')?.ok,
      true,
    );
    const athlete = conversation.getWordEntries().find((word) => word.surface === '大谷選手');
    assert.equal(athlete?.subcategory, 'PERSON_ATHLETE');
    assert.equal(athlete?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_BALL_DEEP_01', '逆転の瞬間が面白い')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '逆転の瞬間が面白い'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'favorite_aspect',
      value: '逆転の瞬間が面白い',
    });
  });

  run('武道・格闘技は20派生問・2掘り下げ問を持ち、技名をスポーツその他へ保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const martial = teachSports(firstCombo, '思い出の柔道', 'SPORTS_2');
    assert.equal(martial?.subcategory, 'SPORTS_2');
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(martial.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(martial.id, question.id, `武道回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, '空手さん', 'SPORTS_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_MARTIAL_V2_05', '回し蹴り')?.ok,
      true,
    );
    const technique = conversation.getWordEntries().find((word) => word.surface === '回し蹴り');
    assert.equal(technique?.subcategory, 'SPORTS_6');
    assert.equal(technique?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_MARTIAL_V2_12', '井上選手')?.ok,
      true,
    );
    const athlete = conversation.getWordEntries().find((word) => word.surface === '井上選手');
    assert.equal(athlete?.subcategory, 'PERSON_ATHLETE');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_MARTIAL_DEEP_01', '技の駆け引きが面白い')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '技の駆け引きが面白い'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'favorite_aspect',
      value: '技の駆け引きが面白い',
    });
  });

  run('陸上・体操は20派生問・2掘り下げ問を持ち、種目を競技・種目へ保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const trackField = teachSports(firstCombo, '思い出の陸上', 'SPORTS_3');
    assert.equal(trackField?.subcategory, 'SPORTS_3');
    assert.equal(
      PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === 'SPORTS_3',
      ).length,
      20,
    );
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(trackField.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(trackField.id, question.id, `陸上・体操回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, '陸上さん', 'SPORTS_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_TRACK_FIELD_V2_02', '走り高跳び')?.ok,
      true,
    );
    const discipline = conversation.getWordEntries().find((word) => word.surface === '走り高跳び');
    assert.equal(discipline?.subcategory, 'SPORTS_DISCIPLINE');
    assert.equal(discipline?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_TRACK_FIELD_V2_11', '佐藤先生')?.ok,
      true,
    );
    const teacher = conversation.getWordEntries().find((word) => word.surface === '佐藤先生');
    assert.equal(teacher?.subcategory, 'PERSON_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_TRACK_FIELD_DEEP_01', '記録が伸びるところ')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '記録が伸びるところ'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'favorite_aspect',
      value: '記録が伸びるところ',
    });
  });

  run('水のスポーツは20派生問・2掘り下げ問を持ち、水中の生き物を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const water = teachSports(firstCombo, '思い出の水泳', 'SPORTS_4');
    assert.equal(water?.subcategory, 'SPORTS_4');
    assert.equal(
      PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === 'SPORTS_4',
      ).length,
      20,
    );
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(water.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(water.id, question.id, `水のスポーツ回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, '水泳さん', 'SPORTS_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_WATER_V2_02', '競泳')?.ok,
      true,
    );
    const discipline = conversation.getWordEntries().find((word) => word.surface === '競泳');
    assert.equal(discipline?.subcategory, 'SPORTS_DISCIPLINE');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_WATER_V2_13', '山田コーチ')?.ok,
      true,
    );
    const instructor = conversation.getWordEntries().find((word) => word.surface === '山田コーチ');
    assert.equal(instructor?.subcategory, 'PERSON_OTHER');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_WATER_V2_17', 'イルカ')?.ok,
      true,
    );
    const animal = conversation.getWordEntries().find((word) => word.surface === 'イルカ');
    assert.equal(animal?.subcategory, 'ANIMAL_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_WATER_DEEP_01', '水の中で動く爽快感')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '水の中で動く爽快感'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'favorite_aspect',
      value: '水の中で動く爽快感',
    });
  });

  run('雪・氷のスポーツは20派生問・2掘り下げ問を持ち、指定分類へ保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const snowIce = teachSports(firstCombo, '思い出のスキー', 'SPORTS_5');
    assert.equal(snowIce?.subcategory, 'SPORTS_5');
    assert.equal(
      PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === 'SPORTS_5',
      ).length,
      20,
    );
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(snowIce.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(snowIce.id, question.id, `雪・氷のスポーツ回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, 'スキーさん', 'SPORTS_5');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_SNOW_ICE_V2_02', 'フィギュアスケート')?.ok,
      true,
    );
    const discipline = conversation.getWordEntries().find((word) => word.surface === 'フィギュアスケート');
    assert.equal(discipline?.subcategory, 'SPORTS_DISCIPLINE');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_SNOW_ICE_V2_06', '白銀スケートリンク')?.ok,
      true,
    );
    const facility = conversation.getWordEntries().find((word) => word.surface === '白銀スケートリンク');
    assert.equal(facility?.subcategory, 'PLACE_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_SNOW_ICE_V2_18', '雪')?.ok,
      true,
    );
    const weather = conversation.getWordEntries().find((word) => word.surface === '雪');
    assert.equal(weather?.subcategory, 'NATURE_TIME_1');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_SNOW_ICE_DEEP_01', '滑走の爽快感')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '滑走の爽快感'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'favorite_aspect',
      value: '滑走の爽快感',
    });
  });

  run('競技・種目は20派生問・2掘り下げ問を持ち、未来の種目と記録を分けて保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const discipline = teachSports(firstCombo, '100m走', 'SPORTS_DISCIPLINE');
    assert.equal(discipline?.subcategory, 'SPORTS_DISCIPLINE');
    assert.equal(
      PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === 'SPORTS_DISCIPLINE',
      ).length,
      20,
    );
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(discipline.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(discipline.id, question.id, `競技・種目回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, '走り高跳び', 'SPORTS_DISCIPLINE');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_DISCIPLINE_V2_01', '走り幅跳び')?.ok,
      true,
    );
    const relatedDiscipline = conversation.getWordEntries().find((word) => word.surface === '走り幅跳び');
    assert.equal(relatedDiscipline?.subcategory, 'SPORTS_DISCIPLINE');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_DISCIPLINE_V2_02', '三段跳び')?.ok,
      true,
    );
    const futureDiscipline = conversation.getWordEntries().find((word) => word.surface === '三段跳び');
    assert.equal(futureDiscipline?.subcategory, 'SPORTS_DISCIPLINE');
    assert.ok(
      conversation.getMemoryRelations().some(
        (relation) => relation.objectId === futureDiscipline?.id && relation.type === 'LOOKS_FORWARD_TO',
      ),
    );
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_DISCIPLINE_DEEP_01', '自己ベストを更新した記録')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '自己ベストを更新した記録'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_record',
      value: '自己ベストを更新した記録',
    });
  });

  run('チーム・クラブは20派生問・2掘り下げ問を持ち、所属と応援の記憶を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const team = teachSports(firstCombo, '地元の野球チーム', 'SPORTS_TEAM_CLUB');
    assert.equal(team?.subcategory, 'SPORTS_TEAM_CLUB');
    assert.equal(
      PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === 'SPORTS_TEAM_CLUB',
      ).length,
      20,
    );
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(team.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(team.id, question.id, `チーム回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, 'プロ野球チームA', 'SPORTS_TEAM_CLUB');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_TEAM_CLUB_V2_01', 'サッカークラブB')?.ok,
      true,
    );
    const relatedTeam = conversation.getWordEntries().find((word) => word.surface === 'サッカークラブB');
    assert.equal(relatedTeam?.subcategory, 'SPORTS_TEAM_CLUB');
    assert.equal(relatedTeam?.firstDerivedFromWordId, parent.id);
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_TEAM_CLUB_V2_04', '佐藤監督')?.ok,
      true,
    );
    const coach = conversation.getWordEntries().find((word) => word.surface === '佐藤監督');
    assert.equal(coach?.subcategory, 'PERSON_OTHER');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_TEAM_CLUB_V2_05', '部活の友達')?.ok,
      true,
    );
    const teammate = conversation.getWordEntries().find((word) => word.surface === '部活の友達');
    assert.equal(teammate?.subcategory, 'PERSON_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_TEAM_CLUB_V2_07', '高校陸上部')?.ok,
      true,
    );
    const organization = conversation.getWordEntries().find((word) => word.surface === '高校陸上部');
    assert.equal(organization?.subcategory, 'PLACE_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_TEAM_CLUB_DEEP_01', '家族と試合を見に行ったこと')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '家族と試合を見に行ったこと'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'connection_origin',
      value: '家族と試合を見に行ったこと',
    });
  });

  run('大会・試合は20派生問・2掘り下げ問を持ち、結果を属性として保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const eventMatch = teachSports(firstCombo, '日本シリーズ第七戦', 'SPORTS_EVENT_MATCH');
    assert.equal(eventMatch?.subcategory, 'SPORTS_EVENT_MATCH');
    assert.equal(
      PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === 'SPORTS_EVENT_MATCH',
      ).length,
      20,
    );
    let derived = 0;
    let deep = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(eventMatch.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(eventMatch.id, question.id, `大会・試合回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'derived') derived += 1;
      else deep += 1;
    }
    assert.equal(derived, 4);
    assert.equal(deep, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, 'ワールドカップ決勝', 'SPORTS_EVENT_MATCH');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_EVENT_MATCH_V2_02', 'サッカー')?.ok,
      true,
    );
    const discipline = conversation.getWordEntries().find((word) => word.surface === 'サッカー');
    assert.equal(discipline?.subcategory, 'SPORTS_DISCIPLINE');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_EVENT_MATCH_V2_03', 'クラブA')?.ok,
      true,
    );
    const team = conversation.getWordEntries().find((word) => word.surface === 'クラブA');
    assert.equal(team?.subcategory, 'SPORTS_TEAM_CLUB');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_EVENT_MATCH_V2_06', '劇的な逆転プレー')?.ok,
      true,
    );
    const play = conversation.getWordEntries().find((word) => word.surface === '劇的な逆転プレー');
    assert.equal(play?.subcategory, 'SPORTS_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_EVENT_MATCH_V2_16', '新幹線')?.ok,
      true,
    );
    const train = conversation.getWordEntries().find((word) => word.surface === '新幹線');
    assert.equal(train?.subcategory, 'VEHICLE_1');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_EVENT_MATCH_DEEP_01', '延長戦でのサヨナラ勝ち')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '延長戦でのサヨナラ勝ち'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'memorable_result',
      value: '延長戦でのサヨナラ勝ち',
    });
  });

  run('スポーツ・運動・その他は20派生問・2掘り下げ問を持ち、未来の希望と属性を分けて保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const exercise = teachSports(firstCombo, 'ラジオ体操', 'SPORTS_6');
    assert.equal(exercise?.subcategory, 'SPORTS_6');
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'SPORTS_6',
    );
    assert.equal(pool.length, 20);
    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(exercise.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(exercise.id, question.id, `運動回答${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const future = pool.find((item) => item.id === 'SPORTS_OTHER_V2_02');
    assert.equal(future?.relationType, 'LOOKS_FORWARD_TO');
    assert.deepEqual(future?.classification, {
      mode: 'fixed', category: 'SPORTS', subcategory: 'SPORTS_6',
    });
    assert.equal(
      pool.find((item) => item.id === 'SPORTS_OTHER_V2_13')?.classification?.subcategory,
      'BODY_1',
    );
    assert.equal(
      pool.find((item) => item.id === 'SPORTS_OTHER_V2_14')?.classification?.subcategory,
      'BODY_2',
    );
    assert.equal(
      pool.find((item) => item.id === 'SPORTS_OTHER_V2_17')?.classification?.subcategory,
      'TECH_5',
    );

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachSports(conversation, 'ストレッチ', 'SPORTS_6');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'SPORTS_OTHER_DEEP_01', '体を動かすと気分転換になるから')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '体を動かすと気分転換になるから'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'motivation',
      value: '体を動かすと気分転換になるから',
    });
  });

  run('職業・役職は20派生問・2掘り下げ問を持ち、仕事カテゴリーを区別して保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const occupation = teachWork(firstCombo, '看護師');
    assert.equal(occupation?.subcategory, 'WORK_1');
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'WORK_1',
    );
    assert.equal(pool.length, 20);
    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(occupation.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(occupation.id, question.id, `職業回答${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const classificationFor = (id) => pool.find((item) => item.id === id)?.classification;
    assert.deepEqual(classificationFor('WORK_OCCUPATION_V2_03'), {
      mode: 'fixed', category: 'WORK', subcategory: 'WORK_2',
    });
    assert.deepEqual(classificationFor('WORK_OCCUPATION_V2_04'), {
      mode: 'fixed', category: 'WORK', subcategory: 'WORK_3',
    });
    assert.deepEqual(classificationFor('WORK_OCCUPATION_V2_05'), {
      mode: 'fixed', category: 'WORK', subcategory: 'WORK_4',
    });
    assert.deepEqual(classificationFor('WORK_OCCUPATION_V2_06'), {
      mode: 'fixed', category: 'WORK', subcategory: 'WORK_5',
    });
    assert.equal(classificationFor('WORK_OCCUPATION_V2_14')?.subcategory, 'PERSON_1');
    assert.equal(classificationFor('WORK_OCCUPATION_V2_17')?.subcategory, 'EVENT_6');
    assert.equal(classificationFor('WORK_OCCUPATION_V2_19')?.subcategory, 'AV_MEDIA_3');

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachWork(conversation, '料理人');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'WORK_OCCUPATION_DEEP_01', '人の役に立つところが魅力で、忙しさは大変そう')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '人の役に立つところが魅力で、忙しさは大変そう'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'job_impression',
      value: '人の役に立つところが魅力で、忙しさは大変そう',
    });
  });

  run('仕事内容・作業は20派生問・2掘り下げ問を持ち、前後関係と作業属性を保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const task = teachWork(firstCombo, '品出し', 'WORK_2');
    assert.equal(task?.subcategory, 'WORK_2');
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'WORK_2',
    );
    assert.equal(pool.length, 20);
    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(task.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(task.id, question.id, `仕事内容回答${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const byId = (id) => pool.find((item) => item.id === id);
    assert.equal(byId('WORK_TASK_V2_01')?.opening[0]?.text, 'その作業の前によくする仕事は？');
    assert.equal(byId('WORK_TASK_V2_02')?.opening[0]?.text, 'その作業のあとによくする仕事は？');
    assert.equal(byId('WORK_TASK_V2_01')?.classification?.subcategory, 'WORK_2');
    assert.equal(byId('WORK_TASK_V2_02')?.classification?.subcategory, 'WORK_2');
    assert.equal(byId('WORK_TASK_V2_03')?.classification?.subcategory, 'WORK_1');
    assert.equal(byId('WORK_TASK_V2_04')?.classification?.subcategory, 'WORK_3');
    assert.equal(byId('WORK_TASK_V2_05')?.classification?.subcategory, 'WORK_4');
    assert.equal(byId('WORK_TASK_V2_06')?.classification?.subcategory, 'WORK_5');
    assert.equal(byId('WORK_TASK_V2_16')?.classification?.subcategory, 'SCHOOL_5');
    assert.equal(byId('WORK_TASK_V2_14')?.classification?.subcategory, 'PERSON_4');

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachWork(conversation, '資料作成', 'WORK_2');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'WORK_TASK_DEEP_01', '手順を小分けにして確認しながら進めた')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '手順を小分けにして確認しながら進めた'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'work_approach',
      value: '手順を小分けにして確認しながら進めた',
    });
  });

  run('会社・職場は20派生問・2掘り下げ問を持ち、組織・建物・人物の分類を分ける', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const workplace = teachWork(firstCombo, '以前の勤務先', 'WORK_3');
    assert.equal(workplace?.subcategory, 'WORK_3');
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'WORK_3',
    );
    assert.equal(pool.length, 20);
    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(workplace.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(workplace.id, question.id, `職場回答${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const byId = (id) => pool.find((item) => item.id === id);
    assert.equal(byId('WORK_COMPANY_V2_01')?.classification?.subcategory, 'WORK_3');
    assert.equal(byId('WORK_COMPANY_V2_02')?.classification?.subcategory, 'WORK_3');
    assert.equal(byId('WORK_COMPANY_V2_03')?.classification?.subcategory, 'WORK_1');
    assert.equal(byId('WORK_COMPANY_V2_04')?.classification?.subcategory, 'WORK_2');
    assert.equal(byId('WORK_COMPANY_V2_07')?.classification?.category, 'PLACE');
    assert.equal(byId('WORK_COMPANY_V2_07')?.classification?.subcategory, 'PLACE_3');
    assert.equal(byId('WORK_COMPANY_V2_12')?.classification?.subcategory, 'PERSON_4');
    assert.equal(byId('WORK_COMPANY_V2_13')?.classification?.subcategory, 'PERSON_2');
    assert.equal(byId('WORK_COMPANY_V2_01')?.closing[0]?.text.includes('働いていた'), false);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachWork(conversation, '地域の工場', 'WORK_3');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'WORK_COMPANY_DEEP_01', '人間関係がよくて、忙しい時期は大変だった')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '人間関係がよくて、忙しい時期は大変だった'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'workplace_impression',
      value: '人間関係がよくて、忙しい時期は大変だった',
    });
  });

  run('勤務・働き方は20派生問・2掘り下げ問を持ち、経験と将来希望を分けて保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const workStyle = teachWork(firstCombo, 'シフト勤務', 'WORK_4');
    assert.equal(workStyle?.subcategory, 'WORK_4');
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'WORK_4',
    );
    assert.equal(pool.length, 20);
    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(workStyle.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(workStyle.id, question.id, `働き方回答${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const byId = (id) => pool.find((item) => item.id === id);
    assert.equal(byId('WORK_STYLE_V2_01')?.relationType, undefined);
    assert.equal(byId('WORK_STYLE_V2_02')?.relationType, 'LOOKS_FORWARD_TO');
    assert.equal(byId('WORK_STYLE_V2_02')?.closing[0]?.text.includes('経験した'), false);
    assert.equal(byId('WORK_STYLE_V2_03')?.classification?.subcategory, 'WORK_1');
    assert.equal(byId('WORK_STYLE_V2_04')?.classification?.subcategory, 'WORK_2');
    assert.equal(byId('WORK_STYLE_V2_05')?.classification?.subcategory, 'WORK_3');
    assert.equal(byId('WORK_STYLE_V2_06')?.classification?.subcategory, 'WORK_5');
    assert.equal(byId('WORK_STYLE_V2_07')?.classification?.category, 'MONEY');
    assert.equal(byId('WORK_STYLE_V2_07')?.classification?.subcategory, 'MONEY_4');
    assert.equal(byId('WORK_STYLE_V2_18')?.classification?.subcategory, 'BODY_4');
    assert.equal(byId('WORK_STYLE_V2_20')?.classification?.subcategory, 'NATURE_TIME_4');

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachWork(conversation, '在宅勤務', 'WORK_4');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'WORK_STYLE_DEEP_01', '通勤時間を減らして家族と過ごす時間を作りたかった')?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === '通勤時間を減らして家族と過ごす時間を作りたかった'), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'work_style_motivation',
      value: '通勤時間を減らして家族と過ごす時間を作りたかった',
    });
  });

  run('仕事のルール・制度は固定分類の派生20問と印象属性を持つ', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const rule = teachWork(firstCombo, '有給休暇', 'WORK_5');
    assert.equal(rule?.subcategory, 'WORK_5');
    assert.ok(firstCombo.getPersonWordComboCandidates().some((word) => word.id === rule.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'WORK_5',
    );
    assert.equal(pool.length, 20);
    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(rule.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(rule.id, question.id, `制度回答${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      WORK_RULES_V2_01: ['WORK', 'WORK_5'],
      WORK_RULES_V2_02: ['WORK', 'WORK_5'],
      WORK_RULES_V2_03: ['WORK', 'WORK_4'],
      WORK_RULES_V2_04: ['WORK', 'WORK_1'],
      WORK_RULES_V2_05: ['WORK', 'WORK_2'],
      WORK_RULES_V2_06: ['WORK', 'WORK_3'],
      WORK_RULES_V2_07: ['PERSON', 'PERSON_4'],
      WORK_RULES_V2_08: ['PERSON', 'PERSON_2'],
      WORK_RULES_V2_09: ['MONEY', 'MONEY_4'],
      WORK_RULES_V2_10: ['MONEY', 'MONEY_7'],
      WORK_RULES_V2_11: ['SCHOOL', 'SCHOOL_5'],
      WORK_RULES_V2_12: ['EVENT', 'EVENT_6'],
      WORK_RULES_V2_13: ['TECH', 'TECH_6'],
      WORK_RULES_V2_14: ['TECH', 'TECH_5'],
      WORK_RULES_V2_15: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      WORK_RULES_V2_16: ['AV_MEDIA', 'AV_MEDIA_4'],
      WORK_RULES_V2_17: ['PLACE', 'PLACE_3'],
      WORK_RULES_V2_18: ['KNOWLEDGE', 'KNOWLEDGE_4'],
      WORK_RULES_V2_19: ['NATURE_TIME', 'NATURE_TIME_4'],
      WORK_RULES_V2_20: ['NATURE_TIME', 'NATURE_TIME_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.equal(byId('WORK_RULES_V2_06')?.closing[0]?.text.includes('働いていた'), false);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachWork(conversation, '就業規則', 'WORK_5');
    const impression = '申請手順が少し多いけれど、休みを取りやすくなるのは良いと思う';
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'WORK_RULES_DEEP_01', impression)?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === impression), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'rule_impression',
      value: impression,
    });
  });

  run('仕事・その他は仕事の出来事を固定分類し、考えや選択を属性保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const parent = teachWork(firstCombo, '転職活動', 'WORK_6');
    assert.equal(parent?.subcategory, 'WORK_6');
    assert.ok(firstCombo.getPersonWordComboCandidates().some((word) => word.id === parent.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'WORK_6',
    );
    assert.equal(pool.length, 20);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      WORK_OTHER_V2_01: ['WORK', 'WORK_6'],
      WORK_OTHER_V2_02: ['WORK', 'WORK_6'],
      WORK_OTHER_V2_03: ['WORK', 'WORK_1'],
      WORK_OTHER_V2_04: ['WORK', 'WORK_2'],
      WORK_OTHER_V2_05: ['WORK', 'WORK_3'],
      WORK_OTHER_V2_06: ['WORK', 'WORK_4'],
      WORK_OTHER_V2_07: ['WORK', 'WORK_5'],
      WORK_OTHER_V2_08: ['PERSON', 'PERSON_4'],
      WORK_OTHER_V2_09: ['PERSON', 'PERSON_2'],
      WORK_OTHER_V2_10: ['PERSON', 'PERSON_1'],
      WORK_OTHER_V2_11: ['PLACE', 'PLACE_3'],
      WORK_OTHER_V2_12: ['PLACE', 'PLACE_5'],
      WORK_OTHER_V2_13: ['SCHOOL', 'SCHOOL_5'],
      WORK_OTHER_V2_14: ['SCHOOL', 'SCHOOL_6'],
      WORK_OTHER_V2_15: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      WORK_OTHER_V2_16: ['TECH', 'TECH_6'],
      WORK_OTHER_V2_17: ['TECH', 'TECH_5'],
      WORK_OTHER_V2_18: ['MONEY', 'MONEY_4'],
      WORK_OTHER_V2_19: ['MONEY', 'MONEY_7'],
      WORK_OTHER_V2_20: ['NATURE_TIME', 'NATURE_TIME_2'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('WORK_OTHER_V2_02')?.closing[0]?.text ?? '', /のあとに/);
    assert.match(byId('WORK_OTHER_V2_13')?.closing[0]?.text ?? '', /取得したかどうかとは分けて/);

    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(parent.id, question.id, `仕事の出来事${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const event = teachWork(conversation, '転職活動', 'WORK_6');
    const answer = '次の仕事を探すか、少し休むかを考えていた';
    assert.equal(
      conversation.submitPersonComboAnswer(event.id, 'WORK_OTHER_DEEP_01', answer)?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(event.id)?.slot1, {
      key: 'thoughts_and_choices',
      value: answer,
    });
    assert.doesNotMatch(
      PERSON_DEEP_DIVE_CONVERSATIONS.find((item) => item.id === 'WORK_OTHER_DEEP_01')?.closing[0]?.text ?? '',
      /成功|失敗/,
    );

    const timelineConversation = create(memory(), undefined, () => 0);
    prepare(timelineConversation);
    const timelineParent = teachWork(timelineConversation, '転職活動', 'WORK_6');
    const timelineAnswer = timelineConversation.submitPersonComboAnswer(
      timelineParent.id,
      'WORK_OTHER_V2_02',
      '二次面接',
    );
    assert.equal(timelineAnswer?.ok, true);
    assert.ok(timelineConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === timelineParent.id
      && relation.objectId === timelineAnswer.createdWordId
      && relation.qualifier === 'WORK_OTHER_V2_02'
    )));
  });

  run('学校生活は20派生問を既存分類へつなぎ、過去の印象を属性保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const parent = teachSchool(firstCombo, '掃除当番のこと');
    assert.equal(parent?.subcategory, 'SCHOOL_1');
    assert.ok(firstCombo.getPersonWordComboCandidates().some((word) => word.id === parent.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'SCHOOL_1',
    );
    assert.equal(pool.length, 20);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      SCHOOL_LIFE_V2_01: ['SCHOOL', 'SCHOOL_1'],
      SCHOOL_LIFE_V2_02: ['SCHOOL', 'SCHOOL_1'],
      SCHOOL_LIFE_V2_03: ['SCHOOL', 'SCHOOL_2'],
      SCHOOL_LIFE_V2_04: ['SCHOOL', 'SCHOOL_3'],
      SCHOOL_LIFE_V2_05: ['SCHOOL', 'SCHOOL_4'],
      SCHOOL_LIFE_V2_06: ['PLACE', 'PLACE_4'],
      SCHOOL_LIFE_V2_07: ['PLACE', 'PLACE_3'],
      SCHOOL_LIFE_V2_08: ['PLACE', 'PLACE_2'],
      SCHOOL_LIFE_V2_09: ['VEHICLE', 'VEHICLE_1'],
      SCHOOL_LIFE_V2_10: ['PERSON', 'PERSON_2'],
      SCHOOL_LIFE_V2_11: ['PERSON', 'PERSON_4'],
      SCHOOL_LIFE_V2_12: ['PERSON', 'PERSON_1'],
      SCHOOL_LIFE_V2_13: ['OBJECT', 'OBJECT_3'],
      SCHOOL_LIFE_V2_14: ['CLOTHING', 'CLOTHING_4'],
      SCHOOL_LIFE_V2_15: ['CLOTHING', 'CLOTHING_1'],
      SCHOOL_LIFE_V2_16: ['FOOD', 'FOOD_1'],
      SCHOOL_LIFE_V2_17: ['EVENT', 'EVENT_5'],
      SCHOOL_LIFE_V2_18: ['GAME_MEDIA', 'GAME_MEDIA_1'],
      SCHOOL_LIFE_V2_19: ['NATURE_TIME', 'NATURE_TIME_2'],
      SCHOOL_LIFE_V2_20: ['NATURE_TIME', 'NATURE_TIME_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(
      PERSON_DEEP_DIVE_CONVERSATIONS.find((item) => item.id === 'SCHOOL_LIFE_DEEP_01')?.closing[0]?.text ?? '',
      /そのころ/,
    );

    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(parent.id, question.id, `学校生活回答${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const schoolLife = teachSchool(conversation, '掃除当番のこと');
    const impression = '当時は友達と話せるのが好きだったけれど、今は掃除当番は少し苦手';
    assert.equal(
      conversation.submitPersonComboAnswer(schoolLife.id, 'SCHOOL_LIFE_DEEP_01', impression)?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === impression), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(schoolLife.id)?.slot1, {
      key: 'school_life_impression',
      value: impression,
    });
  });

  run('教科は20派生問で知識と学習経験を分類し、当時の印象を属性保存する', () => {
    const firstCombo = create(memory(), undefined, () => 0.5);
    prepare(firstCombo);
    const subject = teachSchool(firstCombo, '地学の野外観察', 'SCHOOL_2');
    assert.equal(subject?.subcategory, 'SCHOOL_2');
    assert.ok(firstCombo.getPersonWordComboCandidates().some((word) => word.id === subject.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter(
      (item) => item.parentSubcategory === 'SCHOOL_2',
    );
    assert.equal(pool.length, 20);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      SCHOOL_SUBJECT_V2_01: ['SCHOOL', 'SCHOOL_2'],
      SCHOOL_SUBJECT_V2_02: ['SCHOOL', 'SCHOOL_2'],
      SCHOOL_SUBJECT_V2_03: ['SCHOOL', 'SCHOOL_1'],
      SCHOOL_SUBJECT_V2_04: ['SCHOOL', 'SCHOOL_3'],
      SCHOOL_SUBJECT_V2_05: ['SCHOOL', 'SCHOOL_4'],
      SCHOOL_SUBJECT_V2_06: ['PLACE', 'PLACE_4'],
      SCHOOL_SUBJECT_V2_07: ['PLACE', 'PLACE_3'],
      SCHOOL_SUBJECT_V2_08: ['PERSON', 'PERSON_4'],
      SCHOOL_SUBJECT_V2_09: ['PERSON', 'PERSON_2'],
      SCHOOL_SUBJECT_V2_10: ['PERSON', 'PERSON_1'],
      SCHOOL_SUBJECT_V2_11: ['OBJECT', 'OBJECT_3'],
      SCHOOL_SUBJECT_V2_12: ['OBJECT', 'OBJECT_5'],
      SCHOOL_SUBJECT_V2_13: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      SCHOOL_SUBJECT_V2_14: ['TECH', 'TECH_5'],
      SCHOOL_SUBJECT_V2_15: ['KNOWLEDGE', 'KNOWLEDGE_2'],
      SCHOOL_SUBJECT_V2_16: ['KNOWLEDGE', 'KNOWLEDGE_3'],
      SCHOOL_SUBJECT_V2_17: ['ACTIVITY', 'ACTIVITY_3'],
      SCHOOL_SUBJECT_V2_18: ['SCHOOL', 'SCHOOL_5'],
      SCHOOL_SUBJECT_V2_19: ['WORK', 'WORK_2'],
      SCHOOL_SUBJECT_V2_20: ['EVENT', 'EVENT_5'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }

    const initialQuestions = [];
    for (let index = 0; index < 6; index += 1) {
      const question = firstCombo.getNextPersonComboQuestion(subject.id);
      assert.ok(question);
      assert.equal(
        firstCombo.submitPersonComboAnswer(subject.id, question.id, `教科回答${index + 1}`)?.ok,
        true,
      );
      initialQuestions.push(question);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const rememberedSubject = teachSchool(conversation, '地学の野外観察', 'SCHOOL_2');
    const impression = '昔は作品を作るのが好きだったけれど、発表は少し苦手だった';
    assert.equal(
      conversation.submitPersonComboAnswer(rememberedSubject.id, 'SCHOOL_SUBJECT_DEEP_01', impression)?.ok,
      true,
    );
    assert.equal(conversation.getWordEntries().some((word) => word.surface === impression), false);
    assert.deepEqual(conversation.getPersonWordDeepDive(rememberedSubject.id)?.slot1, {
      key: 'subject_impression',
      value: impression,
    });
    assert.equal(
      conversation.getMemoryRelations().some((relation) => (
        relation.objectId === rememberedSubject.id
        && ['LIKES', 'DISLIKES', 'IS_GOOD_AT', 'STRUGGLES_WITH'].includes(relation.type)
      )),
      false,
    );
  });

  run('宿題・課題は20問を指定分類し、期限・前後関係・苦労を属性として区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    const homework = teachSchool(conversation, '植物観察レポート作品', 'SCHOOL_3');
    assert.ok(homework, 'homework word should be taught');
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === homework.id), 'homework should be a combo candidate');
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'SCHOOL_3');
    assert.equal(pool.length, 20);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      SCHOOL_HOMEWORK_V2_01: ['SCHOOL', 'SCHOOL_3'],
      SCHOOL_HOMEWORK_V2_02: ['SCHOOL', 'SCHOOL_3'],
      SCHOOL_HOMEWORK_V2_03: ['SCHOOL', 'SCHOOL_2'],
      SCHOOL_HOMEWORK_V2_04: ['SCHOOL', 'SCHOOL_4'],
      SCHOOL_HOMEWORK_V2_05: ['PLACE', 'PLACE_4'],
      SCHOOL_HOMEWORK_V2_06: ['PERSON', 'PERSON_4'],
      SCHOOL_HOMEWORK_V2_07: ['PERSON', 'PERSON_2'],
      SCHOOL_HOMEWORK_V2_08: ['PERSON', 'PERSON_1'],
      SCHOOL_HOMEWORK_V2_09: ['PLACE', 'PLACE_2'],
      SCHOOL_HOMEWORK_V2_10: ['PLACE', 'PLACE_3'],
      SCHOOL_HOMEWORK_V2_11: ['OBJECT', 'OBJECT_3'],
      SCHOOL_HOMEWORK_V2_12: ['OBJECT', 'OBJECT_5'],
      SCHOOL_HOMEWORK_V2_13: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      SCHOOL_HOMEWORK_V2_14: ['TECH', 'TECH_4'],
      SCHOOL_HOMEWORK_V2_15: ['TECH', 'TECH_5'],
      SCHOOL_HOMEWORK_V2_16: ['ACTIVITY', 'ACTIVITY_3'],
      SCHOOL_HOMEWORK_V2_17: ['KNOWLEDGE', 'KNOWLEDGE_2'],
      SCHOOL_HOMEWORK_V2_18: ['KNOWLEDGE', 'KNOWLEDGE_3'],
      SCHOOL_HOMEWORK_V2_19: ['NATURE_TIME', 'NATURE_TIME_4'],
      SCHOOL_HOMEWORK_V2_20: ['NATURE_TIME', 'NATURE_TIME_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('SCHOOL_HOMEWORK_V2_02')?.closing[0]?.text ?? '', /次に取り組んだ課題/);
    assert.match(byId('SCHOOL_HOMEWORK_V2_19')?.opening[0]?.text ?? '', /提出期限/);
    assert.doesNotMatch(byId('SCHOOL_HOMEWORK_V2_19')?.opening[0]?.text ?? '', /提出した日/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(homework.id);
      assert.ok(question, `initial combo question ${index + 1} should exist`);
      assert.equal(conversation.submitPersonComboAnswer(homework.id, question.id, `宿題回答${index + 1}`)?.ok, true, `initial combo answer ${index + 1} should be accepted`);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    const rememberedHomework = teachSchool(deepConversation, '植物観察レポート作品', 'SCHOOL_3');
    const effort = '調べる範囲を小さく分けて、少しずつ進めた';
    assert.equal(deepConversation.submitPersonComboAnswer(rememberedHomework.id, 'SCHOOL_HOMEWORK_DEEP_01', effort)?.ok, true);
    assert.equal(deepConversation.getWordEntries().some((word) => word.surface === effort), false);
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedHomework.id)?.slot1, {
      key: 'effort_and_difficulty', value: effort,
    });
    assert.equal(deepConversation.getMemoryRelations().some((relation) => (
      relation.objectId === rememberedHomework.id && ['IS_GOOD_AT', 'STRUGGLES_WITH'].includes(relation.type)
    )), false);
  });

  run('試験・受験は20問を指定分類し、模試・志望校・結果を混同せず属性保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    const exam = teachSchool(conversation, '地域環境の到達度試験', 'SCHOOL_4');
    assert.ok(exam);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === exam.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'SCHOOL_4');
    assert.equal(pool.length, 20);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      SCHOOL_EXAM_V2_01: ['SCHOOL', 'SCHOOL_4'],
      SCHOOL_EXAM_V2_02: ['SCHOOL', 'SCHOOL_4'],
      SCHOOL_EXAM_V2_03: ['SCHOOL', 'SCHOOL_2'],
      SCHOOL_EXAM_V2_04: ['SCHOOL', 'SCHOOL_3'],
      SCHOOL_EXAM_V2_05: ['PLACE', 'PLACE_4'],
      SCHOOL_EXAM_V2_06: ['PLACE', 'PLACE_3'],
      SCHOOL_EXAM_V2_07: ['PERSON', 'PERSON_4'],
      SCHOOL_EXAM_V2_08: ['PERSON', 'PERSON_2'],
      SCHOOL_EXAM_V2_09: ['PERSON', 'PERSON_1'],
      SCHOOL_EXAM_V2_10: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      SCHOOL_EXAM_V2_11: ['OBJECT', 'OBJECT_3'],
      SCHOOL_EXAM_V2_12: ['TECH', 'TECH_5'],
      SCHOOL_EXAM_V2_13: ['TECH', 'TECH_4'],
      SCHOOL_EXAM_V2_14: ['SCHOOL', 'SCHOOL_5'],
      SCHOOL_EXAM_V2_15: ['PLACE', 'PLACE_3'],
      SCHOOL_EXAM_V2_16: ['VEHICLE', 'VEHICLE_1'],
      SCHOOL_EXAM_V2_17: ['FOOD', 'FOOD_1'],
      SCHOOL_EXAM_V2_18: ['FOOD', 'FOOD_3'],
      SCHOOL_EXAM_V2_19: ['NATURE_TIME', 'NATURE_TIME_4'],
      SCHOOL_EXAM_V2_20: ['NATURE_TIME', 'NATURE_TIME_2'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('SCHOOL_EXAM_V2_02')?.closing[0]?.text ?? '', /前に受けた模擬試験/);
    assert.match(byId('SCHOOL_EXAM_V2_05')?.closing[0]?.text ?? '', /目指していた学校/);
    assert.doesNotMatch(byId('SCHOOL_EXAM_V2_05')?.closing[0]?.text ?? '', /合格|進学先/);
    assert.match(byId('SCHOOL_EXAM_V2_19')?.opening[0]?.text ?? '', /日付や曜日/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(exam.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(exam.id, question.id, `試験回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    const rememberedExam = teachSchool(deepConversation, '地域環境の到達度試験', 'SCHOOL_4');
    const result = '目標点に届いたことを覚えている';
    assert.equal(deepConversation.submitPersonComboAnswer(rememberedExam.id, 'SCHOOL_EXAM_DEEP_01', result)?.ok, true);
    assert.equal(deepConversation.getWordEntries().some((word) => word.surface === result), false);
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedExam.id)?.slot1, {
      key: 'memorable_result', value: result,
    });
    assert.equal(deepConversation.getMemoryRelations().some((relation) => (
      relation.objectId === rememberedExam.id && ['LIKES', 'DISLIKES', 'IS_GOOD_AT', 'STRUGGLES_WITH'].includes(relation.type)
    )), false);
  });

  run('資格は20問を指定分類し、取得・受験・関心を断定せず属性保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    const qualification = teachSchool(conversation, '食品衛生責任者', 'SCHOOL_5');
    assert.ok(qualification);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === qualification.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'SCHOOL_5');
    assert.equal(pool.length, 20);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      SCHOOL_QUALIFICATION_V2_01: ['SCHOOL', 'SCHOOL_5'],
      SCHOOL_QUALIFICATION_V2_02: ['SCHOOL', 'SCHOOL_5'],
      SCHOOL_QUALIFICATION_V2_03: ['SCHOOL', 'SCHOOL_2'],
      SCHOOL_QUALIFICATION_V2_04: ['SCHOOL', 'SCHOOL_6'],
      SCHOOL_QUALIFICATION_V2_05: ['SCHOOL', 'SCHOOL_4'],
      SCHOOL_QUALIFICATION_V2_06: ['WORK', 'WORK_1'],
      SCHOOL_QUALIFICATION_V2_07: ['WORK', 'WORK_2'],
      SCHOOL_QUALIFICATION_V2_08: ['WORK', 'WORK_5'],
      SCHOOL_QUALIFICATION_V2_09: ['PLACE', 'PLACE_4'],
      SCHOOL_QUALIFICATION_V2_10: ['PERSON', 'PERSON_4'],
      SCHOOL_QUALIFICATION_V2_11: ['PERSON', 'PERSON_2'],
      SCHOOL_QUALIFICATION_V2_12: ['PERSON', 'PERSON_1'],
      SCHOOL_QUALIFICATION_V2_13: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      SCHOOL_QUALIFICATION_V2_14: ['TECH', 'TECH_5'],
      SCHOOL_QUALIFICATION_V2_15: ['TECH', 'TECH_4'],
      SCHOOL_QUALIFICATION_V2_16: ['PLACE', 'PLACE_3'],
      SCHOOL_QUALIFICATION_V2_17: ['OBJECT', 'OBJECT_5'],
      SCHOOL_QUALIFICATION_V2_18: ['MONEY', 'MONEY_2'],
      SCHOOL_QUALIFICATION_V2_19: ['MONEY', 'MONEY_4'],
      SCHOOL_QUALIFICATION_V2_20: ['NATURE_TIME', 'NATURE_TIME_4'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('SCHOOL_QUALIFICATION_V2_06')?.closing[0]?.text ?? '', /役立つことがある/);
    assert.doesNotMatch(byId('SCHOOL_QUALIFICATION_V2_06')?.closing[0]?.text ?? '', /必須/);
    assert.match(byId('SCHOOL_QUALIFICATION_V2_20')?.opening[0]?.text ?? '', /取得した日や受験した日/);
    assert.doesNotMatch(byId('SCHOOL_QUALIFICATION_V2_20')?.closing[0]?.text ?? '', /取得済み|合格/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(qualification.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(qualification.id, question.id, `資格回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    const rememberedQualification = teachSchool(deepConversation, '食品衛生責任者', 'SCHOOL_5');
    const experience = 'まだ取得していなくて、今は興味があるだけ';
    assert.equal(deepConversation.submitPersonComboAnswer(rememberedQualification.id, 'SCHOOL_QUALIFICATION_DEEP_02', experience)?.ok, true);
    assert.equal(deepConversation.getWordEntries().some((word) => word.surface === experience), false);
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedQualification.id)?.slot2, {
      key: 'qualification_experience', value: experience,
    });
  });

  run('仕事・将来のための勉強は20問を指定分類し、理由と学習経験を属性として分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    const learning = teachSchool(conversation, '地域観光の英会話学習', 'SCHOOL_6');
    assert.ok(learning);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === learning.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'SCHOOL_6');
    assert.equal(pool.length, 20);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      SCHOOL_FUTURE_STUDY_V2_01: ['SCHOOL', 'SCHOOL_6'],
      SCHOOL_FUTURE_STUDY_V2_02: ['SCHOOL', 'SCHOOL_6'],
      SCHOOL_FUTURE_STUDY_V2_03: ['SCHOOL', 'SCHOOL_2'],
      SCHOOL_FUTURE_STUDY_V2_04: ['SCHOOL', 'SCHOOL_5'],
      SCHOOL_FUTURE_STUDY_V2_05: ['WORK', 'WORK_1'],
      SCHOOL_FUTURE_STUDY_V2_06: ['WORK', 'WORK_2'],
      SCHOOL_FUTURE_STUDY_V2_07: ['PLACE', 'PLACE_4'],
      SCHOOL_FUTURE_STUDY_V2_08: ['PERSON', 'PERSON_4'],
      SCHOOL_FUTURE_STUDY_V2_09: ['PERSON', 'PERSON_2'],
      SCHOOL_FUTURE_STUDY_V2_10: ['PERSON', 'PERSON_1'],
      SCHOOL_FUTURE_STUDY_V2_11: ['PLACE', 'PLACE_3'],
      SCHOOL_FUTURE_STUDY_V2_12: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      SCHOOL_FUTURE_STUDY_V2_13: ['AV_MEDIA', 'AV_MEDIA_4'],
      SCHOOL_FUTURE_STUDY_V2_14: ['TECH', 'TECH_5'],
      SCHOOL_FUTURE_STUDY_V2_15: ['TECH', 'TECH_4'],
      SCHOOL_FUTURE_STUDY_V2_16: ['TECH', 'TECH_1'],
      SCHOOL_FUTURE_STUDY_V2_17: ['OBJECT', 'OBJECT_3'],
      SCHOOL_FUTURE_STUDY_V2_18: ['WORK', 'WORK_6'],
      SCHOOL_FUTURE_STUDY_V2_19: ['MONEY', 'MONEY_2'],
      SCHOOL_FUTURE_STUDY_V2_20: ['NATURE_TIME', 'NATURE_TIME_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('SCHOOL_FUTURE_STUDY_V2_01')?.opening[0]?.text ?? '', /学んだこと/);
    assert.match(byId('SCHOOL_FUTURE_STUDY_V2_06')?.closing[0]?.text ?? '', /生かしたんだね/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(learning.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(learning.id, question.id, `学習回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    const rememberedLearning = teachSchool(deepConversation, '地域観光の英会話学習', 'SCHOOL_6');
    const motivation = '仕事で外国からの人に挨拶できたらと思った';
    const experience = '続けているかはまだ分からないけれど、少し挨拶を覚えた';
    assert.equal(deepConversation.submitPersonComboAnswer(rememberedLearning.id, 'SCHOOL_FUTURE_STUDY_DEEP_01', motivation)?.ok, true);
    assert.equal(deepConversation.submitPersonComboAnswer(rememberedLearning.id, 'SCHOOL_FUTURE_STUDY_DEEP_02', experience)?.ok, true);
    assert.equal(deepConversation.getWordEntries().some((word) => [motivation, experience].includes(word.surface)), false);
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedLearning.id), {
      slot1: { key: 'learning_motivation', value: motivation },
      slot2: { key: 'learning_experience', value: experience },
    });
  });

  run('学校・勉強・その他は学び方と学習内容を分け、背景・影響を属性保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    const learningExperience = teachSchool(conversation, '留学先での学び直し', 'SCHOOL_7');
    assert.ok(learningExperience);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === learningExperience.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'SCHOOL_7');
    assert.equal(pool.length, 20);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      SCHOOL_OTHER_V2_01: ['SCHOOL', 'SCHOOL_7'],
      SCHOOL_OTHER_V2_02: ['SCHOOL', 'SCHOOL_7'],
      SCHOOL_OTHER_V2_03: ['SCHOOL', 'SCHOOL_2'],
      SCHOOL_OTHER_V2_04: ['SCHOOL', 'SCHOOL_3'],
      SCHOOL_OTHER_V2_05: ['SCHOOL', 'SCHOOL_4'],
      SCHOOL_OTHER_V2_06: ['SCHOOL', 'SCHOOL_5'],
      SCHOOL_OTHER_V2_07: ['SCHOOL', 'SCHOOL_6'],
      SCHOOL_OTHER_V2_08: ['PLACE', 'PLACE_4'],
      SCHOOL_OTHER_V2_09: ['PLACE', 'PLACE_3'],
      SCHOOL_OTHER_V2_10: ['PLACE', 'PLACE_5'],
      SCHOOL_OTHER_V2_11: ['PERSON', 'PERSON_4'],
      SCHOOL_OTHER_V2_12: ['PERSON', 'PERSON_2'],
      SCHOOL_OTHER_V2_13: ['PERSON', 'PERSON_1'],
      SCHOOL_OTHER_V2_14: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      SCHOOL_OTHER_V2_15: ['OBJECT', 'OBJECT_3'],
      SCHOOL_OTHER_V2_16: ['TECH', 'TECH_5'],
      SCHOOL_OTHER_V2_17: ['TECH', 'TECH_4'],
      SCHOOL_OTHER_V2_18: ['PLACE', 'PLACE_6'],
      SCHOOL_OTHER_V2_19: ['NATURE_TIME', 'NATURE_TIME_3'],
      SCHOOL_OTHER_V2_20: ['AV_MEDIA', 'AV_MEDIA_1'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(learningExperience.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(learningExperience.id, question.id, `学びの経験回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    const rememberedLearning = teachSchool(deepConversation, '留学先での学び直し', 'SCHOOL_7');
    const background = '職場で英語を使う必要がありそうだと思ったから';
    const impact = '当時の学びで単語を少し覚えた。今も続けているわけではない';
    assert.equal(deepConversation.submitPersonComboAnswer(rememberedLearning.id, 'SCHOOL_OTHER_DEEP_01', background)?.ok, true);
    assert.equal(deepConversation.submitPersonComboAnswer(rememberedLearning.id, 'SCHOOL_OTHER_DEEP_02', impact)?.ok, true);
    assert.equal(deepConversation.getWordEntries().some((word) => [background, impact].includes(word.surface)), false);
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedLearning.id), {
      slot1: { key: 'learning_background', value: background },
      slot2: { key: 'learning_impact', value: impact },
    });
    assert.equal(deepConversation.getMemoryRelations().some((relation) => (
      relation.objectId === rememberedLearning.id && ['IS_GOOD_AT', 'STRUGGLES_WITH'].includes(relation.type)
    )), false);
  });

  run('漫画は20派生・5掘り下げを持ち、同時期の質問・作品重複・印象属性を制御する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('星降る図書室');
    conversation.chooseCategory('GAME_MEDIA');
    conversation.chooseSubCategory('GAME_MEDIA_1');
    conversation.choose('WORD_NEUTRAL');
    const manga = conversation.getWordEntries().find((word) => word.surface === '星降る図書室');
    assert.ok(manga);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === manga.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_1');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_1');
    assert.equal(pool.length, 20);
    assert.equal(deepPool.length, 5);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      MANGA_V2_01: ['GAME_MEDIA', 'GAME_MEDIA_1'],
      MANGA_V2_02: ['GAME_MEDIA', 'GAME_MEDIA_1'],
      MANGA_V2_03: ['GAME_MEDIA', 'GAME_MEDIA_1'],
      MANGA_V2_04: ['PERSON', 'PERSON_MANGA_ARTIST'],
      MANGA_V2_05: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      MANGA_V2_06: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      MANGA_V2_07: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      MANGA_V2_08: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      MANGA_V2_09: ['GAME_MEDIA', 'GAME_MEDIA_5'],
      MANGA_V2_10: ['GAME_MEDIA', 'GAME_MEDIA_2'],
      MANGA_V2_11: ['AV_MEDIA', 'AV_MEDIA_2'],
      MANGA_V2_12: ['GAME_MEDIA', 'GAME_MEDIA_3'],
      MANGA_V2_13: ['AV_MEDIA', 'AV_MEDIA_1'],
      MANGA_V2_14: ['PERSON', 'PERSON_2'],
      MANGA_V2_15: ['PERSON', 'PERSON_1'],
      MANGA_V2_16: ['PLACE', 'PLACE_2'],
      MANGA_V2_17: ['PLACE', 'PLACE_3'],
      MANGA_V2_18: ['ACTIVITY', 'ACTIVITY_4'],
      MANGA_V2_19: ['ACTIVITY', 'ACTIVITY_1'],
      MANGA_V2_20: ['EVENT', 'EVENT_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('MANGA_V2_09')?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(byId('MANGA_V2_10')?.opening[0]?.text ?? '', /同じころ/);
    assert.match(byId('MANGA_V2_11')?.opening[0]?.text ?? '', /読んでいたころ/);
    assert.match(byId('MANGA_V2_12')?.opening[0]?.text ?? '', /読んでいたころ/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(manga.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(manga.id, question.id, `漫画コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateTitleConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateTitleConversation);
    duplicateTitleConversation.startWordTeaching();
    duplicateTitleConversation.submit('星降る図書室');
    duplicateTitleConversation.chooseCategory('GAME_MEDIA');
    duplicateTitleConversation.chooseSubCategory('GAME_MEDIA_1');
    duplicateTitleConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateTitleConversation.getWordEntries().find((word) => word.surface === '星降る図書室');
    const wordCount = duplicateTitleConversation.getWordEntries().length;
    assert.equal(duplicateTitleConversation.submitPersonComboAnswer(duplicateParent.id, 'MANGA_V2_01', '星降る図書室')?.ok, true);
    assert.equal(duplicateTitleConversation.getWordEntries().filter((word) => word.surface === '星降る図書室').length, 1);
    assert.equal(duplicateTitleConversation.getWordEntries().length, wordCount);

    const spacedConversation = create(memory(), undefined, () => 0);
    prepare(spacedConversation);
    spacedConversation.startWordTeaching();
    spacedConversation.submit('海辺の図書室日記');
    spacedConversation.chooseCategory('GAME_MEDIA');
    spacedConversation.chooseSubCategory('GAME_MEDIA_1');
    spacedConversation.choose('WORD_NEUTRAL');
    const spacedManga = spacedConversation.getWordEntries().find((word) => word.surface === '海辺の図書室日記');
    assert.equal(spacedConversation.submitPersonComboAnswer(spacedManga.id, 'MANGA_V2_10', '青空の冒険アニメ')?.ok, true);
    const nextQuestion = spacedConversation.getNextPersonComboQuestion(spacedManga.id);
    assert.ok(nextQuestion);
    assert.equal(['MANGA_V2_10', 'MANGA_V2_11', 'MANGA_V2_12'].includes(nextQuestion.id), false);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    deepConversation.startWordTeaching();
    deepConversation.submit('星降る図書室');
    deepConversation.chooseCategory('GAME_MEDIA');
    deepConversation.chooseSubCategory('GAME_MEDIA_1');
    deepConversation.choose('WORD_NEUTRAL');
    const rememberedManga = deepConversation.getWordEntries().find((word) => word.surface === '星降る図書室');
    const deepAnswers = [
      ['MANGA_DEEP_01', '当時は絵柄が好きで、少し怖い場面は苦手だった'],
      ['MANGA_DEEP_02', '強がっているけれど仲間を大切にすると思った'],
      ['MANGA_DEEP_03', '雨の中で主人公が戻ってくる場面'],
      ['MANGA_DEEP_04', '友達が貸してくれて初めて読んだ'],
      ['MANGA_DEEP_05', '行動に影響は特になかったと思う'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(deepConversation.submitPersonComboAnswer(rememberedManga.id, questionId, answer)?.ok, true);
      assert.equal(deepConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedManga.id), {
      slot1: { key: 'manga_impression', value: deepAnswers[0][1] },
      slot2: { key: 'character_interpretation', value: deepAnswers[1][1] },
      slot3: { key: 'memorable_scene', value: deepAnswers[2][1] },
      slot4: { key: 'encounter_memory', value: deepAnswers[3][1] },
      slot5: { key: 'personal_influence', value: deepAnswers[4][1] },
    });

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('星降る図書室');
    completionConversation.chooseCategory('GAME_MEDIA');
    completionConversation.chooseSubCategory('GAME_MEDIA_1');
    completionConversation.choose('WORD_NEUTRAL');
    const completeManga = completionConversation.getWordEntries().find((word) => word.surface === '星降る図書室');
    for (const item of pool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeManga.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const item of deepPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeManga.id, item.id, `掘り下げ回答${item.id}`)?.ok, true);
    }
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeManga.id), false);
  });

  run('アニメは20派生・5掘り下げを持ち、同時期の記憶と作品重複を制御する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('星降る図書室アニメ');
    conversation.chooseCategory('GAME_MEDIA');
    conversation.chooseSubCategory('GAME_MEDIA_2');
    conversation.choose('WORD_NEUTRAL');
    const anime = conversation.getWordEntries().find((word) => word.surface === '星降る図書室アニメ');
    assert.ok(anime);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === anime.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_2');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_2');
    assert.equal(pool.length, 20);
    assert.equal(deepPool.length, 5);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      ANIME_V2_01: ['GAME_MEDIA', 'GAME_MEDIA_2'],
      ANIME_V2_02: ['GAME_MEDIA', 'GAME_MEDIA_2'],
      ANIME_V2_03: ['GAME_MEDIA', 'GAME_MEDIA_5'],
      ANIME_V2_04: ['GAME_MEDIA', 'GAME_MEDIA_1'],
      ANIME_V2_05: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      ANIME_V2_06: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      ANIME_V2_07: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      ANIME_V2_08: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      ANIME_V2_09: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      ANIME_V2_10: ['AV_MEDIA', 'AV_MEDIA_1'],
      ANIME_V2_11: ['PERSON', 'PERSON_ENTERTAINER'],
      ANIME_V2_12: ['PERSON', 'PERSON_ENTERTAINER'],
      ANIME_V2_13: ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ANIME_V2_14: ['AV_MEDIA', 'AV_MEDIA_2'],
      ANIME_V2_15: ['AV_MEDIA', 'AV_MEDIA_4'],
      ANIME_V2_16: ['PERSON', 'PERSON_2'],
      ANIME_V2_17: ['PERSON', 'PERSON_1'],
      ANIME_V2_18: ['ACTIVITY', 'ACTIVITY_4'],
      ANIME_V2_19: ['EVENT', 'EVENT_3'],
      ANIME_V2_20: ['NATURE_TIME', 'NATURE_TIME_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('ANIME_V2_03')?.closing[0]?.text ?? '', /人間さんには/);
    for (const id of ['ANIME_V2_13', 'ANIME_V2_14', 'ANIME_V2_15']) {
      assert.match(byId(id)?.opening[0]?.text ?? '', /ころ|そのころ/);
    }

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(anime.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(anime.id, question.id, `アニメコンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('星降る図書室アニメ');
    duplicateConversation.chooseCategory('GAME_MEDIA');
    duplicateConversation.chooseSubCategory('GAME_MEDIA_2');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '星降る図書室アニメ');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'ANIME_V2_01', '星降る図書室アニメ')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '星降る図書室アニメ').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const spacedConversation = create(memory(), undefined, () => 0);
    prepare(spacedConversation);
    spacedConversation.startWordTeaching();
    spacedConversation.submit('雨上がりのロボットアニメ');
    spacedConversation.chooseCategory('GAME_MEDIA');
    spacedConversation.chooseSubCategory('GAME_MEDIA_2');
    spacedConversation.choose('WORD_NEUTRAL');
    const spacedAnime = spacedConversation.getWordEntries().find((word) => word.surface === '雨上がりのロボットアニメ');
    assert.equal(spacedConversation.submitPersonComboAnswer(spacedAnime.id, 'ANIME_V2_13', '星降るゲーム')?.ok, true);
    const nextQuestion = spacedConversation.getNextPersonComboQuestion(spacedAnime.id);
    assert.ok(nextQuestion);
    assert.equal(['ANIME_V2_13', 'ANIME_V2_14', 'ANIME_V2_15'].includes(nextQuestion.id), false);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    deepConversation.startWordTeaching();
    deepConversation.submit('星降る図書室アニメ');
    deepConversation.chooseCategory('GAME_MEDIA');
    deepConversation.chooseSubCategory('GAME_MEDIA_2');
    deepConversation.choose('WORD_NEUTRAL');
    const rememberedAnime = deepConversation.getWordEntries().find((word) => word.surface === '星降る図書室アニメ');
    const deepAnswers = [
      ['ANIME_DEEP_01', '当時はテンポが好きで、説明が長いところは少し苦手だった'],
      ['ANIME_DEEP_02', '静かな場面で声の息づかいが聞こえる演出'],
      ['ANIME_DEEP_03', '主人公が仲間に手を伸ばす最終話の場面'],
      ['ANIME_DEEP_04', '雨の日に家族とテレビをつけていたとき'],
      ['ANIME_DEEP_05', '特に影響はなかったと思う'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(deepConversation.submitPersonComboAnswer(rememberedAnime.id, questionId, answer)?.ok, true);
      assert.equal(deepConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedAnime.id), {
      slot1: { key: 'anime_impression', value: deepAnswers[0][1] },
      slot2: { key: 'audiovisual_impression', value: deepAnswers[1][1] },
      slot3: { key: 'memorable_scene', value: deepAnswers[2][1] },
      slot4: { key: 'first_watch_memory', value: deepAnswers[3][1] },
      slot5: { key: 'personal_influence', value: deepAnswers[4][1] },
    });

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('星降る図書室アニメ');
    completionConversation.chooseCategory('GAME_MEDIA');
    completionConversation.chooseSubCategory('GAME_MEDIA_2');
    completionConversation.choose('WORD_NEUTRAL');
    const completeAnime = completionConversation.getWordEntries().find((word) => word.surface === '星降る図書室アニメ');
    for (const item of pool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeAnime.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const item of deepPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeAnime.id, item.id, `掘り下げ回答${item.id}`)?.ok, true);
    }
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeAnime.id), false);
  });

  run('ゲームは20派生・5掘り下げを持ち、作中要素・タイトル重複・完了を制御する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('星降る図書室ゲーム');
    conversation.chooseCategory('GAME_MEDIA');
    conversation.chooseSubCategory('GAME_MEDIA_3');
    conversation.choose('WORD_NEUTRAL');
    const game = conversation.getWordEntries().find((word) => word.surface === '星降る図書室ゲーム');
    assert.ok(game);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === game.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_3');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_3');
    assert.equal(pool.length, 20);
    assert.equal(deepPool.length, 5);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      GAME_V2_01: ['GAME_MEDIA', 'GAME_MEDIA_3'],
      GAME_V2_02: ['GAME_MEDIA', 'GAME_MEDIA_3'],
      GAME_V2_03: ['GAME_MEDIA', 'GAME_MEDIA_3'],
      GAME_V2_04: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      GAME_V2_05: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      GAME_V2_06: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      GAME_V2_07: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      GAME_V2_08: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      GAME_V2_09: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      GAME_V2_10: ['AV_MEDIA', 'AV_MEDIA_1'],
      GAME_V2_11: ['TECH', 'TECH_3'],
      GAME_V2_12: ['TECH', 'TECH_1'],
      GAME_V2_13: ['KNOWLEDGE', 'KNOWLEDGE_1'],
      GAME_V2_14: ['AV_MEDIA', 'AV_MEDIA_3'],
      GAME_V2_15: ['PERSON', 'PERSON_2'],
      GAME_V2_16: ['PERSON', 'PERSON_1'],
      GAME_V2_17: ['PLACE', 'PLACE_2'],
      GAME_V2_18: ['ACTIVITY', 'ACTIVITY_4'],
      GAME_V2_19: ['EVENT', 'EVENT_3'],
      GAME_V2_20: ['NATURE_TIME', 'NATURE_TIME_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('GAME_V2_03')?.closing[0]?.text ?? '', /人間さんには/);
    for (const id of ['GAME_V2_06', 'GAME_V2_07', 'GAME_V2_08', 'GAME_V2_09']) {
      assert.match(byId(id)?.closing[0]?.text ?? '', /{word}/);
    }

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(game.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(game.id, question.id, `ゲームコンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('星降る図書室ゲーム');
    duplicateConversation.chooseCategory('GAME_MEDIA');
    duplicateConversation.chooseSubCategory('GAME_MEDIA_3');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '星降る図書室ゲーム');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'GAME_V2_01', '星降る図書室ゲーム')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '星降る図書室ゲーム').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    deepConversation.startWordTeaching();
    deepConversation.submit('星降る図書室ゲーム');
    deepConversation.chooseCategory('GAME_MEDIA');
    deepConversation.chooseSubCategory('GAME_MEDIA_3');
    deepConversation.choose('WORD_NEUTRAL');
    const rememberedGame = deepConversation.getWordEntries().find((word) => word.surface === '星降る図書室ゲーム');
    const deepAnswers = [
      ['GAME_DEEP_01', '操作に慣れるところが好きで、長いロードは苦手だった'],
      ['GAME_DEEP_02', '寄り道しながらマップを探索する遊び方'],
      ['GAME_DEEP_03', 'ボス戦が難しく、装備を見直して何度か挑戦した'],
      ['GAME_DEEP_04', '最後に仲間を助ける選択をしたこと'],
      ['GAME_DEEP_05', '友達の家で初めてコントローラーを持ったとき'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(deepConversation.submitPersonComboAnswer(rememberedGame.id, questionId, answer)?.ok, true);
      assert.equal(deepConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedGame.id), {
      slot1: { key: 'game_impression', value: deepAnswers[0][1] },
      slot2: { key: 'favorite_gameplay', value: deepAnswers[1][1] },
      slot3: { key: 'challenge_and_strategy', value: deepAnswers[2][1] },
      slot4: { key: 'memorable_play_experience', value: deepAnswers[3][1] },
      slot5: { key: 'first_play_memory', value: deepAnswers[4][1] },
    });

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('星降る図書室ゲーム');
    completionConversation.chooseCategory('GAME_MEDIA');
    completionConversation.chooseSubCategory('GAME_MEDIA_3');
    completionConversation.choose('WORD_NEUTRAL');
    const completeGame = completionConversation.getWordEntries().find((word) => word.surface === '星降る図書室ゲーム');
    for (const item of pool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeGame.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const item of deepPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeGame.id, item.id, `掘り下げ回答${item.id}`)?.ok, true);
    }
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeGame.id), false);
  });

  run('小説は20派生・5掘り下げを持ち、解釈・架空の場所・読書記憶を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('星降る図書室の物語');
    conversation.chooseCategory('GAME_MEDIA');
    conversation.chooseSubCategory('GAME_MEDIA_NOVEL');
    conversation.choose('WORD_NEUTRAL');
    const novel = conversation.getWordEntries().find((word) => word.surface === '星降る図書室の物語');
    assert.ok(novel);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === novel.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_NOVEL');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_NOVEL');
    assert.equal(pool.length, 20);
    assert.equal(deepPool.length, 5);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      NOVEL_V2_01: ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'],
      NOVEL_V2_02: ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'],
      NOVEL_V2_03: ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'],
      NOVEL_V2_04: ['PERSON', 'PERSON_AUTHOR_WRITER'],
      NOVEL_V2_05: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      NOVEL_V2_06: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      NOVEL_V2_07: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      NOVEL_V2_08: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      NOVEL_V2_09: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      NOVEL_V2_10: ['GAME_MEDIA', 'GAME_MEDIA_5'],
      NOVEL_V2_11: ['KNOWLEDGE', 'KNOWLEDGE_2'],
      NOVEL_V2_12: ['KNOWLEDGE', 'KNOWLEDGE_4'],
      NOVEL_V2_13: ['KNOWLEDGE', 'KNOWLEDGE_5'],
      NOVEL_V2_14: ['KNOWLEDGE', 'KNOWLEDGE_6'],
      NOVEL_V2_15: ['PERSON', 'PERSON_2'],
      NOVEL_V2_16: ['PERSON', 'PERSON_1'],
      NOVEL_V2_17: ['PLACE', 'PLACE_2'],
      NOVEL_V2_18: ['PLACE', 'PLACE_3'],
      NOVEL_V2_19: ['AV_MEDIA', 'AV_MEDIA_1'],
      NOVEL_V2_20: ['NATURE_TIME', 'NATURE_TIME_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('NOVEL_V2_09')?.closing[0]?.text ?? '', /架空の場所/);
    assert.match(byId('NOVEL_V2_10')?.closing[0]?.text ?? '', /人間さんには/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(novel.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(novel.id, question.id, `小説コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('星降る図書室の物語');
    duplicateConversation.chooseCategory('GAME_MEDIA');
    duplicateConversation.chooseSubCategory('GAME_MEDIA_NOVEL');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '星降る図書室の物語');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'NOVEL_V2_01', '星降る図書室の物語')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '星降る図書室の物語').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const spacedConversation = create(memory(), undefined, () => 0);
    prepare(spacedConversation);
    spacedConversation.startWordTeaching();
    spacedConversation.submit('遠い灯台の記録');
    spacedConversation.chooseCategory('GAME_MEDIA');
    spacedConversation.chooseSubCategory('GAME_MEDIA_NOVEL');
    spacedConversation.choose('WORD_NEUTRAL');
    const spacedNovel = spacedConversation.getWordEntries().find((word) => word.surface === '遠い灯台の記録');
    assert.equal(spacedConversation.submitPersonComboAnswer(spacedNovel.id, 'NOVEL_V2_02', '夏の庭の手紙')?.ok, true);
    const nextQuestion = spacedConversation.getNextPersonComboQuestion(spacedNovel.id);
    assert.ok(nextQuestion);
    assert.notEqual(nextQuestion.id, 'NOVEL_V2_19');

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    deepConversation.startWordTeaching();
    deepConversation.submit('星降る図書室の物語');
    deepConversation.chooseCategory('GAME_MEDIA');
    deepConversation.chooseSubCategory('GAME_MEDIA_NOVEL');
    deepConversation.choose('WORD_NEUTRAL');
    const rememberedNovel = deepConversation.getWordEntries().find((word) => word.surface === '星降る図書室の物語');
    const deepAnswers = [
      ['NOVEL_DEEP_01', '好きなのは静かな語り口で、結末は少し納得できなかった'],
      ['NOVEL_DEEP_02', '夕暮れの港を光と音で描いた一節'],
      ['NOVEL_DEEP_03', '主人公の迷いには共感したが、友人への態度には共感できなかった'],
      ['NOVEL_DEEP_04', '結末は希望とも別れとも受け取れると思った'],
      ['NOVEL_DEEP_05', '図書館で表紙を見かけて手に取った'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(deepConversation.submitPersonComboAnswer(rememberedNovel.id, questionId, answer)?.ok, true);
      assert.equal(deepConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedNovel.id), {
      slot1: { key: 'novel_impression', value: deepAnswers[0][1] },
      slot2: { key: 'prose_impression', value: deepAnswers[1][1] },
      slot3: { key: 'character_interpretation', value: deepAnswers[2][1] },
      slot4: { key: 'plot_interpretation', value: deepAnswers[3][1] },
      slot5: { key: 'reading_memory', value: deepAnswers[4][1] },
    });

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('星降る図書室の物語');
    completionConversation.chooseCategory('GAME_MEDIA');
    completionConversation.chooseSubCategory('GAME_MEDIA_NOVEL');
    completionConversation.choose('WORD_NEUTRAL');
    const completeNovel = completionConversation.getWordEntries().find((word) => word.surface === '星降る図書室の物語');
    for (const item of pool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeNovel.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const item of deepPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeNovel.id, item.id, `掘り下げ回答${item.id}`)?.ok, true);
    }
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeNovel.id), false);
  });

  run('キャラクターは20派生・5掘り下げを持ち、作品要素と本人の解釈を分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('星の旅人');
    conversation.chooseCategory('GAME_MEDIA');
    conversation.chooseSubCategory('GAME_MEDIA_4');
    conversation.choose('WORD_NEUTRAL');
    const character = conversation.getWordEntries().find((word) => word.surface === '星の旅人');
    assert.ok(character);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === character.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_4');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_4');
    assert.equal(pool.length, 20);
    assert.equal(deepPool.length, 5);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      CHARACTER_V2_01: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      CHARACTER_V2_02: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      CHARACTER_V2_03: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      CHARACTER_V2_04: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      CHARACTER_V2_05: ['GAME_MEDIA', 'GAME_MEDIA_5'],
      CHARACTER_V2_06: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      CHARACTER_V2_07: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      CHARACTER_V2_08: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      CHARACTER_V2_09: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      CHARACTER_V2_10: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      CHARACTER_V2_11: ['EMOTION', 'EMOTION_6'],
      CHARACTER_V2_12: ['EMOTION', 'EMOTION_6'],
      CHARACTER_V2_13: ['FOOD', 'FOOD_1'],
      CHARACTER_V2_14: ['PERSON', 'PERSON_ENTERTAINER'],
      CHARACTER_V2_15: ['AV_MEDIA', 'AV_MEDIA_1'],
      CHARACTER_V2_16: ['PERSON', 'PERSON_2'],
      CHARACTER_V2_17: ['PERSON', 'PERSON_1'],
      CHARACTER_V2_18: ['ACTIVITY', 'ACTIVITY_4'],
      CHARACTER_V2_19: ['ACTIVITY', 'ACTIVITY_1'],
      CHARACTER_V2_20: ['PLACE', 'PLACE_2'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('CHARACTER_V2_02')?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(byId('CHARACTER_V2_10')?.closing[0]?.text ?? '', /作中の架空の場所/);
    for (const id of ['CHARACTER_V2_11', 'CHARACTER_V2_12']) {
      assert.match(byId(id)?.closing[0]?.text ?? '', /人間さんには/);
    }

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(character.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(character.id, question.id, `人物コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('星の旅人');
    duplicateConversation.chooseCategory('GAME_MEDIA');
    duplicateConversation.chooseSubCategory('GAME_MEDIA_4');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '星の旅人');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'CHARACTER_V2_01', '星の旅人')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '星の旅人').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    deepConversation.startWordTeaching();
    deepConversation.submit('星の旅人');
    deepConversation.chooseCategory('GAME_MEDIA');
    deepConversation.chooseSubCategory('GAME_MEDIA_4');
    deepConversation.choose('WORD_NEUTRAL');
    const rememberedCharacter = deepConversation.getWordEntries().find((word) => word.surface === '星の旅人');
    const deepAnswers = [
      ['CHARACTER_DEEP_01', '勇敢なところが好きだが、無鉄砲なところは苦手だった'],
      ['CHARACTER_DEEP_02', '仲間を助けた行動には納得したが、理由を隠したことは疑問だった'],
      ['CHARACTER_DEEP_03', '序盤は一人で抱え込んでいたが、後半に仲間へ頼るようになったところ'],
      ['CHARACTER_DEEP_04', 'ライバルと何度も助け合う関係になっていったこと'],
      ['CHARACTER_DEEP_05', '自分も慎重なところは似ているが、決断の速さは違うと思う'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(deepConversation.submitPersonComboAnswer(rememberedCharacter.id, questionId, answer)?.ok, true);
      assert.equal(deepConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedCharacter.id), {
      slot1: { key: 'character_impression', value: deepAnswers[0][1] },
      slot2: { key: 'action_interpretation', value: deepAnswers[1][1] },
      slot3: { key: 'character_growth', value: deepAnswers[2][1] },
      slot4: { key: 'relationship_interpretation', value: deepAnswers[3][1] },
      slot5: { key: 'self_comparison', value: deepAnswers[4][1] },
    });

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('星の旅人');
    completionConversation.chooseCategory('GAME_MEDIA');
    completionConversation.chooseSubCategory('GAME_MEDIA_4');
    completionConversation.choose('WORD_NEUTRAL');
    const completeCharacter = completionConversation.getWordEntries().find((word) => word.surface === '星の旅人');
    for (const item of pool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeCharacter.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const item of deepPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeCharacter.id, item.id, `掘り下げ回答${item.id}`)?.ok, true);
    }
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeCharacter.id), false);
  });

  run('作品・シリーズは20派生・5掘り下げを持ち、シリーズと個別作品を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('銀河の守り手シリーズ');
    conversation.chooseCategory('GAME_MEDIA');
    conversation.chooseSubCategory('GAME_MEDIA_5');
    conversation.choose('WORD_NEUTRAL');
    const series = conversation.getWordEntries().find((word) => word.surface === '銀河の守り手シリーズ');
    assert.ok(series);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === series.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_5');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_5');
    assert.equal(pool.length, 20);
    assert.equal(deepPool.length, 5);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      SERIES_V2_01: ['GAME_MEDIA', 'GAME_MEDIA_5'],
      SERIES_V2_02: ['GAME_MEDIA', 'GAME_MEDIA_5'],
      SERIES_V2_03: ['GAME_MEDIA', 'GAME_MEDIA_1'],
      SERIES_V2_04: ['GAME_MEDIA', 'GAME_MEDIA_2'],
      SERIES_V2_05: ['GAME_MEDIA', 'GAME_MEDIA_3'],
      SERIES_V2_06: ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'],
      SERIES_V2_07: ['AV_MEDIA', 'AV_MEDIA_2'],
      SERIES_V2_08: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      SERIES_V2_09: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      SERIES_V2_10: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      SERIES_V2_11: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      SERIES_V2_12: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      SERIES_V2_13: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      SERIES_V2_14: ['AV_MEDIA', 'AV_MEDIA_1'],
      SERIES_V2_15: ['PERSON', 'PERSON_ENTERTAINER'],
      SERIES_V2_16: ['PERSON', 'PERSON_2'],
      SERIES_V2_17: ['PERSON', 'PERSON_1'],
      SERIES_V2_18: ['ACTIVITY', 'ACTIVITY_4'],
      SERIES_V2_19: ['PLACE', 'PLACE_2'],
      SERIES_V2_20: ['EVENT', 'EVENT_3'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('SERIES_V2_02')?.closing[0]?.text ?? '', /人間さんには/);
    for (const id of ['SERIES_V2_10', 'SERIES_V2_11', 'SERIES_V2_12', 'SERIES_V2_13']) {
      assert.match(byId(id)?.closing[0]?.text ?? '', /{word}シリーズ/);
    }

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(series.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(series.id, question.id, `シリーズコンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('銀河の守り手シリーズ');
    duplicateConversation.chooseCategory('GAME_MEDIA');
    duplicateConversation.chooseSubCategory('GAME_MEDIA_5');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '銀河の守り手シリーズ');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'SERIES_V2_01', '銀河の守り手シリーズ')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '銀河の守り手シリーズ').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const skipConversation = create(memory(), undefined, () => 0.5);
    prepare(skipConversation);
    skipConversation.startWordTeaching();
    skipConversation.submit('銀河の守り手シリーズ');
    skipConversation.chooseCategory('GAME_MEDIA');
    skipConversation.chooseSubCategory('GAME_MEDIA_5');
    skipConversation.choose('WORD_NEUTRAL');
    const skipParent = skipConversation.getWordEntries().find((word) => word.surface === '銀河の守り手シリーズ');
    assert.equal(skipConversation.skipPersonComboQuestion(skipParent.id, 'SERIES_V2_06'), true);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    deepConversation.startWordTeaching();
    deepConversation.submit('銀河の守り手シリーズ');
    deepConversation.chooseCategory('GAME_MEDIA');
    deepConversation.chooseSubCategory('GAME_MEDIA_5');
    deepConversation.choose('WORD_NEUTRAL');
    const rememberedSeries = deepConversation.getWordEntries().find((word) => word.surface === '銀河の守り手シリーズ');
    const deepAnswers = [
      ['SERIES_DEEP_01', '世界観は好きだが、作品によって説明が長いところは少し苦手'],
      ['SERIES_DEEP_02', '初期三部作が好き。登場人物の関係が少しずつ変わるところがよかった'],
      ['SERIES_DEEP_03', '同じ場所でも時代によって意味が変わる設定が面白い'],
      ['SERIES_DEEP_04', '映像は見やすくなったと思う一方、以前の雰囲気が懐かしいとも感じる'],
      ['SERIES_DEEP_05', '子どものころ友人に教えてもらい、後から小説や映画も楽しんだ'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(deepConversation.submitPersonComboAnswer(rememberedSeries.id, questionId, answer)?.ok, true);
      assert.equal(deepConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedSeries.id), {
      slot1: { key: 'series_impression', value: deepAnswers[0][1] },
      slot2: { key: 'favorite_era_or_work', value: deepAnswers[1][1] },
      slot3: { key: 'worldbuilding_impression', value: deepAnswers[2][1] },
      slot4: { key: 'series_evolution', value: deepAnswers[3][1] },
      slot5: { key: 'series_history', value: deepAnswers[4][1] },
    });

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('銀河の守り手シリーズ');
    completionConversation.chooseCategory('GAME_MEDIA');
    completionConversation.chooseSubCategory('GAME_MEDIA_5');
    completionConversation.choose('WORD_NEUTRAL');
    const completeSeries = completionConversation.getWordEntries().find((word) => word.surface === '銀河の守り手シリーズ');
    for (const item of pool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeSeries.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const item of deepPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeSeries.id, item.id, `掘り下げ回答${item.id}`)?.ok, true);
    }
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeSeries.id), false);
  });

  run('作中のもの・用語は20派生・5掘り下げを持ち、用語種別と解釈を扱う', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('転移魔法');
    conversation.chooseCategory('GAME_MEDIA');
    conversation.chooseSubCategory('GAME_MEDIA_6');
    conversation.choose('WORD_NEUTRAL');
    const term = conversation.getWordEntries().find((word) => word.surface === '転移魔法');
    assert.ok(term);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === term.id));
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_6');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_6');
    assert.equal(pool.length, 20);
    assert.equal(deepPool.length, 5);
    const byId = (id) => pool.find((item) => item.id === id);
    const expectedClassifications = {
      TERM_V2_01: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      TERM_V2_02: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      TERM_V2_03: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      TERM_V2_04: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      TERM_V2_05: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      TERM_V2_06: ['GAME_MEDIA', 'GAME_MEDIA_6'],
      TERM_V2_07: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      TERM_V2_08: ['GAME_MEDIA', 'GAME_MEDIA_4'],
      TERM_V2_09: ['GAME_MEDIA', 'GAME_MEDIA_5'],
      TERM_V2_10: ['GAME_MEDIA', 'GAME_MEDIA_1'],
      TERM_V2_11: ['GAME_MEDIA', 'GAME_MEDIA_2'],
      TERM_V2_12: ['GAME_MEDIA', 'GAME_MEDIA_3'],
      TERM_V2_13: ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'],
      TERM_V2_14: ['AV_MEDIA', 'AV_MEDIA_1'],
      TERM_V2_15: ['PERSON', 'PERSON_2'],
      TERM_V2_16: ['ACTIVITY', 'ACTIVITY_1'],
      TERM_V2_17: ['ACTIVITY', 'ACTIVITY_4'],
      TERM_V2_18: ['EVENT', 'EVENT_3'],
      TERM_V2_19: ['KNOWLEDGE', 'KNOWLEDGE_3'],
      TERM_V2_20: ['EMOTION', 'EMOTION_6'],
    };
    for (const [id, [category, subcategory]] of Object.entries(expectedClassifications)) {
      assert.deepEqual(byId(id)?.classification, { mode: 'fixed', category, subcategory });
    }
    assert.match(byId('TERM_V2_02')?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(byId('TERM_V2_03')?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(byId('TERM_V2_10')?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(byId('TERM_V2_13')?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(byId('TERM_V2_19')?.closing[0]?.text ?? '', /人間さんは/);
    assert.match(byId('TERM_V2_20')?.closing[0]?.text ?? '', /人間さんは/);

    const prioritized = conversation.getNextPersonComboQuestion(term.id);
    assert.equal(prioritized?.id, 'TERM_V2_02');

    const quoteConversation = create(memory(), undefined, () => 0);
    prepare(quoteConversation);
    quoteConversation.startWordTeaching();
    quoteConversation.submit('旅立ちの名セリフ');
    quoteConversation.chooseCategory('GAME_MEDIA');
    quoteConversation.chooseSubCategory('GAME_MEDIA_6');
    quoteConversation.choose('WORD_NEUTRAL');
    const quoteTerm = quoteConversation.getWordEntries().find((word) => word.surface === '旅立ちの名セリフ');
    assert.equal(quoteConversation.getNextPersonComboQuestion(quoteTerm.id)?.id, 'TERM_V2_07');

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(term.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(term.id, question.id, `用語コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('転移魔法');
    duplicateConversation.chooseCategory('GAME_MEDIA');
    duplicateConversation.chooseSubCategory('GAME_MEDIA_6');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '転移魔法');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'TERM_V2_01', '転移魔法')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '転移魔法').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const skipConversation = create(memory(), undefined, () => 0.5);
    prepare(skipConversation);
    skipConversation.startWordTeaching();
    skipConversation.submit('転移魔法');
    skipConversation.chooseCategory('GAME_MEDIA');
    skipConversation.chooseSubCategory('GAME_MEDIA_6');
    skipConversation.choose('WORD_NEUTRAL');
    const skipParent = skipConversation.getWordEntries().find((word) => word.surface === '転移魔法');
    assert.equal(skipConversation.skipPersonComboQuestion(skipParent.id, 'TERM_V2_04'), true);

    const deepConversation = create(memory(), undefined, () => 0.5);
    prepare(deepConversation);
    deepConversation.startWordTeaching();
    deepConversation.submit('転移魔法');
    deepConversation.chooseCategory('GAME_MEDIA');
    deepConversation.chooseSubCategory('GAME_MEDIA_6');
    deepConversation.choose('WORD_NEUTRAL');
    const rememberedTerm = deepConversation.getWordEntries().find((word) => word.surface === '転移魔法');
    const deepAnswers = [
      ['TERM_DEEP_01', 'どこへでも移動できる自由さが好きだが、制限が曖昧なところは気になる'],
      ['TERM_DEEP_02', '登場人物同士を離れた場所から合流させる役割だと思う'],
      ['TERM_DEEP_03', '失敗して別の場所に着いた場面が印象に残った'],
      ['TERM_DEEP_04', '初めて知ったとき、便利そうだけれど危なそうとも思った'],
      ['TERM_DEEP_05', '友人とその魔法の使い道を想像して話した思い出'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(deepConversation.submitPersonComboAnswer(rememberedTerm.id, questionId, answer)?.ok, true);
      assert.equal(deepConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(deepConversation.getPersonWordDeepDive(rememberedTerm.id), {
      slot1: { key: 'term_impression', value: deepAnswers[0][1] },
      slot2: { key: 'story_role_interpretation', value: deepAnswers[1][1] },
      slot3: { key: 'memorable_scene', value: deepAnswers[2][1] },
      slot4: { key: 'first_impression', value: deepAnswers[3][1] },
      slot5: { key: 'personal_memory', value: deepAnswers[4][1] },
    });

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('転移魔法');
    completionConversation.chooseCategory('GAME_MEDIA');
    completionConversation.chooseSubCategory('GAME_MEDIA_6');
    completionConversation.choose('WORD_NEUTRAL');
    const completeTerm = completionConversation.getWordEntries().find((word) => word.surface === '転移魔法');
    for (const item of pool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeTerm.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const item of deepPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeTerm.id, item.id, `掘り下げ回答${item.id}`)?.ok, true);
    }
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeTerm.id), false);
  });

  run('漫画・アニメ・ゲーム・小説のその他は20派生・5掘り下げを保存し25問後に除外する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('二次創作');
    conversation.chooseCategory('GAME_MEDIA');
    conversation.chooseSubCategory('GAME_MEDIA_7');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '二次創作');
    assert.ok(parent);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id));

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_7');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'GAME_MEDIA_7');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedClassifications = [
      ['GAME_MEDIA', 'GAME_MEDIA_7'], ['GAME_MEDIA', 'GAME_MEDIA_7'],
      ['GAME_MEDIA', 'GAME_MEDIA_5'], ['GAME_MEDIA', 'GAME_MEDIA_4'],
      ['GAME_MEDIA', 'GAME_MEDIA_6'], ['GAME_MEDIA', 'GAME_MEDIA_1'],
      ['GAME_MEDIA', 'GAME_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ['ACTIVITY', 'ACTIVITY_3'], ['ACTIVITY', 'ACTIVITY_4'],
      ['OBJECT', 'OBJECT_6'], ['TECH', 'TECH_5'], ['TECH', 'TECH_6'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['PERSON', 'PERSON_2'], ['EVENT', 'EVENT_3'],
      ['PLACE', 'PLACE_3'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    assert.deepEqual(
      derivedPool.map((item) => item.classification).map(({ category, subcategory }) => [category, subcategory]),
      expectedClassifications,
    );
    assert.match(derivedPool[1]?.closing[0]?.text ?? '', /人間さんには/);

    const firstSix = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `ファン活動の回答${index + 1}`)?.ok, true, `初回質問 ${question.id}`);
      firstSix.push(question);
    }
    assert.equal(firstSix.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(firstSix.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('二次創作');
    completionConversation.chooseCategory('GAME_MEDIA');
    completionConversation.chooseSubCategory('GAME_MEDIA_7');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '二次創作');
    const deepAnswers = [
      ['GAME_MEDIA_OTHER_DEEP_01', '創作の自由さは好きだが、交流の雰囲気は合わないこともある'],
      ['GAME_MEDIA_OTHER_DEEP_02', '作品について調べていてファン考察を知った'],
      ['GAME_MEDIA_OTHER_DEEP_03', '原作の設定と自分の解釈が混ざらないようにメモを分けた'],
      ['GAME_MEDIA_OTHER_DEEP_04', '好きな作品の違う解釈を友人と話した'],
      ['GAME_MEDIA_OTHER_DEEP_05', '登場人物の背景を知って作品の見方が少し広がった'],
    ];
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生回答${item.id}`)?.ok, true, `派生 ${item.id}`);
    }
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, `掘り下げ ${questionId}`);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'fan_activity_impression', value: deepAnswers[0][1] },
      slot2: { key: 'discovery_memory', value: deepAnswers[1][1] },
      slot3: { key: 'personal_ideas', value: deepAnswers[2][1] },
      slot4: { key: 'fan_interaction_memory', value: deepAnswers[3][1] },
      slot5: { key: 'personal_impact', value: deepAnswers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('音楽は20派生・5掘り下げを関連づけ、時期の質問を連続させず25問後に除外する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('夜明けの歌');
    conversation.chooseCategory('AV_MEDIA');
    conversation.chooseSubCategory('AV_MEDIA_1');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '夜明けの歌');
    assert.ok(parent);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id));

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_1');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_1');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedClassifications = [
      ['AV_MEDIA', 'AV_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ['AV_MEDIA', 'AV_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_1'], ['PERSON', 'PERSON_ENTERTAINER'],
      ['OBJECT', 'OBJECT_5'], ['PERSON', 'PERSON_ENTERTAINER'], ['GAME_MEDIA', 'GAME_MEDIA_2'],
      ['GAME_MEDIA', 'GAME_MEDIA_3'], ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_6'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['EVENT', 'EVENT_3'],
      ['PLACE', 'PLACE_3'], ['NATURE_TIME', 'NATURE_TIME_3'], ['TECH', 'TECH_4'],
      ['TECH', 'TECH_5'], ['NATURE_TIME', 'NATURE_TIME_2'],
    ];
    assert.deepEqual(
      derivedPool.map((item) => item.classification).map(({ category, subcategory }) => [category, subcategory]),
      expectedClassifications,
    );
    assert.match(derivedPool[2]?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(derivedPool[3]?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(derivedPool[1]?.closing[0]?.text ?? '', /同じころ/);

    const firstSix = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `音楽コンボ回答${index + 1}`)?.ok, true);
      firstSix.push(question);
    }
    assert.equal(firstSix.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(firstSix.filter((question) => question.kind === 'deepDive').length, 2);

    const spacingConversation = create(memory(), undefined, () => 0);
    prepare(spacingConversation);
    spacingConversation.startWordTeaching();
    spacingConversation.submit('夜明けの歌');
    spacingConversation.chooseCategory('AV_MEDIA');
    spacingConversation.chooseSubCategory('AV_MEDIA_1');
    spacingConversation.choose('WORD_NEUTRAL');
    const spacingParent = spacingConversation.getWordEntries().find((word) => word.surface === '夜明けの歌');
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'MUSIC_V2_09', '青空の冒険')?.ok, true);
    const afterPeriodMemory = spacingConversation.getNextPersonComboQuestion(spacingParent.id);
    assert.ok(afterPeriodMemory);
    assert.equal(['MUSIC_V2_02', 'MUSIC_V2_09', 'MUSIC_V2_10'].includes(afterPeriodMemory.id), false);

    const skipConversation = create(memory(), undefined, () => 0);
    prepare(skipConversation);
    skipConversation.startWordTeaching();
    skipConversation.submit('歌詞のない曲');
    skipConversation.chooseCategory('AV_MEDIA');
    skipConversation.chooseSubCategory('AV_MEDIA_1');
    skipConversation.choose('WORD_NEUTRAL');
    const skipParent = skipConversation.getWordEntries().find((word) => word.surface === '歌詞のない曲');
    assert.equal(skipConversation.skipPersonComboQuestion(skipParent.id, 'MUSIC_DEEP_03'), true);
    assert.equal(skipConversation.skipPersonComboQuestion(skipParent.id, 'MUSIC_V2_06'), true);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('夜明けの歌');
    completionConversation.chooseCategory('AV_MEDIA');
    completionConversation.chooseSubCategory('AV_MEDIA_1');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '夜明けの歌');
    const deepAnswers = [
      ['MUSIC_DEEP_01', '静かな始まりから盛り上がる展開が印象に残った'],
      ['MUSIC_DEEP_02', '最後のサビで重なるコーラスが心に残った'],
      ['MUSIC_DEEP_03', '「明日へ進む」という歌詞が好きで、励まされる感じがした'],
      ['MUSIC_DEEP_04', '友人のすすめで帰り道に初めて聴いた'],
      ['MUSIC_DEEP_05', '聴くと昔の通学路や友人との会話を思い出す'],
    ];
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'music_impression', value: deepAnswers[0][1] },
      slot2: { key: 'sound_impression', value: deepAnswers[1][1] },
      slot3: { key: 'lyrics_interpretation', value: deepAnswers[2][1] },
      slot4: { key: 'first_listening_memory', value: deepAnswers[3][1] },
      slot5: { key: 'personal_music_memory', value: deepAnswers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('映画は20派生・5掘り下げを演出別に保存し25問後にコンボ対象から外れる', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('星降る町');
    conversation.chooseCategory('AV_MEDIA');
    conversation.chooseSubCategory('AV_MEDIA_2');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '星降る町');
    assert.ok(parent);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id));

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_2');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_2');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedClassifications = [
      ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_2'],
      ['AV_MEDIA', 'AV_MEDIA_2'], ['PERSON', 'PERSON_OTHER'], ['PERSON', 'PERSON_ENTERTAINER'],
      ['GAME_MEDIA', 'GAME_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_6'],
      ['GAME_MEDIA', 'GAME_MEDIA_6'], ['AV_MEDIA', 'AV_MEDIA_1'], ['PERSON', 'PERSON_ENTERTAINER'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['PLACE', 'PLACE_3'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    assert.deepEqual(
      derivedPool.map((item) => item.classification).map(({ category, subcategory }) => [category, subcategory]),
      expectedClassifications,
    );
    assert.match(derivedPool[2]?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(derivedPool[7]?.closing[0]?.text ?? '', /人間さんには/);

    const firstSix = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `映画コンボ回答${index + 1}`)?.ok, true);
      firstSix.push(question);
    }
    assert.equal(firstSix.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(firstSix.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('星降る町');
    duplicateConversation.chooseCategory('AV_MEDIA');
    duplicateConversation.chooseSubCategory('AV_MEDIA_2');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '星降る町');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'MOVIE_V2_01', '星降る町')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '星降る町').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const spacingConversation = create(memory(), undefined, () => 0);
    prepare(spacingConversation);
    spacingConversation.startWordTeaching();
    spacingConversation.submit('星降る町');
    spacingConversation.chooseCategory('AV_MEDIA');
    spacingConversation.chooseSubCategory('AV_MEDIA_2');
    spacingConversation.choose('WORD_NEUTRAL');
    const spacingParent = spacingConversation.getWordEntries().find((word) => word.surface === '星降る町');
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'MOVIE_V2_02', '青い夜の映画')?.ok, true);
    assert.notEqual(spacingConversation.getNextPersonComboQuestion(spacingParent.id)?.id, 'MOVIE_V2_02');

    const skipConversation = create(memory(), undefined, () => 0);
    prepare(skipConversation);
    skipConversation.startWordTeaching();
    skipConversation.submit('劇場では見ていない映画');
    skipConversation.chooseCategory('AV_MEDIA');
    skipConversation.chooseSubCategory('AV_MEDIA_2');
    skipConversation.choose('WORD_NEUTRAL');
    const skipParent = skipConversation.getWordEntries().find((word) => word.surface === '劇場では見ていない映画');
    assert.equal(skipConversation.skipPersonComboQuestion(skipParent.id, 'MOVIE_V2_18'), true);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('星降る町');
    completionConversation.chooseCategory('AV_MEDIA');
    completionConversation.chooseSubCategory('AV_MEDIA_2');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '星降る町');
    const deepAnswers = [
      ['MOVIE_DEEP_01', '登場人物の関係は好きだが、終盤の説明には納得できない部分があった'],
      ['MOVIE_DEEP_02', '高い位置から街を見下ろす長回しが印象的だった'],
      ['MOVIE_DEEP_03', '静かな場面の間と、遠くで鳴る音が心に残った'],
      ['MOVIE_DEEP_04', '最後の場面で主人公が戻る選択をしたことに驚き、少し寂しく感じた'],
      ['MOVIE_DEEP_05', '友人と映画館へ行った日に初めて見た'],
    ];
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'movie_impression', value: deepAnswers[0][1] },
      slot2: { key: 'visual_direction', value: deepAnswers[1][1] },
      slot3: { key: 'editing_and_sound', value: deepAnswers[2][1] },
      slot4: { key: 'story_interpretation', value: deepAnswers[3][1] },
      slot5: { key: 'first_watch_memory', value: deepAnswers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('ドラマ・テレビは20派生・5掘り下げを区別して保存し、同時期の記憶を連続させない', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('夜明けの交番');
    conversation.chooseCategory('AV_MEDIA');
    conversation.chooseSubCategory('AV_MEDIA_3');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '夜明けの交番');
    assert.ok(parent);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id));

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_3');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_3');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedClassifications = [
      ['AV_MEDIA', 'AV_MEDIA_3'], ['AV_MEDIA', 'AV_MEDIA_3'], ['AV_MEDIA', 'AV_MEDIA_3'], ['AV_MEDIA', 'AV_MEDIA_3'],
      ['PERSON', 'PERSON_ENTERTAINER'], ['GAME_MEDIA', 'GAME_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_4'],
      ['GAME_MEDIA', 'GAME_MEDIA_6'], ['GAME_MEDIA', 'GAME_MEDIA_6'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ['WORK', 'WORK_1'], ['PLACE', 'PLACE_5'], ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_4'],
      ['AV_MEDIA', 'AV_MEDIA_2'], ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['PLACE', 'PLACE_1'],
      ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    assert.deepEqual(
      derivedPool.map((item) => item.classification).map(({ category, subcategory }) => [category, subcategory]),
      expectedClassifications,
    );
    assert.match(derivedPool[2]?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(derivedPool[11]?.opening[0]?.text ?? '', /実在/);
    assert.match(derivedPool[8]?.closing[0]?.text ?? '', /用語/);
    assert.match(deepPool.find((item) => item.id === 'DRAMA_DEEP_04')?.opening[1]?.text ?? '', /リアルタイム、録画、配信/);

    const firstSix = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `ドラマコンボ回答${index + 1}`)?.ok, true);
      firstSix.push(question);
    }
    assert.equal(firstSix.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(firstSix.filter((question) => question.kind === 'deepDive').length, 2);

    const spacingConversation = create(memory(), undefined, () => 0);
    prepare(spacingConversation);
    spacingConversation.startWordTeaching();
    spacingConversation.submit('夜明けの交番');
    spacingConversation.chooseCategory('AV_MEDIA');
    spacingConversation.chooseSubCategory('AV_MEDIA_3');
    spacingConversation.choose('WORD_NEUTRAL');
    const spacingParent = spacingConversation.getWordEntries().find((word) => word.surface === '夜明けの交番');
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'DRAMA_V2_02', '雨音刑事')?.ok, true);
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'DRAMA_V2_01', '港町日記')?.ok, true);
    assert.equal(spacingConversation.getNextPersonComboQuestion(spacingParent.id)?.kind, 'deepDive');
    assert.notEqual(spacingConversation.getNextPersonComboQuestion(spacingParent.id)?.id, 'DRAMA_DEEP_04');
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'DRAMA_DEEP_04', '録画を週末にまとめて見ていた')?.ok, true);
    const nextAfterRoutine = spacingConversation.getNextPersonComboQuestion(spacingParent.id);
    assert.equal(nextAfterRoutine?.kind, 'derived');
    assert.notEqual(nextAfterRoutine?.id, 'DRAMA_V2_02');
    assert.notEqual(nextAfterRoutine?.id, 'DRAMA_V2_15');

    const skipConversation = create(memory(), undefined, () => 0);
    prepare(skipConversation);
    skipConversation.startWordTeaching();
    skipConversation.submit('未視聴のドラマ');
    skipConversation.chooseCategory('AV_MEDIA');
    skipConversation.chooseSubCategory('AV_MEDIA_3');
    skipConversation.choose('WORD_NEUTRAL');
    const skipParent = skipConversation.getWordEntries().find((word) => word.surface === '未視聴のドラマ');
    assert.equal(skipConversation.skipPersonComboQuestion(skipParent.id, 'DRAMA_DEEP_05'), true);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('夜明けの交番');
    completionConversation.chooseCategory('AV_MEDIA');
    completionConversation.chooseSubCategory('AV_MEDIA_3');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '夜明けの交番');
    const deepAnswers = [
      ['DRAMA_DEEP_01', '登場人物は好きだが、一部の展開は少し苦手だった'],
      ['DRAMA_DEEP_02', '雨の中で二人が真相に気づく回が印象に残った'],
      ['DRAMA_DEEP_03', '最初は反発していた二人が、少しずつ協力するようになったところ'],
      ['DRAMA_DEEP_04', '放送日に見られないときは録画して、週末に見ていた'],
      ['DRAMA_DEEP_05', '最後まで見て、主人公が町に残る結末を静かに受け止めた'],
    ];
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'drama_impression', value: deepAnswers[0][1] },
      slot2: { key: 'memorable_episode', value: deepAnswers[1][1] },
      slot3: { key: 'character_development', value: deepAnswers[2][1] },
      slot4: { key: 'viewing_routine', value: deepAnswers[3][1] },
      slot5: { key: 'finale_interpretation', value: deepAnswers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('動画は20派生・5掘り下げを区別して保存し、情報と実行した行動を混同しない', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('木工の引き出し修理動画');
    conversation.chooseCategory('AV_MEDIA');
    conversation.chooseSubCategory('AV_MEDIA_4');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '木工の引き出し修理動画');
    assert.ok(parent);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id));

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_4');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_4');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedClassifications = [
      ['AV_MEDIA', 'AV_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_4'],
      ['AV_MEDIA', 'AV_MEDIA_5'], ['AV_MEDIA', 'AV_MEDIA_5'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ['ANIMAL', 'ANIMAL_1'], ['FOOD', 'FOOD_1'], ['PLACE', 'PLACE_5'], ['WORK', 'WORK_1'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_4'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['AV_MEDIA', 'AV_MEDIA_1'], ['ACTIVITY', 'ACTIVITY_3'],
      ['OBJECT', 'OBJECT_6'], ['TECH', 'TECH_5'], ['PERSON', 'PERSON_2'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    assert.deepEqual(
      derivedPool.map((item) => item.classification).map(({ category, subcategory }) => [category, subcategory]),
      expectedClassifications,
    );
    assert.match(derivedPool[2]?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(derivedPool[3]?.opening[0]?.text ?? '', /投稿した人やチャンネル/);
    assert.match(derivedPool[7]?.closing[0]?.text ?? '', /食べてみたいと思った/);
    assert.match(derivedPool[15]?.opening[0]?.text ?? '', /試した創作/);
    assert.match(deepPool[4]?.closing[0]?.text ?? '', /実際に調べたり試したり/);

    const firstSix = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `動画コンボ回答${index + 1}`)?.ok, true);
      firstSix.push(question);
    }
    assert.equal(firstSix.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(firstSix.filter((question) => question.kind === 'deepDive').length, 2);

    const spacingConversation = create(memory(), undefined, () => 0);
    prepare(spacingConversation);
    spacingConversation.startWordTeaching();
    spacingConversation.submit('木工の引き出し修理動画');
    spacingConversation.chooseCategory('AV_MEDIA');
    spacingConversation.chooseSubCategory('AV_MEDIA_4');
    spacingConversation.choose('WORD_NEUTRAL');
    const spacingParent = spacingConversation.getWordEntries().find((word) => word.surface === '木工の引き出し修理動画');
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'VIDEO_V2_02', '小さな工房の日々')?.ok, true);
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'VIDEO_V2_01', '木の椅子を直す記録')?.ok, true);
    assert.notEqual(spacingConversation.getNextPersonComboQuestion(spacingParent.id)?.id, 'VIDEO_V2_02');

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('木工の引き出し修理動画');
    duplicateConversation.chooseCategory('AV_MEDIA');
    duplicateConversation.chooseSubCategory('AV_MEDIA_4');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '木工の引き出し修理動画');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'VIDEO_V2_01', '木工の引き出し修理動画')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '木工の引き出し修理動画').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const skipConversation = create(memory(), undefined, () => 0);
    prepare(skipConversation);
    skipConversation.startWordTeaching();
    skipConversation.submit('動物が出てこない解説動画');
    skipConversation.chooseCategory('AV_MEDIA');
    skipConversation.chooseSubCategory('AV_MEDIA_4');
    skipConversation.choose('WORD_NEUTRAL');
    const skipParent = skipConversation.getWordEntries().find((word) => word.surface === '動物が出てこない解説動画');
    assert.equal(skipConversation.skipPersonComboQuestion(skipParent.id, 'VIDEO_V2_07'), true);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('木工の引き出し修理動画');
    completionConversation.chooseCategory('AV_MEDIA');
    completionConversation.chooseSubCategory('AV_MEDIA_4');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '木工の引き出し修理動画');
    const deepAnswers = [
      ['VIDEO_DEEP_01', '手順が分かりやすかったが、途中の長い広告は合わなかった'],
      ['VIDEO_DEEP_02', '家具の修理方法を探していて、おすすめに出てきた'],
      ['VIDEO_DEEP_03', '割れた引き出しの底板を外して交換する場面を覚えている'],
      ['VIDEO_DEEP_04', '木材の反りについて初めて知り、湿度との関係が気になった'],
      ['VIDEO_DEEP_05', '別の解説も調べ、家にあった端材で小さな棚を試作した'],
    ];
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'video_impression', value: deepAnswers[0][1] },
      slot2: { key: 'watching_motivation', value: deepAnswers[1][1] },
      slot3: { key: 'memorable_content', value: deepAnswers[2][1] },
      slot4: { key: 'learning_and_doubts', value: deepAnswers[3][1] },
      slot5: { key: 'post_viewing_actions', value: deepAnswers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('配信・配信者はチャンネルと人物を分け、視聴形態や交流を断定せず25問後に除外する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('夜ふかしゲーム配信');
    conversation.chooseCategory('AV_MEDIA');
    conversation.chooseSubCategory('AV_MEDIA_5');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '夜ふかしゲーム配信');
    assert.ok(parent);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id));

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_5');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_5');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedClassifications = [
      ['AV_MEDIA', 'AV_MEDIA_5'], ['AV_MEDIA', 'AV_MEDIA_5'], ['PERSON', 'PERSON_STREAMER'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ['GAME_MEDIA', 'GAME_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_7'], ['ACTIVITY', 'ACTIVITY_3'],
      ['ACTIVITY', 'ACTIVITY_1'], ['TECH', 'TECH_5'], ['TECH', 'TECH_1'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['EVENT', 'EVENT_3'],
      ['ACTIVITY', 'ACTIVITY_4'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    assert.deepEqual(
      derivedPool.map((item) => item.classification).map(({ category, subcategory }) => [category, subcategory]),
      expectedClassifications,
    );
    assert.match(derivedPool[1]?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(derivedPool[2]?.closing[0]?.text ?? '', /一緒に配信していた人/);
    assert.match(deepPool[2]?.opening[1]?.text ?? '', /交流がなければ配信の内容だけでも大丈夫/);
    assert.match(deepPool[4]?.opening[1]?.text ?? '', /生配信、アーカイブ、切り抜き動画/);

    const firstSix = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `配信コンボ回答${index + 1}`)?.ok, true);
      firstSix.push(question);
    }
    assert.equal(firstSix.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(firstSix.filter((question) => question.kind === 'deepDive').length, 2);

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('夜ふかしゲーム配信');
    duplicateConversation.chooseCategory('AV_MEDIA');
    duplicateConversation.chooseSubCategory('AV_MEDIA_5');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === '夜ふかしゲーム配信');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'STREAM_MEDIA_V2_01', '夜ふかしゲーム配信')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === '夜ふかしゲーム配信').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('夜ふかしゲーム配信');
    completionConversation.chooseCategory('AV_MEDIA');
    completionConversation.chooseSubCategory('AV_MEDIA_5');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '夜ふかしゲーム配信');
    const deepAnswers = [
      ['STREAM_MEDIA_DEEP_01', '配信の空気感は好きだが、長時間続くと追いきれないことがある'],
      ['STREAM_MEDIA_DEEP_02', '話の脱線から自然に企画へ戻るところが面白かった'],
      ['STREAM_MEDIA_DEEP_03', '大会の結果に皆で驚いていた回が印象深い。コメント参加はしていない'],
      ['STREAM_MEDIA_DEEP_04', '遊んでいたゲームの攻略を調べていて知った'],
      ['STREAM_MEDIA_DEEP_05', '最初は生配信を見ていたが、最近は都合に合わせてアーカイブや切り抜きを見ることが多い'],
    ];
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'streamer_impression', value: deepAnswers[0][1] },
      slot2: { key: 'streaming_style', value: deepAnswers[1][1] },
      slot3: { key: 'memorable_stream_moment', value: deepAnswers[2][1] },
      slot4: { key: 'discovery_memory', value: deepAnswers[3][1] },
      slot5: { key: 'viewing_history', value: deepAnswers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('芸能・番組は20派生・5掘り下げを持ち、番組評価と視聴習慣を分けて保存する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('クイズと歌の番組');
    conversation.chooseCategory('AV_MEDIA');
    conversation.chooseSubCategory('AV_MEDIA_6');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === 'クイズと歌の番組');
    assert.ok(parent);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id));

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_6');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_6');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedClassifications = [
      ['AV_MEDIA', 'AV_MEDIA_6'], ['AV_MEDIA', 'AV_MEDIA_6'], ['AV_MEDIA', 'AV_MEDIA_6'], ['AV_MEDIA', 'AV_MEDIA_6'],
      ['PERSON', 'PERSON_ENTERTAINER'], ['PERSON', 'PERSON_ENTERTAINER'], ['PERSON', 'PERSON_ENTERTAINER'],
      ['AV_MEDIA', 'AV_MEDIA_6'], ['ACTIVITY', 'ACTIVITY_1'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ['AV_MEDIA', 'AV_MEDIA_1'], ['FOOD', 'FOOD_1'], ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_5'],
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_7'], ['PERSON', 'PERSON_2'],
      ['PERSON', 'PERSON_1'], ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    assert.deepEqual(
      derivedPool.map((item) => item.classification).map(({ category, subcategory }) => [category, subcategory]),
      expectedClassifications,
    );
    assert.match(derivedPool[2]?.closing[0]?.text ?? '', /人間さんには/);
    assert.match(derivedPool[7]?.closing[0]?.text ?? '', /コーナー/);
    assert.match(deepPool[3]?.opening[1]?.text ?? '', /放送曜日・時間と/);
    assert.match(deepPool[4]?.opening[1]?.text ?? '', /気になっただけのことと、実際に経験したこと/);

    const firstSix = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `番組コンボ回答${index + 1}`)?.ok, true);
      firstSix.push(question);
    }
    assert.equal(firstSix.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(firstSix.filter((question) => question.kind === 'deepDive').length, 2);

    const spacingConversation = create(memory(), undefined, () => 0);
    prepare(spacingConversation);
    spacingConversation.startWordTeaching();
    spacingConversation.submit('クイズと歌の番組');
    spacingConversation.chooseCategory('AV_MEDIA');
    spacingConversation.chooseSubCategory('AV_MEDIA_6');
    spacingConversation.choose('WORD_NEUTRAL');
    const spacingParent = spacingConversation.getWordEntries().find((word) => word.surface === 'クイズと歌の番組');
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'PROGRAM_V2_02', '週末の歌謡クイズ')?.ok, true);
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'PROGRAM_V2_01', '夕方の音楽トーク')?.ok, true);
    assert.equal(spacingConversation.getNextPersonComboQuestion(spacingParent.id)?.kind, 'deepDive');
    assert.notEqual(spacingConversation.getNextPersonComboQuestion(spacingParent.id)?.id, 'PROGRAM_DEEP_04');
    assert.equal(spacingConversation.submitPersonComboAnswer(spacingParent.id, 'PROGRAM_DEEP_04', '録画を翌日に見ていた')?.ok, true);
    const nextAfterRoutine = spacingConversation.getNextPersonComboQuestion(spacingParent.id);
    assert.equal(nextAfterRoutine?.kind, 'derived');
    assert.notEqual(nextAfterRoutine?.id, 'PROGRAM_V2_02');

    const duplicateConversation = create(memory(), undefined, () => 0.5);
    prepare(duplicateConversation);
    duplicateConversation.startWordTeaching();
    duplicateConversation.submit('クイズと歌の番組');
    duplicateConversation.chooseCategory('AV_MEDIA');
    duplicateConversation.chooseSubCategory('AV_MEDIA_6');
    duplicateConversation.choose('WORD_NEUTRAL');
    const duplicateParent = duplicateConversation.getWordEntries().find((word) => word.surface === 'クイズと歌の番組');
    const wordCount = duplicateConversation.getWordEntries().length;
    assert.equal(duplicateConversation.submitPersonComboAnswer(duplicateParent.id, 'PROGRAM_V2_08', 'クイズと歌の番組')?.ok, true);
    assert.equal(duplicateConversation.getWordEntries().filter((word) => word.surface === 'クイズと歌の番組').length, 1);
    assert.equal(duplicateConversation.getWordEntries().length, wordCount);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('クイズと歌の番組');
    completionConversation.chooseCategory('AV_MEDIA');
    completionConversation.chooseSubCategory('AV_MEDIA_6');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === 'クイズと歌の番組');
    const deepAnswers = [
      ['PROGRAM_DEEP_01', 'クイズは好きだったが、長い宣伝コーナーは少し苦手だった'],
      ['PROGRAM_DEEP_02', '予想外の答えにスタジオ全員が驚いた場面'],
      ['PROGRAM_DEEP_03', '司会者の問いに出演者が次々と冗談を返していたところ'],
      ['PROGRAM_DEEP_04', '毎週録画し、夕食のあとに家族と見ていた'],
      ['PROGRAM_DEEP_05', '番組で知った料理に興味を持ち、休日に実際に作ってみた'],
    ];
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生回答${item.id}`)?.ok, true);
    }
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'program_impression', value: deepAnswers[0][1] },
      slot2: { key: 'memorable_program_moment', value: deepAnswers[1][1] },
      slot3: { key: 'performer_chemistry', value: deepAnswers[2][1] },
      slot4: { key: 'viewing_routine', value: deepAnswers[3][1] },
      slot5: { key: 'personal_influence', value: deepAnswers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('音楽・映画・動画のその他は20派生・5掘り下げを持ち、鑑賞と制作を区別して保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('ポッドキャスト鑑賞');
    conversation.chooseCategory('AV_MEDIA');
    conversation.chooseSubCategory('AV_MEDIA_7');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === 'ポッドキャスト鑑賞');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_7');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'AV_MEDIA_7');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['AV_MEDIA', 'AV_MEDIA_7'], ['AV_MEDIA', 'AV_MEDIA_7'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_6'], ['AV_MEDIA', 'AV_MEDIA_5'],
      ['AV_MEDIA', 'AV_MEDIA_2'], ['PERSON', 'PERSON_ENTERTAINER'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ['KNOWLEDGE', 'KNOWLEDGE_7'], ['ACTIVITY', 'ACTIVITY_3'], ['TECH', 'TECH_4'],
      ['TECH', 'TECH_5'], ['OBJECT', 'OBJECT_6'], ['PLACE', 'PLACE_4'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['EVENT', 'EVENT_2'],
      ['NATURE_TIME', 'NATURE_TIME_3'], ['NATURE_TIME', 'NATURE_TIME_2'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /感じられた/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /鑑賞を楽しんでいただけなら/);
    assert.match(derivedPool[11].opening.map((line) => line.text).join(' '), /実際に使ったもの/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `音声映像回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('ポッドキャスト鑑賞');
    completionConversation.chooseCategory('AV_MEDIA');
    completionConversation.chooseSubCategory('AV_MEDIA_7');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === 'ポッドキャスト鑑賞');
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生語${item.id}`)?.ok, true);
    }
    const answers = [
      ['AV_OTHER_DEEP_01', '音声だけで気軽に聴けるのが好きだった'],
      ['AV_OTHER_DEEP_02', '落ち着いた声のトーンが印象に残った'],
      ['AV_OTHER_DEEP_03', '散歩中に聞きやすい長さの回を選んでいた'],
      ['AV_OTHER_DEEP_04', '友達にすすめられて知った'],
      ['AV_OTHER_DEEP_05', '通勤中に聞いていた時期を思い出す'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'media_activity_impression', value: answers[0][1] },
      slot2: { key: 'sensory_impression', value: answers[1][1] },
      slot3: { key: 'personal_approach', value: answers[2][1] },
      slot4: { key: 'encounter_memory', value: answers[3][1] },
      slot5: { key: 'personal_media_memory', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('本は20派生・5掘り下げを指定分類へつなぎ、知識と著者の主張・読書の影響を分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('科学の本');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_1');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '科学の本');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_1');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_1');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['PERSON', 'PERSON_AUTHOR_WRITER'], ['PERSON', 'PERSON_SCIENTIST'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_4'],
      ['KNOWLEDGE', 'KNOWLEDGE_5'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_ART'],
      ['KNOWLEDGE', 'KNOWLEDGE_7'], ['PLACE', 'PLACE_5'], ['AV_MEDIA', 'AV_MEDIA_4'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['PLACE', 'PLACE_2'],
      ['PLACE', 'PLACE_3'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /感じられた/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /感じられた/);
    assert.match(derivedPool[6].opening.map((line) => line.text).join(' '), /検証/);
    assert.match(derivedPool[12].opening.map((line) => line.text).join(' '), /真偽を断定せず/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /科学者や研究者/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `本コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('科学の本');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_1');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '科学の本');
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `派生本${item.id}`)?.ok, true);
    }
    const answers = [
      ['KNOWLEDGE_BOOK_DEEP_01', '内容は面白いが専門用語が多くて少し難しかった'],
      ['KNOWLEDGE_BOOK_DEEP_02', '昔の生物と現在の生物のつながりを扱った章'],
      ['KNOWLEDGE_BOOK_DEEP_03', '著者の説明には納得したが、原因の解釈は疑問に感じた'],
      ['KNOWLEDGE_BOOK_DEEP_04', '図書館で表紙を見て気になった'],
      ['KNOWLEDGE_BOOK_DEEP_05', '考え方や行動に特に変化はなかった'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'book_impression', value: answers[0][1] },
      slot2: { key: 'memorable_knowledge', value: answers[1][1] },
      slot3: { key: 'author_idea_interpretation', value: answers[2][1] },
      slot4: { key: 'reading_motivation', value: answers[3][1] },
      slot5: { key: 'personal_influence', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('歴史は20派生・5掘り下げを分類し、時系列・因果・本人の解釈を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('産業革命');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_2');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '産業革命');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_2');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_2');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['PERSON', 'PERSON_HISTORICAL_MILITARY'],
      ['PERSON', 'PERSON_HISTORICAL_CULTURAL'], ['PERSON', 'PERSON_OTHER'], ['PERSON', 'PERSON_SCIENTIST'],
      ['PLACE', 'PLACE_6'], ['PLACE', 'PLACE_5'], ['PLACE', 'PLACE_3'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ['KNOWLEDGE', 'KNOWLEDGE_5'], ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['KNOWLEDGE', 'KNOWLEDGE_3'],
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_2'],
      ['GAME_MEDIA', 'GAME_MEDIA_3'], ['PERSON', 'PERSON_2'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[0].closing.map((line) => line.text).join(' '), /同じ時代/);
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /原因だったかどうかは分けて/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /結果や影響だったかどうかは分けて/);
    assert.match(derivedPool[3].closing.map((line) => line.text).join(' '), /感じられた/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /確定した史実とは分けて/);
    assert.match(deepPool[2].opening.map((line) => line.text).join(' '), /英雄や悪人と決めず/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `歴史コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('産業革命');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_2');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '産業革命');
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `関連用語${item.id}`)?.ok, true);
    }
    const answers = [
      ['KNOWLEDGE_HISTORY_DEEP_01', '資源や技術の変化など、いくつかの要因が重なったのだと思う'],
      ['KNOWLEDGE_HISTORY_DEEP_02', '生産や暮らし方が大きく変わったと思う'],
      ['KNOWLEDGE_HISTORY_DEEP_03', '改革を進めた判断には納得する点もあるが、影響の大きさには疑問もある'],
      ['KNOWLEDGE_HISTORY_DEEP_04', '地域ごとに変化の時期や要因が違ったという見方が気になる'],
      ['KNOWLEDGE_HISTORY_DEEP_05', '身近な道具や社会の変化とつながるところが面白く、学生のころから興味がある'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'historical_cause_interpretation', value: answers[0][1] },
      slot2: { key: 'historical_consequence_interpretation', value: answers[1][1] },
      slot3: { key: 'historical_figure_evaluation', value: answers[2][1] },
      slot4: { key: 'competing_interpretations', value: answers[3][1] },
      slot5: { key: 'personal_historical_interest', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('科学・自然は20派生・5掘り下げを持ち、理解・疑問・実験経験を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('光合成');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_3');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '光合成');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_3');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_3');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_3'],
      ['KNOWLEDGE', 'KNOWLEDGE_3'], ['PERSON', 'PERSON_SCIENTIST'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
      ['NATURE_TIME', 'NATURE_TIME_7'], ['NATURE_TIME', 'NATURE_TIME_6'], ['NATURE_TIME', 'NATURE_TIME_1'],
      ['ANIMAL', 'ANIMAL_5'], ['ANIMAL', 'ANIMAL_4'], ['BODY', 'BODY_1'], ['TECH', 'TECH_2'],
      ['OBJECT', 'OBJECT_6'], ['SCHOOL', 'SCHOOL_2'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['WORK', 'WORK_1'], ['PERSON', 'PERSON_2'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ていると感じられた/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /対照的に感じられた/);
    assert.match(derivedPool[9].opening.map((line) => line.text).join(' '), /関係のない/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /関係のない/);
    assert.match(derivedPool[12].opening.map((line) => line.text).join(' '), /実際に使ったかどうか/);
    assert.match(derivedPool[13].opening.map((line) => line.text).join(' '), /実際に観察・実験した経験/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /確立された知見と同じものだと決めつけず/);
    assert.match(deepPool[3].opening.map((line) => line.text).join(' '), /本や動画で知っただけの場合/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `科学コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('光合成');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_3');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '光合成');
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `科学派生${item.id}`)?.ok, true);
    }
    const answers = [
      ['KNOWLEDGE_SCIENCE_DEEP_01', '光のエネルギーを使って養分を作るところが面白い'],
      ['KNOWLEDGE_SCIENCE_DEEP_02', '光を受けて水や二酸化炭素から養分を作る仕組みだと理解している'],
      ['KNOWLEDGE_SCIENCE_DEEP_03', '環境によって反応の速さがどう変わるのか、まだ不思議に思う'],
      ['KNOWLEDGE_SCIENCE_DEEP_04', '学校の実験で葉に光を当てて観察したことがある'],
      ['KNOWLEDGE_SCIENCE_DEEP_05', '小学校の授業で習ったのが最初のきっかけだった'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'science_impression', value: answers[0][1] },
      slot2: { key: 'personal_science_understanding', value: answers[1][1] },
      slot3: { key: 'unanswered_science_questions', value: answers[2][1] },
      slot4: { key: 'observation_experiment_memory', value: answers[3][1] },
      slot5: { key: 'science_discovery_context', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('社会・世の中は20派生・5掘り下げを指定分類へつなぎ、事実・情報源・意見を分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('社会保障制度');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_4');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '社会保障制度');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_4');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_4');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_4'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['PLACE', 'PLACE_6'], ['PLACE', 'PLACE_5'],
      ['WORK', 'WORK_1'], ['PLACE', 'PLACE_3'], ['WORK', 'WORK_4'], ['SCHOOL', 'SCHOOL_2'],
      ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_7'], ['KNOWLEDGE', 'KNOWLEDGE_5'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_6'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['PERSON', 'PERSON_SCIENTIST'], ['PERSON', 'PERSON_2'],
      ['EVENT', 'EVENT_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /感じられた/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /直接の原因と決まっているわけではない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /情報源を通じて知った/);
    assert.match(deepPool[2].opening.map((line) => line.text).join(' '), /判断保留でも大丈夫/);
    assert.match(deepPool[3].opening.map((line) => line.text).join(' '), /賛同することは別々/);
    assert.match(deepPool[4].opening.map((line) => line.text).join(' '), /個人的な事情の詳しい説明は求めない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `社会コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('社会保障制度');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_4');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '社会保障制度');
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `関連話題${item.id}`)?.ok, true);
    }
    const answers = [
      ['KNOWLEDGE_SOCIAL_DEEP_01', '制度が暮らしにどう関わるのかが気になる'],
      ['KNOWLEDGE_SOCIAL_DEEP_02', 'ニュース記事や公的機関の説明で知った'],
      ['KNOWLEDGE_SOCIAL_DEEP_03', '必要性は感じるが、具体的な制度設計については判断保留にしている'],
      ['KNOWLEDGE_SOCIAL_DEEP_04', '支援の範囲や負担の分け方で異なる意見がありそう'],
      ['KNOWLEDGE_SOCIAL_DEEP_05', '自分の暮らしと関係する部分があると感じるが、詳しい事情は話さない'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'social_topic_interest', value: answers[0][1] },
      slot2: { key: 'social_information_source', value: answers[1][1] },
      slot3: { key: 'personal_social_opinion', value: answers[2][1] },
      slot4: { key: 'different_social_perspectives', value: answers[3][1] },
      slot5: { key: 'personal_social_relevance', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('思想・哲学は20派生・5掘り下げを持ち、類似・対立・影響と理解・賛否・実践を分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('功利主義');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_5');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '功利主義');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_5');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_5');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_5'], ['KNOWLEDGE', 'KNOWLEDGE_5'], ['KNOWLEDGE', 'KNOWLEDGE_5'],
      ['KNOWLEDGE', 'KNOWLEDGE_5'], ['PERSON', 'PERSON_HISTORICAL_CULTURAL'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
      ['PLACE', 'PLACE_6'], ['PLACE', 'PLACE_5'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'], ['GAME_MEDIA', 'GAME_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_2'],
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['WORK', 'WORK_5'], ['AV_MEDIA', 'AV_MEDIA_4'],
      ['PERSON', 'PERSON_2'], ['EMOTION', 'EMOTION_6'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /どの点が似ている/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /思想全体が正反対とは限らない/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /一部の考え方が対立/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /歴史的な影響/);
    assert.match(derivedPool[9].opening.map((line) => line.text).join(' '), /人間さん自身の解釈/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /作品の公式設定ではなく/);
    assert.match(derivedPool[11].opening.map((line) => line.text).join(' '), /公式設定とは分けて/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /確定した定義だとは決めつけない/);
    assert.match(deepPool[2].opening.map((line) => line.text).join(' '), /まだ判断できない/);
    assert.match(deepPool[4].opening.map((line) => line.text).join(' '), /政治的な立場や個人的な事情を推測しない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `思想コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('功利主義');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_5');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '功利主義');
    for (const item of derivedPool) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `関連思想${item.id}`)?.ok, true);
    }
    const answers = [
      ['KNOWLEDGE_PHILOSOPHY_DEEP_01', '考え方を比べると面白いが、難しいところもある'],
      ['KNOWLEDGE_PHILOSOPHY_DEEP_02', '行動の結果や幸福を重視する考え方だと理解している'],
      ['KNOWLEDGE_PHILOSOPHY_DEEP_03', '結果を重視する点は納得できるが、判断が難しい場合は反対意見もあり、まだ結論は保留している'],
      ['KNOWLEDGE_PHILOSOPHY_DEEP_04', '倫理学の入門書を読んだのがきっかけだった'],
      ['KNOWLEDGE_PHILOSOPHY_DEEP_05', '特定の判断で考慮したことはあるが、いつも実践しているわけではない'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'philosophy_impression', value: answers[0][1] },
      slot2: { key: 'personal_philosophy_understanding', value: answers[1][1] },
      slot3: { key: 'philosophy_agreement_objections', value: answers[2][1] },
      slot4: { key: 'philosophy_discovery_context', value: answers[3][1] },
      slot5: { key: 'philosophy_practical_application', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('言葉・文化は20派生・5掘り下げを持ち、意味・由来・実体験と理解を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('一期一会');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_6');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '一期一会');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_6');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_6');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['PLACE', 'PLACE_6'], ['PLACE', 'PLACE_5'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_5'], ['PERSON', 'PERSON_HISTORICAL_CULTURAL'],
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'], ['AV_MEDIA', 'AV_MEDIA_2'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['EVENT', 'EVENT_2'], ['FOOD', 'FOOD_1'], ['CLOTHING', 'CLOTHING_1'],
      ['OBJECT', 'OBJECT_4'], ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['PERSON', 'PERSON_2'], ['PLACE', 'PLACE_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ている/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /反対の意味だと人間さんが考える/);
    assert.match(derivedPool[3].closing.map((line) => line.text).join(' '), /習慣や文化/);
    assert.match(derivedPool[6].opening.map((line) => line.text).join(' '), /由来や歴史には諸説/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /すでに合う人物分類/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /一般的な説明と人間さん自身の理解は分けて/);
    assert.match(deepPool[2].opening.map((line) => line.text).join(' '), /由来には諸説ある場合/);
    assert.match(deepPool[3].opening.map((line) => line.text).join(' '), /知っていることと実際に使ったり体験したことは別々/);
    assert.match(deepPool[4].opening.map((line) => line.text).join(' '), /出身地・国籍・家族背景を推測しない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `言葉文化コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('一期一会');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_6');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '一期一会');
    assert.equal(completeParent?.subcategory, 'KNOWLEDGE_6');
    assert.ok(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent?.id));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `関連表現${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['KNOWLEDGE_LANGUAGE_CULTURE_DEEP_01', '短い言葉に深い意味が込められているところが好き'],
      ['KNOWLEDGE_LANGUAGE_CULTURE_DEEP_02', '出会いは一度きりなので大切にしようという意味だと理解している'],
      ['KNOWLEDGE_LANGUAGE_CULTURE_DEEP_03', '茶道に由来するという説明を聞いたが、語源には諸説あると思う'],
      ['KNOWLEDGE_LANGUAGE_CULTURE_DEEP_04', '日常で使ったことはあるが、文化的な体験をしたわけではない'],
      ['KNOWLEDGE_LANGUAGE_CULTURE_DEEP_05', '学校の授業で初めて聞いた'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'language_culture_impression', value: answers[0][1] },
      slot2: { key: 'personal_meaning_understanding', value: answers[1][1] },
      slot3: { key: 'origin_context_memory', value: answers[2][1] },
      slot4: { key: 'personal_usage_experience', value: answers[3][1] },
      slot5: { key: 'language_culture_encounter', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('美術・芸術は20派生・5掘り下げを指定分類し、作品の印象・作者意図・鑑賞経験を分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('ひまわりの絵画');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_ART');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === 'ひまわりの絵画');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_ART');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_ART');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['KNOWLEDGE', 'KNOWLEDGE_ART'],
      ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['KNOWLEDGE', 'KNOWLEDGE_ART'],
      ['PERSON', 'PERSON_HISTORICAL_CULTURAL'], ['PERSON', 'PERSON_HISTORICAL_CULTURAL'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['PLACE', 'PLACE_6'], ['PLACE', 'PLACE_5'], ['PLACE', 'PLACE_3'],
      ['KNOWLEDGE', 'KNOWLEDGE_5'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ['OBJECT', 'OBJECT_6'], ['ACTIVITY', 'ACTIVITY_3'], ['EVENT', 'EVENT_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /似ていると人間さんが感じた/);
    assert.match(derivedPool[3].closing.map((line) => line.text).join(' '), /対照的な印象を人間さんが受けた/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /本や画像で見た経験/);
    assert.match(derivedPool[11].opening.map((line) => line.text).join(' '), /公式な意味ではなく/);
    assert.match(derivedPool[17].opening.map((line) => line.text).join(' '), /制作や表現を試した経験がなければ/);
    assert.match(derivedPool[18].opening.map((line) => line.text).join(' '), /興味を持っただけでも大丈夫/);
    assert.match(derivedPool[19].opening.map((line) => line.text).join(' '), /実際に行っていなければ/);
    assert.match(deepPool[2].opening.map((line) => line.text).join(' '), /作者の確定した意図ではなく/);
    assert.match(deepPool[4].opening.map((line) => line.text).join(' '), /制作経験、試した経験、興味を持ったことは分けて/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `美術コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('ひまわりの絵画');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_ART');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === 'ひまわりの絵画');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `美術語${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['KNOWLEDGE_ART_DEEP_01', '色づかいが豊かで好きだが、少し華やかすぎるとも感じる'],
      ['KNOWLEDGE_ART_DEEP_02', '黄色と青の対比や、花瓶の形が印象に残っている'],
      ['KNOWLEDGE_ART_DEEP_03', '生命力を表したかったのではないかと想像するが、作者の意図は断定できない'],
      ['KNOWLEDGE_ART_DEEP_04', '美術の本で作品を見たのが最初だった'],
      ['KNOWLEDGE_ART_DEEP_05', '自分でも花の絵を描いてみたくなったが、まだ試してはいない'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'artwork_impression', value: answers[0][1] },
      slot2: { key: 'visual_expression_memory', value: answers[1][1] },
      slot3: { key: 'artist_intent_interpretation', value: answers[2][1] },
      slot4: { key: 'artwork_encounter', value: answers[3][1] },
      slot5: { key: 'creative_influence', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('雑学・トリビアは20派生・5掘り下げを指定分類し、面白さ・確からしさ・検証経験・共有を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('逆さにした紙コップの水はこぼれにくい');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_7');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '逆さにした紙コップの水はこぼれにくい');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_7');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_7');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_7'], ['KNOWLEDGE', 'KNOWLEDGE_7'], ['KNOWLEDGE', 'KNOWLEDGE_7'],
      ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['NATURE_TIME', 'NATURE_TIME_7'],
      ['PERSON', 'PERSON_SCIENTIST'], ['PLACE', 'PLACE_6'], ['FOOD', 'FOOD_1'], ['BODY', 'BODY_1'],
      ['ANIMAL', 'ANIMAL_3'], ['ANIMAL', 'ANIMAL_5'], ['TECH', 'TECH_2'], ['OBJECT', 'OBJECT_2'],
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_4'], ['PERSON', 'PERSON_2'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ていると人間さんが感じた/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /反対だと人間さんが感じた/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /確かめた事実かどうかは分けて/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /原因や結果であることは分けて/);
    assert.match(deepPool[2].opening.map((line) => line.text).join(' '), /俗説、未検証の話/);
    assert.match(deepPool[3].opening.map((line) => line.text).join(' '), /調べたこと、実際に観察したこと、実験したことは別々/);
    assert.match(deepPool[4].opening.map((line) => line.text).join(' '), /実際に誰かに話した経験と、話したいと思っただけ/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `雑学コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('逆さにした紙コップの水はこぼれにくい');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_7');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '逆さにした紙コップの水はこぼれにくい');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `豆知識語${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['KNOWLEDGE_TRIVIA_DEEP_01', '仕組みが意外で面白かったが、本当か少し疑問にも思った'],
      ['KNOWLEDGE_TRIVIA_DEEP_02', '小学生のころ授業で先生から聞いた'],
      ['KNOWLEDGE_TRIVIA_DEEP_03', '本で読んだ話で、複数の説明を見たため確信はない'],
      ['KNOWLEDGE_TRIVIA_DEEP_04', '記事で調べたが、自分では観察も実験もしていない'],
      ['KNOWLEDGE_TRIVIA_DEEP_05', '友人に実際に話したことがあり、また話題にしたいと思う'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'trivia_surprise_impression', value: answers[0][1] },
      slot2: { key: 'trivia_discovery_context', value: answers[1][1] },
      slot3: { key: 'trivia_confidence_uncertainty', value: answers[2][1] },
      slot4: { key: 'trivia_verification_experience', value: answers[3][1] },
      slot5: { key: 'trivia_sharing_memory', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('本・雑学・トリビアのその他は20派生・5掘り下げを持ち、テーマ・調査・仮説・未解決の疑問を分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('古代の暦と季節のずれ');
    conversation.chooseCategory('KNOWLEDGE');
    conversation.chooseSubCategory('KNOWLEDGE_8');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '古代の暦と季節のずれ');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_8');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'KNOWLEDGE_8');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 5);
    const expectedCategories = [
      ['KNOWLEDGE', 'KNOWLEDGE_8'], ['KNOWLEDGE', 'KNOWLEDGE_8'], ['KNOWLEDGE', 'KNOWLEDGE_8'], ['KNOWLEDGE', 'KNOWLEDGE_8'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_5'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_7'], ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ['AV_MEDIA', 'AV_MEDIA_4'], ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_SCIENTIST'], ['PLACE', 'PLACE_3'],
      ['PLACE', 'PLACE_5'], ['TECH', 'TECH_5'], ['SCHOOL', 'SCHOOL_2'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[0].opening.map((line) => line.text).join(' '), /短いテーマ名/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /似た疑問を人間さんが持った/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /まだ調べていない希望/);
    assert.match(derivedPool[5].opening.map((line) => line.text).join(' '), /確立した知見か、研究中の考えか、人間さんの仮説か/);
    assert.match(deepPool[2].opening.map((line) => line.text).join(' '), /情報源や調べ方と、自分で観察・検証した経験は分けて/);
    assert.match(deepPool[3].opening.map((line) => line.text).join(' '), /変化がなかった/);
    assert.match(deepPool[4].opening.map((line) => line.text).join(' '), /後の会話でも思い出せる/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `知識コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('古代の暦と季節のずれ');
    completionConversation.chooseCategory('KNOWLEDGE');
    completionConversation.chooseSubCategory('KNOWLEDGE_8');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '古代の暦と季節のずれ');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `短いテーマ${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['KNOWLEDGE_OTHER_DEEP_01', '季節のずれをどう直したのかが気になった'],
      ['KNOWLEDGE_OTHER_DEEP_02', '博物館の展示で暦の違いを見たのがきっかけ'],
      ['KNOWLEDGE_OTHER_DEEP_03', '本や展示資料を調べて考えたが、自分で検証はしていない'],
      ['KNOWLEDGE_OTHER_DEEP_04', '予想とだいたい同じで、新しく分かったことは少なかった'],
      ['KNOWLEDGE_OTHER_DEEP_05', 'なぜ地域ごとに暦が違ったのか、次は知りたい'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'curiosity_impression', value: answers[0][1] },
      slot2: { key: 'interest_origin', value: answers[1][1] },
      slot3: { key: 'inquiry_method', value: answers[2][1] },
      slot4: { key: 'expectation_revision', value: answers[3][1] },
      slot5: { key: 'remaining_questions', value: answers[4][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('体の部分は20派生・2掘り下げを指定分類し、一般知識と本人の身体経験を分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('耳介軟骨');
    conversation.chooseCategory('BODY');
    conversation.chooseSubCategory('BODY_1');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '耳介軟骨');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_1');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_1');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['BODY', 'BODY_1'], ['BODY', 'BODY_1'], ['BODY', 'BODY_1'], ['BODY', 'BODY_1'],
      ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_7'], ['BODY', 'BODY_2'], ['BODY', 'BODY_3'],
      ['BODY', 'BODY_6'], ['BODY', 'BODY_4'], ['SPORTS', 'SPORTS_DISCIPLINE'], ['ACTIVITY', 'ACTIVITY_1'],
      ['CLOTHING', 'CLOTHING_1'], ['OBJECT', 'OBJECT_2'], ['ANIMAL', 'ANIMAL_1'], ['SCHOOL', 'SCHOOL_2'],
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_4'], ['WORK', 'WORK_1'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[6].opening.map((line) => line.text).join(' '), /本人が経験した症状を尋ねているわけではなく/);
    assert.match(derivedPool[7].opening.map((line) => line.text).join(' '), /本人の病歴やけがの経験を話す必要はない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /受診経験や必要性は推測しない/);
    assert.match(derivedPool[9].opening.map((line) => line.text).join(' '), /個別の治療法は勧めない/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /人間さん自身の理解として/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /個人的な体調や病歴を話す必要はない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `身体コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('耳介軟骨');
    completionConversation.chooseCategory('BODY');
    completionConversation.chooseSubCategory('BODY_1');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '耳介軟骨');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `身体部位語${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['BODY_PART_DEEP_01', '物をつかんだり、触れた感覚を受け取ったりする部分だと思う'],
      ['BODY_PART_DEEP_02', '細かい作業をしていると、指先の動きの違いに気づくことがある'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'body_part_understanding', value: answers[0][1] },
      slot2: { key: 'body_part_observation', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('体調・症状は20派生・2掘り下げを指定分類し、一般知識と本人の健康状態を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('耳の圧迫感');
    conversation.chooseCategory('BODY');
    conversation.chooseSubCategory('BODY_2');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '耳の圧迫感');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_2');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_2');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['BODY', 'BODY_2'], ['BODY', 'BODY_2'], ['BODY', 'BODY_2'], ['BODY', 'BODY_1'],
      ['BODY', 'BODY_3'], ['BODY', 'BODY_6'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_7'],
      ['BODY', 'BODY_4'], ['BODY', 'BODY_5'], ['FOOD', 'FOOD_3'], ['NATURE_TIME', 'NATURE_TIME_3'],
      ['NATURE_TIME', 'NATURE_TIME_2'], ['NATURE_TIME', 'NATURE_TIME_1'], ['BODY', 'BODY_6'], ['OBJECT', 'OBJECT_2'],
      ['WORK', 'WORK_2'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_4'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /原因や必ず起きることは区別/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /診断や原因の推測はしない/);
    assert.match(derivedPool[5].opening.map((line) => line.text).join(' '), /受診が必要だと判断したり勧めたりはしない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /効果を保証/);
    assert.match(derivedPool[14].opening.map((line) => line.text).join(' '), /受診の必要性は推測しない/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /医学的に確認済みの定義とは扱わない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /経験した・していない・分からない・答えたくない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `症状コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('耳の圧迫感');
    completionConversation.chooseCategory('BODY');
    completionConversation.chooseSubCategory('BODY_2');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '耳の圧迫感');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `健康知識${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['BODY_SYMPTOM_DEEP_01', '耳の中の圧力差などで詰まった感じがする状態だと理解している'],
      ['BODY_SYMPTOM_DEEP_02', '自分の経験ではなく一般知識として知っている。仕組みの説明がどこまで正確か疑問がある'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'symptom_understanding', value: answers[0][1] },
      slot2: { key: 'symptom_experience_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('病気・けがは20派生・2掘り下げを指定分類し、一般知識と本人の病歴を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('足首の靭帯損傷');
    conversation.chooseCategory('BODY');
    conversation.chooseSubCategory('BODY_3');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '足首の靭帯損傷');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_3');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_3');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['BODY', 'BODY_3'], ['BODY', 'BODY_3'], ['BODY', 'BODY_3'], ['BODY', 'BODY_1'],
      ['BODY', 'BODY_2'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['PERSON', 'PERSON_SCIENTIST'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
      ['BODY', 'BODY_6'], ['BODY', 'BODY_6'], ['BODY', 'BODY_4'], ['BODY', 'BODY_5'],
      ['OBJECT', 'OBJECT_2'], ['SPORTS', 'SPORTS_DISCIPLINE'], ['WORK', 'WORK_2'], ['KNOWLEDGE', 'KNOWLEDGE_4'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_4'], ['SCHOOL', 'SCHOOL_2'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /似ているところと区別点/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /診断には使わない/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /本人の症状とは結びつけない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /本人の検査・処置経験や受けるべき治療を推測しない/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /個別の休養や治療を勧めたりしない/);
    assert.match(derivedPool[11].opening.map((line) => line.text).join(' '), /治療効果は保証しない/);
    assert.match(derivedPool[13].opening.map((line) => line.text).join(' '), /けがと関係のない病気ならスキップ/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /医学的に確認済みの定義とは扱わない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /個人的な病歴や治療歴を話す必要はない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `病気コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('足首の靭帯損傷');
    completionConversation.chooseCategory('BODY');
    completionConversation.chooseSubCategory('BODY_3');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '足首の靭帯損傷');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `疾患知識${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['BODY_ILLNESS_INJURY_DEEP_01', '靭帯の一部が伸びたり傷ついたりした状態だと理解しているが、医学的な説明は詳しく知らない'],
      ['BODY_ILLNESS_INJURY_DEEP_02', 'スポーツの本で知った。自分の病歴ではなく、どの程度の損傷を指すのかが気になっている'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'illness_injury_understanding', value: answers[0][1] },
      slot2: { key: 'illness_injury_interest_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('睡眠・休養は20派生・2掘り下げを指定分類し、習慣・好み・感じたことを分ける', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('帰宅後の目を閉じる休憩');
    conversation.chooseCategory('BODY');
    conversation.chooseSubCategory('BODY_4');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '帰宅後の目を閉じる休憩');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_4');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_4');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['BODY', 'BODY_4'], ['BODY', 'BODY_4'], ['BODY', 'BODY_4'], ['BODY', 'BODY_4'],
      ['KNOWLEDGE', 'KNOWLEDGE_3'], ['BODY', 'BODY_2'], ['BODY', 'BODY_1'], ['NATURE_TIME', 'NATURE_TIME_3'],
      ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_2'], ['PLACE', 'PLACE_1'], ['OBJECT', 'OBJECT_1'],
      ['OBJECT', 'OBJECT_2'], ['TECH', 'TECH_2'], ['TECH', 'TECH_5'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ['FOOD', 'FOOD_3'], ['WORK', 'WORK_4'], ['ACTIVITY', 'ACTIVITY_6'], ['AV_MEDIA', 'AV_MEDIA_4'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[0].opening.map((line) => line.text).join(' '), /実際に行っている方法か、知識として知っているだけか/);
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ていると人間さんが感じる/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /とは違う休み方/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /実際に組み合わせているか、聞いたことがあるだけか/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /医学的な回復効果とは決めつけない/);
    assert.match(derivedPool[16].opening.map((line) => line.text).join(' '), /回復効果の保証/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /性格や健康状態は決めつけない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /医学的な回復効果とは決めつけない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `休養コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('帰宅後の目を閉じる休憩');
    completionConversation.chooseCategory('BODY');
    completionConversation.chooseSubCategory('BODY_4');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '帰宅後の目を閉じる休憩');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `休養方法${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['BODY_REST_DEEP_01', '短い休憩をすると気分が切り替わる感じが好きだが、静かに過ごすのは少し苦手'],
      ['BODY_REST_DEEP_02', '目を閉じて休むことはある。医学的な回復効果までは分からず、休憩中に何が起きるのか少し不思議'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'rest_preference', value: answers[0][1] },
      slot2: { key: 'rest_experience_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('医療・病院は20派生・2掘り下げを指定分類し、医療知識と本人の受診歴を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('遠隔画像診断サービス');
    conversation.chooseCategory('BODY');
    conversation.chooseSubCategory('BODY_6');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '遠隔画像診断サービス');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_6');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_6');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['BODY', 'BODY_6'], ['BODY', 'BODY_6'], ['BODY', 'BODY_6'], ['BODY', 'BODY_6'],
      ['WORK', 'WORK_1'], ['WORK', 'WORK_2'], ['PLACE', 'PLACE_3'], ['BODY', 'BODY_1'],
      ['BODY', 'BODY_2'], ['BODY', 'BODY_3'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['MONEY', 'MONEY_7'], ['OBJECT', 'OBJECT_6'], ['TECH', 'TECH_7'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /役割が似ていると人間さんが考えている/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /役割が違うと人間さんが考えている/);
    assert.match(derivedPool[6].opening.map((line) => line.text).join(' '), /施設名を聞いている.*サービス名とは分けて/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /本人の症状や診断とは結びつけない/);
    assert.match(derivedPool[13].opening.map((line) => line.text).join(' '), /個人的な加入状況は話さなくて大丈夫/);
    assert.match(derivedPool[14].opening.map((line) => line.text).join(' '), /医療機器は次の質問と分ける/);
    assert.match(derivedPool[19].opening.map((line) => line.text).join(' '), /医学的な事実とは扱わない/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /医学的に確認された知識とは区別/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /受診経験・検査結果・病歴を話す必要はない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `医療コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('遠隔画像診断サービス');
    completionConversation.chooseCategory('BODY');
    completionConversation.chooseSubCategory('BODY_6');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '遠隔画像診断サービス');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `医療語${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['BODY_MEDICAL_DEEP_01', '画像を使って医師が状態を判断する支援の仕組みだと思うが、詳しい流れは分からない'],
      ['BODY_MEDICAL_DEEP_02', '医療技術の記事で知った。個人的な受診経験はなく、どの範囲で使われるのか気になっている'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'medical_care_understanding', value: answers[0][1] },
      slot2: { key: 'medical_interest_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('からだ・健康のその他は健康習慣20派生・2掘り下げを指定分類し、知識と実践を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('帰宅後の手指保湿習慣');
    conversation.chooseCategory('BODY');
    conversation.chooseSubCategory('BODY_7');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '帰宅後の手指保湿習慣');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_7');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'BODY_7');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['BODY', 'BODY_7'], ['BODY', 'BODY_7'], ['BODY', 'BODY_7'], ['BODY', 'BODY_7'],
      ['BODY', 'BODY_1'], ['BODY', 'BODY_2'], ['BODY', 'BODY_4'], ['BODY', 'BODY_5'],
      ['BODY', 'BODY_3'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_7'],
      ['SPORTS', 'SPORTS_3'], ['OBJECT', 'OBJECT_2'], ['TECH', 'TECH_2'], ['TECH', 'TECH_5'],
      ['NATURE_TIME', 'NATURE_TIME_3'], ['NATURE_TIME', 'NATURE_TIME_2'], ['WORK', 'WORK_2'],
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_4'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[0].opening.map((line) => line.text).join(' '), /知識として気になるのか、実際に行っているのかは分けて/);
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /実際に組み合わせているか、知識として聞いたことがあるだけか/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /似ていると人間さんが感じる/);
    assert.match(derivedPool[3].closing.map((line) => line.text).join(' '), /目的が違うと人間さんが考えている/);
    assert.match(derivedPool[5].opening.map((line) => line.text).join(' '), /本人の健康状態や医学的な因果関係とは決めつけない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /本人の病歴や健康状態を推測せず、因果関係も断定しない/);
    assert.match(derivedPool[9].opening.map((line) => line.text).join(' '), /医学的に確認済みの効果とは決めつけない/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /実践していないことを否定的には扱わない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /試していない・分からない・答えたくないでも大丈夫/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `健康習慣コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('帰宅後の手指保湿習慣');
    completionConversation.chooseCategory('BODY');
    completionConversation.chooseSubCategory('BODY_7');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '帰宅後の手指保湿習慣');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `健康習慣${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['BODY_HEALTH_HABIT_DEEP_01', '続けると清潔に感じるのはよいが、手順が多いと少し面倒に思う'],
      ['BODY_HEALTH_HABIT_DEEP_02', '数回実際に試したことがある。特別な健康効果があったとは判断していない'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'health_habit_impression', value: answers[0][1] },
      slot2: { key: 'health_habit_experience_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('うれしい・楽しいは20派生・2掘り下げを指定分類し、感情と出来事の関係を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('達成感');
    conversation.chooseCategory('EMOTION');
    conversation.chooseSubCategory('EMOTION_1');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '達成感');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_1');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_1');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['EMOTION', 'EMOTION_1'], ['EMOTION', 'EMOTION_1'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ['EMOTION', 'EMOTION_6'], ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'],
      ['ACTIVITY', 'ACTIVITY_1'], ['ACTIVITY', 'ACTIVITY_2'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ['AV_MEDIA', 'AV_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_2'], ['FOOD', 'FOOD_1'],
      ['SPORTS', 'SPORTS_DISCIPLINE'], ['WORK', 'WORK_2'], ['SCHOOL', 'SCHOOL_4'],
      ['ACTIVITY', 'ACTIVITY_3'], ['EVENT', 'EVENT_3'], ['PLACE', 'PLACE_7'],
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ていると人間さんが感じる気持ち/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /価値観を決めつけず/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /気持ちの原因だったとは決めつけない/);
    assert.match(derivedPool[5].opening.map((line) => line.text).join(' '), /喜びのきっかけになった人は分けて/);
    assert.match(derivedPool[9].opening.map((line) => line.text).join(' '), /主観的なものとして覚える/);
    assert.match(derivedPool[14].opening.map((line) => line.text).join(' '), /個人的な話は、答えたくなければスキップ/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /実際に経験したかどうかは決めつけない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /答えたくないでもいい/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `感情コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('達成感');
    completionConversation.chooseCategory('EMOTION');
    completionConversation.chooseSubCategory('EMOTION_1');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '達成感');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `うれしい気持ち${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['EMOTION_POSITIVE_DEEP_01', '達成したことが自分にとって大切だったり、努力が実ったと感じたりすると生まれると思う'],
      ['EMOTION_POSITIVE_DEEP_02', '小さな目標を終えた日に達成感があった。どうして人によって感じ方が違うのか不思議に思う'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'positive_emotion_understanding', value: answers[0][1] },
      slot2: { key: 'positive_emotion_experience', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('怒り・嫌な気持ちは20派生・2掘り下げを指定分類し、感情・解釈・行動を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('苛立ち');
    conversation.chooseCategory('EMOTION');
    conversation.chooseSubCategory('EMOTION_2');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '苛立ち');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_2');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_2');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['EMOTION', 'EMOTION_2'], ['EMOTION', 'EMOTION_2'], ['EMOTION', 'EMOTION_4'],
      ['EMOTION', 'EMOTION_3'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_6'],
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['WORK', 'WORK_2'], ['WORK', 'WORK_5'], ['SCHOOL', 'SCHOOL_1'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ['GAME_MEDIA', 'GAME_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ['MONEY', 'MONEY_3'], ['PLACE', 'PLACE_2'], ['BODY', 'BODY_4'], ['EVENT', 'EVENT_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ていると人間さんが感じる/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /複数の気持ちが一緒にある/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /時間の順番と原因は別/);
    assert.match(derivedPool[5].opening.map((line) => line.text).join(' '), /性格や価値観を決めつけ/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /怒りの対象になった人と相談相手を混同しない/);
    assert.match(derivedPool[17].opening.map((line) => line.text).join(' '), /個人的な評価として扱い、客観的な事実とは決めつけない/);
    assert.match(derivedPool[18].opening.map((line) => line.text).join(' '), /効果は保証しない/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /原因や解釈を決めつけない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /感じたこと・誰かに表したこと・実際にした行動は分けて/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /答えなくて大丈夫/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `嫌な気持ちコンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('苛立ち');
    completionConversation.chooseCategory('EMOTION');
    completionConversation.chooseSubCategory('EMOTION_2');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '苛立ち');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `嫌な感情${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['EMOTION_NEGATIVE_DEEP_01', '自分が大切にしていることが損なわれたと感じたり、納得できないことがあったりすると生まれると思う'],
      ['EMOTION_NEGATIVE_DEEP_02', 'その場では腹が立ったけれど、相手に伝えたかどうかとは別のこと。後で信頼できる人に話した'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'negative_emotion_understanding', value: answers[0][1] },
      slot2: { key: 'negative_emotion_experience', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('悲しい・さみしいは20派生・2掘り下げを指定分類し、過去と現在の感情を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('寂しさ');
    conversation.chooseCategory('EMOTION');
    conversation.chooseSubCategory('EMOTION_3');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '寂しさ');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_3');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_3');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['EMOTION', 'EMOTION_3'], ['EMOTION', 'EMOTION_3'], ['EMOTION', 'EMOTION_4'],
      ['EMOTION', 'EMOTION_1'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_6'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['ANIMAL', 'ANIMAL_PET'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ['AV_MEDIA', 'AV_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_1'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'], ['ACTIVITY', 'ACTIVITY_2'], ['EVENT', 'EVENT_5'],
      ['PLACE', 'PLACE_5'], ['OBJECT', 'OBJECT_6'], ['BODY', 'BODY_4'], ['NATURE_TIME', 'NATURE_TIME_2'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ているけれど、少し違うと人間さんが感じる/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /同時にあることも、ないこともある/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /経験が思い当たらなければ、無理に答えなくていい/);
    assert.match(derivedPool[6].opening.map((line) => line.text).join(' '), /感情に関係した人と、相談した人は別/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /動物と暮らした経験や思い出を前提にしていない/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /本人の現実の経験は分けて/);
    assert.match(derivedPool[17].opening.map((line) => line.text).join(' '), /話したくなければ無理に答えなくていい/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /特定の出来事や別れがあったとは決めつけない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /過去の気持ちと今の気持ちは分けて/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /スキップして大丈夫/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `悲しみコンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('寂しさ');
    completionConversation.chooseCategory('EMOTION');
    completionConversation.chooseSubCategory('EMOTION_3');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '寂しさ');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `悲しい気持ち${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['EMOTION_SAD_LONELY_DEEP_01', '大切に思っているものが遠く感じられたり、ひとりで過ごしているときに生まれることがあると思う'],
      ['EMOTION_SAD_LONELY_DEEP_02', '以前に寂しさを感じた記憶はあるけれど、今は特に寂しくない。話したくないことは省いている'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'sad_lonely_emotion_understanding', value: answers[0][1] },
      slot2: { key: 'sad_lonely_experience_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('不安・悩みは20派生・2掘り下げを指定分類し、事実・経験・予想・心配を区別する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('将来への不安');
    conversation.chooseCategory('EMOTION');
    conversation.chooseSubCategory('EMOTION_4');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '将来への不安');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_4');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_4');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['EMOTION', 'EMOTION_4'], ['EMOTION', 'EMOTION_4'], ['EMOTION', 'EMOTION_2'],
      ['EMOTION', 'EMOTION_1'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_6'],
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['WORK', 'WORK_2'], ['WORK', 'WORK_4'], ['SCHOOL', 'SCHOOL_4'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['MONEY', 'MONEY_7'], ['MONEY', 'MONEY_3'],
      ['AV_MEDIA', 'AV_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ['ACTIVITY', 'ACTIVITY_2'], ['BODY', 'BODY_4'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ているけれど違うと人間さんが感じる/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /不安と苛立ちは別の感情/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /経験が思い当たらなければスキップ/);
    assert.match(derivedPool[5].opening.map((line) => line.text).join(' '), /価値観や性格を決めつけない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /雇用状況を決めつけない/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /話した相手と、不安の対象は別/);
    assert.match(derivedPool[12].opening.map((line) => line.text).join(' '), /契約状況や経済事情を推測しない/);
    assert.match(derivedPool[15].opening.map((line) => line.text).join(' '), /作品での描写と、現実に起きたことは別/);
    assert.match(derivedPool[19].opening.map((line) => line.text).join(' '), /今も続いているとは決めつけない/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /具体的な悩みを話す必要はない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /実際に起きたこと・過去の経験・これからの予想・心配は区別/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /スキップして大丈夫/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `不安コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('将来への不安');
    completionConversation.chooseCategory('EMOTION');
    completionConversation.chooseSubCategory('EMOTION_4');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '将来への不安');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `不安の連想${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['EMOTION_ANXIETY_DEEP_01', '先のことが分からず、準備が足りないかもしれないと考えると不安になることがあると思う'],
      ['EMOTION_ANXIETY_DEEP_02', '今のところ心配している予想が実際に起きたわけではない。具体的な内容はここでは話さない'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'anxiety_worry_understanding', value: answers[0][1] },
      slot2: { key: 'anxiety_experience_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('好き・嫌い・恋愛は20派生・2掘り下げを区別して保存し、22問後に対象外となる', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('好意');
    conversation.chooseCategory('EMOTION');
    conversation.chooseSubCategory('EMOTION_5');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '好意');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_5');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_5');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['EMOTION', 'EMOTION_5'], ['EMOTION', 'EMOTION_5'], ['EMOTION', 'EMOTION_4'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_6'], ['EMOTION', 'EMOTION_7'],
      ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_3'], ['PERSON', 'PERSON_ENTERTAINER'],
      ['GAME_MEDIA', 'GAME_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_1'], ['GAME_MEDIA', 'GAME_MEDIA_1'],
      ['AV_MEDIA', 'AV_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_3'], ['FOOD', 'FOOD_1'],
      ['OBJECT', 'OBJECT_6'], ['PLACE', 'PLACE_2'], ['ACTIVITY', 'ACTIVITY_6'],
      ['WORK', 'WORK_1'], ['EVENT', 'EVENT_1'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /人間さんが感じる/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /明言した価値観だけ/);
    assert.match(derivedPool[7].opening.map((line) => line.text).join(' '), /恋愛関係や相手の気持ちは推測しない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /交際関係などを推測しない/);
    assert.match(derivedPool[9].opening.map((line) => line.text).join(' '), /実在する人とは分けて/);
    assert.match(derivedPool[15].opening.map((line) => line.text).join(' '), /話したくなければスキップ/);
    assert.match(derivedPool[17].opening.map((line) => line.text).join(' '), /実際に続けていることは分けて/);
    assert.match(derivedPool[18].opening.map((line) => line.text).join(' '), /実際に就いている仕事は別/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /相手の気持ちを推測しない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /昔の好みと今の好みは分けて/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /スキップして大丈夫/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `好意コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('好意');
    completionConversation.chooseCategory('EMOTION');
    completionConversation.chooseSubCategory('EMOTION_5');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '好意');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `好き嫌いの連想${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['EMOTION_AFFECTION_DEEP_01', '相手の行動や考え方に共感できたり、自分が大切にしたい点が重なったりすると、好意につながると思う'],
      ['EMOTION_AFFECTION_DEEP_02', '以前は憧れに近い気持ちだったが、今は尊敬として感じている。交際関係の意味ではない'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'affection_preference_understanding', value: answers[0][1] },
      slot2: { key: 'affection_preference_experience_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('性格・価値観は20派生・2掘り下げを分類し、説明と本人の実践を混同しない', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('誠実さ');
    conversation.chooseCategory('EMOTION');
    conversation.chooseSubCategory('EMOTION_6');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '誠実さ');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_6');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_6');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['EMOTION', 'EMOTION_6'], ['EMOTION', 'EMOTION_6'], ['EMOTION', 'EMOTION_6'],
      ['EMOTION', 'EMOTION_7'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_5'],
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
      ['PERSON', 'PERSON_HISTORICAL_CULTURAL'], ['PERSON', 'PERSON_2'], ['WORK', 'WORK_1'],
      ['WORK', 'WORK_2'], ['WORK', 'WORK_5'], ['SCHOOL', 'SCHOOL_1'],
      ['SPORTS', 'SPORTS_DISCIPLINE'], ['ACTIVITY', 'ACTIVITY_3'], ['GAME_MEDIA', 'GAME_MEDIA_4'],
      ['GAME_MEDIA', 'GAME_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_2'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /似ているという関係は人間さんの認識/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /対照的でも必ず矛盾するとは限らない/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /実際に取った行動は分けて/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /本人の性格や意図を断定しない/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /その仕事に就いているとは判断しない/);
    assert.match(derivedPool[16].opening.map((line) => line.text).join(' '), /人間さん自身の価値観は分ける/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /自身がそう行動しているとは決めつけない/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /賛成・反対・一部だけ賛成・判断保留/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /人格を分類したりしない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `価値観コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('誠実さ');
    completionConversation.chooseCategory('EMOTION');
    completionConversation.chooseSubCategory('EMOTION_6');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '誠実さ');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `性格価値観の連想${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['EMOTION_PERSONALITY_VALUE_DEEP_01', '約束を守る、違いを認めるなどの行動に表れる場合があると思う。一般的な例で、自分が常にそうするという意味ではない'],
      ['EMOTION_PERSONALITY_VALUE_DEEP_02', '一部は大切だと思うけれど、状況によって優先順位は変わると思う。これは今の自分の意見で、客観的事実とは別'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'personality_value_behavior_understanding', value: answers[0][1] },
      slot2: { key: 'personality_value_personal_view', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('気持ち・考えのその他は20派生・2掘り下げを持ち、不明な回答を属性として保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('もやもや');
    conversation.chooseCategory('EMOTION');
    conversation.chooseSubCategory('EMOTION_8');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === 'もやもや');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_8');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EMOTION_8');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['EMOTION', 'EMOTION_8'], ['EMOTION', 'EMOTION_8'], ['EMOTION', 'EMOTION_1'],
      ['EMOTION', 'EMOTION_4'], ['EMOTION', 'EMOTION_2'], ['EMOTION', 'EMOTION_7'],
      ['EMOTION', 'EMOTION_6'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['KNOWLEDGE', 'KNOWLEDGE_3'],
      ['KNOWLEDGE', 'KNOWLEDGE_5'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['PERSON', 'PERSON_2'],
      ['WORK', 'WORK_2'], ['SCHOOL', 'SCHOOL_1'], ['AV_MEDIA', 'AV_MEDIA_2'],
      ['GAME_MEDIA', 'GAME_MEDIA_3'], ['AV_MEDIA', 'AV_MEDIA_1'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ['PLACE', 'PLACE_3'], ['NATURE_TIME', 'NATURE_TIME_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.match(derivedPool[0].opening.map((line) => line.text).join(' '), /「分からない」は新しい言葉として登録しない/);
    assert.match(derivedPool[1].closing.map((line) => line.text).join(' '), /似ていると人間さんが感じる/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /何かが間違っているとは判断しない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /病気や心理状態を推測・診断しない/);
    assert.match(derivedPool[12].opening.map((line) => line.text).join(' '), /仕事での経験が思い当たらなければスキップ/);
    assert.match(derivedPool[16].opening.map((line) => line.text).join(' '), /人間さんが感じたものとして/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /「まだ分からない」と答えても大丈夫/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /「分からない」も大切な答え/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /最初の理解と今の理解を順番が分かる形で一緒に残す/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /スキップして大丈夫/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `その他の気持ちコンボ${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('もやもや');
    completionConversation.chooseCategory('EMOTION');
    completionConversation.chooseSubCategory('EMOTION_8');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === 'もやもや');
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, `感覚の連想${index + 1}`)?.ok, true, item.id);
    }
    const answers = [
      ['EMOTION_OTHER_DEEP_01', 'まだ分からない。何かをきっかけにしているかもしれないが、理由は決めつけられないと思う'],
      ['EMOTION_OTHER_DEEP_02', '分かっていることはまだ少ない。最初は疲れかと思ったが、今も理由は分からない。これは診断ではない'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'other_emotion_trigger_understanding', value: answers[0][1] },
      slot2: { key: 'other_emotion_uncertainty_context', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('時間帯は20派生・2掘り下げを持ち、前後関係と習慣を区別して保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('黄昏どき');
    conversation.chooseCategory('NATURE_TIME');
    conversation.chooseSubCategory('NATURE_TIME_3');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '黄昏どき');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_3');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_3');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['NATURE_TIME', 'NATURE_TIME_3'], ['NATURE_TIME', 'NATURE_TIME_3'], ['NATURE_TIME', 'NATURE_TIME_3'],
      ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_1'], ['NATURE_TIME', 'NATURE_TIME_6'],
      ['NATURE_TIME', 'NATURE_TIME_7'], ['NATURE_TIME', 'NATURE_TIME_2'], ['FOOD', 'FOOD_1'],
      ['FOOD', 'FOOD_3'], ['ACTIVITY', 'ACTIVITY_2'], ['AV_MEDIA', 'AV_MEDIA_3'],
      ['AV_MEDIA', 'AV_MEDIA_1'], ['BODY', 'BODY_4'], ['WORK', 'WORK_2'], ['WORK', 'WORK_4'],
      ['PLACE', 'PLACE_2'], ['ANIMAL', 'ANIMAL_2'], ['EVENT', 'EVENT_2'], ['PLACE', 'PLACE_7'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.equal(derivedPool[1].relationQualifier, 'ANSWER_IS_BEFORE_PARENT_TIME_OF_DAY');
    assert.equal(derivedPool[2].relationQualifier, 'ANSWER_IS_AFTER_PARENT_TIME_OF_DAY');
    assert.match(derivedPool[0].opening.map((line) => line.text).join(' '), /境界の時刻は決めない/);
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /時間的に先に来る/);
    assert.match(derivedPool[2].closing.map((line) => line.text).join(' '), /少し後の時間帯/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /一般的な連想か人間さんの習慣か/);
    assert.match(derivedPool[12].opening.map((line) => line.text).join(' '), /主観として記録/);
    assert.match(derivedPool[14].opening.map((line) => line.text).join(' '), /一般的に知っている仕事か、人間さん自身/);
    assert.match(derivedPool[15].opening.map((line) => line.text).join(' '), /勤務時間とは決めつけない/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /一般的なイメージと人間さん自身の印象を分けて/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /普段の習慣と一度だけの出来事は分けて/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /現在時刻や所在地としても扱わない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `時間帯コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('黄昏どき');
    completionConversation.chooseCategory('NATURE_TIME');
    completionConversation.chooseSubCategory('NATURE_TIME_3');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '黄昏どき');
    for (const [index, item] of derivedPool.entries()) {
      const answer = item.id === 'NATURE_TIME_OF_DAY_V2_02'
        ? '午後'
        : item.id === 'NATURE_TIME_OF_DAY_V2_03'
          ? '夜'
          : `時間帯の連想${index + 1}`;
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, answer)?.ok, true, item.id);
    }
    const earlierAnswer = completionConversation.getWordEntries().find((word) => word.surface === '午後');
    const laterAnswer = completionConversation.getWordEntries().find((word) => word.surface === '夜');
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === earlierAnswer.id
      && relation.qualifier === 'NATURE_TIME_OF_DAY_V2_02:ANSWER_IS_BEFORE_PARENT_TIME_OF_DAY'
    )));
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === laterAnswer.id
      && relation.qualifier === 'NATURE_TIME_OF_DAY_V2_03:ANSWER_IS_AFTER_PARENT_TIME_OF_DAY'
    )));
    const answers = [
      ['NATURE_TIME_OF_DAY_DEEP_01', '薄明るさから街の灯りが目立ち始める雰囲気を思い浮かべる。これは印象で、誰にでも同じとは限らない'],
      ['NATURE_TIME_OF_DAY_DEEP_02', '普段は特定の習慣はないが、以前一度、夕方に海辺の景色を見たことを覚えている'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'time_of_day_impression', value: answers[0][1] },
      slot2: { key: 'time_of_day_routine_experience', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('日付・曜日は暦上の期間・前後関係と本人の習慣を区別して保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('月なかのあたり');
    conversation.chooseCategory('NATURE_TIME');
    conversation.chooseSubCategory('NATURE_TIME_4');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '月なかのあたり');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_4');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_4');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_4'],
      ['NATURE_TIME', 'NATURE_TIME_2'], ['NATURE_TIME', 'NATURE_TIME_3'], ['NATURE_TIME', 'NATURE_TIME_1'],
      ['EVENT', 'EVENT_2'], ['EVENT', 'EVENT_1'], ['EVENT', 'EVENT_3'], ['EVENT', 'EVENT_5'],
      ['EVENT', 'EVENT_6'], ['WORK', 'WORK_4'], ['WORK', 'WORK_2'], ['FOOD', 'FOOD_1'],
      ['PLACE', 'PLACE_2'], ['ACTIVITY', 'ACTIVITY_2'], ['ACTIVITY', 'ACTIVITY_1'],
      ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.equal(derivedPool[1].relationQualifier, 'ANSWER_IS_BEFORE_PARENT_CALENDAR_DATE_OR_PERIOD');
    assert.equal(derivedPool[2].relationQualifier, 'ANSWER_IS_AFTER_PARENT_CALENDAR_DATE_OR_PERIOD');
    assert.match(derivedPool[0].opening.map((line) => line.text).join(' '), /曜日、月日、年を含む日付、週末や月末のような期間を区別/);
    assert.match(derivedPool[0].opening.map((line) => line.text).join(' '), /年がない月日に曜日を割り当てたりはしない/);
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /期間の前を一つの日に決めにくい/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /暦上で後にあたる関係/);
    assert.match(derivedPool[5].opening.map((line) => line.text).join(' '), /連想や印象として/);
    assert.match(derivedPool[7].opening.map((line) => line.text).join(' '), /人間さん自身の記念日とは決めつけない/);
    assert.match(derivedPool[11].opening.map((line) => line.text).join(' '), /人間さん自身の休日や勤務日を推測しない/);
    assert.match(derivedPool[15].opening.map((line) => line.text).join(' '), /過去の一度の出来事、これからの予定や希望を区別/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /毎週・毎年の習慣と一度だけの思い出/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `日付・曜日コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('月なかのあたり');
    completionConversation.chooseCategory('NATURE_TIME');
    completionConversation.chooseSubCategory('NATURE_TIME_4');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '月なかのあたり');
    for (const [index, item] of derivedPool.entries()) {
      const answer = item.id === 'NATURE_DATE_WEEKDAY_V2_02'
        ? '月の初めごろ'
        : item.id === 'NATURE_DATE_WEEKDAY_V2_03'
          ? '月の終わりごろ'
          : `日付・曜日の連想${index + 1}`;
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, answer)?.ok, true, item.id);
    }
    const earlierAnswer = completionConversation.getWordEntries().find((word) => word.surface === '月の初めごろ');
    const laterAnswer = completionConversation.getWordEntries().find((word) => word.surface === '月の終わりごろ');
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === earlierAnswer.id
      && relation.qualifier === 'NATURE_DATE_WEEKDAY_V2_02:ANSWER_IS_BEFORE_PARENT_CALENDAR_DATE_OR_PERIOD'
    )));
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === laterAnswer.id
      && relation.qualifier === 'NATURE_DATE_WEEKDAY_V2_03:ANSWER_IS_AFTER_PARENT_CALENDAR_DATE_OR_PERIOD'
    )));
    const answers = [
      ['NATURE_DATE_WEEKDAY_DEEP_01', '年の指定がない月日から曜日は分からない。これは暦の情報ではなく、ぼくが感じる雰囲気の印象だと思う'],
      ['NATURE_DATE_WEEKDAY_DEEP_02', '毎週の習慣は特にない。以前一度、月末に出かけた思い出があるが、今の気分や休日を示すものではない'],
    ];
    for (const [questionId, answer] of answers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'calendar_day_meaning_impression', value: answers[0][1] },
      slot2: { key: 'calendar_day_routine_memory', value: answers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('山・海などの自然は種類・固有地名・生息知識・実体験を分けて保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('高山湿原');
    conversation.chooseCategory('NATURE_TIME');
    conversation.chooseSubCategory('NATURE_TIME_5');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '高山湿原');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_5');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_5');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['NATURE_TIME', 'NATURE_TIME_5'], ['NATURE_TIME', 'NATURE_TIME_5'], ['NATURE_TIME', 'NATURE_TIME_5'],
      ['PLACE', 'PLACE_7'], ['NATURE_TIME', 'NATURE_TIME_6'], ['NATURE_TIME', 'NATURE_TIME_1'],
      ['NATURE_TIME', 'NATURE_TIME_2'], ['ANIMAL', 'ANIMAL_1'], ['ANIMAL', 'ANIMAL_2'], ['ANIMAL', 'ANIMAL_3'],
      ['ANIMAL', 'ANIMAL_4'], ['ANIMAL', 'ANIMAL_5'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_4'],
      ['KNOWLEDGE', 'KNOWLEDGE_2'], ['ACTIVITY', 'ACTIVITY_2'], ['SPORTS', 'SPORTS_DISCIPLINE'], ['OBJECT', 'OBJECT_5'],
      ['AV_MEDIA', 'AV_MEDIA_2'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_SHAPE_OR_FEATURE_TO_PARENT_NATURAL_LANDSCAPE');
    assert.equal(derivedPool[2].relationQualifier, 'GEOGRAPHIC_OR_ENVIRONMENTAL_CONNECTION_TO_PARENT_NATURAL_LANDSCAPE');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /種類ではなく.*具体的な場所/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /訪れたとは判断しない/);
    assert.match(derivedPool[7].opening.map((line) => line.text).join(' '), /知識と.*観察した経験は区別/);
    assert.match(derivedPool[13].opening.map((line) => line.text).join(' '), /確かさを自動で決めない/);
    assert.match(derivedPool[18].opening.map((line) => line.text).join(' '), /現実に存在する場所や自然は区別/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /「行ってみたい」は訪問経験や決まった予定とは扱わない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `自然環境コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('高山湿原');
    completionConversation.chooseCategory('NATURE_TIME');
    completionConversation.chooseSubCategory('NATURE_TIME_5');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '高山湿原');
    const answers = derivedPool.map((item, index) => (
      item.id === 'NATURE_LANDSCAPE_V2_02'
        ? '別の似た湿原'
        : item.id === 'NATURE_LANDSCAPE_V2_03'
          ? '水が流れ込む湖'
          : item.id === 'NATURE_LANDSCAPE_V2_04'
            ? '尾瀬国立公園'
            : `自然環境の連想${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const similarAnswer = completionConversation.getWordEntries().find((word) => word.surface === '別の似た湿原');
    const connectedAnswer = completionConversation.getWordEntries().find((word) => word.surface === '水が流れ込む湖');
    const namedPlace = completionConversation.getWordEntries().find((word) => word.surface === '尾瀬国立公園');
    assert.equal(namedPlace?.subcategory, 'PLACE_7');
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === similarAnswer.id
      && relation.qualifier === 'NATURE_LANDSCAPE_V2_02:SIMILAR_SHAPE_OR_FEATURE_TO_PARENT_NATURAL_LANDSCAPE'
    )));
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === connectedAnswer.id
      && relation.qualifier === 'NATURE_LANDSCAPE_V2_03:GEOGRAPHIC_OR_ENVIRONMENTAL_CONNECTION_TO_PARENT_NATURAL_LANDSCAPE'
    )));
    const deepAnswers = [
      ['NATURE_LANDSCAPE_DEEP_01', '水辺が広がる静かな景色を想像する。これは印象で、どの湿原でも同じ特徴があると断定していない'],
      ['NATURE_LANDSCAPE_DEEP_02', '写真で見たことはあるが、現地には行っていない。いつか訪れたい気持ちはあるが、予定は決まっていない'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'natural_landscape_impression', value: deepAnswers[0][1] },
      slot2: { key: 'natural_landscape_experience_interest', value: deepAnswers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('自然現象は現象・仕組み・前後関係・観察経験を分けて保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('火山灰の降下');
    conversation.chooseCategory('NATURE_TIME');
    conversation.chooseSubCategory('NATURE_TIME_6');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '火山灰の降下');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_6');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_6');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['NATURE_TIME', 'NATURE_TIME_6'], ['NATURE_TIME', 'NATURE_TIME_6'], ['NATURE_TIME', 'NATURE_TIME_6'],
      ['NATURE_TIME', 'NATURE_TIME_1'], ['NATURE_TIME', 'NATURE_TIME_2'], ['NATURE_TIME', 'NATURE_TIME_3'],
      ['NATURE_TIME', 'NATURE_TIME_5'], ['PLACE', 'PLACE_7'], ['KNOWLEDGE', 'KNOWLEDGE_3'],
      ['NATURE_TIME', 'NATURE_TIME_7'], ['TECH', 'TECH_7'], ['OBJECT', 'OBJECT_6'], ['PLACE', 'PLACE_3'],
      ['WORK', 'WORK_1'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
      ['SCHOOL', 'SCHOOL_2'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['ACTIVITY', 'ACTIVITY_2'], ['AV_MEDIA', 'AV_MEDIA_2'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_APPEARANCE_OR_MOTION_TO_PARENT_NATURAL_PHENOMENON');
    assert.equal(derivedPool[2].relationQualifier, 'TEMPORALLY_BEFORE_OR_AFTER_PARENT_NATURAL_PHENOMENON');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /前後の時間的な並び/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /必ず起きる因果関係とは判断しない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /原因・発生条件・仕組みは現象そのものと分ける/);
    assert.match(derivedPool[10].opening.map((line) => line.text).join(' '), /観測用の機器と、防災や備えに使う道具は別/);
    assert.match(derivedPool[11].opening.map((line) => line.text).join(' '), /観測装置は区別/);
    assert.match(derivedPool[18].opening.map((line) => line.text).join(' '), /危険な現象に近づいたり/);
    assert.match(derivedPool[19].opening.map((line) => line.text).join(' '), /映画の描写と現実の現象/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /ニュースや映画で見たこと、誰かから聞いたこと/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /体験していない災害を体験したことにはしない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `自然現象コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('火山灰の降下');
    completionConversation.chooseCategory('NATURE_TIME');
    completionConversation.chooseSubCategory('NATURE_TIME_6');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '火山灰の降下');
    const answers = derivedPool.map((item, index) => (
      item.id === 'NATURE_PHENOMENON_V2_02'
        ? '火山灰の雲'
        : item.id === 'NATURE_PHENOMENON_V2_03'
          ? '噴火のあとに起きることがある土石流'
          : `自然現象の知識${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const similarAnswer = completionConversation.getWordEntries().find((word) => word.surface === '火山灰の雲');
    const sequenceAnswer = completionConversation.getWordEntries().find((word) => word.surface === '噴火のあとに起きることがある土石流');
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === similarAnswer.id
      && relation.qualifier === 'NATURE_PHENOMENON_V2_02:SIMILAR_APPEARANCE_OR_MOTION_TO_PARENT_NATURAL_PHENOMENON'
    )));
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === sequenceAnswer.id
      && relation.qualifier === 'NATURE_PHENOMENON_V2_03:TEMPORALLY_BEFORE_OR_AFTER_PARENT_NATURAL_PHENOMENON'
    )));
    const deepAnswers = [
      ['NATURE_PHENOMENON_DEEP_01', '火山から細かな灰が風に運ばれて地面に積もる現象だと理解しているが、条件や説明に不確かな部分もある'],
      ['NATURE_PHENOMENON_DEEP_02', 'ニュース映像で見たことはあるが、現地で観察したり直接被災したりした経験はない。映像の印象が残っている'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'natural_phenomenon_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'natural_phenomenon_experience_impression', value: deepAnswers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('空・宇宙は天体の種類・関連・観察方法と経験を区別して保存する', () => {
    const conversation = create(memory(), undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('系外惑星');
    conversation.chooseCategory('NATURE_TIME');
    conversation.chooseSubCategory('NATURE_TIME_7');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '系外惑星');
    assert.ok(parent);

    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_7');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_7');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['NATURE_TIME', 'NATURE_TIME_7'], ['NATURE_TIME', 'NATURE_TIME_7'], ['NATURE_TIME', 'NATURE_TIME_7'],
      ['NATURE_TIME', 'NATURE_TIME_6'], ['NATURE_TIME', 'NATURE_TIME_3'], ['NATURE_TIME', 'NATURE_TIME_2'],
      ['PLACE', 'PLACE_7'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['OBJECT', 'OBJECT_5'], ['TECH', 'TECH_7'],
      ['WORK', 'WORK_1'], ['PLACE', 'PLACE_3'], ['PERSON', 'PERSON_SCIENTIST'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
      ['WORK', 'WORK_2'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EVENT', 'EVENT_2'], ['AV_MEDIA', 'AV_MEDIA_2'],
      ['KNOWLEDGE', 'KNOWLEDGE_1'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.equal(derivedPool[1].relationQualifier, 'SAME_KIND_AS_PARENT_SPACE_OBJECT');
    assert.equal(derivedPool[2].relationQualifier, 'GENERALLY_RELATED_TO_PARENT_SPACE_OBJECT');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    assert.match(derivedPool[1].opening.map((line) => line.text).join(' '), /同じ種類/);
    assert.match(derivedPool[2].opening.map((line) => line.text).join(' '), /同じ種類とは限らない/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /いつでも見えるとは限らない/);
    assert.match(derivedPool[8].opening.map((line) => line.text).join(' '), /太陽を肉眼や通常の双眼鏡・望遠鏡で直接見る/);
    assert.match(derivedPool[9].opening.map((line) => line.text).join(' '), /大型の観測装置や宇宙探査機/);
    assert.match(derivedPool[15].opening.map((line) => line.text).join(' '), /星座という天文学上の区分と、そこに結びつく神話や伝承は分けて/);
    assert.match(derivedPool[17].opening.map((line) => line.text).join(' '), /現実の天文学的事実とは扱わない/);
    assert.match(derivedPool[19].opening.map((line) => line.text).join(' '), /現実の天文学上の事実とは区別/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /観測で裏づけられたこと、理論や仮説、まだ分からないこと/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /肉眼や望遠鏡で見たこと、写真・映像や作品で見たこと/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /画像を見たことを実物を直接見た経験とはしない/);

    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, `宇宙コンボ回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const completionConversation = create(memory(), undefined, () => 0.5);
    prepare(completionConversation);
    completionConversation.startWordTeaching();
    completionConversation.submit('系外惑星');
    completionConversation.chooseCategory('NATURE_TIME');
    completionConversation.chooseSubCategory('NATURE_TIME_7');
    completionConversation.choose('WORD_NEUTRAL');
    const completeParent = completionConversation.getWordEntries().find((word) => word.surface === '系外惑星');
    const answers = derivedPool.map((item, index) => (
      item.id === 'NATURE_SPACE_V2_02'
        ? '別の系外惑星'
        : item.id === 'NATURE_SPACE_V2_03'
          ? 'その惑星を回る衛星'
          : `空宇宙の知識${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const sameKindAnswer = completionConversation.getWordEntries().find((word) => word.surface === '別の系外惑星');
    const relatedAnswer = completionConversation.getWordEntries().find((word) => word.surface === 'その惑星を回る衛星');
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === sameKindAnswer.id
      && relation.qualifier === 'NATURE_SPACE_V2_02:SAME_KIND_AS_PARENT_SPACE_OBJECT'
    )));
    assert.ok(completionConversation.getMemoryRelations().some((relation) => (
      relation.subjectId === completeParent.id
      && relation.objectId === relatedAnswer.id
      && relation.qualifier === 'NATURE_SPACE_V2_03:GENERALLY_RELATED_TO_PARENT_SPACE_OBJECT'
    )));
    const deepAnswers = [
      ['NATURE_SPACE_DEEP_01', '観測結果に支えられた説明と理論や仮説は別で、まだ分からない仕組みもあると思う'],
      ['NATURE_SPACE_DEEP_02', '天文台の画像では見たけれど、肉眼で直接見たことはない。宇宙旅行に行きたいとも予定があるとも言っていない'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(completionConversation.submitPersonComboAnswer(completeParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(completionConversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(completionConversation.getPersonWordDeepDive(completeParent.id), {
      slot1: { key: 'space_object_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'space_object_experience_impression', value: deepAnswers[1][1] },
    });
    assert.equal(completionConversation.getPersonWordComboCandidates().some((word) => word.id === completeParent.id), false);
  });

  run('自然・天気・時間のその他は日陰・方角を含む20派生と2掘り下げを分類変更後も保持する', () => {
    for (const surface of ['日陰', '方角']) {
      const sample = create(memory(), undefined, () => 0.5);
      prepare(sample);
      sample.startWordTeaching();
      sample.submit(surface);
      sample.chooseCategory('NATURE_TIME');
      sample.chooseSubCategory('NATURE_TIME_8');
      sample.choose('WORD_NEUTRAL');
      const word = sample.getWordEntries().find((entry) => entry.surface === surface);
      assert.ok(word);
      assert.equal(word.subcategory, 'NATURE_TIME_8');
      assert.equal(PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === word.subcategory).length, 20);
      assert.equal(PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === word.subcategory).length, 2);
    }

    const storage = memory();
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('日陰');
    conversation.chooseCategory('NATURE_TIME');
    conversation.chooseSubCategory('NATURE_TIME_8');
    conversation.choose('WORD_NEUTRAL');
    const parent = conversation.getWordEntries().find((word) => word.surface === '日陰');
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_8');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'NATURE_TIME_8');
    assert.equal(derivedPool.length, 20);
    assert.equal(deepPool.length, 2);
    const expectedCategories = [
      ['NATURE_TIME', 'NATURE_TIME_8'], ['NATURE_TIME', 'NATURE_TIME_8'], ['NATURE_TIME', 'NATURE_TIME_8'],
      ['NATURE_TIME', 'NATURE_TIME_8'], ['NATURE_TIME', 'NATURE_TIME_1'], ['NATURE_TIME', 'NATURE_TIME_2'],
      ['NATURE_TIME', 'NATURE_TIME_3'], ['NATURE_TIME', 'NATURE_TIME_5'], ['NATURE_TIME', 'NATURE_TIME_6'],
      ['NATURE_TIME', 'NATURE_TIME_7'], ['PLACE', 'PLACE_7'], ['KNOWLEDGE', 'KNOWLEDGE_3'],
      ['KNOWLEDGE', 'KNOWLEDGE_6'], ['WORK', 'WORK_1'], ['WORK', 'WORK_2'], ['OBJECT', 'OBJECT_5'],
      ['TECH', 'TECH_5'], ['ACTIVITY', 'ACTIVITY_1'], ['EVENT', 'EVENT_2'], ['AV_MEDIA', 'AV_MEDIA_2'],
    ];
    for (const [index, item] of derivedPool.entries()) {
      assert.deepEqual([item.classification.category, item.classification.subcategory], expectedCategories[index]);
    }
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_MEANING_OR_FEATURE_TO_PARENT_NATURE_OTHER');
    assert.equal(derivedPool[2].relationQualifier, 'OPPOSITE_OR_COMPLEMENTARY_TO_PARENT_NATURE_OTHER');
    assert.equal(derivedPool[3].relationQualifier, 'COMMONLY_USED_WITH_PARENT_NATURE_OTHER');
    assert.equal(new Set(derivedPool.slice(1, 4).map((item) => item.relationQualifier)).size, 3);
    assert.match(derivedPool[6].opening.map((line) => line.text).join(' '), /場所や季節、光の条件/);
    assert.match(derivedPool[11].opening.map((line) => line.text).join(' '), /説明が検証済みであることを分ける/);
    assert.match(derivedPool[15].opening.map((line) => line.text).join(' '), /知っていることと、実際に使用したことは分ける/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /客観的な特徴と、人間さんが感じた印象は分けて/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /前に感じたことを今も同じように感じているとは決めつけない/);

    const initialConversation = create(memory(), undefined, () => 0.5);
    prepare(initialConversation);
    initialConversation.startWordTeaching();
    initialConversation.submit('日陰');
    initialConversation.chooseCategory('NATURE_TIME');
    initialConversation.chooseSubCategory('NATURE_TIME_8');
    initialConversation.choose('WORD_NEUTRAL');
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '日陰');
    const initial = [];
    for (let index = 0; index < 6; index += 1) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `自然のその他回答${index + 1}`)?.ok, true);
      initial.push(question);
    }
    assert.equal(initial.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initial.filter((question) => question.kind === 'deepDive').length, 2);

    const allAnswers = derivedPool.map((item, index) => (
      item.id === 'NATURE_OTHER_V2_02' ? '木陰'
        : item.id === 'NATURE_OTHER_V2_03' ? '日なた'
          : item.id === 'NATURE_OTHER_V2_04' ? '木漏れ日'
            : `自然の特徴回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, allAnswers[index])?.ok, true, item.id);
    }
    const similar = conversation.getWordEntries().find((word) => word.surface === '木陰');
    const opposite = conversation.getWordEntries().find((word) => word.surface === '日なた');
    const related = conversation.getWordEntries().find((word) => word.surface === '木漏れ日');
    for (const [word, id, qualifier] of [
      [similar, 'NATURE_OTHER_V2_02', 'SIMILAR_MEANING_OR_FEATURE_TO_PARENT_NATURE_OTHER'],
      [opposite, 'NATURE_OTHER_V2_03', 'OPPOSITE_OR_COMPLEMENTARY_TO_PARENT_NATURE_OTHER'],
      [related, 'NATURE_OTHER_V2_04', 'COMMONLY_USED_WITH_PARENT_NATURE_OTHER'],
    ]) {
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === parent.id
        && relation.objectId === word.id
        && relation.qualifier === `${id}:${qualifier}`
      )));
    }
    const deepAnswers = [
      ['NATURE_OTHER_DEEP_01', '日陰は光が直接当たりにくい場所を表す言葉だと思う。場所や時刻で変わる印象も含む'],
      ['NATURE_OTHER_DEEP_02', '夏の午後に日陰と日向の違いに気づいたが、別の季節にも同じ印象かは分からない'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'nature_other_feature_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'nature_other_observation_interest', value: deepAnswers[1][1] },
    });
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id), false);

    // 模擬する既存の分類変更は、同じWordEntry IDを保った分類フィールド変更。
    // 意味記憶はwordIdをキーにするので、質問履歴・派生関係・属性は追随する。
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    const savedParent = Object.values(saved.words).find((word) => word.id === parent.id);
    assert.ok(savedParent);
    savedParent.subcategory = 'NATURE_TIME_3';
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved));
    const reclassified = create(storage, undefined, () => 0.5);
    const movedParent = reclassified.getWordEntries().find((word) => word.id === parent.id);
    assert.equal(movedParent.subcategory, 'NATURE_TIME_3');
    assert.deepEqual(reclassified.getPersonDerivedConversationUses()[parent.id], [
      ...derivedPool.map((item) => item.id),
      'NATURE_OTHER_DEEP_01',
      'NATURE_OTHER_DEEP_02',
    ]);
    assert.deepEqual(reclassified.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'nature_other_feature_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'nature_other_observation_interest', value: deepAnswers[1][1] },
    });
    assert.ok(reclassified.getMemoryRelations().some((relation) => relation.objectId === similar.id));
    const nextCategoryQuestion = reclassified.getNextPersonComboQuestion(parent.id);
    assert.ok(nextCategoryQuestion);
    assert.equal(nextCategoryQuestion.subcategory, 'NATURE_TIME_3');
  });

  run('お金は100円玉・米ドルに20派生と2掘り下げを持ち、通貨関係と派生語を保持する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    for (const surface of ['100円玉', '米ドル']) {
      conversation.startWordTeaching();
      conversation.submit(surface);
      conversation.chooseCategory('MONEY');
      conversation.chooseSubCategory('MONEY_1');
      conversation.choose('WORD_NEUTRAL');
    }
    const parents = ['100円玉', '米ドル'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_1');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_1');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['MONEY', 'MONEY_1'], ['MONEY', 'MONEY_1'], ['MONEY', 'MONEY_1'],
        ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_3'], ['MONEY', 'MONEY_6'],
        ['MONEY', 'MONEY_5'], ['MONEY', 'MONEY_4'], ['OBJECT', 'OBJECT_2'],
        ['TECH', 'TECH_7'], ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_3'],
        ['WORK', 'WORK_1'], ['PLACE', 'PLACE_6'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
        ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['SCHOOL', 'SCHOOL_2'],
        ['ACTIVITY', 'ACTIVITY_4'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SAME_KIND_AS_PARENT_MONEY');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_FORM_OR_USE_FROM_PARENT_MONEY');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    assert.match(derivedPool[5].opening.map((line) => line.text).join(' '), /お金そのものと支払いの手段は別/);
    assert.match(derivedPool[13].opening.map((line) => line.text).join(' '), /複数の国/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /通貨の種類・単位・金額・額面・硬貨や紙幣の違い/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /使った、所有した、集めた/);

    const parent = parents[0];
    assert.ok(parent);
    assert.ok(parents[1]);
    for (const [index, word] of parents.entries()) {
      assert.equal(word.subcategory, 'MONEY_1');
      const available = conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id);
      assert.equal(available, true, index === 0 ? '100円玉' : '米ドル');
    }
    const initialConversation = create(memory(), undefined, () => 0.5);
    prepare(initialConversation);
    initialConversation.startWordTeaching();
    initialConversation.submit('米ドル');
    initialConversation.chooseCategory('MONEY');
    initialConversation.chooseSubCategory('MONEY_1');
    initialConversation.choose('WORD_NEUTRAL');
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '米ドル');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `お金の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const answers = derivedPool.map((item, index) => (
      item.id === 'MONEY_V2_01' ? '硬貨'
        : item.id === 'MONEY_V2_02' ? '50円玉'
          : item.id === 'MONEY_V2_03' ? '紙幣'
            : `お金派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const sameKind = conversation.getWordEntries().find((word) => word.surface === '50円玉');
    const differentForm = conversation.getWordEntries().find((word) => word.surface === '紙幣');
    assert.ok(sameKind);
    assert.ok(differentForm);
    for (const [word, id, qualifier] of [
      [sameKind, 'MONEY_V2_02', 'SAME_KIND_AS_PARENT_MONEY'],
      [differentForm, 'MONEY_V2_03', 'DIFFERENT_FORM_OR_USE_FROM_PARENT_MONEY'],
    ]) {
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === parent.id
        && relation.objectId === word.id
        && relation.qualifier === `${id}:${qualifier}`
      )));
    }
    assert.equal(conversation.getWordEntries().find((word) => word.surface === '硬貨')?.subcategory, 'MONEY_1');
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.surface === '硬貨'));

    const deepAnswers = [
      ['MONEY_DEEP_01', '100円玉は額面を表し、円は通貨単位で、硬貨は形の分類だと思う'],
      ['MONEY_DEEP_02', '使ったことがあるが、所有や収集の経験はなく、通貨の仕組みが気になっている'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'money_role_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'money_experience_interest', value: deepAnswers[1][1] },
    });
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id), false);

    // 分類だけを変更しても、同一WordEntry IDに結びつく履歴・関係・掘り下げ記憶は保たれる。
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    const savedParent = Object.values(saved.words).find((word) => word.id === parent.id);
    savedParent.subcategory = 'MONEY_2';
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved));
    const reclassified = create(storage, undefined, () => 0.5);
    assert.deepEqual(reclassified.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'money_role_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'money_experience_interest', value: deepAnswers[1][1] },
    });
    assert.deepEqual(reclassified.getPersonDerivedConversationUses()[parent.id], [
      ...derivedPool.map((item) => item.id), 'MONEY_DEEP_01', 'MONEY_DEEP_02',
    ]);
    assert.ok(reclassified.getMemoryRelations().some((relation) => relation.objectId === sameKind.id));
  });

  run('値段・料金は値上げ・入場料に20派生と2掘り下げを持ち、費用・評価を区別する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    for (const surface of ['値上げ', '入場料']) {
      conversation.startWordTeaching();
      conversation.submit(surface);
      conversation.chooseCategory('MONEY');
      conversation.chooseSubCategory('MONEY_2');
      conversation.choose('WORD_NEUTRAL');
    }
    const parents = ['値上げ', '入場料'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_2');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_2');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_2'],
        ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_1'], ['MONEY', 'MONEY_6'],
        ['MONEY', 'MONEY_3'], ['MONEY', 'MONEY_5'], ['PLACE', 'PLACE_2'],
        ['PLACE', 'PLACE_3'], ['ACTIVITY', 'ACTIVITY_2'], ['FOOD', 'FOOD_1'],
        ['GAME_MEDIA', 'GAME_MEDIA_3'], ['WORK', 'WORK_2'], ['MONEY', 'MONEY_7'],
        ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['OBJECT', 'OBJECT_6'],
        ['EMOTION', 'EMOTION_7'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_PRICE_OR_FEE_TERM_TO_PARENT_PRICE');
    assert.equal(derivedPool[2].relationQualifier, 'CONTRASTING_MEANING_TO_PARENT_PRICE_TERM');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /送料・手数料・税金/);
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /支払総額は決めつけない/);
    assert.match(derivedPool[6].opening.map((line) => line.text).join(' '), /買った・買いたい/);
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /定価・販売価格・割引・追加費用・支払総額/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /購入・不購入、品質、収入や生活水準は推測しない/);

    const parent = parents[0];
    assert.ok(parent);
    assert.ok(parents[1]);
    for (const [index, word] of parents.entries()) {
      assert.equal(word.subcategory, 'MONEY_2');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id), index === 0 ? '値上げ' : '入場料');
    }
    const initialConversation = create(memory(), undefined, () => 0.5);
    prepare(initialConversation);
    initialConversation.startWordTeaching();
    initialConversation.submit('入場料');
    initialConversation.chooseCategory('MONEY');
    initialConversation.chooseSubCategory('MONEY_2');
    initialConversation.choose('WORD_NEUTRAL');
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '入場料');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `値段料金の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const answers = derivedPool.map((item, index) => (
      item.id === 'MONEY_PRICE_V2_01' ? '販売価格'
        : item.id === 'MONEY_PRICE_V2_02' ? '定価'
          : item.id === 'MONEY_PRICE_V2_03' ? '値下げ'
            : item.id === 'MONEY_PRICE_V2_04' ? '送料'
              : `値段料金派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const similar = conversation.getWordEntries().find((word) => word.surface === '定価');
    const contrast = conversation.getWordEntries().find((word) => word.surface === '値下げ');
    const addedCost = conversation.getWordEntries().find((word) => word.surface === '送料');
    assert.ok(similar);
    assert.ok(contrast);
    assert.ok(addedCost);
    for (const [word, id, qualifier] of [
      [similar, 'MONEY_PRICE_V2_02', 'SIMILAR_PRICE_OR_FEE_TERM_TO_PARENT_PRICE'],
      [contrast, 'MONEY_PRICE_V2_03', 'CONTRASTING_MEANING_TO_PARENT_PRICE_TERM'],
    ]) {
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === parent.id
        && relation.objectId === word.id
        && relation.qualifier === `${id}:${qualifier}`
      )));
    }
    assert.equal(addedCost.subcategory, 'MONEY_2');
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === addedCost.id));

    const deepAnswers = [
      ['MONEY_PRICE_DEEP_01', '料金には人件費などが影響する場合があると思うが、入場料の実際の内訳は知らない'],
      ['MONEY_PRICE_DEEP_02', '入場料は少し高めに感じるが、購入経験や施設の品質評価とは別の感想'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'price_pricing_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'price_personal_evaluation', value: deepAnswers[1][1] },
    });
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id), false);
  });

  run('買い物は通販・ウィンドウショッピングを方法として分類し商品・購入状態を分ける', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    for (const surface of ['通販', 'ウィンドウショッピング']) {
      conversation.startWordTeaching();
      conversation.submit(surface);
      conversation.chooseCategory('MONEY');
      conversation.chooseSubCategory('MONEY_3');
      conversation.choose('WORD_NEUTRAL');
    }
    const parents = ['通販', 'ウィンドウショッピング'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_3');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_3');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['MONEY', 'MONEY_3'], ['MONEY', 'MONEY_3'], ['MONEY', 'MONEY_3'], ['MONEY', 'MONEY_3'],
        ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_6'], ['MONEY', 'MONEY_5'], ['MONEY', 'MONEY_7'],
        ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_3'], ['TECH', 'TECH_5'], ['TECH', 'TECH_6'],
        ['OBJECT', 'OBJECT_2'], ['WORK', 'WORK_2'], ['WORK', 'WORK_1'], ['KNOWLEDGE', 'KNOWLEDGE_4'],
        ['FOOD', 'FOOD_1'], ['CLOTHING', 'CLOTHING_1'], ['GAME_MEDIA', 'GAME_MEDIA_3'], ['EMOTION', 'EMOTION_7'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_SHOPPING_METHOD_TO_PARENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_SHOPPING_METHOD_FROM_PARENT');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    assert.equal(derivedPool[3].relationQualifier, 'ACTION_BEFORE_OR_AFTER_PARENT_SHOPPING');
    assert.match(derivedPool[3].opening.map((line) => line.text).join(' '), /検索・比較・注文・予約・購入・受け取り・返品/);
    assert.match(derivedPool[4].opening.map((line) => line.text).join(' '), /商品価格と送料・手数料・税金/);
    assert.match(derivedPool[7].opening.map((line) => line.text).join(' '), /クーリング・オフ/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /見ただけ、比較した、欲しい、必要、検討中、予定、予約、注文、購入、受け取り、見送り/);
    for (const [index, word] of parents.entries()) {
      assert.equal(word.subcategory, 'MONEY_3');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id), index === 0 ? '通販' : 'ウィンドウショッピング');
    }

    const initialConversation = create(memory(), undefined, () => 0.5);
    prepare(initialConversation);
    initialConversation.startWordTeaching();
    initialConversation.submit('ウィンドウショッピング');
    initialConversation.chooseCategory('MONEY');
    initialConversation.chooseSubCategory('MONEY_3');
    initialConversation.choose('WORD_NEUTRAL');
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === 'ウィンドウショッピング');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `買い物の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const parent = parents[0];
    const answers = derivedPool.map((item, index) => (
      item.id === 'MONEY_SHOPPING_V2_01' ? '店頭購入'
        : item.id === 'MONEY_SHOPPING_V2_02' ? '予約購入'
          : item.id === 'MONEY_SHOPPING_V2_03' ? 'まとめ買い'
            : item.id === 'MONEY_SHOPPING_V2_04' ? '商品の比較'
              : item.id === 'MONEY_SHOPPING_V2_05' ? '送料'
        : item.id === 'MONEY_SHOPPING_V2_06' ? 'クレジットカード払い'
                  : item.id === 'MONEY_SHOPPING_V2_07' ? 'ポイント利用'
                    : item.id === 'MONEY_SHOPPING_V2_08' ? '返品条件'
                      : item.id === 'MONEY_SHOPPING_V2_09' ? 'スーパーマーケット'
                        : item.id === 'MONEY_SHOPPING_V2_10' ? 'ショッピングモール'
                          : item.id === 'MONEY_SHOPPING_V2_11' ? '通販アプリ'
                            : item.id === 'MONEY_SHOPPING_V2_12' ? '通販サイト'
                              : item.id === 'MONEY_SHOPPING_V2_13' ? '買い物かご'
                                : item.id === 'MONEY_SHOPPING_V2_14' ? '品出し'
                                  : item.id === 'MONEY_SHOPPING_V2_15' ? '販売員'
                                    : item.id === 'MONEY_SHOPPING_V2_16' ? '通信販売の表示ルール'
                                      : item.id === 'MONEY_SHOPPING_V2_17' ? '食パン'
                                        : item.id === 'MONEY_SHOPPING_V2_18' ? 'コート'
                                          : item.id === 'MONEY_SHOPPING_V2_19' ? 'どうぶつゲーム'
                                            : item.id === 'MONEY_SHOPPING_V2_20' ? '必要なものを予算内で選びたい'
                                              : `買い物派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const similar = conversation.getWordEntries().find((word) => word.surface === '予約購入');
    const different = conversation.getWordEntries().find((word) => word.surface === 'まとめ買い');
    const priorAction = conversation.getWordEntries().find((word) => word.surface === '商品の比較');
    for (const [word, id, qualifier] of [
      [similar, 'MONEY_SHOPPING_V2_02', 'SIMILAR_SHOPPING_METHOD_TO_PARENT'],
      [different, 'MONEY_SHOPPING_V2_03', 'DIFFERENT_SHOPPING_METHOD_FROM_PARENT'],
      [priorAction, 'MONEY_SHOPPING_V2_04', 'ACTION_BEFORE_OR_AFTER_PARENT_SHOPPING'],
    ]) {
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === parent.id
        && relation.objectId === word.id
        && relation.qualifier === `${id}:${qualifier}`
      )));
    }
    for (const [surface, category, subcategory] of [
      ['送料', 'MONEY', 'MONEY_2'], ['クレジットカード払い', 'MONEY', 'MONEY_6'],
      ['スーパーマーケット', 'PLACE', 'PLACE_2'], ['通販アプリ', 'TECH', 'TECH_5'],
      ['食パン', 'FOOD', 'FOOD_1'], ['コート', 'CLOTHING', 'CLOTHING_1'],
      ['どうぶつゲーム', 'GAME_MEDIA', 'GAME_MEDIA_3'],
    ]) {
      const derivedWord = conversation.getWordEntries().find((word) => word.surface === surface);
      assert.deepEqual([derivedWord?.category, derivedWord?.subcategory], [category, subcategory], `${surface}: ${JSON.stringify(derivedWord)}`);
    }
    const shippingFee = conversation.getWordEntries().find((word) => word.surface === '送料');
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === shippingFee.id));
    const deepAnswers = [
      ['MONEY_SHOPPING_DEEP_01', '通販は店舗へ行かず注文して届けてもらう方法だと思う'],
      ['MONEY_SHOPPING_DEEP_02', '通販は便利だと感じるが、服は実物を見て買いたい。欲しい気持ちはあるが、実際の注文や購入経験とは別'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'shopping_method_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'shopping_experience_impression', value: deepAnswers[1][1] },
    });
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id), false);
  });

  run('給料・収入は時給・売上に20派生と2掘り下げを用意し、回答文字列を記録する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        時給: {
          id: 'income_hourly', surface: '時給', category: 'MONEY', subcategory: 'MONEY_4',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'income_hourly', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('売上');
    conversation.chooseCategory('MONEY');
    conversation.chooseSubCategory('MONEY_4');
    conversation.choose('WORD_NEUTRAL');
    const parents = ['時給', '売上'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_4');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_4');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['MONEY', 'MONEY_4'], ['MONEY', 'MONEY_4'], ['MONEY', 'MONEY_4'], ['MONEY', 'MONEY_4'],
        ['MONEY', 'MONEY_6'], ['WORK', 'WORK_4'], ['WORK', 'WORK_1'], ['WORK', 'WORK_2'],
        ['WORK', 'WORK_3'], ['WORK', 'WORK_5'], ['MONEY', 'MONEY_7'], ['KNOWLEDGE', 'KNOWLEDGE_4'],
        ['OBJECT', 'OBJECT_6'], ['TECH', 'TECH_5'], ['MONEY', 'MONEY_5'], ['MONEY', 'MONEY_2'],
        ['TECH', 'TECH_7'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_7'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_INCOME_TYPE_TO_PARENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_CALCULATION_METHOD_FROM_PARENT');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    for (const word of parents) {
      assert.equal(word.subcategory, 'MONEY_4');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const initialConversation = create(memory(), undefined, () => 0.5);
    prepare(initialConversation);
    initialConversation.startWordTeaching();
    initialConversation.submit('売上');
    initialConversation.chooseCategory('MONEY');
    initialConversation.chooseSubCategory('MONEY_4');
    initialConversation.choose('WORD_NEUTRAL');
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '売上');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `収入の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const parent = parents[0];
    const answers = derivedPool.map((item, index) => (
      item.id === 'MONEY_INCOME_V2_01' ? '月給'
        : item.id === 'MONEY_INCOME_V2_02' ? '賞与'
          : item.id === 'MONEY_INCOME_V2_03' ? '歩合給'
            : item.id === 'MONEY_INCOME_V2_04' ? '基本給'
              : `収入派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const monthlySalary = conversation.getWordEntries().find((word) => word.surface === '月給');
    const similarIncome = conversation.getWordEntries().find((word) => word.surface === '賞与');
    const differentCalculation = conversation.getWordEntries().find((word) => word.surface === '歩合給');
    assert.deepEqual([monthlySalary?.category, monthlySalary?.subcategory], ['MONEY', 'MONEY_4']);
    assert.ok(conversation.getPersonWordComboCandidates().some((word) => word.id === monthlySalary.id));
    for (const [word, id, qualifier] of [
      [similarIncome, 'MONEY_INCOME_V2_02', 'SIMILAR_INCOME_TYPE_TO_PARENT'],
      [differentCalculation, 'MONEY_INCOME_V2_03', 'DIFFERENT_CALCULATION_METHOD_FROM_PARENT'],
    ]) {
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === parent.id
        && relation.objectId === word.id
        && relation.qualifier === `${id}:${qualifier}`
      )));
    }
    const deepAnswers = [
      ['MONEY_INCOME_DEEP_01', '時間に応じて決まる仕組みだと思う。具体的な条件は分からない'],
      ['MONEY_INCOME_DEEP_02', '収入については関心があるが、個人の金額は記録しないでほしい'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'income_mechanism_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'income_personal_view', value: deepAnswers[1][1] },
    });
    assert.equal(conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id), false);
  });

  run('貯金・節約は貯金・節電に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        貯金: {
          id: 'saving_deposit', surface: '貯金', category: 'MONEY', subcategory: 'MONEY_5',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'saving_deposit', mentionCount: 1,
        },
        節電: {
          id: 'saving_power', surface: '節電', category: 'MONEY', subcategory: 'MONEY_5',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'saving_power', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['貯金', '節電'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_5');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_5');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['MONEY', 'MONEY_5'], ['MONEY', 'MONEY_5'], ['MONEY', 'MONEY_5'], ['MONEY', 'MONEY_5'],
        ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_1'], ['MONEY', 'MONEY_4'], ['MONEY', 'MONEY_3'],
        ['MONEY', 'MONEY_6'], ['MONEY', 'MONEY_7'], ['OBJECT', 'OBJECT_2'], ['TECH', 'TECH_5'],
        ['TECH', 'TECH_2'], ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_3'], ['FOOD', 'FOOD_4'],
        ['FOOD', 'FOOD_1'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_7'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_SAVING_METHOD_TO_PARENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_SAVING_METHOD_FROM_PARENT');
    assert.equal(derivedPool[3].relationQualifier, 'COMBINABLE_SAVING_METHOD_WITH_PARENT');
    assert.match(deepPool[0].opening.map((line) => line.text).join(' '), /どんなふうにお金を貯めたり節約したりするの/);
    assert.match(deepPool[1].opening.map((line) => line.text).join(' '), /やったことや思うことはある/);
    for (const [index, parent] of parents.entries()) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'MONEY_5');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id), index === 0 ? '貯金' : '節電');
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        貯金: {
          id: 'saving_deposit', surface: '貯金', category: 'MONEY', subcategory: 'MONEY_5',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'saving_deposit', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '貯金');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `貯金の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const parent = parents[1];
    const answers = derivedPool.map((item, index) => (
      item.id === 'MONEY_SAVING_V2_01' ? '積立'
        : item.id === 'MONEY_SAVING_V2_02' ? '定期預金'
          : item.id === 'MONEY_SAVING_V2_03' ? '買い控え'
            : item.id === 'MONEY_SAVING_V2_04' ? '節水'
              : item.id === 'MONEY_SAVING_V2_05' ? '電気代'
                : `貯金節約派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const electricBill = conversation.getWordEntries().find((word) => word.surface === '電気代');
    assert.deepEqual([electricBill?.category, electricBill?.subcategory], ['MONEY', 'MONEY_2']);
    assert.ok(conversation.getMemoryRelations().some((relation) => (
      relation.subjectId === parent.id
      && relation.objectId === electricBill.id
      && relation.qualifier === 'MONEY_SAVING_V2_05'
    )));
    assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === electricBill.id));
    const deepAnswers = [
      ['MONEY_SAVING_DEEP_01', '毎月決めた分を別の口座に移す方法だと思う。'],
      ['MONEY_SAVING_DEEP_02', '節電は意識しているけれど、いつも実践できるとは限らない。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'saving_method_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'saving_experience_impression', value: deepAnswers[1][1] },
    });
  });

  run('支払いはQRコード決済・銀行振込に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        QRコード決済: {
          id: 'payment_qr', surface: 'QRコード決済', category: 'MONEY', subcategory: 'MONEY_6',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'payment_qr', mentionCount: 1,
        },
        銀行振込: {
          id: 'payment_bank_transfer', surface: '銀行振込', category: 'MONEY', subcategory: 'MONEY_6',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'payment_bank_transfer', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['QRコード決済', '銀行振込'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_6');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_6');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['MONEY', 'MONEY_6'], ['MONEY', 'MONEY_6'], ['MONEY', 'MONEY_6'], ['MONEY', 'MONEY_6'],
        ['MONEY', 'MONEY_1'], ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_3'], ['MONEY', 'MONEY_7'],
        ['MONEY', 'MONEY_5'], ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_3'], ['OBJECT', 'OBJECT_2'],
        ['TECH', 'TECH_7'], ['TECH', 'TECH_5'], ['TECH', 'TECH_6'], ['WORK', 'WORK_2'],
        ['WORK', 'WORK_1'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_7'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_PAYMENT_METHOD_TO_PARENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_PAYMENT_METHOD_FROM_PARENT');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'MONEY_6');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        QRコード決済: {
          id: 'payment_qr', surface: 'QRコード決済', category: 'MONEY', subcategory: 'MONEY_6',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'payment_qr', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === 'QRコード決済');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `支払いの初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const qrParent = parents[0];
    const qrAnswers = derivedPool.map((item, index) => (
      item.id === 'MONEY_PAYMENT_V2_01' ? '電子マネー' : `QR決済派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(qrParent.id, item.id, qrAnswers[index])?.ok, true, item.id);
    }
    const electronicMoney = conversation.getWordEntries().find((word) => word.surface === '電子マネー');
    assert.deepEqual([electronicMoney?.category, electronicMoney?.subcategory], ['MONEY', 'MONEY_6']);
    assert.ok(conversation.getMemoryRelations().some((relation) => (
      relation.subjectId === qrParent.id
      && relation.objectId === electronicMoney.id
      && relation.qualifier === 'MONEY_PAYMENT_V2_01'
    )));
    assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === electronicMoney.id));

    const transferParent = parents[1];
    const transferAnswers = derivedPool.map((item, index) => (
      item.id === 'MONEY_PAYMENT_V2_06' ? '振込手数料' : `銀行振込派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(transferParent.id, item.id, transferAnswers[index])?.ok, true, item.id);
    }
    const transferFee = conversation.getWordEntries().find((word) => word.surface === '振込手数料');
    assert.deepEqual([transferFee?.category, transferFee?.subcategory], ['MONEY', 'MONEY_2']);
    assert.ok(conversation.getMemoryRelations().some((relation) => (
      relation.subjectId === transferParent.id
      && relation.objectId === transferFee.id
      && relation.qualifier === 'MONEY_PAYMENT_V2_06'
    )));
    assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === transferFee.id));

    const deepAnswers = [
      ['MONEY_PAYMENT_DEEP_01', '代金を電子的に送る方法だと思う。'],
      ['MONEY_PAYMENT_DEEP_02', '使ったことがあり、手軽に感じた。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(qrParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(qrParent.id), {
      slot1: { key: 'payment_method_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'payment_experience_impression', value: deepAnswers[1][1] },
    });
  });

  run('契約・保険は火災保険・月額契約に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        火災保険: {
          id: 'contract_fire_insurance', surface: '火災保険', category: 'MONEY', subcategory: 'MONEY_7',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'contract_fire_insurance', mentionCount: 1,
        },
        月額契約: {
          id: 'contract_monthly', surface: '月額契約', category: 'MONEY', subcategory: 'MONEY_7',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'contract_monthly', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['火災保険', '月額契約'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_7');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_7');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['MONEY', 'MONEY_7'], ['MONEY', 'MONEY_7'], ['MONEY', 'MONEY_7'], ['MONEY', 'MONEY_7'],
        ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_6'], ['MONEY', 'MONEY_3'], ['MONEY', 'MONEY_5'],
        ['WORK', 'WORK_5'], ['WORK', 'WORK_3'], ['WORK', 'WORK_1'], ['OBJECT', 'OBJECT_6'],
        ['TECH', 'TECH_5'], ['PLACE', 'PLACE_3'], ['VEHICLE', 'VEHICLE_2'], ['BODY', 'BODY_3'],
        ['PLACE', 'PLACE_1'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_7'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_CONTRACT_OR_INSURANCE_TO_PARENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_CONTRACT_OR_INSURANCE_FROM_PARENT');
    assert.notEqual(derivedPool[1].relationQualifier, derivedPool[2].relationQualifier);
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'MONEY_7');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        火災保険: {
          id: 'contract_fire_insurance', surface: '火災保険', category: 'MONEY', subcategory: 'MONEY_7',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'contract_fire_insurance', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '火災保険');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `契約保険の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const parent = parents[0];
    const answers = derivedPool.map((item, index) => (
      item.id === 'MONEY_CONTRACT_V2_01' ? '地震保険'
        : item.id === 'MONEY_CONTRACT_V2_05' ? '保険料'
          : `火災保険派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const earthquakeInsurance = conversation.getWordEntries().find((word) => word.surface === '地震保険');
    const insurancePremium = conversation.getWordEntries().find((word) => word.surface === '保険料');
    assert.deepEqual([earthquakeInsurance?.category, earthquakeInsurance?.subcategory], ['MONEY', 'MONEY_7']);
    assert.deepEqual([insurancePremium?.category, insurancePremium?.subcategory], ['MONEY', 'MONEY_2']);
    for (const [word, questionId] of [
      [earthquakeInsurance, 'MONEY_CONTRACT_V2_01'],
      [insurancePremium, 'MONEY_CONTRACT_V2_05'],
    ]) {
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === parent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }
    const deepAnswers = [
      ['MONEY_CONTRACT_DEEP_01', '契約は当事者同士が条件を決めて約束することだと思う。'],
      ['MONEY_CONTRACT_DEEP_02', '保険の内容について調べたことがある。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'contract_insurance_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'contract_insurance_experience_impression', value: deepAnswers[1][1] },
    });
  });

  run('お金・買い物のその他はポイント・レシートに20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        ポイント: {
          id: 'money_other_points', surface: 'ポイント', category: 'MONEY', subcategory: 'MONEY_8',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'money_other_points', mentionCount: 1,
        },
        レシート: {
          id: 'money_other_receipt', surface: 'レシート', category: 'MONEY', subcategory: 'MONEY_8',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'money_other_receipt', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['ポイント', 'レシート'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_8');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'MONEY_8');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['MONEY', 'MONEY_8'], ['MONEY', 'MONEY_8'], ['MONEY', 'MONEY_8'], ['MONEY', 'MONEY_8'],
        ['MONEY', 'MONEY_1'], ['MONEY', 'MONEY_2'], ['MONEY', 'MONEY_3'], ['MONEY', 'MONEY_6'],
        ['MONEY', 'MONEY_5'], ['MONEY', 'MONEY_7'], ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_3'],
        ['OBJECT', 'OBJECT_2'], ['TECH', 'TECH_7'], ['TECH', 'TECH_5'], ['TECH', 'TECH_6'],
        ['WORK', 'WORK_2'], ['KNOWLEDGE', 'KNOWLEDGE_4'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['EMOTION', 'EMOTION_7'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_ROLE_TO_PARENT_SHOPPING_OTHER');
    assert.equal(derivedPool[2].relationQualifier, 'USED_WITH_PARENT_SHOPPING_OTHER');
    assert.equal(derivedPool[3].relationQualifier, 'ALTERNATIVE_TO_PARENT_SHOPPING_OTHER');
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'MONEY_8');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        ポイント: {
          id: 'money_other_points', surface: 'ポイント', category: 'MONEY', subcategory: 'MONEY_8',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'money_other_points', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === 'ポイント');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `ポイントの初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const pointsParent = parents[0];
    const pointsAnswers = derivedPool.map((item, index) => (
      item.id === 'MONEY_OTHER_V2_01' ? 'クーポン'
        : item.id === 'MONEY_OTHER_V2_06' ? '割引'
          : `ポイント派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(pointsParent.id, item.id, pointsAnswers[index])?.ok, true, item.id);
    }
    const coupon = conversation.getWordEntries().find((word) => word.surface === 'クーポン');
    const discount = conversation.getWordEntries().find((word) => word.surface === '割引');
    assert.deepEqual([coupon?.category, coupon?.subcategory], ['MONEY', 'MONEY_8']);
    assert.deepEqual([discount?.category, discount?.subcategory], ['MONEY', 'MONEY_2']);
    for (const [word, questionId] of [[coupon, 'MONEY_OTHER_V2_01'], [discount, 'MONEY_OTHER_V2_06']]) {
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === pointsParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const receiptParent = parents[1];
    const receiptAnswers = derivedPool.map((item, index) => (
      item.id === 'MONEY_OTHER_V2_14' ? 'レジ' : `レシート派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(receiptParent.id, item.id, receiptAnswers[index])?.ok, true, item.id);
    }
    const register = conversation.getWordEntries().find((word) => word.surface === 'レジ');
    assert.deepEqual([register?.category, register?.subcategory], ['TECH', 'TECH_7']);
    assert.ok(conversation.getMemoryRelations().some((relation) => (
      relation.subjectId === receiptParent.id
      && relation.objectId === register.id
      && relation.qualifier === 'MONEY_OTHER_V2_14'
    )));
    assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === register.id));

    const deepAnswers = [
      ['MONEY_OTHER_DEEP_01', 'ポイントは、買い物で使うと値引きなどにつながる場合がある言葉だと思う。'],
      ['MONEY_OTHER_DEEP_02', 'ポイントを受け取ったことはあるが、制度の詳細は知らない。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(pointsParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(pointsParent.id), {
      slot1: { key: 'shopping_other_usage_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'shopping_other_experience_impression', value: deepAnswers[1][1] },
    });
  });

  run('誕生日・記念日は誕生日・結婚記念日に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        誕生日: {
          id: 'event_birthday', surface: '誕生日', category: 'EVENT', subcategory: 'EVENT_1',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_birthday', mentionCount: 1,
        },
        結婚記念日: {
          id: 'event_anniversary', surface: '結婚記念日', category: 'EVENT', subcategory: 'EVENT_1',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'event_anniversary', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['誕生日', '結婚記念日'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_1');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_1');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['EVENT', 'EVENT_1'], ['EVENT', 'EVENT_1'], ['EVENT', 'EVENT_1'], ['NATURE_TIME', 'NATURE_TIME_4'],
        ['NATURE_TIME', 'NATURE_TIME_2'], ['EVENT', 'EVENT_2'], ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_2'],
        ['FOOD', 'FOOD_3'], ['OBJECT', 'OBJECT_3'], ['OBJECT', 'OBJECT_6'], ['TECH', 'TECH_4'],
        ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_3'], ['ACTIVITY', 'ACTIVITY_1'], ['ACTIVITY', 'ACTIVITY_2'],
        ['AV_MEDIA', 'AV_MEDIA_1'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['MONEY', 'MONEY_3'], ['EMOTION', 'EMOTION_1'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_ANNIVERSARY_TO_PARENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_EVENT_ANNIVERSARY_FROM_PARENT');
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'EVENT_1');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        誕生日: {
          id: 'event_birthday', surface: '誕生日', category: 'EVENT', subcategory: 'EVENT_1',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_birthday', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '誕生日');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `誕生日の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const parent = parents[0];
    const answers = derivedPool.map((item, index) => (
      item.id === 'EVENT_ANNIVERSARY_V2_08' ? 'バースデーケーキ'
        : item.id === 'EVENT_ANNIVERSARY_V2_10' ? 'メッセージカード'
          : item.id === 'EVENT_ANNIVERSARY_V2_06' ? 'お月見'
            : `誕生日派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, answers[index])?.ok, true, item.id);
    }
    const expectedDerived = [
      ['バースデーケーキ', 'FOOD', 'FOOD_2', 'EVENT_ANNIVERSARY_V2_08'],
      ['メッセージカード', 'OBJECT', 'OBJECT_3', 'EVENT_ANNIVERSARY_V2_10'],
      ['お月見', 'EVENT', 'EVENT_2', 'EVENT_ANNIVERSARY_V2_06'],
    ];
    for (const [surface, category, subcategory, questionId] of expectedDerived) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === parent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      if (subcategory !== 'EVENT_2') {
        assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id), surface);
      }
    }
    const deepAnswers = [
      ['EVENT_ANNIVERSARY_DEEP_01', '誕生日は、その人が生まれた日を記念する日だと思う。'],
      ['EVENT_ANNIVERSARY_DEEP_02', '毎年お祝いすることもあるけれど、特別な思い出があるかは別の話。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(parent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'anniversary_meaning_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'anniversary_memory_impression', value: deepAnswers[1][1] },
    });
  });

  run('季節の行事は七夕・お正月に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        七夕: {
          id: 'event_tanabata', surface: '七夕', category: 'EVENT', subcategory: 'EVENT_2',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_tanabata', mentionCount: 1,
        },
        お正月: {
          id: 'event_new_year', surface: 'お正月', category: 'EVENT', subcategory: 'EVENT_2',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'event_new_year', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['七夕', 'お正月'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_2');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_2');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['EVENT', 'EVENT_2'], ['EVENT', 'EVENT_2'], ['EVENT', 'EVENT_2'], ['EVENT', 'EVENT_3'],
        ['NATURE_TIME', 'NATURE_TIME_2'], ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_1'], ['NATURE_TIME', 'NATURE_TIME_7'],
        ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_2'], ['FOOD', 'FOOD_3'], ['ANIMAL', 'ANIMAL_5'],
        ['OBJECT', 'OBJECT_6'], ['CLOTHING', 'CLOTHING_1'], ['PLACE', 'PLACE_3'], ['PLACE', 'PLACE_5'],
        ['ACTIVITY', 'ACTIVITY_1'], ['AV_MEDIA', 'AV_MEDIA_1'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['MONEY', 'MONEY_3'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SAME_SEASON_AS_PARENT_SEASONAL_EVENT');
    assert.equal(derivedPool[2].relationQualifier, 'SIMILAR_ATMOSPHERE_TO_PARENT_SEASONAL_EVENT');
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'EVENT_2');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        七夕: {
          id: 'event_tanabata', surface: '七夕', category: 'EVENT', subcategory: 'EVENT_2',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_tanabata', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '七夕');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `七夕の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const tanabataParent = parents[0];
    const tanabataAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_SEASONAL_V2_12' ? '笹'
        : item.id === 'EVENT_SEASONAL_V2_08' ? '天の川'
          : `七夕派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(tanabataParent.id, item.id, tanabataAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['笹', 'ANIMAL', 'ANIMAL_5', 'EVENT_SEASONAL_V2_12'],
      ['天の川', 'NATURE_TIME', 'NATURE_TIME_7', 'EVENT_SEASONAL_V2_08'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === tanabataParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const newYearParent = parents[1];
    const newYearAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_SEASONAL_V2_09' ? 'おせち料理'
        : item.id === 'EVENT_SEASONAL_V2_17' ? '福笑い'
          : `お正月派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(newYearParent.id, item.id, newYearAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['おせち料理', 'FOOD', 'FOOD_1', 'EVENT_SEASONAL_V2_09'],
      ['福笑い', 'ACTIVITY', 'ACTIVITY_1', 'EVENT_SEASONAL_V2_17'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === newYearParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const deepAnswers = [
      ['EVENT_SEASONAL_DEEP_01', '季節に合わせて行事をしたり、食べ物を用意したりする日だと思う。'],
      ['EVENT_SEASONAL_DEEP_02', '七夕飾りを見たことがある。行事の感じ方は人によって違うと思う。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(tanabataParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(tanabataParent.id), {
      slot1: { key: 'seasonal_event_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'seasonal_event_memory_impression', value: deepAnswers[1][1] },
    });
  });

  run('お祭り・イベントは花火大会・音楽フェスに20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        花火大会: {
          id: 'event_fireworks', surface: '花火大会', category: 'EVENT', subcategory: 'EVENT_3',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_fireworks', mentionCount: 1,
        },
        音楽フェス: {
          id: 'event_music_festival', surface: '音楽フェス', category: 'EVENT', subcategory: 'EVENT_3',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'event_music_festival', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['花火大会', '音楽フェス'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_3');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_3');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['EVENT', 'EVENT_3'], ['EVENT', 'EVENT_3'], ['EVENT', 'EVENT_3'], ['EVENT', 'EVENT_2'],
        ['NATURE_TIME', 'NATURE_TIME_2'], ['NATURE_TIME', 'NATURE_TIME_4'], ['PLACE', 'PLACE_5'], ['PLACE', 'PLACE_3'],
        ['PLACE', 'PLACE_7'], ['PLACE', 'PLACE_2'], ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_2'],
        ['CLOTHING', 'CLOTHING_1'], ['OBJECT', 'OBJECT_6'], ['ACTIVITY', 'ACTIVITY_1'], ['AV_MEDIA', 'AV_MEDIA_1'],
        ['WORK', 'WORK_1'], ['WORK', 'WORK_2'], ['MONEY', 'MONEY_2'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_TO_PARENT_FESTIVAL_EVENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_ENJOYMENT_STYLE_FROM_PARENT_FESTIVAL_EVENT');
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'EVENT_3');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        花火大会: {
          id: 'event_fireworks', surface: '花火大会', category: 'EVENT', subcategory: 'EVENT_3',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_fireworks', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '花火大会');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `イベント初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const fireworksParent = parents[0];
    const fireworksAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_FESTIVAL_V2_13' ? '浴衣'
        : item.id === 'EVENT_FESTIVAL_V2_12' ? 'りんご飴'
          : `花火大会派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(fireworksParent.id, item.id, fireworksAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['浴衣', 'CLOTHING', 'CLOTHING_1', 'EVENT_FESTIVAL_V2_13'],
      ['りんご飴', 'FOOD', 'FOOD_2', 'EVENT_FESTIVAL_V2_12'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === fireworksParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const musicFestivalParent = parents[1];
    const musicFestivalAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_FESTIVAL_V2_16' ? 'ロック'
        : item.id === 'EVENT_FESTIVAL_V2_19' ? 'チケット代'
          : `音楽フェス派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(musicFestivalParent.id, item.id, musicFestivalAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['ロック', 'AV_MEDIA', 'AV_MEDIA_1', 'EVENT_FESTIVAL_V2_16'],
      ['チケット代', 'MONEY', 'MONEY_2', 'EVENT_FESTIVAL_V2_19'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === musicFestivalParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const deepAnswers = [
      ['EVENT_FESTIVAL_DEEP_01', '屋台を見たり、音楽を聴いたりして楽しむイベントだと思う。'],
      ['EVENT_FESTIVAL_DEEP_02', '実際に行ったこともあるし、会場の雰囲気が好き。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(fireworksParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(fireworksParent.id), {
      slot1: { key: 'festival_event_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'festival_event_experience_impression', value: deepAnswers[1][1] },
    });
  });

  run('結婚・葬式などは結婚式・葬式に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        結婚式: {
          id: 'event_wedding', surface: '結婚式', category: 'EVENT', subcategory: 'EVENT_4',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_wedding', mentionCount: 1,
        },
        葬式: {
          id: 'event_funeral', surface: '葬式', category: 'EVENT', subcategory: 'EVENT_4',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'event_funeral', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['結婚式', '葬式'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_4');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_4');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['EVENT', 'EVENT_4'], ['EVENT', 'EVENT_4'], ['EVENT', 'EVENT_4'], ['EVENT', 'EVENT_1'],
        ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_2'], ['PLACE', 'PLACE_3'], ['PLACE', 'PLACE_2'],
        ['CLOTHING', 'CLOTHING_1'], ['CLOTHING', 'CLOTHING_5'], ['ANIMAL', 'ANIMAL_5'], ['OBJECT', 'OBJECT_6'],
        ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_2'], ['FOOD', 'FOOD_3'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
        ['MONEY', 'MONEY_2'], ['WORK', 'WORK_1'], ['WORK', 'WORK_2'], ['AV_MEDIA', 'AV_MEDIA_1'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_TO_PARENT_LIFE_EVENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_LIFE_MILESTONE_FROM_PARENT');
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'EVENT_4');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        結婚式: {
          id: 'event_wedding', surface: '結婚式', category: 'EVENT', subcategory: 'EVENT_4',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_wedding', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '結婚式');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `節目行事の初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const weddingParent = parents[0];
    const weddingAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_LIFE_V2_09' ? 'ウェディングドレス'
        : item.id === 'EVENT_LIFE_V2_10' ? '結婚指輪'
          : `結婚式派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(weddingParent.id, item.id, weddingAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['ウェディングドレス', 'CLOTHING', 'CLOTHING_1', 'EVENT_LIFE_V2_09'],
      ['結婚指輪', 'CLOTHING', 'CLOTHING_5', 'EVENT_LIFE_V2_10'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === weddingParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const funeralParent = parents[1];
    const funeralAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_LIFE_V2_09' ? '喪服'
        : item.id === 'EVENT_LIFE_V2_07' ? '斎場'
          : `葬式派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(funeralParent.id, item.id, funeralAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['喪服', 'CLOTHING', 'CLOTHING_1', 'EVENT_LIFE_V2_09'],
      ['斎場', 'PLACE', 'PLACE_3', 'EVENT_LIFE_V2_07'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === funeralParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const deepAnswers = [
      ['EVENT_LIFE_DEEP_01', '人生の節目に、家族や知人が集まって式をするものだと思う。'],
      ['EVENT_LIFE_DEEP_02', '結婚式を見聞きしたことはある。自分の思い出については特にない。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(weddingParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(weddingParent.id), {
      slot1: { key: 'life_event_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'life_event_experience_impression', value: deepAnswers[1][1] },
    });
  });

  run('学校の行事は運動会・文化祭に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        運動会: {
          id: 'event_sports_day', surface: '運動会', category: 'EVENT', subcategory: 'EVENT_5',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_sports_day', mentionCount: 1,
        },
        文化祭: {
          id: 'event_school_festival', surface: '文化祭', category: 'EVENT', subcategory: 'EVENT_5',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'event_school_festival', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['運動会', '文化祭'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_5');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_5');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['EVENT', 'EVENT_5'], ['EVENT', 'EVENT_5'], ['EVENT', 'EVENT_5'], ['NATURE_TIME', 'NATURE_TIME_2'],
        ['NATURE_TIME', 'NATURE_TIME_4'], ['PLACE', 'PLACE_4'], ['PLACE', 'PLACE_3'], ['PERSON', 'PERSON_4'],
        ['SPORTS', 'SPORTS_DISCIPLINE'], ['ACTIVITY', 'ACTIVITY_1'], ['AV_MEDIA', 'AV_MEDIA_1'], ['FOOD', 'FOOD_1'],
        ['CLOTHING', 'CLOTHING_1'], ['CLOTHING', 'CLOTHING_3'], ['PLACE', 'PLACE_2'], ['OBJECT', 'OBJECT_6'],
        ['TECH', 'TECH_4'], ['PLACE', 'PLACE_5'], ['KNOWLEDGE', 'KNOWLEDGE_6'], ['SCHOOL', 'SCHOOL_1'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_TO_PARENT_SCHOOL_EVENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_ACTIVITY_FROM_PARENT_SCHOOL_EVENT');
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'EVENT_5');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        運動会: {
          id: 'event_sports_day', surface: '運動会', category: 'EVENT', subcategory: 'EVENT_5',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_sports_day', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '運動会');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `学校行事初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const sportsDayParent = parents[0];
    const sportsDayAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_SCHOOL_V2_09' ? 'リレー'
        : item.id === 'EVENT_SCHOOL_V2_14' ? '紅白帽'
          : `運動会派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(sportsDayParent.id, item.id, sportsDayAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['リレー', 'SPORTS', 'SPORTS_DISCIPLINE', 'EVENT_SCHOOL_V2_09'],
      ['紅白帽', 'CLOTHING', 'CLOTHING_3', 'EVENT_SCHOOL_V2_14'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === sportsDayParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const schoolFestivalParent = parents[1];
    const schoolFestivalAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_SCHOOL_V2_06' ? '教室'
        : item.id === 'EVENT_SCHOOL_V2_20' ? '演劇の練習'
          : `文化祭派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(schoolFestivalParent.id, item.id, schoolFestivalAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['教室', 'PLACE', 'PLACE_4', 'EVENT_SCHOOL_V2_06'],
      ['演劇の練習', 'SCHOOL', 'SCHOOL_1', 'EVENT_SCHOOL_V2_20'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === schoolFestivalParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const deepAnswers = [
      ['EVENT_SCHOOL_DEEP_01', '学校で集まって、競技をしたり発表を見たりする行事だと思う。'],
      ['EVENT_SCHOOL_DEEP_02', '準備をしたことや、みんなの発表を見たことを覚えている。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(sportsDayParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(sportsDayParent.id), {
      slot1: { key: 'school_event_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'school_event_memory_impression', value: deepAnswers[1][1] },
    });
  });

  run('行事・イベントのその他は同窓会・体験会に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        同窓会: {
          id: 'event_reunion', surface: '同窓会', category: 'EVENT', subcategory: 'EVENT_7',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_reunion', mentionCount: 1,
        },
        体験会: {
          id: 'event_trial_session', surface: '体験会', category: 'EVENT', subcategory: 'EVENT_7',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'event_trial_session', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['同窓会', '体験会'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_7');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'EVENT_7');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['EVENT', 'EVENT_7'], ['EVENT', 'EVENT_7'], ['EVENT', 'EVENT_7'], ['EVENT', 'EVENT_3'],
        ['NATURE_TIME', 'NATURE_TIME_2'], ['NATURE_TIME', 'NATURE_TIME_4'], ['NATURE_TIME', 'NATURE_TIME_3'], ['PERSON', 'PERSON_2'],
        ['PERSON', 'PERSON_4'], ['WORK', 'WORK_1'], ['PLACE', 'PLACE_3'], ['PLACE', 'PLACE_5'],
        ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_3'], ['OBJECT', 'OBJECT_6'], ['OBJECT', 'OBJECT_6'],
        ['TECH', 'TECH_4'], ['ACTIVITY', 'ACTIVITY_1'], ['MONEY', 'MONEY_2'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ],
    );
    assert.equal(derivedPool[1].relationQualifier, 'SIMILAR_TO_PARENT_OTHER_EVENT');
    assert.equal(derivedPool[2].relationQualifier, 'DIFFERENT_PURPOSE_FROM_PARENT_OTHER_EVENT');
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'EVENT_7');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        同窓会: {
          id: 'event_reunion', surface: '同窓会', category: 'EVENT', subcategory: 'EVENT_7',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'event_reunion', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === '同窓会');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `集まり初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const reunionParent = parents[0];
    const reunionAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_OTHER_V2_01' ? '交流会'
        : item.id === 'EVENT_OTHER_V2_08' ? '同級生'
          : item.id === 'EVENT_OTHER_V2_19' ? '会費'
            : `同窓会派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(reunionParent.id, item.id, reunionAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['交流会', 'EVENT', 'EVENT_7', 'EVENT_OTHER_V2_01'],
      ['同級生', 'PERSON', 'PERSON_2', 'EVENT_OTHER_V2_08'],
      ['会費', 'MONEY', 'MONEY_2', 'EVENT_OTHER_V2_19'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === reunionParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const trialSessionParent = parents[1];
    const trialSessionAnswers = derivedPool.map((item, index) => (
      item.id === 'EVENT_OTHER_V2_10' ? '講師'
        : item.id === 'EVENT_OTHER_V2_11' ? '公民館'
          : `体験会派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(trialSessionParent.id, item.id, trialSessionAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['講師', 'WORK', 'WORK_1', 'EVENT_OTHER_V2_10'],
      ['公民館', 'PLACE', 'PLACE_3', 'EVENT_OTHER_V2_11'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === trialSessionParent.id
        && relation.objectId === word.id
        && relation.qualifier === questionId
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const deepAnswers = [
      ['EVENT_OTHER_DEEP_01', '集まって話したり、説明を聞いたり、何かを体験したりする会だと思う。'],
      ['EVENT_OTHER_DEEP_02', '参加したこともあるし、いろいろな人と会えるのがよいと思う。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(reunionParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(reunionParent.id), {
      slot1: { key: 'event_other_understanding', value: deepAnswers[0][1] },
      slot2: { key: 'event_other_experience_impression', value: deepAnswers[1][1] },
    });
  });

  run('その他のどれにも当てはまらない言葉はおまじない・気配に20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        おまじない: {
          id: 'other_charm', surface: 'おまじない', category: 'OTHER', subcategory: 'OTHER_1',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'other_charm', mentionCount: 1,
        },
        気配: {
          id: 'other_presence', surface: '気配', category: 'OTHER', subcategory: 'OTHER_1',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'other_presence', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parents = ['おまじない', '気配'].map((surface) => (
      conversation.getWordEntries().find((word) => word.surface === surface)
    ));
    const derivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'OTHER_1');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'OTHER_1');
    const unknownDerivedPool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'OTHER_2');
    const unknownDeepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'OTHER_2');
    assert.equal(derivedPool.length, 20);
    assert.equal(new Set(derivedPool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.equal(unknownDerivedPool.length, 20);
    assert.equal(unknownDeepPool.length, 2);
    assert.deepEqual(
      derivedPool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['OTHER', 'OTHER_1'], ['OTHER', 'OTHER_1'], ['OTHER', 'OTHER_1'], ['OTHER', 'OTHER_2'],
        ['PERSON', 'PERSON_OTHER'], ['PLACE', 'PLACE_8'], ['OBJECT', 'OBJECT_6'], ['ANIMAL', 'ANIMAL_1'],
        ['FOOD', 'FOOD_1'], ['NATURE_TIME', 'NATURE_TIME_2'], ['EVENT', 'EVENT_7'], ['WORK', 'WORK_1'],
        ['ACTIVITY', 'ACTIVITY_1'], ['TECH', 'TECH_7'], ['CLOTHING', 'CLOTHING_1'], ['VEHICLE', 'VEHICLE_6'],
        ['GAME_MEDIA', 'GAME_MEDIA_5'], ['AV_MEDIA', 'AV_MEDIA_1'], ['EMOTION', 'EMOTION_8'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
      ],
    );
    assert.equal(derivedPool[0].relationQualifier, 'SIMILAR_TO_PARENT_UNCATEGORIZED_WORD');
    assert.equal(derivedPool[1].relationQualifier, 'CONTRASTING_IMPRESSION_TO_PARENT_UNCATEGORIZED_WORD');
    for (const parent of parents) {
      assert.ok(parent);
      assert.equal(parent.subcategory, 'OTHER_1');
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id));
    }

    const initialStorage = memory();
    initialStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        おまじない: {
          id: 'other_charm', surface: 'おまじない', category: 'OTHER', subcategory: 'OTHER_1',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'other_charm', mentionCount: 1,
        },
      },
    }));
    const initialConversation = create(initialStorage, undefined, () => 0.5);
    prepare(initialConversation);
    const initialParent = initialConversation.getWordEntries().find((word) => word.surface === 'おまじない');
    const initialQuestions = [];
    while (initialQuestions.length < 6) {
      const question = initialConversation.getNextPersonComboQuestion(initialParent.id);
      assert.ok(question);
      initialQuestions.push(question);
      assert.equal(initialConversation.submitPersonComboAnswer(initialParent.id, question.id, `その他初回回答${initialQuestions.length}`)?.ok, true);
    }
    assert.equal(initialQuestions.filter((question) => question.kind === 'derived').length, 4);
    assert.equal(initialQuestions.filter((question) => question.kind === 'deepDive').length, 2);

    const charmParent = parents[0];
    const charmAnswers = derivedPool.map((item, index) => (
      item.id === 'OTHER_UNCATEGORIZED_V2_01' ? 'ジンクス'
        : item.id === 'OTHER_UNCATEGORIZED_V2_04' ? 'アフォーダンス'
        : item.id === 'OTHER_UNCATEGORIZED_V2_07' ? 'お守り'
          : item.id === 'OTHER_UNCATEGORIZED_V2_08' ? '黒猫'
            : `おまじない派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(charmParent.id, item.id, charmAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['ジンクス', 'OTHER', 'OTHER_1', 'OTHER_UNCATEGORIZED_V2_01'],
      ['アフォーダンス', 'OTHER', 'OTHER_2', 'OTHER_UNCATEGORIZED_V2_04'],
      ['お守り', 'OBJECT', 'OBJECT_6', 'OTHER_UNCATEGORIZED_V2_07'],
      ['黒猫', 'ANIMAL', 'ANIMAL_1', 'OTHER_UNCATEGORIZED_V2_08'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === charmParent.id
        && relation.objectId === word.id
        && relation.qualifier === (derivedPool.find((item) => item.id === questionId).relationQualifier
          ? `${questionId}:${derivedPool.find((item) => item.id === questionId).relationQualifier}`
          : questionId)
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const presenceParent = parents[1];
    const presenceAnswers = derivedPool.map((item, index) => (
      item.id === 'OTHER_UNCATEGORIZED_V2_01' ? '雰囲気'
        : item.id === 'OTHER_UNCATEGORIZED_V2_19' ? '胸騒ぎ'
          : `気配派生回答${index + 1}`
    ));
    for (const [index, item] of derivedPool.entries()) {
      assert.equal(conversation.submitPersonComboAnswer(presenceParent.id, item.id, presenceAnswers[index])?.ok, true, item.id);
    }
    for (const [surface, category, subcategory, questionId] of [
      ['雰囲気', 'OTHER', 'OTHER_1', 'OTHER_UNCATEGORIZED_V2_01'],
      ['胸騒ぎ', 'EMOTION', 'EMOTION_8', 'OTHER_UNCATEGORIZED_V2_19'],
    ]) {
      const word = conversation.getWordEntries().find((entry) => entry.surface === surface);
      assert.deepEqual([word?.category, word?.subcategory], [category, subcategory], surface);
      assert.ok(word);
      assert.ok(conversation.getMemoryRelations().some((relation) => (
        relation.subjectId === presenceParent.id
        && relation.objectId === word.id
        && relation.qualifier === (derivedPool.find((item) => item.id === questionId).relationQualifier
          ? `${questionId}:${derivedPool.find((item) => item.id === questionId).relationQualifier}`
          : questionId)
      )));
      assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === word.id));
    }

    const deepAnswers = [
      ['OTHER_UNCATEGORIZED_DEEP_01', '何かよいことや悪いことが起きるように願う言葉や行いだと思う。'],
      ['OTHER_UNCATEGORIZED_DEEP_02', '少し不思議に感じるけれど、昔から伝わっているものもあるのかなと思う。'],
    ];
    for (const [questionId, answer] of deepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(charmParent.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(charmParent.id), {
      slot1: { key: 'uncategorized_word_meaning', value: deepAnswers[0][1] },
      slot2: { key: 'uncategorized_word_impression', value: deepAnswers[1][1] },
    });

    const affordance = conversation.getWordEntries().find((entry) => entry.surface === 'アフォーダンス');
    assert.ok(affordance);
    assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === affordance.id));
    const nextQuestion = conversation.getNextPersonComboQuestion(affordance.id);
    assert.ok(nextQuestion);
    assert.ok(unknownDerivedPool.some((item) => item.id === nextQuestion.id));
    const unknownDeepAnswers = [
      ['OTHER_UNKNOWN_DEEP_01', '名前は見たことがあるけれど、詳しい意味はまだ知らない。'],
      ['OTHER_UNKNOWN_DEEP_02', 'どんな場面で使う言葉なのか気になっている。'],
    ];
    for (const [questionId, answer] of unknownDeepAnswers) {
      assert.equal(conversation.submitPersonComboAnswer(affordance.id, questionId, answer)?.ok, true, questionId);
      assert.equal(conversation.getWordEntries().some((entry) => entry.surface === answer), false);
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(affordance.id), {
      slot1: { key: 'unknown_word_known_information', value: unknownDeepAnswers[0][1] },
      slot2: { key: 'unknown_word_question_interest', value: unknownDeepAnswers[1][1] },
    });
  });

  run('その他のまだよくわからない言葉はエントロピー・セレンディピティに20派生と2掘り下げを用意する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 16,
      words: {
        エントロピー: {
          id: 'unknown_entropy', surface: 'エントロピー', category: 'OTHER', subcategory: 'OTHER_2',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'unknown_entropy', mentionCount: 1,
        },
        セレンディピティ: {
          id: 'unknown_serendipity', surface: 'セレンディピティ', category: 'OTHER', subcategory: 'OTHER_2',
          firstSeenDay: 1, learnedOrder: 2, rootWordId: 'unknown_serendipity', mentionCount: 1,
        },
      },
    }));
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const pool = PERSON_DERIVED_CONVERSATIONS.filter((item) => item.parentSubcategory === 'OTHER_2');
    const deepPool = PERSON_DEEP_DIVE_CONVERSATIONS.filter((item) => item.parentSubcategory === 'OTHER_2');
    assert.equal(pool.length, 20);
    assert.equal(new Set(pool.map((item) => item.id)).size, 20);
    assert.equal(deepPool.length, 2);
    assert.deepEqual(pool.slice(0, 4).map((item) => item.opening[0].text), [
      'ほかに意味がよくわからない言葉は？',
      'それと一緒に聞いた、意味がわからない言葉は？',
      'それと音や字が似ている、わからない言葉は？',
      'それから連想する、分類しにくい言葉は？',
    ]);
    assert.deepEqual(
      pool.map((item) => [item.classification.category, item.classification.subcategory]),
      [
        ['OTHER', 'OTHER_2'], ['OTHER', 'OTHER_2'], ['OTHER', 'OTHER_2'], ['OTHER', 'OTHER_1'],
        ['KNOWLEDGE', 'KNOWLEDGE_6'], ['PERSON', 'PERSON_OTHER'], ['PERSON', 'PERSON_4'], ['WORK', 'WORK_1'],
        ['SCHOOL', 'SCHOOL_2'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['AV_MEDIA', 'AV_MEDIA_4'],
        ['GAME_MEDIA', 'GAME_MEDIA_5'], ['TECH', 'TECH_5'], ['TECH', 'TECH_6'], ['PLACE', 'PLACE_8'],
        ['OBJECT', 'OBJECT_6'], ['TECH', 'TECH_7'], ['KNOWLEDGE', 'KNOWLEDGE_3'],
        ['KNOWLEDGE', 'KNOWLEDGE_2'], ['EMOTION', 'EMOTION_8'],
      ],
    );

    const unknownWordFixtures = [
      { parentSurface: 'エントロピー', targetAnswers: new Map([
        ['OTHER_UNKNOWN_V2_01', ['アフォーダンス', 'OTHER', 'OTHER_2']],
        ['OTHER_UNKNOWN_V2_09', ['物理', 'SCHOOL', 'SCHOOL_2']],
        ['OTHER_UNKNOWN_V2_18', ['熱力学', 'KNOWLEDGE', 'KNOWLEDGE_3']],
      ]) },
      { parentSurface: 'セレンディピティ', targetAnswers: new Map([
        ['OTHER_UNKNOWN_V2_04', ['偶然', 'OTHER', 'OTHER_1']],
        ['OTHER_UNKNOWN_V2_14', ['YouTube', 'TECH', 'TECH_6']],
      ]) },
    ];
    for (const { parentSurface, targetAnswers } of unknownWordFixtures) {
      const parent = conversation.getWordEntries().find((word) => word.surface === parentSurface);
      assert.ok(parent);
      const firstQuestions = [];
      const deepAnswers = new Map();
      while (firstQuestions.length < 6) {
        const question = conversation.getNextPersonComboQuestion(parent.id);
        assert.ok(question);
        firstQuestions.push(question);
        const surface = question.kind === 'deepDive'
          ? `${parentSurface}${question.id} の回答は原文のまま保存する。`
          : (targetAnswers.get(question.id)?.[0] ?? `${parentSurface}派生${firstQuestions.length}`);
        if (question.kind === 'deepDive') deepAnswers.set(question.id, surface);
        assert.equal(conversation.submitPersonComboAnswer(parent.id, question.id, surface)?.ok, true);
      }
      assert.equal(firstQuestions.filter((question) => question.kind === 'derived').length, 4);
      assert.equal(firstQuestions.filter((question) => question.kind === 'deepDive').length, 2);
      for (const item of pool) {
        if (firstQuestions.some((question) => question.id === item.id)) continue;
        const [surface] = targetAnswers.get(item.id) ?? [`${parentSurface}派生${item.id}`];
        assert.equal(conversation.submitPersonComboAnswer(parent.id, item.id, surface)?.ok, true, item.id);
      }
      for (const [questionId, [surface, category, subcategory]] of targetAnswers) {
        const child = conversation.getWordEntries().find((word) => word.surface === surface);
        assert.ok(child);
        assert.deepEqual([child.category, child.subcategory], [category, subcategory], surface);
        assert.ok(conversation.getMemoryRelations().some((relation) => (
          relation.subjectId === parent.id
          && relation.objectId === child.id
          && relation.qualifier === (pool.find((item) => item.id === questionId).relationQualifier
            ? `${questionId}:${pool.find((item) => item.id === questionId).relationQualifier}`
            : questionId)
        )));
        assert.ok(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === child.id));
      }
      for (const item of deepPool) {
        const answer = deepAnswers.get(item.id);
        assert.ok(answer, item.id);
        assert.equal(conversation.getWordEntries().some((word) => word.surface === answer), false);
      }
      const deepDive = conversation.getPersonWordDeepDive(parent.id);
      for (const item of deepPool) {
        assert.equal(deepDive[item.slot].value, deepAnswers.get(item.id), item.id);
      }
      assert.equal(conversation.getPersonWordComboCandidates().some((candidate) => candidate.id === parent.id), false);
    }
  });

  run('旧漫画家・クリエイターは漫画家・作家へ推測せず互換IDで保持する', () => {
    const storage = memory();
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify({
      version: 11,
      words: {
        創作家: {
          id: 'legacy_creator', surface: '創作家', category: 'PERSON', subcategory: 'PERSON_CREATOR',
          firstSeenDay: 1, learnedOrder: 1, rootWordId: 'legacy_creator', mentionCount: 1,
        },
      },
    }));

    const conversation = create(storage, undefined, () => 0);
    assert.equal(
      conversation.getWordEntries().find((word) => word.id === 'legacy_creator')?.subcategory,
      'PERSON_LEGACY_CREATOR',
    );
    assert.equal(subcategoryLabel('PERSON', 'PERSON_LEGACY_CREATOR'), '漫画家・クリエイター');
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === 'legacy_creator'),
      false,
    );
    assert.equal(
      JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices')).version,
      16,
    );
  });

  run(
    'Day2の前半6会話の後に分類付きの後半6会話が続き、意味記憶を保存する',
    () => {
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
      assert.deepEqual(
        conversation
          .getSeenConversationIds()
          .filter((id) => id.startsWith('DAY02_'))
          .sort(),
        [
          'DAY02_SELF_01',
          'DAY02_SELF_02',
          'DAY02_SELF_03',
          'DAY02_SELF_04',
          'DAY02_SELF_05',
          'DAY02_SELF_06',
        ],
      );

      const cases = [
        ['カレー', 'FOOD', 'FOOD_1'],
        ['音楽を聴く', 'AV_MEDIA', 'AV_MEDIA_1'],
        ['空', 'NATURE_TIME', 'NATURE_TIME_7'],
        ['片付け', 'ACTIVITY', 'ACTIVITY_3'],
        ['料理', 'ACTIVITY', 'ACTIVITY_5'],
        ['映画を見る', 'AV_MEDIA', 'AV_MEDIA_2'],
      ];
      for (const [word, category, subcategory] of cases) {
        const curiousOpening = conversation.startSession();
        assert.equal(curiousOpening.inputMode, 'text');
        assert.match(
          curiousOpening.debug.selectedTemplate,
          /^DAY02_CURIOUS_0[1-6]$/,
        );
        const followup = conversation.submit(word);
        assert.equal(followup.inputMode, 'category');
        assert.ok(
          followup.categoryChoices.some(
            (choice) => choice.category === category,
          ),
        );
        const subcategoryPrompt = conversation.chooseCategory(category);
        assert.equal(subcategoryPrompt.inputMode, 'category');
        assert.ok(
          subcategoryPrompt.subCategoryChoices.some(
            (choice) => choice.id === subcategory,
          ),
        );
        const ending = conversation.chooseSubCategory(subcategory);
        assert.equal(ending.stage, 'complete');
        assertPagedResponse(ending);
      }

      const relations = conversation.getMemoryRelations();
      const entry = (surface) =>
        conversation.getWordEntries().find((word) => word.surface === surface);
      assert.ok(
        relations.some(
          (relation) =>
            relation.type === 'FREQUENTLY_DOES' &&
            relation.objectId === entry('カレー')?.id,
        ),
      );
      assert.ok(
        relations.some(
          (relation) =>
            relation.type === 'USED_FOR' &&
            relation.objectId === entry('音楽を聴く')?.id,
        ),
      );
      assert.ok(
        relations.some(
          (relation) =>
            relation.type === 'STRUGGLES_WITH' &&
            relation.objectId === entry('片付け')?.id,
        ),
      );
      assert.ok(
        relations.some(
          (relation) =>
            relation.type === 'IS_GOOD_AT' &&
            relation.objectId === entry('料理')?.id,
        ),
      );
      assert.ok(
        relations.some(
          (relation) =>
            relation.type === 'LOOKS_FORWARD_TO' &&
            relation.objectId === entry('映画を見る')?.id,
        ),
      );
      assert.ok(
        !relations.some(
          (relation) =>
            relation.type === 'LIKES' &&
            relation.objectId === entry('料理')?.id,
        ),
      );
      assert.ok(
        !relations.some(
          (relation) =>
            relation.type === 'DISLIKES' &&
            relation.objectId === entry('片付け')?.id,
        ),
      );
      assert.equal(entry('カレー')?.subcategory, 'FOOD_1');
      assert.equal(
        conversation
          .getMemoryEpisodes()
          .filter((episode) =>
            episode.conversationId.startsWith('DAY02_CURIOUS_'),
          ).length,
        6,
      );
      assert.equal(
        conversation
          .getOpenQuestions()
          .filter((question) => question.status === 'OPEN').length,
        6,
      );

      const reloaded = create(storage, undefined, () => 0);
      assert.equal(
        reloaded
          .getMemoryEpisodes()
          .filter((episode) =>
            episode.conversationId.startsWith('DAY02_CURIOUS_'),
          ).length,
        6,
      );
      assert.ok(
        reloaded
          .getMemoryRelations()
          .some(
            (relation) =>
              relation.type === 'LOOKS_FORWARD_TO' &&
              relation.objectId === entry('映画を見る')?.id,
          ),
      );
    },
  );

  run('同じ正規化文字列は同じWordEntryを更新する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    finishDay1SelfAndInterest(conversation);
    conversation.startSession();
    conversation.submit('ＡＢＣ');
    conversation.choose('DAY01_CURIOUS_01_UNKNOWN_RICE');
    conversation.startSession();
    conversation.submit('ABC');
    conversation.choose('DAY01_CURIOUS_02_UNKNOWN_OTHER');
    const entries = conversation
      .getWordEntries()
      .filter(
        (entry) => entry.surface.normalize('NFKC').toLowerCase() === 'abc',
      );
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.mentionCount, 2);
    assert.equal(entries[0]?.lastUsedDay, 1);
  });

  run('既知語は既知語分岐へ進み、同じ正規化語を重複登録しない', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    finishDay1SelfAndInterest(conversation);
    const opening = conversation.startSession();
    assert.equal(opening.debug.selectedTemplate, 'DAY01_CURIOUS_01');
    const known = conversation.submit('カレー');
    assert.ok(
      known.choices.some(
        (choice) => choice.id === 'DAY01_CURIOUS_01_KNOWN_HAPPY',
      ),
    );
    conversation.choose('DAY01_CURIOUS_01_KNOWN_HAPPY');
    assert.equal(
      conversation
        .getWordEntries()
        .filter((entry) => entry.surface === 'カレー').length,
      1,
    );
    assert.equal(
      conversation.getWordEntries().find((entry) => entry.surface === 'カレー')
        ?.category,
      'FOOD',
    );
  });

  run('単語記憶とcommonKnowledge辞書を維持する', () => {
    const conversation = create();
    prepare(conversation);
    conversation.startWordTeaching();
    conversation.submit('星の本');
    conversation.chooseCategory('MEDIA');
    conversation.choose('WORD_LIKE');
    assert.ok(
      conversation.getWordEntries().some((entry) => entry.surface === '星の本'),
    );
    assert.ok(findCommonKnowledge('犬'));
  });

  run('v9保存を最小WordEntryのv10へ決定的に移行する', () => {
    const storage = memory();
    storage.setItem(
      'suuhimochi_conversation_v6_choices',
      JSON.stringify({
        version: 9,
        words: {
          映画: {
            id: 'word_movie',
            surface: '映画',
            category: 'MEDIA',
            knowledgeLevel: 'KNOWN',
            firstSeenDay: 2,
            lastSeenDay: 4,
            lastUsedInConversationDay: 3,
            firstSeen: '2026-09-01T00:00:00.000Z',
            lastSeen: '2026-09-02T00:00:00.000Z',
            mentionCount: 2,
            attributes: { feeling: '好き', subCategoryId: 'MEDIA_1' },
            userSentiment: 'LIKE',
            oshiStatus: 'UNKNOWN',
            importance: 0.5,
          },
          犬: {
            id: 'word_dog',
            surface: '犬',
            category: 'ANIMAL',
            knowledgeLevel: 'KNOWN',
            firstSeenDay: 1,
            lastSeenDay: 2,
            firstSeen: '2026-08-31T00:00:00.000Z',
            lastSeen: '2026-09-01T00:00:00.000Z',
            mentionCount: 1,
            attributes: {},
            userSentiment: 'NEUTRAL',
            oshiStatus: 'NO',
            importance: 0.4,
          },
        },
        memories: [],
        relations: [],
        events: [],
        conversations: [
          {
            timestamp: '2026-09-01T00:00:00.000Z',
            speaker: 'USER',
            text: '映画',
            sessionId: 'old',
            topic: '映画',
          },
        ],
        startDate: '2026-09-08',
        dayOverride: null,
        ended: false,
        conversationCount: 1,
        goalText: '映画を見る',
        goalSetAt: '2026-09-08',
        lastGoalCheckDate: '2026-09-08',
        goalChecks: [],
        lastWordSurface: '映画',
        oshiLoveCounts: {},
        memoryConversationRecords: [{ id: 'legacy' }],
        memoryConversationRecentTemplateIds: ['legacy'],
        promptedRecentQuestionIds: ['legacy'],
        normalConversationDeck: ['MEMORY'],
      }),
    );
    const conversation = create(storage);
    assert.equal(conversation.getGoal(), '映画を見る');
    assert.equal(conversation.getWordEntries().length, 2);
    assert.equal(conversation.getConversationLogs()[0]?.text, '映画');
    const migrated = JSON.parse(
      storage.getItem('suuhimochi_conversation_v6_choices'),
    );
    assert.equal(migrated.version, 16);
    assert.equal(migrated.memoryConversationRecords, undefined);
    assert.equal(migrated.promptedRecentQuestionIds, undefined);
    assert.equal(migrated.normalConversationDeck, undefined);
    assert.equal(migrated.seenConversationIds.length, 0);
    assert.deepEqual(migrated.conversationChoiceRecords, []);
    assert.deepEqual(migrated.memoryRelations, []);
    assert.deepEqual(migrated.openQuestions, []);
    assert.deepEqual(migrated.memoryEpisodes, []);
    assert.equal(migrated.oshiLoveCounts, undefined);
    const dog = conversation
      .getWordEntries()
      .find((entry) => entry.id === 'word_dog');
    const movie = conversation
      .getWordEntries()
      .find((entry) => entry.id === 'word_movie');
    assert.equal(dog?.learnedOrder, 1);
    assert.equal(dog?.rootWordId, 'word_dog');
    assert.equal(dog?.lastUsedDay, 2);
    assert.equal(movie?.learnedOrder, 2);
    assert.equal(movie?.rootWordId, 'word_movie');
    assert.equal(movie?.lastUsedDay, 3);
    assert.equal(movie?.subcategory, 'MEDIA_1');
    assert.equal(movie?.userSentiment, 'LIKE');
    const savedMovie = migrated.words['映画'];
    for (const oldKey of [
      'knowledgeLevel',
      'firstSeen',
      'lastSeen',
      'lastSeenDay',
      'lastUsedInConversationDay',
      'attributes',
      'importance',
      'oshiStatus',
    ]) {
      assert.equal(Object.hasOwn(savedMovie, oldKey), false);
    }
  });

  run('PERSON_1〜4・各対応人物分類はv2派生20問、旧分類の質問プールは互換IDで保持する', () => {
      assert.equal(PERSON_DERIVED_CONVERSATIONS.length, 2948);
    for (let index = 1; index <= 4; index += 1) {
      const conversations = PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === `PERSON_${index}`,
      );
      assert.equal(conversations.length, 20);
      assert.equal(
        new Set(conversations.map((conversation) => conversation.id)).size,
        20,
      );
      assert.ok(
        conversations.every((conversation) => conversation.closing.length > 0),
      );
    }
    assert.equal(
      PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === 'PERSON_LEGACY_FAMOUS',
      ).length,
      4,
    );
    assert.equal(
      PERSON_DERIVED_CONVERSATIONS.filter(
        (conversation) => conversation.parentSubcategory === 'PERSON_OTHER',
      ).length,
      24,
    );
    const family = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_1',
    );
    assert.deepEqual(
      family.map((conversation) => conversation.opening[0]?.text),
      [
        '一緒に思い出す家族は？',
        'その人の友達で覚えてる人は？',
        '一緒に食べて、今も覚えてる料理は？',
        '買ってもらって嬉しかったお菓子は？',
        '一緒に買って覚えてる日用品は？',
        '一緒に選んだ家具は？',
        'もらって嬉しかった服は？',
        'その人がよく履いていた靴は？',
        'その人の家にあった懐かしい家電は？',
        '一緒に暮らした家は？',
        '一緒によく行ったお店は？',
        'その人を思い出す町は？',
        '一緒によくした遊びは？',
        '一緒に旅行した町は？',
        '一緒に聴いていた曲は？',
        '一緒によく見ていたアニメは？',
        '一緒に遊んだゲームは？',
        '一緒に過ごした季節の行事は？',
        '一緒にお祝いした記念日は？',
        '一緒に飼っていた犬や猫は？',
      ],
    );
    assert.deepEqual(
      family.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_1'], ['PERSON', 'PERSON_2'],
        ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_2'],
        ['OBJECT', 'OBJECT_2'], ['OBJECT', 'OBJECT_1'],
        ['CLOTHING', 'CLOTHING_1'], ['CLOTHING', 'CLOTHING_2'],
        ['TECH', 'TECH_2'], ['PLACE', 'PLACE_1'],
        ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_5'],
        ['ACTIVITY', 'ACTIVITY_1'], ['PLACE', 'PLACE_5'],
        ['AV_MEDIA', 'AV_MEDIA_1'], ['GAME_MEDIA', 'GAME_MEDIA_2'],
        ['GAME_MEDIA', 'GAME_MEDIA_3'], ['EVENT', 'EVENT_2'],
        ['EVENT', 'EVENT_1'], ['ANIMAL', 'ANIMAL_1'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
    const friend = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_2',
    );
    assert.deepEqual(
      friend.map((conversation) => conversation.opening[0]?.text),
      [
        '一緒に遊んでいた別の友達は？',
        '一緒に思い出す先生や先輩は？',
        '帰り道によく買ったお菓子は？',
        '一緒に食べて印象に残った料理は？',
        '貸し借りした文房具は？',
        '一緒に買ったり選んだりした服は？',
        '一緒に遊んでいたゲーム機は？',
        'よく待ち合わせたお店は？',
        '一緒に通った学校や職場は？',
        '一緒に歩いた思い出の町は？',
        '時間を忘れて遊んだ遊びは？',
        '一緒に出かけた旅行は？',
        '一緒に集めていたコレクションは？',
        '一緒に夢中になった球技は？',
        '貸し借りした漫画は？',
        '一緒にはまったゲームは？',
        '一緒によく聴いた曲は？',
        '一緒に見て印象的だった映画は？',
        '貸してもらって覚えている本は？',
        '一緒に参加した学校行事は？',
      ],
    );
    assert.deepEqual(
      friend.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_4'],
        ['FOOD', 'FOOD_2'], ['FOOD', 'FOOD_1'],
        ['OBJECT', 'OBJECT_3'], ['CLOTHING', 'CLOTHING_1'],
        ['TECH', 'TECH_3'], ['PLACE', 'PLACE_2'],
        ['PLACE', 'PLACE_4'], ['PLACE', 'PLACE_5'],
        ['ACTIVITY', 'ACTIVITY_1'], ['ACTIVITY', 'ACTIVITY_2'],
        ['ACTIVITY', 'ACTIVITY_4'], ['SPORTS', 'SPORTS_1'],
        ['GAME_MEDIA', 'GAME_MEDIA_1'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
        ['AV_MEDIA', 'AV_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_2'],
        ['KNOWLEDGE', 'KNOWLEDGE_1'], ['EVENT', 'EVENT_5'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
    const important = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_3',
    );
    assert.deepEqual(
      important.map((conversation) => conversation.opening[0]?.text),
      [
        '一緒に思い浮かぶ大切な人は？',
        'その人がよく話していた友達は？',
        'その人が作ってくれた料理は？',
        'その人に贈ったお菓子は？',
        'その人が好きだった飲み物は？',
        'その人にもらって覚えている日用品は？',
        'その人がよく着ていた服は？',
        'その人からもらったアクセサリーは？',
        'その人と過ごした家は？',
        'よく待ち合わせたお店は？',
        'その人と歩いた思い出の町は？',
        'その人を思い出す海や山は？',
        'その人と行った旅行は？',
        'その人と一緒にした遊びは？',
        '一緒に夢中になったゲームは？',
        'その人と一緒に見た映画は？',
        'その人を思い出す曲は？',
        'その人に勧められた本は？',
        'その人と過ごした記念日は？',
        'その人とかわいがった犬や猫は？',
      ],
    );
    assert.deepEqual(
      important.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_3'], ['PERSON', 'PERSON_2'],
        ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_2'], ['FOOD', 'FOOD_3'],
        ['OBJECT', 'OBJECT_2'], ['CLOTHING', 'CLOTHING_1'], ['CLOTHING', 'CLOTHING_5'],
        ['PLACE', 'PLACE_1'], ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_5'], ['PLACE', 'PLACE_7'],
        ['ACTIVITY', 'ACTIVITY_2'], ['ACTIVITY', 'ACTIVITY_1'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
        ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_1'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
        ['EVENT', 'EVENT_1'], ['ANIMAL', 'ANIMAL_1'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
    const workSchool = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_4',
    );
    assert.deepEqual(
      workSchool.map((conversation) => conversation.opening[0]?.text),
      [
        '一緒に思い出す先生や同僚は？',
        'その人と仲のよかった友達は？',
        '一緒に食べた昼ごはんは？',
        'その人がよく飲んでいた飲み物は？',
        'その人に借りた文房具は？',
        'その人が使っていた作業道具は？',
        'その人がよく着ていた服は？',
        '一緒に使ったパソコンは？',
        'その人に教わったアプリは？',
        '一緒に過ごした学校や職場は？',
        '帰り道によく寄ったお店は？',
        '学校や職場のあった町は？',
        '一緒によく乗った電車は？',
        'その人の職業や役職は？',
        '一緒にした仕事や作業は？',
        'その人に教わった教科は？',
        '一緒に取り組んだ課題は？',
        'その人に勧められた本は？',
        '一緒に参加した学校行事は？',
        '一緒に参加した仕事の行事は？',
      ],
    );
    assert.deepEqual(
      workSchool.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_4'], ['PERSON', 'PERSON_2'],
        ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_3'],
        ['OBJECT', 'OBJECT_3'], ['OBJECT', 'OBJECT_5'],
        ['CLOTHING', 'CLOTHING_1'], ['TECH', 'TECH_1'], ['TECH', 'TECH_5'],
        ['PLACE', 'PLACE_4'], ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_5'],
        ['VEHICLE', 'VEHICLE_1'], ['WORK', 'WORK_1'], ['WORK', 'WORK_2'],
        ['SCHOOL', 'SCHOOL_2'], ['SCHOOL', 'SCHOOL_3'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
        ['EVENT', 'EVENT_5'], ['EVENT', 'EVENT_6'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
    const entertainer = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_ENTERTAINER',
    );
    assert.deepEqual(
      entertainer.map((conversation) => conversation.opening[0]?.text),
      [
        '印象に残っている共演者は？', '一緒に活動していた芸能人は？',
        'その人を知った曲は？', 'その人を思い出す曲は？',
        'その人が出演した映画は？', 'その人が出演したドラマは？',
        '印象に残る出演番組は？', '声を担当したアニメは？',
        'その人が演じたキャラクターは？', 'その人が関わったゲームは？',
        'その人を知った動画は？', '一緒に活動した配信者は？',
        '印象に残ったライブや公演は？', 'その人を見に行った会場は？',
        'その人の出身の町は？', '印象に残っている衣装は？',
        'その人が使っていた楽器は？', 'その人に関係する本は？',
        'その人のCMで覚えているお菓子は？', 'その人に関係するイベントは？',
      ],
    );
    assert.deepEqual(
      entertainer.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_ENTERTAINER'], ['PERSON', 'PERSON_ENTERTAINER'],
        ['AV_MEDIA', 'AV_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_1'],
        ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_3'], ['AV_MEDIA', 'AV_MEDIA_6'],
        ['GAME_MEDIA', 'GAME_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
        ['AV_MEDIA', 'AV_MEDIA_4'], ['PERSON', 'PERSON_STREAMER'], ['EVENT', 'EVENT_3'],
        ['PLACE', 'PLACE_3'], ['PLACE', 'PLACE_5'], ['CLOTHING', 'CLOTHING_1'],
        ['OBJECT', 'OBJECT_5'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['FOOD', 'FOOD_2'], ['EVENT', 'EVENT_3'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
    const mangaArtist = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_MANGA_ARTIST',
    );
    assert.deepEqual(
      mangaArtist.map((conversation) => conversation.opening[0]?.text),
      [
        'その人の漫画で知っているのは？', '一番好きな漫画は？',
        '最初に読んだ漫画は？', '同じ頃に読んでいた漫画は？',
        '好きな主人公は？', '印象に残った悪役は？', '好きだった脇役は？',
        '覚えている必殺技は？', '印象に残った道具は？', '作品に出てきた料理は？',
        'その人の漫画で見たアニメは？', '漫画をもとにした映画で知っているのは？',
        'その人の漫画のゲームで知っているのは？', '作品を思い出す曲は？',
        'その漫画を買ったお店は？', 'よく漫画の話をした友達は？',
        '一緒に漫画を読んだ家族は？', 'ほかに好きだった漫画家は？',
        '持っていた漫画の文房具は？', '漫画を読んでいた頃の遊びは？',
      ],
    );
    assert.deepEqual(
      mangaArtist.map((conversation) => conversation.classification),
      [
        ['GAME_MEDIA', 'GAME_MEDIA_1'], ['GAME_MEDIA', 'GAME_MEDIA_1'],
        ['GAME_MEDIA', 'GAME_MEDIA_1'], ['GAME_MEDIA', 'GAME_MEDIA_1'],
        ['GAME_MEDIA', 'GAME_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_4'],
        ['GAME_MEDIA', 'GAME_MEDIA_6'], ['GAME_MEDIA', 'GAME_MEDIA_6'], ['FOOD', 'FOOD_1'],
        ['GAME_MEDIA', 'GAME_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
        ['AV_MEDIA', 'AV_MEDIA_1'], ['PLACE', 'PLACE_2'], ['PERSON', 'PERSON_2'],
        ['PERSON', 'PERSON_1'], ['PERSON', 'PERSON_MANGA_ARTIST'], ['OBJECT', 'OBJECT_3'],
        ['ACTIVITY', 'ACTIVITY_1'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
  });

  run('小説家・作家の20問は小説を含む固定分類で派生語を保存する', () => {
    const author = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_AUTHOR_WRITER',
    );
    assert.deepEqual(
      author.map((conversation) => conversation.opening[0]?.text),
      [
        'その人の小説で知っているのは？', 'その人の小説で好きなのは？',
        'その人の小説以外の本で知っているのは？', '同じ頃に読んでいた小説は？',
        '好きな主人公は？', '印象に残っている登場人物は？', '覚えている作中の言葉は？',
        '作品に出てきた料理は？', '印象に残った作中の道具は？', '作品の舞台になった実在の町は？',
        '作品から思い出す曲は？', 'その人の作品が原作の映画は？',
        'その人の作品が原作のドラマは？', 'その人の作品が原作のアニメは？',
        'その作家を教えてくれた友達は？', '一緒に作品を楽しんだ家族は？',
        'その人の本を買ったお店は？', 'その人の本を借りた図書館は？',
        'ほかに好きな作家は？', '読書中によく飲む飲み物は？',
      ],
    );
    assert.deepEqual(
      author.map((conversation) => conversation.classification),
      [
        ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'], ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'],
        ['KNOWLEDGE', 'KNOWLEDGE_1'], ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'],
        ['GAME_MEDIA', 'GAME_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_4'], ['GAME_MEDIA', 'GAME_MEDIA_6'],
        ['FOOD', 'FOOD_1'], ['GAME_MEDIA', 'GAME_MEDIA_6'], ['PLACE', 'PLACE_5'],
        ['AV_MEDIA', 'AV_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_3'],
        ['GAME_MEDIA', 'GAME_MEDIA_2'], ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'],
        ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_3'], ['PERSON', 'PERSON_AUTHOR_WRITER'],
        ['FOOD', 'FOOD_3'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
  });

  run('スポーツ選手の20問は競技・チーム・大会を含む固定分類で派生語を保存する', () => {
    const athlete = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_ATHLETE',
    );
    assert.deepEqual(
      athlete.map((conversation) => conversation.opening[0]?.text),
      [
        'その人がやっている競技は？', 'その人が所属していたチームは？', 'ライバルだったチームは？',
        '印象に残った大会は？', '忘れられない試合は？', 'その人のライバル選手は？',
        '一緒に活躍した選手は？', 'ほかに好きな選手は？', '昔、応援していた選手は？',
        '試合を見た会場は？', '試合を見に行った町は？', 'その人が活躍した国は？',
        'その人が使っていた道具は？', '応援するときに着た服は？', 'その人を知ったテレビ番組は？',
        'その人の試合を見た動画は？', 'その人を思い出す曲は？', 'その人について読んだ本は？',
        '一緒に応援していた友達は？', '一緒に試合を見ていた家族は？',
      ],
    );
    assert.deepEqual(
      athlete.map((conversation) => conversation.classification),
      [
        ['SPORTS', 'SPORTS_DISCIPLINE'], ['SPORTS', 'SPORTS_TEAM_CLUB'], ['SPORTS', 'SPORTS_TEAM_CLUB'],
        ['SPORTS', 'SPORTS_EVENT_MATCH'], ['SPORTS', 'SPORTS_EVENT_MATCH'],
        ['PERSON', 'PERSON_ATHLETE'], ['PERSON', 'PERSON_ATHLETE'], ['PERSON', 'PERSON_ATHLETE'], ['PERSON', 'PERSON_ATHLETE'],
        ['PLACE', 'PLACE_3'], ['PLACE', 'PLACE_5'], ['PLACE', 'PLACE_6'], ['OBJECT', 'OBJECT_5'],
        ['CLOTHING', 'CLOTHING_1'], ['AV_MEDIA', 'AV_MEDIA_6'], ['AV_MEDIA', 'AV_MEDIA_4'],
        ['AV_MEDIA', 'AV_MEDIA_1'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
  });

  run('科学者・研究者の20問は指定された固定分類で派生語を保存する', () => {
    const scientist = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_SCIENTIST',
    );
    assert.equal(scientist.length, 20);
    assert.deepEqual(
      scientist.map((conversation) => conversation.opening[0]?.text),
      [
        'ほかに知っている科学者は？', 'その人と一緒に思い出す科学者は？', 'その人で思い出す教科は？',
        'その人の話を聞いた学校は？', 'その人で覚えた科学の言葉は？', '関係する理論や法則は？',
        'その人で思い出す実験は？', '関係する星や宇宙のものは？', '関係する自然現象は？',
        'その人から連想する植物は？', 'その人に関係する実験道具は？', 'その人から連想する日用品は？',
        'その人を知った本は？', 'その人が登場する漫画は？', 'その人が登場する映画は？',
        'その人を知ったテレビ番組は？', 'その人について見た動画は？', 'その人に関係する国は？',
        'その人に関係する博物館や施設は？', 'その人の話をした友達は？',
      ],
    );
    assert.deepEqual(
      scientist.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_SCIENTIST'], ['PERSON', 'PERSON_SCIENTIST'], ['SCHOOL', 'SCHOOL_2'],
        ['PLACE', 'PLACE_4'], ['KNOWLEDGE', 'KNOWLEDGE_3'], ['KNOWLEDGE', 'KNOWLEDGE_3'],
        ['KNOWLEDGE', 'KNOWLEDGE_3'], ['NATURE_TIME', 'NATURE_TIME_7'], ['NATURE_TIME', 'NATURE_TIME_6'],
        ['ANIMAL', 'ANIMAL_5'], ['OBJECT', 'OBJECT_5'], ['OBJECT', 'OBJECT_2'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
        ['GAME_MEDIA', 'GAME_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_3'],
        ['AV_MEDIA', 'AV_MEDIA_4'], ['PLACE', 'PLACE_6'], ['PLACE', 'PLACE_3'], ['PERSON', 'PERSON_2'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
  });

  run('歴史の軍事的人物は20派生問を指定分類で保存する', () => {
    const military = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_HISTORICAL_MILITARY',
    );
    assert.equal(military.length, 20);
    assert.deepEqual(
      military.map((conversation) => conversation.opening[0]?.text),
      [
        'その人のライバルは？', 'その人の仲間や味方は？', '同じ時代の武将や軍師は？', 'ほかに好きな武将や軍師は？',
        'その人で思い出す合戦は？', '関係する歴史の事件は？', 'その人が生きた時代は？', 'その人が活躍した国は？',
        'その人にゆかりのある町は？', '関係する城や建物は？', 'その人の役職や肩書きは？', 'その人の名言で覚えているのは？',
        'その人を習った教科は？', 'その人が登場する漫画は？', 'その人が登場するアニメは？', 'その人が登場するゲームは？',
        'その人が登場する小説は？', 'その人が登場する映画は？', 'その人が登場するドラマは？', 'その人について読んだ本は？',
      ],
    );
    assert.deepEqual(
      military.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_HISTORICAL_MILITARY'], ['PERSON', 'PERSON_HISTORICAL_MILITARY'],
        ['PERSON', 'PERSON_HISTORICAL_MILITARY'], ['PERSON', 'PERSON_HISTORICAL_MILITARY'],
        ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_2'],
        ['PLACE', 'PLACE_6'], ['PLACE', 'PLACE_5'], ['PLACE', 'PLACE_3'], ['WORK', 'WORK_1'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
        ['SCHOOL', 'SCHOOL_2'], ['GAME_MEDIA', 'GAME_MEDIA_1'], ['GAME_MEDIA', 'GAME_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
        ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'], ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_3'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
  });

  run('歴史の文化的人物は美術・芸術を含む20派生問を指定分類で保存する', () => {
    const cultural = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_HISTORICAL_CULTURAL',
    );
    assert.equal(cultural.length, 20);
    assert.deepEqual(
      cultural.map((conversation) => conversation.opening[0]?.text),
      [
        '一緒に思い出す昔の文化人は？', 'その人と関係の深い文化人は？', '関係する武将や君主は？', 'その人の本で知っているのは？',
        'その人の小説で知っているのは？', 'その人の絵や彫刻で知っているのは？', 'その人の言葉で覚えているのは？', 'その人で思い出す考え方は？',
        '関係する歴史の出来事は？', 'その人が生きた時代は？', 'その人が活躍した国は？', 'その人にゆかりのある町は？',
        '関係する建物やお寺は？', 'その人を習った教科は？', 'その人について読んだ本は？', 'その人が登場する漫画は？',
        'その人が登場するアニメは？', 'その人が登場するゲームは？', 'その人が登場する映画は？', 'その人を知った動画は？',
      ],
    );
    assert.deepEqual(
      cultural.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_HISTORICAL_CULTURAL'], ['PERSON', 'PERSON_HISTORICAL_CULTURAL'], ['PERSON', 'PERSON_HISTORICAL_MILITARY'],
        ['KNOWLEDGE', 'KNOWLEDGE_1'], ['GAME_MEDIA', 'GAME_MEDIA_NOVEL'], ['KNOWLEDGE', 'KNOWLEDGE_ART'], ['KNOWLEDGE', 'KNOWLEDGE_6'],
        ['KNOWLEDGE', 'KNOWLEDGE_5'], ['KNOWLEDGE', 'KNOWLEDGE_2'], ['KNOWLEDGE', 'KNOWLEDGE_2'], ['PLACE', 'PLACE_6'], ['PLACE', 'PLACE_5'],
        ['PLACE', 'PLACE_3'], ['SCHOOL', 'SCHOOL_2'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['GAME_MEDIA', 'GAME_MEDIA_1'],
        ['GAME_MEDIA', 'GAME_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_3'], ['AV_MEDIA', 'AV_MEDIA_2'], ['AV_MEDIA', 'AV_MEDIA_4'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
    assert.equal(subcategoryLabel('KNOWLEDGE', 'KNOWLEDGE_ART'), '美術・芸術');
  });

  run('配信者は20派生問を指定分類で保存する', () => {
    const streamer = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.parentSubcategory === 'PERSON_STREAMER',
    );
    assert.equal(streamer.length, 20);
    assert.deepEqual(
      streamer.map((conversation) => conversation.opening[0]?.text),
      [
        'ほかによく見る配信者は？', 'よく一緒に配信している人は？', 'その人を知った動画は？', '一番好きな動画は？',
        '何度も見た動画は？', 'よく実況していたゲームは？', 'その人を見て始めたゲームは？', '配信で話していたアニメは？',
        '配信で話していた漫画は？', 'その人が歌っていた曲は？', '配信で印象に残ったキャラは？', '配信で聞いて好きになった曲は？',
        '動画に出てきた料理は？', '配信で見かけたお菓子は？', '配信で知ったお店は？', 'その人を見て使ったアプリは？',
        'その人が参加したイベントは？', '一緒に動画を見た家族は？', 'その人の話をした友達は？', 'その人の動画で知った本は？',
      ],
    );
    assert.deepEqual(
      streamer.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_STREAMER'], ['PERSON', 'PERSON_STREAMER'], ['AV_MEDIA', 'AV_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_4'],
        ['GAME_MEDIA', 'GAME_MEDIA_3'], ['GAME_MEDIA', 'GAME_MEDIA_3'], ['GAME_MEDIA', 'GAME_MEDIA_2'], ['GAME_MEDIA', 'GAME_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_1'],
        ['GAME_MEDIA', 'GAME_MEDIA_4'], ['AV_MEDIA', 'AV_MEDIA_1'], ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_2'], ['PLACE', 'PLACE_2'], ['TECH', 'TECH_5'],
        ['EVENT', 'EVENT_3'], ['PERSON', 'PERSON_1'], ['PERSON', 'PERSON_2'], ['KNOWLEDGE', 'KNOWLEDGE_1'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
  });

  run('その他の人はv2の20派生問を指定分類で保存する', () => {
    const other = PERSON_DERIVED_CONVERSATIONS.filter(
      (conversation) => conversation.id.startsWith('PERSON_OTHER_V2_'),
    );
    assert.equal(other.length, 20);
    assert.deepEqual(
      other.map((conversation) => conversation.opening[0]?.text),
      [
        '一緒にいた知り合いは？', 'その人と関係のある家族は？', 'その人の仕事は？', 'その人を見かけたお店は？',
        'その人と会った建物は？', 'その人を思い出す町は？', 'その人が着ていた服は？', 'その人が持っていたバッグは？',
        'その人が使っていた日用品は？', 'その人が使っていたスマホは？', 'その人が乗っていた車は？', 'その人と食べた料理は？',
        'その人が飲んでいた飲み物は？', 'その人にもらったお菓子は？', 'その人と話したゲームは？', 'その人と話した漫画は？',
        'その人を思い出す曲は？', 'その人に勧められた本は？', '一緒に参加したイベントは？', 'その人を思い出す季節は？',
      ],
    );
    assert.deepEqual(
      other.map((conversation) => conversation.classification),
      [
        ['PERSON', 'PERSON_2'], ['PERSON', 'PERSON_1'], ['WORK', 'WORK_1'], ['PLACE', 'PLACE_2'], ['PLACE', 'PLACE_3'],
        ['PLACE', 'PLACE_5'], ['CLOTHING', 'CLOTHING_1'], ['CLOTHING', 'CLOTHING_4'], ['OBJECT', 'OBJECT_2'], ['TECH', 'TECH_1'],
        ['VEHICLE', 'VEHICLE_2'], ['FOOD', 'FOOD_1'], ['FOOD', 'FOOD_3'], ['FOOD', 'FOOD_2'], ['GAME_MEDIA', 'GAME_MEDIA_3'],
        ['GAME_MEDIA', 'GAME_MEDIA_1'], ['AV_MEDIA', 'AV_MEDIA_1'], ['KNOWLEDGE', 'KNOWLEDGE_1'], ['EVENT', 'EVENT_3'], ['NATURE_TIME', 'NATURE_TIME_2'],
      ].map(([category, subcategory]) => ({ mode: 'fixed', category, subcategory })),
    );
  });

  run(
    '人物・生き物など掘り下げ260本は各中カテゴリー・slotに対応した台本を保持する',
    () => {
      const expected = {
        PERSON_FAMILY_DEEP_01: [
          'PERSON_1',
          'slot1',
          [
            '{word}って、人間さんの家族なんだよね。',
            'でも『家族』だけだと、ぼくの中でみんな同じ箱なの。',
            '{word}って、人間さんから見ると、どんな家族？',
          ],
          [
            '{answer}なんだ。',
            'よし。これで{word}が、ただの『家族の人』じゃなくなったの。',
            'ぼくの中でも、ちゃんと{word}の席ができた。',
          ],
        ],
        PERSON_FAMILY_DEEP_02: [
          'PERSON_1',
          'slot2',
          [
            '{word}のこと、もう一個だけ知りたいの。',
            '『これをしてたら{word}っぽい』とか、『こういう人なの』とか。',
            '{word}らしいところって、なぁに？',
          ],
          [
            '{answer}。',
            'あ、それ覚えておきたいの。',
            '今度{word}って聞いたら、名前だけじゃなくて、それも一緒に出てきそう。',
          ],
        ],
        PERSON_FRIEND_DEEP_01: [
          'PERSON_2',
          'slot1',
          [
            '{word}って、人間さんの友達とか知り合いなんだよね。',
            'でも友達にも、ずっと昔からの人とか、ときどき話す人とかいるんでしょ？',
            '{word}は、人間さんにとってどんな人？',
          ],
          [
            '{answer}なんだね。',
            'なるほど。',
            '『知ってる人』だけだった{word}が、ちょっと人間さんの近くに来たの。',
          ],
        ],
        PERSON_FRIEND_DEEP_02: [
          'PERSON_2',
          'slot2',
          [
            'もしぼくが{word}に会ったとして。',
            '『あ、この人が{word}だ』って分かりそうなところってある？',
            'どんなところが一番{word}っぽい？',
          ],
          [
            '{answer}かあ。',
            'じゃあ、それをしてる人を見たら、ちょっと{word}を疑うことにするの。',
            '……全然ちがう人だったら困るけど。',
          ],
        ],
        PERSON_IMPORTANT_DEEP_01: [
          'PERSON_3',
          'slot1',
          [
            '{word}って、人間さんにとって大切な人なんだよね。',
            'でもぼく、『大切』って言葉だけだと、まだ中身が見えないの。',
            'どうして{word}は大切なの？',
          ],
          [
            'そっか。{answer}なんだ。',
            '大切って、みんな同じ理由じゃないんだね。',
            '{word}が大切な理由は、これでちゃんと覚えたの。',
          ],
        ],
        PERSON_IMPORTANT_DEEP_02: [
          'PERSON_3',
          'slot2',
          [
            'じゃあ、もう一個。',
            '{word}の全部じゃなくていいの。',
            '人間さんが『ここ好きだな』って思うところ、一個だけ教えて。',
          ],
          [
            '{answer}。',
            'そこが好きなんだね。',
            'なんとなく、さっきより{word}がどんな人なのか見えてきたの。',
          ],
        ],
        PERSON_WORKSCHOOL_DEEP_01: [
          'PERSON_4',
          'slot1',
          [
            '{word}って、仕事とか学校で会う人だったよね。',
            'でも先生なのか、同僚なのか、先輩なのかで全然ちがうの。',
            '{word}は、人間さんとどういう関係の人？',
          ],
          [
            '{answer}なんだ。',
            'よし。これで{word}がどのへんにいる人か分かったの。',
            '仕事とか学校、人の種類が多くてむずかしいの。',
          ],
        ],
        PERSON_WORKSCHOOL_DEEP_02: [
          'PERSON_4',
          'slot2',
          [
            '人と一緒にいると、その人から何かうつったりする？',
            '風邪じゃなくて、知ってることとか、やり方とか。',
            '{word}から教わったことで、覚えてるものってある？',
          ],
          [
            '{answer}。',
            'それは{word}から人間さんに来たものなんだね。',
            '人から人へ、そういうのも渡るのか。',
            'ちょっと面白いの。',
          ],
        ],
        PERSON_ENTERTAINER_DEEP_01: [
          'PERSON_ENTERTAINER',
          'slot1',
          ['その人は何で有名なの？'],
          ['{answer}なんだ。よし、{word}の名前のとなりに覚えておくの。'],
        ],
        PERSON_ENTERTAINER_DEEP_02: [
          'PERSON_ENTERTAINER',
          'slot2',
          ['人間さんは、その人のどこが好き？'],
          ['{answer}が好きなんだね。ぼくも覚えておくの。'],
        ],
        PERSON_MANGA_ARTIST_DEEP_01: [
          'PERSON_MANGA_ARTIST',
          'slot1',
          ['その人はどんな漫画を描く人？'],
          ['{answer}なんだ。よし、{word}の名前のとなりに覚えておくの。'],
        ],
        PERSON_MANGA_ARTIST_DEEP_02: [
          'PERSON_MANGA_ARTIST',
          'slot2',
          ['その人のどんなところが好き？'],
          ['{answer}が好きなんだね。ぼくも覚えておくの。'],
        ],
        PERSON_AUTHOR_WRITER_DEEP_01: [
          'PERSON_AUTHOR_WRITER',
          'slot1',
          ['その人はどんな作品を書く人？'],
          ['{answer}なんだ。よし、{word}の名前のとなりに覚えておくの。'],
        ],
        PERSON_AUTHOR_WRITER_DEEP_02: [
          'PERSON_AUTHOR_WRITER',
          'slot2',
          ['その人の作品、どう思う？'],
          ['{answer}なんだね。ぼくも覚えておくの。'],
        ],
        PERSON_ATHLETE_DEEP_01: [
          'PERSON_ATHLETE',
          'slot1',
          ['その人はどんな選手なの？'],
          ['{answer}なんだ。よし、{word}の名前のとなりに覚えておくの。'],
        ],
        PERSON_ATHLETE_DEEP_02: [
          'PERSON_ATHLETE',
          'slot2',
          ['その人のどこが好き？'],
          ['{answer}が好きなんだね。ぼくも覚えておくの。'],
        ],
        PERSON_SCIENTIST_DEEP_01: [
          'PERSON_SCIENTIST',
          'slot1',
          ['その人は何をしたことで有名なの？'],
          ['{answer}なんだ。よし、{word}の名前のとなりに覚えておくの。'],
        ],
        PERSON_SCIENTIST_DEEP_02: [
          'PERSON_SCIENTIST',
          'slot2',
          ['その人の何がすごいと思う？'],
          ['{answer}がすごいんだね。ぼくも覚えておくの。'],
        ],
        PERSON_FAMOUS_DEEP_01: [
          'PERSON_LEGACY_FAMOUS',
          'slot1',
          [
            '{word}って、有名な人なんだよね。',
            'でも『有名』だけ覚えたら、ぼく絶対あとで何の人か忘れるの。',
            '{word}って、何をした人として覚えてる？',
          ],
          [
            '{answer}をした人。',
            'よし、名前のとなりに置いておくの。',
            'これなら『有名だから有名な人』より、だいぶ賢そう。',
          ],
        ],
        PERSON_FAMOUS_DEEP_02: [
          'PERSON_LEGACY_FAMOUS',
          'slot2',
          [
            '本に書いてあることとは別にさ。',
            '人間さんが{word}に持ってる印象ってある？',
            'どんな人っぽく見える？',
          ],
          [
            '{answer}って感じなんだ。',
            'それは人間さんから見た{word}なんだね。',
            '事実と印象は、同じ箱に入れないようにしとくの。',
            '……ぼく、たまに混ぜそうだから。',
          ],
        ],
        PERSON_OTHER_DEEP_01: [
          'PERSON_OTHER',
          'slot1',
          ['人間さんとは、どういう関係の人？'],
          [
            '{answer}なんだ。',
            'あ、線が一本見えたの。',
            'これでもう、名前だけぽつんと置いてある人じゃないね。',
          ],
        ],
        PERSON_OTHER_DEEP_02: [
          'PERSON_OTHER',
          'slot2',
          ['一番印象に残っている特徴は？'],
          [
            '{answer}。',
            '分かった。それは大きめに覚えておくの。',
            'もしぼくが{word}のこと分からなくなったら、まずそこから思い出す。',
          ],
        ],
        ANIMAL_OTHER_DEEP_01: [
          'ANIMAL_6',
          'slot1',
          ['その生き物のどこが印象的なの？'],
          ['{answer}が、{word}で印象に残っているところなんだね。'],
        ],
        ANIMAL_OTHER_DEEP_02: [
          'ANIMAL_6',
          'slot2',
          ['その生き物、好き？ 苦手？'],
          ['{answer}なんだね。{word}への気持ちも覚えておくの。'],
        ],
        FOOD_DISH_DEEP_01: [
          'FOOD_1',
          'slot1',
          ['どんな味や食感なの？'],
          ['{answer}みたいな味や食感なんだね。{word}のこと、少し分かったの。'],
        ],
        FOOD_DISH_DEEP_02: [
          'FOOD_1',
          'slot2',
          ['それを食べた思い出は？'],
          ['{answer}が、{word}を食べた思い出なんだね。'],
        ],
        FOOD_SWEET_DEEP_01: [
          'FOOD_2',
          'slot1',
          ['どんな味や食感なの？'],
          ['{answer}みたいな味や食感なんだね。{word}のこと、少し分かったの。'],
        ],
        FOOD_SWEET_DEEP_02: [
          'FOOD_2',
          'slot2',
          ['それにまつわる思い出は？'],
          ['{answer}が、{word}にまつわる思い出なんだね。'],
        ],
        FOOD_DRINK_DEEP_01: [
          'FOOD_3',
          'slot1',
          ['どんな味や飲み心地なの？'],
          ['{answer}みたいな味や飲み心地なんだね。{word}のこと、少し分かったの。'],
        ],
        FOOD_DRINK_DEEP_02: [
          'FOOD_3',
          'slot2',
          ['それを飲んだ思い出は？'],
          ['{answer}が、{word}を飲んだ思い出なんだね。'],
        ],
        FOOD_INGREDIENT_DEEP_01: [
          'FOOD_4',
          'slot1',
          ['その食材のどこが好き？ 苦手？'],
          ['{answer}が、{word}を好き・苦手だと感じる理由なんだね。'],
        ],
        FOOD_INGREDIENT_DEEP_02: [
          'FOOD_4',
          'slot2',
          ['その食材で思い出す出来事は？'],
          ['{answer}が、{word}で思い出す出来事なんだね。'],
        ],
        FOOD_SEASONING_DEEP_01: [
          'FOOD_5',
          'slot1',
          ['どんな味や香りがするの？'],
          ['{answer}みたいな味や香りなんだね。{word}のこと、少し分かったの。'],
        ],
        FOOD_SEASONING_DEEP_02: [
          'FOOD_5',
          'slot2',
          ['好きな使い方やこだわりはある？'],
          ['{answer}が、{word}の好きな使い方やこだわりなんだね。'],
        ],
        FOOD_OTHER_DEEP_01: [
          'FOOD_6',
          'slot1',
          ['それってどんなことなの？'],
          ['{answer}みたいなことなんだね。{word}のこと、少し分かったの。'],
        ],
        FOOD_OTHER_DEEP_02: [
          'FOOD_6',
          'slot2',
          ['それで思い出す出来事は？'],
          ['{answer}が、{word}で思い出す出来事なんだね。'],
        ],
        PLACE_HOME_DEEP_01: [
          'PLACE_1',
          'slot1',
          ['その家で印象に残っている場所は？'],
          ['{answer}が、{word}で印象に残っている場所なんだね。'],
        ],
        PLACE_HOME_DEEP_02: [
          'PLACE_1',
          'slot2',
          ['その家で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        PLACE_SHOP_DEEP_01: [
          'PLACE_2',
          'slot1',
          ['そのお店のどこが印象に残っている？'],
          ['{answer}が、{word}で印象に残っているところなんだね。'],
        ],
        PLACE_SHOP_DEEP_02: [
          'PLACE_2',
          'slot2',
          ['そのお店で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        PLACE_TOWN_DEEP_01: [
          'PLACE_5',
          'slot1',
          ['その町で一番印象に残る風景は？'],
          ['{answer}が、{word}で一番印象に残っている風景なんだね。'],
        ],
        PLACE_TOWN_DEEP_02: [
          'PLACE_5',
          'slot2',
          ['その町で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        PLACE_FACILITY_DEEP_01: [
          'PLACE_3',
          'slot1',
          ['その施設のどんなところが印象的？'],
          ['{answer}が、{word}で印象的なところなんだね。'],
        ],
        PLACE_FACILITY_DEEP_02: [
          'PLACE_3',
          'slot2',
          ['そこで一番覚えている出来事は？'],
          ['{answer}が、{word}で一番覚えている出来事なんだね。'],
        ],
        PLACE_NATURE_DEEP_01: [
          'PLACE_7',
          'slot1',
          ['そこで一番印象に残っている景色は？'],
          ['{answer}が、{word}で一番印象に残っている景色なんだね。'],
        ],
        PLACE_NATURE_DEEP_02: [
          'PLACE_7',
          'slot2',
          ['そこで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        PLACE_COUNTRY_DEEP_01: [
          'PLACE_6',
          'slot1',
          ['その国にどんな印象を持っている？'],
          ['{answer}な印象なんだね。{word}のこと、少し分かったの。'],
        ],
        PLACE_COUNTRY_DEEP_02: [
          'PLACE_6',
          'slot2',
          ['その国にまつわる思い出は？'],
          ['{answer}が、{word}にまつわる思い出なんだね。'],
        ],
        PLACE_OTHER_DEEP_01: [
          'PLACE_8',
          'slot1',
          ['そこで一番印象に残っている景色は？'],
          ['{answer}が、{word}で一番印象に残っている景色なんだね。'],
        ],
        PLACE_OTHER_DEEP_02: [
          'PLACE_8',
          'slot2',
          ['そこで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        NATURE_SEASON_DEEP_01: [
          'NATURE_TIME_2',
          'slot1',
          ['その季節のどこが好き？ 苦手？'],
          ['{answer}なところが、{word}の好き・苦手な理由なんだね。'],
        ],
        NATURE_SEASON_DEEP_02: [
          'NATURE_TIME_2',
          'slot2',
          ['その季節で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        PLACE_SCHOOL_WORK_DEEP_01: [
          'PLACE_4',
          'slot1',
          ['その学校や職場はどんな雰囲気だった？'],
          ['{answer}な雰囲気の{word}だったんだね。'],
        ],
        PLACE_SCHOOL_WORK_DEEP_02: [
          'PLACE_4',
          'slot2',
          ['そこで一番忘れられない出来事は？'],
          ['{answer}が、{word}で一番忘れられない出来事なんだね。'],
        ],
        OBJECT_FURNITURE_DEEP_01: [
          'OBJECT_1',
          'slot1',
          ['その家具の見た目や使い心地は？'],
          ['{answer}な見た目や使い心地の{word}なんだね。'],
        ],
        OBJECT_FURNITURE_DEEP_02: [
          'OBJECT_1',
          'slot2',
          ['その家具で思い出す出来事は？'],
          ['{answer}が、{word}で思い出す出来事なんだね。'],
        ],
        OBJECT_DAILY_DEEP_01: [
          'OBJECT_2',
          'slot1',
          ['その日用品のどこが使いやすい？ 使いにくい？'],
          ['{answer}ところが、{word}の使いやすさ・使いにくさなんだね。'],
        ],
        OBJECT_DAILY_DEEP_02: [
          'OBJECT_2',
          'slot2',
          ['それを使っていて印象に残った出来事は？'],
          ['{answer}が、{word}を使っていて印象に残った出来事なんだね。'],
        ],
        OBJECT_STATIONERY_DEEP_01: [
          'OBJECT_3',
          'slot1',
          ['その文房具のどこが使いやすい？ 使いにくい？'],
          ['{answer}ところが、{word}の使いやすさ・使いにくさなんだね。'],
        ],
        OBJECT_STATIONERY_DEEP_02: [
          'OBJECT_3',
          'slot2',
          ['それを使っていて印象に残った出来事は？'],
          ['{answer}が、{word}を使っていて印象に残った出来事なんだね。'],
        ],
        OBJECT_COOKING_DEEP_01: [
          'OBJECT_4',
          'slot1',
          ['その道具の使いやすいところは？'],
          ['{answer}ところが、{word}の使いやすいところなんだね。'],
        ],
        OBJECT_COOKING_DEEP_02: [
          'OBJECT_4',
          'slot2',
          ['その道具で思い出す出来事は？'],
          ['{answer}が、{word}で思い出す出来事なんだね。'],
        ],
        OBJECT_HOBBY_DEEP_01: [
          'OBJECT_5',
          'slot1',
          ['その道具のどこが使いやすい？ 使いにくい？'],
          ['{answer}ところが、{word}の使いやすさ・使いにくさなんだね。'],
        ],
        OBJECT_HOBBY_DEEP_02: [
          'OBJECT_5',
          'slot2',
          ['その道具で一番印象に残っている出来事は？'],
          ['{answer}が、{word}で一番印象に残っている出来事なんだね。'],
        ],
        OBJECT_OTHER_DEEP_01: [
          'OBJECT_6',
          'slot1',
          ['それは自分にとってどんな品物？'],
          ['{answer}な品物として、{word}を覚えておくね。'],
        ],
        OBJECT_OTHER_DEEP_02: [
          'OBJECT_6',
          'slot2',
          ['それにまつわる思い出は？'],
          ['{answer}が、{word}にまつわる思い出なんだね。'],
        ],
        CLOTHING_CLOTHES_DEEP_01: [
          'CLOTHING_1',
          'slot1',
          ['その服の見た目や着心地はどう？'],
          ['{answer}な見た目や着心地の{word}なんだね。'],
        ],
        CLOTHING_CLOTHES_DEEP_02: [
          'CLOTHING_1',
          'slot2',
          ['その服で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        CLOTHING_SHOES_DEEP_01: [
          'CLOTHING_2',
          'slot1',
          ['その靴の履き心地はどうだった？'],
          ['{answer}な履き心地の{word}だったんだね。'],
        ],
        CLOTHING_SHOES_DEEP_02: [
          'CLOTHING_2',
          'slot2',
          ['その靴で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        CLOTHING_HAT_DEEP_01: [
          'CLOTHING_3',
          'slot1',
          ['その帽子の見た目やかぶり心地は？'],
          ['{answer}な見た目やかぶり心地の{word}なんだね。'],
        ],
        CLOTHING_HAT_DEEP_02: [
          'CLOTHING_3',
          'slot2',
          ['その帽子で思い出す出来事は？'],
          ['{answer}が、{word}で思い出す出来事なんだね。'],
        ],
        CLOTHING_BAG_DEEP_01: [
          'CLOTHING_4',
          'slot1',
          ['そのバッグの使いやすいところは？'],
          ['{answer}ところが、{word}の使いやすいところなんだね。'],
        ],
        CLOTHING_BAG_DEEP_02: [
          'CLOTHING_4',
          'slot2',
          ['そのバッグで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        CLOTHING_ACCESSORY_DEEP_01: [
          'CLOTHING_5',
          'slot1',
          ['そのアクセサリーの見た目やつけ心地は？'],
          ['{answer}な見た目やつけ心地の{word}なんだね。'],
        ],
        CLOTHING_ACCESSORY_DEEP_02: [
          'CLOTHING_5',
          'slot2',
          ['それにまつわる思い出は？'],
          ['{answer}が、{word}にまつわる思い出なんだね。'],
        ],
        CLOTHING_OTHERWEAR_DEEP_01: [
          'CLOTHING_6',
          'slot1',
          ['それの便利なところ、不便なところは？'],
          ['{answer}ところが、{word}の便利・不便なところなんだね。'],
        ],
        CLOTHING_OTHERWEAR_DEEP_02: [
          'CLOTHING_6',
          'slot2',
          ['それを身につけていた思い出は？'],
          ['{answer}が、{word}を身につけていた思い出なんだね。'],
        ],
        TECH_COMPUTER_SMARTPHONE_DEEP_01: [
          'TECH_1',
          'slot1',
          ['その端末の便利なところ、不便なところは？'],
          ['{answer}ところが、{word}の便利・不便なところなんだね。'],
        ],
        TECH_COMPUTER_SMARTPHONE_DEEP_02: [
          'TECH_1',
          'slot2',
          ['その端末で思い出す出来事は？'],
          ['{answer}が、{word}で思い出す出来事なんだね。'],
        ],
        TECH_HOME_APPLIANCE_DEEP_01: [
          'TECH_2',
          'slot1',
          ['その家電の便利なところ、不便なところは？'],
          ['{answer}ところが、{word}の便利・不便なところなんだね。'],
        ],
        TECH_HOME_APPLIANCE_DEEP_02: [
          'TECH_2',
          'slot2',
          ['その家電で思い出す出来事は？'],
          ['{answer}が、{word}で思い出す出来事なんだね。'],
        ],
        TECH_GAME_CONSOLE_DEEP_01: [
          'TECH_3',
          'slot1',
          ['そのゲーム機のどこが好き？ 苦手？'],
          ['{answer}ところが、{word}の好き・苦手な理由なんだね。'],
        ],
        TECH_GAME_CONSOLE_DEEP_02: [
          'TECH_3',
          'slot2',
          ['そのゲーム機で一番印象に残っている出来事は？'],
          ['{answer}が、{word}で一番印象に残っている出来事なんだね。'],
        ],
        TECH_CAMERA_AUDIO_DEEP_01: [
          'TECH_4',
          'slot1',
          ['その機器の便利なところ、不便なところは？'],
          ['{answer}ところが、{word}の便利・不便なところなんだね。'],
        ],
        TECH_CAMERA_AUDIO_DEEP_02: [
          'TECH_4',
          'slot2',
          ['その機器で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        TECH_APP_SOFTWARE_DEEP_01: [
          'TECH_5',
          'slot1',
          ['そのアプリの便利なところ、不便なところは？'],
          ['{answer}ところが、{word}の便利・不便なところなんだね。'],
        ],
        TECH_APP_SOFTWARE_DEEP_02: [
          'TECH_5',
          'slot2',
          ['そのアプリで印象に残っている出来事は？'],
          ['{answer}が、{word}で印象に残っている出来事なんだね。'],
        ],
        TECH_INTERNET_AI_DEEP_01: [
          'TECH_6',
          'slot1',
          ['それの便利なところ、不便なところは？'],
          ['{answer}ところが、{word}の便利・不便なところなんだね。'],
        ],
        TECH_INTERNET_AI_DEEP_02: [
          'TECH_6',
          'slot2',
          ['それを使っていて印象に残った出来事は？'],
          ['{answer}が、{word}を使っていて印象に残った出来事なんだね。'],
        ],
        TECH_OTHER_DEEP_01: [
          'TECH_7',
          'slot1',
          ['その機器の便利なところ、不便なところは？'],
          ['{answer}ところが、{word}の便利・不便なところなんだね。'],
        ],
        TECH_OTHER_DEEP_02: [
          'TECH_7',
          'slot2',
          ['その機器で印象に残っている出来事は？'],
          ['{answer}が、{word}で印象に残っている出来事なんだね。'],
        ],
        VEHICLE_TRAIN_RAIL_DEEP_01: [
          'VEHICLE_1',
          'slot1',
          ['その電車や路線のどこが印象的？'],
          ['{answer}ところが、{word}の印象的なところなんだね。'],
        ],
        VEHICLE_TRAIN_RAIL_DEEP_02: [
          'VEHICLE_1',
          'slot2',
          ['その電車にまつわる思い出は？'],
          ['{answer}が、{word}にまつわる思い出なんだね。'],
        ],
        VEHICLE_CAR_BIKE_DEEP_01: [
          'VEHICLE_2',
          'slot1',
          ['その車やバイクの乗り心地や印象は？'],
          ['{answer}な乗り心地や印象の{word}なんだね。'],
        ],
        VEHICLE_CAR_BIKE_DEEP_02: [
          'VEHICLE_2',
          'slot2',
          ['その車やバイクで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        VEHICLE_BICYCLE_DEEP_01: [
          'VEHICLE_3',
          'slot1',
          ['その自転車の乗り心地や好きなところは？'],
          ['{answer}な乗り心地や好きなところの{word}なんだね。'],
        ],
        VEHICLE_BICYCLE_DEEP_02: [
          'VEHICLE_3',
          'slot2',
          ['その自転車で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        VEHICLE_AIRPLANE_DEEP_01: [
          'VEHICLE_4',
          'slot1',
          ['その飛行機の印象に残るところは？'],
          ['{answer}ところが、{word}の印象に残るところなんだね。'],
        ],
        VEHICLE_AIRPLANE_DEEP_02: [
          'VEHICLE_4',
          'slot2',
          ['その飛行機にまつわる思い出は？'],
          ['{answer}が、{word}にまつわる思い出なんだね。'],
        ],
        VEHICLE_SHIP_DEEP_01: [
          'VEHICLE_5',
          'slot1',
          ['その船のどんなところが印象的？'],
          ['{answer}ところが、{word}の印象的なところなんだね。'],
        ],
        VEHICLE_SHIP_DEEP_02: [
          'VEHICLE_5',
          'slot2',
          ['その船にまつわる思い出は？'],
          ['{answer}が、{word}にまつわる思い出なんだね。'],
        ],
        VEHICLE_OTHER_DEEP_01: [
          'VEHICLE_6',
          'slot1',
          ['その乗り物のどんなところが印象的？'],
          ['{answer}ところが、{word}の印象的なところなんだね。'],
        ],
        VEHICLE_OTHER_DEEP_02: [
          'VEHICLE_6',
          'slot2',
          ['その乗り物にまつわる思い出は？'],
          ['{answer}が、{word}にまつわる思い出なんだね。'],
        ],
        ACTIVITY_PLAY_DEEP_01: [
          'ACTIVITY_1',
          'slot1',
          ['その遊びで好きだったルールや遊び方は？'],
          ['{answer}が、{word}で好きだったルールや遊び方なんだね。'],
        ],
        ACTIVITY_PLAY_DEEP_02: [
          'ACTIVITY_1',
          'slot2',
          ['その遊びで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        ACTIVITY_TRAVEL_DEEP_01: [
          'ACTIVITY_2',
          'slot1',
          ['そのお出かけで特に楽しかったことは？'],
          ['{answer}が、{word}で特に楽しかったことなんだね。'],
        ],
        ACTIVITY_TRAVEL_DEEP_02: [
          'ACTIVITY_2',
          'slot2',
          ['そのお出かけで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        ACTIVITY_CREATE_DEEP_01: [
          'ACTIVITY_3',
          'slot1',
          ['作るとき、いちばんこだわるところは？'],
          ['{answer}が、{word}を作るときのいちばんのこだわりなんだね。'],
        ],
        ACTIVITY_CREATE_DEEP_02: [
          'ACTIVITY_3',
          'slot2',
          ['その制作で忘れられない出来事は？'],
          ['{answer}が、{word}の制作で忘れられない出来事なんだね。'],
        ],
        ACTIVITY_COLLECT_DEEP_01: [
          'ACTIVITY_4',
          'slot1',
          ['集めるとき、特にこだわっていたことは？'],
          ['{answer}が、{word}を集めるときの特にこだわっていたことなんだね。'],
        ],
        ACTIVITY_COLLECT_DEEP_02: [
          'ACTIVITY_4',
          'slot2',
          ['集めていて忘れられない出来事は？'],
          ['{answer}が、{word}を集めていて忘れられない出来事なんだね。'],
        ],
        ACTIVITY_COOK_HAND_DEEP_01: [
          'ACTIVITY_5',
          'slot1',
          ['作るときに特にこだわっていたことは？'],
          ['{answer}が、{word}を作るときに特にこだわっていたことなんだね。'],
        ],
        ACTIVITY_COOK_HAND_DEEP_02: [
          'ACTIVITY_5',
          'slot2',
          ['作っていて忘れられない出来事は？'],
          ['{answer}が、{word}を作っていて忘れられない出来事なんだね。'],
        ],
        ACTIVITY_OTHER_HOBBY_DEEP_01: [
          'ACTIVITY_6',
          'slot1',
          ['その趣味のどんなところが面白い？'],
          ['{answer}ところが、{word}の面白いところなんだね。'],
        ],
        ACTIVITY_OTHER_HOBBY_DEEP_02: [
          'ACTIVITY_6',
          'slot2',
          ['その趣味で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_BALL_DEEP_01: [
          'SPORTS_1',
          'slot1',
          ['その球技のどんなところが面白い？'],
          ['{answer}ところが、{word}の面白いところなんだね。'],
        ],
        SPORTS_BALL_DEEP_02: [
          'SPORTS_1',
          'slot2',
          ['その球技で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_MARTIAL_DEEP_01: [
          'SPORTS_2',
          'slot1',
          ['その武道や格闘技のどんなところが面白い？'],
          ['{answer}ところが、{word}の面白いところなんだね。'],
        ],
        SPORTS_MARTIAL_DEEP_02: [
          'SPORTS_2',
          'slot2',
          ['その武道や格闘技で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_TRACK_FIELD_DEEP_01: [
          'SPORTS_3',
          'slot1',
          ['その競技のどんなところが面白い？'],
          ['{answer}ところが、{word}の面白いところなんだね。'],
        ],
        SPORTS_TRACK_FIELD_DEEP_02: [
          'SPORTS_3',
          'slot2',
          ['その競技で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_WATER_DEEP_01: [
          'SPORTS_4',
          'slot1',
          ['そのスポーツのどんなところが面白い？'],
          ['{answer}ところが、{word}の面白いところなんだね。'],
        ],
        SPORTS_WATER_DEEP_02: [
          'SPORTS_4',
          'slot2',
          ['そのスポーツで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_SNOW_ICE_DEEP_01: [
          'SPORTS_5',
          'slot1',
          ['そのスポーツのどんなところが面白い？'],
          ['{answer}ところが、{word}の面白いところなんだね。'],
        ],
        SPORTS_SNOW_ICE_DEEP_02: [
          'SPORTS_5',
          'slot2',
          ['そのスポーツで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_DISCIPLINE_DEEP_01: [
          'SPORTS_DISCIPLINE',
          'slot1',
          ['自分の記録や、選手・大会の記録で覚えているものは？'],
          ['{answer}が、{word}で覚えている記録や得点なんだね。'],
        ],
        SPORTS_DISCIPLINE_DEEP_02: [
          'SPORTS_DISCIPLINE',
          'slot2',
          ['その種目で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_TEAM_CLUB_DEEP_01: [
          'SPORTS_TEAM_CLUB',
          'slot1',
          ['そのチームを好きになった・入ったきっかけは？'],
          ['{answer}が、{word}を好きになったり入ったりしたきっかけなんだね。'],
        ],
        SPORTS_TEAM_CLUB_DEEP_02: [
          'SPORTS_TEAM_CLUB',
          'slot2',
          ['そのチームで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_EVENT_MATCH_DEEP_01: [
          'SPORTS_EVENT_MATCH',
          'slot1',
          ['出場・観戦した思い出や、知識として覚えている勝敗・得点・順位は？'],
          ['{answer}が、{word}で覚えている結果なんだね。'],
        ],
        SPORTS_EVENT_MATCH_DEEP_02: [
          'SPORTS_EVENT_MATCH',
          'slot2',
          ['その大会や試合で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SPORTS_OTHER_DEEP_01: [
          'SPORTS_6',
          'slot1',
          ['それを始めた・続けていた理由は？'],
          ['{answer}が、{word}を始めたり続けたりしていた理由なんだね。'],
        ],
        SPORTS_OTHER_DEEP_02: [
          'SPORTS_6',
          'slot2',
          ['それをしていて忘れられない出来事は？'],
          ['{answer}が、{word}をしていて忘れられない出来事なんだね。'],
        ],
        WORK_OCCUPATION_DEEP_01: [
          'WORK_1',
          'slot1',
          ['その職業の魅力や大変だと思うところは？'],
          ['{answer}が、{word}について人間さんが感じている印象なんだね。'],
        ],
        WORK_OCCUPATION_DEEP_02: [
          'WORK_1',
          'slot2',
          ['その職業にまつわる忘れられない出来事は？'],
          ['{answer}が、{word}にまつわる忘れられない出来事なんだね。'],
        ],
        WORK_TASK_DEEP_01: [
          'WORK_2',
          'slot1',
          ['その作業で自分なりに工夫していたことは？'],
          ['{answer}が、{word}で人間さんなりに工夫していたことなんだね。'],
        ],
        WORK_TASK_DEEP_02: [
          'WORK_2',
          'slot2',
          ['その作業で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        WORK_COMPANY_DEEP_01: [
          'WORK_3',
          'slot1',
          ['その職場の好きだったところ、苦手だったところは？'],
          ['{answer}が、{word}について人間さんが感じている印象なんだね。'],
        ],
        WORK_COMPANY_DEEP_02: [
          'WORK_3',
          'slot2',
          ['その職場で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        WORK_STYLE_DEEP_01: [
          'WORK_4',
          'slot1',
          ['その働き方を選んだ・続けていた理由は？'],
          ['{answer}が、{word}を選んだり続けたりしていた理由なんだね。'],
        ],
        WORK_STYLE_DEEP_02: [
          'WORK_4',
          'slot2',
          ['その働き方で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        WORK_RULES_DEEP_01: [
          'WORK_5',
          'slot1',
          ['そのルールや制度の良いところ、困るところは？'],
          ['{answer}は、{word}について人間さんが感じていることなんだね。'],
        ],
        WORK_RULES_DEEP_02: [
          'WORK_5',
          'slot2',
          ['そのルールや制度で印象に残った出来事は？'],
          ['{answer}が、{word}で印象に残った出来事なんだね。'],
        ],
        WORK_OTHER_DEEP_01: [
          'WORK_6',
          'slot1',
          ['そのとき、何を考えてどうしようと思った？'],
          ['{answer}が、そのとき人間さんが考えていたことや選ぼうとしていたことなんだね。'],
        ],
        WORK_OTHER_DEEP_02: [
          'WORK_6',
          'slot2',
          ['そのことで忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SCHOOL_LIFE_DEEP_01: [
          'SCHOOL_1',
          'slot1',
          ['その学校生活の好きだったところ、嫌だったところは？'],
          ['{answer}は、そのころの学校生活について人間さんが感じていたことなんだね。'],
        ],
        SCHOOL_LIFE_DEEP_02: [
          'SCHOOL_1',
          'slot2',
          ['その学校生活で忘れられない出来事は？'],
          ['{answer}が、そのころの{word}で忘れられない出来事なんだね。'],
        ],
        SCHOOL_SUBJECT_DEEP_01: [
          'SCHOOL_2',
          'slot1',
          ['その教科の好きだったところ、苦手だったところは？'],
          ['{answer}は、そのころ{word}について人間さんが感じていたことなんだね。'],
        ],
        SCHOOL_SUBJECT_DEEP_02: [
          'SCHOOL_2',
          'slot2',
          ['その教科で忘れられない出来事は？'],
          ['{answer}が、そのころの{word}で忘れられない出来事なんだね。'],
        ],
        SCHOOL_HOMEWORK_DEEP_01: [
          'SCHOOL_3',
          'slot1',
          ['その宿題で苦労したことや工夫したことは？'],
          ['{answer}は、{word}に取り組んだときの人間さんの工夫や苦労なんだね。'],
        ],
        SCHOOL_HOMEWORK_DEEP_02: [
          'SCHOOL_3',
          'slot2',
          ['その宿題で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SCHOOL_EXAM_DEEP_01: [
          'SCHOOL_4',
          'slot1',
          ['その試験の結果で覚えていることは？'],
          ['{answer}が、{word}の結果で覚えていることなんだね。'],
        ],
        SCHOOL_EXAM_DEEP_02: [
          'SCHOOL_4',
          'slot2',
          ['その試験で忘れられない出来事は？'],
          ['{answer}が、{word}で忘れられない出来事なんだね。'],
        ],
        SCHOOL_QUALIFICATION_DEEP_01: [
          'SCHOOL_5',
          'slot1',
          ['その資格を知ったきっかけや、目指した理由は？'],
          ['{answer}が、{word}を知ったきっかけや目指した理由なんだね。'],
        ],
        SCHOOL_QUALIFICATION_DEEP_02: [
          'SCHOOL_5',
          'slot2',
          ['その資格で経験したことや、今思っていることは？'],
          ['{answer}は、{word}についての人間さんの経験や今の気持ちなんだね。'],
        ],
        SCHOOL_FUTURE_STUDY_DEEP_01: [
          'SCHOOL_6',
          'slot1',
          ['どうしてその勉強を始めたの？ 何を目指していた？'],
          ['{answer}が、{word}を始めた理由や目指していたことなんだね。'],
        ],
        SCHOOL_FUTURE_STUDY_DEEP_02: [
          'SCHOOL_6',
          'slot2',
          ['その勉強で苦労したことや、身についたことは？'],
          ['{answer}は、{word}について人間さんが話してくれた経験なんだね。'],
        ],
        SCHOOL_OTHER_DEEP_01: [
          'SCHOOL_7',
          'slot1',
          ['それは、何がきっかけだったの？'],
          ['{answer}が、{word}の経験のきっかけだったんだね。'],
        ],
        SCHOOL_OTHER_DEEP_02: [
          'SCHOOL_7',
          'slot2',
          ['その経験で印象に残ったことや、変わったことは？'],
          ['{answer}は、{word}の経験について人間さんが話してくれた印象や変化なんだね。'],
        ],
        MANGA_DEEP_01: [
          'GAME_MEDIA_1',
          'slot1',
          ['その漫画の好きなところ、苦手なところは？'],
          ['{answer}は、そのころ{word}について人間さんが感じていたことなんだね。'],
        ],
        MANGA_DEEP_02: [
          'GAME_MEDIA_1',
          'slot2',
          ['印象に残ったキャラクターをどう思った？'],
          ['{answer}は、{word}のキャラクターについて人間さんが感じたことなんだね。'],
        ],
        MANGA_DEEP_03: [
          'GAME_MEDIA_1',
          'slot3',
          ['その漫画で忘れられない場面は？'],
          ['{answer}が、{word}で忘れられない場面なんだね。'],
        ],
        MANGA_DEEP_04: [
          'GAME_MEDIA_1',
          'slot4',
          ['その漫画とは、どんなときに出会ったの？'],
          ['{answer}が、{word}と出会ったときの記憶なんだね。'],
        ],
        MANGA_DEEP_05: [
          'GAME_MEDIA_1',
          'slot5',
          ['その漫画を読んで、考え方や行動に影響はあった？'],
          ['{answer}なんだね。{word}を読んでどう感じたか、そのまま覚えておくの。'],
        ],
      };
      expected.ANIME_DEEP_01 = [
        'GAME_MEDIA_2', 'slot1',
        ['そのアニメの好きなところ、苦手なところは？'],
        ['{answer}は、そのころ{word}について人間さんが感じていたことなんだね。'],
      ];
      expected.ANIME_DEEP_02 = [
        'GAME_MEDIA_2', 'slot2',
        ['そのアニメの映像や声の演出で印象に残ったことは？'],
        ['{answer}が、{word}の映像や声の演出で印象に残ったことなんだね。'],
      ];
      expected.ANIME_DEEP_03 = [
        'GAME_MEDIA_2', 'slot3',
        ['そのアニメで忘れられない場面は？'],
        ['{answer}が、{word}で忘れられない場面なんだね。'],
      ];
      expected.ANIME_DEEP_04 = [
        'GAME_MEDIA_2', 'slot4',
        ['そのアニメを初めて見たのは、どんなときだった？'],
        ['{answer}が、{word}を初めて見たときの記憶なんだね。'],
      ];
      expected.ANIME_DEEP_05 = [
        'GAME_MEDIA_2', 'slot5',
        ['そのアニメを見て、考え方や行動に影響はあった？'],
        ['{answer}なんだね。{word}を見てどう感じたか、そのまま覚えておくの。'],
      ];
      expected.GAME_DEEP_01 = [
        'GAME_MEDIA_3', 'slot1',
        ['そのゲームの好きなところ、苦手なところは？'],
        ['{answer}は、そのころ{word}について人間さんが感じていたことなんだね。'],
      ];
      expected.GAME_DEEP_02 = [
        'GAME_MEDIA_3', 'slot2',
        ['そのゲームで、どんな遊び方が一番面白かった？'],
        ['{answer}が、{word}で人間さんが面白いと感じた遊び方なんだね。'],
      ];
      expected.GAME_DEEP_03 = [
        'GAME_MEDIA_3', 'slot3',
        ['そのゲームで難しかったことは？', 'どう対処した？'],
        ['{answer}は、{word}で人間さんが話してくれた難しかったことや対処なんだね。'],
      ];
      expected.GAME_DEEP_04 = [
        'GAME_MEDIA_3', 'slot4',
        ['そのゲームで忘れられない選択や出来事は？'],
        ['{answer}が、{word}で忘れられない選択や出来事なんだね。'],
      ];
      expected.GAME_DEEP_05 = [
        'GAME_MEDIA_3', 'slot5',
        ['そのゲームを初めて遊んだのは、どんなときだった？'],
        ['{answer}が、{word}を初めて遊んだときの記憶なんだね。'],
      ];
      expected.NOVEL_DEEP_01 = [
        'GAME_MEDIA_NOVEL', 'slot1',
        ['その小説の好きなところ、納得できなかったところは？'],
        ['{answer}は、{word}について人間さんが感じたことなんだね。'],
      ];
      expected.NOVEL_DEEP_02 = [
        'GAME_MEDIA_NOVEL', 'slot2',
        ['その小説の文章や情景描写で、心に残ったところは？'],
        ['{answer}が、{word}の文章や情景描写で心に残ったところなんだね。'],
      ];
      expected.NOVEL_DEEP_03 = [
        'GAME_MEDIA_NOVEL', 'slot3',
        ['登場人物の行動や気持ちで、共感できたところ、できなかったところは？'],
        ['{answer}は、{word}の登場人物について人間さんが感じたことなんだね。'],
      ];
      expected.NOVEL_DEEP_04 = [
        'GAME_MEDIA_NOVEL', 'slot4',
        ['その小説の展開や結末を、どう受け止めた？', 'まだ読んでいないところや結末を知らない場合は、飛ばして大丈夫だよ。'],
        ['{answer}が、{word}の展開や結末について人間さんが受け止めたことなんだね。'],
      ];
      expected.NOVEL_DEEP_05 = [
        'GAME_MEDIA_NOVEL', 'slot5',
        ['その小説とは、どんなときに出会ったの？'],
        ['{answer}が、{word}と出会ったときの読書の記憶なんだね。'],
      ];
      expected.CHARACTER_DEEP_01 = [
        'GAME_MEDIA_4', 'slot1',
        ['そのキャラクターの好きなところ、苦手なところは？'],
        ['{answer}は、{word}について人間さんが感じたことなんだね。'],
      ];
      expected.CHARACTER_DEEP_02 = [
        'GAME_MEDIA_4', 'slot2',
        ['そのキャラクターの行動で、納得できたことや疑問に思ったことは？'],
        ['{answer}は、{word}の行動について人間さんが感じたことなんだね。'],
      ];
      expected.CHARACTER_DEEP_03 = [
        'GAME_MEDIA_4', 'slot3',
        ['そのキャラクターの成長や変化で、印象に残ったことは？'],
        ['{answer}が、{word}の成長や変化について印象に残ったことなんだね。'],
      ];
      expected.CHARACTER_DEEP_04 = [
        'GAME_MEDIA_4', 'slot4',
        ['そのキャラクターと他の人物の関係で、印象に残ったことは？'],
        ['{answer}が、{word}と他の人物との関係について印象に残ったことなんだね。'],
      ];
      expected.CHARACTER_DEEP_05 = [
        'GAME_MEDIA_4', 'slot5',
        ['そのキャラクターと自分で、似ているところや違うところは？'],
        ['{answer}は、{word}と自分を比べて人間さんが感じたことなんだね。'],
      ];
      expected.SERIES_DEEP_01 = [
        'GAME_MEDIA_5', 'slot1',
        ['そのシリーズ全体の好きなところ、苦手なところは？'],
        ['{answer}は、{word}シリーズについて人間さんが感じていることなんだね。'],
      ];
      expected.SERIES_DEEP_02 = [
        'GAME_MEDIA_5', 'slot2',
        ['シリーズの中で、特に好きな作品や時期は？', 'どうしてそう思うの？'],
        ['{answer}が、{word}シリーズの中で特に好きな作品や時期なんだね。'],
      ];
      expected.SERIES_DEEP_03 = [
        'GAME_MEDIA_5', 'slot3',
        ['そのシリーズの世界観や設定で、面白いと思うところは？'],
        ['{answer}は、{word}シリーズの世界観や設定について人間さんが面白いと感じたところなんだね。'],
      ];
      expected.SERIES_DEEP_04 = [
        'GAME_MEDIA_5', 'slot4',
        ['シリーズが続く中で、良くなったことや残念だったことは？'],
        ['{answer}は、{word}シリーズの変化について人間さんが感じたことなんだね。'],
      ];
      expected.SERIES_DEEP_05 = [
        'GAME_MEDIA_5', 'slot5',
        ['そのシリーズとはいつ出会って、どう楽しんできたの？'],
        ['{answer}が、{word}シリーズとの出会いや楽しみ方の記憶なんだね。'],
      ];
      expected.TERM_DEEP_01 = [
        'GAME_MEDIA_6', 'slot1',
        ['その用語のどんなところが好き？', '気になるところは？'],
        ['{answer}は、{word}について人間さんが感じていることなんだね。'],
      ];
      expected.TERM_DEEP_02 = [
        'GAME_MEDIA_6', 'slot2',
        ['その用語は、物語の中でどんな役割を持っていると思う？'],
        ['{answer}は、{word}が物語で持つ役割について人間さんが考えたことなんだね。'],
      ];
      expected.TERM_DEEP_03 = [
        'GAME_MEDIA_6', 'slot3',
        ['その用語が登場する場面で、印象に残ったところは？'],
        ['{answer}が、{word}の登場する場面で印象に残ったところなんだね。'],
      ];
      expected.TERM_DEEP_04 = [
        'GAME_MEDIA_6', 'slot4',
        ['その名前や設定を初めて知ったとき、どう思った？'],
        ['{answer}が、{word}を初めて知ったときの人間さんの印象なんだね。'],
      ];
      expected.TERM_DEEP_05 = [
        'GAME_MEDIA_6', 'slot5',
        ['その用語にまつわる、人間さん自身の思い出は？'],
        ['{answer}が、{word}にまつわる人間さん自身の思い出なんだね。'],
      ];
      expected.GAME_MEDIA_OTHER_DEEP_01 = [
        'GAME_MEDIA_7', 'slot1',
        ['その楽しみ方の好きなところ、合わないところは？'],
        ['{answer}は、{word}という楽しみ方について人間さんが感じていることなんだね。'],
      ];
      expected.GAME_MEDIA_OTHER_DEEP_02 = [
        'GAME_MEDIA_7', 'slot2',
        ['その楽しみ方を知ったきっかけは？'],
        ['{answer}が、{word}という楽しみ方を知ったきっかけなんだね。'],
      ];
      expected.GAME_MEDIA_OTHER_DEEP_03 = [
        'GAME_MEDIA_7', 'slot3',
        ['それについて、自分なりに考えたり工夫したことは？'],
        ['{answer}は、{word}について人間さんが自分なりに考えたり工夫したことなんだね。'],
      ];
      expected.GAME_MEDIA_OTHER_DEEP_04 = [
        'GAME_MEDIA_7', 'slot4',
        ['それを通じて、人との印象に残ったやりとりは？'],
        ['{answer}が、{word}を通じた人との印象に残るやりとりなんだね。'],
      ];
      expected.GAME_MEDIA_OTHER_DEEP_05 = [
        'GAME_MEDIA_7', 'slot5',
        ['それによって作品の見え方や気持ちは変わった？'],
        ['{answer}は、{word}によって作品の見え方や気持ちに変化があったかという人間さんの受け止め方なんだね。'],
      ];
      assert.equal(PERSON_DEEP_DIVE_CONVERSATIONS.length, 380);
      for (const [id, [subcategory, slot, opening, closing]] of Object.entries(
        expected,
      )) {
        const conversation = PERSON_DEEP_DIVE_CONVERSATIONS.find(
          (item) => item.id === id,
        );
        assert.equal(conversation?.parentSubcategory, subcategory);
        assert.equal(conversation?.slot, slot);
        assert.deepEqual(
          conversation?.opening.map((line) => line.text),
          opening,
        );
        assert.deepEqual(
          conversation?.closing.map((line) => line.text),
          closing,
        );
      }
    },
  );

  run('PERSON元ワードの掘り下げ1・2をWordEntryと分離して保存・復元する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const cases = [
      ['母親', 'PERSON_1', 'family_relation', 'person_trait'],
      ['友人A', 'PERSON_2', 'friend_relation', 'person_trait'],
      ['大切な人A', 'PERSON_3', 'important_reason', 'favorite_trait'],
      ['先生A', 'PERSON_4', 'workschool_relation', 'learned_from_person'],
      ['歌手A', 'PERSON_ENTERTAINER', 'known_for', 'impression'],
      ['漫画家A', 'PERSON_MANGA_ARTIST', 'known_for', 'impression'],
      ['作家A', 'PERSON_AUTHOR_WRITER', 'known_for', 'impression'],
      ['選手A', 'PERSON_ATHLETE', 'known_for', 'impression'],
      ['科学者A', 'PERSON_SCIENTIST', 'known_for', 'impression'],
      ['その他の人A', 'PERSON_OTHER', 'person_relation', 'key_feature'],
    ];
    const words = cases.map(([surface, subcategory]) =>
      teachPerson(conversation, surface, subcategory),
    );
    const wordCount = conversation.getWordEntries().length;

    words.forEach((word, index) => {
      assert.ok(word);
      assert.equal(
        conversation.setPersonWordDeepDive(
          word.id,
          'slot1',
          `関係${index + 1}`,
        ),
        true,
      );
      assert.equal(
        conversation.setPersonWordDeepDive(
          word.id,
          'slot2',
          `特徴${index + 1}`,
        ),
        true,
      );
      assert.deepEqual(conversation.getPersonWordDeepDive(word.id), {
        slot1: { key: cases[index][2], value: `関係${index + 1}` },
        slot2: { key: cases[index][3], value: `特徴${index + 1}` },
      });
    });
    assert.equal(conversation.getWordEntries().length, wordCount);
    assert.equal(
      conversation.getWordEntries().some((word) => word.surface === '関係1'),
      false,
    );
    assert.equal(
      conversation.setPersonWordDeepDive(words[0].id, 'slot1', '   '),
      false,
    );

    const reloaded = create(storage, undefined, () => 0);
    assert.deepEqual(reloaded.getPersonWordDeepDive(words[0].id), {
      slot1: { key: 'family_relation', value: '関係1' },
      slot2: { key: 'person_trait', value: '特徴1' },
    });
    reloaded.reset();
    assert.deepEqual(reloaded.getPersonWordDeepDives(), {});
  });

  run('歴史人物は5つの掘り下げを保存し、初回後は残り3問を優先する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const military = teachPerson(conversation, '武将A', 'PERSON_HISTORICAL_MILITARY');
    const firstComboIds = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(military.id);
      assert.ok(question);
      firstComboIds.push(question.id);
      assert.equal(
        conversation.submitPersonComboAnswer(military.id, question.id, `軍事回答${index + 1}`)?.ok,
        true,
      );
    }
    assert.equal(firstComboIds.filter((id) => id.includes('_DEEP_')).length, 2);
    assert.equal(firstComboIds.filter((id) => id.includes('_V2_')).length, 4);

    const secondComboIds = [];
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(military.id);
      assert.ok(question);
      secondComboIds.push(question.id);
      assert.equal(
        conversation.submitPersonComboAnswer(military.id, question.id, `軍事追加${index + 1}`)?.ok,
        true,
      );
    }
    assert.equal(secondComboIds.filter((id) => id.includes('_DEEP_')).length, 3);
    assert.equal(secondComboIds.filter((id) => id.includes('_V2_')).length, 3);
    assert.deepEqual(conversation.getPersonWordDeepDive(military.id), {
      slot1: { key: 'known_for', value: '軍事回答3' },
      slot2: { key: 'personality', value: '軍事回答6' },
      slot3: { key: 'memorable_event', value: '軍事追加2' },
      slot4: { key: 'strength', value: '軍事追加4' },
      slot5: { key: 'weakness', value: '軍事追加6' },
    });

    const cultural = teachPerson(conversation, '文化人A', 'PERSON_HISTORICAL_CULTURAL');
    assert.equal(
      conversation.getNextPersonComboQuestion(cultural.id)?.id,
      'PERSON_HISTORICAL_CULTURAL_V2_01',
    );
    for (let index = 0; index < 5; index += 1) {
      const questionId = `PERSON_HISTORICAL_CULTURAL_DEEP_0${index + 1}`;
      assert.equal(
        conversation.submitPersonComboAnswer(cultural.id, questionId, `文化回答${index + 1}`)?.ok,
        true,
      );
    }
    assert.deepEqual(conversation.getPersonWordDeepDive(cultural.id), {
      slot1: { key: 'known_for', value: '文化回答1' },
      slot2: { key: 'personality', value: '文化回答2' },
      slot3: { key: 'memorable_work', value: '文化回答3' },
      slot4: { key: 'strength', value: '文化回答4' },
      slot5: { key: 'disagreement', value: '文化回答5' },
    });
    assert.ok(conversation.getNextPersonComboQuestion(cultural.id));
  });

  run('歴史の文化的人物は派生20問と掘り下げ5問の後にコンボ候補から外れる', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '文化人B', 'PERSON_HISTORICAL_CULTURAL');
    let derivedCount = 0;
    let deepDiveCount = 0;
    for (let index = 0; index < 25; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      const before = conversation.getWordEntries().length;
      assert.equal(
        conversation.submitPersonComboAnswer(parent.id, question.id, `文化コンボ回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'deepDive') {
        deepDiveCount += 1;
        assert.equal(conversation.getWordEntries().length, before);
      } else {
        derivedCount += 1;
      }
    }
    assert.equal(derivedCount, 20);
    assert.equal(deepDiveCount, 5);
    assert.equal(conversation.getNextPersonComboQuestion(parent.id), null);
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id),
      false,
    );
  });

  run('配信者は5項目を単語化せず保存し、25問後にコンボ候補から外れる', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '配信者A', 'PERSON_STREAMER');
    const firstComboKinds = [];
    const secondComboKinds = [];
    let derivedCount = 0;
    let deepDiveCount = 0;
    for (let index = 0; index < 25; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      if (index < 6) firstComboKinds.push(question.kind);
      if (index >= 6 && index < 12) secondComboKinds.push(question.kind);
      const before = conversation.getWordEntries().length;
      assert.equal(
        conversation.submitPersonComboAnswer(parent.id, question.id, `配信者回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'deepDive') {
        deepDiveCount += 1;
        assert.equal(conversation.getWordEntries().length, before);
      } else {
        derivedCount += 1;
      }
    }
    assert.equal(firstComboKinds.filter((kind) => kind === 'deepDive').length, 2);
    assert.equal(firstComboKinds.filter((kind) => kind === 'derived').length, 4);
    assert.equal(secondComboKinds.filter((kind) => kind === 'deepDive').length, 3);
    assert.equal(secondComboKinds.filter((kind) => kind === 'derived').length, 3);
    assert.equal(derivedCount, 20);
    assert.equal(deepDiveCount, 5);
    assert.deepEqual(
      Object.values(conversation.getPersonWordDeepDive(parent.id) ?? {}).map((entry) => entry.key),
      ['known_for', 'watching_reason', 'memorable_moment', 'impression', 'disliked_trait'],
    );
    assert.equal(conversation.getNextPersonComboQuestion(parent.id), null);
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id),
      false,
    );
  });

  run('その他の人はv2の派生20問と掘り下げ2問を消化すると候補から外れる', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '近所の人A', 'PERSON_OTHER');
    let derivedCount = 0;
    let deepDiveCount = 0;
    for (let index = 0; index < 22; index += 1) {
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      assert.ok(
        question.id.startsWith('PERSON_OTHER_V2_') || question.id.startsWith('PERSON_OTHER_DEEP_'),
      );
      const before = conversation.getWordEntries().length;
      assert.equal(
        conversation.submitPersonComboAnswer(parent.id, question.id, `その他回答${index + 1}`)?.ok,
        true,
      );
      if (question.kind === 'deepDive') {
        deepDiveCount += 1;
        assert.equal(conversation.getWordEntries().length, before);
      } else {
        derivedCount += 1;
      }
    }
    assert.equal(derivedCount, 20);
    assert.equal(deepDiveCount, 2);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'person_relation', value: 'その他回答3' },
      slot2: { key: 'key_feature', value: 'その他回答6' },
    });
    assert.equal(conversation.getNextPersonComboQuestion(parent.id), null);
    assert.equal(
      conversation.getPersonWordComboCandidates().some((word) => word.id === parent.id),
      false,
    );
  });

  run('PERSON_1初回コンボは派生4問・掘り下げ2問を重複なく保存する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0.5);
    prepare(conversation);
    const parent = teachPerson(conversation, '母親', 'PERSON_1');
    const otherParent = teachPerson(conversation, '祖母', 'PERSON_1');
    const rootId = parent.id;
    assert.equal(conversation.selectPersonWordComboParent()?.id, rootId);
    const answers = {
      PERSON_FAMILY_DEEP_01: 'けつえんじょうのははおや',
      PERSON_FAMILY_DEEP_02: 'かれーをよくつくる',
    };
    const seen = [];
    let deepDiveCount = 0;
    let derivedCount = 0;
    for (let index = 0; index < 6; index += 1) {
      const question = conversation.getNextPersonComboQuestion(rootId);
      assert.ok(question);
      conversation.markPersonComboQuestionPresented(rootId, question.id);
      assert.equal(seen.includes(question.id), false);
      seen.push(question.id);
      const before = conversation.getWordEntries().length;
      const result = conversation.submitPersonComboAnswer(
        rootId,
        question.id,
        answers[question.id] ?? `ことば${index + 1}`,
      );
      assert.equal(result?.ok, true);
      if (question.kind === 'deepDive') {
        deepDiveCount += 1;
        assert.equal(conversation.getWordEntries().length, before);
      } else {
        derivedCount += 1;
      }
    }
    assert.equal(deepDiveCount, 2);
    assert.equal(derivedCount, 4);
    assert.equal(new Set(seen).size, 6);
    assert.ok(conversation.getNextPersonComboQuestion(rootId));
    assert.deepEqual(conversation.getPersonWordDeepDive(rootId), {
      slot1: { key: 'family_relation', value: 'けつえんじょうのははおや' },
      slot2: { key: 'person_trait', value: 'かれーをよくつくる' },
    });
    const children = conversation.getWordEntries()
      .filter((word) => word.firstDerivedFromWordId === rootId);
    assert.equal(children.length, 4);
    for (const child of children) {
      assert.equal(child.rootWordId, rootId);
      assert.equal(conversation.getWordReading(child.id), child.surface);
    }
    assert.deepEqual(conversation.getPersonComboParentProgress()[rootId], {
      questionPromptCount: 6,
      lastQuestionDay: 1,
      selectedAsParentCount: 1,
    });
    const reloaded = create(storage, undefined, () => 0.5);
    assert.deepEqual(reloaded.getPersonComboParentProgress()[rootId], {
      questionPromptCount: 6,
      lastQuestionDay: 1,
      selectedAsParentCount: 1,
    });
    assert.deepEqual(reloaded.getComboParentRecentHistory(), [rootId]);
    assert.equal(reloaded.selectPersonWordComboParent()?.id, otherParent.id);
  });

  run('ことばコンボの親は直近5回を避け、派生した人も独立して巡回する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const mother = teachPerson(conversation, 'お母さん', 'PERSON_1');
    assert.equal(
      conversation.submitPersonComboAnswer(mother.id, 'PERSON_FAMILY_V2_01', 'たけし')?.ok,
      true,
    );
    const derived = conversation.getWordEntries()
      .find((word) => word.surface === 'たけし');
    assert.equal(derived?.firstDerivedFromWordId, mother.id);

    // 親を選んだ直後でも、派生語は別IDの候補として選べる。
    assert.equal(conversation.selectPersonWordComboParent()?.id, mother.id);
    assert.equal(conversation.selectPersonWordComboParent()?.id, derived?.id);

    const others = ['お祖母ちゃん', '兄', '姉', '叔父'].map((surface) => (
      teachPerson(conversation, surface, 'PERSON_1')
    ));
    for (const word of others) {
      assert.equal(conversation.selectPersonWordComboParent()?.id, word.id);
    }

    // 5回の履歴から外れた最初の親は、未消化質問を保ったまま再登場できる。
    assert.equal(conversation.selectPersonWordComboParent()?.id, mother.id);
    assert.deepEqual(conversation.getComboParentRecentHistory(), [
      others[0].id,
      others[1].id,
      others[2].id,
      others[3].id,
      mother.id,
    ]);
    const reloaded = create(storage, undefined, () => 0);
    assert.deepEqual(reloaded.getComboParentRecentHistory(), conversation.getComboParentRecentHistory());
    assert.ok(reloaded.getNextPersonComboQuestion(mother.id));
    assert.ok(reloaded.getNextPersonComboQuestion(derived.id));
  });

  run('PERSON_1の20問履歴は元キーワードIDごとに独立する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const mother = teachPerson(conversation, 'おかあさん', 'PERSON_1');
    const grandmother = teachPerson(conversation, 'おばあちゃん', 'PERSON_1');
    const motherQuestion = conversation.getNextPersonComboQuestion(mother.id);
    assert.equal(motherQuestion.id, 'PERSON_FAMILY_V2_01');
    assert.equal(
      conversation.submitPersonComboAnswer(mother.id, motherQuestion.id, 'あね')?.ok,
      true,
    );
    assert.equal(
      conversation.getPersonDerivedConversationUses()[mother.id].includes('PERSON_FAMILY_V2_01'),
      true,
    );
    assert.equal(
      conversation.getPersonDerivedConversationUses()[grandmother.id],
      undefined,
    );
    assert.equal(
      conversation.getNextPersonComboQuestion(grandmother.id)?.id,
      'PERSON_FAMILY_V2_01',
    );
  });

  run('コンボの時間切れ相当は未消化、スキップは消化済みとして扱う', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '父親', 'PERSON_1');
    const first = conversation.getNextPersonComboQuestion(parent.id);
    conversation.markPersonComboQuestionPresented(parent.id, first.id);
    const afterTimeoutReload = create(storage, undefined, () => 0);
    const retry = afterTimeoutReload.getNextPersonComboQuestion(parent.id);
    assert.equal(retry.id, first.id);
    const beforeWords = afterTimeoutReload.getWordEntries().length;
    assert.equal(afterTimeoutReload.skipPersonComboQuestion(parent.id, retry.id), true);
    assert.equal(afterTimeoutReload.getWordEntries().length, beforeWords);
    assert.equal(
      afterTimeoutReload.getPersonDerivedConversationUses()[parent.id].includes(retry.id),
      true,
    );
    assert.notEqual(afterTimeoutReload.getNextPersonComboQuestion(parent.id)?.id, retry.id);
  });

  run('既存語を派生回答に使っても既存カテゴリーを上書きしない', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '母', 'PERSON_1');
    conversation.startWordTeaching();
    conversation.submit('ぽっきー');
    conversation.chooseCategory('OTHER');
    conversation.chooseSubCategory('OTHER_1');
    conversation.choose('WORD_NEUTRAL');
    const existing = conversation.getWordEntries().find((word) => word.surface === 'ぽっきー');
    assert.equal(
      conversation.submitPersonComboAnswer(parent.id, 'PERSON_FAMILY_V2_04', 'ぽっきー')?.wordId,
      existing.id,
    );
    const after = conversation.getWordEntries().find((word) => word.id === existing.id);
    assert.equal(after.category, 'OTHER');
    assert.equal(after.subcategory, 'OTHER_1');
    assert.ok(conversation.getMemoryRelations().some((relation) => (
      relation.subjectId === parent.id
      && relation.objectId === existing.id
      && relation.qualifier === 'PERSON_FAMILY_V2_04'
    )));
  });

  run(
    '開発者用ことばコンボはPERSON語がなくても開始でき、記憶を汚さない',
    () => {
      const storage = memory();
      const conversation = create(storage, undefined, () => 0);
      prepare(conversation);
      assert.equal(conversation.getPersonWordComboCandidates().length, 0);
      const parent = conversation.startDevelopmentPersonCombo();
      assert.equal(parent.category, 'PERSON');
      assert.equal(parent.subcategory, 'PERSON_2');
      const question = conversation.getNextPersonComboQuestion(parent.id);
      assert.ok(question);
      const result = conversation.submitPersonComboAnswer(
        parent.id,
        question.id,
        'れんしゅう',
      );
      assert.equal(result?.ok, true);
      assert.equal(result?.preview, true);
      assert.equal(conversation.getWordEntries().length, 0);
      assert.equal(create(storage).getWordEntries().length, 0);
    },
  );

  run(
    'ことばの欠片6個を1コインへ変換し、PERFECTで追加1コインを一度だけ与える',
    () => {
      let rewards = { wordFragments: 0, gachaCoins: 0, wordComboRewardIds: [] };
      for (let index = 1; index <= 5; index += 1) {
        rewards = awardWordComboAnswer(rewards, `answer-${index}`);
      }
      assert.equal(rewards.wordFragments, 5);
      assert.equal(rewards.gachaCoins, 0);
      rewards = awardWordComboAnswer(rewards, 'answer-6', 'perfect-root-1');
      assert.equal(rewards.wordFragments, 0);
      assert.equal(rewards.gachaCoins, 2);
      const duplicate = awardWordComboAnswer(
        rewards,
        'answer-6',
        'perfect-root-1',
      );
      assert.equal(duplicate.fragmentAwarded, false);
      assert.equal(duplicate.wordFragments, 0);
      assert.equal(duplicate.gachaCoins, 2);
      const formalized = awardWordComboAnswer(
        duplicate,
        'person-combo-formalized:word-1',
      );
      assert.equal(formalized.fragmentAwarded, true);
      const formalizedAgain = awardWordComboAnswer(
        formalized,
        'person-combo-formalized:word-1',
      );
      assert.equal(formalizedAgain.fragmentAwarded, false);
      assert.equal(formalizedAgain.wordFragments, formalized.wordFragments);
    },
  );

  run('ことばコンボダンスは2表情・6フレームと静止を含む緩急で表示する', () => {
    assert.deepEqual(
      [...WORD_COMBO_DANCE_FRAME_DURATIONS],
      [150, 150, 160, 220, 150, 160],
    );
    assert.equal(WORD_COMBO_DANCE_CYCLE_MS, 2270);
    for (const expression of ['arc', 'squint']) {
      const frames = getWordComboDanceFrames(expression);
      assert.equal(frames.length, 6);
      assert.equal(frames[0].src.includes(`/dance_01_${expression}.png?`), true);
      assert.equal(frames[5].src.includes(`/dance_06_${expression}.png?`), true);
      assert.deepEqual(
        frames.map((frame) => frame.durationMs),
        [150, 150, 160, 220, 150, 160],
      );
      assert.equal(frames[2].holdMs, 350);
      assert.equal(frames[5].holdMs, 470);
      assert.equal(
        frames.every(
          (frame) =>
            Math.abs(frame.offsetX) <= 3 &&
            Math.abs(frame.offsetY) <= 3 &&
            frame.scale > 0.85 &&
            frame.scale <= 1,
        ),
        true,
      );
    }
    assert.deepEqual(
      Array.from({ length: 7 }, (_, combo) => getWordComboDanceCycleMs(combo)),
      [2700, 2600, 2450, 2300, 2150, 2000, 1850],
    );
    assert.equal(getWordComboDanceCycleMs(3, true, false), 2300);
    assert.equal(getWordComboDanceCycleMs(6, true, true), 1750);
  });

  run('ことばコンボダンスは確定仮名の行に連動し、5文字以上だけ決めポーズを加える', () => {
    assert.deepEqual(
      ['あ', 'ガ', 'し', 'ヅ', 'な', 'ぽ', 'モ', 'ゃ', 'リ', 'ン'].map(
        getWordComboDancePoseForKana,
      ),
      [1, 2, 3, 4, 5, 6, 1, 3, 5, 6],
    );
    assert.equal(getWordComboDancePoseForKana('A'), null);
    assert.equal(getWordComboDancePoseForKana('ー'), null);
    assert.equal(getNewlyCommittedKana('', 'k'), '');
    assert.equal(getNewlyCommittedKana('', 'か'), 'か');
    assert.equal(getNewlyCommittedKana('か', 'が'), 'が');
    assert.equal(getNewlyCommittedKana('かもち', 'かしわもち'), 'しわ');
    assert.equal(getNewlyCommittedKana('りんご', 'りん'), '');

    const typing = getWordComboInputDanceFrames('ガ');
    assert.equal(typing.length, 1);
    assert.equal(typing[0].variant, 'normal');
    assert.equal(typing[0].pose, 2);
    assert.equal(WORD_COMBO_INPUT_POSE_MS, 180);
    assert.equal(WORD_COMBO_INPUT_IDLE_MS, 1200);
    assert.equal(typing[0].durationMs, WORD_COMBO_INPUT_POSE_MS);
    assert.match(typing[0].src, /normal\/dance_normal_02_left_step\.png\?/);

    const kashiwamochi = getWordComboConfirmedDanceFrames('かしわもち', () => 0.4);
    assert.deepEqual(kashiwamochi.slice(0, 5).map((frame) => frame.pose), [2, 3, 6, 1, 4]);
    assert.equal(kashiwamochi.slice(0, 5).every((frame) => frame.variant === 'smile'), true);
    assert.equal(kashiwamochi[5].variant, 'finish');
    assert.equal(kashiwamochi[5].pose, 3);
    assert.equal(kashiwamochi[5].durationMs, WORD_COMBO_FINISH_POSE_MS);
    assert.match(kashiwamochi[5].src, /finish\/dance_finish_03_point\.png\?/);
    assert.equal(
      kashiwamochi.reduce((total, frame) => total + frame.durationMs + frame.holdMs, 0) < 2000,
      true,
    );

    const apple = getWordComboConfirmedDanceFrames('りんご', () => 0.99);
    assert.deepEqual(apple.map((frame) => frame.pose), [5, 6, 2]);
    assert.equal(apple.some((frame) => frame.variant === 'finish'), false);

    const longWord = getWordComboConfirmedDanceFrames('あ'.repeat(30), () => 0);
    assert.equal(
      longWord.reduce((total, frame) => total + frame.durationMs + frame.holdMs, 0) <= 2000,
      true,
    );
  });

  run('PERSON派生語は親・ルート・RELATED_TO・使用済み質問を保存する', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '母', 'PERSON_1');
    const opening = openPersonDerivedTest(conversation);
    assert.equal(opening.debug.selectedTemplate, 'PERSON_FAMILY_V2_01');
    assert.equal(opening.inputMode, 'text');
    assert.match(opening.lines.join(''), /一緒に思い出す家族/);

    const ending = conversation.submit('姉');
    assert.equal(ending.stage, 'complete');
    assert.match(
      ending.lines.join(''),
      /つながってる家族/,
    );
    const child = conversation
      .getWordEntries()
      .find((word) => word.surface === '姉');
    assert.equal(child?.category, 'PERSON');
    assert.equal(child?.subcategory, 'PERSON_1');
    assert.equal(child?.firstDerivedFromWordId, parent?.id);
    assert.equal(child?.rootWordId, parent?.rootWordId);
    assert.ok(
      conversation
        .getMemoryRelations()
        .some(
          (relation) =>
            relation.subjectId === parent?.id &&
            relation.type === 'RELATED_TO' &&
            relation.objectId === child?.id &&
            relation.qualifier === 'PERSON_FAMILY_V2_01',
        ),
    );
    assert.deepEqual(
      conversation.getPersonDerivedConversationUses()[parent.id],
      ['PERSON_FAMILY_V2_01'],
    );

    const reloaded = create(storage, undefined, () => 0);
    const next = reloaded.startSession();
    assert.equal(next.debug.selectedTemplate, 'PERSON_FAMILY_V2_02');
    assert.equal(
      reloaded.getWordEntries().find((word) => word.surface === '姉')
        ?.rootWordId,
      parent?.id,
    );
  });

  run(
    'PERSON派生回答が既存語でも重複作成せず元ワードとの関連だけ追加する',
    () => {
      const conversation = create(memory(), undefined, () => 0);
      prepare(conversation);
      const parent = teachPerson(conversation, '母', 'PERSON_1');
      const existing = teachPerson(conversation, '姉', 'PERSON_1');
      const beforeCount = conversation.getWordEntries().length;
      const opening = openPersonDerivedTest(conversation);
      assert.equal(opening.debug.selectedTemplate, 'PERSON_FAMILY_V2_01');
      const ending = conversation.submit('姉');
      assert.equal(ending.stage, 'complete');
      assert.equal(conversation.getWordEntries().length, beforeCount);
      assert.equal(
        conversation.getWordEntries().filter((word) => word.surface === '姉')
          .length,
        1,
      );
      assert.equal(
        conversation.getWordEntries().find((word) => word.surface === '姉')?.id,
        existing?.id,
      );
      assert.ok(
        conversation
          .getMemoryRelations()
          .some(
            (relation) =>
              relation.subjectId === parent?.id &&
              relation.type === 'RELATED_TO' &&
              relation.objectId === existing?.id &&
              relation.qualifier === 'PERSON_FAMILY_V2_01',
          ),
      );
    },
  );

  run('PERSON_1通常会話も派生2回ごとに掘り下げを挟み、v2質問を継続する', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '母親', 'PERSON_1');
    let response = openPersonDerivedTest(conversation);
    assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_V2_01');
    response = conversation.submit('姉');
    assert.equal(response.stage, 'complete');

    response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_V2_02');
    response = conversation.submit('友人');
    assert.equal(response.stage, 'complete');

    const wordCountBeforeDeep = conversation.getWordEntries().length;
    response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_DEEP_01');
    response = conversation.submit('血縁上の母親');
    assert.equal(response.stage, 'complete');
    assert.equal(conversation.getWordEntries().length, wordCountBeforeDeep);
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id)?.slot1, {
      key: 'family_relation',
      value: '血縁上の母親',
    });

    response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_V2_03');
    assert.match(
      response.lines.join(''),
      /母親のこと、血縁上の母親って教えてくれた/,
    );
    response = conversation.submit('カレー');
    assert.equal(response.stage, 'complete');

    response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_V2_04');
    response = conversation.submit('ケーキ');
    assert.equal(response.stage, 'complete');

    response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_DEEP_02');
    response = conversation.submit('カレーをよく作る');
    assert.equal(response.stage, 'complete');
    assert.deepEqual(conversation.getPersonWordDeepDive(parent.id), {
      slot1: { key: 'family_relation', value: '血縁上の母親' },
      slot2: { key: 'person_trait', value: 'カレーをよく作る' },
    });
    assert.deepEqual(
      conversation.getPersonDerivedConversationUses()[parent.id],
      [
        'PERSON_FAMILY_V2_01',
        'PERSON_FAMILY_V2_02',
        'PERSON_FAMILY_DEEP_01',
        'PERSON_FAMILY_V2_03',
        'PERSON_FAMILY_V2_04',
        'PERSON_FAMILY_DEEP_02',
      ],
    );
    const next = conversation.startSession();
    assert.equal(next.debug.attributes.derivedFromWordId, parent.id);
    assert.equal(next.debug.selectedTemplate, 'PERSON_FAMILY_V2_05');
  });

  run('PERSON_2派生会話は固定分類と掘り下げを経て締め台詞へ戻る', () => {
    const conversation = create(memory(), undefined, () => 0);
    prepare(conversation);
    teachPerson(conversation, '友子', 'PERSON_2');
    let response = openPersonDerivedTest(conversation);
    assert.equal(response.debug.selectedTemplate, 'PERSON_FRIEND_V2_01');
    response = conversation.submit('佐藤さん');
    assert.equal(response.stage, 'complete');
    assert.match(response.lines.join(''), /一緒に遊んでいた人/);
    assert.deepEqual(
      conversation.getWordEntries().find((word) => word.surface === '佐藤さん')
        ?.subcategory,
      'PERSON_2',
    );

    response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'PERSON_FRIEND_V2_02');
    response = conversation.submit('田中先生');
    assert.equal(response.stage, 'complete');
    assert.match(response.lines.join(''), /近くにいた人/);
    assert.deepEqual(
      conversation.getWordEntries().find((word) => word.surface === '田中先生')
        ?.subcategory,
      'PERSON_4',
    );

    response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'PERSON_FRIEND_DEEP_01');
    const wordCountBeforeDeepDive = conversation.getWordEntries().length;
    response = conversation.submit('学生時代からの友達');
    assert.equal(response.stage, 'complete');
    assert.equal(conversation.getWordEntries().length, wordCountBeforeDeepDive);
    assert.deepEqual(
      conversation.getPersonWordDeepDive(
        conversation.getWordEntries().find((word) => word.surface === '友子')
          ?.id,
      )?.slot1,
      { key: 'friend_relation', value: '学生時代からの友達' },
    );

    response = conversation.startSession();
    assert.equal(response.debug.selectedTemplate, 'PERSON_FRIEND_V2_03');
    response = conversation.submit('ぽっきー');
    assert.equal(response.stage, 'complete');
    assert.match(response.lines.join(''), /帰り道/);
    assert.deepEqual(
      conversation.getWordEntries().find((word) => word.surface === 'ぽっきー')
        ?.subcategory,
      'FOOD_2',
    );
  });

  run('旧PERSON_2質問の使用履歴は対応するv2質問へも安全に引き継ぐ', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '友子', 'PERSON_2');
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    saved.personDerivedConversationUses[parent.id] = ['PERSON_FRIEND_01'];
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved));

    const reloaded = create(storage, undefined, () => 0);
    assert.deepEqual(reloaded.getPersonDerivedConversationUses()[parent.id], [
      'PERSON_FRIEND_01',
      'PERSON_FRIEND_V2_01',
    ]);
    assert.notEqual(
      reloaded.getNextPersonComboQuestion(parent.id)?.id,
      'PERSON_FRIEND_V2_01',
    );
  });

  run('旧PERSON_3の場所質問の使用履歴は意味の近いv2質問へ引き継ぐ', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '大切な人', 'PERSON_3');
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    saved.personDerivedConversationUses[parent.id] = ['PERSON_IMPORTANT_02'];
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved));

    const reloaded = create(storage, undefined, () => 0);
    assert.deepEqual(reloaded.getPersonDerivedConversationUses()[parent.id], [
      'PERSON_IMPORTANT_02',
      'PERSON_IMPORTANT_V2_09',
    ]);
  });

  run('旧PERSON_4の役目・場所質問の履歴は対応するv2質問へ引き継ぐ', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '田中先生', 'PERSON_4');
    const saved = JSON.parse(storage.getItem('suuhimochi_conversation_v6_choices'));
    saved.personDerivedConversationUses[parent.id] = [
      'PERSON_WORKSCHOOL_01',
      'PERSON_WORKSCHOOL_02',
    ];
    storage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(saved));

    const reloaded = create(storage, undefined, () => 0);
    assert.deepEqual(reloaded.getPersonDerivedConversationUses()[parent.id], [
      'PERSON_WORKSCHOOL_01',
      'PERSON_WORKSCHOOL_V2_14',
      'PERSON_WORKSCHOOL_02',
      'PERSON_WORKSCHOOL_V2_10',
    ]);
  });

  run(
    'PERSON派生会話は回答不能語を保存せず、子ワードも後日の元ワードになれる',
    () => {
      const storage = memory();
      const noAnswer = create(storage, undefined, () => 0);
      prepare(noAnswer);
      const parent = teachPerson(noAnswer, '父', 'PERSON_1');
      let response = openPersonDerivedTest(noAnswer);
      assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_V2_01');
      response = noAnswer.submit('わからない');
      assert.equal(response.stage, 'complete');
      assert.equal(
        noAnswer.getWordEntries().some((word) => word.surface === 'わからない'),
        false,
      );
      assert.deepEqual(noAnswer.getPersonDerivedConversationUses()[parent.id], [
        'PERSON_FAMILY_V2_01',
      ]);
      assert.equal(
        noAnswer.startSession().debug.selectedTemplate,
        'PERSON_FAMILY_V2_02',
      );

      const childStorage = memory();
      let randomQueue = [];
      const deriveChild = create(
        childStorage,
        undefined,
        () => randomQueue.shift() ?? 0,
      );
      prepare(deriveChild);
      teachPerson(deriveChild, '母', 'PERSON_1');
      response = openPersonDerivedTest(deriveChild);
      assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_V2_01');
      response = deriveChild.submit('姉');
      assert.equal(response.stage, 'complete');
      const child = deriveChild
        .getWordEntries()
        .find((word) => word.surface === '姉');
      randomQueue = [0, 0, 0.99, 0.99];
      response = deriveChild.startSession();
      assert.equal(response.debug.attributes.derivedFromWordId, child?.id);
      assert.equal(response.debug.selectedTemplate, 'PERSON_FAMILY_V2_20');
      assert.match(response.lines.join(''), /犬や猫/);
      response = deriveChild.submit('いぬ');
      assert.equal(response.stage, 'complete');
      const grandchild = deriveChild
        .getWordEntries()
        .find((word) => word.surface === 'いぬ');
      assert.equal(grandchild?.firstDerivedFromWordId, child?.id);
      assert.equal(grandchild?.rootWordId, child?.rootWordId);
    },
  );

  run('掘り下げ2問と派生20問を使い切った元ワードはPERSON候補から外れる', () => {
    const storage = memory();
    const conversation = create(storage, undefined, () => 0);
    prepare(conversation);
    const parent = teachPerson(conversation, '祖父', 'PERSON_1');
    const saved = JSON.parse(
      storage.getItem('suuhimochi_conversation_v6_choices'),
    );
    saved.personDerivedConversationUses[parent.id] = [
      ...Array.from({ length: 20 }, (_, index) =>
        `PERSON_FAMILY_V2_${String(index + 1).padStart(2, '0')}`),
      'PERSON_FAMILY_DEEP_01',
      'PERSON_FAMILY_DEEP_02',
    ];
    storage.setItem(
      'suuhimochi_conversation_v6_choices',
      JSON.stringify(saved),
    );
    const reloaded = create(storage, undefined, () => 0);
    assert.equal(
      reloaded.getPersonWordComboCandidates().some((word) => word.id === parent.id),
      false,
    );
    assert.equal(
      reloaded.getWordEntries().some((word) => word.id === parent.id),
      true,
    );
    const response = openPersonDerivedTest(reloaded);
    assert.equal(response.debug.selectedTemplate, 'DAY29_SELF_01');
    assert.doesNotMatch(response.lines.join(''), /祖父/);
  });

  run('30日目のお別れ処理を維持する', () => {
    const conversation = create();
    prepare(conversation, '30日で本を読む');
    let response = conversation.jumpFarewell();
    assert.equal(response.stage, 'farewell');
    for (
      let index = 0;
      index < 20 && response.stage === 'farewell';
      index += 1
    ) {
      response = conversation.continueFarewell();
    }
    assert.equal(response.stage, 'ended');
    assert.equal(conversation.isEnded(), true);
    assert.match(conversation.getLetter(), /30日間/);
  });

  assert.equal(
    typeof SuuhimochiConversation.prototype.startPromptedLearning,
    'undefined',
  );
  assert.equal(
    typeof SuuhimochiConversation.prototype.prepareAmbientMemoryConversation,
    'undefined',
  );
  console.log(`\nConversation foundation: ${passed} passed, ${failed} failed`);
} finally {
  await vite.close();
}

if (failed) process.exitCode = 1;
