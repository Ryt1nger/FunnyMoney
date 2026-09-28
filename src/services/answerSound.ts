import correctSrc from '../assets/audio/correct-answer.mp3';
import wrongSrc from '../assets/audio/wrong-answer.mp3';
import { useSettingsStore } from '../features/settings/settingsStore';

// Звуки правильного/неправильного ответа в практике уроков — реальные
// записи (как в feedSound.ts), а не синтезированные тона из soundEffects.ts.
// Два отдельных <audio>, чтобы быстрый повторный "Проверить" (неверно →
// сразу исправил → верно) не обрывал уже начатое воспроизведение другого звука.
let correctAudio: HTMLAudioElement | null = null;
let wrongAudio: HTMLAudioElement | null = null;

function getAudio(kind: 'correct' | 'wrong'): HTMLAudioElement {
  if (kind === 'correct') {
    if (!correctAudio) {
      correctAudio = new Audio(correctSrc);
      correctAudio.preload = 'auto';
    }
    return correctAudio;
  }
  if (!wrongAudio) {
    wrongAudio = new Audio(wrongSrc);
    wrongAudio.preload = 'auto';
  }
  return wrongAudio;
}

function play(kind: 'correct' | 'wrong') {
  if (!useSettingsStore.getState().soundsEnabled) return;
  const el = getAudio(kind);
  try {
    el.currentTime = 0;
    el.play().catch(() => {
      // Автоплей заблокирован без жеста — проверка ответа и так происходит
      // по нажатию кнопки, так что это маловероятно, но на всякий случай
      // тихо игнорируем.
    });
  } catch {
    // ignore — звук не критичен для игры
  }
}

/** Проигрывает звук правильного ответа в практике урока. */
export function playCorrectAnswerSound() {
  play('correct');
}

/** Проигрывает звук неправильного ответа в практике урока. */
export function playWrongAnswerSound() {
  play('wrong');
}
