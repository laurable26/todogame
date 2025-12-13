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
      <div className="mb-4 sm:mb-6">
        {/* Bannière principale - Version responsive */}
        <div 
          className={`bg-gradient-to-r ${challenge.avatarBg} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg cursor-pointer transition-all hover:scale-[1.01]`}
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Layout mobile : plus compact */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="text-2xl sm:text-4xl flex-shrink-0">{challenge.emoji}</div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-lg truncate">
                  <span className="hidden sm:inline">Défi de saison : </span>
                  {challenge.name}
                </h3>
                <p className="text-white/80 text-xs sm:text-sm truncate">
                  {challengeStatus === 'available' && "Nouveau défi !"}
                  {challengeStatus === 'in_progress' && `${completedCount}/3 tâches`}
                  {challengeStatus === 'completed' && "🎉 Complété !"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Boutons desktop */}
              {challengeStatus === 'available' && (
                <div className="hidden sm:flex gap-2">
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
                </div>
              )}
              
              {/* Bouton mobile pour "available" */}
              {challengeStatus === 'available' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAccept(); }}
                  className="sm:hidden px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold"
                >
                  Voir
                </button>
              )}
              
              {challengeStatus === 'completed' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCompletedModal(true); }}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white text-slate-800 rounded-lg text-xs sm:text-sm font-bold hover:bg-white/90 transition-all animate-pulse"
                >
                  <span className="hidden sm:inline">🎁 Réclamer</span>
                  <span className="sm:hidden">🎁</span>
                </button>
              )}
              
              <span className="text-white text-lg sm:text-xl">
                {showDetails ? '▲' : '▼'}
              </span>
            </div>
          </div>
          
          {/* Barre de progression */}
          {challengeStatus === 'in_progress' && (
            <div className="mt-2 sm:mt-3 h-1.5 sm:h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / 3) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Détails du défi - Version responsive */}
        {showDetails && (
          <div className="mt-2 bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
            {/* Récompenses - Layout responsive */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-amber-200">
              <p className="text-xs sm:text-sm font-semibold text-amber-700 mb-2 sm:mb-3 text-center">🎁 Récompenses :</p>
              <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm">
                  <span className="text-base sm:text-xl">⭐</span>
                  <span className="font-bold text-xs sm:text-base text-amber-600">+{bonusXP} XP</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm">
                  <span className="text-base sm:text-xl">🥔</span>
                  <span className="font-bold text-xs sm:text-base text-amber-600">+{bonusPotatoes}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm">
                  <span className="text-base sm:text-xl">{challenge.avatar}</span>
                  <span className="font-medium text-xs sm:text-sm text-purple-700">Avatar</span>
                </div>
              </div>
            </div>

            {/* Liste des tâches */}
            <h4 className="font-semibold text-slate-700 mb-2 sm:mb-3 text-sm sm:text-base">Tâches à accomplir :</h4>
            <div className="space-y-2">
              {challenge.tasks.map((task, index) => {
                const isCompleted = tasksCompleted[index];
                const canComplete = challengeStatus === 'in_progress' && !isCompleted;
                
                return (
                  <div 
                    key={index}
                    className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all ${
                      isCompleted 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {canComplete ? (
                      <button
                        onClick={() => handleCompleteTask(index)}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-indigo-400 hover:bg-indigo-100 transition-all flex-shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs sm:text-sm ${
                        isCompleted ? 'bg-green-500 text-white' : 'bg-slate-300'
                      }`}>
                        {isCompleted && '✓'}
                      </div>
                    )}
                    <span className={`flex-1 text-xs sm:text-sm leading-tight ${isCompleted ? 'text-green-700 line-through' : 'text-slate-700'}`}>
                      {task}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Avertissement avatar */}
            {challengeStatus !== 'available' && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-700 text-xs sm:text-sm">
                  <span className="font-bold">⚠️</span> L'avatar {challenge.avatar} est exclusif. 
                  <span className="hidden sm:inline"> Si tu le changes, tu ne pourras plus le récupérer !</span>
                  <span className="sm:hidden"> Non récupérable si changé.</span>
                </p>
              </div>
            )}

            {/* Boutons accepter/ignorer si pas encore accepté */}
            {challengeStatus === 'available' && (
              <div className="mt-3 sm:mt-4 flex gap-2">
                <button
                  onClick={onIgnore}
                  className="flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-all text-xs sm:text-base"
                >
                  Ignorer
                </button>
                <button
                  onClick={onAccept}
                  className={`flex-1 py-2 sm:py-2.5 bg-gradient-to-r ${challenge.avatarBg} text-white rounded-xl font-bold hover:opacity-90 transition-all text-xs sm:text-base`}
                >
                  Accepter !
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
