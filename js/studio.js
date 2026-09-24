/* Studio, à côté du téléphone (hors de l'app), sous l'outil de capture.
   · Couleurs : n'importe quelle couleur pour chacune des 5 catégories (zones). Les couleurs dérivées
     (texte des fiches, parties effacées du bateau, bouton clair ou sombre) sont recalculées pour rester lisibles.
   · Animations : quelques effets discrets appliqués d'office (pas de réglage) — morphing court entre écrans,
     léger tangage du bateau, entrée douce des cartes et listes. Coupés si le système demande moins de mouvement.
   Couleurs mémorisées dans ce navigateur. */
(() => {
  'use strict';
  const A = window.OCEANIS;
  const KEY = 'oceanis301:couleurs';
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───── Animations discrètes, toujours actives ───── */
  if (!reduit) document.body.classList.add('anim');
  A.transition = (paint, { retour }) => {
    if (reduit || !document.startViewTransition) return paint();
    document.documentElement.dataset.dir = retour ? 'retour' : 'aller';
    const vt = document.startViewTransition(paint);
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach(pr => pr && pr.catch(() => {}));   // expiration sur appareil lent : sans conséquence
  };

  /* ───── Couleurs libres par catégorie ───── */
  const OFFICIEL = Object.fromEntries(ZONES.map(z => [z.id, { couleur: z.couleur, texte: z.texte, sombre: z.sombre, fondu: z.fondu }]));
  let choix;
  try { choix = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { choix = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(choix)); } catch (e) { /* stockage indisponible */ } };

  const hex = c => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
  const toHex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lum = c => { const [r, g, b] = hex(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

  function appliquer(id) {
    const z = ZONES.find(x => x.id === id), c = choix[id];
    if (!c || c.toUpperCase() === OFFICIEL[id].couleur.toUpperCase()) { Object.assign(z, OFFICIEL[id]); return; }
    const sombre = contraste(c, '#FFFFFF') >= 3;            // texte blanc lisible sur la couleur → bouton clair
    let texte = c, k = 0;                                    // texte des fiches : assombri jusqu'à 4,5:1 sur blanc
    while (contraste(texte, '#FFFFFF') < 4.5 && k < 20) { k++; texte = mix(c, '#000000', k * 0.05); }
    Object.assign(z, { couleur: c.toUpperCase(), sombre, texte, fondu: sombre ? 'rgba(255,255,255,0.28)' : mix(c, '#FFFFFF', 0.32) });
  }
  ZONES.forEach(z => appliquer(z.id));

  /* ───── Panneau ───── */
  const col = document.createElement('div');
  col.id = 'sidecol';
  document.body.appendChild(col);
  const tools = document.getElementById('tools');
  if (tools) col.appendChild(tools);
  const card = document.createElement('section');
  card.className = 's-card';
  card.setAttribute('aria-label', 'Couleurs des catégories');
  col.appendChild(card);

  // Gammes toutes prêtes : une couleur par zone (B horizontal GV, P sécurité, O conduite, J vertical GV, V voile avant)
  const GAMMES = [
    { nom: 'Officielle', couleurs: null },
    { nom: 'Gamme colorée 1', couleurs: { B: '#1E405B', P: '#504443', O: '#E9B83F', J: '#EBD15C', V: '#A0B6B3' } },
  ];
  const gammeActive = () => GAMMES.findIndex(g => g.couleurs
    ? ZONES.every(z => (choix[z.id] || '').toUpperCase() === g.couleurs[z.id])
    : !Object.keys(choix).length);
  function draw() {
    const act = gammeActive();
    card.innerHTML = `<h2>Couleurs</h2><p class="s-sub">Une gamme toute prête, ou une couleur par catégorie.</p>
      <div class="s-gammes">${GAMMES.map((g, i) => `<button class="s-gamme${i === act ? ' on' : ''}" data-gamme="${i}"><span>${ZONES.map(z => `<i style="background:${g.couleurs ? g.couleurs[z.id] : OFFICIEL[z.id].couleur}"></i>`).join('')}</span>${g.nom}</button>`).join('')}</div>
      ${ZONES.map(z => {
        const perso = choix[z.id] && choix[z.id].toUpperCase() !== OFFICIEL[z.id].couleur.toUpperCase();
        return `<div class="s-coul">
          <label class="s-pick" style="background:${z.couleur}"><input type="color" value="${z.couleur.toLowerCase()}" data-zone="${z.id}" aria-label="Couleur ${z.nom}"></label>
          <span class="s-name"><b>${z.nom}</b><code>${z.couleur}</code></span>
          ${perso ? `<button class="s-reset" data-officiel="${z.id}" title="Revenir à ${OFFICIEL[z.id].couleur}">Officielle</button>` : ''}</div>`;
      }).join('')}
      ${Object.keys(choix).length ? '<div class="s-btns"><button data-tout>Revenir aux couleurs officielles</button></div>' : ''}`;
  }
  draw();

  const rendre = () => {                                     // mise à jour en direct, sans transition ni animation d'entrée
    document.body.classList.add('s-direct');
    const t = A.transition; A.transition = p => p(); A.route(); A.transition = t;
    requestAnimationFrame(() => document.body.classList.remove('s-direct'));
  };
  card.addEventListener('input', e => {
    const id = e.target.dataset.zone;
    if (!id) return;
    choix[id] = e.target.value; appliquer(id); save();
    const row = e.target.closest('.s-coul'), z = ZONES.find(x => x.id === id);
    row.querySelector('.s-pick').style.background = z.couleur;
    row.querySelector('code').textContent = z.couleur;
    rendre();
  });
  card.addEventListener('change', e => { if (e.target.dataset.zone) draw(); });
  card.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.officiel) delete choix[b.dataset.officiel];
    if (b.hasAttribute('data-tout')) choix = {};
    if (b.dataset.gamme != null) { const g = GAMMES[+b.dataset.gamme]; choix = g.couleurs ? { ...g.couleurs } : {}; }
    ZONES.forEach(z => appliquer(z.id)); save(); draw(); rendre();
  });

  /* ───── Réinitialiser : on repart du tout début (invitation WhatsApp), couleurs choisies conservées ───── */
  const rz = document.createElement('section');
  rz.className = 's-card';
  rz.setAttribute('aria-label', 'Réinitialiser');
  rz.innerHTML = `<h2>Réinitialiser</h2><p class="s-sub">Efface la progression, le prénom, les tâches et l'invitation vue, puis relance l'app depuis le début.</p>
    <div class="s-btns"><button data-reinit>Réinitialiser l'app</button></div>`;
  col.appendChild(rz);
  rz.addEventListener('click', e => {
    const b = e.target.closest('[data-reinit]');
    if (!b) return;
    if (!b.dataset.sur) {                                    // deuxième clic pour confirmer
      b.dataset.sur = '1'; b.textContent = 'Confirmer : tout effacer';
      setTimeout(() => { delete b.dataset.sur; b.textContent = "Réinitialiser l'app"; }, 4000);
      return;
    }
    try {
      Object.keys(localStorage).filter(k => k.startsWith('oceanis301:') && k !== KEY).forEach(k => localStorage.removeItem(k));
    } catch (x) { /* stockage indisponible */ }
    location.href = location.pathname;                      // sans #… : l'app repart sur l'invitation
  });

  /* ───── Export : l'app en un seul fichier HTML autonome ─────
     Styles, scripts et polices intégrés (data: URI), couleurs choisies figées dedans.
     Sans l'outil de capture ni ce panneau. Les tutos YouTube restent en ligne. */
  const exp = document.createElement('section');
  exp.className = 's-card';
  exp.setAttribute('aria-label', 'Export');
  exp.innerHTML = `<h2>Export</h2><p class="s-sub">L'app en un seul fichier .html, qui s'ouvre d'un double-clic, sans serveur.</p>
    <button class="s-main" data-export>Exporter la page HTML</button><p class="s-msg" aria-live="polite"></p>`;
  col.appendChild(exp);
  const msg = t => { exp.querySelector('.s-msg').textContent = t; };

  const texte = u => fetch(u, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(u + ' : ' + r.status); return r.text(); });
  const dataUri = async (u, type) => {
    const buf = new Uint8Array(await (await fetch(u)).arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return `data:${type};base64,${btoa(bin)}`;
  };
  const scriptSur = s => s.replace(/<\/script/gi, '<\\/script');

  async function exporter() {
    const btn = exp.querySelector('[data-export]');
    btn.disabled = true; msg('Assemblage…');
    try {
      // CSS avec les polices intégrées
      let css = await texte('css/app.css');
      const polices = [...new Set(css.match(/\.\.\/fonts\/[\w.-]+\.woff2/g) || [])];
      for (const f of polices) css = css.split(f).join(await dataUri(f.replace('../', ''), 'font/woff2'));
      // Données, avec les couleurs du moment figées
      let data = await texte('js/data.js');
      const couleurs = ZONES.map(z => ({ id: z.id, couleur: z.couleur, texte: z.texte, sombre: z.sombre, fondu: z.fondu }));
      data += `\n/* Couleurs figées à l'export */\n${JSON.stringify(couleurs)}.forEach(c => Object.assign(ZONES.find(z => z.id === c.id), c));\n`;
      let app = await texte('js/app.js');
      // Images PNG (cartes Conduite & navigation, vues du bateau de l'invitation) intégrées
      const TYPE = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
      const integrer = async src => { for (const img of [...new Set(src.match(/img\/[\w/.-]+\.(png|webp|jpe?g)/g) || [])]) src = src.split(img).join(await dataUri(img, TYPE[img.split('.').pop()])); return src; };
      app = await integrer(app);
      data = await integrer(data);
      // Bateau 3D : moteur compilé + modèle intégré (data: URI)
      const moteur3d = await texte('js/bateau3d.js');
      const modele3d = await dataUri('models/oceanis-10mo.glb', 'model/gltf-binary');
      // Animations discrètes (comme dans le studio, sans panneau)
      const anim = `(() => { const r = matchMedia('(prefers-reduced-motion: reduce)').matches; if (!r) document.body.classList.add('anim');
  window.OCEANIS.transition = (paint, o) => { if (r || !document.startViewTransition) return paint(); document.documentElement.dataset.dir = o.retour ? 'retour' : 'aller'; const vt = document.startViewTransition(paint); [vt.ready, vt.finished, vt.updateCallbackDone].forEach(p => p && p.catch(() => {})); }; })();`;
      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF">
<title>Oceanis 30.1 — Microlearning</title>
<!-- Export autonome du ${new Date().toLocaleString('fr-FR')} · tutos : YouTube (connexion requise) -->
<style>
${css}
</style>
</head>
<body>
<div id="stage" aria-live="polite"></div>
<script>
${scriptSur(data)}
</script>
<script>
${scriptSur(app)}
</script>
<script>
window.OCEANIS3D_MODELE = ${JSON.stringify(modele3d)};
</script>
<script>
${scriptSur(moteur3d)}
</script>
<script>
${scriptSur(anim)}
</script>
</body>
</html>
`;
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'oceanis-30-1-microlearning.html';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      msg(`Téléchargé : oceanis-30-1-microlearning.html (${Math.round(blob.size / 1024)} Ko)`);
    } catch (e) {
      msg('Export impossible : ' + e.message);
    } finally { btn.disabled = false; }
  }
  exp.addEventListener('click', e => { if (e.target.closest('[data-export]')) exporter(); });
})();
