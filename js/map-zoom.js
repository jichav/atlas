/* Klik na mapu ji zvětší přes celou obrazovku, druhý klik přepíná mezi "na obrazovku" a 100 %. */
(function () {
  var links = document.querySelectorAll('.map-link');
  if (!links.length) return;

  var ov = document.createElement('div');
  ov.className = 'map-lightbox';
  ov.setAttribute('hidden', '');
  ov.innerHTML = '<div class="map-lightbox-bar"><span class="map-lightbox-label"></span><span class="map-lightbox-actions"><button type="button" class="map-lightbox-zoom">Zvětšit na 100 %</button><button type="button" class="map-lightbox-close" aria-label="Zavřít">Zavřít &#215;</button></span></div><div class="map-lightbox-scroll"><img alt=""></div>';
  document.body.appendChild(ov);

  var big = ov.querySelector('img');
  var label = ov.querySelector('.map-lightbox-label');
  var scroll = ov.querySelector('.map-lightbox-scroll');
  var zoomBtn = ov.querySelector('.map-lightbox-zoom');
  var full = false;

  function setZoom(on) {
    full = on;
    scroll.classList.toggle('is-full', on);
    zoomBtn.textContent = on ? 'Zobrazit celou mapu' : 'Zvětšit na 100 %';
    if (on) {
      scroll.scrollLeft = Math.max(0, (scroll.scrollWidth - scroll.clientWidth) / 2);
      scroll.scrollTop = Math.max(0, (scroll.scrollHeight - scroll.clientHeight) / 2);
    }
  }

  function open(src, alt) {
    big.src = src;
    big.alt = alt || '';
    label.textContent = alt || 'Mapa';
    ov.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    setZoom(false);
  }
  function close() {
    ov.setAttribute('hidden', '');
    document.body.style.overflow = '';
    big.removeAttribute('src');
  }

  /* Mapy jsou vyexportované na A4 (297×210 mm, 300 DPI = 3508 px na delší straně).
     Menší výřezy zmenšíme ve stejném poměru, aby měly všechny stejné měřítko na stránce. */
  var A4 = 3508;
  function scale(im) {
    var fig = im.closest('figure');
    var ref = im.closest('.prose') || (fig && fig.parentNode);
    var col = ref ? ref.clientWidth : 0;
    if (!col || !im.naturalWidth) return;
    if (fig) { fig.style.maxWidth = 'none'; fig.style.marginInline = 'auto'; }
    fig.style.position = 'relative';
    var w = im.naturalWidth / A4 * col;
    var hint = fig && fig.querySelector('.map-link-hint');
    im.style.width = w + 'px';
    if (w <= col) {
      /* menší výřez: ve stejném měřítku, vycentrovaný na text */
      im.style.maxWidth = '100%';
      if (fig) { fig.style.width = ''; fig.style.overflowX = ''; }
      if (hint) { hint.style.width = w + 'px'; hint.style.marginInline = 'auto'; }
    } else {
      /* širší než A4: zarovnaná vlevo, přetéká doprava k okraji stránky, zbytek posuvem */
      im.style.maxWidth = 'none';
      var side = document.querySelector('.detail > .side');
      var figLeft = fig.getBoundingClientRect().left;
      var wrap = im.closest('.wrap-page');
      var limit = side && side.getBoundingClientRect().width
        ? side.getBoundingClientRect().left - 24
        : (wrap ? wrap.getBoundingClientRect().right : figLeft + col);
      var avail = Math.max(col, limit - figLeft);
      if (fig) { fig.style.width = Math.min(avail, w) + 'px'; fig.style.overflowX = w > avail ? 'auto' : ''; }
      if (hint) { hint.style.width = ''; hint.style.marginInline = ''; }
    }
  }

  links.forEach(function (a) {
    var im = a.querySelector('img');
    if (!im) return;
    if (im.complete) scale(im); else im.addEventListener('load', function () { scale(im); });
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      open(im.currentSrc || im.src, im.getAttribute('alt') || 'Mapa');
    });
  });

  window.addEventListener('resize', function () {
    document.querySelectorAll('.map-link img').forEach(function (im) { if (im.complete) scale(im); });
  });

  zoomBtn.addEventListener('click', function () { setZoom(!full); });
  big.addEventListener('click', function () { setZoom(!full); });
  ov.querySelector('.map-lightbox-close').addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov || e.target === scroll) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.hasAttribute('hidden')) close(); });
})();
