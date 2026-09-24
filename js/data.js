/* Oceanis 30.1 — Microlearning : contenu.
   Tout le parcours découle de ces données : zones → pièces (fiches) → actions (gestes) → mise en situation.
   La progression d'une zone = actions validées / actions de la zone. */

const INK = '#10233A';
// Adresse publique de l'app (GitHub Pages) : cible du QR code et des liens d'invitation envoyés depuis le mode dev local
const URL_PUBLIQUE = 'https://augustinmarso.github.io/oceanis-30-1/';
const MUTED = '#5B6573';

const ZONES = [
  {
    id: 'B', nom: 'Horizontal grand-voile', court: 'Horizontal GV',
    couleur: '#0B4F7C', texte: '#0B4F7C', sombre: true, fondu: 'rgba(255,255,255,0.28)',
    resume: 'Bôme, écoute de GV, hale-bas',
    intro: "Tout ce qui règle l'ouverture de la grand-voile, par la bôme.",
    pieces: ['ecoute-gv', 'bosse-empointure', 'hale-bas', 'balancine'],
    actions: ['border-gv', 'choquer-gv', 'maintenir-bome', 'regler-tension'],
  },
  {
    id: 'P', nom: 'Sécurité', court: 'Sécurité',
    couleur: '#A50000', texte: '#A50000', sombre: true, fondu: 'rgba(255,255,255,0.28)',
    resume: 'Gilet, poignées, VHF',
    intro: 'Tout ce qui te protège et te permet de bouger à bord sans risque.',
    pieces: ['gilet', 'prises', 'circulation', 'vhf'],
    actions: ['mettre-gilet', 'se-deplacer', 'allumer-vhf'],
  },
  {
    id: 'O', nom: 'Conduite & navigation', court: 'Conduite',
    couleur: '#FF8110', texte: '#A94F00', sombre: false, fondu: '#FFA85A',
    resume: 'Barre, instruments, moteur',
    intro: "Tout ce qui sert à diriger le bateau et à savoir où l'on va.",
    pieces: ['barre', 'compas', 'observation', 'moteur'],
    actions: ['diriger', 'observer-360', 'comprendre-vent', 'allumer-moteur'],
    // Module d'entrée de la zone : Vent → Se repérer → Observer à 360°, puis les mises en situation des gestes couverts
    module: { label: 'Vent, repères, horizon', cartes: ['vent', 'reperes', 'horizon'], quiz: ['comprendre-vent', 'observer-360'] },
  },
  {
    id: 'J', nom: 'Vertical grand-voile', court: 'Vertical GV',
    couleur: '#F0D492', texte: '#7A5A12', sombre: false, fondu: '#E3C57E',
    resume: 'Drisse, bosse de ris, guindant',
    intro: 'Tout ce qui fait monter, descendre et réduire la grand-voile, le long du mât.',
    pieces: ['drisse', 'bosse-ris', 'guindant'],
    actions: ['accrocher-drisse', 'hisser', 'affaler', 'prendre-ris'],
  },
  {
    id: 'V', nom: 'Voile avant', court: 'Voile avant',
    couleur: '#00B0B9', texte: '#006B71', sombre: false, fondu: '#5FCDD3',
    resume: 'Enrouleur, écoute, contre-écoute',
    intro: "Tout ce qui sort, range et règle le foc, à l'avant du mât.",
    pieces: ['enrouleur', 'ecoute-foc', 'contre-ecoute', 'winch'],
    actions: ['derouler-foc', 'border-foc', 'choquer-foc', 'regler-winch'],
  },
];

/* Pièces : une fiche chacune, badgeables NFC.
   titre = titre d'onglet ; nom = libellé des puces ; action = geste proposé par « Passer à l'action ». */
