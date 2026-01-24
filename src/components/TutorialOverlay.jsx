import React, { useState, useEffect } from 'react';

const TUTORIAL_STEPS = [
  {
    id: 1,
    title: 'Bienvenue dans ToDoGame !',
    description: 'ToDoGame transforme tes tâches quotidiennes en jeu. Complète des tâches, gagne des récompenses et progresse !',
    target: null, // Pas de cible spécifique, juste un message central
    position: 'center'
  },
  {
    id: 2,
    title: 'Créer une tâche',
    description: 'Clique sur le bouton + en bas à gauche pour créer ta première tâche.',
    target: '.create-task-button', // Classe CSS du bouton +
    position: 'top'
  },
  {
    id: 3,
    title: 'Compléter une tâche',
    description: 'Coche la case à côté d\'une tâche pour la compléter. Tu gagneras des XP et des patates !',
    target: '.task-checkbox', // Classe CSS de la checkbox
    position: 'right'
  },
  {
    id: 4,
    title: 'Système de clés',
    description: '1 tâche complétée = 1 clé. Collecte 6 clés pour ouvrir un coffre !',
    target: '.keys-counter', // Classe CSS du compteur de clés
    position: 'bottom'
  },
  {
    id: 5,
    title: 'Ouvrir un coffre',
    description: 'Quand tu as 6 clés, clique ici pour ouvrir un coffre. Tu peux gagner des patates et des avatars ultra-rares !',
    target: '.chest-button', // Classe CSS du bouton coffre
    position: 'bottom'
  },
  {
    id: 6,
    title: 'La Boutique',
    description: 'Dépense tes patates ici pour acheter des avatars, des fonds, des améliorations et des boosts.',
    target: '[data-page="shop"]', // Bouton navigation boutique
    position: 'top'
  },
  {
    id: 7,
    title: 'Les Amis',
    description: 'Ajoute des amis, partage des tâches avec eux et lance des défis Chifoumi pour gagner des patates !',
    target: '[data-page="friends"]', // Bouton navigation amis
    position: 'top'
  },
  {
    id: 8,
    title: 'Les Badges',
    description: 'Débloque des badges en accomplissant des objectifs spéciaux.',
    target: '[data-page="badges"]', // Bouton navigation badges
    position: 'top'
  },
  {
    id: 9,
    title: 'Vues du calendrier',
    description: 'Organise tes tâches par Jour, Semaine, Mois ou stocke-les dans la Bucketlist pour plus tard.',
    target: '.view-selector', // Classe CSS des boutons de vue
    position: 'bottom'
  },
  {
    id: 10,
    title: 'C\'est parti !',
    description: 'Tu es prêt ! Commence à compléter des tâches et à progresser dans ToDoGame. Bon jeu !',
    target: null,
    position: 'center'
  }
];

