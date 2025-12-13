import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// Définition des défis saisonniers par mois
const SEASONAL_CHALLENGES = {
  // Janvier - Nouvelle année
  1: {
    name: "Nouveaux Départs",
    emoji: "🎆",
    avatar: "🥳",
    avatarBg: "from-yellow-400 to-orange-500",
    tasks: [
      "Définir 3 objectifs pour l'année",
      "Écrire une lettre à son futur soi",
      "Commencer une nouvelle habitude"
    ]
  },
  // Février - Saint-Valentin
  2: {
    name: "Amour & Amitié",
    emoji: "❤️",
    avatar: "💘",
    avatarBg: "from-pink-400 to-red-500",
    tasks: [
      "Envoyer un message d'amour ou d'amitié à quelqu'un",
      "Se faire plaisir (moment self-care)",
      "Écrire 5 choses qu'on aime chez soi"
    ]
  },
  // Mars - Printemps
  3: {
    name: "Éveil du Printemps",
    emoji: "🌸",
    avatar: "🌷",
    avatarBg: "from-pink-300 to-purple-400",
    tasks: [
      "Grand ménage de printemps (une pièce)",
      "Planter quelque chose (plante, graine)",
      "Faire une balade en nature"
    ]
  },
  // Avril - Pâques
  4: {
    name: "Renouveau",
    emoji: "🐰",
    avatar: "🐰",
    avatarBg: "from-purple-300 to-pink-400",
    tasks: [
      "Faire une activité en lien avec l'œuf, le lapin ou le chocolat",
      "Cuisiner un plat de saison",
      "Profiter d'un moment en plein air"
    ]
  },
  // Mai - Fin d'année
  5: {
    name: "Sprint Final",
    emoji: "🎓",
    avatar: "🎓",
    avatarBg: "from-blue-400 to-indigo-500",
    tasks: [
      "Mettre de l'ordre dans ses documents",
      "Terminer un projet en cours",
      "Planifier quelque chose pour l'été"
    ]
  },
  // Juin - Été arrive
  6: {
    name: "Premiers Rayons",
    emoji: "☀️",
    avatar: "🌞",
    avatarBg: "from-yellow-300 to-orange-400",
    tasks: [
      "Profiter d'un coucher de soleil",
      "Faire une balade en extérieur",
      "Manger une glace ou un fruit de saison"
    ]
  },
  // Juillet - Vacances
  7: {
    name: "Évasion Estivale",
    emoji: "🏖️",
    avatar: "🏖️",
    avatarBg: "from-cyan-400 to-blue-500",
    tasks: [
      "Découvrir un nouvel endroit",
      "Faire une digital detox d'une journée",
      "Apprendre quelque chose de nouveau"
    ]
  },
  // Août - Détente
  8: {
    name: "Sérénité",
    emoji: "🌴",
    avatar: "🧘",
    avatarBg: "from-green-400 to-teal-500",
    tasks: [
      "Lire un livre en entier",
      "Passer une journée sans écran",
      "Faire une activité qu'on n'a jamais faite"
    ]
  },
  // Septembre - Rentrée
  9: {
    name: "Nouveau Chapitre",
    emoji: "📚",
    avatar: "📚",
    avatarBg: "from-amber-400 to-orange-500",
    tasks: [
      "Organiser son espace de travail",
      "Reprendre un bon rythme de sommeil",
      "Fixer un nouvel objectif"
    ]
  },
  // Octobre - Halloween
  10: {
    name: "Frissons d'Automne",
    emoji: "🎃",
    avatar: "🎃",
    avatarBg: "from-orange-500 to-red-600",
    tasks: [
      "Écraser une feuille friable dans sa main",
      "Se balader sous les couleurs d'automne",
      "Affronter une petite peur"
    ]
  },
  // Novembre - Gratitude
  11: {
    name: "Gratitude",
    emoji: "🍁",
    avatar: "🍂",
    avatarBg: "from-orange-400 to-amber-600",
    tasks: [
      "Soirée film et chocolat chaud",
      "Écrire un message à quelqu'un en lui expliquant pourquoi on lui est reconnaissant",
      "Faire une balade en sentant l'air frais sur son visage"
    ]
  },
  // Décembre - Fêtes
  12: {
    name: "Magie des Fêtes",
    emoji: "🎄",
    avatar: "🎅",
    avatarBg: "from-red-500 to-green-600",
    tasks: [
      "Écrire une carte de vœux à quelqu'un",
      "Faire un acte de gentillesse aléatoire",
      "Appeler un proche qu'on n'a pas vu depuis longtemps"
    ]
  }
};

