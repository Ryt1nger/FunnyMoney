// ===== Pet =====

export type PetSpecies = 'bear' | 'cat' | 'dog' | 'rabbit';

export type PetMood = 'happy' | 'sad' | 'hungry' | 'excited' | 'neutral' | 'worried';

export interface PetCustomization {
  outfit?: string;
  accessories: string[];
  roomItems: string[];
}

export interface PetState {
  id: string;
  species: PetSpecies;
  /** Выбранный на онбординге визуальный вариант мишки (id из data/petCharacters). */
  characterId?: string;
  name: string;
  level: number;
  /** Суммарный накопленный опыт — реальный счётчик за задания дня, см. petStore.addXp. */
  xp: number;
  health: number; // 0-100
  happiness: number; // 0-100
  mood: PetMood;
  customization: PetCustomization;
  /** Версия последнего явного действия ребёнка с питомцем. */
  careVersion?: number;
  /** Время последнего кормления/ухода/покупки для питомца. */
  lastCareAt?: number;
}

// ===== Economy =====

export interface Transaction {
  id: string;
  timestamp: number;
  amount: number; // negative = spend, positive = earn
  reason: string;
  periodId?: number;
  category?: 'mandatory' | 'optional' | 'savings' | 'goal' | 'reward';
}

export interface SavingsGoal {
  id: string;
  name: string;
  price: number;
  image: string;
  kind: 'toys' | 'clothes' | 'interior';
}

export interface EconomyState {
  coins: number;
  wealthScore: number;
  totalEarned: number;
  totalSpent: number;
  totalSaved: number;
  /** Current balance held in the piggy bank (separate from the wallet). */
  savingsBalance?: number;
  transactions: Transaction[];
  savingsGoal?: SavingsGoal;
}

// ===== Scenario engine =====

export interface ScenarioEffects {
  health?: number;
  happiness?: number;
  wealth?: number;
  coins?: number; // direct coin delta (usually negative = cost)
}

export interface ScenarioOption {
  id: string;
  label: string;
  cost?: number;
  effects: ScenarioEffects;
  isOptimal: boolean;
  teacherFeedback: string; // shown only when NOT optimal
  positiveFeedback?: string; // shown when optimal
}

export interface Scenario {
  id: string;
  topic: string;
  title: string;
  context: string;
  options: ScenarioOption[];
  followUpScenarioId?: string;
  difficulty: number;
}

export interface ScenarioResult {
  scenarioId: string;
  optionId: string;
  isOptimal: boolean;
  effects: ScenarioEffects;
  feedback: string;
}

// ===== Levels =====

export interface Reward {
  coins?: number;
  items?: string[];
}

export interface Level {
  id: string;
  title: string;
  explanationText: string;
  videoOrAnimationRef?: string;
  scenarioIds: string[];
  reward: Reward;
  unlockedBy?: string;
}

export interface LevelProgress {
  levelId: string;
  completed: boolean;
  scenariosCompleted: string[];
}
