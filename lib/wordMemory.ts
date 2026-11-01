import {
  CATEGORY_CHOICES,
  CATEGORY_LABELS,
  GOAL_ACTION_CHOICES,
  GOAL_STATUS_CHOICES,
  MIDDLE_CATEGORY_DIALOGUE,
  PET_CHECKIN_CHOICES,
  PET_STATUS_CHOICES,
  SYSTEM_WORDS,
  SUBCATEGORY_CHOICES,
  subcategoryLabel,
  WORD_FEELING_CHOICES,
  WORD_FEELING_PROMPTS,
} from './conversationData';
import { findCommonKnowledge } from './commonKnowledgeData';
import { hasUnseenDayConversation, runConversationEngine } from './conversation/conversationEngine';
import {
  externalDiscoveryLines, evaluateExternalTopics, readExternalSnapshot, sanitizeExternalHistory, selectExternalMatch,
  startupDiscoveryLines, type ExternalMatch, type ExternalSnapshot, type ExternalTopicUse,
} from './externalTopics';
import { getActivityDateKey } from './dailyProgress';
import { parseSharedDialogues, sanitizeSharedHistory, selectSharedDialogue, type SharedDialogue, type SharedTalkPlan, type SharedUse } from './sharedKnowledge';
import type { SharedKnowledgeResult } from './sharedKnowledgeClient';
import { sanitizeStartupAttempts, sanitizeExternalCatalog, observeExternalCatalog, externalTopicRevision, EXTERNAL_UPDATE_COOLDOWN,
  type ExternalCatalog, type StartupAttempt } from './startupExperience';
import {
  personDerivedConversationsFor,
  personDeepDiveConversationsFor,
  type PersonDerivedConversation,
  type PersonDeepDiveConversation,
} from './conversation/personDerivedConversations';
import {
  type PersonComboAnswerResult,
  type PersonComboQuestion,
} from './personWordCombo';
import type {
  ConversationChoiceRecord,
  ConversationScript,
  CuriousConversation,
  CuriousConversationChoice,
  DialogueBeat,
  DialoguePage,
  MemoryRelationType,
  OpenQuestionField,
} from './conversation/conversationTypes';
import type {
  CategoryChoice,
  ConversationChoice,
  ConversationLog,
  ConversationMemory,
  ConversationPhase,
  ConversationResponse,
  ConversationStage,
  DebugSnapshot,
  ExpectedAnswer,
  GoalAction,
  GoalCheck,
  GoalStatus,
  InputMode,
  LearnedWord,
  MemoryEpisode,
  MemoryEvent,
  MemoryHypothesis,
  MemoryRelation,
  OpenQuestion,
  PetStatus,
  Relation,
  RelationType,
  Sentiment,
  StartType,
  StorageLike,
  SubCategoryChoice,
  WordCategory,
  WordEntry,
} from './conversationTypes';

export type { DialoguePage } from './conversation/conversationTypes';

export type {
  CategoryChoice,
  ConversationChoice,
  ConversationMemory,
  ConversationResponse,
  ConversationStage,
  DebugSnapshot,
  ExpectedAnswer,
  GoalAction,
  GoalCheck,
  GoalStatus,
  InputMode,
  LearnedWord,
  MemoryEpisode,
  MemoryEvent,
  MemoryHypothesis,
  MemoryRelation,
  OpenQuestion,
  PetStatus,
  Relation,
  RelationType,
  Sentiment,
  StartType,
  StorageLike,
  SubCategoryChoice,
  WordCategory,
  WordEntry,
} from './conversationTypes';
const STORAGE_KEY = 'suuhimochi_conversation_v6_choices';
const INTERNAL_TOPICS = new Set(['今日の調子', '30日の目標']);
const MAX_WORD_LENGTH = 30;
const MAX_DEEP_DIVE_LENGTH = 80;
const MAX_GOAL_LENGTH = 100;
const GOAL_CHECK_INTERVAL = 20;
const GOAL_CHECK_MAX_DAYS = 5;
const UNDECIDED_GOAL = 'まだ決まっていない';

export type PersonWordDeepDiveKey =
  | 'family_relation'
  | 'friend_relation'
  | 'important_reason'
  | 'workschool_relation'
  | 'known_for'
  | 'person_relation'
  | 'person_trait'
  | 'favorite_trait'
  | 'learned_from_person'
  | 'impression'
  | 'key_feature'
  | 'personality'
  | 'memorable_event'
  | 'strength'
  | 'weakness'
  | 'memorable_work'
  | 'disagreement'
  | 'watching_reason'
  | 'memorable_moment'
  | 'disliked_trait'
  | 'first_meeting'
  | 'favorite_food'
  | 'habit'
  | 'memorable_experience'
  | 'memorable_feature'
  | 'taste_texture'
  | 'preference_reason'
  | 'taste_aroma'
  | 'usage_preference'
  | 'description'
  | 'atmosphere'
  | 'appearance_comfort'
  | 'fit_comfort'
  | 'usability'
  | 'personal_significance'
  | 'memorable_spot'
  | 'memorable_scenery'
  | 'ride_impression'
  | 'favorite_play_style'
  | 'favorite_part'
  | 'creative_focus'
  | 'collection_criteria'
  | 'favorite_aspect'
  | 'memorable_record'
  | 'connection_origin'
  | 'memorable_result'
  | 'motivation'
  | 'job_impression'
  | 'work_approach'
  | 'workplace_impression'
  | 'work_style_motivation'
  | 'rule_impression'
  | 'thoughts_and_choices'
  | 'school_life_impression'
  | 'subject_impression'
  | 'effort_and_difficulty'
  | 'qualification_motivation'
  | 'qualification_experience'
  | 'learning_motivation'
  | 'learning_experience'
  | 'learning_background'
  | 'learning_impact'
  | 'manga_impression'
  | 'character_interpretation'
  | 'memorable_scene'
  | 'encounter_memory'
  | 'personal_influence'
  | 'anime_impression'
  | 'audiovisual_impression'
  | 'first_watch_memory'
  | 'game_impression'
  | 'favorite_gameplay'
  | 'challenge_and_strategy'
  | 'memorable_play_experience'
  | 'first_play_memory'
  | 'novel_impression'
  | 'prose_impression'
  | 'plot_interpretation'
  | 'reading_memory'
  | 'character_impression'
  | 'action_interpretation'
  | 'character_growth'
  | 'relationship_interpretation'
  | 'self_comparison'
  | 'series_impression'
  | 'favorite_era_or_work'
  | 'worldbuilding_impression'
  | 'series_evolution'
  | 'series_history'
  | 'term_impression'
  | 'story_role_interpretation'
  | 'first_impression'
  | 'personal_memory'
  | 'fan_activity_impression'
  | 'discovery_memory'
  | 'personal_ideas'
  | 'fan_interaction_memory'
  | 'personal_impact'
  | 'music_impression'
  | 'sound_impression'
  | 'lyrics_interpretation'
  | 'first_listening_memory'
  | 'personal_music_memory'
  | 'movie_impression'
  | 'visual_direction'
  | 'editing_and_sound'
  | 'story_interpretation'
  | 'drama_impression'
  | 'memorable_episode'
  | 'character_development'
  | 'viewing_routine'
  | 'finale_interpretation'
  | 'video_impression'
  | 'watching_motivation'
  | 'memorable_content'
  | 'learning_and_doubts'
  | 'post_viewing_actions'
  | 'streamer_impression'
  | 'streaming_style'
  | 'memorable_stream_moment'
  | 'viewing_history'
  | 'program_impression'
  | 'memorable_program_moment'
  | 'performer_chemistry'
  | 'media_activity_impression'
  | 'sensory_impression'
  | 'personal_approach'
  | 'personal_media_memory'
  | 'book_impression'
  | 'memorable_knowledge'
  | 'author_idea_interpretation'
  | 'reading_motivation'
  | 'historical_cause_interpretation'
  | 'historical_consequence_interpretation'
  | 'historical_figure_evaluation'
  | 'competing_interpretations'
  | 'personal_historical_interest'
  | 'science_impression'
  | 'personal_science_understanding'
  | 'unanswered_science_questions'
  | 'observation_experiment_memory'
  | 'science_discovery_context'
  | 'social_topic_interest'
  | 'social_information_source'
  | 'personal_social_opinion'
  | 'different_social_perspectives'
  | 'personal_social_relevance'
  | 'philosophy_impression'
  | 'personal_philosophy_understanding'
  | 'philosophy_agreement_objections'
  | 'philosophy_discovery_context'
  | 'philosophy_practical_application'
  | 'language_culture_impression'
  | 'personal_meaning_understanding'
  | 'origin_context_memory'
  | 'personal_usage_experience'
  | 'language_culture_encounter'
  | 'artwork_impression'
  | 'visual_expression_memory'
  | 'artist_intent_interpretation'
  | 'artwork_encounter'
  | 'creative_influence'
  | 'trivia_surprise_impression'
  | 'trivia_discovery_context'
  | 'trivia_confidence_uncertainty'
  | 'trivia_verification_experience'
  | 'trivia_sharing_memory'
  | 'curiosity_impression'
  | 'interest_origin'
  | 'inquiry_method'
  | 'expectation_revision'
  | 'remaining_questions'
  | 'body_part_understanding'
  | 'body_part_observation'
  | 'symptom_understanding'
  | 'symptom_experience_context'
  | 'illness_injury_understanding'
  | 'illness_injury_interest_context'
  | 'rest_preference'
  | 'rest_experience_context'
  | 'medical_care_understanding'
  | 'medical_interest_context'
  | 'health_habit_impression'
  | 'health_habit_experience_context'
  | 'positive_emotion_understanding'
  | 'positive_emotion_experience'
  | 'negative_emotion_understanding'
  | 'negative_emotion_experience'
  | 'sad_lonely_emotion_understanding'
  | 'sad_lonely_experience_context'
  | 'anxiety_worry_understanding'
  | 'anxiety_experience_context'
  | 'affection_preference_understanding'
  | 'affection_preference_experience_context'
  | 'personality_value_behavior_understanding'
  | 'personality_value_personal_view'
  | 'other_emotion_trigger_understanding'
  | 'other_emotion_uncertainty_context'
  | 'time_of_day_impression'
  | 'time_of_day_routine_experience'
  | 'calendar_day_meaning_impression'
  | 'calendar_day_routine_memory'
  | 'natural_landscape_impression'
  | 'natural_landscape_experience_interest'
  | 'natural_phenomenon_understanding'
  | 'natural_phenomenon_experience_impression'
  | 'space_object_understanding'
  | 'space_object_experience_impression'
  | 'nature_other_feature_understanding'
  | 'nature_other_observation_interest'
  | 'money_role_understanding'
  | 'money_experience_interest'
  | 'price_pricing_understanding'
  | 'price_personal_evaluation'
  | 'shopping_method_understanding'
  | 'shopping_experience_impression'
  | 'income_mechanism_understanding'
  | 'income_personal_view'
  | 'saving_method_understanding'
  | 'saving_experience_impression'
  | 'payment_method_understanding'
  | 'payment_experience_impression'
  | 'contract_insurance_understanding'
  | 'contract_insurance_experience_impression'
  | 'shopping_other_usage_understanding'
  | 'shopping_other_experience_impression'
  | 'anniversary_meaning_understanding'
  | 'anniversary_memory_impression'
  | 'seasonal_event_understanding'
  | 'seasonal_event_memory_impression'
  | 'festival_event_understanding'
  | 'festival_event_experience_impression'
  | 'life_event_understanding'
  | 'life_event_experience_impression'
  | 'school_event_understanding'
  | 'school_event_memory_impression'
  | 'event_other_understanding'
  | 'event_other_experience_impression'
  | 'uncategorized_word_meaning'
  | 'uncategorized_word_impression'
  | 'unknown_word_known_information'
  | 'unknown_word_question_interest';

export type PersonWordDeepDiveEntry = {
  key: PersonWordDeepDiveKey;
  value: string;
};

export type PersonWordDeepDive = {
  slot1?: PersonWordDeepDiveEntry;
  slot2?: PersonWordDeepDiveEntry;
  slot3?: PersonWordDeepDiveEntry;
  slot4?: PersonWordDeepDiveEntry;
  slot5?: PersonWordDeepDiveEntry;
};

export type PersonWordDeepDiveSlot = keyof PersonWordDeepDive;

const PERSON_DEEP_DIVE_SLOTS = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'] as const;

function gameMediaTermQuestionPriorities(surface: string): string[] {
  if (/[セリフ台詞名言口癖]/u.test(surface)) {
    return ['TERM_V2_07', 'TERM_V2_08', 'TERM_V2_01', 'TERM_V2_14', 'TERM_V2_15'];
  }
  if (/[組織チーム団隊軍ギルド教団一族]/u.test(surface)) {
    return ['TERM_V2_06', 'TERM_V2_07', 'TERM_V2_08', 'TERM_V2_09', 'TERM_V2_15'];
  }
  if (/[場所城町街都市島基地星国学園塔洞窟]/u.test(surface)) {
    return ['TERM_V2_05', 'TERM_V2_06', 'TERM_V2_07', 'TERM_V2_08', 'TERM_V2_09'];
  }
  if (/[武器剣銃弓杖槍アイテム道具装備]/u.test(surface)) {
    return ['TERM_V2_04', 'TERM_V2_07', 'TERM_V2_08', 'TERM_V2_02', 'TERM_V2_03'];
  }
  if (/[技能力魔法術スキル呪文攻撃]/u.test(surface)) {
    return ['TERM_V2_02', 'TERM_V2_03', 'TERM_V2_07', 'TERM_V2_08', 'TERM_V2_19', 'TERM_V2_20'];
  }
  return [];
}

function clonePersonWordDeepDive(record: PersonWordDeepDive): PersonWordDeepDive {
  return Object.fromEntries(
    PERSON_DEEP_DIVE_SLOTS
      .filter((slot) => Boolean(record[slot]))
      .map((slot) => [slot, { ...record[slot]! }]),
  ) as PersonWordDeepDive;
}

export type PersonComboParentProgress = {
  /** 質問を画面へ提示した累計回数。回答・時間切れとは分けて数える。 */
  questionPromptCount: number;
  /** 最後に質問を提示した30日進行上の日。 */
  lastQuestionDay?: number;
  /** ことばコンボの主親として選ばれた回数。 */
  selectedAsParentCount: number;
};

const PERSON_DEEP_DIVE_KEYS: Record<
  string,
  Partial<Record<PersonWordDeepDiveSlot, PersonWordDeepDiveKey>>
