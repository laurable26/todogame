import React from 'react';

export const ChestsPage = ({ chests, onFuseChests, onOpenChest, tasksCompleted }) => {
  const chestTypes = [
    { 
      type: 'bronze', 
      name: 'Commun', 
      emoji: '🎁', 
      bgColor: 'bg-gradient-to-br from-amber-500 to-amber-700',
      textColor: 'text-white',
      buttonBg: 'bg-amber-100/90 text-amber-900 hover:bg-amber-100',
      fusionBg: 'bg-amber-600/80 text-amber-100 hover:bg-amber-600',
      fusionText: '3 → 1 splendide',
      fusionRequired: 3,
      fusionTarget: 'silver'
    },
    { 
      type: 'silver', 
      name: 'Splendide', 
      emoji: '🎀', 
      bgColor: 'bg-gradient-to-br from-slate-500 to-slate-700',
      textColor: 'text-white',
      buttonBg: 'bg-slate-100/90 text-slate-900 hover:bg-slate-100',
      fusionBg: 'bg-slate-600/80 text-slate-200 hover:bg-slate-600',
      fusionText: '5 → 1 diamant',
      fusionRequired: 5,
      fusionTarget: 'gold'
    },
    { 
      type: 'gold', 
      name: 'Diamant', 
      emoji: '💎', 
      bgColor: 'bg-gradient-to-br from-cyan-400 to-blue-500',
      textColor: 'text-white',
      buttonBg: 'bg-cyan-100/90 text-cyan-900 hover:bg-cyan-100',
      fusionBg: 'bg-cyan-600/80 text-cyan-100 hover:bg-cyan-600',
      fusionText: '10 → 1 légendaire',
      fusionRequired: 10,
      fusionTarget: 'legendary'
    },
    { 
      type: 'legendary', 
      name: 'Légendaire', 
      emoji: '👑', 
      bgColor: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
      textColor: 'text-white',
      buttonBg: 'bg-fuchsia-100/90 text-fuchsia-900 hover:bg-fuchsia-100',
      fusionBg: null,
      fusionText: null,
      fusionRequired: null,
      fusionTarget: null
    },
  ];

  // Calcul du nombre de quêtes restantes avant le prochain coffre
  const tasksUntilNextChest = 8 - (tasksCompleted % 8);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-160px)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-black text-slate-900">Coffres</h1>
        <div className="text-right">
          <div className="text-2xl font-black text-amber-600">{tasksUntilNextChest}/8</div>
          <div className="text-xs text-slate-500">Quêtes avant 🎁</div>
        </div>
      </div>
      
      {/* Grille des coffres */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {chestTypes.map(chest => {
          const hasChest = chests[chest.type] > 0;
          
          return (
            <div 
              key={chest.type} 
              className={`${chest.bgColor} rounded-2xl p-3 shadow-lg flex flex-col justify-center`}
            >
              <div className="text-center">
                {/* Emoji */}
                <div className="text-3xl sm:text-4xl mb-1">
                  {chest.emoji}
                </div>
                
                {/* Nom */}
                <h3 className={`font-bold ${chest.textColor} text-xs sm:text-sm`}>{chest.name}</h3>
                
                {/* Nombre */}
                <div className={`text-2xl sm:text-3xl font-black ${chest.textColor} my-1`}>
                  {chests[chest.type]}
                </div>
                
                {/* Bouton Ouvrir - toujours visible mais grisé si pas dispo */}
                <button
                  onClick={() => hasChest && onOpenChest(chest.type)}
                  disabled={!hasChest}
                  className={`w-full py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all mb-1.5 ${
                    hasChest 
                      ? chest.buttonBg 
                      : 'bg-black/20 text-white/50 cursor-not-allowed'
                  }`}
                >
                  Ouvrir
                </button>
                
                {/* Bouton Fusion */}
                {chest.fusionText && (
                  <button
                    onClick={() => onFuseChests(chest.type)}
                    disabled={chests[chest.type] < chest.fusionRequired}
                    className={`w-full py-1.5 sm:py-2 rounded-xl font-medium text-[10px] sm:text-xs transition-all ${
                      chests[chest.type] >= chest.fusionRequired
                        ? chest.fusionBg
                        : 'bg-black/20 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    {chest.fusionText}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Modal d'ouverture de coffre avec animation
export const ChestOpeningModal = ({ chest, onClose }) => {
  const [phase, setPhase] = React.useState('opening'); // 'opening' | 'revealing' | 'rewards'
  
  React.useEffect(() => {
    const timer1 = setTimeout(() => setPhase('revealing'), 1500);
    const timer2 = setTimeout(() => setPhase('rewards'), 2500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const chestColors = {
    bronze: 'from-amber-500 to-amber-700',
    silver: 'from-slate-500 to-slate-700',
    gold: 'from-cyan-400 to-blue-500',
    legendary: 'from-fuchsia-500 to-purple-600',
  };

  const chestEmojis = {
    bronze: '🎁',
    silver: '🎀',
    gold: '💎',
    legendary: '👑',
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br ${chestColors[chest.type]}`}>
      {/* Particules de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {phase !== 'opening' && [...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          >
            <span className="text-2xl">✨</span>
          </div>
        ))}
      </div>

      <div className="text-center relative z-10">
        {/* Phase d'ouverture - Coffre qui tremble */}
        {phase === 'opening' && (
          <div className="animate-bounce">
            <div className="text-9xl animate-pulse">
              {chestEmojis[chest.type]}
            </div>
            <p className="text-white text-xl font-bold mt-4 animate-pulse">Ouverture...</p>
          </div>
        )}

        {/* Phase de révélation - Explosion */}
        {phase === 'revealing' && (
          <div className="relative">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  transform: `scale(${1 + i * 0.5})`,
                }}
              />
            ))}
            <div className="text-9xl">
              🎉
            </div>
          </div>
        )}

        {/* Phase des récompenses */}
        {phase === 'rewards' && (
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl max-w-sm mx-4 animate-bounce-in">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Récompenses !</h2>
            
            {/* Patates gagnées */}
            <div className="bg-amber-50 rounded-2xl p-4 mb-4 border-2 border-amber-200">
              <div className="text-5xl mb-2">🥔</div>
              <div className="text-3xl font-black text-amber-600">+{chest.rewards.points}</div>
            </div>
            
            {/* Items gagnés */}
            {chest.rewards.items && chest.rewards.items.length > 0 && (
              <div className="bg-purple-50 rounded-2xl p-4 mb-4 border-2 border-purple-200">
                {chest.rewards.items.map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="text-5xl mb-2">{item.image}</div>
                    <div className="text-lg font-bold text-purple-700">{item.name}</div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Super !
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};
