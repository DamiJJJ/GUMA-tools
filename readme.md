# GUMA-Tools

A web app for generating fictional Law Enforcement Agency documents, officer/firefighter cards and recruitment materials - inspired by real LAPD/LSSD/CHP/LAFD formats used in FiveM roleplay servers.
Built with HTML, Tailwind CSS (CDN) and Vanilla JavaScript. No build tools required.

## Live Demo

[🔗 View on GitHub Pages](https://damijjj.github.io/GUMA-tools/)

## Available Generators

| Generator                       | File                            | Description                                                                    |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| Officer Card                    | `officer_generator.html`        | LSPD / LSSD / BCSO / SAHP / Custom officer profile card with faction switcher  |
| Firefighter Card                | `firefighter_generator.html`    | LSCoFD / LSFD / Custom firefighter profile card with faction switcher          |
| Firearm Discharge Investigation | `firearm_discharge.html`        | LAPD-style Officer-Involved Firearm Discharge Investigation report             |
| Traffic Collision Report        | `traffic_collision_report.html` | CHP 555-style Traffic Collision Report with dynamic party rows                 |

### Coming Soon

| Generator                    | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| Business Card Generator      | Customisable business card for officers and staff                 |
| Police Recruitment Poster    | Print-ready recruitment poster with faction branding              |
| Fire Department Poster       | Recruitment poster tailored with fire department insignia         |
| Prehospital Care Report      | EMS-style prehospital care / PCR document                        |
| Fire Code Inspection Report  | Fire code compliance inspection form                              |
| Coroner Autopsy Report       | Coroner / medical examiner autopsy report                         |

## Features

### Shared / App-Wide

- **Responsive header** - app logo, desktop nav with Generator & Report dropdowns, active page detection, "About" item, mobile hamburger menu with full panel
- **Live on Kick badge** - pulsing badge appears in the header when the streamer is live
- **Page animations** - smooth entrance animations on all pages via `js/animations.js`
- **Visit counter** - global page-visit count displayed in the footer (Supabase-backed)
- **Kick social link** in the footer (replaced Twitch)

### Officer Card Generator

- Faction switcher - LSPD / LSSD / BCSO / SAHP + Custom
- Fill in officer details: name, rank, division, serial & badge number
- Custom faction: custom rank, division or email domain
- Upload a photo - auto-cropped to fit the card
- Ethnicity, gender, age, year hired, height & weight fields
- Randomize pay based on rank
- **Employment History** - optional section attached below the card: add/remove previous positions with employer, rank, dates and reason for leaving; rendered directly on Canvas
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
- Randomize pay based on rank
- **Employment History** - optional section attached below the card, same as Officer Card
- Live preview rendered on HTML Canvas
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
- Live preview updated instantly on canvas - proportioned to A4 format
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

## Usage

No build tools required. Open `index.html` in a browser or deploy to any static hosting (GitHub Pages, Netlify, etc.).

## Tech Stack

- **Tailwind CSS** (CDN) - utility-first styling with custom `guma-*` design tokens; shared config extracted to `js/tailwind-config.js`
- **HTML5 Canvas** - document & card rendering, PNG export and clipboard copy
- **Vanilla JS** - zero runtime dependencies
- **Web Components** - shared header and footer via `js/components.js`
- **Supabase** (REST API) - visit and download counters via `js/counters.js`

---

_Built for FiveM roleplay use. All agencies, names and badge numbers are fictional._
