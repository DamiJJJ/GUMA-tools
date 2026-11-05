# GUMA Tools brand

Brand kit, in use since v1.11. These are the masters; the app itself loads the copies in `assets/`
(`logo*.png`, `icon_*.png`, `apple-touch-icon.png`, `favicon.svg`, `favicon_dark.svg`, `favicon.ico`).

## The mark

A police-badge shield whose top-right corner is folded like a page, holding a chamfered **G** with a badge
star in its crossbar. Badge + document + G: the app generates official-looking documents for LEA / Fire RP.

- **Symbol** - the shield on its own (header favicon, avatars, app icons).
- **Wordmark** - chamfered `GUMA`, a gold rule, tracked `TOOLS` spanning the same width.
- **Lockups** - horizontal (default) and stacked. Always use the supplied files; do not re-set the type.

## Colours

| Token      | HEX       | RGB          | CMYK (approx.)  | Use                                      |
| ---------- | --------- | ------------ | --------------- | ---------------------------------------- |
| Navy       | `#04045e` | 4, 4, 94     | 96, 96, 0, 63   | Shield, `GUMA` on light, icon tiles      |
| Gold       | `#f0c040` | 240, 192, 64 | 0, 20, 73, 6    | Fold, star, rule, `TOOLS` on dark        |
| Steel      | `#2d4787` | 45, 71, 135  | 67, 47, 0, 47   | `TOOLS` on light                         |
| White      | `#ffffff` | 255, 255, 255| 0, 0, 0, 0      | G on light, shield and `GUMA` on dark    |

Navy and gold match the app tokens `guma-bg` and `guma-gold`; steel matches `guma-l-gold`. Gold is an accent
only: never set text in gold on white.

## Which version where

| Background                          | Use                                           |
| ----------------------------------- | --------------------------------------------- |
| White / light (`html` without dark) | `guma-*.svg` (navy shield, white G)           |
| Navy / dark (`html.dark`)           | `guma-*-dark.svg` (white shield, navy G)      |
| One-colour print, stamps, engraving | `guma-*-black.svg` / `guma-*-navy.svg`        |
| Photos or busy dark backgrounds     | `guma-*-white.svg`                            |

In the one-colour files the G is a real cut-out, so they work on any background.

## Clear space and minimum size

- **Clear space:** keep at least **X** free on every side, where X = a quarter of the shield width.
- **Symbol:** 32 px and up uses `guma-symbol.svg`; below 32 px use `guma-symbol-small.svg` (bigger G, no star).
- **Horizontal lockup:** at least 32 px tall. Below that, use the symbol alone.
- **Stacked lockup:** at least 96 px tall.

## Don'ts

- Don't recolour, add outlines, shadows or gradients.
- Don't use the navy shield on a navy background; switch to the `-dark` version.
- Don't stretch, rotate or re-arrange the shield, G and star.
- Don't put the old wrench / `GT` mark next to the new one.

## Files

```
assets/brand/
  svg/      masters (vector, no live text)
    guma-symbol[-dark|-black|-white|-navy].svg
    guma-symbol-small[-dark].svg        small-size cut for 16-31 px
    guma-horizontal[-dark|-black|-white|-navy].svg
    guma-stacked[-dark|-black|-white|-navy].svg
    guma-wordmark[-dark|-black|-white|-navy].svg
    og_image.svg                        source of png/og_image.png
  png/      rasters, transparent unless noted
    logo.png / logo_dark.png            horizontal lockup, 1109x512
    logo_stacked.png / logo_stacked_dark.png   304x512
    logo_short.png / logo_short_dark.png       symbol, 256x256
    og_image.png                        1200x630 social preview (navy background)
  icons/    favicon and PWA set (navy tile, dark-mode symbol)
    favicon.svg, favicon.ico (16/32/48), favicon-16/32/48.png
    apple-touch-icon.png (180), icon_192.png, icon_512.png, icon_maskable_512.png
    icon.svg, icon_maskable.svg, apple-touch-icon.svg   sources
```

## Rolling it out (next release)

1. Copy `png/logo*.png` and `icons/*.png` over the same names in `assets/` (names match on purpose).
   The new horizontal logo is narrower (aspect 2.17 vs 2.61), so check the header (`h-8`) and the
   `index.html` hero (`h-20 md:h-28`) in both themes.
2. Point `<link rel="icon">` at `assets/favicon.svg` with `favicon.ico` as a fallback, instead of
   `logo_short.png`.
3. Add `og_image.png` as `og:image` / `twitter:image` if Open Graph tags are introduced.
4. Bump the service worker cache in `sw.js` so installed PWAs pick up the new icons.

## Notes

- The `GUMA` letters are the hand-built chamfered paths from the earlier brand draft; `TOOLS`, the G, the
  shield and the star were drawn for this kit. No font is needed and no font licence applies.
- No trademark search has been done.
