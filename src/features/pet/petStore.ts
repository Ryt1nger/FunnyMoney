import { create } from 'zustand';
import type { PetSpecies, PetState } from '../../types';
import { storage } from '../../services/storage';
import { progressLevels, MAX_LEVEL } from '../../data/progressLevels';

interface PetStore {
  pet: PetState | null;
  createPet: (species: PetSpecies, name: string) => void;
  applyDelta: (delta: { health?: number; happiness?: number }) => void;
  /** Начисляет опыт (например, за задание дня) и пересчитывает уровень по порогам
   *  из progressLevels — единственное место, где xp/level реально меняются. */
  addXp: (amount: number) => void;
  setMood: (mood: PetState['mood']) => void;
  renamePet: (name: string) => void;
  /** Перечитывает состояние из storage — реальная проверка на межстраничном экране загрузки. */
  hydrate: () => void;
}

const STORAGE_KEY = 'pet';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// Уровень = сколько порогов xpThreshold уже пройдено (+1), но не выше MAX_LEVEL —
// та же логика чтения progressLevels, что использует экран "Прогресс".
function levelForXp(xp: number): number {
  let level = 1;
  for (const entry of progressLevels) {
    if (xp >= entry.xpThreshold) level = Math.min(entry.level + 1, MAX_LEVEL);
  }
  return level;
}

export function isValidPetState(value: unknown): value is PetState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.species === 'string' &&
    typeof v.name === 'string' &&
    typeof v.health === 'number' &&
    typeof v.happiness === 'number'
  );
}

// Старые сохранения (до появления реального опыта) не содержат xp — считаем его
// нулевым и пересчитываем level от этого нуля, ничего не теряя и не ломая.
function normalizePet(pet: PetState): PetState {
  const xp = typeof pet.xp === 'number' ? pet.xp : 0;
  return { ...pet, xp, level: levelForXp(xp) };
}

function loadInitial(): PetState | null {
  const saved = storage.get<PetState>(STORAGE_KEY);
  return saved && isValidPetState(saved) ? normalizePet(saved) : null;
}

export const usePetStore = create<PetStore>((set, get) => ({
  pet: loadInitial(),

  createPet: (species, name) => {
    const pet: PetState = {
      id: crypto.randomUUID(),
      species,
      name,
      level: 1,
      xp: 0,
      health: 100,
      happiness: 50,
      mood: 'neutral',
      customization: { accessories: [], roomItems: [] },
    };
    storage.set(STORAGE_KEY, pet);
    set({ pet });
  },

  applyDelta: (delta) => {
    const current = get().pet;
    if (!current) return;
    const next: PetState = {
      ...current,
      health: clamp(current.health + (delta.health ?? 0)),
      happiness: clamp(current.happiness + (delta.happiness ?? 0)),
    };
    storage.set(STORAGE_KEY, next);
    set({ pet: next });
  },

  addXp: (amount) => {
    const current = get().pet;
    if (!current || amount <= 0) return;
    const xp = current.xp + amount;
    const next: PetState = { ...current, xp, level: levelForXp(xp) };
    storage.set(STORAGE_KEY, next);
    set({ pet: next });
  },

  setMood: (mood) => {
    const current = get().pet;
    if (!current) return;
    const next = { ...current, mood };
    storage.set(STORAGE_KEY, next);
    set({ pet: next });
  },

  renamePet: (name) => {
    const current = get().pet;
    if (!current || !name.trim()) return;
    const next = { ...current, name: name.trim() };
    storage.set(STORAGE_KEY, next);
    set({ pet: next });
  },

  hydrate: () => {
    const saved = storage.get<PetState>(STORAGE_KEY);
    if (saved && isValidPetState(saved)) {
      set({ pet: normalizePet(saved) });
    } else if (saved) {
      storage.remove(STORAGE_KEY);
      set({ pet: null });
    }
  },
}));
