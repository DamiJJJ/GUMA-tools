---
description: Update readme.md to reflect recent changes.
---

Goal: keep `readme.md` accurate **and** keep its current look - a short,
visual landing page, not documentation. Nobody reads walls of text: the README
sells the app with the logo, the GIF and the thumbnail grid, then gets out of
the way.

## Target layout (keep exactly this order)

1. **Logo** - centred `<picture>`: `assets/logo_dark.png` for
   `prefers-color-scheme: dark`, `assets/logo.png` otherwise, `width="340"`,
   linked to the live app.
2. **Tagline** - centred: one bold sentence + one plain line listing the
   agencies.
3. **"▶ Open the app" button** - centred shields.io `for-the-badge` badge in
   navy `04045e`, linked to `https://damijjj.github.io/GUMA-tools/`.
4. **Badge row** - centred `flat-square` badges: generator count (gold
   `e8b84a`), `build: none`, Vanilla JS, Tailwind CSS, PWA. Bump the
   generator count whenever a generator is added or removed.
5. **Showcase GIF** - centred `assets/showcase.gif`, `width="800"`.
6. **`## Generators`** - one HTML `<table>`, **4 cells per row**, no empty
   cells if avoidable. Order: cards & files → police reports → Fire / EMS →
   image & in-game. Each cell:
   ```html
   <td align="center" width="25%">
     <a href="https://damijjj.github.io/GUMA-tools/<page>.html"><img src="assets/readme/<page>.jpg" alt="<Name>" /></a><br />
     <b><a href="https://damijjj.github.io/GUMA-tools/<page>.html"><Name></a></b><br />
     <sub><3-5 word description></sub>
   </td>
   ```
   Below the table: `<sub>Coming soon: ...</sub>` (drop the line when nothing
   is planned).
7. **`## Highlights`** - max ~5 bullets, each starting with an emoji and a
   **bold** feature name, one short clause after it. App-wide features only.
8. **`## Run locally`** - one line.
9. **`## Credits`** - one line per third-party asset.
10. `---` + centred `<sub>` fictional-content disclaimer.

## Writing rules

- **Short.** No per-generator feature sections, no field lists, no tech
  deep-dives. If a detail doesn't fit in a grid caption or a highlight bullet,
  it doesn't belong in the README (the changelog / about page cover it).
- Grid captions: 3-5 words. Highlights: one line each.
- Plain hyphens (`-`) only, never em / en dashes.
- English, no marketing fluff ("revolutionary", "powerful", ...).

## Steps

1. Read `readme.md` end-to-end.
2. Look at recent commits (`git log --oneline -20`) and the current diff
   (`git diff` + `git diff --staged`) to find what changed since the last
   readme touch.
3. Map each user-facing change onto the layout above:
   - **New generator / report** → new grid cell (+ thumbnail, see below), bump
     the badge count, remove it from "Coming soon", add a GIF frame if its
     output looks good.
   - **Removed / renamed page** → update its cell, thumbnail file name and the
     badge count.
   - **New app-wide feature** → only if it's one of the ~5 most important;
     otherwise skip it (or replace a weaker highlight).
   - **Tech-stack change** → update the badge row.
4. Apply the edits directly to `readme.md` (Edit/Write).
5. If any screenshot in `assets/screenshots/` changed or was added,
   regenerate its thumbnail and the GIF (below). If a generator has no
   screenshot yet, run `/screenshot <page>` first (ask the user before that).
6. Render a quick preview (headless Chrome screenshot of the HTML) and look at
   it: grid even, thumbnails aligned, nothing stretched.
7. Summarize what changed, file by file. Don't commit or push.

## Assets

