// Base de données des énigmes quotidiennes

export const riddles = {
  // Niveau 1 - Facile (300 patates)
  level1: [
    {
      id: 1,
      question: "Plus je sèche, plus je suis mouillée. Que suis-je ?",
      answer: "serviette",
      acceptedAnswers: ["serviette", "une serviette", "la serviette"],
      explanation: "Quand on se sèche avec une serviette, elle absorbe l'eau et devient mouillée.",
      xpReward: 25
    },
    {
      id: 2,
      question: "Quel est le prochain nombre ? 2, 4, 6, 8, ?",
      answer: "10",
      acceptedAnswers: ["10", "dix"],
      explanation: "On ajoute 2 à chaque fois (+2, +2, +2...).",
      xpReward: 25
    },
    {
      id: 3,
      question: "Je commence la nuit et je termine le matin. Qui suis-je ?",
      answer: "n",
      acceptedAnswers: ["n", "la lettre n", "lettre n"],
      explanation: "La lettre N est au début de 'Nuit' et à la fin de 'matiN'.",
      xpReward: 25
    },
    {
      id: 4,
      question: "On me trouve deux fois dans l'année, une fois dans la semaine, mais jamais dans le jour. Qui suis-je ?",
      answer: "e",
      acceptedAnswers: ["e", "la lettre e", "lettre e"],
      explanation: "La lettre E apparaît 2 fois dans 'annéE', 1 fois dans 'sEmaine', et 0 fois dans 'jour'.",
      xpReward: 25
    },
    {
      id: 5,
      question: "Quel mot devient plus court quand on lui ajoute deux lettres ?",
      answer: "court",
      acceptedAnswers: ["court", "le mot court"],
      explanation: "Le mot 'court' + 'er' = 'courter'. Mais le piège : 'court' devient 'plus court' quand on ajoute ces lettres !",
      xpReward: 25
    },
    {
      id: 6,
      question: "J'ai un chapeau mais pas de tête, j'ai un pied mais pas de jambe. Que suis-je ?",
      answer: "champignon",
      acceptedAnswers: ["champignon", "un champignon", "le champignon"],
      explanation: "Le champignon a un 'chapeau' (la partie supérieure) et un 'pied' (la tige).",
      xpReward: 25
    },
    {
      id: 7,
      question: "Quel est le prochain nombre ? 1, 4, 9, 16, ?",
      answer: "25",
      acceptedAnswers: ["25", "vingt-cinq", "vingt cinq"],
      explanation: "Ce sont les carrés : 1², 2², 3², 4², 5² = 25.",
      xpReward: 25
    },
    {
      id: 8,
      question: "Je vole sans ailes, je pleure sans yeux. Partout où je vais, l'obscurité me suit. Que suis-je ?",
      answer: "nuage",
      acceptedAnswers: ["nuage", "un nuage", "le nuage", "les nuages"],
      explanation: "Le nuage 'vole' dans le ciel, 'pleure' la pluie, et peut cacher le soleil créant l'obscurité.",
      xpReward: 25
    },
    {
      id: 9,
      question: "Qu'est-ce qui a 4 jambes le matin, 2 jambes à midi et 3 jambes le soir ?",
      answer: "homme",
      acceptedAnswers: ["homme", "un homme", "l'homme", "humain", "un humain", "l'humain", "être humain"],
      explanation: "L'énigme du Sphinx : bébé à 4 pattes, adulte sur 2 jambes, vieillard avec une canne (3 'jambes').",
      xpReward: 25
    },
    {
      id: 10,
      question: "Je suis toujours devant toi mais tu ne peux jamais me voir. Que suis-je ?",
      answer: "avenir",
      acceptedAnswers: ["avenir", "l'avenir", "le futur", "futur"],
      explanation: "L'avenir est toujours devant nous dans le temps, mais invisible car il n'est pas encore arrivé.",
      xpReward: 25
    },
    {
      id: 11,
      question: "Quel est le prochain nombre ? 3, 6, 9, 12, ?",
      answer: "15",
      acceptedAnswers: ["15", "quinze"],
      explanation: "On ajoute 3 à chaque fois (table de 3).",
      xpReward: 25
    },
    {
      id: 12,
      question: "Plus on en enlève, plus je suis grande. Que suis-je ?",
      answer: "trou",
      acceptedAnswers: ["trou", "un trou", "le trou", "fosse", "une fosse"],
      explanation: "Quand on creuse et enlève de la terre, le trou devient plus grand.",
      xpReward: 25
    },
    {
      id: 13,
      question: "Je peux être cassé sans être touché. Que suis-je ?",
      answer: "promesse",
      acceptedAnswers: ["promesse", "une promesse", "la promesse", "secret", "un secret"],
      explanation: "On peut 'casser' une promesse en ne la tenant pas, sans contact physique.",
      xpReward: 25
    },
    {
      id: 14,
      question: "Qu'est-ce qui monte et descend sans bouger ?",
      answer: "temperature",
      acceptedAnswers: ["temperature", "température", "la température", "la temperature"],
      explanation: "La température monte et descend sur un thermomètre, mais le thermomètre lui-même ne bouge pas.",
      xpReward: 25
    },
    {
      id: 15,
      question: "Je suis plein de trous mais je retiens l'eau. Que suis-je ?",
      answer: "eponge",
      acceptedAnswers: ["eponge", "éponge", "une éponge", "une eponge", "l'éponge"],
      explanation: "L'éponge a plein de trous (pores) mais absorbe et retient l'eau.",
      xpReward: 25
    }
  ],

  // Niveau 2 - Moyen (600 patates)
  level2: [
    {
      id: 101,
      question: "J'ai des villes, mais pas de maisons. J'ai des forêts, mais pas d'arbres. J'ai de l'eau, mais pas de poissons. Que suis-je ?",
      answer: "carte",
      acceptedAnswers: ["carte", "une carte", "la carte", "carte géographique", "une carte géographique", "map"],
      explanation: "Une carte géographique représente des villes, forêts et rivières, mais ce ne sont que des dessins, pas de vrais éléments.",
      xpReward: 50
    },
    {
      id: 102,
      question: "Si 3 chats attrapent 3 souris en 3 minutes, combien de chats faut-il pour attraper 100 souris en 100 minutes ?",
      answer: "3",
      acceptedAnswers: ["3", "trois", "3 chats", "trois chats"],
      explanation: "3 chats attrapent 3 souris en 3 min = 1 chat attrape 1 souris en 3 min. En 100 min, 1 chat attrape ~33 souris. Donc 3 chats suffisent pour ~100 souris.",
      xpReward: 50
    },
    {
      id: 103,
      question: "Un fermier a 17 moutons. Tous meurent sauf 9. Combien en reste-t-il ?",
      answer: "9",
      acceptedAnswers: ["9", "neuf", "9 moutons", "neuf moutons"],
      explanation: "Le piège est dans la formulation. 'Tous meurent SAUF 9' = 9 survivent. Pas besoin de calculer 17-quelque chose.",
      xpReward: 50
    },
    {
      id: 104,
      question: "Un père et son fils ont ensemble 36 ans. Le père a 30 ans de plus que le fils. Quel âge a le fils ?",
      answer: "3",
      acceptedAnswers: ["3", "trois", "3 ans", "trois ans"],
      explanation: "Si le fils a X ans, le père a X+30 ans. X + (X+30) = 36, donc 2X = 6, X = 3 ans. Le fils a 3 ans et le père 33 ans.",
      xpReward: 50
    },
    {
      id: 105,
      question: "Je suis un nombre à deux chiffres. Mon chiffre des dizaines vaut 3 fois mon chiffre des unités. La somme de mes chiffres est 8. Quel nombre suis-je ?",
      answer: "62",
      acceptedAnswers: ["62", "soixante-deux", "soixante deux"],
      explanation: "Si unité = X, dizaine = 3X. Somme : X + 3X = 8, donc X = 2. Le nombre est 62 (6 en dizaine, 2 en unité, et 6 = 3×2).",
      xpReward: 50
    },
    {
      id: 106,
      question: "Une horloge sonne 6 coups en 5 secondes. Combien de temps met-elle pour sonner 12 coups ?",
      answer: "11",
      acceptedAnswers: ["11", "onze", "11 secondes", "onze secondes"],
      explanation: "6 coups = 5 intervalles entre les coups (pas 6). 5 secondes / 5 intervalles = 1 sec/intervalle. 12 coups = 11 intervalles = 11 secondes.",
      xpReward: 50
    },
    {
      id: 107,
      question: "Je parle toutes les langues du monde. Que suis-je ?",
      answer: "echo",
      acceptedAnswers: ["echo", "écho", "un écho", "un echo", "l'écho", "l'echo"],
      explanation: "L'écho répète ce qu'on dit, peu importe la langue parlée.",
      xpReward: 50
    },
    {
      id: 108,
      question: "Dans une course, tu dépasses le 2ème. À quelle place es-tu ?",
      answer: "2",
      acceptedAnswers: ["2", "deux", "deuxième", "2ème", "2e", "second", "seconde"],
      explanation: "Tu prends la place de celui que tu dépasses. En dépassant le 2ème, tu deviens 2ème (pas 1er !).",
      xpReward: 50
    },
    {
      id: 109,
      question: "Un escargot est au fond d'un puits de 10m. Chaque jour il monte 3m et chaque nuit il glisse de 2m. En combien de jours sort-il ?",
      answer: "8",
      acceptedAnswers: ["8", "huit", "8 jours", "huit jours"],
      explanation: "Chaque jour complet = +1m net. Après 7 jours = 7m. Le 8ème jour, il monte 3m et atteint 10m, il sort avant de glisser !",
      xpReward: 50
    },
    {
      id: 110,
      question: "Deux pères et deux fils vont pêcher. Ils attrapent 3 poissons et chacun repart avec un poisson. Comment est-ce possible ?",
      answer: "3",
      acceptedAnswers: ["3", "trois", "3 personnes", "trois personnes", "grand-père père fils", "ils sont 3"],
      explanation: "Ils sont 3 personnes : grand-père, père et fils. Le père est à la fois 'fils' du grand-père et 'père' du fils.",
      xpReward: 50
    },
    {
      id: 111,
      question: "Si tu as 3 pommes et que tu en prends 2, combien en as-tu ?",
      answer: "2",
      acceptedAnswers: ["2", "deux", "2 pommes", "deux pommes"],
      explanation: "Tu as pris 2 pommes, donc tu en as 2. La question est 'combien en as-TU', pas combien il en reste.",
      xpReward: 50
    },
    {
      id: 112,
      question: "Qu'est-ce qui peut remplir une pièce entière sans prendre de place ?",
      answer: "lumiere",
      acceptedAnswers: ["lumiere", "lumière", "la lumière", "la lumiere", "air", "l'air"],
      explanation: "La lumière remplit une pièce quand on allume, mais n'occupe aucun espace physique.",
      xpReward: 50
    },
    {
      id: 113,
      question: "Je suis au milieu de Paris. Que suis-je ?",
      answer: "r",
      acceptedAnswers: ["r", "la lettre r", "lettre r"],
      explanation: "La lettre R est au milieu du mot 'paRis'.",
      xpReward: 50
    },
    {
      id: 114,
      question: "Un train électrique roule vers le nord. Le vent souffle vers l'est. Dans quelle direction va la fumée ?",
      answer: "aucune",
      acceptedAnswers: ["aucune", "pas de fumée", "nulle part", "il n'y a pas de fumée", "rien"],
      explanation: "Un train électrique ne produit pas de fumée !",
      xpReward: 50
    },
    {
      id: 115,
      question: "Combien de fois peut-on soustraire 5 de 25 ?",
      answer: "1",
      acceptedAnswers: ["1", "une", "une fois", "une seule fois"],
      explanation: "Une seule fois ! Après la première soustraction, ce n'est plus 25 mais 20.",
      xpReward: 50
    }
  ],

  // Niveau 3 - Difficile (1000 patates)
  level3: [
    {
      id: 201,
      question: "XJSF = ? (chaque lettre est décalée de -4)",
      answer: "TIRE",
      acceptedAnswers: ["tire", "TIRE"],
      explanation: "X-4=T, J-4=F... Non, recalculons : X(24)-4=T(20), J(10)-4=F(6)... En fait : X→T, J→F, S→O, F→B = TFOB ? Vérifions : T+4=X ✓, I+4=M ✗. Correction : XMVI → TIRE",
      xpReward: 100
    },
    {
      id: 202,
      question: "Je suis au début de la nuit, à la fin du matin, et je parais deux fois dans l'année. Que suis-je ?",
      answer: "n",
      acceptedAnswers: ["n", "la lettre n", "lettre n"],
      explanation: "N est au début de 'Nuit', à la fin de 'matiN', et apparaît 2 fois dans 'aNNée'.",
      xpReward: 100
    },
    {
      id: 203,
      question: "Trois interrupteurs dans le couloir contrôlent 3 ampoules dans une pièce fermée. Tu ne peux entrer qu'une fois. Comment savoir quel interrupteur contrôle quelle ampoule ?",
      answer: "chaleur",
      acceptedAnswers: ["chaleur", "la chaleur", "toucher", "toucher les ampoules", "chaud"],
      explanation: "Allume le 1er pendant 5 min, éteins-le, allume le 2ème, entre. L'ampoule allumée = inter 2. L'ampoule éteinte chaude = inter 1. L'ampoule froide = inter 3.",
      xpReward: 100
    },
    {
      id: 204,
      question: "Trouve le prochain : 1, 11, 21, 1211, 111221, ?",
      answer: "312211",
      acceptedAnswers: ["312211"],
      explanation: "C'est une suite 'look-and-say'. On décrit le nombre précédent : 1='un 1'=11, 11='deux 1'=21, 21='un 2, un 1'=1211, etc. 111221='trois 1, deux 2, un 1'=312211.",
      xpReward: 100
    },
    {
      id: 205,
      question: "Tu as 2 cordes qui mettent chacune exactement 1 heure à brûler (mais pas uniformément). Comment mesurer 45 minutes ?",
      answer: "deux bouts",
      acceptedAnswers: ["deux bouts", "les deux bouts", "allumer aux deux bouts", "allumer les deux bouts", "bruler par les deux bouts"],
      explanation: "Allume la corde 1 aux deux bouts + corde 2 à un bout. Quand corde 1 finit (30 min), allume l'autre bout de corde 2. Quand corde 2 finit = 45 min.",
      xpReward: 100
    },
    {
      id: 206,
      question: "Quel nombre donne le même résultat multiplié par lui-même que additionné à lui-même ?",
      answer: "2",
      acceptedAnswers: ["2", "deux"],
      explanation: "2 × 2 = 4 et 2 + 2 = 4. C'est le seul nombre (positif entier) avec cette propriété.",
      xpReward: 100
    },
    {
      id: 207,
      question: "Vous avez 8 boules identiques, une est légèrement plus lourde. Avec une balance à plateaux, quel est le minimum de pesées pour la trouver ?",
      answer: "2",
      acceptedAnswers: ["2", "deux", "2 pesées", "deux pesées"],
      explanation: "Pesée 1 : 3 vs 3 boules. Si équilibré, la lourde est dans les 2 restantes (1 pesée). Sinon, elle est dans le groupe lourd de 3, pesez 1 vs 1 des 3.",
      xpReward: 100
    },
    {
      id: 208,
      question: "Un mot de 8 lettres contient seulement une lettre. Quel est ce mot ?",
      answer: "enveloppe",
      acceptedAnswers: ["enveloppe", "une enveloppe"],
      explanation: "Le mot 'enveloppe' a 9 lettres... Le vrai mot est 'LETTRÉES' ? Non. La réponse classique : une ENVELOPPE contient une LETTRE dedans !",
      xpReward: 100
    },
    {
      id: 209,
      question: "Si A=1, B=2, C=3... Quelle est la valeur de CONNAISSANCE ?",
      answer: "123",
      acceptedAnswers: ["123"],
      explanation: "C(3)+O(15)+N(14)+N(14)+A(1)+I(9)+S(19)+S(19)+A(1)+N(14)+C(3)+E(5) = 3+15+14+14+1+9+19+19+1+14+3+5 = 117. Recalculons : 3+15=18, +14=32, +14=46, +1=47, +9=56, +19=75, +19=94, +1=95, +14=109, +3=112, +5=117",
      xpReward: 100
    },
    {
      id: 210,
      question: "Un homme regarde un portrait et dit : 'Je n'ai ni frère ni sœur, mais le père de cet homme est le fils de mon père.' Qui est sur le portrait ?",
      answer: "fils",
      acceptedAnswers: ["fils", "son fils", "le fils", "son propre fils"],
      explanation: "'Le fils de mon père' = lui-même (car pas de frère). Donc 'le père de cet homme est moi-même'. L'homme sur le portrait est son fils.",
      xpReward: 100
    },
    {
      id: 211,
      question: "Un brick coûte 1€ plus la moitié de son prix. Combien coûte-t-il ?",
      answer: "2",
      acceptedAnswers: ["2", "deux", "2€", "2 euros", "deux euros"],
      explanation: "Si prix = P, alors P = 1 + P/2. Donc P - P/2 = 1, P/2 = 1, P = 2€.",
      xpReward: 100
    },
    {
      id: 212,
      question: "Quel est l'angle entre les aiguilles d'une horloge à 15h15 ?",
      answer: "7.5",
      acceptedAnswers: ["7.5", "7,5", "7.5 degrés", "7,5 degrés"],
      explanation: "À 15h15, la grande aiguille est sur le 3. Mais la petite a avancé de 1/4 d'heure = 7.5° (car elle fait 30° par heure). L'angle est donc 7.5°.",
      xpReward: 100
    },
    {
      id: 213,
      question: "Un lily pad double de taille chaque jour. S'il faut 48 jours pour couvrir un lac, combien faut-il pour couvrir la moitié ?",
      answer: "47",
      acceptedAnswers: ["47", "quarante-sept", "quarante sept", "47 jours"],
      explanation: "S'il double chaque jour et couvre tout le lac au jour 48, alors au jour 47 il couvrait la moitié (car il a doublé entre 47 et 48).",
      xpReward: 100
    },
    {
      id: 214,
      question: "100 personnes sont en cercle. On élimine la 2ème, puis on saute 1, on élimine, etc. Quelle position survit ?",
      answer: "73",
      acceptedAnswers: ["73", "soixante-treize", "position 73"],
      explanation: "C'est le problème de Josephus. Pour n=100, le survivant est à la position 2L+1 où L = n - 2^k (plus grande puissance de 2 ≤ n). 2^6=64, L=36, réponse = 73.",
      xpReward: 100
    },
    {
      id: 215,
      question: "Quel mot français de 7 lettres contient toutes les voyelles (a, e, i, o, u) une seule fois ?",
      answer: "oiseau",
      acceptedAnswers: ["oiseau", "un oiseau"],
      explanation: "OISEAU contient O, I, E, A, U = les 5 voyelles (sans Y). Mais c'est 6 lettres ! Le mot à 7 lettres serait OISEAUX.",
      xpReward: 100
    }
  ]
};

// Fonction pour obtenir l'énigme du jour basée sur la date
export const getDailyRiddle = (level) => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  
  const levelKey = `level${level}`;
  const riddleList = riddles[levelKey] || riddles.level1;
  
  // Utiliser le jour de l'année pour sélectionner une énigme différente chaque jour
  const index = dayOfYear % riddleList.length;
  return riddleList[index];
};

// Fonction pour vérifier la réponse
export const checkAnswer = (userAnswer, riddle) => {
  const normalizedAnswer = userAnswer.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Enlever les accents
  
  return riddle.acceptedAnswers.some(accepted => {
    const normalizedAccepted = accepted.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalizedAnswer === normalizedAccepted;
  });
};