const PIECES = {
  'ecoute-gv': {
    zone: 'B', nom: 'Écoute de GV', titre: "l'Écoute de GV", action: 'border-gv',
    def: "L'écoute de grand-voile, c'est le cordage qui relie la bôme au cockpit, en passant par des poulies.",
    sert: "Elle règle l'ouverture de la grand-voile : on la tire pour rapprocher la voile de l'axe du bateau, on la relâche pour l'ouvrir.",
    skipper: '« Borde la GV ! »',
    comment: [{ t: "Tire l'écoute franchement", sous: ['Puis bloque-la dans le taquet'] }],
  },
  'bosse-empointure': {
    zone: 'B', nom: "Bosse d'empointure", titre: "la Bosse d'empointure", action: 'regler-tension',
    def: "La bosse d'empointure tire le coin arrière du bas de la grand-voile vers le bout de la bôme.",
    sert: "Elle règle la tension du bas de la voile, le long de la bôme. Tendue, la voile est plate ; relâchée, elle se creuse.",
    skipper: '« Étarque la bordure ! »',
    comment: [{ t: 'Tire la bosse au cockpit', sous: ['Jusqu\'à effacer les plis le long de la bôme'] }],
  },
  'hale-bas': {
    zone: 'B', nom: 'Hale-bas de bôme', titre: 'le Hale-bas', action: 'maintenir-bome',
    def: "Le hale-bas relie le dessous de la bôme au pied du mât.",
    sert: "Il empêche la bôme de remonter quand la voile est ouverte. La voile garde une bonne forme et la bôme ne se balade pas.",
    skipper: '« Reprends du hale-bas ! »',
    comment: [{ t: 'Tire le hale-bas', sous: ['Choque-le avant de hisser ou de prendre un ris'] }],
  },
  'balancine': {
    zone: 'B', nom: 'Balancine', titre: 'la Balancine', action: 'maintenir-bome',
    def: "La balancine est le cordage qui relie le bout de la bôme au haut du mât.",
    sert: "Elle tient la bôme en l'air quand la grand-voile est affalée, pour qu'elle ne tombe pas dans le cockpit.",
    skipper: '« Reprends la balancine ! »',
    comment: [{ t: 'Tends-la avant d\'affaler', sous: ['Relâche-la une fois la voile hissée'] }],
  },
  'gilet': {
    zone: 'P', nom: 'Gilet de sauvetage', titre: 'le Gilet', action: 'mettre-gilet',
    def: "Le gilet autogonflant se porte comme un collier. Il se gonfle tout seul au contact de l'eau.",
    sert: "Il te maintient la tête hors de l'eau si tu tombes. On le met avant de monter à bord, et on ne l'enlève qu'au port.",
    skipper: '« Gilets pour tout le monde ! »',
    comment: [{ t: 'Enfile-le et ferme la boucle', sous: ['Serre la sangle : deux doigts de jeu, pas plus'] }],
  },
  'prises': {
    zone: 'P', nom: 'Prises et poignées', titre: 'les Poignées', action: 'se-deplacer',
    def: "Mains courantes sur le rouf, filières, haubans : ce sont les prises solides pour se tenir.",
    sert: "Le bateau gîte et bouge. En t'accrochant, tu gardes l'équilibre même quand une vague arrive.",
    skipper: '« Une main pour toi, une main pour le bateau ! »',
    comment: [{ t: 'Garde toujours une main sur une prise', sous: ['Change de prise seulement quand l\'autre main tient'] }],
  },
  'circulation': {
    zone: 'P', nom: 'Zone de circulation', titre: 'la Circulation', action: 'se-deplacer',
    def: "Le passavant, entre le rouf et les filières, est le chemin pour aller de l'arrière vers l'avant.",
    sert: "C'est la zone où l'on marche sans rien écraser ni se prendre les pieds dans les cordages.",
    skipper: '« Passe au vent ! »',
    comment: [{ t: 'Avance côté au vent, accroupi', sous: ['Regarde où tu poses les pieds'] }],
  },
  'vhf': {
    zone: 'P', nom: 'VHF', titre: 'la VHF', action: 'allumer-vhf',
    def: "La VHF est la radio du bord. Elle parle aux autres bateaux, aux ports et aux secours.",
    sert: "Le canal 16 est celui de la sécurité : on le garde en veille, et c'est là qu'on appelle en cas de problème.",
    skipper: '« Mets la VHF en veille sur le 16 ! »',
    comment: [{ t: 'Allume et sélectionne le canal 16', sous: ['Monte le volume pour entendre les appels'] }],
  },
  'barre': {
    zone: 'O', nom: 'Barre', titre: 'la Barre', action: 'diriger',
    def: "La barre franche est le long bras relié au safran, sous l'arrière du bateau.",
    sert: "Elle dirige le bateau. On pousse la barre d'un côté : le bateau tourne de l'autre.",
    skipper: '« Prends la barre ! »',
    comment: [{ t: 'Tiens-la à une main, assis au vent', sous: ['Petits mouvements, puis attends la réaction'] }],
  },
  'compas': {
    zone: 'O', nom: 'Compas et instruments', titre: 'les Instruments', action: 'diriger',
    def: "Le compas indique le cap. Les écrans donnent la vitesse, la profondeur et le vent.",
    sert: "Ils permettent de garder une direction et de vérifier qu'il y a assez d'eau sous la quille.",
    skipper: '« Tiens le cap au 270 ! »',
    comment: [{ t: 'Lis le chiffre face à toi sur le compas', sous: ['Corrige doucement si le cap s\'écarte'] }],
  },
  'observation': {
    zone: 'O', nom: "Éléments d'observation", titre: "l'Observation", action: 'observer-360',
    def: "Girouette en haut du mât, penons sur les voiles, drapeaux et fumées : tout ce qui montre le vent.",
    sert: "Ils disent d'où vient le vent et si les voiles sont bien réglées, sans regarder un écran.",
    skipper: '« D\'où vient le vent ? »',
    comment: [{ t: 'Regarde la girouette en tête de mât', sous: ['Puis sens le vent sur ton visage'] }],
  },
  'moteur': {
    zone: 'O', nom: 'Moteur', titre: 'le Moteur', action: 'allumer-moteur',
    def: "Le moteur diesel est sous la descente. On le commande depuis le cockpit : tableau et manette.",
    sert: "Il sert à sortir et rentrer au port, et à avancer quand il n'y a pas de vent.",
    skipper: '« Démarre le moteur ! »',
    comment: [{ t: 'Manette au point mort', sous: ['Puis contact et démarrage'] }],
  },
  'drisse': {
    zone: 'J', nom: 'Drisse', titre: 'la Drisse', action: 'hisser',
    def: "La drisse, c'est le cordage qui monte et descend la grand-voile le long du mât. Elle part de la tête de mât et revient au cockpit.",
    sert: "Au départ, on hisse la voile avec. À l'arrivée, on la choque pour affaler. Entre les deux, elle reste bloquée pour garder la voile bien tendue.",
    skipper: '« Envoie la GV ! »',
    comment: [{ t: 'Tire la drisse à la main', sous: ['Puis finis au winch'] }],
  },
  'bosse-ris': {
    zone: 'J', nom: 'Bosse de ris', titre: 'la Bosse de ris', action: 'prendre-ris',
    def: "La bosse de ris est le cordage qui ramène une bande de la grand-voile contre la bôme.",
    sert: "Elle sert à réduire la surface de la voile quand le vent forcit : moins de toile, bateau plus calme.",
    skipper: '« On prend un ris ! »',
    comment: [{ t: 'Tire la bosse jusqu\'à la bôme', sous: ['Puis bloque-la'] }],
  },
  'guindant': {
    zone: 'J', nom: 'Guindant de voile', titre: 'le Guindant', action: 'accrocher-drisse',
    def: "Le guindant est le bord avant de la grand-voile, celui qui court le long du mât.",
    sert: "Il glisse dans le rail du mât quand on hisse. Bien tendu, il n'a pas de plis horizontaux.",
    skipper: '« Le guindant fait des plis, reprends de la drisse ! »',
    comment: [{ t: 'Regarde le bord avant de la voile', sous: ['Des plis ? La drisse n\'est pas assez tendue'] }],
  },
  'enrouleur': {
    zone: 'V', nom: 'Enrouleur de foc', titre: "l'Enrouleur", action: 'derouler-foc',
    def: "L'enrouleur est le tambour au pied de l'étai, à l'avant. Le foc s'enroule autour de l'étai.",
    sert: "Il permet de sortir ou de ranger le foc depuis le cockpit, sans aller à l'avant.",
    skipper: '« Envoie le foc ! »',
    comment: [{ t: "Libère le bout d'enrouleur en le freinant", sous: ["Pendant qu'un équipier tire l'écoute"] }],
  },
  'ecoute-foc': {
    zone: 'V', nom: 'Écoute du foc', titre: "l'Écoute du foc", action: 'border-foc',
    def: "Il y a deux écoutes de foc, une de chaque côté. L'écoute, c'est celle qui travaille, côté sous le vent.",
    sert: "Elle règle l'ouverture du foc : on la borde pour fermer la voile, on la choque pour l'ouvrir.",
    skipper: '« Borde le foc ! »',
    comment: [{ t: "Prends l'écoute côté sous le vent", sous: ['Tire, puis finis au winch'] }],
  },
  'contre-ecoute': {
    zone: 'V', nom: 'Contre-écoute du foc', titre: 'la Contre-écoute', action: 'choquer-foc',
    def: "La contre-écoute est l'autre écoute du foc, côté au vent. Elle reste molle.",
    sert: "Au virement de bord, les rôles s'inversent : la contre-écoute devient l'écoute, et inversement.",
    skipper: '« Paré à virer, prépare la contre-écoute ! »',
    comment: [{ t: 'Fais deux tours sur le winch au vent', sous: ['Sans la tendre, jusqu\'au virement'] }],
  },
  'winch': {
    zone: 'V', nom: 'Winch', titre: 'le Winch', action: 'regler-winch',
    def: "Un winch (ou ouinch), c'est un cabestan mécanique installé sur les voiliers. Son rôle est d'amplifier ta force pour étarquer (border) les voiles sous tension sans te casser le dos.",
    sert: "Quand le vent souffle dans les voiles, la tension sur les cordages (les écoutes et drisses) devient trop forte pour être tirée à la force des bras. Le winch agit comme un démultiplicateur de force.",
    commentTitre: "Comment l'utiliser en 4 étapes simples",
    comment: [
      { t: "Tourner dans le sens des aiguilles d'une montre", sous: ['Prends le bout du cordage et enroule-le'] },
      { t: 'Faire 3 tours', sous: ['Plus il y a de tension, plus il faut de tours'] },
      { t: 'Coincer dans la mâchoire du haut', sous: ['Le winch tient le cordage tout seul'] },
      { t: 'Tourner la manivelle', sous: ['Puis retire-la et range-la'] },
    ],
  },
};

