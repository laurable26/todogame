import React, { useMemo, useState, useEffect } from 'react';

export const StatsPage = ({ user, tasks, events = [], chests, badges, friends, journaling, hasJournaling }) => {
  const [period, setPeriod] = useState('all'); // 'today', 'month', 'all'
  const [journalingStats, setJournalingStats] = useState(null);

  // Charger les stats de journaling
  useEffect(() => {
    if (hasJournaling && journaling?.getStats) {
      journaling.getStats().then(stats => {
        setJournalingStats(stats);
      });
    }
  }, [hasJournaling, journaling]);

  // Filtrer par période
  const filterByPeriod = (items, dateField = 'date') => {
    if (period === 'all') return items;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return items.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      if (period === 'today') {
        return itemDate >= today;
      } else if (period === 'month') {
        return itemDate >= monthStart;
      }
      return true;
    });
  };

  // Calculer les statistiques
  const stats = useMemo(() => {
    const filteredTasks = filterByPeriod(tasks);
    const filteredEvents = filterByPeriod(events);
    
    const completedTasks = filteredTasks.filter(t => t.completed);
    const activeTasks = filteredTasks.filter(t => !t.completed);
    const completedEvents = filteredEvents.filter(e => e.completed);
    
    // Tâches/événements partagés
    const sharedTasks = completedTasks.filter(t => t.participants?.length > 0);
    const sharedEvents = completedEvents.filter(e => e.participants?.length > 0);
    
    // Stats par durée (avec les vraies valeurs utilisées)
    const tasksByDuration = {
      '-1h': completedTasks.filter(t => t.duration === '-1h').length,
      '1h-2h': completedTasks.filter(t => t.duration === '1h-2h').length,
      '1/2 jour': completedTasks.filter(t => t.duration === '1/2 jour').length,
      '1 jour': completedTasks.filter(t => t.duration === '1 jour').length,
    };
    
    // Stats par statut
    const tasksByStatus = {
      'urgent': completedTasks.filter(t => t.status === 'urgent').length,
      'important': completedTasks.filter(t => t.status === 'important').length,
      'normal': completedTasks.filter(t => t.status === 'à faire' || t.status === 'normal' || t.status === 'délégué').length,
    };

    // Temps en minutes par durée
    const durationToMinutes = {
      '-1h': 45,
      '1h-2h': 90,
      '1/2 jour': 240,
      '1 jour': 480,
    };

    // Stats par tags - nombre de tâches et temps estimé
    const tagStats = {};
    completedTasks.forEach(task => {
      const taskTags = task.tags || [];
      const taskMinutes = durationToMinutes[task.duration] || 60;
      
      taskTags.forEach(tag => {
        if (tag && tag.trim()) {
          const normalizedTag = tag.trim();
          if (!tagStats[normalizedTag]) {
            tagStats[normalizedTag] = { count: 0, minutes: 0 };
          }
          tagStats[normalizedTag].count += 1;
          tagStats[normalizedTag].minutes += taskMinutes;
        }
      });
    });

    // Trier les tags par nombre de tâches (décroissant)
    const sortedTagStats = Object.entries(tagStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10); // Top 10 tags
    
    // Stats coffres
    const totalChests = chests.bronze + chests.silver + chests.gold + chests.legendary;
    
    // Stats badges (toujours depuis le début)
    const earnedBadges = badges.reduce((acc, badge) => {
      if (badge.gold) return acc + 3;
      if (badge.silver) return acc + 2;
      if (badge.bronze) return acc + 1;
      return acc;
    }, 0);
    const totalBadges = badges.length * 3;
    
    // Temps total estimé (en heures)
    const totalMinutes = completedTasks.reduce((acc, t) => 
      acc + (durationToMinutes[t.duration] || 60), 0
    );
    const totalHours = Math.round(totalMinutes / 60);
    
    return {
      completedTasks: completedTasks.length,
      activeTasks: activeTasks.length,
      completedEvents: completedEvents.length,
      sharedTasks: sharedTasks.length,
      sharedEvents: sharedEvents.length,
      tasksByDuration,
      tasksByStatus,
      tagStats: sortedTagStats,
      totalChests,
      earnedBadges,
      totalBadges,
      totalHours,
      friends: friends.length,
    };
  }, [tasks, events, chests, badges, friends, period]);

  const getPeriodLabel = () => {
    switch(period) {
      case 'today': return "Aujourd'hui";
      case 'month': return 'Ce mois-ci';
      default: return 'Depuis le début';
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <div className={`bg-white rounded-2xl p-4 border-2 ${color} shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div>
          <div className="text-2xl font-black text-slate-900">{value}</div>
          <div className="text-sm font-semibold text-slate-700">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, max, color }) => {
    const percent = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-slate-700">{label}</span>
          <span className="text-slate-500">{value}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <h1 className="text-3xl font-black text-slate-900">Statistiques</h1>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 mr-2">📅 Période :</span>
          <button
            onClick={() => setPeriod('today')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              period === 'today' 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              period === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ce mois
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              period === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Tâches complétées" 
          value={stats.completedTasks}
          subtitle={getPeriodLabel()}
          icon="✅"
          color="border-green-200"
        />
        <StatCard 
          title="Événements" 
          value={stats.completedEvents}
          subtitle={getPeriodLabel()}
          icon="📅"
          color="border-emerald-200"
        />
        <StatCard 
          title="Niveau actuel" 
          value={user.level}
          subtitle={`${user.xp}/${user.xpToNext} XP`}
          icon="⚡"
          color="border-yellow-200"
        />
        <StatCard 
          title="Heures de travail" 
          value={`${stats.totalHours}h`}
          subtitle={getPeriodLabel()}
          icon="⏱️"
          color="border-blue-200"
        />
      </div>

      {/* Stats partage */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">🤝 Partage avec les amis</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <div className="text-2xl font-black text-purple-600">{stats.sharedTasks}</div>
            <div className="text-sm text-purple-700">Tâches partagées</div>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <div className="text-2xl font-black text-emerald-600">{stats.sharedEvents}</div>
            <div className="text-sm text-emerald-700">Événements partagés</div>
          </div>
          <div className="text-center p-3 bg-cyan-50 rounded-xl">
            <div className="text-2xl font-black text-cyan-600">{stats.friends}</div>
            <div className="text-sm text-cyan-700">Amis</div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">{getPeriodLabel()}</p>
      </div>

      {/* Répartition par durée */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">📈 Répartition par durée</h2>
        <p className="text-xs text-slate-500 mb-4">{getPeriodLabel()}</p>
        <ProgressBar label="Moins d'1 heure" value={stats.tasksByDuration['-1h']} max={stats.completedTasks} color="bg-green-400" />
        <ProgressBar label="1-2 heures" value={stats.tasksByDuration['1h-2h']} max={stats.completedTasks} color="bg-cyan-400" />
        <ProgressBar label="Demi-journée" value={stats.tasksByDuration['1/2 jour']} max={stats.completedTasks} color="bg-indigo-400" />
        <ProgressBar label="1 jour" value={stats.tasksByDuration['1 jour']} max={stats.completedTasks} color="bg-purple-400" />
      </div>

      {/* Répartition par priorité */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">🎯 Répartition par priorité</h2>
        <p className="text-xs text-slate-500 mb-4">{getPeriodLabel()}</p>
        <ProgressBar label="Urgent" value={stats.tasksByStatus.urgent} max={stats.completedTasks} color="bg-red-400" />
        <ProgressBar label="À faire" value={stats.tasksByStatus.normal} max={stats.completedTasks} color="bg-blue-400" />
        <ProgressBar label="Délégué" value={stats.tasksByStatus.important} max={stats.completedTasks} color="bg-purple-400" />
      </div>

      {/* Stats par tags */}
      {stats.tagStats.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">🏷️ Statistiques par tags</h2>
          <p className="text-xs text-slate-500 mb-4">{getPeriodLabel()}</p>
          <div className="space-y-3">
            {stats.tagStats.map(([tag, data], index) => {
              const hours = Math.floor(data.minutes / 60);
              const mins = data.minutes % 60;
              const timeDisplay = hours > 0 
                ? `${hours}h${mins > 0 ? mins + 'min' : ''}` 
                : `${mins}min`;
              
              const colors = [
                'bg-indigo-400', 'bg-purple-400', 'bg-pink-400', 'bg-rose-400', 
                'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-400',
                'bg-cyan-400', 'bg-blue-400'
              ];
              
              return (
                <div key={tag} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-slate-700">{tag}</span>
                      <span className="text-sm text-slate-500">
                        {data.count} tâche{data.count > 1 ? 's' : ''} • {timeDisplay}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min((data.count / stats.completedTasks) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats collection */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">📦 Collection</h2>
        <p className="text-xs text-slate-500 mb-4">Depuis le début</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <div className="text-2xl font-black text-amber-600">{stats.totalChests}</div>
            <div className="text-sm text-amber-700">Coffres en stock</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-xl">
            <div className="text-2xl font-black text-yellow-600">{stats.earnedBadges}/{stats.totalBadges}</div>
            <div className="text-sm text-yellow-700">Badges débloqués</div>
          </div>
        </div>
      </div>

      {/* Détail coffres */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">🎁 Détail des coffres</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-amber-100 rounded-xl">
            <div className="text-xl">🎁</div>
            <div className="font-bold text-amber-700">{chests.bronze}</div>
            <div className="text-xs text-amber-600">Commun</div>
          </div>
          <div className="p-2 bg-slate-200 rounded-xl">
            <div className="text-xl">🎀</div>
            <div className="font-bold text-slate-700">{chests.silver}</div>
            <div className="text-xs text-slate-600">Splendide</div>
          </div>
          <div className="p-2 bg-cyan-100 rounded-xl">
            <div className="text-xl">💎</div>
            <div className="font-bold text-cyan-700">{chests.gold}</div>
            <div className="text-xs text-cyan-600">Diamant</div>
          </div>
          <div className="p-2 bg-purple-100 rounded-xl">
            <div className="text-xl">👑</div>
            <div className="font-bold text-purple-700">{chests.legendary}</div>
            <div className="text-xs text-purple-600">Légendaire</div>
          </div>
        </div>
      </div>

      {/* Journaling */}
      {hasJournaling && journalingStats && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">🦋 Journaling</h2>
          <p className="text-xs text-slate-500 mb-4">4 dernières semaines</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <div className="text-2xl font-black text-purple-600">{journalingStats.recentEntries?.length || 0}</div>
              <div className="text-sm text-purple-700">Entrées journal</div>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-xl">
              <div className="text-2xl font-black text-pink-600">{journalingStats.weeklies?.length || 0}</div>
              <div className="text-sm text-pink-700">Bilans hebdo</div>
            </div>
          </div>

          {/* Évolution du moral */}
          {journalingStats.weeklyAverages && journalingStats.weeklyAverages.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-3">📈 Évolution du moral</div>
              <div className="flex items-end gap-1 h-24">
                {journalingStats.weeklyAverages.slice(-8).map((week, index) => {
                  const height = (week.average / 5) * 100;
                  const color = week.average >= 4 ? 'bg-green-400' 
                    : week.average >= 3 ? 'bg-yellow-400' 
                    : week.average >= 2 ? 'bg-orange-400' 
                    : 'bg-red-400';
                  return (
                    <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className={`w-full ${color} rounded-t-lg transition-all duration-500`}
                        style={{ height: `${height}%` }}
                        title={`Semaine du ${week.week}: ${week.average}/5`}
                      />
                      <span className="text-[10px] text-slate-400">{week.average}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-slate-400 text-center mt-2">
                Moyenne hebdomadaire (sur 5)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patates */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">🥔 Richesse</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-amber-50 rounded-xl">
            <div className="text-2xl font-black text-amber-600">{user.potatoes?.toLocaleString()}</div>
            <div className="text-sm text-amber-700">Patates actuelles</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-xl">
            <div className="text-2xl font-black text-orange-600">{user.totalSpent?.toLocaleString() || 0}</div>
            <div className="text-sm text-orange-700">Patates dépensées</div>
          </div>
        </div>
      </div>
    </div>
  );
};
