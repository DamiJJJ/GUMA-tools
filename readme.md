# GUMA-Tools

A web app for generating fictional Law Enforcement Agency documents, officer/firefighter cards and business cards - inspired by real LAPD/LSSD/CHP/LAFD formats used in FiveM roleplay servers.
Built with HTML, Tailwind CSS (CDN) and Vanilla JavaScript. No build tools required.

## Live Demo

[🔗 View on GitHub Pages](https://damijjj.github.io/GUMA-tools/)

## Available Generators

| Generator                       | File                            | Description                                                                                       |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Officer Card                    | `officer_generator.html`        | LSPD / LSSD / BCSO / SAHP / Custom officer profile card with faction switcher                     |
| Firefighter Card                | `firefighter_generator.html`    | LSCoFD / LSFD / Custom firefighter profile card with faction switcher                             |
| Business Card                   | `business_card_generator.html`  | Universal business card for LEA, Fire, civilians and business owners                              |
| Firearm Discharge Investigation | `firearm_discharge.html`        | LAPD-style Officer-Involved Firearm Discharge Investigation report                                |
| Traffic Collision Report        | `traffic_collision_report.html` | CHP 555-style Traffic Collision Report with dynamic party rows                                    |
| Personnel File                  | `personnel_file_generator.html` | Confidential LEA personnel file — attendance, training, commendations, discipline & medical leave |
| Arrest Report                   | `arrest_report.html`            | LAPD-style arrest & booking report with dynamic arresting-officer rows                            |
| Pre-Hospital Care Report        | `prehospital_care_report.html`  | EMS-style Pre-Hospital Care Report (PCR) with full incident, response, run-times & disposition    |
| Investigative Report            | `investigative_report.html`     | Two-page LAPD-style Investigative Report with combined crime, evidence & arrest report sections   |
| Bodycam Overlay                 | `bodycam_overlay.html`          | Body-worn camera HUD overlay burned onto your own screenshot - agency & camera branding, timestamp, image effects |

### Coming Soon

| Generator                   | Description                                |
| --------------------------- | ------------------------------------------ |
| Fire Code Inspection Report | Fire code compliance inspection form       |
| Coroner Autopsy Report      | Coroner / medical examiner autopsy report  |

## Features

### Shared / App-Wide

- **Dark / Light mode** - pill-shaped slider switch in the header, persisted across pages via localStorage, dark as default; per-page accent gradients in dark mode (navy / navy-soft / red); first-load anti-FOUC init via `js/theme-init.js`
- **Centralised theme styles** - all `@layer base/components/utilities` rules live in a single `js/guma-styles.js` injected at runtime; HTML pages are style-free
- **Responsive header** - app logo (auto-swapped between light/dark variants), desktop nav with Generator & Report dropdowns, active page detection, "About" item, mobile hamburger menu with full panel
- **Live on Kick badge** - pulsing badge appears in the header when the streamer is live (preview via `?preview_live=1`)
- **Latest Video tile** - the newest video from the Kick/YouTube channel shown on the homepage; the tile stays hidden when there is nothing to show
- **WYSIWYG in-canvas editing** - click a field straight on the rendered document and type into it; available on the Firearm Discharge, Traffic Collision, Arrest, Pre-Hospital Care and Investigative reports, with a shared toolbar and zoom control
- **Shrink-to-fit text** - overlong values scale down instead of being cut with an ellipsis; inputs are capped to what the field can physically hold
- **Preview & Download modal** - exports open in a zoomable preview (segmented zoom control, ctrl+wheel, fit-on-resize) with download & clipboard copy from one place
- **Page animations** - smooth entrance animations on all pages via `js/animations.js`
- **Per-page favicons** - each generator and report has its own browser-tab icon; the home/about favicon follows the active theme (light/dark logo variant)
- **Saved Cards / Reports** - every generator stores exported documents in localStorage; slide-in drawer with thumbnails, pin, load & remove
- **Randomize Character** - one-click random character seed on the Officer, Firefighter, Business Card and Personnel File generators: name & gender from randomuser.me (offline fallback pool included), weighted rank & division from the selected faction, age, height, weight, ethnicity, badge/serial numbers and a random Los Santos / Blaine County address; custom-faction mode fills personal fields only
- **Hot / Popular badges** - the two most-generated tools get flame / trending-up badges on the home tiles (sorted first within their section) and small icons in the nav menus, based on global download counters
- **Visit counter** - global page-visit count displayed in the footer (Supabase-backed)
- **Kick social link** in the footer (replaced Twitch)

### Officer Card Generator

- Faction switcher - LSPD / LSSD / BCSO / SAHP + Custom
- Fill in officer details: name, rank, division, serial & badge number
- Custom faction: custom rank, division or email domain
- Upload a photo - **in-canvas cropping**: drag & zoom the photo directly in its frame on the card
- Ethnicity, gender, age, year hired, height & weight fields
- **Realistic pay randomization** - based on rank, years of service and division
- **Employment History** - optional section attached below the card: add/remove previous positions with employer, rank, dates and reason for leaving; rendered directly on Canvas; empty fields show placeholders, ordered chronologically
- Live preview rendered on HTML Canvas
- Download the card as a PNG file
- **Copy to clipboard** - export the card as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Firefighter Card Generator

- Faction switcher - LSCoFD / LSFD + Custom
- Fill in firefighter details: name, rank, division, serial & badge number
- Custom faction: custom rank, division or email domain
- Upload a photo - **in-canvas cropping**, same as Officer Card
- Ethnicity, gender, age, year hired, height & weight fields
- Realistic pay randomization based on rank
- **Employment History** - optional section attached below the card, same as Officer Card
- Live preview rendered on HTML Canvas
- Download the card as a PNG file
- **Copy to clipboard** - export the card as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Business Card Generator

- **Multi-faction switcher** - LSPD / LSSD / BCSO / SAHP / LSCoFD / LSFD + Custom (civilian / business)
- **Custom mode** - upload your own logo / image, custom header title, custom footer lines
- **Logo size slider** (30%-100%) for fine-tuning the badge / logo scale
- **Watermark toggle** - subtle paper-texture watermark on the card surface
- Card details: rank, full name, badge number (optional in Custom mode), area, role, telephone, cell, TDD line, email (with auto-appended domain per faction), two-line address
- Live preview rendered on HTML Canvas with paper texture
- Download the card as a PNG file
- **Copy to clipboard** - export the card as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Firearm Discharge Investigation

- Agency name edited directly in the document header (no faction switcher)
- Incident type checkboxes (Tactical, Non-Tactical, Animal Shooting, Warning Shot)
- Section I - General Information (FID No., DR No., date, time, location, RD)
- Day of Week dropdown, datetime-local picker for report date/time
- Dynamic rows - add/remove Involved Officers and Witnessing Officers
- Dynamic civilian witness rows with full contact details
- Y/N fields as dropdowns (In Uniform, Vest, On Duty, Injured, IOD, Light Duty)
- Live preview updated instantly on canvas - proportioned to A4 format with column-aware font scaling
- Download the report as a PNG file
- **Copy to clipboard** - export the report as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Traffic Collision Report

- Based on CHP 555 format
- Special Conditions: Hit & Run (Misdemeanor / Felony), number injured/killed
- Location section: street, intersection, date/time, day of week, Tow Away, State Hwy Related
- Dynamic party rows - add/remove parties (driver, pedestrian, parked vehicle, etc.)
- Each party: DL#, vehicle info (year/make/model/color/plate), name, address, insurance, physical description, phone numbers, vehicle damage
- **Auto age** - the age field fills in automatically from the date of birth
- Report footer: Preparer, Reviewer, Dispatch Notified, Date Reviewed
- Live preview rendered on HTML Canvas
- Download the report as a PNG file
- **Copy to clipboard** - export the report as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Personnel File Generator

- Agency switcher with custom agency name input
- Subject details: name, residence address
- **Mark as Confidential** toggle
- Status, clearance level and date completed fields
- **Attendance** - days scheduled / present, sick days used, late arrivals
- **Emergency Contacts** - dynamic add/remove rows
- **Training Records** - dynamic add/remove rows
- **Commendations** - dynamic add/remove rows
- **Disciplinary Record** - dynamic add/remove rows
- **Medical Leave** & **Workers' Compensation** sections
- Free-text personal notes field
- Live preview rendered on HTML Canvas
- Download the document as a PNG file
- **Copy to clipboard** - export the document as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Arrest Report

- Booking info: location booked, booking / DR / incident numbers
- Arrestee details: name, sex, date of birth, residential address & phone
- Occurrence section: location, RD, arrest and report date/time (24h)
- Booking charge with Misdemeanor / Felony checkboxes
- Dynamic rows - add/remove Arresting Officers
- Live preview rendered on HTML Canvas
- Download the report as a PNG file
- **Copy to clipboard** - export the report as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Pre-Hospital Care Report

- Report / response numbers, incident date, EMS agency, call sign, vehicle & station
- Dispatch details: complaint, Emergency Medical Dispatch performed, primary role of unit
- Level of care, type of service requested and response mode (to & from scene)
- Full delay checklists (dispatch & response) and EMS transport mode
- Run times block in military time (18-27) plus unit back-in-service
- Incident / patient disposition, intercept agency, patient count & mass-casualty flags
- Scene details: incident location type, GPS latitude/longitude, odometer readings, incident FAC ID
- Live preview rendered on HTML Canvas
- Download the report as a PNG file
- **Copy to clipboard** - export the report as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Investigative Report

- **Two-page document** rendered as one export: Investigative Report face sheet (page 1) + Arrest Report (page 2)
- Report header: type of crime, UCR code / CC, investigating division, incident & DR numbers, editable agency name
- Case Screening Factors checklist with premises type & ATM flag
- Victim block: personal details, address, contact, ID and occupation
- Occurrence & entry: point of entry/exit, method, instrument, occurrence/reported date-times, property values
- **Free-text MO and Narrative boxes** - multiline, editable directly on the document
- Dynamic rows - add/remove Reporting Employees, Suspects, Involved Persons and Combined Evidence items
- Suspect's vehicle and per-suspect descriptors (descent, hair, eyes, clothing, oddities, weapon)
- Page 2: booking & arrestee details, charges, Admonition of Rights, Combined Crime Report and Juvenile Disposition
- Live preview rendered on HTML Canvas
- Download the report as a PNG file
- **Copy to clipboard** - export the report as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Bodycam Overlay

- Upload your own screenshot / frame - the HUD is burned onto it, no document canvas
- **Agency picker** - LSPD / LSSD / BCSO / SAHP / LSCoFD / LSFD, Custom logo upload or None
- **Camera branding** - camera brand picker or custom camera logo, device label and officer / device number
- Timestamp block: date, time and optional time zone
- Recording HUD: REC indicator, elapsed timer and battery percentage
- **Elements toggles** - show or hide individual HUD parts
- **Image effects** - vignette, film grain, scanlines and chromatic aberration, each with its own strength
- **Direct manipulation** - drag HUD elements around on the frame to reposition them
- Download the frame as a PNG file
- **Copy to clipboard** - export the frame as PNG directly to the clipboard
- Download counter displayed below the export buttons

## Usage

No build tools required. Open `index.html` in a browser or deploy to any static hosting (GitHub Pages, Netlify, etc.).

## Tech Stack

- **Tailwind CSS** (CDN, `darkMode: 'class'`) - utility-first styling with custom `guma-*` design tokens for both light and dark palettes; config in `js/tailwind-config.js`
- **Shared theme styles** - `js/guma-styles.js` injects all `@layer base/components/utilities` rules at runtime; `js/theme-init.js` handles anti-FOUC theme initialization
- **HTML5 Canvas** - document & card rendering, PNG export and clipboard copy
- **Vanilla JS** - zero runtime dependencies
- **Web Components** - shared header (with theme toggle + logo swap) and footer via `js/components.js`
- **Supabase** (REST API) - visit and download counters via `js/counters.js`

## Credits

- 3D preview mannequin on the Character Description page: _"Male base"_ by Arthur Migranoff, [poly.pizza](https://poly.pizza/m/eWGDnQ0jzmH), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) - converted to the project's own `assets/mannequin.mesh` binary

---

_Built for FiveM roleplay use. All agencies, names and badge numbers are fictional._
