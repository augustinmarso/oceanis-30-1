/* Outil de capture d'écran, posé à côté du téléphone (hors de l'app).
   Capture l'écran courant en PNG net (×2 ou ×3), le télécharge ou le copie, et garde une galerie de la session.
   Raccourci : touche S. Visible seulement en affichage bureau (téléphone encadré). */
(() => {
  'use strict';
  const stage = document.getElementById('stage');
  let lib = null, scale = 2, busy = false;
  const shots = [];

  const tools = document.createElement('aside');
  tools.id = 'tools';
  tools.setAttribute('aria-label', "Outil de capture d'écran");
  tools.innerHTML = `
    <h2>Captures</h2>
    <p class="muted">L'écran du téléphone, en PNG.</p>
    <button class="t-main" data-t="shot">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>
      Capturer l'écran <kbd>S</kbd></button>
    <div class="t-duo"><button class="t-sec" data-t="copy" title="Copier l'image">Copier</button>
    <button class="t-sec t-plein" data-t="plein" title="Plein écran (touche F, Échap pour sortir)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>Plein écran</button></div>
    <div class="t-row" role="radiogroup" aria-label="Résolution">
      <span>Netteté</span>
      <button data-scale="1" role="radio">×1</button><button data-scale="2" role="radio" class="on">×2</button><button data-scale="3" role="radio">×3</button>
    </div>
    <p class="t-size"></p>
    <p class="t-msg" aria-live="polite"></p>
    <div class="t-gallery"></div>`;
  document.body.appendChild(tools);
  const msg = t => { tools.querySelector('.t-msg').textContent = t; };
  // Taille réelle de l'écran de l'app (390 px de large ; la hauteur suit l'écran en mode téléphone)
  const dims = () => ({ w: stage.offsetWidth, h: stage.offsetHeight });
  function showSize() {
    const { w, h } = dims();
    const note = w === 390 && h === 844 && scale === 3 ? ' · format iPhone 12 à 15' : '';
    tools.querySelector('.t-size').textContent = `Image : ${w * scale} × ${h * scale} px${note}`;
  }
  showSize();
  window.addEventListener('resize', showSize);

  async function render() {
    if (!lib) lib = await import('../vendor/modern-screenshot-4.7.0.mjs');
    await (document.fonts ? document.fonts.ready : null);
    // Capture la scène à sa taille réelle (390 × 844), sans la réduction d'affichage ni le cadre du bureau.
    // width/height explicites : sinon la bibliothèque lit la taille réduite à l'écran et rogne l'image.
    const { w, h } = dims();
    return lib.domToBlob(stage, {
      width: w,
      height: h,
      scale,
      type: 'image/png',
      backgroundColor: '#FFFFFF',
      style: { transform: 'none', left: '0', top: '0', borderRadius: '0', boxShadow: 'none' },
      filter: n => !(n.classList && n.classList.contains('vmodal')),
    });
  }
  const nameFor = () => {
    const h = (location.hash || '#/').replace(/^#\/?/, '').replace(/[^\w-]+/g, '-').replace(/-+$/, '') || 'accueil';
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `oceanis-${h}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
  };
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function addThumb(blob, name) {
    const url = URL.createObjectURL(blob);
    shots.unshift({ url, name, blob });
    const g = tools.querySelector('.t-gallery');
    const b = document.createElement('button');
    b.className = 't-thumb'; b.title = name + ' — cliquer pour retélécharger';
    b.innerHTML = `<img src="${url}" alt="">`;
    b.onclick = () => download(blob, name);
    g.prepend(b);
    while (g.children.length > 8) g.lastChild.remove();
  }
  async function act(kind) {
    if (busy) return;
    busy = true; tools.classList.add('busy'); msg('Capture…');
    try {
      const blob = await render(), name = nameFor();
      if (kind === 'copy') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        msg('Copiée dans le presse-papiers');
      } else {
        download(blob, name);
        const { w, h } = dims();
        msg(`Téléchargée (${w * scale} × ${h * scale} px) : ${name}`);
      }
      addThumb(blob, name);
      stage.classList.add('flash'); setTimeout(() => stage.classList.remove('flash'), 250);
    } catch (e) {
      msg(kind === 'copy' ? 'Copie refusée par le navigateur : utilise « Capturer ».' : 'Capture impossible : ' + e.message);
    } finally { busy = false; tools.classList.remove('busy'); }
  }

  /* Plein écran : seul le téléphone, agrandi à la hauteur de l'écran (Échap ou F pour sortir) */
  const plein = () => document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen().catch(() => msg('Plein écran refusé par le navigateur'));
  const sortie = Object.assign(document.createElement('button'), { className: 'fs-sortie', title: 'Quitter le plein écran (Échap)', innerHTML: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>' });
  sortie.setAttribute('aria-label', 'Quitter le plein écran');
  sortie.addEventListener('click', plein);
  document.body.appendChild(sortie);
  document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('plein', !!document.fullscreenElement);
    window.dispatchEvent(new Event('resize'));
  });

  tools.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.t === 'plein') { plein(); return; }
    if (b.dataset.t) act(b.dataset.t);
    if (b.dataset.scale) {
      scale = +b.dataset.scale;
      tools.querySelectorAll('[data-scale]').forEach(x => x.classList.toggle('on', x === b));
      showSize();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key === 's' || e.key === 'S') && document.body.classList.contains('framed')) { e.preventDefault(); act('shot'); }
    if ((e.key === 'f' || e.key === 'F') && (document.body.classList.contains('framed') || document.fullscreenElement)) { e.preventDefault(); plein(); }
  });
})();
