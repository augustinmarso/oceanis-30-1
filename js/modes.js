/* Deux modes d'arrivée (sur ordinateur) :
   · Dev : le prototype encadré + le panneau d'outils à côté (captures, couleurs, export…).
   · Médiation : pour un stand ou un vidéoprojecteur, tout l'écran affiche un grand QR code. Le visiteur le scanne :
     l'app s'ouvre en plein écran sur son téléphone (?mode=partage), sur « Rejoindre » (son prénom) puis le voyage.
   ?mode=mediation dans l'adresse ouvre directement la médiation ; Échap la quitte. */
(() => {
  'use strict';
  const A = window.OCEANIS;
  const mode = new URLSearchParams(location.search).get('mode');
  const CHOIX = 'oceanis301:mode';
  const qrSvg = (url, el) => import('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm')
    .then(m => { const qr = m.default(0, 'M'); qr.addData(url); qr.make(); el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); })
    .catch(() => { el.textContent = url; el.classList.add('sans-qr'); });
  const vers = m => { location.href = location.pathname + (m ? '?mode=' + m : ''); };

  /* ───── Médiation : écran QR code plein écran ───── */
  if (mode === 'mediation') {
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
      <button class="md-sortir" aria-label="Quitter la médiation (Échap)">Échap</button>`;
    document.body.appendChild(m);
    qrSvg(url, m.querySelector('.md-qr'));
    const sortir = () => vers('');
    m.querySelector('.md-sortir').addEventListener('click', sortir);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') sortir(); });
    return;
  }

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
        <button data-mode="mediation"><b>Médiation</b><span>Un grand QR code plein écran : les visiteurs le scannent et ouvrent l'app sur leur téléphone.</span></button>
      </div>`;
    document.body.appendChild(c);
    c.addEventListener('click', e => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      try { sessionStorage.setItem(CHOIX, b.dataset.mode); } catch (x) { /* stockage indisponible */ }
      if (b.dataset.mode === 'mediation') vers('mediation'); else c.remove();
    });
  }
})();
