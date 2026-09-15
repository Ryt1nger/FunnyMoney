export default function Day() {
  const tasks = [
    { icon: '🍖', title: 'Покорми питомца', desc: 'Купи и дай еду своему питомцу', reward: '❤️ +20 · ⭐ +10 XP', done: true },
    { icon: '🎮', title: 'Поиграй с питомцем', desc: 'Проведи 1 игру в комнате', reward: '😊 +15 · ⭐ +10 XP', done: false },
  ];
  return (
    <div className="min-h-screen pb-24 bg-orange-50 p-4">
      <h1 className="text-xl font-bold text-gray-800">День</h1>
      <p className="text-sm text-gray-500 mb-4">Выполняй задания, получай награды!</p>
      <div className="bg-indigo-600 text-white rounded-2xl p-4 flex items-center justify-between mb-4">
        <div>
          <div className="text-xs opacity-80">Серия дней</div>
          <div className="text-2xl font-bold">🔥 6</div>
        </div>
        <div className="text-sm">Продолжай, чтобы получить награду!</div>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map((t, i) => (
          <div key={i} className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-xl">{t.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 text-sm">{t.title}</div>
              <div className="text-xs text-gray-500">{t.desc}</div>
              <div className="text-xs text-indigo-600 mt-1">{t.reward}</div>
            </div>
            <span>{t.done ? '✅' : '▶️'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