> = {
  PERSON_1: { slot1: 'family_relation', slot2: 'person_trait' },
  PERSON_2: { slot1: 'friend_relation', slot2: 'person_trait' },
  PERSON_3: { slot1: 'important_reason', slot2: 'favorite_trait' },
  PERSON_4: { slot1: 'workschool_relation', slot2: 'learned_from_person' },
  PERSON_ENTERTAINER: { slot1: 'known_for', slot2: 'impression' },
  PERSON_MANGA_ARTIST: { slot1: 'known_for', slot2: 'impression' },
  PERSON_AUTHOR_WRITER: { slot1: 'known_for', slot2: 'impression' },
  PERSON_ATHLETE: { slot1: 'known_for', slot2: 'impression' },
  PERSON_SCIENTIST: { slot1: 'known_for', slot2: 'impression' },
  PERSON_HISTORICAL_MILITARY: {
    slot1: 'known_for',
    slot2: 'personality',
    slot3: 'memorable_event',
    slot4: 'strength',
    slot5: 'weakness',
  },
  PERSON_HISTORICAL_CULTURAL: {
    slot1: 'known_for',
    slot2: 'personality',
    slot3: 'memorable_work',
    slot4: 'strength',
    slot5: 'disagreement',
  },
  PERSON_STREAMER: {
    slot1: 'known_for',
    slot2: 'watching_reason',
    slot3: 'memorable_moment',
    slot4: 'impression',
    slot5: 'disliked_trait',
  },
  // 旧6分類の「有名人・歴史の人物」は新分類へ推測して移さず、互換用IDで保持する。
  PERSON_LEGACY_FAMOUS: { slot1: 'known_for', slot2: 'impression' },
  PERSON_OTHER: { slot1: 'person_relation', slot2: 'key_feature' },
  ANIMAL_PET: {
    slot1: 'first_meeting',
    slot2: 'personality',
    slot3: 'favorite_food',
    slot4: 'habit',
    slot5: 'memorable_experience',
  },
  ANIMAL_1: {
    slot1: 'favorite_trait',
    slot2: 'memorable_experience',
  },
  ANIMAL_2: {
    slot1: 'favorite_trait',
    slot2: 'memorable_feature',
  },
  ANIMAL_3: {
    slot1: 'favorite_trait',
    slot2: 'memorable_experience',
  },
  ANIMAL_4: {
    slot1: 'memorable_feature',
    slot2: 'impression',
  },
  ANIMAL_5: {
    slot1: 'memorable_feature',
    slot2: 'memorable_experience',
  },
  ANIMAL_6: {
    slot1: 'memorable_feature',
    slot2: 'impression',
  },
  FOOD_1: {
    slot1: 'taste_texture',
    slot2: 'memorable_experience',
  },
  FOOD_2: {
    slot1: 'taste_texture',
    slot2: 'memorable_experience',
  },
  FOOD_3: {
    slot1: 'taste_texture',
    slot2: 'memorable_experience',
  },
  FOOD_4: {
    slot1: 'preference_reason',
    slot2: 'memorable_experience',
  },
  FOOD_5: {
    slot1: 'taste_aroma',
    slot2: 'usage_preference',
  },
  FOOD_6: {
    slot1: 'description',
    slot2: 'memorable_experience',
  },
  PLACE_1: {
    slot1: 'memorable_spot',
    slot2: 'memorable_experience',
  },
  PLACE_2: {
    slot1: 'memorable_feature',
    slot2: 'memorable_experience',
  },
  PLACE_5: {
    slot1: 'memorable_scenery',
    slot2: 'memorable_experience',
  },
  PLACE_3: {
    slot1: 'memorable_feature',
    slot2: 'memorable_experience',
  },
  PLACE_7: {
    slot1: 'memorable_scenery',
    slot2: 'memorable_experience',
  },
  PLACE_6: {
    slot1: 'impression',
    slot2: 'memorable_experience',
  },
  PLACE_8: {
    slot1: 'memorable_scenery',
    slot2: 'memorable_experience',
  },
  PLACE_4: {
    slot1: 'atmosphere',
    slot2: 'memorable_experience',
  },
  OBJECT_1: {
    slot1: 'appearance_comfort',
    slot2: 'memorable_experience',
  },
  OBJECT_2: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  OBJECT_3: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  OBJECT_4: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  OBJECT_5: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  OBJECT_6: {
    slot1: 'personal_significance',
    slot2: 'memorable_experience',
  },
  CLOTHING_1: {
    slot1: 'appearance_comfort',
    slot2: 'memorable_experience',
  },
  CLOTHING_2: {
    slot1: 'fit_comfort',
    slot2: 'memorable_experience',
  },
  CLOTHING_3: {
    slot1: 'appearance_comfort',
    slot2: 'memorable_experience',
  },
  CLOTHING_4: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  CLOTHING_5: {
    slot1: 'appearance_comfort',
    slot2: 'memorable_experience',
  },
  CLOTHING_6: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  TECH_1: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  TECH_2: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  TECH_3: {
    slot1: 'preference_reason',
    slot2: 'memorable_experience',
  },
  TECH_4: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  TECH_5: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  TECH_6: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  TECH_7: {
    slot1: 'usability',
    slot2: 'memorable_experience',
  },
  VEHICLE_1: {
    slot1: 'memorable_feature',
    slot2: 'memorable_experience',
  },
  VEHICLE_2: {
    slot1: 'ride_impression',
    slot2: 'memorable_experience',
  },
  VEHICLE_3: {
    slot1: 'ride_impression',
    slot2: 'memorable_experience',
  },
  VEHICLE_4: {
    slot1: 'memorable_feature',
    slot2: 'memorable_experience',
  },
  VEHICLE_5: {
    slot1: 'memorable_feature',
    slot2: 'memorable_experience',
  },
  VEHICLE_6: {
    slot1: 'memorable_feature',
    slot2: 'memorable_experience',
  },
  ACTIVITY_1: {
    slot1: 'favorite_play_style',
    slot2: 'memorable_experience',
  },
  ACTIVITY_2: {
    slot1: 'favorite_part',
    slot2: 'memorable_experience',
  },
  ACTIVITY_3: {
    slot1: 'creative_focus',
    slot2: 'memorable_experience',
  },
  ACTIVITY_4: {
    slot1: 'collection_criteria',
    slot2: 'memorable_experience',
  },
  ACTIVITY_5: {
    slot1: 'creative_focus',
    slot2: 'memorable_experience',
  },
  ACTIVITY_6: {
    slot1: 'favorite_aspect',
    slot2: 'memorable_experience',
  },
  SPORTS_1: {
    slot1: 'favorite_aspect',
    slot2: 'memorable_experience',
  },
  SPORTS_2: {
    slot1: 'favorite_aspect',
    slot2: 'memorable_experience',
  },
  SPORTS_3: {
    slot1: 'favorite_aspect',
    slot2: 'memorable_experience',
  },
  SPORTS_4: {
    slot1: 'favorite_aspect',
    slot2: 'memorable_experience',
  },
  SPORTS_5: {
    slot1: 'favorite_aspect',
    slot2: 'memorable_experience',
  },
  SPORTS_6: {
    slot1: 'motivation',
    slot2: 'memorable_experience',
  },
  SPORTS_DISCIPLINE: {
    slot1: 'memorable_record',
    slot2: 'memorable_experience',
  },
  SPORTS_TEAM_CLUB: {
    slot1: 'connection_origin',
    slot2: 'memorable_experience',
  },
  SPORTS_EVENT_MATCH: {
    slot1: 'memorable_result',
    slot2: 'memorable_experience',
  },
  WORK_1: {
    slot1: 'job_impression',
    slot2: 'memorable_experience',
  },
  WORK_2: {
    slot1: 'work_approach',
    slot2: 'memorable_experience',
  },
  WORK_3: {
    slot1: 'workplace_impression',
    slot2: 'memorable_experience',
  },
  WORK_4: {
    slot1: 'work_style_motivation',
    slot2: 'memorable_experience',
  },
  WORK_5: {
    slot1: 'rule_impression',
    slot2: 'memorable_experience',
  },
  WORK_6: {
    slot1: 'thoughts_and_choices',
    slot2: 'memorable_experience',
  },
  SCHOOL_1: {
    slot1: 'school_life_impression',
    slot2: 'memorable_experience',
  },
  SCHOOL_2: {
    slot1: 'subject_impression',
    slot2: 'memorable_experience',
  },
  SCHOOL_3: {
    slot1: 'effort_and_difficulty',
    slot2: 'memorable_experience',
  },
  SCHOOL_4: {
    slot1: 'memorable_result',
    slot2: 'memorable_experience',
  },
  SCHOOL_5: {
    slot1: 'qualification_motivation',
    slot2: 'qualification_experience',
  },
  SCHOOL_6: {
    slot1: 'learning_motivation',
    slot2: 'learning_experience',
  },
  SCHOOL_7: {
    slot1: 'learning_background',
    slot2: 'learning_impact',
  },
  BODY_1: {
    slot1: 'body_part_understanding',
    slot2: 'body_part_observation',
  },
  BODY_2: {
    slot1: 'symptom_understanding',
    slot2: 'symptom_experience_context',
  },
  BODY_3: {
    slot1: 'illness_injury_understanding',
    slot2: 'illness_injury_interest_context',
  },
  BODY_4: {
    slot1: 'rest_preference',
    slot2: 'rest_experience_context',
  },
  BODY_6: {
    slot1: 'medical_care_understanding',
    slot2: 'medical_interest_context',
  },
  BODY_7: {
    slot1: 'health_habit_impression',
    slot2: 'health_habit_experience_context',
  },
  EMOTION_1: {
    slot1: 'positive_emotion_understanding',
    slot2: 'positive_emotion_experience',
  },
  EMOTION_2: {
    slot1: 'negative_emotion_understanding',
    slot2: 'negative_emotion_experience',
  },
  EMOTION_3: {
    slot1: 'sad_lonely_emotion_understanding',
    slot2: 'sad_lonely_experience_context',
  },
  EMOTION_4: {
    slot1: 'anxiety_worry_understanding',
    slot2: 'anxiety_experience_context',
  },
  EMOTION_5: {
    slot1: 'affection_preference_understanding',
    slot2: 'affection_preference_experience_context',
  },
  EMOTION_6: {
    slot1: 'personality_value_behavior_understanding',
    slot2: 'personality_value_personal_view',
  },
  EMOTION_8: {
    slot1: 'other_emotion_trigger_understanding',
    slot2: 'other_emotion_uncertainty_context',
  },
  GAME_MEDIA_1: {
    slot1: 'manga_impression',
    slot2: 'character_interpretation',
    slot3: 'memorable_scene',
    slot4: 'encounter_memory',
    slot5: 'personal_influence',
  },
  GAME_MEDIA_2: {
    slot1: 'anime_impression',
    slot2: 'audiovisual_impression',
    slot3: 'memorable_scene',
    slot4: 'first_watch_memory',
    slot5: 'personal_influence',
  },
  GAME_MEDIA_3: {
    slot1: 'game_impression',
    slot2: 'favorite_gameplay',
    slot3: 'challenge_and_strategy',
    slot4: 'memorable_play_experience',
    slot5: 'first_play_memory',
  },
  GAME_MEDIA_NOVEL: {
    slot1: 'novel_impression',
    slot2: 'prose_impression',
    slot3: 'character_interpretation',
    slot4: 'plot_interpretation',
    slot5: 'reading_memory',
  },
  GAME_MEDIA_4: {
    slot1: 'character_impression',
    slot2: 'action_interpretation',
    slot3: 'character_growth',
    slot4: 'relationship_interpretation',
    slot5: 'self_comparison',
  },
  GAME_MEDIA_5: {
    slot1: 'series_impression',
    slot2: 'favorite_era_or_work',
    slot3: 'worldbuilding_impression',
    slot4: 'series_evolution',
    slot5: 'series_history',
  },
  GAME_MEDIA_6: {
    slot1: 'term_impression',
    slot2: 'story_role_interpretation',
    slot3: 'memorable_scene',
    slot4: 'first_impression',
    slot5: 'personal_memory',
  },
  GAME_MEDIA_7: {
    slot1: 'fan_activity_impression',
    slot2: 'discovery_memory',
    slot3: 'personal_ideas',
    slot4: 'fan_interaction_memory',
    slot5: 'personal_impact',
  },
  AV_MEDIA_1: {
    slot1: 'music_impression',
    slot2: 'sound_impression',
    slot3: 'lyrics_interpretation',
    slot4: 'first_listening_memory',
    slot5: 'personal_music_memory',
  },
  AV_MEDIA_2: {
    slot1: 'movie_impression',
    slot2: 'visual_direction',
    slot3: 'editing_and_sound',
    slot4: 'story_interpretation',
    slot5: 'first_watch_memory',
  },
  AV_MEDIA_3: {
    slot1: 'drama_impression',
    slot2: 'memorable_episode',
    slot3: 'character_development',
    slot4: 'viewing_routine',
    slot5: 'finale_interpretation',
  },
  AV_MEDIA_4: {
    slot1: 'video_impression',
    slot2: 'watching_motivation',
    slot3: 'memorable_content',
    slot4: 'learning_and_doubts',
    slot5: 'post_viewing_actions',
  },
  AV_MEDIA_5: {
    slot1: 'streamer_impression',
    slot2: 'streaming_style',
    slot3: 'memorable_stream_moment',
    slot4: 'discovery_memory',
    slot5: 'viewing_history',
  },
  AV_MEDIA_6: {
    slot1: 'program_impression',
    slot2: 'memorable_program_moment',
    slot3: 'performer_chemistry',
    slot4: 'viewing_routine',
    slot5: 'personal_influence',
  },
  AV_MEDIA_7: {
    slot1: 'media_activity_impression',
    slot2: 'sensory_impression',
    slot3: 'personal_approach',
    slot4: 'encounter_memory',
    slot5: 'personal_media_memory',
  },
  KNOWLEDGE_1: {
    slot1: 'book_impression',
    slot2: 'memorable_knowledge',
    slot3: 'author_idea_interpretation',
    slot4: 'reading_motivation',
    slot5: 'personal_influence',
  },
  KNOWLEDGE_2: {
    slot1: 'historical_cause_interpretation',
    slot2: 'historical_consequence_interpretation',
    slot3: 'historical_figure_evaluation',
    slot4: 'competing_interpretations',
    slot5: 'personal_historical_interest',
  },
  KNOWLEDGE_3: {
    slot1: 'science_impression',
    slot2: 'personal_science_understanding',
    slot3: 'unanswered_science_questions',
    slot4: 'observation_experiment_memory',
    slot5: 'science_discovery_context',
  },
  KNOWLEDGE_4: {
    slot1: 'social_topic_interest',
    slot2: 'social_information_source',
    slot3: 'personal_social_opinion',
    slot4: 'different_social_perspectives',
    slot5: 'personal_social_relevance',
  },
  KNOWLEDGE_5: {
    slot1: 'philosophy_impression',
    slot2: 'personal_philosophy_understanding',
    slot3: 'philosophy_agreement_objections',
    slot4: 'philosophy_discovery_context',
    slot5: 'philosophy_practical_application',
  },
  KNOWLEDGE_6: {
    slot1: 'language_culture_impression',
    slot2: 'personal_meaning_understanding',
    slot3: 'origin_context_memory',
    slot4: 'personal_usage_experience',
    slot5: 'language_culture_encounter',
  },
  KNOWLEDGE_ART: {
    slot1: 'artwork_impression',
    slot2: 'visual_expression_memory',
    slot3: 'artist_intent_interpretation',
    slot4: 'artwork_encounter',
    slot5: 'creative_influence',
  },
  KNOWLEDGE_7: {
    slot1: 'trivia_surprise_impression',
    slot2: 'trivia_discovery_context',
    slot3: 'trivia_confidence_uncertainty',
    slot4: 'trivia_verification_experience',
    slot5: 'trivia_sharing_memory',
  },
  KNOWLEDGE_8: {
    slot1: 'curiosity_impression',
    slot2: 'interest_origin',
    slot3: 'inquiry_method',
    slot4: 'expectation_revision',
    slot5: 'remaining_questions',
  },
  NATURE_TIME_2: {
    slot1: 'preference_reason',
    slot2: 'memorable_experience',
  },
  NATURE_TIME_3: {
    slot1: 'time_of_day_impression',
    slot2: 'time_of_day_routine_experience',
  },
  NATURE_TIME_4: {
    slot1: 'calendar_day_meaning_impression',
    slot2: 'calendar_day_routine_memory',
  },
  NATURE_TIME_5: {
    slot1: 'natural_landscape_impression',
    slot2: 'natural_landscape_experience_interest',
  },
  NATURE_TIME_6: {
    slot1: 'natural_phenomenon_understanding',
    slot2: 'natural_phenomenon_experience_impression',
  },
  NATURE_TIME_7: {
    slot1: 'space_object_understanding',
    slot2: 'space_object_experience_impression',
  },
  NATURE_TIME_8: {
    slot1: 'nature_other_feature_understanding',
    slot2: 'nature_other_observation_interest',
  },
  MONEY_1: {
    slot1: 'money_role_understanding',
    slot2: 'money_experience_interest',
  },
  MONEY_2: {
    slot1: 'price_pricing_understanding',
    slot2: 'price_personal_evaluation',
  },
  MONEY_3: {
    slot1: 'shopping_method_understanding',
    slot2: 'shopping_experience_impression',
  },
  MONEY_4: {
    slot1: 'income_mechanism_understanding',
    slot2: 'income_personal_view',
  },
  MONEY_5: {
    slot1: 'saving_method_understanding',
    slot2: 'saving_experience_impression',
  },
  MONEY_6: {
    slot1: 'payment_method_understanding',
    slot2: 'payment_experience_impression',
  },
  MONEY_7: {
    slot1: 'contract_insurance_understanding',
    slot2: 'contract_insurance_experience_impression',
  },
  MONEY_8: {
    slot1: 'shopping_other_usage_understanding',
    slot2: 'shopping_other_experience_impression',
  },
  EVENT_1: {
    slot1: 'anniversary_meaning_understanding',
    slot2: 'anniversary_memory_impression',
  },
  EVENT_2: {
    slot1: 'seasonal_event_understanding',
    slot2: 'seasonal_event_memory_impression',
  },
  EVENT_3: {
    slot1: 'festival_event_understanding',
    slot2: 'festival_event_experience_impression',
  },
  EVENT_4: {
    slot1: 'life_event_understanding',
    slot2: 'life_event_experience_impression',
  },
  EVENT_5: {
    slot1: 'school_event_understanding',
    slot2: 'school_event_memory_impression',
  },
  EVENT_7: {
    slot1: 'event_other_understanding',
    slot2: 'event_other_experience_impression',
  },
  OTHER_1: {
    slot1: 'uncategorized_word_meaning',
    slot2: 'uncategorized_word_impression',
  },
  OTHER_2: {
    slot1: 'unknown_word_known_information',
    slot2: 'unknown_word_question_interest',
  },
};
const VALID_PERSON_WORD_DEEP_DIVE_KEYS = new Set(
  Object.values(PERSON_DEEP_DIVE_KEYS).flatMap((slots) => Object.values(slots)),
);

/** 派生・掘り下げ質問プールを持つ分類だけをコンボの親候補にする。 */
const WORD_COMBO_SUPPORTED_SUBCATEGORIES = new Set([
  'PERSON_1',
  'PERSON_2',
  'PERSON_3',
  'PERSON_4',
  'PERSON_ENTERTAINER',
  'PERSON_MANGA_ARTIST',
  'PERSON_AUTHOR_WRITER',
  'PERSON_ATHLETE',
  'PERSON_SCIENTIST',
  'PERSON_HISTORICAL_MILITARY',
  'PERSON_HISTORICAL_CULTURAL',
  'PERSON_STREAMER',
  'PERSON_OTHER',
  // 既存保存の有名人・歴史人物は、旧質問プールを使って継続できる。
  'PERSON_LEGACY_FAMOUS',
  'ANIMAL_PET',
  'ANIMAL_1',
  'ANIMAL_2',
  'ANIMAL_3',
  'ANIMAL_4',
  'ANIMAL_5',
  'ANIMAL_6',
  'FOOD_1',
  'FOOD_2',
  'FOOD_3',
  'FOOD_4',
  'FOOD_5',
  'FOOD_6',
  'PLACE_1',
  'PLACE_2',
  'PLACE_5',
  'PLACE_3',
  'PLACE_7',
  'PLACE_6',
  'PLACE_8',
  'PLACE_4',
  'OBJECT_1',
  'OBJECT_2',
  'OBJECT_3',
  'OBJECT_4',
  'OBJECT_5',
  'OBJECT_6',
  'CLOTHING_1',
  'CLOTHING_2',
  'CLOTHING_3',
  'CLOTHING_4',
  'CLOTHING_5',
  'CLOTHING_6',
  'TECH_1',
  'TECH_2',
  'TECH_3',
  'TECH_4',
  'TECH_5',
  'TECH_6',
  'TECH_7',
  'VEHICLE_1',
  'VEHICLE_2',
  'VEHICLE_3',
  'VEHICLE_4',
  'VEHICLE_5',
  'VEHICLE_6',
  'ACTIVITY_1',
  'ACTIVITY_2',
  'ACTIVITY_3',
  'ACTIVITY_4',
  'ACTIVITY_5',
  'ACTIVITY_6',
  'SPORTS_1',
  'SPORTS_2',
  'SPORTS_3',
  'SPORTS_4',
  'SPORTS_5',
  'SPORTS_6',
  'SPORTS_DISCIPLINE',
  'SPORTS_TEAM_CLUB',
  'SPORTS_EVENT_MATCH',
  'WORK_1',
  'WORK_2',
  'WORK_3',
  'WORK_4',
  'WORK_5',
  'WORK_6',
  'SCHOOL_1',
  'SCHOOL_2',
  'SCHOOL_3',
  'SCHOOL_4',
  'SCHOOL_5',
  'SCHOOL_6',
  'SCHOOL_7',
  'BODY_1',
  'BODY_2',
  'BODY_3',
  'BODY_4',
  'BODY_6',
  'BODY_7',
  'EMOTION_1',
  'EMOTION_2',
  'EMOTION_3',
  'EMOTION_4',
  'EMOTION_5',
  'EMOTION_6',
  'EMOTION_8',
  'GAME_MEDIA_1',
  'GAME_MEDIA_2',
  'GAME_MEDIA_3',
  'GAME_MEDIA_NOVEL',
  'GAME_MEDIA_4',
  'GAME_MEDIA_5',
  'GAME_MEDIA_6',
  'GAME_MEDIA_7',
  'AV_MEDIA_1',
  'AV_MEDIA_2',
  'AV_MEDIA_3',
  'AV_MEDIA_4',
  'AV_MEDIA_5',
  'AV_MEDIA_6',
  'AV_MEDIA_7',
  'KNOWLEDGE_1',
  'KNOWLEDGE_2',
  'KNOWLEDGE_3',
  'KNOWLEDGE_4',
  'KNOWLEDGE_5',
  'KNOWLEDGE_6',
  'KNOWLEDGE_7',
  'KNOWLEDGE_8',
  'KNOWLEDGE_ART',
  'NATURE_TIME_2',
  'NATURE_TIME_3',
  'NATURE_TIME_4',
  'NATURE_TIME_5',
  'NATURE_TIME_6',
  'NATURE_TIME_7',
  'NATURE_TIME_8',
  'MONEY_1',
  'MONEY_2',
  'MONEY_3',
  'MONEY_4',
  'MONEY_5',
  'MONEY_6',
  'MONEY_7',
  'MONEY_8',
  'EVENT_1',
  'EVENT_2',
  'EVENT_3',
  'EVENT_4',
  'EVENT_5',
  'EVENT_7',
  'OTHER_1',
  'OTHER_2',
]);

/**
 * ことばコンボで同じ親ワードへすぐ戻らないために保持する選出履歴数。
 * 将来ほかの大カテゴリーへ広げる場合も、実際に出題した単語IDをここへ積む。
 */
const COMBO_PARENT_RECENT_HISTORY_LIMIT = 5;

type StoredState = {
  version: 16;
  words: Record<string, WordEntry>;
  memories: ConversationMemory[];
  relations: Relation[];
  events: MemoryEvent[];
  conversations: ConversationLog[];
  startDate: string | null;
  dayOverride: number | null;
  ended: boolean;
  conversationCount: number;
  goalText: string | null;
  goalSetAt: string | null;
  lastGoalCheckDate: string | null;
  goalChecks: GoalCheck[];
  lastWordSurface: string | null;
  /** この個体が見た新会話のID。次回は未閲覧の台本を優先する。 */
  seenConversationIds: string[];
  pendingDayConversationId: string | null;
  /** 選択肢の記録。単語記憶・性格診断へは今回接続しない。 */
  conversationChoiceRecords: ConversationChoiceRecord[];
  memoryRelations: MemoryRelation[];
  openQuestions: OpenQuestion[];
  memoryEpisodes: MemoryEpisode[];
  memoryHypotheses: MemoryHypothesis[];
  /** 元ワードIDごとに、一度提示したPERSON質問（掘り下げ・派生）IDを保存する。 */
  personDerivedConversationUses: Record<string, string[]>;
  /** 直近の質問種別。掘り下げの連続を避ける選択制御に使う。 */
  personDerivedQuestionHistory: Array<'deepDive' | 'derived'>;
  /** PERSON元ワードへの自由回答。WordEntryとは分離して保存する。 */
  personWordDeepDives: Record<string, PersonWordDeepDive>;
  /** コンボでかな入力された派生語の読み。正式表記へ直してもIDに紐づいて残す。 */
  wordReadings: Record<string, string>;
  /** コンボから新規作成された語。図鑑での初回正式表記報酬の対象判定に使う。 */
  personComboWordIds: string[];
  /** 元ワード単位の軽量な出題統計。質問本文は保存しない。 */
  personComboParentProgress: Record<string, PersonComboParentProgress>;
  /** 直近のことばコンボで実際に出題した親ワードID。最大5件。 */
  comboParentRecentHistory: string[];
  /** ペット個体にだけ付く、現在・過去の一緒に暮らした時期。 */
  petStatuses: Record<string, PetStatus>;
  /** 現在飼っているペットへ近況を聞いた日。1日に何度も同じことを聞かない。 */
  petLastCheckInDays: Record<string, number>;
  externalTopicHistory: ExternalTopicUse[];
  earlyInterestWordId: string | null;
  earlyComboOffered: boolean;
  earlyWorldFallbackShown: boolean;
  startupExternalAttempts: StartupAttempt[];
  externalCatalog: ExternalCatalog;
  sharedKnowledgeHistory: SharedUse[];
};

/**
 * 開発者モードで、まだPERSON語が一つもない保存データでもコンボ画面を
 * 確認できるようにするためのメモリ上だけの親ワード。
 * localStorage・辞書・報酬には一切書き込まない。
 */
type DevelopmentPersonComboState = {
  parent: WordEntry;
  usedQuestionIds: string[];
  questionHistory: Array<'deepDive' | 'derived'>;
  deepDive: PersonWordDeepDive;
};

type LegacyWordEntry = Partial<WordEntry> & {
  knowledgeLevel?: unknown;
  firstSeen?: string;
  lastSeen?: string;
  lastSeenDay?: number;
  lastUsedInConversationDay?: number;
  attributes?: Record<string, string>;
  importance?: number;
  lastReferencedAt?: number;
  lastRecalled?: string;
  oshiStatus?: unknown;
  oshiConfirmedAt?: number;
};

type PersistedState = Omit<Partial<StoredState>, 'version' | 'words' | 'personWordDeepDives' | 'wordReadings'> & {
  version?: number;
  words?: Record<string, LegacyWordEntry>;
  personWordDeepDives?: unknown;
  wordReadings?: unknown;
  oshiLoveCounts?: Record<string, number>;
};

type Session = {
  id: string;
  stage: ConversationStage;
  phase: ConversationPhase;
  startType: StartType;
  expected: ExpectedAnswer;
  inputMode: InputMode;
  topic: string | null;
  category: WordCategory;
  choices: ConversationChoice[];
  lastUserText: string;
  lastAssistantLines: string[];
  attributes: Record<string, string>;
  pendingGoalStatus: GoalStatus | null;
};

function emptyState(): StoredState {
  return {
    version: 16,
    words: Object.create(null),
    memories: [],
    relations: [],
    events: [],
    conversations: [],
    startDate: null,
    dayOverride: null,
    ended: false,
    conversationCount: 0,
    goalText: null,
    goalSetAt: null,
    lastGoalCheckDate: null,
    goalChecks: [],
    lastWordSurface: null,
    seenConversationIds: [],
    pendingDayConversationId: null,
    conversationChoiceRecords: [],
    memoryRelations: [],
    openQuestions: [],
    memoryEpisodes: [],
    memoryHypotheses: [],
    personDerivedConversationUses: Object.create(null),
    personDerivedQuestionHistory: [],
    personWordDeepDives: Object.create(null),
    wordReadings: Object.create(null),
    personComboWordIds: [],
    personComboParentProgress: Object.create(null),
    comboParentRecentHistory: [],
    petStatuses: Object.create(null),
    petLastCheckInDays: Object.create(null),
    externalTopicHistory: [],
    earlyInterestWordId: null,
    earlyComboOffered: false,
    earlyWorldFallbackShown: false,
    startupExternalAttempts: [],
    externalCatalog: sanitizeExternalCatalog(null),
    sharedKnowledgeHistory: [],
  };
}

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

function cleanText(value: string) {
  return value.normalize('NFKC').trim();
}

const UNAVAILABLE_DERIVED_ANSWERS = new Set([
  'いない',
  'ない',
  '思いつかない',
  '思い付かない',
  'わからない',
  '分からない',
  '特にない',
  '特にありません',
]);

function isUnavailableDerivedAnswer(value: string) {
  return UNAVAILABLE_DERIVED_ANSWERS.has(cleanText(value).replace(/[。.!！?？]+$/u, ''));
}

