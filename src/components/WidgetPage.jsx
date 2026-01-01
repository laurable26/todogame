import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Page Widget - affichée via URL /widget pour l'écran d'accueil
export const WidgetPage = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  // Charger l'utilisateur et ses tâches
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        // Attendre que la session soit récupérée
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setAuthChecked(true);
          setLoading(false);
          return;
        }

        const authUser = session.user;

        // Charger le profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setUser({
            id: authUser.id,
            pseudo: profile.pseudo,
            avatar: profile.avatar,
            level: profile.level,
            xp: profile.xp,
            potatoes: profile.potatoes,
          });

          // Charger les tâches du jour
          await loadTodayTasks(authUser.id);
        }
        
        setAuthChecked(true);
        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement widget:', error);
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, []);

  const loadTodayTasks = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('date', today.toISOString())
      .lt('date', tomorrow.toISOString())
      .order('time', { ascending: true, nullsFirst: false });

    setTasks(tasksData || []);
  };

  // Marquer une tâche comme faite
  const toggleTask = async (task) => {
    const newCompleted = !task.completed;
    
    await supabase
      .from('tasks')
      .update({ completed: newCompleted })
      .eq('id', task.id);

    setTasks(tasks.map(t => 
      t.id === task.id ? { ...t, completed: newCompleted } : t
    ));
  };

  // Ajouter une nouvelle tâche
  const addTask = async () => {
    if (!newTaskTitle.trim() || !user) return;

    const today = new Date();
    const newTask = {
      user_id: user.id,
      title: newTaskTitle.trim(),
      date: today.toISOString(),
      status: 'à faire',
      completed: false,
      duration: '30min-1h',
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (!error && data) {
      setTasks([...tasks, data]);
      setNewTaskTitle('');
      setShowAddTask(false);
    }
  };

  // Sauvegarder les modifications d'une tâche
  const saveTaskEdit = async () => {
    if (!editingTask) return;

    await supabase
      .from('tasks')
      .update({ 
        title: editingTask.title,
        time: editingTask.time || null,
      })
      .eq('id', editingTask.id);

    setTasks(tasks.map(t => 
      t.id === editingTask.id ? editingTask : t
    ));
    setEditingTask(null);
  };

  // Ouvrir l'app principale
  const openApp = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🔒</div>
          <p className="mb-4">Connecte-toi pour utiliser le widget</p>
          <button
            onClick={openApp}
            className="px-6 py-3 bg-blue-500 rounded-xl font-bold"
          >
            Ouvrir ToDoGame
          </button>
        </div>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 pb-24">
      {/* Header compact */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3" onClick={openApp}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl">
            {user.avatar || '😀'}
          </div>
          <div>
            <div className="font-bold">{user.pseudo}</div>
            <div className="text-xs text-slate-400">Niv. {user.level} • {user.potatoes} 🥔</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black">{completedCount}/{totalCount}</div>
          <div className="text-xs text-slate-400">tâches</div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
          style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
        ></div>
      </div>

      {/* Liste des tâches */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <div className="text-4xl mb-2">✨</div>
            <p>Aucune tâche pour aujourd'hui</p>
            <p className="text-sm">Ajoute-en une avec le bouton +</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                task.completed 
                  ? 'bg-slate-800/50 opacity-60' 
                  : 'bg-slate-800'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task)}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                  task.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-500 hover:border-emerald-500'
                }`}
              >
                {task.completed && '✓'}
              </button>

              {/* Contenu */}
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => setEditingTask(task)}
              >
                <div className={`font-medium truncate ${task.completed ? 'line-through text-slate-500' : ''}`}>
                  {task.title}
                </div>
                {task.time && (
                  <div className="text-xs text-slate-400">{task.time}</div>
                )}
              </div>

              {/* Indicateur de statut */}
              {task.status === 'urgent' && !task.completed && (
                <span className="text-red-500 text-sm">🔥</span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bouton flottant + */}
      <button
        onClick={() => setShowAddTask(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-3xl font-bold transition-all hover:scale-110"
      >
        +
      </button>

      {/* Bouton ouvrir l'app */}
      <button
        onClick={openApp}
        className="fixed bottom-6 left-6 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium transition-all"
      >
        Ouvrir l'app →
      </button>

      {/* Modal Ajouter une tâche */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50" onClick={() => setShowAddTask(false)}>
          <div 
            className="bg-slate-800 rounded-2xl w-full max-w-md p-4 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Nouvelle tâche</h3>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Titre de la tâche..."
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 py-3 bg-slate-700 rounded-xl font-medium"
              >
                Annuler
              </button>
              <button
                onClick={addTask}
                disabled={!newTaskTitle.trim()}
                className={`flex-1 py-3 rounded-xl font-bold ${
                  newTaskTitle.trim()
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Éditer une tâche */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50" onClick={() => setEditingTask(null)}>
          <div 
            className="bg-slate-800 rounded-2xl w-full max-w-md p-4 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Modifier la tâche</h3>
            <input
              type="text"
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Heure :</span>
              <input
                type="time"
                value={editingTask.time || ''}
                onChange={(e) => setEditingTask({ ...editingTask, time: e.target.value })}
                className="bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingTask(null)}
                className="flex-1 py-3 bg-slate-700 rounded-xl font-medium"
              >
                Annuler
              </button>
              <button
                onClick={saveTaskEdit}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Instructions pour installer le widget
export const WidgetInstructions = ({ onClose }) => {
  // Utiliser l'URL de production ou l'URL actuelle
  const baseUrl = window.location.hostname === 'localhost' 
    ? 'https://todogame.vercel.app' 
    : window.location.origin;
  const widgetUrl = `${baseUrl}/widget`;
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(widgetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">📱</span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Widget ToDoGame</h2>
                <p className="text-sm text-slate-500">Installe-le sur ton écran d'accueil</p>
              </div>
            </div>
            <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-5 space-y-6">
          {/* Aperçu */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">📋</div>
                <span className="font-bold">Tâches du jour</span>
              </div>
              <span className="text-emerald-400 font-bold">3/5</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-xs">✓</span>
                <span className="line-through opacity-50">Faire les courses</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-slate-500 rounded-full"></span>
                <span>Répondre aux emails</span>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold">+</div>
            </div>
          </div>

          {/* URL du widget */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lien du widget</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={widgetUrl}
                readOnly
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm"
              />
              <button
                onClick={copyUrl}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Instructions iOS */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>🍎</span> iPhone / iPad
            </h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold text-blue-500">1.</span>
                Ouvre Safari et va sur <strong>{widgetUrl}</strong>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500">2.</span>
                Appuie sur le bouton <strong>Partager</strong> (carré avec flèche)
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500">3.</span>
                Sélectionne <strong>"Sur l'écran d'accueil"</strong>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500">4.</span>
                Donne un nom et appuie sur <strong>Ajouter</strong>
              </li>
            </ol>
          </div>

          {/* Instructions Android */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span>🤖</span> Android
            </h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold text-emerald-500">1.</span>
                Ouvre Chrome et va sur <strong>{widgetUrl}</strong>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-500">2.</span>
                Appuie sur les <strong>3 points</strong> en haut à droite
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-500">3.</span>
                Sélectionne <strong>"Ajouter à l'écran d'accueil"</strong>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-emerald-500">4.</span>
                Confirme en appuyant sur <strong>Ajouter</strong>
              </li>
            </ol>
          </div>

          {/* Bouton tester */}
          <a
            href="/widget"
            target="_blank"
            className="block w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center rounded-xl font-bold hover:opacity-90 transition-all"
          >
            Tester le widget →
          </a>
        </div>
      </div>
    </div>
  );
};

export default WidgetPage;
