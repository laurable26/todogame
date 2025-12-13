import React, { useState } from 'react';
import { SeasonalChallengeCompletedModal } from './SeasonalChallengeCompletedModal';

export const SeasonalChallengeBanner = ({ 
  challenge, 
  challengeData, 
  challengeStatus,
  onAccept, 
  onIgnore, 
  onCompleteTask,
  onClaimAvatar,
  bonusXP = 150,
  bonusPotatoes = 200
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);

  if (!challenge) return null;
  
  // Ne pas afficher si ignoré
  if (challengeStatus === 'ignored') return null;
  
  // Ne pas afficher si déjà réclamé
  if (challengeStatus === 'claimed') return null;

  const tasksCompleted = challengeData?.tasks_completed || [false, false, false];
  const completedCount = tasksCompleted.filter(t => t).length;

  const handleCompleteTask = async (index) => {
    await onCompleteTask(index);
    // Vérifier si toutes les tâches sont maintenant complétées
    const newTasksCompleted = [...tasksCompleted];
    newTasksCompleted[index] = true;
    if (newTasksCompleted.every(t => t)) {
      setTimeout(() => setShowCompletedModal(true), 300);
    }
  };

  const handleClaimFromModal = async () => {
    await onClaimAvatar();
    setShowCompletedModal(false);
  };

  return (
    <>
      <div className="mb-6">
        {/* Bannière principale */}
        <div 
          className={`bg-gradient-to-r ${challenge.avatarBg} rounded-2xl p-4 shadow-lg cursor-pointer transition-all hover:scale-[1.01]`}
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{challenge.emoji}</div>
              <div>
                <h3 className="font-bold text-white text-lg">
                  Défi de saison : {challenge.name}
                </h3>
                <p className="text-white/80 text-sm">
                  {challengeStatus === 'available' && "Nouveau défi disponible !"}
                  {challengeStatus === 'in_progress' && `${completedCount}/3 tâches complétées`}
                  {challengeStatus === 'completed' && "🎉 Défi complété ! Réclame ta récompense !"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {challengeStatus === 'available' && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); onIgnore(); }}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Ignorer
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAccept(); }}
                    className="px-4 py-1.5 bg-white text-slate-800 rounded-lg text-sm font-bold hover:bg-white/90 transition-all"
                  >
                    Accepter
                  </button>
                </>
              )}
              
              {challengeStatus === 'completed' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCompletedModal(true); }}
                  className="px-4 py-2 bg-white text-slate-800 rounded-lg font-bold hover:bg-white/90 transition-all animate-pulse"
                >
                  🎁 Réclamer ma récompense
                </button>
              )}
              
              <span className="text-white text-xl">
                {showDetails ? '▲' : '▼'}
              </span>
            </div>
          </div>
          
          {/* Barre de progression */}
          {challengeStatus === 'in_progress' && (
            <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Détails du défi */}
        {showDetails && (
          <div className="mt-2 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            {/* Récompenses */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 mb-4 border border-amber-200">
              <p className="text-sm font-semibold text-amber-700 mb-3 text-center">🎁 Récompenses à la fin du défi :</p>
              <div className="flex justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xl">⚡</span>
                  <span className="font-black text-amber-600">+{bonusXP} XP</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xl">🥔</span>
                  <span className="font-black text-amber-600">+{bonusPotatoes}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                  <span className="text-xl">{challenge.avatar}</span>
                  <span className="font-bold text-purple-700">Avatar exclusif</span>
                </div>
              </div>
            </div>

            {/* Liste des tâches */}
            <h4 className="font-semibold text-slate-700 mb-3">Tâches à accomplir :</h4>
            <div className="space-y-2">
              {challenge.tasks.map((task, index) => {
                const isCompleted = tasksCompleted[index];
                const canComplete = challengeStatus === 'in_progress' && !isCompleted;
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCompleted 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {canComplete ? (
                      <button
                        onClick={() => handleCompleteTask(index)}
                        className="w-6 h-6 rounded-full border-2 border-indigo-400 hover:bg-indigo-100 transition-all flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-green-500 text-white' : 'bg-slate-300'
                      }`}>
                        {isCompleted && '✓'}
                      </div>
                    )}
                    <span className={`flex-1 ${isCompleted ? 'text-green-700 line-through' : 'text-slate-700'}`}>
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Avertissement avatar */}
            {challengeStatus !== 'available' && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-700 text-sm">
                  <span className="font-bold">⚠️ Attention :</span> L'avatar {challenge.avatar} est exclusif. 
                  Si tu le changes, tu ne pourras plus le récupérer !
                </p>
              </div>
            )}

            {/* Bouton accepter si pas encore accepté */}
            {challengeStatus === 'available' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={onIgnore}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-all"
                >
                  Ignorer ce mois
                </button>
                <button
                  onClick={onAccept}
                  className={`flex-1 py-2.5 bg-gradient-to-r ${challenge.avatarBg} text-white rounded-xl font-bold hover:opacity-90 transition-all`}
                >
                  Accepter le défi !
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de complétion */}
      {showCompletedModal && (
        <SeasonalChallengeCompletedModal
          challenge={challenge}
          onClaimAvatar={handleClaimFromModal}
          onClose={() => setShowCompletedModal(false)}
          bonusXP={bonusXP}
          bonusPotatoes={bonusPotatoes}
        />
      )}
    </>
  );
};
