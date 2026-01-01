import React, { useState, useEffect } from 'react';

// Animation avec emojis clés qui montent vers le coffre
const ChestAnimation = ({ onComplete, isSuperChest }) => {
  const [unlockedKeys, setUnlockedKeys] = useState(0);
  const [chestState, setChestState] = useState('locked'); // 'locked' | 'unlocked' | 'open'

  useEffect(() => {
    // Animation : chaque clé monte toutes les 400ms
    const keyTimers = [];
    
    for (let i = 0; i < 6; i++) {
      keyTimers.push(
        setTimeout(() => {
          setUnlockedKeys(i + 1);
        }, 300 + i * 400)
      );
    }

    // Cadenas s'ouvre après toutes les clés (300 + 6*400 = 2700ms)
    const unlockTimer = setTimeout(() => {
      setChestState('unlocked');
    }, 2800);

    // Cadeau apparaît
    const openTimer = setTimeout(() => {
      setChestState('open');
    }, 3400);

    // Passer aux récompenses
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4200);

    return () => {
      keyTimers.forEach(t => clearTimeout(t));
      clearTimeout(unlockTimer);
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Titre */}
      {isSuperChest && (
        <div className="text-center animate-pulse">
          <span className="text-5xl">⭐</span>
          <h2 className="text-3xl font-black text-amber-400 mt-2">SUPER COFFRE !</h2>
        </div>
      )}

      {/* Coffre / Cadenas */}
      <div className="relative">
        {/* Lueur derrière */}
        <div className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-500 ${
          chestState === 'open' ? 'bg-amber-400 opacity-50' : 
          chestState === 'unlocked' ? 'bg-green-400 opacity-30' : 'bg-stone-400 opacity-10'
        }`} style={{ transform: 'scale(1.5)' }} />
        
        {/* Emoji principal */}
        <div className={`relative text-9xl transition-all duration-500 ${
          chestState === 'open' ? 'animate-bounce scale-110' : 
          chestState === 'unlocked' ? 'scale-105' : ''
        }`}>
          {chestState === 'open' ? '🎁' : chestState === 'unlocked' ? '🔓' : '🔒'}
        </div>

        {/* Éclat quand ouvert */}
        {chestState === 'open' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <span 
                key={i} 
                className="absolute text-2xl animate-ping"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                  animationDelay: `${i * 100}ms`
                }}
              >
                ✨
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Zone des petits cadenas */}
      <div className="flex gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="relative">
            {/* Petit cadenas */}
            <span className={`text-4xl transition-all duration-300 ${
              i < unlockedKeys ? 'opacity-100 scale-110' : 'opacity-40 grayscale'
            }`}>
              {i < unlockedKeys ? '🔓' : '🔒'}
            </span>
            
            {/* Clé qui monte */}
            {i === unlockedKeys - 1 && (
              <span 
                className="absolute text-3xl animate-key-up"
                style={{ 
                  left: '50%', 
                  bottom: '-40px',
                  transform: 'translateX(-50%)'
                }}
              >
                🗝️
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Compteur */}
      <div className="text-white text-xl font-bold">
        {unlockedKeys}/6 🗝️
      </div>

      <style>{`
        @keyframes key-up {
          0% {
            transform: translateX(-50%) translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(-50%) translateY(-60px) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-40px) scale(0);
            opacity: 0;
          }
        }
        .animate-key-up {
          animation: key-up 350ms ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Modal d'ouverture de coffre avec animation
export const ChestOpeningModal = ({ 
  onClose, 
  rewards, 
  isSuperChest = false 
}) => {
  const [phase, setPhase] = useState('animation');

  const handleAnimationComplete = () => {
    setPhase('rewards');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Phase d'animation */}
      {phase === 'animation' && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <ChestAnimation onComplete={handleAnimationComplete} isSuperChest={isSuperChest} />
        </div>
      )}

      {/* Phase des récompenses */}
      {phase === 'rewards' && (
        <div className="flex items-center justify-center p-4">
          {/* Particules de fond */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
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
                <span className="text-2xl">{isSuperChest ? '⭐' : '✨'}</span>
              </div>
            ))}
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl max-w-sm mx-4 animate-bounce-in relative z-10">
            <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">
              {isSuperChest ? '🌟 Super Récompenses !' : '🎉 Récompenses !'}
            </h2>
            
            {/* Patates gagnées */}
            <div className={`rounded-2xl p-4 mb-4 border-2 ${isSuperChest ? 'bg-amber-50 border-amber-300' : 'bg-amber-50 border-amber-200'}`}>
              <div className="text-5xl mb-2 text-center">🥔</div>
              <div className="text-3xl font-black text-center text-amber-600">
                +{rewards.potatoes}
              </div>
            </div>
            
            {/* Item gagné */}
            {rewards.item && (
              <div className={`rounded-2xl p-4 mb-4 border-2 ${
                rewards.item.type === 'amelioration' || rewards.item.type === 'boost'
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-indigo-50 border-indigo-200'
              }`}>
                {rewards.item.type === 'fond' ? (
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${rewards.item.colors} rounded-xl mb-2 shadow-lg flex items-center justify-center`}>
                    <span className="text-3xl">{rewards.item.image}</span>
                  </div>
                ) : (
                  <div className="text-5xl mb-2 text-center">{rewards.item.image}</div>
                )}
                <div className="text-lg font-bold text-slate-700 text-center">{rewards.item.name}</div>
                <div className="text-sm text-slate-500 text-center">
                  {rewards.item.type === 'avatar' && '🎭 Nouvel avatar !'}
                  {rewards.item.type === 'fond' && '🎨 Nouveau fond !'}
                  {rewards.item.type === 'amelioration' && '⚙️ Amélioration !'}
                  {rewards.item.type === 'boost' && '⚡ Boost !'}
                </div>
                {rewards.item.chestExclusive && (
                  <div className="mt-2 text-center">
                    <span className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      ✨ EXCLUSIF COFFRE
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={onClose}
              className={`w-full py-3 rounded-xl font-bold hover:scale-105 transition-transform ${
                isSuperChest 
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
              }`}
            >
              Super ! 🎉
            </button>
          </div>
        </div>
      )}

      <style>{`
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

// Bouton cliquable pour ouvrir le coffre (dans le header)
export const ChestButton = ({ keys, onOpen, theme = {} }) => {
  const canOpen = keys >= 6;
  const progress = Math.min(keys, 6);
  
  return (
    <button
      onClick={canOpen ? onOpen : undefined}
      disabled={!canOpen}
      className={`${theme.darkMode ? 'bg-stone-800' : 'bg-stone-100'} border-2 ${
        canOpen ? 'border-orange-600' : (theme.darkMode ? 'border-stone-600' : 'border-stone-400')
      } px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-2 transition-all ${
        canOpen 
          ? 'cursor-pointer hover:scale-105 hover:shadow-lg hover:border-orange-500 animate-pulse' 
          : 'cursor-default'
      }`}
    >
      {/* Cadenas ouvert seulement quand prêt */}
      {canOpen && (
        <span className="text-base sm:text-xl animate-bounce">🔓</span>
      )}
      
      <div className="flex items-center gap-1">
        <span className="text-base sm:text-lg">🗝️</span>
        <span className={`font-bold ${canOpen ? 'text-orange-600' : (theme.darkMode ? 'text-stone-300' : 'text-stone-700')} text-sm sm:text-lg`}>{keys}</span>
        <span className={`text-xs ${theme.darkMode ? 'text-stone-400' : 'text-stone-500'}`}>/6</span>
      </div>
      
      {/* Mini barre de progression */}
      <div className={`w-12 sm:w-16 h-1.5 sm:h-2 ${theme.darkMode ? 'bg-stone-700' : 'bg-stone-300'} rounded-full overflow-hidden`}>
        <div 
          className={`h-full rounded-full transition-all duration-300 ${
            canOpen ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-stone-500'
          }`}
          style={{ width: `${(progress / 6) * 100}%` }}
        />
      </div>
    </button>
  );
};

export default ChestOpeningModal;
