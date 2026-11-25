// src/ui/components/AppLoading.jsx
// Shown by the router while the first route loads (replaces the blank white screen).
export default function AppLoading() {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <img src="/logo.png" alt="Lumina" className="h-20 object-contain" />
      </div>
    );
  }