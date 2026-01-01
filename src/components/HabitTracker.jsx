import React, { useState, useEffect } from 'react';

// Composant HabitTracker - Amélioration achetable dans la boutique
// Maximum 3 habitudes par mois, design radial, archive des mois passés

const HabitTracker = ({ supabase, userId, onXPGain, potatoes, setPotatoes, onClose }) => {
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('🎯');
  const [newHabitColor, setNewHabitColor] = useState('#FF6B6B');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const HABIT_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
  const HABIT_EMOJIS = ['🎯', '💪', '📚', '🏃', '💧', '🧘', '✍️', '🎸', '💤', '🥗', '🚭', '💊'];
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
  const isPastMonth = currentMonth < new Date(today.getFullYear(), today.getMonth(), 1);

  useEffect(() => {
    if (userId) loadHabits();
  }, [userId, currentMonth]);

  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const loadHabits = async () => {
    setLoading(true);
    try {
      // Charger les habitudes du mois sélectionné
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('month', monthKey);

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: logsData } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      setHabits(habitsData || []);
      
      const logsMap = {};
      (logsData || []).forEach(log => {
        if (!logsMap[log.habit_id]) logsMap[log.habit_id] = {};
        logsMap[log.habit_id][log.date] = log.completed;
      });
      setHabitLogs(logsMap);
    } catch (error) {
      console.error('Erreur chargement habitudes:', error);
    }
    setLoading(false);
  };

  const addHabit = async () => {
    if (!newHabitName.trim() || habits.length >= 3 || isPastMonth) return;

    const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          name: newHabitName.trim(),
          emoji: newHabitEmoji,
          color: newHabitColor,
          month: monthKey,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      setHabits([...habits, data]);
      setNewHabitName('');
      setNewHabitEmoji('🎯');
      setShowAddModal(false);
      showNotif(`✨ Habitude "${data.name}" créée !`);
    } catch (error) {
      console.error('Erreur ajout habitude:', error);
      showNotif('Erreur lors de la création', 'error');
    }
  };

  const deleteHabit = async (habitId, habitName) => {
    if (isPastMonth) return;
    if (!confirm(`Supprimer l'habitude "${habitName}" ?`)) return;
    
    try {
      await supabase.from('habits').delete().eq('id', habitId);
      await supabase.from('habit_logs').delete().eq('habit_id', habitId);
      setHabits(habits.filter(h => h.id !== habitId));
      showNotif(`🗑️ Habitude supprimée`);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const toggleHabit = async (habitId, day) => {
    if (isPastMonth) return; // Mois passé = lecture seule
    
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const currentValue = habitLogs[habitId]?.[dateStr] || false;

    try {
      if (currentValue) {
        await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', dateStr);
      } else {
        await supabase.from('habit_logs').upsert({
          habit_id: habitId,
          user_id: userId,
          date: dateStr,
          completed: true
        });

        // Récompenses gamification
        if (onXPGain) onXPGain(5);
        if (setPotatoes) setPotatoes(prev => prev + 2);
        showNotif('+5 ⭐ · +2 🥔');
      }

      setHabitLogs(prev => ({
        ...prev,
        [habitId]: { ...prev[habitId], [dateStr]: !currentValue }
      }));
    } catch (error) {
      console.error('Erreur toggle:', error);
    }
  };

  const calculateStreak = (habitId) => {
    let streak = 0;
    const checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (habitLogs[habitId]?.[dateStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const calculateMonthProgress = (habitId) => {
    const maxDays = isCurrentMonth ? today.getDate() : daysInMonth;
    let completed = 0;
    
    for (let d = 1; d <= maxDays; d++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (habitLogs[habitId]?.[dateStr]) completed++;
    }
    
    return Math.round((completed / maxDays) * 100);
  };

  const generateRadialPath = (day, ringIndex) => {
    const centerX = 160, centerY = 160;
    const innerRadius = 35 + (ringIndex * 32);
    const outerRadius = innerRadius + 28;
    
    const gapDegrees = 35;
    const availableDegrees = 360 - gapDegrees;
    const segmentSize = availableDegrees / daysInMonth;
    const startAngle = -90 + gapDegrees/2 + (day - 1) * segmentSize;
    const endAngle = startAngle + segmentSize - 1.5;
    
    const toRad = (deg) => (deg * Math.PI) / 180;
    const x1 = centerX + innerRadius * Math.cos(toRad(startAngle));
    const y1 = centerY + innerRadius * Math.sin(toRad(startAngle));
    const x2 = centerX + outerRadius * Math.cos(toRad(startAngle));
    const y2 = centerY + outerRadius * Math.sin(toRad(startAngle));
    const x3 = centerX + outerRadius * Math.cos(toRad(endAngle));
    const y3 = centerY + outerRadius * Math.sin(toRad(endAngle));
    const x4 = centerX + innerRadius * Math.cos(toRad(endAngle));
    const y4 = centerY + innerRadius * Math.sin(toRad(endAngle));
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1}`;
  };

  // Calculer la position de l'emoji pour chaque anneau (au début de l'anneau, dans le gap)
  const getEmojiPosition = (ringIndex) => {
    const centerX = 160, centerY = 160;
    const radius = 35 + (ringIndex * 32) + 14; // milieu de l'anneau
    const angle = -90 - 5; // dans le gap, en haut à gauche
    const toRad = (deg) => (deg * Math.PI) / 180;
    const x = centerX + radius * Math.cos(toRad(angle));
    const y = centerY + radius * Math.sin(toRad(angle));
    return { x, y };
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const avgProgress = habits.length > 0 
    ? Math.round(habits.reduce((sum, h) => sum + calculateMonthProgress(h.id), 0) / habits.length)
    : 0;

  // Jour actuel du mois
  const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-slate-700">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur p-4 border-b border-slate-200 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
            Tracker d'Habitudes
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl transition-colors">✕</button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-4 mt-4 p-3 rounded-xl text-center font-medium ${
            notification.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Bannière mois archivé */}
        {isPastMonth && (
          <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-amber-700 font-medium">📸 Archive du mois - Consultation uniquement</span>
          </div>
        )}

        {/* Navigation mois */}
        <div className="flex justify-center items-center gap-4 p-4">
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-colors"
          >◀</button>
          <span className="text-slate-800 font-semibold min-w-[180px] text-center text-lg">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button 
            onClick={() => {
              const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
              if (next <= new Date(today.getFullYear(), today.getMonth() + 1, 0)) setCurrentMonth(next);
            }}
            className={`bg-slate-100 text-slate-700 px-4 py-2 rounded-xl transition-colors ${
              isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'
            }`}
            disabled={isCurrentMonth}
          >▶</button>
        </div>

        <div className="p-4 flex flex-col lg:flex-row gap-6">
          {/* Cercle radial */}
          <div className="flex-shrink-0 mx-auto">
            <div className="relative w-[320px] h-[320px]">
              <svg viewBox="0 0 320 320" className="w-full h-full">
                {/* Cercle de fond */}
                <circle cx="160" cy="160" r="155" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Segments des habitudes */}
                {habits.map((habit, ringIndex) => (
                  <g key={habit.id}>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isCompleted = habitLogs[habit.id]?.[dateStr];
                      const isFuture = isCurrentMonth && day > today.getDate();
                      const isToday = isCurrentMonth && day === today.getDate();
                      
                      return (
                        <path
                          key={`${habit.id}-${day}`}
                          d={generateRadialPath(day, ringIndex)}
                          fill={isCompleted ? habit.color : (isFuture ? '#f8fafc' : '#e2e8f0')}
                          stroke="#fff"
                          strokeWidth="1"
                          className={`${isFuture || isPastMonth ? (isPastMonth ? '' : 'opacity-30') : 'cursor-pointer hover:brightness-110'} transition-all duration-200`}
                          style={{ filter: isToday ? 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' : 'none' }}
                          onClick={() => !isFuture && !isPastMonth && toggleHabit(habit.id, day)}
                        >
                          <title>{`${habit.emoji} ${habit.name} - Jour ${day}${isCompleted ? ' ✓' : ''}`}</title>
                        </path>
                      );
                    })}
                    {/* Emoji de l'habitude au début de l'anneau */}
                    <text
                      x={getEmojiPosition(ringIndex).x}
                      y={getEmojiPosition(ringIndex).y}
                      fontSize="14"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {habit.emoji}
                    </text>
                  </g>
                ))}
                
                {/* Numéros des jours */}
                {[1, 5, 10, 15, 20, 25, daysInMonth].map(day => {
                  const gapDegrees = 35;
                  const availableDegrees = 360 - gapDegrees;
                  const segmentSize = availableDegrees / daysInMonth;
                  const angle = -90 + gapDegrees/2 + (day - 0.5) * segmentSize;
                  const radius = 150;
                  const x = 160 + radius * Math.cos((angle * Math.PI) / 180);
                  const y = 160 + radius * Math.sin((angle * Math.PI) / 180);
                  
                  return (
                    <text key={`day-${day}`} x={x} y={y} fill="#94a3b8" fontSize="9" textAnchor="middle" dominantBaseline="middle">
                      {day}
                    </text>
                  );
                })}

                {/* Centre */}
                <circle cx="160" cy="160" r="30" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                <text x="160" y="155" fill="#334155" fontSize="14" textAnchor="middle" fontWeight="bold">{avgProgress}%</text>
                <text x="160" y="170" fill="#94a3b8" fontSize="8" textAnchor="middle">ce mois</text>
              </svg>

              {/* Badge jour actuel */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                📅 Jour {currentDay}/{daysInMonth}
              </div>
            </div>
          </div>

          {/* Panel habitudes */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-800 font-semibold text-lg">Mes Habitudes ({habits.length}/3)</h3>
              {habits.length < 3 && !isPastMonth && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-4 py-2 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
                >
                  + Ajouter
                </button>
              )}
            </div>

            {habits.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
                <span className="text-5xl block mb-4">🌱</span>
                <p className="text-slate-700 font-medium mb-2">Aucune habitude</p>
                <p className="text-slate-500 text-sm">
                  {isPastMonth ? 'Aucune habitude n\'était suivie ce mois-ci' : 'Ajoute jusqu\'à 3 habitudes à tracker'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const streak = calculateStreak(habit.id);
                  const progress = calculateMonthProgress(habit.id);
                  
                  return (
                    <div 
                      key={habit.id} 
                      className="bg-white rounded-xl p-4 flex items-center justify-between gap-4 border border-slate-200 hover:border-slate-300 transition-colors shadow-sm"
                      style={{ borderLeft: `4px solid ${habit.color}` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{habit.emoji}</span>
                        <span className="text-slate-800 font-medium truncate">{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-cyan-600 font-bold text-lg">{streak}</div>
                          <div className="text-slate-400 text-xs">🔥 série</div>
                        </div>
                        <div className="text-center">
                          <div className="text-emerald-600 font-bold text-lg">{progress}%</div>
                          <div className="text-slate-400 text-xs">📊 mois</div>
                        </div>
                        {!isPastMonth && (
                          <button 
                            onClick={() => deleteHabit(habit.id, habit.name)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal ajout */}
        {showAddModal && !isPastMonth && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-slate-200 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">✨ Nouvelle Habitude</h3>
              
              <div className="mb-4">
                <label className="text-slate-500 text-sm block mb-2">Nom</label>
                <input
                  type="text"
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  placeholder="Ex: Méditation, Sport..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  maxLength={25}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="text-slate-500 text-sm block mb-2">Emoji</label>
                <div className="grid grid-cols-6 gap-2">
                  {HABIT_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewHabitEmoji(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        newHabitEmoji === emoji ? 'bg-cyan-500 scale-110' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-slate-500 text-sm block mb-2">Couleur de l'anneau</label>
                <div className="flex gap-3 justify-center">
                  {HABIT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewHabitColor(color)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        newHabitColor === color ? 'ring-4 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={addHabit}
                  disabled={!newHabitName.trim()}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitTracker;
