import React, { useState, useEffect } from 'react';

// Citations modernes et inspirantes en français
const QUOTES = [
  { text: "Fait est mieux que parfait.", author: "Sheryl Sandberg" },
  { text: "Reste affamé, reste fou.", author: "Steve Jobs" },
  { text: "Avance vite et casse des trucs.", author: "Mark Zuckerberg" },
  { text: "Sois toi-même, tous les autres sont déjà pris.", author: "Oscar Wilde" },
  { text: "Le meilleur moment pour commencer c'était hier. Le deuxième meilleur moment c'est maintenant.", author: "Anonyme" },
  { text: "Tu rates 100% des tirs que tu ne tentes pas.", author: "Wayne Gretzky" },
  { text: "Fais simple, mais significatif.", author: "Don Draper" },
  { text: "Rêve grand. Commence petit. Agis maintenant.", author: "Robin Sharma" },
  { text: "Progrès, pas perfection.", author: "Anonyme" },
  { text: "Ton énergie attire ta tribu.", author: "Anonyme" },
  { text: "Crois en toi et tu es déjà à mi-chemin.", author: "Theodore Roosevelt" },
  { text: "Fais ce que tu aimes. Aime ce que tu fais.", author: "Ray Bradbury" },
  { text: "Moins c'est plus.", author: "Ludwig Mies van der Rohe" },
  { text: "Crée les choses que tu aimerais voir exister.", author: "Anonyme" },
  { text: "Sois l'énergie que tu veux attirer.", author: "Anonyme" },
  { text: "Petits pas chaque jour.", author: "Anonyme" },
  { text: "Fais confiance au processus.", author: "Anonyme" },
  { text: "Inspire la confiance, expire le doute.", author: "Anonyme" },
  { text: "Tout ce dont tu as besoin est déjà en toi.", author: "Anonyme" },
  { text: "Ta seule limite, c'est ton esprit.", author: "Anonyme" },
  { text: "Les bonnes choses prennent du temps.", author: "Anonyme" },
  { text: "Travaille dur en silence, laisse le succès faire du bruit.", author: "Frank Ocean" },
  { text: "Sois tellement bon qu'ils ne pourront pas t'ignorer.", author: "Steve Martin" },
  { text: "Tombe sept fois, relève-toi huit.", author: "Proverbe japonais" },
  { text: "Le comeback est toujours plus fort que le setback.", author: "Anonyme" },
  { text: "Que ferais-tu si tu n'avais pas peur ?", author: "Sheryl Sandberg" },
  { text: "La vie commence là où ta zone de confort se termine.", author: "Neale Donald Walsch" },
  { text: "Tu vas y arriver.", author: "Anonyme" },
  { text: "Un jour ou jour un. À toi de décider.", author: "Anonyme" },
  { text: "Rends-toi fier.", author: "Anonyme" },
  { text: "Prouve-leur qu'ils ont tort.", author: "Anonyme" },
  { text: "Le succès n'est pas final, l'échec n'est pas fatal.", author: "Winston Churchill" },
  { text: "Les étoiles ne brillent pas sans obscurité.", author: "Anonyme" },
  { text: "Continue. Tu y arrives.", author: "Anonyme" },
  { text: "N'attends pas l'opportunité. Crée-la.", author: "Anonyme" },
  { text: "Tu es suffisant.", author: "Anonyme" },
  { text: "Les chemins difficiles mènent aux belles destinations.", author: "Anonyme" },
  { text: "Reste patient et fais confiance à ton parcours.", author: "Anonyme" },
  { text: "Tout arrive pour une raison.", author: "Anonyme" },
  { text: "Grandis à travers ce que tu traverses.", author: "Anonyme" },
  { text: "Commence où tu es. Utilise ce que tu as. Fais ce que tu peux.", author: "Arthur Ashe" },
  { text: "Tu n'es pas venu jusqu'ici pour seulement venir jusqu'ici.", author: "Anonyme" },
  { text: "Le bonheur est fait maison.", author: "Anonyme" },
  { text: "Garde toujours ton visage vers le soleil.", author: "Walt Whitman" },
  { text: "Trop réfléchir tue ton bonheur.", author: "Anonyme" },
  { text: "Concentre-toi sur le positif.", author: "Anonyme" },
  { text: "Choisis la joie.", author: "Anonyme" },
  { text: "Aujourd'hui est un bon jour pour passer une bonne journée.", author: "Anonyme" },
  { text: "Sois une voix, pas un écho.", author: "Albert Einstein" },
  { text: "Ne regarde pas en arrière, tu ne vas pas par là.", author: "Anonyme" },
  { text: "Plot twist : tout va bien se passer.", author: "Anonyme" },
  { text: "Collectionne les moments, pas les choses.", author: "Anonyme" },
  { text: "L'énergie que tu donnes est celle que tu reçois.", author: "Anonyme" },
  { text: "Le doute tue plus de rêves que l'échec.", author: "Suzy Kassem" },
  { text: "Normalise le fait de recommencer.", author: "Anonyme" },
  { text: "Ta vitesse n'a pas d'importance, avancer c'est avancer.", author: "Anonyme" },
  { text: "Ça aussi, ça passera.", author: "Proverbe persan" },
  { text: "Nouveau jour, nouvel état d'esprit, nouveau focus, nouvelles intentions, nouveaux résultats.", author: "Anonyme" },
  { text: "Prendre soin de soi n'est pas égoïste.", author: "Anonyme" },
  { text: "Protège ta paix.", author: "Anonyme" },
];

