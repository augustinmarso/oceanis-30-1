/* Deux modes d'arrivée (sur ordinateur) :
   · Dev : le prototype encadré + le panneau d'outils à côté (captures, couleurs, export…).
   · Médiation : pour un stand ou un vidéoprojecteur, tout l'écran (plein écran réel, sans barres du navigateur)
     affiche un grand QR code. Le visiteur le scanne : l'app s'ouvre sur son téléphone (?mode=partage) et passe
     en plein écran dès son premier toucher.
   Le plein écran d'une page exige un geste de la personne : la médiation se lance donc sans recharger la page. */
(() => {
  'use strict';
  const A = window.OCEANIS;
  const mode = new URLSearchParams(location.search).get('mode');
  const CHOIX = 'oceanis301:mode';
  const racine = document.documentElement;
  const pleinEcran = () => {
    if (document.fullscreenElement || !racine.requestFullscreen) return;
    racine.requestFullscreen({ navigationUI: 'hide' }).catch(() => { /* refusé (iOS…) : l'app reste en plein navigateur */ });
  };
  const qrSvg = (url, el) => import('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm')
    .then(m => { const qr = m.default(0, 'M'); qr.addData(url); qr.make(); el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); })
    .catch(() => { el.textContent = url; el.classList.add('sans-qr'); });

  /* ───── Partage (téléphone qui a scanné) : plein écran au premier toucher ───── */
  if (mode === 'partage') {
    const une = () => { pleinEcran(); removeEventListener('pointerup', une, true); };
    addEventListener('pointerup', une, true);
    return;
  }

  /* ───── Médiation : écran QR code en plein écran ───── */
  function lancerMediation() {
    if (document.getElementById('mediation')) return;
    pleinEcran();
    history.replaceState(null, '', location.pathname + '?mode=mediation');
    document.body.classList.add('mediation');
    const url = A.lienPartage('#/rejoindre');
    const m = document.createElement('main');
    m.id = 'mediation';
    m.innerHTML = `<div class="md-texte">
        <small>Oceanis 30.1 · ${VOYAGE.titre}</small>
        <h1>De passager<br>à équipier</h1>
        <p>Scanne le code avec ton téléphone : l'app s'ouvre en plein écran. ${ZONES.reduce((n, z) => n + z.actions.length, 0)} gestes à apprendre, 2 minutes chacun, avant de monter à bord.</p>
        <ol><li><b>1</b>Scanne le code</li><li><b>2</b>Écris ton prénom</li><li><b>3</b>Embarque</li></ol>
        <div class="md-zones">${ZONES.map(z => `<i style="background:${z.couleur}" title="${z.nom}"></i>`).join('')}</div>
      </div>
      <div class="md-code"><div class="md-qr" role="img" aria-label="QR code : ouvrir l'app sur ton téléphone"></div><small>${url.replace(/^https?:\/\//, '').replace(/[?#].*$/, '')}</small></div>
      <span class="md-coin"><button data-plein>Plein écran</button><button data-sortir>Quitter</button></span>`;
    document.body.appendChild(m);
    qrSvg(url, m.querySelector('.md-qr'));
    const majCoin = () => { m.querySelector('[data-plein]').hidden = !!document.fullscreenElement; };
    document.addEventListener('fullscreenchange', majCoin); majCoin();
    m.addEventListener('click', e => {
      if (e.target.closest('[data-sortir]')) { if (document.fullscreenElement) document.exitFullscreen(); location.href = location.pathname; return; }
      pleinEcran();                                           // tout clic (re)passe en plein écran
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.fullscreenElement) location.href = location.pathname; });
  }
  A.lancerMediation = lancerMediation;

  // Lien direct ?mode=mediation (ordinateur du stand) : l'écran s'affiche ; un clic le met en plein écran
  if (mode === 'mediation') { lancerMediation(); return; }

  /* ───── Choix à l'arrivée (ordinateur, sans lien précis) ───── */
  const ordi = matchMedia('(pointer: fine)').matches && innerWidth > 900;
  let deja = null;
  try { deja = sessionStorage.getItem(CHOIX); } catch (e) { /* stockage indisponible */ }
  if (!mode && ordi && !deja && /^#?\/?(inviter)?$/.test(location.hash)) {
    const c = document.createElement('div');
    c.id = 'choix-mode';
    c.innerHTML = `<div class="cm-boite" role="dialog" aria-label="Choisir un mode">
        <small>Oceanis 30.1 — Microlearning</small><h2>Choisis un mode</h2>
        <button data-mode="dev"><b>Dev</b><span>Le prototype sur téléphone, avec les outils : captures, couleurs, export.</span></button>
        <button data-mode="mediation"><b>Médiation</b><span>Un grand QR code en plein écran : les visiteurs le scannent et ouvrent l'app sur leur téléphone.</span></button>
      </div>`;
    document.body.appendChild(c);
    c.addEventListener('click', e => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      try { sessionStorage.setItem(CHOIX, b.dataset.mode); } catch (x) { /* stockage indisponible */ }
      c.remove();
      if (b.dataset.mode === 'mediation') lancerMediation();   // sans rechargement : le plein écran est accordé par ce clic
    });
  }
})();
