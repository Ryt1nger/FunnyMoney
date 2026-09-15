import { useState } from 'react';
import { usePetStore } from '../features/pet/petStore';
import { useEconomyStore } from '../features/economy/economyStore';
import { scenarios } from '../data/scenarios';
import { resolveScenarioChoice, canAffordOption } from '../features/scenarios/scenarioEngine';
import type { ScenarioResult } from '../types';

// ВРЕМЕННАЯ debug-страница для M0.
// Цель: наглядно показать, что сторы/движок сценариев работают, до появления
// настоящего UI (M1). Будет заменена на pages/Home.

export default function DebugM0() {
  const pet = usePetStore((s) => s.pet);
  const createPet = usePetStore((s) => s.createPet);
  const economy = useEconomyStore();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [lastResult, setLastResult] = useState<ScenarioResult | null>(null);

  const scenario = scenarios[scenarioIndex];

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-violet-50 p-6">
        <h1 className="text-2xl font-bold text-violet-900">M0 — выбери питомца</h1>
        <div className="flex gap-3">
          {(['cat', 'dog', 'rabbit'] as const).map((species) => (
            <button
              key={species}
              onClick={() => {
                createPet(species, 'Пушок');
                useEconomyStore.getState().initIfEmpty(500);
              }}
              className="px-4 py-3 rounded-2xl bg-white shadow font-medium hover:scale-105 transition"
            >
              {species === 'cat' ? '🐱' : species === 'dog' ? '🐶' : '🐰'} {species}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function handleChoice(optionId: string) {
    const option = scenario.options.find((o) => o.id === optionId)!;
    if (!canAffordOption(economy.coins, option)) {
      alert('Недостаточно монет!');
      return;
    }
    const result = resolveScenarioChoice(scenario, option);
    setLastResult(result);
  }

  return (
    <div className="min-h-screen bg-violet-50 p-6 flex flex-col items-center gap-6">
      <h1 className="text-xl font-bold text-violet-900">M0 — Debug: сторы и движок сценариев</h1>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-4 flex flex-col gap-2">
        <div className="text-4xl text-center">
          {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐰'} {pet.name}
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>❤️ Здоровье: {pet.health}</span>
          <span>😊 Счастье: {pet.happiness}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>💰 Монеты: {economy.coins}</span>
          <span>🏦 Богатство: {economy.wealthScore}</span>
        </div>
      </div>

      {scenario && (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
          <h2 className="font-semibold">{scenario.title}</h2>
          <p className="text-sm text-gray-600">{scenario.context}</p>
          <div className="flex flex-col gap-2">
            {scenario.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleChoice(option.id)}
                className="px-3 py-2 rounded-xl bg-violet-100 hover:bg-violet-200 text-sm font-medium text-left"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {lastResult && (
        <div className="w-full max-w-sm bg-white rounded-2xl shadow p-4 flex flex-col gap-2">
          <h3 className="font-semibold">
            {lastResult.isOptimal ? '✅ Последствие' : '💬 Учитель объясняет'}
          </h3>
          <p className="text-sm text-gray-700">{lastResult.feedback}</p>
          {scenario.followUpScenarioId && (
            <button
              className="mt-2 text-sm underline text-violet-700"
              onClick={() => {
                const nextIndex = scenarios.findIndex((s) => s.id === scenario.followUpScenarioId);
                if (nextIndex >= 0) {
                  setScenarioIndex(nextIndex);
                  setLastResult(null);
                }
              }}
            >
              Показать похожую ситуацию позже →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
