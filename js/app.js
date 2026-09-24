/* Oceanis 30.1 — Microlearning : routeur, état et écrans.
   Parcours : Accueil → Zone → Fiche (pièce) → Action (geste) → Mise en situation → Progrès.
   Raccourcis : Parcours, Progrès, pastilles de zones, bateau cliquable, recherche, badge NFC. */
(() => {
  'use strict';

  const $stage = document.getElementById('stage');
  // Deux modes : « dev » (téléphone encadré + panneau d'outils à côté) et « partage » (médiation, après scan du QR code) :
  // l'app occupe tout l'écran de l'appareil, sans cadre ni outils. ?mode=partage dans l'adresse.
  const PARTAGE = new URLSearchParams(location.search).get('mode') === 'partage';
  document.body.classList.toggle('partage', PARTAGE);
  const lienPartage = (h = '') => (/^(localhost|127\.|192\.168\.)/.test(location.hostname) ? URL_PUBLIQUE : location.origin + location.pathname) + '?mode=partage' + h;
  const Z = Object.fromEntries(ZONES.map(z => [z.id, z]));
  const zoneOf = id => Z[id];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ───────────── État (localStorage) ───────────── */
  const KEY = 'oceanis301:etat';
  const fresh = () => ({ faits: {}, enCours: {}, dernier: null, badges: {} });
  const demo = () => {
    const s = fresh();
    ETAT_DEMO.faits.forEach(a => (s.faits[a] = true));
    Object.assign(s.enCours, ETAT_DEMO.enCours);
    s.dernier = ETAT_DEMO.dernier;
    const t = Date.now() - 86400000;
    Object.keys(ETAT_DEMO.badges).forEach(p => (s.badges[p] = t));
    return s;
  };
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || demo(); } catch (e) { S = demo(); }
  S = Object.assign(fresh(), S);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } };

  const pct = z => z.actions.filter(a => S.faits[a]).length / z.actions.length;
  const pctLabel = z => Math.floor(pct(z) * 100) + ' %';
  const total = () => {
    const all = ZONES.flatMap(z => z.actions);
    return all.filter(a => S.faits[a]).length / all.length;
  };
  const nbPieces = Object.keys(PIECES).length;
  const nbBadges = () => Object.keys(S.badges).filter(p => PIECES[p]).length;

  function nextAction(zid) {
    const order = zid ? [Z[zid], ...ZONES.filter(z => z.id !== zid)] : ZONES;
    for (const z of order) for (const a of z.actions) if (!S.faits[a]) return a;
    return null;
  }
  function resumeAction() {
    if (S.dernier && !S.faits[S.dernier]) return S.dernier;
    return nextAction(S.dernier ? ACTIONS[S.dernier].zone : null);
  }
  const startHref = aid => {
    const a = ACTIONS[aid];
    return a.type === 'lecon' ? `#/carte/${aid}/0` : `#/fiche/${a.pieces[0]}/${aid}`;
  };
  // Durée restante d'un geste commencé (au prorata des étapes)
  const remaining = aid => {
    const a = ACTIONS[aid], s = S.enCours[aid];
    if (s == null || a.type !== 'geste') return a.duree;
    return Math.max(1, Math.round(a.duree * (a.etapes.length - s) / a.etapes.length));
  };
  // Couleur intermédiaire : la zone se colore au fur et à mesure (gris → couleur)
  const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('');

  function finish(aid) {
    S.faits[aid] = true;
    delete S.enCours[aid];
    S.dernier = nextAction(ACTIONS[aid].zone);
    save();
  }

  /* ───────────── Icônes ───────────── */
  const ic = (d, c = INK, s = 22, w = 2) =>
    `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    back: c => ic('<path d="M15 5l-7 7 7 7"/>', c),
    close: c => ic('<path d="M6 6l12 12M18 6L6 18"/>', c),
    arrow: c => ic('<path d="M5 12h14M13 6l6 6-6 6"/>', c, 18),
    dossier: () => ic('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10h18"/>', INK, 20),
    home: () => ic('<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h4.5v-6h3v6H18V9.5"/>', INK, 20),
    chart: () => ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', INK, 20),
    search: () => ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', INK, 22),
    redo: () => ic('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>', MUTED, 16),
    check: (c, s = 12, w = 3) => ic('<path d="M5 12l5 5 9-10"/>', c, s, w),
    play: c => ic('<path d="M8 5.5v13l11-6.5z" fill="' + c + '"/>', c, 14, 2),
    nfc: (c, s = 24) => ic('<path d="M5 9a5 5 0 0 1 0 6"/><path d="M8.5 6.5a9 9 0 0 1 0 11"/><path d="M12 4a13 13 0 0 1 0 16"/><path d="M15.5 2a17 17 0 0 1 0 20"/>', c, s),
    like: () => ic('<path d="M7 10v12"/><path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8a2 2 0 0 1-1.9 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9z"/>', '#FFFFFF', 16, 2.2),
    equipage: () => ic('<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.6"/><path d="M15.5 14.6a4.5 4.5 0 0 1 5.5 4.4"/>', INK, 20),
    soleil: c => ic('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>', c, 30, 1.6),
    voile: c => ic('<path d="M9.5 6.2A4 4 0 0 1 15.8 9"/><path d="M9 3v1.4M4.2 5l1 1M3 9.8h1.4"/><path d="M7 19.5h10.5a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6-.7A3.9 3.9 0 0 0 7 19.5z"/>', c, 30, 1.6),
    whatsapp: () => ic('<path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.4 18.5z"/><path d="M9.2 8.6c.2-.5.6-.6.9-.6l.6 1.4-.6.8c.4 1.1 1.3 2 2.4 2.5l.8-.6 1.4.6c0 .4-.2.9-.7 1.1-2.3.6-5.4-2.5-4.8-5.2z"/>', '#FFFFFF', 20),
    ventFleche: (c, deg) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${deg}deg)" aria-hidden="true"><path d="M12 3v17M6 14l6 6 6-6"/></svg>`,
  };

  /* ───────────── Mesure de texte (largeur des onglets) ───────────── */
  const ctx = document.createElement('canvas').getContext('2d');
  const textW = (t, font) => { ctx.font = font; return ctx.measureText(t).width; };

  /* Onglet de titre (à droite) posé sur la carte blanche */
  function tabTitle(label, color) {
    const w = Math.max(96, Math.round(textW(label, "500 15px Poppins") + 48));
    const a = Math.max(124, 322 - w);
    const d = `M0 46 Q0 30 14 30 H${a - 26} Q${a - 18} 30 ${a - 15} 24 L${a - 8} 7 Q${a - 5} 0 ${a + 3} 0 H308 Q316 0 319 7 L325 22 Q328 30 331 33 Q334 36 334 46 V47 H0 Z`;
    return `<div class="tab"><svg width="334" height="47" viewBox="0 0 334 47" aria-hidden="true"><path d="${d}" fill="#FFFFFF"/></svg><span style="left:${a}px;width:${322 - a}px;color:${color}">${esc(label)}</span></div>`;
  }
  /* Dossier du Parcours : onglet à gauche décalé selon l'ordre */
  function folderPath(a, w, h) {
    const b = a + w;
    return `M0 46 Q0 30 16 30 H${a - 14} Q${a - 7} 30 ${a - 4} 23 L${a + 2} 7 Q${a + 5} 0 ${a + 13} 0 H${b - 13} Q${b - 5} 0 ${b - 2} 7 L${b + 4} 23 Q${b + 7} 30 ${b + 14} 30 H318 Q334 30 334 46 V${h - 16} Q334 ${h} 318 ${h} H16 Q0 ${h} 0 ${h - 16} Z`;
  }

  /* ───────────── Bateau (une seule silhouette, 5 zones colorées) ─────────────
     mode 'home'    : couleurs pleines, pièces cliquables
     mode 'zone'    : panneau d'une zone, la zone active ressort, les autres s'effacent
     mode 'progres' : une zone se colore à mesure qu'elle est maîtrisée (pleine couleur à 100 %) */
  const WINCH = [205, 226];
  function boat({ mode = 'home', zone = null, fleche = null, pulse = null } = {}) {
    const act = zone && Z[zone];
    let fill = '#FFFFFF', stroke = INK, col;
    if (mode === 'zone') {
      fill = act.couleur; stroke = act.sombre ? '#FFFFFF' : INK;
      col = id => (id === zone ? stroke : act.fondu);
    } else if (mode === 'progres') {
      col = id => mix('#C9C5BC', Z[id].couleur, pct(Z[id]));
    } else col = id => Z[id].couleur;
    const hit = mode === 'home';
    const g = (id, inner, wide) => hit
      ? `<g class="hit" data-go="#/zone/${id}" role="link" aria-label="${esc(Z[id].nom)}">${wide || ''}${inner}</g>`
      : inner;
    const T = 'stroke="transparent" stroke-width="22" stroke-linecap="round"';
    let s = `<svg width="320" height="300" viewBox="0 0 320 300" fill="none" aria-hidden="${hit ? 'false' : 'true'}">`;
    s += g('J', `<path d="M156 30 L156 214 L262 214 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`);
    s += g('V', `<path d="M146 48 L58 226 L140 222 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`);
    s += `<path d="M34 236 L292 236 L274 268 Q160 282 60 268 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>`;
    s += `<path d="M118 236 L128 222 L204 222 L214 236" stroke="${stroke}" stroke-width="1.4"/>`;
    s += g('J', `<line x1="152" y1="22" x2="152" y2="236" stroke="${col('J')}" stroke-width="6" stroke-linecap="round"/><line x1="159" y1="34" x2="159" y2="212" stroke="${col('J')}" stroke-width="3.5"/>`, `<line x1="155" y1="22" x2="155" y2="210" ${T}/>`);
    s += g('B', `<line x1="152" y1="216" x2="266" y2="216" stroke="${col('B')}" stroke-width="7" stroke-linecap="round"/><line x1="246" y1="216" x2="240" y2="234" stroke="${col('B')}" stroke-width="3"/>`, `<line x1="160" y1="216" x2="266" y2="216" ${T}/>`);
    s += g('V', `<line x1="148" y1="44" x2="52" y2="232" stroke="${col('V')}" stroke-width="3.5"/><line x1="140" y1="222" x2="190" y2="232" stroke="${col('V')}" stroke-width="3"/><circle cx="54" cy="232" r="6" fill="${col('V')}"/>`, `<line x1="140" y1="60" x2="56" y2="226" ${T}/>`);
    s += g('O', `<path d="M270 236 L302 220" stroke="${col('O')}" stroke-width="6" stroke-linecap="round"/><rect x="220" y="225" width="18" height="11" rx="2" fill="${col('O')}"/>`, `<line x1="266" y1="238" x2="304" y2="219" ${T}/>`);
    s += g('P', `<path d="M44 222 L292 222" stroke="${col('P')}" stroke-width="2.5" stroke-dasharray="6 4"/>` +
      [60, 100, 240, 280].map(x => `<line x1="${x}" y1="222" x2="${x}" y2="236" stroke="${col('P')}" stroke-width="2.5"/>`).join(''),
      `<line x1="60" y1="229" x2="118" y2="229" ${T}/><line x1="240" y1="229" x2="286" y2="229" ${T}/>`);
    if (fleche) {
      const [x1, y1, x2, y2] = fleche, c = act && act.sombre ? '#FFFFFF' : INK;
      const ang = Math.atan2(y2 - y1, x2 - x1), L = 12;
      const p1 = [x2 - L * Math.cos(ang - 0.6), y2 - L * Math.sin(ang - 0.6)], p2 = [x2 - L * Math.cos(ang + 0.6), y2 - L * Math.sin(ang + 0.6)];
      s += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${c}" stroke-width="3.5" stroke-dasharray="7 7"><animate attributeName="stroke-dashoffset" from="28" to="0" dur="1.2s" repeatCount="indefinite"/></path>`;
      s += `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${x2} ${y2} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (pulse) {
      const c = Z[PIECES[pulse].zone].couleur, [x, y] = WINCH;
      s += `<circle class="pulse" cx="${x}" cy="${y}" r="34" stroke="${c}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="33" stroke="${c}" stroke-width="2" opacity="0.3"/><circle cx="${x}" cy="${y}" r="22" stroke="${c}" stroke-width="2.5" opacity="0.6"/><circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="#FFFFFF" stroke-width="3"/>`;
    }
    return s + '</svg>';
  }
  // Silhouette dessinée (affichée tant que le bateau 3D charge, et en secours sans WebGL)
  // + emplacement du bateau 3D (js/bateau3d.js) au même endroit, un peu plus grand
  const boatAt = (pos, scale, opts, extra = '') =>
    `<div class="boat" style="${pos};transform:scale(${scale});transform-origin:${pos.includes('bottom') ? '0 100%' : '0 0'}${extra}">${boat(opts)}</div>${slot3d(pos, scale, opts)}`;
  function slot3d(pos, scale, opts) {
    const m = opts.mode || 'home';
    let style;
    if (m === 'home') style = 'left:0;top:74px;width:366px;height:396px';
    else if (m === 'zone') {
      // Toute la largeur du panneau, entre la carte (230 px max) et les boutons du bas : de la place pour zoomer
      const bas = Math.min(140, parseFloat((pos.match(/bottom:\s*([\d.]+)/) || [, 140])[1]));
      style = `left:0;right:0;top:300px;bottom:${bas}px`;
    } else {
      const w0 = 320 * scale, h0 = 300 * scale, W = Math.max(w0, 200), H = Math.max(h0, 190);
      const left = parseFloat((pos.match(/left:\s*([\d.]+)/) || [, 0])[1]) + w0 / 2 - W / 2;
      const v = pos.match(/(top|bottom):\s*([\d.]+)/);
      style = `left:${left.toFixed(0)}px;${v[1]}:${v[2]}px;width:${W.toFixed(0)}px;height:${H.toFixed(0)}px`;
    }
    const pcts = m === 'progres' ? JSON.stringify(Object.fromEntries(ZONES.map(z => [z.id, +pct(z).toFixed(2)]))) : '';
    const pulseC = opts.pulse && PIECES[opts.pulse] ? Z[PIECES[opts.pulse].zone].couleur : '';
    return `<div class="slot3d" data-mode="${m}"${opts.cible ? ` data-cible="${opts.cible}"` : ''}${opts.zone ? ` data-zone="${opts.zone}"` : ''}${pulseC ? ` data-pulse="${pulseC}"` : ''}${pcts ? ` data-pcts='${pcts}'` : ''} style="${style}"></div>`;
  }

  /* ───────────── Illustrations des leçons (zone Conduite) ───────────── */
  const ILLUS = {
    // Conduite & navigation : illustrations PNG (dessin technique, générées par _illus/build.js)
    vent: { h: 344, svg: () => `<img src="img/conduite/vent.png" alt="Les allures autour du vent : zone morte, près, travers, largue, vent arrière">` },
    reperes: { h: 330, svg: () => `<img src="img/conduite/reperes.png" alt="Bâbord à gauche, tribord à droite ; au vent et sous le vent">` },
    horizon: { h: 316, svg: () => `<img src="img/conduite/horizon.png" alt="Tour d'horizon à 360° : bateaux, bouées, risées, côte et ciel">` },
  };

  /* ───────────── Briques d'écran ───────────── */
  function dots(active) {
    return `<nav class="dots" aria-label="Zones du bateau">${ZONES.map(z => {
      const on = active === z.id, dim = active && !on;
      return `<a class="dot${dim ? ' dim' : ''}" href="#/zone/${z.id}" aria-label="${esc(z.nom)}"${on ? ' aria-current="page"' : ''} style="background:${z.couleur};${on ? `box-shadow:0 0 0 3px #FFFFFF,0 0 0 6px ${z.couleur}` : ''}"></a>`;
    }).join('')}</nav>`;
  }
  const homeBtn = (style = 'left:68px') => `<a class="rbtn" href="#/" aria-label="Accueil" style="${style}">${I.home()}</a>`;
  const backBtn = (fallback, kind = 'back') =>
    `<button class="rbtn" data-back="${fallback}" aria-label="${kind === 'close' ? 'Fermer' : 'Retour'}">${kind === 'close' ? I.close() : I.back()}</button>${homeBtn()}`;
  const searchBar = () =>
    `<div class="results" id="results" role="listbox"></div><label class="search">${I.search()}<input type="search" id="q" placeholder="Drisse, winch, gilet…" aria-label="Rechercher" autocomplete="off"></label>`;
  const cta = (label, href, cls, color) =>
    `<a class="cta ${cls}" href="${href}"${color ? ` style="color:${color}"` : ''}>${esc(label)} ${I.arrow(color || (cls.includes('dark') ? '#FFFFFF' : INK))}</a>`;
  /* Bouton principal sur panneau de zone : blanc sur zone sombre, marine sur zone claire */
  const zoneCta = (z, label, href, pos = 'b84') => z.sombre ? cta(label, href, `light ${pos}`, z.texte) : cta(label, href, `dark ${pos}`);
  // --pc = couleur du panneau : l'onglet de titre, fixé en haut quand la fiche défile, en reprend le fond
  const screen = (active, panelStyle, inner, extra = '') =>
    `${dots(active)}${extra}<main class="panel" style="${panelStyle};--pc:${(panelStyle.match(/background:([^;]+)/) || [, 'transparent'])[1]}">${inner}</main>`;

  function ficheBody(p, color, extra = '') {
    let h = `<p>${esc(p.def)}</p><p class="sub">À quoi ça sert ?</p><p>${esc(p.sert)}</p>`;
    h += `<p class="sub">${esc(p.commentTitre || `Quand le skipper dit ${p.skipper}`)}</p>`;
    const tag = p.comment.length > 1 ? 'ol' : 'ul';
    h += `<${tag}>${p.comment.map(c => `<li>${esc(c.t)}${c.sous ? `<ul>${c.sous.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</${tag}>`;
    return `<div class="card" style="color:${color}">${h}${extra}</div>`;
  }
  /* Vidéo intégrée dans la fiche : elle se charge et démarre (son coupé) quand on la fait défiler à l'écran */
  const videoInline = (key, color) => {
    const v = VIDEOS[key];
    if (!v) return '';
    return `<div class="vinline" data-vid="${v[0]}" style="color:${color}">
      <p class="sub">En vidéo</p>
      <div class="vframe"><button class="vposter" data-vplay aria-label="Lire le tuto : ${esc(v[1])}" style="background-image:url(https://i.ytimg.com/vi/${v[0]}/hqdefault.jpg)"><span>${I.play('#FFFFFF')}</span></button></div>
      <small>${esc(v[1])} · ${esc(v[2])} · ${v[3]}</small></div>`;
  };

  const tuto = (key, color) => {
    const v = VIDEOS[key];
    return v ? `<button class="tuto" data-video="${key}" style="color:${color};border-color:${color}">${I.play(color)}<span><b>Tuto vidéo</b> · ${esc(v[2])} · ${v[3]}</span></button>` : '';
  };
  // Lecteur YouTube par-dessus l'écran (sans cookies, sous-titres FR)
  function openVideo(key) {
    const v = VIDEOS[key], panel = $stage.querySelector('.panel');
    if (!v || !panel) return;
    closeVideo();
    panel.insertAdjacentHTML('beforeend', `<div class="vmodal" role="dialog" aria-label="Tuto vidéo"><div class="vbox">
      <div class="vhead"><span><b>${esc(v[1])}</b><small>${esc(v[2])} · ${v[3]}</small></span><button class="vclose" data-vclose aria-label="Fermer la vidéo">${I.close(INK)}</button></div>
      <div class="vframe"><iframe src="https://www.youtube-nocookie.com/embed/${v[0]}?autoplay=1&rel=0&hl=fr&cc_lang_pref=fr&playsinline=1" title="${esc(v[1])}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
      <a class="vext" href="https://www.youtube.com/watch?v=${v[0]}" target="_blank" rel="noopener">Ouvrir sur YouTube</a></div></div>`);
  }
  const closeVideo = () => { const m = $stage.querySelector('.vmodal'); if (m) m.remove(); };

  /* ───────────── Écrans ───────────── */
  let toast = null;       // pièce badgée affichée en bandeau sur l'accueil
  let quizSel = null;     // réponse choisie à la mise en situation
  let valides = [];       // gestes validés juste avant d'arriver sur Progrès

  const V = {};

  V.home = () => {
    const r = resumeAction(), a = r && ACTIONS[r];
    const resume = a
      ? `<a class="resume" href="${S.enCours[r] != null ? (a.type === 'lecon' ? `#/carte/${r}/${S.enCours[r]}` : `#/action/${r}/${S.enCours[r]}`) : startHref(r)}"><span class="pin" style="background:${Z[a.zone].couleur}"></span><span class="txt"><small>${S.enCours[r] != null ? 'Reprendre' : 'À suivre'} · ${remaining(r)} min</small><b>${esc(a.titre)}</b></span>${I.arrow(INK)}</a>`
      : `<a class="resume" href="#/progres"><span class="pin" style="background:${INK}"></span><span class="txt"><small>Parcours terminé</small><b>Prêt à naviguer !</b></span>${I.arrow(INK)}</a>`;
    const t = toast && PIECES[toast];
    const bandeau = t ? `<div class="toast" role="status" aria-live="polite" style="background:${Z[t.zone].couleur}"><span class="ic">${I.nfc(Z[t.zone].couleur)}</span><span class="txt"><small>Élément badgé</small><b>${esc(t.titre)}</b></span><a href="#/badge/${toast}" style="color:${Z[t.zone].couleur}">Ouvrir</a></div>` : '';
    return screen(null, 'background:var(--neutral)', `
      <div class="brand"><div><a class="brand-voyage" href="#/invitation">${esc(VOYAGE.titre)} ›</a><strong>Bienvenue à bord</strong></div>
        <div style="display:flex;gap:8px"><a class="icon-btn" href="#/parcours" aria-label="Parcours">${I.dossier()}</a><a class="icon-btn" href="#/equipage" aria-label="S’organiser sur le bateau">${I.equipage()}</a></div></div>
      ${boatAt('left:10px;top:130px', 1.08, { mode: 'home', pulse: toast })}
      <span class="hint" style="top:470px">${I.redo()} Touche une couleur ou une pièce</span>
      ${resume}${searchBar()}`, t ? '<div class="veil"></div>' : '') + bandeau;
  };

  V.zone = id => {
    const z = Z[id];
    if (!z) return V.home();
    const modAfaire = z.module && !z.module.quiz.every(a => S.faits[a]);
    const nxt = z.actions.find(a => !S.faits[a]);
    let label, href;
    if (modAfaire) { label = z.module.label; href = `#/carte/${z.id}/0`; }
    else {
      const a = ACTIONS[nxt || z.actions[0]];
      label = nxt ? 'Commencer les fiches' : 'Revoir les fiches';
      href = startHref(nxt || z.actions[0]);
    }
    const chips = z.pieces.map(p => `<a class="chip" href="#/fiche/${p}">${esc(PIECES[p].nom)}</a>`).join('');
    const acts = z.actions.map(a => {
      const A = ACTIONS[a];
      return `<li${S.faits[a] ? ' class="fait"' : ''}><a href="${startHref(a)}">${esc(A.liste || A.titre)}</a>${S.faits[a] ? ` <span class="coche" style="background:${z.texte}">${I.check('#FFFFFF', 10, 3.5)}</span>` : ''}</li>`;
    }).join('');
    return screen(id, `background:${z.couleur}`, `
      ${backBtn('#/')}
      ${boatAt('left:118px;bottom:152px', 0.42, { mode: 'zone', zone: id, cible: 'z:' + id })}
      <div class="col" style="--reserve:150px">${tabTitle(z.court, z.texte)}
        <div class="card" style="color:${z.texte}"><p>${esc(z.intro)}</p><p style="margin:10px 0 6px">Les pièces</p><div class="chips">${chips}</div><p style="margin:12px 0 2px">Ce que tu vas faire · ${z.actions.filter(a => S.faits[a]).length}/${z.actions.length} validés</p><ol>${acts}</ol></div></div>
      ${zoneCta(z, label, href)}${searchBar()}`);
  };

  V.fiche = (pid, aid) => {
    const p = PIECES[pid];
    if (!p) return V.home();
    const z = Z[p.zone], a = aid && ACTIONS[aid] ? aid : p.action;
    return screen(z.id, `background:${z.couleur}`, `
      ${backBtn('#/zone/' + z.id)}
      ${boatAt('left:103px;bottom:138px', 0.5, { mode: 'zone', zone: z.id, cible: 'p:' + pid }, ';opacity:.95')}
      <div class="col" style="--reserve:150px">${tabTitle(p.titre, z.texte)}${ficheBody(p, z.texte, videoInline(a, z.texte))}</div>
      ${zoneCta(z, "Passer à l'action", ACTIONS[a].type === 'lecon' ? `#/carte/${a}/0` : `#/action/${a}/0`)}${searchBar()}`);
  };

  V.badge = pid => {
    const p = PIECES[pid];
    if (!p) return V.home();
    const z = Z[p.zone], t = new Date(S.badges[pid] || Date.now());
    const hh = String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
    toast = null;
    return screen(z.id, `background:${z.couleur}`, `
      ${backBtn('#/')}
      <div class="col" style="--reserve:150px">${tabTitle(p.titre, z.texte)}${ficheBody(p, z.texte, videoInline(p.action, z.texte))}
        <div class="badged" style="color:${z.texte}"><span class="ic" style="background:${z.couleur}">${I.nfc('#FFFFFF', 20)}</span><span class="txt"><b>Badgé à bord · ${hh}</b><span>${nbBadges()} éléments sur ${nbPieces} découverts</span></span>${I.check(z.texte, 22, 2.5)}</div></div>
      ${zoneCta(z, 'Essayer le geste', ACTIONS[p.action].type === 'lecon' ? `#/carte/${p.action}/0` : `#/action/${p.action}/0`)}${searchBar()}`);
  };

  V.action = (aid, step) => {
    const a = ACTIONS[aid];
    if (!a) return V.home();
    if (a.type === 'lecon') return V.carte(aid, 0);
    const z = Z[a.zone], n = a.etapes.length, s = Math.min(Math.max(+step || 0, 0), n - 1);
    S.enCours[aid] = s; S.dernier = aid; save();
    const bars = a.etapes.map((_, i) => `<span style="${i <= s ? `background:${z.texte}` : ''}"></span>`).join('');
    const list = a.etapes.map((e, i) => `<li class="${i < s ? 'done' : i === s ? 'now' : 'next'}">${esc(e.t)}</li>`).join('');
    const last = s === n - 1;
    return screen(z.id, `background:${z.couleur}`, `
      ${backBtn('#/fiche/' + a.pieces[0] + '/' + aid, 'close')}
      ${boatAt('left:71px;bottom:76px', 0.7, { mode: 'zone', zone: z.id, fleche: a.fleche, cible: 'a:' + aid })}
      <div class="col" style="--reserve:84px">${tabTitle(a.court, z.texte)}
        <div class="card steps" style="color:${z.texte}"><div class="bars">${bars}</div><p>Étape ${s + 1} sur ${n}</p><ol>${list}</ol><p class="after">${esc(a.etapes[s].tip)}</p>${tuto(aid, z.texte)}</div></div>
      ${s > 0 ? `<a class="cta light half b20" href="#/action/${aid}/${s - 1}">Retour</a>` : `<button class="cta light half b20" data-back="#/fiche/${a.pieces[0]}/${aid}">Retour</button>`}
      <a class="cta dark rest b20" href="${last ? `#/quiz/${aid}` : `#/action/${aid}/${s + 1}`}">${last ? 'Mise en situation' : 'Étape suivante'} ${I.arrow('#FFFFFF')}</a>`);
  };

  /* Cartes illustrées : ctx = id de zone (module d'entrée) ou id d'action de type leçon */
  V.carte = (ctxId, i) => {
    const isModule = !!(Z[ctxId] && Z[ctxId].module);
    const list = isModule ? Z[ctxId].module.cartes : (ACTIONS[ctxId] && ACTIONS[ctxId].cartes);
    if (!list) return V.home();
    const z = isModule ? Z[ctxId] : Z[ACTIONS[ctxId].zone];
    const k = Math.min(Math.max(+i || 0, 0), list.length - 1), c = CARTES[list[k]], last = k === list.length - 1;
    if (!isModule) { S.dernier = ctxId; S.enCours[ctxId] = k; save(); }
    const bars = list.map((_, j) => `<span style="${j <= k ? `background:${z.texte}` : ''}"></span>`).join('');
    const body = c.textes.map((t, j) => `<p${j ? ' style="margin:6px 0 0"' : ''}>${esc(t)}</p>`).join('') +
      (c.liste ? `<ul style="margin:2px 0 0;padding-left:18px">${c.liste.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
    const il = ILLUS[c.illus];
    let next, label;
    if (!last) { next = `#/carte/${ctxId}/${k + 1}`; label = c.suivant; }
    else if (isModule) {
      const reste = Z[ctxId].module.quiz.filter(x => !S.faits[x]);
      const suite = reste.length ? reste : Z[ctxId].module.quiz;
      next = `#/quiz/${suite[0]}/${suite.slice(1).join(',')}`; label = 'Mise en situation';
    }
    else { next = `#/quiz/${ctxId}`; label = 'Mise en situation'; }
    return screen(z.id, `background:${z.couleur}`, `
      ${backBtn(k > 0 ? `#/carte/${ctxId}/${k - 1}` : `#/zone/${z.id}`)}
      <div class="col" style="--reserve:84px;z-index:2" id="carteCol">${tabTitle(c.titre, z.texte)}<div class="card" style="color:${z.texte}"><div class="bars" style="margin-bottom:8px">${bars}</div>${body}${tuto('carte:' + list[k], z.texte)}</div></div>
      <div class="illus" id="illus" data-h="${il.h}" style="bottom:86px;height:${il.h}px">${il.svg()}</div>
      ${cta(label, next, 'dark b20')}`);
  };

  V.quiz = (aid, suite) => {
    const a = ACTIONS[aid];
    if (!a) return V.home();
    const z = Z[a.zone], q = a.quiz;
    // Ordre des réponses varié d'une action à l'autre (stable), la bonne réponse n'est pas toujours en tête
    const rot = aid === 'prendre-ris' ? 0 : [...aid].reduce((h, c) => h + c.charCodeAt(0), 0) % q.options.length;
    const order = q.options.map((_, i) => (i + rot) % q.options.length);
    const answered = quizSel != null, good = answered && quizSel === q.bonne;
    const btns = order.map(i => {
      let cls = 'ans', mark = '';
      if (answered && i === quizSel) { cls += good ? ' ok' : ' ko'; mark = good ? I.check(INK, 16, 2.5) : ic('<path d="M7 7l10 10M17 7L7 17"/>', '#FFFFFF', 14, 3); }
      else if (answered) cls += ' fade';
      return `<button type="button" role="radio" aria-checked="${i === quizSel}" class="${cls}" data-ans="${i}"><span class="o">${mark}</span>${esc(q.options[i])}</button>`;
    }).join('');
    const fb = !answered ? '' : good
      ? `<div class="feedback"><strong>Exact.</strong> ${esc(q.explication)}</div>`
      : `<div class="feedback"><strong>Pas tout à fait.</strong> La réponse est dans la fiche <a href="#/fiche/${a.pieces[0]}/${aid}" style="text-decoration:underline">${esc(PIECES[a.pieces[0]].titre)}</a>. Relis-la ou réessaie.</div>`;
    const btn = !answered ? `<span class="cta dark b20 off">Continuer ${I.arrow('#FFFFFF')}</span>`
      : good ? `<a class="cta dark b20" href="#/valider/${aid}/${suite || ''}">${suite ? 'Question suivante' : 'Continuer'} ${I.arrow('#FFFFFF')}</a>`
      : `<button class="cta dark b20" data-retry>Réessayer</button>`;
    return screen(z.id, `background:${z.couleur}`, `
      ${backBtn(a.type === 'lecon' ? `#/carte/${aid}/0` : `#/action/${aid}/${a.etapes.length - 1}`, 'close')}
      <div class="qflow"><div>${tabTitle('Situation', z.texte)}<div class="card" style="color:${z.texte}"><p>${esc(q.contexte)}</p><p style="font-size:20px;font-weight:500;line-height:1.4">${esc(q.parole)}</p><p>${esc(q.question)}</p></div></div>
      <div class="answers" role="radiogroup" aria-label="Réponses">${btns}</div>${fb}</div>${btn}`);
  };

  V.parcours = openId => {
    const cur = openId || (resumeAction() ? ACTIONS[resumeAction()].zone : 'J');
    const order = [...ZONES.filter(z => z.id !== cur), Z[cur]];
    const html = order.map((z, i) => {
      const open = z.id === cur, done = z.actions.filter(a => S.faits[a]).length, n = z.actions.length;
      const fg = z.sombre ? '#FFFFFF' : INK, trackBg = z.sombre ? 'rgba(255,255,255,0.35)' : 'rgba(16,35,58,0.18)';
      const w = Math.round(textW(z.nom, '500 12px Poppins') + 40), left = 26 + 25 * i;
      const h = open ? 88 + n * 34 + 30 : 240;
      const todo = open ? `<span class="todo">${z.actions.map(a => {
        const A = ACTIONS[a], ok = S.faits[a], encours = S.enCours[a] != null && !ok;
        return `<a href="${A.type === 'lecon' ? `#/carte/${a}/0` : `#/fiche/${A.pieces[0]}/${a}`}"><i style="${ok ? `background:${fg}` : `border:1.5px solid ${fg}`}">${ok ? I.check(z.sombre ? z.couleur : '#FFFFFF') : ''}</i><em>${esc(A.titre)}</em>${encours ? '<small>en cours</small>' : ''}</a>`;
      }).join('')}</span>` : '';
      // Dossier fermé : un toucher l'ouvre. Dossier ouvert : l'onglet mène à la zone, chaque ligne à son geste.
      return `<div class="folder" data-z="${z.id}" ${open ? '' : `data-go="#/parcours/${z.id}" role="button"`} aria-label="${esc(z.nom)}, ${done} gestes validés sur ${n}" style="top:${i * 88}px;height:${h}px;color:${fg}">
        <svg width="334" height="${h}" viewBox="0 0 334 ${h}" aria-hidden="true"><path d="${folderPath(left, w, h)}" fill="${z.couleur}"/></svg>
        ${open ? `<a class="ftab" href="#/zone/${z.id}"` : '<span class="ftab"'} style="left:${left}px;width:${w}px">${esc(z.nom)}${open ? '</a>' : '</span>'}
        <span class="fbody"><span class="frow"><span>${esc(z.resume)}</span><span>${done}/${n}</span></span>
        <span class="track" style="background:${trackBg}"><span style="width:${Math.floor(done / n * 100)}%;background:${fg}"></span></span>${todo}</span></div>`;
    }).join('');
    const lastH = 88 + Z[cur].actions.length * 34 + 30;
    return screen(null, 'background:var(--neutral)', `
      <div class="head"><a class="icon-btn" href="#/" aria-label="Retour">${I.back()}</a><h1>5 zones à connaître</h1></div>${homeBtn('left:auto;right:20px;top:20px')}
      <div class="stack"><div style="position:relative;height:${4 * 88 + lastH + 16}px">${html}</div></div>`);
  };

  V.progres = () => {
    const t = total();
    const titre = t === 0 ? "C'est parti" : t < 0.5 ? 'En route' : t < 1 ? 'Presque prêt' : 'Prêt à naviguer';
    const meters = ZONES.map(z => `<a class="meter" href="#/zone/${z.id}"><i style="background:${z.couleur}"></i><span><span class="l"><b>${esc(z.nom)}</b><em>${pctLabel(z)}</em></span><span class="t"><span style="width:${Math.floor(pct(z) * 100)}%;background:${z.couleur}"></span></span></span></a>`).join('');
    // Juste après une mise en situation réussie : on annonce le(s) geste(s) validé(s) et on propose la suite
    const juste = valides.filter(a => ACTIONS[a]), r = resumeAction();
    const annonce = juste.length === 1 ? `Geste validé : ${esc(ACTIONS[juste[0]].titre)}`
      : `${juste.length} gestes validés : ${juste.map(a => esc(ACTIONS[a].court)).join(', ')}`;
    const suite = !juste.length ? '' : r
      ? `<a class="cta dark b20" href="${startHref(r)}">Geste suivant · ${esc(ACTIONS[r].court)} ${I.arrow('#FFFFFF')}</a>`
      : `<a class="cta dark b20" href="#/">Parcours terminé ${I.arrow('#FFFFFF')}</a>`;
    const [bTop, bScale, capTop, mTop] = juste.length ? [58, 0.75, 290, 318] : [70, 0.9, 350, 384];
    return screen(null, 'background:var(--neutral)', `
      <div class="head"><a class="icon-btn" href="#/" aria-label="Retour">${I.back()}</a><h1>${titre}</h1></div>${homeBtn('left:auto;right:20px;top:20px')}
      ${boatAt(`left:${juste.length ? 60 : 40}px;top:${bTop}px`, bScale, { mode: 'progres' })}
      ${juste.length ? `<span class="caption valide" style="top:${capTop}px">${I.check(INK, 14, 3)} ${annonce}</span>`
        : `<span class="caption" style="top:${capTop}px">Chaque zone se colore à mesure que tu la maîtrises</span>`}
      <div class="meters" style="top:${mTop}px">${meters}</div>
      ${suite || `<div class="foot"><span>${nbBadges()}/${nbPieces} badges NFC</span><span style="display:flex;gap:14px"><button data-simnfc>Simuler un badge</button><button data-reset>Réinitialiser</button></span></div>`}`);
  };

  /* ───────────── Organisation à bord ─────────────
     Un poste par zone ; chaque équipier va là où il a débloqué le plus de leçons (gestes validés).
     Le skipper supervise et prend le poste qui reste. */
  const TOUS = ZONES.flatMap(z => z.actions);
  const faitsDe = m => m.id === 'moi' ? S.faits : m.faits === 'tout' ? Object.fromEntries(TOUS.map(a => [a, true])) : Object.fromEntries((m.faits || []).map(a => [a, true]));
  const partZone = (f, z) => z.actions.filter(a => f[a]).length / z.actions.length;
  const partTout = f => TOUS.filter(a => f[a]).length / TOUS.length;
  const niveauDe = (m, p) => m.skipper ? 'Skipper' : NIVEAUX.filter(([s]) => p >= s).pop()[1];
  function organiser() {
    const gens = EQUIPAGE.map(m => { const f = faitsDe(m), p = partTout(f); return { ...m, nom: m.id === 'moi' ? monNom() : m.nom, f, p, niveau: niveauDe(m, p) }; });
    const paires = [];
    gens.filter(g => !g.skipper).forEach(g => ZONES.forEach(z => paires.push([partZone(g.f, z), g, z])));
    paires.sort((a, b) => b[0] - a[0]);
    const poste = {}, pris = new Set();
    for (const [, g, z] of paires) if (!poste[z.id] && !pris.has(g.id)) { poste[z.id] = g; pris.add(g.id); }
    const chef = gens.find(g => g.skipper);
    ZONES.forEach(z => { if (!poste[z.id]) poste[z.id] = chef; });
    gens.forEach(g => { g.zone = (ZONES.find(z => poste[z.id] === g) || {}).id; });
    return { gens, poste };
  }
  const avatar = (g, t = 34) => {
    const z = g.zone && Z[g.zone];
    return `<span class="av" style="width:${t}px;height:${t}px;font-size:${Math.round(t * 0.42)}px;background:${z ? z.couleur : INK};color:${z && !z.sombre ? INK : '#FFFFFF'}">${esc(g.nom[0])}</span>`;
  };
  /* Tableau des tâches (kanban) : une colonne « À prendre » puis une colonne par équipier.
     On glisse une carte d'une colonne à l'autre ; « Répartir » place les postes selon les leçons débloquées.
     Répartition gardée dans ce navigateur. */
  const KANBAN = 'oceanis301:taches';
  const PRENOM = 'oceanis301:prenom';
  const lire = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } };
  const monNom = () => lire(PRENOM, '') || 'Toi';
  const FINIES = 'oceanis301:taches-finies';
  const finies = () => lire(FINIES, {});
  function repartir() {
    const { poste } = organiser(), r = {};
    TACHES.forEach(t => { r[t.id] = t.zone ? poste[t.zone].id : null; });
    return r;
  }
  const taches = () => { const r = lire(KANBAN, null); return r && TACHES.every(t => t.id in r) ? r : repartir(); };
  V.equipage = () => {
    const { gens } = organiser(), r = taches(), f = finies();
    const dossiers = [{ id: '', nom: 'À prendre', sous: 'Tâches libres', couleur: '#FFFFFF', fg: INK }, ...gens.map(g => {
      const z = g.zone && Z[g.zone];
      return { id: g.id, nom: g.nom, sous: g.niveau + (z ? ' · ' + POSTES[z.id].nom : ''), couleur: '#FFFFFF', fg: INK, g };
    }), { id: 'fini', fini: true, nom: 'Fini', sous: 'Tâches terminées', couleur: '#D9D6CF', fg: INK }];
    let haut = 0;
    const html = dossiers.map((d, i) => {
      const liste = d.fini ? TACHES.filter(t => f[t.id]) : TACHES.filter(t => !f[t.id] && (r[t.id] || '') === d.id);
      const h = 108 + Math.max(1, liste.length) * 58, w = Math.round(textW(d.nom, '500 12px Poppins') + 40), left = 26 + 25 * (i % 6);
      const cartes = liste.map(t => {
        const z = t.zone && Z[t.zone], qui = gens.find(g => g.id === r[t.id]);
        const n = d.fini ? (qui ? 'par ' + qui.nom : '') : z && d.g ? `${z.actions.filter(a => d.g.f[a]).length}/${z.actions.length} leçons` : t.note || '';
        return `<div class="kb-t${d.fini ? ' fini' : ''}${z ? ' zone' : ''}" data-t="${t.id}"${z ? ` style="background:${z.couleur};--bg:${z.couleur};color:${z.sombre ? '#FFFFFF' : INK}"` : ''}><span><b>${esc(t.titre)}</b>${n ? `<small>${esc(n)}</small>` : ''}</span>
          <button class="kb-ok" data-finir="${t.id}" aria-label="${d.fini ? 'Remettre à faire' : 'Marquer comme finie'}">${d.fini ? I.check('#FFFFFF', 11, 3.5) : ''}</button></div>`;
      }).join('') || `<span class="kb-vide">${d.fini ? 'Coche une tâche pour la finir' : 'Glisse une tâche ici'}</span>`;
      const top = haut; haut += h - 34;
      return `<div class="folder kb-col" data-col="${d.id}" style="top:${top}px;height:${h}px;color:${d.fg}">
        <svg width="334" height="${h}" viewBox="0 0 334 ${h}" aria-hidden="true"><path d="${folderPath(left, w, h)}" fill="${d.couleur}" stroke="#DCD8D0" stroke-width="1"/></svg>
        <span class="ftab" style="left:${left}px;width:${w}px">${esc(d.nom)}</span>
        <span class="fbody"><span class="frow"><span>${esc(d.sous)}</span><span>${liste.length}</span></span><span class="kb-cartes">${cartes}</span></span></div>`;
    }).join('');
    return screen(null, 'background:var(--neutral)', `
      <div class="head"><a class="icon-btn" href="#/" aria-label="Retour">${I.back()}</a><h1>S’organiser sur le bateau</h1></div>
      ${ongletsAvant('equipage')}
      <button class="kb-auto" data-repartir>Répartir selon les leçons</button>
      <div class="stack kb" id="kanban"><div style="position:relative;height:${haut + 34 + 16}px">${html}</div></div>`);
  };
  // Grande catégorie « S’organiser sur le bateau » (dans l'app, après l'invitation) : les tâches (kanban) et le sac à préparer
  const ongletsAvant = actif => `<nav class="avant-onglets" aria-label="S’organiser sur le bateau">${[['equipage', 'Les tâches'], ['sac', 'Mon sac']].map(([r, n]) =>
    `<a href="#/${r}"${r === actif ? ' class="on" aria-current="page"' : ''}>${n}</a>`).join('')}</nav>`;

  /* Mon sac : ce qu'on emporte (images et fiches Decathlon) ; ce qui manque s'achète ou se loue */
  const SACK = 'oceanis301:sac';
  const imgDeca = (id, t = 400) => { const x = SAC.find(o => o.id === id); return x.src || `${DECATHLON.images}${x.img}/picture.jpg?format=auto&f=${t}x${t}`; };
  /* Détourage : les photos Decathlon ont un fond clair uni. On le rend transparent en partant des bords
     (remplissage par diffusion, tolérance sur l'écart à la couleur du fond, bord adouci). Résultat gardé en mémoire. */
  const decoupes = new Map();
  const imgD = (u, alt = '') => `<img src="${decoupes.get(u) || u}" data-detour="${u}"${decoupes.has(u) ? ' class="detoure"' : ''} alt="${alt}" crossorigin="anonymous">`;
  function detourer(u) {
    if (decoupes.has(u) || detourer[u]) return;
    detourer[u] = 1;
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement('canvas');
      c.width = W; c.height = H;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, W, H), px = d.data;
      // Fond = zone claire et peu colorée reliée aux bords ; on avance de proche en proche tant que la teinte varie
      // doucement (suit les dégradés et les fonds en deux tons), puis on adoucit d'un pixel le bord de la silhouette.
      const clair = i => { const r = px[i * 4], v = px[i * 4 + 1], b = px[i * 4 + 2]; return (r + v + b) / 3 > 168 && Math.max(r, v, b) - Math.min(r, v, b) < 34; };
      const pas = (i, j) => Math.abs(px[i * 4] - px[j * 4]) + Math.abs(px[i * 4 + 1] - px[j * 4 + 1]) + Math.abs(px[i * 4 + 2] - px[j * 4 + 2]);
      const fond = new Uint8Array(W * H), pile = [];
      const bord = [];
      for (let x = 0; x < W; x++) bord.push(x, (H - 1) * W + x);
      for (let y = 1; y < H - 1; y++) bord.push(y * W, y * W + W - 1);
      bord.forEach(i => { if (clair(i)) { fond[i] = 1; pile.push(i); } });
      const voisins = i => { const x = i % W, y = (i / W) | 0; return [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]; };
      while (pile.length) {
        const i = pile.pop();
        for (const j of voisins(i)) if (j >= 0 && !fond[j] && clair(j) && pas(i, j) < 18) { fond[j] = 1; pile.push(j); }
      }
      for (let i = 0; i < W * H; i++) {
        if (fond[i]) { px[i * 4 + 3] = 0; continue; }
        if (voisins(i).some(j => j >= 0 && fond[j]) && clair(i)) px[i * 4 + 3] = 150;   // lisière adoucie
      }
      g.putImageData(d, 0, 0);
      const url = c.toDataURL('image/png');
      decoupes.set(u, url);
      $stage.querySelectorAll('img[data-detour]').forEach(x => { if (x.dataset.detour === u) { x.src = url; x.classList.add('detoure'); } });
    };
    im.onerror = () => { $stage.querySelectorAll('img[data-detour]').forEach(x => { if (x.dataset.detour === u) x.classList.add('detoure'); }); };
    im.src = u;
  }
  // Jauge : un sac qui grossit à mesure qu'on coche, du jaune sombre au jaune clair (celui des validations)
  const JAUNE_SOMBRE = '#8F7B22';
  const jaugeSac = n => {
    const p = n / SAC.length, c = mix(JAUNE_SOMBRE, Z.J.couleur, p);
    return `<div class="sac-jauge"><span class="sac-sac" style="--t:${(0.55 + 0.45 * p).toFixed(3)}"><svg viewBox="0 0 64 76" aria-hidden="true">
        <path d="M25 13v-3a7 7 0 0 1 14 0v3" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
        <path d="M10 26C3 34 3 56 10 66M54 26c7 8 7 30 0 40" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity=".7"/>
        <rect x="8" y="12" width="48" height="60" rx="16" fill="${c}"/>
        <path d="M8 30c8 7 40 7 48 0" fill="none" stroke="#FFFFFF" stroke-opacity=".45" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="17" y="42" width="30" height="24" rx="8" fill="#FFFFFF" fill-opacity=".38"/></svg>
        <b data-n="${n}">${n}</b></span><span class="sac-jt"><b>${n} / ${SAC.length}</b> dans le sac<small>Touche un produit quand tu l'as</small></span></div>`;
  };
  // Après avoir coché : le sac grossit (rebond) et le chiffre monte ou descend
  function animerJauge(avant) {
    const sacEl = $stage.querySelector('.sac-sac'), num = sacEl && sacEl.querySelector('b');
    if (!sacEl) return;
    const apres = +num.dataset.n;
    const t = +sacEl.style.getPropertyValue('--t') || 1;
    sacEl.animate([{ transform: `scale(${t * 1.2})` }, { transform: `scale(${t})` }], { duration: 420, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    const t0 = performance.now();
    const tick = t => { const k = Math.min(1, (t - t0) / 350); num.textContent = Math.round(avant + (apres - avant) * k); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  V.sac = () => {
    const ok = lire(SACK, {}), n = SAC.filter(x => ok[x.id]).length;
    const vie = VIE_A_BORD.map(v => `<li>${imgD(imgDeca(v.img, 160))}<span><b>${esc(v.titre)}</b>${esc(v.texte)}</span></li>`).join('');
    const objets = SAC.map(x => `<div class="sac-o${ok[x.id] ? ' ok' : ''}">
        <button class="sac-img" ${x.page ? `data-go="#/produit/${x.id}"` : `data-sac="${x.id}"`} aria-pressed="${!!ok[x.id]}" aria-label="${esc(x.nom)} : ${ok[x.id] ? 'je l’ai' : 'je ne l’ai pas'}"><span class="sac-rond"></span>${imgD(imgDeca(x.id))}</button>
        <b>${esc(x.nom)}</b><small>${esc(x.note)}</small>
        ${ok[x.id] ? `<span class="sac-a">${I.check(INK, 12, 3)} Dans le sac</span>` : `<span class="sac-liens"><a href="${x.page ? `#/produit/${x.id}` : DECATHLON.site + x.lien}"${x.page ? '' : ' target="_blank" rel="noopener"'}>${x.page ? 'Voir' : 'Acheter'}</a>${x.louer ? `<a href="${DECATHLON.location}" target="_blank" rel="noopener">Louer</a>` : ''}</span>`}
      </div>`).join('');
    return screen(null, `background:var(--neutral);--rond:${Z.J.couleur}`, `
      <div class="head"><a class="icon-btn" href="#/" aria-label="Retour">${I.back()}</a><h1>S’organiser sur le bateau</h1></div>
      ${ongletsAvant('sac')}
      <div class="sac">
        ${jaugeSac(n)}
        <section><h2>Vie à bord</h2><ul class="sac-vie">${vie}</ul></section>
        <section><h2>À emporter</h2><div class="sac-grille">${objets}</div></section>
        <p class="sac-source">Équipements et images : Decathlon. Ce qui te manque s'achète en ligne, ou se loue pour le week-end.</p>
      </div>`);
  };

  /* Page produit, dans l'esprit d'une fiche Decathlon : visuel sur fond gris clair, marque, grand titre, description,
     contenu, quantité, prix (indicatif : concept du projet), « Ajouter à mon sac » */
  let quantite = 1;
  V.produit = id => {
    const x = SAC.find(o => o.id === id && o.page);
    if (!x) return V.sac();
    const ok = lire(SACK, {})[id];
    return `<main class="panel produit" style="top:12px;background:#FFFFFF">
      <div class="pd">
        <div class="pd-visuel"><img src="${esc(x.src)}" alt="${esc(x.nom)}"></div>
        <p class="pd-marque">${esc(x.marque)}</p>
        <h1>${esc(x.nom)}</h1>
        <p class="pd-desc">${esc(x.description)}</p>
        <p class="pd-sous">Les 5 F de la navigation</p>
        <ol class="pd-5f">${x.cinqF.map((c, i) => { const z = ZONES[i]; return `<li><span class="pd-f" style="background:${z.couleur};color:${z.sombre ? '#FFFFFF' : INK}">F</span>
          <span><b>${esc(c.f)}</b><em>${esc(c.texte)}</em><span class="pd-objets">${c.objets.map(o => `<i>${esc(o)}</i>`).join('')}</span></span></li>`; }).join('')}</ol>
        <p class="pd-sous">Taille <span>Sans taille</span></p>
        <div class="pd-qte"><button data-qte="-1" aria-label="Moins">−</button><span>${quantite}</span><button data-qte="1" aria-label="Plus">+</button></div>
        <p class="pd-prix"><b>${esc(x.prix)}</b><small>Prix indicatif · concept Beneteau × Decathlon</small></p>
        <a class="pd-deca" href="${DECATHLON.site}${x.lien}" target="_blank" rel="noopener">Voir les trousses sur decathlon.fr ›</a>
      </div>
      ${backBtn('#/sac')}
      <button class="cta dark pd-ajout" data-sac="${id}" data-retour="#/sac">${ok ? 'Dans ton sac · retirer' : 'Ajouter à mon sac'}</button>
    </main>`;
  };

  // Fiche d'une tâche : explication, à qui elle est confiée, « Marquer comme finie »
  V.tache = id => {
    const t = TACHES.find(x => x.id === id);
    if (!t) return V.equipage();
    const { gens } = organiser(), qui = gens.find(g => g.id === taches()[id]), fait = !!finies()[id], z = t.zone && Z[t.zone];
    const texte = z ? `${POSTES[z.id].role}. ${z.intro}` : t.texte;
    const lien = z ? `<a class="tache-lien" href="#/zone/${z.id}" style="color:${z.texte}">Les gestes du poste · ${z.actions.filter(a => qui && qui.f[a]).length}/${z.actions.length} ›</a>` : '';
    return screen(z ? z.id : null, `background:${z ? z.couleur : 'var(--neutral)'}`, `
      ${backBtn('#/equipage')}
      <div class="col" style="--reserve:150px">${tabTitle(t.titre, z ? z.texte : INK)}
        <div class="card" style="color:${z ? z.texte : INK}"><p>${esc(texte)}</p>
          <p class="sub">${fait ? 'Terminée' : 'Confiée à'}</p><p>${qui ? esc(qui.nom) + (qui.id === 'moi' ? ' (toi)' : '') : 'Personne pour l’instant : glisse-la vers un équipier.'}</p>${lien}</div></div>
      <button class="cta ${z && z.sombre ? 'light' : 'dark'} b84" data-finir="${id}" data-retour="1"${z && z.sombre ? ` style="color:${z.texte}"` : ''}>${fait ? 'Remettre à faire' : 'Marquer comme finie'}</button>`);
  };
  // Glisser-déposer (souris et doigt) entre colonnes
  let glisse = null, glisseFin = 0;
  $stage.addEventListener('pointerdown', e => {
    const t = e.target.closest('.kb-t');
    if (!t || e.button > 0 || t.classList.contains('fini') || e.target.closest('.kb-ok')) return;
    const r = t.getBoundingClientRect(), k = $stage.getBoundingClientRect().width / $stage.offsetWidth;
    glisse = { t, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, k, parti: false };
    t.setPointerCapture(e.pointerId);
  });
  $stage.addEventListener('pointermove', e => {
    if (!glisse) return;
    const g = glisse;
    if (!g.parti && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 6) return;
    if (!g.parti) {
      g.parti = true;
      g.fantome = g.t.cloneNode(true); g.fantome.classList.add('kb-fantome');
      g.fantome.style.width = g.t.offsetWidth + 'px';
      $stage.appendChild(g.fantome); g.t.classList.add('kb-parti');
    }
    const st = $stage.getBoundingClientRect();
    g.fantome.style.left = (e.clientX - st.left - g.dx) / g.k + 'px';
    g.fantome.style.top = (e.clientY - st.top - g.dy) / g.k + 'px';
    $stage.querySelectorAll('.kb-col').forEach(c => c.classList.remove('kb-vise'));
    g.fantome.style.display = 'none';
    const sous = document.elementFromPoint(e.clientX, e.clientY);
    g.fantome.style.display = '';
    const c = sous && sous.closest('.kb-col:not([data-col="fini"])');
    if (c) c.classList.add('kb-vise');
    g.cible = c;
    // bord du tableau : défilement automatique
    const kb = $stage.querySelector('#kanban'), kr = kb.getBoundingClientRect();
    if (e.clientY > kr.bottom - 40) kb.scrollTop += 8; else if (e.clientY < kr.top + 40) kb.scrollTop -= 8;
  });
  const lacher = () => {
    if (!glisse) return;
    const g = glisse; glisse = null;
    if (!g.parti) return;
    glisseFin = performance.now();
    g.fantome.remove(); g.t.classList.remove('kb-parti');
    if (g.cible) {
      const r = taches(), kb = $stage.querySelector('#kanban'), sl = kb.scrollTop;
      r[g.t.dataset.t] = g.cible.dataset.col || null;
      ecrire(KANBAN, r);
      route();
      const nkb = $stage.querySelector('#kanban'); if (nkb) nkb.scrollTop = sl;
    }
  };
  $stage.addEventListener('pointerup', lacher);
  $stage.addEventListener('pointercancel', lacher);

  /* ───────────── Avant tout : le skipper invite ses amis dans le groupe WhatsApp ─────────────
     Il partage un lien ; l'ami qui l'ouvre arrive sur « Rejoindre » : il entre son prénom, puis découvre le voyage. */
  const lienInvitation = () => lienPartage('#/rejoindre');
  const messageWhatsApp = () => `⛵ ${VOYAGE.titre} · ${VOYAGE.dates}\n${VOYAGE.sous}.\nDe passager à équipier : prépare-toi en 2 min par geste, ton poste à bord t'attend.\nRejoins l'équipage : ${lienInvitation()}`;
  V.inviter = () => {
    const places = EQUIPAGE.length;
    return `<main class="panel invite ivt" style="top:12px;background:var(--neutral)">
      <div class="iv">
        <header class="iv-tete"><small>Skipper · ${esc(VOYAGE.de)}</small><h1>Invite ton équipage</h1><p>${esc(VOYAGE.titre)} · ${esc(VOYAGE.dates)}</p></header>
        <div class="ivt-places">${Array.from({ length: places }, (_, i) => `<span class="${i === 0 ? 'on' : ''}">${i === 0 ? esc(VOYAGE.de[0]) : '+'}</span>`).join('')}<em>${places} places à bord</em></div>
        <a class="ivt-wa" href="https://wa.me/?text=${encodeURIComponent(messageWhatsApp())}" target="_blank" rel="noopener">${I.whatsapp()} Partager dans le groupe WhatsApp</a>
        <button class="ivt-copier" data-copier>Copier le lien</button>
        <a class="ivt-voir" href="#/rejoindre">Voir ce que reçoit un ami ›</a>
      </div>
    </main>`;
  };
  V.rejoindre = () => `<main class="panel invite ivt" style="top:12px;background:var(--ink);color:#fff">
      <div class="rj">
        <small>${esc(VOYAGE.de)} t'invite à bord</small>
        <h1>${esc(VOYAGE.titre)}</h1>
        <p>${esc(VOYAGE.dates)} · ${esc(VOYAGE.duree)}</p>
        <form class="rj-form" data-rejoindre>
          <label for="rj-nom">Ton prénom</label>
          <input id="rj-nom" name="nom" autocomplete="given-name" maxlength="24" placeholder="Camille" value="${esc(lire(PRENOM, ''))}" required>
          <button type="submit">Rejoindre l'équipage ${I.arrow(INK)}</button>
        </form>
        <p class="rj-note">Ton prénom s'affiche pour l'équipage, dans l'organisation à bord.</p>
      </div>
    </main>`;

  /* ───────────── Déblocage au badge NFC ─────────────
     Ondes NFC, le cadenas s'ouvre, la pièce apparaît ; puis on retrouve l'accueil avec le bandeau. */
  let deblocage = null;
  function jouerDeblocage(pid) {
    deblocage = null;
    const p = PIECES[pid];
    if (!p || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const z = Z[p.zone], enc = z.sombre ? '#FFFFFF' : INK;
    const el = document.createElement('div');
    el.className = 'deblocage';
    el.style.background = z.couleur;
    el.style.color = enc;
    el.innerHTML = `<div class="db-centre"><span class="db-onde" style="border-color:${enc}"></span><span class="db-onde" style="border-color:${enc}"></span><span class="db-onde" style="border-color:${enc}"></span>
      <span class="db-rond"><svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="${z.couleur}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path class="db-anse" d="M16 22v-6a8 8 0 0 1 16 0v6"/><rect x="11" y="22" width="26" height="19" rx="4.5"/><path class="db-trou" d="M24 29v5"/><path class="db-coche" d="M17 31.5l5 5 9-10" stroke-dasharray="22" stroke-dashoffset="22"/></svg></span></div>
      <div class="db-txt"><small>Débloqué au badge NFC</small><b>${esc(p.titre)}</b><span>${nbBadges()} / ${nbPieces} éléments découverts</span></div>`;
    const panneau = $stage.querySelector('.panel') || $stage, bandeau = $stage.querySelector('.toast');
    panneau.appendChild(el);
    if (bandeau) bandeau.animate([{ opacity: 0, transform: 'translateY(-20px)' }, { opacity: 0, offset: 0.8 }, { opacity: 1, transform: 'none' }], { duration: 3100, easing: 'ease-out', fill: 'backwards' });
    const $ = s => el.querySelector(s);
    el.animate([{ clipPath: 'circle(0% at 50% 45%)' }, { clipPath: 'circle(75% at 50% 45%)' }], { duration: 480, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'both' });
    el.querySelectorAll('.db-onde').forEach((o, i) => o.animate([{ transform: 'scale(.6)', opacity: 0.8 }, { transform: 'scale(2.4)', opacity: 0 }],
      { duration: 1100, delay: 250 + i * 260, easing: 'ease-out', fill: 'both' }));
    $('.db-rond').animate([{ transform: 'scale(0)' }, { transform: 'scale(1.12)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 480, delay: 260, easing: 'ease-out', fill: 'both' });
    $('.db-anse').animate([{ transform: 'none' }, { transform: 'translateY(-5px) rotate(-28deg)' }], { duration: 380, delay: 1000, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'both' });
    $('.db-trou').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, delay: 1300, fill: 'both' });
    $('.db-coche').animate([{ strokeDashoffset: 22 }, { strokeDashoffset: 0 }], { duration: 320, delay: 1350, easing: 'ease-out', fill: 'both' });
    $('.db-rond').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 380, delay: 1350, easing: 'ease-out' });
    $('.db-txt').animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 1150, easing: 'ease-out', fill: 'both' });
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 2500, fill: 'forwards' }).finished.then(() => el.remove());
  }

  /* ───────────── Invitation au voyage (avant l'accueil) ─────────────
     Ce que le skipper envoie à ses amis : itinéraire sur une carte au trait inclinée en 3D (le tracé se dessine,
     le bateau le parcourt), le temps prévu, le bateau, la promesse « de passager à équipier ». */
  const CARTE = { lon0: -3.33, lat0: 47.63, k: 870, w: 334, h: 334, R: 4 };   // R : la carte est rendue R fois plus grande, pour rester nette en gros plan
  const proj = ([lon, lat]) => [(lon - CARTE.lon0) * CARTE.k * Math.cos(47.45 * Math.PI / 180), (CARTE.lat0 - lat) * CARTE.k];
  const lisse = pts => {                       // Catmull-Rom → Bézier : la courbe passe par chaque point
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1.map(v => v.toFixed(1))} ${c2.map(v => v.toFixed(1))} ${p2.map(v => v.toFixed(1))}`;
    }
    return d;
  };
  function carteSvg() {
    const { w, h } = CARTE;
    const cotes = COTES.map(c => `<path d="M${c.map(p => proj(p).map(v => v.toFixed(1)).join(' ')).join(' L')} Z" fill="url(#iv-h)" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`).join('');
    const grille = [0.25, 0.5, 0.75].map(t => `<path d="M${w * t} 0V${h}M0 ${h * t}H${w}" stroke="${INK}" stroke-width=".5" stroke-dasharray="2 5" opacity=".35"/>`).join('');
    const d = lisse(VOYAGE.route.map(proj));
    return `<svg class="iv-svg" viewBox="0 0 ${w} ${h}" width="${w * CARTE.R}" height="${h * CARTE.R}" aria-hidden="true"><defs><pattern id="iv-h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#F4F2ED"/><line x1="0" y1="0" x2="0" y2="5" stroke="${INK}" stroke-width=".6" opacity=".28"/></pattern></defs>
      <rect width="${w}" height="${h}" fill="#FFFFFF"/>${grille}${cotes}
      <path d="${d}" stroke="${INK}" stroke-width="1" stroke-dasharray="1 4" stroke-linecap="round" fill="none" opacity=".45"/>
      <path class="iv-route" d="${d}" stroke="${Z.O.couleur}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <g class="iv-bateau"><path d="M0 -7 L4.5 5 L0 3 L-4.5 5 Z" fill="${INK}" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round"/></g>
      <text x="${w - 10}" y="${h - 10}" text-anchor="end" font-size="9" font-weight="600" fill="${INK}" opacity=".6">Baie de Quiberon</text>
      <g transform="translate(24 ${h - 28})" fill="none" stroke="${INK}" stroke-width="1.2"><circle r="11"/><path d="M0 -8 L3 2 L0 0 L-3 2 Z" fill="${INK}"/></g><text x="24" y="${h - 43}" text-anchor="middle" font-size="9" font-weight="700" fill="${INK}">N</text></svg>`;
  }
  const METEO_IC = { soleil: I.soleil, voile: I.voile };
  // Voilier de profil (proue à gauche) : debout sur la carte au début du plan de caméra
  // Le bateau 3D (modèle fourni) s'y affiche dès qu'il est chargé ; le dessin reste en secours
  const PROFIL = `<span class="iv-profil"><div class="slot3d" data-mode="voyage" style="left:0;top:0;width:100%;height:100%"></div><svg viewBox="0 0 48 52" width="192" height="208" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M23 3 V38"/><path d="M23.5 5 L23.5 35 L39 35 Z" fill="#FFFFFF"/><path d="M22 7 L7 37 L21.5 37 Z" fill="#FFFFFF"/><path d="M23 35.5 H40"/>
    <path d="M4 39 H44 L41 44 Q24 48 8 44 Z" fill="#FFFFFF"/><path d="M1 48 q4 -2 8 0 t8 0 t8 0 t8 0 t8 0 t7 0" stroke-width="1"/></svg></span>`;
  V.invitation = () => {
    const vu = [];
    const pins = VOYAGE.etapes.map((e, i) => {
      const cle = e.lon + ',' + e.lat;
      if (vu.includes(cle)) return '';
      vu.push(cle);
      const [x, y] = proj([e.lon, e.lat]);
      return `<span class="iv-pin" data-x="${x.toFixed(1)}" data-y="${y.toFixed(1)}" style="left:${(x * CARTE.R).toFixed(1)}px;top:${(y * CARTE.R).toFixed(1)}px"><span class="iv-pin-in"><b>${esc(e.nom.split(/[,·]/)[0].trim())}</b><i></i></span></span>`;
    }).join('');
    const photos = VOYAGE.photos.map(ph => `<figure><img src="${esc(ph.src)}" alt="${esc(ph.legende)}" loading="lazy"${ph.pos ? ` style="object-position:${esc(ph.pos)}"` : ''}><figcaption>${esc(ph.legende)}</figcaption></figure>`).join('');
    const trajet = VOYAGE.etapes.map(e => `<li><b>${esc(e.quand)}</b><span>${esc(e.nom)}</span></li>`).join('');
    const temps = VOYAGE.meteo.map(m => `<li><b>${esc(m.jour)}</b>${(METEO_IC[m.ciel] || I.soleil)(INK)}<span>${m.temp}° · ${esc(m.vent)} ${esc(m.noeuds)} nds</span></li>`).join('');
    return `<main class="panel invite" style="top:12px;background:#FFFFFF">
      <div class="iv">
        <header class="iv-tete"><small>${esc(VOYAGE.de)} t'invite</small><h1>${esc(VOYAGE.titre)}</h1><p>${esc(VOYAGE.dates)} · ${esc(VOYAGE.duree)}</p></header>
        <div class="carte3d"><div class="plan" style="width:${CARTE.w * CARTE.R}px;height:${CARTE.h * CARTE.R}px">${carteSvg()}${pins}${PROFIL}</div><button class="iv-rejouer" data-rejouer aria-label="Rejouer le trajet">${I.redo()}</button></div>
        <ul class="iv-liste">${trajet}</ul>
        <div class="iv-photos">${photos}</div>
        <ul class="iv-liste iv-temps">${temps}</ul>
        <p class="iv-promesse">De passager à équipier : ${TOUS.length} gestes à apprendre avant de partir, 2 minutes chacun.</p>
      </div>
      <a class="cta dark iv-go" href="#/" data-embarquer>Je monte à bord ${I.arrow('#FFFFFF')}</a>
    </main>`;
  };
  /* Plan de caméra : ouverture serrée sur le bateau, de profil, qui navigue ; la caméra le suit pendant que le trajet
     se révèle derrière lui, puis recule et se redresse jusqu'à la vue de dessus de tout l'itinéraire.
     La carte est un plan CSS 3D : la caméra = rotation/zoom du plan autour du point suivi, ramené au centre du cadre. */
  let carteAnim = 0;
  function jouerCarte() {
    const cadre = $stage.querySelector('.carte3d'), plan = cadre && cadre.querySelector('.plan');
    const route = plan && plan.querySelector('.iv-route'), fleche = plan.querySelector('.iv-bateau'), profil = plan.querySelector('.iv-profil');
    if (!route) return;
    const L = route.getTotalLength(), pins = [...plan.querySelectorAll('.iv-pin')];
    const pas = 300, pts = Array.from({ length: pas + 1 }, (_, i) => route.getPointAtLength(L * i / pas));
    const frac = pins.map(p => {
      const x = +p.dataset.x, y = +p.dataset.y;
      let best = 0, d0 = 1e9;
      pts.forEach((q, i) => { const d = (q.x - x) ** 2 + (q.y - y) ** 2; if (d < d0 - 1) { d0 = d; best = i; } });
      return best / pas;
    });
    // cadrage final : tout le trajet, vu de dessus
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    const fin = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
    const W = cadre.clientWidth, H = cadre.clientHeight;
    const sFin = Math.min((W - 40) / (Math.max(...xs) - Math.min(...xs) + 60), (H - 30) / (Math.max(...ys) - Math.min(...ys) + 70));
    route.style.strokeDasharray = L;
    // ouverture de profil : la carte est d'abord tournée pour que le bateau traverse l'image de gauche à droite
    const q0 = route.getPointAtLength(0), q1 = route.getPointAtLength(Math.min(L, 6));
    const rotZ0 = -Math.atan2(q1.y - q0.y, q1.x - q0.x) * 180 / Math.PI;
    const lisser = t => t * t * (3 - 2 * t), entre = (a, b, t) => a + (b - a) * t;
    const poser = (e, c) => {
      // e : avancée du bateau (0 → 1) ; c : avancée de la caméra (0 = serrée de profil, 1 = vue de dessus)
      const a = route.getPointAtLength(L * e), b = route.getPointAtLength(Math.min(L, L * e + 2));
      const cap = Math.atan2(b.y - a.y, b.x - a.x);
      const k = lisser(Math.min(1, c * 1.15));
      const R = CARTE.R, tilt = entre(74, 0, lisser(c)), rotZ = entre(rotZ0, 0, k), s = entre(5.2, sFin, lisser(Math.min(1, c * 1.05))) / R;
      const fx = entre(a.x, fin.x, lisser(c)) * R, fy = entre(a.y, fin.y, lisser(c)) * R;
      plan.style.transformOrigin = `${fx}px ${fy}px`;
      plan.style.transform = `translate(${(W / 2 - fx).toFixed(1)}px, ${(H * entre(0.62, 0.5, k) - fy).toFixed(1)}px) rotateX(${tilt.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      plan.style.setProperty('--a', tilt.toFixed(2) + 'deg');
      plan.style.setProperty('--z', rotZ.toFixed(2) + 'deg');
      plan.style.setProperty('--k', (1 / s).toFixed(3));
      route.style.strokeDashoffset = L * (1 - e);
      profil.style.left = a.x * R + 'px'; profil.style.top = a.y * R + 'px';
      const O = window.OCEANIS3D;
      if (O && O.pret) {
        // Vrai bateau 3D : rendu sous le même angle que la caméra de la carte (hauteur = inclinaison, cap = sens de marche),
        // sur un calque toujours face à l'écran. Il passe du profil (caméra basse) à la vue de dessus (caméra verticale).
        const phi = (90 - tilt) * Math.PI / 180, capEcran = cap + rotZ * Math.PI / 180, D3 = 1.9, bas = tilt / 74;
        O.vue({ vise: [0, -0.33 + 0.3 * bas, 0], yaw: -capEcran, dist: Math.max(0.02, D3 * Math.cos(phi)), elev: D3 * Math.sin(phi) });
        profil.style.transform = `rotateZ(${(-rotZ).toFixed(2)}deg) rotateX(${(-tilt).toFixed(2)}deg) translateY(${((1 - bas) * 46).toFixed(1)}%)`;
        profil.style.opacity = 1;
        fleche.style.opacity = 0;
      } else {
        // secours (pas de 3D) : voilier dessiné de profil, puis flèche vue de dessus
        const versDroite = Math.cos(cap + rotZ * Math.PI / 180) >= 0;
        profil.style.transform = `rotateZ(${(-rotZ).toFixed(2)}deg) rotateX(${(-tilt).toFixed(2)}deg) scaleX(${versDroite ? -1 : 1})`;
        const vue = Math.min(1, Math.max(0, (tilt - 18) / 22));
        profil.style.opacity = vue.toFixed(2);
        fleche.style.opacity = (1 - vue).toFixed(2);
      }
      fleche.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${(cap * 180 / Math.PI + 90).toFixed(1)}) scale(${(1.4 / (s * R)).toFixed(3)})`);
      pins.forEach((p, i) => p.classList.toggle('leve', e >= frac[i] - 0.005));
    };
    const id = ++carteAnim, bouton = $stage.querySelector('.iv-go');
    const montrerBouton = () => bouton && bouton.classList.remove('attend');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { poser(1, 1); montrerBouton(); return; }
    if (bouton) bouton.classList.add('attend');
    // le bateau 3D d'abord : on attend qu'il soit chargé (12 s au plus, sinon le dessin de secours prend le relais)
    const O = window.OCEANIS3D, debut = performance.now();
    if (O && !O.pret && !O.erreur && performance.now() - debut < 12000) {
      poser(0, 0);
      cadre.classList.add('charge');
      const attendre = () => {
        if (id !== carteAnim || !route.isConnected) return;
        if (O.pret || O.erreur || performance.now() - debut > 12000) { cadre.classList.remove('charge'); if (!O.pret) document.body.classList.add('sans3d'); lancer(); }
        else requestAnimationFrame(attendre);
      };
      return requestAnimationFrame(attendre);
    }
    lancer();
    function lancer() {
    const t0 = performance.now(), D = 14000;
    const tick = now => {
      if (id !== carteAnim || !route.isConnected) return;
      const t = Math.min(1, (now - t0) / D);
      // le bateau avance régulièrement ; la caméra reste serrée au début puis s'éloigne sur la seconde moitié
      const e = t < 0.08 ? 0 : Math.min(1, (t - 0.08) / 0.84);
      const eDoux = e < 0.5 ? 2 * e * e : 1 - (-2 * e + 2) ** 2 / 2;
      const c = Math.max(0, Math.min(1, (t - 0.42) / 0.58));
      poser(eDoux, c);
      if (t < 1) requestAnimationFrame(tick); else montrerBouton();   // fin du plan : on monte à bord
    };
    poser(0, 0);
    requestAnimationFrame(tick);
    }
  }

  /* ───────────── Dossiers du Parcours : animations ─────────────
     Arrivée : les 5 dossiers partent d'une pile serrée en haut et se déploient en éventail jusqu'à leur place.
     Changement de dossier : celui qu'on touche est tiré de la pile (arc + légère inclinaison) et vient se poser
     devant ; les autres glissent pour combler, avec un petit rebond. Positions interpolées depuis la place réelle (FLIP). */
  let dernierEcran = null;
  const bouge = () => document.body.classList.contains('anim') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  function placesDossiers() {
    const m = {};
    $stage.querySelectorAll('.folder[data-z]').forEach(f => { m[f.dataset.z] = f.offsetTop; });
    return Object.keys(m).length ? m : null;
  }
  function animerDossiers(avant) {
    if (!bouge()) return;
    const L = 0.5;                                   // lenteur : 0,5 = bref, 1 = normal, 1,4 = posé
    const dossiers = [...$stage.querySelectorAll('.folder[data-z]')];
    const ouvert = dossiers[dossiers.length - 1];
    if (!avant) {
      // Éventail : chaque dossier part de la pile (en haut) et descend à sa place, l'un après l'autre
      dossiers.forEach((f, i) => f.animate([
        { transform: `translateY(${-f.offsetTop + i * 6}px) scale(${0.94 + i * 0.012})`, opacity: 0 },
        { opacity: 1, offset: 0.35 },
        { transform: 'translateY(4px)', offset: 0.78 },
        { transform: 'none', opacity: 1 },
      ], { duration: 640 * L, delay: (60 + i * 75) * L, easing: 'cubic-bezier(.22,.8,.3,1)', fill: 'backwards' }));
      ouvert.querySelectorAll('.todo a').forEach((a, i) => a.animate(
        [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 320 * L, delay: (520 + i * 55) * L, easing: 'ease-out', fill: 'backwards' }));
      return;
    }
    dossiers.forEach(f => {
      const dy = (avant[f.dataset.z] ?? f.offsetTop) - f.offsetTop;
      if (f === ouvert && dy) {
        // Le dossier choisi : tiré vers la droite, incliné, puis reposé devant la pile
        f.animate([
          { transform: `translateY(${dy}px)` },
          { transform: `translate(26px, ${dy - 18}px) rotate(2.5deg) scale(1.03)`, offset: 0.28 },
          { transform: `translate(18px, ${dy * 0.35}px) rotate(1.2deg) scale(1.02)`, offset: 0.62 },
          { transform: 'translateY(-6px)', offset: 0.86 },
          { transform: 'none' },
        ], { duration: 720 * L, easing: 'cubic-bezier(.3,.7,.3,1)' });
        f.querySelectorAll('.todo a').forEach((a, i) => a.animate(
          [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
          { duration: 300 * L, delay: (480 + i * 60) * L, easing: 'ease-out', fill: 'backwards' }));
      } else if (dy) {
        // Les autres comblent la place, avec un léger rebond
        f.animate([{ transform: `translateY(${dy}px)` }, { transform: `translateY(${dy > 0 ? -4 : 4}px)`, offset: 0.8 }, { transform: 'none' }],
          { duration: 520 * L, delay: 90 * L, easing: 'cubic-bezier(.25,.8,.3,1)', fill: 'backwards' });
      }
    });
    // Le Parcours défile juste assez pour que le dossier ouvert tienne en entier à l'écran
    const stack = $stage.querySelector('.stack');
    if (stack) setTimeout(() => {
      const bas = ouvert.offsetTop + ouvert.offsetHeight - stack.clientHeight + 12;
      stack.scrollTo({ top: Math.max(0, bas), behavior: 'smooth' });
    }, 380 * L);
  }

  /* ───────────── Routeur ───────────── */
  const hist = [];
  function route() {
    const h = location.hash || '#/';
    const [, name = '', a, b] = h.split('/');
    const retour = hist[hist.length - 2] === h;
    if (retour) hist.pop(); else if (hist[hist.length - 1] !== h) hist.push(h);
    if (name !== 'quiz') quizSel = null;
    if (!['progres', 'quiz', 'valider'].includes(name)) valides = [];

    // Routes d'effet (pas d'écran propre)
    if (name === 'valider') {
      finish(a);
      if (window.OCEANIS && window.OCEANIS.onValide) setTimeout(() => window.OCEANIS.onValide(a), 350);
      if (!valides.includes(a)) valides.push(a);
      const reste = (b || '').split(',').filter(x => ACTIONS[x]);
      return go(reste.length ? `#/quiz/${reste[0]}/${reste.slice(1).join(',')}` : '#/progres', true);
    }
    if (name === 'nfc') {
      if (PIECES[a]) { S.badges[a] = Date.now(); save(); toast = a; deblocage = a; }
      return go('#/', true);
    }
    if (name === 'invitation' && !lire(PRENOM, '')) return go('#/inviter', true);   // d'abord : invitation WhatsApp puis prénom
    if (name !== '' && name !== 'badge') toast = null;

    let html;
    switch (name) {
      case 'zone': html = V.zone(a); break;
      case 'fiche': html = V.fiche(a, b); break;
      case 'badge': html = V.badge(a); break;
      case 'action': html = V.action(a, b); break;
      case 'carte': html = V.carte(a, b); break;
      case 'quiz': html = V.quiz(a, b); break;
      case 'parcours': html = V.parcours(a); break;
      case 'progres': html = V.progres(); break;
      case 'equipage': html = V.equipage(); break;
      case 'invitation': html = V.invitation(); break;
      case 'inviter': html = V.inviter(); break;
      case 'tache': html = V.tache(a); break;
      case 'sac': html = V.sac(); break;
      case 'produit': html = V.produit(a); break;
      case 'rejoindre': html = V.rejoindre(); break;
      default: html = V.home();
    }
    // Parcours → Parcours (on ouvre un autre dossier) : on garde la place de chaque dossier pour l'animer
    const memeEcran = name === 'parcours' && dernierEcran === 'parcours';
    const avant = memeEcran ? placesDossiers() : null;
    dernierEcran = name;
    const paint = () => {
      $stage.innerHTML = html;
      fitCarte();
      watchInline();
      scrollHints();
      if (name === 'parcours') animerDossiers(avant);
      $stage.querySelectorAll('img[data-detour]:not(.detoure)').forEach(i => detourer(i.dataset.detour));
      if (name === 'invitation') jouerCarte();
      if (deblocage && name === '') jouerDeblocage(deblocage);
      if (window.OCEANIS3D) window.OCEANIS3D.attach();
    };
    // Le studio d'animation (js/studio.js) peut habiller le changement d'écran (View Transitions),
    // sauf entre deux états du Parcours : là, ce sont les dossiers eux-mêmes qui bougent
    if (!memeEcran && window.OCEANIS && window.OCEANIS.transition) window.OCEANIS.transition(paint, { retour, name }); else paint();
    document.title = 'Oceanis 30.1 — Microlearning';
  }
  function go(h, replace) {
    if (replace) { hist.pop(); history.replaceState(null, '', h); route(); }
    else location.hash = h;
  }
  function back(fallback) {
    if (hist.length > 1) history.back();
    else go(fallback || '#/', true);
  }
  let io = null;
  function mountInline(box) {
    if (box.querySelector('iframe')) return;
    const id = box.dataset.vid;
    box.querySelector('.vframe').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&hl=fr&cc_lang_pref=fr&enablejsapi=1&origin=${encodeURIComponent(location.origin)}" title="Tuto vidéo" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }
  const ytCmd = (box, func) => {
    const f = box.querySelector('iframe');
    if (f) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  };
  function watchInline() {
    if (io) io.disconnect();
    const box = $stage.querySelector('.vinline');
    if (!box || !('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.intersectionRatio >= 0.6) { mountInline(box); ytCmd(box, 'playVideo'); }
      else if (e.intersectionRatio < 0.25) ytCmd(box, 'pauseVideo');
    }), { root: box.closest('.card'), threshold: [0, 0.25, 0.6, 1] });
    io.observe(box.querySelector('.vframe'));
  }

  function scrollHints() {
    $stage.querySelectorAll('.col > .card').forEach(card => {
      const vid = card.querySelector('.vinline');
      const btn = document.createElement('button');
      btn.className = 'more';
      btn.style.color = getComputedStyle(card).color;
      btn.innerHTML = `${vid ? 'Vidéo' : 'Suite'} ${ic('<path d="M6 9l6 6 6-6"/>', 'currentColor', 12, 2)}`;
      btn.setAttribute('aria-label', vid ? 'Descendre à la vidéo' : 'Lire la suite');
      btn.onclick = () => (vid ? vid.scrollIntoView({ behavior: 'smooth', block: 'center' }) : card.scrollBy({ top: card.clientHeight * 0.8, behavior: 'smooth' }));
      card.parentNode.appendChild(btn);
      const upd = () => {
        const reste = card.scrollHeight - card.clientHeight - card.scrollTop;
        const cr = card.getBoundingClientRect(), col = card.parentNode.getBoundingClientRect();
        const vidVisible = vid && vid.getBoundingClientRect().top < cr.bottom - 60;
        btn.hidden = reste < 8 || vidVisible;
        // posé en bas à droite de la carte blanche, même si un encart suit la carte (fiche badgée)
        const k = cr.height / card.offsetHeight || 1;
        btn.style.bottom = Math.round((col.bottom - cr.bottom) / k + 10) + 'px';
      };
      card.addEventListener('scroll', upd, { passive: true });
      if ('ResizeObserver' in window) new ResizeObserver(upd).observe(card);
      upd();
    });
  }

  // Sur les cartes illustrées, l'illustration se loge sous le texte (hauteur disponible)
  function fitCarte() {
    const col = document.getElementById('carteCol'), il = document.getElementById('illus');
    if (!col || !il) return;
    const top = col.offsetTop + col.offsetHeight + 12, bottom = 86;
    const avail = il.parentNode.clientHeight - top - bottom;
    const want = +il.dataset.h;
    il.style.top = top + 'px';
    il.style.bottom = 'auto';
    il.style.height = Math.max(160, Math.min(want, avail)) + 'px';
  }

  /* ───────────── Recherche ───────────── */
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const INDEX = [
    ...ZONES.map(z => ({ l: z.nom, k: 'Zone', z: z.id, h: '#/zone/' + z.id, s: norm(z.nom + ' ' + z.court + ' ' + z.resume) })),
    ...Object.entries(PIECES).map(([id, p]) => ({ l: p.nom, k: 'Pièce', z: p.zone, h: '#/fiche/' + id, s: norm(p.nom + ' ' + p.titre + ' ' + p.def) })),
    ...Object.entries(ACTIONS).map(([id, a]) => ({ l: a.titre, k: 'Geste', z: a.zone, h: a.type === 'lecon' ? `#/carte/${id}/0` : `#/fiche/${a.pieces[0]}/${id}`, s: norm(a.titre) })),
  ];
  function search(q) {
    const n = norm(q.trim());
    if (!n) return [];
    const words = n.split(/\s+/);
    return INDEX.map(e => {
      const inTitle = words.every(w => norm(e.l).includes(w)), inText = words.every(w => e.s.includes(w));
      return { e, score: inTitle ? (norm(e.l).startsWith(words[0]) ? 3 : 2) + (e.k === 'Pièce' ? 0.5 : 0) : inText ? 1 : 0 };
    }).filter(x => x.score).sort((a, b) => b.score - a.score).slice(0, 7).map(x => x.e);
  }
  function renderResults(q) {
    const box = document.getElementById('results');
    if (!box) return;
    if (!q.trim()) { box.innerHTML = ''; return; }
    const r = search(q);
    box.innerHTML = r.length
      ? r.map((e, i) => `<a class="res${i === 0 ? ' sel' : ''}" role="option" href="${e.h}"><i style="background:${Z[e.z].couleur}"></i><b>${esc(e.l)}</b><small>${e.k}</small></a>`).join('')
      : `<div class="res none">Rien trouvé pour « ${esc(q)} »</div>`;
  }

  /* ───────────── NFC ─────────────
     Un badge contient une URL …#/nfc/<pièce> (ou le texte « oceanis:<pièce> »).
     Sans Web NFC (iPhone, bureau), le lien ouvre directement l'app sur le bon écran. */
  let nfcOn = false;
  async function startNfc() {
    if (nfcOn || !('NDEFReader' in window)) return;
    nfcOn = true;
    try {
      const r = new NDEFReader();
      await r.scan();
      r.onreading = ev => {
        for (const rec of ev.message.records) {
          const txt = new TextDecoder(rec.encoding || 'utf-8').decode(rec.data);
          const m = txt.match(/#\/nfc\/([\w-]+)/) || txt.match(/oceanis:([\w-]+)/);
          if (m && PIECES[m[1]]) { go('#/nfc/' + m[1]); break; }
        }
      };
    } catch (e) { nfcOn = false; }
  }
  function simulateBadge() {
    const ids = Object.keys(PIECES);
    const pid = !S.badges.winch ? 'winch' : ids.find(p => !S.badges[p]) || ids[Math.floor(Math.random() * ids.length)];
    go('#/nfc/' + pid);
  }

  /* ───────────── Événements (délégation) ───────────── */
  $stage.addEventListener('click', e => {
    startNfc();
    if (e.target.closest('[data-embarquer]')) { try { localStorage.setItem(INVITE_VUE, '1'); } catch (x) { /* stockage indisponible */ } }
    if (e.target.closest('[data-rejouer]')) return jouerCarte();
    if (e.target.closest('[data-repartir]')) { ecrire(KANBAN, repartir()); return route(); }
    const qte = e.target.closest('[data-qte]');
    if (qte) { quantite = Math.max(1, Math.min(9, quantite + +qte.dataset.qte)); qte.parentNode.querySelector('span').textContent = quantite; return; }
    const sac = e.target.closest('[data-sac]');
    if (sac) {
      const ok = lire(SACK, {}), id = sac.dataset.sac, sc = ($stage.querySelector('.sac') || {}).scrollTop || 0;
      const avant = SAC.filter(x => ok[x.id]).length;
      if (ok[id]) delete ok[id]; else ok[id] = true;
      ecrire(SACK, ok);
      if (sac.dataset.retour) return go(sac.dataset.retour);
      const t = window.OCEANIS.transition; window.OCEANIS.transition = p => p();   // sur place, sans fondu d'écran
      route(); window.OCEANIS.transition = t;
      const box = $stage.querySelector('.sac'); if (box) box.scrollTop = sc;
      animerJauge(avant);
      const rond = ok[id] && $stage.querySelector(`[data-sac="${id}"] .sac-rond`);
      if (rond) rond.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.08)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      return;
    }
    const fin = e.target.closest('[data-finir]');
    if (fin) {
      const f = finies(), id = fin.dataset.finir;
      if (f[id]) delete f[id]; else f[id] = Date.now();
      ecrire(FINIES, f);
      return fin.dataset.retour ? go('#/equipage') : route();
    }
    const carteT = e.target.closest('.kb-t');
    if (carteT && performance.now() - glisseFin > 250) return go('#/tache/' + carteT.dataset.t);
    const cop = e.target.closest('[data-copier]');
    if (cop) {
      const ok = () => { cop.textContent = 'Lien copié'; setTimeout(() => { cop.textContent = 'Copier le lien'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(lienInvitation()).then(ok, () => { cop.textContent = lienInvitation(); }); else cop.textContent = lienInvitation();
      return;
    }
    const t = e.target.closest('[data-go],[data-back],[data-ans],[data-retry],[data-reset],[data-simnfc],[data-video],[data-vplay],[data-vclose],.vmodal');
    if (!t) return;
    if (t.dataset.video) return openVideo(t.dataset.video);
    if (t.hasAttribute('data-vplay')) { const box = t.closest('.vinline'); mountInline(box); return; }
    if (t.hasAttribute('data-vclose') || t.classList.contains('vmodal') && e.target === t) return closeVideo();
    if (t.classList.contains('vmodal')) return;
    if (t.dataset.go) return go(t.dataset.go);
    if (t.dataset.back != null) return back(t.dataset.back);
    if (t.dataset.ans != null) { if (quizSel == null) { quizSel = +t.dataset.ans; route(); } return; }
    if (t.hasAttribute('data-retry')) { quizSel = null; return route(); }
    if (t.hasAttribute('data-simnfc')) return simulateBadge();
    if (t.hasAttribute('data-reset')) {
      if (confirm('Repartir de zéro ? (Annuler = recharger la démo)')) S = fresh(); else S = demo();
      save(); return route();
    }
  });
  $stage.addEventListener('submit', e => {
    if (!e.target.matches('[data-rejoindre]')) return;
    e.preventDefault();
    const nom = e.target.nom.value.trim().replace(/\s+/g, ' ');
    if (!nom) return;
    ecrire(PRENOM, nom);
    go('#/invitation');
  });
  $stage.addEventListener('input', e => { if (e.target.id === 'q') renderResults(e.target.value); });
  $stage.addEventListener('keydown', e => {
    if (e.target.id !== 'q') return;
    const box = document.getElementById('results'), items = [...box.querySelectorAll('a.res')];
    let i = items.findIndex(x => x.classList.contains('sel'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!items.length) return;
      items[i] && items[i].classList.remove('sel');
      i = (i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length; items[i].classList.add('sel');
    } else if (e.key === 'Enter' && items[i]) { e.preventDefault(); go(items[i].getAttribute('href')); }
    else if (e.key === 'Escape') { e.target.value = ''; renderResults(''); }
  });
  $stage.addEventListener('focusout', e => {
    if (e.target.id === 'q') setTimeout(() => { if (!$stage.contains(document.activeElement) || document.activeElement.id !== 'q') renderResults(''); }, 180);
  });
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'n' || e.key === 'N') simulateBadge();
    if (e.key === 'Escape') { if ($stage.querySelector('.vmodal')) closeVideo(); else back('#/'); }
  });

  window.OCEANIS = { lienPartage, V, get S() { return S; }, save, esc, I, ic, screen, homeBtn, go, route, Z };

  /* ───────────── Mise à l'échelle ───────────── */
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const phone = PARTAGE || vw <= 560 || matchMedia('(pointer:coarse)').matches && vw < vh;
    let s, h;
    if (PARTAGE && vw / vh > 0.8) { s = vh / 844; h = 844; }                  // partage sur écran à l'horizontale : toute la hauteur
    else if (phone) { s = vw / 390; h = Math.max(700, vh / s); }              // téléphone, tablette debout : toute la largeur
    else { s = Math.min(document.fullscreenElement ? 9 : 1, (vh - 48) / 844, (vw - 48) / 390); h = 844; }   // plein écran : agrandi à la hauteur
    document.body.classList.toggle('framed', !phone);
    document.documentElement.style.setProperty('--h', h + 'px');
    // Partage : si l'écran est trop court pour l'app à pleine largeur, la page défile au lieu de rapetisser
    const defile = PARTAGE && h * s > vh + 1;
    document.body.classList.toggle('defile', defile);
    document.body.style.height = defile ? h * s + 'px' : '';
    $stage.style.transform = defile ? `translateX(-50%) scale(${s})` : `translate(-50%,-50%) scale(${s})`;
    fitCarte();
  }
  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', route);

  /* Pastille du bateau touchée : la zone s'ouvre aussitôt, et sa couleur se répand dans le fond du panneau
     depuis le point touché, derrière le texte et les boutons (qui restent visibles) */
  $stage.addEventListener('click', e => {
    const pin = e.target.closest('a.pin3d');
    if (!pin || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const href = pin.getAttribute('href');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { location.hash = href; return; }
    const st = $stage.getBoundingClientRect(), k = st.width / $stage.offsetWidth;
    const r = pin.querySelector('i').getBoundingClientRect();
    const px = (r.left + r.width / 2 - st.left) / k, py = (r.top + r.height / 2 - st.top) / k, r0 = r.width / 2 / k;
    const avant = getComputedStyle($stage.querySelector('.panel')).backgroundColor;
    const t = window.OCEANIS.transition;                   // pas de fondu entre écrans : c'est la couleur qui fait la transition
    window.addEventListener('hashchange', () => { window.OCEANIS.transition = t; repandre(); }, { once: true });   // après le routage
    window.OCEANIS.transition = p => p();
    location.hash = href;
    function repandre() {
    const panel = $stage.querySelector('.panel');
    if (!panel) return;
    const couleur = getComputedStyle(panel).backgroundColor;
    const x = px - panel.offsetLeft, y = py - panel.offsetTop, W = panel.offsetWidth, H = panel.offsetHeight;
    const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y));
    const fond = document.createElement('div');
    fond.className = 'remplir';
    fond.style.background = couleur;
    const origine = panel.style.backgroundColor;
    panel.style.backgroundColor = avant;                   // le panneau garde l'ancien fond, la couleur s'y répand
    panel.prepend(fond);
    panel.classList.add('remplissage');
    const s3 = panel.querySelector('.slot3d');           // le bateau apparaît quand la couleur l'atteint
    if (s3) s3.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }], { duration: 1200, easing: 'ease-out' });
    fond.animate(
      [{ clipPath: `circle(${r0}px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }],
      { duration: 1100, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }
    ).finished.then(() => { panel.style.backgroundColor = origine; fond.remove(); panel.classList.remove('remplissage'); });
    }
  });

  // Premier lancement (sans lien précis) : le skipper invite son équipage → l'ami rejoint avec son prénom → le voyage → l'accueil
  const INVITE_VUE = 'oceanis301:invitation';
  try { if (!location.hash && !localStorage.getItem(INVITE_VUE)) history.replaceState(null, '', '#/inviter'); } catch (e) { /* stockage indisponible */ }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fit(); route(); });
  fit();
})();