/* Actions (gestes). type 'geste' = étapes avec liste ; type 'lecon' = cartes illustrées.
   fleche : indication sur la silhouette du bateau (coordonnées du dessin 320×300). */
const ACTIONS = {
  'border-gv': {
    zone: 'B', titre: 'Border la GV', court: 'Border la GV', duree: 2, type: 'geste', pieces: ['ecoute-gv'],
    fleche: [262, 212, 196, 212],
    etapes: [
      { t: 'Repère l\'écoute de GV au cockpit', tip: "Elle part de la bôme et descend par des poulies jusqu'au taquet." },
      { t: 'Sors-la du taquet en la gardant en main', tip: 'Garde une main ferme : la voile tire dessus.' },
      { t: 'Tire jusqu\'à ce que la voile ne faseye plus', tip: 'Faseyer, c\'est quand la voile bat comme un drapeau.' },
      { t: 'Bloque-la dans le taquet', tip: 'Love le surplus au fond du cockpit, pas sous tes pieds.' },
    ],
    quiz: {
      contexte: "La grand-voile bat comme un drapeau.", parole: "« Borde la GV ! »", question: "Quel geste fais-tu ?",
      options: ["Je tire l'écoute de GV", "Je relâche l'écoute de GV", "Je reprends la drisse de GV"],
      bonne: 0, explication: "On tire l'écoute : la voile se rapproche de l'axe du bateau et arrête de faseyer.",
    },
  },
  'choquer-gv': {
    zone: 'B', titre: 'Choquer la GV', court: 'Choquer la GV', duree: 2, type: 'geste', pieces: ['ecoute-gv'],
    fleche: [200, 212, 266, 212],
    etapes: [
      { t: "Prends l'écoute en main avant de la décoincer", tip: 'Jamais de cordage sous tension lâché d\'un coup.' },
      { t: 'Laisse-la filer doucement dans tes mains', tip: 'Freine avec la main, pas avec les doigts enroulés.' },
      { t: 'Arrête quand la voile commence à faseyer', tip: 'Puis reprends un peu : la voile est juste bordée.' },
      { t: 'Bloque et range le cordage', tip: 'Le skipper peut te redemander un réglage à tout moment.' },
    ],
    quiz: {
      contexte: "Le bateau tourne, le vent arrive maintenant de côté. Consigne du skipper :", parole: "« Choque la GV ! »", question: "Ça veut dire…",
      options: ["Relâcher l'écoute en douceur", "Descendre la grand-voile", "Tirer l'écoute à fond"],
      bonne: 0, explication: "Choquer, c'est relâcher un cordage de façon contrôlée. La voile s'ouvre et reste bien réglée.",
    },
  },
  'maintenir-bome': {
    zone: 'B', titre: 'Maintenir la bôme', court: 'Maintenir la bôme', duree: 2, type: 'geste', pieces: ['hale-bas', 'balancine'],
    etapes: [
      { t: 'Repère la bôme et reste hors de son passage', tip: 'Au changement de bord, elle traverse le cockpit à hauteur de tête.' },
      { t: 'Reprends le hale-bas', tip: 'La bôme ne remonte plus quand la voile est ouverte.' },
      { t: 'Avant d\'affaler, tends la balancine', tip: 'Elle tiendra la bôme quand la voile ne la porte plus.' },
      { t: 'Préviens avant chaque empannage', tip: 'Tout le monde baisse la tête : « Attention à la bôme ! »' },
    ],
    quiz: {
      contexte: "Vent arrière. Le skipper prévient :", parole: "« Attention à la bôme ! »", question: "Ton réflexe ?",
      options: ["Je baisse la tête", "Je retiens la bôme", "Je me lève pour voir"],
      bonne: 0, explication: "La bôme traverse le cockpit d'un coup. On se baisse, et on ne la retient jamais à la main.",
    },
  },
  'regler-tension': {
    zone: 'B', titre: 'Régler la tension de la GV', court: 'Régler la GV', duree: 3, type: 'geste', pieces: ['bosse-empointure', 'hale-bas'],
    etapes: [
      { t: 'Regarde la forme de la voile', tip: 'Des plis le long de la bôme : la bordure est trop molle.' },
      { t: "Tire la bosse d'empointure", tip: 'Beaucoup de vent : on aplatit. Peu de vent : on creuse.' },
      { t: 'Ajuste le hale-bas', tip: 'Il garde le haut de la voile bien réglé.' },
      { t: "Vérifie les penons sur la voile", tip: 'Ils doivent flotter droit vers l\'arrière.' },
    ],
    quiz: {
      contexte: "Le vent monte, le bateau penche beaucoup.", parole: "« Aplatis la GV ! »", question: "Sur quoi agis-tu ?",
      options: ["La bosse d'empointure", "La drisse de GV", "L'enrouleur de foc"],
      bonne: 0, explication: "Tendre la bordure aplatit la voile : elle prend moins de puissance, le bateau se redresse.",
    },
  },
  'mettre-gilet': {
    zone: 'P', titre: 'Mettre son gilet', court: 'Mettre le gilet', duree: 2, type: 'geste', pieces: ['gilet'],
    etapes: [
      { t: 'Passe le gilet autour du cou', tip: 'Il se porte avant de monter à bord.' },
      { t: 'Ferme la boucle sur le ventre', tip: 'Tu dois entendre le clic.' },
      { t: 'Serre la sangle', tip: 'Deux doigts de jeu entre la sangle et toi, pas plus.' },
      { t: 'Passe les sous-cutales entre les jambes', tip: 'Sans elles, le gilet peut remonter par-dessus ta tête dans l\'eau.' },
    ],
    quiz: {
      contexte: "Sur le ponton, avant d'embarquer :", parole: "« Gilets pour tout le monde ! »", question: "Quand le mets-tu ?",
      options: ["Tout de suite, avant de monter", "Seulement s'il y a du vent", "Une fois sorti du port"],
      bonne: 0, explication: "Le gilet se met avant d'embarquer et ne s'enlève qu'au retour au port.",
    },
  },
  'se-deplacer': {
    zone: 'P', titre: 'Se déplacer sur le pont', court: 'Se déplacer', duree: 2, type: 'geste', pieces: ['prises', 'circulation'],
    etapes: [
      { t: 'Préviens le skipper avant d\'aller à l\'avant', tip: 'Il adaptera sa conduite.' },
      { t: 'Passe côté au vent, par le passavant', tip: 'Le côté haut quand le bateau penche.' },
      { t: 'Garde une main sur une prise', tip: 'Une main pour toi, une main pour le bateau.' },
      { t: 'Reste bas, les pieds bien à plat', tip: 'Ne marche jamais sur un cordage ou une voile.' },
    ],
    quiz: {
      contexte: "Le bateau gîte et tu dois aller à l'avant.", parole: "« Passe au vent ! »", question: "Par où passes-tu ?",
      options: ["Par le côté haut, en me tenant", "Par le côté bas, près de l'eau", "Sur le rouf, debout"],
      bonne: 0, explication: "Le côté au vent est le côté haut : tu t'éloignes de l'eau et tu restes accroché aux prises.",
    },
  },
  'allumer-vhf': {
    zone: 'P', titre: 'Allumer la VHF', court: 'Allumer la VHF', duree: 2, type: 'geste', pieces: ['vhf'],
    etapes: [
      { t: 'Allume la VHF à la table à cartes', tip: 'Bouton marche, ou molette du volume.' },
      { t: 'Sélectionne le canal 16', tip: 'Souvent une touche dédiée : 16/9.' },
      { t: 'Règle le volume et le squelch', tip: 'Tourne le squelch jusqu\'à ce que le souffle s\'arrête.' },
      { t: 'Laisse-la en veille', tip: 'En cas de détresse : « Mayday » trois fois sur le 16.' },
    ],
    quiz: {
      contexte: "Sortie du port. Depuis le cockpit, on te demande :", parole: "« VHF en veille, s'il te plaît ! »", question: "Tu la règles sur…",
      options: ["Le canal 16", "Le canal 9, toujours", "Le canal du port d'arrivée"],
      bonne: 0, explication: "Le 16 est le canal de sécurité et de détresse : c'est celui qu'on écoute en navigation.",
    },
  },
  'diriger': {
    zone: 'O', titre: 'Diriger le bateau', court: 'Diriger', duree: 3, type: 'geste', pieces: ['barre', 'compas'],
    etapes: [
      { t: 'Assieds-toi côté au vent, la barre en main', tip: 'Tu vois mieux les voiles et devant toi.' },
      { t: 'Choisis un repère devant le bateau', tip: 'Un phare, une maison, un nuage bas.' },
      { t: 'Pousse la barre pour tourner de l\'autre côté', tip: 'Barre à gauche : le bateau part à droite.' },
      { t: 'Petits mouvements, puis attends', tip: 'Le bateau réagit avec un temps de retard.' },
    ],
    quiz: {
      contexte: "Tu tiens la barre franche.", parole: "« Viens un peu à droite ! »", question: "Tu pousses la barre…",
      options: ["Vers la gauche", "Vers la droite", "Nulle part : tu la lâches"],
      bonne: 0, explication: "Avec une barre franche, on pousse du côté opposé à celui où l'on veut aller.",
    },
  },
  'observer-360': {
    zone: 'O', titre: 'Observer le plan d\'eau à 360°', court: 'Observer à 360°', duree: 2, type: 'lecon', pieces: ['observation'], cartes: ['horizon'],
    quiz: {
      contexte: "Pendant ton tour d'horizon, une tache sombre avance sur l'eau.", parole: "« Tu vois quelque chose ? »", question: "C'est…",
      options: ["Une risée : du vent arrive", "Un haut-fond sous l'eau", "L'ombre d'un nuage, rien de plus"],
      bonne: 0, explication: "Une risée assombrit l'eau : le vent va forcir d'un coup. On prévient le skipper.",
    },
  },
  'comprendre-vent': {
    zone: 'O', titre: 'Comprendre la direction du vent', court: 'Lire le vent', duree: 3, type: 'lecon', pieces: ['observation', 'compas'], cartes: ['vent', 'reperes'],
    quiz: {
      contexte: "Le bateau est pile face au vent, les voiles battent.", parole: "« Pourquoi on n'avance plus ? »", question: "Ta réponse ?",
      options: ["On est dans la zone morte", "Le moteur est coupé", "Les voiles sont trop bordées"],
      bonne: 0, explication: "Face au vent, les voiles ne portent plus : c'est la zone morte, le bateau s'arrête.",
    },
  },
  'allumer-moteur': {
    zone: 'O', titre: 'Allumer le moteur', court: 'Démarrer le moteur', duree: 2, type: 'geste', pieces: ['moteur'],
    etapes: [
      { t: 'Mets la manette au point mort', tip: 'Manette à la verticale : le bateau n\'avancera pas au démarrage.' },
      { t: 'Mets le contact et préchauffe', tip: 'Quelques secondes, le voyant s\'éteint.' },
      { t: 'Démarre', tip: 'Relâche dès que le moteur tourne.' },
      { t: 'Vérifie l\'eau à l\'échappement', tip: 'De l\'eau doit sortir à l\'arrière : le moteur est refroidi.' },
    ],
    quiz: {
      contexte: "Départ du ponton.", parole: "« Démarre le moteur ! »", question: "Tu vérifies d'abord…",
      options: ["La manette au point mort", "Le foc bien déroulé", "La VHF bien éteinte"],
      bonne: 0, explication: "Au point mort, le bateau ne bondit pas en avant au démarrage.",
    },
  },
  'accrocher-drisse': {
    zone: 'J', titre: 'Accrocher la drisse', court: 'Accrocher la drisse', duree: 2, type: 'geste', pieces: ['drisse', 'guindant'],
    etapes: [
      { t: 'Retire la housse de la grand-voile', tip: 'Ouvre le lazy-bag sur la bôme.' },
      { t: 'Trouve la têtière, en haut de la voile', tip: 'Le coin renforcé avec un œillet.' },
      { t: 'Accroche la manille de la drisse', tip: 'Visse ou clipse jusqu\'au bout.' },
      { t: 'Vérifie qu\'elle ne s\'enroule nulle part', tip: 'Suis la drisse des yeux jusqu\'en haut du mât.' },
    ],
    quiz: {
      contexte: "La housse est ouverte, la voile est prête.", parole: "« Frappe la drisse ! »", question: "Où l'accroches-tu ?",
      options: ["En haut de la voile", "Au bout de la bôme", "Au pied du mât"],
      bonne: 0, explication: "La drisse tire la voile par son coin du haut, la têtière.",
    },
  },
  'hisser': {
    zone: 'J', titre: 'Hisser la grand-voile', court: 'Hisser la GV', duree: 3, type: 'geste', pieces: ['drisse', 'guindant'],
    fleche: [165, 212, 165, 52],
    etapes: [
      { t: 'Vérifie que la drisse est accrochée en tête de voile', tip: 'Suis-la des yeux jusqu\'en haut du mât.' },
      { t: "Choque l'écoute de GV et le hale-bas", tip: 'La bôme doit être libre de monter un peu.' },
      { t: 'Hisse à la drisse, puis finis au winch', tip: 'Le skipper garde le bateau face au vent. Tire à la main tant que ça glisse, puis passe la drisse au winch.' },
      { t: 'Bloque et range le cordage', tip: 'Ferme le bloqueur, puis love la drisse.' },
    ],
    quiz: {
      contexte: "Tu es prêt à hisser. Le skipper annonce :", parole: "« Je me mets face au vent ! »", question: "Pourquoi ?",
      options: ["Pour que la voile monte sans forcer", "Pour que le bateau accélère", "Pour s'écarter des autres bateaux"],
      bonne: 0, explication: "Face au vent, la voile ne se remplit pas : elle glisse le long du mât sans résister.",
    },
  },
  'affaler': {
    zone: 'J', titre: 'Affaler la voile', court: 'Affaler la GV', duree: 2, type: 'geste', pieces: ['drisse'],
    fleche: [165, 52, 165, 212],
    etapes: [
      { t: 'Tends la balancine', tip: 'Elle tiendra la bôme.' },
      { t: 'Le skipper met le bateau face au vent', tip: 'La voile se vide et faseye.' },
      { t: 'Ouvre le bloqueur et choque la drisse', tip: 'Garde un tour sur le winch pour freiner.' },
      { t: 'Range la voile dans le lazy-bag', tip: 'Puis referme-le.' },
    ],
    quiz: {
      contexte: "Arrivée au port.", parole: "« On affale ! »", question: "Tu choques…",
      options: ["La drisse de GV", "L'écoute du foc", "La bosse de ris"],
      bonne: 0, explication: "La drisse retient la voile en haut : en la choquant, la voile descend le long du mât.",
    },
  },
  'prendre-ris': {
    zone: 'J', titre: 'Prendre un ris', court: 'Prendre un ris', liste: 'Prendre un ris (réduire la surface de la voile)', duree: 3, type: 'geste', pieces: ['bosse-ris', 'drisse'],
    etapes: [
      { t: "Choque l'écoute de GV et le hale-bas", tip: 'La voile se vide de son vent.' },
      { t: "Choque la drisse jusqu'au repère", tip: 'Une marque sur la drisse indique où s\'arrêter.' },
      { t: 'Tire la bosse de ris et bloque-la', tip: 'La bande de voile vient se plaquer contre la bôme.' },
      { t: 'Reprends la drisse, puis règle l\'écoute', tip: 'Moins de toile, bateau plus calme.' },
    ],
    quiz: {
      contexte: 'Le vent forcit. Ton skipper te dit :', parole: '« On prend un ris ! »', question: 'Ça veut dire quoi ?',
      options: ['Réduire la surface de la grand-voile', 'Enrouler le foc', "Border l'écoute de grand-voile"],
      bonne: 0, explication: 'On descend un peu la grand-voile et on la bloque avec la bosse de ris : moins de toile, bateau plus calme.',
    },
  },
  'derouler-foc': {
    zone: 'V', titre: 'Dérouler et enrouler le foc', court: 'Dérouler le foc', duree: 3, type: 'geste', pieces: ['enrouleur', 'ecoute-foc'],
    etapes: [
      { t: "Libère le bout d'enrouleur en le freinant", tip: 'Garde-le en main : il ne doit pas filer d\'un coup.' },
      { t: "Tire l'écoute du foc côté sous le vent", tip: 'Le foc se déroule autour de l\'étai.' },
      { t: 'Pour ranger, choque l\'écoute doucement', tip: 'Garde-la un peu tendue pour un enroulement serré.' },
      { t: "Tire le bout d'enrouleur et bloque-le", tip: 'Deux tours de voile autour de l\'étai suffisent à la protéger.' },
    ],
    quiz: {
      contexte: "Le vent tombe, on rentre.", parole: "« Roule le foc ! »", question: "Tu tires…",
      options: ["Le bout d'enrouleur", "L'écoute du foc", "La drisse de GV"],
      bonne: 0, explication: "Le bout d'enrouleur fait tourner le tambour : le foc s'enroule autour de l'étai.",
    },
  },
  'border-foc': {
    zone: 'V', titre: 'Border le foc', court: 'Border le foc', duree: 2, type: 'geste', pieces: ['ecoute-foc', 'winch'],
    fleche: [186, 230, 150, 222],
    etapes: [
      { t: "Prends l'écoute côté sous le vent", tip: 'C\'est celle qui est tendue.' },
      { t: "Passe l'écoute au winch", tip: 'Trois tours, sens horaire : voir la fiche du winch.' },
      { t: 'Tire, puis tourne la manivelle', tip: 'Jusqu\'à ce que le foc ne faseye plus.' },
      { t: 'Coince l\'écoute et range la manivelle', tip: 'Une manivelle qui traîne finit à l\'eau.' },
    ],
    quiz: {
      contexte: "Le foc faseye.", parole: "« Borde le foc ! »", question: "Quelle écoute prends-tu ?",
      options: ["Celle sous le vent", "Celle au vent", "Les deux ensemble"],
      bonne: 0, explication: "L'écoute qui travaille est sous le vent. Celle au vent, la contre-écoute, reste molle.",
    },
  },
  'choquer-foc': {
    zone: 'V', titre: 'Choquer le foc', court: 'Choquer le foc', duree: 2, type: 'geste', pieces: ['ecoute-foc', 'contre-ecoute'],
    fleche: [150, 222, 190, 232],
    etapes: [
      { t: "Garde l'écoute en main sur le winch", tip: 'Une main à plat sur les tours pour freiner.' },
      { t: 'Sors-la de la mâchoire', tip: 'Le winch ne tient plus le cordage : c\'est toi qui tiens.' },
      { t: 'Laisse filer petit à petit', tip: 'Regarde les penons : ils doivent flotter droit.' },
      { t: 'Recoince quand c\'est réglé', tip: 'Au virement, la contre-écoute prendra le relais.' },
    ],
    quiz: {
      contexte: "Le bateau s'écarte du vent, le foc est trop fermé.", parole: "« Choque le foc ! »", question: "Tu fais quoi ?",
      options: ["Je relâche l'écoute", "J'enroule le foc", "Je borde la contre-écoute"],
      bonne: 0, explication: "Quand le vent vient plus de côté, on ouvre la voile en choquant l'écoute, doucement.",
    },
  },
  'regler-winch': {
    zone: 'V', titre: 'Régler avec le winch', court: 'Régler au winch', duree: 3, type: 'geste', pieces: ['winch'],
    etapes: [
      { t: 'Choisis le winch du côté du cordage', tip: "Un winch de chaque bord : celui sous le vent pour l'écoute du foc." },
      { t: 'Enroule trois tours en gardant le bout en main', tip: 'Sens horaire, comme sur la fiche du winch.' },
      { t: 'Engage la mâchoire, puis mets la manivelle', tip: 'La manivelle se clipse sur le dessus du winch.' },
      { t: 'Tourne vite, puis en petite vitesse quand ça force', tip: 'Change de sens de rotation pour passer en petite vitesse. Retire la manivelle à la fin.' },
    ],
    quiz: {
      contexte: "L'écoute est trop tendue pour tes bras.", parole: "« Mets-la au winch ! »", question: "Tu l'enroules…",
      options: ["Dans le sens horaire", "Dans le sens antihoraire", "Dans n'importe quel sens"],
      bonne: 0, explication: "Un winch ne tourne que dans un sens : celui des aiguilles d'une montre.",
    },
  },
};

