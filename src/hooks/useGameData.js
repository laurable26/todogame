import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useGameData = (supabaseUser) => {
  const [user, setUser] = useState({
    pseudo: '',
    email: '',
    avatar: '🎮',
    avatarBg: 'from-slate-500 to-slate-700',
    level: 1,
    xp: 0,
    xpToNext: 100,
    potatoes: 20,
    pqSeason: 0,
    pqTotal: 0,
    tasksCompleted: 0,
    // Stats pour les badges
    totalPotatoes: 0,
    totalSpent: 0,
    chestsOpened: 0,
    missionsCreated: 0,
    missionsParticipated: 0,
    questsCreated: 0,
    urgentCompleted: 0,
    longQuests: 0,
    streak: 0,
    bestStreak: 0,
    lastActiveDate: null,
    createdAt: null,
  });

  const [chests, setChests] = useState({
    bronze: 0,
    silver: 0,
    gold: 0,
    legendary: 0,
  });

  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [missions, setMissions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [equippedItems, setEquippedItems] = useState([]);
  const [activeUpgrades, setActiveUpgrades] = useState(() => {
    // Charger depuis localStorage
    const saved = localStorage.getItem('todogame_activeUpgrades');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Thème et préférences - initialisé depuis activeUpgrades
  const [theme, setTheme] = useState(() => {
    const savedUpgrades = localStorage.getItem('todogame_activeUpgrades');
    const upgrades = savedUpgrades ? JSON.parse(savedUpgrades) : {};
    
    // Déterminer le mode sombre depuis activeUpgrades[78]
    const darkMode = upgrades[78] === true;
    
    // Déterminer le thème de couleur
    let colorTheme = 'default';
    if (upgrades[73] === true) colorTheme = 'rose';
    else if (upgrades[74] === true) colorTheme = 'vert';
    else if (upgrades[75] === true) colorTheme = 'bleu';
    else if (upgrades[76] === true) colorTheme = 'violet';
    
    return { darkMode, colorTheme };
  });
  
  // Boosts actifs (avec date d'expiration)
  const [activeBoosts, setActiveBoosts] = useState([]);
  // Format: { id: 1, type: 'xp_x2', expiresAt: Date, multiplier: 2 }

  const [badges, setBadges] = useState([
    { id: 1, name: 'Premier Pas', description: 'Complète des quêtes', emoji: '👣', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: 'Complète 1 quête', silver: 'Complète 50 quêtes', gold: 'Complète 500 quêtes' }, thresholds: { bronze: 1, silver: 50, gold: 500 }, stat: 'tasksCompleted' },
    { id: 2, name: 'Régularité', description: 'Enchaîne les jours', emoji: '📅', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '7 jours d\'affilée', silver: '30 jours d\'affilée', gold: '365 jours d\'affilée' }, thresholds: { bronze: 7, silver: 30, gold: 365 }, stat: 'streak' },
    { id: 3, name: 'Équipier', description: 'Participe à des missions', emoji: '🤝', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: 'Participe à 1 mission', silver: 'Participe à 25 missions', gold: 'Participe à 100 missions' }, thresholds: { bronze: 1, silver: 25, gold: 100 }, stat: 'missionsParticipated' },
    { id: 4, name: 'Collectionneur', description: 'Ouvre des coffres', emoji: '📦', bronze: false, silver: false, gold: false, category: 'collection', requirements: { bronze: 'Ouvre 10 coffres', silver: 'Ouvre 100 coffres', gold: 'Ouvre 500 coffres' }, thresholds: { bronze: 10, silver: 100, gold: 500 }, stat: 'chestsOpened' },
    { id: 5, name: 'Fortune', description: 'Accumule des patates', emoji: '🥔', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: 'Gagne 10 000 patates', silver: 'Gagne 100 000 patates', gold: 'Gagne 1 000 000 patates' }, thresholds: { bronze: 10000, silver: 100000, gold: 1000000 }, stat: 'totalPotatoes' },
    { id: 6, name: 'Ascension', description: 'Monte en niveau', emoji: '⬆️', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: 'Atteins niveau 10', silver: 'Atteins niveau 50', gold: 'Atteins niveau 100' }, thresholds: { bronze: 10, silver: 50, gold: 100 }, stat: 'level' },
    { id: 7, name: 'Leader', description: 'Crée des missions', emoji: '🎯', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: 'Crée 5 missions', silver: 'Crée 50 missions', gold: 'Crée 200 missions' }, thresholds: { bronze: 5, silver: 50, gold: 200 }, stat: 'missionsCreated' },
    { id: 8, name: 'Social', description: 'Ajoute des amis', emoji: '👥', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: 'Ajoute 3 amis', silver: 'Ajoute 20 amis', gold: 'Ajoute 50 amis' }, thresholds: { bronze: 3, silver: 20, gold: 50 }, stat: 'friendsCount' },
    { id: 9, name: 'Marathonien', description: 'Quêtes longues', emoji: '🏃', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '50 quêtes "1 jour"', silver: '200 quêtes "1 jour"', gold: '1000 quêtes "1 jour"' }, thresholds: { bronze: 50, silver: 200, gold: 1000 }, stat: 'longQuests' },
    { id: 10, name: 'Perfectionniste', description: 'Quêtes urgentes à temps', emoji: '⚡', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '100 urgentes à temps', silver: '500 urgentes à temps', gold: '2000 urgentes à temps' }, thresholds: { bronze: 100, silver: 500, gold: 2000 }, stat: 'urgentCompleted' },
    { id: 11, name: 'Champion', description: 'Gagne des saisons', emoji: '🏆', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: 'Top 3 d\'une saison', silver: 'Gagne 3 saisons', gold: 'Gagne 10 saisons' }, thresholds: { bronze: 1, silver: 3, gold: 10 }, stat: 'seasonsWon' },
    { id: 12, name: 'Vétéran', description: 'Ancienneté', emoji: '🎖️', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '6 mois d\'utilisation', silver: '2 ans d\'utilisation', gold: '5 ans d\'utilisation' }, thresholds: { bronze: 180, silver: 730, gold: 1825 }, stat: 'daysPlayed' },
    { id: 13, name: 'Légende', description: 'Le summum', emoji: '👑', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: 'Niveau 50 + 100 missions', silver: 'Niveau 75 + 365 jours', gold: 'Niveau 100 + tous badges argent' }, thresholds: { bronze: 1, silver: 1, gold: 1 }, stat: 'legend' },
    { id: 14, name: 'Milliardaire', description: 'Richesse ultime', emoji: '💎', bronze: false, silver: false, gold: false, category: 'collection', requirements: { bronze: 'Dépense 50 000 patates', silver: 'Dépense 500 000 patates', gold: 'Dépense 5 000 000 patates' }, thresholds: { bronze: 50000, silver: 500000, gold: 5000000 }, stat: 'totalSpent' },
    { id: 15, name: 'Architecte', description: 'Créateur prolifique', emoji: '🏗️', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: '1000 quêtes créées', silver: '5000 quêtes créées', gold: '20 000 quêtes créées' }, thresholds: { bronze: 1000, silver: 5000, gold: 20000 }, stat: 'questsCreated' },
    { id: 16, name: 'Immortel', description: 'Persévérance', emoji: '♾️', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '1000 quêtes complétées', silver: '10 000 quêtes complétées', gold: '50 000 quêtes complétées' }, thresholds: { bronze: 1000, silver: 10000, gold: 50000 }, stat: 'tasksCompleted' },
    { id: 17, name: 'Festivités', description: 'Défis saisonniers', emoji: '🎄', bronze: false, silver: false, gold: false, category: 'collection', requirements: { bronze: 'Complète 3 défis', silver: 'Complète 6 défis', gold: 'Complète 12 défis' }, thresholds: { bronze: 3, silver: 6, gold: 12 }, stat: 'seasonalChallenges' },
  ]);

  const [shopItems] = useState([
    // Avatars - triés par prix (24 avatars)
    { id: 21, name: 'Chat', price: 100, type: 'avatar', image: '🐱' },
    { id: 22, name: 'Chien', price: 100, type: 'avatar', image: '🐶' },
    { id: 23, name: 'Lapin', price: 150, type: 'avatar', image: '🐰' },
    { id: 24, name: 'Panda', price: 150, type: 'avatar', image: '🐼' },
    { id: 25, name: 'Renard', price: 200, type: 'avatar', image: '🦊' },
    { id: 26, name: 'Lion', price: 200, type: 'avatar', image: '🦁' },
    { id: 27, name: 'Guerrier', price: 300, type: 'avatar', image: '⚔️' },
    { id: 28, name: 'Mage', price: 300, type: 'avatar', image: '🧙' },
    { id: 29, name: 'Fantôme', price: 400, type: 'avatar', image: '👻' },
    { id: 30, name: 'Citrouille', price: 400, type: 'avatar', image: '🎃' },
    { id: 31, name: 'Danseuse', price: 500, type: 'avatar', image: '💃' },
    { id: 32, name: 'Ninja', price: 500, type: 'avatar', image: '🥷' },
    { id: 33, name: 'Pirate', price: 600, type: 'avatar', image: '🏴‍☠️' },
    { id: 34, name: 'Cowboy', price: 600, type: 'avatar', image: '🤠' },
    { id: 35, name: 'Robot', price: 800, type: 'avatar', image: '🤖' },
    { id: 36, name: 'Extraterrestre', price: 800, type: 'avatar', image: '👾' },
    { id: 37, name: 'Astronaute', price: 1000, type: 'avatar', image: '👨‍🚀' },
    { id: 38, name: 'Alien', price: 1000, type: 'avatar', image: '👽' },
    { id: 39, name: 'Sirène', price: 1500, type: 'avatar', image: '🧜‍♀️' },
    { id: 40, name: 'Licorne', price: 1500, type: 'avatar', image: '🦄' },
    { id: 41, name: 'Fée', price: 2000, type: 'avatar', image: '🧚' },
    { id: 42, name: 'Roi', price: 2500, type: 'avatar', image: '👑' },
    { id: 43, name: 'Dragon', price: 5000, type: 'avatar', image: '🐉' },
    { id: 44, name: 'Phoenix', price: 10000, type: 'avatar', image: '🔥' },
    // Fonds - triés par prix (16 fonds)
    { id: 50, name: 'Océan', price: 200, type: 'fond', image: '🌊', colors: 'from-blue-400 to-cyan-500' },
    { id: 51, name: 'Prairie', price: 200, type: 'fond', image: '🌿', colors: 'from-green-400 to-lime-500' },
    { id: 52, name: 'Forêt', price: 300, type: 'fond', image: '🌲', colors: 'from-green-600 to-emerald-700' },
    { id: 53, name: 'Ciel', price: 300, type: 'fond', image: '☁️', colors: 'from-sky-300 to-blue-400' },
    { id: 54, name: 'Coucher de soleil', price: 400, type: 'fond', image: '🌅', colors: 'from-orange-400 to-pink-500' },
    { id: 55, name: 'Aurore', price: 400, type: 'fond', image: '🌄', colors: 'from-pink-400 to-orange-400' },
    { id: 56, name: 'Nuit', price: 500, type: 'fond', image: '🌙', colors: 'from-slate-700 to-slate-900' },
    { id: 57, name: 'Minuit', price: 500, type: 'fond', image: '🌑', colors: 'from-indigo-900 to-slate-900' },
    { id: 58, name: 'Feu', price: 600, type: 'fond', image: '🔥', colors: 'from-red-500 to-orange-500' },
    { id: 59, name: 'Lave', price: 600, type: 'fond', image: '🌋', colors: 'from-red-600 to-yellow-500' },
    { id: 60, name: 'Galaxie', price: 1000, type: 'fond', image: '🌌', colors: 'from-purple-600 to-indigo-800' },
    { id: 61, name: 'Nébuleuse', price: 1000, type: 'fond', image: '✨', colors: 'from-purple-500 to-pink-600' },
    { id: 62, name: 'Or', price: 2000, type: 'fond', image: '🏆', colors: 'from-yellow-400 to-amber-500' },
    { id: 63, name: 'Argent', price: 1500, type: 'fond', image: '🥈', colors: 'from-slate-300 to-slate-500' },
    { id: 64, name: 'Arc-en-ciel', price: 3000, type: 'fond', image: '🌈', colors: 'from-red-500 via-yellow-500 to-blue-500' },
    { id: 65, name: 'Aurore Boréale', price: 5000, type: 'fond', image: '🌠', colors: 'from-green-400 via-blue-500 to-purple-600' },
    // Améliorations - triées par prix
    { id: 71, name: 'Bordures Dorées', price: 500, type: 'amelioration', image: '✨', description: 'Bordure dorée sur ton avatar', isGoldenBorder: true },
    { id: 72, name: 'Notes Étendues', price: 300, type: 'amelioration', image: '📝', description: 'Notes plus longues sur les quêtes', isExtendedNotes: true },
    { id: 85, name: 'Éditeur de Texte', price: 400, type: 'amelioration', image: '✏️', description: 'Gras, italique, listes dans les notes', isRichTextEditor: true },
    { id: 86, name: 'Photos Notes', price: 600, type: 'amelioration', image: '📷', description: 'Ajouter des photos dans les notes', isPhotoNotes: true },
    { id: 73, name: 'Thème Rose', price: 400, type: 'amelioration', image: '💗', description: 'Change les couleurs en rose', themeColor: 'rose' },
    { id: 74, name: 'Thème Vert', price: 400, type: 'amelioration', image: '💚', description: 'Change les couleurs en vert', themeColor: 'vert' },
    { id: 75, name: 'Thème Bleu', price: 400, type: 'amelioration', image: '💙', description: 'Change les couleurs en bleu', themeColor: 'bleu' },
    { id: 76, name: 'Thème Violet', price: 400, type: 'amelioration', image: '💜', description: 'Change les couleurs en violet', themeColor: 'violet' },
    { id: 77, name: 'Tri Avancé', price: 600, type: 'amelioration', image: '🔀', description: 'Options de tri supplémentaires', isAdvancedSort: true },
    { id: 84, name: 'Filtre de Tâches', price: 800, type: 'amelioration', image: '🔍', description: 'Filtre par statut et durée', isQuestFilter: true },
    { id: 78, name: 'Mode Sombre', price: 1000, type: 'amelioration', image: '🌙', description: 'Active le thème sombre', isDarkMode: true },
    { id: 87, name: 'Journaling', price: 1200, type: 'amelioration', image: '🦋', description: 'Journal quotidien + bilan hebdo', isJournaling: true },
    { id: 79, name: 'Titre Personnalisé', price: 1500, type: 'amelioration', image: '🏷️', description: 'Affiche un titre sous ton pseudo', isCustomTitle: true },
    { id: 80, name: 'Animations +', price: 2000, type: 'amelioration', image: '💫', description: 'Animations améliorées', isAnimations: true },
    { id: 81, name: 'Statistiques', price: 2500, type: 'amelioration', image: '📊', description: 'Stats détaillées', unlocksStats: true },
    { id: 82, name: 'Fond Animé', price: 3000, type: 'amelioration', image: '🌠', description: 'Fond avec particules animées', isAnimatedBg: true },
    { id: 83, name: 'Badge VIP', price: 5000, type: 'amelioration', image: '👑', description: 'Badge VIP à côté du pseudo', isVipBadge: true },
    // Boosts temporaires - consommables (prix élevés car réutilisables)
    { id: 2, name: 'Lucky Chest', price: 150, type: 'boost', duration: 'Instantané', image: '🍀', description: 'Coffre aléatoire (chance de rare)', boostType: 'lucky_chest', instant: true },
    { id: 3, name: 'Coffre Splendide', price: 300, type: 'boost', duration: 'Instantané', image: '🎀', description: 'Reçois un coffre splendide', boostType: 'instant_silver_chest', instant: true },
    { id: 4, name: 'Mini Boost XP', price: 200, type: 'boost', duration: '1h', image: '💫', description: 'Double tes XP pendant 1h', boostType: 'xp_x2', durationMs: 60 * 60 * 1000, multiplier: 2 },
    { id: 5, name: 'Boost Coffre', price: 500, type: 'boost', duration: '24h', image: '📦', description: 'Coffre toutes les 6 quêtes', boostType: 'chest_boost', durationMs: 24 * 60 * 60 * 1000 },
    { id: 6, name: 'Boost XP x2', price: 400, type: 'boost', duration: '24h', image: '⚡', description: 'Double tes XP pendant 24h', boostType: 'xp_x2', durationMs: 24 * 60 * 60 * 1000, multiplier: 2 },
    { id: 7, name: 'Boost Patates x2', price: 400, type: 'boost', duration: '24h', image: '🥔', description: 'Double tes patates pendant 24h', boostType: 'potatoes_x2', durationMs: 24 * 60 * 60 * 1000, multiplier: 2 },
    { id: 8, name: 'Boost Mission', price: 350, type: 'boost', duration: '1 mission', image: '🤝', description: 'x2 PQ sur prochaine mission', boostType: 'mission_boost', durationMs: null },
    { id: 9, name: 'Méga Boost XP x3', price: 800, type: 'boost', duration: '12h', image: '🔥', description: 'Triple tes XP pendant 12h', boostType: 'xp_x3', durationMs: 12 * 60 * 60 * 1000, multiplier: 3 },
    { id: 10, name: 'Coffre Diamant', price: 1000, type: 'boost', duration: 'Instantané', image: '💎', description: 'Reçois un coffre diamant', boostType: 'instant_gold_chest', instant: true },
    { id: 11, name: 'Super Combo', price: 1500, type: 'boost', duration: '24h', image: '🌟', description: 'x2 XP + x2 Patates pendant 24h', boostType: 'super_combo', durationMs: 24 * 60 * 60 * 1000, multiplier: 2 },
  ]);

  // Charger les données au montage
  useEffect(() => {
    if (supabaseUser) {
      loadUserData(supabaseUser.id);
    }
  }, [supabaseUser]);

  const loadUserData = async (userId) => {
    try {
      // Charger le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUser({
          pseudo: profile.pseudo || '',
          email: profile.email || '',
          avatar: profile.avatar || '🎮',
          avatarBg: profile.avatar_bg || 'from-slate-500 to-slate-700',
          level: profile.level || 1,
          xp: profile.xp || 0,
          xpToNext: profile.xp_to_next || 100,
          potatoes: profile.potatoes || 20,
          pqSeason: profile.pq_season || 0,
          pqTotal: profile.pq_total || 0,
          tasksCompleted: profile.tasks_completed || 0,
          customTitle: profile.custom_title || '',
        });
        
        // Charger les items possédés et équipés
        if (profile.owned_items) {
          setOwnedItems(profile.owned_items);
        }
        if (profile.equipped_items) {
          setEquippedItems(profile.equipped_items);
        }
      }

      // Charger les coffres
      const { data: chestsData } = await supabase
        .from('chests')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (chestsData) {
        setChests({
          bronze: chestsData.bronze || 0,
          silver: chestsData.silver || 0,
          gold: chestsData.gold || 0,
          legendary: chestsData.legendary || 0,
        });
      }

      // Charger les tâches
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tasksData) {
        setTasks(tasksData.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          duration: t.duration,
          date: t.date ? new Date(t.date) : null,
          category: t.category,
          completed: t.completed,
          tags: t.tags || [],
          recurrence: t.recurrence || 'none',
          recurrenceDays: t.recurrence_days || [],
          notes: t.notes || '',
          photos: t.photos || [],
        })));
      }

      // Charger les événements
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (eventsData) {
        setEvents(eventsData.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description || '',
          date: e.date ? new Date(e.date) : null,
          time: e.time || '',
          duration: e.duration || '1h-2h',
          location: e.location || '',
          participants: e.participants || [],
          reminder: e.reminder || 'none',
          completed: e.completed || false,
          createdAt: e.created_at,
        })));
      }

      // Charger les amis (depuis la table friends)
      const { data: friendsData } = await supabase
        .from('friends')
        .select('friend_pseudo')
        .eq('user_pseudo', profile?.pseudo);

      if (friendsData && friendsData.length > 0) {
        // Récupérer les profils des amis avec leurs items
        const friendPseudos = friendsData.map(f => f.friend_pseudo);
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('pseudo, avatar, avatar_bg, level, pq_season, owned_items, custom_title')
          .in('pseudo', friendPseudos);

        if (friendProfiles) {
          setFriends(friendProfiles.map(f => ({
            pseudo: f.pseudo,
            avatar: f.avatar || '😀',
            avatarBg: f.avatar_bg || 'from-indigo-400 to-purple-500',
            level: f.level || 1,
            pqSeason: f.pq_season || 0,
            ownedItems: f.owned_items || [],
            customTitle: f.custom_title || '',
          })));
        }
      }

      // Charger les demandes d'amis reçues
      const { data: requestsData } = await supabase
        .from('friend_requests')
        .select('from_user')
        .eq('to_user', profile?.pseudo)
        .eq('status', 'pending');

      if (requestsData && requestsData.length > 0) {
        const requestPseudos = requestsData.map(r => r.from_user);
        const { data: requestProfiles } = await supabase
          .from('profiles')
          .select('pseudo, avatar, level, pq_season')
          .in('pseudo', requestPseudos);

        if (requestProfiles) {
          setFriendRequests(requestProfiles.map(p => ({
            pseudo: p.pseudo,
            avatar: p.avatar || '😀',
            level: p.level || 1,
            pqSeason: p.pq_season || 0,
          })));
        }
      }

      // Charger les missions
      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*');

      if (missionsError) {
        console.error('Erreur chargement missions:', missionsError);
      }

      if (missionsData) {
        // Filtrer les missions où l'utilisateur est participant
        const userMissions = missionsData.filter(m => 
          m.participant_pseudos?.includes(profile?.pseudo) || m.created_by === profile?.pseudo
        );
        setMissions(userMissions.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description || '',
          participants: m.participants || [],
          quests: m.quests || [],
          createdBy: m.created_by,
        })));

        // Vérifier et débloquer les badges selon les stats actuelles
        if (profile) {
          const userStats = {
            tasksCompleted: profile.tasks_completed || 0,
            level: profile.level || 1,
            totalPotatoes: profile.potatoes || 0,
            friendsCount: 0, // Sera mis à jour plus tard
            missionsCreated: userMissions.filter(m => m.created_by === profile.pseudo).length,
            missionsParticipated: userMissions.length,
          };
          
          // Débloquer les badges sans animation (chargement initial)
          setBadges(prevBadges => {
            return prevBadges.map(badge => {
              let statValue = 0;
              switch (badge.stat) {
                case 'tasksCompleted': statValue = userStats.tasksCompleted; break;
                case 'level': statValue = userStats.level; break;
                case 'totalPotatoes': statValue = userStats.totalPotatoes; break;
                case 'missionsCreated': statValue = userStats.missionsCreated; break;
                case 'missionsParticipated': statValue = userStats.missionsParticipated; break;
                default: statValue = 0;
              }
              
              return {
                ...badge,
                bronze: badge.bronze || statValue >= badge.thresholds.bronze,
                silver: badge.silver || statValue >= badge.thresholds.silver,
                gold: badge.gold || statValue >= badge.thresholds.gold,
              };
            });
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  // Sauvegarder un ami
  const saveFriend = async (userPseudo, friendPseudo) => {
    if (!supabaseUser) return;
    
    try {
      // Créer la relation dans les deux sens
      await supabase.from('friends').insert([
        { user_pseudo: userPseudo, friend_pseudo: friendPseudo },
        { user_pseudo: friendPseudo, friend_pseudo: userPseudo }
      ]);
    } catch (error) {
      console.error('Erreur sauvegarde ami:', error);
    }
  };

  // Supprimer un ami
  const deleteFriend = async (userPseudo, friendPseudo) => {
    if (!supabaseUser) return;
    
    try {
      // Supprimer la relation dans les deux sens
      await supabase
        .from('friends')
        .delete()
        .eq('user_pseudo', userPseudo)
        .eq('friend_pseudo', friendPseudo);
      
      await supabase
        .from('friends')
        .delete()
        .eq('user_pseudo', friendPseudo)
        .eq('friend_pseudo', userPseudo);
        
      console.log(`Ami supprimé: ${friendPseudo}`);
    } catch (error) {
      console.error('Erreur suppression ami:', error);
    }
  };

  // Sauvegarder une mission
  const saveMission = async (mission) => {
    if (!supabaseUser) {
      console.log('saveMission: pas de supabaseUser');
      return;
    }
    
    try {
      const participantPseudos = mission.participants?.map(p => p.pseudo) || [];
      
      const missionData = {
        id: mission.id,
        title: mission.title,
        description: mission.description || '',
        participants: mission.participants || [],
        participant_pseudos: participantPseudos,
        quests: mission.quests || [],
        created_by: mission.createdBy,
        updated_at: new Date().toISOString(),
      };
      
      console.log('Sauvegarde mission:', missionData);
      
      const { data, error } = await supabase
        .from('missions')
        .upsert(missionData, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.error('Erreur Supabase saveMission:', error);
      } else {
        console.log('Mission sauvegardée:', data);
      }
    } catch (error) {
      console.error('Erreur sauvegarde mission:', error);
    }
  };

  // Supprimer une mission
  const deleteMission = async (missionId) => {
    if (!supabaseUser) return;
    
    try {
      const { error } = await supabase.from('missions').delete().eq('id', missionId);
      if (error) {
        console.error('Erreur Supabase deleteMission:', error);
      }
    } catch (error) {
      console.error('Erreur suppression mission:', error);
    }
  };

  // Sauvegarder un événement
  const saveEvent = async (event) => {
    if (!supabaseUser) return;
    
    try {
      const eventData = {
        id: event.id,
        user_id: supabaseUser.id,
        title: event.title,
        description: event.description || '',
        date: event.date instanceof Date ? event.date.toISOString() : event.date,
        time: event.time || '',
        duration: event.duration || '1h-2h',
        location: event.location || '',
        participants: event.participants || [],
        reminder: event.reminder || 'none',
        completed: event.completed || false,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('events')
        .upsert(eventData, { onConflict: 'id' });
      
      if (error) {
        console.error('Erreur Supabase saveEvent:', error);
      }
    } catch (error) {
      console.error('Erreur sauvegarde événement:', error);
    }
  };

  // Supprimer un événement
  const deleteEvent = async (eventId) => {
    if (!supabaseUser) return;
    
    try {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) {
        console.error('Erreur Supabase deleteEvent:', error);
      }
    } catch (error) {
      console.error('Erreur suppression événement:', error);
    }
  };

  // Sauvegarder le profil
  const saveProfile = async (newUserData) => {
    if (!supabaseUser) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          pseudo: newUserData.pseudo,
          avatar: newUserData.avatar,
          avatar_bg: newUserData.avatarBg,
          level: newUserData.level,
          xp: newUserData.xp,
          xp_to_next: newUserData.xpToNext,
          potatoes: newUserData.potatoes,
          pq_season: newUserData.pqSeason,
          pq_total: newUserData.pqTotal,
          tasks_completed: newUserData.tasksCompleted,
          custom_title: newUserData.customTitle || '',
        })
        .eq('id', supabaseUser.id);
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
    }
  };

  // Sauvegarder les items possédés
  const saveOwnedItems = async (items) => {
    if (!supabaseUser) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          owned_items: items,
        })
        .eq('id', supabaseUser.id);
    } catch (error) {
      console.error('Erreur sauvegarde owned_items:', error);
    }
  };

  // Sauvegarder les items équipés
  const saveEquippedItems = async (items) => {
    if (!supabaseUser) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          equipped_items: items,
        })
        .eq('id', supabaseUser.id);
    } catch (error) {
      console.error('Erreur sauvegarde equipped_items:', error);
    }
  };

  // Sauvegarder les coffres
  const saveChests = async (newChests) => {
    if (!supabaseUser) return;
    
    try {
      await supabase
        .from('chests')
        .update({
          bronze: newChests.bronze,
          silver: newChests.silver,
          gold: newChests.gold,
          legendary: newChests.legendary,
        })
        .eq('user_id', supabaseUser.id);
    } catch (error) {
      console.error('Erreur sauvegarde coffres:', error);
    }
  };

  // Mettre à jour l'utilisateur et sauvegarder
  const updateUser = async (newUserData) => {
    const oldPseudo = user.pseudo;
    const newPseudo = newUserData.pseudo;
    
    // Créer un nouvel objet pour forcer le re-render
    setUser({ ...newUserData });
    await saveProfile(newUserData);
    
    // Si le pseudo a changé, mettre à jour partout
    if (oldPseudo && newPseudo && oldPseudo !== newPseudo) {
      await updatePseudoEverywhere(oldPseudo, newPseudo);
    }
  };

  // Mettre à jour le pseudo dans toutes les tables
  const updatePseudoEverywhere = async (oldPseudo, newPseudo) => {
    if (!supabaseUser) return;
    
    try {
      console.log(`Mise à jour pseudo: ${oldPseudo} → ${newPseudo}`);
      
      // 1. Mettre à jour friends (user_pseudo)
      await supabase
        .from('friends')
        .update({ user_pseudo: newPseudo })
        .eq('user_pseudo', oldPseudo);
      
      // 2. Mettre à jour friends (friend_pseudo) - quand d'autres nous ont en ami
      await supabase
        .from('friends')
        .update({ friend_pseudo: newPseudo })
        .eq('friend_pseudo', oldPseudo);
      
      // 3. Mettre à jour friend_requests (from_user)
      await supabase
        .from('friend_requests')
        .update({ from_user: newPseudo })
        .eq('from_user', oldPseudo);
      
      // 4. Mettre à jour friend_requests (to_user)
      await supabase
        .from('friend_requests')
        .update({ to_user: newPseudo })
        .eq('to_user', oldPseudo);
      
      // 5. Mettre à jour missions (created_by)
      await supabase
        .from('missions')
        .update({ created_by: newPseudo })
        .eq('created_by', oldPseudo);
      
      // 6. Mettre à jour missions (participant_pseudos et participants)
      // Récupérer toutes les missions où l'utilisateur est participant
      const { data: missionsWithUser } = await supabase
        .from('missions')
        .select('*')
        .contains('participant_pseudos', [oldPseudo]);
      
      if (missionsWithUser) {
        for (const mission of missionsWithUser) {
          // Mettre à jour participant_pseudos
          const newParticipantPseudos = mission.participant_pseudos.map(p => 
            p === oldPseudo ? newPseudo : p
          );
          
          // Mettre à jour participants (array d'objets avec pseudo)
          const newParticipants = (mission.participants || []).map(p => 
            p.pseudo === oldPseudo ? { ...p, pseudo: newPseudo } : p
          );
          
          // Mettre à jour les quests (assignedTo, completedBy)
          const newQuests = (mission.quests || []).map(q => ({
            ...q,
            assignedTo: q.assignedTo === oldPseudo ? newPseudo : q.assignedTo,
            completedBy: q.completedBy === oldPseudo ? newPseudo : q.completedBy,
          }));
          
          await supabase
            .from('missions')
            .update({
              participant_pseudos: newParticipantPseudos,
              participants: newParticipants,
              quests: newQuests,
            })
            .eq('id', mission.id);
        }
      }
      
      console.log('Pseudo mis à jour partout avec succès');
    } catch (error) {
      console.error('Erreur mise à jour pseudo:', error);
    }
  };

  // Mettre à jour les coffres et sauvegarder
  const updateChests = (newChests) => {
    setChests(newChests);
    saveChests(newChests);
  };

  // Activer un boost temporaire
  const activateBoost = (boost) => {
    if (boost.instant) {
      // Boost instantané - pas besoin de stocker
      return;
    }
    
    const newBoost = {
      id: Date.now(),
      type: boost.boostType,
      multiplier: boost.multiplier,
      expiresAt: new Date(Date.now() + boost.durationMs).toISOString(),
      name: boost.name,
      image: boost.image,
    };
    
    setActiveBoosts(prev => [...prev, newBoost]);
  };

  // Vérifier et nettoyer les boosts expirés
  const cleanExpiredBoosts = () => {
    const now = new Date();
    setActiveBoosts(prev => prev.filter(b => new Date(b.expiresAt) > now));
  };

  // Obtenir le multiplicateur XP actif
  const getXpMultiplier = () => {
    cleanExpiredBoosts();
    const now = new Date();
    // Chercher xp_x2, xp_x3 ou super_combo
    const xpBoost = activeBoosts.find(b => 
      (b.type === 'xp_x2' || b.type === 'xp_x3' || b.type === 'super_combo') && 
      new Date(b.expiresAt) > now
    );
    return xpBoost ? xpBoost.multiplier : 1;
  };

  // Obtenir le multiplicateur Patates actif
  const getPotatoesMultiplier = () => {
    cleanExpiredBoosts();
    const now = new Date();
    // Chercher potatoes_x2 ou super_combo
    const potatoBoost = activeBoosts.find(b => 
      (b.type === 'potatoes_x2' || b.type === 'super_combo') && 
      new Date(b.expiresAt) > now
    );
    return potatoBoost ? potatoBoost.multiplier : 1;
  };

  // Changer le thème couleur
  const setColorTheme = (color) => {
    setTheme(prev => ({ ...prev, colorTheme: color }));
  };

  // Activer/désactiver le mode sombre
  const toggleDarkMode = (enabled) => {
    setTheme(prev => ({ ...prev, darkMode: enabled }));
  };

  // Toggle une amélioration (activer/désactiver)
  const toggleUpgrade = (itemId, shopItemsList = []) => {
    // Trouver l'item pour savoir si c'est un thème
    const item = shopItemsList.find(s => s.id === itemId);
    
    setActiveUpgrades(prev => {
      const isCurrentlyActive = prev[itemId] !== false;
      let newState = { ...prev };
      
      if (item?.themeColor) {
        // C'est un thème de couleur
        if (isCurrentlyActive) {
          // Désactiver ce thème
          newState[itemId] = false;
          setColorTheme('default');
        } else {
          // Activer ce thème et désactiver les autres thèmes
          const themeIds = [73, 74, 75, 76]; // IDs des thèmes
          themeIds.forEach(id => {
            newState[id] = id === itemId ? true : false;
          });
          setColorTheme(item.themeColor);
        }
      } else if (item?.isDarkMode) {
        // C'est le mode sombre (id: 78)
        if (isCurrentlyActive) {
          newState[itemId] = false;
          toggleDarkMode(false);
        } else {
          newState[itemId] = true;
          toggleDarkMode(true);
        }
      } else {
        // Amélioration normale
        newState[itemId] = isCurrentlyActive ? false : true;
      }
      
      localStorage.setItem('todogame_activeUpgrades', JSON.stringify(newState));
      return newState;
    });
  };

  // Vérifier si une amélioration est active
  const isUpgradeActive = (itemId) => {
    return activeUpgrades[itemId] !== false; // Actif par défaut si pas défini
  };

  // Vérifier et débloquer les badges
  const checkBadges = (stats) => {
    setBadges(prevBadges => {
      let updated = false;
      const newBadges = prevBadges.map(badge => {
        let statValue = 0;
        
        switch (badge.stat) {
          case 'tasksCompleted':
            statValue = stats.tasksCompleted || 0;
            break;
          case 'level':
            statValue = stats.level || 1;
            break;
          case 'totalPotatoes':
            statValue = stats.totalPotatoes || 0;
            break;
          case 'chestsOpened':
            statValue = stats.chestsOpened || 0;
            break;
          case 'friendsCount':
            statValue = stats.friendsCount || 0;
            break;
          case 'missionsCreated':
            statValue = stats.missionsCreated || 0;
            break;
          case 'missionsParticipated':
            statValue = stats.missionsParticipated || 0;
            break;
          case 'streak':
            statValue = stats.bestStreak || 0;
            break;
          case 'urgentCompleted':
            statValue = stats.urgentCompleted || 0;
            break;
          case 'longQuests':
            statValue = stats.longQuests || 0;
            break;
          case 'totalSpent':
            statValue = stats.totalSpent || 0;
            break;
          case 'questsCreated':
            statValue = stats.questsCreated || 0;
            break;
          default:
            statValue = 0;
        }

        const newBadge = { ...badge };
        const unlockedTiers = [];
        
        if (!badge.bronze && statValue >= badge.thresholds.bronze) {
          newBadge.bronze = true;
          updated = true;
          unlockedTiers.push({ ...newBadge, unlockedTier: 'bronze' });
        }
        if (!badge.silver && statValue >= badge.thresholds.silver) {
          newBadge.silver = true;
          updated = true;
          unlockedTiers.push({ ...newBadge, unlockedTier: 'silver' });
        }
        if (!badge.gold && statValue >= badge.thresholds.gold) {
          newBadge.gold = true;
          updated = true;
          unlockedTiers.push({ ...newBadge, unlockedTier: 'gold' });
        }
        
        if (unlockedTiers.length > 0) {
          newlyUnlocked.push(...unlockedTiers);
        }
        
        return newBadge;
      });
      
      if (updated) {
        return { badges: newBadges, unlocked: newlyUnlocked };
      }
      return { badges: prevBadges, unlocked: [] };
    });
  };

  // Wrapper pour checkBadges qui met à jour le state et retourne les débloqués
  const checkAndUpdateBadges = (stats) => {
    let unlockedBadges = [];
    setBadges(prevBadges => {
      let updated = false;
      const newlyUnlocked = [];
      const newBadges = prevBadges.map(badge => {
        let statValue = 0;
        
        switch (badge.stat) {
          case 'tasksCompleted':
            statValue = stats.tasksCompleted || 0;
            break;
          case 'level':
            statValue = stats.level || 1;
            break;
          case 'totalPotatoes':
            statValue = stats.totalPotatoes || 0;
            break;
          case 'chestsOpened':
            statValue = stats.chestsOpened || 0;
            break;
          case 'friendsCount':
            statValue = stats.friendsCount || 0;
            break;
          case 'missionsCreated':
            statValue = stats.missionsCreated || 0;
            break;
          case 'missionsParticipated':
            statValue = stats.missionsParticipated || 0;
            break;
          case 'streak':
            statValue = stats.bestStreak || 0;
            break;
          case 'urgentCompleted':
            statValue = stats.urgentCompleted || 0;
            break;
          case 'longQuests':
            statValue = stats.longQuests || 0;
            break;
          case 'totalSpent':
            statValue = stats.totalSpent || 0;
            break;
          case 'questsCreated':
            statValue = stats.questsCreated || 0;
            break;
          default:
            statValue = 0;
        }

        const newBadge = { ...badge };
        
        if (!badge.bronze && statValue >= badge.thresholds.bronze) {
          newBadge.bronze = true;
          updated = true;
          newlyUnlocked.push({ ...newBadge, unlockedTier: 'bronze' });
        }
        if (!badge.silver && statValue >= badge.thresholds.silver) {
          newBadge.silver = true;
          updated = true;
          newlyUnlocked.push({ ...newBadge, unlockedTier: 'silver' });
        }
        if (!badge.gold && statValue >= badge.thresholds.gold) {
          newBadge.gold = true;
          updated = true;
          newlyUnlocked.push({ ...newBadge, unlockedTier: 'gold' });
        }
        
        return newBadge;
      });
      
      unlockedBadges = newlyUnlocked;
      return updated ? newBadges : prevBadges;
    });
    
    return unlockedBadges;
  };

  // Vérifier si un pseudo est disponible
  const checkPseudoAvailable = async (newPseudo) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('pseudo')
      .eq('pseudo', newPseudo.toLowerCase())
      .single();
    
    // Si pas de données, le pseudo est disponible
    return !data;
  };

  return {
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
    setBadges,
    checkBadges,
    checkAndUpdateBadges,
    shopItems,
    loadUserData,
    saveProfile,
    saveChests,
    saveOwnedItems,
    saveEquippedItems,
    saveFriend,
    deleteFriend,
    saveMission,
    deleteMission,
    saveEvent,
    deleteEvent,
    checkPseudoAvailable,
    // Thème
    theme,
    setTheme,
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
  };
};
