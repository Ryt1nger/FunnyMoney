interface Props {
  coins: number;
  onAdd?: () => void;
}

export default function CoinBadge({ coins, onAdd }: Props) {
  return (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur rounded-full pl-3 pr-1 py-1 shadow">
      <span className="text-lg">🪙</span>
      <span className="font-bold text-gray-800">{coins}</span>
      {onAdd && (
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg leading-none"
        >
          +
        </button>
      )}
    </div>
  );
}