/* Cartes des leçons illustrées (zone Conduite). */
const CARTES = {
  vent: {
    titre: 'le Vent', illus: 'vent',
    textes: [
      "Le bateau n'avance pas face au vent : c'est la zone morte. Selon l'angle avec le vent, on parle d'« allure ».",
      'Pour lire le vent : la girouette en haut du mât, les penons sur les voiles, le vent sur ton visage.',
    ],
    suivant: 'Se repérer à bord',
  },
  reperes: {
    titre: 'Se repérer', illus: 'reperes',
    textes: [
      "À bord, on ne dit pas gauche et droite : on dit bâbord et tribord, en regardant vers l'avant.",
      'Astuce : « BAtTRIe » — BA à gauche, TRI à droite.',
      'Le côté qui reçoit le vent est « au vent », l\'autre « sous le vent ».',
    ],
    suivant: 'Observer autour',
  },
  horizon: {
    titre: 'Observer à 360°', illus: 'horizon',
    textes: ["Fais régulièrement un tour d'horizon complet et dis au skipper ce que tu vois :"],
    liste: ['les autres bateaux', 'les bouées et le balisage', "les risées, taches sombres sur l'eau", 'la côte et le ciel'],
    suivant: 'Mise en situation',
  },
};

/* État de démonstration = celui des maquettes (Parcours / Progrès / Accueil). */
const ETAT_DEMO = {
  faits: ['border-gv', 'mettre-gilet', 'se-deplacer', 'accrocher-drisse', 'affaler', 'prendre-ris'],
  enCours: { hisser: 2 },
  dernier: 'hisser',
  badges: { 'ecoute-gv': 1, 'gilet': 1, 'prises': 1, 'vhf': 1, 'drisse': 1, 'bosse-ris': 1 },
};

