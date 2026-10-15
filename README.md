# Northline FP&A workspace

A Vite + vanilla JavaScript demo built around an interactive SpreadJS workbook.

The original application code is [MIT licensed](LICENSE). **SpreadJS is not open source: it is proprietary commercial software and requires a separate commercial license from MESCIUS.** This repository's MIT license does not grant rights to SpreadJS. See [third-party licensing](THIRD-PARTY-NOTICES.md).

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The normalized sample data is already included, so the app builds without raw exports. If you have the original API-style JSON exports locally in `QuickBooks/`, you can regenerate the data:

```sh
npm run prepare-data
```

To build and preview the static app:

```sh
npm run build
npm run preview
```

Use Node 20.19+ or 22.12+. SpreadJS packages are pinned to 19.2.4. To configure a runtime or trial license, copy `.env.example` to `.env.local`, set `VITE_SPREADJS_LICENSE_KEY`, and restart Vite. Without a key, SpreadJS displays its evaluation notice.

Start on Dashboard, select a row in Variance Analysis, and choose **View details**. Use **Edit assumptions** to jump to the related plan input or forecast week, then **Return to analysis** to see recalculated results. Green cells and analyst notes are editable; source data and formulas are protected. **Inspect model** shows the formulas. **Reset demo** restores the bundled assumptions and notes. Changes are held in memory for the current session.

The eight worksheets cover Dashboard, Executive Summary, Monthly Economics, Cash & Working Capital, Variance Analysis, Assumptions, Data, and Model. The browser is the presentation surface; there is no PDF workflow.

Dates are rebased to 2026. Source activity is incomplete; budgets, prior-year comparisons, COGS estimates, and forecasts are explicitly illustrative. Balance snapshots are independently rebased to September 30. Invoice 42 lacks $75 of source sales detail and is excluded from P&L activity. The Data sheet exposes mappings, original dates, coverage, reconciliation differences, and exclusions.

The source contains 116 included P&L lines, 25 open receivable/payable records, and a 13-week cash scenario. Generated data and its provenance are in `src/data/`. The modeled COGS adjustment defaults to 12% of revenue and affects displayed Actual profit; set it to zero in Assumptions to remove it. The importer uses sample-specific account mappings and reporting periods, so other QuickBooks exports require adaptation.

## Publish with GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys `main`, and can also be run manually from Actions. It publishes only `dist/`. Raw exports, local reference material, ZIP archives, dependencies, build output, and local environment files are excluded from source control. The bundled normalized sample data is public in both the repository and the browser application.

1. In [repository Pages settings](https://github.com/banzor/quickbooks-fpna-spreadjs/settings/pages), set **Build and deployment → Source → GitHub Actions**.
2. In [Actions secrets](https://github.com/banzor/quickbooks-fpna-spreadjs/settings/secrets/actions), create a repository secret named **`SPREADJS_LICENSE_KEY`** containing a SpreadJS deployment key valid for **`banzor.github.io`** and the installed SpreadJS version.
3. Push to `main`, or run **Deploy to GitHub Pages** from Actions. A missing key stops deployment with a clear error. Changing a secret requires another deployment.

The site URL is [banzor.github.io/quickbooks-fpna-spreadjs/](https://banzor.github.io/quickbooks-fpna-spreadjs/). The workflow obtains the base path from GitHub Pages so scripts, styles, and the favicon work under the repository URL.

The GitHub secret is passed to Vite as `VITE_SPREADJS_LICENSE_KEY` only during the build. It is not committed to source control or printed by the workflow. **The deployed key is present in the browser JavaScript bundle.** A client-side SpreadJS deployment key cannot be kept secret from visitors; use the appropriate hostname-bound deployment key, never a MESCIUS account credential. See [Vite environment variables](https://vite.dev/guide/env-and-mode) and [MESCIUS deployment keys](https://developer.mescius.com/licensing/generate-distribution-key).

To preview the repository path locally:

```sh
PAGES_BASE_PATH=/quickbooks-fpna-spreadjs/ npm run build
PAGES_BASE_PATH=/quickbooks-fpna-spreadjs/ npm run preview
```

Open `http://127.0.0.1:4173/quickbooks-fpna-spreadjs/`.
