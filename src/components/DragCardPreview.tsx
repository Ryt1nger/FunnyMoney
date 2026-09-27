interface Props {
  image: string;
  label: string;
  detail?: string;
  x: number;
  y: number;
}

/** Плавающая копия переносимой карточки. Важно показывать всю карточку,
 * а не голую картинку: так ребёнок видит, что перемещает игровой элемент
 * целиком независимо от точки, за которую его взял. */
export default function DragCardPreview({ image, label, detail, x, y }: Props) {
  return (
    <div
      className="pointer-events-none absolute z-[999] flex w-[86px] flex-col items-center rounded-[15px] border border-white/70 bg-white/95 p-1.5 text-center shadow-2xl"
      style={{ left: x - 43, top: y - 94, transform: 'scale(1.06)' }}
    >
      <div className="flex h-[58px] w-full items-center justify-center overflow-hidden rounded-[11px] bg-white">
        <img src={image} alt="" draggable={false} className="h-full w-full object-contain p-1" />
      </div>
      <span className="mt-0.5 line-clamp-2 w-full text-[10px] font-extrabold leading-[1.05] text-[#17469d]">
        {label}
      </span>
      {detail && <span className="mt-0.5 text-[9px] font-black text-[#c9862a]">{detail}</span>}
    </div>
  );
}
