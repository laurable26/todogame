import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CHOICES = [
  { id: 'rock', emoji: '✊', label: 'Pierre', beats: 'scissors' },
  { id: 'paper', emoji: '✋', label: 'Feuille', beats: 'rock' },
  { id: 'scissors', emoji: '✌️', label: 'Ciseaux', beats: 'paper' },
];

const BET_OPTIONS = [10, 25, 50, 100];

// Déterminer le gagnant
const getWinner = (choice1, choice2) => {
  if (choice1 === choice2) return 'draw';
  const c1 = CHOICES.find(c => c.id === choice1);
  if (c1.beats === choice2) return 'player1';
  return 'player2';
};

// Modal de défi Chifoumi - Le challenger choisit son coup en même temps
export const ChifoumiChallengeModal = ({ 
  friend, 
  myUserId, 
  myPotatoes,
  onClose, 
  onSendChallenge 
}) => {
  const [selectedBet, setSelectedBet] = useState(25);
  const [selectedChoice, setSelectedChoice] = useState(null); // pierre/feuille/ciseaux
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const friendPotatoes = friend.potatoes ?? Infinity;

  const handleSend = async () => {
    if (myPotatoes < selectedBet) {
      alert('Tu n\'as pas assez de patates !');
      return;
    }
    if (friendPotatoes < selectedBet) {
      alert(`${friend.pseudo} n'a que ${friendPotatoes} 🥔, choisis une mise plus petite !`);
      return;
    }
    if (!selectedChoice) {
      alert('Choisis ton coup !');
      return;
    }
    
    setSending(true);
    await onSendChallenge(friend, selectedBet, selectedChoice);
    setSending(false);
    setSent(true);
    
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const availableBets = BET_OPTIONS.filter(bet => myPotatoes >= bet && friendPotatoes >= bet);

  if (sent) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">⚔️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Défi envoyé !</h2>
          <p className="text-slate-500">
            {friend.pseudo} a reçu ton défi de {selectedBet} 🥔
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Ton coup est enregistré. Résultat dès qu'il joue !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⚔️</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Défier {friend.pseudo}</h2>
              <p className="text-sm text-slate-500">Pierre-Feuille-Ciseaux</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Choix pierre/feuille/ciseaux */}
          <div>
            <p className="text-sm text-slate-600 text-center mb-3">Choisis ton coup</p>
            <div className="flex justify-center gap-3">
              {CHOICES.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => setSelectedChoice(choice.id)}
                  className={`w-16 h-16 rounded-2xl text-3xl flex items-center justify-center transition-all ${
                    selectedChoice === choice.id
                      ? 'bg-indigo-500 scale-110 shadow-lg ring-2 ring-indigo-300'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {choice.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Mise */}
          <div>
            <p className="text-sm text-slate-600 text-center mb-2">Mise</p>
            <div className="flex justify-center gap-2">
              {BET_OPTIONS.map((bet) => {
                const canBet = myPotatoes >= bet && friendPotatoes >= bet;
                return (
                  <button
                    key={bet}
                    onClick={() => canBet && setSelectedBet(bet)}
                    disabled={!canBet}
                    className={`px-3 py-2 rounded-xl font-bold transition-all ${
                      selectedBet === bet
                        ? 'bg-amber-500 text-white scale-105'
                        : canBet
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {bet} 🥔
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-sm text-slate-600">Gain si tu gagnes</p>
            <p className="text-xl font-black text-emerald-600">+{selectedBet} 🥔</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={sending}
              className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSend}
              disabled={availableBets.length === 0 || !selectedChoice || sending}
              className={`flex-1 py-3 rounded-xl font-bold ${
                availableBets.length > 0 && selectedChoice && !sending
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {sending ? '⏳ Envoi...' : 'Défier ! ⚔️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal pour répondre à un défi
export const ChifoumiResponseModal = ({ 
  challenge, 
  myPotatoes,
  onClose, 
  onAccept,
  onDecline 
}) => {
  const canAccept = myPotatoes >= challenge.bet_amount;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⚔️</span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Défi de {challenge.challenger_pseudo}</h2>
              <p className="text-sm text-slate-500">Pierre-Feuille-Ciseaux</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-600">Mise en jeu</p>
            <p className="text-3xl font-black text-amber-600">{challenge.bet_amount} 🥔</p>
            <p className="text-sm text-emerald-600 mt-2">Gain si tu gagnes : +{challenge.bet_amount} 🥔</p>
          </div>

          {!canAccept && (
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-red-600 text-sm">Tu n'as pas assez de patates pour accepter ce défi !</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onDecline}
              className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Refuser
            </button>
            <button
              onClick={onAccept}
              disabled={!canAccept}
              className={`flex-1 py-3 rounded-xl font-bold ${
                canAccept
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Accepter ! ⚔️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de jeu (choisir son coup)
export const ChifoumiPlayModal = ({ 
  challenge, 
  isChallenger,
  onClose, 
  onPlay 
}) => {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handlePlay = async () => {
    if (!selectedChoice) return;
    setSubmitted(true);
    await onPlay(selectedChoice);
  };

  const opponentName = isChallenger ? challenge.opponent_pseudo : challenge.challenger_pseudo;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚔️</span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Choisis ton coup !</h2>
                <p className="text-sm text-slate-500">vs {opponentName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Mise</p>
              <p className="font-bold text-amber-600">{challenge.bet_amount} 🥔</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {!submitted ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {CHOICES.map(choice => (
                  <button
                    key={choice.id}
                    onClick={() => setSelectedChoice(choice.id)}
                    className={`py-6 rounded-2xl transition-all ${
                      selectedChoice === choice.id
                        ? 'bg-indigo-100 border-2 border-indigo-500 scale-105'
                        : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-4xl mb-2">{choice.emoji}</div>
                    <div className="text-xs font-medium text-slate-600">{choice.label}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={handlePlay}
                disabled={!selectedChoice}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  selectedChoice
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Jouer ! ⚔️
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">{CHOICES.find(c => c.id === selectedChoice)?.emoji}</div>
              <p className="text-lg font-bold text-slate-700">Coup envoyé !</p>
              <p className="text-sm text-slate-500 mt-2">En attente de {opponentName}...</p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de résultat
export const ChifoumiResultModal = ({ 
  challenge, 
  myUserId,
  onClose 
}) => {
  const isChallenger = challenge.challenger_id === myUserId;
  const myChoice = isChallenger ? challenge.challenger_choice : challenge.opponent_choice;
  const theirChoice = isChallenger ? challenge.opponent_choice : challenge.challenger_choice;
  const opponentName = isChallenger ? challenge.opponent_pseudo : challenge.challenger_pseudo;
  
  const winner = getWinner(challenge.challenger_choice, challenge.opponent_choice);
  const iWon = (winner === 'player1' && isChallenger) || (winner === 'player2' && !isChallenger);
  const isDraw = winner === 'draw';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`p-5 border-b ${
          isDraw 
            ? 'bg-gradient-to-r from-slate-50 to-slate-100' 
            : iWon 
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50'
              : 'bg-gradient-to-r from-red-50 to-orange-50'
        }`}>
          <div className="text-center">
            <span className="text-5xl">
              {isDraw ? '🤝' : iWon ? '🎉' : '😢'}
            </span>
            <h2 className="text-2xl font-black mt-2">
              {isDraw ? 'Égalité !' : iWon ? 'Victoire !' : 'Défaite...'}
            </h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Affichage des choix */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Toi</p>
              <div className="text-5xl">{CHOICES.find(c => c.id === myChoice)?.emoji}</div>
            </div>
            <div className="text-2xl font-bold text-slate-400">VS</div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">{opponentName}</p>
              <div className="text-5xl">{CHOICES.find(c => c.id === theirChoice)?.emoji}</div>
            </div>
          </div>

          {/* Gains/Pertes */}
          <div className={`rounded-xl p-4 text-center ${
            isDraw 
              ? 'bg-slate-100' 
              : iWon 
                ? 'bg-emerald-100'
                : 'bg-red-100'
          }`}>
            <p className="text-sm text-slate-600">
              {isDraw ? 'Tu récupères ta mise' : iWon ? 'Tu gagnes' : 'Tu perds'}
            </p>
            <p className={`text-3xl font-black ${
              isDraw 
                ? 'text-slate-600' 
                : iWon 
                  ? 'text-emerald-600'
                  : 'text-red-600'
            }`}>
              {isDraw ? `${challenge.bet_amount}` : iWon ? `+${challenge.bet_amount}` : `-${challenge.bet_amount}`} 🥔
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook pour gérer les défis Chifoumi
export const useChifoumi = (userId, onGamePlayed, onGameWon) => {
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);

  // Charger les défis
  const loadChallenges = async () => {
    if (!userId) return;

    // Défis en attente (où je suis l'adversaire et pas encore accepté)
    const { data: pending } = await supabase
      .from('chifoumi_challenges')
      .select('*')
      .eq('opponent_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    // Défis actifs (acceptés, en attente de coups)
    const { data: active } = await supabase
      .from('chifoumi_challenges')
      .select('*')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Défis terminés récents (non vus)
    const { data: completed } = await supabase
      .from('chifoumi_challenges')
      .select('*')
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .eq('status', 'completed')
      .eq('seen_by_' + (userId === completed?.[0]?.challenger_id ? 'challenger' : 'opponent'), false)
      .order('created_at', { ascending: false })
      .limit(10);

    setPendingChallenges(pending || []);
    setActiveChallenges(active || []);
    setCompletedChallenges(completed || []);
  };

  useEffect(() => {
    loadChallenges();

    // Écouter les changements en temps réel
    const subscription = supabase
      .channel('chifoumi_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chifoumi_challenges',
        filter: `challenger_id=eq.${userId}`,
      }, loadChallenges)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chifoumi_challenges',
        filter: `opponent_id=eq.${userId}`,
      }, loadChallenges)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Envoyer un défi
  const sendChallenge = async (friend, betAmount, myPseudo, challengerChoice) => {
    const opponentId = friend.odUserId || friend.odPersonalUserId;
    
    const { error } = await supabase
      .from('chifoumi_challenges')
      .insert({
        challenger_id: userId,
        challenger_pseudo: myPseudo,
        opponent_id: opponentId,
        opponent_pseudo: friend.pseudo,
        bet_amount: betAmount,
        challenger_choice: challengerChoice, // Le challenger joue en même temps qu'il envoie le défi
        status: 'pending'
      });

    if (!error) {
      // Envoyer une notification à l'adversaire
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: opponentId,
        type: 'chifoumi_challenge',
        title: 'Défi Chifoumi ! ⚔️',
        message: `${myPseudo} te défie pour ${betAmount} 🥔`,
        data: {
          challengerPseudo: myPseudo,
          betAmount: betAmount,
        },
        read: false,
      });
      
      if (notifError) {
        console.error('Erreur envoi notification chifoumi:', notifError);
      }
      
      loadChallenges();
    }
    return !error;
  };

  // Accepter un défi
  const acceptChallenge = async (challengeId) => {
    const { error } = await supabase
      .from('chifoumi_challenges')
      .update({ status: 'active' })
      .eq('id', challengeId);

    if (!error) {
      loadChallenges();
    }
    return !error;
  };

  // Refuser un défi
  const declineChallenge = async (challengeId) => {
    const { error } = await supabase
      .from('chifoumi_challenges')
      .update({ status: 'declined' })
      .eq('id', challengeId);

    if (!error) {
      loadChallenges();
    }
    return !error;
  };

  // Jouer son coup
  const playChoice = async (challengeId, choice, isChallenger) => {
    const field = isChallenger ? 'challenger_choice' : 'opponent_choice';
    
    const { data: challenge } = await supabase
      .from('chifoumi_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    const updates = { [field]: choice };
    
    // Si les deux ont joué, déterminer le gagnant
    const otherChoice = isChallenger ? challenge.opponent_choice : challenge.challenger_choice;
    if (otherChoice) {
      const winner = getWinner(
        isChallenger ? choice : otherChoice,
        isChallenger ? otherChoice : choice
      );
      
      updates.status = 'completed';
      updates.winner = winner === 'draw' ? 'draw' : (winner === 'player1' ? challenge.challenger_id : challenge.opponent_id);
    }

    const { error } = await supabase
      .from('chifoumi_challenges')
      .update(updates)
      .eq('id', challengeId);

    if (!error) {
      // Si l'adversaire n'a pas encore joué, lui envoyer une notification
      if (!otherChoice) {
        const opponentId = isChallenger ? challenge.opponent_id : challenge.challenger_id;
        const opponentPseudo = isChallenger ? challenge.opponent_pseudo : challenge.challenger_pseudo;
        const myPseudo = isChallenger ? challenge.challenger_pseudo : challenge.opponent_pseudo;
        
        await supabase.from('notifications').insert({
          user_id: opponentId,
          type: 'chifoumi_your_turn',
          title: 'À toi de jouer ! ⚔️',
          message: `${myPseudo} a joué, c'est ton tour !`,
          data: {
            challengeId: challengeId,
            opponentPseudo: myPseudo,
            betAmount: challenge.bet_amount,
          },
          read: false,
        });
      } else {
        // Partie terminée - appeler les callbacks pour les badges
        if (onGamePlayed) onGamePlayed();
        
        // Vérifier si on a gagné
        const winner = getWinner(
          isChallenger ? choice : otherChoice,
          isChallenger ? otherChoice : choice
        );
        const didWin = (winner === 'player1' && isChallenger) || (winner === 'player2' && !isChallenger);
        if (didWin && onGameWon) onGameWon();
      }
      
      loadChallenges();
    }
    return !error;
  };

  // Marquer comme vu
  const markAsSeen = async (challengeId, isChallenger) => {
    const field = isChallenger ? 'seen_by_challenger' : 'seen_by_opponent';
    await supabase
      .from('chifoumi_challenges')
      .update({ [field]: true })
      .eq('id', challengeId);
    
    loadChallenges();
  };

  return {
    pendingChallenges,
    activeChallenges,
    completedChallenges,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
    playChoice,
    markAsSeen,
    loadChallenges
  };
};

// Modal de notification Chifoumi (intégré dans App.jsx)
// Permet d'accepter/refuser ET de jouer directement depuis la notification
export const ChifoumiNotificationModal = ({
  notification,
  myPotatoes,
  onDismiss,
  supabaseUserId,
  isYourTurn = false,
  onRefreshPotatoes
}) => {
  const [step, setStep] = useState('play'); // 'play', 'result' - plus besoin d'étape 'challenge'
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [result, setResult] = useState(null);

  const betAmount = notification.data?.betAmount || 0;
  const challengerPseudo = notification.data?.challengerPseudo || 'Quelqu\'un';
  const canPlay = myPotatoes >= betAmount;

  // Charger le défi depuis la base
  useEffect(() => {
    const loadChallenge = async () => {
      if (!supabaseUserId) return;
      
      const { data } = await supabase
        .from('chifoumi_challenges')
        .select('*')
        .eq('opponent_id', supabaseUserId)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setChallenge(data[0]);
      }
    };
    
    loadChallenge();
  }, [supabaseUserId]);

  // Refuser le défi
  const handleDecline = async () => {
    if (!challenge) {
      onDismiss();
      return;
    }
    
    setLoading(true);
    await supabase
      .from('chifoumi_challenges')
      .update({ status: 'declined' })
      .eq('id', challenge.id);
    
    onDismiss();
  };

  // Jouer son coup - le challenger a déjà joué, donc on calcule le résultat immédiatement
  const handlePlay = async () => {
    if (!selectedChoice || !challenge) {
      console.error('Pas de choix ou pas de challenge', { selectedChoice, challenge });
      return;
    }
    if (!canPlay) {
      alert('Tu n\'as pas assez de patates !');
      return;
    }
    
    // Utiliser betAmount de la notification (plus fiable)
    const actualBetAmount = challenge.bet_amount || betAmount;
    console.log('=== CHIFOUMI PLAY ===');
    console.log('Challenge:', challenge);
    console.log('Bet amount:', actualBetAmount);
    console.log('Mon choix:', selectedChoice);
    console.log('Choix challenger:', challenge.challenger_choice);
    
    // Calculer le résultat IMMÉDIATEMENT (avant les appels DB)
    const challengerChoice = challenge.challenger_choice;
    const winner = getWinner(challengerChoice, selectedChoice);
    
    let winnerId = null;
    if (winner === 'player1') winnerId = challenge.challenger_id;
    else if (winner === 'player2') winnerId = challenge.opponent_id;
    else winnerId = 'draw';
    
    console.log('Winner:', winner, '-> winnerId:', winnerId);
    
    const iWon = winnerId === supabaseUserId;
    const isDraw = winnerId === 'draw';
    const challengerWon = winnerId === challenge.challenger_id;
    
    // Afficher le résultat TOUT DE SUITE
    setResult({ 
      iWon, 
      isDraw, 
      myChoice: selectedChoice,
      opponentChoice: challengerChoice,
      amount: actualBetAmount
    });
    setStep('result');
    
    // Rafraîchir les patates immédiatement pour effet visuel
    if (onRefreshPotatoes) {
      // Attendre 500ms pour que le transfert SQL soit terminé
      setTimeout(() => {
        onRefreshPotatoes();
      }, 500);
    }
    
    // Faire les mises à jour en base en arrière-plan
    // 1. Mettre à jour le challenge
    supabase
      .from('chifoumi_challenges')
      .update({ 
        opponent_choice: selectedChoice,
        status: 'completed',
        winner: winnerId
      })
      .eq('id', challenge.id)
      .then(({ error }) => {
        if (error) console.error('Erreur update challenge:', error);
        else console.log('Challenge mis à jour');
      });
    
    // 2. Transférer les patates via fonction SQL (bypass RLS)
    if (winnerId !== 'draw') {
      const loserId = winnerId === challenge.challenger_id ? challenge.opponent_id : challenge.challenger_id;
      
      console.log('Transfert patates:', actualBetAmount);
      console.log('Gagnant ID:', winnerId);
      console.log('Perdant ID:', loserId);
      
      // Utiliser la fonction SQL SECURITY DEFINER
      supabase
        .rpc('transfer_potatoes', {
          winner_id: winnerId,
          loser_id: loserId,
          amount: actualBetAmount
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Erreur transfert patates:', error);
          } else {
            console.log('✅ Transfert patates réussi:', data);
          }
        });
    } else {
      console.log('Égalité - pas de transfert');
    }
    
    // 3. Envoyer une notification au challenger avec le résultat
    supabase
      .from('notifications')
      .insert({
        user_id: challenge.challenger_id,
        type: 'chifoumi_result',
        title: isDraw ? 'Égalité ! 🤝' : challengerWon ? 'Tu as gagné ! 🎉' : 'Tu as perdu... 😢',
        message: `${challenge.opponent_pseudo} a joué contre toi`,
        data: {
          challengerChoice: challengerChoice,
          opponentChoice: selectedChoice,
          opponentPseudo: challenge.opponent_pseudo,
          betAmount: actualBetAmount,
          won: challengerWon,
          isDraw: isDraw
        },
        read: false,
      })
      .then(({ error }) => {
        if (error) console.error('Erreur notification:', error);
        else console.log('✅ Notification envoyée au challenger');
      });
  };

  return (
    <>
      {/* Jouer son coup */}
      {step === 'play' && (
        <>
          <div className="p-6 text-center bg-gradient-to-r from-amber-400 to-orange-500">
            <div className="text-6xl mb-3">⚔️</div>
            <h2 className="text-xl font-bold text-white">Défi de {challengerPseudo}</h2>
          </div>
          <div className="p-6">
            <div className="bg-amber-50 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm text-slate-600">Mise en jeu</p>
              <p className="text-2xl font-black text-amber-600">{betAmount} 🥔</p>
            </div>
            
            {!canPlay ? (
              <div className="bg-red-50 rounded-xl p-3 mb-4 text-center">
                <p className="text-red-600 text-sm">Tu n'as pas assez de patates !</p>
              </div>
            ) : (
              <>
                <p className="text-slate-600 text-center mb-3 text-sm">Choisis ton coup pour jouer</p>
                <div className="flex justify-center gap-3 mb-4">
                  {CHOICES.map(choice => (
                    <button
                      key={choice.id}
                      onClick={() => setSelectedChoice(choice.id)}
                      className={`w-16 h-16 rounded-2xl text-3xl flex items-center justify-center transition-all ${
                        selectedChoice === choice.id
                          ? 'bg-indigo-500 scale-110 shadow-lg ring-2 ring-indigo-300'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {choice.emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleDecline}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                Refuser
              </button>
              <button
                onClick={handlePlay}
                disabled={!selectedChoice || loading || !canPlay}
                className={`flex-1 py-3 rounded-xl font-bold ${
                  selectedChoice && canPlay
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? '⏳' : 'Jouer ! ⚔️'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Résultat */}
      {step === 'result' && result && (
        <>
          <div className={`p-6 text-center ${
            result.isDraw 
              ? 'bg-gradient-to-r from-slate-400 to-slate-500' 
              : result.iWon 
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : 'bg-gradient-to-r from-red-400 to-pink-500'
          }`}>
            <div className="text-6xl mb-3">
              {result.isDraw ? '🤝' : result.iWon ? '🎉' : '😢'}
            </div>
            <h2 className="text-xl font-bold text-white">
              {result.isDraw ? 'Égalité !' : result.iWon ? 'Tu as gagné !' : 'Tu as perdu...'}
            </h2>
          </div>
          <div className="p-6">
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-4xl">{CHOICES.find(c => c.id === result.myChoice)?.emoji}</div>
                <div className="text-xs text-slate-500">Toi</div>
              </div>
              <div className="text-2xl text-slate-400">VS</div>
              <div className="text-center">
                <div className="text-4xl">{CHOICES.find(c => c.id === result.opponentChoice)?.emoji}</div>
                <div className="text-xs text-slate-500">{challengerPseudo}</div>
              </div>
            </div>
            
            {!result.isDraw && (
              <div className={`rounded-xl p-4 mb-4 text-center ${result.iWon ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className={`text-2xl font-black ${result.iWon ? 'text-emerald-600' : 'text-red-600'}`}>
                  {result.iWon ? '+' : '-'}{result.amount} 🥔
                </p>
              </div>
            )}
            
            <button
              onClick={onDismiss}
              className={`w-full py-3 rounded-xl font-bold text-white ${
                result.isDraw 
                  ? 'bg-slate-500' 
                  : result.iWon 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
            >
              {result.isDraw ? 'OK' : result.iWon ? 'Super ! 🎉' : 'OK 😢'}
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default ChifoumiChallengeModal;
