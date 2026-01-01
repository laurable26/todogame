import React, { useState, useRef } from 'react';

export const ControlCenter = ({ 
  // Énigme
  hasRiddle,
  riddleDone,
  riddleXp,
  onRiddleClick,
  // Coffre-fort
  hasVault,
  onVaultClick,
  // Journaling
  hasJournaling,
  journalDone,
  onJournalingClick,
  // Citation du jour
  hasDailyQuote,
  quoteSeen,
  onQuoteClick,
  // Habit Tracker
  hasHabitTracker,
  onHabitTrackerClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const totalMoved = useRef(0);

  // Compter les fonctionnalités actives
  const features = [];
  
  if (hasRiddle) {
    features.push({
      id: 'riddle',
      icon: '🧩',
      label: 'Énigme',
      done: riddleDone,
      badge: riddleDone ? '✓' : `+${riddleXp}`,
      badgeColor: riddleDone ? 'bg-emerald-500' : 'bg-amber-500',
      onClick: onRiddleClick,
    });
  }
  
  if (hasVault) {
    features.push({
      id: 'vault',
      icon: '🔐',
      label: 'Coffre-fort',
      onClick: onVaultClick,
    });
  }
  
  if (hasJournaling) {
    features.push({
      id: 'journal',
      icon: '🦋',
      label: 'Journal',
      done: journalDone,
      badge: journalDone ? '✓' : null,
      badgeColor: 'bg-emerald-500',
      onClick: onJournalingClick,
    });
  }
  
  if (hasDailyQuote) {
    features.push({
      id: 'quote',
      icon: '✦',
      label: 'Oracle',
      done: quoteSeen,
      badge: quoteSeen ? '✓' : null,
      badgeColor: 'bg-emerald-500',
      onClick: onQuoteClick,
    });
  }

  if (hasHabitTracker) {
    features.push({
      id: 'habits',
      icon: '🎯',
      label: 'Habitudes',
      onClick: onHabitTrackerClick,
    });
  }

  // Nombre de notifications (fonctionnalités non faites)
  const notifCount = features.filter(f => f.badge && f.badge !== '✓').length;

  if (features.length === 0) return null;

  const MOVE_THRESHOLD = 10;

  const handleMouseDown = (e) => {
    isDragging.current = true;
    totalMoved.current = 0;
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    totalMoved.current = Math.sqrt(dx * dx + dy * dy);
    
    if (totalMoved.current > MOVE_THRESHOLD) {
      const newX = Math.max(10, Math.min(window.innerWidth - 70, e.clientX - 28));
      const newY = Math.max(80, Math.min(window.innerHeight - 150, e.clientY - 28));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (totalMoved.current < MOVE_THRESHOLD) {
      setIsOpen(!isOpen);
    }
    isDragging.current = false;
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    isDragging.current = true;
    totalMoved.current = 0;
    dragStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    totalMoved.current = Math.sqrt(dx * dx + dy * dy);
    
    if (totalMoved.current > MOVE_THRESHOLD) {
      const newX = Math.max(10, Math.min(window.innerWidth - 70, touch.clientX - 28));
      const newY = Math.max(80, Math.min(window.innerHeight - 150, touch.clientY - 28));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    if (totalMoved.current < MOVE_THRESHOLD) {
      setIsOpen(!isOpen);
    }
    isDragging.current = false;
  };

  // Style de position
  const positionStyle = position.x !== null 
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : { right: 16, bottom: 96 };

  return (
    <>
      {/* Overlay pour fermer */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Menu déplié */}
      {isOpen && (
        <div 
          className="fixed z-40 flex flex-col gap-3 items-end"
          style={{
            ...positionStyle,
            bottom: position.y !== null ? 'auto' : 160,
          }}
        >
          {features.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => {
                feature.onClick();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full pl-4 pr-2 py-2 shadow-lg hover:scale-105 transition-all animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {feature.label}
              </span>
              <div className="relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  feature.id === 'quote'
                    ? (feature.done 
                        ? 'bg-slate-100 dark:bg-slate-700' 
                        : 'bg-gradient-to-br from-indigo-500 to-purple-500')
                    : ''
                }`}>
                  {feature.icon}
                </div>
                {feature.badge && (
                  <span className={`absolute -top-1 -right-1 ${feature.badgeColor} text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center`}>
                    {feature.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Bouton principal - draggable */}
      <div
        className="fixed z-40"
        style={{ ...positionStyle, touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDragging.current = false; }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all cursor-grab active:cursor-grabbing ${
            isOpen 
              ? 'bg-slate-700' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-500 hover:scale-110'
          }`}
        >
          {isOpen ? '📂' : '🗂️'}
          
          {/* Badge de notification */}
          {!isOpen && notifCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ControlCenter;