export const useSeasonalChallenges = (userId, userAvatar, userAvatarBg) => {
  const [challengeData, setChallengeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtenir le mois actuel (1-12)
  const currentMonth = new Date().getMonth() + 1;
  
  // Défi du mois actuel
  const currentChallenge = useMemo(() => SEASONAL_CHALLENGES[currentMonth], [currentMonth]);

  // Charger les données du défi
  const loadChallengeData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('seasonal_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('month', currentMonth)
        .eq('year', new Date().getFullYear())
        .single();

      if (data) {
        setChallengeData(data);
      } else {
        // Pas encore de données pour ce mois
        setChallengeData(null);
      }
    } catch (error) {
      // Pas de données trouvées, c'est normal
      setChallengeData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallengeData();
  }, [userId, currentMonth]);

  // Accepter le défi
  const acceptChallenge = async () => {
    if (!userId || !currentChallenge) return;

    const newData = {
      user_id: userId,
      month: currentMonth,
      year: new Date().getFullYear(),
      accepted: true,
      ignored: false,
      tasks_completed: [false, false, false],
      completed: false,
      avatar_claimed: false,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('seasonal_challenges')
        .upsert(newData, { onConflict: 'user_id,month,year' })
        .select()
        .single();

      if (data) {
        setChallengeData(data);
      }
    } catch (error) {
      console.error('Erreur acceptation défi:', error);
    }
  };

  // Ignorer le défi
  const ignoreChallenge = async () => {
    if (!userId) return;

    const newData = {
      user_id: userId,
      month: currentMonth,
      year: new Date().getFullYear(),
      accepted: false,
      ignored: true,
      tasks_completed: [false, false, false],
      completed: false,
      avatar_claimed: false,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('seasonal_challenges')
        .upsert(newData, { onConflict: 'user_id,month,year' })
        .select()
        .single();

      if (data) {
        setChallengeData(data);
      }
    } catch (error) {
      console.error('Erreur ignorance défi:', error);
    }
  };

  // Compléter une tâche du défi
  const completeTask = async (taskIndex) => {
    if (!userId || !challengeData) return null;

    const newTasksCompleted = [...challengeData.tasks_completed];
    newTasksCompleted[taskIndex] = true;
    
    const allCompleted = newTasksCompleted.every(t => t);

    try {
      const { data, error } = await supabase
        .from('seasonal_challenges')
        .update({ 
          tasks_completed: newTasksCompleted,
          completed: allCompleted
        })
        .eq('id', challengeData.id)
        .select()
        .single();

      if (data) {
        setChallengeData(data);
        
        // Retourner les récompenses si tout est complété
        if (allCompleted) {
          return {
            completed: true,
            avatar: currentChallenge.avatar,
            avatarBg: currentChallenge.avatarBg
          };
        }
      }
      return { completed: false };
    } catch (error) {
      console.error('Erreur complétion tâche:', error);
      return null;
    }
  };

  // Réclamer l'avatar
  const claimAvatar = async () => {
    if (!userId || !challengeData || !challengeData.completed) return false;

    try {
      await supabase
        .from('seasonal_challenges')
        .update({ avatar_claimed: true })
        .eq('id', challengeData.id);

      setChallengeData({ ...challengeData, avatar_claimed: true });
      return true;
    } catch (error) {
      console.error('Erreur réclamation avatar:', error);
      return false;
    }
  };

  // Compter le nombre de défis complétés (pour le badge)
  const getChallengesCompleted = async () => {
    if (!userId) return 0;

    try {
      const { data, error } = await supabase
        .from('seasonal_challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('completed', true);

      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  };

  // État du défi
  const challengeStatus = useMemo(() => {
    if (!challengeData) return 'available'; // Pas encore vu
    if (challengeData.ignored) return 'ignored';
    if (challengeData.completed && challengeData.avatar_claimed) return 'claimed';
    if (challengeData.completed) return 'completed';
    if (challengeData.accepted) return 'in_progress';
    return 'available';
  }, [challengeData]);

  // Vérifier si l'utilisateur a l'avatar saisonnier équipé
  const hasSeasonalAvatar = userAvatar === currentChallenge?.avatar;

  return {
    currentChallenge,
    challengeData,
    challengeStatus,
    loading,
    acceptChallenge,
    ignoreChallenge,
    completeTask,
    claimAvatar,
    getChallengesCompleted,
    hasSeasonalAvatar,
    SEASONAL_CHALLENGES
  };
};
