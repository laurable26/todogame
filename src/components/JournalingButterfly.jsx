import React, { useState, useRef, useEffect } from 'react';

// Questions pour le bilan hebdomadaire
const ALL_WEEKLY_QUESTIONS = [
  "Qu'est-ce qui s'est passé cette semaine ?",
  "Qu'est-ce qui n'avance pas ?",
  "Où est-ce que j'en suis avec mes objectifs ?",
  "Comment est ma relation avec les autres ?",
  "Qu'est-ce que j'ai appris cette semaine ?",
  "Qu'est-ce que j'aurais besoin d'apprendre ?",
  "Quel est le problème ou l'inquiétude du moment ?",
  "Qu'est-ce que je dois surveiller ?",
  "Quel est mon niveau de stress/fatigue ?",
  "Qu'est-ce qui m'étonne ?",
  "Quelles actions je voudrais entreprendre ?",
  "Qu'est-ce que je voudrais qui se passe la semaine qui vient ?"
];

export const JournalingButterfly = ({ 
  journaling, 
  onClose 
}) => {
  const {
    todayEntry,
    weeklyEntry,
    settings,
    MOOD_OPTIONS,
    saveEntry,
    saveWeeklyAnswers,
    updateWeeklyDay,
    shouldShowModal,
    isWeeklyDay,
    loadData
  } = journaling;

  const [showModal, setShowModal] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const butterflyRef = useRef(null);

  // État du formulaire
  const [selectedMood, setSelectedMood] = useState(todayEntry?.mood || null);
  const [selectedRating, setSelectedRating] = useState(todayEntry?.rating || 0);
  const [weeklyAnswers, setWeeklyAnswers] = useState({});
  const [step, setStep] = useState('daily'); // 'daily', 'weekly', 'settings'
  const [showSettings, setShowSettings] = useState(false);
  
  // Générer 3 questions aléatoires (une seule fois par session)
  const [randomQuestions] = useState(() => {
    const shuffled = [...ALL_WEEKLY_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });

  // Jours de la semaine pour les paramètres (commence par lundi)
  const DAYS = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' }
  ];

  // Mise à jour quand todayEntry change
  useEffect(() => {
    if (todayEntry) {
      setSelectedMood(todayEntry.mood);
      setSelectedRating(todayEntry.rating);
    }
  }, [todayEntry]);

  // Gestion du drag
  const handleMouseDown = (e) => {
    if (e.target.closest('.modal-content')) return;
    setIsDragging(true);
    const rect = butterflyRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y));
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    const rect = butterflyRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newX = Math.max(0, Math.min(window.innerWidth - 60, touch.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragOffset.y));
    setPosition({ x: newX, y: newY });
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Sauvegarder l'entrée quotidienne
  const handleSaveDaily = async () => {
    if (!selectedMood || !selectedRating) return;
    
    await saveEntry(selectedMood, selectedRating);
    
    // Si c'est le jour du bilan, passer aux questions
    if (isWeeklyDay() && !weeklyEntry) {
      setStep('weekly');
    } else {
      setShowModal(false);
    }
  };

  // Sauvegarder le bilan hebdomadaire
  const handleSaveWeekly = async () => {
    const answers = randomQuestions.map((q, i) => ({
      question: q,
      answer: weeklyAnswers[i] || ''
    }));
    
    await saveWeeklyAnswers(answers);
    setShowModal(false);
  };

  // Ne rien afficher si pas besoin
  if (!shouldShowModal() && !showModal) {
    return null;
  }

  // Si déjà rempli aujourd'hui mais c'est le jour du bilan non fait
  const needsWeeklyOnly = todayEntry?.mood && todayEntry?.rating && isWeeklyDay() && !weeklyEntry;

  return (
    <>
      {/* Papillon flottant */}
      {!showModal && (
        <div
          ref={butterflyRef}
          className="fixed z-50 cursor-grab active:cursor-grabbing select-none"
          style={{ left: position.x, top: position.y }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => {
            if (!isDragging) {
              setShowModal(true);
              if (needsWeeklyOnly) {
                setStep('weekly');
              } else {
                setStep('daily');
              }
            }
          }}
        >
          <div className="butterfly-float text-4xl hover:scale-125 transition-transform">
            🦋
          </div>
          <style>{`
            .butterfly-float {
              animation: butterflyFly 3s ease-in-out infinite;
            }
            @keyframes butterflyFly {
              0%, 100% {
                transform: translateY(0px) rotate(-5deg);
              }
              25% {
                transform: translateY(-8px) rotate(5deg);
              }
              50% {
                transform: translateY(-3px) rotate(-3deg);
              }
              75% {
                transform: translateY(-10px) rotate(3deg);
              }
            }
          `}</style>
        </div>
      )}

      {/* Modal de journaling */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🦋</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {step === 'daily' ? 'Journal du jour' : step === 'weekly' ? 'Bilan de la semaine' : 'Paramètres'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {step === 'daily' ? 'Comment s\'est passée ta journée ?' : step === 'weekly' ? 'Prenons un moment pour réfléchir' : 'Personnalise ton journal'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Paramètres"
                  >
                    ⚙️
                  </button>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="text-2xl text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-5">
              {/* Paramètres */}
              {showSettings && (
                <div className="mb-5 p-4 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-700 mb-3">Jour du bilan hebdomadaire</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day.value}
                        onClick={() => updateWeeklyDay(day.value)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          settings.weeklyDay === day.value
                            ? 'bg-purple-500 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300'
                        }`}
                      >
                        {day.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Étape quotidienne */}
              {step === 'daily' && (
                <div className="space-y-6">
                  {/* Sélection de l'humeur */}
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Quelle est ton émotion dominante ?</h3>
                    <div className="flex justify-between gap-2">
                      {MOOD_OPTIONS.map(mood => (
                        <button
                          key={mood.value}
                          onClick={() => setSelectedMood(mood.value)}
                          className={`flex-1 py-3 rounded-xl transition-all ${
                            selectedMood === mood.value
                              ? 'bg-purple-100 border-2 border-purple-500 scale-105'
                              : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-2xl mb-1">{mood.emoji}</div>
                          <div className="text-xs text-slate-600">{mood.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note sur 5 étoiles */}
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Note ta journée</h3>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setSelectedRating(star)}
                          className={`text-4xl transition-transform hover:scale-110 ${
                            star <= selectedRating ? 'text-yellow-400' : 'text-slate-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {selectedRating > 0 && (
                      <p className="text-center text-sm text-slate-500 mt-2">
                        {selectedRating === 1 && 'Journée difficile 😔'}
                        {selectedRating === 2 && 'Pas terrible'}
                        {selectedRating === 3 && 'Correct'}
                        {selectedRating === 4 && 'Bonne journée !'}
                        {selectedRating === 5 && 'Excellente journée ! 🎉'}
                      </p>
                    )}
                  </div>

                  {/* Bouton valider */}
                  <button
                    onClick={handleSaveDaily}
                    disabled={!selectedMood || !selectedRating}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      selectedMood && selectedRating
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isWeeklyDay() && !weeklyEntry ? 'Continuer vers le bilan →' : 'Enregistrer'}
                  </button>
                </div>
              )}

              {/* Étape bilan hebdomadaire */}
              {step === 'weekly' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">
                    Prends quelques minutes pour réfléchir à ta semaine. Réponds à ces 3 questions :
                  </p>
                  
                  {randomQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <label className="font-medium text-slate-700 text-sm">
                        {index + 1}. {question}
                      </label>
                      <textarea
                        value={weeklyAnswers[index] || ''}
                        onChange={(e) => setWeeklyAnswers({ ...weeklyAnswers, [index]: e.target.value })}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 resize-none text-sm"
                        rows={3}
                        placeholder="Ta réponse..."
                      />
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setStep('daily')}
                      className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                    >
                      ← Retour
                    </button>
                    <button
                      onClick={handleSaveWeekly}
                      className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all"
                    >
                      Terminer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
