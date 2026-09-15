import { create } from 'zustand';
import type { PetSpecies, PetState } from '../../types';
import { storage } from '../../services/storage';

interface PetStore {
  pet: PetState | null;
  createPet: (species: PetSpecies, name: string) => void;
  applyDelta: (delta: { health?: number; happiness?: number }) => void;
  setMood: (mood: PetState['mood']) => void;
}

const STORAGE_KEY = 'pet';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export const usePetStore = create<PetStore>((set, get) => ({
  pet: storage.get<PetState>(STORAGE_KEY),

  createPet: (species, name) => {
    const pet: PetState = {
      id: crypto.randomUUID(),
      species,
      name,
      level: 1,
      health: 100,
      happiness: 100,
      mood: 'happy',
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
}));
