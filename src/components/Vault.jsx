import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

// Fonctions de chiffrement/déchiffrement
const deriveKey = async (pin, salt) => {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  const saltData = encoder.encode(salt);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encryptData = async (data, pin, salt) => {
  const key = await deriveKey(pin, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  
  // Combiner IV + données chiffrées
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Convertir en base64 par chunks pour éviter stack overflow
  let binary = '';
  const bytes = combined;
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
};

const decryptData = async (encryptedBase64, pin, salt) => {
  try {
    const key = await deriveKey(pin, salt);
    
    // Décoder base64
    const binaryString = atob(encryptedBase64);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return null; // Mauvais PIN
  }
};

// Composant PIN Pad
const PinPad = ({ onSubmit, onCancel, title, error, resetKey = 0 }) => {
  const [pin, setPin] = useState('');
  
  // Reset le PIN quand resetKey change (pour la confirmation)
  useEffect(() => {
    setPin('');
  }, [resetKey, error]);
  
  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          onSubmit(newPin);
        }, 200); // Petit délai pour voir le dernier point
      }
    }
  };
  
  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
      <div className="bg-slate-900 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {error && (
            <p className="text-red-400 text-sm mt-2 animate-pulse">{error}</p>
          )}
        </div>
        
        {/* Affichage du PIN */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length ? 'bg-emerald-400 scale-110' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
        
        {/* Clavier numérique */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
            <button
              key={digit}
              onClick={() => handleDigit(String(digit))}
              className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-bold py-4 rounded-xl transition-all active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm font-bold py-4 rounded-xl transition-all"
          >
            Annuler
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="bg-slate-700 hover:bg-slate-600 text-white text-2xl font-bold py-4 rounded-xl transition-all active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-2xl py-4 rounded-xl transition-all"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant principal Vault
export const Vault = ({ userId, onClose }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState(null); // null = loading, true/false
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [salt, setSalt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Vérifier si un PIN existe
  useEffect(() => {
    const checkPin = async () => {
      const { data } = await supabase
        .from('vault')
        .select('pin_hash, salt')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setHasPin(true);
        setSalt(data.salt);
      } else {
        setHasPin(false);
      }
    };
    
    checkPin();
  }, [userId]);

  // Créer un nouveau PIN
  const handleSetupPin = async (pin) => {
    if (!confirmPin) {
      setConfirmPin(pin);
      setError('');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('Les codes ne correspondent pas');
      setConfirmPin('');
      return;
    }
    
    // Créer le vault avec le PIN
    const newSalt = crypto.randomUUID();
    const pinHash = await encryptData('vault_check', pin, newSalt);
    
    const { error: dbError } = await supabase
      .from('vault')
      .insert({
        user_id: userId,
        pin_hash: pinHash,
        salt: newSalt,
        photos: []
      });
    
    if (!dbError) {
      setSalt(newSalt);
      setCurrentPin(pin);
      setHasPin(true);
      setIsLocked(false);
      setIsSettingPin(false);
    }
  };

  // Vérifier le PIN
  const handleUnlock = async (pin) => {
    const { data } = await supabase
      .from('vault')
      .select('pin_hash, salt, photos')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      const check = await decryptData(data.pin_hash, pin, data.salt);
      
      if (check === 'vault_check') {
        setCurrentPin(pin);
        setIsLocked(false);
        setError('');
        
        // Déchiffrer les photos
        if (data.photos && data.photos.length > 0) {
          const decryptedPhotos = [];
          for (const encPhoto of data.photos) {
            const decrypted = await decryptData(encPhoto, pin, data.salt);
            if (decrypted) decryptedPhotos.push(decrypted);
          }
          setPhotos(decryptedPhotos);
        }
      } else {
        setError('Code incorrect');
      }
    }
  };

  // Compresser une image
  const compressImage = (file, maxWidth = 1600, quality = 0.85) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculer les dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner et compresser
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Ajouter une photo
  const handleAddPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 25) return;
    
    setUploading(true);
    
    try {
      // Compresser l'image
      const compressed = await compressImage(file);
      
      // Chiffrer la photo
      const encrypted = await encryptData(compressed, currentPin, salt);
      
      // Récupérer les photos existantes chiffrées
      const { data } = await supabase
        .from('vault')
        .select('photos')
        .eq('user_id', userId)
        .single();
      
      const existingPhotos = data?.photos || [];
      const newPhotos = [...existingPhotos, encrypted];
      
      // Sauvegarder
      await supabase
        .from('vault')
        .update({ photos: newPhotos })
        .eq('user_id', userId);
      
      setPhotos([...photos, compressed]);
    } catch (err) {
      console.error('Erreur upload:', err);
    }
    
    setUploading(false);
  };

  // Supprimer une photo
  const handleDeletePhoto = async (index) => {
    if (!confirm('Supprimer cette photo ?')) return;
    
    const newPhotos = photos.filter((_, i) => i !== index);
    
    // Rechiffrer toutes les photos restantes
    const encryptedPhotos = [];
    for (const photo of newPhotos) {
      const encrypted = await encryptData(photo, currentPin, salt);
      encryptedPhotos.push(encrypted);
    }
    
    await supabase
      .from('vault')
      .update({ photos: encryptedPhotos })
      .eq('user_id', userId);
    
    setPhotos(newPhotos);
  };

  // Changer le PIN
  const handleChangePin = () => {
    setIsSettingPin(true);
    setConfirmPin('');
    setIsLocked(true);
  };

  // Loading
  if (hasPin === null) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  // Configuration du PIN initial
  if (!hasPin || isSettingPin) {
    return (
      <PinPad
        onSubmit={handleSetupPin}
        onCancel={onClose}
        title={confirmPin ? 'Confirmez le code' : 'Créez un code à 4 chiffres'}
        error={error}
        resetKey={confirmPin ? 1 : 0}
      />
    );
  }

  // Déverrouillage
  if (isLocked) {
    return (
      <PinPad
        onSubmit={handleUnlock}
        onCancel={onClose}
        title="Entrez votre code"
        error={error}
        resetKey={error ? Date.now() : 0}
      />
    );
  }

  // Coffre-fort déverrouillé
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔓</span>
          <div>
            <h2 className="text-white font-bold">Coffre-fort</h2>
            <p className="text-slate-400 text-sm">{photos.length}/25 photos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleChangePin}
            className="text-slate-400 hover:text-white p-2"
            title="Changer le code"
          >
            ⚙️
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl p-2"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Grille de photos */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="relative aspect-square bg-slate-800 rounded-xl overflow-hidden group"
          >
            <img 
              src={photo} 
              alt="" 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setFullscreenPhoto(photo)}
            />
            <button
              onClick={() => handleDeletePhoto(index)}
              className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {/* Bouton ajouter */}
        {photos.length < 25 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-white transition-all border-2 border-dashed border-slate-600 hover:border-slate-500"
          >
            {uploading ? (
              <span className="text-2xl animate-spin">⏳</span>
            ) : (
              <>
                <span className="text-4xl mb-2">+</span>
                <span className="text-sm">Ajouter</span>
              </>
            )}
          </button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAddPhoto}
          className="hidden"
        />
      </div>

      {/* Fullscreen photo */}
      {fullscreenPhoto && (
        <div 
          className="fixed inset-0 z-[10000] bg-black flex items-center justify-center"
          onClick={() => setFullscreenPhoto(null)}
        >
          <img 
            src={fullscreenPhoto} 
            alt="" 
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-4 right-4 text-white text-3xl"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

// Bouton flottant pour accéder au coffre-fort
export const VaultButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform border-2 border-slate-600"
    >
      🔐
    </button>
  );
};

export default Vault;
