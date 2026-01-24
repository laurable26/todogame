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
    eventsCompleted: 0,
    // Stats pour les badges
    totalPotatoes: 0,
    totalSpent: 0,
    chestsOpened: 0,
    urgentCompleted: 0,
    scheduledCompleted: 0,
    sharedTasksCompleted: 0,
    currentStreak: 0,
    bestStreak: 0,
    journalEntries: 0,
    habitsCompleted: 0,
    riddlesSolved: 0,
    chifoumiPlayed: 0,
    chifoumiWins: 0,
    itemsBought: 0,
    lastActiveDate: null,
    createdAt: null,
  });

  const [chests, setChests] = useState({
    keys: 0,
    superChestCounter: 0, // Compteur caché pour le super coffre (reset après 10-15)
  });

  const [tasks, setTasks] = useState([]);
  // events est maintenant dérivé de tasks (ceux avec time)
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
  
  // Thème et préférences - avec persistance localStorage
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('todogame_theme');
    return saved ? JSON.parse(saved) : {
      darkMode: false,
      colorTheme: 'default', // 'default', 'rose', 'vert', 'bleu', 'violet'
    };
  });
  
  // Sauvegarder le thème dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('todogame_theme', JSON.stringify(theme));
  }, [theme]);
  
  // Boosts actifs (avec date d'expiration)
  const [activeBoosts, setActiveBoosts] = useState([]);
  // Format: { id: 1, type: 'xp_x2', expiresAt: Date, multiplier: 2 }

  const [badges, setBadges] = useState([
    // Solo - Progression personnelle
    { id: 1, name: 'Premier Pas', description: 'Complète des tâches', emoji: '👣', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: 'Complète 1 tâche', silver: 'Complète 50 tâches', gold: 'Complète 500 tâches' }, thresholds: { bronze: 1, silver: 50, gold: 500 }, stat: 'tasksCompleted' },
    { id: 2, name: 'Régularité', description: 'Garde ton streak actif', emoji: '🔥', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '7 jours d\'affilée', silver: '30 jours d\'affilée', gold: '100 jours d\'affilée' }, thresholds: { bronze: 7, silver: 30, gold: 100 }, stat: 'currentStreak' },
    { id: 6, name: 'Ascension', description: 'Monte en niveau', emoji: '⬆️', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: 'Atteins niveau 10', silver: 'Atteins niveau 50', gold: 'Atteins niveau 100' }, thresholds: { bronze: 10, silver: 50, gold: 100 }, stat: 'level' },
    { id: 10, name: 'Perfectionniste', description: 'Tâches urgentes complétées', emoji: '⚡', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '10 tâches urgentes', silver: '50 tâches urgentes', gold: '200 tâches urgentes' }, thresholds: { bronze: 10, silver: 50, gold: 200 }, stat: 'urgentCompleted' },
    { id: 11, name: 'Ponctuel', description: 'Tâches avec heure complétées', emoji: '⏰', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '10 tâches planifiées', silver: '50 tâches planifiées', gold: '200 tâches planifiées' }, thresholds: { bronze: 10, silver: 50, gold: 200 }, stat: 'scheduledCompleted' },
    { id: 16, name: 'Journaliste', description: 'Remplis ton journal', emoji: '🦋', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '7 entrées journal', silver: '30 entrées journal', gold: '100 entrées journal' }, thresholds: { bronze: 7, silver: 30, gold: 100 }, stat: 'journalEntries' },
    { id: 17, name: 'Habitué', description: 'Complète tes habitudes', emoji: '🎯', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '20 habitudes', silver: '100 habitudes', gold: '500 habitudes' }, thresholds: { bronze: 20, silver: 100, gold: 500 }, stat: 'habitsCompleted' },
    { id: 18, name: 'Énigmatique', description: 'Résous des énigmes', emoji: '🧩', bronze: false, silver: false, gold: false, category: 'solo', requirements: { bronze: '10 énigmes', silver: '50 énigmes', gold: '200 énigmes' }, thresholds: { bronze: 10, silver: 50, gold: 200 }, stat: 'riddlesSolved' },
    
    // Social - Partage et amis
    { id: 3, name: 'Équipier', description: 'Tâches partagées complétées', emoji: '🤝', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: '5 tâches partagées', silver: '25 tâches partagées', gold: '100 tâches partagées' }, thresholds: { bronze: 5, silver: 25, gold: 100 }, stat: 'sharedTasksCompleted' },
    { id: 8, name: 'Social', description: 'Ajoute des amis', emoji: '👥', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: '3 amis', silver: '10 amis', gold: '25 amis' }, thresholds: { bronze: 3, silver: 10, gold: 25 }, stat: 'friendsCount' },
    { id: 19, name: 'Duelliste', description: 'Joue au Chifoumi', emoji: '⚔️', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: '5 parties', silver: '25 parties', gold: '100 parties' }, thresholds: { bronze: 5, silver: 25, gold: 100 }, stat: 'chifoumiPlayed' },
    { id: 20, name: 'Champion', description: 'Gagne au Chifoumi', emoji: '🏆', bronze: false, silver: false, gold: false, category: 'quests', requirements: { bronze: '3 victoires', silver: '15 victoires', gold: '50 victoires' }, thresholds: { bronze: 3, silver: 15, gold: 50 }, stat: 'chifoumiWins' },
    
    // Collection - Richesse et coffres
    { id: 4, name: 'Collectionneur', description: 'Ouvre des coffres', emoji: '📦', bronze: false, silver: false, gold: false, category: 'collection', requirements: { bronze: '5 coffres', silver: '25 coffres', gold: '100 coffres' }, thresholds: { bronze: 5, silver: 25, gold: 100 }, stat: 'chestsOpened' },
    { id: 5, name: 'Fortune', description: 'Accumule des patates', emoji: '🥔', bronze: false, silver: false, gold: false, category: 'collection', requirements: { bronze: '1 000 patates', silver: '10 000 patates', gold: '100 000 patates' }, thresholds: { bronze: 1000, silver: 10000, gold: 100000 }, stat: 'totalPotatoes' },
    { id: 14, name: 'Dépensier', description: 'Dépense des patates', emoji: '💎', bronze: false, silver: false, gold: false, category: 'collection', requirements: { bronze: '500 patates', silver: '5 000 patates', gold: '50 000 patates' }, thresholds: { bronze: 500, silver: 5000, gold: 50000 }, stat: 'totalSpent' },
    { id: 21, name: 'Shoppeur', description: 'Achète des items', emoji: '🛒', bronze: false, silver: false, gold: false, category: 'collection', requirements: { bronze: '5 items', silver: '15 items', gold: '30 items' }, thresholds: { bronze: 5, silver: 15, gold: 30 }, stat: 'itemsBought' },
  ]);

  const [shopItems] = useState([
    // Avatars - débloqués par niveau (24 avatars)
    { id: 21, name: 'Chat', type: 'avatar', image: '🐱', requiredLevel: 1 },
    { id: 22, name: 'Chien', type: 'avatar', image: '🐶', requiredLevel: 1 },
    { id: 23, name: 'Lapin', type: 'avatar', image: '🐰', requiredLevel: 5 },
    { id: 24, name: 'Panda', type: 'avatar', image: '🐼', requiredLevel: 8 },
    { id: 25, name: 'Renard', type: 'avatar', image: '🦊', requiredLevel: 12 },
    { id: 26, name: 'Lion', type: 'avatar', image: '🦁', requiredLevel: 15 },
    { id: 27, name: 'Guerrier', type: 'avatar', image: '⚔️', requiredLevel: 20 },
    { id: 28, name: 'Mage', type: 'avatar', image: '🧙', requiredLevel: 25 },
    { id: 29, name: 'Fantôme', type: 'avatar', image: '👻', requiredLevel: 30 },
    { id: 30, name: 'Citrouille', type: 'avatar', image: '🎃', requiredLevel: 35 },
    { id: 31, name: 'Danseuse', type: 'avatar', image: '💃', requiredLevel: 40 },
    { id: 32, name: 'Épéiste', type: 'avatar', image: '🤺', requiredLevel: 45 },
    { id: 33, name: 'Pirate', type: 'avatar', image: '🏴‍☠️', requiredLevel: 50 },
    { id: 34, name: 'Cowboy', type: 'avatar', image: '🤠', requiredLevel: 55 },
    { id: 35, name: 'Robot', type: 'avatar', image: '🤖', requiredLevel: 60 },
    { id: 36, name: 'Extraterrestre', type: 'avatar', image: '👾', requiredLevel: 65 },
    { id: 37, name: 'Astronaute', type: 'avatar', image: '👨‍🚀', requiredLevel: 70 },
    { id: 38, name: 'Alien', type: 'avatar', image: '👽', requiredLevel: 80 },
    { id: 39, name: 'Sirène', type: 'avatar', image: '🧜‍♀️', requiredLevel: 90 },
    { id: 40, name: 'Licorne', type: 'avatar', image: '🦄', requiredLevel: 100 },
    { id: 41, name: 'Fée', type: 'avatar', image: '🧚', requiredLevel: 120 },
    { id: 42, name: 'Roi', type: 'avatar', image: '👑', requiredLevel: 150 },
    { id: 43, name: 'Dragon', type: 'avatar', image: '🐉', requiredLevel: 200 },
    { id: 44, name: 'Phoenix', type: 'avatar', image: '🔥', requiredLevel: 250 },
    // Fonds - débloqués par niveau (16 fonds)
    { id: 50, name: 'Océan', type: 'fond', image: '🌊', colors: 'from-blue-400 to-cyan-500', requiredLevel: 1 },
    { id: 51, name: 'Prairie', type: 'fond', image: '🌿', colors: 'from-green-400 to-lime-500', requiredLevel: 1 },
    { id: 52, name: 'Forêt', type: 'fond', image: '🌲', colors: 'from-green-600 to-emerald-700', requiredLevel: 10 },
    { id: 53, name: 'Ciel', type: 'fond', image: '☁️', colors: 'from-sky-300 to-blue-400', requiredLevel: 15 },
    { id: 54, name: 'Coucher de soleil', type: 'fond', image: '🌅', colors: 'from-orange-400 to-pink-500', requiredLevel: 25 },
    { id: 55, name: 'Aurore', type: 'fond', image: '🌄', colors: 'from-pink-400 to-orange-400', requiredLevel: 35 },
    { id: 56, name: 'Nuit', type: 'fond', image: '🌙', colors: 'from-slate-700 to-slate-900', requiredLevel: 45 },
    { id: 57, name: 'Minuit', type: 'fond', image: '🌑', colors: 'from-indigo-900 to-slate-900', requiredLevel: 55 },
    { id: 58, name: 'Feu', type: 'fond', image: '🔥', colors: 'from-red-500 to-orange-500', requiredLevel: 65 },
    { id: 59, name: 'Lave', type: 'fond', image: '🌋', colors: 'from-red-600 to-yellow-500', requiredLevel: 80 },
    { id: 60, name: 'Galaxie', type: 'fond', image: '🌌', colors: 'from-purple-600 to-indigo-800', requiredLevel: 100 },
    { id: 61, name: 'Nébuleuse', type: 'fond', image: '✨', colors: 'from-purple-500 to-pink-600', requiredLevel: 120 },
    { id: 62, name: 'Or', type: 'fond', image: '🏆', colors: 'from-yellow-400 to-amber-500', requiredLevel: 150 },
    { id: 63, name: 'Argent', type: 'fond', image: '🥈', colors: 'from-slate-300 to-slate-500', requiredLevel: 130 },
    { id: 64, name: 'Arc-en-ciel', type: 'fond', image: '🌈', colors: 'from-red-500 via-yellow-500 to-blue-500', requiredLevel: 180 },
    { id: 65, name: 'Aurore Boréale', type: 'fond', image: '🌠', colors: 'from-green-400 via-blue-500 to-purple-600', requiredLevel: 200 },
    // Avatars EXCLUSIFS COFFRES (non affichés en boutique, obtenus uniquement via coffres)
    { id: 101, name: 'Kraken', type: 'avatar', image: '🦑', chestExclusive: true },
    { id: 102, name: 'Scorpion', type: 'avatar', image: '🦂', chestExclusive: true },
    { id: 103, name: 'Araignée', type: 'avatar', image: '🕷️', chestExclusive: true },
    { id: 104, name: 'Chauve-souris', type: 'avatar', image: '🦇', chestExclusive: true },
    { id: 105, name: 'Hibou', type: 'avatar', image: '🦉', chestExclusive: true },
    { id: 106, name: 'Paon', type: 'avatar', image: '🦚', chestExclusive: true },
    { id: 107, name: 'Flamant', type: 'avatar', image: '🦩', chestExclusive: true },
    { id: 108, name: 'Perroquet', type: 'avatar', image: '🦜', chestExclusive: true },
    { id: 109, name: 'Dauphin', type: 'avatar', image: '🐬', chestExclusive: true },
    { id: 110, name: 'Requin', type: 'avatar', image: '🦈', chestExclusive: true },
    // Fonds EXCLUSIFS COFFRES
    { id: 111, name: 'Orage', type: 'fond', image: '⛈️', colors: 'from-slate-800 via-purple-900 to-slate-900', chestExclusive: true },
    { id: 112, name: 'Jungle', type: 'fond', image: '🌴', colors: 'from-green-700 via-emerald-600 to-lime-500', chestExclusive: true },
    { id: 113, name: 'Désert', type: 'fond', image: '🏜️', colors: 'from-yellow-600 via-orange-500 to-amber-400', chestExclusive: true },
    { id: 114, name: 'Glace', type: 'fond', image: '🧊', colors: 'from-cyan-300 via-blue-200 to-white', chestExclusive: true },
    { id: 115, name: 'Néon', type: 'fond', image: '💡', colors: 'from-pink-500 via-purple-500 to-cyan-500', chestExclusive: true },
    { id: 116, name: 'Bonbon', type: 'fond', image: '🍭', colors: 'from-pink-400 via-rose-300 to-fuchsia-400', chestExclusive: true },
    { id: 117, name: 'Océan Profond', type: 'fond', image: '🐋', colors: 'from-blue-900 via-indigo-800 to-slate-900', chestExclusive: true },
    { id: 118, name: 'Volcan', type: 'fond', image: '🌋', colors: 'from-red-700 via-orange-600 to-yellow-500', chestExclusive: true },
    { id: 119, name: 'Étoiles', type: 'fond', image: '⭐', colors: 'from-indigo-900 via-purple-800 to-pink-700', chestExclusive: true },
    { id: 120, name: 'Printemps', type: 'fond', image: '🌸', colors: 'from-pink-300 via-rose-200 to-green-300', chestExclusive: true },
    // Améliorations - triées par prix croissant
    { id: 90, name: 'Oracle du Jour', price: 200, type: 'amelioration', image: '✦', description: 'Oracle quotidien avec cartes à choisir', isDailyQuote: true },
    { id: 72, name: 'Notes Étendues', price: 300, type: 'amelioration', image: '📝', description: 'Notes plus longues sur les quêtes', isExtendedNotes: true },
    { id: 87, name: 'Énigmes Faciles', price: 300, type: 'amelioration', image: '🧩', description: 'Énigme quotidienne niveau facile (+25 XP)', riddleLevel: 1 },
    { id: 73, name: 'Thème Rose', price: 400, type: 'amelioration', image: '💗', description: 'Change les couleurs en rose', themeColor: 'rose' },
    { id: 74, name: 'Thème Vert', price: 400, type: 'amelioration', image: '💚', description: 'Change les couleurs en vert', themeColor: 'vert' },
    { id: 75, name: 'Thème Bleu', price: 400, type: 'amelioration', image: '💙', description: 'Change les couleurs en bleu', themeColor: 'bleu' },
    { id: 76, name: 'Thème Violet', price: 400, type: 'amelioration', image: '💜', description: 'Change les couleurs en violet', themeColor: 'violet' },
    { id: 85, name: 'Listes & Checkboxes', price: 400, type: 'amelioration', image: '✅', description: 'Listes à puces et checkboxes dans les notes', isRichTextEditor: true },
    { id: 71, name: 'Bordures Dorées', price: 500, type: 'amelioration', image: '✨', description: 'Bordure dorée sur ton avatar', isGoldenBorder: true },
    { id: 77, name: 'Tri Avancé', price: 600, type: 'amelioration', image: '🔀', description: 'Options de tri supplémentaires', isAdvancedSort: true },
    { id: 86, name: 'Photos Notes', price: 600, type: 'amelioration', image: '📷', description: 'Ajouter des photos dans les notes', isPhotoNotes: true },
    { id: 88, name: 'Énigmes Moyennes', price: 600, type: 'amelioration', image: '🧠', description: 'Énigme quotidienne niveau moyen (+50 XP)', riddleLevel: 2 },
    { id: 84, name: 'Filtre de Tâches', price: 800, type: 'amelioration', image: '🔍', description: 'Filtre par statut et durée', isQuestFilter: true },
    { id: 93, name: 'Tracker d\'Habitudes', price: 800, type: 'amelioration', image: '🎯', description: 'Suis 3 habitudes quotidiennes (+5 XP)', isHabitTracker: true },
    { id: 78, name: 'Mode Sombre', price: 1000, type: 'amelioration', image: '🌙', description: 'Active le thème sombre', isDarkMode: true },
    { id: 89, name: 'Énigmes Difficiles', price: 1000, type: 'amelioration', image: '🎓', description: 'Énigme quotidienne niveau difficile (+100 XP)', riddleLevel: 3 },
    { id: 91, name: 'Journaling', price: 1000, type: 'amelioration', image: '🦋', description: 'Journal quotidien avec bilan hebdomadaire', isJournaling: true },
    { id: 79, name: 'Titre Personnalisé', price: 1500, type: 'amelioration', image: '🏷️', description: 'Affiche un titre sous ton pseudo', isCustomTitle: true },
    { id: 80, name: 'Animations +', price: 2000, type: 'amelioration', image: '💫', description: 'Animations spectaculaires et effets visuels', isAnimations: true },
    { id: 92, name: 'Mode Hors Ligne', price: 2000, type: 'amelioration', image: '📴', description: 'Utilise l\'app sans connexion internet', isOfflineMode: true },
    { id: 81, name: 'Statistiques Pro', price: 2500, type: 'amelioration', image: '📊', description: 'Stats détaillées', unlocksStats: true },
    { id: 82, name: 'Fond Animé', price: 3000, type: 'amelioration', image: '🌠', description: 'Fond avec particules animées', isAnimatedBg: true },
    { id: 83, name: 'Badge VIP', price: 5000, type: 'amelioration', image: '👑', description: 'Badge VIP à côté du pseudo', isVipBadge: true },
    { id: 94, name: 'Coffre-fort', price: 1500, type: 'amelioration', image: '🔐', description: 'Stocke 25 photos secrètes protégées par code PIN', isVault: true },
    { id: 95, name: 'Centre de contrôle', price: 2000, type: 'amelioration', image: '🗂️', description: 'Regroupe toutes les icônes flottantes en un seul bouton', isControlCenter: true },
    { id: 97, name: 'Couleurs de tags', price: 1000, type: 'amelioration', image: '🎨', description: 'Personnalise les couleurs de tes tags pour mieux organiser tes tâches', isTagColors: true },
    // Widget supprimé - nécessite une app native Android
    // Boosts temporaires - consommables (prix élevés car réutilisables)
    { id: 2, name: 'Lucky Chest', price: 150, type: 'boost', duration: 'Instantané', image: '🍀', description: 'Coffre aléatoire (chance de rare)', boostType: 'lucky_chest', instant: true },
    { id: 3, name: 'Coffre Splendide', price: 300, type: 'boost', duration: 'Instantané', image: '🎀', description: 'Reçois un coffre splendide', boostType: 'instant_silver_chest', instant: true },
    { id: 4, name: 'Mini Boost XP', price: 200, type: 'boost', duration: '1h', image: '💫', description: 'Double tes XP pendant 1h', boostType: 'xp_x2', durationMs: 60 * 60 * 1000, multiplier: 2 },
    { id: 5, name: 'Boost Coffre', price: 500, type: 'boost', duration: '24h', image: '📦', description: 'Coffre toutes les 6 quêtes', boostType: 'chest_boost', durationMs: 24 * 60 * 60 * 1000 },
    { id: 6, name: 'Boost XP x2', price: 400, type: 'boost', duration: '24h', image: '⚡', description: 'Double tes XP pendant 24h', boostType: 'xp_x2', durationMs: 24 * 60 * 60 * 1000, multiplier: 2 },
    { id: 7, name: 'Boost Patates x2', price: 400, type: 'boost', duration: '24h', image: '🥔', description: 'Double tes patates pendant 24h', boostType: 'potatoes_x2', durationMs: 24 * 60 * 60 * 1000, multiplier: 2 },
    { id: 8, name: 'Boost Partage', price: 350, type: 'boost', duration: '24h', image: '🤝', description: 'x3 récompenses tâches partagées', boostType: 'share_boost', durationMs: 24 * 60 * 60 * 1000, multiplier: 3 },
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

  // Souscription temps réel pour les missions
  useEffect(() => {
    if (!supabaseUser) return;

    let channel;
    let tasksChannel;
    let profilesChannel;
    
    const setupSubscriptions = () => {
      channel = supabase
        .channel('missions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'missions',
          },
          async (payload) => {
            try {
              // Recharger les missions quand il y a un changement
              const { data: profile } = await supabase
                .from('profiles')
                .select('pseudo')
                .eq('id', supabaseUser.id)
                .single();

              if (profile) {
                const { data: missionsData } = await supabase
                  .from('missions')
                  .select('*');

                if (missionsData) {
                  const userMissions = missionsData.filter(m => 
                    m.participant_pseudos?.includes(profile.pseudo) || m.created_by === profile.pseudo
                  );
                  setMissions(userMissions.map(m => ({
                    id: m.id,
                    title: m.title,
                    description: m.description || '',
                    participants: m.participants || [],
                    quests: m.quests || [],
                    createdBy: m.created_by,
                  })));
                }
              }
            } catch (error) {
              console.error('Erreur subscription missions:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Erreur channel missions, reconnexion...');
            setTimeout(setupSubscriptions, 5000);
          }
        });

    // Souscription pour les tâches (mise à jour des tâches partagées)
      tasksChannel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
          },
          async (payload) => {
            console.log('📥 REALTIME tasks event:', payload.eventType, payload.new?.title || payload.old?.id);
            
            try {
              // Recharger les tâches partagées quand il y a un changement
              const { data: profile } = await supabase
                .from('profiles')
                .select('pseudo')
                .eq('id', supabaseUser.id)
                .single();

              if (profile) {
                console.log('📥 Mon pseudo pour filtrage:', profile.pseudo);
                
                // Charger les tâches propres
                const { data: tasksData } = await supabase
                  .from('tasks')
                  .select('*')
                  .eq('user_id', supabaseUser.id)
                  .order('created_at', { ascending: false });

                // Charger les tâches partagées - DEBUG complet
                const { data: allOtherTasks, error: otherTasksError } = await supabase
                  .from('tasks')
                  .select('*')
                  .neq('user_id', supabaseUser.id);

                if (otherTasksError) {
                  console.error('❌ Erreur chargement tâches autres:', otherTasksError);
                }
                console.log('📥 Tâches des autres utilisateurs:', allOtherTasks?.length, 'Erreur:', otherTasksError);

                const sharedTasksData = (allOtherTasks || []).filter(t => {
                  if (!t.participants || !Array.isArray(t.participants) || t.participants.length === 0) return false;
                  
                  // Trouver ma participation
                  const myParticipation = t.participants.find(p => p.pseudo === profile.pseudo);
                  if (!myParticipation) return false;
                  
                  // Ne PAS inclure si accepted === false (invitation en attente)
                  // Inclure si accepted === true OU si accepted n'existe pas (anciennes tâches)
                  const isAccepted = myParticipation.accepted !== false;
                  
                  if (t.participants.length > 0) {
                    console.log('📥 Vérif tâche:', t.title, '| Mon pseudo:', profile.pseudo, '| Ma participation:', myParticipation, '| Acceptée:', isAccepted);
                  }
                  
                  return isAccepted;
                });

                console.log('📥 Tâches partagées ACCEPTÉES:', sharedTasksData.length, sharedTasksData.map(t => ({ title: t.title, participants: t.participants })));

                const allTasks = [...(tasksData || []), ...sharedTasksData];

                setTasks(allTasks.map(t => ({
                  id: t.id,
                  title: t.title,
                  status: t.status || 'à faire',
                  duration: t.duration,
                  date: t.date ? new Date(t.date) : null,
                  category: t.category,
                  completed: t.completed,
                  tags: t.tags || [],
                  recurrence: t.recurrence || 'none',
                  recurrenceDays: t.recurrence_days || [],
                  notes: t.notes || '',
                  photos: t.photos || [],
                  participants: t.participants || [],
                  ownerId: t.user_id,
                  isSharedWithMe: t.user_id !== supabaseUser.id,
                  // Champs événement (fusion)
                  time: t.time || '',
                  location: t.location || '',
                  reminder: t.reminder || 'none',
                  description: t.description || '',
                  completedBy: t.completed_by || [],
                  missionId: t.mission_id,
                  assignedTo: t.assigned_to,
                })));
              }
            } catch (error) {
              console.error('Erreur subscription tasks:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Erreur channel tasks, reconnexion...');
            setTimeout(setupSubscriptions, 5000);
          }
        });

      // Souscription pour les profils (mise à jour des PQ des amis)
      profilesChannel = supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
          },
          async () => {
            try {
              // Recharger les amis avec leurs PQ mis à jour
              const { data: profile } = await supabase
                .from('profiles')
                .select('pseudo')
                .eq('id', supabaseUser.id)
                .single();

              if (profile) {
                const { data: friendsData } = await supabase
                  .from('friends')
                  .select('friend_pseudo')
                  .eq('user_pseudo', profile.pseudo);

                if (friendsData && friendsData.length > 0) {
                  const friendPseudos = friendsData.map(f => f.friend_pseudo);
                  const { data: friendProfiles } = await supabase
                    .from('profiles')
                    .select('id, pseudo, avatar, avatar_bg, level, pq_season, owned_items, custom_title, potatoes')
                    .in('pseudo', friendPseudos);

                  if (friendProfiles) {
                    setFriends(friendProfiles.map(f => ({
                      odUserId: f.id,
                      pseudo: f.pseudo,
                      avatar: f.avatar || '😀',
                      avatarBg: f.avatar_bg || 'from-indigo-400 to-purple-500',
                      level: f.level || 1,
                      pqSeason: f.pq_season || 0,
                      ownedItems: f.owned_items || [],
                      customTitle: f.custom_title || '',
                      potatoes: f.potatoes || 0,
                    })));
                  }
                }
              }
            } catch (error) {
              console.error('Erreur subscription profiles:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Erreur channel profiles, reconnexion...');
            setTimeout(setupSubscriptions, 5000);
          }
        });
    };
    
    setupSubscriptions();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (tasksChannel) supabase.removeChannel(tasksChannel);
      if (profilesChannel) supabase.removeChannel(profilesChannel);
    };
  }, [supabaseUser]);

  const loadUserData = async (userId, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 10000; // 10 secondes timeout
    
    // Helper pour ajouter un timeout aux requêtes
    const withTimeout = (promise, ms) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), ms)
        )
      ]);
    };
    
    try {
      // Charger le profil avec timeout
      const { data: profile, error: profileError } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        TIMEOUT_MS
      );

      if (profileError) {
        console.error('Erreur profil:', profileError);
        // Si erreur réseau et pas encore max retries, réessayer
        if (retryCount < MAX_RETRIES && (profileError.message?.includes('network') || profileError.message?.includes('fetch'))) {
          console.log(`Retry ${retryCount + 1}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, 1000 * (retryCount + 1))); // Backoff exponentiel
          return loadUserData(userId, retryCount + 1);
        }
      }

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
          // Stats pour les badges
          totalPotatoes: profile.total_potatoes || 0,
          totalSpent: profile.total_spent || 0,
          chestsOpened: profile.chests_opened || 0,
          urgentCompleted: profile.urgent_completed || 0,
          scheduledCompleted: profile.scheduled_completed || 0,
          sharedTasksCompleted: profile.shared_tasks_completed || 0,
          currentStreak: profile.current_streak || 0,
          bestStreak: profile.best_streak || 0,
          journalEntries: profile.journal_entries || 0,
          habitsCompleted: profile.habits_completed || 0,
          riddlesSolved: profile.riddles_solved || 0,
          chifoumiPlayed: profile.chifoumi_played || 0,
          chifoumiWins: profile.chifoumi_wins || 0,
          itemsBought: profile.items_bought || 0,
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
          keys: chestsData.keys || 0,
          superChestCounter: chestsData.super_chest_counter || 0,
        });
      }

      // Charger les tâches (propres + partagées)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Charger aussi les tâches où l'utilisateur est participant
      // On récupère toutes les tâches des autres utilisateurs et on filtre côté client
      const { data: allOtherTasks, error: otherTasksError } = await supabase
        .from('tasks')
        .select('*')
        .neq('user_id', userId);

      if (otherTasksError) {
        console.error('❌ Erreur chargement tâches autres (init):', otherTasksError);
      }
      console.log('Mon pseudo:', profile?.pseudo);
      console.log('Toutes les tâches des autres:', allOtherTasks?.length, allOtherTasks, 'Erreur:', otherTasksError);

      // Filtrer les tâches partagées avec l'utilisateur courant
      // IMPORTANT: Ne pas inclure les tâches où accepted === false (invitations en attente)
      const sharedTasksData = (allOtherTasks || []).filter(t => {
        if (!t.participants || !Array.isArray(t.participants) || t.participants.length === 0) {
          return false;
        }
        
        // Trouver ma participation
        const myParticipation = t.participants.find(p => p.pseudo === profile?.pseudo);
        if (!myParticipation) return false;
        
        // Ne PAS inclure si accepted === false (invitation en attente)
        // Inclure si accepted === true OU si accepted n'existe pas (anciennes tâches)
        const isAccepted = myParticipation.accepted !== false;
        
        console.log('Vérification tâche:', t.title, '| Ma participation:', myParticipation, '| Acceptée:', isAccepted);
        
        return isAccepted;
      });

      console.log('Tâches partagées ACCEPTÉES:', sharedTasksData.length, sharedTasksData);

      const allTasks = [...(tasksData || []), ...sharedTasksData];

      // Toujours mettre à jour les tâches même si vide
      // Les événements sont maintenant des tâches avec un champ time
      setTasks(allTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status || 'à faire',
        duration: t.duration,
        date: t.date ? new Date(t.date) : null,
        category: t.category,
        completed: t.completed,
        tags: t.tags || [],
        recurrence: t.recurrence || 'none',
        recurrenceDays: t.recurrence_days || [],
        notes: t.notes || '',
        photos: t.photos || [],
        participants: t.participants || [],
        ownerId: t.user_id,
        isSharedWithMe: t.user_id !== userId,
        // Champs événement (fusion)
        time: t.time || '',
        location: t.location || '',
        reminder: t.reminder || 'none',
        description: t.description || '',
        completedBy: t.completed_by || [],
        missionId: t.mission_id,
        assignedTo: t.assigned_to,
      })));

      // Les événements ne sont plus chargés séparément
      // Ils sont maintenant dans tasks avec time != ''

      // Charger les amis (depuis la table friends)
      const { data: friendsData } = await supabase
        .from('friends')
        .select('friend_pseudo')
        .eq('user_pseudo', profile?.pseudo);

      if (friendsData && friendsData.length > 0) {
        // Récupérer les profils des amis avec leurs items et patates
        const friendPseudos = friendsData.map(f => f.friend_pseudo);
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('id, pseudo, avatar, avatar_bg, level, pq_season, owned_items, custom_title, potatoes')
          .in('pseudo', friendPseudos);

        if (friendProfiles) {
          setFriends(friendProfiles.map(f => ({
            odUserId: f.id,
            pseudo: f.pseudo,
            avatar: f.avatar || '😀',
            avatarBg: f.avatar_bg || 'from-indigo-400 to-purple-500',
            level: f.level || 1,
            pqSeason: f.pq_season || 0,
            ownedItems: f.owned_items || [],
            customTitle: f.custom_title || '',
            potatoes: f.potatoes || 0,
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
            totalPotatoes: profile.total_potatoes || profile.potatoes || 0,
            totalSpent: profile.total_spent || 0,
            chestsOpened: profile.chests_opened || 0,
            urgentCompleted: profile.urgent_completed || 0,
            scheduledCompleted: profile.scheduled_completed || 0,
            sharedTasksCompleted: profile.shared_tasks_completed || 0,
            currentStreak: profile.current_streak || 0,
            journalEntries: profile.journal_entries || 0,
            habitsCompleted: profile.habits_completed || 0,
            riddlesSolved: profile.riddles_solved || 0,
            chifoumiPlayed: profile.chifoumi_played || 0,
            chifoumiWins: profile.chifoumi_wins || 0,
            itemsBought: profile.items_bought || 0,
            friendsCount: 0, // Sera mis à jour plus tard
          };
          
          // Débloquer les badges sans animation (chargement initial)
          setBadges(prevBadges => {
            return prevBadges.map(badge => {
              let statValue = 0;
              switch (badge.stat) {
                case 'tasksCompleted': statValue = userStats.tasksCompleted; break;
                case 'level': statValue = userStats.level; break;
                case 'totalPotatoes': statValue = userStats.totalPotatoes; break;
                case 'totalSpent': statValue = userStats.totalSpent; break;
                case 'chestsOpened': statValue = userStats.chestsOpened; break;
                case 'urgentCompleted': statValue = userStats.urgentCompleted; break;
                case 'scheduledCompleted': statValue = userStats.scheduledCompleted; break;
                case 'sharedTasksCompleted': statValue = userStats.sharedTasksCompleted; break;
                case 'currentStreak': statValue = userStats.currentStreak; break;
                case 'journalEntries': statValue = userStats.journalEntries; break;
                case 'habitsCompleted': statValue = userStats.habitsCompleted; break;
                case 'riddlesSolved': statValue = userStats.riddlesSolved; break;
                case 'chifoumiPlayed': statValue = userStats.chifoumiPlayed; break;
                case 'chifoumiWins': statValue = userStats.chifoumiWins; break;
                case 'itemsBought': statValue = userStats.itemsBought; break;
                case 'friendsCount': statValue = userStats.friendsCount; break;
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
      
      // Retry automatique en cas d'erreur réseau ou timeout
      if (retryCount < MAX_RETRIES && (error.message === 'Timeout' || error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch'))) {
        console.log(`Retry après erreur ${retryCount + 1}/${MAX_RETRIES}...`);
        await new Promise(r => setTimeout(r, 2000 * (retryCount + 1))); // Backoff exponentiel
        return loadUserData(userId, retryCount + 1);
      }
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

  // Sauvegarder une tâche (avec tous les champs, y compris time/location pour les événements)
  const saveTask = async (task, previousParticipants = []) => {
    if (!supabaseUser) return;
    
    try {
      const taskData = {
        id: task.id,
        user_id: supabaseUser.id,
        title: task.title,
        status: task.status || 'à faire',
        duration: task.duration || '1h-2h',
        date: task.date instanceof Date ? task.date.toISOString() : task.date,
        recurrence: task.recurrence || 'none',
        recurrence_days: task.recurrenceDays || [],
        tags: task.tags || [],
        notes: task.notes || '',
        photos: task.photos || [],
        participants: task.participants || [],
        category: task.date ? 'today' : 'bucketlist',
        completed: task.completed || false,
        // Champs pour les tâches avec heure (anciennement événements)
        time: task.time || null,
        location: task.location || null,
        reminder: task.reminder || 'none',
        description: task.description || '',
        completed_by: task.completedBy || [],
        mission_id: task.missionId || null,
        assigned_to: task.assignedTo || null,
        updated_at: new Date().toISOString(),
      };
      
      // DEBUG: Log des participants sauvegardés
      if (taskData.participants && taskData.participants.length > 0) {
        console.log('📤 SAVE TASK avec participants:', {
          taskId: taskData.id,
          title: taskData.title,
          participants: taskData.participants,
          user_id: taskData.user_id
        });
      }
      
      const { error } = await supabase
        .from('tasks')
        .upsert(taskData, { onConflict: 'id' });
      
      if (error) {
        console.error('Erreur Supabase saveTask:', error);
      } else if (taskData.participants && taskData.participants.length > 0) {
        console.log('✅ Tâche partagée sauvegardée avec succès');
        
        // Envoyer des notifications aux nouveaux participants
        const previousPseudos = previousParticipants.map(p => p.pseudo);
        const newParticipants = taskData.participants.filter(p => 
          !previousPseudos.includes(p.pseudo) && p.accepted === false
        );
        
        for (const participant of newParticipants) {
          try {
            // Récupérer l'ID du participant
            const { data: participantProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('pseudo', participant.pseudo)
              .single();
            
            if (participantProfile) {
              const taskType = task.time ? 'événement' : 'tâche';
              await supabase.from('notifications').insert({
                user_id: participantProfile.id,
                type: 'task_invitation',
                title: `Invitation à un${task.time ? '' : 'e'} ${taskType}`,
                message: `${user?.pseudo || 'Quelqu\'un'} t'invite à participer à "${task.title}"`,
                data: {
                  taskId: task.id,
                  taskTitle: task.title,
                  invitedBy: user?.pseudo,
                  isEvent: !!task.time,
                },
                read: false,
              });
              console.log('📩 Notification envoyée à', participant.pseudo);
            }
          } catch (notifError) {
            console.error('Erreur envoi notification:', notifError);
          }
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde tâche:', error);
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
          // Stats pour les badges
          total_potatoes: newUserData.totalPotatoes || 0,
          total_spent: newUserData.totalSpent || 0,
          chests_opened: newUserData.chestsOpened || 0,
          urgent_completed: newUserData.urgentCompleted || 0,
          scheduled_completed: newUserData.scheduledCompleted || 0,
          shared_tasks_completed: newUserData.sharedTasksCompleted || 0,
          current_streak: newUserData.currentStreak || 0,
          best_streak: newUserData.bestStreak || 0,
          journal_entries: newUserData.journalEntries || 0,
          habits_completed: newUserData.habitsCompleted || 0,
          riddles_solved: newUserData.riddlesSolved || 0,
          chifoumi_played: newUserData.chifoumiPlayed || 0,
          chifoumi_wins: newUserData.chifoumiWins || 0,
          items_bought: newUserData.itemsBought || 0,
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

  // Sauvegarder les clés
  const saveChests = async (newChests) => {
    if (!supabaseUser) return;
    
    try {
      await supabase
        .from('chests')
        .update({
          keys: newChests.keys,
          super_chest_counter: newChests.superChestCounter,
        })
        .eq('user_id', supabaseUser.id);
    } catch (error) {
      console.error('Erreur sauvegarde clés:', error);
    }
  };

  // Mettre à jour l'utilisateur et sauvegarder
  const updateUser = (newUserData) => {
    // Créer un nouvel objet pour forcer le re-render
    setUser({ ...newUserData });
    saveProfile(newUserData);
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
          case 'currentStreak':
            statValue = stats.currentStreak || 0;
            break;
          case 'urgentCompleted':
            statValue = stats.urgentCompleted || 0;
            break;
          case 'scheduledCompleted':
            statValue = stats.scheduledCompleted || 0;
            break;
          case 'totalSpent':
            statValue = stats.totalSpent || 0;
            break;
          case 'sharedTasksCompleted':
            statValue = stats.sharedTasksCompleted || 0;
            break;
          case 'journalEntries':
            statValue = stats.journalEntries || 0;
            break;
          case 'habitsCompleted':
            statValue = stats.habitsCompleted || 0;
            break;
          case 'riddlesSolved':
            statValue = stats.riddlesSolved || 0;
            break;
          case 'chifoumiPlayed':
            statValue = stats.chifoumiPlayed || 0;
            break;
          case 'chifoumiWins':
            statValue = stats.chifoumiWins || 0;
            break;
          case 'itemsBought':
            statValue = stats.itemsBought || 0;
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
          case 'currentStreak':
            statValue = stats.currentStreak || 0;
            break;
          case 'urgentCompleted':
            statValue = stats.urgentCompleted || 0;
            break;
          case 'scheduledCompleted':
            statValue = stats.scheduledCompleted || 0;
            break;
          case 'totalSpent':
            statValue = stats.totalSpent || 0;
            break;
          case 'sharedTasksCompleted':
            statValue = stats.sharedTasksCompleted || 0;
            break;
          case 'journalEntries':
            statValue = stats.journalEntries || 0;
            break;
          case 'habitsCompleted':
            statValue = stats.habitsCompleted || 0;
            break;
          case 'riddlesSolved':
            statValue = stats.riddlesSolved || 0;
            break;
          case 'chifoumiPlayed':
            statValue = stats.chifoumiPlayed || 0;
            break;
          case 'chifoumiWins':
            statValue = stats.chifoumiWins || 0;
            break;
          case 'itemsBought':
            statValue = stats.itemsBought || 0;
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
    saveMission,
    deleteMission,
    saveTask,
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
