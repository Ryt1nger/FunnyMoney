import { useState } from 'react';
import type { PetSpecies } from '../types';
import { usePetStore } from '../features/pet/petStore';
import { useEconomyStore } from '../features/economy/economyStore';

const SPECIES: { id: PetSpecies; label: string; emoji: string }[] = [
  { id: 'cat', label: 'Кот', emoji: '🐱' },
  { id: 'dog', label: 'Собака', emoji: '🐶' },
  { id: 'rabbit', label: 'Кролик', emoji: '🐰' },
];

export default function Onboarding() {
  const createPet = usePetStore((s) => s.createPet);
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [name, setName] = useState('');

  function handleStart() {
    if (!species || !name.trim()) return;
    createPet(species, name.trim());
    useEconomyStore.getState().initIfEmpty(500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-violet-50 flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold text-indigo-950 text-center">Выбери своего питомца</h1>
      <div className="flex gap-3">
        {SPECIES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSpecies(s.id)}
            className={`w-24 h-24 rounded-3xl bg-white shadow flex flex-col items-center justify-center gap-1 text-3xl transition ${
              species === s.id ? 'ring-4 ring-indigo-500 scale-105' : ''
            }`}
          >
            <span>{s.emoji}</span>
            <span className="text-xs font-medium text-gray-600">{s.label}</span>
          </button>
        ))}
      </div>
      {species && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как его зовут?"
          className="w-full max-w-xs px-4 py-3 rounded-2xl bg-white shadow text-center font-medium outline-none focus:ring-4 focus:ring-indigo-300"
        />
      )}
      <button
        onClick={handleStart}
        disabled={!species || !name.trim()}
        className="px-6 py-3 rounded-2xl bg-indigo-600 disabled:bg-gray-300 text-white font-semibold shadow"
      >
        Начать игру
      </button>
    </div>
  );
}
