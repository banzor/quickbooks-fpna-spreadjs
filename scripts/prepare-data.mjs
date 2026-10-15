import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../QuickBooks/', import.meta.url);
const output = new URL('../src/data/', import.meta.url);
const read = async name => JSON.parse(await readFile(new URL(`${name}.json`, root), 'utf8'));
const cents = value => Math.round(Number(value || 0) * 100);
const shift = value => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const target = year + 10;
  const last = new Date(Date.UTC(target, month, 0)).getUTCDate();
  return `${target}-${String(month).padStart(2, '0')}-${String(Math.min(day, last)).padStart(2, '0')}`;
};
const calendar = { period: '2026-09', preparedAt: '2026-10-14', snapshotDate: '2026-09-30', forecastStart: '2026-10-01', yearShift: 10 };
const originalAccounts = await read('Accounts');
const directIds = new Set(['28', '29', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '80']);
const group = a => directIds.has(a.Id) ? 'directCosts' : ({ Income: 'revenue', Expense: 'opex', 'Other Income': 'otherIncome', 'Other Expense': 'otherExpenses' }[a.AccountType] || a.Classification.toLowerCase());
const accounts = originalAccounts.map(a => ({ id: a.Id, name: a.Name, fullName: a.FullyQualifiedName, parentAccountId: a.ParentRef?.value || null, type: a.AccountType, group: group(a), balanceCents: cents(a.CurrentBalance) }));
const accountMap = new Map(accounts.map(a => [a.id, a]));
const items = (await read('Item')).map(i => ({ id: i.Id, name: i.Name, type: i.Type, incomeAccountId: i.IncomeAccountRef?.value, expenseAccountId: i.ExpenseAccountRef?.value, assetAccountId: i.AssetAccountRef?.value }));
const itemMap = new Map(items.map(i => [i.id, i]));
const customers = (await read('Customer')).map(c => ({ id: c.Id, name: c.DisplayName }));
const vendors = (await read('Vendor')).map(v => ({ id: v.Id, name: v.DisplayName }));
const lines = [];
const exclusions = [];
const documentChecks = [];
const sourceCounts = { Accounts: accounts.length, Item: items.length, Customer: customers.length, Vendor: vendors.length };
const pnlGroups = ['revenue', 'directCosts', 'opex', 'otherIncome', 'otherExpenses'];
for (const type of ['Invoice', 'SalesReceipt', 'CreditMemo', 'RefundReceipt', 'Bill', 'Purchase', 'JournalEntry']) {
  const docs = await read(type);
  sourceCounts[type] = docs.length;
  for (const doc of docs) {
    let detailCents = 0;
    for (const [index, line] of doc.Line.entries()) {
      const detail = line[line.DetailType] || {};
      const id = `${type}:${doc.Id}:${line.Id ?? `line-${index}`}`;
      if (line.DetailType === 'SubTotalLineDetail') {
        exclusions.push({ id, sourceFile: `${type}.json`, amountCents: cents(line.Amount), reason: doc.Line.some(l => l.DetailType !== 'SubTotalLineDetail') ? 'Subtotal duplicates detail lines' : 'Subtotal without source detail; linked statement charge is unavailable' });
        continue;
      }
      const item = itemMap.get(detail.ItemRef?.value);
      let accountId;
      let multiplier = ['CreditMemo', 'RefundReceipt'].includes(type) || doc.Credit ? -1 : 1;
      if (line.DetailType === 'SalesItemLineDetail') accountId = item?.incomeAccountId;
      if (line.DetailType === 'DiscountLineDetail') { accountId = detail.DiscountAccountRef?.value; multiplier *= -1; }
      if (line.DetailType === 'AccountBasedExpenseLineDetail' || line.DetailType === 'JournalEntryLineDetail') accountId = detail.AccountRef?.value;
      if (line.DetailType === 'ItemBasedExpenseLineDetail') accountId = item?.type === 'Inventory' ? item.assetAccountId || '81' : item?.expenseAccountId;
      const account = accountMap.get(accountId);
      if (line.DetailType === 'JournalEntryLineDetail') {
        const creditNormal = account && ['revenue', 'otherIncome', 'liability', 'equity'].includes(account.group);
        multiplier = (detail.PostingType === 'Credit') === creditNormal ? 1 : -1;
      }
      const linkedCredit = type === 'RefundReceipt' && (doc.LinkedTxn || []).some(t => t.TxnType === 'CreditMemo');
      const amountCents = cents(line.Amount) * multiplier;
      detailCents += cents(line.Amount) * (line.DetailType === 'DiscountLineDetail' ? -1 : 1);
      const included = Boolean(account && pnlGroups.includes(account.group) && !linkedCredit);
      lines.push({ id, sourceType: type, sourceId: doc.Id, sourceLineId: line.Id ?? `line-${index}`, sourceFile: `${type}.json`, documentNumber: doc.DocNumber || doc.Id, sourceDate: doc.TxnDate, sourceDueDate: doc.DueDate || null, demoDate: shift(doc.TxnDate), demoDueDate: shift(doc.DueDate), period: shift(doc.TxnDate).slice(0, 7), accountId: accountId || null, accountName: account?.fullName || 'Unmapped', parentAccountId: account?.parentAccountId || null, reportGroup: account?.group || 'unmapped', customerId: doc.CustomerRef?.value || detail.CustomerRef?.value || null, vendorId: doc.VendorRef?.value || doc.EntityRef?.value || null, party: doc.CustomerRef?.name || doc.VendorRef?.name || doc.EntityRef?.name || detail.CustomerRef?.name || '', itemId: item?.id || null, description: line.Description || item?.name || account?.name || line.DetailType, amountCents, included, origin: 'source', reason: linkedCredit ? 'Linked credit settlement excluded' : !account ? 'Missing account mapping' : included ? 'Mapped P&L activity' : 'Balance-sheet activity excluded from P&L', linkedTransactions: doc.LinkedTxn || [] });
    }
    if (doc.TxnTaxDetail?.TotalTax) exclusions.push({ id: `${type}:${doc.Id}:tax`, sourceFile: `${type}.json`, amountCents: cents(doc.TxnTaxDetail.TotalTax), reason: 'Sales tax excluded from revenue' });
    if (type !== 'JournalEntry') documentChecks.push({ id: `${type}:${doc.Id}`, detailCents, taxCents: cents(doc.TxnTaxDetail?.TotalTax), documentTotalCents: cents(doc.TotalAmt), differenceCents: cents(doc.TotalAmt) - detailCents - cents(doc.TxnTaxDetail?.TotalTax) });
  }
}
for (const type of ['Payment', 'BillPayment', 'Deposit', 'Estimate', 'PurchaseOrder', 'TimeActivity']) {
  const docs = await read(type);
  sourceCounts[type] = docs.length;
  for (const doc of docs) exclusions.push({ id: `${type}:${doc.Id}`, sourceFile: `${type}.json`, amountCents: cents(doc.TotalAmt), reason: ['Payment', 'BillPayment', 'Deposit'].includes(type) ? 'Settlement, not additional P&L activity' : 'Non-posting document' });
}
const flatten = (rows, bucket = '') => rows.flatMap(row => {
  const children = row.Rows ? flatten(row.Rows.Row || [], row.Header?.ColData?.[0]?.value || bucket) : [];
  return [...(row.type === 'Data' && row.ColData ? [{ columns: row.ColData, bucket }] : []), ...children];
});
const openItems = [];
const snapshotChecks = [];
for (const [kind, filename, summaryName] of [['receivable', 'Report-AgedReceivableDetail', 'Report-AgedReceivables'], ['payable', 'Report-AgedPayableDetail', 'Report-AgedPayable']]) {
  const report = await read(filename);
  const keys = report.Columns.Column.map(c => c.MetaData?.find(m => m.Name === 'ColKey')?.Value);
  for (const { columns, bucket } of flatten(report.Rows.Row)) {
    const field = key => columns[keys.indexOf(key)]?.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(field('tx_date'))) continue;
    const sourceDueDate = field('due_date');
    const demoDate = shift(field('tx_date'));
    const demoDueDate = shift(sourceDueDate);
    const daysPastDue = demoDueDate ? Math.floor((Date.parse(calendar.snapshotDate) - Date.parse(demoDueDate)) / 86400000) : null;
    const ageBucket = daysPastDue === null ? 'Unknown' : daysPastDue <= 0 ? 'Current' : daysPastDue <= 30 ? '1–30 days' : daysPastDue <= 60 ? '31–60 days' : daysPastDue <= 90 ? '61–90 days' : '91+ days';
    openItems.push({ id: `${kind}:${columns[1].id}`, kind, sourceFile: `${filename}.json`, sourceReportDate: report.Header.EndPeriod, demoAsOf: calendar.snapshotDate, sourceId: columns[1].id, sourceDate: field('tx_date'), demoDate, sourceDueDate, demoDueDate, party: field(kind === 'receivable' ? 'cust_name' : 'vend_name'), amountCents: cents(field(kind === 'receivable' ? 'subt_open_bal' : 'subt_neg_open_bal')), daysPastDue, ageBucket, sourceBucket: bucket, included: demoDate <= calendar.snapshotDate });
  }
  const summary = await read(summaryName);
  const totalRow = summary.Rows.Row.find(r => r.Summary?.ColData?.[0]?.value === 'TOTAL');
  const sourceTotalCents = cents(totalRow?.Summary.ColData.at(-1)?.value);
  const detailTotalCents = openItems.filter(i => i.kind === kind && i.included).reduce((n, i) => n + i.amountCents, 0);
  snapshotChecks.push({ kind, sourceTotalCents, detailTotalCents, differenceCents: sourceTotalCents - detailTotalCents });
}
const cashflow = await read('Report-Cashflow');
const cashRow = cashflow.Rows.Row.find(r => r.group === 'EndingCash');
const snapshots = { sourceDate: cashflow.Header.EndPeriod, demoDate: calendar.snapshotDate, cashCents: cents(cashRow.Summary.ColData[1].value), receivablesCents: snapshotChecks[0].detailTotalCents, payablesCents: snapshotChecks[1].detailTotalCents, origin: 'rebased snapshot assumption' };
const monthly = [];
for (const line of lines.filter(l => l.included)) {
  let entry = monthly.find(x => x.accountId === line.accountId && x.period === line.period);
  if (!entry) { entry = { accountId: line.accountId, period: line.period, amountCents: 0 }; monthly.push(entry); }
  entry.amountCents += line.amountCents;
}
const activeAccounts = accounts.filter(a => monthly.some(m => m.accountId === a.id));
const coverage = Array.from({ length: 12 }, (_, i) => {
  const period = `2026-${String(i + 1).padStart(2, '0')}`;
  const dates = lines.filter(l => l.period === period).map(l => l.demoDate).sort();
  return { period, status: dates.length ? 'Partial sample activity' : 'No source coverage', firstDate: dates[0] || null, lastDate: dates.at(-1) || null, lineCount: dates.length };
});
const budgetFactors = { revenue: 0.96, directCosts: 0.9, opex: 0.92, otherIncome: 1, otherExpenses: 1 };
const budgets = activeAccounts.map(a => ({ accountId: a.id, monthlyCents: Array.from({ length: 12 }, (_, m) => {
  const p = `2026-${String(m + 1).padStart(2, '0')}`;
  const source = monthly.find(x => x.accountId === a.id && x.period === p)?.amountCents || 0;
  return Math.round(source * budgetFactors[a.group]);
}), illustrativePriorYearCents: Array.from({ length: 12 }, (_, m) => Math.round((monthly.find(x => x.accountId === a.id && x.period === `2026-${String(m + 1).padStart(2, '0')}`)?.amountCents || 0) / (a.group === 'revenue' ? 1.12 : 1.06))) }));
const monthTotal = g => monthly.filter(m => m.period === calendar.period && accountMap.get(m.accountId).group === g).reduce((n, m) => n + m.amountCents, 0);
const weeklyReceipts = Math.round(monthTotal('revenue') / 30 * 7 * 0.8);
const weeklyPayments = Math.round((monthTotal('directCosts') + monthTotal('opex') + monthTotal('revenue') * 0.12) / 30 * 7);
const weeks = Array.from({ length: 13 }, (_, i) => ({ week: i + 1, startDate: new Date(Date.parse(calendar.forecastStart) + i * 7 * 86400000).toISOString().slice(0, 10), newReceiptsCents: Math.round(weeklyReceipts * (1 + (i % 3 - 1) * 0.04)), newPaymentsCents: Math.round(weeklyPayments * (1 + (i % 4 === 0 ? 0.06 : 0))) }));
const hashes = {};
for (const file of (await readdir(root)).filter(n => n.endsWith('.json')).sort()) hashes[file] = createHash('sha256').update(await readFile(new URL(file, root))).digest('hex');
const validation = { sourceCounts, sourceHashes: hashes, includedLineCount: lines.filter(l => l.included).length, excludedLineCount: lines.filter(l => !l.included).length, includedAmountCents: lines.filter(l => l.included).reduce((n,l) => n+l.amountCents,0), excludedAmountCents: lines.filter(l => !l.included).reduce((n,l) => n+l.amountCents,0), unmapped: lines.filter(l => !l.accountId), exclusions, documentChecks, snapshotChecks, notes: ['Source P&L has no financial values. Transaction-derived results are sample activity, not reconciled statements.', 'Source ledger contains opening balances only.', 'Invoice 42 has a $75 subtotal but no sales detail; the linked StatementCharge is not supplied. Excluded from P&L and recorded as a document reconciliation difference.', 'Inventory purchases are assets. Modeled COGS is a separate editable assumption.', '2019 snapshots are independently rebased to September 30, 2026 and are not reconciled to 2016 transactions.', 'January–April and November–December have no P&L coverage. YTD contains available sample activity only.', 'Credit memo 73 and refund receipt 66 refer to different customers and have no shared credit-settlement link.'] };
const normalized = { company: { name: 'Northline Landscaping', sourceName: (await read('CompanyInfo'))[0].CompanyName, currency: 'USD' }, calendar, accounts, activeAccounts, items, customers, vendors, lines, monthly, openItems, snapshots, coverage };
const assumptions = { calendar, budgets, revenueFactor: 1, costFactor: 1, modeledCogsRate: 0.12, planCogsRate: 0.1, openingCashCents: snapshots.cashCents, collectionDelayWeeks: 0, paymentDelayWeeks: 0, weeks, notes: { lead: 'September in focus: review the largest cost variances and collection timing before setting next month’s plan.', result: 'Job materials and operating costs are the main levers in this sample. Expand an account group to trace its source activity.', cashRisk: 'Opening balances are rebased snapshots. Try delaying collections by two weeks to see the effect on the cash low point.', followUp: 'Review overdue customer balances, then adjust the weekly receipts and payment schedule with the operations team.' } };
await mkdir(output, { recursive: true });
for (const [name, data] of Object.entries({ normalized, 'demo-assumptions': assumptions, 'validation-summary': validation })) await writeFile(new URL(`${name}.json`, output), `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ accounts: activeAccounts.length, lines: lines.length, included: validation.includedLineCount, unmapped: validation.unmapped.length, openItems: openItems.length, snapshotChecks, documentDifferences: documentChecks.filter(c => c.differenceCents !== 0) }, null, 2));
