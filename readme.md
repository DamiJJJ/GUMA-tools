# GUMA-Tools

A web app for generating fictional Law Enforcement Agency documents, officer/firefighter cards, business cards and recruitment materials - inspired by real LAPD/LSSD/CHP/LAFD formats used in FiveM roleplay servers.
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

### Coming Soon

| Generator                   | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| Police Recruitment Poster   | Print-ready recruitment poster with faction branding      |
| Fire Department Poster      | Recruitment poster tailored with fire department insignia |
| Prehospital Care Report     | EMS-style prehospital care / PCR document                 |
| Fire Code Inspection Report | Fire code compliance inspection form                      |
| Coroner Autopsy Report      | Coroner / medical examiner autopsy report                 |

## Features

### Shared / App-Wide

- **Dark / Light mode** - pill-shaped slider switch in the header, persisted across pages via localStorage, dark as default; per-page accent gradients in dark mode (navy / navy-soft / red); first-load anti-FOUC init via `js/theme-init.js`
- **Centralised theme styles** - all `@layer base/components/utilities` rules live in a single `js/guma-styles.js` injected at runtime; HTML pages are style-free
- **Responsive header** - app logo (auto-swapped between light/dark variants), desktop nav with Generator & Report dropdowns, active page detection, "About" item, mobile hamburger menu with full panel
- **Live on Kick badge** - pulsing badge appears in the header when the streamer is live (preview via `?preview_live=1`)
- **Page animations** - smooth entrance animations on all pages via `js/animations.js`
- **Per-page favicons** - each generator and report has its own browser-tab icon
- **Visit counter** - global page-visit count displayed in the footer (Supabase-backed)
- **Kick social link** in the footer (replaced Twitch)

### Officer Card Generator

- Faction switcher - LSPD / LSSD / BCSO / SAHP + Custom
- Fill in officer details: name, rank, division, serial & badge number
- Custom faction: custom rank, division or email domain
- Upload a photo - auto-cropped to fit the card
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
- Upload a photo - auto-cropped to fit the card
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
- Card details: rank, full name, badge number, area, role, telephone, cell, TDD line, email (with auto-appended domain per faction), two-line address
- Live preview rendered on HTML Canvas with paper texture
- Download the card as a PNG file
- **Copy to clipboard** - export the card as PNG directly to the clipboard
- Download counter displayed below the export buttons

### Firearm Discharge Investigation

- Faction switcher with custom faction name input
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

## Usage

No build tools required. Open `index.html` in a browser or deploy to any static hosting (GitHub Pages, Netlify, etc.).

## Tech Stack

- **Tailwind CSS** (CDN, `darkMode: 'class'`) - utility-first styling with custom `guma-*` design tokens for both light and dark palettes; config in `js/tailwind-config.js`
- **Shared theme styles** - `js/guma-styles.js` injects all `@layer base/components/utilities` rules at runtime; `js/theme-init.js` handles anti-FOUC theme initialization
- **HTML5 Canvas** - document & card rendering, PNG export and clipboard copy
- **Vanilla JS** - zero runtime dependencies
- **Web Components** - shared header (with theme toggle + logo swap) and footer via `js/components.js`
- **Supabase** (REST API) - visit and download counters via `js/counters.js`

---

_Built for FiveM roleplay use. All agencies, names and badge numbers are fictional._