function migrateWords(rawWords: Record<string, LegacyWordEntry>, sourceVersion: number) {
  const ordered = Object.entries(rawWords).sort(([leftKey, left], [rightKey, right]) => {
    if (sourceVersion >= 10) {
      const orderDifference = (left.learnedOrder ?? Number.MAX_SAFE_INTEGER)
        - (right.learnedOrder ?? Number.MAX_SAFE_INTEGER);
      if (orderDifference !== 0) return orderDifference;
    }
    const dayDifference = (left.firstSeenDay ?? 1) - (right.firstSeenDay ?? 1);
    if (dayDifference !== 0) return dayDifference;
    const timeDifference = Date.parse(left.firstSeen ?? '') - Date.parse(right.firstSeen ?? '');
    if (Number.isFinite(timeDifference) && timeDifference !== 0) return timeDifference;
    return leftKey.localeCompare(rightKey, 'ja');
  });

  const migrated: Record<string, WordEntry> = Object.create(null);
  ordered.forEach(([storedSurface, legacy], index) => {
    const surface = typeof legacy.surface === 'string' && legacy.surface.trim()
      ? legacy.surface
      : storedSurface;
    const id = typeof legacy.id === 'string' && legacy.id
      ? legacy.id
      : `word_migrated_${index + 1}`;
    const entry: WordEntry = {
      id,
      surface,
      category: legacy.category ?? 'UNKNOWN',
      firstSeenDay: legacy.firstSeenDay ?? 1,
      learnedOrder: index + 1,
      rootWordId: sourceVersion >= 10 && legacy.rootWordId ? legacy.rootWordId : id,
      mentionCount: Math.max(1, legacy.mentionCount ?? 1),
    };
    const legacySubcategory = legacy.subcategory ?? legacy.attributes?.['subCategoryId'];
    const subcategory = migratePersonSubcategory(legacy.category, legacySubcategory, sourceVersion);
    const lastUsedDay = legacy.lastUsedDay
      ?? legacy.lastUsedInConversationDay
      ?? legacy.lastSeenDay;
    if (subcategory) entry.subcategory = subcategory;
    if (typeof legacy.learnedAt === 'string' && Number.isFinite(Date.parse(legacy.learnedAt))) entry.learnedAt = legacy.learnedAt;
    if (sourceVersion >= 10 && legacy.firstDerivedFromWordId) {
      entry.firstDerivedFromWordId = legacy.firstDerivedFromWordId;
    }
    if (legacy.userSentiment) entry.userSentiment = legacy.userSentiment;
    if (legacy.description) entry.description = legacy.description;
    if (typeof lastUsedDay === 'number') entry.lastUsedDay = lastUsedDay;
    migrated[surface] = entry;
  });
  return migrated;
}

/**
 * v10までのPERSON_5は複数の新分類を含んでいたため、意味を推測して振り分けない。
 * PERSON_6は「その他」の意味が同じなので、新しい明示的IDへそのまま移す。
 * v11までのPERSON_CREATORも漫画家・作家を区別できないため、旧分類として保持する。
 * v12までの政治家・実業家は、意味を推測し直さず「その他の人」へまとめる。
 */
function migratePersonSubcategory(
  category: WordCategory | undefined,
  subcategory: string | undefined,
  sourceVersion: number,
) {
  if (category !== 'PERSON' || !subcategory) return subcategory;
  if (sourceVersion < 11) {
    if (subcategory === 'PERSON_5') return 'PERSON_LEGACY_FAMOUS';
    if (subcategory === 'PERSON_6') return 'PERSON_OTHER';
  }
  if (sourceVersion < 12 && subcategory === 'PERSON_CREATOR') {
    return 'PERSON_LEGACY_CREATOR';
  }
  if (sourceVersion < 13 && subcategory === 'PERSON_POLITICIAN_BUSINESS') {
    return 'PERSON_OTHER';
  }
  return subcategory;
}

function migratePersonWordDeepDives(
  rawDeepDives: unknown,
  words: Record<string, WordEntry>,
) {
  const migrated: Record<string, PersonWordDeepDive> = Object.create(null);
  if (!rawDeepDives || typeof rawDeepDives !== 'object' || Array.isArray(rawDeepDives)) {
    return migrated;
  }

  const wordsById = new Map(Object.values(words).map((word) => [word.id, word]));
  for (const [wordId, rawRecord] of Object.entries(rawDeepDives)) {
    const word = wordsById.get(wordId);
    if (
      !word
      || !rawRecord
      || typeof rawRecord !== 'object'
      || Array.isArray(rawRecord)
    ) continue;

    const source = rawRecord as Record<string, unknown>;
    const record: PersonWordDeepDive = {};
    for (const slot of PERSON_DEEP_DIVE_SLOTS) {
      const rawEntry = source[slot];
      if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) continue;
      const entry = rawEntry as Record<string, unknown>;
      if (
        typeof entry.key !== 'string'
        || !VALID_PERSON_WORD_DEEP_DIVE_KEYS.has(entry.key as PersonWordDeepDiveKey)
        || typeof entry.value !== 'string'
      ) continue;
      const value = cleanText(entry.value);
      if (value) record[slot] = { key: entry.key as PersonWordDeepDiveKey, value };
    }
    if (PERSON_DEEP_DIVE_SLOTS.some((slot) => Boolean(record[slot]))) migrated[wordId] = record;
  }
  return migrated;
}

const PERSON_QUESTION_ID_MIGRATIONS: Readonly<Record<string, string>> = {
  // 旧01とv2の01だけは、どちらも「一緒に思い出す家族」で意味が一致する。
  PERSON_FAMILY_01: 'PERSON_FAMILY_V2_01',
  // 旧01とv2の01は、どちらも友達の周辺にいる別の友達を聞く質問。
  PERSON_FRIEND_01: 'PERSON_FRIEND_V2_01',
  // 旧02とv2の09は、どちらも大切な人と過ごした場所を聞く質問。
  PERSON_IMPORTANT_02: 'PERSON_IMPORTANT_V2_09',
  // 旧01は相手の役目、旧02は会う学校・職場を聞く質問としてv2へ引き継ぐ。
  PERSON_WORKSCHOOL_01: 'PERSON_WORKSCHOOL_V2_14',
  PERSON_WORKSCHOOL_02: 'PERSON_WORKSCHOOL_V2_10',
};

function migratePersonConversationUses(rawUses: unknown) {
  if (!rawUses || typeof rawUses !== 'object' || Array.isArray(rawUses)) {
    return Object.create(null) as Record<string, string[]>;
  }
  return Object.fromEntries(Object.entries(rawUses)
    .filter(([, ids]) => Array.isArray(ids))
    .map(([wordId, ids]) => {
      const validIds = (ids as unknown[]).filter((id): id is string => typeof id === 'string');
      const migratedIds = validIds.flatMap((id) => {
        const replacement = PERSON_QUESTION_ID_MIGRATIONS[id];
        return replacement ? [id, replacement] : [id];
      });
      return [wordId, [...new Set(migratedIds)]];
    }));
}

function migratePersonComboParentProgress(rawProgress: unknown, words: Record<string, WordEntry>) {
  if (!rawProgress || typeof rawProgress !== 'object' || Array.isArray(rawProgress)) {
    return Object.create(null) as Record<string, PersonComboParentProgress>;
  }
  const wordIds = new Set(Object.values(words).map((word) => word.id));
  const migrated: Record<string, PersonComboParentProgress> = Object.create(null);
  for (const [wordId, rawEntry] of Object.entries(rawProgress)) {
    if (!wordIds.has(wordId) || !rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) continue;
    const entry = rawEntry as Record<string, unknown>;
    const questionPromptCount = typeof entry.questionPromptCount === 'number'
      ? Math.max(0, Math.floor(entry.questionPromptCount))
      : 0;
    const selectedAsParentCount = typeof entry.selectedAsParentCount === 'number'
      ? Math.max(0, Math.floor(entry.selectedAsParentCount))
      : 0;
    const lastQuestionDay = typeof entry.lastQuestionDay === 'number'
      ? Math.max(1, Math.floor(entry.lastQuestionDay))
      : undefined;
    migrated[wordId] = {
      questionPromptCount,
      selectedAsParentCount,
      ...(lastQuestionDay ? { lastQuestionDay } : {}),
    };
  }
  return migrated;
}

function quote(value: string) {
  return `「${value}」`;
}

/** 演出指示を表示文へ混ぜず、台詞だけを既存UIへ渡す。 */
function dialogueLines(beats: readonly DialogueBeat[]) {
  return beats.flatMap((beat) => beat.text ? [beat.text] : []);
}

const DIALOGUE_PAGE_CHARACTER_LIMIT = 92;
const DIALOGUE_PAGE_LINE_LIMIT = 4;

/** 細かい原稿beatを、3〜5行を目安にした表示ページへまとめる。 */
function dialoguePages(beats: readonly DialogueBeat[]): DialoguePage[] {
  const pages: DialoguePage[] = [];
  let current: DialoguePage = { lines: [] };
  let characterCount = 0;
  let pendingEmotion: DialoguePage['emotion'];
  let pendingAction: string | undefined;
  let pendingPauseBeforeMs = 0;

  const flush = () => {
    if (current.lines.length === 0) return;
    const lastLineIndex = current.lines.length - 1;
    const trailingPause = current.linePauseAfterMs?.[lastLineIndex] ?? 0;
    if (trailingPause > 0) {
      current.pauseAfterMs = Math.min(1200, (current.pauseAfterMs ?? 0) + trailingPause);
      if (current.linePauseAfterMs) current.linePauseAfterMs[lastLineIndex] = 0;
    }
    if (current.linePauseAfterMs?.every((duration) => !duration)) delete current.linePauseAfterMs;
    pages.push(current);
    current = { lines: [] };
    characterCount = 0;
  };

  for (const beat of beats) {
    if (!beat.text) {
      if (beat.emotion) pendingEmotion = beat.emotion;
      if (beat.action) pendingAction = beat.action;
      if (beat.pauseMs) {
        if (current.lines.length > 0) {
          const lineIndex = current.lines.length - 1;
          current.linePauseAfterMs ??= [];
          current.linePauseAfterMs[lineIndex] = Math.min(
            1200,
            (current.linePauseAfterMs[lineIndex] ?? 0) + beat.pauseMs,
          );
        } else {
          pendingPauseBeforeMs = Math.min(1200, pendingPauseBeforeMs + beat.pauseMs);
        }
      }
      continue;
    }

    const textLength = Array.from(beat.text).length;
    const emotion = beat.emotion ?? pendingEmotion;
    const action = beat.action ?? pendingAction;
    const emotionChanged = Boolean(
      current.emotion
      && emotion
      && current.emotion !== emotion
      && current.lines.length > 0,
    );
    if (
      current.lines.length >= DIALOGUE_PAGE_LINE_LIMIT
      || (current.lines.length > 0 && characterCount + textLength > DIALOGUE_PAGE_CHARACTER_LIMIT)
      || emotionChanged
    ) {
      flush();
    }

    current.lines.push(beat.text);
    characterCount += textLength;
    if (current.lines.length === 1 && pendingPauseBeforeMs > 0) {
      current.pauseBeforeMs = pendingPauseBeforeMs;
      pendingPauseBeforeMs = 0;
    }
    current.emotion ??= emotion;
    current.action ??= action;
    pendingEmotion = undefined;
    pendingAction = undefined;
  }
  flush();
  return pages;
}

function dialoguePagesFromLines(lines: readonly string[]) {
  return dialoguePages(lines.map((text) => ({ text })));
}

function sayForRuntime(...texts: string[]): DialogueBeat[] {
  return texts.map((text) => ({ text }));
}

function pathIsKnownChoice(choiceId: string) {
  return choiceId.includes('_KNOWN_');
}

function phaseLabel(day: number) {
  if (day >= 30) return 'おわかれ';
  if (day <= 7) return 'であい';
  if (day <= 18) return 'なかよし';
  if (day <= 26) return 'しんみつ';
  return 'のこりわずか';
}

function sentimentForChoice(id: string): Sentiment {
  if (id === 'WORD_LOVE') return 'LOVE';
  if (id === 'WORD_LIKE') return 'LIKE';
  if (id === 'WORD_DISLIKE' || id === 'WORD_HATE') return 'DISLIKE';
  if (id === 'WORD_INTERESTED') return 'INTERESTED';
  return 'NEUTRAL';
}

