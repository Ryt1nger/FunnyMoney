// Шаги обучения при первом входе в приложение (интерактивный тур).
//
// Контент отделён от UI (см. ТЗ п. 3.2): здесь только тексты и то, КАКОЙ
// элемент подсвечивать. Сами элементы помечены в разметке атрибутом
// data-tour="<id>" — оверлей (components/TutorialOverlay.tsx) находит их
// по этому атрибуту, затемняет всё остальное и ставит рядом плашку.
//
// Порядок обхода: сначала главный экран целиком (что где на нём),
// затем разделы нижнего меню (уроки → день → магазин → рейтинг),
// затем кухня, затем гардероб, затем копилка — то есть каждый раз
// доходим до места, коротко объясняем и возвращаемся, прежде чем
// идти дальше.
//
// Тексты — от лица питомца, для детей 6+: коротко (1–2 простых
// предложения), без терминов. {name} подставляется именем питомца.

export type TutorialAction =
  /** показать карточку и кнопку "Дальше" */
  | 'next'
  /** ребёнок должен сам нажать на подсвеченный (настоящий) элемент */
  | 'tap';

export interface TutorialStep {
  id: string;
  /** data-tour id элементов; несколько — подсвечиваются одним общим окошком.
   *  Без targets — карточка по центру экрана (приветствие/финал). */
  targets?: string[];
  title: string;
  text: string;
  action: TutorialAction;
  /** картинка-сцена для центральных карточек */
  scene?: 'wave' | 'heart';
  /** подпись главной кнопки для action: 'next' */
  buttonLabel?: string;
}