/* Tutos YouTube en français (un par geste ou par carte illustrée), vérifiés intégrables.
   [id YouTube, titre, chaîne, durée] */
const VIDEOS = {
  'border-gv': ['zpBjFAIjlRU', 'Lofer, border, abattre, choquer', 'Ocean Skills', '2:24'],
  'choquer-gv': ['zpBjFAIjlRU', 'Lofer, border, abattre, choquer', 'Ocean Skills', '2:24'],
  'maintenir-bome': ['e7pZzMAMWTo', 'Un hale-bas, mais à quoi ça sert ?', "Voilier Del'His", '2:22'],
  'regler-tension': ['o-wvyzqHy6c', 'Le b.a.-ba des réglages de voile', 'North Sails · Skippers', '16:05'],
  'mettre-gilet': ['d1OdGjKjpVo', 'Mettez correctement votre gilet de sauvetage', 'SVB', '1:15'],
  'se-deplacer': ['3F5vTwnjsYY', 'Se déplacer en sécurité', 'SNSM · Ocean Skills', '3:08'],
  'allumer-vhf': ['hfG7nsPP4IA', 'Les basiques de la VHF', 'Bateaux.com', '3:56'],
  'diriger': ['Yl6zBdazbKQ', 'Apprendre à barrer un voilier', 'TV Vendée', '2:05'],
  'allumer-moteur': ['f_GWB_f8jYM', 'Démarrage moteur, manœuvres au port', 'Team Winds Regatta', '9:36'],
  'accrocher-drisse': ['t9dmgvAFNYc', 'On embarque ! Hisser les voiles', 'Les Glénans', '2:04'],
  'hisser': ['fapuCrybdtE', 'Hisser la grand-voile', 'EXPERiiiENCE', '2:55'],
  'affaler': ['f3XPRdQFqsg', 'Affaler la GV', 'EXPERiiiENCE', '1:38'],
  'prendre-ris': ['f_quaz9zCXA', 'Prendre un ris et réduire la voilure', 'EXPERiiiENCE', '3:10'],
  'derouler-foc': ['Mw5bk-XoHVc', 'Dérouler le génois', 'EXPERiiiENCE', '0:50'],
  'border-foc': ['Ya1kM0NtnJ8', 'Régler ses voiles facilement', 'Coraille En Voyage', '7:24'],
  'choquer-foc': ['UwQr1RLb9qU', 'Les penons : où, comment, 3 exemples', 'Barreatribord', '14:17'],
  'regler-winch': ['bLipkSfU2Ro', "L'utilisation du winch", "Envoil'", '3:35'],
  'carte:vent': ['R75Qra_BePk', "Les allures d'un bateau à voile", 'Initiatives.fr', '2:57'],
  'carte:reperes': ['2XmU3tjRhoQ', 'Bâbord / tribord', 'Carantec Nautisme', '2:56'],
};