export const TutorialOverlay = ({ onComplete, onSkip, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);

  const step = TUTORIAL_STEPS[currentStep];

  // Trouver l'élément cible
  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target);
      setTargetElement(element);
      
      // Navigation automatique vers les pages
      if (step.id === 6 && onNavigate) {
        onNavigate('shop'); // Boutique
      } else if (step.id === 7 && onNavigate) {
        onNavigate('friends'); // Amis
      } else if (step.id === 8 && onNavigate) {
        onNavigate('badges'); // Badges
      } else if (step.id === 9 && onNavigate) {
        onNavigate('tasks'); // Retour aux tâches pour voir les vues
      }
    } else {
      setTargetElement(null);
    }
  }, [currentStep, step.target, step.id, onNavigate]);

  // Calculer la position du spotlight
  const getSpotlightStyle = () => {
    if (!targetElement) return {};
    
    const rect = targetElement.getBoundingClientRect();
    return {
      top: `${rect.top - 8}px`,
      left: `${rect.left - 8}px`,
      width: `${rect.width + 16}px`,
      height: `${rect.height + 16}px`,
    };
  };

  // Calculer la position de la bulle
  const getBubbleStyle = () => {
    if (!targetElement) {
      // Position centrale
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const bubbleWidth = 320;
    const bubbleHeight = 200;
    const gap = 30; // Augmenté de 20 à 30
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top, left, transform = '';

    switch (step.position) {
      case 'top':
        top = rect.top - bubbleHeight - gap;
        left = rect.left + rect.width / 2;
        transform = 'translateX(-50%)';
        
        // Si trop haut, passer en bottom
        if (top < 20) {
          top = rect.bottom + gap;
        }
        break;
        
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        transform = 'translateX(-50%)';
        
        // Si trop bas, passer en top
        if (top + bubbleHeight > windowHeight - 20) {
          top = rect.top - bubbleHeight - gap;
        }
        break;
        
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - bubbleWidth - gap;
        transform = 'translateY(-50%)';
        
        // Si trop à gauche, passer en right
        if (left < 20) {
          left = rect.right + gap;
          transform = 'translateY(-50%)';
        }
        break;
        
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        transform = 'translateY(-50%)';
        
        // Si trop à droite, passer en left
        if (left + bubbleWidth > windowWidth - 20) {
          left = rect.left - bubbleWidth - gap;
          transform = 'translateY(-50%)';
        }
        break;
        
      default:
        top = '50%';
        left = '50%';
        transform = 'translate(-50%, -50%)';
    }

    // Forcer les positions à rester dans l'écran
    if (typeof top === 'number') {
      top = Math.max(20, Math.min(top, windowHeight - bubbleHeight - 20));
    }
    if (typeof left === 'number') {
      left = Math.max(20, Math.min(left, windowWidth - bubbleWidth - 20));
    }

    return {
      top: typeof top === 'number' ? `${top}px` : top,
      left: typeof left === 'number' ? `${left}px` : left,
      transform
    };
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-black/70" onClick={(e) => e.stopPropagation()} />

      {/* Spotlight sur l'élément cible */}
      {targetElement && (
        <>
          <div 
            className="absolute rounded-lg ring-4 ring-white/30 pointer-events-none transition-all duration-300"
            style={getSpotlightStyle()}
          />
          <div 
            className="absolute bg-white/10 rounded-lg animate-pulse pointer-events-none transition-all duration-300"
            style={getSpotlightStyle()}
          />
        </>
      )}

      {/* Bulle d'explication */}
      <div 
        className="absolute bg-white rounded-2xl shadow-2xl p-6 max-w-sm transition-all duration-300"
        style={getBubbleStyle()}
      >
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-600">
              Étape {currentStep + 1}/{TUTORIAL_STEPS.length}
            </span>
            <button
              onClick={onSkip}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Passer le tuto
            </button>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Titre */}
        <h3 className="text-xl font-bold text-slate-900 mb-3">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 mb-6 leading-relaxed">
          {step.description}
        </p>

        {/* Boutons de navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all"
            >
              Précédent
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white rounded-xl font-bold transition-all"
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>

      {/* Flèche pointant vers l'élément */}
      {targetElement && step.position !== 'center' && (
        <div 
          className="absolute pointer-events-none"
          style={{
            ...getBubbleStyle(),
            top: `${parseFloat(getBubbleStyle().top) + (
              step.position === 'top' ? 200 : 
              step.position === 'bottom' ? -20 : 
              100
            )}px`,
            left: `${parseFloat(getBubbleStyle().left) + (
              step.position === 'left' ? 320 :
              step.position === 'right' ? -20 :
              0
            )}px`
          }}
        >
          <div className={`w-0 h-0 border-8 ${
            step.position === 'top' ? 'border-t-white border-x-transparent border-b-transparent' :
            step.position === 'bottom' ? 'border-b-white border-x-transparent border-t-transparent' :
            step.position === 'left' ? 'border-l-white border-y-transparent border-r-transparent' :
            'border-r-white border-y-transparent border-l-transparent'
          }`} />
        </div>
      )}
    </div>
  );
};

export default TutorialOverlay;
