// Перемешивание массива (Фишер—Йейтс) — используется, чтобы карточки/варианты
// ответов в практике уроков не всегда стояли в одном и том же порядке
// (иначе ребёнок может запомнить позицию правильного ответа, а не думать над
// заданием). Возвращает новый массив, исходный не трогает.
export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
