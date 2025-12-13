import React, { useEffect, useState } from 'react';

export const SeasonalChallengeCompletedModal = ({ 
  challenge, 
  onClaimAvatar, 
  onClose,
  bonusXP = 150,
  bonusPotatoes = 200
}) => {
  const [confettis, setConfettis] = useState([]);
  const [showAvatar, setShowAvatar] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Générer les confettis
  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const newConfettis = [];
    
    for (let i = 0; i < 100; i++) {
      newConfettis.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360
      });
    }
    setConfettis(newConfettis);

    // Afficher l'avatar après un délai
    setTimeout(() => setShowAvatar(true), 500);
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    await onClaimAvatar();
    setClaiming(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      {/* Confettis */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {confettis.map(confetti => (
          <div
            key={confetti.id}
            className="absolute animate-confetti"
            style={{
              left: `${confetti.left}%`,
              top: '-20px',
              width: `${confetti.size}px`,
              height: `${confetti.size}px`,
              backgroundColor: confetti.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animationDelay: `${confetti.delay}s`,
              animationDuration: `${confetti.duration}s`,
              transform: `rotate(${confetti.rotation}deg)`
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div className={`bg-white rounded-3xl p-8 max-w-md w-full text-center transform transition-all duration-500 ${showAvatar ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        {/* Titre */}
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          🎉 Défi Complété !
        </h2>
        <p className="text-slate-600 mb-6">
          Tu as terminé le défi "{challenge.name}" !
        </p>

        {/* Avatar avec effet brillant */}
        <div className="relative inline-block mb-6">
          <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${challenge.avatarBg} flex items-center justify-center text-6xl shadow-2xl animate-avatar-glow`}>
            {challenge.avatar}
          </div>
          {/* Cercles brillants */}
          <div className="absolute inset-0 rounded-full animate-ping-slow opacity-30 bg-gradient-to-br from-yellow-300 to-orange-400" />
          <div className="absolute -inset-2 rounded-full animate-spin-slow opacity-20">
            <div className="absolute top-0 left-1/2 w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2" />
            <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2" />
            <div className="absolute left-0 top-1/2 w-3 h-3 bg-yellow-400 rounded-full transform -translate-y-1/2" />
            <div className="absolute right-0 top-1/2 w-3 h-3 bg-yellow-400 rounded-full transform -translate-y-1/2" />
          </div>
        </div>

        {/* Récompenses */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 mb-6 border border-amber-200">
          <p className="text-sm font-semibold text-amber-700 mb-3">Récompenses bonus :</p>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="font-black text-xl text-amber-600">+{bonusXP} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥔</span>
              <span className="font-black text-xl text-amber-600">+{bonusPotatoes}</span>
            </div>
          </div>
        </div>

        {/* Avatar exclusif */}
        <div className="bg-purple-50 rounded-2xl p-4 mb-6 border border-purple-200">
          <p className="text-sm font-semibold text-purple-700 mb-2">Avatar exclusif débloqué !</p>
          <p className="text-xs text-purple-600">
            ⚠️ Attention : Si tu changes d'avatar, tu perdras celui-ci définitivement !
          </p>
        </div>

        {/* Boutons */}
        <div className="space-y-3">
          <button
            onClick={handleClaim}
            disabled={claiming}
            className={`w-full py-4 bg-gradient-to-r ${challenge.avatarBg} text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg`}
          >
            {claiming ? 'Récupération...' : `Équiper ${challenge.avatar} et récupérer !`}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-all"
          >
            Récupérer sans équiper l'avatar
          </button>
        </div>
      </div>

      {/* Styles pour les animations */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
        
        @keyframes avatar-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.5);
          }
        }
        .animate-avatar-glow {
          animation: avatar-glow 2s ease-in-out infinite;
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2s ease-in-out infinite;
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};
