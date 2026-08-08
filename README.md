# The Blowtorch Of Parma - Amateur Radio Club

A lightweight static website designed for GitHub Pages.

## Main idea

Normal site updates are handled in:

    content/site-data.js

You can update:

- Club news
- Events
- About text
- Quick information
- Document links
- Resource links
- Gallery captions
- Contact information

without changing the page structure.

## No frequency or callsign

The starter site intentionally contains no club frequency and no amateur radio callsign.

## GitHub Pages deployment

1. Create or open the GitHub repository for the site.
2. Upload everything inside this folder.
3. Open GitHub Settings > Pages.
4. Set:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
5. Save.

## Adding PDFs

Place PDF files in:

    documents/

Then edit content/site-data.js and change a library URL to something like:

    "documents/bylaws.pdf"

## Adding photos

Place photo files in:

    photos/

The starter currently uses placeholders. Real image support can be added next.

## Main files

- index.html - site structure
- content/site-data.js - normal content updates
- assets/css/style.css - appearance
- assets/js/app.js - dynamic content loader and mobile menu

## Solar Conditions page

`solar.html` loads current solar/space-weather indicators from NOAA SWPC.

## Weather page

`weather.html` loads current conditions and a four-day forecast for ZIP 44135 using Open-Meteo.
The page uses coordinates near the geographic center of ZIP 44135 and requires no API key.


## Version 3 - Operations Portal

Added:
- Live status strip on the home page
- Current 44135 weather dashboard
- Full Propagation Center
- NOAA SWPC solar indicators
- Estimated HF outlook for 160m through 6m
- Estimated VHF/UHF outlook including 2m and 70cm
- Seven-day weather page
- Dedicated Radio Tools page
- PSK Reporter, RBN, DXMaps, Tropo, POTA, SOTA and contest links

### Important propagation note
The site distinguishes live source measurements from derived band-condition estimates.
HF and VHF/UHF Good/Fair/Poor or enhancement labels are estimates and are not direct measurements of a path being open.
