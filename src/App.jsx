import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameData } from './hooks/useGameData';
import { useNotifications } from './hooks/useNotifications';
import { useJournaling } from './hooks/useJournaling';
import { useCalendarSync } from './hooks/useCalendarSync';
import { useSeasonalChallenges } from './hooks/useSeasonalChallenges';
import { AuthScreen, OnboardingScreen, LoadingScreen } from './components/AuthScreens';
import { Header, Navigation } from './components/Header';
import { TasksPage } from './components/TasksPage';
import { FriendsPage } from './components/FriendsPage';
import { ChestOpeningModal } from './components/ChestModal';
import { BadgesPage } from './components/BadgesPage';
import { ShopPage } from './components/ShopPage';
import { StatsPage } from './components/StatsPage';
import { DailyQuoteCard, DailyQuoteButton } from './components/DailyQuote';
import { JournalingButterfly } from './components/JournalingButterfly';
import { SeasonalChallengeBanner } from './components/SeasonalChallengeBanner';
import { Vault, VaultButton } from './components/Vault';
import { ControlCenter } from './components/ControlCenter';
import { WidgetPage, WidgetInstructions } from './components/WidgetPage';
import { ChifoumiNotificationModal } from './components/ChifoumiGame';
import { 
  CreateTaskModal, 
  ChestOpenedModal, 
  TaskCompletedModal,
  MissionCompletedModal,
  SettingsModal,
  CreateMissionModal,
  MissionDetailModal,
  CreateMissionQuestModal,
  EditMissionQuestModal,
  BadgeUnlockedModal,
  RiddleModal,
  ShareInvitationModal
} from './components/Modals';
import { getDailyRiddle } from './data/riddles';
import { supabase } from './supabaseClient';
import HabitTracker from './components/HabitTracker';