export const tutorialSteps: TutorialStep[] = [
  // ─── 1. Приветствие ──────────────────────────────────────────────
  {
    id: 'welcome',
    title: 'Привет! Я {name}!',
    text: 'Теперь я живу у тебя. Давай вместе посмотрим, что тут есть — это быстро!',
    action: 'next',
    scene: 'wave',
    buttonLabel: 'Поехали!',
  },

  // ─── 2. Главный экран (ничего не открываем — просто смотрим) ────
  {
    id: 'home-level',
    targets: ['home-level'],
    title: 'Мой уровень',
    text: 'Это я! Цифра в цветочке — мой уровень. Полоска растёт, когда ты делаешь задания и уроки.',
    action: 'next',
  },
  {
    id: 'home-coins',
    targets: ['home-coins'],
    title: 'Наши монетки',
    text: 'На монетки мы покупаем еду, одежду и игрушки. Плюсик подскажет, как заработать ещё.',
    action: 'next',
  },
  {
    id: 'home-metrics',
    targets: ['home-metrics'],
    title: 'Как я себя чувствую',
    text: 'Сердечко — моё здоровье, смайлик — счастье, мешочек — богатство. Заботься обо мне, чтобы полоски были полными!',
    action: 'next',
  },
  {
    id: 'home-settings',
    targets: ['home-settings'],
    title: 'Настройки',
    text: 'Шестерёнка — тут можно включить и выключить звук и музыку.',
    action: 'next',
  },
  {
    id: 'home-inventory',
    targets: ['home-inventory'],
    title: 'Мой рюкзак',
    text: 'В рюкзаке лежат все вещи, которые ты уже купил.',
    action: 'next',
  },
  {
    id: 'home-kitchen-preview',
    targets: ['home-kitchen'],
    title: 'А это кухня',
    text: 'Здесь я кушаю. Скоро сходим туда покормить меня!',
    action: 'next',
  },
  {
    id: 'home-wardrobe-preview',
    targets: ['home-wardrobe'],
    title: 'А это гардероб',
    text: 'Вешалка — мой шкаф с одеждой, туда мы тоже заглянем.',
    action: 'next',
  },

  // ─── 3. Разделы нижнего меню ─────────────────────────────────────
  {
    id: 'nav-lessons',
    targets: ['nav-lessons'],
    title: 'Уроки',
    text: 'Внизу — главные разделы приложения. Нажми на книжку!',
    action: 'tap',
  },
  {
    id: 'lessons-first',
    targets: ['lessons-first'],
    title: 'Короткие уроки',
    text: 'Каждый урок — это мультик и маленькая игра. За урок дают монетки и звёздочки опыта!',
    action: 'next',
  },
  {
    id: 'nav-day',
    targets: ['nav-day'],
    title: 'Задания дня',
    text: 'Теперь нажми на календарик.',
    action: 'tap',
  },
  {
    id: 'day-streak',
    targets: ['day-streak'],
    title: 'Огонёк серии',
    text: 'Заходи ко мне каждый день — огонёк будет расти. За серию дней подряд ждёт особый подарок!',
    action: 'next',
  },
  {
    id: 'day-tasks',
    targets: ['day-tasks'],
    title: 'Задания',
    text: 'Каждый день тут новые задания. Сделай их и забери награду!',
    action: 'next',
  },
  {
    id: 'nav-shop',
    targets: ['nav-shop'],
    title: 'Магазин',
    text: 'Пойдём за покупками! Нажми на сумку.',
    action: 'tap',
  },
  {
    id: 'shop-categories',
    targets: ['shop-categories'],
    title: 'Что тут есть?',
    text: 'Еда, одежда, игрушки и даже новые комнаты. Нажимай на разделы, чтобы посмотреть.',
    action: 'next',
  },
  {
    id: 'shop-products',
    targets: ['shop-products'],
    title: 'Подумай перед покупкой',
    text: 'Видишь цену? Сначала подумай: мне это нужно, или просто хочется? Если нужно — жми «Купить».',
    action: 'next',
  },
  {
    id: 'nav-stats',
    targets: ['nav-stats'],
    title: 'Рейтинг',
    text: 'Ещё один раздел! Нажми на него.',
    action: 'tap',
  },
  {
    id: 'stats-podium',
    targets: ['stats-podium'],
    title: 'Кто больше старается',
    text: 'Тут ребята, которые больше всех занимаются. Проходи уроки и задания — и ты поднимешься выше!',
    action: 'next',
  },
  {
    id: 'nav-home',
    targets: ['nav-home'],
    title: 'Домой',
    text: 'Нажми на домик, чтобы вернуться ко мне.',
    action: 'tap',
  },

  // ─── 4. Кухня ─────────────────────────────────────────────────────
  {
    id: 'home-kitchen',
    targets: ['home-kitchen'],
    title: 'Идём кушать',
    text: 'Ой, я проголодался! Нажми на ложку с вилкой.',
    action: 'tap',
  },
  {
    id: 'kitchen-food',
    targets: ['kitchen-food'],
    title: 'Покорми меня',
    text: 'Вот моя еда. Возьми её пальцем и перетащи мне в рот!',
    action: 'next',
  },
  {
    id: 'kitchen-shop',
    targets: ['kitchen-shop'],
    title: 'Если еды нет',
    text: 'Нажми на корзинку — она отведёт прямо в магазин за едой.',
    action: 'next',
  },
  {
    id: 'kitchen-home',
    targets: ['kitchen-home'],
    title: 'Обратно в комнату',
    text: 'Нажми на домик, чтобы вернуться в комнату.',
    action: 'tap',
  },

  // ─── 5. Гардероб ──────────────────────────────────────────────────
  {
    id: 'home-wardrobe',
    targets: ['home-wardrobe'],
    title: 'Мой шкаф',
    text: 'Нажми на рюкзак — покажу свою одежду.',
    action: 'tap',
  },
  {
    id: 'wardrobe-overview',
    targets: ['wardrobe-overview'],
    title: 'Наряди меня',
    text: 'Выбирай вещи и одевай меня, как хочешь! Серые вещи ещё нужно купить в магазине.',
    action: 'next',
  },
  {
    id: 'wardrobe-back',
    targets: ['wardrobe-back'],
    title: 'Готово',
    text: 'Нажми на стрелку, чтобы выйти.',
    action: 'tap',
  },

  // ─── 6. Копилка ───────────────────────────────────────────────────
  {
    id: 'home-piggy',
    targets: ['home-piggy'],
    title: 'Копилка',
    text: 'А это моя копилка! Нажми на неё, заглянем внутрь.',
    action: 'tap',
  },
  {
    id: 'piggy-balance',
    targets: ['piggy-balance'],
    title: 'Кошелёк и копилка',
    text: 'Слева — монетки на покупки. Справа — монетки в копилке.',
    action: 'next',
  },
  {
    id: 'piggy-transfer',
    targets: ['piggy-transfer'],
    title: 'Перекладываем монетки',
    text: 'Этими кнопками можно перекладывать монетки туда-сюда.',
    action: 'next',
  },
  {
    id: 'piggy-goal',
    targets: ['piggy-goal'],
    title: 'Моя мечта',
    text: 'Выбери, о чём мечтаешь, и копи понемногу. Полоска покажет, сколько ещё осталось!',
    action: 'next',
  },
  {
    id: 'piggy-back',
    targets: ['piggy-back'],
    title: 'Назад',
    text: 'Нажми на стрелку, чтобы выйти из копилки.',
    action: 'tap',
  },

  // ─── 7. Финал ─────────────────────────────────────────────────────
  {
    id: 'finish',
    title: 'Ура, ты всё знаешь!',
    text: 'Теперь заботься обо мне каждый день. Начни с заданий дня! Показать это обучение снова можно в настройках.',
    action: 'next',
    scene: 'heart',
    buttonLabel: 'Играть!',
  },
];
