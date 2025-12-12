import React, { useState } from 'react';
import logoImg from '../assets/todogamelogo.png';

export const AuthScreen = ({ mode, setMode, onLogin, onRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        if (!email || !password) {
          setError('Veuillez remplir tous les champs');
          setLoading(false);
          return;
        }
        const result = await onLogin(email, password);
        if (!result.success) {
          setError(result.error || 'Email ou mot de passe incorrect');
        }
      } else {
        if (!email || !password || !pseudo) {
          setError('Veuillez remplir tous les champs');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError('Le mot de passe doit contenir au moins 8 caractères');
          setLoading(false);
          return;
        }
        if (pseudo.length < 3) {
          setError('Le pseudo doit contenir au moins 3 caractères');
          setLoading(false);
          return;
        }
        if (!acceptPrivacy) {
          setError('Vous devez accepter la politique de confidentialité');
          setLoading(false);
          return;
        }
        const result = await onRegister(email, password, pseudo);
        if (!result.success) {
          setError(result.error || 'Erreur lors de l\'inscription');
        }
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);
    const result = await onForgotPassword(email);
    setLoading(false);

    if (result.success) {
      setSuccess('Un email de réinitialisation a été envoyé à votre adresse.');
    } else {
      setError(result.error || 'Erreur lors de l\'envoi de l\'email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header avec logo */}
        <div className="bg-white p-6 sm:p-8 text-center border-b border-slate-100">
          <img src={logoImg} alt="ToDoGame" className="w-40 h-40 mx-auto object-contain" />
          <h1 className="text-3xl font-black text-indigo-600 mt-4">ToDoGame</h1>
          <p className="text-slate-500 mt-2 text-sm">Transforme tes tâches en quête épique !</p>
        </div>

        {/* Formulaire mot de passe oublié */}
        {showForgotPassword ? (
          <div className="p-4 sm:p-6">
            <button 
              onClick={() => setShowForgotPassword(false)}
              className="text-indigo-600 text-sm font-semibold mb-4 hover:underline"
            >
              ← Retour à la connexion
            </button>
            
            <h2 className="text-xl font-bold text-slate-900 mb-2">Mot de passe oublié</h2>
            <p className="text-sm text-slate-500 mb-4">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                  placeholder="votre@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Onglets Connexion / Inscription */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 sm:py-4 font-semibold transition-all text-sm sm:text-base ${
                  mode === 'login' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 sm:py-4 font-semibold transition-all text-sm sm:text-base ${
                  mode === 'register' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Inscription
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pseudo unique</label>
                  <input
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                    placeholder="votre_pseudo"
                    maxLength={20}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                  <div className="text-xs text-slate-400 mt-1">Lettres, chiffres et _ uniquement</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                  placeholder="votre@email.com"
                  maxLength={100}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              )}

              {mode === 'register' && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptPrivacy"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="acceptPrivacy" className="text-sm text-slate-600">
                    J'accepte la{' '}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyPolicy(true)}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      politique de confidentialité
                    </button>
                    {' '}et le traitement de mes données personnelles.
                  </label>
                </div>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setError(''); setSuccess(''); }}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:opacity-90 transition-transform disabled:opacity-50"
              >
                {loading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte')}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Modal Politique de Confidentialité */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Politique de Confidentialité</h2>
              <button 
                onClick={() => setShowPrivacyPolicy(false)}
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
                onClick={() => { setShowPrivacyPolicy(false); setAcceptPrivacy(true); }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
              >
                J'ai lu et j'accepte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const OnboardingScreen = ({ onComplete, userName }) => {
  const [step, setStep] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState('🎮');
  const [selectedBg, setSelectedBg] = useState('from-slate-500 to-slate-700');

  const starterAvatars = [
    { emoji: '🎮', name: 'Gamer' },
    { emoji: '⚔️', name: 'Héros' },
    { emoji: '🌟', name: 'Star' },
    { emoji: '🚀', name: 'Fusée' },
    { emoji: '🎯', name: 'Cible' },
  ];

  const starterBackgrounds = [
    { name: 'Neutre', colors: 'from-slate-500 to-slate-700' },
    { name: 'Océan', colors: 'from-blue-500 to-cyan-500' },
    { name: 'Violet', colors: 'from-purple-500 to-pink-500' },
  ];

  const gameRules = [
    { icon: '✅', title: 'Compléter des quêtes', desc: 'Chaque tâche terminée rapporte de l\'XP et des patates' },
    { icon: '⚡', title: 'Monter de niveau', desc: 'Gagner de l\'XP pour débloquer de nouveaux avantages' },
    { icon: '🥔', title: 'Collecter des patates', desc: 'Utiliser les patates pour acheter des items dans la boutique' },
    { icon: '📦', title: 'Ouvrir des coffres', desc: 'Toutes les 8 tâches complétées, un coffre est gagné avec des récompenses' },
    { icon: '👥', title: 'Jouer avec ses amis', desc: 'Créer des missions en groupe et grimper dans le classement' },
    { icon: '🏆', title: 'Débloquer des badges', desc: 'Accomplir des défis pour collectionner des badges rares' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-white p-4 sm:p-6 text-center border-b border-slate-100 sticky top-0 z-10">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {step === 1 ? 'Règles du jeu' : `Bienvenue ${userName} !`}
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            {step === 1 ? 'Découvre comment fonctionne ToDoGame' : 'Personnalise ton avatar'}
          </p>
        </div>

        <div className="flex gap-2 px-4 sm:px-6 pt-4">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
        </div>

        <div className="p-4 sm:p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {gameRules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="text-2xl">{rule.icon}</div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{rule.title}</h3>
                      <p className="text-xs text-slate-600">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🎁</div>
                <div className="font-bold text-amber-900">Bonus de bienvenue</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-2xl">🥔</span>
                  <span className="text-2xl font-black text-amber-700">800 patates</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:scale-105 transition-transform"
              >
                J'ai compris !
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Choisir un avatar</h2>
                <p className="text-slate-500 text-xs sm:text-sm">D'autres avatars sont disponibles dans la boutique !</p>
              </div>

              <div className="flex justify-center">
                <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${selectedBg} rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-6xl shadow-xl`}>
                  {selectedAvatar}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {starterAvatars.map(avatar => (
                  <button
                    key={avatar.emoji}
                    onClick={() => setSelectedAvatar(avatar.emoji)}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      selectedAvatar === avatar.emoji 
                        ? 'bg-indigo-100 border-2 border-indigo-500 scale-105' 
                        : 'bg-slate-100 hover:bg-slate-200 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-3xl mb-1">{avatar.emoji}</span>
                    <span className="text-xs text-slate-600">{avatar.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-base hover:scale-105 transition-transform"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Choisir un style</h2>
                <p className="text-slate-500 text-xs sm:text-sm">Le fond de l'avatar</p>
              </div>

              <div className="flex justify-center">
                <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${selectedBg} rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-6xl shadow-xl`}>
                  {selectedAvatar}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {starterBackgrounds.map(bg => (
                  <button
                    key={bg.colors}
                    onClick={() => setSelectedBg(bg.colors)}
                    className={`p-3 rounded-xl transition-all ${
                      selectedBg === bg.colors 
                        ? 'ring-4 ring-indigo-500 scale-105' 
                        : 'hover:scale-105'
                    }`}
                  >
                    <div className={`w-full h-16 bg-gradient-to-br ${bg.colors} rounded-lg mb-2`}></div>
                    <span className="text-sm font-medium text-slate-700">{bg.name}</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-slate-500">
                D'autres couleurs sont disponibles dans la boutique !
              </p>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base"
                >
                  Retour
                </button>
                <button
                  onClick={() => onComplete(selectedAvatar, selectedBg)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-lg hover:scale-105 transition-transform"
                >
                  C'est parti ! 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4 animate-bounce">🎮</div>
      <div className="text-white text-2xl font-bold animate-pulse">Chargement...</div>
    </div>
  </div>
);