export class SuuhimochiConversation {
  // Public feed snapshots are transient; personal state never enters the fetch path.
  private externalSnapshot: ExternalSnapshot | null = null;
  private sharedKnowledgeEnabled = false;
  private sharedDialogues: SharedDialogue[] = [];
  private externalBootId = `boot:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}:${Math.random()}`}`;
  private state: StoredState;
  private session: Session;
  private storage: StorageLike;
  private random: () => number;
  private now: () => Date;
  private farewellQueue: string[] = [];
  private activeDayConversation: ConversationScript | null = null;
  private activeCuriousWord: WordEntry | null = null;
  private activeCuriousRelatedWord: WordEntry | null = null;
  private activeCuriousRelationIds: string[] = [];
  private activeCuriousOpenQuestionIds: string[] = [];
  private activePersonDerivedConversation: PersonDerivedConversation | null = null;
  private activePersonDeepDiveConversation: PersonDeepDiveConversation | null = null;
  private activePersonDeepDiveAnswer = '';
  private activePersonDerivedParentWord: WordEntry | null = null;
  private activePersonDerivedWord: WordEntry | null = null;
  private activePersonDerivedRelationIds: string[] = [];
  private developmentPersonCombo: DevelopmentPersonComboState | null = null;
  private sessionSequence = 0;
  private debug: DebugSnapshot;

  constructor(options: { storage?: StorageLike; random?: () => number; now?: () => Date } = {}) {
    this.storage = options.storage ?? (typeof localStorage === 'undefined' ? memoryStorage() : localStorage);
    this.random = options.random ?? Math.random;
    this.now = options.now ?? (() => new Date());
    this.state = this.load();
    this.session = this.blankSession();
    this.debug = this.blankDebug();
    // 読み込んだ旧形式は、不要項目を含まない現行形式で直ちに保存し直す。
    this.save();
    this.ensureStartDate();
  }

  private blankSession(): Session {
    return {
      id: `session_${this.now().getTime()}_${++this.sessionSequence}`,
      stage: 'topic',
      phase: 'IDLE',
      startType: 'WORD',
      expected: 'NONE',
      inputMode: 'none',
      topic: null,
      category: 'UNKNOWN',
      choices: [],
      lastUserText: '',
      lastAssistantLines: [],
      attributes: {},
      pendingGoalStatus: null,
    };
  }

  private blankDebug(): DebugSnapshot {
    return {
      input: '',
      tokens: [],
      topic: '',
      topicScore: 0,
      topicKnown: true,
      state: 'IDLE',
      attributes: {},
      memoryHit: null,
      selectedTemplate: '',
      depth: 0,
      startType: 'WORD',
      output: [],
    };
  }

  private load(): StoredState {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as PersistedState;
      const words = migrateWords(parsed.words ?? {}, parsed.version ?? 0);
      return {
        version: 16,
        words: Object.assign(Object.create(null), words),
        memories: parsed.memories ?? [],
        relations: parsed.relations ?? [],
        events: parsed.events ?? [],
        conversations: parsed.conversations ?? [],
        startDate: parsed.startDate ?? null,
        dayOverride: parsed.dayOverride ?? null,
        ended: parsed.ended ?? false,
        conversationCount: parsed.conversationCount ?? 0,
        goalText: parsed.goalText ?? null,
        goalSetAt: parsed.goalSetAt ?? null,
        lastGoalCheckDate: parsed.lastGoalCheckDate ?? null,
        goalChecks: parsed.goalChecks ?? [],
        lastWordSurface: parsed.lastWordSurface ?? null,
        seenConversationIds: Array.isArray(parsed.seenConversationIds) ? parsed.seenConversationIds.filter((id): id is string => typeof id === 'string' && id !== parsed.pendingDayConversationId) : [],
        pendingDayConversationId: null,
        conversationChoiceRecords: Array.isArray(parsed.conversationChoiceRecords)
          ? parsed.conversationChoiceRecords.filter((record): record is ConversationChoiceRecord => (
            Boolean(record)
            && typeof record.conversationId === 'string'
            && typeof record.choiceId === 'string'
            && typeof record.day === 'number'
            && typeof record.timestamp === 'string'
          ))
          : [],
        memoryRelations: Array.isArray(parsed.memoryRelations) ? parsed.memoryRelations : [],
        openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
        memoryEpisodes: Array.isArray(parsed.memoryEpisodes) ? parsed.memoryEpisodes : [],
        memoryHypotheses: Array.isArray(parsed.memoryHypotheses) ? parsed.memoryHypotheses : [],
        externalTopicHistory: sanitizeExternalHistory(parsed.externalTopicHistory),
        startupExternalAttempts: sanitizeStartupAttempts(parsed.startupExternalAttempts),
        externalCatalog: sanitizeExternalCatalog(parsed.externalCatalog),
        sharedKnowledgeHistory: sanitizeSharedHistory(parsed.sharedKnowledgeHistory),
        earlyInterestWordId: typeof parsed.earlyInterestWordId === 'string'
          && Object.values(words).some((word) => word.id === parsed.earlyInterestWordId) ? parsed.earlyInterestWordId : null,
        earlyComboOffered: parsed.earlyComboOffered === true,
        earlyWorldFallbackShown: parsed.earlyWorldFallbackShown === true,
        personDerivedConversationUses: migratePersonConversationUses(
          parsed.personDerivedConversationUses,
        ),
        personDerivedQuestionHistory: Array.isArray(parsed.personDerivedQuestionHistory)
          ? parsed.personDerivedQuestionHistory.filter((kind): kind is 'deepDive' | 'derived' => (
            kind === 'deepDive' || kind === 'derived'
          )).slice(-2)
          : [],
        personWordDeepDives: migratePersonWordDeepDives(parsed.personWordDeepDives, words),
        wordReadings: parsed.wordReadings && typeof parsed.wordReadings === 'object' && !Array.isArray(parsed.wordReadings)
          ? Object.fromEntries(Object.entries(parsed.wordReadings)
            .filter(([wordId, reading]) => (
              Object.values(words).some((word) => word.id === wordId)
              && typeof reading === 'string'
              && Boolean(cleanText(reading))
            ))
            .map(([wordId, reading]) => [wordId, cleanText(reading as string)]))
          : Object.create(null),
        personComboWordIds: Array.isArray(parsed.personComboWordIds)
          ? [...new Set(parsed.personComboWordIds.filter((wordId): wordId is string => (
            typeof wordId === 'string' && Object.values(words).some((word) => word.id === wordId)
          )))]
          : [],
        personComboParentProgress: migratePersonComboParentProgress(
          parsed.personComboParentProgress,
          words,
        ),
        comboParentRecentHistory: Array.isArray(parsed.comboParentRecentHistory)
          ? parsed.comboParentRecentHistory
            .filter((wordId): wordId is string => (
              typeof wordId === 'string'
              && Object.values(words).some((word) => word.id === wordId)
            ))
            .slice(-COMBO_PARENT_RECENT_HISTORY_LIMIT)
          : [],
        petStatuses: parsed.petStatuses && typeof parsed.petStatuses === 'object' && !Array.isArray(parsed.petStatuses)
          ? Object.fromEntries(Object.entries(parsed.petStatuses)
            .filter(([wordId, status]) => (
              (status === 'CURRENT' || status === 'FORMER')
              && Object.values(words).some((word) => (
                word.id === wordId
                && word.category === 'ANIMAL'
                && word.subcategory === 'ANIMAL_PET'
              ))
            ))) as Record<string, PetStatus>
          : Object.create(null),
        petLastCheckInDays: parsed.petLastCheckInDays && typeof parsed.petLastCheckInDays === 'object' && !Array.isArray(parsed.petLastCheckInDays)
          ? Object.fromEntries(Object.entries(parsed.petLastCheckInDays)
            .filter(([wordId, day]) => (
              Number.isInteger(day)
              && (day as number) > 0
              && Object.values(words).some((word) => (
                word.id === wordId
                && word.category === 'ANIMAL'
                && word.subcategory === 'ANIMAL_PET'
              ))
            ))) as Record<string, number>
          : Object.create(null),
      };
    } catch {
      return emptyState();
    }
  }

  private save() {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      // 保存失敗で会話を止めず、開発者には原因を残す。
      console.warn('[wordMemory] localStorageへの保存に失敗しました。', error);
    }
  }

  private dateKey(date = this.now()) {
    return getActivityDateKey(date);
  }

  private ensureStartDate() {
    if (!this.state.startDate) {
      this.state.startDate = this.dateKey();
      this.save();
    }
  }

  private daysSince(dateKey: string) {
    const from = new Date(`${dateKey}T00:00:00`);
    const to = new Date(`${this.dateKey()}T00:00:00`);
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));
  }

  getCurrentDay() {
    this.ensureStartDate();
    const startDate = this.state.startDate ?? this.dateKey();
    const start = new Date(`${startDate}T00:00:00`);
    const today = new Date(`${this.dateKey()}T00:00:00`);
    const realDay = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;
    return Math.min(30, Math.max(1, this.state.dayOverride ?? realDay));
  }

  getPhaseLabel() {
    return phaseLabel(this.getCurrentDay());
  }

  getGoal() {
    return this.state.goalText;
  }

  getGoalChecks() {
    return this.state.goalChecks.map((item) => ({ ...item }));
  }

  getSeenConversationIds() {
    return [...this.state.seenConversationIds];
  }

  getConversationChoiceRecords() {
    return this.state.conversationChoiceRecords.map((record) => ({ ...record }));
  }

  getMemoryRelations() {
    return this.state.memoryRelations.map((relation) => ({ ...relation }));
  }

  setSharedKnowledge(data: SharedKnowledgeResult | null, enabled: boolean, profileNames: readonly string[] = []) {
    this.sharedKnowledgeEnabled = enabled;
    const allowed = new Set((data?.dictionary?.keywords ?? []).filter((word) => !profileNames.includes(word)));
    this.sharedDialogues = !enabled ? [] : (data?.caches ?? []).flatMap((cache) => allowed.has(cache.keyword)
      ? parseSharedDialogues({ status: 'OK', keyword: cache.keyword, items: cache.items }, cache.keyword) : []);
  }

  getSharedKnowledgeHistory() { return sanitizeSharedHistory(this.state.sharedKnowledgeHistory); }

  prepareSharedKnowledgeTalk(trigger: SharedTalkPlan['trigger'] = 'normal', revision?: string): SharedTalkPlan | null {
    if (!this.sharedKnowledgeEnabled || this.state.ended || this.session.startType === 'FAREWELL' || this.developmentPersonCombo
      || (this.getCurrentDay() === 1 && !(this.state.earlyInterestWordId && this.state.earlyComboOffered))) return null;
    const eventId = trigger === 'startup' ? this.externalBootId : trigger === 'update' ? revision ? `update:${revision}` : ''
      : `normal:${this.now().getTime()}:${this.state.sharedKnowledgeHistory.length}`;
    if (!eventId || this.state.startupExternalAttempts.some((attempt) => attempt.eventId === eventId)) return null;
    const selected = selectSharedDialogue(this.sharedDialogues, this.getWordEntries(), this.state.sharedKnowledgeHistory, this.now());
    return selected ? { ...selected, eventId, trigger, shared: true } : null;
  }

  markSharedKnowledgeTalkShown(plan: SharedTalkPlan) {
    const revision = plan.trigger === 'update' ? plan.eventId.slice('update:'.length) : undefined;
    const current = this.prepareSharedKnowledgeTalk(plan.trigger, revision);
    if (!current || current.eventId !== plan.eventId || current.item.id !== plan.item.id) return null;
    const timestamp = this.now().toISOString();
    const use: SharedUse = { ...current.item, wordId: current.wordId, eventId: current.eventId, timestamp, day: this.getCurrentDay(), outcome: 'SHOWN' };
    this.state.sharedKnowledgeHistory.push(use);
    if (plan.trigger !== 'normal') this.state.startupExternalAttempts.push({ activityDate: this.dateKey(), timestamp,
      eventId: current.eventId, trigger: plan.trigger, useId: use.id, outcome: 'SHOWN', detail: '完全一致の共有知識' });
    // Normal/combo boundaries already log through respond(); only autonomous UI needs a separate log.
    if (plan.trigger !== 'normal') this.state.conversations.push({ timestamp, speaker: 'SUUHIMOCHI', text: use.dialogue, sessionId: use.id, topic: use.keyword, questionType: 'SHARED_KNOWLEDGE' });
    this.save(); return use.id;
  }

  finishSharedKnowledgeTalk(id: string, outcome: 'SKIPPED' | 'FINISHED') {
    const use = this.state.sharedKnowledgeHistory.find((use) => use.id === id && use.outcome === 'SHOWN');
    if (!use) return;
    use.outcome = outcome;
    const attempt = this.state.startupExternalAttempts.find((attempt) => attempt.useId === id);
    if (attempt) attempt.outcome = outcome;
    this.save();
  }

  setExternalTopics(snapshot: unknown, baseline = false) {
    this.externalSnapshot = readExternalSnapshot(snapshot, this.now());
    if (this.externalSnapshot) {
      const next = observeExternalCatalog(this.state.externalCatalog, this.externalSnapshot.topics, this.now().toISOString(), baseline);
      if (JSON.stringify(next) !== JSON.stringify(this.state.externalCatalog)) {
        this.state.externalCatalog = next;
        this.save();
      }
    }
  }

  getExternalUpdateBatch() { return this.state.externalCatalog.batch ? { ...this.state.externalCatalog.batch } : null; }

  getExternalTopicHistory() {
    return sanitizeExternalHistory(this.state.externalTopicHistory);
  }

  canOfferExternalMonologue() {
    return !this.state.ended && this.session.startType !== 'FAREWELL' && !this.developmentPersonCombo
      && (this.getCurrentDay() > 1 || Boolean(this.state.earlyInterestWordId && this.state.earlyComboOffered));
  }

  /** Room speech records its actual source only: no session, learned words, inferred relations or rewards. */
  recordExternalMonologue(match: ExternalMatch, text: string, eventId: string, trigger: 'startup' | 'update') {
    if (!this.canOfferExternalMonologue() || this.state.startupExternalAttempts.some((use) => use.eventId === eventId)) return null;
    const current = this.inspectExternalTopics([match.topic]).assessments[0];
    if (!current?.candidate || !current.previewMatch) return null;
    const timestamp = this.now().toISOString();
    const use: ExternalTopicUse = { ...current.previewMatch, id: `monologue_${timestamp}_${this.state.externalTopicHistory.length}`,
      day: this.getCurrentDay(), date: this.dateKey(), timestamp, context: trigger, lines: [text], status: 'UNCONFIRMED',
      startupOutcome: 'SHOWN', eventId, topicRevision: externalTopicRevision(match.topic) };
    this.state.externalTopicHistory.push(use);
    this.state.startupExternalAttempts.push({ activityDate: this.dateKey(), timestamp, eventId, trigger, useId: use.id, outcome: 'SHOWN' });
    this.state.conversations.push({ timestamp, speaker: 'SUUHIMOCHI', text, sessionId: use.id, topic: match.topic.title,
      questionType: trigger === 'startup' ? 'STARTUP_EXTERNAL' : 'UPDATE_EXTERNAL' });
    this.save(); return use.id;
  }

  /** Read-only diagnostic and preview paths deliberately never open a session or call save(). */
  inspectExternalTopics(topics: ExternalSnapshot['topics']) {
    return evaluateExternalTopics({ topics, words: this.getWordEntries(), relations: this.state.memoryRelations,
      readings: this.state.wordReadings, history: this.getExternalTopicHistory(), now: this.now(), day: this.getCurrentDay(), allowGeneral: true });
  }

  previewExternalTopic(topic: ExternalSnapshot['topics'][number]) {
    const assessment = this.inspectExternalTopics([topic]).assessments[0];
    const historical = this.getExternalTopicHistory().find((use) => use.topic.id === topic.id);
    if (historical?.status === 'REJECTED') return null;
    const match = assessment.state === 'REJECTED' ? null : assessment.previewMatch;
    if (!match) return null;
    return { match, lines: startupDiscoveryLines(match, this.state.externalTopicHistory.length) };
  }

  getStartupExternalAttempts() { return sanitizeStartupAttempts(this.state.startupExternalAttempts); }

  hasStartupExternalAttempt() {
    return this.state.startupExternalAttempts.some((attempt) => attempt.eventId === this.externalBootId);
  }

  recordStartupOpportunity(outcome: 'NO_TOPIC' | 'BUSY', trigger: 'startup' | 'update' = 'startup', revision?: string, detail?: string) {
    const eventId = trigger === 'startup' ? this.externalBootId : revision ? `update:${revision}` : null;
    if (!eventId || this.state.ended || this.state.startupExternalAttempts.some((attempt) => attempt.eventId === eventId)) return;
    this.state.startupExternalAttempts.push({ activityDate: this.dateKey(), timestamp: this.now().toISOString(), eventId, trigger, outcome, detail });
    this.save();
  }

  getExternalAutoBlockReason(trigger: 'startup' | 'update') {
    if (this.state.ended || this.session.startType === 'FAREWELL') return '卒業・別れイベントを優先';
    if (this.getCurrentDay() === 1) return 'Day1の出会い・興味取得・コンボ導線を優先、または候補なし';
    const last = this.state.externalTopicHistory.filter((use) => use.context === 'startup' || use.context === 'update').at(-1);
    if (trigger === 'update' && last && this.now().getTime() - Date.parse(last.timestamp) < EXTERNAL_UPDATE_COOLDOWN) return '更新会話の15分クールダウン中';
    return '有効な候補なし（鮮度・訂正・再利用24時間／直前と同じ話題48時間の間隔を確認）';
  }

  prepareStartupExternalTalk(trigger: 'startup' | 'update' = 'startup', revision?: string): { activityDate: string; match: ExternalMatch; lines: string[]; trigger: 'startup' | 'update'; eventId: string; revision?: string } | null {
    const day = this.getCurrentDay();
    if ((trigger === 'startup' && day < 2) || (day === 1 && !(this.state.earlyInterestWordId && this.state.earlyComboOffered))
      || this.state.ended || this.session.startType === 'FAREWELL') return null;
    const eventId = trigger === 'startup' ? this.externalBootId : revision ? `update:${revision}` : '';
    if (!eventId || this.state.startupExternalAttempts.some((attempt) => attempt.eventId === eventId)) return null;
    const batch = this.state.externalCatalog.batch;
    if (trigger === 'update') {
      if (!batch || batch.id !== revision) return null;
      const latest = this.state.externalTopicHistory.filter((use) => use.context === 'startup' || use.context === 'update').at(-1);
      if (latest && this.now().getTime() - Date.parse(latest.timestamp) < EXTERNAL_UPDATE_COOLDOWN) return null;
    }
    const snapshot = readExternalSnapshot(this.externalSnapshot, this.now());
    const topics = (snapshot?.topics ?? []).filter((topic) => trigger === 'startup' || batch?.topicIds.includes(topic.id));
    const match = selectExternalMatch({ topics, words: this.getWordEntries(),
      relations: this.state.memoryRelations, readings: this.state.wordReadings,
      history: this.state.externalTopicHistory, now: this.now(), day, allowGeneral: true });
    if (!match) return null;
    return { activityDate: this.dateKey(), match, lines: startupDiscoveryLines(match, this.state.externalTopicHistory.length), trigger, eventId, revision };
  }

  /** Commit only after the room's zoom UI is mounted. Preparing/fetching alone never marks it shown. */
  markStartupExternalTalkShown(plan: NonNullable<ReturnType<SuuhimochiConversation['prepareStartupExternalTalk']>>) {
    const current = this.prepareStartupExternalTalk(plan.trigger, plan.revision);
    if (!current || current.eventId !== plan.eventId || current.activityDate !== plan.activityDate || current.match.topic.id !== plan.match.topic.id
      || externalTopicRevision(current.match.topic) !== externalTopicRevision(plan.match.topic)) return null;
    const use = this.rememberExternalUse(current.match, current.trigger, current.lines);
    use.startupOutcome = 'SHOWN';
    use.eventId = current.eventId;
    use.topicRevision = externalTopicRevision(current.match.topic);
    this.state.startupExternalAttempts.push({ activityDate: this.dateKey(), timestamp: use.timestamp, eventId: current.eventId,
      trigger: current.trigger, outcome: 'SHOWN', useId: use.id });
    this.save();
    return use.id;
  }

  finishStartupExternalTalk(useId: string, outcome: 'SKIPPED' | 'FINISHED') {
    const use = this.state.externalTopicHistory.find((entry) => entry.id === useId && (entry.context === 'startup' || entry.context === 'update'));
    if (!use || use.startupOutcome !== 'SHOWN') return;
    use.startupOutcome = outcome;
    const attempt = this.state.startupExternalAttempts.find((entry) => entry.useId === useId);
    if (attempt) attempt.outcome = outcome;
    this.save();
  }

  private rememberExternalUse(match: ExternalMatch, context: ExternalTopicUse['context'], lines: string[]): ExternalTopicUse {
    const use: ExternalTopicUse = { ...match,
      id: `external_${this.now().getTime()}_${this.state.externalTopicHistory.length + 1}`,
      day: this.getCurrentDay(), date: this.dateKey(), timestamp: this.now().toISOString(), context, lines, status: 'UNCONFIRMED' };
    this.state.externalTopicHistory.push(use);
    if (match.kind !== 'general') {
      const relationId = this.rememberMeaningRelation(match.wordId, 'RELATED_TO', `external:${match.topic.id}`, 'CONTEXT_INFERRED', match.evidenceKey);
      this.state.memoryEpisodes.push({ id: `episode_${use.id}`, day: use.day, conversationId: use.id,
        topicWordIds: [...new Set([match.rootWordId, match.wordId])], learnedRelationIds: [relationId], createdOpenQuestionIds: [], timestamp: use.timestamp });
    }
    for (const line of context === 'startup' || context === 'update' ? lines : []) this.state.conversations.push({ timestamp: use.timestamp, speaker: 'SUUHIMOCHI', text: line,
      sessionId: use.id, topic: match.word || match.topic.title, questionType: context === 'startup' ? 'STARTUP_EXTERNAL' : 'UPDATE_EXTERNAL' });
    return use;
  }

  /** Called only by a conversation boundary or the combo's explicit close action. No session is added. */
  openExternalDiscovery(context: 'combo' | 'normal' = 'normal', parentWordId?: string, preface: string[] = []): ConversationResponse | null {
    if (this.state.ended || this.getCurrentDay() >= 30 || this.developmentPersonCombo) return null;
    const shared = this.prepareSharedKnowledgeTalk();
    if (shared && this.markSharedKnowledgeTalkShown(shared)) {
      this.session.attributes.sharedDialogueUseId = shared.item.id;
      this.session.attributes.sharedSourceUrl = shared.item.sourceUrl;
      this.session.attributes.sharedAttribution = shared.item.attribution;
      delete this.session.attributes.startComboWordId;
      const response = this.finishConversation([...preface, shared.item.dialogue], [...preface, ...shared.lines].map((text) => ({ lines: [text] })));
      response.debug.selectedTemplate = 'SHARED_KNOWLEDGE';
      return response;
    }
    delete this.session.attributes.sharedDialogueUseId;
    delete this.session.attributes.sharedSourceUrl;
    delete this.session.attributes.sharedAttribution;
    const snapshot = readExternalSnapshot(this.externalSnapshot, this.now());
    const match = selectExternalMatch({
      topics: snapshot?.topics ?? [], words: this.getWordEntries(), relations: this.state.memoryRelations,
      readings: this.state.wordReadings, history: this.state.externalTopicHistory,
      now: this.now(), day: this.getCurrentDay(), parentWordId,
    });
    if (!match) {
      if (context !== 'combo' || this.getCurrentDay() !== 1 || this.state.earlyWorldFallbackShown
        || this.state.externalTopicHistory.length || parentWordId !== this.state.earlyInterestWordId) return null;
      this.state.earlyWorldFallbackShown = true;
      this.save();
      this.session = this.blankSession();
      this.session.startType = 'CHAT';
      return this.finishConversation([
        'ひとつ教わった言葉から、ほかの言葉へ道ができたの。',
        '外でつながる話は、まだ見つかっていないけど。',
        '今度見つけた時は、人間さんに教わった道から、一緒に見に行きたいの。',
      ]);
    }
    const lines = externalDiscoveryLines(match, this.state.externalTopicHistory.length);
    const use = this.rememberExternalUse(match, context, lines);
    // A follow-on uses the current conversation ID only for its existing completion award.
    this.session.attributes['externalUseId'] = use.id;
    this.session.attributes['externalSource'] = match.topic.source;
    this.session.attributes['externalSourceUrl'] = match.topic.url;
    this.session.attributes['externalUpdatedAt'] = match.topic.updatedAt;
    delete this.session.attributes['startComboWordId'];
    this.session.startType = 'CHAT';
    this.session.phase = 'CHAT';
    this.session.topic = match.word;
    this.session.expected = 'EXTERNAL_TOPIC_FEEDBACK';
    this.session.choices = this.choicesForExpected('EXTERNAL_TOPIC_FEEDBACK');
    this.save();
    return this.respond([...preface, ...lines], 'followup', 'choice', 'EXTERNAL_DISCOVERY');
  }

  private handleExternalFeedback(text: string, correction = false): ConversationResponse {
    const use = this.state.externalTopicHistory.find((use) => use.id === this.session.attributes['externalUseId']);
    if (!use) return this.finishConversation();
    use.answer = text;
    use.status = correction || text === 'EXTERNAL_UNRELATED' ? 'REJECTED'
      : text === 'EXTERNAL_RELATED' ? 'CONFIRMED' : text === 'EXTERNAL_UNSURE' ? 'UNSURE' : 'UNCONFIRMED';
    this.rememberMeaningRelation(use.wordId, 'RELATED_TO', `external:${use.topic.id}`,
      use.status === 'REJECTED' ? 'USER_CORRECTION' : use.status === 'CONFIRMED' ? 'USER_EXPLICIT' : 'CONTEXT_INFERRED',
      use.evidenceKey, use.status === 'REJECTED' ? 'REJECTED' : 'ACTIVE');
    // Preserve the literal human reply separately from the assessment code.
    use.answer = correction ? text : this.session.lastUserText;
    this.save();
    return this.finishConversation(use.status === 'REJECTED' ? [
      'そっか。ぼくのつなぎ方が違ったんだね。',
      'その道は、同じ理由でまたつながないように覚えておくの。',
    ] : use.status === 'CONFIRMED' ? [
      'つながるところがあるんだね。教えてくれてありがとうなの。',
      '外で見つけた話も、人間さんと確かめると、少し近くなるね。',
    ] : use.status === 'UNSURE' ? [
      'まだ分からない、で覚えておくの。', '急いで同じことにしなくても、道の途中に置いておけるね。',
    ] : ['うん。今日見つけた入口を、ここに残しておくの。']);
  }

  getOpenQuestions() {
    return this.state.openQuestions.map((question) => ({ ...question }));
  }

  getMemoryEpisodes() {
    return this.state.memoryEpisodes.map((episode) => ({
      ...episode,
      topicWordIds: [...episode.topicWordIds],
      learnedRelationIds: [...episode.learnedRelationIds],
      createdOpenQuestionIds: [...episode.createdOpenQuestionIds],
    }));
  }

  getPersonDerivedConversationUses() {
    return Object.fromEntries(Object.entries(this.state.personDerivedConversationUses)
      .map(([wordId, ids]) => [wordId, [...ids]]));
  }

  getPersonWordDeepDive(wordId: string): PersonWordDeepDive | undefined {
    const record = this.state.personWordDeepDives[wordId];
    if (!record) return undefined;
    return clonePersonWordDeepDive(record);
  }

  getPersonWordDeepDives() {
    return Object.fromEntries(Object.entries(this.state.personWordDeepDives)
      .map(([wordId, record]) => [wordId, clonePersonWordDeepDive(record)]));
  }

  setPersonWordDeepDive(
    wordId: string,
    slot: PersonWordDeepDiveSlot,
    answer: string,
  ) {
    const word = Object.values(this.state.words).find((entry) => entry.id === wordId);
    const value = cleanText(answer);
    if (
      !word
      || !word.subcategory
      || !PERSON_DEEP_DIVE_KEYS[word.subcategory]
      || !value
    ) return false;

    const key = PERSON_DEEP_DIVE_KEYS[word.subcategory][slot];
    if (!key) return false;
    const current = this.state.personWordDeepDives[wordId] ?? {};
    this.state.personWordDeepDives[wordId] = {
      ...current,
      [slot]: { key, value },
    };
    this.save();
    return true;
  }

  getPersonWordComboCandidates() {
    return Object.values(this.state.words)
      .filter((word) => (
        Boolean(word.subcategory && WORD_COMBO_SUPPORTED_SUBCATEGORIES.has(word.subcategory))
        && this.hasRemainingPersonComboQuestion(word)
      ))
      .map((word) => ({ ...word }));
  }

  getPersonComboParentProgress() {
    return Object.fromEntries(Object.entries(this.state.personComboParentProgress)
      .map(([wordId, progress]) => [wordId, { ...progress }]));
  }

  /** 直近のコンボ親ワード。出題IDそのものを残すため、派生語も独立して巡回できる。 */
  getComboParentRecentHistory() {
    return [...this.state.comboParentRecentHistory];
  }

  private hasRemainingPersonComboQuestion(word: WordEntry) {
    if (
      !word.subcategory
      || !WORD_COMBO_SUPPORTED_SUBCATEGORIES.has(word.subcategory)
    ) return false;
    const used = this.state.personDerivedConversationUses[word.id] ?? [];
    const deepDive = this.state.personWordDeepDives[word.id] ?? {};
    return personDeepDiveConversationsFor(word.subcategory)
      .some((question) => !used.includes(question.id) && !deepDive[question.slot])
      || personDerivedConversationsFor(word.subcategory)
        .some((question) => !used.includes(question.id));
  }

  private personComboWordDepth(word: WordEntry) {
    let depth = 0;
    let current: WordEntry | undefined = word;
    const visited = new Set<string>();
    while (current?.firstDerivedFromWordId && !visited.has(current.id)) {
      visited.add(current.id);
      depth += 1;
      current = Object.values(this.state.words)
        .find((candidate) => candidate.id === current?.firstDerivedFromWordId);
    }
    return depth;
  }

  selectPersonWordComboParent(preferredWordId?: string) {
    const candidates = this.getPersonWordComboCandidates();
    if (!candidates.length) return null;
    const recentHistory = this.state.comboParentRecentHistory;
    const cooledCandidates = candidates.filter((word) => !recentHistory.includes(word.id));
    const lastSelectedId = recentHistory.at(-1);
    // 原則は直近5回を除外。候補が尽きた時だけ制限を緩め、直前の語を最後まで避ける。
    const selectionPool = cooledCandidates.length > 0
      ? cooledCandidates
      : candidates.filter((word) => word.id !== lastSelectedId);
    const pool = selectionPool.length > 0 ? selectionPool : candidates;
    const selected = (preferredWordId ? pool.find((word) => word.id === preferredWordId) : null) ?? [...pool].sort((left, right) => {
      const leftDepth = this.personComboWordDepth(left);
      const rightDepth = this.personComboWordDepth(right);
      if (leftDepth !== rightDepth) return leftDepth - rightDepth;
      const leftProgress = this.state.personComboParentProgress[left.id];
      const rightProgress = this.state.personComboParentProgress[right.id];
      const selectionDifference = (leftProgress?.selectedAsParentCount ?? 0)
        - (rightProgress?.selectedAsParentCount ?? 0);
      if (selectionDifference !== 0) return selectionDifference;
      const lastDayDifference = (leftProgress?.lastQuestionDay ?? 0)
        - (rightProgress?.lastQuestionDay ?? 0);
      if (lastDayDifference !== 0) return lastDayDifference;
      return left.learnedOrder - right.learnedOrder;
    })[0];
    if (!selected) return null;
    const progress = this.state.personComboParentProgress[selected.id] ?? {
      questionPromptCount: 0,
      selectedAsParentCount: 0,
    };
    this.state.personComboParentProgress[selected.id] = {
      ...progress,
      selectedAsParentCount: progress.selectedAsParentCount + 1,
    };
    this.state.comboParentRecentHistory = [
      ...recentHistory,
      selected.id,
    ].slice(-COMBO_PARENT_RECENT_HISTORY_LIMIT);
    this.save();
    return { ...selected };
  }

  /**
   * 開発者モード専用の開始口。実データに候補がなければ、保存しない
   * 仮の「知り合い」ワードを一時的に使う。
   */
  startDevelopmentPersonCombo() {
    const existing = this.selectPersonWordComboParent();
    if (existing) return existing;

    const id = `development_person_combo_${this.now().getTime()}`;
    const parent: WordEntry = {
      id,
      surface: 'コンボの練習相手',
      category: 'PERSON',
      subcategory: 'PERSON_2',
      firstSeenDay: this.getCurrentDay(),
      learnedOrder: 0,
      rootWordId: id,
      mentionCount: 0,
    };
    this.developmentPersonCombo = {
      parent,
      usedQuestionIds: [],
      questionHistory: [],
      deepDive: {},
    };
    return { ...parent };
  }

  getNextPersonComboQuestion(parentWordId: string): PersonComboQuestion | null {
    const development = this.getDevelopmentPersonCombo(parentWordId);
    const parent = Object.values(this.state.words).find((word) => word.id === parentWordId)
      ?? development?.parent;
    if (
      !parent
      || !parent.subcategory
      || !WORD_COMBO_SUPPORTED_SUBCATEGORIES.has(parent.subcategory)
    ) return null;

    const used = development?.usedQuestionIds
      ?? this.state.personDerivedConversationUses[parent.id]
      ?? [];
    const deepDive = development?.deepDive
      ?? this.state.personWordDeepDives[parent.id]
      ?? {};
    const deepQuestions = personDeepDiveConversationsFor(parent.subcategory)
      .filter((question) => !used.includes(question.id) && !deepDive[question.slot]);
    const derivedQuestions = personDerivedConversationsFor(parent.subcategory)
      .filter((question) => !used.includes(question.id));
    if (!deepQuestions.length && !derivedQuestions.length) return null;

    const allDeepQuestions = personDeepDiveConversationsFor(parent.subcategory);
    const answeredDeepQuestionCount = allDeepQuestions.filter((question) => (
      used.includes(question.id) || Boolean(deepDive[question.slot])
    )).length;
    // 5枠の歴史人物は、他の親ワードでの質問順に影響されず、各人物ごとに
    // 初回「派生4 + 掘り下げ2」の配分を保つ。
    const history = allDeepQuestions.length > 2
      ? used.map((questionId) => (
        allDeepQuestions.some((question) => question.id === questionId)
          ? 'deepDive' as const
          : 'derived' as const
      )).slice(-2)
      : (development?.questionHistory ?? this.state.personDerivedQuestionHistory);
    const last = history.at(-1);
    const lastTwoWereDerived = history.length >= 2
      && history.at(-1) === 'derived'
      && history.at(-2) === 'derived';
    // 歴史人物は初回の2問の後、次回以降で残り3つの人物像を優先して聞く。
    const prioritizeRemainingHistoricalDeepDives = allDeepQuestions.length > 2
      && answeredDeepQuestionCount >= 2
      && answeredDeepQuestionCount < allDeepQuestions.length;
    let kind: 'deepDive' | 'derived';
    if (!deepQuestions.length) {
      kind = 'derived';
    } else if (!derivedQuestions.length) {
      kind = 'deepDive';
    } else if (last === 'deepDive') {
      kind = 'derived';
    } else if (prioritizeRemainingHistoricalDeepDives) {
      kind = 'deepDive';
    } else if (lastTwoWereDerived) {
      kind = 'deepDive';
    } else {
      kind = this.random() < (2 / 3) ? 'derived' : 'deepDive';
    }

    let question: PersonDerivedConversation | PersonDeepDiveConversation | undefined;
    if (kind === 'deepDive') {
      let candidates = deepQuestions;
      const lastQuestionId = used.at(-1);
      if (parent.subcategory === 'AV_MEDIA_3') {
        if (lastQuestionId === 'DRAMA_V2_02' || lastQuestionId === 'DRAMA_V2_15') {
          const spacedCandidates = candidates.filter((candidate) => candidate.id !== 'DRAMA_DEEP_04');
          if (spacedCandidates.length) candidates = spacedCandidates;
        }
      }
      if (parent.subcategory === 'AV_MEDIA_6' && lastQuestionId === 'PROGRAM_V2_02') {
        const spacedCandidates = candidates.filter((candidate) => candidate.id !== 'PROGRAM_DEEP_04');
        if (spacedCandidates.length) candidates = spacedCandidates;
      }
      question = candidates[Math.min(
        candidates.length - 1,
        Math.floor(this.random() * candidates.length),
      )];
    } else {
      let candidates = derivedQuestions;
      if (parent.subcategory === 'AV_MEDIA_3' && used.at(-1) === 'DRAMA_DEEP_04') {
        const spacedCandidates = candidates.filter((candidate) => (
          candidate.id !== 'DRAMA_V2_02' && candidate.id !== 'DRAMA_V2_15'
        ));
        if (spacedCandidates.length) candidates = spacedCandidates;
      }
      if (parent.subcategory === 'AV_MEDIA_6' && used.at(-1) === 'PROGRAM_DEEP_04') {
        const spacedCandidates = candidates.filter((candidate) => candidate.id !== 'PROGRAM_V2_02');
        if (spacedCandidates.length) candidates = spacedCandidates;
      }
      if (candidates.length > 1) {
        if (parent.subcategory === 'GAME_MEDIA_6') {
          const priorityIds = gameMediaTermQuestionPriorities(parent.surface);
          const preferredCandidates = candidates
            .filter((candidate) => priorityIds.includes(candidate.id))
            .sort((left, right) => priorityIds.indexOf(left.id) - priorityIds.indexOf(right.id));
          if (preferredCandidates.length) candidates = preferredCandidates;
        }
        const lastDerivedQuestion = [...used].reverse()
          .map((questionId) => personDerivedConversationsFor(parent.subcategory ?? '')
            .find((candidate) => candidate.id === questionId))
          .find((candidate): candidate is PersonDerivedConversation => Boolean(candidate));
        const lastCategory = lastDerivedQuestion?.classification.mode === 'fixed'
          || lastDerivedQuestion?.classification.mode === 'subcategory'
          ? lastDerivedQuestion.classification.category
          : null;
        if (lastCategory) {
          const recentPeriodMemoryIds = new Set([
            'MANGA_V2_10', 'MANGA_V2_11', 'MANGA_V2_12',
            'ANIME_V2_13', 'ANIME_V2_14', 'ANIME_V2_15',
            'NOVEL_V2_02', 'NOVEL_V2_19',
            'TERM_V2_11', 'TERM_V2_12',
            'MUSIC_V2_02', 'MUSIC_V2_09', 'MUSIC_V2_10',
            'MOVIE_V2_02',
            'DRAMA_V2_02', 'DRAMA_V2_15',
            'VIDEO_V2_02',
            'PROGRAM_V2_02',
          ]);
          if (lastDerivedQuestion && recentPeriodMemoryIds.has(lastDerivedQuestion.id)) {
            const spacedCandidates = candidates.filter((candidate) => !recentPeriodMemoryIds.has(candidate.id));
            if (spacedCandidates.length) candidates = spacedCandidates;
          }
          const diverseCandidates = candidates.filter((candidate) => (
            candidate.classification.mode === 'full'
            || candidate.classification.category !== lastCategory
          ));
          if (diverseCandidates.length) candidates = diverseCandidates;
        }
      }
      question = candidates[Math.min(
        candidates.length - 1,
        Math.floor(this.random() * candidates.length),
      )];
    }
    if (!question) return null;
    const deepDiveOpening = kind === 'deepDive' && 'statusOpenings' in question
      ? question.statusOpenings?.[this.state.petStatuses[parent.id] ?? 'UNKNOWN']
      : undefined;
    return {
      id: question.id,
      kind,
      parentWordId: parent.id,
      parentSurface: parent.surface,
      subcategory: parent.subcategory,
      lines: (deepDiveOpening ?? question.opening).flatMap((beat) => beat.text
        ? [beat.text.replaceAll('{word}', parent.surface)]
        : []),
      maxLength: kind === 'deepDive' ? MAX_DEEP_DIVE_LENGTH : MAX_WORD_LENGTH,
    };
  }

  markPersonComboQuestionPresented(parentWordId: string, questionId: string) {
    if (this.getDevelopmentPersonCombo(parentWordId)) return;
    const parent = Object.values(this.state.words).find((word) => word.id === parentWordId);
    if (!parent?.subcategory) return;
    const isKnownQuestion = personDeepDiveConversationsFor(parent.subcategory)
      .some((question) => question.id === questionId)
      || personDerivedConversationsFor(parent.subcategory)
        .some((question) => question.id === questionId);
    if (!isKnownQuestion) return;
    const progress = this.state.personComboParentProgress[parentWordId] ?? {
      questionPromptCount: 0,
      selectedAsParentCount: 0,
    };
    this.state.personComboParentProgress[parentWordId] = {
      ...progress,
      questionPromptCount: progress.questionPromptCount + 1,
      lastQuestionDay: this.getCurrentDay(),
    };
    this.save();
  }

  skipPersonComboQuestion(parentWordId: string, questionId: string) {
    const development = this.getDevelopmentPersonCombo(parentWordId);
    const parent = Object.values(this.state.words).find((word) => word.id === parentWordId)
      ?? development?.parent;
    if (!parent?.subcategory) return false;
    const used = development?.usedQuestionIds
      ?? this.state.personDerivedConversationUses[parentWordId]
      ?? [];
    if (used.includes(questionId)) return false;
    const deepQuestion = personDeepDiveConversationsFor(parent.subcategory)
      .find((question) => question.id === questionId);
    const derivedQuestion = personDerivedConversationsFor(parent.subcategory)
      .find((question) => question.id === questionId);
    if (!deepQuestion && !derivedQuestion) return false;
    this.markPersonComboQuestionUsed(
      parentWordId,
      questionId,
      deepQuestion ? 'deepDive' : 'derived',
    );
    return true;
  }

  submitPersonComboAnswer(
    parentWordId: string,
    questionId: string,
    rawAnswer: string,
  ): PersonComboAnswerResult | null {
    const development = this.getDevelopmentPersonCombo(parentWordId);
    const parent = Object.values(this.state.words).find((word) => word.id === parentWordId)
      ?? development?.parent;
    if (!parent || !parent.subcategory || !WORD_COMBO_SUPPORTED_SUBCATEGORIES.has(parent.subcategory)) return null;
    const answer = rawAnswer.trim();
    if (!answer) return null;

    const used = development?.usedQuestionIds
      ?? this.state.personDerivedConversationUses[parent.id]
      ?? [];
    if (used.includes(questionId)) return null;
    const deepQuestion = personDeepDiveConversationsFor(parent.subcategory)
      .find((question) => question.id === questionId);
    const derivedQuestion = personDerivedConversationsFor(parent.subcategory)
      .find((question) => question.id === questionId);
    if (!deepQuestion && !derivedQuestion) return null;

    if (deepQuestion) {
      if (answer.length > MAX_DEEP_DIVE_LENGTH) return null;
      if (development) {
        const key = PERSON_DEEP_DIVE_KEYS[parent.subcategory][deepQuestion.slot];
        if (!key) return null;
        development.deepDive = {
          ...development.deepDive,
          [deepQuestion.slot]: {
            key,
            value: answer,
          },
        };
        this.markPersonComboQuestionUsed(parent.id, deepQuestion.id, 'deepDive');
        return {
          ok: true,
          questionId: deepQuestion.id,
          kind: 'deepDive',
          preview: true,
        };
      }
      if (!this.setPersonWordDeepDive(parent.id, deepQuestion.slot, answer)) return null;
      this.state.memoryEpisodes.push({
        id: `episode_combo_${this.now().getTime()}_${this.state.memoryEpisodes.length + 1}`,
        day: this.getCurrentDay(),
        conversationId: deepQuestion.id,
        topicWordIds: [parent.id],
        learnedRelationIds: [],
        createdOpenQuestionIds: [],
        timestamp: this.now().toISOString(),
      });
      this.markPersonComboQuestionUsed(parent.id, deepQuestion.id, 'deepDive');
      return { ok: true, questionId: deepQuestion.id, kind: 'deepDive' };
    }

    if (!derivedQuestion || answer.length > MAX_WORD_LENGTH) return null;
    if (development) {
      this.markPersonComboQuestionUsed(parent.id, derivedQuestion.id, 'derived');
      return {
        ok: true,
        questionId: derivedQuestion.id,
        kind: 'derived',
        preview: true,
      };
    }
    const existing = this.findWordBySurface(answer)
      ?? Object.values(this.state.words).find((candidate) => (
        cleanText(this.state.wordReadings[candidate.id] ?? '').toLowerCase() === cleanText(answer).toLowerCase()
      ));
    const classification = derivedQuestion.classification;
    const questionCategory = classification.mode === 'fixed' || classification.mode === 'subcategory'
      ? classification.category
      : 'UNKNOWN';
    const word = existing ?? this.ensureWord(answer, questionCategory, parent.id);
    if (!existing && classification.mode === 'fixed') {
      word.category = classification.category;
      word.subcategory = classification.subcategory;
    } else if (!existing && classification.mode === 'subcategory') {
      word.category = classification.category;
    }
    word.lastUsedDay = this.getCurrentDay();
    if (!existing) {
      this.state.wordReadings[word.id] = answer;
      if (!this.state.personComboWordIds.includes(word.id)) {
        this.state.personComboWordIds.push(word.id);
      }
    }
    const relationId = this.rememberMeaningRelation(
      parent.id,
      derivedQuestion.relationType ?? 'RELATED_TO',
      word.id,
      'USER_EXPLICIT',
      derivedQuestion.relationQualifier
        ? `${derivedQuestion.id}:${derivedQuestion.relationQualifier}`
        : derivedQuestion.id,
    );
    this.state.memoryEpisodes.push({
      id: `episode_combo_${this.now().getTime()}_${this.state.memoryEpisodes.length + 1}`,
      day: this.getCurrentDay(),
      conversationId: derivedQuestion.id,
      topicWordIds: [parent.id, word.id],
      learnedRelationIds: [relationId],
      createdOpenQuestionIds: [],
      timestamp: this.now().toISOString(),
    });
    this.markPersonComboQuestionUsed(parent.id, derivedQuestion.id, 'derived');
    return {
      ok: true,
      questionId: derivedQuestion.id,
      kind: 'derived',
      wordId: word.id,
      ...(!existing ? { createdWordId: word.id } : {}),
    };
  }

  private markPersonComboQuestionUsed(
    parentWordId: string,
    questionId: string,
    kind: 'deepDive' | 'derived',
  ) {
    const development = this.getDevelopmentPersonCombo(parentWordId);
    if (development) {
      if (!development.usedQuestionIds.includes(questionId)) {
        development.usedQuestionIds.push(questionId);
      }
      development.questionHistory = [...development.questionHistory, kind].slice(-2);
      return;
    }
    const used = this.state.personDerivedConversationUses[parentWordId] ?? [];
    if (!used.includes(questionId)) {
      this.state.personDerivedConversationUses[parentWordId] = [...used, questionId];
    }
    this.state.personDerivedQuestionHistory = [...this.state.personDerivedQuestionHistory, kind].slice(-2);
    this.save();
  }

  private getDevelopmentPersonCombo(parentWordId: string) {
    return this.developmentPersonCombo?.parent.id === parentWordId
      ? this.developmentPersonCombo
      : null;
  }

  setGoal(goalText: string): ConversationResponse {
    return this.handleGoalText(goalText);
  }

  setGoalUndecided(): ConversationResponse {
    this.session.lastUserText = UNDECIDED_GOAL;
    this.log('USER', UNDECIDED_GOAL);
    this.state.goalText = UNDECIDED_GOAL;
    this.state.goalSetAt = this.dateKey();
    this.session.topic = '30日の目標';
    this.session.attributes['goal'] = UNDECIDED_GOAL;
    this.save();
    return this.finishConversation([
      'まだ決まっていないんだね。',
      '歩きながら、見たい景色を少しずつ探していこうね。',
    ]);
  }

  hasPendingDayConversation(category?: 'SELF' | 'CURIOUS') {
    return !this.state.ended && Boolean(this.state.goalText)
      && hasUnseenDayConversation(this.getCurrentDay(), this.state.seenConversationIds, category);
  }

  startDayConversation(preferredCategory?: 'SELF' | 'CURIOUS'): ConversationResponse | null {
    return this.hasPendingDayConversation(preferredCategory)
      ? this.startSession({ skipGoalCheck: true, preferredDayCategory: preferredCategory })
      : null;
  }

  startSession(options: { skipGoalCheck?: boolean; preferredDayCategory?: 'SELF' | 'CURIOUS' } = {}): ConversationResponse {
    this.rememberSession();
    this.clearActiveDayConversation();

    if (this.state.ended) {
      this.session = this.blankSession();
      this.session.stage = 'ended';
      return this.respond(['手紙を置いて、すうひもちは帰っていった。'], 'ended', 'none', 'ENDED');
    }

    const currentDay = this.getCurrentDay();
    if (currentDay >= 30 && !hasUnseenDayConversation(currentDay, this.state.seenConversationIds)) {
      return this.openFarewellSession();
    }

    this.session = this.blankSession();

    if (!this.state.goalText) {
      return this.openGoalSetup();
    }

    this.state.conversationCount += 1;
    this.save();

    if (!options.skipGoalCheck && this.getCurrentDay() < 30 && this.shouldCheckGoal()) {
      return this.openGoalCheck();
    }

    return this.openNormalConversation(options.preferredDayCategory);
  }

  startWordTeaching(): ConversationResponse {
    // 初回目標と30日目の進行は通常会話と同じルールを優先する。
    if (!this.state.goalText || this.state.ended || this.getCurrentDay() >= 30) {
      return this.startSession();
    }

    this.rememberSession();
    this.clearActiveDayConversation();
    this.session = this.blankSession();
    this.state.conversationCount += 1;
    this.save();
    return this.openNewWord();
  }

  submit(text: string): ConversationResponse {
    const surface = text.trim();
    const value = cleanText(text);
    if (!value) return this.respond(['何も書いてないの。'], this.session.stage, this.session.inputMode, 'EMPTY');

    if (this.session.inputMode === 'choice') {
      const choice = this.session.choices.find((item) => item.id === value || item.label === value);
      if (choice) return this.applyChoice(choice, true);
      return this.respond(['下の中から選んでほしいの。'], this.session.stage, 'choice', 'CHOICE_ONLY');
    }

    if (this.session.inputMode === 'category') {
      if (this.session.expected === 'SUBCATEGORY') {
        const selectedSubCategory = (SUBCATEGORY_CHOICES[this.session.category] ?? [])
          .find((item) => item.id === value || item.label === value);
        if (selectedSubCategory) {
          this.log('USER', selectedSubCategory.label);
          return this.applySubCategory(selectedSubCategory);
        }
        return this.respond(['もう少しくわしく、下から選んでほしいの。'], 'unknown', 'category', 'SUBCATEGORY_ONLY');
      }
      const selected = CATEGORY_CHOICES.find((item) => item.category === value || item.label === value);
      if (selected) {
        this.log('USER', selected.label);
        return this.applyCategory(selected.category);
      }
      return this.respond(['どの種類か、下から選んでほしいの。'], 'unknown', 'category', 'CATEGORY_ONLY');
    }

    // New words keep the player's spelling; the common-knowledge lookup does
    // its own NFKC / kana-normalised comparison without changing that surface.
    const userText = this.session.expected === 'NEW_WORD'
      || this.session.expected === 'DAY_CURIOUS_WORD'
      || this.session.expected === 'PERSON_DERIVED_WORD'
      || this.session.expected === 'PERSON_DEEP_DIVE_TEXT'
      || this.session.expected === 'EXTERNAL_TOPIC_CORRECTION'
      ? surface
      : value;
    this.session.lastUserText = userText;
    this.log('USER', userText);

    if (this.session.expected === 'GOAL_TEXT') return this.handleGoalText(value, false);
    if (this.session.expected === 'NEW_WORD') return this.handleNewWord(surface, false);
    if (this.session.expected === 'DAY_CURIOUS_WORD') return this.handleCuriousWord(surface);
    if (this.session.expected === 'PERSON_DERIVED_WORD') return this.handlePersonDerivedWord(surface);
    if (this.session.expected === 'PERSON_DEEP_DIVE_TEXT') return this.handlePersonDeepDiveText(surface);
    if (this.session.expected === 'EXTERNAL_TOPIC_CORRECTION') return this.handleExternalFeedback(text, true);
    return this.respond(['今は下の選択肢から選んでほしいの。'], this.session.stage, this.session.inputMode, 'UNEXPECTED_TEXT');
  }

  choose(choiceId: string): ConversationResponse {
    const normalized = cleanText(choiceId);

    // まず画面に現在出している選択肢から探す。
    let choice = this.session.choices.find((item) => item.id === normalized || item.label === normalized);

    // 旧バージョンで保存された会話やテストからの入力は、
    // 現在は表示しない旧「気になる」を内部だけ受け付ける。
    if (!choice && normalized === 'WORD_INTERESTED') {
      choice = { id: 'WORD_INTERESTED', label: '気になる' };
    }

    // UIのstate更新と会話sessionが一瞬ずれた場合でも、
    // expected が分かっていれば正しい選択肢セットから復元する。
    if (!choice) {
      const expectedChoices = this.choicesForExpected(this.session.expected);
      choice = expectedChoices.find((item) => item.id === normalized || item.label === normalized);
      if (choice) {
        this.session.inputMode = 'choice';
        this.session.choices = [...expectedChoices];
      }
    }

    if (!choice) {
      // 会話を途切れさせず、現在の選択肢をそのまま再提示する。
      const currentChoices = this.choicesForExpected(this.session.expected);
      if (currentChoices.length) {
        this.session.inputMode = 'choice';
        this.session.choices = [...currentChoices];
        return this.respond(
          ['うまく受け取れなかったの。もう一回、下から選んでほしいの。'],
          this.session.stage,
          'choice',
          'CHOICE_RETRY',
        );
      }
      return this.finishConversation(['うん。いったんここまでにしておくの。']);
    }

    return this.applyChoice(choice, true);
  }

  private choicesForExpected(expected: ExpectedAnswer): ConversationChoice[] {
    switch (expected) {
      case 'EARLY_COMBO_INVITE':
        return [{ id: 'EARLY_COMBO_START', label: 'ことばをつないでみる' }, { id: 'EARLY_COMBO_LATER', label: 'いまはここまで' }];
      case 'EXTERNAL_TOPIC_FEEDBACK':
        return [
          { id: 'EXTERNAL_RELATED', label: 'つながりはあると思う' },
          { id: 'EXTERNAL_UNRELATED', label: 'そのつながりは違う' },
          { id: 'EXTERNAL_UNSURE', label: 'まだ分からない' },
          { id: 'EXTERNAL_CORRECT', label: '違うところを言葉で教える' },
          { id: 'EXTERNAL_CLOSE', label: '今日はここまで' },
        ];
      case 'DAY_CONVERSATION_CHOICE':
        return this.activeDayConversation?.category === 'SELF'
          ? this.activeDayConversation.choices.map(({ id, label }) => ({ id, label }))
          : [];
      case 'DAY_CURIOUS_KNOWN_CHOICE':
        return this.activeDayConversation?.category === 'CURIOUS'
          ? this.curiousBranch(this.activeDayConversation, 'known').choices.map(({ id, label }) => ({ id, label }))
          : [];
      case 'DAY_CURIOUS_UNKNOWN_CHOICE':
        return this.activeDayConversation?.category === 'CURIOUS'
          ? this.curiousBranch(this.activeDayConversation, 'unknown').choices.map(({ id, label }) => ({ id, label }))
          : [];
      case 'WORD_FEELING':
        return WORD_FEELING_CHOICES;
      case 'GOAL_STATUS':
        return GOAL_STATUS_CHOICES;
      case 'GOAL_ACTION':
        return GOAL_ACTION_CHOICES;
      default:
        return [];
    }
  }

  chooseCategory(category: WordCategory): ConversationResponse {
    // Accept the previous MEDIA value from an older local session, even though
    // the picker now exposes the expanded category set.
    const selected = CATEGORY_CHOICES.find((item) => item.category === category)
      ?? (category === 'MEDIA' ? { category: 'MEDIA' as WordCategory, label: '本・映画・ゲームなど' } : undefined);
    if (!selected) return this.respond(['その種類は、いまは選べないの。'], 'unknown', 'category', 'INVALID_CATEGORY');
    this.log('USER', selected.label);
    return this.applyCategory(category);
  }

  chooseSubCategory(id: string): ConversationResponse {
    const selected = (SUBCATEGORY_CHOICES[this.session.category] ?? [])
      .find((item) => item.id === id || item.label === id);
    if (!selected) return this.respond(['もう少しくわしく、下から選んでほしいの。'], 'unknown', 'category', 'INVALID_SUBCATEGORY');
    this.log('USER', selected.label);
    return this.applySubCategory(selected);
  }

  skipUnknown() {
    return this.finishConversation(['分からないままでも大丈夫なの。']);
  }

  completeDayConversation() {
    if (!this.state.pendingDayConversationId) return;
    this.state.pendingDayConversationId = null;
    this.save();
  }

  finishEarly() {
    // A stopped DAY conversation has not been completed; keep it eligible again.
    const id = this.activeDayConversation?.id ?? this.session.attributes['dayConversationId'];
    if (id) {
      this.state.seenConversationIds = this.state.seenConversationIds.filter((seen) => seen !== id);
      this.state.pendingDayConversationId = null;
      delete this.session.attributes['dayConversationId'];
      this.clearActiveDayConversation();
      this.save();
    }
    return this.finishConversation(['うん、また今度お話しするの。']);
  }

  continueFarewell(): ConversationResponse {
    const next = this.farewellQueue.shift();
    if (next) return this.respond([next], 'farewell', 'none', 'FAREWELL');

    this.state.ended = true;
    this.save();
    this.session.stage = 'ended';
    return this.respond(['30日間、ありがとうなの。またね、人間さん。'], 'ended', 'none', 'FAREWELL_END');
  }

  advanceDay() {
    this.state.dayOverride = Math.min(30, this.getCurrentDay() + 1);
    this.save();
    return this.startSession();
  }

  jumpFarewell() {
    this.state.dayOverride = 30;
    this.save();
    this.rememberSession();
    this.clearActiveDayConversation();
    return this.openFarewellSession();
  }

  clearOverride() {
    this.state.dayOverride = null;
    this.save();
    return this.startSession();
  }

  reopenToday() {
    return this.startSession();
  }

  reset() {
    this.storage.removeItem(STORAGE_KEY);
    this.state = emptyState();
    this.session = this.blankSession();
    this.debug = this.blankDebug();
    this.farewellQueue = [];
    this.clearActiveDayConversation();
    this.ensureStartDate();
  }

  /**
   * Starts a genuinely new 30-day companion cycle. The completed child's
   * memories are archived by GameSave before this is called, so the new child
   * receives the footprint but not a copy of the former conversation state.
   */
  beginNextCycle(goalText: string) {
    const goal = cleanText(goalText).slice(0, MAX_GOAL_LENGTH);
    this.state = emptyState();
    this.session = this.blankSession();
    this.debug = this.blankDebug();
    this.farewellQueue = [];
    this.clearActiveDayConversation();
    this.state.startDate = this.dateKey();
    this.state.goalText = goal || UNDECIDED_GOAL;
    this.state.goalSetAt = this.dateKey();
    this.save();
  }

  getLearnedWords(): LearnedWord[] {
    return Object.values(this.state.words)
      .filter((entry) => !INTERNAL_TOPICS.has(entry.surface) && !SYSTEM_WORDS.has(entry.surface))
      .sort((a, b) => b.learnedOrder - a.learnedOrder)
      .map((entry) => {
        const learned: LearnedWord = {
          word: entry.surface,
          category: entry.category,
          source: 'user_explained',
          learnedDay: entry.firstSeenDay,
        };
        if (entry.description) learned.note = entry.description;
        return learned;
      });
  }

  getWordEntries() {
    return Object.values(this.state.words).map((word) => ({ ...word }));
  }

  /** Existing recorded activity date only; picture diaries must not fabricate a cycle start. */
  getLearningStartDate() { return this.state.startDate; }

  getPetStatus(wordId: string): PetStatus | null {
    return this.state.petStatuses[wordId] ?? null;
  }

  /** ペット個体の現在・過去の区分だけを更新する。単語や関連記憶は変更しない。 */
  setPetStatus(wordId: string, status: PetStatus) {
    const word = Object.values(this.state.words).find((entry) => entry.id === wordId);
    if (
      !word
      || word.category !== 'ANIMAL'
      || word.subcategory !== 'ANIMAL_PET'
    ) return false;
    this.state.petStatuses[wordId] = status;
    this.save();
    return true;
  }

  getWordReading(wordId: string) {
    return this.state.wordReadings[wordId] ?? null;
  }

  updateWordSurface(wordId: string, nextSurface: string) {
    const surface = cleanText(nextSurface);
    if (!surface || surface.length > MAX_WORD_LENGTH) {
      return { ok: false as const, reason: 'invalid' as const };
    }
    const currentKey = Object.keys(this.state.words).find((key) => this.state.words[key]?.id === wordId);
    if (!currentKey) return { ok: false as const, reason: 'missing' as const };
    const word = this.state.words[currentKey];
    const reading = this.state.wordReadings[wordId];
    const duplicate = this.findWordBySurface(surface);
    if (duplicate && duplicate.id !== wordId) {
      // コンボのかな語を、すでに辞書にある正式表記へ直した場合だけ
      // 同じIDへ統合する。通常語同士の不用意な統合は行わない。
      if (!reading || !this.state.personComboWordIds.includes(wordId)) {
        return { ok: false as const, reason: 'duplicate' as const };
      }
      const duplicateId = duplicate.id;
      if (word.category === 'UNKNOWN' && duplicate.category !== 'UNKNOWN') word.category = duplicate.category;
      word.subcategory ??= duplicate.subcategory;
      word.userSentiment ??= duplicate.userSentiment;
      word.description ??= duplicate.description;
      word.firstSeenDay = Math.min(word.firstSeenDay, duplicate.firstSeenDay);
      word.learnedOrder = Math.min(word.learnedOrder, duplicate.learnedOrder);
      word.mentionCount = Math.max(1, word.mentionCount + duplicate.mentionCount);
      for (const candidate of Object.values(this.state.words)) {
        if (candidate.firstDerivedFromWordId === duplicateId) candidate.firstDerivedFromWordId = wordId;
        if (candidate.rootWordId === duplicateId) candidate.rootWordId = wordId;
      }
      this.state.memoryRelations = this.state.memoryRelations.map((relation) => ({
        ...relation,
        subjectId: relation.subjectId === duplicateId ? wordId : relation.subjectId,
        objectId: relation.objectId === duplicateId ? wordId : relation.objectId,
      }));
      this.state.openQuestions = this.state.openQuestions.map((question) => (
        question.wordId === duplicateId ? { ...question, wordId } : question
      ));
      this.state.memoryEpisodes = this.state.memoryEpisodes.map((episode) => ({
        ...episode,
        topicWordIds: [...new Set(episode.topicWordIds.map((id) => id === duplicateId ? wordId : id))],
      }));
      this.state.externalTopicHistory = this.state.externalTopicHistory.map((use) => ({
        ...use,
        wordId: use.wordId === duplicateId ? wordId : use.wordId,
        rootWordId: use.rootWordId === duplicateId ? wordId : use.rootWordId,
        evidenceKey: use.wordId === duplicateId ? `${wordId}${use.evidenceKey.slice(duplicateId.length)}` : use.evidenceKey,
      }));
      const duplicateUses = this.state.personDerivedConversationUses[duplicateId] ?? [];
      if (duplicateUses.length) {
        this.state.personDerivedConversationUses[wordId] = [...new Set([
          ...(this.state.personDerivedConversationUses[wordId] ?? []),
          ...duplicateUses,
        ])];
      }
      const duplicateDeepDive = this.state.personWordDeepDives[duplicateId];
      if (duplicateDeepDive) {
        this.state.personWordDeepDives[wordId] = {
          ...duplicateDeepDive,
          ...this.state.personWordDeepDives[wordId],
        };
      }
      const duplicateProgress = this.state.personComboParentProgress[duplicateId];
      if (duplicateProgress) {
        const currentProgress = this.state.personComboParentProgress[wordId] ?? {
          questionPromptCount: 0,
          selectedAsParentCount: 0,
        };
        this.state.personComboParentProgress[wordId] = {
          questionPromptCount: currentProgress.questionPromptCount + duplicateProgress.questionPromptCount,
          selectedAsParentCount: currentProgress.selectedAsParentCount + duplicateProgress.selectedAsParentCount,
          ...((currentProgress.lastQuestionDay || duplicateProgress.lastQuestionDay)
            ? { lastQuestionDay: Math.max(currentProgress.lastQuestionDay ?? 0, duplicateProgress.lastQuestionDay ?? 0) }
            : {}),
        };
      }
      this.state.comboParentRecentHistory = this.state.comboParentRecentHistory
        .map((id) => id === duplicateId ? wordId : id)
        .slice(-COMBO_PARENT_RECENT_HISTORY_LIMIT);
      if (!this.state.petStatuses[wordId] && this.state.petStatuses[duplicateId]) {
        this.state.petStatuses[wordId] = this.state.petStatuses[duplicateId];
      }
      if (!this.state.petLastCheckInDays[wordId] && this.state.petLastCheckInDays[duplicateId]) {
        this.state.petLastCheckInDays[wordId] = this.state.petLastCheckInDays[duplicateId];
      }
      delete this.state.personDerivedConversationUses[duplicateId];
      delete this.state.personWordDeepDives[duplicateId];
      delete this.state.wordReadings[duplicateId];
      delete this.state.personComboParentProgress[duplicateId];
      delete this.state.petStatuses[duplicateId];
      delete this.state.petLastCheckInDays[duplicateId];
      this.state.personComboWordIds = [...new Set(this.state.personComboWordIds
        .map((id) => id === duplicateId ? wordId : id))];
      const duplicateKey = Object.keys(this.state.words).find((key) => this.state.words[key]?.id === duplicateId);
      if (duplicateKey) delete this.state.words[duplicateKey];
    }
    const changed = word.surface !== surface;
    if (changed) {
      delete this.state.words[currentKey];
      word.surface = surface;
      this.state.words[surface] = word;
      if (this.state.lastWordSurface === currentKey) this.state.lastWordSurface = surface;
      this.state.relations = this.state.relations.map((relation) => (
        cleanText(relation.object).toLowerCase() === cleanText(currentKey).toLowerCase()
          ? { ...relation, object: surface }
          : relation
      ));
      this.save();
    }
    return {
      ok: true as const,
      word: { ...word },
      reading: reading ?? null,
      formalized: Boolean(
        changed
        && reading
        && this.state.personComboWordIds.includes(wordId)
        && cleanText(surface).toLowerCase() !== cleanText(reading).toLowerCase()
      ),
    };
  }

  /**
   * Remove one user-taught word from the active word memory.
   * Conversation logs are intentionally kept as history; only future recall,
   * dictionary display, and learned-word selection stop using this entry.
   */
  forgetWord(surface: string) {
    const normalized = cleanText(surface).toLowerCase();
    const storedKey = Object.keys(this.state.words).find((key) => cleanText(key).toLowerCase() === normalized);
    if (!normalized || !storedKey) return false;
    const wordId = this.state.words[storedKey]?.id;
    delete this.state.words[storedKey];
    if (this.state.lastWordSurface === storedKey) this.state.lastWordSurface = null;
    this.state.relations = this.state.relations.filter((relation) => cleanText(relation.object).toLowerCase() !== normalized);
    if (wordId) {
      this.state.memoryRelations = this.state.memoryRelations.filter((relation) => relation.subjectId !== wordId && relation.objectId !== wordId);
      this.state.openQuestions = this.state.openQuestions.filter((question) => question.wordId !== wordId);
      delete this.state.personDerivedConversationUses[wordId];
      delete this.state.personWordDeepDives[wordId];
      delete this.state.wordReadings[wordId];
      delete this.state.personComboParentProgress[wordId];
      delete this.state.petStatuses[wordId];
      delete this.state.petLastCheckInDays[wordId];
      this.state.comboParentRecentHistory = this.state.comboParentRecentHistory
        .filter((id) => id !== wordId);
      this.state.personComboWordIds = this.state.personComboWordIds.filter((id) => id !== wordId);
    }
    this.save();
    return true;
  }

  getMemories() {
    return [...this.state.memories];
  }

  getRelations() {
    return [...this.state.relations];
  }

  getEvents() {
    return [...this.state.events];
  }

  getConversationLogs() {
    return [...this.state.conversations];
  }

  getDebugSnapshot() {
    return {
      ...this.debug,
      tokens: [...this.debug.tokens],
      attributes: { ...this.debug.attributes },
      output: [...this.debug.output],
    };
  }

  isEnded() {
    return this.state.ended;
  }

  getLetter() {
    if (!this.state.ended) return null;
    const goal = this.state.goalText && this.state.goalText !== UNDECIDED_GOAL ? `人間さんの目標は${quote(this.state.goalText)}だったね。\n` : '';
    const checks = this.state.goalChecks.length ? `途中で${this.state.goalChecks.length}回、いっしょに進み具合を見たの。\n` : '';
    return `人間さんへ\n\n30日間、いっしょにいてくれてありがとうなの。\n${goal}${checks}新しいコトバを${this.getLearnedWords().length}個覚えたの。\n\nまた会える日まで、元気でいてね。\n\nすうひもちより`;
  }

  private openGoalSetup(): ConversationResponse {
    this.session.stage = 'goal';
    this.session.phase = 'GOAL';
    this.session.startType = 'GOAL';
    this.session.expected = 'GOAL_TEXT';
    this.session.inputMode = 'text';
    this.session.topic = '30日の目標';
    return this.respond([
      '人間さん、30日後に見たい景色をひとつ教えてほしいの。',
      'ここだけは、人間さんの言葉で書いてほしいの。',
    ], 'goal', 'text', 'GOAL_SETUP');
  }

  private handleGoalText(text: string, logUser = true): ConversationResponse {
    const value = cleanText(text);
    if (logUser) {
      this.session.lastUserText = value;
      this.log('USER', value);
    }

    if (!value) return this.respond(['目標をひとつ書いてほしいの。'], 'goal', 'text', 'GOAL_EMPTY');
    if (value.length > MAX_GOAL_LENGTH) {
      return this.respond([`目標は${MAX_GOAL_LENGTH}文字くらいまでで、ひとつにしてほしいの。`], 'goal', 'text', 'GOAL_TOO_LONG');
    }

    this.state.goalText = value;
    this.state.goalSetAt = this.dateKey();
    this.session.topic = '30日の目標';
    this.session.attributes['goal'] = value;
    this.save();

    return this.finishConversation([
      `${quote(value)}だね。覚えたの。`,
      '30日間、ときどき一緒に進み具合を見ようね。',
    ]);
  }

  private shouldCheckGoal() {
    if (!this.state.goalText || this.state.goalText === UNDECIDED_GOAL) return false;
    if (this.state.conversationCount > 0 && this.state.conversationCount % GOAL_CHECK_INTERVAL === 0) return true;

    if (!this.state.lastGoalCheckDate) {
      return this.getCurrentDay() >= GOAL_CHECK_MAX_DAYS;
    }

    return this.daysSince(this.state.lastGoalCheckDate) >= GOAL_CHECK_MAX_DAYS;
  }

  private openGoalCheck(): ConversationResponse {
    const goal = this.state.goalText;
    if (!goal) return this.openNormalConversation();

    this.state.lastGoalCheckDate = this.dateKey();
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'CYBERNETICS';
    this.session.startType = 'CYBERNETICS';
    this.session.expected = 'GOAL_STATUS';
    this.session.inputMode = 'choice';
    this.session.topic = '30日の目標';
    this.session.choices = [...GOAL_STATUS_CHOICES];

    return this.respond([
      `人間さんの30日の目標は、${quote(goal)}だったよね。`,
      '順調かな？',
    ], 'followup', 'choice', 'GOAL_CHECK');
  }

  private openFarewellSession(): ConversationResponse {
    this.session = this.blankSession();
    this.session.stage = 'farewell';
    this.session.phase = 'CLOSE';
    this.session.startType = 'FAREWELL';
    this.farewellQueue = this.buildFarewellLines();
    return this.respond([this.farewellQueue.shift() ?? 'きょうで30日目なの。'], 'farewell', 'none', 'FAREWELL');
  }
  private openNormalConversation(preferredCategory?: 'SELF' | 'CURIOUS'): ConversationResponse {
    const turn = runConversationEngine({
      intent: 'CHAT',
      day: this.getCurrentDay(),
      seenConversationIds: this.state.seenConversationIds,
      preferredCategory,
      random: this.random,
    });

    // Day1〜Day4の完成台本を先に一巡させる。未閲覧台本がない日だけ、
    // 保存済みPERSON語から一問ずつ派生会話を開く。
    const hasUnseenDayConversation = Boolean(
      turn.conversation && !this.state.seenConversationIds.includes(turn.conversation.id),
    );
    if (!hasUnseenDayConversation) {
      const petCheckIn = this.openCurrentPetCheckIn();
      if (petCheckIn) return petCheckIn;
      const derived = this.openPersonDerivedConversation();
      if (derived) return derived;
      if (this.getCurrentDay() >= 2) {
        const external = this.openExternalDiscovery();
        if (external) return external;
      }
    }

    if (!turn.conversation) {
      this.session.stage = 'complete';
      this.session.phase = 'CHAT';
      this.session.startType = 'CHAT';
      this.session.expected = 'NONE';
      this.session.inputMode = 'none';
      this.session.topic = null;
      this.session.choices = [];
      return this.respond(['新しい会話システムは準備中なの。'], 'complete', 'none', `NEW_${turn.intent}`);
    }

    this.activeDayConversation = turn.conversation;
    if (!this.state.seenConversationIds.includes(turn.conversation.id)) {
      this.state.seenConversationIds.push(turn.conversation.id);
      this.state.pendingDayConversationId = turn.conversation.id;
    }
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'CHAT';
    this.session.startType = 'CHAT';
    this.session.topic = turn.conversation.title;
    this.session.attributes['dayConversationId'] = turn.conversation.id;
    if (turn.conversation.category === 'CURIOUS') {
      this.session.expected = 'DAY_CURIOUS_WORD';
      this.session.inputMode = 'text';
      this.session.choices = [];
    } else {
      this.session.expected = 'DAY_CONVERSATION_CHOICE';
      this.session.inputMode = 'choice';
      this.session.choices = turn.conversation.choices.map(({ id, label }) => ({ id, label }));
    }
    return this.respond(
      dialogueLines(turn.conversation.opening),
      'followup',
      turn.conversation.category === 'CURIOUS' ? 'text' : 'choice',
      turn.conversation.id,
      dialoguePages(turn.conversation.opening),
    );
  }

  /**
   * 現在一緒に暮らす子についてだけ、保存済みの個性を一部使って近況を聞く。
   * 過去のペットは候補に入れないため、現在の様子を尋ねることはない。
   */
  private openCurrentPetCheckIn(): ConversationResponse | null {
    const day = this.getCurrentDay();
    const pet = Object.values(this.state.words)
      .filter((word) => (
        word.category === 'ANIMAL'
        && word.subcategory === 'ANIMAL_PET'
        && this.state.petStatuses[word.id] === 'CURRENT'
        && this.state.petLastCheckInDays[word.id] !== day
        && Boolean(this.state.personWordDeepDives[word.id]?.slot2
          || this.state.personWordDeepDives[word.id]?.slot3
          || this.state.personWordDeepDives[word.id]?.slot4)
      ))
      .sort((left, right) => (
        (this.state.petLastCheckInDays[left.id] ?? 0)
        - (this.state.petLastCheckInDays[right.id] ?? 0)
        || left.learnedOrder - right.learnedOrder
      ))[0];
    if (!pet) return null;

    const details = this.state.personWordDeepDives[pet.id];
    const remembered = [details?.slot2, details?.slot3, details?.slot4]
      .filter((entry): entry is PersonWordDeepDiveEntry => Boolean(entry))
      .slice(0, 2)
      .map((entry) => entry.value);
    this.state.petLastCheckInDays[pet.id] = day;
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'CHAT';
    this.session.startType = 'CHAT';
    this.session.expected = 'PET_CHECKIN';
    this.session.inputMode = 'choice';
    this.session.topic = pet.surface;
    this.session.choices = [...PET_CHECKIN_CHOICES];
    this.session.attributes['petCheckInWordId'] = pet.id;
    const recall = remembered.length
      ? `${pet.surface}、${remembered.join('で、')}子だったよね。`
      : `${pet.surface}のこと、ぼく覚えてるの。`;
    return this.respond([
      recall,
      `${pet.surface}、いまもそんなふうに過ごしてるかな？`,
    ], 'followup', 'choice', 'PET_CHECKIN');
  }

  private openPersonDerivedConversation(): ConversationResponse | null {
    const parents = Object.values(this.state.words)
      .filter((word) => (
        word.category === 'PERSON'
        && Boolean(word.subcategory)
        && [
          ...personDerivedConversationsFor(word.subcategory ?? ''),
          ...personDeepDiveConversationsFor(word.subcategory ?? ''),
        ].some((conversation) => !(this.state.personDerivedConversationUses[word.id] ?? []).includes(conversation.id))
      ))
      .sort((left, right) => left.learnedOrder - right.learnedOrder);
    if (!parents.length) return null;

    const hasAvailable = (
      word: WordEntry,
      kind: 'deepDive' | 'derived',
    ) => {
      const used = this.state.personDerivedConversationUses[word.id] ?? [];
      const questions = kind === 'deepDive'
        ? personDeepDiveConversationsFor(word.subcategory ?? '')
        : personDerivedConversationsFor(word.subcategory ?? '');
      return questions.some((conversation) => !used.includes(conversation.id));
    };
    const deepParents = parents.filter((word) => hasAvailable(word, 'deepDive'));
    const derivedParents = parents.filter((word) => hasAvailable(word, 'derived'));
    const history = this.state.personDerivedQuestionHistory;
    const last = history.at(-1);
    const lastTwoWereDerived = history.length >= 2 && history.at(-1) === 'derived' && history.at(-2) === 'derived';
    let kind: 'deepDive' | 'derived';
    if (!deepParents.length) {
      kind = 'derived';
    } else if (!derivedParents.length) {
      kind = 'deepDive';
    } else if (last === 'deepDive') {
      kind = 'derived';
    } else if (lastTwoWereDerived) {
      kind = 'deepDive';
    } else {
      kind = this.random() < (2 / 3) ? 'derived' : 'deepDive';
    }

    const candidateParents = (kind === 'deepDive' ? deepParents : derivedParents);
    const parent = candidateParents[
      Math.min(candidateParents.length - 1, Math.floor(this.random() * candidateParents.length))
    ];
    if (!parent?.subcategory) return null;
    const used = this.state.personDerivedConversationUses[parent.id] ?? [];
    const questions = (kind === 'deepDive'
      ? personDeepDiveConversationsFor(parent.subcategory)
      : personDerivedConversationsFor(parent.subcategory))
      .filter((conversation) => !used.includes(conversation.id));
    if (!questions.length) return null;
    const conversation = questions[
      Math.min(questions.length - 1, Math.floor(this.random() * questions.length))
    ];
    if (!conversation) return null;

    this.activePersonDerivedConversation = kind === 'derived'
      ? conversation as PersonDerivedConversation
      : null;
    this.activePersonDeepDiveConversation = kind === 'deepDive'
      ? conversation as PersonDeepDiveConversation
      : null;
    this.activePersonDeepDiveAnswer = '';
    this.activePersonDerivedParentWord = parent;
    this.activePersonDerivedWord = null;
    this.activePersonDerivedRelationIds = [];
    this.state.personDerivedConversationUses[parent.id] = [...used, conversation.id];
    this.state.personDerivedQuestionHistory = [...history, kind].slice(-2);
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'CHAT';
    this.session.startType = 'CHAT';
    this.session.expected = kind === 'deepDive' ? 'PERSON_DEEP_DIVE_TEXT' : 'PERSON_DERIVED_WORD';
    this.session.inputMode = 'text';
    this.session.topic = parent.surface;
    this.session.choices = [];
    this.session.attributes['dayConversationId'] = conversation.id;
    this.session.attributes['derivedFromWordId'] = parent.id;
    const opening = kind === 'deepDive'
      ? this.fillPersonDeepDiveBeats(conversation.opening)
      : [
        ...this.personDeepDiveRecallIntro(parent, conversation.id),
        ...this.fillPersonDerivedBeats(conversation.opening),
      ];
    return this.respond(
      dialogueLines(opening),
      'followup',
      'text',
      conversation.id,
      dialoguePages(opening),
    );
  }

  private openNewWord(): ConversationResponse {
    this.session.stage = 'topic';
    this.session.phase = 'LEARN';
    this.session.startType = 'WORD';
    this.session.expected = 'NEW_WORD';
    this.session.inputMode = 'text';
    this.session.topic = null;

    return this.respond(['人間さん、新しいコトバをひとつ教えてほしいの。'], 'topic', 'text', 'NEW_WORD');
  }

  private handleNewWord(text: string, logUser = true): ConversationResponse {
    const surface = text.trim();
    const value = cleanText(surface);
    if (logUser) {
      this.session.lastUserText = surface;
      this.log('USER', surface);
    }

    if (!value) return this.respond(['コトバをひとつ教えてほしいの。'], 'topic', 'text', 'WORD_EMPTY');
    if (value.length > MAX_WORD_LENGTH || /[。！？!?\n\r]/.test(value)) {
      return this.respond(['文章じゃなくて、コトバをひとつだけ教えてほしいの。'], 'topic', 'text', 'WORD_ONLY');
    }

    const commonKnowledge = findCommonKnowledge(value);
    if (commonKnowledge) {
      this.session.category = commonKnowledge.category;
      this.session.attributes['commonKnowledge'] = 'true';
      this.session.attributes['commonCategory'] = commonKnowledge.category;
      // Common words are not added to the player's taught-word memory. They
      // remain a built-in baseline, while the original spelling stays in logs.
      return this.finishConversation([`${quote(surface)}は知ってるの。`]);
    }

    if (SYSTEM_WORDS.has(value)) {
      return this.finishConversation([`${quote(surface)}は知ってるの。えへへ。`]);
    }

    const word = this.ensureWord(surface, 'UNKNOWN');
    this.session.topic = word.surface;
    this.session.category = 'UNKNOWN';
    this.session.stage = 'unknown';
    this.session.phase = 'LEARN';
    this.session.expected = 'CATEGORY';
    this.session.inputMode = 'category';
    this.recordEvent('LEARN', word.surface, value, 'NEUTRAL');

    return this.respond([
      `${quote(surface)}、覚えたの。`,
      'それって、どんなコトバ？',
    ], 'unknown', 'category', 'WORD_CATEGORY');
  }

  private applyCategory(category: WordCategory): ConversationResponse {
    const topic = this.session.topic;
    if (!topic) return this.respond(['先にコトバを教えてほしいの。'], 'topic', 'text', 'NO_WORD');

    const word = this.activePersonDerivedWord?.surface === topic
      ? this.activePersonDerivedWord
      : this.ensureWord(topic, category);
    word.category = category;
    this.save();

    this.session.category = category;
    this.session.phase = 'LEARN';

    const curiousClassification = this.activeDayConversation?.category === 'CURIOUS'
      ? this.activeDayConversation.classification
      : undefined;
    const personDerivedClassification = this.activePersonDerivedConversation?.classification;

    // Ask for a more specific type for the expanded new-word categories.
    // Legacy MEDIA entries keep the original one-step behavior.
    const subCategories = category === 'MEDIA' ? [] : (SUBCATEGORY_CHOICES[category] ?? []);
    if (subCategories.length > 0) {
      this.session.stage = 'unknown';
      this.session.expected = 'SUBCATEGORY';
      this.session.inputMode = 'category';
      this.session.choices = [];
      return this.respond([
        `${quote(topic)}は${CATEGORY_LABELS[category] ?? 'そういうもの'}なんだね。`,
        'もう少しくわしく教えてほしいの。',
      ], 'unknown', 'category', personDerivedClassification
        ? `${this.activePersonDerivedConversation?.id}_SUBCATEGORY`
        : curiousClassification
          ? `${this.activeDayConversation?.id}_SUBCATEGORY`
          : 'WORD_SUBCATEGORY');
    }

    if (personDerivedClassification) return this.finishPersonDerivedConversation(word);
    if (curiousClassification) return this.finishCuriousClassification(word, curiousClassification);

    this.session.stage = 'followup';
    this.session.expected = 'WORD_FEELING';
    this.session.inputMode = 'choice';
    this.session.choices = [...WORD_FEELING_CHOICES];

    return this.respond([
      `${quote(topic)}は${CATEGORY_LABELS[category] ?? 'そういうもの'}なんだね。覚えたの。`,
      `人間さんは${quote(topic)}のこと、どんな感じ？`,
    ], 'followup', 'choice', 'WORD_FEELING');
  }

  private applySubCategory(selected: SubCategoryChoice): ConversationResponse {
    const topic = this.session.topic;
    if (!topic) return this.respond(['先にコトバを教えてほしいの。'], 'topic', 'text', 'NO_WORD');

    const word = this.activePersonDerivedWord?.surface === topic
      ? this.activePersonDerivedWord
      : this.ensureWord(topic, this.session.category);
    word.subcategory = selected.id;
    this.save();

    const curiousClassification = this.activeDayConversation?.category === 'CURIOUS'
      ? this.activeDayConversation.classification
      : undefined;
    if (this.activePersonDerivedConversation) return this.finishPersonDerivedConversation(word);
    if (curiousClassification) return this.finishCuriousClassification(word, curiousClassification);

    if (word.category === 'ANIMAL' && selected.id === 'ANIMAL_PET') {
      this.session.stage = 'followup';
      this.session.phase = 'LEARN';
      this.session.expected = 'PET_STATUS';
      this.session.inputMode = 'choice';
      this.session.choices = [...PET_STATUS_CHOICES];
      return this.respond([
        `${quote(topic)}は、人間さんと一緒に暮らした子なんだね。`,
        'いま一緒に暮らしてる子？　それとも前に一緒に暮らしてた子？',
      ], 'followup', 'choice', 'PET_STATUS');
    }

    this.session.stage = 'followup';
    this.session.phase = 'LEARN';
    this.session.expected = 'WORD_FEELING';
    this.session.inputMode = 'choice';
    this.session.choices = [...WORD_FEELING_CHOICES];

    const dialogue = MIDDLE_CATEGORY_DIALOGUE[selected.id]?.(topic) ?? [
      `${topic}って、${selected.label}なんだね。`,
      `${selected.label}のこと、もう少し知りたいの。`,
      `${topic}のこと、好き？`,
      `${topic}は……`,
    ];
    // 中カテゴリーの説明3行から1行だけを選び、
    // そのあとに共通の気持ち確認を表示する。
    const explanationLines = dialogue.slice(0, -1);
    const explanation = explanationLines.length
      ? explanationLines[Math.min(explanationLines.length - 1, Math.floor(this.random() * explanationLines.length))]
      : `${topic}って、${selected.label}なんだね。`;
    const prompt = WORD_FEELING_PROMPTS[
      Math.min(WORD_FEELING_PROMPTS.length - 1, Math.floor(this.random() * WORD_FEELING_PROMPTS.length))
    ]?.(topic) ?? `人間さんは、${topic}のことどう思う？`;
    return this.respond([explanation, prompt], 'followup', 'choice', 'WORD_FEELING');
  }

  private applyChoice(choice: ConversationChoice, logUser: boolean): ConversationResponse {
    if (logUser) {
      this.session.lastUserText = choice.label;
      this.log('USER', choice.label);
    }

    switch (this.session.expected) {
      case 'EARLY_COMBO_INVITE': {
        const wordId = this.state.earlyInterestWordId;
        this.state.conversationChoiceRecords.push({
          conversationId: 'DAY01_CURIOUS_03', choiceId: choice.id, choiceLabel: choice.label,
          day: this.getCurrentDay(), timestamp: this.now().toISOString(),
        });
        this.save();
        if (choice.id === 'EARLY_COMBO_START' && wordId) {
          this.session.attributes['startComboWordId'] = wordId;
          return this.finishConversation(['教わった言葉から、もう少し先へ進んでみるの。']);
        }
        const external = this.openExternalDiscovery();
        return external ?? this.finishConversation(['うん。教えてくれた道の入口を、覚えておくの。']);
      }
      case 'EXTERNAL_TOPIC_FEEDBACK':
        if (choice.id === 'EXTERNAL_CORRECT') {
          this.session.expected = 'EXTERNAL_TOPIC_CORRECTION';
          this.session.choices = [];
          return this.respond(['どのつながりが違ったか、教えられるところだけでいいの。'], 'followup', 'text', 'EXTERNAL_CORRECTION');
        }
        return this.handleExternalFeedback(choice.id);
      case 'DAY_CONVERSATION_CHOICE':
        return this.handleDayConversationChoice(choice);
      case 'DAY_CURIOUS_KNOWN_CHOICE':
        return this.handleCuriousChoice(choice, 'known');
      case 'DAY_CURIOUS_UNKNOWN_CHOICE':
        return this.handleCuriousChoice(choice, 'unknown');
      case 'WORD_FEELING':
        return this.handleWordFeelingChoice(choice);
      case 'PET_STATUS':
        return this.handlePetStatusChoice(choice);
      case 'PET_CHECKIN':
        return this.handlePetCheckInChoice(choice);
      case 'GOAL_STATUS':
        return this.handleGoalStatusChoice(choice);
      case 'GOAL_ACTION':
        return this.handleGoalActionChoice(choice);
      default:
        return this.finishConversation(['うん、覚えておくの。']);
    }
  }

  private handlePetStatusChoice(choice: ConversationChoice): ConversationResponse {
    const status: PetStatus | null = choice.id === 'PET_CURRENT'
      ? 'CURRENT'
      : choice.id === 'PET_FORMER'
        ? 'FORMER'
        : null;
    const topic = this.session.topic;
    if (!status || !topic) return this.respond(['どちらかを選んでほしいの。'], 'followup', 'choice', 'PET_STATUS');
    const word = this.ensureWord(topic, 'ANIMAL');
    if (word.subcategory !== 'ANIMAL_PET') {
      return this.respond(['その子の種類を先に確かめたいの。'], 'unknown', 'category', 'PET_STATUS_INVALID');
    }
    this.state.petStatuses[word.id] = status;
    this.session.stage = 'followup';
    this.session.phase = 'LEARN';
    this.session.expected = 'WORD_FEELING';
    this.session.inputMode = 'choice';
    this.session.choices = [...WORD_FEELING_CHOICES];
    this.save();
    const when = status === 'CURRENT' ? 'いまも一緒に暮らしてる' : '前に一緒に暮らしてた';
    return this.respond([
      `${quote(topic)}は、${when}子なんだね。覚えておくの。`,
      `人間さんは${quote(topic)}のこと、どんな感じ？`,
    ], 'followup', 'choice', 'WORD_FEELING');
  }

  private handlePetCheckInChoice(choice: ConversationChoice): ConversationResponse {
    const pet = this.session.topic ?? 'その子';
    if (choice.id === 'PET_CHECKIN_WELL') {
      return this.finishConversation([`${pet}、元気なんだね。よかったの。`]);
    }
    if (choice.id === 'PET_CHECKIN_CONCERN') {
      return this.finishConversation([`${pet}のこと、気になるんだね。そばで見ててあげてね。`]);
    }
    return this.finishConversation([`${pet}は、いつもの${pet}なんだね。`]);
  }

  private handleCuriousWord(text: string): ConversationResponse {
    const conversation = this.activeDayConversation?.category === 'CURIOUS'
      ? this.activeDayConversation
      : null;
    const surface = text.trim();
    const value = cleanText(surface);
    if (!conversation) return this.finishConversation();
    if (!value) return this.respond(['一個だけ教えてほしいの。'], 'followup', 'text', 'CURIOUS_WORD_EMPTY');
    if (value.length > MAX_WORD_LENGTH || /[。！？!?\n\r]/.test(value)) {
      return this.respond(['長いお話じゃなくて、今は名前を一個だけ教えてほしいの。'], 'followup', 'text', 'CURIOUS_WORD_ONLY');
    }

    const existing = this.findWordBySurface(surface);
    const common = findCommonKnowledge(value);
    const curiousClassification = conversation.classification;
    const constrainInputCategory = conversation.id.startsWith('DAY04_CURIOUS_') || conversation.id.startsWith('DAY05_CURIOUS_') || conversation.id.startsWith('DAY06_CURIOUS_') || conversation.id.startsWith('DAY07_CURIOUS_') || conversation.id.startsWith('DAY08_CURIOUS_') || conversation.id.startsWith('DAY09_CURIOUS_') || conversation.id.startsWith('DAY10_CURIOUS_') || conversation.id.startsWith('DAY11_CURIOUS_');
    const expectedCategory = constrainInputCategory ? conversation.context.category : undefined;
    const expectedSubcategory = constrainInputCategory ? conversation.context.subcategory : undefined;
    const recognizedCategory = existing?.category ?? common?.category;
    const categoryMismatch = Boolean(
      !curiousClassification && expectedCategory && recognizedCategory
      && recognizedCategory !== 'UNKNOWN' && recognizedCategory !== expectedCategory,
    );
    const subcategoryMismatch = Boolean(
      !curiousClassification && expectedCategory && expectedSubcategory
      && existing?.category === expectedCategory && existing.subcategory
      && existing.subcategory !== expectedSubcategory,
    );
    if (categoryMismatch || subcategoryMismatch) {
      const targetLabel = expectedCategory
        ? subcategoryLabel(expectedCategory, expectedSubcategory) ?? CATEGORY_LABELS[expectedCategory]
        : '今の仲間';
      return this.respond(
        [`「${surface}」は${targetLabel}とは違うみたい。${targetLabel}の言葉を一つ教えて。`],
        'followup', 'text', `${conversation.id}_CATEGORY_RETRY`,
      );
    }
    const known = Boolean(
      common
      || SYSTEM_WORDS.has(value)
      || existing,
    );
    const category = curiousClassification
      ? 'UNKNOWN'
      : common?.category
        ?? (existing?.category !== 'UNKNOWN' ? existing?.category : undefined)
        ?? conversation.context.category
        ?? 'UNKNOWN';
    const word = this.ensureWord(surface, category);
    word.lastUsedDay = this.getCurrentDay();
    this.session.topic = word.surface;
    this.session.category = word.category;
    this.activeCuriousWord = word;
    this.activeCuriousRelationIds = [];
    this.activeCuriousOpenQuestionIds = [];

    if (category !== 'UNKNOWN') {
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        word.id,
        'IS_A',
        `concept:${category.toLowerCase()}`,
        'CONTEXT_INFERRED',
      ));
    }
    for (const relationType of conversation.context.humanRelations) {
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        'human',
        relationType,
        word.id,
        'USER_EXPLICIT',
      ));
    }

    this.activeCuriousRelatedWord = conversation.id === 'DAY01_CURIOUS_05'
      ? this.findRelatedWordCandidate(word)
      : null;
    this.save();

    if (curiousClassification) {
      const responseBeats = this.fillCuriousBeats(curiousClassification.afterInput);
      this.session.expected = 'CATEGORY';
      this.session.inputMode = 'category';
      this.session.choices = [];
      return this.respond(
        dialogueLines(responseBeats),
        'followup',
        'category',
        `${conversation.id}_CATEGORY`,
        dialoguePages(responseBeats),
      );
    }

    if (known && conversation.id === 'DAY01_CURIOUS_05' && !this.activeCuriousRelatedWord) {
      const commonOrUnknown = this.curiousBranch(conversation, 'unknown');
      this.session.expected = 'DAY_CURIOUS_UNKNOWN_CHOICE';
      this.session.inputMode = 'choice';
      this.session.choices = commonOrUnknown.choices.map(({ id, label }) => ({ id, label }));
      return this.respond(
        this.fillCuriousLines(sayForRuntime(
          '{word}。', 'そこは知ってるの。', '人間さん、そこによくいるんだ。',
          'そこで、人間さんは何をすることが多い？',
        )),
        'followup',
        'choice',
        `${conversation.id}_KNOWN_PURPOSE`,
      );
    }

    const path = this.curiousBranch(conversation, known ? 'known' : 'unknown');
    this.session.expected = known ? 'DAY_CURIOUS_KNOWN_CHOICE' : 'DAY_CURIOUS_UNKNOWN_CHOICE';
    this.session.inputMode = 'choice';
    this.session.choices = path.choices.map(({ id, label }) => ({ id, label }));
    const responseBeats = this.fillCuriousBeats(path.response);
    return this.respond(
      dialogueLines(responseBeats),
      'followup',
      'choice',
      `${conversation.id}_${known ? 'KNOWN' : 'UNKNOWN'}`,
      dialoguePages(responseBeats),
    );
  }

  private handlePersonDerivedWord(text: string): ConversationResponse {
    const conversation = this.activePersonDerivedConversation;
    const parent = this.activePersonDerivedParentWord;
    const surface = text.trim();
    const value = cleanText(surface);
    if (!conversation || !parent) return this.finishConversation();
    if (!value) return this.respond(['一個だけ教えてほしいの。'], 'followup', 'text', 'PERSON_DERIVED_EMPTY');
    if (value.length > MAX_WORD_LENGTH || /[。！？!?\n\r]/.test(value)) {
      return this.respond(
        ['長いお話じゃなくて、今は名前を一個だけ教えてほしいの。'],
        'followup',
        'text',
        'PERSON_DERIVED_WORD_ONLY',
      );
    }
    if (isUnavailableDerivedAnswer(value)) {
      const parentSurface = parent.surface;
      this.session.topic = null;
      this.clearActiveDayConversation();
      return this.finishConversation([
        `${parentSurface}から、今は何も出てこなかったんだね。`,
        '無理に探さなくていいの。今日はここまでにするの。',
      ]);
    }

    const classification = conversation.classification;
    const initialCategory = classification.mode === 'full' ? 'UNKNOWN' : classification.category;
    const word = this.ensureWord(surface, initialCategory, parent.id);
    word.lastUsedDay = this.getCurrentDay();
    this.activePersonDerivedWord = word;
    this.session.topic = word.surface;
    this.session.category = initialCategory;
    this.activePersonDerivedRelationIds = [this.rememberMeaningRelation(
      parent.id,
      'RELATED_TO',
      word.id,
      'USER_EXPLICIT',
      conversation.id,
    )];

    if (classification.mode === 'fixed') {
      word.category = classification.category;
      word.subcategory = classification.subcategory;
      this.save();
      return this.finishPersonDerivedConversation(word, conversation.afterAnswer);
    }

    const responseBeats = this.fillPersonDerivedBeats(conversation.afterAnswer);
    if (classification.mode === 'subcategory') {
      word.category = classification.category;
      this.session.category = classification.category;
      this.session.expected = 'SUBCATEGORY';
      this.session.inputMode = 'category';
      this.session.choices = [];
      this.save();
      return this.respond(
        dialogueLines(responseBeats),
        'followup',
        'category',
        `${conversation.id}_SUBCATEGORY`,
        dialoguePages(responseBeats),
      );
    }

    this.session.expected = 'CATEGORY';
    this.session.inputMode = 'category';
    this.session.choices = [];
    this.save();
    return this.respond(
      dialogueLines(responseBeats),
      'followup',
      'category',
      `${conversation.id}_CATEGORY`,
      dialoguePages(responseBeats),
    );
  }

  private finishPersonDerivedConversation(
    word: WordEntry,
    prefix: readonly DialogueBeat[] = [],
  ): ConversationResponse {
    const conversation = this.activePersonDerivedConversation;
    const parent = this.activePersonDerivedParentWord;
    if (!conversation || !parent) return this.finishConversation();

    this.state.memoryEpisodes.push({
      id: `episode_${this.session.id}_${this.state.memoryEpisodes.length + 1}`,
      day: this.getCurrentDay(),
      conversationId: conversation.id,
      topicWordIds: [parent.id, word.id],
      learnedRelationIds: [...new Set(this.activePersonDerivedRelationIds)],
      createdOpenQuestionIds: [],
      timestamp: this.now().toISOString(),
    });
    this.save();

    const responseBeats = this.fillPersonDerivedBeats([
      ...prefix,
      ...conversation.closing,
    ]);
    this.session.topic = null;
    this.clearActiveDayConversation();
    return this.finishConversation(dialogueLines(responseBeats), dialoguePages(responseBeats));
  }

  private handlePersonDeepDiveText(text: string): ConversationResponse {
    const conversation = this.activePersonDeepDiveConversation;
    const parent = this.activePersonDerivedParentWord;
    const answer = cleanText(text);
    if (!conversation || !parent) return this.finishConversation();
    if (!answer) {
      return this.respond(['一個だけ教えてほしいの。'], 'followup', 'text', 'PERSON_DEEP_DIVE_EMPTY');
    }
    if (answer.length > MAX_DEEP_DIVE_LENGTH) {
      return this.respond(
        [`今は${MAX_DEEP_DIVE_LENGTH}文字くらいまでで教えてほしいの。`],
        'followup',
        'text',
        'PERSON_DEEP_DIVE_TOO_LONG',
      );
    }
    if (isUnavailableDerivedAnswer(answer)) {
      this.session.topic = null;
      this.clearActiveDayConversation();
      return this.finishConversation([
        `${parent.surface}のこと、今はまだ言葉にしなくても大丈夫なの。`,
        'また思い出した時に教えてほしいの。',
      ]);
    }
    if (!this.setPersonWordDeepDive(parent.id, conversation.slot, answer)) {
      return this.finishConversation(['うまく覚えられなかったの。次にもう一度教えてほしいの。']);
    }
    this.activePersonDeepDiveAnswer = answer;
    this.state.memoryEpisodes.push({
      id: `episode_${this.session.id}_${this.state.memoryEpisodes.length + 1}`,
      day: this.getCurrentDay(),
      conversationId: conversation.id,
      topicWordIds: [parent.id],
      learnedRelationIds: [],
      createdOpenQuestionIds: [],
      timestamp: this.now().toISOString(),
    });
    this.save();

    const responseBeats = this.fillPersonDeepDiveBeats(conversation.closing);
    this.session.topic = null;
    this.clearActiveDayConversation();
    return this.finishConversation(dialogueLines(responseBeats), dialoguePages(responseBeats));
  }

  private handleCuriousChoice(choice: ConversationChoice, path: 'known' | 'unknown'): ConversationResponse {
    const conversation = this.activeDayConversation?.category === 'CURIOUS'
      ? this.activeDayConversation
      : null;
    const word = this.activeCuriousWord;
    const branch = conversation ? this.curiousBranch(conversation, path) : undefined;
    const selectedChoice = branch?.choices.find((item) => item.id === choice.id);
    if (!conversation || !word || !selectedChoice) return this.finishConversation();

    this.state.conversationChoiceRecords.push({
      conversationId: conversation.id,
      choiceId: selectedChoice.id,
      choiceLabel: selectedChoice.label,
      day: this.getCurrentDay(),
      timestamp: this.now().toISOString(),
    });
    this.applyCuriousMemoryEffect(conversation, word, selectedChoice);
    this.state.memoryEpisodes.push({
      id: `episode_${this.session.id}_${this.state.memoryEpisodes.length + 1}`,
      day: this.getCurrentDay(),
      conversationId: conversation.id,
      topicWordIds: [word.id],
      learnedRelationIds: [...new Set(this.activeCuriousRelationIds)],
      createdOpenQuestionIds: [...new Set(this.activeCuriousOpenQuestionIds)],
      timestamp: this.now().toISOString(),
    });
    this.save();

    const responseBeats = this.fillCuriousBeats(selectedChoice.response);
    const response = dialogueLines(responseBeats);
    this.session.topic = null;
    this.clearActiveDayConversation();
    return this.finishConversation(response, dialoguePages(responseBeats));
  }

  private finishCuriousClassification(
    word: WordEntry,
    classification: NonNullable<CuriousConversation['classification']>,
  ): ConversationResponse {
    for (const question of classification.openQuestions ?? []) {
      this.activeCuriousOpenQuestionIds.push(this.rememberOpenQuestion(
        word.id,
        question.field,
        question.questionHint,
      ));
    }
    this.state.memoryEpisodes.push({
      id: `episode_${this.session.id}_${this.state.memoryEpisodes.length + 1}`,
      day: this.getCurrentDay(),
      conversationId: this.activeDayConversation?.id ?? 'CURIOUS_CLASSIFICATION',
      topicWordIds: [word.id],
      learnedRelationIds: [...new Set(this.activeCuriousRelationIds)],
      createdOpenQuestionIds: [...new Set(this.activeCuriousOpenQuestionIds)],
      timestamp: this.now().toISOString(),
    });
    this.save();

    const earlyInterest = this.activeDayConversation?.id === 'DAY01_CURIOUS_03';
    const responseBeats = this.fillCuriousBeats(classification.afterSubcategory);
    this.session.topic = null;
    this.clearActiveDayConversation();
    if (earlyInterest && !this.state.earlyComboOffered) {
      this.state.earlyInterestWordId = word.id;
      this.state.earlyComboOffered = true;
      this.save();
      if (this.getPersonWordComboCandidates().some((entry) => entry.id === word.id)) {
        this.session.expected = 'EARLY_COMBO_INVITE';
        this.session.choices = this.choicesForExpected('EARLY_COMBO_INVITE');
        return this.respond([...dialogueLines(responseBeats), 'この言葉から、思い出す言葉をつないでみる？'],
          'followup', 'choice', 'EARLY_COMBO_INVITE');
      }
      const external = this.openExternalDiscovery();
      if (external) return external;
    }
    return this.finishConversation(dialogueLines(responseBeats), dialoguePages(responseBeats));
  }

  private applyCuriousMemoryEffect(
    conversation: CuriousConversation,
    word: WordEntry,
    branch: CuriousConversationChoice,
  ) {
    const effect = branch.memory;
    if (effect.category && word.category === 'UNKNOWN') {
      word.category = effect.category;
    }
    if (effect.subcategory && (!effect.category || effect.category === word.category)) {
      word.subcategory = effect.subcategory;
      this.resolveOpenQuestions(word.id, 'SUBCATEGORY');
    }
    if (effect.category) this.resolveOpenQuestions(word.id, 'CATEGORY');

    if (effect.relationQualifier) {
      for (const relationType of conversation.context.humanRelations) {
        const id = this.rememberMeaningRelation(
          'human', relationType, word.id, 'USER_EXPLICIT',
          effect.relationQualifier,
        );
        this.activeCuriousRelationIds.push(id);
      }
    }
    for (const relationType of effect.humanRelations ?? []) {
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        'human', relationType, word.id, 'USER_EXPLICIT', effect.relationQualifier,
      ));
    }

    if (conversation.id === 'DAY01_CURIOUS_05' && pathIsKnownChoice(branch.id) && this.activeCuriousRelatedWord) {
      const status = effect.relationStatus ?? 'ACTIVE';
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        word.id,
        'RELATED_TO',
        this.activeCuriousRelatedWord.id,
        status === 'REJECTED' ? 'USER_CORRECTION' : 'USER_EXPLICIT',
        effect.relationQualifier,
        status,
      ));
    } else if (effect.relatedConcept) {
      const type: MemoryRelationType = conversation.id === 'DAY01_CURIOUS_05' ? 'RELATED_TO' : 'IS_A';
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        word.id,
        type,
        `concept:${effect.relatedConcept}`,
        'USER_EXPLICIT',
        effect.relatedConceptLabel,
        effect.relationStatus ?? 'ACTIVE',
      ));
    }

    for (const question of effect.openQuestions ?? []) {
      this.activeCuriousOpenQuestionIds.push(this.rememberOpenQuestion(
        word.id,
        question.field,
        question.questionHint,
      ));
    }
  }

  private curiousBranch(conversation: CuriousConversation, path: 'known' | 'unknown') {
    if (conversation.common) return conversation.common;
    return path === 'known' ? conversation.known : conversation.unknown;
  }

  private findWordBySurface(surface: string) {
    const normalized = cleanText(surface).toLocaleLowerCase('ja');
    return Object.values(this.state.words).find(
      (word) => cleanText(word.surface).toLocaleLowerCase('ja') === normalized,
    );
  }

  private findRelatedWordCandidate(current: WordEntry) {
    return Object.values(this.state.words)
      .filter((word) => (
        word.id !== current.id
        && !INTERNAL_TOPICS.has(word.surface)
        && !this.state.memoryRelations.some((relation) => (
          relation.subjectId === current.id
          && relation.type === 'RELATED_TO'
          && relation.objectId === word.id
        ))
      ))
      .sort((a, b) => (b.lastUsedDay ?? b.firstSeenDay) - (a.lastUsedDay ?? a.firstSeenDay)
        || b.learnedOrder - a.learnedOrder)[0] ?? null;
  }

  private fillCuriousLines(beats: readonly DialogueBeat[]) {
    return dialogueLines(this.fillCuriousBeats(beats));
  }

  private fillCuriousBeats(beats: readonly DialogueBeat[]) {
    const word = this.activeCuriousWord?.surface ?? '';
    const relatedWord = this.activeCuriousRelatedWord?.surface ?? '';
    return beats.map((beat) => ({
      ...beat,
      text: beat.text
        ?.replaceAll('{word}', word)
        .replaceAll('{relatedWord}', relatedWord),
    }));
  }

  private fillPersonDerivedBeats(beats: readonly DialogueBeat[]) {
    const word = this.activePersonDerivedParentWord?.surface ?? '';
    const answer = this.activePersonDerivedWord?.surface ?? '';
    return beats.map((beat) => ({
      ...beat,
      text: beat.text
        ?.replaceAll('{word}', word)
        .replaceAll('{answer}', answer),
    }));
  }

  private fillPersonDeepDiveBeats(beats: readonly DialogueBeat[]) {
    const word = this.activePersonDerivedParentWord?.surface ?? '';
    const answer = this.activePersonDeepDiveAnswer;
    return beats.map((beat) => ({
      ...beat,
      text: beat.text
        ?.replaceAll('{word}', word)
        .replaceAll('{answer}', answer),
    }));
  }

  private personDeepDiveRecallIntro(parent: WordEntry, conversationId: string): DialogueBeat[] {
    const record = this.state.personWordDeepDives[parent.id];
    // 毎回すべて読み上げず、派生1・3だけに一行だけ自然に混ぜる。
    if (!record || !/_(?:01|03)$/u.test(conversationId)) return [];
    if (record.slot1 && record.slot2) {
      return sayForRuntime(
        `${parent.surface}って、${record.slot1.value}で、${record.slot2.value}人なんだよね。`,
      );
    }
    const remembered = record.slot1?.value ?? record.slot2?.value;
    return remembered
      ? sayForRuntime(`${parent.surface}のこと、${remembered}って教えてくれたよね。`)
      : [];
  }

  private rememberMeaningRelation(
    subjectId: string,
    type: MemoryRelationType,
    objectId: string,
    source: MemoryRelation['source'],
    qualifier?: string,
    status: MemoryRelation['status'] = 'ACTIVE',
  ) {
    const existing = this.state.memoryRelations.find((relation) => (
      relation.subjectId === subjectId
      && relation.type === type
      && relation.objectId === objectId
    ));
    if (existing) {
      existing.source = source;
      existing.status = status;
      existing.qualifier = qualifier ?? existing.qualifier;
      existing.lastSeenDay = this.getCurrentDay();
      existing.mentionCount += 1;
      return existing.id;
    }
    const relation: MemoryRelation = {
      id: `meaning_relation_${this.state.memoryRelations.length + 1}_${this.now().getTime()}`,
      subjectId,
      type,
      objectId,
      source,
      status,
      firstSeenDay: this.getCurrentDay(),
      lastSeenDay: this.getCurrentDay(),
      mentionCount: 1,
    };
    if (qualifier) relation.qualifier = qualifier;
    this.state.memoryRelations.push(relation);
    return relation.id;
  }

  private rememberOpenQuestion(wordId: string, field: OpenQuestionField, questionHint: string) {
    const existing = this.state.openQuestions.find((question) => (
      question.wordId === wordId
      && question.field === field
      && question.questionHint === questionHint
      && question.status === 'OPEN'
    ));
    if (existing) return existing.id;
    const question: OpenQuestion = {
      id: `open_question_${this.state.openQuestions.length + 1}_${this.now().getTime()}`,
      wordId,
      field,
      questionHint,
      createdDay: this.getCurrentDay(),
      status: 'OPEN',
    };
    this.state.openQuestions.push(question);
    return question.id;
  }

  private resolveOpenQuestions(wordId: string, field: OpenQuestionField) {
    for (const question of this.state.openQuestions) {
      if (question.wordId === wordId && question.field === field && question.status === 'OPEN') {
        question.status = 'RESOLVED';
      }
    }
  }

  private clearActiveDayConversation() {
    this.activeDayConversation = null;
    this.activeCuriousWord = null;
    this.activeCuriousRelatedWord = null;
    this.activeCuriousRelationIds = [];
    this.activeCuriousOpenQuestionIds = [];
    this.activePersonDerivedConversation = null;
    this.activePersonDeepDiveConversation = null;
    this.activePersonDeepDiveAnswer = '';
    this.activePersonDerivedParentWord = null;
    this.activePersonDerivedWord = null;
    this.activePersonDerivedRelationIds = [];
  }

  private handleDayConversationChoice(choice: ConversationChoice): ConversationResponse {
    const conversation = this.activeDayConversation?.category === 'SELF' ? this.activeDayConversation : null;
    const branch = conversation?.choices.find((item) => item.id === choice.id);
    if (!conversation || !branch) {
      this.session.expected = 'NONE';
      this.session.inputMode = 'none';
      this.session.choices = [];
      return this.finishConversation();
    }

    this.state.conversationChoiceRecords.push({
      conversationId: conversation.id,
      choiceId: branch.id,
      choiceLabel: branch.label,
      day: this.getCurrentDay(),
      timestamp: this.now().toISOString(),
    });
    this.save();

    this.session.expected = 'NONE';
    this.session.inputMode = 'none';
    this.session.choices = [];
    // この選択は人間さんの単語記憶ではないため、旧 memories には混ぜない。
    this.session.topic = null;
    this.clearActiveDayConversation();
    if (this.getCurrentDay() >= 2) {
      const external = this.openExternalDiscovery('normal', undefined, dialogueLines(branch.response));
      if (external) return external;
    }
    return this.finishConversation(dialogueLines(branch.response), dialoguePages(branch.response));
  }

  private handleWordFeelingChoice(choice: ConversationChoice): ConversationResponse {
    const topic = this.session.topic;
    const sentiment = sentimentForChoice(choice.id);
    let word: WordEntry | undefined;
    if (topic) {
      word = this.state.words[topic];
      if (word) {
        word.userSentiment = sentiment;
        this.recordEvent('RECALL', topic, choice.label, sentiment);
      }
    }

    if (choice.id === 'WORD_LOVE') return this.finishConversation([`大好きなんだね。${topic ? quote(topic) : 'そのコトバ'}、覚えておくの。`]);
    if (choice.id === 'WORD_LIKE') return this.finishConversation([`好きなんだね。${topic ? quote(topic) : 'そのコトバ'}、覚えておくの。`]);
    if (choice.id === 'WORD_DISLIKE') return this.finishConversation(['苦手なコトバなんだね。無理しなくていいの。']);
    if (choice.id === 'WORD_HATE') return this.finishConversation(['嫌いなコトバなんだね。そういう気持ちも覚えておくの。']);
    if (choice.id === 'WORD_INTERESTED') return this.finishConversation(['気になるコトバなんだね。覚えておくの。']);
    return this.finishConversation(['ふつうなんだね。そういうのも覚えておくの。']);
  }

  private handleGoalStatusChoice(choice: ConversationChoice): ConversationResponse {
    const status: GoalStatus = choice.id === 'GOAL_ON_TRACK'
      ? 'ON_TRACK'
      : choice.id === 'GOAL_BEHIND'
        ? 'BEHIND'
        : 'HARD';

    const check: GoalCheck = {
      day: this.getCurrentDay(),
      date: this.dateKey(),
      status,
    };
    this.state.goalChecks.push(check);
    this.session.pendingGoalStatus = status;
    this.recordEvent('GOAL_CHECK', '30日の目標', choice.label, status === 'ON_TRACK' ? 'POSITIVE' : 'NEGATIVE');
    this.save();

    if (status === 'ON_TRACK') {
      return this.finishConversation(['おお、いい感じなの。今のやり方で、そのまま進んでみようね。']);
    }

    this.session.expected = 'GOAL_ACTION';
    this.session.inputMode = 'choice';
    this.session.choices = [...GOAL_ACTION_CHOICES];
    const line = status === 'BEHIND'
      ? 'そっか。少しずれてきたんだね。次はどうする？'
      : 'むむ……。今のやり方では厳しそうなんだね。次はどうする？';
    return this.respond([line], 'followup', 'choice', 'GOAL_ADJUST');
  }

  private handleGoalActionChoice(choice: ConversationChoice): ConversationResponse {
    const action: GoalAction = choice.id === 'GOAL_CHANGE_STRATEGY'
      ? 'CHANGE_STRATEGY'
      : choice.id === 'GOAL_REVIEW'
        ? 'REVIEW_GOAL'
        : 'RETRY';

    const latest = this.state.goalChecks.at(-1);
    if (latest && !latest.action) latest.action = action;
    this.session.attributes['goalAction'] = choice.label;
    this.save();

    if (action === 'CHANGE_STRATEGY') return this.finishConversation(['うん。目標はそのままで、戦法を変えてみるの。']);
    if (action === 'REVIEW_GOAL') return this.finishConversation(['そっか。目標そのものも、いまの自分に合わせて見直していいの。']);
    return this.finishConversation(['うん。もう一度試して、また結果を見ようね。']);
  }

  private ensureWord(
    surface: string,
    category: WordCategory,
    derivedFromWordId?: string,
  ): WordEntry {
    const existing = this.findWordBySurface(surface);
    if (existing) {
      existing.mentionCount += 1;
      if (existing.category === 'UNKNOWN' && category !== 'UNKNOWN') existing.category = category;
      this.save();
      return existing;
    }

    const now = this.now().toISOString();
    const id = `word_${now.replace(/\D/g, '').slice(0, 14)}_${Object.keys(this.state.words).length + 1}`;
    const parent = derivedFromWordId
      ? Object.values(this.state.words).find((entry) => entry.id === derivedFromWordId)
      : undefined;
    const learnedOrder = Object.values(this.state.words)
      .reduce((highest, entry) => Math.max(highest, entry.learnedOrder), 0) + 1;
    const word: WordEntry = {
      id,
      surface,
      category,
      firstSeenDay: this.getCurrentDay(),
      learnedAt: now,
      learnedOrder,
      rootWordId: parent?.rootWordId ?? parent?.id ?? id,
      mentionCount: 1,
    };
    if (parent) word.firstDerivedFromWordId = parent.id;
    this.state.words[surface] = word;
    this.save();
    return word;
  }

  private recordEvent(type: RelationType, object: string, summary: string, sentiment: Sentiment) {
    const event: MemoryEvent = {
      id: `event_${this.session.id}_${this.state.events.length}`,
      day: this.getCurrentDay(),
      date: this.dateKey(),
      type,
      objects: [object],
      sentiment,
      summary,
      importance: type === 'GOAL_CHECK' ? 1 : 0.45,
    };
    this.state.events.push(event);

    const relation = this.state.relations.find((item) => item.relation === type && item.object === object);
    if (relation) {
      relation.date = this.dateKey();
      relation.strength = Math.min(1, relation.strength + 0.1);
    } else {
      this.state.relations.push({ subject: 'USER', relation: type, object, date: this.dateKey(), strength: 0.6 });
    }
    this.save();
  }

  private rememberSession() {
    const topic = this.session.topic;
    if (!topic || INTERNAL_TOPICS.has(topic) || !this.session.lastUserText) return;

    const last = this.state.memories.at(-1);
    if (last?.topic === topic && last.quote === this.session.lastUserText) return;

    this.state.memories.push({
      day: this.getCurrentDay(),
      topic,
      actionType: this.session.startType,
      quote: this.session.lastUserText.slice(0, 100),
    });
    this.save();
  }

  private finishConversation(preface: string[] = [], pages?: DialoguePage[]) {
    this.rememberSession();
    this.session.expected = 'NONE';
    this.session.inputMode = 'none';
    this.session.choices = [];
    this.session.phase = 'CLOSE';
    this.session.stage = 'complete';
    return this.respond(preface, 'complete', 'none', 'CLOSE', pages);
  }

  private respond(
    lines: string[],
    stage: ConversationStage,
    inputMode: InputMode,
    template: string,
    pages?: DialoguePage[],
  ): ConversationResponse {
    this.session.stage = stage;
    this.session.inputMode = inputMode;
    this.session.lastAssistantLines = [...lines];

    const topic = this.session.topic;
    this.debug = {
      input: this.session.lastUserText,
      tokens: topic ? [{ surface: topic, known: Boolean(this.state.words[topic] || SYSTEM_WORDS.has(topic)), score: 10 }] : [],
      topic: topic ?? '',
      topicScore: topic ? 10 : 0,
      topicKnown: Boolean(topic && (this.state.words[topic] || SYSTEM_WORDS.has(topic))),
      state: this.session.phase,
      attributes: { ...this.session.attributes, expected: this.session.expected },
      memoryHit: topic && (this.state.words[topic]?.mentionCount ?? 0) > 1 ? topic : null,
      selectedTemplate: template,
      depth: 0,
      startType: this.session.startType,
      output: [...lines],
    };

    for (const line of lines) this.log('SUUHIMOCHI', line, template);

    return {
      lines,
      pages: pages?.length ? pages : dialoguePagesFromLines(lines),
      stage,
      day: this.getCurrentDay(),
      phaseLabel: this.getPhaseLabel(),
      // 旧UI互換: choice/category でも入力欄を消さない。
      // 新UIでは inputMode/choices/categoryChoices を見てボタン表示に切り替えられる。
      inputEnabled: inputMode !== 'none',
      inputMode,
      choices: inputMode === 'choice' ? [...this.session.choices] : [],
      categoryChoices: inputMode === 'category' && this.session.expected === 'CATEGORY'
        ? CATEGORY_CHOICES.map((item): CategoryChoice => ({ ...item }))
        : [],
      subCategoryChoices: inputMode === 'category' && this.session.expected === 'SUBCATEGORY'
        ? (SUBCATEGORY_CHOICES[this.session.category] ?? []).map((item): SubCategoryChoice => ({ ...item }))
        : [],
      debug: this.getDebugSnapshot(),
    };
  }

  private log(speaker: ConversationLog['speaker'], text: string, questionType?: string) {
    const entry: ConversationLog = {
      timestamp: this.now().toISOString(),
      speaker,
      text,
      sessionId: this.session.id,
      topic: this.session.topic ?? 'それ',
    };
    if (questionType) entry.questionType = questionType;
    this.state.conversations.push(entry);
    this.save();
  }

  private buildFarewellLines() {
    const lines = ['きょうで、人間さんと過ごした30日目なの。'];
    if (this.state.goalText && this.state.goalText !== UNDECIDED_GOAL) lines.push(`最初に${quote(this.state.goalText)}を目標にしたよね。`);
    if (this.state.goalChecks.length) lines.push(`途中で${this.state.goalChecks.length}回、いっしょに進み具合を見たの。`);
    lines.push(`新しいコトバを${this.getLearnedWords().length}個覚えたの。`);
    lines.push('うまくいった日も、ずれた日も、ちゃんと30日の中にあるの。');
    lines.push('そろそろ、お別れの時間みたい。');
    return lines;
  }
}
