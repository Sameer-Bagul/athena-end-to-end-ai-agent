interface HeaderProps {
  isReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isReady }) => {
  return (
    <header className="flex items-center justify-between px-6 bg-black/40 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-lg font-bold">A</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Athena</h1>
          <p className="text-xs text-purple-300">AI Assistant</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        {isReady ? (
          <>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-medium">Ready</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            <span className="text-yellow-400 font-medium">Loading...</span>
          </>
        )}
      </div>
    </header>
  );
};
