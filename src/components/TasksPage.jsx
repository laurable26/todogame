import React, { useState, useMemo } from 'react';

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

  // Récupérer les quêtes de mission assignées à l'utilisateur (uniquement celles explicitement assignées)
  const myMissionQuests = useMemo(() => {
    if (!missions || !user) return [];
    
    return missions.flatMap(mission => {
      // Ne pas afficher les quêtes des missions terminées
      const isCompleted = mission.quests?.length > 0 && mission.quests.every(q => q.completed);
      if (isCompleted) return [];
      
      return (mission.quests || [])
        .filter(q => !q.completed && q.assignedTo === user.pseudo) // Seulement si assignée à moi
        .map(q => ({
          ...q,
          missionId: mission.id,
          missionTitle: mission.title,
          isMissionQuest: true
        }));
    });
  }, [missions, user]);

  const weekDates = useMemo(() => {
    const start = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(today.getDate() + diff + (weekOffset * 7));
    
    return Array.from({ length: weekDaysCount }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      date.setHours(0, 0, 0, 0);
      return date;
    });
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
  
  // Tâches d'aujourd'hui (incluant les quêtes de mission)
  const todayTasks = useMemo(() => {
    const regularTasks = activeTasks.filter(t => {
      if (!t.date) return false;
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    });
    
    const missionQuestsToday = myMissionQuests.filter(q => {
      if (!q.date) return false;
      const questDate = new Date(q.date);
      questDate.setHours(0, 0, 0, 0);
      return questDate.getTime() === today.getTime();
    });
    
    return [...regularTasks, ...missionQuestsToday];
  }, [activeTasks, today, myMissionQuests]);

  // Tâches de la semaine (incluant les quêtes de mission)
  const weekTasks = useMemo(() => weekDates.map(date => {
    const tasksForDate = activeTasks.filter(t => {
      if (!t.date) return false;
      const taskDate = new Date(t.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === date.getTime();
    });
    
    const missionQuestsForDate = myMissionQuests.filter(q => {
      if (!q.date) return false;
      const questDate = new Date(q.date);
      questDate.setHours(0, 0, 0, 0);
      return questDate.getTime() === date.getTime();
    });
    
    return {
      date,
      tasks: [...tasksForDate, ...missionQuestsForDate]
    };
  }), [weekDates, activeTasks, myMissionQuests]);

  // Bucketlist = tâches sans date + quêtes de mission sans date
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
            <h3 className={`font-semibold ${compact ? 'text-xs leading-tight' : 'text-base'} cursor-pointer line-clamp-2 ${
              isCompleted 
                ? 'text-slate-400 line-through' 
                : 'text-slate-900 hover:text-indigo-600'
            }`}>
              {task.title}
            </h3>
            
            {/* Badge mission - obsolète, on l'enlève d'ici */}
            
            {!isCompleted && (
              <>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-lg border ${compact ? 'text-[10px]' : 'text-xs'} font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 ${compact ? 'text-[10px]' : 'text-xs'} font-medium text-slate-600`}>
                      {task.duration}
                    </span>
                    {(task.recurrence && task.recurrence !== 'none') && (
                      <span className="text-sm">🔄</span>
                    )}
                  </div>

                  {/* XP et Patates à droite */}
                  {!compact && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1">
                        ⚡ +{xpGained}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-1">
                        🥔 +{pointsGained}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && !compact && (
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    {task.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Mission liée - en bas à droite (pour les quêtes de mission) */}
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">Quêtes</h1>
        <button 
          onClick={onCreateTask}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 rounded-xl font-bold text-white hover:scale-105 transition-transform shadow-lg"
        >
          + Nouvelle Quête
        </button>
      </div>

      {/* Onglets avec Archive */}
      <div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setTasksView('today')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            tasksView === 'today'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => setTasksView('week')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            tasksView === 'week'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semaine
        </button>
        <button
          onClick={() => setTasksView('bucketlist')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            tasksView === 'bucketlist'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Bucketlist
        </button>
        <button
          onClick={() => setTasksView('archive')}
          className={`px-4 py-3 rounded-lg font-semibold transition-all ${
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

        {/* Bouton filtre de quêtes */}
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
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          {filterTasks(todayTasks).length > 0 ? (
            <TasksList tasks={sortTasks(filterTasks(todayTasks))} />
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune quête aujourd'hui</h3>
              <p className="text-slate-600">Ajouter de nouvelles quêtes pour commencer l'aventure !</p>
            </div>
          )}
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
            {weekTasks.map(({ date, tasks: dayTasks }, index) => {
              const todayTime = new Date();
              todayTime.setHours(0, 0, 0, 0);
              const isToday = date.getTime() === todayTime.getTime();
              const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
              
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
                        {dayTasks.length > 0 ? `${dayTasks.length} quête${dayTasks.length > 1 ? 's' : ''}` : 'Aucune quête'}
                      </div>
                    </div>
                  </div>
                  
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
                  {filterTasks(archivedTasks).length} quête{filterTasks(archivedTasks).length > 1 ? 's' : ''} terminée{filterTasks(archivedTasks).length > 1 ? 's' : ''}
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
              <h3 className="text-xl font-bold text-slate-900 mb-2">Aucune quête archivée</h3>
              <p className="text-slate-600">Les quêtes terminées apparaîtront ici !</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
