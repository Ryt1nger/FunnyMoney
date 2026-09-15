// Единый набор простых плоских SVG-иконок для интерфейса.
// Эмодзи/стикеры в UI не используются — только эти иконки.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function IconHome(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3.1 2.6 11.2c-.4.4-.1 1.1.5 1.1h1.6v7.1c0 .8.6 1.4 1.4 1.4h11.8c.8 0 1.4-.6 1.4-1.4v-7.1h1.6c.6 0 .9-.7.5-1.1L12 3.1Z" />
    </svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M11.1 6.6C9.3 5.2 7 4.4 4.6 4.4c-.6 0-1.2 0-1.7.1-.5.1-.9.5-.9 1v11.1c0 .6.6 1.1 1.2 1 .5-.1 1-.1 1.4-.1 2.3 0 4.5.8 6.5 2.2V6.6Z" />
      <path d="M12.9 6.6c1.8-1.4 4.1-2.2 6.5-2.2.6 0 1.2 0 1.7.1.5.1.9.5.9 1v11.1c0 .6-.6 1.1-1.2 1-.5-.1-1-.1-1.4-.1-2.3 0-4.5.8-6.5 2.2V6.6Z" />
    </svg>
  );
}

export function IconCalendar(props: IconProps & { dot?: boolean }) {
  const { dot, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...rest}>
      <path d="M7.4 2.4c.5 0 .9.4.9.9v1.1h6.4V3.3c0-.5.4-.9.9-.9s.9.4.9.9v1.1h1.1c1.2 0 2.1.9 2.1 2.1v1.4H4.3V6.5c0-1.2.9-2.1 2.1-2.1h1.1V3.3c0-.5.4-.9.9-.9Z" />
      <path d="M4.3 9.7h15.4v9.1c0 1.2-.9 2.1-2.1 2.1H6.4c-1.2 0-2.1-.9-2.1-2.1V9.7Zm3 2.6a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm4.7 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm4.7 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm-9.4 4a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm4.7 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" />
      {dot && <circle cx="19" cy="5.4" r="3.1" fill="#ef4444" />}
    </svg>
  );
}

export function IconShop(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3.6 5.6C3.9 4.8 4.6 4.3 5.4 4.3h13.2c.8 0 1.5.5 1.8 1.3l1.1 2.9c.2.5-.2 1.1-.8 1.1H3.3c-.6 0-1-.6-.8-1.1l1.1-2.9Z" />
      <path d="M4.6 11.1h14.8v7.7c0 1-.8 1.9-1.9 1.9h-2.9v-4.3c0-.6-.5-1.1-1.1-1.1h-3c-.6 0-1.1.5-1.1 1.1v4.3H6.5c-1 0-1.9-.8-1.9-1.9v-7.7Z" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="3.2" y="13.4" width="4.6" height="7.4" rx="1.6" />
      <rect x="9.7" y="9" width="4.6" height="11.8" rx="1.6" />
      <rect x="16.2" y="3.9" width="4.6" height="16.9" rx="1.6" />
    </svg>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 20.5s-7.5-4.6-9.9-9.3C.6 7.9 2 4.5 5.2 3.7c2-.5 3.9.3 5 1.9a1 1 0 0 0 1.6 0c1.1-1.6 3-2.4 5-1.9 3.2.8 4.6 4.2 3.1 7.5-2.4 4.7-9.9 9.3-9.9 9.3Z" />
    </svg>
  );
}

export function IconSmile(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10.5" r="1.1" fill="currentColor" />
      <circle cx="15" cy="10.5" r="1.1" fill="currentColor" />
      <path d="M8.3 14.2c1 1.2 2.3 1.8 3.7 1.8s2.7-.6 3.7-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconCoinStack(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="2.7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 6v5c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7V6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 11v5c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7v-5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconGift(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="10" width="16" height="9.5" rx="1.5" fill="#4f46e5" />
      <rect x="4" y="10" width="16" height="3" fill="#6366f1" />
      <rect x="4" y="9.5" width="16" height="1.6" rx="0.5" fill="#e5e7eb" />
      <rect x="10.9" y="9.5" width="2.2" height="10" fill="#ef4444" />
      <path
        d="M12 9.5c0-2.3-1.7-4.2-3.8-4.2-1.3 0-2.2.9-2.2 2.1 0 1.2 1.1 2.1 2.4 2.1H12ZM12 9.5c0-2.3 1.7-4.2 3.8-4.2 1.3 0 2.2.9 2.2 2.1 0 1.2-1.1 2.1-2.4 2.1H12Z"
        fill="#f87171"
      />
    </svg>
  );
}

