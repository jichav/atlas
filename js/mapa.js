/* Mapa lokalit — Mapbox GL JS. Token a styly jsou autorovy (viz js/map-data.js). */
(function(){
  var D = window.ATLAS_MAP;
  mapboxgl.accessToken = D.token;
  var map = new mapboxgl.Map({ container:'map', style:D.styleLight, bounds:D.bounds, fitBoundsOptions:{ padding:40 }, attributionControl:true });

  // výška mapy vždy do spodního okraje okna
  var shell = document.querySelector('.map-shell');
  function sizeShell(){
    if (window.innerWidth <= 960) { shell.style.height = ''; return; }
    shell.style.height = Math.max(440, window.innerHeight - shell.getBoundingClientRect().top) + 'px';
    map.resize();
  }
  window.addEventListener('resize', function(){ sizeShell(); map.fitBounds(D.bounds, { padding:40, duration:0 }); });
  sizeShell();
  map.addControl(new mapboxgl.NavigationControl(), 'top-left');
  map.addControl(new mapboxgl.ScaleControl({ maxWidth:100, unit:'metric' }), 'bottom-right');

  var visible = {};
  D.chapters.forEach(function(c){ visible[c.key] = true; });

  function applyVisibility(){
    D.chapters.forEach(function(c){
      if (map.getLayer(c.layer)) map.setLayoutProperty(c.layer, 'visibility', visible[c.key] ? 'visible' : 'none');
    });
  }

  var panel = document.getElementById('detail');
  function showDetail(entryId, objectId, pointKey){
    var e = D.entries[entryId];
    if (!e){ panel.innerHTML = '<p class="small muted">Tento bod ještě nemá stránku lokality (OBJECTID ' + objectId + ').</p>'; return; }
    var pt = (D.points || {})[pointKey];
    var ch = D.chapters.filter(function(c){ return c.key === e.chapter; })[0] || {};
    panel.innerHTML =
      '<div class="meta" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
      ((pt && pt.ref) ? '<span class="mapref">' + pt.ref + '</span>' : (e.mapRef ? '<span class="mapref">' + e.mapRef + '</span>' : '')) +
      '<span class="chip" style="background:' + (ch.color||'#eee') + '">' + (ch.label||'') + '</span></div>' +
      '<h2>' + e.title + '</h2>' +
      (pt && pt.name ? '<div class="small" style="margin:-4px 0 8px;color:var(--ink-1)">' + pt.name + '</div>' : '') +
      (e.teaser ? '<p class="small muted">' + e.teaser + '</p>' : '') +
      '<a class="btn btn-primary" href="../lokalita/' + e.slug + '/index.html">Otevřít stránku lokality</a>' +
      '<p class="caption faint" style="margin-top:var(--sp-3)">Atlas, s. ' + e.page + '</p>';
  }

  function bind(){
    D.chapters.forEach(function(c){
      if (!map.getLayer(c.layer)) return;
      map.on('mouseenter', c.layer, function(){ map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', c.layer, function(){ map.getCanvas().style.cursor = ''; });
      map.on('click', c.layer, function(ev){
        var f = ev.features[0], p = f.properties || {};
        var key = c.layer + '_' + p.OBJECTID;
        showDetail(D.features[key], p.OBJECTID, key);
      });
    });
    applyVisibility();
  }

  map.on('load', bind);

  // přepínač světlé/tmavé podkladové mapy
  document.getElementById('style-toggle').addEventListener('click', function(){
    var dark = this.dataset.mode === 'dark';
    map.setStyle(dark ? D.styleLight : D.styleDark);
    this.dataset.mode = dark ? 'light' : 'dark';
    this.textContent = dark ? 'Tmavá mapa' : 'Světlá mapa';
    map.once('styledata', bind);
  });

  // filtr kapitol
  document.querySelectorAll('#layers input').forEach(function(cb){
    cb.addEventListener('change', function(){ visible[cb.value] = cb.checked; applyVisibility(); });
  });

  // odkaz z adresy: mapa/#nejkratsi-ulice vycentruje detail
  if (location.hash) {
    var slug = location.hash.slice(1);
    var id = Object.keys(D.entries).filter(function(k){ return D.entries[k].slug === slug; })[0];
    if (id) map.on('load', function(){ showDetail(id); });
  }
})();
