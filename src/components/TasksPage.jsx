import React, { useState, useMemo } from 'react';
import { PageHelp } from './PageHelp';

export const TasksPage = ({ 
  tasks, 
  events = [],
  calendarEvents = [],
  tasksView, 
  setTasksView, 
  onCompleteTask,
  onCompleteEvent, 
  onCreateTask,
  onCreateEvent, 
  onEditTask,
  onEditEvent, 
  onDeleteTask, 
  onClearCompleted, 
  getStatusColor, 
  getRecurrenceLabel,
  missions,
  user,
  onCompleteMissionQuest,
  ownedItems = [],
  activeUpgrades = {}
}) => {
  const [weekDaysCount, setWeekDaysCount] = useState(7);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sortMode, setSortMode] = useState('date'); // date, priority, duration, alpha
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, urgent, important, normal
  const [filterDuration, setFilterDuration] = useState('all'); // all, -1h, 1h-2h, 1/2 jour, 1 jour
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Améliorations disponibles (possédé ET actif)
  const hasAdvancedSort = ownedItems.includes(77) && activeUpgrades[77] !== false;
  const hasQuestFilter = ownedItems.includes(84) && activeUpgrades[84] !== false;
  
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

  // Événements d'aujourd'hui (incluant les événements de mission et calendrier)
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

    // Événements calendrier (Google, Outlook)
    const calendarEventsToday = calendarEvents.filter(e => {
      if (!e.startDate) return false;
      const eventDate = new Date(e.startDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    }).map(e => ({
      ...e,
      isCalendarEvent: true,
      date: e.startDate,
      time: new Date(e.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }));
    
    return [...regularEvents, ...missionEventsToday, ...calendarEventsToday];
  }, [events, today, missionEvents, calendarEvents]);

  // Tâches de la semaine (incluant les tâches de mission)
  const weekTasks = useMemo(() => weekDates.map(date => {
    const tasksForDate = activeTasks.filter(t => {
      if (!t.date) return false;
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

    // Événements calendrier (Google, Outlook)
    const calendarEventsForDate = calendarEvents.filter(e => {
      if (!e.startDate) return false;
      const eventDate = new Date(e.startDate);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === date.getTime();
    }).map(e => ({
      ...e,
      isCalendarEvent: true,
      date: e.startDate,
      time: new Date(e.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }));
    
    return {
      date,
      tasks: [...tasksForDate, ...missionQuestsForDate],
      events: [...regularEventsForDate, ...missionEventsForDate, ...calendarEventsForDate]
    };
  }), [weekDates, activeTasks, myMissionQuests, events, missionEvents, calendarEvents]);

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
              <h3 className={`font-semibold ${compact ? 'text-xs leading-tight' : 'text-base'} cursor-pointer line-clamp-2 ${
                isCompleted 
                  ? 'text-slate-400 line-through' 
                  : 'text-slate-900 hover:text-indigo-600'
              }`}>
                {task.title}
              </h3>
              
              {/* XP et Patates en haut à droite */}
              {!isCompleted && !compact && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                    ⚡+{xpGained}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                    🥔+{pointsGained}
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
    const isCompleted = event.completed;
    const participantCount = event.participants?.length || 0;
    const isCalendarEvent = event.isCalendarEvent;
    
    // Tous les événements en vert
    const bgColor = isCompleted 
      ? 'bg-slate-100 border-slate-200 opacity-60' 
      : 'bg-emerald-50 border-emerald-200 hover:shadow-md';

    const [showCalendarEventModal, setShowCalendarEventModal] = useState(false);
    
    return (
      <>
        <div className={`rounded-xl p-4 border shadow-sm transition-all group ${bgColor}`}>
          <div className="flex items-start gap-3">
            {/* Checkbox - pas pour les événements calendrier */}
            {isCalendarEvent ? (
              <div className="mt-1 w-6 h-6 rounded-lg bg-emerald-100 flex-shrink-0 flex items-center justify-center">
                <span className="text-emerald-600 text-xs">📅</span>
              </div>
            ) : !isCompleted ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompleteEvent(event.id);
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
            
            <div 
              className="flex-1 min-w-0 cursor-pointer" 
              onClick={() => isCalendarEvent ? setShowCalendarEventModal(true) : onEditEvent(event)}
            >
              {/* Titre */}
              <div>
                <h3 className={`font-semibold text-base ${
                  isCompleted 
                    ? 'text-slate-400 line-through' 
                    : 'text-slate-900 hover:text-emerald-600'
                }`}>
                  {event.title}
                </h3>
                {!isCompleted && (
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {event.time && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                        🕐 {event.time}
                      </span>
                    )}
                    {event.duration && !isCalendarEvent && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                        {event.duration}
                      </span>
                    )}
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
                    {isCalendarEvent && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-600 text-xs font-medium">
                        {event.provider === 'google' ? 'Google' : 'Outlook'}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Participants avec avatars complets */}
              {!isCompleted && participantCount > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-slate-500">Avec :</span>
                  <div className="flex -space-x-1">
                    {event.participants.slice(0, 5).map((p, i) => (
                      <div 
                        key={i} 
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-2 border-white shadow-sm"
                        title={p.pseudo}
                      >
                        <span className="text-sm">{p.avatar || '👤'}</span>
                      </div>
                    ))}
                  </div>
                  {participantCount > 5 && (
                    <span className="text-xs text-slate-500 ml-1">+{participantCount - 5}</span>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal lecture seule pour événements calendrier */}
      {showCalendarEventModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCalendarEventModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Événement {event.provider === 'google' ? 'Google' : 'Outlook'}</h2>
                  <p className="text-xs text-emerald-600">Synchronisé depuis votre calendrier</p>
                </div>
              </div>
              <button onClick={() => setShowCalendarEventModal(false)} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
              </div>
              
              <div className="space-y-3">
                {event.time && (
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">🕐</span>
                    <span className="text-slate-700">{event.time}</span>
                  </div>
                )}
                
                {event.date && (
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">📆</span>
                    <span className="text-slate-700">
                      {new Date(event.date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                
                {event.location && (
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">📍</span>
                    <span className="text-slate-700">{event.location}</span>
                  </div>
                )}
                
                {event.description && (
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400">📝</span>
                    <span className="text-slate-700">{event.description}</span>
                  </div>
                )}
                
                {participantCount > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400">👥</span>
                    <div className="flex flex-wrap gap-2">
                      {event.participants.map((p, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 rounded-lg text-sm text-slate-600">
                          {p.pseudo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500 text-center">
                Pour modifier cet événement, ouvrez {event.provider === 'google' ? 'Google Calendar' : 'Outlook'}
              </p>
            </div>
          </div>
        </div>
      )}
      </>
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
        <div className="flex gap-2">
          <button 
            onClick={onCreateEvent}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-bold text-white hover:scale-105 transition-transform shadow-lg text-sm sm:text-base"
          >
            + Événement
          </button>
          <button 
            onClick={onCreateTask}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-bold text-white hover:scale-105 transition-transform shadow-lg text-sm sm:text-base"
          >
            + Tâche
          </button>
        </div>
      </div>

      <PageHelp pageId="tasks" color="blue">
        <strong>📋 Organise ton quotidien !</strong> Crée des tâches avec une durée estimée pour gagner des XP et des patates. 
        Les <strong>événements</strong> sont des activités planifiées avec heure et lieu. 
        Plus la tâche est longue, plus elle rapporte ! Les tâches non terminées sont automatiquement reportées au lendemain.
      </PageHelp>

      {/* Onglets avec Archive */}
      <div className="flex gap-1 sm:gap-2 bg-white p-1 sm:p-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
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
        
        {/* Bouton tri avancé */}
        {hasAdvancedSort && (
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                sortMode !== 'date'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              title="Trier"
            >
              🔀
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20 min-w-[150px]">
                <button
                  onClick={() => { setSortMode('date'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 ${sortMode === 'date' ? 'text-indigo-600 font-semibold' : ''}`}
                >
                  Par date
                </button>
                <button
                  onClick={() => { setSortMode('priority'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 ${sortMode === 'priority' ? 'text-indigo-600 font-semibold' : ''}`}
                >
                  Par priorité
                </button>
                <button
                  onClick={() => { setSortMode('duration'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 ${sortMode === 'duration' ? 'text-indigo-600 font-semibold' : ''}`}
                >
                  Par durée
                </button>
                <button
                  onClick={() => { setSortMode('alpha'); setShowSortMenu(false); }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 ${sortMode === 'alpha' ? 'text-indigo-600 font-semibold' : ''}`}
                >
                  Alphabétique
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bouton filtre de tâches */}
        {hasQuestFilter && (
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                filterStatus !== 'all' || filterDuration !== 'all'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              title="Filtrer"
            >
              🔍
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-3 px-4 z-20 min-w-[200px]">
                <div className="mb-3">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Statut</div>
                  <div className="flex flex-wrap gap-1">
                    {['all', 'urgent', 'important', 'à faire'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
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
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
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
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 py-1"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        )}
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

          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setWeekDaysCount(5)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                weekDaysCount === 5
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              5 jours
            </button>
            <button
              onClick={() => setWeekDaysCount(7)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                weekDaysCount === 7
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 jours
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
