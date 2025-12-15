import React, { useState } from 'react';
import { PageHelp } from './PageHelp';

export const FriendsPage = ({ 
  user,
  friends, 
  tasks = [],
  events = [],
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  addFriend,
  removeFriend,
  friendRequests,
  onAcceptRequest,
  onDeclineRequest,
  onEditTask,
  onEditEvent,
  ownedItems = []
}) => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Filtrer les tâches et événements partagés avec un ami
  const getSharedWithFriend = (friendPseudo) => {
    const sharedTasks = tasks.filter(t => 
      t.participants?.some(p => p.pseudo === friendPseudo)
    );
    const sharedEvents = events.filter(e => 
      e.participants?.some(p => p.pseudo === friendPseudo)
    );
    return { sharedTasks, sharedEvents };
  };

  // Liste des amis (triée par niveau)
  const sortedFriends = [...friends].sort((a, b) => (b.level || 1) - (a.level || 1));

  // Vérifier les améliorations d'un joueur
  const hasGoldenBorder = (player) => player.ownedItems?.includes(71);
  const hasVipBadge = (player) => player.ownedItems?.includes(83);
  const hasCustomTitle = (player) => player.ownedItems?.includes(79) && player.customTitle;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900">Amis</h1>
      </div>

      <PageHelp pageId="friends" color="purple">
        <strong>🤝 Joue en équipe !</strong> Ajoute des amis et partage des <strong>tâches et événements</strong> avec eux. 
        Quand vous complétez une tâche partagée, vous gagnez <strong>tous les deux le double de points</strong> !
      </PageHelp>

      {/* Demandes d'amis en attente - affiché en haut si il y en a */}
      {friendRequests && friendRequests.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <h2 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">
              {friendRequests.length}
            </span>
            Demandes d'amis
          </h2>
          <div className="space-y-2">
            {friendRequests.map((request) => (
              <div key={request.pseudo} className="flex items-center justify-between bg-white p-3 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-xl">
                    <span className="emoji-display">{request.avatar}</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{request.pseudo}</div>
                    <div className="text-xs text-slate-500">Niveau {request.level}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAcceptRequest(request.pseudo)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-600"
                  >
                    ✓ Accepter
                  </button>
                  <button
                    onClick={() => onDeclineRequest(request.pseudo)}
                    className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-300"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recherche d'amis */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Ajouter un ami</h2>
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par pseudo..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Résultats de recherche */}
        {searchQuery.length >= 2 && (
          <div className="space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((result) => {
                const isAlreadyFriend = friends.some(f => f.pseudo === result.pseudo);
                const isMe = result.pseudo === user.pseudo;
                
                return (
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
                    {!isMe && !isAlreadyFriend && (
                      <button
                        onClick={() => addFriend(result.pseudo)}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-600"
                      >
                        + Ajouter
                      </button>
                    )}
                    {isAlreadyFriend && (
                      <span className="text-green-500 text-sm font-medium">✓ Ami</span>
                    )}
                    {isMe && (
                      <span className="text-slate-400 text-sm">C'est toi</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-500">
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        )}
      </div>

      {/* Liste des amis */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Mes amis ({friends.length})</h2>
        
        {sortedFriends.length > 0 ? (
          <div className="space-y-2">
            {sortedFriends.map((friend) => {
              const { sharedTasks, sharedEvents } = getSharedWithFriend(friend.pseudo);
              const sharedCount = sharedTasks.length + sharedEvents.length;
              
              return (
                <div 
                  key={friend.pseudo} 
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className={`w-10 h-10 bg-gradient-to-br ${friend.avatarBg || 'from-indigo-400 to-purple-500'} rounded-xl flex items-center justify-center text-xl ${hasGoldenBorder(friend) ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
                      <span className="emoji-display">{friend.avatar}</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        {friend.pseudo}
                        {hasVipBadge(friend) && <span className="text-yellow-500 text-xs">👑</span>}
                      </div>
                      <div className="text-xs text-slate-500">
                        Niv. {friend.level}
                        {hasCustomTitle(friend) && <span className="ml-1">• {friend.customTitle}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sharedCount > 0 && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                        {sharedCount} partagé{sharedCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(friend.pseudo);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Supprimer cet ami"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl">
            <div className="text-4xl mb-2">🤝</div>
            <p className="text-slate-500">Pas encore d'amis</p>
            <p className="text-sm text-slate-400 mt-1">Utilise la recherche pour en ajouter !</p>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmDelete(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Supprimer cet ami ?</h3>
            <p className="text-slate-600 mb-4">
              Tu ne pourras plus voir les tâches partagées avec <strong>{confirmDelete}</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  removeFriend && removeFriend(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tâches partagées avec un ami */}
      {selectedFriend && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedFriend(null)}></div>
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${selectedFriend.avatarBg || 'from-indigo-400 to-purple-500'} rounded-xl flex items-center justify-center text-2xl`}>
                    {selectedFriend.avatar}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedFriend.pseudo}</h2>
                    <p className="text-sm text-slate-500">Niveau {selectedFriend.level}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedFriend(null)} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {/* Contenu */}
              <div className="p-5 overflow-y-auto flex-1">
                {(() => {
                  const { sharedTasks, sharedEvents } = getSharedWithFriend(selectedFriend.pseudo);
                  const hasShared = sharedTasks.length > 0 || sharedEvents.length > 0;

                  if (!hasShared) {
                    return (
                      <div className="text-center py-10">
                        <div className="text-4xl mb-3">🤝</div>
                        <p className="text-slate-500">Aucune tâche ou événement partagé avec {selectedFriend.pseudo}</p>
                        <p className="text-sm text-slate-400 mt-2">Crée une tâche et ajoute cet ami comme participant !</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Tâches partagées */}
                      {sharedTasks.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-700 mb-2">📋 Tâches partagées ({sharedTasks.length})</h3>
                          <div className="space-y-2">
                            {sharedTasks.map(task => (
                              <div 
                                key={task.id} 
                                onClick={() => {
                                  setSelectedFriend(null);
                                  onEditTask && onEditTask(task);
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${task.completed ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50 border-indigo-200 hover:border-indigo-400'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                    {task.title}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {task.completed && <span className="text-green-500">✓</span>}
                                    <span className="text-slate-400">→</span>
                                  </div>
                                </div>
                                {task.date && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    {new Date(task.date).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Événements partagés */}
                      {sharedEvents.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-slate-700 mb-2">📅 Événements partagés ({sharedEvents.length})</h3>
                          <div className="space-y-2">
                            {sharedEvents.map(event => (
                              <div 
                                key={event.id} 
                                onClick={() => {
                                  setSelectedFriend(null);
                                  onEditEvent && onEditEvent(event);
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${event.completed ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium ${event.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                    {event.title || 'Événement sans titre'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {event.completed && <span className="text-green-500">✓</span>}
                                    <span className="text-slate-400">→</span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {event.date && new Date(event.date).toLocaleDateString('fr-FR')} • {event.time}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
