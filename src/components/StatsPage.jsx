import React, { useMemo } from 'react';

export const StatsPage = ({ user, tasks, missions, chests, badges, friends }) => {
  // Calculer les statistiques
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.completed);
    const activeTasks = tasks.filter(t => !t.completed);
    
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
      'normal': completedTasks.filter(t => t.status === 'à faire' || t.status === 'normal').length,
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
    
    // Stats missions
    const completedMissions = missions.filter(m => 
      m.quests?.length > 0 && m.quests.every(q => q.completed)
    ).length;
    const activeMissions = missions.length - completedMissions;
    const totalQuests = missions.reduce((acc, m) => acc + (m.quests?.length || 0), 0);
    const completedQuests = missions.reduce((acc, m) => 
      acc + (m.quests?.filter(q => q.completed).length || 0), 0
    );
    
    // Stats coffres
    const totalChests = chests.bronze + chests.silver + chests.gold + chests.legendary;
    
    // Stats badges
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
      tasksByDuration,
      tasksByStatus,
      tagStats: sortedTagStats,
      completedMissions,
      activeMissions,
      totalQuests,
      completedQuests,
      totalChests,
      earnedBadges,
      totalBadges,
      totalHours,
      friends: friends.length,
    };
  }, [tasks, missions, chests, badges, friends]);

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
      <div className="flex items-center gap-3">
        <span className="text-3xl">📊</span>
        <h1 className="text-3xl font-black text-slate-900">Statistiques Pro</h1>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Tâches complétées" 
          value={stats.completedTasks}
          icon="✅"
          color="border-green-200"
        />
        <StatCard 
          title="Niveau actuel" 
          value={user.level}
          subtitle={`${user.xp}/${user.xpToNext} XP`}
          icon="⚡"
          color="border-yellow-200"
        />
        <StatCard 
          title="Patates totales" 
          value={user.pqTotal?.toLocaleString() || user.potatoes.toLocaleString()}
          icon="🥔"
          color="border-amber-200"
        />
        <StatCard 
          title="Heures de travail" 
          value={`${stats.totalHours}h`}
          subtitle="Temps estimé"
          icon="⏱️"
          color="border-blue-200"
        />
      </div>

      {/* Répartition par durée */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">📈 Répartition par durée</h2>
        <ProgressBar label="Moins d'1 heure" value={stats.tasksByDuration['-1h']} max={stats.completedTasks} color="bg-green-400" />
        <ProgressBar label="1-2 heures" value={stats.tasksByDuration['1h-2h']} max={stats.completedTasks} color="bg-cyan-400" />
        <ProgressBar label="Demi-journée" value={stats.tasksByDuration['1/2 jour']} max={stats.completedTasks} color="bg-indigo-400" />
        <ProgressBar label="1 jour" value={stats.tasksByDuration['1 jour']} max={stats.completedTasks} color="bg-purple-400" />
      </div>

      {/* Répartition par priorité */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">🎯 Répartition par priorité</h2>
        <ProgressBar label="Urgent" value={stats.tasksByStatus.urgent} max={stats.completedTasks} color="bg-red-400" />
        <ProgressBar label="Important" value={stats.tasksByStatus.important} max={stats.completedTasks} color="bg-orange-400" />
        <ProgressBar label="Normal" value={stats.tasksByStatus.normal} max={stats.completedTasks} color="bg-slate-400" />
      </div>

      {/* Stats par tags */}
      {stats.tagStats.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">🏷️ Statistiques par tags</h2>
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

      {/* Stats missions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">🤝 Missions en équipe</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-xl">
            <div className="text-2xl font-black text-purple-600">{stats.completedMissions}</div>
            <div className="text-sm text-purple-700">Missions terminées</div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-xl">
            <div className="text-2xl font-black text-indigo-600">{stats.activeMissions}</div>
            <div className="text-sm text-indigo-700">Missions actives</div>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-xl">
            <div className="text-2xl font-black text-pink-600">{stats.completedQuests}/{stats.totalQuests}</div>
            <div className="text-sm text-pink-700">Tâches de mission</div>
          </div>
          <div className="text-center p-3 bg-cyan-50 rounded-xl">
            <div className="text-2xl font-black text-cyan-600">{stats.friends}</div>
            <div className="text-sm text-cyan-700">Amis</div>
          </div>
        </div>
      </div>

      {/* Stats collection */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">📦 Collection</h2>
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
    </div>
  );
};
