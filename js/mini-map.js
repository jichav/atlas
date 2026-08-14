/* Malá mapa na stránce lokality — přiblíží se na bod(y) dané lokality. */
(function(){
  var el = document.getElementById('mini-map');
  if (!el || !window.ATLAS_MAP || typeof mapboxgl === 'undefined') return;
  var D = window.ATLAS_MAP, entryId = el.dataset.entry;
  var keys = Object.keys(D.features).filter(function(k){ return D.features[k] === entryId; });
  if (!keys.length){
    el.innerHTML = '<div class="caption faint" style="display:flex;align-items:center;justify-content:center;height:100%;text-align:center;padding:var(--sp-4)">Bod této lokality bude v mapě doplněn.</div>';
    return;
  }
  var layer = keys[0].slice(0, keys[0].lastIndexOf('_'));
  var ids = keys.map(function(k){ return String(k.slice(k.lastIndexOf('_') + 1)); });

  mapboxgl.accessToken = D.token;
  var map = new mapboxgl.Map({
    container:'mini-map', style:D.styleLight, bounds:D.bounds,
    fitBoundsOptions:{ padding:20 }, attributionControl:false, cooperativeGestures:true
  });
  map.addControl(new mapboxgl.NavigationControl({ showCompass:false }), 'top-right');
  map.addControl(new mapboxgl.ScaleControl({ maxWidth:90, unit:'metric' }), 'bottom-right');

  map.once('idle', function(){
    if (!map.getLayer(layer)) return;
    var fs = map.queryRenderedFeatures({ layers:[layer] }).filter(function(f){
      return ids.indexOf(String((f.properties||{}).OBJECTID)) !== -1;
    });
    if (!fs.length) return;
    var b = new mapboxgl.LngLatBounds();
    fs.forEach(function(f){ if (f.geometry && f.geometry.type === 'Point') b.extend(f.geometry.coordinates); });
    if (b.isEmpty()) return;
    map.fitBounds(b, { padding:60, maxZoom: fs.length > 1 ? 11.5 : 14, duration:0 });
    // v malé mapě nechat jen body této lokality
    (D.chapters || []).forEach(function(c){
      if (!map.getLayer(c.layer)) return;
      if (c.layer === layer) map.setFilter(c.layer, ['in', ['to-string', ['get','OBJECTID']], ['literal', ids]]);
      else map.setLayoutProperty(c.layer, 'visibility', 'none');
    });
  });
})();
