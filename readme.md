# GUMA-Tools

A web app for generating fictional Law Enforcement Agency documents and officer/firefighter cards — inspired by real LAPD/LSSD/CHP/LAFD formats used in FiveM roleplay servers.
Built with plain HTML, CSS and JavaScript. No frameworks, no dependencies.

## Live Demo

[🔗 View on GitHub Pages](https://damijjj.github.io/GUMA-tools/)

## Available Generators

| Generator                       | File                         | Description                                                                   |
| ------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Officer Card                    | `officer_generator.html`     | LSPD / LSSD / BCSO / SAHP / Custom officer profile card with faction switcher |
| Firefighter Card                | `firefighter_generator.html` | LACoFD / LAFD / Custom firefighter profile card with faction switcher         |
| Firearm Discharge Investigation | `firearm-discharge.html`     | LAPD-style Officer-Involved Firearm Discharge Investigation report            |

## Features

### Officer Card Generator

- Faction switcher — LSPD / LSSD / BCSO / SAHP
- Fill in officer details: name, rank, division, serial & badge number
- Custom faction: Custom rank, division or mail domain
- Upload a photo — auto-cropped to fit the card
- Ethnicity, gender, age, year hired, height & weight fields
- Randomize pay based on rank
- Live preview rendered on HTML Canvas
- Download the card as a PNG file

### Firefighter Card Generator

- Faction switcher — LSCoFD / LSFD
- Fill in firefighter details: name, rank, division, serial & badge number
- Custom faction: Custom rank, division or mail domain
- Upload a photo — auto-cropped to fit the card
- Ethnicity, gender, age, year hired, height & weight fields
- Randomize pay based on rank
- Live preview rendered on HTML Canvas
- Download the card as a PNG file

### Firearm Discharge Investigation

- Possibility to enter custom faction name
- Incident type checkboxes (Tactical, Non-Tactical, Animal Shooting, Warning Shot)
- Section I — General Information (FID No., DR No., date, time, location, RD)
- Day of Week dropdown, datetime-local picker for report date/time
- Dynamic rows — add/remove Involved Officers and Witnessing Officers
- Dynamic civilian witness rows with full contact details
- Y/N fields as dropdowns (In Uniform, Vest, On Duty, Injured, IOD, Light Duty)
- Live preview updated instantly on canvas — proportioned to A4
- Download the report as a PNG file

## Usage

No build tools required. Open `index.html` in a browser or deploy to any static hosting.

## Tech Stack

- HTML5 Canvas — document rendering & PNG export
- Vanilla JS — zero dependencies
- CSS3 — dark UI theme

---

_Built for FiveM roleplay use. All agencies, names and badge numbers are fictional._