export function IconFlame(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12.5 2c.6 3-1.7 4-2.7 6-.8 1.6-.3 2.8.3 3.6-1.4-.3-2.6-1.4-3-2.7C5.3 11 4.5 13 4.5 14.8 4.5 19 8 21.5 12 21.5s7.5-2.5 7.5-6.7c0-3.3-1.9-6.1-4.2-8-.1 1.4-.7 2.4-1.6 3 .4-2.7-.3-5.4-1.2-7.8Z"
        fill="#f97316"
      />
      <path
        d="M12.3 8.5c.3 1.7-.8 2.4-1.4 3.5-.6 1.1-.2 2 .4 2.6-1-.2-1.7-1-2-1.9-.9 1.2-1.3 2.4-1.3 3.5 0 2.7 2.1 4.3 4.5 4.3s4.5-1.6 4.5-4.3c0-1.8-.9-3.4-2.1-4.6.1.8-.2 1.4-.7 1.8.2-1.6-.3-3.4-1-4.5- 4.9Z"
        fill="#fbbf24"
      />
      <path
        d="M12.4 13.2c.1.9-.4 1.3-.8 1.9-.4.6-.1 1.1.3 1.4-.6-.1-1-.6-1.1-1.1-.5.7-.7 1.4-.7 2 0 1.5 1.2 2.4 2.6 2.4s2.6-.9 2.6-2.4c0-1-.5-1.9-1.2-2.6 0 .4-.1.8-.4 1 .1-.9-.2-1.9-1.3-2.6Z"
        fill="#fde68a"
      />
    </svg>
  );
}

export function IconStar(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <defs>
        <linearGradient id="starGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd766" />
          <stop offset="55%" stopColor="#fbbe3c" />
          <stop offset="100%" stopColor="#eda21f" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.6l2.7 5.6 6.1.8c.8.1 1.1 1.1.5 1.7l-4.5 4.2 1.1 6.1c.1.8-.7 1.4-1.4 1L12 19.1l-5.5 2.9c-.7.4-1.5-.2-1.4-1l1.1-6.1L1.7 10.7c-.6-.6-.3-1.6.5-1.7l6.1-.8L12 2.6Z"
        fill="url(#starGold)"
        stroke="#d9901a"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// Игрушка-косточка с лапкой — рисованная иконка предмета (референс: событие дня)
export function IconBoneToy(props: IconProps) {
  return (
    <svg viewBox="0 0 84 54" fill="none" {...props}>
      <g transform="rotate(-16 42 27)">
        {/* нижняя грань для объёма */}
        <g transform="translate(0,3.5)" fill="#2f80c2">
          <circle cx="15" cy="16" r="12" />
          <circle cx="15" cy="38" r="12" />
          <circle cx="69" cy="16" r="12" />
          <circle cx="69" cy="38" r="12" />
          <rect x="13" y="16" width="58" height="22" rx="11" />
        </g>
        {/* основная форма */}
        <g fill="#4fa8ea">
          <circle cx="15" cy="16" r="12" />
          <circle cx="15" cy="38" r="12" />
          <circle cx="69" cy="16" r="12" />
          <circle cx="69" cy="38" r="12" />
          <rect x="13" y="16" width="58" height="22" rx="11" />
        </g>
        {/* блики */}
        <ellipse cx="20" cy="10" rx="7" ry="3.2" fill="#8fcdf6" opacity="0.8" />
        <ellipse cx="66" cy="9.5" rx="5" ry="2.4" fill="#8fcdf6" opacity="0.6" />
        {/* лапка */}
        <g fill="#f7c948">
          <ellipse cx="42" cy="31" rx="8" ry="6.4" />
          <circle cx="34" cy="21" r="3.3" />
          <circle cx="40" cy="18.4" r="3.6" />
          <circle cx="45.6" cy="18.4" r="3.6" />
          <circle cx="51" cy="21" r="3.3" />
        </g>
      </g>
    </svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconApple(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.2 12.6c0-2 1.5-3 1.6-3.1-0.9-1.3-2.3-1.5-2.8-1.5-1.2-.1-2.3.7-2.9.7s-1.5-.7-2.5-.7c-1.3 0-2.5.8-3.1 1.9-1.3 2.3-.3 5.7 1 7.6.6.9 1.4 1.9 2.4 1.9.9 0 1.3-.6 2.4-.6s1.4.6 2.4.6c1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2.1-.1 0-2-.8-2-3z" />
      <path d="M14.3 6.4c.5-.6.9-1.5.8-2.4-.8 0-1.7.5-2.3 1.2-.5.6-.9 1.5-.8 2.3.9.1 1.8-.4 2.3-1.1z" />
    </svg>
  );
}

export function IconPiggy(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.3 10.2c-.3-.6-.7-1.1-1.2-1.6l.7-2.6-2.5.9c-1-.5-2.2-.8-3.5-.8-1.6 0-3 .4-4.2 1.1L6.4 5.6l.5 2.7C5.7 9.3 5 10.6 5 12H3.8c-.4 0-.8.4-.8.8v2c0 .4.4.8.8.8H5c.4.9 1.1 1.7 2 2.3V20c0 .4.4.8.8.8h1.9c.4 0 .8-.4.8-.8v-.9c.5.1 1 .1 1.5.1s1 0 1.5-.1v.9c0 .4.4.8.8.8h1.9c.4 0 .8-.4.8-.8v-2.1c1.5-1 2.5-2.5 2.5-4.2 0-.6-.1-1.1-.3-1.6h.6c.3 0 .6-.3.6-.6v-1c0-.2-.2-.3-.4-.3h-.7z" />
      <circle cx="15.5" cy="12" r="1.1" fill="#fff" />
    </svg>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18 7H5.8c-.5 0-.8-.4-.8-.8s.3-.8.8-.8H18a1 1 0 0 0 0-2H5.8C4.2 3.4 3 4.6 3 6.2V18a2.6 2.6 0 0 0 2.6 2.6H18A2 2 0 0 0 20 18.6v-1.4h-4.5a2.7 2.7 0 0 1 0-5.4H20V9a2 2 0 0 0-2-2z" />
      <path d="M15.5 13.3H21v2.4h-5.5a1.2 1.2 0 0 1 0-2.4z" />
    </svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3.5 4a1 1 0 0 0 0 2h1.2l2.3 8.6a2.4 2.4 0 0 0 2.3 1.8h7.4a2.4 2.4 0 0 0 2.3-1.7l1.7-5.9A1 1 0 0 0 19.8 7.5H6.9l-.5-1.9A2 2 0 0 0 4.5 4h-1z" />
      <circle cx="10" cy="19.5" r="1.7" />
      <circle cx="17" cy="19.5" r="1.7" />
    </svg>
  );
}

export function IconFlag(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M5.5 2.6c.5 0 .9.4.9.9v17c0 .5-.4.9-.9.9s-.9-.4-.9-.9v-17c0-.5.4-.9.9-.9Z" />
      <path d="M6.4 4.1c1.7-.8 3.5-.8 5.2 0 1.8.8 3.6.8 5.4 0 .6-.3 1.3.2 1.3.8v7.4c0 .4-.2.7-.6.9-1.9.9-3.9.9-5.8 0-1.7-.8-3.5-.8-5.2 0-.1 0-.2.1-.3.1V4.1Z" />
    </svg>
  );
}

