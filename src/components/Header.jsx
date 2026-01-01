import React, { useState, useEffect } from 'react';
import { ChestButton } from './ChestModal';

export const Header = ({ user, onAvatarClick, activeBoosts = [], theme = {}, ownedItems = [], activeUpgrades = {}, keys = 0, onOpenChest, onPotatoClick, onXpClick }) => {
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const [prevLevel, setPrevLevel] = useState(user.level);

  useEffect(() => {
    if (user.level > prevLevel) {
      setLevelUpAnimation(true);
      setTimeout(() => setLevelUpAnimation(false), 1500);
    }
    setPrevLevel(user.level);
  }, [user.level, prevLevel]);

  // Filtrer les boosts actifs (non expirés)
  const now = new Date();
  const validBoosts = activeBoosts.filter(b => new Date(b.expiresAt) > now);

  // Formater le temps restant
  const formatTimeLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h${minutes.toString().padStart(2, '0')}`;
    return `${minutes}min`;
  };

  // Vérifier si une amélioration est active (possédée ET activée)
  const isActive = (id) => ownedItems.includes(id) && activeUpgrades[id] !== false;

  // Améliorations visuelles
  const hasGoldenBorder = isActive(71);
  const hasVipBadge = isActive(83);
  const hasCustomTitle = isActive(79);

  const headerBg = theme.darkMode ? 'bg-slate-800/95' : 'bg-white/95';
  const borderColor = theme.darkMode ? 'border-slate-700' : 'border-slate-200';
  const textColor = theme.darkMode ? 'text-white' : 'text-slate-900';
  const subTextColor = theme.darkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <header className={`fixed top-0 left-0 right-0 ${headerBg} backdrop-blur-xl border-b ${borderColor} z-30 shadow-sm`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div 
              onClick={onAvatarClick}
              className={`w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${user.avatarBg} rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-lg cursor-pointer hover:scale-105 transition-transform ${hasGoldenBorder ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
            >
              <span className="emoji-display">{user.avatar}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className={`font-bold text-sm sm:text-base ${textColor}`}>{user.pseudo}</span>
                {hasVipBadge && <span className="text-yellow-500 text-xs">👑</span>}
              </div>
              <div className={`text-xs sm:text-sm ${levelUpAnimation ? 'text-blue-600 font-bold animate-pulse' : subTextColor}`}>
                Niv. {user.level}
                {hasCustomTitle && user.customTitle && (
                  <span className="ml-1">• {user.customTitle}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Boosts actifs */}
            {validBoosts.length > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {validBoosts.map(boost => (
                  <div 
                    key={boost.id}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 animate-pulse"
                    title={`${boost.name} - ${formatTimeLeft(boost.expiresAt)} restant`}
                  >
                    <span>{boost.image}</span>
                    <span className="hidden md:inline">x{boost.multiplier}</span>
                    <span className="text-[10px] opacity-80">{formatTimeLeft(boost.expiresAt)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Indicateur mobile boosts */}
            {validBoosts.length > 0 && (
              <div className="sm:hidden bg-gradient-to-r from-purple-500 to-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm animate-pulse">
                {validBoosts[0].image}
              </div>
            )}

            {/* Jauge XP - Bleue avec animation level up - cliquable */}
            <button 
              onClick={onXpClick}
              className="flex items-center gap-1 sm:gap-2 hover:scale-105 transition-all cursor-pointer"
            >
              <span className="text-sm sm:text-lg">⭐</span>
              <div className={`w-16 sm:w-24 h-2 sm:h-3 bg-slate-200 rounded-full overflow-hidden ${levelUpAnimation ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
                <div 
                  className={`h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ${levelUpAnimation ? 'animate-pulse' : ''}`}
                  style={{ width: `${(user.xp / user.xpToNext) * 100}%` }}
                ></div>
              </div>
              <span className="hidden sm:inline text-xs text-slate-500">{user.xp}/{user.xpToNext}</span>
            </button>

            {/* Clés pour coffres - version compacte en mobile */}
            <div className="hidden sm:block">
              <ChestButton keys={keys} onOpen={onOpenChest} theme={theme} />
            </div>
            
            {/* Version mobile - juste emoji + nombre */}
            <button
              onClick={keys >= 6 ? onOpenChest : undefined}
              className={`sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg ${
                keys >= 6 
                  ? 'bg-orange-100 border-2 border-orange-400 animate-pulse' 
                  : `${theme.darkMode ? 'bg-stone-800' : 'bg-stone-100'}`
              }`}
            >
              <span className="text-lg">{keys >= 6 ? '🔓' : '🗝️'}</span>
              <span className={`font-bold text-sm ${keys >= 6 ? 'text-orange-600' : (theme.darkMode ? 'text-stone-300' : 'text-stone-600')}`}>{keys}</span>
            </button>

            {/* Patates - cliquable pour aller à la boutique */}
            <button 
              onClick={onPotatoClick}
              className="bg-amber-50 border-2 border-amber-300 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl hover:scale-105 hover:border-amber-400 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-base sm:text-2xl">🥔</span>
                <div className="font-bold text-amber-900 text-sm sm:text-xl">{user.potatoes.toLocaleString()}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export const NavButton = ({ label, active, onClick, badge, theme = {} }) => {
  const activeClass = theme.darkMode 
    ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-400' 
    : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600';
  const inactiveClass = theme.darkMode
    ? 'text-slate-400 hover:text-slate-200'
    : 'text-slate-500 hover:text-slate-900';

  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl transition-all ${
        active ? `${activeClass} scale-105` : inactiveClass
      }`}
    >
      <div className="relative">
        <span className="text-xs sm:text-sm font-semibold">{label}</span>
        {badge > 0 && (
          <div className="absolute -top-1 sm:-top-2 -right-2 sm:-right-4 bg-red-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold">
            {badge > 9 ? '9+' : badge}
          </div>
        )}
      </div>
    </button>
  );
};

export const Navigation = ({ currentPage, setCurrentPage, friendRequestsCount, theme = {}, hasStats = false }) => {
  const navBg = theme.darkMode ? 'bg-slate-800/95' : 'bg-white/95';
  const borderColor = theme.darkMode ? 'border-slate-700' : 'border-slate-200';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 ${navBg} backdrop-blur-xl border-t ${borderColor} z-30 shadow-lg`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-around py-2 sm:py-3">
          <NavButton label="Tâches" active={currentPage === 'tasks'} onClick={() => setCurrentPage('tasks')} theme={theme} />
          <NavButton label="Amis" active={currentPage === 'friends'} onClick={() => setCurrentPage('friends')} badge={friendRequestsCount} theme={theme} />
          <NavButton label="Badges" active={currentPage === 'badges'} onClick={() => setCurrentPage('badges')} theme={theme} />
          {hasStats && (
            <NavButton label="Stats" active={currentPage === 'stats'} onClick={() => setCurrentPage('stats')} theme={theme} />
          )}
          <NavButton label="Boutique" active={currentPage === 'shop'} onClick={() => setCurrentPage('shop')} theme={theme} />
        </div>
      </div>
    </nav>
  );
};
