import React, { useMemo, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const StatsPage = ({ user, tasks, missions, chests, badges, friends, journalingEnabled, userId }) => {
  const [journalStats, setJournalStats] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Charger les stats de journaling
  useEffect(() => {
    const loadJournalStats = async () => {
      if (!journalingEnabled || !userId) return;

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
        const moodCounts = { joie: 0, colere: 0, peur: 0, tristesse: 0, degout: 0 };
        
        if (entries) {
          const entriesByWeek = {};
          entries.forEach(entry => {
            // Compter les émotions
            if (entry.mood && moodCounts[entry.mood] !== undefined) {
              moodCounts[entry.mood]++;
            }
            
            // Grouper par semaine
            const date = new Date(entry.date);
            const weekStart = getWeekStart(date);
            if (!entriesByWeek[weekStart]) {
              entriesByWeek[weekStart] = [];
            }
            entriesByWeek[weekStart].push(entry.rating);
          });

          Object.keys(entriesByWeek).sort().forEach(week => {
            const ratings = entriesByWeek[week];
            const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            weeklyAverages.push({ week, average: Math.round(avg * 10) / 10 });
          });
        }

        // Organiser les réponses par question
        const answersByQuestion = {};
        if (weeklies) {
          weeklies.forEach(weekly => {
            if (weekly.questions) {
              weekly.questions.forEach(q => {
                if (!answersByQuestion[q.question]) {
                  answersByQuestion[q.question] = [];
                }
                answersByQuestion[q.question].push({
                  answer: q.answer,
                  date: weekly.week_start
                });
              });
            }
          });
        }

        setJournalStats({
          weeklyAverages,
          moodCounts,
          totalEntries: entries?.length || 0,
          answersByQuestion,
          weeklies: weeklies || []
        });
      } catch (error) {
        console.error('Erreur chargement stats journal:', error);
      }
    };

    loadJournalStats();
  }, [journalingEnabled, userId]);

  // Obtenir le lundi de la semaine
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

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

  // Composant StatCard avec tooltip
  const StatCard = ({ title, value, subtitle, icon, color, tooltip }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
      <div 
        className={`bg-white rounded-2xl p-4 border-2 ${color} shadow-sm relative cursor-help`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(!showTooltip)}
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">{icon}</div>
          <div>
            <div className="text-2xl font-black text-slate-900">{value}</div>
            <div className="text-sm font-semibold text-slate-700">{title}</div>
            {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
          </div>
        </div>
        {tooltip && showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap max-w-xs">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        )}
      </div>
    );
  };

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

  // Interprétations des stats
  const getTasksInterpretation = (count) => {
    if (count < 10) return "Tu débutes ! Continue comme ça 💪";
    if (count < 50) return "Bonne progression, tu prends le rythme !";
    if (count < 100) return "Impressionnant ! Tu es très productif 🌟";
    return "Tu es une machine de productivité ! 🚀";
  };

  const getLevelInterpretation = (level) => {
    if (level < 5) return "Aventurier débutant, le voyage commence !";
    if (level < 15) return "Tu montes en puissance !";
    if (level < 30) return "Héros confirmé, respect ! 🎖️";
    return "Légende vivante ! 👑";
  };

  const getHoursInterpretation = (hours) => {
    if (hours < 10) return "Quelques heures investies";
    if (hours < 50) return "Un bon investissement de temps !";
    if (hours < 100) return "Tu as beaucoup accompli ! 📚";
    return "Un travail monumental ! 🏆";
  };

  // Interprétations journaling
  const getMoodInterpretation = (moodCounts) => {
    if (!moodCounts) return "";
    const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return "Pas encore de données";
    
    const dominant = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    const percent = Math.round((dominant[1] / total) * 100);
    
    const interpretations = {
      joie: `${percent}% de joie ! Tu traverses une belle période 🌈`,
      colere: `${percent}% de colère. Identifie ce qui te frustre 🔥`,
      peur: `${percent}% de peur. Qu'est-ce qui t'inquiète ? 💭`,
      tristesse: `${percent}% de tristesse. Prends soin de toi 💙`,
      degout: `${percent}% de dégoût. Quelque chose te dérange ? 🤔`
    };
    
    return interpretations[dominant[0]] || "";
  };

  const getAverageInterpretation = (avg) => {
    if (avg >= 4.5) return "Excellente semaine ! Continue ainsi 🌟";
    if (avg >= 3.5) return "Bonne semaine dans l'ensemble 👍";
    if (avg >= 2.5) return "Semaine mitigée, ça arrive 🤷";
    if (avg >= 1.5) return "Semaine difficile, courage 💪";
    return "Semaine très dure. Parle à quelqu'un si besoin 💙";
  };

  // Emoji pour l'humeur
  const moodEmojis = {
    joie: '😄',
    colere: '😠',
    peur: '😨',
    tristesse: '😢',
    degout: '🤢'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📊</span>
        <h1 className="text-3xl font-black text-slate-900">Statistiques</h1>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Tâches complétées" 
          value={stats.completedTasks}
          icon="✅"
          color="border-green-200"
          tooltip={getTasksInterpretation(stats.completedTasks)}
        />
        <StatCard 
          title="Niveau actuel" 
          value={user.level}
          subtitle={`${user.xp}/${user.xpToNext} XP`}
          icon="⚡"
          color="border-yellow-200"
          tooltip={getLevelInterpretation(user.level)}
        />
        <StatCard 
          title="Patates totales" 
          value={user.pqTotal?.toLocaleString() || user.potatoes.toLocaleString()}
          icon="🥔"
          color="border-amber-200"
          tooltip="Tes économies pour la boutique !"
        />
        <StatCard 
          title="Heures de travail" 
          value={`${stats.totalHours}h`}
          subtitle="Temps estimé"
          icon="⏱️"
          color="border-blue-200"
          tooltip={getHoursInterpretation(stats.totalHours)}
        />
      </div>

      {/* Stats Journaling */}
      {journalingEnabled && journalStats && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">🦋 Journal de bord</h2>
          
          {/* Moyenne de la semaine */}
          {journalStats.weeklyAverages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">Moyennes hebdomadaires</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {journalStats.weeklyAverages.slice(-4).map((week, i) => {
                  const weekDate = new Date(week.week);
                  const weekLabel = weekDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                  return (
                    <div 
                      key={week.week} 
                      className="flex-shrink-0 text-center p-3 bg-purple-50 rounded-xl cursor-help relative group min-w-[80px]"
                    >
                      <div className="text-2xl font-black text-purple-600">{week.average}</div>
                      <div className="text-xs text-purple-700">★</div>
                      <div className="text-xs text-slate-500 mt-1">{weekLabel}</div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {getAverageInterpretation(week.average)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Répartition des émotions */}
          {journalStats.totalEntries > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">Émotions dominantes (4 dernières semaines)</h3>
              <div className="grid grid-cols-5 gap-2 mb-2">
                {Object.entries(journalStats.moodCounts).map(([mood, count]) => {
                  const total = Object.values(journalStats.moodCounts).reduce((a, b) => a + b, 0);
                  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={mood} className="text-center p-2 bg-slate-50 rounded-xl relative group cursor-help">
                      <div className="text-2xl mb-1">{moodEmojis[mood]}</div>
                      <div className="text-sm font-bold text-slate-700">{percent}%</div>
                      <div className="text-xs text-slate-500 capitalize">{mood}</div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {count} jour{count > 1 ? 's' : ''} sur {total}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-slate-600 italic text-center mt-2">
                {getMoodInterpretation(journalStats.moodCounts)}
              </p>
            </div>
          )}

          {/* Historique des réponses par question */}
          {Object.keys(journalStats.answersByQuestion).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-3">Historique des bilans</h3>
              <div className="space-y-2">
                {Object.entries(journalStats.answersByQuestion).map(([question, answers]) => (
                  <div key={question}>
                    <button
                      onClick={() => setSelectedQuestion(selectedQuestion === question ? null : question)}
                      className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors flex justify-between items-center"
                    >
                      <span className="text-sm font-medium text-slate-700 flex-1 pr-2">{question}</span>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {answers.length} réponse{answers.length > 1 ? 's' : ''} {selectedQuestion === question ? '▲' : '▼'}
                      </span>
                    </button>
                    {selectedQuestion === question && (
                      <div className="mt-2 ml-4 space-y-2">
                        {answers.map((a, i) => (
                          <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg">
                            <div className="text-xs text-slate-400 mb-1">
                              Semaine du {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            <p className="text-sm text-slate-700">{a.answer || <em className="text-slate-400">Pas de réponse</em>}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {journalStats.totalEntries === 0 && (
            <p className="text-center text-slate-500 py-4">
              Commence à remplir ton journal pour voir tes statistiques ici ! 🦋
            </p>
          )}
        </div>
      )}

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
          <div className="text-center p-3 bg-purple-50 rounded-xl cursor-help relative group">
            <div className="text-2xl font-black text-purple-600">{stats.completedMissions}</div>
            <div className="text-sm text-purple-700">Missions terminées</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {stats.completedMissions === 0 ? "Lance-toi dans une mission collaborative !" : "Beau travail d'équipe ! 🎉"}
            </div>
          </div>
          <div className="text-center p-3 bg-indigo-50 rounded-xl cursor-help relative group">
            <div className="text-2xl font-black text-indigo-600">{stats.activeMissions}</div>
            <div className="text-sm text-indigo-700">Missions actives</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {stats.activeMissions === 0 ? "Crée une mission avec tes amis !" : `${stats.activeMissions} mission${stats.activeMissions > 1 ? 's' : ''} en cours`}
            </div>
          </div>
          <div className="text-center p-3 bg-pink-50 rounded-xl cursor-help relative group">
            <div className="text-2xl font-black text-pink-600">{stats.completedQuests}/{stats.totalQuests}</div>
            <div className="text-sm text-pink-700">Tâches de mission</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {stats.totalQuests === 0 ? "Les missions ont des tâches collaboratives" : `${Math.round((stats.completedQuests / stats.totalQuests) * 100)}% de progression`}
            </div>
          </div>
          <div className="text-center p-3 bg-cyan-50 rounded-xl cursor-help relative group">
            <div className="text-2xl font-black text-cyan-600">{stats.friends}</div>
            <div className="text-sm text-cyan-700">Amis</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {stats.friends === 0 ? "Ajoute des amis pour jouer ensemble !" : `${stats.friends} ami${stats.friends > 1 ? 's' : ''} pour les missions`}
            </div>
          </div>
        </div>
      </div>

      {/* Stats collection */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">📦 Collection</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-amber-50 rounded-xl cursor-help relative group">
            <div className="text-2xl font-black text-amber-600">{stats.totalChests}</div>
            <div className="text-sm text-amber-700">Coffres en stock</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {stats.totalChests === 0 ? "Complète des tâches pour gagner des coffres !" : "Ouvre-les pour des récompenses ! 🎁"}
            </div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-xl cursor-help relative group">
            <div className="text-2xl font-black text-yellow-600">{stats.earnedBadges}/{stats.totalBadges}</div>
            <div className="text-sm text-yellow-700">Badges débloqués</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {Math.round((stats.earnedBadges / stats.totalBadges) * 100)}% de la collection
            </div>
          </div>
        </div>
      </div>

      {/* Détail coffres */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">🎁 Détail des coffres</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-amber-100 rounded-xl cursor-help relative group">
            <div className="text-xl">🎁</div>
            <div className="font-bold text-amber-700">{chests.bronze}</div>
            <div className="text-xs text-amber-600">Commun</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Récompenses basiques
            </div>
          </div>
          <div className="p-2 bg-slate-200 rounded-xl cursor-help relative group">
            <div className="text-xl">🎀</div>
            <div className="font-bold text-slate-700">{chests.silver}</div>
            <div className="text-xs text-slate-600">Splendide</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Meilleures récompenses
            </div>
          </div>
          <div className="p-2 bg-cyan-100 rounded-xl cursor-help relative group">
            <div className="text-xl">💎</div>
            <div className="font-bold text-cyan-700">{chests.gold}</div>
            <div className="text-xs text-cyan-600">Diamant</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Récompenses rares !
            </div>
          </div>
          <div className="p-2 bg-purple-100 rounded-xl cursor-help relative group">
            <div className="text-xl">👑</div>
            <div className="font-bold text-purple-700">{chests.legendary}</div>
            <div className="text-xs text-purple-600">Légendaire</div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Les plus précieux ! ✨
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
