interface Props {
  /** PNG-силуэт, вырезанный из референса */
  src: string;
  color: string;
  size: number;
  className?: string;
}

/**
 * Рисует иконку как CSS-маску: форма — пиксель-в-пиксель из референса,
 * цвет задаётся кодом (активное/неактивное состояние).
 */
export default function MaskIcon({ src, color, size, className }: Props) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}
