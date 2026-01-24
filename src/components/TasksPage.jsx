import React, { useState, useMemo } from 'react';
import { PageHelp } from './PageHelp';
import { SeasonalChallengeBanner } from './SeasonalChallengeBanner';

export const TasksPage = ({  
  tasks, 
  tasksView, 
  setTasksView, 
  onCompleteTask,
  onCreateTask,
  onEditTask,
  onDeleteTask, 
  onClearCompleted, 
  getStatusColor, 
  getRecurrenceLabel,
  missions,
  user,
  onCompleteMissionQuest,
  ownedItems = [],
  activeUpgrades = {},
  // Props pour le défi saisonnier
  seasonalChallenges,
  onClaimSeasonalReward,
  // Props pour les invitations de partage
  pendingInvitation,
  onAcceptInvitation,
  onDeclineInvitation
}) => {
  const [weekDaysCount, setWeekDaysCount] = useState(7);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0); // Pour naviguer entre les mois
  const [selectedDay, setSelectedDay] = useState(null); // Pour le modal de jour
  const [sortMode, setSortMode] = useState('date'); // date, priority, duration, alpha
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, urgent, important, normal
  const [filterDuration, setFilterDuration] = useState('all'); // all, -1h, 1h-2h, 1/2 jour, 1 jour
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Couleurs par défaut pour les tags (10 couleurs)
  const DEFAULT_TAG_COLORS = [
    { name: 'Bleu', hex: '#3B82F6' },
    { name: 'Vert', hex: '#10B981' },
    { name: 'Rouge', hex: '#EF4444' },
    { name: 'Violet', hex: '#8B5CF6' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Rose', hex: '#EC4899' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Jaune', hex: '#EAB308' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Emerald', hex: '#059669' },
  ];
  
  // Fonction pour obtenir la couleur d'un tag
  const getTagColor = (tags) => {
    if (!tags || tags.length === 0) return '#3B82F6'; // Bleu par défaut
    
    const firstTag = tags[0];
    const tagColors = user?.tag_colors || {};
    
    // Si l'upgrade est possédé et qu'il y a une couleur custom
    const hasTagColorsUpgrade = ownedItems.includes(97) && activeUpgrades[97] !== false;
    if (hasTagColorsUpgrade && tagColors[firstTag]) {
      return tagColors[firstTag];
    }
    
    // Sinon utiliser une couleur par défaut basée sur le hash du tag
    const index = firstTag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % DEFAULT_TAG_COLORS.length;
    return DEFAULT_TAG_COLORS[index].hex;
  };
  
  // Convertir hex en classes Tailwind pour bg et border
  const getColorClasses = (hexColor) => {
    // Mapping des couleurs hex vers les classes Tailwind
    const colorMap = {
      '#3B82F6': { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800' },
      '#10B981': { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-800' },
      '#EF4444': { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800' },
      '#8B5CF6': { bg: 'bg-violet-100', border: 'border-violet-500', text: 'text-violet-800' },
      '#F97316': { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-800' },
      '#EC4899': { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-800' },
      '#06B6D4': { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-800' },
      '#EAB308': { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800' },
      '#6366F1': { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-800' },
      '#059669': { bg: 'bg-emerald-100', border: 'border-emerald-600', text: 'text-emerald-800' },
    };
    
    return colorMap[hexColor] || colorMap['#3B82F6']; // Bleu par défaut
  };

  
  // Améliorations disponibles (possédé ET actif)
  const hasAdvancedSort = ownedItems.includes(77) && activeUpgrades[77] !== false;
  const hasQuestFilter = ownedItems.includes(84) && activeUpgrades[84] !== false;
  
  // Dériver les events depuis tasks (tâches avec heure)
  const events = useMemo(() => tasks.filter(t => t.time && t.time !== ''), [tasks]);
  
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

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

  // Fonction de filtrage
  const filterTasks = (tasksList) => {
    return tasksList.filter(task => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterDuration !== 'all' && task.duration !== filterDuration) return false;
      return true;
    });
  };

  const getDurationPoints = (duration, status = 'à faire') => {
    return Math.round(getDurationBase(duration) * getStatusMultiplier(status));
  };

  // Fonction de tri
  const sortTasks = (taskList) => {
    if (!hasAdvancedSort) return taskList;
    
    return [...taskList].sort((a, b) => {
      switch (sortMode) {
        case 'priority':
          const priorityOrder = { 'urgent': 0, 'important': 1, 'à faire': 2 };
          return (priorityOrder[a.status] || 2) - (priorityOrder[b.status] || 2);
        case 'duration':
          const durationOrder = { '-1h': 0, '1h-2h': 1, '1/2 jour': 2, '1 jour': 3 };
          return (durationOrder[a.duration] || 0) - (durationOrder[b.duration] || 0);
        case 'alpha':
          return (a.title || '').localeCompare(b.title || '');
        case 'date':
        default:
          return 0; // Garder l'ordre existant
      }
    });
  };

  // Récupérer les tâches/événements de mission assignées à l'utilisateur
  const myMissionQuests = useMemo(() => {
    if (!missions || !user) return [];
    
    return missions.flatMap(mission => {
      // Ne pas afficher les tâches des missions terminées
      const isCompleted = mission.quests?.length > 0 && mission.quests.every(q => q.completed);
      if (isCompleted) return [];
      
      // Vérifier si l'utilisateur est participant de cette mission
      const isUserMissionParticipant = mission.participants?.some(p => p.pseudo === user.pseudo);
      
      return (mission.quests || [])
        .filter(q => {
          if (q.completed) return false;
          
          // Pour les événements
          if (q.isEvent) {
            // Si l'événement a des participants spécifiques, vérifier si l'utilisateur en fait partie
            if (q.participants && q.participants.length > 0) {
              return q.participants.some(p => p.pseudo === user.pseudo);
            }
            // Sinon, si pas de participants spécifiques, tous les participants de la mission voient l'événement
            return isUserMissionParticipant;
          }
          
          // Pour les tâches, vérifier si assignée à l'utilisateur
          return q.assignedTo === user.pseudo;
        })
        .map(q => ({
          ...q,
          missionId: mission.id,
          missionTitle: mission.title,
          isMissionQuest: true
        }));
    });
  }, [missions, user]);

  // Calcul des jours de la semaine : aujourd'hui + X jours suivants
  const weekDates = useMemo(() => {
    const dates = [];
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() + (weekOffset * weekDaysCount));
    
    let daysAdded = 0;
    while (daysAdded < weekDaysCount) {
      const dayOfWeek = currentDate.getDay();
      
      // Si mode 5 jours, on saute les week-ends
      if (weekDaysCount === 5 && (dayOfWeek === 0 || dayOfWeek === 6)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      const dateToAdd = new Date(currentDate);
      dateToAdd.setHours(0, 0, 0, 0);
      dates.push(dateToAdd);
      daysAdded++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }, [today, weekDaysCount, weekOffset]);

  const weekRangeLabel = useMemo(() => {
    if (weekDates.length === 0) return '';
    const firstDay = weekDates[0];
    const lastDay = weekDates[weekDates.length - 1];
    const monthNames = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
    return `${firstDay.getDate()} ${monthNames[firstDay.getMonth()]} - ${lastDay.getDate()} ${monthNames[lastDay.getMonth()]}`;
  }, [weekDates]);

  // Séparer les tâches actives et archivées (terminées)
  const activeTasks = tasks.filter(t => !t.completed);
  const archivedTasks = tasks.filter(t => t.completed);
  
  // Tâches d'aujourd'hui (incluant les tâches de mission)
  const todayTasks = useMemo(() => {
    const regularTasks = activeTasks.filter(t => {
      if (!t.date) return false;
      // Exclure les tâches avec heure (elles sont affichées comme événements)
      if (t.time && t.time !== '') return false;
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    const missionQuestsToday = myMissionQuests.filter(q => {
      if (q.isEvent) return false; // Les événements sont gérés séparément
      if (!q.date) return false;
      const questDate = new Date(q.date);
      questDate.setHours(0, 0, 0, 0);
      return questDate.getTime() === today.getTime();
    });
    
    return [...regularTasks, ...missionQuestsToday];
  }, [activeTasks, today, myMissionQuests]);

  // Événements de mission
  const missionEvents = useMemo(() => {
    return myMissionQuests.filter(q => q.isEvent && !q.completed);
  }, [myMissionQuests]);

  // Événements d'aujourd'hui (incluant les événements de mission)
  const todayEvents = useMemo(() => {
    const regularEvents = events.filter(e => {
      if (e.completed) return false;
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
    
    const missionEventsToday = missionEvents.filter(e => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
    
    return [...regularEvents, ...missionEventsToday];
  }, [events, today, missionEvents]);

  // Tâches de la semaine (incluant les tâches de mission)
  const weekTasks = useMemo(() => weekDates.map(date => {
    const tasksForDate = activeTasks.filter(t => {
      if (!t.date) return false;
      // Exclure les tâches avec heure (elles sont affichées comme événements)
      if (t.time && t.time !== '') return false;
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    });
    
    const missionQuestsForDate = myMissionQuests.filter(q => {
      if (q.isEvent) return false; // Les événements sont gérés séparément
      if (!q.date) return false;
      const questDate = new Date(q.date);
      questDate.setHours(0, 0, 0, 0);
      return questDate.getTime() === date.getTime();
    });
    
    // Événements pour cette date (incluant les événements de mission)
    const regularEventsForDate = events.filter(e => {
      if (e.completed) return false;
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === date.getTime();
    });
    
    const missionEventsForDate = missionEvents.filter(e => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === date.getTime();
    });
    
    return {
      date,
      tasks: [...tasksForDate, ...missionQuestsForDate],
      events: [...regularEventsForDate, ...missionEventsForDate]
    };
  }), [weekDates, activeTasks, myMissionQuests, events, missionEvents]);

  // Bucketlist = tâches sans date + tâches de mission sans date
  const bucketlistTasks = [
    ...activeTasks.filter(t => !t.date), 
    ...myMissionQuests.filter(q => !q.date)
  ];

  const TaskCard = ({ task, compact = false }) => {
    const xpGained = getDurationXP(task.duration, task.status);
    const pointsGained = getDurationPoints(task.duration, task.status);
    const isCompleted = task.completed;
    const recurrenceLabel = getRecurrenceLabel ? getRecurrenceLabel(task) : null;
    const isShared = task.participants && task.participants.length > 0;
    const sharingBonus = isShared ? 2 : 1;
    
    const handleComplete = () => {
      if (task.isMissionQuest) {
        onCompleteMissionQuest && onCompleteMissionQuest(task.missionId, task.id);
      } else {
        onCompleteTask(task.id);
      }
    };
    
    return (
      <div className={`rounded-xl ${compact ? 'p-2' : 'p-4'} border shadow-sm transition-all group ${
        isCompleted 
          ? 'bg-slate-100 border-slate-200 opacity-60' 
          : task.isMissionQuest 
            ? 'bg-purple-50 border-purple-200 hover:shadow-md'
            : 'bg-white border-slate-200 hover:shadow-md'
      }`}>
        <div className="flex items-start gap-2">
          {!isCompleted ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleComplete();
              }}
              className={`${compact ? 'mt-0.5 w-4 h-4' : 'mt-1 w-6 h-6'} rounded-lg border-2 border-slate-300 hover:border-green-500 hover:bg-green-50 transition-all flex-shrink-0 flex items-center justify-center`}
            >
              <span className="opacity-0 group-hover:opacity-100 text-green-600 text-xs">✓</span>
            </button>
          ) : (
            <div className={`${compact ? 'mt-0.5 w-4 h-4' : 'mt-1 w-6 h-6'} rounded-lg bg-green-500 flex-shrink-0 flex items-center justify-center`}>
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0" onClick={() => onEditTask(task)}>
            {/* Titre + XP/Patates en haut */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className={`font-semibold ${compact ? 'text-xs leading-tight' : 'text-base'} cursor-pointer line-clamp-2 ${
                  isCompleted 
                    ? 'text-slate-400 line-through' 
                    : 'text-slate-900 hover:text-indigo-600'
                }`}>
                  {task.title}
                </h3>
                {/* Avatars des participants avec statut */}
                {isShared && (
                  <div className="flex -space-x-1 flex-shrink-0">
                    {task.participants.slice(0, compact ? 2 : 3).map((p, i) => {
                      const isAccepted = p.accepted !== false; // true par défaut si pas défini
                      return (
                        <div 
                          key={i} 
                          className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-all relative ${
                            isAccepted 
                              ? 'bg-gradient-to-br from-indigo-400 to-purple-500' 
                              : 'bg-slate-300 grayscale opacity-60'
                          }`}
                          title={`${p.pseudo}${isAccepted ? '' : ' (en attente)'}`}
                        >
                          <span className={`${compact ? 'text-[10px]' : 'text-xs'} ${isAccepted ? '' : 'opacity-50'}`}>{p.avatar}</span>
                          {!isAccepted && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" title="En attente"></span>
                          )}
                        </div>
                      );
                    })}
                    {task.participants.length > (compact ? 2 : 3) && (
                      <div className={`${compact ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'} rounded-full bg-slate-300 flex items-center justify-center border-2 border-white text-slate-600`}>
                        +{task.participants.length - (compact ? 2 : 3)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* XP et Patates en haut à droite */}
              {!isCompleted && !compact && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                    ⚡+{xpGained * sharingBonus}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                    🥔+{pointsGained * sharingBonus}
                  </span>
                </div>
              )}
            </div>
            
            {!isCompleted && (
              <>
                {/* Infos : importance, durée, récurrence, tags */}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className={`px-2 py-1 rounded-lg border ${compact ? 'text-[10px]' : 'text-xs'} font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 ${compact ? 'text-[10px]' : 'text-xs'} font-medium text-slate-600`}>
                    {task.duration}
                  </span>
                  {(task.recurrence && task.recurrence !== 'none') && (
                    <span className="text-sm">🔄</span>
                  )}
                  {/* Tags à la suite */}
                  {task.tags && task.tags.length > 0 && !compact && task.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Mission liée - en bas à droite (pour les tâches de mission) */}
                {task.isMissionQuest && !compact && (
                  <div className="flex justify-end mt-2">
                    <span className="px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium">
                      {task.missionTitle}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Carte événement
  const EventCard = ({ event }) => {
    const currentUserPseudo = user?.pseudo;
    const participantCount = event.participants?.length || 0;
    const isShared = participantCount > 0;
    const sharingBonus = isShared ? 2 : 1;
    // Vérifier si l'utilisateur courant a complété cet événement
    const userHasCompleted = event.completedBy?.includes(currentUserPseudo) || event.completed;
    
    return (
      <div className={`rounded-xl p-4 border shadow-sm transition-all group ${
        userHasCompleted 
          ? 'bg-slate-100 border-slate-200 opacity-60' 
          : 'bg-emerald-50 border-emerald-200 hover:shadow-md'
      }`}>
        <div className="flex items-start gap-3">
          {!userHasCompleted ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompleteTask(event.id);
              }}
              className="mt-1 w-6 h-6 rounded-lg border-2 border-emerald-400 hover:border-emerald-600 hover:bg-emerald-100 transition-all flex-shrink-0 flex items-center justify-center"
            >
              <span className="opacity-0 group-hover:opacity-100 text-emerald-600 text-xs">✓</span>
            </button>
          ) : (
            <div className="mt-1 w-6 h-6 rounded-lg bg-emerald-500 flex-shrink-0 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0" onClick={() => onEditTask(event)}>
            {/* Titre + Avatars + Récompenses */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className={`font-semibold text-base cursor-pointer ${
                  userHasCompleted 
                    ? 'text-slate-400 line-through' 
                    : 'text-slate-900 hover:text-emerald-600'
                }`}>
                  📅 {event.title}
                </h3>
                {/* Avatars des participants */}
                {isShared && (
                  <div className="flex -space-x-1 flex-shrink-0">
                    {event.participants.slice(0, 3).map((p, i) => (
                      <div 
                        key={i} 
                        className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-2 border-white shadow-sm"
                        title={p.pseudo}
                      >
                        <span className="text-xs">{p.avatar}</span>
                      </div>
                    ))}
                    {participantCount > 3 && (
                      <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center border-2 border-white text-xs text-slate-600">
                        +{participantCount - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* XP et Patates */}
              {!userHasCompleted && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                    ⚡+{5 * sharingBonus}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                    🥔+{5 * sharingBonus}
                  </span>
                </div>
              )}
            </div>
            
            {!userHasCompleted && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                  {event.time}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                  {event.duration}
                </span>
                {event.location && (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                    📍 {event.location}
                  </span>
                )}
                {event.reminder && event.reminder !== 'none' && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-xs font-medium">
                    🔔 {event.reminder}
                  </span>
                )}
                {/* Tags */}
                {event.tags && event.tags.length > 0 && event.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TasksList = ({ tasks }) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="space-y-2">
        {tasks.map(task => <TaskCard key={task.id} task={task} />)}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Tâches</h1>
        <button 
          onClick={onCreateTask}
          className="create-task-button w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full font-bold text-white hover:scale-110 transition-transform shadow-lg flex items-center justify-center text-3xl sm:text-4xl"
        >
          +
        </button>
      </div>

      <PageHelp pageId="tasks" color="blue">
        <strong>📋 Organise ton quotidien !</strong> Crée des tâches avec une durée estimée pour gagner des XP et des patates. 
        Ajoute une heure dans "Plus d'options" pour créer un événement avec lieu et rappel. 
        Plus la tâche est longue, plus elle rapporte ! Les tâches non terminées sont automatiquement reportées au lendemain.
      </PageHelp>

      {/* Bandeau invitation de partage */}
      {pendingInvitation && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">
              {pendingInvitation.ownerAvatar}
            </div>
            <p className="text-white text-sm">
              <span className="font-bold">{pendingInvitation.ownerPseudo}</span> t'invite à participer :
            </p>
          </div>
          
          {/* Carte tâche style normal */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {/* Titre + XP/Patates */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base text-slate-900">
                    {pendingInvitation.taskTitle}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                      ⚡x2
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                      🥔x2
                    </span>
                  </div>
                </div>
                
                {/* Infos : date, heure, durée */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {pendingInvitation.taskDate && (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                      📅 {new Date(pendingInvitation.taskDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  )}
                  {pendingInvitation.taskTime && (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                      🕐 {pendingInvitation.taskTime}
                    </span>
                  )}
                  {pendingInvitation.taskDuration && (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                      {pendingInvitation.taskDuration}
                    </span>
                  )}
                  {pendingInvitation.taskStatus && (
                    <span className={`px-2 py-1 rounded-lg border text-xs font-medium ${getStatusColor(pendingInvitation.taskStatus)}`}>
                      {pendingInvitation.taskStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Boutons */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => onDeclineInvitation(pendingInvitation.taskId)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-all text-sm border border-slate-200"
              >
                Refuser
              </button>
              <button
                onClick={() => onAcceptInvitation(pendingInvitation.taskId)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold transition-all text-sm shadow-md hover:opacity-90"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bannière défi saisonnier */}
      {seasonalChallenges && seasonalChallenges.currentChallenge && (
        <SeasonalChallengeBanner
          challenge={seasonalChallenges.currentChallenge}
          challengeData={seasonalChallenges.challengeData}
          challengeStatus={seasonalChallenges.challengeStatus}
          onAccept={seasonalChallenges.acceptChallenge}
          onIgnore={seasonalChallenges.ignoreChallenge}
          onCompleteTask={seasonalChallenges.completeTask}
          onClaimAvatar={onClaimSeasonalReward}
        />
      )}

      {/* Onglets avec Archive */}
      <div className="flex items-center gap-2">
        <div className="view-selector flex gap-1 sm:gap-2 bg-white p-1 sm:p-2 rounded-xl border border-slate-200 shadow-sm flex-1">
          <button
            onClick={() => setTasksView('today')}
            className={`flex-1 min-w-fit py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              tasksView === 'today'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setTasksView('week')}
            className={`flex-1 min-w-fit py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              tasksView === 'week'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setTasksView('month')}
            className={`flex-1 min-w-fit py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              tasksView === 'month'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setTasksView('bucketlist')}
            className={`flex-1 min-w-fit py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              tasksView === 'bucketlist'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Bucketlist
          </button>
          <button
            onClick={() => setTasksView('archive')}
            className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all ${
              tasksView === 'archive'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            title="Archives"
          >
            📦
          </button>
        </div>
        
        {/* Boutons tri et filtre - séparés des onglets */}
        <div className="flex gap-1">
          {/* Bouton tri avancé */}
          {hasAdvancedSort && (
            <div className="relative">
              <button
                onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl border shadow-sm transition-all ${
                  sortMode !== 'date'
                    ? 'bg-blue-100 border-blue-300 text-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Trier"
              >
                🔀
              </button>
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 min-w-[150px]">
                  <button
                    onClick={() => { setSortMode('date'); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm ${sortMode === 'date' ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700'}`}
                  >
                    📅 Par date
                  </button>
                  <button
                    onClick={() => { setSortMode('priority'); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm ${sortMode === 'priority' ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700'}`}
                  >
                    🎯 Par priorité
                  </button>
                  <button
                    onClick={() => { setSortMode('duration'); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm ${sortMode === 'duration' ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700'}`}
                  >
                    ⏱️ Par durée
                  </button>
                  <button
                    onClick={() => { setSortMode('alpha'); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm ${sortMode === 'alpha' ? 'text-blue-600 font-semibold bg-blue-50' : 'text-slate-700'}`}
                  >
                    🔤 Alphabétique
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bouton filtre de tâches */}
          {hasQuestFilter && (
            <div className="relative">
              <button
                onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl border shadow-sm transition-all ${
                  filterStatus !== 'all' || filterDuration !== 'all'
                    ? 'bg-purple-100 border-purple-300 text-purple-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Filtrer"
              >
                🔍
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-3 px-4 z-50 min-w-[220px]">
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Statut</div>
                    <div className="flex flex-wrap gap-1">
                      {['all', 'urgent', 'à faire', 'délégué'].map(status => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            filterStatus === status
                              ? 'bg-purple-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {status === 'all' ? 'Tous' : status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Durée</div>
                    <div className="flex flex-wrap gap-1">
                      {['all', '-1h', '1h-2h', '1/2 jour', '1 jour'].map(duration => (
                        <button
                          key={duration}
                          onClick={() => setFilterDuration(duration)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            filterDuration === duration
                              ? 'bg-purple-500 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {duration === 'all' ? 'Toutes' : duration}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => { setFilterStatus('all'); setFilterDuration('all'); setShowFilterMenu(false); }}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-2 border-t border-slate-100 mt-2"
                  >
                    ✕ Réinitialiser
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VUE AUJOURD'HUI */}
      {tasksView === 'today' && (
        <div className="space-y-4">
          {/* Événements du jour - affichés directement sans titre */}
          {todayEvents.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
              {todayEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          )}
          
          {/* Tâches du jour */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            {filterTasks(todayTasks).length > 0 ? (
              <TasksList tasks={sortTasks(filterTasks(todayTasks))} />
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune tâche aujourd'hui</h3>
                <p className="text-slate-600">Ajouter de nouvelles tâches pour commencer l'aventure !</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VUE SEMAINE */}
      {tasksView === 'week' && (
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              ←
            </button>
            <div className="flex flex-col items-center">
              <span className="font-bold text-slate-900 text-sm sm:text-base">{weekRangeLabel}</span>
              {weekOffset !== 0 && (
                <button 
                  onClick={() => setWeekOffset(0)}
                  className="text-xs text-indigo-600 hover:underline mt-1"
                >
                  Revenir à aujourd'hui
                </button>
              )}
            </div>
            <button
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            >
              →
            </button>
          </div>

          
          <div className="space-y-3">
            {weekTasks.map(({ date, tasks: dayTasks, events: dayEvents }, index) => {
              const todayTime = new Date();
              todayTime.setHours(0, 0, 0, 0);
              const isToday = date.getTime() === todayTime.getTime();
              const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
              const totalItems = dayTasks.length + (dayEvents?.length || 0);
              
              return (
                <div key={index} className={`bg-slate-50 rounded-xl p-4 border-2 ${isToday ? 'border-indigo-500 shadow-md' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${isToday ? 'bg-indigo-500 text-white' : 'bg-white text-slate-700'}`}>
                      <div className="text-xs font-medium">{dayNames[date.getDay()].slice(0, 3)}</div>
                      <div className="text-lg font-black">{date.getDate()}</div>
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                        {dayNames[date.getDay()]}
                        {isToday && <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Aujourd'hui</span>}
                      </div>
                      <div className="text-sm text-slate-500">
                        {totalItems > 0 ? (
                          <>
                            {dayTasks.length > 0 && `${dayTasks.length} tâche${dayTasks.length > 1 ? 's' : ''}`}
                            {dayTasks.length > 0 && dayEvents?.length > 0 && ' · '}
                            {dayEvents?.length > 0 && `${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''}`}
                          </>
                        ) : 'Rien de prévu'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Événements du jour */}
                  {dayEvents?.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {dayEvents.map(event => <EventCard key={event.id} event={event} />)}
                    </div>
                  )}
                  
                  {/* Tâches du jour */}
                  {dayTasks.length > 0 && (
                    <div className="space-y-2">
                      {dayTasks.map(task => <TaskCard key={task.id} task={task} compact />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VUE MOIS */}
      {tasksView === 'month' && (() => {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + monthOffset);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Nom du mois
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const monthLabel = `${monthNames[month]} ${year}`;
        
        // Premier et dernier jour du mois
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Jour de la semaine du 1er (0=Dimanche, 1=Lundi, ..., 6=Samedi)
        // On ajuste pour que Lundi=0
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6; // Dimanche devient 6
        
        // Nombre de jours dans le mois
        const daysInMonth = lastDay.getDate();
        
        // Créer le tableau des jours (avec jours vides au début)
        const calendarDays = [];
        
        // Ajouter les jours vides du mois précédent
        for (let i = 0; i < startDayOfWeek; i++) {
          calendarDays.push(null);
        }
        
        // Ajouter tous les jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
          calendarDays.push(day);
        }
        
        // Obtenir les tâches pour chaque jour
        const getTasksForDay = (day) => {
          if (!day) return [];
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasks.filter(t => {
            if (!t.date) return false;
            
            // Convertir la date en string format YYYY-MM-DD
            let taskDateStr;
            if (t.date instanceof Date) {
              // Si c'est un objet Date, le convertir
              taskDateStr = t.date.toISOString().split('T')[0];
            } else if (typeof t.date === 'string') {
              // Si c'est déjà une string, extraire juste la date
              taskDateStr = t.date.split('T')[0];
            } else {
              return false;
            }
            
            // Comparer les dates ET vérifier que la tâche n'est pas complétée
            return taskDateStr === dateStr && !t.completed;
          });
          
          return dayTasks;
        };
        
        // Vérifier si c'est aujourd'hui
        const isToday = (day) => {
          if (!day) return false;
          const todayDate = new Date();
          return day === todayDate.getDate() && 
                 month === todayDate.getMonth() && 
                 year === todayDate.getFullYear();
        };
        
        return (
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
            {/* Navigation mois */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMonthOffset(prev => prev - 1)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                ←
              </button>
              <div className="flex flex-col items-center">
                <span className="font-bold text-slate-900 text-sm sm:text-base">{monthLabel}</span>
                {monthOffset !== 0 && (
                  <button 
                    onClick={() => setMonthOffset(0)}
                    className="text-xs text-indigo-600 hover:underline mt-1"
                  >
                    Revenir à aujourd'hui
                  </button>
                )}
              </div>
              <button
                onClick={() => setMonthOffset(prev => prev + 1)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                →
              </button>
            </div>
            
            {/* Grille calendrier */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* En-têtes des jours */}
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <div key={day} className="text-center text-xs sm:text-sm font-bold text-slate-600 py-2">
                  {day}
                </div>
              ))}
              
              {/* Cases du calendrier */}
              {calendarDays.map((day, index) => {
                const dayTasks = day ? getTasksForDay(day) : [];
                const isCurrentDay = isToday(day);
                
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (day) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        setSelectedDay({ date: dateStr, day, tasks: dayTasks });
                      }
                    }}
                    className={`
                      min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg border transition-all
                      ${day ? 'cursor-pointer hover:bg-slate-50 hover:border-indigo-300' : 'bg-slate-50/50'}
                      ${isCurrentDay ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200'}
                    `}
                  >
                    {day && (
                      <>
                        <div className={`text-xs sm:text-sm font-semibold mb-1 ${isCurrentDay ? 'text-indigo-600' : 'text-slate-700'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayTasks.slice(0, 3).map(task => {
                            const tagColor = getTagColor(task.tags);
                            const colorClasses = getColorClasses(tagColor);
                            
                            return (
                              <div
                                key={task.id}
                                className={`text-[10px] sm:text-xs px-1.5 py-1 rounded font-medium truncate border-l-2 ${colorClasses.bg} ${colorClasses.border} ${colorClasses.text}`}
                                title={task.title}
                              >
                                {task.time && <span className="font-bold">{task.time} </span>}
                                {task.title}
                              </div>
                            );
                          })}
                          {dayTasks.length > 3 && (
                            <div className="text-[10px] text-slate-600 font-medium px-1">
                              +{dayTasks.length - 3} autre{dayTasks.length - 3 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      
      {/* Modal jour sélectionné */}
      {selectedDay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">
                  {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </h2>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-white/90">
                {selectedDay.tasks.length} tâche{selectedDay.tasks.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {selectedDay.tasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedDay.tasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border-2 ${getStatusColor(task.status)} cursor-pointer hover:shadow-md transition-all`}
                      onClick={() => {
                        setSelectedDay(null);
                        onEditTask(task);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {task.time && (
                              <span className="text-xs font-bold text-slate-700 bg-white/50 px-2 py-0.5 rounded">
                                {task.time}
                              </span>
                            )}
                            <span className="text-xs text-slate-600">
                              {task.duration || '-1h'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteTask(task.id);
                            setSelectedDay(prev => ({
                              ...prev,
                              tasks: prev.tasks.filter(t => t.id !== task.id)
                            }));
                          }}
                          className="ml-2 text-2xl text-slate-400 hover:text-green-500 transition-colors"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">Aucune tâche ce jour</p>
                  <button
                    onClick={() => {
                      setSelectedDay(null);
                      // Convertir la string date en objet Date
                      const dateObj = new Date(selectedDay.date + 'T12:00:00');
                      onCreateTask({ date: dateObj });
                    }}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all"
                  >
                    + Créer une tâche
                  </button>
                </div>
              )}
            </div>
            
            {selectedDay.tasks.length > 0 && (
              <div className="p-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setSelectedDay(null);
                    // Convertir la string date en objet Date
                    const dateObj = new Date(selectedDay.date + 'T12:00:00');
                    onCreateTask({ date: dateObj });
                  }}
                  className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all font-semibold"
                >
                  + Ajouter une tâche
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VUE BUCKETLIST */}
      {tasksView === 'bucketlist' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          {filterTasks(bucketlistTasks).length > 0 ? (
            <TasksList tasks={sortTasks(filterTasks(bucketlistTasks))} />
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bucketlist vide</h3>
              <p className="text-slate-600">Ajouter des tâches sans date pour les gérer plus tard !</p>
            </div>
          )}
        </div>
      )}

      {/* VUE ARCHIVE */}
      {tasksView === 'archive' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          {filterTasks(archivedTasks).length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-700">
                  {filterTasks(archivedTasks).length} tâche{filterTasks(archivedTasks).length > 1 ? 's' : ''} terminée{filterTasks(archivedTasks).length > 1 ? 's' : ''}
                </h2>
                {onClearCompleted && (
                  <button
                    onClick={onClearCompleted}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Vider les archives
                  </button>
                )}
              </div>
              <TasksList tasks={sortTasks(filterTasks(archivedTasks))} />
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune tâche archivée</h3>
              <p className="text-slate-600">Les tâches terminées apparaîtront ici !</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
