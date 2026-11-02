# The Night Almanac

Plain-language astrology readings from your real birth chart, in Western and Vedic astrology, with the reasoning shown so you can check it. Everything runs on your own device: no accounts, no servers, no tracking.

For entertainment and reflection. Astrology is a cultural tradition; studies haven't found that it predicts events or personality.

## What's inside

- **Western:** Placidus and whole-sign houses, sect, dignities, annual profections, the seven Hermetic lots, zodiacal releasing, transits, astrocartography, planetary hours, void-of-course Moon, lunar mansions, decans and tarot, fixed stars, solar returns, eclipses.
- **Vedic:** Lahiri sidereal chart, nakshatras, Vimshottari dashas, tara bala, Sade Sati, Krishnamurti Paddhati (KP) with horary, panchanga, Rahu Kaal, classic yogas, Varshaphal.
- **Numerology:** Pythagorean core numbers and personal cycles.

Rules, formulas and sources for every technique are in [rulebook.md](rulebook.md).

## Build

The web app is one self-contained HTML file.

```
cd web
npm install
node build.mjs        # writes night-almanac.html
node build-site.mjs   # writes the installable website into ../docs
```

Desktop apps (Mac, Windows) are built with Electron from `desktop/` (see `desktop/build-mac.sh`).

The Python engine (`astro_engine.py`) mirrors the JavaScript engine and is used for cross-checks: `pip install -r requirements.txt && python3 test_engine.py`.

## License and credits

The Night Almanac is free software under the GNU Affero General Public License v3 (see [LICENSE](LICENSE)).

- Astronomical calculations: Swiss Ephemeris © Astrodienst AG (AGPL), via sweph-wasm (AGPL).
- Place data: GeoNames (CC BY 4.0). Map outline: Natural Earth (public domain).
- Fonts: Cormorant Garamond and Jost (SIL Open Font License 1.1).
