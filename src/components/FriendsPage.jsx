import React, { useState } from 'react';
import { PageHelp } from './PageHelp';

export const FriendsPage = ({ 
  user,
  friends, 
  missions, 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  addFriend, 
  setSelectedMission, 
  setCreatingMission, 
  getModeLabel,
  friendRequests,
  onAcceptRequest,
  onDeclineRequest,
  ownedItems = []
}) => {
  const [activeTab, setActiveTab] = useState('missions'); // Missions par défaut
  const [showArchived, setShowArchived] = useState(false);

  // Séparer missions actives et terminées
  const activeMissions = missions.filter(m => {
    if (!m.quests || m.quests.length === 0) return true;
    return !m.quests.every(q => q.completed);
  });
  
  const archivedMissions = missions.filter(m => {
    if (!m.quests || m.quests.length === 0) return false;
    return m.quests.every(q => q.completed);
  });

  // Classement des amis par PQ (inclut l'utilisateur)
  const leaderboard = [
    { pseudo: user.pseudo, avatar: user.avatar, avatarBg: user.avatarBg, level: user.level, pqSeason: user.pqSeason || 0, isMe: true, ownedItems: ownedItems || [], customTitle: user.customTitle || '' },
    ...friends.map(f => ({ ...f, isMe: false }))
  ].sort((a, b) => (b.pqSeason || 0) - (a.pqSeason || 0));

  // Vérifier les améliorations d'un joueur
  const hasGoldenBorder = (player) => player.ownedItems?.includes(71);
  const hasVipBadge = (player) => player.ownedItems?.includes(83);
  const hasCustomTitle = (player) => player.ownedItems?.includes(79) && player.customTitle;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">Amis & Missions</h1>
        <button 
          onClick={() => setCreatingMission(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-xl font-bold text-white hover:scale-105 transition-transform shadow-lg"
        >
          + Nouvelle Mission
        </button>
      </div>

      <PageHelp pageId="friends" color="purple">
        <strong>🤝 Joue en équipe !</strong> Ajoute des amis et crée des <strong>missions collaboratives</strong>. 
        Chaque participant gagne des <strong>Points de Quête (PQ)</strong> proportionnellement à sa contribution. 
        Consulte le classement pour voir qui domine la saison !
      </PageHelp>

      {/* Onglets */}
      <div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('missions')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'missions'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Missions
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            activeTab === 'friends'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Amis
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all relative ${
            activeTab === 'requests'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Demandes
          {friendRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {friendRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Missions */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          {/* Sous-onglets En cours / Archive */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                !showArchived
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                showArchived
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Terminées
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {showArchived ? 'Missions terminées' : 'Missions en cours'}
            </h2>
          
            {(showArchived ? archivedMissions : activeMissions).length > 0 ? (
            <div className="space-y-3">
              {(showArchived ? archivedMissions : activeMissions).map(mission => {
                const completedQuests = mission.quests?.filter(q => q.completed).length || 0;
                const totalQuests = mission.quests?.length || 0;
                const progress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;
                const isCompleted = totalQuests > 0 && completedQuests === totalQuests;
                
                return (
                  <div 
                    key={mission.id} 
                    onClick={() => setSelectedMission(mission)}
                    className={`p-4 rounded-xl cursor-pointer hover:shadow-md transition-all border-2 ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200 hover:border-green-300' 
                        : 'bg-slate-50 border-transparent hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {isCompleted && '✅ '}{mission.title}
                        </h3>
                        {mission.description && (
                          <p className="text-sm text-slate-600 mt-0.5">{mission.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">{mission.participants?.length || 0} participants</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        isCompleted ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {completedQuests}/{totalQuests} tâches
                      </span>
                    </div>
                    
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl">
              <p className="text-slate-500">
                {showArchived ? 'Aucune mission terminée' : 'Aucune mission en cours'}
              </p>
              {!showArchived && <p className="text-sm text-slate-400">Crée une mission avec tes amis !</p>}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Tab Amis */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {/* Recherche */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Rechercher un joueur..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            />
            
            {searchQuery && searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                {searchResults.map(result => (
                  <div key={result.pseudo} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-xl">
                        <span className="emoji-display">{result.avatar}</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{result.pseudo}</div>
                        <div className="text-xs text-slate-500">Niveau {result.level}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => addFriend(result.pseudo)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90"
                    >
                      Demander
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Classement */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Amis</h2>
            
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div 
                    key={player.pseudo} 
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      player.isMe ? 'bg-purple-50 border-2 border-purple-200' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-slate-300 text-slate-700' :
                        index === 2 ? 'bg-amber-600 text-amber-100' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className={`w-10 h-10 bg-gradient-to-br ${player.avatarBg || 'from-indigo-400 to-purple-500'} rounded-xl flex items-center justify-center text-xl ${hasGoldenBorder(player) ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
                        <span className="emoji-display">{player.avatar}</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          {player.pseudo} 
                          {hasVipBadge(player) && <span className="text-yellow-500 text-xs">👑</span>}
                          {player.isMe && <span className="text-purple-500 text-sm">(moi)</span>}
                        </div>
                        <div className="text-xs text-slate-500">
                          Niv. {player.level}
                          {hasCustomTitle(player) && <span className="ml-1">• {player.customTitle}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🧻</span>
                      <span className="font-bold text-pink-600">{player.pqSeason || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl">
                <p className="text-slate-500">Ajoute des amis pour voir le classement !</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Demandes */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Demandes d'amis reçues</h2>
          
          {friendRequests.length > 0 ? (
            <div className="space-y-3">
              {friendRequests.map(request => (
                <div key={request.pseudo} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      <span className="emoji-display">{request.avatar}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">{request.pseudo}</div>
                      <div className="text-sm text-slate-500">Niv. {request.level} • {request.pqSeason || 0} PQ</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAcceptRequest(request.pseudo)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => onDeclineRequest(request.pseudo)}
                      className="flex-1 bg-slate-200 text-slate-600 px-3 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-300"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl">
              <div className="text-4xl mb-2">📬</div>
              <p className="text-slate-500">Aucune demande en attente</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
