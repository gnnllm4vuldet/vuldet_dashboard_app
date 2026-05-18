# VulnDetect — Vulnerability Detection Model Comparison Dashboard

Angular 17 dashboard for comparing GNN vs. LLM vulnerability detection results.

## Stack
- **Angular 17** (standalone components)
- **@ngx-translate/core** — EN / DE / HU i18n
- **IBM Plex Sans + IBM Plex Mono** — typography
- **Pure SVG** Venn diagram (no D3 dependency)

---

## Quick start

```bash
npm install
ng serve
```

Open http://localhost:4200

---

## Project structure

```
src/
├── app/
│   ├── components/
│   │   ├── topbar/          # Language switcher + method chips
│   │   ├── venn-diagram/    # Large interactive SVG Venn
│   │   ├── section-view/    # Replaces Venn on click; code LEFT + list RIGHT
│   │   ├── case-list/       # Right-side case table
│   │   └── code-detail/     # Left-side source code + model verdicts
│   ├── models/
│   │   └── vuln.models.ts   # TypeScript interfaces
│   ├── services/
│   │   └── data.service.ts  # HTTP JSON loader
│   ├── app.component.*      # Root: header row (logos + title + grant)
│   └── app.config.ts        # Bootstrap + translate providers
├── assets/
│   ├── data/
│   │   ├── cases.json       # All 300 cases grouped by Venn section
│   │   └── metrics.json     # F1/AUC/MCC/FP/FN per method + Venn meta
│   └── i18n/
│       ├── en.json          # English translations
│       ├── de.json          # German translations
│       └── hu.json          # Hungarian translations
└── styles.scss              # Global CSS variables + shared classes
```

---

## Adding your real data

### 1. Replace sample cases in `src/assets/data/cases.json`

Each Venn section key maps to an array of cases:

```json
{
  "gnn-only": [
    {
      "id": "XyVulDb_12",
      "gnn": 1, "gpt": 0, "claude": 0, "llama": 0,
      "groundTruth": 1,
      "language": "c",
      "cweId": "CWE-190",
      "description": "Integer overflow ...",
      "vulnerableLine": 1,
      "sourceCode": "void process(...) {\n    ...\n}"
    }
  ],
  "claude-only": [ ... ],
  "gpt-only": [ ... ],
  "llama-only": [ ... ],
  "gnn-claude": [ ... ],
  "claude-gpt": [ ... ],
  "gnn-gpt": [ ... ],
  "llama-intersect": [ ... ],
  "all-four": [ ... ],
  "all-wrong": [ ... ]
}
```

`vulnerableLine` is the 0-based line index to highlight in red (-1 = none).

### 2. Update metrics in `src/assets/data/metrics.json`

Fill in real accuracy / F1 / AUC / MCC / FP / FN values.

### 3. Add real logos

Replace the inline SVG placeholders in `app.component.html` with:

```html
<img src="assets/logos/mycompany.svg" alt="MYCOMPANY" class="logo-img">
<img src="assets/logos/yourcompany.svg" alt="YourCOMPANY" class="logo-img">
<img src="assets/logos/grant.svg" alt="Grant logo" class="grant-img">
```

Place the files in `src/assets/logos/`.

---

## Internationalisation

Language files: `src/assets/i18n/{en,de,hu}.json`

All UI strings are keyed. To add a new language (e.g. French):
1. Copy `en.json` → `fr.json` and translate values
2. Add `'fr'` to the `langs` array in `topbar.component.ts`

---

## Build for production

```bash
ng build --configuration production
```

Output in `dist/vuln-dashboard/`. Serve with any static file server.