Navy gradient `#0a0a72` → `#04045e` (the app's `guma-bg-soft` → `guma-bg`),
gold captions `#e8b84a`. Requires ImageMagick 7 (`magick`) and `ffmpeg`.

### Thumbnails - `assets/readme/<page>.jpg`

480x320 JPG, source fitted on the navy gradient with a soft shadow.
Cards / images (`full`) are fitted whole; documents (`top`) show only their
top strip so the header is legible.

```bash
thumb() { # thumb <screenshot.png> <full|top>
  local f="$1" src="$1"
  if [ "$2" = top ]; then
    local w; w=$(magick identify -format %w "$f")
    magick "$f" -crop "${w}x$((w*360/440))+0+0" +repage /tmp/guma-src.png; src=/tmp/guma-src.png
  fi
  magick -size 480x320 gradient:'#0a0a72'-'#04045e' \
    \( "$src" -resize 440x290 \( +clone -background black -shadow 50x6+0+4 \) +swap -background none -layers merge +repage \) \
    -gravity center -composite -strip -quality 85 -sampling-factor 4:2:0 \
    "assets/readme/$(basename "${f%.png}").jpg"
}
# Run from the repo root, e.g.: thumb assets/screenshots/officer_generator.png full
```

`full`: officer, firefighter, business card, arrest, bodycam, character
description. Everything else: `top`.

### Showcase GIF - `assets/showcase.gif`

~13 best-looking outputs, 1000x640 frames (doc fitted in 900x540, gold
caption at the bottom), 2 s hold + 0.4 s crossfade, 800 px wide, 8 fps,
128 colours. Keep it under ~3 MB. Multi-page documents show page 1 only
(`page:<height of one page>`).

Frame list (`file|mode|caption`; mode = `full` or `page:<px>`):

```
officer_generator.png|full|Officer Card
firefighter_generator.png|full|Firefighter Card
business_card_generator.png|full|Business Card
wanted_poster.png|full|Wanted Poster
wanted_poster_classic.png|full|Wanted Poster - Classic Flyer
use_of_force_report.png|page:1600|Use of Force Report
vehicle_pursuit_report.png|page:1584|Vehicle Pursuit Report
traffic_collision_report.png|full|Traffic Collision Report
fire_code_inspection_report.png|full|Fire Code Inspection Report
prehospital_care_report.png|full|Pre-Hospital Care Report
investigative_report.png|page:1931|Investigative Report
bodycam_overlay.png|full|Bodycam Overlay
character_description.png|full|Character Description
```

Build (save the list as `<scratchpad>/list.txt`, run from the repo root):

```bash
S=<scratchpad>; FONT=/System/Library/Fonts/HelveticaNeue.ttc
rm -rf "$S/frames"; mkdir -p "$S/frames"; i=0
while IFS='|' read -r file mode title; do
  i=$((i+1)); src="assets/screenshots/$file"
  case $mode in page:*) magick "$src" -crop "x${mode#page:}+0+0" +repage "$S/src.png"; src="$S/src.png";; esac
  magick -size 1000x640 gradient:'#0a0a72'-'#04045e' \
    \( "$src" -resize 900x540 \( +clone -background black -shadow 60x8+0+6 \) +swap -background none -layers merge +repage \) \
    -gravity north -geometry +0+22 -composite \
    -font "$FONT" -fill '#e8b84a' -pointsize 26 -gravity south -annotate +0+26 "$title" \
    "$S/frames/f$(printf %02d $i).png"
done < "$S/list.txt"

N=$i; HOLD=2.0; FADE=0.4; args=(); f=""; prev="[0:v]"; off=$HOLD
for k in $(seq -w 1 $N); do args+=(-loop 1 -t 2.4 -i "$S/frames/f$k.png"); done
for k in $(seq 1 $((N-1))); do
  f="$f${prev}[$k:v]xfade=transition=fade:duration=$FADE:offset=$off[v$k];"; prev="[v$k]"
  off=$(echo "$off+$HOLD" | bc)
done
f="${f}${prev}fps=8,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle[out]"
ffmpeg -y -loglevel error "${args[@]}" -filter_complex "$f" -map "[out]" -loop 0 assets/showcase.gif
```

Look at a frame or two (`ffmpeg -ss 9 -i assets/showcase.gif -frames:v 1 check.png`)
before reporting.
