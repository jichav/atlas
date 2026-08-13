# Web atlasu — statický export pro GitHub Pages

Čisté HTML, CSS a jeden JS soubor pro mapu. Žádný build, žádný React. Každá stránka má vlastní URL.

## Struktura a adresy

```
export/
  index.html                    →  /
  mapa/index.html               →  /mapa/
  kapitoly/index.html           →  /kapitoly/
  o-atlasu/index.html           →  /o-atlasu/
  lokalita/<slug>/index.html    →  /lokalita/nejkratsi-ulice/   (23 stránek)
  css/atlas.css
  js/map-data.js                token, styly a body mapy
  js/mapa.js                    Mapbox GL logika
  fonts/                        Bricolage Grotesque
  images/atlas-cover.png
  files/                        sem patří atlas-prazskych-kuriozit.pdf
```

Adresy jako `/mapa/` fungují díky tomu, že každá stránka je `index.html` ve své složce — GitHub Pages je servíruje bez `.html` na konci. Žádná serverová konfigurace není potřeba.

## Jak to nasadit

1. V repu `jichav/atlas` nechte složku `images/` tam, kde je (stránky na ni odkazují přes `raw.githubusercontent.com`).
2. Obsah této složky `export/` nakopírujte do rootu repa (nebo do složky `docs/`).
3. Settings → Pages → Source: `Deploy from a branch`, branch `main`, folder `/` (nebo `/docs`).
4. Web pojede na `https://jichav.github.io/atlas/`.

**Pozor na cesty:** všechny odkazy jsou relativní (`../`, `../../`), takže web funguje jak na `jichav.github.io/atlas/`, tak na vlastní domény. Nikdy nepoužívejte absolutní `/mapa/` — na project pages by to ukazovalo mimo repo.

Soubor `.nojekyll` v rootu vypne Jekyll, aby GitHub nepřepisoval složky začínající podtržítkem.

## Mapa

`js/map-data.js` obsahuje váš token, oba styly (`styleLight`, `styleDark`) a názvy bodových vrstev (`extremy-body`, `priroda-body`, `podzemi-body`, `doprava-body`, `ulice-body`, `ostatni-body`).

Kliknutí na bod se páruje se stránkou lokality přes `features` — klíč je `<vrstva>_<OBJECTID>`, stejně jako ve vašem původním HTML. Když ve Mapbox Studiu přidáte bod, dopište do `features` jeden řádek:

```js
"priroda-body_4": "vodopady"
```

Body bez páru zobrazí v panelu poznámku s jejich `OBJECTID`, takže je snadno dohledáte.

`/mapa/#nejkratsi-ulice` otevře mapu s předvybraným detailem — takové odkazy jde posílat.

## Co je potřeba doplnit

- `files/atlas-prazskych-kuriozit.pdf` — tlačítko Stáhnout PDF na něj už odkazuje.
- Fotografie lokalit. Zatím jsou v článcích jen mapové výřezy z `images/`; popisky fotografií (včetně autora) už v HTML jsou jako `figcaption` u prázdných rámů.
- Mapové výřezy ve vyšší kvalitě: stačí přepsat PNG v `images/` stejnými názvy (`1.1.png`, `2.2.png`, …), stránky se změní samy.

## Generování

Stránky vznikají z `ui_kits/web/data.js` (kapitoly, lokality, souřadnice, zdroje, Mapbox konfigurace). Když se změní obsah tam, přegeneruje se export znovu — neupravujte HTML ručně, pokud nemusíte.
