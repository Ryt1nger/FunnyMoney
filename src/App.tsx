import Home from './pages/Home';

// "Телефонная рамка": на десктопе — компактный мокап мобильных пропорций,
// на реальном мобильном экране (и в APK) занимает весь экран.
function App() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-300">
      <div className="relative h-screen w-full overflow-hidden sm:h-[850px] sm:max-h-[92vh] sm:w-[390px] sm:rounded-[36px] sm:shadow-2xl sm:ring-8 sm:ring-black/80">
        <Home />
      </div>
    </div>
  );
}

export default App;
