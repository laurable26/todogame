import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Questions pour le bilan hebdomadaire
const WEEKLY_QUESTIONS = [
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

// Emojis d'humeur disponibles
const MOOD_OPTIONS = [
  { emoji: '😄', label: 'Joie', value: 'joie' },
  { emoji: '😠', label: 'Colère', value: 'colere' },
  { emoji: '😨', label: 'Peur', value: 'peur' },
  { emoji: '😢', label: 'Tristesse', value: 'tristesse' },
  { emoji: '🤢', label: 'Dégoût', value: 'degout' }
];

export const useJournaling = (userId) => {
  const [todayEntry, setTodayEntry] = useState(null);
  const [weeklyEntry, setWeeklyEntry] = useState(null);
  const [settings, setSettings] = useState({ weeklyDay: 5 }); // 5 = vendredi par défaut
  const [loading, setLoading] = useState(true);
  const [weeklyQuestions, setWeeklyQuestions] = useState([]);

  // Obtenir la date du jour (format YYYY-MM-DD)
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obtenir le lundi de la semaine courante
  const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  // Vérifier si c'est le jour du bilan hebdo
  const isWeeklyDay = () => {
    const today = new Date();
    return today.getDay() === settings.weeklyDay;
  };

  // Vérifier si c'est après 16h
  const isAfter4PM = () => {
    const now = new Date();
    return now.getHours() >= 16;
  };

  // Sélectionner 3 questions aléatoires
  const selectRandomQuestions = () => {
    const shuffled = [...WEEKLY_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  // Charger les données
  const loadData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const todayDate = getTodayDate();
      const weekStart = getWeekStart();

      // Charger l'entrée du jour
      const { data: entryData } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', todayDate)
        .single();

      if (entryData) {
        setTodayEntry(entryData);
      }

      // Charger le bilan de la semaine
      const { data: weeklyData } = await supabase
        .from('journal_weekly')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single();

      if (weeklyData) {
        setWeeklyEntry(weeklyData);
      }

      // Charger les paramètres
      const { data: settingsData } = await supabase
        .from('journal_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }

      // Sélectionner les questions si c'est le jour du bilan
      if (!weeklyData && isWeeklyDay()) {
        setWeeklyQuestions(selectRandomQuestions());
      }

    } catch (error) {
      console.error('Erreur chargement journal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // Sauvegarder l'entrée quotidienne
  const saveEntry = async (mood, rating) => {
    if (!userId) return;

    const todayDate = getTodayDate();
    
    try {
      const entryData = {
        user_id: userId,
        date: todayDate,
        mood,
        rating
      };

      const { data, error } = await supabase
        .from('journal_entries')
        .upsert(entryData, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) throw error;
      
      setTodayEntry(data);
      return data;
    } catch (error) {
      console.error('Erreur sauvegarde entrée:', error);
      return null;
    }
  };

  // Sauvegarder le bilan hebdomadaire
  const saveWeeklyAnswers = async (answers) => {
    if (!userId) return;

    const weekStart = getWeekStart();
    
    try {
      const weeklyData = {
        user_id: userId,
        week_start: weekStart,
        questions: answers // [{question: "...", answer: "..."}]
      };

      const { data, error } = await supabase
        .from('journal_weekly')
        .upsert(weeklyData, { onConflict: 'user_id,week_start' })
        .select()
        .single();

      if (error) throw error;
      
      setWeeklyEntry(data);
      return data;
    } catch (error) {
      console.error('Erreur sauvegarde bilan:', error);
      return null;
    }
  };

  // Mettre à jour le jour du bilan
  const updateWeeklyDay = async (day) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('journal_settings')
        .upsert({ user_id: userId, weekly_day: day }, { onConflict: 'user_id' });

      if (error) throw error;
      
      setSettings({ ...settings, weeklyDay: day });
    } catch (error) {
      console.error('Erreur mise à jour paramètres:', error);
    }
  };

  // Récupérer les stats pour la page Statistiques
  const getStats = async () => {
    if (!userId) return null;

    try {
      // Entrées des 4 dernières semaines
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: entries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', fourWeeksAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Bilans hebdomadaires
      const { data: weeklies } = await supabase
        .from('journal_weekly')
        .select('*')
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(12);

      // Calculer les moyennes par semaine
      const weeklyAverages = [];
      if (entries) {
        const entriesByWeek = {};
        entries.forEach(entry => {
          const weekStart = getWeekStart(new Date(entry.date));
          if (!entriesByWeek[weekStart]) {
            entriesByWeek[weekStart] = [];
          }
          entriesByWeek[weekStart].push(entry.rating);
        });

        Object.keys(entriesByWeek).forEach(week => {
          const ratings = entriesByWeek[week];
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          weeklyAverages.push({ week, average: Math.round(avg * 10) / 10 });
        });
      }

      return {
        weeklyAverages,
        weeklies: weeklies || [],
        recentEntries: entries || []
      };
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      return null;
    }
  };

  // Vérifier si le modal doit s'afficher (papillon visible)
  const shouldShowModal = () => {
    // Si pas encore rempli aujourd'hui
    if (!todayEntry?.mood || !todayEntry?.rating) {
      return true;
    }
    // Si c'est le jour du bilan et pas encore fait
    if (isWeeklyDay() && !weeklyEntry) {
      return true;
    }
    return false;
  };

  // Vérifier si c'est le jour du bilan et s'il faut afficher les questions
  const shouldShowWeeklyQuestions = () => {
    return isWeeklyDay() && !weeklyEntry && todayEntry?.mood && todayEntry?.rating;
  };

  return {
    todayEntry,
    weeklyEntry,
    settings,
    loading,
    weeklyQuestions,
    MOOD_OPTIONS,
    WEEKLY_QUESTIONS,
    saveEntry,
    saveWeeklyAnswers,
    updateWeeklyDay,
    getStats,
    shouldShowModal,
    shouldShowWeeklyQuestions,
    isWeeklyDay,
    loadData
  };
};
