export function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Master Blaster</h1>
          <p className="text-xl text-purple-200">Professional Audio Mastering</p>
        </div>
        
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </div>
    </div>
  );
}
