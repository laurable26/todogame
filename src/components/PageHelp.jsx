import React, { useState, useEffect } from 'react';

export const PageHelp = ({ pageId, color, children }) => {
  const storageKey = `todogame_help_${pageId}_dismissed`;
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(storageKey) === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKey, 'true');
  };

  if (isDismissed) return null;

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    pink: 'bg-pink-50 border-pink-200 text-pink-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  const closeColors = {
    blue: 'text-blue-400 hover:text-blue-600 hover:bg-blue-100',
    emerald: 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100',
    amber: 'text-amber-400 hover:text-amber-600 hover:bg-amber-100',
    purple: 'text-purple-400 hover:text-purple-600 hover:bg-purple-100',
    pink: 'text-pink-400 hover:text-pink-600 hover:bg-pink-100',
    indigo: 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100',
    slate: 'text-slate-400 hover:text-slate-600 hover:bg-slate-100',
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color] || colorClasses.blue} relative`}>
      <button
        onClick={handleDismiss}
        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${closeColors[color] || closeColors.blue}`}
        title="Fermer"
      >
        ✕
      </button>
      <div className="pr-8 text-sm">
        {children}
      </div>
    </div>
  );
};
