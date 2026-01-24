import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Palette de couleurs par défaut (10 couleurs)
const DEFAULT_COLORS = [
  { name: 'Bleu', hex: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Vert', hex: '#10B981', bg: 'bg-emerald-500' },
  { name: 'Rouge', hex: '#EF4444', bg: 'bg-red-500' },
  { name: 'Violet', hex: '#8B5CF6', bg: 'bg-violet-500' },
  { name: 'Orange', hex: '#F97316', bg: 'bg-orange-500' },
  { name: 'Rose', hex: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Cyan', hex: '#06B6D4', bg: 'bg-cyan-500' },
  { name: 'Jaune', hex: '#EAB308', bg: 'bg-yellow-500' },
  { name: 'Indigo', hex: '#6366F1', bg: 'bg-indigo-500' },
  { name: 'Emerald', hex: '#059669', bg: 'bg-emerald-600' },
];

export const TagColorManager = ({ 
  userId, 
  existingTags = [], 
  tagColors = {}, 
  onUpdateColors,
  hasUpgrade 
}) => {
  const [colors, setColors] = useState(tagColors);
  const [editingTag, setEditingTag] = useState(null);
  const [customColor, setCustomColor] = useState('#3B82F6');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setColors(tagColors);
  }, [tagColors]);

  // Obtenir la couleur d'un tag
  const getTagColor = (tag) => {
    if (colors[tag]) return colors[tag];
    // Couleur par défaut basée sur le hash du tag
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % DEFAULT_COLORS.length;
    return DEFAULT_COLORS[index].hex;
  };

  // Sauvegarder les couleurs
  const saveColors = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ tag_colors: colors })
      .eq('id', userId);
    
    if (error) {
      console.error('Erreur sauvegarde couleurs:', error);
      alert('Erreur lors de la sauvegarde');
    } else {
      if (onUpdateColors) onUpdateColors(colors);
    }
    
    setSaving(false);
  };

  // Changer la couleur d'un tag
  const changeTagColor = (tag, color) => {
    const newColors = { ...colors, [tag]: color };
    setColors(newColors);
  };

  // Réinitialiser un tag
  const resetTagColor = (tag) => {
    const newColors = { ...colors };
    delete newColors[tag];
    setColors(newColors);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">🎨 Couleurs des tags</h2>
          <p className="text-sm text-slate-600">
            {hasUpgrade 
              ? 'Personnalise les couleurs de tes tags' 
              : 'Amélioration "Personnaliser couleurs tags" requise (1000 🥔)'}
          </p>
        </div>
        {hasUpgrade && (
          <button
            onClick={saveColors}
            disabled={saving}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 font-semibold"
          >
            {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
          </button>
        )}
      </div>

      {!hasUpgrade && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-800 text-sm">
            ⚠️ Achète l'amélioration "Personnaliser couleurs tags" dans la boutique pour débloquer cette fonctionnalité !
          </p>
        </div>
      )}

      {/* Liste des tags existants */}
      {existingTags.length > 0 ? (
        <div className="space-y-3">
          {existingTags.map(tag => {
            const currentColor = getTagColor(tag);
            const isEditing = editingTag === tag;
            const isCustom = colors[tag] !== undefined;

            return (
              <div
                key={tag}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-slate-300"
                    style={{ backgroundColor: currentColor }}
                  />
                  <span className="font-semibold text-slate-900">{tag}</span>
                  {isCustom && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Personnalisé
                    </span>
                  )}
                </div>

                {hasUpgrade && (
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
                        >
                          Modifier
                        </button>
                        {isCustom && (
                          <button
                            onClick={() => {
                              resetTagColor(tag);
                              saveColors();
                            }}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium"
                          >
                            Réinitialiser
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Palette par défaut */}
                        <div className="flex gap-1">
                          {DEFAULT_COLORS.map(color => (
                            <button
                              key={color.hex}
                              onClick={() => {
                                changeTagColor(tag, color.hex);
                                setEditingTag(null);
                              }}
                              className="w-8 h-8 rounded-lg border-2 border-slate-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                        </div>

                        {/* Sélecteur de couleur custom */}
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <button
                            onClick={() => {
                              changeTagColor(tag, customColor);
                              setEditingTag(null);
                            }}
                            className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                          >
                            ✓
                          </button>
                        </div>

                        <button
                          onClick={() => setEditingTag(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-slate-500">Aucun tag créé pour le moment</p>
          <p className="text-sm text-slate-400 mt-2">Crée des tâches avec des tags pour les voir ici</p>
        </div>
      )}

      {hasUpgrade && existingTags.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            💡 Astuce : Les couleurs sont sauvegardées automatiquement quand tu cliques sur "Sauvegarder"
          </p>
        </div>
      )}
    </div>
  );
};

export default TagColorManager;
