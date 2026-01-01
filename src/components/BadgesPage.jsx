import React, { useState } from 'react';
import { PageHelp } from './PageHelp';

export const BadgesPage = ({ badges }) => {
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredBadges = badges.filter(badge => {
    if (filter === 'all') return true;
    return badge.category === filter;
  });

  const getBadgeStatus = (badge) => {
    if (badge.gold) return { level: 'gold', color: 'from-yellow-400 to-amber-500', label: 'Or' };
    if (badge.silver) return { level: 'silver', color: 'from-slate-300 to-slate-500', label: 'Argent' };
    if (badge.bronze) return { level: 'bronze', color: 'from-amber-600 to-amber-800', label: 'Bronze' };
    return { level: 'locked', color: 'from-slate-200 to-slate-300', label: 'Non débloqué' };
  };

  const totalBadges = badges.length * 3;
  const earnedBadges = badges.reduce((acc, badge) => {
    return acc + (badge.bronze ? 1 : 0) + (badge.silver ? 1 : 0) + (badge.gold ? 1 : 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">Badges</h1>
        <div className="text-right">
          <div className="text-2xl font-black text-indigo-600">{earnedBadges}/{totalBadges}</div>
          <div className="text-xs text-slate-500">Badges débloqués</div>
        </div>
      </div>

      <PageHelp pageId="badges" color="indigo">
        <strong>🏅 Débloque des succès !</strong> Complète des objectifs pour gagner des badges <strong>bronze</strong>, <strong>argent</strong> et <strong>or</strong>. 
        Chaque badge débloqué te rapporte des patates bonus !
      </PageHelp>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Tous', emoji: '🏅' },
          { id: 'solo', label: 'Solo', emoji: '👤' },
          { id: 'quests', label: 'Social', emoji: '👥' },
          { id: 'collection', label: 'Collection', emoji: '📦' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredBadges.map(badge => {
          const status = getBadgeStatus(badge);
          const isLocked = status.level === 'locked';
          
          return (
            <div 
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`bg-white rounded-2xl p-4 border-2 shadow-sm cursor-pointer transition-all hover:scale-105 ${
                isLocked ? 'border-slate-200 opacity-60' : 'border-indigo-200 hover:border-indigo-400'
              }`}
            >
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${status.color} rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-md ${isLocked ? 'grayscale' : ''}`}>
                  {badge.emoji}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{badge.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{badge.description}</p>
                
                <div className="flex justify-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${badge.bronze ? 'bg-amber-600' : 'bg-slate-200'}`}></div>
                  <div className={`w-3 h-3 rounded-full ${badge.silver ? 'bg-slate-400' : 'bg-slate-200'}`}></div>
                  <div className={`w-3 h-3 rounded-full ${badge.gold ? 'bg-yellow-400' : 'bg-slate-200'}`}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedBadge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBadge(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className={`w-24 h-24 mx-auto bg-gradient-to-br ${getBadgeStatus(selectedBadge).color} rounded-2xl flex items-center justify-center text-5xl mb-3 shadow-xl`}>
                {selectedBadge.emoji}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{selectedBadge.name}</h2>
              <p className="text-slate-500">{selectedBadge.description}</p>
            </div>

            <div className="space-y-3">
              <div className={`p-3 rounded-xl border-2 ${selectedBadge.bronze ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${selectedBadge.bronze ? 'bg-amber-600' : 'bg-slate-300'}`}></div>
                    <span className="font-semibold text-sm">Bronze</span>
                  </div>
                  {selectedBadge.bronze && <span className="text-green-600">✓</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedBadge.requirements.bronze}</p>
              </div>

              <div className={`p-3 rounded-xl border-2 ${selectedBadge.silver ? 'bg-slate-100 border-slate-400' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${selectedBadge.silver ? 'bg-slate-400' : 'bg-slate-300'}`}></div>
                    <span className="font-semibold text-sm">Argent</span>
                  </div>
                  {selectedBadge.silver && <span className="text-green-600">✓</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedBadge.requirements.silver}</p>
              </div>

              <div className={`p-3 rounded-xl border-2 ${selectedBadge.gold ? 'bg-yellow-50 border-yellow-400' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${selectedBadge.gold ? 'bg-yellow-400' : 'bg-slate-300'}`}></div>
                    <span className="font-semibold text-sm">Or</span>
                  </div>
                  {selectedBadge.gold && <span className="text-green-600">✓</span>}
                </div>
                <p className="text-xs text-slate-500 mt-1">{selectedBadge.requirements.gold}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
