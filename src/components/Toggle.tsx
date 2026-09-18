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
      className="relative h-[27px] w-[46px] shrink-0 rounded-full transition-colors duration-200"
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
        className="absolute top-[2.5px] h-[22px] w-[22px] rounded-full bg-white shadow-md transition-transform duration-200"
        style={{ transform: checked ? 'translateX(21px)' : 'translateX(3px)' }}
      />
    </button>
  );
}
