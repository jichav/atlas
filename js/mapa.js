/* Mapa lokalit — Mapbox GL JS. Body kapitol se kreslí z GeoJSON v js/map-data.js.
   Kliknutí na bod (nebo na lokalitu v seznamu) bod zvýrazní a otevře popis vpravo. */
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

  function activeLayer(c){ return c.data ? c.key + '-pts' : c.layer; }
  function sourceId(c){ return c.key + '-src'; }
  function chapterByLayer(layer){ return D.chapters.filter(function(c){ return c.layer === layer; })[0]; }

  // rejstřík: která lokalita má které body
  var byEntry = {};
  D.chapters.forEach(function(c){
    if (!c.data) return;
    (c.data.features || []).forEach(function(f){
      var oid = (f.properties || {}).OBJECTID;
      var entry = D.features[c.layer + '_' + oid];
      if (!entry) return;
      (byEntry[entry] = byEntry[entry] || []).push({ chapter:c, oid:oid, coords:f.geometry.coordinates });
    });
  });

  function addInlineLayers(){
    D.chapters.forEach(function(c){
      if (!c.data) return;
      var srcId = sourceId(c), lyrId = activeLayer(c);
      if (!map.getSource(srcId)) map.addSource(srcId, { type:'geojson', data:c.data, promoteId:'OBJECTID' });
      if (!map.getLayer(lyrId)) {
        var paint = Object.assign({}, D.paintDefault || {}, c.paint || {});
        var color = c.pointColor || c.color;
        paint['circle-color'] = paint['circle-color'] || color;
        paint['circle-stroke-color'] = paint['circle-stroke-color'] || color;
        var r = paint['circle-radius'] || 6.5;
        paint['circle-radius'] = ['case', ['boolean', ['feature-state','selected'], false], r * 1.9, r];
        paint['circle-opacity'] = ['case', ['boolean', ['feature-state','selected'], false], 1, paint['circle-opacity'] == null ? 1 : paint['circle-opacity']];
        paint['circle-stroke-width'] = ['case', ['boolean', ['feature-state','selected'], false], 3, paint['circle-stroke-width'] == null ? 0 : paint['circle-stroke-width']];
        map.addLayer({ id:lyrId, type:'circle', source:srcId, paint:paint });
      }
      if (map.getLayer(c.layer)) map.setLayoutProperty(c.layer, 'visibility', 'none');
    });
  }

  function applyVisibility(){
    D.chapters.forEach(function(c){
      var l = activeLayer(c);
      if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', visible[c.key] ? 'visible' : 'none');
    });
  }

  // zvýraznění vybraných bodů
  var selected = [];
  function clearSelection(){
    selected.forEach(function(s){ map.setFeatureState({ source:sourceId(s.chapter), id:s.oid }, { selected:false }); });
    selected = [];
  }
  function select(points){
    clearSelection();
    points.forEach(function(p){
      if (!map.getSource(sourceId(p.chapter))) return;
      map.setFeatureState({ source:sourceId(p.chapter), id:p.oid }, { selected:true });
      selected.push(p);
    });
    document.querySelectorAll('.map-list a').forEach(function(a){ a.classList.remove('is-active'); });
  }

  var panel = document.getElementById('detail-body') || document.getElementById('detail');
  var intro = panel.innerHTML;
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

  // výběr lokality ze seznamu vpravo — nenaviguje, jen vybere v mapě
  function selectEntry(entryId, link){
    var pts = byEntry[entryId] || [];
    if (!pts.length) return false;
    var c = pts[0].chapter;
    if (!visible[c.key]) {
      visible[c.key] = true;
      var cb = document.querySelector('#layers input[value="' + c.key + '"]');
      if (cb) cb.checked = true;
      applyVisibility();
    }
    select(pts);
    if (link) link.classList.add('is-active');
    var b = new mapboxgl.LngLatBounds();
    pts.forEach(function(p){ b.extend(p.coords); });
    map.fitBounds(b, { padding:80, maxZoom: pts.length > 1 ? 11 : 13.5, duration:600 });
    showDetail(entryId, pts[0].oid, pts.length === 1 ? c.layer + '_' + pts[0].oid : null);
    return true;
  }

  function bind(){
    addInlineLayers();
    D.chapters.forEach(function(c){
      var l = activeLayer(c);
      if (!map.getLayer(l)) return;
      map.on('mouseenter', l, function(){ map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', l, function(){ map.getCanvas().style.cursor = ''; });
      map.on('click', l, function(ev){
        var f = ev.features[0], p = f.properties || {};
        var key = c.layer + '_' + p.OBJECTID;
        select([{ chapter:c, oid:p.OBJECTID }]);
        showDetail(D.features[key], p.OBJECTID, key);
        var coords = (f.geometry && f.geometry.type === 'Point') ? f.geometry.coordinates : ev.lngLat.toArray();
        map.easeTo({ center:coords, zoom:Math.max(map.getZoom(), 13.5), duration:600 });
      });
    });
    applyVisibility();
  }

  map.on('load', bind);

  // návrat na výchozí zobrazení
  var reset = document.getElementById('map-reset');
  if (reset) reset.addEventListener('click', function(){
    clearSelection();
    document.querySelectorAll('.map-list a').forEach(function(a){ a.classList.remove('is-active'); });
    panel.innerHTML = intro;
    map.fitBounds(D.bounds, { padding:40, duration:700 });
  });

  // filtr kapitol
  document.querySelectorAll('#layers input').forEach(function(cb){
    cb.addEventListener('change', function(){ visible[cb.value] = cb.checked; applyVisibility(); });
  });

  // seznam lokalit vpravo
  document.querySelectorAll('.map-list a').forEach(function(a){
    var slug = (a.getAttribute('href') || '').replace(/.*lokalita\/([^\/]+)\/.*/, '$1');
    var entryId = Object.keys(D.entries).filter(function(k){ return D.entries[k].slug === slug; })[0];
    if (!entryId) return;
    a.addEventListener('click', function(ev){
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
      if (!map.isStyleLoaded()) return;
      if (selectEntry(entryId, a)) ev.preventDefault();
    });
  });

  // odkaz z adresy: mapa/#nejkratsi-ulice vybere lokalitu
  if (location.hash) {
    var slug = location.hash.slice(1);
    var id = Object.keys(D.entries).filter(function(k){ return D.entries[k].slug === slug; })[0];
    if (id) map.on('load', function(){ if (!selectEntry(id)) showDetail(id); });
  }
})();