const QuestApp = () => {
  // Vérifier si on est sur la page widget
  if (window.location.pathname === '/widget') {
    return <WidgetPage />;
  }

  // Auth
  const {
    isLoggedIn,
    setIsLoggedIn,
    authMode,
    setAuthMode,
    authLoading,
    supabaseUser,
    handleLogin,
    handleRegister,
    handleLogout,
  } = useAuth();

  // Game data
  const {
    user,
    setUser,
    updateUser,
    chests,
    setChests,
    updateChests,
    tasks,
    setTasks,
    missions,
    setMissions,
    friends,
    setFriends,
    friendRequests,
    setFriendRequests,
    ownedItems,
    setOwnedItems,
    equippedItems,
    setEquippedItems,
    badges,
    checkAndUpdateBadges,
    shopItems,
    saveProfile,
    saveChests,
    saveOwnedItems,
    saveEquippedItems,
    saveFriend,
    saveMission,
    deleteMission: deleteMissionFromDB,
    saveTask,
    checkPseudoAvailable,
    // Thème
    theme,
    setColorTheme,
    toggleDarkMode,
    // Boosts
    activeBoosts,
    setActiveBoosts,
    activateBoost,
    getXpMultiplier,
    getPotatoesMultiplier,
    // Améliorations
    activeUpgrades,
    toggleUpgrade,
    isUpgradeActive,
  } = useGameData(supabaseUser);

  // Notifications push
  const {
    notificationStatus,
    enableNotifications,
    disableNotifications,
    inAppNotification,
    dismissInAppNotification,
    isSupported: isNotificationSupported
  } = useNotifications(supabaseUser?.id);

  // State pour l'animation de badge débloqué
  const [unlockedBadge, setUnlockedBadge] = useState(null);

  // UI state - avec persistance localStorage
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('todogame_currentPage');
    return saved || 'tasks';
  });
  const [shopDefaultTab, setShopDefaultTab] = useState('avatar');
  const [tasksView, setTasksView] = useState(() => {
    const saved = localStorage.getItem('todogame_tasksView');
    return saved || 'today';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [creatingMission, setCreatingMission] = useState(false);
  const [creatingMissionQuest, setCreatingMissionQuest] = useState(null);
  const [creatingMissionEvent, setCreatingMissionEvent] = useState(null);
  const [editingQuest, setEditingQuest] = useState(null);
  const [completingMission, setCompletingMission] = useState(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [openingChest, setOpeningChest] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRiddle, setShowRiddle] = useState(null); // { level: 1|2|3, riddle: {...} }
  const [riddlesDoneToday, setRiddlesDoneToday] = useState([]);
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [pendingNotification, setPendingNotification] = useState(null);
  const [pendingShareInvitation, setPendingShareInvitation] = useState(null);
  const [showVault, setShowVault] = useState(false);
  const [ignoredInvitations, setIgnoredInvitations] = useState(() => {
    // Charger les invitations ignorées depuis localStorage
    const saved = localStorage.getItem('ignoredInvitations');
    return saved ? JSON.parse(saved) : [];
  });

  // Hook pour le journaling
  const journaling = useJournaling(supabaseUser?.id);

  // Hook pour la synchronisation des calendriers
  const calendarSync = useCalendarSync(supabaseUser?.id);

  // Hook pour les défis saisonniers
  const seasonalChallenges = useSeasonalChallenges(supabaseUser?.id, user.avatar, user.avatarBg);

  // Vérifier si l'amélioration Citation du Jour est active
  const hasDailyQuote = ownedItems.includes(90) && activeUpgrades[90] !== false;
  
  // Vérifier si l'amélioration Journaling est active
  const hasJournaling = ownedItems.includes(91) && activeUpgrades[91] !== false;

  // Vérifier si l'amélioration Habit Tracker est active
  const hasHabitTracker = ownedItems.includes(93) && activeUpgrades[93] !== false;
  const [showHabitTracker, setShowHabitTracker] = useState(false);
  const [showJournalingModal, setShowJournalingModal] = useState(false);
  const [showWidgetInstructions, setShowWidgetInstructions] = useState(false);

  // Charger et écouter les notifications en temps réel
  useEffect(() => {
    if (!supabaseUser) return;

    // Charger les notifications non lues au démarrage
    const loadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setPendingNotification(data[0]);
      }
    };
    
    loadNotifications();

    // Écouter les nouvelles notifications en temps réel
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabaseUser.id}`,
        },
        (payload) => {
          setPendingNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseUser]);

  // Marquer une notification comme lue
  const dismissNotification = async () => {
    if (pendingNotification && supabaseUser) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', pendingNotification.id);
    }
    setPendingNotification(null);
  };

  // Charger l'historique des énigmes du jour depuis Supabase
  useEffect(() => {
    const loadRiddlesHistory = async () => {
      if (!supabaseUser) return;
      
      const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
      console.log('Chargement énigmes pour la date:', today);
      
      const { data, error } = await supabase
        .from('riddles_history')
        .select('level, riddle_date')
        .eq('user_id', supabaseUser.id)
        .eq('riddle_date', today);
      
      console.log('Énigmes trouvées:', data, 'Erreur:', error);
      
      if (!error && data) {
        setRiddlesDoneToday(data.map(r => r.level));
      }
    };
    
    loadRiddlesHistory();
  }, [supabaseUser]);

  // Détecter les invitations de partage en attente
  useEffect(() => {
    if (!supabaseUser || !user.pseudo) {
      console.log('🔍 Skip invitation check - pas de user:', { supabaseUser: !!supabaseUser, pseudo: user.pseudo });
      return;
    }
    
    const checkPendingInvitations = async () => {
      console.log('🔍 ========== RECHERCHE INVITATIONS ==========');
      console.log('🔍 Mon user_id:', supabaseUser.id);
      console.log('🔍 Mon pseudo:', user.pseudo);
      
      // Chercher TOUTES les tâches sans filtre RLS - utiliser une approche différente
      const { data: allTasks, error: allError } = await supabase
        .from('tasks')
        .select('*');
      
      console.log('🔍 TOUTES les tâches visibles:', allTasks?.length, 'Erreur:', allError);
      
      // Filtrer côté client les tâches où je suis invité avec accepted: false
      const pendingInvitations = (allTasks || []).filter(task => {
        // Ignorer mes propres tâches
        if (task.user_id === supabaseUser.id) return false;
        
        // Ignorer les invitations déjà ignorées/refusées
        if (ignoredInvitations.includes(task.id)) return false;
        
        if (!task.participants || !Array.isArray(task.participants)) return false;
        
        const myParticipation = task.participants.find(p => p.pseudo === user.pseudo);
        console.log('🔍 Check tâche:', task.title, '| user_id:', task.user_id, '| Mon pseudo:', user.pseudo, '| Ma participation:', myParticipation);
        
        const isPending = myParticipation && myParticipation.accepted === false;
        
        if (isPending) {
          console.log('✅ INVITATION TROUVÉE:', task.title);
        }
        
        return isPending;
      });
      
      console.log('🔍 Total invitations en attente:', pendingInvitations.length);
      console.log('🔍 ============================================');
      
      // Afficher la première invitation en attente
      if (pendingInvitations.length > 0 && !pendingShareInvitation) {
        const invitation = pendingInvitations[0];
        
        // Trouver le pseudo du créateur (participant avec accepted: true qui n'est pas nous)
        const ownerParticipant = invitation.participants?.find(p => p.pseudo !== user.pseudo && p.accepted === true);
        
        console.log('🎉 INVITATION DÉTECTÉE:', {
          taskTitle: invitation.title,
          ownerParticipant
        });
        
        setPendingShareInvitation({
          taskId: invitation.id,
          taskTitle: invitation.title,
          taskDate: invitation.date ? new Date(invitation.date) : null,
          taskTime: invitation.time,
          taskDuration: invitation.duration,
          taskStatus: invitation.status,
          taskTags: invitation.tags || [],
          taskLocation: invitation.location,
          ownerPseudo: ownerParticipant?.pseudo || 'Un ami',
          ownerAvatar: ownerParticipant?.avatar || '😀',
        });
      }
    };
    
    checkPendingInvitations();
    
    // Vérifier périodiquement (toutes les 10 secondes)
    const interval = setInterval(checkPendingInvitations, 10000);
    
    return () => clearInterval(interval);
  }, [user.pseudo, supabaseUser, pendingShareInvitation, ignoredInvitations]);

  // Accepter une invitation de partage
  const acceptShareInvitation = async (taskId) => {
    console.log('✅ Acceptation invitation pour tâche:', taskId);
    
    // Récupérer la tâche depuis Supabase
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error || !taskData) {
      console.error('❌ Erreur récupération tâche:', error);
      setPendingShareInvitation(null);
      return;
    }
    
    // Mettre à jour les participants
    const updatedParticipants = taskData.participants.map(p => 
      p.pseudo === user.pseudo ? { ...p, accepted: true } : p
    );
    
    // Sauvegarder dans Supabase
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ participants: updatedParticipants })
      .eq('id', taskId);
    
    if (updateError) {
      console.error('❌ Erreur mise à jour participants:', updateError);
    } else {
      console.log('✅ Invitation acceptée avec succès');
      
      // Ajouter la tâche à la liste locale
      const newTask = {
        id: taskData.id,
        title: taskData.title,
        status: taskData.status || 'à faire',
        duration: taskData.duration,
        date: taskData.date ? new Date(taskData.date) : null,
        category: taskData.category,
        completed: taskData.completed,
        tags: taskData.tags || [],
        recurrence: taskData.recurrence || 'none',
        recurrenceDays: taskData.recurrence_days || [],
        notes: taskData.notes || '',
        photos: taskData.photos || [],
        participants: updatedParticipants,
        ownerId: taskData.user_id,
        isSharedWithMe: true,
        time: taskData.time || '',
        location: taskData.location || '',
        reminder: taskData.reminder || 'none',
        description: taskData.description || '',
        completedBy: taskData.completed_by || [],
        missionId: taskData.mission_id,
        assignedTo: taskData.assigned_to,
      };
      
      setTasks(prevTasks => [...prevTasks, newTask]);
    }
    
    setPendingShareInvitation(null);
  };

  // Refuser une invitation de partage
  const declineShareInvitation = async (taskId) => {
    console.log('❌ Refus invitation pour tâche:', taskId);
    
    // Ajouter aux invitations ignorées et sauvegarder
    const newIgnored = [...ignoredInvitations, taskId];
    setIgnoredInvitations(newIgnored);
    localStorage.setItem('ignoredInvitations', JSON.stringify(newIgnored));
    
    // Récupérer la tâche depuis Supabase
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error || !taskData) {
      console.error('❌ Erreur récupération tâche:', error);
      setPendingShareInvitation(null);
      return;
    }
    
    // Retirer l'utilisateur des participants
    const updatedParticipants = taskData.participants.filter(p => p.pseudo !== user.pseudo);
    
    // Mettre à jour la tâche dans Supabase
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ participants: updatedParticipants })
      .eq('id', taskId);
    
    if (updateError) {
      console.error('❌ Erreur mise à jour participants:', updateError);
    } else {
      console.log('✅ Invitation refusée avec succès');
    }
    
    setPendingShareInvitation(null);
  };

  // Fonction pour marquer une énigme comme faite
  const markRiddleDone = async (level, solved) => {
    if (!supabaseUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    await supabase
      .from('riddles_history')
      .upsert({
        user_id: supabaseUser.id,
        riddle_date: today,
        level: level,
        solved: solved
      }, {
        onConflict: 'user_id,riddle_date,level'
      });
    
    setRiddlesDoneToday(prev => [...prev, level]);
    
    // Incrémenter le compteur de riddlesSolved si résolue
    if (solved) {
      const newRiddlesSolved = (user.riddlesSolved || 0) + 1;
      const updatedUser = { ...user, riddlesSolved: newRiddlesSolved };
      updateUser(updatedUser);
      
      // Vérifier les badges
      checkAndUpdateBadges({
        ...updatedUser,
        riddlesSolved: newRiddlesSolved,
        friendsCount: friends.length,
      });
    }
  };

  // Sauvegarder currentPage dans localStorage
  useEffect(() => {
    localStorage.setItem('todogame_currentPage', currentPage);
  }, [currentPage]);

  // Sauvegarder tasksView dans localStorage
  useEffect(() => {
    localStorage.setItem('todogame_tasksView', tasksView);
  }, [tasksView]);

  // Reporter automatiquement les tâches non faites à des dates passées vers aujourd'hui
  useEffect(() => {
    const checkAndReportAllTasks = async () => {
      if (!tasks || tasks.length === 0 || !supabaseUser) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Trouver TOUTES les tâches passées non terminées (avec ou sans heure)
      const tasksToReport = tasks.filter(task => {
        if (task.completed) return false;
        if (!task.date) return false;
        // Ne pas reporter les tâches partagées dont on n'est pas propriétaire
        if (task.isSharedWithMe) return false;
        
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        
        // Si la date de la tâche est avant aujourd'hui, on la reporte
        return taskDate < today;
      });
      
      if (tasksToReport.length === 0) return;
      
      console.log(`Report automatique de ${tasksToReport.length} tâche(s) non terminée(s) à aujourd'hui`);
      
      // Mettre à jour les tâches localement
      const updatedTasks = tasks.map(task => {
        if (tasksToReport.some(t => t.id === task.id)) {
          return { ...task, date: today };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      
      // Mettre à jour dans Supabase - en batch pour plus de fiabilité
      const taskIds = tasksToReport.map(t => t.id);
      try {
        await supabase
          .from('tasks')
          .update({ date: today.toISOString() })
          .in('id', taskIds);
        console.log('Tâches reportées avec succès dans Supabase');
      } catch (error) {
        console.error('Erreur lors du report des tâches:', error);
      }
    };
    
    // Petit délai pour s'assurer que les tâches sont bien chargées
    const timer = setTimeout(checkAndReportAllTasks, 500);
    return () => clearTimeout(timer);
  }, [tasks.length, supabaseUser]); // Se déclenche quand les tâches sont chargées

  // Recherche d'utilisateurs via Supabase
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('pseudo, avatar, level, pq_season')
          .ilike('pseudo', `%${searchQuery}%`)
          .neq('pseudo', user.pseudo)
          .limit(10);
        
        if (error) throw error;
        
        // Filtrer les amis déjà ajoutés
        const filtered = (data || [])
          .filter(u => !friends.some(f => f.pseudo === u.pseudo))
          .map(u => ({
            pseudo: u.pseudo,
            avatar: u.avatar || '😀',
            level: u.level || 1,
            pqSeason: u.pq_season || 0
          }));
        
        setSearchResults(filtered);
      } catch (err) {
        console.error('Erreur recherche:', err);
        setSearchResults([]);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user.pseudo, friends]);

  // Helpers
  const getStatusColor = (status) => {
    const colors = {
      'urgent': 'bg-red-50 border-red-200 text-red-700',
      'à faire': 'bg-blue-50 border-blue-200 text-blue-700',
      'délégué': 'bg-purple-50 border-purple-200 text-purple-700',
    };
    return colors[status] || '';
  };

  // Extraire tous les tags uniques des tâches existantes
  const existingTags = [...new Set(
    tasks
      .flatMap(task => task.tags || [])
      .filter(tag => tag && tag.trim())
  )];

  const getStatusMultiplier = (status) => {
    return status === 'urgent' ? 1.5 : 1;
  };

  const getDurationBase = (duration) => {
    const base = { '-1h': 10, '1h-2h': 20, '1/2 jour': 40, '1 jour': 80 };
    return base[duration] || 10;
  };

  const getDurationXP = (duration, status = 'à faire') => {
    return Math.round(getDurationBase(duration) * getStatusMultiplier(status));
  };

  const getDurationPoints = (duration, status = 'à faire') => {
    return Math.round(getDurationBase(duration) * getStatusMultiplier(status));
  };

  const getModeLabel = (mode) => {
    const labels = { 'rapidite': 'Rapidité', 'repartition': 'Répartition', 'collaboratif': 'Collaboratif' };
    return labels[mode] || mode;
  };

  const getRecurrenceLabel = (task) => {
    if (!task.recurrence || task.recurrence === 'none') return null;
    if (task.recurrence === 'daily') return '🔄 Tous les jours';
    if (task.recurrence === 'weekly') return '🔄 Toutes les semaines';
    if (task.recurrence === 'monthly') return '🔄 Tous les mois';
    return null;
  };

  const getXpForLevel = (level) => {
    // XP requis = 80 + (niveau × 20)
    return 80 + (level * 20);
  };

  // Calcul des PQ pour une mission terminée
  const calculateMissionPQ = (mission, participants) => {
    // Vérifier si le boost mission est actif
    const hasMissionBoost = activeBoosts.some(b => b.type === 'mission_boost');
    const missionMultiplier = hasMissionBoost ? 2 : 1;

    // Calculer la contribution totale et par joueur
    const contributions = {};
    let totalContribution = 0;

    mission.quests.forEach(quest => {
      if (quest.completed && quest.assignedTo) {
        const base = getDurationBase(quest.duration);
        const multiplier = getStatusMultiplier(quest.status);
        const contribution = base * multiplier;
        
        if (!contributions[quest.assignedTo]) {
          contributions[quest.assignedTo] = { xp: 0, tookUnassigned: false };
        }
        contributions[quest.assignedTo].xp += contribution;
        totalContribution += contribution;

        // Bonus si le joueur a pris une tâche non attribuée à l'origine
        if (quest.wasUnassigned) {
          contributions[quest.assignedTo].tookUnassigned = true;
        }
      }
    });

    // Répartir 100 PQ selon les contributions (x2 si boost actif)
    const basePQ = 100 * missionMultiplier;
    const pqResults = {};
    Object.keys(contributions).forEach(playerId => {
      const playerContrib = contributions[playerId];
      let pq = Math.round(basePQ * (playerContrib.xp / totalContribution));
      
      // Bonus +10 PQ pour ceux qui ont pris des tâches non attribuées
      if (playerContrib.tookUnassigned) {
        pq += 10;
      }
      
      pqResults[playerId] = pq;
    });

    // Si boost mission utilisé, le désactiver après cette mission
    if (hasMissionBoost) {
      const updatedBoosts = activeBoosts.filter(b => b.type !== 'mission_boost');
      setActiveBoosts(updatedBoosts);
    }

    return pqResults;
  };

  // Actions
  // Supprimer fuseChests - plus de fusion dans le nouveau système

  // Nouveau système d'ouverture de coffre avec clés
  const openChest = () => {
    if (chests.keys < 6) return;

    // Incrémenter le compteur de super coffre
    let newSuperCounter = chests.superChestCounter + 1;
    
    // Déterminer si c'est un super coffre (garanti entre 10 et 15)
    let isSuperChest = false;
    if (newSuperCounter >= 15) {
      isSuperChest = true;
    } else if (newSuperCounter >= 10) {
      // Entre 10 et 15, chance aléatoire croissante
      const chanceOfSuper = (newSuperCounter - 9) * 0.2; // 20% à 10, 40% à 11, etc.
      isSuperChest = Math.random() < chanceOfSuper;
    }
    
    // Reset le compteur si super coffre
    if (isSuperChest) {
      newSuperCounter = 0;
    }

    // Récompenses selon le type de coffre
    let potatoes;
    let wonItem = null;

    if (isSuperChest) {
      // SUPER COFFRE : 100-300 patates + amélioration OU boost
      potatoes = 100 + Math.floor(Math.random() * 201);
      
      // Liste des améliorations et boosts possibles (ceux pas encore possédés pour les améliorations)
      const possibleUpgrades = shopItems.filter(item => 
        item.type === 'amelioration' && !ownedItems.includes(item.id)
      );
      
      const possibleBoosts = shopItems.filter(item => 
        item.type === 'boost'
      );
      
      // 60% amélioration, 40% boost
      if (possibleUpgrades.length > 0 && Math.random() < 0.6) {
        wonItem = possibleUpgrades[Math.floor(Math.random() * possibleUpgrades.length)];
      } else if (possibleBoosts.length > 0) {
        wonItem = possibleBoosts[Math.floor(Math.random() * possibleBoosts.length)];
      } else if (possibleUpgrades.length > 0) {
        // Fallback si pas de boost
        wonItem = possibleUpgrades[Math.floor(Math.random() * possibleUpgrades.length)];
      }
    } else {
      // COFFRE NORMAL : 20-80 patates + 10% chance avatar/fond exclusif
      potatoes = 20 + Math.floor(Math.random() * 61);
      
      // 10% de chance d'obtenir un avatar ou fond exclusif
      if (Math.random() < 0.1) {
        const exclusiveItems = shopItems.filter(item => 
          item.chestExclusive && !ownedItems.includes(item.id)
        );
        
        if (exclusiveItems.length > 0) {
          wonItem = exclusiveItems[Math.floor(Math.random() * exclusiveItems.length)];
        }
      }
    }

    // Ajouter l'item gagné aux possessions
    if (wonItem) {
      setOwnedItems(prev => [...prev, wonItem.id]);
      saveOwnedItems([...ownedItems, wonItem.id]);
    }

    // Mettre à jour les clés et le compteur
    const newChests = { 
      keys: chests.keys - 6, 
      superChestCounter: newSuperCounter 
    };
    
    // Mettre à jour les patates et stats
    const newChestsOpened = (user.chestsOpened || 0) + 1;
    const newTotalPotatoes = (user.totalPotatoes || 0) + potatoes;
    const newUser = { 
      ...user, 
      potatoes: user.potatoes + potatoes,
      chestsOpened: newChestsOpened,
      totalPotatoes: newTotalPotatoes,
    };
    
    updateChests(newChests);
    updateUser(newUser);
    
    // Vérifier les badges
    checkAndUpdateBadges({
      ...newUser,
      chestsOpened: newChestsOpened,
      totalPotatoes: newTotalPotatoes,
      friendsCount: friends.length,
    });
    
    // Afficher le modal avec les récompenses
    setOpeningChest({ 
      isSuperChest,
      rewards: { 
        potatoes, 
        item: wonItem 
      } 
    });
  };

  // Ajouter une clé (appelé quand une tâche/événement est complété)
  const addKey = () => {
    const newChests = { ...chests, keys: chests.keys + 1 };
    updateChests(newChests);
  };

  const buyItem = (item) => {
    if (user.potatoes < item.price) return;
    
    // Boosts - consommables (peuvent être rachetés)
    if (item.type === 'boost') {
      if (item.instant) {
        // Boost instantané
        if (item.boostType === 'starter_pack') {
          // Pack démarrage: +500 patates + 50 XP
          let newXp = user.xp + 50;
          let newLevel = user.level;
          let newXpToNext = user.xpToNext;
          while (newXp >= newXpToNext) {
            newXp -= newXpToNext;
            newLevel += 1;
            newXpToNext = getXpForLevel(newLevel);
          }
          updateUser({ 
            ...user, 
            potatoes: user.potatoes - item.price + 500,
            xp: newXp,
            level: newLevel,
            xpToNext: newXpToNext
          });
        } else if (item.boostType === 'lucky_chest') {
          // Lucky chest - clés bonus avec chance de super coffre forcé
          const rand = Math.random();
          let keysToAdd = 6; // Minimum pour ouvrir un coffre
          if (rand < 0.3) {
            keysToAdd = 12; // 30% chance de 2 ouvertures
          } else if (rand < 0.1) {
            keysToAdd = 18; // 10% chance de 3 ouvertures
          }
          const newChests = { ...chests, keys: chests.keys + keysToAdd };
          setChests(newChests);
          saveChests(newChests);
          updateUser({ ...user, potatoes: user.potatoes - item.price });
        } else if (item.boostType === 'instant_silver_chest') {
          // Coffre splendide -> 10 clés
          const newChests = { ...chests, keys: chests.keys + 10 };
          setChests(newChests);
          saveChests(newChests);
          updateUser({ ...user, potatoes: user.potatoes - item.price });
        } else if (item.boostType === 'instant_gold_chest') {
          // Coffre diamant -> 15 clés
          const newChests = { ...chests, keys: chests.keys + 15 };
          setChests(newChests);
          saveChests(newChests);
          updateUser({ ...user, potatoes: user.potatoes - item.price });
        }
      } else {
        // Boost temporaire - vérifier si un boost similaire est déjà actif
        const now = new Date();
        const validBoosts = activeBoosts.filter(b => new Date(b.expiresAt) > now);
        
        // Définir les groupes de boosts incompatibles
        const xpBoosts = ['xp_x2', 'xp_x3', 'super_combo'];
        const potatoBoosts = ['potatoes_x2', 'super_combo'];
        const chestBoosts = ['chest_boost'];
        const missionBoosts = ['mission_boost'];
        
        // Vérifier les conflits
        let hasConflict = false;
        let conflictMessage = '';
        
        if (xpBoosts.includes(item.boostType)) {
          const existingXpBoost = validBoosts.find(b => xpBoosts.includes(b.type));
          if (existingXpBoost) {
            hasConflict = true;
            conflictMessage = 'Un boost XP est déjà actif !';
          }
        }
        
        if (potatoBoosts.includes(item.boostType)) {
          const existingPotatoBoost = validBoosts.find(b => potatoBoosts.includes(b.type));
          if (existingPotatoBoost) {
            hasConflict = true;
            conflictMessage = 'Un boost Patates est déjà actif !';
          }
        }
        
        if (chestBoosts.includes(item.boostType)) {
          const existingChestBoost = validBoosts.find(b => chestBoosts.includes(b.type));
          if (existingChestBoost) {
            hasConflict = true;
            conflictMessage = 'Un boost Coffre est déjà actif !';
          }
        }
        
        if (missionBoosts.includes(item.boostType)) {
          const existingMissionBoost = validBoosts.find(b => missionBoosts.includes(b.type));
          if (existingMissionBoost) {
            hasConflict = true;
            conflictMessage = 'Un boost Mission est déjà actif !';
          }
        }
        
        if (hasConflict) {
          alert(conflictMessage);
          return;
        }
        
        updateUser({ ...user, potatoes: user.potatoes - item.price });
        activateBoost(item);
      }
      return;
    }
    
    // Items non-consommables (avatar, fond, amélioration)
    if (ownedItems.includes(item.id)) return;
    
    // Mettre à jour les stats pour les badges
    const newItemsBought = (user.itemsBought || 0) + 1;
    const newTotalSpent = (user.totalSpent || 0) + item.price;
    
    const updatedUser = { 
      ...user, 
      potatoes: user.potatoes - item.price,
      itemsBought: newItemsBought,
      totalSpent: newTotalSpent,
    };
    updateUser(updatedUser);
    
    const newOwnedItems = [...ownedItems, item.id];
    setOwnedItems(newOwnedItems);
    saveOwnedItems(newOwnedItems); // Sauvegarder dans Supabase
    
    // Vérifier les badges
    checkAndUpdateBadges({
      ...updatedUser,
      itemsBought: newItemsBought,
      totalSpent: newTotalSpent,
      friendsCount: friends.length,
    });
    
    // Appliquer automatiquement les améliorations
    if (item.type === 'amelioration') {
      if (item.isDarkMode) {
        toggleDarkMode(true);
      }
      if (item.themeColor) {
        setColorTheme(item.themeColor);
      }
      // Afficher les instructions pour le widget
      if (item.id === 96) {
        setShowWidgetInstructions(true);
      }
    }
  };

  const equipItem = (itemId) => {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    let newEquippedItems = [...equippedItems];

    if (item.type === 'avatar') {
      updateUser({ ...user, avatar: item.image });
      newEquippedItems = [...newEquippedItems.filter(id => shopItems.find(s => s.id === id)?.type !== 'avatar'), itemId];
    } else if (item.type === 'fond') {
      updateUser({ ...user, avatarBg: item.colors });
      newEquippedItems = [...newEquippedItems.filter(id => shopItems.find(s => s.id === id)?.type !== 'fond'), itemId];
    } else if (item.type === 'amelioration') {
      // Activer/désactiver les améliorations
      if (item.isDarkMode) {
        const isCurrentlyEquipped = equippedItems.includes(itemId);
        toggleDarkMode(!isCurrentlyEquipped);
        if (isCurrentlyEquipped) {
          newEquippedItems = newEquippedItems.filter(id => id !== itemId);
        } else {
          newEquippedItems = [...newEquippedItems, itemId];
        }
      }
      if (item.themeColor) {
        const isCurrentlyEquipped = equippedItems.includes(itemId);
        if (isCurrentlyEquipped) {
          setColorTheme('default');
          newEquippedItems = newEquippedItems.filter(id => id !== itemId);
        } else {
          setColorTheme(item.themeColor);
          // Désactiver les autres thèmes couleur
          const otherColorThemes = shopItems.filter(s => s.themeColor && s.id !== itemId).map(s => s.id);
          newEquippedItems = [...newEquippedItems.filter(id => !otherColorThemes.includes(id)), itemId];
        }
      }
      if (item.isConfetti || item.isAnimations) {
        const isCurrentlyEquipped = equippedItems.includes(itemId);
        if (isCurrentlyEquipped) {
          newEquippedItems = newEquippedItems.filter(id => id !== itemId);
        } else {
          newEquippedItems = [...newEquippedItems, itemId];
        }
      }
    }

    setEquippedItems(newEquippedItems);
    saveEquippedItems(newEquippedItems); // Sauvegarder dans Supabase
  };

  const completeTask = async (taskId, recurringDate = null) => {
    // Pour les instances récurrentes, on reçoit l'ID original
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Appliquer les multiplicateurs de boost
    const xpMultiplier = getXpMultiplier();
    const potatoesMultiplier = getPotatoesMultiplier();
    
    // Bonus pour tâches partagées avec des amis
    // x2 de base, x3 si Boost Partage actif
    const hasParticipants = task.participants && task.participants.length > 0;
    const hasShareBoost = activeBoosts.some(b => b.type === 'share_boost' && new Date(b.expiresAt) > new Date());
    const sharingBonus = hasParticipants ? (hasShareBoost ? 3 : 2) : 1;
    
    const baseXp = getDurationXP(task.duration, task.status);
    const basePoints = getDurationPoints(task.duration, task.status);
    
    const xpGained = Math.round(baseXp * xpMultiplier * sharingBonus);
    const pointsGained = Math.round(basePoints * potatoesMultiplier * sharingBonus);

    let newXp = user.xp + xpGained;
    let newLevel = user.level;
    let newXpToNext = user.xpToNext;

    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel += 1;
      newXpToNext = getXpForLevel(newLevel);
    }

    const newUser = {
      ...user,
      xp: newXp,
      level: newLevel,
      xpToNext: newXpToNext,
      potatoes: user.potatoes + pointsGained,
      tasksCompleted: user.tasksCompleted + 1,
    };

    setUser(newUser);
    
    if (supabaseUser) {
      saveProfile(newUser);
    }

    // +1 clé par tâche complétée
    const newChests = { ...chests, keys: chests.keys + 1 };
    setChests(newChests);
    if (supabaseUser) {
      saveChests(newChests);
    }

    // Si c'est une tâche récurrente, créer la prochaine occurrence
    if (task.recurrence && task.recurrence !== 'none') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Utiliser la date de la tâche comme base (pas aujourd'hui)
      const taskDate = task.date ? new Date(task.date) : today;
      taskDate.setHours(0, 0, 0, 0);
      
      let nextDate = null;

      if (task.recurrence === 'daily') {
        // Prochaine occurrence = lendemain de la date de tâche OU demain si c'est dans le passé
        nextDate = new Date(Math.max(taskDate.getTime(), today.getTime()));
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (task.recurrence === 'weekly') {
        // Trouver le prochain jour de la semaine configuré
        const recurrenceDays = task.recurrenceDays || [];
        if (recurrenceDays.length > 0) {
          // Commencer à chercher à partir de demain
          const searchStart = new Date(Math.max(taskDate.getTime(), today.getTime()));
          searchStart.setDate(searchStart.getDate() + 1);
          
          // Chercher le prochain jour configuré (max 14 jours)
          for (let i = 0; i < 14; i++) {
            const checkDate = new Date(searchStart);
            checkDate.setDate(searchStart.getDate() + i);
            if (recurrenceDays.includes(checkDate.getDay())) {
              nextDate = checkDate;
              break;
            }
          }
        }
      } else if (task.recurrence === 'monthly') {
        // Trouver le prochain jour du mois configuré
        const recurrenceDays = task.recurrenceDays || [];
        if (recurrenceDays.length > 0) {
          const baseDate = new Date(Math.max(taskDate.getTime(), today.getTime()));
          const currentDayOfMonth = baseDate.getDate();
          const sortedDays = [...recurrenceDays].sort((a, b) => a - b);
          
          // Trouver le prochain jour ce mois-ci (après demain minimum)
          let nextDay = sortedDays.find(d => d > currentDayOfMonth);
          
          if (nextDay === undefined) {
            // Pas de jour ce mois, prendre le premier du mois prochain
            nextDay = sortedDays[0];
            nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, nextDay);
          } else {
            nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), nextDay);
          }
          
          // S'assurer que la date est dans le futur
          if (nextDate <= today) {
            nextDay = sortedDays[0];
            nextDate = new Date(today.getFullYear(), today.getMonth() + 1, nextDay);
          }
        }
      }

      // Créer la nouvelle tâche pour la prochaine occurrence
      if (nextDate) {
        const newTaskId = crypto.randomUUID();
        const newTask = {
          id: newTaskId,
          title: task.title,
          status: task.status,
          duration: task.duration,
          date: nextDate,
          recurrence: task.recurrence,
          recurrenceDays: task.recurrenceDays,
          tags: task.tags,
          notes: task.notes,
          completed: false,
        };

        // Marquer l'ancienne comme terminée et ajouter la nouvelle
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true } : t).concat(newTask));

        if (supabaseUser) {
          // Marquer l'ancienne comme terminée
          await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
          
          // Créer la nouvelle
          await supabase.from('tasks').insert({
            id: newTaskId,
            user_id: supabaseUser.id,
            title: newTask.title,
            status: newTask.status,
            duration: newTask.duration,
            date: nextDate.toISOString(),
            recurrence: newTask.recurrence,
            recurrence_days: newTask.recurrenceDays || [],
            tags: newTask.tags || [],
            notes: newTask.notes || '',
            completed: false,
          });
        }
      } else {
        // Pas de prochaine date, juste marquer comme terminée
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true } : t));
        if (supabaseUser) {
          await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
        }
      }
    } else {
      // Tâche normale - juste marquer comme terminée
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true } : t));
      if (supabaseUser) {
        await supabase.from('tasks').update({ completed: true }).eq('id', taskId);
      }
    }

    setCompletingTask({ task, xp: xpGained, points: pointsGained, shared: hasParticipants });

    // Si tâche partagée, notifier les autres participants et leur donner des points
    if (hasParticipants && supabaseUser) {
      const participantPseudos = task.participants.map(p => p.pseudo);
      
      // Créer une notification pour chaque participant
      for (const participant of task.participants) {
        try {
          // Récupérer le profil du participant
          const { data: participantProfile } = await supabase
            .from('profiles')
            .select('id, xp, level, xp_to_next, potatoes, tasks_completed')
            .eq('pseudo', participant.pseudo)
            .single();
          
          if (participantProfile) {
            // Calculer les points pour le participant (même bonus)
            let participantNewXp = participantProfile.xp + xpGained;
            let participantNewLevel = participantProfile.level;
            let participantNewXpToNext = participantProfile.xp_to_next;
            
            while (participantNewXp >= participantNewXpToNext) {
              participantNewXp -= participantNewXpToNext;
              participantNewLevel += 1;
              participantNewXpToNext = Math.floor(participantNewXpToNext * 1.15);
            }
            
            // Mettre à jour le profil du participant
            await supabase
              .from('profiles')
              .update({
                xp: participantNewXp,
                level: participantNewLevel,
                xp_to_next: participantNewXpToNext,
                potatoes: participantProfile.potatoes + pointsGained,
                tasks_completed: participantProfile.tasks_completed + 1,
              })
              .eq('id', participantProfile.id);
            
            // Créer une notification
            await supabase.from('notifications').insert({
              user_id: participantProfile.id,
              type: 'task_completed',
              title: 'Tâche partagée terminée !',
              message: `${user.pseudo} a terminé "${task.title}"`,
              data: {
                taskId: task.id,
                taskTitle: task.title,
                completedBy: user.pseudo,
                xpGained,
                pointsGained,
              },
              read: false,
            });
          }
        } catch (error) {
          console.error('Erreur notification participant:', error);
        }
      }
    }

    // Calculer les nouvelles stats
    const isUrgent = task.status === 'urgent';
    const isScheduled = task.time && task.time !== '';
    const isShared = task.participants && task.participants.length > 0;
    
    const newStats = {
      ...newUser,
      totalPotatoes: (user.totalPotatoes || 0) + pointsGained,
      urgentCompleted: isUrgent ? (user.urgentCompleted || 0) + 1 : (user.urgentCompleted || 0),
      scheduledCompleted: isScheduled ? (user.scheduledCompleted || 0) + 1 : (user.scheduledCompleted || 0),
      sharedTasksCompleted: isShared ? (user.sharedTasksCompleted || 0) + 1 : (user.sharedTasksCompleted || 0),
      friendsCount: friends.length,
    };
    
    // Mettre à jour l'utilisateur avec les nouvelles stats
    const finalUser = { ...newUser, ...newStats };
    updateUser(finalUser);

    // Vérifier les badges
    const newlyUnlocked = checkAndUpdateBadges(newStats);
    
    // Afficher l'animation pour le premier badge débloqué
    if (newlyUnlocked.length > 0) {
      setTimeout(() => {
        setUnlockedBadge(newlyUnlocked[0]);
      }, 2000); // Attendre que l'animation de tâche terminée se termine
    }
  };

  const addTask = async (taskData) => {
    // Utiliser l'ID fourni ou en générer un nouveau
    const taskId = taskData.id || crypto.randomUUID();
    
    const newTask = {
      ...taskData,
      id: taskId,
      completed: false,
    };
    
    // Vérifier si la tâche existe déjà (auto-save)
    const existingIndex = tasks.findIndex(t => t.id === taskId);
    if (existingIndex >= 0) {
      // Mise à jour
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...newTask } : t));
    } else {
      // Nouvelle tâche
      setTasks([...tasks, newTask]);
    }
    
    if (supabaseUser) {
      await saveTask(newTask);
    }
  };

  const updateTask = async (taskId, taskData) => {
    const updatedTask = { ...tasks.find(t => t.id === taskId), ...taskData };
    setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    
    if (supabaseUser) {
      await saveTask(updatedTask);
    }
  };

  const deleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const isShared = task.participants && task.participants.length > 0;
    const sharingBonus = isShared ? 2 : 1;
    
    // Si la tâche était terminée, retirer les points gagnés
    if (task.completed) {
      const xpLost = getDurationXP(task.duration, task.status) * sharingBonus;
      const pointsLost = getDurationPoints(task.duration, task.status) * sharingBonus;
      
      let newXp = user.xp - xpLost;
      let newLevel = user.level;
      let newXpToNext = user.xpToNext;
      
      // Gérer le cas où on descend de niveau
      while (newXp < 0 && newLevel > 1) {
        newLevel -= 1;
        newXpToNext = getXpForLevel(newLevel);
        newXp += newXpToNext;
      }
      if (newXp < 0) newXp = 0;
      
      const newUser = {
        ...user,
        xp: newXp,
        level: newLevel,
        xpToNext: newXpToNext,
        potatoes: Math.max(0, user.potatoes - pointsLost),
        tasksCompleted: Math.max(0, user.tasksCompleted - 1),
      };
      updateUser(newUser);
      
      // Si tâche partagée, retirer les points aux autres participants aussi
      if (isShared && supabaseUser) {
        for (const participant of task.participants) {
          try {
            const { data: participantProfile } = await supabase
              .from('profiles')
              .select('id, xp, level, xp_to_next, potatoes, tasks_completed')
              .eq('pseudo', participant.pseudo)
              .single();
            
            if (participantProfile) {
              let pNewXp = participantProfile.xp - xpLost;
              let pNewLevel = participantProfile.level;
              let pNewXpToNext = participantProfile.xp_to_next;
              
              while (pNewXp < 0 && pNewLevel > 1) {
                pNewLevel -= 1;
                pNewXpToNext = Math.floor(pNewXpToNext / 1.15);
                pNewXp += pNewXpToNext;
              }
              if (pNewXp < 0) pNewXp = 0;
              
              await supabase
                .from('profiles')
                .update({
                  xp: pNewXp,
                  level: pNewLevel,
                  xp_to_next: pNewXpToNext,
                  potatoes: Math.max(0, participantProfile.potatoes - pointsLost),
                  tasks_completed: Math.max(0, participantProfile.tasks_completed - 1),
                })
                .eq('id', participantProfile.id);
            }
          } catch (error) {
            console.error('Erreur retrait points participant:', error);
          }
        }
      }
    }
    
    setTasks(tasks.filter(t => t.id !== taskId));
    if (supabaseUser) {
      await supabase.from('tasks').delete().eq('id', taskId);
    }
  };

  // Loading
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Onboarding pour les nouveaux utilisateurs
  if (showOnboarding) {
    return (
      <OnboardingScreen 
        onComplete={(avatar, avatarBg) => {
          const newUser = { ...user, avatar, avatarBg, potatoes: 800 };
          updateUser(newUser);
          setShowOnboarding(false);
        }} 
        userName={user.pseudo} 
      />
    );
  }

  // Auth screens
  if (!isLoggedIn) {
    return (
      <AuthScreen 
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
        onForgotPassword={async (email) => {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin,
            });
            if (error) throw error;
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }}
        onRegister={async (email, password, pseudo) => {
          const result = await handleRegister(email, password, pseudo);
          if (result.success) {
            setUser(prev => ({ ...prev, email, pseudo }));
            setShowOnboarding(true);
          }
          return result;
        }}
      />
    );
  }

  // Page content
  let pageContent;
  
  if (showSettings) {
    pageContent = (
      <SettingsModal 
        user={user} 
        onClose={() => setShowSettings(false)}
        onUpdateUser={updateUser}
        onLogout={() => { setShowSettings(false); handleLogout(); }}
        onUpdateEmail={async (newEmail) => {
          try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }}
        onUpdatePassword={async (newPassword) => {
          try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }}
        onDeleteAccount={async () => {
          try {
            // Supprimer les données utilisateur
            if (supabaseUser) {
              await supabase.from('tasks').delete().eq('user_id', supabaseUser.id);
              await supabase.from('chests').delete().eq('user_id', supabaseUser.id);
              await supabase.from('push_subscriptions').delete().eq('user_id', supabaseUser.id);
              await supabase.from('profiles').delete().eq('id', supabaseUser.id);
            }
            // Déconnecter l'utilisateur
            await supabase.auth.signOut();
            setShowSettings(false);
            setIsLoggedIn(false);
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        onToggleUpgrade={(itemId) => {
          if (itemId === 96 && activeUpgrades[96] === false) {
            setShowWidgetInstructions(true);
          }
          toggleUpgrade(itemId);
        }}
        shopItems={shopItems}
        onCheckPseudo={checkPseudoAvailable}
        notificationStatus={notificationStatus}
        onEnableNotifications={enableNotifications}
        onDisableNotifications={disableNotifications}
        isNotificationSupported={isNotificationSupported}
        calendarSync={calendarSync}
      />
    );
  } else if (openingChest) {
    pageContent = <ChestOpeningModal 
      onClose={() => setOpeningChest(null)} 
      rewards={openingChest.rewards}
      isSuperChest={openingChest.isSuperChest}
    />;
  } else if (completingTask) {
    pageContent = <TaskCompletedModal task={completingTask} onClose={() => setCompletingTask(null)} hasAnimationsPlus={ownedItems.includes(80) && activeUpgrades[80] !== false} />;
  } else if (completingMission) {
    pageContent = <MissionCompletedModal mission={completingMission.mission} pqDistribution={completingMission.pqDistribution} onClose={() => { setCompletingMission(null); setSelectedMission(null); }} />;
  } else if (editingTask) {
    // Si la tâche a une date passée et n'est pas terminée, mettre à jour la date à aujourd'hui
    const taskToEdit = { ...editingTask };
    if (!taskToEdit.completed && taskToEdit.date) {
      const taskDate = new Date(taskToEdit.date);
      taskDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('Date tâche:', taskDate, 'Aujourd\'hui:', today, 'Passée?', taskDate < today);
      if (taskDate < today) {
        taskToEdit.date = today;
        console.log('Date mise à jour à aujourd\'hui');
      }
    }
    
    pageContent = (
      <CreateTaskModal
        onClose={() => setEditingTask(null)}
        onCreate={(taskData, silent) => { 
          updateTask(editingTask.id, taskData); 
          if (!silent) setEditingTask(null); 
        }}
        onDelete={() => { deleteTask(editingTask.id); setEditingTask(null); }}
        initialTask={taskToEdit}
        getStatusColor={getStatusColor}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
        userPseudo={user.pseudo}
        userAvatar={user.avatar}
        friends={friends}
      />
    );
  } else if (creatingTask) {
    pageContent = (
      <CreateTaskModal
        onClose={() => setCreatingTask(false)}
        onCreate={(taskData, silent) => { 
          addTask(taskData); 
          if (!silent) setCreatingTask(false); 
        }}
        getStatusColor={getStatusColor}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
        userPseudo={user.pseudo}
        userAvatar={user.avatar}
        friends={friends}
      />
    );
  } else if (creatingMissionQuest) {
    pageContent = (
      <CreateTaskModal
        onClose={() => setCreatingMissionQuest(null)}
        onCreate={async (questData) => {
          const newQuest = { 
            id: Date.now(), 
            title: questData.title,
            status: questData.status,
            duration: questData.duration,
            tags: questData.tags,
            notes: questData.notes,
            photos: questData.photos || [],
            assignedTo: questData.assignedTo || null,
            date: questData.date || null,
            completed: false, 
            xp: getDurationXP(questData.duration, questData.status) 
          };
          const updatedMission = { 
            ...creatingMissionQuest, 
            quests: [...(creatingMissionQuest.quests || []), newQuest] 
          };
          setMissions(missions.map(m => m.id === creatingMissionQuest.id ? updatedMission : m));
          setSelectedMission(updatedMission);
          setCreatingMissionQuest(null);
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
        }}
        getStatusColor={getStatusColor}
        missionMode={creatingMissionQuest}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
        userPseudo={user.pseudo}
        userAvatar={user.avatar}
      />
    );
  } else if (editingQuest) {
    // Édition d'une tâche de mission
    pageContent = (
      <CreateTaskModal
        onClose={() => setEditingQuest(null)}
        onCreate={async (questData) => {
          const updatedQuest = { 
            ...editingQuest.quest,
            title: questData.title,
            status: questData.status,
            duration: questData.duration,
            tags: questData.tags,
            notes: questData.notes,
            photos: questData.photos || [],
            assignedTo: questData.assignedTo || null,
            date: questData.date || null,
            xp: getDurationXP(questData.duration, questData.status) 
          };
          const updatedMission = {
            ...editingQuest.mission,
            quests: editingQuest.mission.quests.map(q => q.id === editingQuest.quest.id ? updatedQuest : q)
          };
          setMissions(missions.map(m => m.id === editingQuest.mission.id ? updatedMission : m));
          setSelectedMission(updatedMission);
          setEditingQuest(null);
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
        }}
        onDelete={async () => {
          const updatedMission = {
            ...editingQuest.mission,
            quests: editingQuest.mission.quests.filter(q => q.id !== editingQuest.quest.id)
          };
          setMissions(missions.map(m => m.id === editingQuest.mission.id ? updatedMission : m));
          setSelectedMission(updatedMission);
          setEditingQuest(null);
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
        }}
        initialTask={editingQuest.quest}
        getStatusColor={getStatusColor}
        missionMode={editingQuest.mission}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
        userPseudo={user.pseudo}
        userAvatar={user.avatar}
      />
    );
  } else if (creatingMissionEvent) {
    // Création d'une tâche avec heure dans une mission
    pageContent = (
      <CreateTaskModal
        onClose={() => setCreatingMissionEvent(null)}
        onCreate={async (taskData) => {
          const newQuest = { 
            id: Date.now(), 
            title: taskData.title,
            description: taskData.notes || '',
            date: taskData.date,
            time: taskData.time,
            duration: taskData.duration,
            location: taskData.location,
            reminder: taskData.reminder,
            assignedTo: taskData.assignedTo || null,
            completed: false, 
            isEvent: !!taskData.time,
            xp: getDurationXP(taskData.duration, taskData.status || 'à faire') 
          };
          const updatedMission = { 
            ...creatingMissionEvent, 
            quests: [...(creatingMissionEvent.quests || []), newQuest] 
          };
          setMissions(missions.map(m => m.id === creatingMissionEvent.id ? updatedMission : m));
          setSelectedMission(updatedMission);
          setCreatingMissionEvent(null);
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
        }}
        missionMode={creatingMissionEvent}
        friends={friends}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
        userPseudo={user.pseudo}
        userAvatar={user.avatar}
      />
    );
  } else if (creatingMission) {
    pageContent = (
      <CreateMissionModal
        onClose={() => setCreatingMission(false)}
        friends={friends}
        user={user}
        onCreate={async (missionData) => {
          const newMission = { 
            id: crypto.randomUUID(), 
            ...missionData, 
            quests: [], 
            createdBy: user.pseudo 
          };
          setMissions([...missions, newMission]);
          setCreatingMission(false);
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(newMission);
          }
        }}
      />
    );
  } else if (selectedMission) {
    pageContent = (
      <MissionDetailModal
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
        onTakeQuest={async (missionId, questId) => {
          // Vérifier si la tâche était non assignée (bonus PQ)
          const wasUnassigned = selectedMission?.quests?.find(q => q.id === questId)?.assignedTo === undefined || 
                                selectedMission?.quests?.find(q => q.id === questId)?.assignedTo === '' ||
                                selectedMission?.quests?.find(q => q.id === questId)?.assignedTo === null;
          
          const updatedMission = { 
            ...selectedMission, 
            quests: selectedMission.quests.map(q => q.id === questId ? { 
              ...q, 
              assignedTo: user.pseudo,
              takenWhenUnassigned: wasUnassigned ? true : q.takenWhenUnassigned
            } : q) 
          };
          setMissions(missions.map(m => m.id === missionId ? updatedMission : m));
          setSelectedMission(updatedMission);
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
        }}
        onCompleteQuest={async (missionId, questId) => {
          // Vérifier si la tâche était non assignée au moment de la complétion
          const quest = selectedMission?.quests?.find(q => q.id === questId);
          const wasUnassigned = !quest?.assignedTo;
          
          // Mettre à jour les missions
          const updatedMission = {
            ...selectedMission,
            quests: selectedMission.quests.map(q => 
              q.id === questId ? { 
                ...q, 
                completed: true, 
                completedBy: user.pseudo,
                takenWhenUnassigned: wasUnassigned ? true : q.takenWhenUnassigned
              } : q
            )
          };
          const updatedMissions = missions.map(m => m.id === missionId ? updatedMission : m);
          setMissions(updatedMissions);
          setSelectedMission(updatedMission);
          
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
          
          // Vérifier si la mission est terminée
          if (updatedMission && updatedMission.quests.every(q => q.completed)) {
            // Mission terminée ! Calculer les PQ
            // 100 PQ par MISSION à répartir proportionnellement selon le nombre de tâches réalisées
            // + 10 PQ bonus pour chaque tâche prise quand elle n'était pas assignée
            
            const totalMissionPQ = 100; // 100 PQ par mission
            
            // Compter les tâches complétées par chaque participant
            const questsByParticipant = {};
            const bonusByParticipant = {};
            
            updatedMission.quests.forEach(q => {
              const completedBy = q.completedBy;
              if (completedBy) {
                questsByParticipant[completedBy] = (questsByParticipant[completedBy] || 0) + 1;
                // Bonus si la tâche a été prise quand elle n'était pas assignée
                if (q.takenWhenUnassigned) {
                  bonusByParticipant[completedBy] = (bonusByParticipant[completedBy] || 0) + 10;
                }
              }
            });
            
            // Calculer la répartition
            const totalQuestsCompleted = Object.values(questsByParticipant).reduce((a, b) => a + b, 0);
            const pqDistribution = {};
            
            Object.entries(questsByParticipant).forEach(([pseudo, count]) => {
              const basePQ = Math.round((count / totalQuestsCompleted) * totalMissionPQ);
              const bonusPQ = bonusByParticipant[pseudo] || 0;
              pqDistribution[pseudo] = basePQ + bonusPQ;
            });
            
            // Ajouter les PQ à l'utilisateur courant
            const myPQ = pqDistribution[user.pseudo] || 0;
            if (myPQ > 0) {
              const newUserWithPQ = {
                ...user,
                pqSeason: (user.pqSeason || 0) + myPQ,
                pqTotal: (user.pqTotal || 0) + myPQ,
              };
              setUser(newUserWithPQ);
              if (supabaseUser) {
                saveProfile(newUserWithPQ);
              }
            }
            
            setCompletingMission({ mission: updatedMission, pqDistribution });
          }
          
          // Donner XP/Patates pour la tâche
          const questData = missions.find(m => m.id === missionId)?.quests.find(q => q.id === questId);
          if (questData) {
            const xpGained = getDurationXP(questData.duration, questData.status || 'à faire');
            const pointsGained = getDurationPoints(questData.duration, questData.status || 'à faire');
            
            let newXp = user.xp + xpGained;
            let newLevel = user.level;
            let newXpToNext = user.xpToNext;
            
            while (newXp >= newXpToNext) {
              newXp -= newXpToNext;
              newLevel += 1;
              newXpToNext = getXpForLevel(newLevel);
            }
            
            const newTasksCompleted = user.tasksCompleted + 1;
            
            setUser({
              ...user,
              xp: newXp,
              level: newLevel,
              xpToNext: newXpToNext,
              potatoes: user.potatoes + pointsGained,
              tasksCompleted: newTasksCompleted,
            });
            
            // +1 clé par tâche complétée
            const newChests = { ...chests, keys: chests.keys + 1 };
            setChests(newChests);
            if (supabaseUser) {
              saveChests(newChests);
            }
          }
        }}
        onAddQuest={() => setCreatingMissionQuest(selectedMission)}
        onAddEvent={() => setCreatingMissionEvent(selectedMission)}
        onEditQuest={(quest, mission) => setEditingQuest({ quest, mission })}
        onAddMember={async (friend) => {
          const newParticipant = { pseudo: friend.pseudo, avatar: friend.avatar, contribution: 0 };
          const updatedMission = { 
            ...selectedMission, 
            participants: [...(selectedMission.participants || []), newParticipant] 
          };
          setMissions(missions.map(m => m.id === selectedMission.id ? updatedMission : m));
          setSelectedMission(updatedMission);
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
        }}
        onRemoveMember={async (pseudo) => {
          const updatedMission = { 
            ...selectedMission, 
            participants: selectedMission.participants.filter(p => p.pseudo !== pseudo) 
          };
          setMissions(missions.map(m => m.id === selectedMission.id ? updatedMission : m));
          setSelectedMission(updatedMission);
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
        }}
        onDeleteMission={async (missionId) => {
          const mission = missions.find(m => m.id === missionId);
          
          if (mission) {
            // Calculer ce que l'utilisateur doit perdre
            let xpToRemove = 0;
            let potatoesToRemove = 0;
            let pqToRemove = 0;
            let tasksToRemove = 0;
            
            // Compter les tâches complétées par l'utilisateur
            const userCompletedQuests = mission.quests?.filter(q => q.completedBy === user.pseudo) || [];
            
            userCompletedQuests.forEach(quest => {
              // XP et patates pour chaque tâche complétée
              xpToRemove += getDurationXP(quest.duration, quest.status || 'à faire');
              potatoesToRemove += getDurationPoints(quest.duration, quest.status || 'à faire');
              tasksToRemove += 1;
            });
            
            // Compter les tâches avec heure de cette mission complétées par l'utilisateur
            const missionTasksWithTime = tasks.filter(t => t.missionId === missionId && t.time && t.time !== '');
            missionTasksWithTime.forEach(task => {
              if (task.completedBy?.includes(user.pseudo) || task.completed) {
                // Récompenses des tâches avec heure : calculées selon durée/status
                xpToRemove += getDurationXP(task.duration, task.status || 'à faire');
                potatoesToRemove += getDurationPoints(task.duration, task.status || 'à faire');
                // PQ des tâches avec participants
                const participantCount = task.participants?.length || 0;
                if (participantCount > 0) {
                  pqToRemove += participantCount * 5;
                }
              }
            });
            
            // Si la mission était terminée, retirer les PQ gagnés
            const isMissionCompleted = mission.quests?.every(q => q.completed);
            if (isMissionCompleted) {
              // Recalculer les PQ que l'utilisateur avait gagnés
              const totalMissionPQ = 100;
              const questsByParticipant = {};
              const bonusByParticipant = {};
              
              mission.quests?.forEach(q => {
                const completedBy = q.completedBy;
                if (completedBy) {
                  questsByParticipant[completedBy] = (questsByParticipant[completedBy] || 0) + 1;
                  if (q.takenWhenUnassigned) {
                    bonusByParticipant[completedBy] = (bonusByParticipant[completedBy] || 0) + 10;
                  }
                }
              });
              
              const totalQuestsCompleted = Object.values(questsByParticipant).reduce((a, b) => a + b, 0);
              if (totalQuestsCompleted > 0) {
                const userQuestsCount = questsByParticipant[user.pseudo] || 0;
                const basePQ = Math.round((userQuestsCount / totalQuestsCompleted) * totalMissionPQ);
                const bonusPQ = bonusByParticipant[user.pseudo] || 0;
                pqToRemove += basePQ + bonusPQ;
              }
            }
            
            // Appliquer les retraits
            if (xpToRemove > 0 || potatoesToRemove > 0 || pqToRemove > 0 || tasksToRemove > 0) {
              const newUser = {
                ...user,
                xp: Math.max(0, user.xp - xpToRemove),
                potatoes: Math.max(0, user.potatoes - potatoesToRemove),
                pqSeason: Math.max(0, (user.pqSeason || 0) - pqToRemove),
                pqTotal: Math.max(0, (user.pqTotal || 0) - pqToRemove),
                tasksCompleted: Math.max(0, user.tasksCompleted - tasksToRemove),
              };
              
              setUser(newUser);
              if (supabaseUser) {
                saveProfile(newUser);
              }
            }
            
            // Supprimer aussi les tâches liées à cette mission
            const remainingTasks = tasks.filter(t => t.missionId !== missionId);
            setTasks(remainingTasks);
          }
          
          setMissions(missions.filter(m => m.id !== missionId));
          setSelectedMission(null);
          // Supprimer de Supabase
          if (supabaseUser) {
            await deleteMissionFromDB(missionId);
            // Supprimer les événements de la mission dans Supabase (maintenant dans tasks)
            await supabase.from('tasks').delete().eq('mission_id', missionId);
          }
        }}
        currentUser={user.pseudo}
        getModeLabel={getModeLabel}
        friends={friends}
        user={user}
      />
    );
  } else if (currentPage === 'tasks') {
    pageContent = (
      <TasksPage 
        tasks={tasks}
        tasksView={tasksView}
        setTasksView={setTasksView}
        onCompleteTask={completeTask}
        onCreateTask={() => setCreatingTask(true)}
        onEditTask={(task) => {
          if (task.isMissionQuest) {
            // Édition d'une tâche de mission
            const mission = missions.find(m => m.id === task.missionId);
            const quest = mission?.quests.find(q => q.id === task.id);
            if (mission && quest) {
              setEditingQuest({ quest, mission });
            }
          } else {
            setEditingTask(task);
          }
        }}
        onDeleteTask={deleteTask}
        onClearCompleted={() => {
          const completedIds = tasks.filter(t => t.completed).map(t => t.id);
          setTasks(tasks.filter(t => !t.completed));
          completedIds.forEach(id => supabaseUser && supabase.from('tasks').delete().eq('id', id));
        }}
        getStatusColor={getStatusColor}
        getRecurrenceLabel={getRecurrenceLabel}
        missions={missions}
        user={user}
        seasonalChallenges={seasonalChallenges}
        onClaimSeasonalReward={async () => {
          // Réclamer les récompenses du défi saisonnier
          const bonusXP = 150;
          const bonusPotatoes = 200;
          
          // Ajouter XP
          let newXp = user.xp + bonusXP;
          let newLevel = user.level;
          let newXpToNext = user.xpToNext;
          
          while (newXp >= newXpToNext) {
            newXp -= newXpToNext;
            newLevel += 1;
            newXpToNext = getXpForLevel(newLevel);
          }
          
          // Mettre à jour l'avatar et les récompenses
          const newUser = {
            ...user,
            xp: newXp,
            level: newLevel,
            xpToNext: newXpToNext,
            potatoes: user.potatoes + bonusPotatoes,
            avatar: seasonalChallenges.currentChallenge.avatar,
            avatarBg: seasonalChallenges.currentChallenge.avatarBg,
          };
          
          setUser(newUser);
          if (supabaseUser) {
            saveProfile(newUser);
          }
          
          // Marquer comme réclamé
          await seasonalChallenges.claimAvatar();
        }}
        onCompleteMissionQuest={async (missionId, questId) => {
          // Vérifier si la tâche était non assignée
          const mission = missions.find(m => m.id === missionId);
          const quest = mission?.quests.find(q => q.id === questId);
          const wasUnassigned = !quest?.assignedTo;
          
          // Compléter la tâche de mission
          const updatedMission = {
            ...mission,
            quests: mission.quests.map(q => 
              q.id === questId ? { 
                ...q, 
                completed: true, 
                completedBy: user.pseudo,
                takenWhenUnassigned: wasUnassigned ? true : q.takenWhenUnassigned
              } : q
            )
          };
          const updatedMissions = missions.map(m => m.id === missionId ? updatedMission : m);
          setMissions(updatedMissions);
          
          // Sauvegarder dans Supabase
          if (supabaseUser) {
            await saveMission(updatedMission);
          }
          
          // Vérifier si la mission est terminée
          if (updatedMission.quests.every(q => q.completed)) {
            // Mission terminée ! 100 PQ par MISSION à répartir
            const totalMissionPQ = 100;
            
            // Compter les tâches complétées par chaque participant
            const questsByParticipant = {};
            const bonusByParticipant = {};
            
            updatedMission.quests.forEach(q => {
              const completedBy = q.completedBy;
              if (completedBy) {
                questsByParticipant[completedBy] = (questsByParticipant[completedBy] || 0) + 1;
                if (q.takenWhenUnassigned) {
                  bonusByParticipant[completedBy] = (bonusByParticipant[completedBy] || 0) + 10;
                }
              }
            });
            
            // Calculer la répartition
            const totalQuestsCompleted = Object.values(questsByParticipant).reduce((a, b) => a + b, 0);
            const pqDistribution = {};
            
            Object.entries(questsByParticipant).forEach(([pseudo, count]) => {
              const basePQ = Math.round((count / totalQuestsCompleted) * totalMissionPQ);
              const bonusPQ = bonusByParticipant[pseudo] || 0;
              pqDistribution[pseudo] = basePQ + bonusPQ;
            });
            
            // Ajouter les PQ à l'utilisateur courant
            const myPQ2 = pqDistribution[user.pseudo] || 0;
            if (myPQ2 > 0) {
              const newUserWithPQ2 = {
                ...user,
                pqSeason: (user.pqSeason || 0) + myPQ2,
                pqTotal: (user.pqTotal || 0) + myPQ2,
              };
              setUser(newUserWithPQ2);
              if (supabaseUser) {
                saveProfile(newUserWithPQ2);
              }
            }
            
            setCompletingMission({ mission: updatedMission, pqDistribution });
          }
          
          // Donner XP/Patates pour la tâche
          if (quest) {
            const xpGained = getDurationXP(quest.duration, quest.status || 'à faire');
            const pointsGained = getDurationPoints(quest.duration, quest.status || 'à faire');
            
            let newXp = user.xp + xpGained;
            let newLevel = user.level;
            let newXpToNext = user.xpToNext;
            
            while (newXp >= newXpToNext) {
              newXp -= newXpToNext;
              newLevel += 1;
              newXpToNext = getXpForLevel(newLevel);
            }
            
            const newTasksCompleted = user.tasksCompleted + 1;
            
            const newUser = {
              ...user,
              xp: newXp,
              level: newLevel,
              xpToNext: newXpToNext,
              potatoes: user.potatoes + pointsGained,
              tasksCompleted: newTasksCompleted,
            };
            
            setUser(newUser);
            
            // Sauvegarder dans Supabase
            if (supabaseUser) {
              saveProfile(newUser);
            }
            
            // +1 clé par tâche complétée
            const newChests = { ...chests, keys: chests.keys + 1 };
            setChests(newChests);
            if (supabaseUser) {
              saveChests(newChests);
            }
          }
        }}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        pendingInvitation={pendingShareInvitation}
        onAcceptInvitation={acceptShareInvitation}
        onDeclineInvitation={declineShareInvitation}
      />
    );
  } else if (currentPage === 'friends') {
    pageContent = (
      <FriendsPage 
        user={user}
        supabaseUser={supabaseUser}
        friends={friends}
        tasks={tasks}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        addFriend={async (pseudo) => {
          try {
            const userToAdd = searchResults.find(u => u.pseudo === pseudo);
            if (!userToAdd) return;
            
            // Envoyer une demande d'ami (pas ajouter directement)
            if (supabaseUser) {
              // Vérifier si une demande existe déjà
              const { data: existingRequest } = await supabase
                .from('friend_requests')
                .select('*')
                .eq('from_user', user.pseudo)
                .eq('to_user', pseudo)
                .single();
              
              if (existingRequest) {
                alert('Demande déjà envoyée !');
                return;
              }
              
              // Vérifier si on est déjà amis
              const { data: existingFriend } = await supabase
                .from('friends')
                .select('*')
                .eq('user_pseudo', user.pseudo)
                .eq('friend_pseudo', pseudo)
                .single();
              
              if (existingFriend) {
                alert('Vous êtes déjà amis !');
                return;
              }
              
              // Créer la demande d'ami
              await supabase.from('friend_requests').insert({
                from_user: user.pseudo,
                to_user: pseudo,
                status: 'pending',
                created_at: new Date().toISOString()
              });
              
              alert(`Demande envoyée à ${pseudo} !`);
            }
            
            setSearchQuery('');
            setSearchResults([]);
          } catch (err) {
            console.error('Erreur envoi demande:', err);
          }
        }}
        friendRequests={friendRequests}
        onAcceptRequest={async (pseudo) => {
          const request = friendRequests.find(r => r.pseudo === pseudo);
          if (request) {
            // Sauvegarder l'amitié
            if (supabaseUser) {
              await saveFriend(user.pseudo, pseudo);
              // Mettre à jour le statut de la demande
              await supabase.from('friend_requests')
                .update({ status: 'accepted' })
                .eq('from_user', pseudo)
                .eq('to_user', user.pseudo);
            }
            setFriends([...friends, { ...request }]);
            setFriendRequests(friendRequests.filter(r => r.pseudo !== pseudo));
          }
        }}
        onDeclineRequest={async (pseudo) => {
          if (supabaseUser) {
            await supabase.from('friend_requests')
              .update({ status: 'declined' })
              .eq('from_user', pseudo)
              .eq('to_user', user.pseudo);
          }
          setFriendRequests(friendRequests.filter(r => r.pseudo !== pseudo));
        }}
        removeFriend={async (pseudo) => {
          if (supabaseUser) {
            // Supprimer des deux côtés
            await supabase.from('friends')
              .delete()
              .eq('user_pseudo', user.pseudo)
              .eq('friend_pseudo', pseudo);
            await supabase.from('friends')
              .delete()
              .eq('user_pseudo', pseudo)
              .eq('friend_pseudo', user.pseudo);
          }
          setFriends(friends.filter(f => f.pseudo !== pseudo));
        }}
        onEditTask={(task) => setEditingTask(task)}
        ownedItems={ownedItems}
        onChifoumiPlayed={() => {
          const newChifoumiPlayed = (user.chifoumiPlayed || 0) + 1;
          const updatedUser = { ...user, chifoumiPlayed: newChifoumiPlayed };
          setUser(updatedUser);
          if (supabaseUser) saveProfile(updatedUser);
          checkAndUpdateBadges({
            ...updatedUser,
            chifoumiPlayed: newChifoumiPlayed,
            friendsCount: friends.length,
          });
        }}
        onChifoumiWon={() => {
          const newChifoumiWins = (user.chifoumiWins || 0) + 1;
          const updatedUser = { ...user, chifoumiWins: newChifoumiWins };
          setUser(updatedUser);
          if (supabaseUser) saveProfile(updatedUser);
          checkAndUpdateBadges({
            ...updatedUser,
            chifoumiWins: newChifoumiWins,
            friendsCount: friends.length,
          });
        }}
      />
    );
  } else if (currentPage === 'badges') {
    pageContent = <BadgesPage badges={badges} />;
  } else if (currentPage === 'stats') {
    pageContent = (
      <StatsPage 
        user={user}
        tasks={tasks}
        chests={chests}
        badges={badges}
        friends={friends}
        journaling={journaling}
        hasJournaling={hasJournaling}
      />
    );
  } else if (currentPage === 'shop') {
    pageContent = (
      <ShopPage 
        shopItems={shopItems}
        userPoints={user.potatoes}
        onBuyItem={buyItem}
        ownedItems={ownedItems}
        equippedItems={equippedItems}
        onEquipItem={equipItem}
        user={user}
        activeBoosts={activeBoosts}
        activeUpgrades={activeUpgrades}
        onToggleUpgrade={(itemId) => {
          // Si c'est le widget (id 96) et qu'on l'active, afficher les instructions
          if (itemId === 96 && activeUpgrades[96] === false) {
            setShowWidgetInstructions(true);
          }
          toggleUpgrade(itemId);
        }}
        defaultTab={shopDefaultTab}
      />
    );
  }

  // Classes de thème
  const getThemeClasses = () => {
    let baseClasses = '';
    
    if (theme.darkMode) {
      baseClasses = 'dark bg-slate-900 text-white';
    } else {
      switch (theme.colorTheme) {
        case 'rose':
          baseClasses = 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50';
          break;
        case 'vert':
          baseClasses = 'bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50';
          break;
        case 'bleu':
          baseClasses = 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50';
          break;
        case 'violet':
          baseClasses = 'bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50';
          break;
        default:
          baseClasses = 'bg-gradient-to-br from-slate-50 via-white to-slate-50';
      }
    }
    
    return baseClasses;
  };

  // Classes de couleur d'accent
  const getAccentColor = () => {
    switch (theme.colorTheme) {
      case 'rose': return 'rose';
      case 'vert': return 'emerald';
      case 'bleu': return 'blue';
      case 'violet': return 'purple';
      default: return 'indigo';
    }
  };

  // Vérifier les améliorations visuelles (possédées ET actives)
  const hasAnimatedBg = ownedItems.includes(82) && isUpgradeActive(82);
  const hasAnimationsPlus = ownedItems.includes(80) && isUpgradeActive(80);
  const hasStats = ownedItems.includes(81) && isUpgradeActive(81);

  return (
    <div className={`min-h-screen flex flex-col ${getThemeClasses()} ${hasAnimationsPlus ? 'transitions-enhanced' : ''}`} data-theme={theme.colorTheme} data-dark={theme.darkMode}>
      {/* Fond animé avec particules */}
      {hasAnimatedBg && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
          <div className="particle particle-7"></div>
          <div className="particle particle-8"></div>
        </div>
      )}

      <Header 
        user={user} 
        onAvatarClick={() => setShowSettings(true)} 
        activeBoosts={activeBoosts}
        theme={theme}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        keys={chests.keys}
        onOpenChest={openChest}
        onPotatoClick={() => {
          setShopDefaultTab('amelioration');
          setCurrentPage('shop');
        }}
        onXpClick={() => {
          setShopDefaultTab('avatar');
          setCurrentPage('shop');
        }}
      />

      {/* Notification in-app */}
      {inAppNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in w-11/12 max-w-md">
          <div className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl shadow-2xl p-4 text-white">
            <div className="flex items-start gap-3">
              <div className="text-3xl">📅</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{inAppNotification.title}</h3>
                <p className="text-white/90">{inAppNotification.body}</p>
              </div>
              <button 
                onClick={dismissInAppNotification}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-16 sm:pt-20 md:pt-24 pb-16 sm:pb-20 md:pb-24 relative z-10">
        {pageContent}
      </div>

      <Navigation 
        currentPage={currentPage} 
        setCurrentPage={(page) => {
          if (page === 'shop') setShopDefaultTab('avatar');
          setCurrentPage(page);
        }}
        friendRequestsCount={friendRequests.length}
        theme={theme}
        hasStats={hasStats}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        /* ===== ANIMATIONS+ - Uniquement les effets importants ===== */
        
        /* Transitions fluides globales */
        .transitions-enhanced * {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        /* Animation d'entrée des pages */
        .transitions-enhanced .page-content {
          animation: pageEnter 0.4s ease-out;
        }
        @keyframes pageEnter {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        /* Glow pulsant sur les boutons importants */
        .transitions-enhanced .glow-pulse {
          animation: glowPulse 2s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3); }
          50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.3); }
        }
        
        /* Animation de succès pour les boutons */
        .transitions-enhanced .success-pop {
          animation: successPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        @keyframes successPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        /* Shake pour les erreurs */
        .transitions-enhanced .error-shake {
          animation: errorShake 0.5s ease-in-out;
        }
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        
        /* Animation du header avec gradient subtil */
        .transitions-enhanced header {
          background-size: 200% 200%;
          animation: gradientShift 10s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        /* ===== FIN ANIMATIONS+ ===== */

        /* Particules animées */
        .particle {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          opacity: 0.6;
          animation: float 15s infinite ease-in-out;
        }
        .particle-1 { left: 10%; top: 20%; background: rgba(99, 102, 241, 0.4); animation-delay: 0s; }
        .particle-2 { left: 20%; top: 80%; background: rgba(168, 85, 247, 0.4); animation-delay: 2s; }
        .particle-3 { left: 60%; top: 10%; background: rgba(236, 72, 153, 0.4); animation-delay: 4s; }
        .particle-4 { left: 80%; top: 50%; background: rgba(34, 211, 238, 0.4); animation-delay: 6s; }
        .particle-5 { left: 40%; top: 60%; background: rgba(74, 222, 128, 0.4); animation-delay: 8s; }
        .particle-6 { left: 90%; top: 30%; background: rgba(251, 191, 36, 0.4); animation-delay: 10s; }
        .particle-7 { left: 5%; top: 70%; background: rgba(244, 114, 182, 0.4); animation-delay: 12s; }
        .particle-8 { left: 70%; top: 90%; background: rgba(129, 140, 248, 0.4); animation-delay: 14s; }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          25% { transform: translate(50px, -30px) scale(1.5); opacity: 0.8; }
          50% { transform: translate(-20px, -60px) scale(1.2); opacity: 0.4; }
          75% { transform: translate(30px, -20px) scale(0.8); opacity: 0.7; }
        }
        
        /* Thèmes de couleur */
        [data-theme="rose"] .bg-indigo-500 { background-color: rgb(236 72 153) !important; }
        [data-theme="rose"] .bg-indigo-600 { background-color: rgb(219 39 119) !important; }
        [data-theme="rose"] .from-indigo-500 { --tw-gradient-from: rgb(236 72 153) !important; }
        [data-theme="rose"] .to-purple-500 { --tw-gradient-to: rgb(244 114 182) !important; }
        [data-theme="rose"] .text-indigo-600 { color: rgb(219 39 119) !important; }
        [data-theme="rose"] .border-indigo-500 { border-color: rgb(236 72 153) !important; }
        
        [data-theme="vert"] .bg-indigo-500 { background-color: rgb(16 185 129) !important; }
        [data-theme="vert"] .bg-indigo-600 { background-color: rgb(5 150 105) !important; }
        [data-theme="vert"] .from-indigo-500 { --tw-gradient-from: rgb(16 185 129) !important; }
        [data-theme="vert"] .to-purple-500 { --tw-gradient-to: rgb(52 211 153) !important; }
        [data-theme="vert"] .text-indigo-600 { color: rgb(5 150 105) !important; }
        [data-theme="vert"] .border-indigo-500 { border-color: rgb(16 185 129) !important; }
        
        [data-theme="bleu"] .bg-indigo-500 { background-color: rgb(59 130 246) !important; }
        [data-theme="bleu"] .bg-indigo-600 { background-color: rgb(37 99 235) !important; }
        [data-theme="bleu"] .from-indigo-500 { --tw-gradient-from: rgb(59 130 246) !important; }
        [data-theme="bleu"] .to-purple-500 { --tw-gradient-to: rgb(96 165 250) !important; }
        [data-theme="bleu"] .text-indigo-600 { color: rgb(37 99 235) !important; }
        [data-theme="bleu"] .border-indigo-500 { border-color: rgb(59 130 246) !important; }
        
        [data-theme="violet"] .bg-indigo-500 { background-color: rgb(168 85 247) !important; }
        [data-theme="violet"] .bg-indigo-600 { background-color: rgb(147 51 234) !important; }
        [data-theme="violet"] .from-indigo-500 { --tw-gradient-from: rgb(168 85 247) !important; }
        [data-theme="violet"] .to-purple-500 { --tw-gradient-to: rgb(192 132 252) !important; }
        [data-theme="violet"] .text-indigo-600 { color: rgb(147 51 234) !important; }
        [data-theme="violet"] .border-indigo-500 { border-color: rgb(168 85 247) !important; }
        
        /* Mode sombre - fond général */
        [data-dark="true"] { background-color: rgb(15 23 42) !important; color: white !important; }
        [data-dark="true"] .bg-white { background-color: rgb(30 41 59) !important; }
        [data-dark="true"] .bg-slate-50 { background-color: rgb(30 41 59) !important; }
        [data-dark="true"] .bg-slate-100 { background-color: rgb(51 65 85) !important; }
        [data-dark="true"] .bg-slate-200 { background-color: rgb(71 85 105) !important; }
        
        /* Mode sombre - texte (amélioration du contraste) */
        [data-dark="true"] .text-slate-900 { color: rgb(248 250 252) !important; }
        [data-dark="true"] .text-slate-800 { color: rgb(241 245 249) !important; }
        [data-dark="true"] .text-slate-700 { color: rgb(226 232 240) !important; }
        [data-dark="true"] .text-slate-600 { color: rgb(203 213 225) !important; }
        [data-dark="true"] .text-slate-500 { color: rgb(168 185 208) !important; }
        [data-dark="true"] .text-slate-400 { color: rgb(168 185 208) !important; }
        
        /* Mode sombre - bordures */
        [data-dark="true"] .border-slate-200 { border-color: rgb(71 85 105) !important; }
        [data-dark="true"] .border-slate-100 { border-color: rgb(51 65 85) !important; }
        [data-dark="true"] .border-slate-300 { border-color: rgb(100 116 139) !important; }
        
        /* Mode sombre - inputs et formulaires */
        [data-dark="true"] input, 
        [data-dark="true"] textarea,
        [data-dark="true"] select { 
          background-color: rgb(51 65 85) !important; 
          color: rgb(248 250 252) !important;
          border-color: rgb(100 116 139) !important;
        }
        [data-dark="true"] input::placeholder,
        [data-dark="true"] textarea::placeholder { 
          color: rgb(148 163 184) !important; 
        }
        
        /* Mode sombre - surbrillance/hover */
        [data-dark="true"] .hover\\:bg-slate-50:hover { background-color: rgb(51 65 85) !important; }
        [data-dark="true"] .hover\\:bg-slate-100:hover { background-color: rgb(71 85 105) !important; }
        
        /* Mode sombre - badges et chips colorés (garder la lisibilité) */
        [data-dark="true"] .bg-red-50 { background-color: rgb(127 29 29 / 0.4) !important; }
        [data-dark="true"] .bg-blue-50 { background-color: rgb(30 64 175 / 0.4) !important; }
        [data-dark="true"] .bg-green-50 { background-color: rgb(22 101 52 / 0.4) !important; }
        [data-dark="true"] .bg-amber-50 { background-color: rgb(146 64 14 / 0.4) !important; }
        [data-dark="true"] .bg-purple-50 { background-color: rgb(88 28 135 / 0.4) !important; }
        [data-dark="true"] .bg-indigo-50 { background-color: rgb(55 48 163 / 0.4) !important; }
        [data-dark="true"] .bg-emerald-50 { background-color: rgb(6 78 59 / 0.4) !important; }
        [data-dark="true"] .bg-orange-50 { background-color: rgb(154 52 18 / 0.4) !important; }
        
        /* Mode sombre - couleurs de texte sur fond coloré */
        [data-dark="true"] .text-red-700 { color: rgb(252 165 165) !important; }
        [data-dark="true"] .text-blue-700 { color: rgb(147 197 253) !important; }
        [data-dark="true"] .text-green-700 { color: rgb(134 239 172) !important; }
        [data-dark="true"] .text-amber-700 { color: rgb(252 211 77) !important; }
        [data-dark="true"] .text-purple-700 { color: rgb(216 180 254) !important; }
        [data-dark="true"] .text-indigo-700 { color: rgb(165 180 252) !important; }
        [data-dark="true"] .text-emerald-700 { color: rgb(110 231 183) !important; }
        [data-dark="true"] .text-orange-700 { color: rgb(253 186 116) !important; }
        
        /* Mode sombre - couleurs du texte indigo/purple */
        [data-dark="true"] .text-indigo-600 { color: rgb(165 180 252) !important; }
        [data-dark="true"] .text-purple-600 { color: rgb(216 180 254) !important; }
        [data-dark="true"] .text-emerald-600 { color: rgb(110 231 183) !important; }
        
        /* Mode sombre - fonds colorés légers */
        [data-dark="true"] .bg-indigo-100 { background-color: rgb(55 48 163 / 0.3) !important; }
        [data-dark="true"] .bg-purple-100 { background-color: rgb(88 28 135 / 0.3) !important; }
        [data-dark="true"] .bg-emerald-100 { background-color: rgb(6 78 59 / 0.3) !important; }
        [data-dark="true"] .bg-green-100 { background-color: rgb(22 101 52 / 0.3) !important; }
        [data-dark="true"] .bg-amber-100 { background-color: rgb(146 64 14 / 0.3) !important; }
        [data-dark="true"] .bg-orange-100 { background-color: rgb(154 52 18 / 0.3) !important; }
        
        /* Mode sombre - boutons actifs onglets */
        [data-dark="true"] .bg-gradient-to-r.from-blue-500 { 
          background: linear-gradient(to right, rgb(59 130 246), rgb(6 182 212)) !important; 
        }
        
        /* Mode sombre - cartes avec fond clair */
        [data-dark="true"] .bg-gradient-to-br.from-slate-50 { background: rgb(30 41 59) !important; }
        
        /* Mode sombre - ombres plus prononcées */
        [data-dark="true"] .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3) !important; }
        [data-dark="true"] .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3) !important; }
        
        /* Mode sombre - encarts d'aide (PageHelp) */
        [data-dark="true"] .bg-gradient-to-r.from-purple-50,
        [data-dark="true"] .bg-gradient-to-r.from-indigo-50,
        [data-dark="true"] .bg-gradient-to-r.from-emerald-50,
        [data-dark="true"] .bg-gradient-to-r.from-blue-50,
        [data-dark="true"] .bg-gradient-to-r.from-amber-50 { 
          background: rgb(51 65 85) !important; 
        }
        [data-dark="true"] .border-purple-200,
        [data-dark="true"] .border-indigo-200,
        [data-dark="true"] .border-emerald-200,
        [data-dark="true"] .border-blue-200,
        [data-dark="true"] .border-amber-200 { 
          border-color: rgb(100 116 139) !important; 
        }
        [data-dark="true"] .text-purple-800,
        [data-dark="true"] .text-indigo-800,
        [data-dark="true"] .text-emerald-800,
        [data-dark="true"] .text-blue-800,
        [data-dark="true"] .text-amber-800 { 
          color: rgb(248 250 252) !important; 
        }
        
        /* Mode sombre - Header patates */
        [data-dark="true"] .text-amber-600 { color: rgb(251 191 36) !important; }
        [data-dark="true"] .text-amber-900 { color: rgb(255 255 255) !important; }
        [data-dark="true"] .border-amber-300 { border-color: rgb(180 83 9) !important; }
        [data-dark="true"] .bg-amber-50 { background-color: rgb(120 53 15 / 0.5) !important; }
        [data-dark="true"] .bg-amber-50\\/80 { background-color: rgb(120 53 15 / 0.4) !important; }
        
        /* Emojis - affichage correct */
        .emoji-display {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
          font-style: normal;
        }
        
        /* Animation puzzle flottant */
        @keyframes puzzleFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(5deg); }
          50% { transform: translateY(-4px) rotate(-3deg); }
          75% { transform: translateY(-10px) rotate(3deg); }
        }
        .puzzle-float {
          animation: puzzleFloat 4s ease-in-out infinite;
        }
        .puzzle-float:active {
          animation: none;
          cursor: grabbing;
        }
      `}</style>

      {/* Icône flottante énigme du jour - déplaçable - seulement si pas de Centre de contrôle */}
      {!(ownedItems.includes(95) && activeUpgrades[95] !== false) && (() => {
        // Récupérer le niveau d'énigme le plus élevé disponible
        let activeRiddleLevel = null;
        if (ownedItems.includes(89) && activeUpgrades[89] !== false) activeRiddleLevel = 3;
        else if (ownedItems.includes(88) && activeUpgrades[88] !== false) activeRiddleLevel = 2;
        else if (ownedItems.includes(87) && activeUpgrades[87] !== false) activeRiddleLevel = 1;
        
        const isDoneToday = activeRiddleLevel && riddlesDoneToday.includes(activeRiddleLevel);
        
        if (!activeRiddleLevel) return null;
        
        const config = {
          1: { xp: 25 },
          2: { xp: 50 },
          3: { xp: 100 }
        }[activeRiddleLevel];
        
        // Seuil de mouvement en pixels avant de considérer comme un drag
        const MOVE_THRESHOLD = 10;
        
        return (
          <div
            id="puzzle-floating-icon"
            draggable="false"
            className="fixed z-40"
            style={{
              bottom: '130px',
              right: '20px',
              touchAction: 'none',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              const el = e.currentTarget;
              const rect = el.getBoundingClientRect();
              const startX = e.clientX;
              const startY = e.clientY;
              const offsetX = e.clientX - rect.left;
              const offsetY = e.clientY - rect.top;
              let totalMoved = 0;
              
              const onMouseMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                totalMoved = Math.sqrt(dx * dx + dy * dy);
                
                if (totalMoved > MOVE_THRESHOLD) {
                  const newX = Math.max(10, Math.min(window.innerWidth - 60, e.clientX - offsetX));
                  const newY = Math.max(80, Math.min(window.innerHeight - 140, e.clientY - offsetY));
                  el.style.left = newX + 'px';
                  el.style.top = newY + 'px';
                  el.style.right = 'auto';
                  el.style.bottom = 'auto';
                }
              };
              
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                // Ouvrir seulement si le mouvement total est inférieur au seuil
                if (totalMoved < MOVE_THRESHOLD) {
                  const riddle = getDailyRiddle(activeRiddleLevel);
                  setShowRiddle({ level: activeRiddleLevel, riddle, alreadyDone: isDoneToday });
                }
              };
              
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
            onTouchStart={(e) => {
              const el = e.currentTarget;
              const touch = e.touches[0];
              const rect = el.getBoundingClientRect();
              const startX = touch.clientX;
              const startY = touch.clientY;
              const offsetX = touch.clientX - rect.left;
              const offsetY = touch.clientY - rect.top;
              let totalMoved = 0;
              
              const onTouchMove = (e) => {
                const touch = e.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                totalMoved = Math.sqrt(dx * dx + dy * dy);
                
                if (totalMoved > MOVE_THRESHOLD) {
                  const newX = Math.max(10, Math.min(window.innerWidth - 60, touch.clientX - offsetX));
                  const newY = Math.max(80, Math.min(window.innerHeight - 140, touch.clientY - offsetY));
                  el.style.left = newX + 'px';
                  el.style.top = newY + 'px';
                  el.style.right = 'auto';
                  el.style.bottom = 'auto';
                }
              };
              
              const onTouchEnd = () => {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                // Ouvrir seulement si le mouvement total est inférieur au seuil
                if (totalMoved < MOVE_THRESHOLD) {
                  const riddle = getDailyRiddle(activeRiddleLevel);
                  setShowRiddle({ level: activeRiddleLevel, riddle, alreadyDone: isDoneToday });
                }
              };
              
              document.addEventListener('touchmove', onTouchMove);
              document.addEventListener('touchend', onTouchEnd);
            }}
          >
            <div
              className={`relative cursor-grab active:cursor-grabbing ${isDoneToday ? 'opacity-60' : ''}`}
              style={{ filter: isDoneToday ? 'grayscale(50%)' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))' }}
            >
              <span className="text-5xl">🧩</span>
              <span 
                className={`absolute -top-1 -right-1 text-xs font-bold px-1.5 py-0.5 rounded-full shadow ${
                  isDoneToday ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                }`}
              >
                {isDoneToday ? '✓' : `+${config.xp}`}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Bouton flottant Coffre-fort - seulement si pas de Centre de contrôle */}
      {ownedItems.includes(94) && activeUpgrades[94] !== false && !(ownedItems.includes(95) && activeUpgrades[95] !== false) && (
        <VaultButton onClick={() => setShowVault(true)} />
      )}

      {/* Modal Coffre-fort */}
      {showVault && (
        <Vault userId={supabaseUser?.id} onClose={() => setShowVault(false)} />
      )}

      {/* Centre de contrôle - regroupe tous les boutons flottants */}
      {ownedItems.includes(95) && activeUpgrades[95] !== false && (() => {
        // Calculer les infos pour chaque feature
        let activeRiddleLevel = null;
        if (ownedItems.includes(89) && activeUpgrades[89] !== false) activeRiddleLevel = 3;
        else if (ownedItems.includes(88) && activeUpgrades[88] !== false) activeRiddleLevel = 2;
        else if (ownedItems.includes(87) && activeUpgrades[87] !== false) activeRiddleLevel = 1;
        
        const riddleXp = activeRiddleLevel ? { 1: 25, 2: 50, 3: 100 }[activeRiddleLevel] : 0;
        const riddleDone = activeRiddleLevel && riddlesDoneToday.includes(activeRiddleLevel);
        
        // Vérifier si la citation a été vue aujourd'hui (stocké en localStorage)
        const today = new Date().toISOString().split('T')[0];
        const quoteSeen = localStorage.getItem('lastQuoteDate') === today;
        
        return (
          <ControlCenter
            hasRiddle={!!activeRiddleLevel}
            riddleDone={riddleDone}
            riddleXp={riddleXp}
            onRiddleClick={() => {
              const riddle = getDailyRiddle(activeRiddleLevel);
              setShowRiddle({ level: activeRiddleLevel, riddle, alreadyDone: riddleDone });
            }}
            hasVault={ownedItems.includes(94) && activeUpgrades[94] !== false}
            onVaultClick={() => setShowVault(true)}
            hasJournaling={hasJournaling}
            journalDone={journaling?.todayEntry}
            onJournalingClick={() => setShowJournalingModal(true)}
            hasDailyQuote={hasDailyQuote}
            quoteSeen={quoteSeen}
            onQuoteClick={() => setShowDailyQuote(true)}
            hasHabitTracker={hasHabitTracker}
            onHabitTrackerClick={() => setShowHabitTracker(true)}
          />
        );
      })()}

      {/* Modal d'animation de badge débloqué */}
      {unlockedBadge && (
        <BadgeUnlockedModal 
          badge={unlockedBadge} 
          onClose={() => setUnlockedBadge(null)} 
        />
      )}

      {/* Modal d'énigme quotidienne */}
      {showRiddle && (
        <RiddleModal
          riddle={showRiddle.riddle}
          level={showRiddle.level}
          alreadyDone={showRiddle.alreadyDone}
          onClose={() => setShowRiddle(null)}
          onSuccess={(xpReward) => {
            // Ne pas donner de XP si déjà fait
            if (showRiddle.alreadyDone) {
              setShowRiddle(null);
              return;
            }
            
            // 1. Marquer comme fait dans Supabase
            markRiddleDone(showRiddle.level, true);
            
            // 2. Ajouter les XP (même logique que pour les tâches)
            let newXp = user.xp + xpReward;
            let newLevel = user.level;
            let newXpToNext = user.xpToNext;

            while (newXp >= newXpToNext) {
              newXp -= newXpToNext;
              newLevel += 1;
              newXpToNext = getXpForLevel(newLevel);
            }

            const newUser = {
              ...user,
              xp: newXp,
              level: newLevel,
              xpToNext: newXpToNext,
            };

            setUser(newUser);
            
            if (supabaseUser) {
              saveProfile(newUser);
            }
            
            // 3. Fermer le modal
            setShowRiddle(null);
          }}
          onFail={() => {
            if (!showRiddle.alreadyDone) {
              markRiddleDone(showRiddle.level, false);
            }
          }}
        />
      )}

      {/* Bouton flottant Citation du Jour - seulement si pas de Centre de contrôle */}
      {hasDailyQuote && !(ownedItems.includes(95) && activeUpgrades[95] !== false) && (
        <DailyQuoteButton onClick={() => setShowDailyQuote(true)} />
      )}

      {/* Modal Citation du Jour */}
      {showDailyQuote && (
        <DailyQuoteCard onClose={() => setShowDailyQuote(false)} userId={supabaseUser?.id} />
      )}

      {/* Journaling - Papillon flottant - seulement si pas de Centre de contrôle */}
      {hasJournaling && !(ownedItems.includes(95) && activeUpgrades[95] !== false) && (
        <JournalingButterfly 
          journaling={journaling}
          onEntrySaved={() => {
            const newJournalEntries = (user.journalEntries || 0) + 1;
            const updatedUser = { ...user, journalEntries: newJournalEntries };
            setUser(updatedUser);
            if (supabaseUser) saveProfile(updatedUser);
            checkAndUpdateBadges({
              ...updatedUser,
              journalEntries: newJournalEntries,
              friendsCount: friends.length,
            });
          }}
        />
      )}

      {/* Modal Journaling depuis Centre de contrôle */}
      {hasJournaling && showJournalingModal && (
        <JournalingButterfly 
          journaling={journaling} 
          forceOpen={true}
          onClose={() => setShowJournalingModal(false)}
          onEntrySaved={() => {
            const newJournalEntries = (user.journalEntries || 0) + 1;
            const updatedUser = { ...user, journalEntries: newJournalEntries };
            setUser(updatedUser);
            if (supabaseUser) saveProfile(updatedUser);
            checkAndUpdateBadges({
              ...updatedUser,
              journalEntries: newJournalEntries,
              friendsCount: friends.length,
            });
          }}
        />
      )}

      {/* Habit Tracker - Bouton flottant draggable - seulement si pas de Centre de contrôle */}
      {hasHabitTracker && !(ownedItems.includes(95) && activeUpgrades[95] !== false) && (() => {
        const MOVE_THRESHOLD = 10;
        
        return (
          <div
            id="habit-tracker-floating-icon"
            draggable="false"
            className="fixed z-40"
            style={{
              bottom: '130px',
              left: '20px',
              touchAction: 'none',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              const el = e.currentTarget;
              const rect = el.getBoundingClientRect();
              const startX = e.clientX;
              const startY = e.clientY;
              const offsetX = e.clientX - rect.left;
              const offsetY = e.clientY - rect.top;
              let totalMoved = 0;
              
              const onMouseMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                totalMoved = Math.sqrt(dx * dx + dy * dy);
                
                if (totalMoved > MOVE_THRESHOLD) {
                  const newX = Math.max(10, Math.min(window.innerWidth - 60, e.clientX - offsetX));
                  const newY = Math.max(80, Math.min(window.innerHeight - 140, e.clientY - offsetY));
                  el.style.left = newX + 'px';
                  el.style.top = newY + 'px';
                  el.style.right = 'auto';
                  el.style.bottom = 'auto';
                }
              };
              
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                if (totalMoved < MOVE_THRESHOLD) {
                  setShowHabitTracker(true);
                }
              };
              
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
            onTouchStart={(e) => {
              const el = e.currentTarget;
              const touch = e.touches[0];
              const rect = el.getBoundingClientRect();
              const startX = touch.clientX;
              const startY = touch.clientY;
              const offsetX = touch.clientX - rect.left;
              const offsetY = touch.clientY - rect.top;
              let totalMoved = 0;
              
              const onTouchMove = (e) => {
                const touch = e.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                totalMoved = Math.sqrt(dx * dx + dy * dy);
                
                if (totalMoved > MOVE_THRESHOLD) {
                  const newX = Math.max(10, Math.min(window.innerWidth - 60, touch.clientX - offsetX));
                  const newY = Math.max(80, Math.min(window.innerHeight - 140, touch.clientY - offsetY));
                  el.style.left = newX + 'px';
                  el.style.top = newY + 'px';
                  el.style.right = 'auto';
                  el.style.bottom = 'auto';
                }
              };
              
              const onTouchEnd = () => {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                if (totalMoved < MOVE_THRESHOLD) {
                  setShowHabitTracker(true);
                }
              };
              
              document.addEventListener('touchmove', onTouchMove);
              document.addEventListener('touchend', onTouchEnd);
            }}
          >
            <div className="w-14 h-14 flex items-center justify-center cursor-grab active:cursor-grabbing">
              <span className="text-4xl hover:scale-110 transition-transform">🎯</span>
            </div>
          </div>
        );
      })()}

      {/* Modal Habit Tracker */}
      {showHabitTracker && hasHabitTracker && (
        <HabitTracker
          supabase={supabase}
          userId={supabaseUser?.id}
          onXPGain={(xp) => {
            const newUser = { ...user, xp: user.xp + xp };
            // Vérifier level up
            if (newUser.xp >= newUser.xpToNext) {
              newUser.level += 1;
              newUser.xp = newUser.xp - newUser.xpToNext;
              newUser.xpToNext = Math.floor(newUser.xpToNext * 1.2);
            }
            setUser(newUser);
            if (supabaseUser) saveProfile(newUser);
          }}
          potatoes={user.potatoes}
          setPotatoes={(updater) => {
            const newPotatoes = typeof updater === 'function' ? updater(user.potatoes) : updater;
            const newUser = { ...user, potatoes: newPotatoes };
            setUser(newUser);
            if (supabaseUser) saveProfile(newUser);
          }}
          onClose={() => setShowHabitTracker(false)}
          onHabitComplete={() => {
            const newHabitsCompleted = (user.habitsCompleted || 0) + 1;
            const updatedUser = { ...user, habitsCompleted: newHabitsCompleted };
            setUser(updatedUser);
            if (supabaseUser) saveProfile(updatedUser);
            
            // Vérifier les badges
            checkAndUpdateBadges({
              ...updatedUser,
              habitsCompleted: newHabitsCompleted,
              friendsCount: friends.length,
            });
          }}
        />
      )}

      {/* Modal de notification */}
      {pendingNotification && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in">
            {/* Notification Défi Chifoumi - Modal complet avec jeu */}
            {pendingNotification.type === 'chifoumi_challenge' ? (
              <ChifoumiNotificationModal
                notification={pendingNotification}
                myPotatoes={user.potatoes}
                onDismiss={dismissNotification}
                supabaseUserId={supabaseUser?.id}
              />
            ) : pendingNotification.type === 'chifoumi_your_turn' ? (
              <ChifoumiNotificationModal
                notification={pendingNotification}
                myPotatoes={user.potatoes}
                onDismiss={dismissNotification}
                supabaseUserId={supabaseUser?.id}
                isYourTurn={true}
              />
            ) : pendingNotification.type === 'chifoumi_result' ? (
              /* Résultat du Chifoumi pour le challenger */
              <>
                <div className={`p-6 text-center ${
                  pendingNotification.data?.isDraw 
                    ? 'bg-gradient-to-r from-slate-400 to-slate-500' 
                    : pendingNotification.data?.won 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                      : 'bg-gradient-to-r from-red-400 to-pink-500'
                }`}>
                  <div className="text-6xl mb-3">
                    {pendingNotification.data?.isDraw ? '🤝' : pendingNotification.data?.won ? '🎉' : '😢'}
                  </div>
                  <h2 className="text-xl font-bold text-white">{pendingNotification.title}</h2>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-center mb-4">
                    vs {pendingNotification.data?.opponentPseudo}
                  </p>
                  
                  <div className="flex justify-center items-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-4xl">
                        {pendingNotification.data?.challengerChoice === 'rock' ? '✊' : 
                         pendingNotification.data?.challengerChoice === 'paper' ? '✋' : '✌️'}
                      </div>
                      <div className="text-xs text-slate-500">Toi</div>
                    </div>
                    <div className="text-2xl text-slate-400">VS</div>
                    <div className="text-center">
                      <div className="text-4xl">
                        {pendingNotification.data?.opponentChoice === 'rock' ? '✊' : 
                         pendingNotification.data?.opponentChoice === 'paper' ? '✋' : '✌️'}
                      </div>
                      <div className="text-xs text-slate-500">{pendingNotification.data?.opponentPseudo}</div>
                    </div>
                  </div>
                  
                  {!pendingNotification.data?.isDraw && (
                    <div className={`rounded-xl p-4 mb-4 text-center ${
                      pendingNotification.data?.won ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      <p className={`text-2xl font-black ${
                        pendingNotification.data?.won ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {pendingNotification.data?.won ? '+' : '-'}{pendingNotification.data?.betAmount} 🥔
                      </p>
                    </div>
                  )}
                  
                  <button
                    onClick={dismissNotification}
                    className={`w-full py-3 rounded-xl font-bold text-white ${
                      pendingNotification.data?.isDraw 
                        ? 'bg-slate-500' 
                        : pendingNotification.data?.won 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-red-500 to-pink-500'
                    }`}
                  >
                    {pendingNotification.data?.isDraw ? 'OK' : pendingNotification.data?.won ? 'Super ! 🎉' : 'OK 😢'}
                  </button>
                </div>
              </>
            ) : pendingNotification.type === 'task_invitation' ? (
              <>
                <div className="p-6 text-center bg-gradient-to-r from-purple-500 to-pink-500">
                  <div className="text-6xl mb-3">📋</div>
                  <h2 className="text-xl font-bold text-white">{pendingNotification.title}</h2>
                </div>
                <div className="p-6">
                  <p className="text-slate-700 text-center mb-4">{pendingNotification.message}</p>
                  
                  <button
                    onClick={() => {
                      dismissNotification();
                      setCurrentPage('tasks');
                    }}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                  >
                    Voir la tâche 📋
                  </button>
                </div>
              </>
            ) : (
              /* Notification par défaut (tâche/événement complété) */
              <>
                <div className={`p-6 text-center ${pendingNotification.type === 'task_completed' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}>
                  <div className="text-6xl mb-3">
                    {pendingNotification.type === 'task_completed' ? '✅' : '📅'}
                  </div>
                  <h2 className="text-xl font-bold text-white">{pendingNotification.title}</h2>
                </div>
                <div className="p-6">
                  <p className="text-slate-700 text-center mb-4">{pendingNotification.message}</p>
                  
                  {(pendingNotification.data?.xpGained || pendingNotification.data?.pointsGained) && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <div className="flex justify-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-500">+{pendingNotification.data?.xpGained || 0}</div>
                          <div className="text-xs text-slate-500">XP gagnés</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">+{pendingNotification.data?.pointsGained || 0}</div>
                          <div className="text-xs text-slate-500">🥔 gagnées</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={dismissNotification}
                    className={`w-full py-3 rounded-xl font-bold text-white ${pendingNotification.type === 'task_completed' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                  >
                    Super ! 🎉
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Instructions Widget */}
      {showWidgetInstructions && (
        <WidgetInstructions onClose={() => setShowWidgetInstructions(false)} />
      )}
    </div>
  );
};

export default QuestApp;
