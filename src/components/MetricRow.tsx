interface MetricProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  dark?: boolean;
}

function Metric({ icon, label, value, color, dark }: MetricProps) {
  return (
    <div
      className={`flex-1 rounded-2xl p-3 flex flex-col gap-1 ${
        dark ? 'bg-black/40 backdrop-blur text-white' : 'bg-white shadow'
      }`}
    >
      <div className="flex items-center gap-1 text-xs font-medium">
        <span>{icon}</span>
        <span className={dark ? 'text-white/90' : 'text-gray-600'}>{label}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold self-end">{value}%</span>
    </div>
  );
}

interface Props {
  health: number;
  happiness: number;
  wealth: number;
  dark?: boolean;
}

export default function MetricRow({ health, happiness, wealth, dark }: Props) {
  return (
    <div className="flex gap-2 w-full">
      <Metric icon="❤️" label="Здоровье" value={health} color="#f43f5e" dark={dark} />
      <Metric icon="😊" label="Счастье" value={happiness} color="#f59e0b" dark={dark} />
      <Metric icon="💰" label="Богатство" value={wealth} color="#22c55e" dark={dark} />
    </div>
  );
}
