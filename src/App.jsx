import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameData } from './hooks/useGameData';
import { useNotifications } from './hooks/useNotifications';
import { useJournaling } from './hooks/useJournaling';
import { useCalendarSync } from './hooks/useCalendarSync';
import { AuthScreen, OnboardingScreen, LoadingScreen } from './components/AuthScreens';
import { Header, Navigation } from './components/Header';
import { TasksPage } from './components/TasksPage';
import { FriendsPage } from './components/FriendsPage';
import { ChestsPage, ChestOpeningModal } from './components/ChestsPage';
import { BadgesPage } from './components/BadgesPage';
import { ShopPage } from './components/ShopPage';
import { StatsPage } from './components/StatsPage';
import { DailyQuoteCard, DailyQuoteButton } from './components/DailyQuote';
import { JournalingButterfly } from './components/JournalingButterfly';
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
  CreateEventModal,
  EventCompletedModal,
  RiddleModal
} from './components/Modals';
import { getDailyRiddle } from './data/riddles';
import { supabase } from './supabaseClient';

const QuestApp = () => {
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
    events,
    setEvents,
    missions,
    setMissions,
    friends,
    setFriends,
    friendRequests,
    setFriendRequests,
    sharedRequests,
    sendSharedRequests,
    acceptSharedRequest,
    rejectSharedRequest,
    refreshSharedRequests,
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
    saveEvent,
    deleteEvent: deleteEventFromDB,
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
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [completingEvent, setCompletingEvent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [openingChest, setOpeningChest] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRiddle, setShowRiddle] = useState(null); // { level: 1|2|3, riddle: {...} }
  const [riddlesDoneToday, setRiddlesDoneToday] = useState([]);
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [pendingNotification, setPendingNotification] = useState(null);

  // Hook pour le journaling
  const journaling = useJournaling(supabaseUser?.id);

  // Hook pour la synchronisation des calendriers
  const calendarSync = useCalendarSync(supabaseUser?.id);

  // Vérifier si l'amélioration Citation du Jour est active
  const hasDailyQuote = ownedItems.includes(90) && activeUpgrades[90] !== false;
  
  // Vérifier si l'amélioration Journaling est active
  const hasJournaling = ownedItems.includes(91) && activeUpgrades[91] !== false;

  // Polling pour les demandes de partage (toutes les 30 secondes)
  useEffect(() => {
    if (!supabaseUser || !user.pseudo) return;
    
    const interval = setInterval(() => {
      refreshSharedRequests();
    }, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, [supabaseUser, user.pseudo, refreshSharedRequests]);

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
      
      const { data, error } = await supabase
        .from('riddles_history')
        .select('level')
        .eq('user_id', supabaseUser.id)
        .eq('riddle_date', today);
      
      if (!error && data) {
        setRiddlesDoneToday(data.map(r => r.level));
      }
    };
    
    loadRiddlesHistory();
  }, [supabaseUser]);

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
  };

  // Sauvegarder currentPage dans localStorage
  useEffect(() => {
    localStorage.setItem('todogame_currentPage', currentPage);
  }, [currentPage]);

  // Sauvegarder tasksView dans localStorage
  useEffect(() => {
    localStorage.setItem('todogame_tasksView', tasksView);
  }, [tasksView]);

  // Reporter automatiquement les tâches non faites d'hier à aujourd'hui
  useEffect(() => {
    const checkAndReportTasks = async () => {
      if (!tasks || tasks.length === 0) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tasksToReport = tasks.filter(task => {
        if (task.completed) return false;
        if (!task.date) return false;
        
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        
        // Si la date de la tâche est avant aujourd'hui, on la reporte
        return taskDate < today;
      });
      
      if (tasksToReport.length === 0) return;
      
      console.log(`Report de ${tasksToReport.length} tâche(s) non terminée(s) à aujourd'hui`);
      
      // Mettre à jour les tâches localement
      const updatedTasks = tasks.map(task => {
        if (tasksToReport.some(t => t.id === task.id)) {
          return { ...task, date: today };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      
      // Mettre à jour dans Supabase
      if (supabaseUser) {
        for (const task of tasksToReport) {
          await supabase
            .from('tasks')
            .update({ date: today.toISOString() })
            .eq('id', task.id);
        }
      }
    };
    
    checkAndReportTasks();
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
  const fuseChests = (type) => {
    let newChests = { ...chests };
    if (type === 'bronze' && chests.bronze >= 3) {
      newChests = { ...chests, bronze: chests.bronze - 3, silver: chests.silver + 1 };
    } else if (type === 'silver' && chests.silver >= 5) {
      newChests = { ...chests, silver: chests.silver - 5, gold: chests.gold + 1 };
    }
    updateChests(newChests);
  };

  const openChest = (type) => {
    if (chests[type] <= 0) return;

    const possibleRewards = {
      bronze: [],
      silver: [
        { id: 30, name: 'Océan', type: 'fond', image: '🌊', colors: 'from-blue-400 to-cyan-500' },
        { id: 32, name: 'Forêt', type: 'fond', image: '🌲', colors: 'from-green-500 to-emerald-600' },
      ],
      gold: [
        { id: 33, name: 'Galaxie', type: 'fond', image: '🌌', colors: 'from-purple-600 to-indigo-800' },
        { id: 34, name: 'Feu', type: 'fond', image: '🔥', colors: 'from-red-500 to-orange-500' },
      ],
      legendary: [
        { id: 14, name: 'Alien', type: 'avatar', image: '👽' },
        { id: 15, name: 'Dragon', type: 'avatar', image: '🐉' },
      ],
    };

    const pointsReward = { bronze: 50, silver: 150, gold: 400, legendary: 1000 };

    const availableItems = possibleRewards[type].filter(item => !ownedItems.includes(item.id));
    let wonItem = null;
    
    if (availableItems.length > 0) {
      wonItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      setOwnedItems(prev => [...prev, wonItem.id]);
    }

    const rewards = { points: pointsReward[type], items: wonItem ? [wonItem] : [] };
    const newChests = { ...chests, [type]: chests[type] - 1 };
    const newUser = { ...user, potatoes: user.potatoes + rewards.points };
    
    updateChests(newChests);
    updateUser(newUser);
    setOpeningChest({ type, rewards });
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
          // Lucky chest - coffre aléatoire avec chance de rare
          const rand = Math.random();
          let newChests = { ...chests };
          if (rand < 0.5) {
            newChests.bronze += 1; // 50% commun
          } else if (rand < 0.8) {
            newChests.silver += 1; // 30% splendide
          } else if (rand < 0.95) {
            newChests.gold += 1; // 15% diamant
          } else {
            newChests.legendary += 1; // 5% légendaire
          }
          setChests(newChests);
          saveChests(newChests);
          updateUser({ ...user, potatoes: user.potatoes - item.price });
        } else if (item.boostType === 'instant_silver_chest') {
          const newChests = { ...chests, silver: chests.silver + 1 };
          setChests(newChests);
          saveChests(newChests);
          updateUser({ ...user, potatoes: user.potatoes - item.price });
        } else if (item.boostType === 'instant_gold_chest') {
          const newChests = { ...chests, gold: chests.gold + 1 };
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
    
    updateUser({ ...user, potatoes: user.potatoes - item.price });
    const newOwnedItems = [...ownedItems, item.id];
    setOwnedItems(newOwnedItems);
    saveOwnedItems(newOwnedItems); // Sauvegarder dans Supabase
    
    // Appliquer automatiquement les améliorations
    if (item.type === 'amelioration') {
      if (item.isDarkMode) {
        toggleDarkMode(true);
      }
      if (item.themeColor) {
        setColorTheme(item.themeColor);
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
    
    // Bonus x2 si tâche partagée avec des amis
    const hasParticipants = task.participants && task.participants.length > 0;
    const sharingBonus = hasParticipants ? 2 : 1;
    
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

    // Coffre : toutes les 8 tâches (ou 6 si boost coffre actif)
    const hasChestBoost = activeBoosts.some(b => b.type === 'chest_boost' && new Date(b.expiresAt) > new Date());
    const chestThreshold = hasChestBoost ? 6 : 8;
    if ((user.tasksCompleted + 1) % chestThreshold === 0) {
      const newChests = { ...chests, bronze: chests.bronze + 1 };
      setChests(newChests);
      if (supabaseUser) {
        saveChests(newChests);
      }
    }

    // Si c'est une tâche récurrente, créer la prochaine occurrence
    if (task.recurrence && task.recurrence !== 'none') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let nextDate = null;

      if (task.recurrence === 'daily') {
        // Prochaine occurrence = demain
        nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (task.recurrence === 'weekly') {
        // Trouver le prochain jour de la semaine
        const recurrenceDays = task.recurrenceDays || [];
        if (recurrenceDays.length > 0) {
          const currentDay = today.getDay();
          // Trier les jours et trouver le prochain
          const sortedDays = [...recurrenceDays].sort((a, b) => a - b);
          let nextDay = sortedDays.find(d => d > currentDay);
          
          if (nextDay === undefined) {
            // Pas de jour cette semaine, prendre le premier de la semaine prochaine
            nextDay = sortedDays[0];
            nextDate = new Date(today);
            nextDate.setDate(today.getDate() + (7 - currentDay + nextDay));
          } else {
            nextDate = new Date(today);
            nextDate.setDate(today.getDate() + (nextDay - currentDay));
          }
        }
      } else if (task.recurrence === 'monthly') {
        // Trouver le prochain jour du mois
        const recurrenceDays = task.recurrenceDays || [];
        if (recurrenceDays.length > 0) {
          const currentDayOfMonth = today.getDate();
          const sortedDays = [...recurrenceDays].sort((a, b) => a - b);
          let nextDay = sortedDays.find(d => d > currentDayOfMonth);
          
          if (nextDay === undefined) {
            // Pas de jour ce mois, prendre le premier du mois prochain
            nextDay = sortedDays[0];
            nextDate = new Date(today.getFullYear(), today.getMonth() + 1, nextDay);
          } else {
            nextDate = new Date(today.getFullYear(), today.getMonth(), nextDay);
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

    // Vérifier les badges
    const newlyUnlocked = checkAndUpdateBadges({
      tasksCompleted: newUser.tasksCompleted,
      level: newUser.level,
      totalPotatoes: (user.totalPotatoes || 0) + pointsGained,
      friendsCount: friends.length,
      urgentCompleted: task.status === 'urgent' ? (user.urgentCompleted || 0) + 1 : (user.urgentCompleted || 0),
      longQuests: task.duration === '1 jour' ? (user.longQuests || 0) + 1 : (user.longQuests || 0),
    });
    
    // Afficher l'animation pour le premier badge débloqué
    if (newlyUnlocked.length > 0) {
      setTimeout(() => {
        setUnlockedBadge(newlyUnlocked[0]);
      }, 2000); // Attendre que l'animation de tâche terminée se termine
    }
  };

  const addTask = async (taskData) => {
    const newTask = {
      id: crypto.randomUUID(),
      ...taskData,
      completed: false,
    };
    
    setTasks([...tasks, newTask]);
    
    if (supabaseUser) {
      await supabase.from('tasks').insert({
        id: newTask.id,
        user_id: supabaseUser.id,
        title: newTask.title,
        status: newTask.status,
        duration: newTask.duration,
        date: newTask.date?.toISOString(),
        recurrence: newTask.recurrence || 'none',
        recurrence_days: newTask.recurrenceDays || [],
        tags: newTask.tags || [],
        notes: newTask.notes || '',
        photos: newTask.photos || [],
        participants: newTask.participants || [],
        category: taskData.date ? 'today' : 'bucketlist',
        completed: false,
      });

      // Envoyer les demandes de partage aux participants
      if (newTask.participants && newTask.participants.length > 0) {
        await sendSharedRequests('task', newTask.id, newTask.participants, {
          title: newTask.title,
          date: newTask.date?.toISOString(),
          duration: newTask.duration,
          status: newTask.status,
        });
      }
    }
  };

  const updateTask = async (taskId, taskData) => {
    const oldTask = tasks.find(t => t.id === taskId);
    setTasks(tasks.map(t => t.id === taskId ? { ...t, ...taskData } : t));
    
    if (supabaseUser) {
      await supabase.from('tasks').update({
        title: taskData.title,
        status: taskData.status,
        duration: taskData.duration,
        date: taskData.date?.toISOString(),
        recurrence: taskData.recurrence,
        recurrence_days: taskData.recurrenceDays || [],
        tags: taskData.tags,
        notes: taskData.notes,
        photos: taskData.photos || [],
        participants: taskData.participants || [],
      }).eq('id', taskId);

      // Envoyer les demandes aux nouveaux participants
      if (taskData.participants && taskData.participants.length > 0) {
        const oldParticipants = oldTask?.participants?.map(p => p.pseudo) || [];
        const newParticipants = taskData.participants.filter(
          p => !oldParticipants.includes(p.pseudo)
        );
        if (newParticipants.length > 0) {
          await sendSharedRequests('task', taskId, newParticipants, {
            title: taskData.title,
            date: taskData.date?.toISOString(),
            duration: taskData.duration,
            status: taskData.status,
          });
        }
      }
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

  // === ÉVÉNEMENTS ===
  const addEvent = async (eventData) => {
    const newEvent = {
      id: crypto.randomUUID(),
      ...eventData,
      completed: false,
    };
    
    setEvents([...events, newEvent]);
    
    if (supabaseUser) {
      await saveEvent(newEvent);

      // Envoyer les demandes de partage aux participants
      if (newEvent.participants && newEvent.participants.length > 0) {
        await sendSharedRequests('event', newEvent.id, newEvent.participants, {
          title: newEvent.title,
          date: newEvent.date?.toISOString(),
          duration: newEvent.duration,
          time: newEvent.time,
          location: newEvent.location,
        });
      }
    }
  };

  const updateEvent = async (eventId, eventData) => {
    const oldEvent = events.find(e => e.id === eventId);
    const updatedEvent = { ...oldEvent, ...eventData };
    setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
    
    if (supabaseUser) {
      await saveEvent(updatedEvent);

      // Envoyer les demandes aux nouveaux participants
      if (eventData.participants && eventData.participants.length > 0) {
        const oldParticipants = oldEvent?.participants?.map(p => p.pseudo) || [];
        const newParticipants = eventData.participants.filter(
          p => !oldParticipants.includes(p.pseudo)
        );
        if (newParticipants.length > 0) {
          await sendSharedRequests('event', eventId, newParticipants, {
            title: eventData.title,
            date: eventData.date?.toISOString(),
            duration: eventData.duration,
            time: eventData.time,
            location: eventData.location,
          });
        }
      }
    }
  };

  const deleteEvent = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const isShared = event.participants && event.participants.length > 0;
    const sharingBonus = isShared ? 2 : 1;
    
    // Si l'événement était complété, retirer les points
    if (event.completed || (event.completedBy && event.completedBy.includes(user.pseudo))) {
      const xpLost = 5 * sharingBonus;
      const pointsLost = 5 * sharingBonus;
      
      let newXp = user.xp - xpLost;
      let newLevel = user.level;
      let newXpToNext = user.xpToNext;
      
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
      };
      updateUser(newUser);
      
      // Si événement partagé, retirer les points aux autres participants aussi
      if (isShared && supabaseUser) {
        for (const participant of event.participants) {
          try {
            const { data: participantProfile } = await supabase
              .from('profiles')
              .select('id, xp, level, xp_to_next, potatoes')
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
                })
                .eq('id', participantProfile.id);
            }
          } catch (error) {
            console.error('Erreur retrait points participant:', error);
          }
        }
      }
    }
    
    setEvents(events.filter(e => e.id !== eventId));
    if (supabaseUser) {
      await deleteEventFromDB(eventId);
    }
  };

  const completeEvent = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // Vérifier si l'utilisateur a déjà complété cet événement
    const completedBy = event.completedBy || [];
    if (completedBy.includes(user.pseudo)) return; // Déjà complété par cet utilisateur
    
    // Récompenses fixes : 5 XP, 5 patates
    // Bonus x2 si événement partagé avec des amis
    const participantCount = event.participants?.length || 0;
    const hasParticipants = participantCount > 0;
    const sharingBonus = hasParticipants ? 2 : 1;
    
    const baseXp = 5;
    const basePoints = 5;
    const xpGained = baseXp * sharingBonus;
    const pointsGained = basePoints * sharingBonus;
    
    // Appliquer les multiplicateurs de boost
    const finalXp = Math.round(xpGained * getXpMultiplier());
    const finalPoints = Math.round(pointsGained * getPotatoesMultiplier());
    
    let newXp = user.xp + finalXp;
    let newLevel = user.level;
    let newXpToNext = user.xpToNext;
    
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = Math.floor(newXpToNext * 1.15);
    }
    
    const newUser = {
      ...user,
      xp: newXp,
      level: newLevel,
      xpToNext: newXpToNext,
      potatoes: user.potatoes + finalPoints,
    };
    
    updateUser(newUser);
    
    // Ajouter l'utilisateur à la liste des personnes ayant complété
    const newCompletedBy = [...completedBy, user.pseudo];
    const updatedEvent = { 
      ...event, 
      completedBy: newCompletedBy,
      // Marquer comme totalement complété si tous les participants + créateur ont complété
      completed: event.missionId ? false : true // Pour événements normaux, marquer complété directement
    };
    
    setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
    
    if (supabaseUser) {
      await saveEvent(updatedEvent);
      
      // Si événement partagé, notifier les autres participants et leur donner des points
      if (hasParticipants) {
        for (const participant of event.participants) {
          // Ne pas notifier soi-même
          if (participant.pseudo === user.pseudo) continue;
          
          try {
            // Récupérer le profil du participant
            const { data: participantProfile } = await supabase
              .from('profiles')
              .select('id, xp, level, xp_to_next, potatoes')
              .eq('pseudo', participant.pseudo)
              .single();
            
            if (participantProfile) {
              // Calculer les points pour le participant
              let participantNewXp = participantProfile.xp + finalXp;
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
                  potatoes: participantProfile.potatoes + finalPoints,
                })
                .eq('id', participantProfile.id);
              
              // Créer une notification
              await supabase.from('notifications').insert({
                user_id: participantProfile.id,
                type: 'event_completed',
                title: 'Événement partagé terminé !',
                message: `${user.pseudo} a terminé "${event.title}"`,
                data: {
                  eventId: event.id,
                  eventTitle: event.title,
                  completedBy: user.pseudo,
                  xpGained: finalXp,
                  pointsGained: finalPoints,
                },
                read: false,
              });
            }
          } catch (error) {
            console.error('Erreur notification participant:', error);
          }
        }
      }
    }
    
    // Afficher le modal de célébration
    setCompletingEvent({ ...event, xp: finalXp, points: finalPoints, shared: hasParticipants });
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
        onToggleUpgrade={toggleUpgrade}
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
    pageContent = <ChestOpeningModal chest={openingChest} onClose={() => setOpeningChest(null)} />;
  } else if (completingTask) {
    pageContent = <TaskCompletedModal task={completingTask} onClose={() => setCompletingTask(null)} />;
  } else if (completingEvent) {
    pageContent = <EventCompletedModal event={completingEvent} onClose={() => setCompletingEvent(null)} />;
  } else if (completingMission) {
    pageContent = <MissionCompletedModal mission={completingMission.mission} pqDistribution={completingMission.pqDistribution} onClose={() => { setCompletingMission(null); setSelectedMission(null); }} />;
  } else if (editingTask) {
    pageContent = (
      <CreateTaskModal
        onClose={() => setEditingTask(null)}
        onCreate={(taskData) => { updateTask(editingTask.id, taskData); setEditingTask(null); }}
        onDelete={() => { deleteTask(editingTask.id); setEditingTask(null); }}
        initialTask={editingTask}
        getStatusColor={getStatusColor}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
        friends={friends}
      />
    );
  } else if (creatingTask) {
    pageContent = (
      <CreateTaskModal
        onClose={() => setCreatingTask(false)}
        onCreate={(taskData) => { addTask(taskData); setCreatingTask(false); }}
        getStatusColor={getStatusColor}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
        friends={friends}
      />
    );
  } else if (editingEvent) {
    pageContent = (
      <CreateEventModal
        onClose={() => setEditingEvent(null)}
        onCreate={(eventData) => { updateEvent(editingEvent.id, eventData); setEditingEvent(null); }}
        onDelete={() => { deleteEvent(editingEvent.id); setEditingEvent(null); }}
        initialEvent={editingEvent}
        friends={friends}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
      />
    );
  } else if (creatingEvent) {
    pageContent = (
      <CreateEventModal
        onClose={() => setCreatingEvent(false)}
        onCreate={(eventData) => { addEvent(eventData); setCreatingEvent(false); }}
        friends={friends}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
        existingTags={existingTags}
        userId={supabaseUser?.id}
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
      />
    );
  } else if (creatingMissionEvent) {
    // Création d'un événement dans une mission
    pageContent = (
      <CreateEventModal
        onClose={() => setCreatingMissionEvent(null)}
        onCreate={async (eventData) => {
          const newEvent = { 
            id: Date.now(), 
            title: eventData.title,
            description: eventData.description,
            date: eventData.date,
            time: eventData.time,
            duration: eventData.duration,
            location: eventData.location,
            reminder: eventData.reminder,
            assignedTo: eventData.assignedTo || null,
            completed: false, 
            isEvent: true,
            xp: getDurationXP(eventData.duration, 'à faire') 
          };
          const updatedMission = { 
            ...creatingMissionEvent, 
            quests: [...(creatingMissionEvent.quests || []), newEvent] 
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
        missionParticipants={creatingMissionEvent?.participants || []}
        friends={friends}
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
            
            // Coffre toutes les 8 tâches
            if (newTasksCompleted % 8 === 0) {
              const newChests = { ...chests, bronze: chests.bronze + 1 };
              setChests(newChests);
              if (supabaseUser) {
                saveChests(newChests);
              }
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
            
            // Compter les événements de cette mission complétés par l'utilisateur
            const missionEvents = events.filter(e => e.missionId === missionId);
            missionEvents.forEach(event => {
              if (event.completedBy?.includes(user.pseudo) || event.completed) {
                // Récompenses fixes des événements : 5 XP, 5 patates
                xpToRemove += 5;
                potatoesToRemove += 5;
                // PQ des événements : 5 PQ par participant
                const participantCount = event.participants?.length || 0;
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
            
            // Supprimer aussi les événements liés à cette mission
            const remainingEvents = events.filter(e => e.missionId !== missionId);
            setEvents(remainingEvents);
          }
          
          setMissions(missions.filter(m => m.id !== missionId));
          setSelectedMission(null);
          // Supprimer de Supabase
          if (supabaseUser) {
            await deleteMissionFromDB(missionId);
            // Supprimer les événements de la mission dans Supabase
            await supabase.from('events').delete().eq('mission_id', missionId);
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
        events={events}
        tasksView={tasksView}
        setTasksView={setTasksView}
        sharedRequests={sharedRequests}
        onAcceptSharedRequest={acceptSharedRequest}
        onDeclineSharedRequest={rejectSharedRequest}
        onCompleteTask={completeTask}
        onCompleteEvent={completeEvent}
        onCreateTask={() => setCreatingTask(true)}
        onCreateEvent={() => setCreatingEvent(true)}
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
        onEditEvent={(event) => setEditingEvent(event)}
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
            
            // Coffre toutes les 8 tâches (tâches de mission incluses)
            if (newTasksCompleted % 8 === 0) {
              const newChests = { ...chests, bronze: chests.bronze + 1 };
              setChests(newChests);
              if (supabaseUser) {
                saveChests(newChests);
              }
            }
          }
        }}
        ownedItems={ownedItems}
        activeUpgrades={activeUpgrades}
      />
    );
  } else if (currentPage === 'friends') {
    pageContent = (
      <FriendsPage 
        user={user}
        friends={friends}
        tasks={tasks}
        events={events}
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
        onEditEvent={(event) => setEditingEvent(event)}
        ownedItems={ownedItems}
      />
    );
  } else if (currentPage === 'chests') {
    pageContent = <ChestsPage chests={chests} onFuseChests={fuseChests} onOpenChest={openChest} tasksCompleted={user.tasksCompleted} />;
  } else if (currentPage === 'badges') {
    pageContent = <BadgesPage badges={badges} />;
  } else if (currentPage === 'stats') {
    pageContent = (
      <StatsPage 
        user={user}
        tasks={tasks}
        events={events}
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
        onToggleUpgrade={toggleUpgrade}
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
        setCurrentPage={setCurrentPage}
        friendRequestsCount={friendRequests.length}
        chestsCount={chests.bronze + chests.silver + chests.gold + chests.legendary}
        theme={theme}
        hasStats={hasStats}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        /* Animations améliorées */
        .transitions-enhanced * {
          transition-duration: 0.3s !important;
        }
        .transitions-enhanced button:hover {
          transform: scale(1.05);
        }
        .transitions-enhanced .hover\\:scale-105:hover {
          transform: scale(1.08);
        }

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

      {/* Icône flottante énigme du jour - déplaçable */}
      {(() => {
        // Récupérer le niveau d'énigme le plus élevé disponible
        let activeRiddleLevel = null;
        if (ownedItems.includes(89) && activeUpgrades[89] !== false) activeRiddleLevel = 3;
        else if (ownedItems.includes(88) && activeUpgrades[88] !== false) activeRiddleLevel = 2;
        else if (ownedItems.includes(87) && activeUpgrades[87] !== false) activeRiddleLevel = 1;
        
        const isDoneToday = activeRiddleLevel && riddlesDoneToday.includes(activeRiddleLevel);
        
        if (!activeRiddleLevel || isDoneToday) return null;
        
        const config = {
          1: { xp: 25 },
          2: { xp: 50 },
          3: { xp: 100 }
        }[activeRiddleLevel];
        
        return (
          <div
            id="puzzle-floating-icon"
            draggable="false"
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '20px',
              zIndex: 40,
              touchAction: 'none'
            }}
            onMouseDown={(e) => {
              const el = e.currentTarget;
              const startX = e.clientX - el.offsetLeft;
              const startY = e.clientY - el.offsetTop;
              
              const onMouseMove = (e) => {
                el.style.left = (e.clientX - startX) + 'px';
                el.style.top = (e.clientY - startY) + 'px';
                el.style.right = 'auto';
                el.style.bottom = 'auto';
              };
              
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
            onTouchStart={(e) => {
              const el = e.currentTarget;
              const touch = e.touches[0];
              const startX = touch.clientX - el.offsetLeft;
              const startY = touch.clientY - el.offsetTop;
              
              const onTouchMove = (e) => {
                const touch = e.touches[0];
                el.style.left = (touch.clientX - startX) + 'px';
                el.style.top = (touch.clientY - startY) + 'px';
                el.style.right = 'auto';
                el.style.bottom = 'auto';
              };
              
              const onTouchEnd = () => {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
              };
              
              document.addEventListener('touchmove', onTouchMove);
              document.addEventListener('touchend', onTouchEnd);
            }}
          >
            <button
              onClick={() => {
                const riddle = getDailyRiddle(activeRiddleLevel);
                setShowRiddle({ level: activeRiddleLevel, riddle });
              }}
              className="puzzle-float cursor-grab active:cursor-grabbing relative"
              title={`Énigme du jour (+${config.xp} XP)`}
            >
              <span className="text-5xl drop-shadow-lg">🧩</span>
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
                +{config.xp}
              </span>
            </button>
          </div>
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
          onClose={() => setShowRiddle(null)}
          onSuccess={(xpReward) => {
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
            markRiddleDone(showRiddle.level, false);
          }}
        />
      )}

      {/* Bouton flottant Citation du Jour */}
      {hasDailyQuote && (
        <DailyQuoteButton onClick={() => setShowDailyQuote(true)} />
      )}

      {/* Modal Citation du Jour */}
      {showDailyQuote && (
        <DailyQuoteCard onClose={() => setShowDailyQuote(false)} />
      )}

      {/* Journaling - Papillon flottant */}
      {hasJournaling && (
        <JournalingButterfly journaling={journaling} />
      )}

      {/* Modal de notification (tâche/événement complété par un ami) */}
      {pendingNotification && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in">
            <div className={`p-6 text-center ${pendingNotification.type === 'task_completed' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}>
              <div className="text-6xl mb-3">
                {pendingNotification.type === 'task_completed' ? '✅' : '📅'}
              </div>
              <h2 className="text-xl font-bold text-white">{pendingNotification.title}</h2>
            </div>
            <div className="p-6">
              <p className="text-slate-700 text-center mb-4">{pendingNotification.message}</p>
              
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
              
              <button
                onClick={dismissNotification}
                className={`w-full py-3 rounded-xl font-bold text-white ${pendingNotification.type === 'task_completed' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
              >
                Super ! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestApp;
