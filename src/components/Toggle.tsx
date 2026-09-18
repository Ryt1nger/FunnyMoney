interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  'aria-label'?: string;
}

const VIOLET = 'linear-gradient(180deg, #8b88f4 0%, #7574f0 45%, #6262e4 100%)';

/** Переключатель настроек — тот же фиолетовый акцент, что и активные элементы интерфейса. */
export default function Toggle({ checked, onChange, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      // appearance-none/border-0/p-0/box-border сбрасывают нативные стили <button>
      // (в некоторых браузерах у кнопки по умолчанию есть рамка и внутренний
      // паддинг — из-за них трек считался шире/выше, чем на самом деле рисовался,
      // и бегунок оказывался смещён и торчал за пределы капсулы).
      className="relative box-border inline-flex h-[27px] w-[46px] shrink-0 appearance-none items-center rounded-full border-0 p-0 outline-none transition-colors duration-200"
      style={{
        background: checked ? undefined : '#e2d6c2',
        backgroundImage: checked ? VIOLET : undefined,
        boxShadow: checked
          ? 'inset 0 1px 2px rgba(45,40,120,0.35)'
          : 'inset 0 1px 2px rgba(120,100,70,0.22)',
      }}
      {...rest}
    >
      <span
        className="pointer-events-none block h-[22px] w-[22px] rounded-full bg-white shadow-md transition-transform duration-200"
        style={{ transform: checked ? 'translateX(21px)' : 'translateX(3px)' }}
      />
    </button>
  );
}
