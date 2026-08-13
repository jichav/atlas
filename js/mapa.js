/* Mapa lokalit — Mapbox GL JS. Token a styly jsou autorovy (viz js/map-data.js). */
(function(){
  var D = window.ATLAS_MAP;
  mapboxgl.accessToken = D.token;
  var map = new mapboxgl.Map({ container:'map', style:D.styleLight, center:[14.44,50.06], zoom:9.6, attributionControl:true });
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
  function showDetail(entryId, objectId){
    var e = D.entries[entryId];
    if (!e){ panel.innerHTML = '<p class="small muted">Tento bod ještě nemá stránku lokality (OBJECTID ' + objectId + ').</p>'; return; }
    var ch = D.chapters.filter(function(c){ return c.key === e.chapter; })[0] || {};
    panel.innerHTML =
      '<div class="meta" style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
      (e.mapRef ? '<span class="mapref">' + e.mapRef + '</span>' : '') +
      '<span class="chip" style="background:' + (ch.color||'#eee') + '">' + (ch.label||'') + '</span></div>' +
      '<h2>' + e.title + '</h2>' +
      (e.teaser ? '<p class="small muted">' + e.teaser + '</p>' : '') +
      (e.image ? '<img src="' + e.image + '" alt="' + e.title + '" style="border:1px solid var(--border-hairline);border-radius:var(--radius-sm);margin-bottom:var(--sp-3)">' : '') +
      '<a class="btn btn-primary" href="../lokalita/' + e.slug + '/">Otevřít stránku lokality</a>' +
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
        showDetail(D.features[key], p.OBJECTID);
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
