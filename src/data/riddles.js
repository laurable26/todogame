// Base de données des énigmes quotidiennes - Version étendue avec 50 énigmes par niveau
import level1 from './riddles_level1.js';
import level2 from './riddles_level2.js';
import level3 from './riddles_level3.js';

export const riddles = {
  level1,
  level2,
  level3
};

// Fonction pour obtenir l'énigme du jour basée sur la date
export const getDailyRiddle = (level) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  // Créer un hash plus complexe pour varier les énigmes
  // Combinaison : jour + mois*31 + année*365 + niveau*1000
  const hash = day + (month * 31) + (year * 365) + (level * 1000);
  
  const levelKey = `level${level}`;
  const riddleList = riddles[levelKey] || riddles.level1;
  
  // Utiliser le hash pour sélectionner une énigme
  const index = hash % riddleList.length;
  return riddleList[index];
};

// Fonction pour vérifier la réponse
export const checkAnswer = (userAnswer, riddle) => {
  const normalizedAnswer = userAnswer.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Enlever les accents
  
  return riddle.acceptedAnswers.some(accepted => {
    const normalizedAccepted = accepted.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedAnswer === normalizedAccepted;
  });
};
