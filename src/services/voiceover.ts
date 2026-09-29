import { VOICE_SEGMENTS } from './voiceoverSegments';
import { VOICE_PHRASES } from './voiceoverPhrases';
import { setVoiceoverActive } from './musicFade';

const TRACKS = [
  '/audio/voiceover/part-1.mp3',
  '/audio/voiceover/part-2.mp3',
  '/audio/voiceover/part-3.mp3',
] as const;

let player: HTMLAudioElement | null = null;
let stopTimer: number | null = null;
let queue: number[] = [];
let pendingPlayback: (() => void) | null = null;
// Номер актуального запуска. Метаданные старого HTMLAudioElement могут
// прийти уже после перехода на другой экран; такой callback нельзя пускать в
// эфир, иначе старая фраза внезапно начинает звучать поверх нового экрана.
let playbackToken = 0;

function isVoiceoverBlocked(): boolean {
  return typeof document !== 'undefined' && Boolean(document.querySelector('[data-voiceover-blocking="true"]'));
}

if (typeof window !== 'undefined') {
  window.addEventListener('voiceover-ready', () => {
    const playback = pendingPlayback;
    pendingPlayback = null;
    if (playback && !isVoiceoverBlocked()) playback();
  });
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('ru-RU')
    .replace(/мани\w*/g, 'мишк')
    .replace(/мишк\w*/g, 'мишк')
    .replace(/[«»„“”"'.,!?—–:;()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const aa = new Set(a.split(' '));
  const bb = new Set(b.split(' '));
  const common = [...aa].filter((token) => bb.has(token)).length;
  return common / Math.max(aa.size, bb.size);
}

/** Finds the recorded phrase and returns its global clip number. */
export function findVoicePhrase(text: string): number | null {
  const query = normalize(text);
  if (!query) return null;
  let best = { index: -1, score: 0 };
  VOICE_PHRASES.forEach((phrase, index) => {
    const score = similarity(query, normalize(phrase));
    if (score > best.score) best = { index, score };
  });
  return best.score >= 0.55 ? best.index : null;
}

function locate(globalIndex: number): { track: string; segment: readonly [number, number] } | null {
  // VOICE_SEGMENTS и VOICE_PHRASES синхронизированы одним плоским индексом.
  // Важно не делать никаких ручных сдвигов: после 25-й фразы в первой
  // дорожке есть обычные сегменты, а не пропуски.
  const normalizedIndex = globalIndex;
  let offset = 0;
  for (let trackIndex = 0; trackIndex < VOICE_SEGMENTS.length; trackIndex += 1) {
    const segments = VOICE_SEGMENTS[trackIndex];
    if (normalizedIndex < offset + segments.length) {
      return { track: TRACKS[trackIndex], segment: segments[normalizedIndex - offset] };
    }
    offset += segments.length;
  }
  return null;
}

export function stopVoiceover(): void {
  playbackToken += 1;
  queue = [];
  pendingPlayback = null;
  if (stopTimer !== null) window.clearTimeout(stopTimer);
  stopTimer = null;
  if (player) {
    player.pause();
    player.currentTime = 0;
  }
  setVoiceoverActive(false);
}

export function playVoiceSequence(indices: readonly (number | null)[]): void {
  if (isVoiceoverBlocked()) {
    pendingPlayback = () => playVoiceSequence(indices);
    return;
  }
  queue = indices.filter((index): index is number => index !== null);
  const next = queue.shift();
  if (next === undefined) return;
  const located = locate(next);
  if (!located || typeof window === 'undefined') return;
  stopVoiceover();
  queue = indices.filter((index): index is number => index !== null).slice(1);
  const audio = new Audio(located.track);
  player = audio;
  const token = playbackToken;
  const [start, end] = located.segment;
  const play = () => {
    if (token !== playbackToken || player !== audio) return;
    audio.currentTime = start;
    setVoiceoverActive(true);
    void audio.play().catch(() => undefined);
    stopTimer = window.setTimeout(() => {
      if (token !== playbackToken || player !== audio) return;
      const following = queue.shift();
      if (following === undefined) {
        stopVoiceover();
      } else {
        playVoiceSequence([following, ...queue]);
      }
    }, Math.max(100, (end - start) * 1000));
  };
  audio.addEventListener('loadedmetadata', play, { once: true });
  audio.load();
}

export function playVoiceClip(globalIndex: number | null): void {
  if (globalIndex === null || typeof window === 'undefined') return;
  if (isVoiceoverBlocked()) {
    pendingPlayback = () => playVoiceClip(globalIndex);
    return;
  }
  const located = locate(globalIndex);
  if (!located) return;
  stopVoiceover();
  const audio = new Audio(located.track);
  player = audio;
  const token = playbackToken;
  const [start, end] = located.segment;
  const play = () => {
    if (token !== playbackToken || player !== audio) return;
    audio.currentTime = start;
    setVoiceoverActive(true);
    void audio.play().catch(() => undefined);
    stopTimer = window.setTimeout(() => {
      if (token === playbackToken && player === audio) stopVoiceover();
    }, Math.max(100, (end - start) * 1000));
  };
  audio.addEventListener('loadedmetadata', play, { once: true });
  audio.load();
}

export function playVoicePhrase(text: string): void {
  playVoiceClip(findVoicePhrase(text));
}

/** Plays a dedicated recording that is not part of the phrase sequence. */
export function playStandaloneVoice(source: string, delayMs = 120): void {
  if (typeof window === 'undefined') return;
  if (isVoiceoverBlocked()) {
    pendingPlayback = () => playStandaloneVoice(source, delayMs);
    return;
  }
  stopVoiceover();
  stopTimer = window.setTimeout(() => {
    player = new Audio(source);
    setVoiceoverActive(true);
    player.addEventListener('ended', stopVoiceover, { once: true });
    void player.play().catch(() => undefined);
  }, delayMs);
}
