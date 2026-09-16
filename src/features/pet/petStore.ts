import { create } from 'zustand';
import type { PetSpecies, PetState } from '../../types';
import { storage } from '../../services/storage';

interface PetStore {
  pet: PetState | null;
  createPet: (species: PetSpecies, name: string) => void;
  applyDelta: (delta: { health?: number; happiness?: number }) => void;
  setMood: (mood: PetState['mood']) => void;
  renamePet: (name: string) => void;
  /** Перечитывает состояние из storage — реальная проверка на межстраничном экране загрузки. */
  hydrate: () => void;
}

const STORAGE_KEY = 'pet';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
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

function loadInitial(): PetState | null {
  const saved = storage.get<PetState>(STORAGE_KEY);
  return saved && isValidPetState(saved) ? saved : null;
}

export const usePetStore = create<PetStore>((set, get) => ({
  pet: loadInitial(),

  createPet: (species, name) => {
    const pet: PetState = {
      id: crypto.randomUUID(),
      species,
      name,
      level: 1,
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
      set({ pet: saved });
    } else if (saved) {
      storage.remove(STORAGE_KEY);
      set({ pet: null });
    }
  },
}));