/* ───── Organisation à bord ─────
   Un poste par zone. Chaque équipier est placé là où il a débloqué le plus de leçons (gestes validés).
   « moi » = l'utilisateur de l'app : ses gestes viennent de sa progression réelle. Les autres : état de démonstration. */
const POSTES = {
  O: { nom: 'Barreur', role: 'Tient la barre et garde le cap' },
  B: { nom: 'Régleur de grand-voile', role: 'Borde et choque la GV, tient la bôme' },
  J: { nom: 'Pied de mât', role: 'Hisse, affale et prend les ris' },
  V: { nom: "Équipier d'avant", role: 'Déroule le foc, règle au winch' },
  P: { nom: 'Veille sécurité', role: 'Gilets, VHF, veille autour du bateau' },
};
const NIVEAUX = [          // seuil = part des 19 gestes validés
  [0, 'Passager'], [0.15, 'Moussaillon'], [0.4, 'Matelot'], [0.75, 'Équipier'], [1, 'Équipier confirmé'],
];
const EQUIPAGE = [
  { id: 'marc', nom: 'Marc', skipper: true, faits: 'tout' },
  { id: 'moi', nom: 'Toi' },
  { id: 'lea', nom: 'Léa', faits: ['diriger', 'observer-360', 'comprendre-vent', 'allumer-moteur', 'mettre-gilet', 'border-foc', 'derouler-foc', 'regler-winch'] },
  { id: 'hugo', nom: 'Hugo', faits: ['derouler-foc', 'border-foc', 'choquer-foc', 'regler-winch', 'mettre-gilet', 'se-deplacer', 'border-gv'] },
  { id: 'ines', nom: 'Inès', faits: ['mettre-gilet', 'se-deplacer', 'allumer-vhf', 'observer-360'] },
];

