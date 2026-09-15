// Простые плоские SVG-мордочки для лидерборда — вместо эмодзи (те по-разному
// центрируются в разных ОС/шрифтах и выглядели "криво"). Каждая мордочка
// нарисована в единой сетке 100x100, поэтому все аватарки ровно по центру.
import type { ReactNode } from 'react';

export type AnimalSpecies = 'fox' | 'panda' | 'cat' | 'rabbit' | 'dog' | 'penguin' | 'frog';

interface Props {
  species: AnimalSpecies;
  className?: string;
}

export default function AnimalAvatar({ species, className }: Props) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {FACES[species]}
    </svg>
  );
}

const FACES: Record<AnimalSpecies, ReactNode> = {
  fox: (
    <g>
      <path d="M20 22 L38 40 L20 46 Z" fill="#e8823a" />
      <path d="M80 22 L62 40 L80 46 Z" fill="#e8823a" />
      <path d="M25 27 L36 39 L25 41 Z" fill="#fbe4c8" />
      <path d="M75 27 L64 39 L75 41 Z" fill="#fbe4c8" />
      <circle cx="50" cy="55" r="30" fill="#f2955a" />
      <path d="M50 60 C36 60 30 72 40 80 C45 84 55 84 60 80 C70 72 64 60 50 60Z" fill="#fff6ea" />
      <circle cx="40" cy="52" r="4.5" fill="#3a2a20" />
      <circle cx="60" cy="52" r="4.5" fill="#3a2a20" />
      <path d="M50 66 L45 71 L55 71 Z" fill="#3a2a20" />
    </g>
  ),
  panda: (
    <g>
      <circle cx="24" cy="26" r="14" fill="#2b2b2f" />
      <circle cx="76" cy="26" r="14" fill="#2b2b2f" />
      <circle cx="50" cy="55" r="30" fill="#f7f7f5" />
      <ellipse cx="37" cy="52" rx="10" ry="12" fill="#2b2b2f" />
      <ellipse cx="63" cy="52" rx="10" ry="12" fill="#2b2b2f" />
      <circle cx="37" cy="54" r="3.4" fill="#fff" />
      <circle cx="63" cy="54" r="3.4" fill="#fff" />
      <ellipse cx="50" cy="68" rx="4.5" ry="3.4" fill="#2b2b2f" />
    </g>
  ),
  cat: (
    <g>
      <path d="M22 18 L40 38 L20 42 Z" fill="#f2a93c" />
      <path d="M78 18 L60 38 L80 42 Z" fill="#f2a93c" />
      <path d="M26 24 L37 37 L25 38 Z" fill="#fbd9a0" />
      <path d="M74 24 L63 37 L75 38 Z" fill="#fbd9a0" />
      <circle cx="50" cy="55" r="30" fill="#f6b955" />
      <path d="M50 60 C38 60 34 70 42 77 C46 80 54 80 58 77 C66 70 62 60 50 60Z" fill="#fff3dc" />
      <ellipse cx="39" cy="52" rx="3.6" ry="5" fill="#3a2a20" />
      <ellipse cx="61" cy="52" rx="3.6" ry="5" fill="#3a2a20" />
      <path d="M50 65 L46 69 L54 69 Z" fill="#c9678a" />
    </g>
  ),
  rabbit: (
    <g>
      <path d="M32 8 C24 8 22 26 26 44 C28 50 38 50 39 42 C41 28 40 8 32 8Z" fill="#d9cdee" />
      <path d="M34 14 C29 14 28 27 30 40 C31 44 36 44 37 39 C38 29 38 14 34 14Z" fill="#f4eefc" />
      <path d="M68 8 C76 8 78 26 74 44 C72 50 62 50 61 42 C59 28 60 8 68 8Z" fill="#d9cdee" />
      <path d="M66 14 C71 14 72 27 70 40 C69 44 64 44 63 39 C62 29 62 14 66 14Z" fill="#f4eefc" />
      <circle cx="50" cy="58" r="28" fill="#ece5f8" />
      <circle cx="40" cy="56" r="4" fill="#3a2a20" />
      <circle cx="60" cy="56" r="4" fill="#3a2a20" />
      <ellipse cx="50" cy="68" rx="3.6" ry="2.8" fill="#c9899e" />
    </g>
  ),
  dog: (
    <g>
      <path d="M14 30 C10 46 18 60 30 58 C32 44 28 30 20 22 Z" fill="#a9713f" />
      <path d="M86 30 C90 46 82 60 70 58 C68 44 72 30 80 22 Z" fill="#a9713f" />
      <circle cx="50" cy="56" r="29" fill="#e3b47c" />
      <path d="M50 62 C39 62 34 72 42 79 C46 82 54 82 58 79 C66 72 61 62 50 62Z" fill="#fbf1e2" />
      <circle cx="39" cy="53" r="4.2" fill="#3a2a20" />
      <circle cx="61" cy="53" r="4.2" fill="#3a2a20" />
      <ellipse cx="50" cy="66" rx="5" ry="3.6" fill="#3a2a20" />
    </g>
  ),
  penguin: (
    <g>
      <circle cx="50" cy="52" r="32" fill="#2c3444" />
      <ellipse cx="50" cy="60" rx="20" ry="23" fill="#f4f6f8" />
      <circle cx="41" cy="50" r="3.8" fill="#2c3444" />
      <circle cx="59" cy="50" r="3.8" fill="#2c3444" />
      <path d="M50 58 L43 65 L57 65 Z" fill="#e8912f" />
    </g>
  ),
  frog: (
    <g>
      <circle cx="32" cy="28" r="14" fill="#8bc76a" />
      <circle cx="68" cy="28" r="14" fill="#8bc76a" />
      <circle cx="32" cy="28" r="7" fill="#2b2b2f" />
      <circle cx="68" cy="28" r="7" fill="#2b2b2f" />
      <ellipse cx="50" cy="58" rx="30" ry="26" fill="#9ed67f" />
      <path d="M32 62 C40 70 60 70 68 62" stroke="#2b2b2f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </g>
  ),
};
