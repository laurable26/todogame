import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useGameData } from './hooks/useGameData';
import { useNotifications } from './hooks/useNotifications';
import { useCalendarSync } from './hooks/useCalendarSync';
import { AuthScreen, OnboardingScreen, LoadingScreen } from './components/AuthScreens';
import { Header, Navigation } from './components/Header';
import { TasksPage } from './components/TasksPage';
import { FriendsPage } from './components/FriendsPage';
import { ChestsPage, ChestOpeningModal } from './components/ChestsPage';
import { BadgesPage } from './components/BadgesPage';
import { ShopPage } from './components/ShopPage';
import { StatsPage } from './components/StatsPage';
import CalendarSettings from './components/CalendarSettings';
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
  EventCompletedModal
} from './components/Modals';
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

  // Calendriers (Google, Outlook)
  const calendarSync = useCalendarSync(supabaseUser?.id);

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
    
    const baseXp = getDurationXP(task.duration, task.status);
    const basePoints = getDurationPoints(task.duration, task.status);
    
    const xpGained = Math.round(baseXp * xpMultiplier);
    const pointsGained = Math.round(basePoints * potatoesMultiplier);

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

    setCompletingTask({ task, xp: xpGained, points: pointsGained });

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
        category: taskData.date ? 'today' : 'bucketlist',
        completed: false,
      });
    }
  };

  const updateTask = async (taskId, taskData) => {
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
      }).eq('id', taskId);
    }
  };

  const deleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    
    // Si la tâche était terminée, retirer les points gagnés
    if (task && task.completed) {
      const xpLost = getDurationXP(task.duration, task.status);
      const pointsLost = getDurationPoints(task.duration, task.status);
      
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
    }
  };

  const updateEvent = async (eventId, eventData) => {
    const updatedEvent = { ...events.find(e => e.id === eventId), ...eventData };
    setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
    
    if (supabaseUser) {
      await saveEvent(updatedEvent);
    }
  };

  const deleteEvent = async (eventId) => {
    setEvents(events.filter(e => e.id !== eventId));
    if (supabaseUser) {
      await deleteEventFromDB(eventId);
    }
  };

  const completeEvent = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event || event.completed) return;
    
    // Récompenses fixes : 5 XP, 5 patates
    // + 5 PQ par participant SI au moins 1 participant en plus du créateur
    const xpGained = 5;
    const pointsGained = 5;
    const participantCount = event.participants?.length || 0;
    const pqGained = participantCount > 0 ? participantCount * 5 : 0;
    
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
      pqSeason: (user.pqSeason || 0) + pqGained,
      pqTotal: (user.pqTotal || 0) + pqGained,
    };
    
    updateUser(newUser);
    
    // Marquer comme complété
    const updatedEvent = { ...event, completed: true };
    setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
    
    if (supabaseUser) {
      await saveEvent(updatedEvent);
    }
    
    // Afficher le modal de célébration
    setCompletingEvent({ ...event, xp: finalXp, points: finalPoints, pq: pqGained });
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
              await supabase.from('calendar_connections').delete().eq('user_id', supabaseUser.id);
              await supabase.from('calendar_events').delete().eq('user_id', supabaseUser.id);
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
      />
    );
  } else if (creatingEvent) {
    pageContent = (
      <CreateEventModal
        onClose={() => setCreatingEvent(false)}
        onCreate={(eventData) => { addEvent(eventData); setCreatingEvent(false); }}
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
      />
    );
  } else if (editingQuest) {
    // Édition d'une tâche ou événement de mission
    if (editingQuest.quest.isEvent) {
      // C'est un événement de mission → utiliser CreateEventModal
      pageContent = (
        <CreateEventModal
          onClose={() => setEditingQuest(null)}
          onCreate={async (eventData) => {
            const updatedQuest = { 
              ...editingQuest.quest,
              title: eventData.title,
              date: eventData.date,
              time: eventData.time,
              duration: eventData.duration,
              location: eventData.location,
              reminder: eventData.reminder,
              participants: eventData.participants || [],
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
          initialEvent={editingQuest.quest}
          friends={friends}
          missionMode={editingQuest.mission}
          missionParticipants={editingQuest.mission.participants || []}
        />
      );
    } else {
      // C'est une tâche de mission → utiliser CreateTaskModal
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
    }
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
          setMissions(missions.filter(m => m.id !== missionId));
          setSelectedMission(null);
          // Supprimer de Supabase
          if (supabaseUser) {
            await deleteMissionFromDB(missionId);
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
        onEditEvent={(event) => {
          if (event.isMissionQuest) {
            // Édition d'un événement de mission
            const mission = missions.find(m => m.id === event.missionId);
            const quest = mission?.quests.find(q => q.id === event.id);
            if (mission && quest) {
              setEditingQuest({ quest, mission });
            }
          } else {
            setEditingEvent(event);
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
            
            setUser({
              ...user,
              xp: newXp,
              level: newLevel,
              xpToNext: newXpToNext,
              potatoes: user.potatoes + pointsGained,
              tasksCompleted: newTasksCompleted,
            });
            
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
        calendarEvents={calendarSync?.calendarEvents || []}
      />
    );
  } else if (currentPage === 'friends') {
    pageContent = (
      <FriendsPage 
        user={user}
        friends={friends}
        missions={missions}
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
        setSelectedMission={setSelectedMission}
        setCreatingMission={setCreatingMission}
        getModeLabel={getModeLabel}
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
            setFriends([...friends, { ...request, missions: 0 }]);
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
        missions={missions}
        chests={chests}
        badges={badges}
        friends={friends}
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
        
        /* Mode sombre - texte (amélioration du contraste) */
        [data-dark="true"] .text-slate-900 { color: rgb(248 250 252) !important; }
        [data-dark="true"] .text-slate-800 { color: rgb(241 245 249) !important; }
        [data-dark="true"] .text-slate-700 { color: rgb(226 232 240) !important; }
        [data-dark="true"] .text-slate-600 { color: rgb(203 213 225) !important; }
        [data-dark="true"] .text-slate-500 { color: rgb(148 163 184) !important; }
        [data-dark="true"] .text-slate-400 { color: rgb(148 163 184) !important; }
        
        /* Mode sombre - bordures */
        [data-dark="true"] .border-slate-200 { border-color: rgb(51 65 85) !important; }
        [data-dark="true"] .border-slate-100 { border-color: rgb(51 65 85) !important; }
        [data-dark="true"] .border-slate-300 { border-color: rgb(71 85 105) !important; }
        
        /* Mode sombre - inputs et formulaires */
        [data-dark="true"] input, 
        [data-dark="true"] textarea,
        [data-dark="true"] select { 
          background-color: rgb(51 65 85) !important; 
          color: rgb(248 250 252) !important;
          border-color: rgb(71 85 105) !important;
        }
        [data-dark="true"] input::placeholder,
        [data-dark="true"] textarea::placeholder { 
          color: rgb(148 163 184) !important; 
        }
        
        /* Mode sombre - surbrillance/hover */
        [data-dark="true"] .hover\\:bg-slate-50:hover { background-color: rgb(51 65 85) !important; }
        [data-dark="true"] .hover\\:bg-slate-100:hover { background-color: rgb(71 85 105) !important; }
        
        /* Mode sombre - badges et chips colorés (garder la lisibilité) */
        [data-dark="true"] .bg-red-50 { background-color: rgb(127 29 29 / 0.3) !important; }
        [data-dark="true"] .bg-blue-50 { background-color: rgb(30 64 175 / 0.3) !important; }
        [data-dark="true"] .bg-green-50 { background-color: rgb(22 101 52 / 0.3) !important; }
        [data-dark="true"] .bg-amber-50 { background-color: rgb(146 64 14 / 0.3) !important; }
        [data-dark="true"] .bg-purple-50 { background-color: rgb(88 28 135 / 0.3) !important; }
        [data-dark="true"] .bg-indigo-50 { background-color: rgb(55 48 163 / 0.3) !important; }
        
        /* Mode sombre - cartes avec fond clair */
        [data-dark="true"] .bg-gradient-to-br.from-slate-50 { background: rgb(30 41 59) !important; }
        
        /* Emojis - affichage correct */
        .emoji-display {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
          font-style: normal;
        }
      `}</style>

      {/* Modal d'animation de badge débloqué */}
      {unlockedBadge && (
        <BadgeUnlockedModal 
          badge={unlockedBadge} 
          onClose={() => setUnlockedBadge(null)} 
        />
      )}
    </div>
  );
};

export default QuestApp;
