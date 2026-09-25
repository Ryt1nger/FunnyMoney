import type { Scenario, ScenarioOption, ScenarioResult } from '../../types';
import { usePetStore } from '../pet/petStore';
import { useEconomyStore } from '../economy/economyStore';
import { usePeriodStore } from '../economy/periodStore';

// Чистая функция: применяет последствия выбора к сторам питомца/экономики
// и возвращает результат для UI (что показать ребёнку и что скажет учитель).
export function resolveScenarioChoice(scenario: Scenario, option: ScenarioOption): ScenarioResult {
  const { applyDelta } = usePetStore.getState();
  const { applyCoinsDelta, applyWealthDelta } = useEconomyStore.getState();

  if (option.effects.coins) {
    const period = usePeriodStore.getState();
    applyCoinsDelta(option.effects.coins, `${scenario.title}: ${option.label}`, {
      periodId: period.status === 'completed' ? undefined : period.id,
      category: 'reward',
    });
  }
  if (option.effects.wealth) {
    applyWealthDelta(option.effects.wealth);
  }
  if (option.effects.health || option.effects.happiness) {
    applyDelta({ health: option.effects.health, happiness: option.effects.happiness });
  }

  return {
    scenarioId: scenario.id,
    optionId: option.id,
    isOptimal: option.isOptimal,
    effects: option.effects,
    feedback: option.isOptimal
      ? option.positiveFeedback ?? 'Отличный выбор!'
      : option.teacherFeedback,
  };
}

export function canAffordOption(coins: number, option: ScenarioOption): boolean {
  if (!option.cost) return true;
  return coins >= option.cost;
}
