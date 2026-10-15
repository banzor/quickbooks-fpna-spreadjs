import data from '../data/normalized.json';
import assumptions from '../data/demo-assumptions.json';
import { base, text, column, precise, percent, colors } from './theme.js';

export { data, assumptions };
export const groupNames = { revenue: 'Revenue', directCosts: 'Direct costs', opex: 'Operating expenses', otherIncome: 'Other income', otherExpenses: 'Other expenses' };
export const groups = Object.keys(groupNames);
export const accountList = [...data.activeAccounts].sort((a,b) => groups.indexOf(a.group) - groups.indexOf(b.group) || a.fullName.localeCompare(b.fullName));
accountList.splice(accountList.findIndex(a => a.group === 'opex'), 0, { id: 'modeled-cogs', name: 'Modeled COGS adjustment', fullName: 'Modeled COGS adjustment', group: 'directCosts', origin: 'modeled' });
export const accountRow = id => 30 + accountList.findIndex(a => a.id === id);
export const inputRow = id => 16 + accountList.findIndex(a => a.id === id);
export const metrics = [
  { key: 'revenue', label: 'Revenue', row: 8 },
  { key: 'directCosts', label: 'Direct costs', row: 9, expense: true },
  { key: 'gross', label: 'Gross profit', row: 10 },
  { key: 'opex', label: 'Operating expenses', row: 11, expense: true },
  { key: 'operating', label: 'Operating result', row: 12 },
  { key: 'otherIncome', label: 'Other income', row: 13 },
  { key: 'otherExpenses', label: 'Other expenses', row: 14, expense: true },
  { key: 'net', label: 'Net result', row: 15 },
  { key: 'margin', label: 'Gross margin', row: 16, ratio: true }
];
export const mref = (key, col = 2) => `Model!${column(col)}${metrics.find(m => m.key === key).row + 1}`;
export const cashStart = 120;
export const weekInputStart = 54;
export const sourceAt = (id, month) => (data.monthly.find(m => m.accountId === id && m.period === `2026-${String(month).padStart(2, '0')}`)?.amountCents || 0) / 100;
export function buildModel(sheet) {
  base(sheet, { technical: true, rows: 210, cols: 64 });
  sheet.setColumnWidth(0, 290);
  sheet.setColumnWidth(1, 150);
  text(sheet, 0, 0, 1, 16, 'Shared financial model · select a cell to inspect its formula', { font: 'bold 16px Arial' });
  sheet.setValue(2, 0, 'Selected month'); sheet.setValue(2, 1, 9);
  sheet.setValue(3, 0, 'Comparator 0 Plan / 1 Prior month / 2 Illustrative PY'); sheet.setValue(3, 1, 0);
  sheet.setArray(6, 0, [['Metric / account', 'Group', 'Actual', 'Plan', 'Prior month', 'Illustrative PY', 'Comparator', 'Δ amount', 'Δ %', 'YTD actual', 'YTD plan', 'Prior YTD', 'Illustrative PY YTD', 'YTD comparator', 'YTD Δ', 'YTD Δ %']]);
  sheet.getRange(6, 0, 1, 16).backColor(colors.navy).foreColor('#ffffff');
  sheet.getRange(7, 2, 190, 62).formatter(precise);
  for (const account of accountList) {
    const r = accountRow(account.id), n = r + 1, ir = inputRow(account.id) + 1;
    sheet.setValue(r, 0, account.fullName); sheet.setValue(r, 1, account.group);
    const budget = assumptions.budgets.find(b => b.accountId === account.id);
    for (let month = 1; month <= 12; month++) {
      const hasCoverage = data.coverage[month - 1].lineCount > 0;
      const sourceCol = 25 + month, planCol = 38 + month, pyCol = 51 + month;
      if (account.id === 'modeled-cogs') {
        const revenueRefs = accountList.filter(a => a.group === 'revenue').map(a => `${column(sourceCol)}${accountRow(a.id) + 1}`).join(',');
        sheet.setFormula(r, sourceCol, hasCoverage ? `ROUND(SUM(${revenueRefs})*Assumptions!D8,2)` : '""');
        sheet.setFormula(r, planCol, hasCoverage ? `ROUND(${column(sourceCol)}9*Assumptions!D9*Assumptions!D7,2)` : '""');
        sheet.setFormula(r, pyCol, hasCoverage ? `ROUND(${column(sourceCol)}${n}/1.06,2)` : '""');
      } else {
        sheet.setValue(r, sourceCol, hasCoverage ? sourceAt(account.id, month) : null);
        sheet.setFormula(r, planCol, hasCoverage ? `ROUND(Assumptions!${column(month + 1)}${ir}*Assumptions!${account.group === 'revenue' || account.group === 'otherIncome' ? 'D6' : 'D7'},2)` : '""');
        sheet.setValue(r, pyCol, hasCoverage ? budget.illustrativePriorYearCents[month - 1] / 100 : null);
      }
    }
    sheet.setFormula(r, 2, `INDEX(AA${n}:AL${n},1,$B$3)`);
    sheet.setFormula(r, 3, `INDEX(AN${n}:AY${n},1,$B$3)`);
    sheet.setFormula(r, 4, `INDEX(AA${n}:AL${n},1,$B$3-1)`);
    sheet.setFormula(r, 5, `INDEX(BA${n}:BL${n},1,$B$3)`);
    sheet.setFormula(r, 9, `SUM(AA${n}:INDEX(AA${n}:AL${n},1,$B$3))`);
    sheet.setFormula(r, 10, `SUM(AN${n}:INDEX(AN${n}:AY${n},1,$B$3))`);
    sheet.setFormula(r, 11, `SUM(AA${n}:INDEX(AA${n}:AL${n},1,$B$3-1))`);
    sheet.setFormula(r, 12, `SUM(BA${n}:INDEX(BA${n}:BL${n},1,$B$3))`);
    comparisons(sheet, r);
  }
  for (const metric of metrics) {
    const r = metric.row, n = r + 1;
    sheet.setValue(r, 0, metric.label); sheet.setValue(r, 1, metric.key);
    for (const c of [2,3,4,5,9,10,11,12,...Array.from({length:12},(_,i)=>26+i)]) {
      const letter = column(c);
      let formula;
      if (groups.includes(metric.key)) formula = `SUM(${accountList.filter(a => a.group === metric.key).map(a => `${letter}${accountRow(a.id)+1}`).join(',') || '0'})`;
      else if (metric.key === 'gross') formula = `${letter}9-${letter}10`;
      else if (metric.key === 'operating') formula = `${letter}11-${letter}12`;
      else if (metric.key === 'net') formula = `${letter}13+${letter}14-${letter}15`;
      else formula = `IF(${letter}9=0,"",${letter}11/${letter}9)`;
      sheet.setFormula(r, c, metric.ratio ? formula : `ROUND(${formula},2)`);
    }
    comparisons(sheet, r);
    if (metric.ratio) {
      sheet.getRange(r, 2, 1, 14).formatter(percent);
      sheet.setFormula(r, 7, 'C17-G17');
      sheet.setFormula(r, 8, 'IF(OR(NOT(ISNUMBER(C17)),NOT(ISNUMBER(G17))),"",(C17-G17)*100)');
      sheet.getCell(r,8).formatter('0.0" pp"');
      sheet.setFormula(r, 14, 'J17-N17');
      sheet.setFormula(r, 15, 'IF(OR(NOT(ISNUMBER(J17)),NOT(ISNUMBER(N17))),"",(J17-N17)*100)');
      sheet.getCell(r,15).formatter('0.0" pp"');
    }
  }
  sheet.setArray(118, 0, [['Week', 'Week starting', 'Opening cash', 'New receipts', 'AR collections', 'New payments', 'AP payments', 'Total receipts', 'Total payments', 'Ending cash']]);
  for (let i = 0; i < 13; i++) {
    const r = cashStart + i, n = r + 1, a = weekInputStart + i + 1;
    sheet.setValue(r, 0, i + 1); sheet.setValue(r, 1, assumptions.weeks[i].startDate);
    sheet.setFormula(r, 2, i === 0 ? 'Assumptions!H6' : `J${n-1}`);
    sheet.setFormula(r, 3, `ROUND(Assumptions!C${a}*Assumptions!D6,2)`);
    sheet.setFormula(r, 4, `IF(AND(A${n}>Assumptions!H7,A${n}<=Assumptions!H7+4),IF(A${n}=Assumptions!H7+4,${data.snapshots.receivablesCents/100}-ROUND(${data.snapshots.receivablesCents/100}/4,2)*3,ROUND(${data.snapshots.receivablesCents/100}/4,2)),0)`);
    sheet.setFormula(r, 5, `ROUND(Assumptions!D${a}*Assumptions!D7,2)`);
    sheet.setFormula(r, 6, `IF(AND(A${n}>Assumptions!H8,A${n}<=Assumptions!H8+4),IF(A${n}=Assumptions!H8+4,${data.snapshots.payablesCents/100}-ROUND(${data.snapshots.payablesCents/100}/4,2)*3,ROUND(${data.snapshots.payablesCents/100}/4,2)),0)`);
    sheet.setFormula(r, 7, `D${n}+E${n}`); sheet.setFormula(r, 8, `F${n}+G${n}`); sheet.setFormula(r, 9, `ROUND(C${n}+H${n}-I${n},2)`);
  }
  sheet.setValue(137, 0, 'Cash low point'); sheet.setFormula(137, 2, 'MIN(J121:J133)');
  sheet.setValue(138, 0, 'Low point week'); sheet.setFormula(138, 2, 'MATCH(C138,J121:J133,0)');
  sheet.setValue(139, 0, 'Closing cash'); sheet.setFormula(139, 2, 'J133');
  sheet.setValue(140, 0, 'DSO estimate'); sheet.setFormula(140, 2, `IF(AI9>0,${data.snapshots.receivablesCents/100}/(AI9/30),"")`);
  sheet.setValue(141, 0, 'DPO estimate'); sheet.setFormula(141, 2, `IF(AI10>0,${data.snapshots.payablesCents/100}/(AI10/30),"")`);
  sheet.setValue(142, 0, 'Timing gap estimate'); sheet.setFormula(142, 2, 'IF(AND(ISNUMBER(C141),ISNUMBER(C142)),C141-C142,"")');
  for (let month = 1; month <= 9; month++) {
    const r = 159 + month, hasCoverage = data.coverage[month-1].lineCount > 0;
    sheet.setValue(r, 0, new Date(2026,month-1,1).toLocaleString('en-US',{month:'short'}));
    for (const [i,m] of metrics.slice(0,5).entries()) sheet.setFormula(r, i+1, hasCoverage ? `IF($B$3>=${month},${column(25+month)}${m.row+1},"")` : '""');
  }
  const bridge = [['Comparator','G13'],['Revenue','C9-G9'],['Direct costs','G10-C10'],['Operating costs','G12-C12'],['Actual','C13']];
  bridge.forEach(([label,formula],i)=>{sheet.setValue(180+i,0,label);sheet.setFormula(180+i,1,formula);});
  [['Revenue','H9'],['Direct costs','-H10'],['Operating expenses','-H12']].forEach(([label,formula],i)=>{
    const r=190+i,n=r+1;sheet.setValue(r,0,label);sheet.setFormula(r,1,formula);
    sheet.setFormula(r,3,`ABS(B${n})+ROW()/100000000`);
    sheet.setFormula(r,4,`MATCH(LARGE($D$191:$D$193,${i+1}),$D$191:$D$193,0)`);
    sheet.setFormula(r,5,`INDEX($A$191:$A$193,E${n})`);sheet.setFormula(r,6,`INDEX($B$191:$B$193,E${n})`);
  });
  sheet.frozenRowCount(7);
  sheet.frozenColumnCount(2);
}
function comparisons(sheet, r) {
  const n=r+1;
  sheet.setFormula(r,6,`CHOOSE($B$4+1,D${n},E${n},F${n})`);
  sheet.setFormula(r,7,`ROUND(C${n}-G${n},2)`);
  sheet.setFormula(r,8,`IF(G${n}=0,"",H${n}/ABS(G${n}))`);
  sheet.setFormula(r,13,`CHOOSE($B$4+1,K${n},L${n},M${n})`);
  sheet.setFormula(r,14,`ROUND(J${n}-N${n},2)`);
  sheet.setFormula(r,15,`IF(N${n}=0,"",O${n}/ABS(N${n}))`);
  sheet.getCell(r,8).formatter(percent); sheet.getCell(r,15).formatter(percent);
}
