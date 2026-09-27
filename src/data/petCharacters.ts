import bear1 from '../assets/pet/characters/bear-1.png';
import bear2 from '../assets/pet/characters/bear-2.png';
import bear3 from '../assets/pet/characters/bear-3.png';
import bear4 from '../assets/pet/characters/bear-4.png';
import bear5 from '../assets/pet/characters/bear-5.png';
import bear6 from '../assets/pet/characters/bear-6.png';
import bear7 from '../assets/pet/characters/bear-7.png';
import bear8 from '../assets/pet/characters/bear-8.png';
import bear9 from '../assets/pet/characters/bear-9.png';
// Тот же мишка в позе "стоит, руки вниз" — для главного экрана и аватарки в
// шапке (кухня, прогресс и т.д.). Цвет худи/костюма подобран под ту же
// картинку, что ребёнок выбрал на онбординге (см. bear-N выше).
import main1 from '../assets/pet/main/bear-main-1.png';
import main2 from '../assets/pet/main/bear-main-2.png';
import main3 from '../assets/pet/main/bear-main-3.png';
import main4 from '../assets/pet/main/bear-main-4.png';
import main5 from '../assets/pet/main/bear-main-5.png';
import main6 from '../assets/pet/main/bear-main-6.png';
import main7 from '../assets/pet/main/bear-main-7.png';
import main8 from '../assets/pet/main/bear-main-8.png';
import main9 from '../assets/pet/main/bear-main-9.png';
import avatar1 from '../assets/pet/main/bear-avatar-1.png';
import avatar2 from '../assets/pet/main/bear-avatar-2.png';
import avatar3 from '../assets/pet/main/bear-avatar-3.png';
import avatar4 from '../assets/pet/main/bear-avatar-4.png';
import avatar5 from '../assets/pet/main/bear-avatar-5.png';
import avatar6 from '../assets/pet/main/bear-avatar-6.png';
import avatar7 from '../assets/pet/main/bear-avatar-7.png';
import avatar8 from '../assets/pet/main/bear-avatar-8.png';
import avatar9 from '../assets/pet/main/bear-avatar-9.png';

export interface PetCharacter {
  id: string;
  /** Картинка на экране выбора при онбординге (мишка с раскрытыми лапами). */
  image: string;
  /** Тот же мишка в позе "стоит" — большая картинка на главном экране. */
  mainImage: string;
  /** Круглая аватарка (шапка на главной, кухне и т.д.). */
  avatarImage: string;
}

// 9 визуальных вариантов медвежонка для экрана выбора персонажа при онбординге.
export const PET_CHARACTERS: PetCharacter[] = [
  { id: 'bear-1', image: bear1, mainImage: main1, avatarImage: avatar1 },
  { id: 'bear-2', image: bear2, mainImage: main2, avatarImage: avatar2 },
  { id: 'bear-3', image: bear3, mainImage: main3, avatarImage: avatar3 },
  { id: 'bear-4', image: bear4, mainImage: main4, avatarImage: avatar4 },
  { id: 'bear-5', image: bear5, mainImage: main5, avatarImage: avatar5 },
  { id: 'bear-6', image: bear6, mainImage: main6, avatarImage: avatar6 },
  { id: 'bear-7', image: bear7, mainImage: main7, avatarImage: avatar7 },
  { id: 'bear-8', image: bear8, mainImage: main8, avatarImage: avatar8 },
  { id: 'bear-9', image: bear9, mainImage: main9, avatarImage: avatar9 },
];

export const DEFAULT_CHARACTER_ID = PET_CHARACTERS[0].id;

export function getCharacterById(id?: string): PetCharacter {
  return PET_CHARACTERS.find((c) => c.id === id) ?? PET_CHARACTERS[0];
}
