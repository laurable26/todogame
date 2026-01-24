import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useTutorial = (userId) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger l'état du tutoriel
  useEffect(() => {
    const loadTutorialStatus = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('tutorial_completed')
          .eq('id', userId)
          .single();

        if (data) {
          setTutorialCompleted(data.tutorial_completed || false);
          
          // Afficher le tuto automatiquement si pas encore complété
          if (!data.tutorial_completed) {
            setShowTutorial(true);
          }
        }
      } catch (error) {
        console.error('Erreur chargement statut tuto:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTutorialStatus();
  }, [userId]);

  // Marquer le tuto comme complété
  const completeTutorial = async () => {
    if (!userId) return;

    try {
      await supabase
        .from('profiles')
        .update({ tutorial_completed: true })
        .eq('id', userId);

      setTutorialCompleted(true);
      setShowTutorial(false);
    } catch (error) {
      console.error('Erreur completion tuto:', error);
    }
  };

  // Passer le tuto (marquer comme complété)
  const skipTutorial = async () => {
    await completeTutorial();
  };

  // Relancer le tuto (depuis Settings)
  const restartTutorial = () => {
    setShowTutorial(true);
  };

  return {
    showTutorial,
    tutorialCompleted,
    loading,
    completeTutorial,
    skipTutorial,
    restartTutorial
  };
};

export default useTutorial;
