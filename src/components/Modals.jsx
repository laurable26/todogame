import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

// Modal de création/édition de tâche
export const CreateTaskModal = ({ onClose, onCreate, onDelete, initialTask, getStatusColor, missionMode, ownedItems = [], activeUpgrades = {}, existingTags = [], userId }) => {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [status, setStatus] = useState(initialTask?.status || 'à faire');
  const [duration, setDuration] = useState(initialTask?.duration || '1h-2h');
  const [date, setDate] = useState(initialTask?.date ? new Date(initialTask.date).toISOString().split('T')[0] : '');
  const [recurrence, setRecurrence] = useState(initialTask?.recurrence || 'none');
  const [recurrenceDays, setRecurrenceDays] = useState(initialTask?.recurrenceDays || []);
  const [tags, setTags] = useState(initialTask?.tags?.join(', ') || '');
  const [notes, setNotes] = useState(initialTask?.notes || '');
  const [photos, setPhotos] = useState(initialTask?.photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [assignedTo, setAssignedTo] = useState(initialTask?.assignedTo || '');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const cameraInputRef = useRef(null);

  const isEditing = !!initialTask;
  
  // Notes étendues : 2000 caractères au lieu de 500 (possédé ET actif)
  const hasExtendedNotes = ownedItems.includes(72) && activeUpgrades[72] !== false;
  const hasPhotoNotes = ownedItems.includes(86) && activeUpgrades[86] !== false;
  const notesMaxLength = hasExtendedNotes ? 2000 : 500;

  const weekDays = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mer' },
    { value: 4, label: 'Jeu' },
    { value: 5, label: 'Ven' },
    { value: 6, label: 'Sam' },
    { value: 0, label: 'Dim' },
  ];

  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

  const toggleDay = (day) => {
    if (recurrenceDays.includes(day)) {
      setRecurrenceDays(recurrenceDays.filter(d => d !== day));
    } else {
      setRecurrenceDays([...recurrenceDays, day]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onCreate({
      title: title.trim(),
      status,
      duration,
      date: date ? new Date(date) : null,
      recurrence,
      recurrenceDays: (recurrence === 'weekly' || recurrence === 'monthly') ? recurrenceDays : [],
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      notes: notes.trim(),
      photos: photos,
      assignedTo: assignedTo || null,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay bleu pour les tâches */}
      <div className="fixed inset-0 bg-indigo-500" onClick={onClose}></div>
      
      {/* Conteneur centré */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[85vh] overflow-hidden flex flex-col border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </h2>
              {missionMode && (
                <p className="text-sm text-slate-500">Pour : {missionMode.title}</p>
              )}
            </div>
            <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Titre *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Ex: Finir le rapport"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
              />
              <div className="text-xs text-slate-400 text-right mt-1">{title.length}/100</div>
            </div>

            {/* Importance */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Importance</label>
              <div className="grid grid-cols-3 gap-2">
                {['urgent', 'à faire', 'délégué'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`py-3 rounded-xl border-2 font-semibold transition-all ${
                      status === s 
                        ? s === 'urgent' ? 'bg-red-50 border-red-300 text-red-700' 
                          : s === 'à faire' ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Durée</label>
              <div className="grid grid-cols-4 gap-2">
                {['-1h', '1h-2h', '1/2 jour', '1 jour'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      duration === d 
                        ? 'bg-indigo-500 text-white border-indigo-500' 
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Date - masqué en mode mission normale, mais avec un champ optionnel pour missions */}
            {!missionMode && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Récurrence - masqué en mode mission */}
            {!missionMode && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Récurrence</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'none', label: 'Aucune' },
                    { value: 'daily', label: 'Quotidien' },
                    { value: 'weekly', label: 'Hebdo' },
                    { value: 'monthly', label: 'Mensuel' },
                  ].map(r => (
                    <button
                      key={r.value}
                      onClick={() => {
                        setRecurrence(r.value);
                        if (r.value !== 'weekly' && r.value !== 'monthly') {
                          setRecurrenceDays([]);
                        }
                      }}
                      className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        recurrence === r.value 
                          ? 'bg-purple-500 text-white border-purple-500' 
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Sélection des jours de la semaine */}
                {recurrence === 'weekly' && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Sélectionner les jours :</p>
                    <div className="grid grid-cols-7 gap-1">
                      {weekDays.map(day => (
                        <button
                          key={day.value}
                          onClick={() => toggleDay(day.value)}
                          className={`py-2 rounded-lg border-2 font-semibold text-xs transition-all ${
                            recurrenceDays.includes(day.value)
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'border-slate-200 text-slate-600 hover:border-purple-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sélection des jours du mois */}
                {recurrence === 'monthly' && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-2">Sélectionner les jours du mois :</p>
                    <div className="grid grid-cols-7 gap-1">
                      {monthDays.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`py-2 rounded-lg border-2 font-semibold text-xs transition-all ${
                            recurrenceDays.includes(day)
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'border-slate-200 text-slate-600 hover:border-purple-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assignation - uniquement en mode mission */}
            {missionMode && missionMode.participants && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Assigner à</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Non assignée</option>
                  {missionMode.participants.map(p => (
                    <option key={p.pseudo} value={p.pseudo}>{p.pseudo}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date optionnelle - en mode mission */}
            {missionMode && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date (optionnelle)</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Tags avec autocomplétion */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Catégories (séparées par des virgules)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => {
                  setTags(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                placeholder="Ex: BTS, Site web"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
              />
              
              {/* Suggestions de tags */}
              {showTagSuggestions && existingTags.length > 0 && (() => {
                // Récupérer le dernier mot tapé après la dernière virgule
                const currentInput = tags.split(',').pop().trim().toLowerCase();
                const alreadyUsedTags = tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t);
                
                // Filtrer les suggestions
                const suggestions = existingTags.filter(tag => 
                  tag.toLowerCase().includes(currentInput) && 
                  !alreadyUsedTags.includes(tag.toLowerCase())
                ).slice(0, 5);
                
                if (suggestions.length === 0) return null;
                
                return (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-indigo-50 text-slate-700 text-sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          // Remplacer le dernier mot par la suggestion
                          const parts = tags.split(',');
                          parts.pop();
                          const newTags = parts.length > 0 
                            ? parts.join(', ').trim() + ', ' + suggestion + ', '
                            : suggestion + ', ';
                          setTags(newTags);
                        }}
                      >
                        #{suggestion}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Notes avec éditeur de texte */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Notes {hasExtendedNotes && <span className="text-indigo-500 text-xs">(étendu)</span>}
              </label>
              
              {/* Barre d'outils éditeur - si amélioration achetée et active */}
              {(ownedItems.includes(85) && activeUpgrades[85] !== false) || hasPhotoNotes ? (
                <div className="flex items-center gap-1 mb-2 p-2 bg-slate-100 rounded-lg flex-wrap">
                  {ownedItems.includes(85) && activeUpgrades[85] !== false && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById('notes-textarea');
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = notes.substring(start, end);
                          const newText = notes.substring(0, start) + '**' + selectedText + '**' + notes.substring(end);
                          setNotes(newText.slice(0, notesMaxLength));
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50"
                        title="Gras"
                      >
                        G
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById('notes-textarea');
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = notes.substring(start, end);
                          const newText = notes.substring(0, start) + '_' + selectedText + '_' + notes.substring(end);
                          setNotes(newText.slice(0, notesMaxLength));
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm italic hover:bg-slate-50"
                        title="Italique"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById('notes-textarea');
                          const start = textarea.selectionStart;
                          const newText = notes.substring(0, start) + '\n• ' + notes.substring(start);
                          setNotes(newText.slice(0, notesMaxLength));
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                        title="Liste à puces"
                      >
                        • Liste
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById('notes-textarea');
                          const start = textarea.selectionStart;
                          const newText = notes.substring(0, start) + '\n☐ ' + notes.substring(start);
                          setNotes(newText.slice(0, notesMaxLength));
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                        title="Checklist"
                      >
                        ☐ Check
                      </button>
                    </>
                  )}
                  
                  {/* Bouton photo */}
                  {hasPhotoNotes && (
                    <>
                      <div className="w-px h-6 bg-slate-300 mx-1"></div>
                      {/* Bouton galerie */}
                      <label className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 cursor-pointer flex items-center gap-1">
                        {uploadingPhoto ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <>🖼️ Galerie</>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !userId) return;
                            
                            setUploadingPhoto(true);
                            try {
                              const fileExt = file.name.split('.').pop();
                              const fileName = `${userId}/${Date.now()}.${fileExt}`;
                              
                              const { data, error } = await supabase.storage
                                .from('notes-photos')
                                .upload(fileName, file);
                              
                              if (error) throw error;
                              
                              const { data: urlData } = supabase.storage
                                .from('notes-photos')
                                .getPublicUrl(fileName);
                              
                              setPhotos([...photos, urlData.publicUrl]);
                            } catch (error) {
                              console.error('Erreur upload:', error);
                              alert('Erreur lors de l\'upload de la photo');
                            }
                            setUploadingPhoto(false);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {/* Bouton caméra */}
                      <label className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 cursor-pointer flex items-center gap-1">
                        {uploadingPhoto ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <>📷 Photo</>
                        )}
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={uploadingPhoto}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !userId) return;
                            
                            setUploadingPhoto(true);
                            try {
                              const fileExt = file.name.split('.').pop();
                              const fileName = `${userId}/${Date.now()}.${fileExt}`;
                              
                              const { data, error } = await supabase.storage
                                .from('notes-photos')
                                .upload(fileName, file);
                              
                              if (error) throw error;
                              
                              const { data: urlData } = supabase.storage
                                .from('notes-photos')
                                .getPublicUrl(fileName);
                              
                              setPhotos([...photos, urlData.publicUrl]);
                            } catch (error) {
                              console.error('Erreur upload:', error);
                              alert('Erreur lors de l\'upload de la photo');
                            }
                            setUploadingPhoto(false);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              ) : null}
              
              {/* Photos uploadées */}
              {photos.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img 
                        src={url} 
                        alt={`Photo ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setEnlargedPhoto(url)}
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Modal photo agrandie */}
              {enlargedPhoto && (
                <div 
                  className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
                  onClick={() => setEnlargedPhoto(null)}
                >
                  <div className="relative max-w-4xl max-h-[90vh]">
                    <img 
                      src={enlargedPhoto} 
                      alt="Photo agrandie"
                      className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                    <button
                      onClick={() => setEnlargedPhoto(null)}
                      className="absolute top-2 right-2 w-10 h-10 bg-black/50 text-white rounded-full text-xl hover:bg-black/70 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              <textarea
                id="notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, notesMaxLength))}
                placeholder="Ajouter des notes ou détails..."
                rows={hasExtendedNotes ? 6 : 4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="text-xs text-slate-400 text-right mt-1">{notes.length}/{notesMaxLength}</div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              Enregistrer
            </button>
            
            {isEditing && onDelete && (
              <button
                onClick={onDelete}
                className="px-6 bg-red-100 hover:bg-red-200 text-red-600 py-4 rounded-xl font-bold text-xl"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal coffre ouvert
export const ChestOpenedModal = ({ chest, onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay blanc pour les popups */}
      <div className="fixed inset-0 bg-slate-100"></div>
      
      {/* Conteneur centré */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg h-[85vh] overflow-y-auto text-center shadow-2xl border border-slate-200 flex flex-col justify-center">
          <div className="text-6xl mb-4 animate-bounce">📦</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Coffre {chest.type} ouvert !</h2>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 my-6 border-2 border-amber-200">
            <div className="text-4xl mb-2">🥔</div>
            <div className="text-3xl font-black text-amber-700">+{chest.rewards.points}</div>
            <div className="text-sm text-amber-600">patates</div>
          </div>

          {chest.rewards.items && chest.rewards.items.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-3">Item bonus :</p>
              {chest.rewards.items.map((item, i) => (
                <div key={i} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="text-4xl mb-2">{item.image}</div>
                  <div className="font-bold text-purple-900">{item.name}</div>
                  <div className="text-xs text-purple-600">{item.type}</div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
          >
            Super ! 🎉
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal tâche complétée avec confettis
export const TaskCompletedModal = ({ task, onClose }) => {
  const encouragements = [
    "Bravo, continue comme ça !",
    "Tu es sur la bonne voie !",
    "Excellent travail !",
    "Tu gères !",
    "Rien ne t'arrête !",
    "Champion !",
    "Une tâche de plus !",
    "Tu assures !",
    "Impressionnant !",
    "Keep going !",
  ];
  const randomMessage = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Overlay bleu pour les tâches */}
      <div className="fixed inset-0 bg-indigo-500"></div>
      
      {/* Confettis animés */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(80)].map((_, i) => {
          const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];
          const size = 6 + Math.random() * 10;
          const left = Math.random() * 100;
          const delay = Math.random() * 0.5;
          const duration = 2 + Math.random() * 2;
          const rotation = Math.random() * 360;
          
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${left}%`,
                top: '-20px',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                transform: `rotate(${rotation}deg)`,
                animation: `confettiFall ${duration}s ease-out ${delay}s forwards`,
              }}
            />
          );
        })}
      </div>

      {/* Cercles de célébration */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-64 h-64 rounded-full border-4 border-yellow-400 animate-ping opacity-20"></div>
        <div className="absolute w-48 h-48 rounded-full border-4 border-purple-400 animate-ping opacity-30" style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute w-32 h-32 rounded-full border-4 border-green-400 animate-ping opacity-40" style={{ animationDelay: '0.4s' }}></div>
      </div>

      {/* Conteneur centré */}
      <div className="min-h-full flex items-center justify-center p-4 relative z-20">
        <div className="bg-white rounded-3xl p-8 w-full max-w-lg h-[85vh] overflow-y-auto flex flex-col justify-center text-center animate-bounce-in shadow-2xl border border-slate-200">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500 mb-2">
            Tâche terminée !
          </h2>
          <p className="text-slate-600 mb-6 text-lg">{randomMessage}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl p-4 border-2 border-indigo-200">
              <div className="text-3xl sm:text-4xl font-black text-indigo-600">+{task.xp}</div>
              <div className="text-3xl mt-1">⚡</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-4 border-2 border-amber-200">
              <div className="text-3xl sm:text-4xl font-black text-amber-600">+{task.points}</div>
              <div className="text-3xl mt-1">🥔</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
          >
            Continuer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

// Modal mission complétée
export const MissionCompletedModal = ({ mission, pqDistribution, onClose }) => {
  const [showRewards, setShowRewards] = useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setShowRewards(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Calculer le total PQ distribué
  const totalPQ = pqDistribution ? Object.values(pqDistribution).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center z-50 p-4">
      {/* Confettis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          >
            <span className="text-2xl">{['🎉', '🎊', '⭐', '✨', '🧻'][Math.floor(Math.random() * 5)]}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center">
        {!showRewards ? (
          <div className="animate-bounce">
            <div className="text-9xl mb-4">🎯</div>
            <h2 className="text-4xl font-black text-white mb-2">Mission accomplie !</h2>
            {mission && <p className="text-xl text-white/80">{mission.title}</p>}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full animate-bounce-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Mission accomplie !</h2>
            {mission && <p className="text-slate-500 mb-4">{mission.title}</p>}
            
            {/* Récompenses par participant */}
            <div className="bg-purple-50 rounded-2xl p-4 my-4 border-2 border-purple-200">
              <div className="text-sm text-purple-600 mb-3 font-semibold">Répartition des récompenses</div>
              <div className="space-y-2">
                {pqDistribution && Object.entries(pqDistribution).map(([pseudo, pq]) => {
                  const participant = mission?.participants?.find(p => p.pseudo === pseudo);
                  return (
                    <div key={pseudo} className="flex items-center justify-between bg-white rounded-xl px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{participant?.avatar || '👤'}</span>
                        <span className="font-medium text-slate-700">{pseudo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">🧻</span>
                        <span className="font-bold text-pink-600">+{pq}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-purple-200 flex items-center justify-center gap-2">
                <span className="text-lg">🧻</span>
                <span className="text-2xl font-black text-pink-600">+{totalPQ}</span>
                <span className="text-sm text-purple-600">total</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
            >
              Excellent ! 🎉
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

// Modal paramètres
export const SettingsModal = ({ user, onClose, onUpdateUser, onLogout, onUpdateEmail, onUpdatePassword, onDeleteAccount, ownedItems = [], activeUpgrades = {}, onToggleUpgrade, shopItems = [], onCheckPseudo, notificationStatus, onEnableNotifications, onDisableNotifications, isNotificationSupported }) => {
  const [pseudo, setPseudo] = useState(user.pseudo);
  const [email, setEmail] = useState(user.email || '');
  const [customTitle, setCustomTitle] = useState(user.customTitle || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [pseudoError, setPseudoError] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Filtrer les améliorations possédées (pas les boosts)
  const ownedUpgrades = shopItems.filter(item => 
    item.type === 'amelioration' && ownedItems.includes(item.id)
  );
  
  // Vérifier si le titre personnalisé est actif
  const hasCustomTitle = ownedItems.includes(79) && activeUpgrades[79] !== false;

  const handleSaveChanges = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    setPseudoError('');

    try {
      // Vérifier unicité du pseudo si changé
      if (pseudo !== user.pseudo) {
        if (pseudo.length < 3) {
          setPseudoError('Le pseudo doit contenir au moins 3 caractères');
          setLoading(false);
          return;
        }
        if (onCheckPseudo) {
          const isAvailable = await onCheckPseudo(pseudo);
          if (!isAvailable) {
            setPseudoError('Ce pseudo est déjà pris');
            setLoading(false);
            return;
          }
        }
      }

      // Mise à jour du pseudo et titre si changé
      if (pseudo !== user.pseudo || customTitle !== user.customTitle) {
        onUpdateUser({ ...user, pseudo, customTitle });
      }

      // Mise à jour de l'email si changé
      if (email !== user.email && email) {
        const result = await onUpdateEmail(email);
        if (!result.success) {
          setMessage({ type: 'error', text: result.error });
          setLoading(false);
          return;
        }
      }

      // Mise à jour du mot de passe si rempli
      if (newPassword && currentPassword) {
        if (newPassword.length < 8) {
          setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
          setLoading(false);
          return;
        }
        const result = await onUpdatePassword(newPassword);
        if (!result.success) {
          setMessage({ type: 'error', text: result.error });
          setLoading(false);
          return;
        }
        setCurrentPassword('');
        setNewPassword('');
      }

      setMessage({ type: 'success', text: 'Modifications enregistrées !' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;
    setLoading(true);
    const result = await onDeleteAccount();
    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Erreur lors de la suppression' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay blanc pour les popups */}
      <div className="fixed inset-0 bg-slate-100" onClick={onClose}></div>
      
      {/* Conteneur centré */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[85vh] overflow-hidden flex flex-col border border-slate-200">
          {/* Header */}
          <div className="p-5 flex justify-between items-center border-b border-slate-100 shrink-0">
            <h2 className="text-xl font-bold text-slate-900">Paramètres du compte</h2>
            <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="p-5 space-y-6 overflow-y-auto flex-1">
            {/* Profil avec avatar */}
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 bg-gradient-to-br ${user.avatarBg} rounded-2xl flex items-center justify-center text-4xl shadow-lg`}>
                <span className="emoji-display">{user.avatar}</span>
              </div>
              <div>
                <div className="font-bold text-xl text-slate-900">{user.pseudo}</div>
                <div className="text-sm text-slate-400">Modifie ton avatar dans la boutique</div>
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`p-3 rounded-xl text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* Pseudo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pseudo</label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => {
                  setPseudo(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase());
                  setPseudoError('');
                }}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 focus:outline-none ${
                  pseudoError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {pseudoError && (
                <p className="text-xs text-red-500 mt-1">{pseudoError}</p>
              )}
            </div>

            {/* Titre personnalisé (si acheté et actif) */}
            {hasCustomTitle && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  🏷️ Titre personnalisé
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value.slice(0, 30))}
                  placeholder="Ex: Aventurier Légendaire"
                  maxLength={30}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">{customTitle.length}/30 caractères</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Séparateur */}
            <hr className="border-slate-200" />

            {/* Notifications */}
            {isNotificationSupported && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900">🔔 Notifications</h3>
                <p className="text-sm text-slate-600">
                  Reçois des rappels pour tes événements même quand l'app est fermée.
                </p>
                
                {notificationStatus === 'loading' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    <span className="text-slate-500">Chargement...</span>
                  </div>
                ) : notificationStatus === 'enabled' ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-green-700 font-medium">Notifications activées</span>
                    </div>
                    <button
                      onClick={async () => {
                        setNotifLoading(true);
                        await onDisableNotifications();
                        setNotifLoading(false);
                      }}
                      disabled={notifLoading}
                      className="px-4 py-2 bg-white border border-green-300 rounded-lg text-green-700 text-sm font-medium hover:bg-green-100 transition-all disabled:opacity-50"
                    >
                      {notifLoading ? '...' : 'Désactiver'}
                    </button>
                  </div>
                ) : notificationStatus === 'denied' ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm">
                      ⚠️ Les notifications sont bloquées. Autorise-les dans les paramètres de ton navigateur.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setNotifLoading(true);
                      await onEnableNotifications();
                      setNotifLoading(false);
                    }}
                    disabled={notifLoading}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {notifLoading ? 'Activation...' : '🔔 Activer les notifications'}
                  </button>
                )}
              </div>
            )}

            {/* Séparateur */}
            <hr className="border-slate-200" />

            {/* Changer le mot de passe */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Changer le mot de passe</h3>
              
              <div>
                <label className="block text-sm text-slate-600 mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Bouton Enregistrer */}
            <button
              onClick={handleSaveChanges}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>

            {/* Bouton Déconnexion */}
            <button
              onClick={onLogout}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-semibold transition-all"
            >
              Se déconnecter
            </button>

            {/* Séparateur */}
            <hr className="border-slate-200" />

            {/* Mes données - RGPD */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Mes données</h3>
              
              <button
                onClick={async () => {
                  try {
                    // Créer un fichier texte lisible
                    const date = new Date().toLocaleDateString('fr-FR');
                    const textContent = `=== MES DONNÉES TODOGAME ===
Date d'export : ${date}

PROFIL
- Pseudo : ${user?.pseudo || 'Non défini'}
- Email : ${email || 'Non défini'}
- Niveau : ${user?.level || 1}
- XP : ${user?.xp || 0}
- Patates : ${user?.potatoes || 0}
- Avatar : ${user?.avatar || '🎮'}

STATISTIQUES
- Tâches complétées : ${user?.tasksCompleted || 0}
- Événements complétés : ${user?.eventsCompleted || 0}
- Missions complétées : ${user?.missionsCompleted || 0}

---
Données exportées conformément au RGPD
Droit à la portabilité des données`;
                    
                    // Créer et télécharger le fichier texte
                    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `todogame-export-${new Date().toISOString().split('T')[0]}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Erreur export:', error);
                  }
                }}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-3 rounded-xl font-semibold border border-indigo-200 transition-all"
              >
                Exporter mes données
              </button>
              
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-3 rounded-xl font-semibold border border-slate-200 transition-all"
              >
                Politique de confidentialité
              </button>
            </div>

            {/* Séparateur */}
            <hr className="border-slate-200" />

            {/* Zone dangereuse */}
            <div className="space-y-3">
              <h3 className="font-bold text-red-500">Zone dangereuse</h3>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-xl font-semibold border border-red-200 transition-all"
                >
                  Supprimer mon compte
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-3">
                  <p className="text-sm text-red-600">
                    ⚠️ Cette action est irréversible. Toutes vos données seront supprimées définitivement.
                  </p>
                  <p className="text-sm text-slate-600">
                    Tapez <strong>SUPPRIMER</strong> pour confirmer :
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="SUPPRIMER"
                    className="w-full bg-white border border-red-300 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                      className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'SUPPRIMER' || loading}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Politique de Confidentialité */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Politique de Confidentialité</h2>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="text-2xl text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-700 space-y-4">
              <p className="text-slate-500 italic">Dernière mise à jour : Décembre 2025</p>
              
              <h3 className="font-bold text-slate-900">1. Responsable du traitement</h3>
              <p>ToDoGame est une application de gestion de tâches gamifiée. Le responsable du traitement des données est l'éditeur de l'application.</p>
              
              <h3 className="font-bold text-slate-900">2. Données collectées</h3>
              <p>Nous collectons les données suivantes :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Compte utilisateur :</strong> email, pseudo, mot de passe (hashé)</li>
                <li><strong>Données de jeu :</strong> tâches, événements, missions, progression, récompenses</li>
                <li><strong>Données sociales :</strong> liste d'amis, participations aux missions</li>
                <li><strong>Données techniques :</strong> token de notification push (si activé)</li>
              </ul>
              
              <h3 className="font-bold text-slate-900">3. Finalités du traitement</h3>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gérer votre compte et authentification</li>
                <li>Fournir les fonctionnalités de l'application (tâches, missions, récompenses)</li>
                <li>Permettre les interactions sociales (amis, missions collaboratives)</li>
                <li>Envoyer des notifications de rappel (si vous les activez)</li>
              </ul>
              
              <h3 className="font-bold text-slate-900">4. Base légale</h3>
              <p>Le traitement est basé sur votre consentement lors de l'inscription et l'exécution du contrat de service.</p>
              
              <h3 className="font-bold text-slate-900">5. Durée de conservation</h3>
              <p>Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, toutes vos données sont effacées définitivement.</p>
              
              <h3 className="font-bold text-slate-900">6. Vos droits</h3>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Droit d'accès :</strong> exporter vos données depuis les paramètres</li>
                <li><strong>Droit de rectification :</strong> modifier vos informations dans l'app</li>
                <li><strong>Droit à l'effacement :</strong> supprimer votre compte dans les paramètres</li>
                <li><strong>Droit à la portabilité :</strong> exporter vos données au format JSON</li>
              </ul>
              
              <h3 className="font-bold text-slate-900">7. Sécurité</h3>
              <p>Vos données sont protégées par :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Chiffrement des mots de passe (bcrypt)</li>
                <li>Connexion sécurisée HTTPS</li>
                <li>Politiques de sécurité Row Level Security (RLS)</li>
                <li>Hébergement sur des serveurs sécurisés (Supabase, Vercel)</li>
              </ul>
              
              <h3 className="font-bold text-slate-900">8. Partage des données</h3>
              <p>Vos données ne sont jamais vendues à des tiers. Elles sont partagées uniquement avec :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Supabase (hébergement base de données)</li>
                <li>Firebase (notifications push)</li>
                <li>Vercel (hébergement application)</li>
              </ul>
              
              <h3 className="font-bold text-slate-900">9. Contact</h3>
              <p>
                Pour toute question concernant vos données,{' '}
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSffbCto_beD9OxnQd0QmwExeNm-XPUqu1tx6aAeh1lJxpGHYA/viewform" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline font-medium"
                >
                  contactez-nous via ce formulaire
                </a>.
              </p>
            </div>
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal création mission
export const CreateMissionModal = ({ onClose, friends, user, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);

  const toggleFriend = (pseudo) => {
    if (selectedFriends.includes(pseudo)) {
      setSelectedFriends(selectedFriends.filter(p => p !== pseudo));
    } else {
      setSelectedFriends([...selectedFriends, pseudo]);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    
    const participants = [
      { pseudo: user.pseudo, avatar: user.avatar, contribution: 0 },
      ...selectedFriends.map(pseudo => {
        const friend = friends.find(f => f.pseudo === pseudo);
        return { pseudo, avatar: friend?.avatar || '👤', contribution: 0 };
      })
    ];

    onCreate({
      title: title.trim(),
      description: description.trim(),
      participants,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay violet pour les missions */}
      <div className="fixed inset-0 bg-purple-500" onClick={onClose}></div>
      
      {/* Conteneur centré */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[85vh] overflow-hidden flex flex-col border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold text-slate-900">Nouvelle Mission</h2>
            <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Titre *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Projet Site Web"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                placeholder="Objectif de la mission..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Inviter des amis *
                {selectedFriends.length === 0 && (
                  <span className="text-red-500 text-xs ml-2">(minimum 1 ami requis)</span>
                )}
              </label>
              {friends.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {friends.map(friend => (
                    <button
                      key={friend.pseudo}
                      onClick={() => toggleFriend(friend.pseudo)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        selectedFriends.includes(friend.pseudo)
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-xl">
                        {friend.avatar}
                      </div>
                      <span className="font-medium text-slate-900">{friend.pseudo}</span>
                      {selectedFriends.includes(friend.pseudo) && (
                        <span className="ml-auto text-purple-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Ajoute des amis pour créer des missions en équipe !</p>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-200">
            <button
              onClick={handleCreate}
              disabled={!title.trim() || selectedFriends.length === 0}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer la mission
            </button>
            {selectedFriends.length === 0 && friends.length > 0 && (
              <p className="text-center text-xs text-slate-500 mt-2">Sélectionne au moins un ami pour créer la mission</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal détail mission
export const MissionDetailModal = ({ 
  mission, 
  onClose, 
  onTakeQuest, 
  onCompleteQuest, 
  onAddQuest,
  onAddEvent, 
  onEditQuest, 
  onAddMember,
  onRemoveMember,
  onDeleteMission,
  currentUser, 
  getModeLabel, 
  friends, 
  user 
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const completedQuests = mission.quests?.filter(q => q.completed).length || 0;
  const totalQuests = mission.quests?.length || 0;
  const progress = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;
  
  // Mission terminée ?
  const isMissionCompleted = totalQuests > 0 && completedQuests === totalQuests;
  
  // Amis qui ne sont pas encore dans la mission
  const availableFriends = friends.filter(f => 
    !mission.participants?.some(p => p.pseudo === f.pseudo)
  );
  
  // Vérifier si un membre peut être supprimé
  const canRemoveMember = (pseudo) => {
    if (isMissionCompleted) return false; // Mission terminée = pas de modif
    // Ne peut pas se supprimer soi-même si on est le créateur
    if (pseudo === mission.createdBy) return false;
    // Ne peut pas supprimer si moins de 2 membres
    if ((mission.participants?.length || 0) <= 2) return false;
    // Ne peut pas supprimer si le membre a une tâche assignée ou complétée
    const hasQuest = mission.quests?.some(q => 
      q.assignedTo === pseudo || q.completedBy === pseudo
    );
    return !hasQuest;
  };
  
  // Vérifier si la mission peut être supprimée
  // Peut supprimer : si aucune tâche commencée OU si mission terminée
  const canDeleteMission = !mission.quests?.some(q => q.completed || q.assignedTo) || isMissionCompleted;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{mission.title}</h2>
                {isMissionCompleted && (
                  <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-sm font-semibold">✅ Terminée</span>
                )}
              </div>
              {mission.description && (
                <p className="text-slate-600 mt-1">{mission.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canDeleteMission && (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-400 hover:text-red-600 text-xl"
                  title="Supprimer la mission"
                >
                  🗑️
                </button>
              )}
              <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
            </div>
          </div>
          
          {/* Participants */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Participants ({mission.participants?.length || 0})</span>
              {!isMissionCompleted && availableFriends.length > 0 && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="text-purple-600 text-sm font-semibold hover:text-purple-700"
                >
                  + Ajouter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {mission.participants?.map(p => (
                <div key={p.pseudo} className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full group">
                  <span>{p.avatar}</span>
                  <span className="text-sm font-medium">{p.pseudo}</span>
                  {p.pseudo === mission.createdBy && (
                    <span className="text-xs text-purple-500">👑</span>
                  )}
                  {canRemoveMember(p.pseudo) && (
                    <button
                      onClick={() => onRemoveMember && onRemoveMember(p.pseudo)}
                      className="ml-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Ajouter un membre */}
            {showAddMember && !isMissionCompleted && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-2">Sélectionner un ami à ajouter :</p>
                <div className="flex flex-wrap gap-2">
                  {availableFriends.map(f => (
                    <button
                      key={f.pseudo}
                      onClick={() => {
                        onAddMember && onAddMember(f);
                        setShowAddMember(false);
                      }}
                      className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-full hover:border-purple-400 hover:bg-purple-50"
                    >
                      <span>{f.avatar}</span>
                      <span className="text-sm">{f.pseudo}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">Progression</span>
              <span className="font-medium">{completedQuests}/{totalQuests} tâches</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900">Tâches & Événements</h3>
            {!isMissionCompleted && (
              <div className="flex gap-2">
                <button
                  onClick={onAddQuest}
                  className="bg-purple-500 text-white px-3 py-2 rounded-lg font-semibold text-sm hover:bg-purple-600"
                >
                  + Tâche
                </button>
                {onAddEvent && (
                  <button
                    onClick={onAddEvent}
                    className="bg-emerald-500 text-white px-3 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-600"
                  >
                    + Événement
                  </button>
                )}
              </div>
            )}
          </div>

          {mission.quests && mission.quests.length > 0 ? (
            <div className="space-y-3">
              {mission.quests.map(quest => {
                const isEvent = quest.isEvent;
                const bgColor = quest.completed 
                  ? 'bg-green-50 border-green-200' 
                  : isEvent 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-white border-slate-200';
                
                return (
                  <div 
                    key={quest.id}
                    className={`p-4 rounded-xl border-2 shadow-sm transition-all group ${bgColor}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Bouton compléter */}
                      {!isMissionCompleted && !quest.completed && quest.assignedTo === currentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteQuest(mission.id, quest.id);
                          }}
                          className={`mt-1 w-6 h-6 rounded-lg border-2 ${isEvent ? 'border-emerald-400 hover:border-emerald-600 hover:bg-emerald-100' : 'border-indigo-400 hover:border-indigo-600 hover:bg-indigo-100'} transition-all flex-shrink-0 flex items-center justify-center`}
                        >
                          <span className={`opacity-0 group-hover:opacity-100 ${isEvent ? 'text-emerald-600' : 'text-indigo-600'} text-xs`}>✓</span>
                        </button>
                      )}
                      {quest.completed && (
                        <div className="mt-1 w-6 h-6 rounded-lg bg-green-500 flex-shrink-0 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      
                      {/* Contenu */}
                      <div 
                        className={`flex-1 min-w-0 ${!isMissionCompleted && !quest.completed ? 'cursor-pointer' : ''}`} 
                        onClick={() => !isMissionCompleted && !quest.completed && onEditQuest && onEditQuest(quest, mission)}
                      >
                        {/* Titre + Récompenses */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-semibold ${quest.completed ? 'text-green-700 line-through' : isMissionCompleted ? 'text-slate-900' : 'text-slate-900 hover:text-purple-600'}`}>
                            {isEvent ? '📅 ' : ''}{quest.title}
                          </h4>
                          
                          {!quest.completed && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                                ⚡+{quest.xp || 10}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                                🥔+{quest.xp || 10}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Métadonnées */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                            ⏱️ {quest.duration}
                          </span>
                          {isEvent && quest.time && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-medium">
                              🕐 {quest.time}
                            </span>
                          )}
                          {quest.date && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                              📆 {new Date(quest.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          {isEvent && quest.location && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                              📍 {quest.location}
                            </span>
                          )}
                          {quest.assignedTo && (
                            <span className="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 text-xs font-medium">
                              @{quest.assignedTo}
                            </span>
                          )}
                          {quest.completedBy && quest.completed && (
                            <span className="px-2 py-0.5 rounded-lg bg-green-50 border border-green-200 text-green-600 text-xs font-medium">
                              ✓ {quest.completedBy}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!isMissionCompleted && !quest.completed && (
                        <div className="flex gap-2 flex-shrink-0">
                          {quest.assignedTo === currentUser ? (
                            <button
                              onClick={() => onCompleteQuest(mission.id, quest.id)}
                              className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-600"
                            >
                              ✓ Terminer
                            </button>
                          ) : !quest.assignedTo ? (
                            <button
                              onClick={() => onTakeQuest(mission.id, quest.id)}
                              className="bg-indigo-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-indigo-600"
                            >
                              Je prends
                            </button>
                          ) : (
                            <button
                              onClick={() => onTakeQuest(mission.id, quest.id)}
                              className="bg-slate-400 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-slate-500"
                            >
                              Reprendre
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl">
              <p className="text-slate-500">Aucune tâche pour le moment</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal confirmation suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Supprimer la mission ?</h3>
              <p className="text-slate-600 mb-4">Cette action est irréversible. La mission "{mission.title}" sera définitivement supprimée.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onDeleteMission && onDeleteMission(mission.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal création tâche de mission
export const CreateMissionQuestModal = ({ mission, onClose, onCreate, getStatusColor }) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('à faire');
  const [duration, setDuration] = useState('1h-2h');
  const [assignedTo, setAssignedTo] = useState('');

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay violet pour les missions */}
      <div className="fixed inset-0 bg-purple-500" onClick={onClose}></div>
      
      {/* Conteneur centré */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[85vh] overflow-hidden flex flex-col border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nouvelle tâche</h2>
              <p className="text-sm text-slate-500">Pour : {mission.title}</p>
            </div>
            <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Titre *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Réserver les billets..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Durée</label>
              <div className="grid grid-cols-4 gap-2">
                {['-1h', '1h-2h', '1/2 jour', '1 jour'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                      duration === d ? 'bg-purple-500 text-white border-purple-500' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {mission.mode === 'repartition' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Assigner à</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                >
                  <option value="">Non assignée</option>
                  {mission.participants?.map(p => (
                    <option key={p.pseudo} value={p.pseudo}>{p.pseudo}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200">
            <button
              onClick={() => {
                if (title.trim()) {
                  onCreate({ title: title.trim(), status, duration, assignedTo: assignedTo || null });
                }
              }}
              disabled={!title.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
            >
              Créer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal d'animation de badge débloqué
export const BadgeUnlockedModal = ({ badge, onClose }) => {
  const tierColors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-slate-300 to-slate-500',
    gold: 'from-yellow-400 to-amber-500'
  };

  const tierNames = {
    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or'
  };

  const tierGlow = {
    bronze: 'shadow-amber-500/50',
    silver: 'shadow-slate-400/50',
    gold: 'shadow-yellow-400/50'
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" onClick={onClose}>
      {/* Overlay blanc pour les popups */}
      <div className="fixed inset-0 bg-slate-100"></div>
      
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl w-full max-w-lg h-[85vh] overflow-y-auto flex flex-col justify-center text-center animate-badge-enter shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
          {/* Particules de célébration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 60}%`,
                  top: '50%',
                  backgroundColor: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 6],
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>

          {/* Badge qui tourne */}
          <div className={`relative w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${tierColors[badge.unlockedTier]} flex items-center justify-center shadow-2xl ${tierGlow[badge.unlockedTier]} animate-badge-spin`}>
            <span className="text-6xl">{badge.emoji}</span>
            
            {/* Anneau brillant */}
            <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-pulse"></div>
            <div className="absolute inset-[-4px] rounded-full border-2 border-white/20"></div>
          </div>

          {/* Texte */}
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl animate-fade-in-up border border-slate-200">
            <div className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-1">
              Badge débloqué !
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {badge.name}
            </h2>
            <div className={`inline-block px-4 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${tierColors[badge.unlockedTier]} mb-3`}>
              {tierNames[badge.unlockedTier]}
            </div>
            <p className="text-slate-500 text-sm mb-4">
              {badge.requirements[badge.unlockedTier]}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
            >
              Super ! 🎉
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes badge-enter {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes badge-spin {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(360deg); }
        }
        @keyframes fade-in-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) rotate(720deg) scale(0); opacity: 0; }
        }
        .animate-badge-enter {
          animation: badge-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-badge-spin {
          animation: badge-spin 2s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out 0.3s forwards;
          opacity: 0;
        }
        .animate-confetti {
          animation: confetti 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Placeholder pour EditMissionQuestModal
export const EditMissionQuestModal = CreateMissionQuestModal;

// Modal de création/édition d'événement
export const CreateEventModal = ({ onClose, onCreate, onDelete, initialEvent, friends = [], missionMode = null, missionParticipants = [] }) => {
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [date, setDate] = useState(initialEvent?.date ? new Date(initialEvent.date).toISOString().split('T')[0] : '');
  const [time, setTime] = useState(initialEvent?.time || '');
  const [duration, setDuration] = useState(initialEvent?.duration || '1h-2h');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [participants, setParticipants] = useState(initialEvent?.participants || []);
  const [reminder, setReminder] = useState(initialEvent?.reminder || 'none');
  const [assignedTo, setAssignedTo] = useState(initialEvent?.assignedTo || '');
  const [showFriendsList, setShowFriendsList] = useState(false);

  const isEditing = !!initialEvent;
  const isMissionEvent = !!missionMode;
  
  // Liste des participants disponibles (amis ou participants de mission)
  const availableParticipants = isMissionEvent ? missionParticipants : friends;

  const durations = ['-1h', '1h-2h', '1/2 jour', '1 jour'];
  const reminders = [
    { value: 'none', label: 'Pas de rappel' },
    { value: '0min', label: 'À l\'heure' },
    { value: '15min', label: '15 minutes avant' },
    { value: '30min', label: '30 minutes avant' },
    { value: '1h', label: '1 heure avant' },
    { value: '1day', label: '1 jour avant' },
  ];

  const toggleParticipant = (participant) => {
    const pseudo = participant.pseudo;
    if (participants.some(p => p.pseudo === pseudo)) {
      setParticipants(participants.filter(p => p.pseudo !== pseudo));
    } else {
      setParticipants([...participants, { pseudo, avatar: participant.avatar }]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !date || !time) return;
    
    onCreate({
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      time,
      duration,
      location: location.trim(),
      participants,
      reminder,
      assignedTo: isMissionEvent ? assignedTo : null,
      isEvent: true,
    });
  };

  // Calculer les récompenses basées sur la durée
  const getDurationXP = (dur) => {
    const base = { '-1h': 10, '1h-2h': 20, '1/2 jour': 40, '1 jour': 80 };
    return base[dur] || 10;
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay vert pour les événements */}
      <div className="fixed inset-0 bg-emerald-500" onClick={onClose}></div>
      
      {/* Conteneur centré */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[85vh] overflow-hidden flex flex-col border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isEditing ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              {isMissionEvent && (
                <p className="text-sm text-emerald-600">
                  Mission: {missionMode.title}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Titre *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Ex: Réunion équipe, Cinéma..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Date, Heure et Durée */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Heure *</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Durée</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 focus:outline-none focus:border-emerald-500 text-sm"
                >
                  {durations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rappel */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Rappel</label>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              >
                {reminders.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Lieu</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, 100))}
                placeholder="Ex: Salle de réunion, Cinéma UGC..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Participants (mode mission - sélection multiple parmi les membres) */}
            {isMissionEvent && missionParticipants.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Participants ({participants.length})
                </label>
                
                {/* Participants sélectionnés */}
                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {participants.map((p, i) => (
                      <div 
                        key={i}
                        onClick={() => toggleParticipant(p)}
                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-100"
                      >
                        <span className="emoji-display">{p.avatar}</span>
                        <span className="text-sm font-medium text-emerald-700">{p.pseudo}</span>
                        <span className="text-emerald-400">✕</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Bouton ajouter */}
                <button
                  type="button"
                  onClick={() => setShowFriendsList(!showFriendsList)}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all"
                >
                  + Ajouter des participants
                </button>
                
                {/* Liste des participants de la mission */}
                {showFriendsList && (
                  <div className="mt-3 bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {missionParticipants.map((member, i) => (
                      <div
                        key={i}
                        onClick={() => toggleParticipant(member)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          participants.some(p => p.pseudo === member.pseudo)
                            ? 'bg-emerald-100 border border-emerald-300'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                          <span className="emoji-display text-sm">{member.avatar}</span>
                        </div>
                        <span className="font-medium text-slate-700">{member.pseudo}</span>
                        {participants.some(p => p.pseudo === member.pseudo) && (
                          <span className="ml-auto text-emerald-500">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Participants (hors mode mission) */}
            {!isMissionEvent && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Participants ({participants.length})
                </label>
                
                {/* Participants sélectionnés */}
                {participants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {participants.map((p, i) => (
                      <div 
                        key={i}
                        onClick={() => toggleParticipant(p)}
                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-100"
                      >
                        <span className="emoji-display">{p.avatar}</span>
                        <span className="text-sm font-medium text-emerald-700">{p.pseudo}</span>
                        <span className="text-emerald-400">✕</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Bouton ajouter */}
                <button
                  type="button"
                  onClick={() => setShowFriendsList(!showFriendsList)}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-all"
                >
                  + Ajouter des participants
                </button>
                
                {/* Liste des amis */}
                {showFriendsList && availableParticipants.length > 0 && (
                  <div className="mt-3 bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {availableParticipants.map((friend, i) => (
                      <div
                        key={i}
                        onClick={() => toggleParticipant(friend)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                          participants.some(p => p.pseudo === friend.pseudo)
                            ? 'bg-emerald-100 border border-emerald-300'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                          <span className="emoji-display text-sm">{friend.avatar}</span>
                        </div>
                        <span className="font-medium text-slate-700">{friend.pseudo}</span>
                        {participants.some(p => p.pseudo === friend.pseudo) && (
                          <span className="ml-auto text-emerald-500">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Détails de l'événement..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !date || !time}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isEditing ? 'Modifier' : 'Créer l\'événement'}
            </button>
            
            {isEditing && onDelete && (
              <button
                onClick={onDelete}
                className="px-6 bg-red-100 hover:bg-red-200 text-red-600 py-4 rounded-xl font-bold text-xl"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal événement complété
export const EventCompletedModal = ({ event, onClose }) => {
  // Calculer XP basé sur la durée
  const getDurationXP = (dur) => {
    const base = { '-1h': 10, '1h-2h': 20, '1/2 jour': 40, '1 jour': 80 };
    return base[dur] || 10;
  };
  
  const xpGained = event.xp || getDurationXP(event.duration);
  const pointsGained = event.points || getDurationXP(event.duration);
  const pqGained = event.pq || (event.participants?.length || 0) * 5;
  
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Overlay vert */}
      <div className="fixed inset-0 bg-emerald-500"></div>
      
      {/* Conteneur centré */}
      <div className="min-h-full flex items-center justify-center p-4 relative z-20">
        <div className="bg-white rounded-3xl p-8 w-full max-w-lg h-[85vh] overflow-y-auto flex flex-col justify-center text-center shadow-2xl border border-slate-200">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 mb-2">
            Événement terminé !
          </h2>
          <p className="text-slate-600 mb-6 text-lg">{event.title}</p>
          
          <div className={`grid ${pqGained > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mb-6`}>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 border-2 border-blue-200">
              <div className="text-2xl font-black text-blue-600">+{xpGained}</div>
              <div className="text-2xl mt-1">⚡</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-4 border-2 border-amber-200">
              <div className="text-2xl font-black text-amber-600">+{pointsGained}</div>
              <div className="text-2xl mt-1">🥔</div>
            </div>
            {pqGained > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-4 border-2 border-emerald-200">
                <div className="text-2xl font-black text-emerald-600">+{pqGained}</div>
                <div className="text-2xl mt-1">🏆</div>
              </div>
            )}
          </div>

          {event.participants?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-2">Participants</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {event.participants.map((p, i) => (
                  <div key={i} className="bg-emerald-50 px-3 py-1 rounded-full text-sm text-emerald-700">
                    {p.avatar} {p.pseudo}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
          >
            Super ! 🎉
          </button>
        </div>
      </div>
    </div>
  );
};