/* ───── Invitation au voyage (page d'avant l'accueil) ─────
   Ce que le skipper envoie à ses amis avant la navigation. Coordonnées en degrés (lon, lat). */
const VOYAGE = {
  de: 'Marc', titre: 'Belle-Île & Houat', sous: 'Trois jours à la voile en baie de Quiberon',
  dates: 'Ven. 12 → dim. 14 juin', duree: '3 jours · 2 nuits à bord', distance: '≈ 38 milles',
  rdv: 'La Trinité-sur-Mer · ponton visiteurs · vendredi 9 h',
  message: "On part à 5 sur l'Oceanis. Pas besoin de savoir naviguer : avant le départ, l'app t'apprend les gestes, 2 minutes à la fois. À bord, chacun aura son poste, et dimanche tu barres jusqu'au port.",
  etapes: [
    { nom: 'La Trinité-sur-Mer', quand: 'Ven. 9 h', note: 'Départ', lon: -3.028, lat: 47.584 },
    { nom: 'Le Palais, Belle-Île', quand: 'Ven. soir', note: '16 milles · nuit au port', lon: -3.153, lat: 47.349 },
    { nom: "Houat · Treac'h er Goured", quand: 'Sam.', note: '10 milles · baignade, nuit au mouillage', lon: -2.948, lat: 47.386 },
    { nom: 'La Trinité-sur-Mer', quand: 'Dim. 17 h', note: '12 milles · retour', lon: -3.028, lat: 47.584 },
  ],
  // Tracé (points de passage, lissés à l'affichage)
  route: [
    [-3.028, 47.584], [-3.035, 47.56], [-3.05, 47.52], [-3.06, 47.47], [-3.08, 47.42], [-3.12, 47.37], [-3.153, 47.349],
    [-3.12, 47.36], [-3.06, 47.37], [-3.0, 47.378], [-2.948, 47.386],
    [-2.96, 47.42], [-2.99, 47.47], [-3.01, 47.52], [-3.025, 47.56], [-3.028, 47.584],
  ],
  meteo: [
    { jour: 'Ven.', ciel: 'soleil', temp: 21, vent: 'NO', noeuds: '10–14', dir: 315 },
    { jour: 'Sam.', ciel: 'voile', temp: 20, vent: 'O', noeuds: '12–16', dir: 270 },
    { jour: 'Dim.', ciel: 'soleil', temp: 23, vent: 'N', noeuds: '8–12', dir: 0 },
  ],
  bateau: { nom: 'Oceanis 30.1', details: '9,5 m · 2 cabines · 6 couchages' },
  // Photos de l'Oceanis 30.1 (beneteau.com, projet Beneteau × Decathlon) ; « pos » = cadrage dans la vignette
  photos: [
    { src: 'img/voyage/beneteau-navigation.webp', legende: 'Au mouillage, déjeuner dans le cockpit' },
    { src: 'img/voyage/beneteau-couverture.webp', legende: 'Oceanis 30.1 sous spi', pos: '18% 50%' },
    { src: 'img/voyage/beneteau-barres.webp', legende: 'Les deux barres à roue' },
    { src: 'img/voyage/beneteau-cockpit.webp', legende: 'Le cockpit, table dépliée' },
    { src: 'img/voyage/beneteau-interieur.webp', legende: 'Le carré, 2 cabines' },
  ],

};
/* Trait de côte simplifié (lon, lat) pour la carte au trait : baie de Quiberon */
const COTES = [
  // continent : Plouharnel → presqu'île de Quiberon → Carnac → La Trinité → Locmariaquer → Rhuys
  [[-3.36, 47.7], [-3.36, 47.628], [-3.24, 47.625], [-3.2, 47.62], [-3.16, 47.6], [-3.152, 47.575], [-3.145, 47.535], [-3.137, 47.505], [-3.142, 47.482],
   [-3.12, 47.468], [-3.098, 47.473], [-3.092, 47.49], [-3.103, 47.512], [-3.11, 47.545], [-3.098, 47.568], [-3.075, 47.576], [-3.045, 47.578], [-3.032, 47.574],
   [-3.022, 47.598], [-3.012, 47.6], [-3.0, 47.577], [-2.972, 47.566], [-2.945, 47.558], [-2.925, 47.556], [-2.92, 47.582], [-2.905, 47.576], [-2.914, 47.549],
   [-2.898, 47.53], [-2.87, 47.515], [-2.84, 47.502], [-2.8, 47.49], [-2.78, 47.495], [-2.78, 47.7]],
  // Belle-Île
  [[-3.25, 47.39], [-3.215, 47.374], [-3.18, 47.36], [-3.153, 47.349], [-3.12, 47.338], [-3.09, 47.325], [-3.062, 47.311], [-3.075, 47.297], [-3.11, 47.296],
   [-3.15, 47.305], [-3.19, 47.318], [-3.225, 47.332], [-3.255, 47.352], [-3.262, 47.374]],
  // Houat
  [[-2.995, 47.393], [-2.975, 47.397], [-2.958, 47.392], [-2.94, 47.384], [-2.947, 47.377], [-2.965, 47.378], [-2.985, 47.383]],
  // Hoëdic
  [[-2.892, 47.346], [-2.872, 47.345], [-2.858, 47.335], [-2.87, 47.33], [-2.888, 47.336]],
];

/* Tâches à se répartir (tableau kanban d'Organisation à bord). Les postes (zone) suivent les leçons débloquées. */
const TACHES = [
  { id: 'barre', titre: 'Barrer', zone: 'O' },
  { id: 'gv', titre: 'Régler la grand-voile', zone: 'B' },
  { id: 'mat', titre: 'Pied de mât : hisser, ris', zone: 'J' },
  { id: 'foc', titre: 'Foc et winchs', zone: 'V' },
  { id: 'secu', titre: 'Veille et sécurité', zone: 'P' },
  { id: 'courses', titre: 'Courses et avitaillement', note: 'Avant le départ', texte: "Les courses pour 3 jours à 5 : petits-déjeuners, 2 déjeuners au mouillage, le dîner de vendredi. Compte 2 L d'eau par personne et par jour. À bord, le frais va dans la glacière, le reste dans les coffres du carré." },
  { id: 'covoit', titre: 'Covoiturage', note: 'Vendredi matin', texte: "Organise les voitures jusqu'à La Trinité-sur-Mer : départ vendredi vers 7 h, rendez-vous au ponton visiteurs à 9 h. Parking longue durée près de la capitainerie." },
  { id: 'cuisine', titre: 'Dîner de samedi', note: 'Au mouillage', texte: "Le dîner de samedi au mouillage de Houat : un plat simple, dans une seule casserole, sur le réchaud à gaz du bord. Ferme le gaz à la bouteille après usage." },
  { id: 'amarres', titre: 'Amarres et pare-battages', note: 'À chaque port', texte: "À l'approche du port : sors les amarres avant et arrière et accroche les pare-battages côté quai, à hauteur du ponton. Au départ, on les rentre et on les range dans le coffre." },
];

