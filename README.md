# Japan family trip 2026 — static pages

Standalone Traditional Chinese static HTML for the Nov–Dec 2026 family trip.
Source of truth after upload: this GitHub repo. Local Plan copy on the user’s machine may lag.

## Pages

| Path | Purpose |
|------|---------|
| `japan-trip-2026/japan-family-trip-2026.html` | Main itinerary (day-overview, floating place panels, elder UX) |
| `japan-trip-2026/japan-family-status-feedback-2026.html` | Family status + feedback (localStorage) |
| `japan-trip-2026/japan-trip-shopping-2026.html` | Shopping list with product images |

Required siblings (relative paths):

- `japan-trip-2026/fonts/` — self-hosted Noto Sans/Serif TC WOFF2 + mark-route.svg
- `japan-trip-2026/assets/` — original SVG atmosphere art
- `japan-trip-2026/shopping-images/` — product photos for the shopping page

## Local preview

```bash
git clone <this-repo-url>
cd <repo>
# Open files in a browser, or serve the folder:
python3 -m http.server 8080 --directory japan-trip-2026
# then visit http://localhost:8080/japan-family-trip-2026.html
```

Double-clicking the HTML also works if `fonts/` and `assets/` sit next to the file.

## Out of scope here

- TravelApp (Vite + Workers dashboard) is a separate repo: https://github.com/dryada95787/TravelApp
- Itinerary facts are owned by 日本旅遊助手; layout/IA by 靜態網頁
- Backup / pass / mock HTML files are not included

## Handoff

Maintenance after this upload: 模型調度 (Codex). Do not invent trip facts in DATA/DECIDE.