export const DailyQuoteCard = ({ onClose }) => {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  useEffect(() => {
    // Vérifier si déjà réclamé aujourd'hui
    const lastClaim = localStorage.getItem('todogame_lastQuoteClaim');
    const today = new Date().toDateString();
    
    if (lastClaim === today) {
      setHasClaimedToday(true);
      const savedQuote = localStorage.getItem('todogame_todayQuote');
      if (savedQuote) {
        setSelectedCard({ quote: JSON.parse(savedQuote) });
        setIsRevealed(true);
      }
    } else {
      generateCards();
    }
  }, []);

  const generateCards = () => {
    const shuffled = [...QUOTES].sort(() => Math.random() - 0.5);
    const selectedQuotes = shuffled.slice(0, 6);
    
    const newCards = selectedQuotes.map((quote, index) => ({
      id: index,
      quote,
    }));
    
    setCards(newCards);
  };

  const handleSelectCard = (card) => {
    if (hasClaimedToday || selectedCard || isFlipping) return;
    
    setSelectedCard(card);
    setIsFlipping(true);
    
    setTimeout(() => {
      setIsRevealed(true);
      setIsFlipping(false);
      
      const today = new Date().toDateString();
      localStorage.setItem('todogame_lastQuoteClaim', today);
      localStorage.setItem('todogame_todayQuote', JSON.stringify(card.quote));
      setHasClaimedToday(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header minimaliste */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-700">
            ✨ Oracle du jour
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pb-2">
          <p className="text-slate-500 text-sm">
            {hasClaimedToday && isRevealed 
              ? "Ta guidance du jour" 
              : "Choisis une carte et laisse l'univers te guider"}
          </p>
        </div>

        {/* Contenu */}
        <div className="p-6 pt-4">
          {!isRevealed ? (
            <>
              {/* Grille de cartes identiques */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleSelectCard(card)}
                    disabled={hasClaimedToday || selectedCard !== null}
                    className={`aspect-[3/4] rounded-2xl transition-all duration-500 transform ${
                      selectedCard?.id === card.id 
                        ? 'scale-105' 
                        : selectedCard 
                          ? 'opacity-40 scale-95' 
                          : 'hover:scale-105 hover:-translate-y-1'
                    } ${
                      hasClaimedToday ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{
                      transform: selectedCard?.id === card.id && isFlipping 
                        ? 'rotateY(180deg)' 
                        : 'rotateY(0deg)',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Dos de carte - design épuré */}
                    <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-md border border-violet-200/50">
                      <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center">
                        <span className="text-2xl text-violet-400">✦</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {isFlipping && (
                <div className="text-center text-violet-500 text-sm animate-pulse">
                  L'univers te répond...
                </div>
              )}
            </>
          ) : (
            /* Citation révélée - design pastel épuré */
            <div className="animate-fade-in">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 border border-violet-100">
                <div className="text-4xl mb-4 text-center text-violet-300">"</div>
                <p className="text-lg text-slate-700 text-center leading-relaxed mb-6 font-medium">
                  {selectedCard?.quote?.text}
                </p>
                <p className="text-center text-violet-400 text-sm">
                  — {selectedCard?.quote?.author}
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-slate-400 text-xs mb-4">
                  Reviens demain pour une nouvelle guidance ✨
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gradient-to-r from-violet-400 to-purple-400 text-white rounded-full font-medium hover:opacity-90 transition-all shadow-lg shadow-violet-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

// Bouton flottant style oracle
export const DailyQuoteButton = ({ onClick }) => {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('todogame_quoteButtonPosition');
    return saved ? JSON.parse(saved) : { x: 20, y: 280 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const handleDragStart = (e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 56, clientX - dragStart.x));
    const newY = Math.max(60, Math.min(window.innerHeight - 56, clientY - dragStart.y));
    
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      setHasMoved(true);
    }
    
    setPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem('todogame_quoteButtonPosition', JSON.stringify(position));
    }
  };

  const handleClick = () => {
    if (!hasMoved) {
      onClick();
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDrag);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      className={`fixed z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 shadow-lg shadow-violet-200/50 flex items-center justify-center text-2xl transition-all border border-violet-200/50 ${
        isDragging ? 'scale-110 cursor-grabbing' : 'hover:scale-110 hover:shadow-xl cursor-grab'
      }`}
      style={{
        left: position.x,
        top: position.y,
        touchAction: 'none',
      }}
    >
      <span className="text-violet-500">✦</span>
    </button>
  );
};