/* ───── Avant de naviguer : préparer son sac (produits Decathlon) ─────
   img : identifiant d'image du CDN Decathlon (contents.mediadecathlon.com) ; lien : fiche produit sur decathlon.fr ;
   louer : l'équipement se loue aussi (Decathlon Location). */
const DECATHLON = { site: 'https://www.decathlon.fr', images: 'https://contents.mediadecathlon.com/', location: 'https://www.decathlon.fr/circularity/rentals' };
const SAC = [
  // Kit à se fournir : photo locale (src), carte pleine largeur (large), contenu détaillé
  // page produit dédiée (#/produit/mallette), façon fiche Decathlon ; prix indicatif : concept du projet
  { id: 'mallette', nom: 'La mallette des 5 F de la navigation', src: 'img/voyage/mallette-5f.jpg', page: true,
    marque: 'QUECHUA', prix: '34,99 €', note: 'Le kit complet, rangé dans une trousse',
    description: 'Une trousse qui s’ouvre à plat : tout ce qu’il faut pour une journée en mer tient dedans, chaque chose à sa place. Elle se glisse dans le sac étanche et se retrouve en un geste.',
    contenu: ['Couvertures de survie', 'Multi-outil', 'Compas et crayon', 'Comprimés et collyre', 'Tour de cou polaire', 'Barres de céréales', 'Gourde 500 ml', 'Lampe frontale', 'Mousqueton'],
    lien: '/search?Ntt=trousse%20de%20rangement%20quechua' },
  { id: 'sac', nom: 'Sac étanche souple', note: 'Duffle 60 L : il se range sous la couchette', img: 'p2831005/k$7a6bac21233e1fcfa4f0e98eaab26cfc', lien: '/p/sac-etanche-duffle-bag-sac-de-voyage-60l-jaune-noir/333985/c290c381m8773849', louer: true },
  { id: 'veste', nom: 'Veste imperméable', note: 'Contre les embruns et le vent', img: 'p2491510/k$5ece759390b53853845aca10773962b2', lien: '/p/blouson-veste-impermeable-de-voile-coupe-vent-sailing-500-homme-gris-noir/327999/c383c381m8612702', louer: true },
  { id: 'pull', nom: 'Pull marin', note: 'Il fait frais le soir au mouillage', img: 'p3214206/k$b22438bc044e19d78d3da48c8682f5f1', lien: '/p/pull-marin-de-voile-homme-100-bleu-marine/310099/c43c43c43m9017988' },
  { id: 'pantalon', nom: 'Pantalon de voile', note: 'Léger, sèche vite', img: 'p2581386/k$48b4d7577f78dce231064b1d99d3c386', lien: '/p/pantalon-de-voile-en-coton-100-homme-bleu-marine/333951/c43m8647730' },
  { id: 'chaussures', nom: 'Chaussures bateau', note: 'Semelle blanche antidérapante', img: 'p3115061/k$53b674da881fc72676a62ef0696653ca', lien: '/p/chaussures-bateau-cuir-sailing-500-marron/343554/c92m8771988' },
  { id: 'gilet', nom: 'Gilet autogonflant', note: 'Le bateau en a ; le tien est à ta taille', img: 'p1587034/k$bef5f028ceb7e1777fb3e8852920ddca', lien: '/p/gilet-de-sauvetage-automatique-gonflable-adulte-lj-150n-air-noir/170813/c382m8491769', louer: true },
  { id: 'gants', nom: 'Gants de voile', note: 'Pour les écoutes et le winch', img: 'p2811424/k$9426a28bbe1a3b74a030f9fbb25d9cc5', lien: '/p/gants-de-voile-adulte-2-doigts-coupes-sailing-900-noir/333892/c382c180m8647380' },
  { id: 'lunettes', nom: 'Lunettes polarisées', note: 'La mer réfléchit le soleil', img: 'p3051976/k$3896e8bb91a60b7ce507f0bb01f3033c', lien: '/p/lunettes-de-soleil-sport-polarisees-categorie-3-explore-500-wrp/365352/c210m8942059' },
  { id: 'chapeau', nom: 'Chapeau bateau', note: 'Avec son cordon, contre le vent', img: 'p3105156/k$89c0f51ce37a3c3985a8d1d741dbc141', lien: '/p/chapeau-bateau-adulte-500-france-bleu-marine/333965/c195m8971970' },
  { id: 'creme', nom: 'Crème solaire SPF 50', note: 'Tube 200 ml, à remettre toutes les 2 heures', img: 'p3139843/k$4edf99eef9119ab7017ce448d123388d', lien: '/p/creme-solaire-spf50-200ml/347098/m8803560' },
  { id: 'frontale', nom: 'Lampe frontale', note: 'Pour la nuit, sans éblouir les autres', img: 'p2572886/k$ecd1bf4d819100bc04f8a9438fee4c41', lien: '/p/lampe-frontale-rechargeable-120-lumens-hl100-usb/302568/c195c443m8505682', louer: true },
  { id: 'serviette', nom: 'Serviette microfibre', note: 'Compacte, sèche en une heure', img: 'p2865244/k$c988e439487b8516cb8faffbff14d235', lien: '/p/serviette-microfibre-ultra-compacte-taille-xl-110-x-175-cm-noir/158653/c382c108m8926381' },
  { id: 'duvet', nom: 'Sac de couchage', note: 'Léger, 20 °C suffit en juin', img: 'p3088710/k$2ed3af0e9d3eedf4fbccee19f005b481', lien: '/p/sac-de-couchage-de-camping-20degc-basic/381859/c386c149c288m9003378', louer: true },
];
/* Vie à bord : les trois règles du bord (illustrées par un produit du sac) */
const VIE_A_BORD = [
  { titre: 'Pas de valise', texte: 'Un sac souple, qui se plie et se glisse sous la couchette.', img: 'sac' },
  { titre: 'Une couchette chacun', texte: 'Le duvet reste déplié, la frontale accrochée à portée de main.', img: 'duvet' },
  { titre: 'Chaque chose à sa place', texte: 'Quand le bateau penche, tout ce qui traîne tombe : on range après usage.', img: 'frontale' },
];
