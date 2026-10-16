# Northline FP&A workspace

**[Open the live demo →](https://banzor.github.io/quickbooks-fpna-spreadjs/)**

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