// Миска с едой — задание «покорми питомца»
export function IconBowl(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M3.2 12.2h17.6c.3 0 .5.2.4.5-.4 3.8-3.7 6.7-7.6 6.7h-3.2c-3.9 0-7.2-2.9-7.6-6.7-.1-.3.1-.5.4-.5Z"
        fill="currentColor"
      />
      <path d="M6.4 10.4c0-1.9 2.5-3.4 5.6-3.4s5.6 1.5 5.6 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8.2" cy="5.3" r="1.3" fill="currentColor" />
      <circle cx="12" cy="4.3" r="1.3" fill="currentColor" />
      <circle cx="15.8" cy="5.3" r="1.3" fill="currentColor" />
    </svg>
  );
}

// Геймпад — задание «поиграй с питомцем»
export function IconGamepad(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.8 6.6h10.4c2.5 0 4.4 2.2 4 4.6l-.9 5.3c-.3 1.9-2.5 2.8-4 1.6l-1.7-1.4a2.6 2.6 0 0 0-1.6-.6H9c-.6 0-1.2.2-1.6.6l-1.7 1.4c-1.5 1.2-3.7.3-4-1.6l-.9-5.3c-.4-2.4 1.5-4.6 4-4.6Z" />
      <g fill="#fff">
        <rect x="5.4" y="9.9" width="1.4" height="4" rx="0.7" />
        <rect x="3.9" y="11.4" width="4" height="1.4" rx="0.7" />
        <circle cx="15.4" cy="10.4" r="1.1" />
        <circle cx="18" cy="12.6" r="1.1" />
      </g>
    </svg>
  );
}

// Полумесяц — задание «уложи спать»
export function IconMoon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20 14.4A8.6 8.6 0 1 1 9.6 4a7 7 0 0 0 10.4 10.4Z" />
      <circle cx="17.5" cy="6.3" r="0.8" fill="currentColor" opacity="0.7" />
      <circle cx="19.6" cy="9.2" r="0.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// Галочка выполненного задания
export function IconCheck(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M5 12.5l4.2 4.2L19 6.8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShieldCrown(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.2 19.5 5v6.2c0 4.7-3.1 8.5-7.5 10.6-4.4-2.1-7.5-5.9-7.5-10.6V5L12 2.2Z" />
      <path
        d="M8 10.4l.9 3.6h6.2l.9-3.6-2 1.3-2-2.3-2 2.3-2-1.3Z"
        fill="#fff"
      />
    </svg>
  );
}
