/* Náhodný výběr tří lokalit na úvodní straně. */
(function(){
  var g = document.getElementById('featured');
  if (!g) return;
  var cards = Array.prototype.slice.call(g.children);
  for (var i = cards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = cards[i];
    cards[i] = cards[j]; cards[j] = t;
  }
  cards.forEach(function(c, n){
    if (n < 3) g.appendChild(c); else c.remove();
  });
})();
