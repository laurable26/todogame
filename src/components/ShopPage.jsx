import React, { useState } from 'react';
import { PageHelp } from './PageHelp';

export const ShopPage = ({ shopItems, userPoints, onBuyItem, ownedItems, equippedItems, onEquipItem, user, activeBoosts = [], activeUpgrades = {}, onToggleUpgrade, defaultTab = 'avatar' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const tabs = [
    { id: 'avatar', label: 'Avatars', emoji: '😀' },
    { id: 'fond', label: 'Fonds', emoji: '🎨' },
    { id: 'amelioration', label: 'Améliorations', emoji: '⚙️' },
    { id: 'boost', label: 'Boosts', emoji: '⚡' },
  ];

  // Filtrer et trier (exclure les items exclusifs coffres)
  const filteredItems = shopItems
    .filter(item => item.type === activeTab && !item.chestExclusive)
    .sort((a, b) => {
      // Pour avatars et fonds, trier par niveau requis
      if (a.requiredLevel !== undefined && b.requiredLevel !== undefined) {
        return a.requiredLevel - b.requiredLevel;
      }
      // Pour le reste, trier par prix
      return (a.price || 0) - (b.price || 0);
    });

  const isOwned = (itemId) => ownedItems.includes(itemId);
  const isEquipped = (itemId) => equippedItems.includes(itemId);
  const isUpgradeActive = (itemId) => activeUpgrades[itemId] !== false;
  
  // Vérifier si un item est débloqué par niveau
  const isUnlockedByLevel = (item) => {
    if (item.requiredLevel === undefined) return true;
    return user.level >= item.requiredLevel;
  };
  
  // Vérifier si un boost de ce type est actif
  const isBoostActive = (boostType) => {
    const now = new Date();
    return activeBoosts.some(b => b.type === boostType && new Date(b.expiresAt) > now);
  };

  // Vérifier le niveau d'énigme le plus élevé possédé et actif
  const getHighestRiddleLevel = () => {
    if (ownedItems.includes(89) && activeUpgrades[89] !== false) return 3;
    if (ownedItems.includes(88) && activeUpgrades[88] !== false) return 2;
    if (ownedItems.includes(87) && activeUpgrades[87] !== false) return 1;
    return 0;
  };
  
  const highestRiddleLevel = getHighestRiddleLevel();
  
  // Vérifier si un item d'énigme est remplacé par un niveau supérieur
  const isRiddleDisabled = (item) => {
    if (!item.riddleLevel) return false;
    return item.riddleLevel < highestRiddleLevel;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-3xl font-black text-slate-900">Boutique</h1>

      <PageHelp pageId="shop" color="amber">
        <strong>🛒 Bienvenue dans la boutique !</strong> Les <strong>avatars</strong> et <strong>fonds</strong> se débloquent automatiquement en montant de niveau. 
        Utilise tes patates pour acheter des <strong>boosts</strong> temporaires et des <strong>améliorations</strong> permanentes !
      </PageHelp>

      {/* Onglets */}
      <div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-2 rounded-lg font-semibold transition-all whitespace-nowrap text-sm ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Description pour avatars/fonds */}
      {(activeTab === 'avatar' || activeTab === 'fond') && (
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <p className="text-indigo-800 text-sm">
            <span className="font-semibold">⭐ Débloqués par niveau</span> : monte de niveau pour débloquer de nouveaux {activeTab === 'avatar' ? 'avatars' : 'fonds'} !
            <span className="ml-2 bg-indigo-200 px-2 py-1 rounded-full text-xs font-bold">Ton niveau : {user.level}</span>
          </p>
        </div>
      )}
      {/* Description pour boosts */}
      {activeTab === 'boost' && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-amber-800 text-sm">
            <span className="font-semibold">⚡ Boosts consommables</span> : effets temporaires puissants pour booster ta progression !
          </p>
        </div>
      )}
      {/* Description pour améliorations */}
      {activeTab === 'amelioration' && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-slate-600 text-sm">
            <span className="font-semibold">⚙️ Débloque des fonctionnalités</span> : thèmes, effets visuels et plus encore !
          </p>
        </div>
      )}

      {/* Grille des items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const owned = isOwned(item.id);
          const equipped = isEquipped(item.id);
          const canBuy = userPoints >= (item.price || 0);
          const boostActive = item.type === 'boost' && item.boostType && isBoostActive(item.boostType);
          const upgradeActive = item.type === 'amelioration' && owned && isUpgradeActive(item.id);
          const riddleDisabled = isRiddleDisabled(item);
          const unlockedByLevel = isUnlockedByLevel(item);
          const isLevelBased = item.requiredLevel !== undefined;

          return (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl p-4 border-2 shadow-sm transition-all ${
                riddleDisabled
                  ? 'border-slate-200 bg-slate-100 opacity-50'
                  : !unlockedByLevel
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : boostActive
                      ? 'border-amber-400 bg-amber-50'
                      : upgradeActive
                        ? 'border-green-400 bg-green-50'
                        : item.type === 'amelioration' && owned
                          ? 'border-slate-300 bg-slate-50 opacity-75'
                          : equipped 
                            ? 'border-green-400 bg-green-50' 
                            : unlockedByLevel && isLevelBased
                              ? 'border-indigo-300 bg-indigo-50' 
                              : 'border-slate-200'
              }`}
            >
              <div className="text-center">
                {/* Preview */}
                {item.type === 'fond' ? (
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${item.colors} rounded-xl mb-3 shadow-md flex items-center justify-center relative ${!unlockedByLevel ? 'grayscale' : ''}`}>
                    <span className="text-2xl emoji-display">{user.avatar}</span>
                    {!unlockedByLevel && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                        <span className="text-xl">🔒</span>
                      </div>
                    )}
                  </div>
                ) : item.type === 'boost' ? (
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl mb-3 shadow-md flex items-center justify-center text-3xl emoji-display ${boostActive ? 'animate-pulse' : ''}`}>
                    {item.image}
                  </div>
                ) : item.type === 'amelioration' ? (
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl mb-3 shadow-md flex items-center justify-center text-3xl emoji-display`}>
                    {item.image}
                  </div>
                ) : (
                  <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${user.avatarBg} rounded-xl mb-3 shadow-md flex items-center justify-center text-3xl emoji-display relative ${!unlockedByLevel ? 'grayscale' : ''}`}>
                    {item.image}
                    {!unlockedByLevel && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                        <span className="text-xl">🔒</span>
                      </div>
                    )}
                  </div>
                )}

                <h3 className="font-bold text-slate-900 text-sm mb-1">{item.name}</h3>
                
                {item.duration && (
                  <p className="text-xs text-amber-600 font-medium mb-1">{item.duration}</p>
                )}
                
                {item.description && (
                  <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                )}

                {/* Niveau requis pour avatars/fonds */}
                {isLevelBased && (
                  <div className={`flex items-center justify-center gap-1 mb-2 ${unlockedByLevel ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <span>⭐</span>
                    <span className="font-bold text-sm">Niv. {item.requiredLevel}</span>
                    {unlockedByLevel && <span className="text-green-500 ml-1">✓</span>}
                  </div>
                )}

                {/* Prix pour boosts et améliorations */}
                {!isLevelBased && item.price && (item.type === 'boost' || !owned) && (
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span>🥔</span>
                    <span className="font-bold text-slate-700">{item.price.toLocaleString()}</span>
                  </div>
                )}

                {/* Bouton selon le type */}
                {item.type === 'boost' ? (
                  // Boosts - toujours achetables
                  <button
                    onClick={() => canBuy && onBuyItem(item)}
                    disabled={!canBuy || boostActive}
                    className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                      boostActive
                        ? 'bg-amber-500 text-white cursor-not-allowed'
                        : canBuy
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:scale-105'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {boostActive ? '✓ Actif' : canBuy ? 'Activer' : 'Insuffisant'}
                  </button>
                ) : item.type === 'amelioration' ? (
                  // Améliorations - activables/désactivables après achat
                  riddleDisabled ? (
                    <div className="w-full py-2 rounded-lg font-bold text-sm bg-slate-300 text-slate-500 text-center">
                      Remplacé
                    </div>
                  ) : owned ? (
                    <button
                      onClick={() => onToggleUpgrade && onToggleUpgrade(item.id, shopItems)}
                      className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                        isUpgradeActive(item.id)
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-slate-400 text-white hover:bg-slate-500'
                      }`}
                    >
                      {isUpgradeActive(item.id) ? '✓ Activé' : 'Désactivé'}
                    </button>
                  ) : (
                    <button
                      onClick={() => canBuy && onBuyItem(item)}
                      disabled={!canBuy}
                      className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                        canBuy
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:scale-105'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {canBuy ? 'Débloquer' : 'Insuffisant'}
                    </button>
                  )
                ) : (
                  // Avatars et Fonds - débloqués par niveau
                  !unlockedByLevel ? (
                    <div className="w-full py-2 rounded-lg font-bold text-sm bg-slate-200 text-slate-500 text-center">
                      🔒 Niveau {item.requiredLevel}
                    </div>
                  ) : equipped ? (
                    <button
                      className="w-full py-2 rounded-lg font-bold text-sm bg-green-500 text-white cursor-default"
                    >
                      ✓ Équipé
                    </button>
                  ) : (
                    <button
                      onClick={() => onEquipItem(item.id)}
                      className="w-full py-2 rounded-lg font-bold text-sm bg-indigo-500 text-white hover:bg-indigo-600 transition-all hover:scale-105"
                    >
                      Équiper
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
        
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-500">
            Aucun item disponible dans cette catégorie
          </div>
        )}
      </div>
    </div>
  );
};
